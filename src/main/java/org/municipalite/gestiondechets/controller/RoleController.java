package org.municipalite.gestiondechets.controller;

import org.springframework.security.core.Authentication;
import org.municipalite.gestiondechets.model.Employe;
import org.municipalite.gestiondechets.repository.EmployeRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;
@RestController
@RequestMapping("/api/role")
public class RoleController {

    @Autowired
    private EmployeRepository employeRepository;

    @GetMapping("/dashboard-info")
    public ResponseEntity<?> getDashboardInfo(Authentication authentication) {
        try {
            String username = authentication.getName();

            // CORRECTION ICI : Utilisez Optional
            Optional<Employe> userOptional = employeRepository.findByUsername(username);

            if (userOptional.isEmpty()) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "Utilisateur non trouvé: " + username));
            }

            Employe user = userOptional.get(); // Récupérez l'Employe de l'Optional

            // Informations communes
            Map<String, Object> response = new HashMap<>();
            response.put("user", Map.of(
                    "id", user.get_id(),
                    "nom", user.getNom(),
                    "prenom", user.getPrenom(),
                    "role", user.getRole(),
                    "email", user.getEmail(),
                    "telephone", user.getTelephone()
            ));
            response.put("timestamp", java.time.LocalDateTime.now().toString());

            // Ajouter des informations spécifiques au rôle
            String role = user.getRole();
            if (role != null) {
                switch (role) {
                    case "ADMIN":
                        response = addAdminInfo(response, user);
                        break;
                    case "CHEF_EQUIPE":
                        response = addChefEquipeInfo(response, user);
                        break;
                    case "AGENT_COLLECTE":
                        response = addAgentInfo(response, user);
                        break;
                    case "CENTRE_TECHNIQUE":
                        response = addTechInfo(response, user);
                        break;
                    case "RESPONSABLE_RECYCLAGE":
                        response = addRecyclageInfo(response, user);
                        break;
                    default:
                        response.put("dashboardType", "DEFAULT");
                        response.put("message", "Rôle non spécifique détecté");
                }
            }

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", e.getMessage()));
        }
    }

    private Map<String, Object> addAdminInfo(Map<String, Object> base, Employe user) {
        base.put("dashboardType", "ADMIN_GLOBAL");
        base.put("stats", Map.of(
                "totalEmployes", employeRepository.count(),
                "totalPointsCollecte", 156,
                "totalTournees", 42,
                "alertesActives", 7
        ));
        base.put("quickActions", Arrays.asList(
                Map.of("label", "Gérer les employés", "icon", "👥", "url", "/admin/employes"),
                Map.of("label", "Voir toutes les tournées", "icon", "📋", "url", "/admin/tournees"),
                Map.of("label", "Optimiser les tournées", "icon", "🚀", "url", "/optimisation"),
                Map.of("label", "Statistiques globales", "icon", "📊", "url", "/admin/stats")
        ));
        return base;
    }

    private Map<String, Object> addChefEquipeInfo(Map<String, Object> base, Employe user) {
        base.put("dashboardType", "CHEF_EQUIPE");
        base.put("quickActions", Arrays.asList(
                Map.of("label", "Voir mon équipe", "icon", "👨‍💼", "url", "/chef/equipe"),
                Map.of("label", "Mes tournées", "icon", "📅", "url", "/chef/tournees"),
                Map.of("label", "Points critiques", "icon", "🚨", "url", "/chef/points"),
                Map.of("label", "Affecter mission", "icon", "✅", "url", "/chef/affecter")
        ));
        return base;
    }

    private Map<String, Object> addAgentInfo(Map<String, Object> base, Employe user) {
        base.put("dashboardType", "AGENT_COLLECTE");
        base.put("quickActions", Arrays.asList(
                Map.of("label", "Mes missions", "icon", "✅", "url", "/agent/missions"),
                Map.of("label", "Rapporter incident", "icon", "⚠️", "url", "/agent/incident"),
                Map.of("label", "Statut journalier", "icon", "📝", "url", "/agent/statut"),
                Map.of("label", "Historique", "icon", "📋", "url", "/agent/historique")
        ));
        return base;
    }

    private Map<String, Object> addTechInfo(Map<String, Object> base, Employe user) {
        base.put("dashboardType", "CENTRE_TECHNIQUE");
        base.put("quickActions", Arrays.asList(
                Map.of("label", "Gérer véhicules", "icon", "🚚", "url", "/tech/vehicules"),
                Map.of("label", "Planifier maintenance", "icon", "🔧", "url", "/tech/maintenance"),
                Map.of("label", "Disponibilité", "icon", "📊", "url", "/tech/disponibilite"),
                Map.of("label", "Rapports techniques", "icon", "📋", "url", "/tech/rapports")
        ));
        return base;
    }

    private Map<String, Object> addRecyclageInfo(Map<String, Object> base, Employe user) {
        base.put("dashboardType", "RESPONSABLE_RECYCLAGE");
        base.put("quickActions", Arrays.asList(
                Map.of("label", "Rapports recyclage", "icon", "♻️", "url", "/recyclage/rapports"),
                Map.of("label", "Statistiques tri", "icon", "📈", "url", "/recyclage/stats"),
                Map.of("label", "Points de tri", "icon", "📍", "url", "/recyclage/points"),
                Map.of("label", "Performances", "icon", "📊", "url", "/recyclage/performances")
        ));
        return base;
    }
}