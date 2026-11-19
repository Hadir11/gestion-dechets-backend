package org.municipalite.gestiondechets.service;

import org.municipalite.gestiondechets.algorithmes.*;
import org.municipalite.gestiondechets.model.*;
import org.municipalite.gestiondechets.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import lombok.extern.slf4j.Slf4j;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
public class OptimisationTourneeService {

    @Autowired private PointCollecteRepository pointCollecteRepo;
    @Autowired private VehiculeRepository vehiculeRepo;
    @Autowired private TourneeRepository tourneeRepo;
    @Autowired private EmployeRepository employeRepo;

    public List<Tournee> genererTourneesOptimisees() {
        // 1. Récupérer tous les points critiques (> 70%)
        List<PointCollecte> pointsCritiques = pointCollecteRepo
                .findByNiveauRemplissageGreaterThan(70);

        if (pointsCritiques.isEmpty()) {
            return List.of();
        }

        // 2. Récupérer véhicule disponible
        Vehicule vehicule = vehiculeRepo.findByDisponibleTrue()
                .stream()
                .findFirst()
                .orElseThrow(() -> new RuntimeException("Aucun véhicule disponible"));

        // 3. Appliquer l'algorithme DIJKSTRA
        List<PointCollecte> cheminOptimise = appliquerDijkstra(pointsCritiques, vehicule);

        // 4. Créer la tournée
        Tournee tournee = creerTournee(vehicule, cheminOptimise);

        log.info("Tournée générée : {} points, {} km, {} min, fin estimée {}",
                cheminOptimise.size(), tournee.getDistanceEstimee(),
                tournee.getDureeEstimee(), tournee.getHeureFinEstimee());

        return Arrays.asList(tournee);
    }

    private List<PointCollecte> appliquerDijkstra(List<PointCollecte> points, Vehicule vehicule) {
        // 1. Construire le graphe
        Graphe graphe = new Graphe();

        // Ajouter le dépôt (position du véhicule)
        String depotId = "DEPOT_" + vehicule.get_id();
        graphe.ajouterNoeud(depotId);

        // Ajouter tous les points
        for (PointCollecte p : points) {
            graphe.ajouterNoeud(p.get_id());

            // Lier chaque point au dépôt
            double distance = calculerDistance(
                    vehicule.getLatitude(), vehicule.getLongitude(),
                    p.getLatitude(), p.getLongitude()
            );
            graphe.ajouterArete(depotId, p.get_id(), distance);
        }

        // Lier les points entre eux
        for (int i = 0; i < points.size(); i++) {
            for (int j = i + 1; j < points.size(); j++) {
                PointCollecte p1 = points.get(i);
                PointCollecte p2 = points.get(j);
                double distance = calculerDistance(
                        p1.getLatitude(), p1.getLongitude(),
                        p2.getLatitude(), p2.getLongitude()
                );
                graphe.ajouterArete(p1.get_id(), p2.get_id(), distance);
            }
        }

        // 2. Appliquer Dijkstra pour trouver le chemin optimal
        return trouverCheminOptimalDijkstra(graphe, depotId, points);
    }

    private List<PointCollecte> trouverCheminOptimalDijkstra(Graphe graphe, String depotId,
                                                             List<PointCollecte> points) {
        if (points.isEmpty()) return new ArrayList<>();

        List<PointCollecte> chemin = new ArrayList<>();
        Set<String> visites = new HashSet<>();

        // Point de départ: le plus rempli
        PointCollecte courant = points.stream()
                .max(Comparator.comparingInt(PointCollecte::getNiveauRemplissage))
                .orElse(points.get(0));


        // Calculer chemin du dépôt au premier point
        ResultatDijkstra resultat = Dijkstra.calculerCheminPlusCourt(
                graphe, depotId, courant.get_id()
        );

        if (resultat.cheminTrouve()) {
            log.debug("Distance dépôt → premier point : {} km",
                    String.format("%.2f", resultat.getDistanceTotale()));
        }

        chemin.add(courant);
        visites.add(courant.get_id());

        // Continuer avec l'algorithme du plus proche voisin
        while (visites.size() < Math.min(points.size(), 8)) { // Max 8 points
            PointCollecte suivant = trouverPlusProche(courant, points, visites);
            if (suivant == null) break;

            chemin.add(suivant);
            visites.add(suivant.get_id());
            courant = suivant;

        }

        return chemin;
    }

    private PointCollecte trouverPlusProche(PointCollecte reference,
                                            List<PointCollecte> points,
                                            Set<String> visites) {
        PointCollecte plusProche = null;
        double distanceMin = Double.MAX_VALUE;

        for (PointCollecte p : points) {
            if (visites.contains(p.get_id())) continue;

            double distance = calculerDistance(
                    reference.getLatitude(), reference.getLongitude(),
                    p.getLatitude(), p.getLongitude()
            );

            if (distance < distanceMin) {
                distanceMin = distance;
                plusProche = p;
            }
        }

        return plusProche;
    }

    private Tournee creerTournee(Vehicule vehicule, List<PointCollecte> points) {
        // Calculer statistiques
        double distance = calculerDistanceTotale(points, vehicule);
        int duree = estimerDuree(points.size(), distance);

        // Calculer les heures
        LocalTime heureDepart = LocalTime.now();
        LocalTime heureFinEstimee = heureDepart.plusMinutes(duree);
        LocalDateTime dateHeureFinEstimee = LocalDateTime.of(LocalDate.now(), heureFinEstimee);

        // N'affecter qu'un agent de collecte réellement disponible.
        Employe employe = employeRepo.findByDisponibleTrue()
                .stream()
                .filter(candidate -> candidate.isEnabled()
                        && candidate.getAuthorities().stream().anyMatch(authority -> "ROLE_AGENT".equals(authority.getAuthority())))
                .findFirst()
                .orElseThrow(() -> new IllegalStateException("Aucun agent de collecte disponible"));

        // Créer la tournée AVEC les heures de fin
        Tournee tournee = Tournee.builder()
                .date(LocalDate.now())
                .heureDepart(heureDepart)
                .heureFinEstimee(heureFinEstimee)  // AJOUTÉ
                .dateHeureFinEstimee(dateHeureFinEstimee)  // AJOUTÉ
                .vehicule(vehicule)
                .employe(employe)
                .pointsCollecte(points)
                .status("PLANIFIÉE")
                .dureeEstimee(duree)
                .distanceEstimee(Math.round(distance * 100.0) / 100.0)
                .build();

        // Mettre à jour le véhicule (indisponible temporairement)
        vehicule.setDisponible(false);
        vehiculeRepo.save(vehicule);


        return tourneeRepo.save(tournee);
    }

    private double calculerDistance(double lat1, double lon1, double lat2, double lon2) {
        // Formule de Haversine
        final int R = 6371; // Rayon terrestre en km

        double latDistance = Math.toRadians(lat2 - lat1);
        double lonDistance = Math.toRadians(lon2 - lon1);

        double a = Math.sin(latDistance / 2) * Math.sin(latDistance / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(lonDistance / 2) * Math.sin(lonDistance / 2);

        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        return R * c;
    }

    private double calculerDistanceTotale(List<PointCollecte> points, Vehicule vehicule) {
        if (points.isEmpty()) return 0.0;

        double total = 0.0;

        // Distance dépôt → premier point
        total += calculerDistance(
                vehicule.getLatitude(), vehicule.getLongitude(),
                points.get(0).getLatitude(), points.get(0).getLongitude()
        );

        // Distances entre points
        for (int i = 0; i < points.size() - 1; i++) {
            total += calculerDistance(
                    points.get(i).getLatitude(), points.get(i).getLongitude(),
                    points.get(i+1).getLatitude(), points.get(i+1).getLongitude()
            );
        }

        // Retour au dépôt
        total += calculerDistance(
                points.get(points.size() - 1).getLatitude(),
                points.get(points.size() - 1).getLongitude(),
                vehicule.getLatitude(), vehicule.getLongitude()
        );

        return total;
    }

    private int estimerDuree(int nbPoints, double distance) {
        // Estimation réaliste
        return nbPoints * 10 + (int)(distance * 15); // 10min/point + 15min/km
    }

    // Méthode utilitaire pour calculer les statistiques
    public Map<String, Object> calculerStatistiques(Tournee tournee) {
        Map<String, Object> stats = new HashMap<>();

        int nbPoints = tournee.getPointsCollecte() != null ?
                tournee.getPointsCollecte().size() : 0;
        double distance = tournee.getDistanceEstimee();

        // Ces valeurs décrivent des estimations géométriques et opérationnelles, pas des économies mesurées.
        stats.put("pointsVisites", nbPoints);
        stats.put("distanceEstimeeKm", Math.round(distance * 100.0) / 100.0);
        stats.put("dureeEstimeeMinutes", tournee.getDureeEstimee());

        if (tournee.getHeureFinEstimee() != null) {
            stats.put("heureFinEstimee", tournee.getHeureFinEstimee().toString());
        }

        return stats;
    }
}
