package org.municipalite.gestiondechets.config;

import org.municipalite.gestiondechets.model.Alerte;
import org.municipalite.gestiondechets.model.Employe;
import org.municipalite.gestiondechets.model.Equipe;
import org.municipalite.gestiondechets.model.PointCollecte;
import org.municipalite.gestiondechets.model.Tournee;
import org.municipalite.gestiondechets.model.Vehicule;
import org.municipalite.gestiondechets.model.Zone;
import org.municipalite.gestiondechets.repository.AlerteRepository;
import org.municipalite.gestiondechets.repository.EmployeRepository;
import org.municipalite.gestiondechets.repository.EquipeRepository;
import org.municipalite.gestiondechets.repository.PointCollecteRepository;
import org.municipalite.gestiondechets.repository.TourneeRepository;
import org.municipalite.gestiondechets.repository.VehiculeRepository;
import org.municipalite.gestiondechets.repository.ZoneRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

/**
 * Jeu de données de démonstration, chargé uniquement avec le profil {@code demo}.
 * Sans lui, un clone neuf démarre avec des tableaux de bord vides et une optimisation
 * qui répond « aucun point critique » : impossible de juger l'application.
 *
 * Le seed est idempotent : il ne fait rien si des employés existent déjà.
 * Les comptes créés utilisent tous le mot de passe {@code admin123} (démonstration locale).
 */
@Component
@Profile("demo")
public class DemoDataSeeder implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DemoDataSeeder.class);
    private static final String DEMO_PASSWORD = "admin123";

    private final EmployeRepository employeRepository;
    private final ZoneRepository zoneRepository;
    private final PointCollecteRepository pointCollecteRepository;
    private final VehiculeRepository vehiculeRepository;
    private final EquipeRepository equipeRepository;
    private final AlerteRepository alerteRepository;
    private final TourneeRepository tourneeRepository;
    private final PasswordEncoder passwordEncoder;

    public DemoDataSeeder(EmployeRepository employeRepository,
                          ZoneRepository zoneRepository,
                          PointCollecteRepository pointCollecteRepository,
                          VehiculeRepository vehiculeRepository,
                          EquipeRepository equipeRepository,
                          AlerteRepository alerteRepository,
                          TourneeRepository tourneeRepository,
                          PasswordEncoder passwordEncoder) {
        this.employeRepository = employeRepository;
        this.zoneRepository = zoneRepository;
        this.pointCollecteRepository = pointCollecteRepository;
        this.vehiculeRepository = vehiculeRepository;
        this.equipeRepository = equipeRepository;
        this.alerteRepository = alerteRepository;
        this.tourneeRepository = tourneeRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
        if (employeRepository.count() > 0) {
            log.info("Données de démonstration déjà présentes : seed ignoré");
            return;
        }

        Zone centre = zoneRepository.save(new Zone(null, "Centre-ville", "CTR",
                "Quartiers historiques et zone piétonne"));
        Zone nord = zoneRepository.save(new Zone(null, "Zone Nord", "NRD",
                "Boulevards et quartiers résidentiels"));
        Zone sud = zoneRepository.save(new Zone(null, "Zone Sud", "SUD",
                "Zone industrielle et périphérie"));

        List<PointCollecte> points = pointCollecteRepository.saveAll(List.of(
                point("12 avenue Habib Bourguiba", 36.8008, 10.1815, 92, "ORGANIQUE", 1200, "Actif"),
                point("Place de la République", 36.8065, 10.1815, 85, "PLASTIQUE", 900, "Actif"),
                point("24 rue de Marseille", 36.8019, 10.1731, 78, "VERRE", 600, "Actif"),
                point("5 rue du Niger", 36.8090, 10.1750, 45, "PAPIER", 750, "Actif"),
                point("31 avenue de Carthage", 36.8120, 10.1790, 30, "ORGANIQUE", 1000, "Actif"),
                point("8 rue Ibn Khaldoun", 36.7950, 10.1770, 88, "PLASTIQUE", 800, "Actif"),
                point("Zone industrielle Sud, lot 12", 36.7850, 10.1900, 72, "PLASTIQUE", 1500, "Actif"),
                point("60 rue de Rome", 36.8035, 10.1830, 25, "VERRE", 500, "Inactif")));

        Vehicule camion = vehiculeRepository.save(vehicule("Camion benne", "DEMO-001", 5000, 32800, true));
        vehiculeRepository.save(vehicule("Benne compacte", "DEMO-002", 3000, 18400, true));
        vehiculeRepository.save(vehicule("Camion recycleur", "DEMO-003", 4000, 41200, false));

        String hash = passwordEncoder.encode(DEMO_PASSWORD);

        Employe admin = employeRepository.save(employe("Ben Ali", "Amine", "Administrateur", "ADMIN",
                "admin", "admin@ville-demo.tn", "71000001", centre, hash));
        Employe chef = employeRepository.save(employe("Khelifi", "Sonia", "Chef d'équipe", "CHEF_EQUIPE",
                "chef", "sonia.khelifi@ville-demo.tn", "71000002", centre, hash));
        Employe agent = employeRepository.save(employe("Trabelsi", "Mehdi", "Agent de collecte", "AGENT",
                "agent", "mehdi.trabelsi@ville-demo.tn", "71000003", centre, hash));
        Employe agent2 = employeRepository.save(employe("Mansour", "Ines", "Agent de collecte", "AGENT",
                "agent2", "ines.mansour@ville-demo.tn", "71000004", centre, hash));
        employeRepository.save(employe("Gharbi", "Youssef", "Agent de collecte", "AGENT",
                "agent3", "youssef.gharbi@ville-demo.tn", "71000005", nord, hash));
        employeRepository.save(employe("Saidi", "Nour", "Agent de collecte", "AGENT",
                "agent4", "nour.saidi@ville-demo.tn", "71000006", sud, hash));

        equipeRepository.save(Equipe.builder()
                .Nom("Équipe Centre")
                .chefEquipe(chef)
                .membres(List.of(agent, agent2))
                .agents(List.of(agent, agent2))
                .specialite("Collecte")
                .statut("Active")
                .build());

        // Les types reprennent les libellés attendus par getAlertesUrgentes(), sinon
        // les alertes de démonstration n'apparaîtraient pas sur le tableau de bord.
        alerteRepository.saveAll(List.of(
                alerte(points.get(0), 92, "Conteneur rempli à 100%", "Conteneur plein depuis deux jours", false),
                alerte(points.get(1), 85, "Surcharge zone", "Débordement signalé par un riverain", false),
                alerte(points.get(5), 88, "Conteneur endommagé", "Couvercle cassé", true)));

        // La tournée doit rester « planifiée » : la tâche d'auto-libération des véhicules
        // passe les tournées en TERMINÉE dès que leur heure de fin est dépassée, ce qui
        // viderait l'écran de l'agent quelques minutes après le démarrage.
        LocalDateTime depart = LocalDateTime.now().plusMinutes(30);
        LocalDateTime fin = depart.plusHours(2);

        tourneeRepository.save(Tournee.builder()
                .date(depart.toLocalDate())
                .heureDepart(depart.toLocalTime())
                .heureFinEstimee(fin.toLocalTime())
                .dateHeureFinEstimee(fin)
                .zone(centre)
                .status("PLANIFIÉE")
                .employe(agent)
                .vehicule(camion)
                .pointsCollecte(List.of(points.get(2), points.get(3)))
                .dureeEstimee(120)
                .distanceEstimee(11.4)
                .build());

        log.info("Jeu de démonstration chargé : {} zones, {} points, {} employés, {} alertes (mot de passe : {})",
                zoneRepository.count(), pointCollecteRepository.count(), employeRepository.count(),
                alerteRepository.count(), DEMO_PASSWORD);
    }

    private PointCollecte point(String adresse, double lat, double lng, int remplissage,
                                String type, int capacite, String etat) {
        return PointCollecte.builder()
                .adresse(adresse)
                .latitude(lat)
                .longitude(lng)
                .niveauRemplissage(remplissage)
                .type(type)
                .capaciteMax(capacite)
                .etat(etat)
                .build();
    }

    private Vehicule vehicule(String type, String matricule, int capacite, int kilometrage, boolean disponible) {
        return Vehicule.builder()
                .typeVehicule(type)
                .matricule(matricule)
                .capacite(capacite)
                .kilometrage(kilometrage)
                .dernierEntretien(LocalDate.now().minusMonths(2))
                .disponible(disponible)
                .latitude(36.8000)
                .longitude(10.1800)
                .build();
    }

    private Employe employe(String nom, String prenom, String role, String roleCode, String username,
                            String email, String telephone, Zone zone, String passwordHash) {
        return Employe.builder()
                .nom(nom)
                .prenom(prenom)
                .role(role)
                .roleCode(roleCode)
                .username(username)
                .email(email)
                .telephone(telephone)
                .zone(zone)
                .password(passwordHash)
                .disponible(true)
                .enabled(true)
                .build();
    }

    private Alerte alerte(PointCollecte point, int niveau, String type, String message, boolean traitee) {
        return Alerte.builder()
                .pointCollecte(point)
                .dateAlerte(LocalDateTime.now())
                .typeAlerte(type)
                .niveauRemplissage(niveau)
                .message(message)
                .traitee(traitee)
                .build();
    }
}
