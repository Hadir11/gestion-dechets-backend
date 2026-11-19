package org.municipalite.gestiondechets.controller;

import org.municipalite.gestiondechets.model.Alerte;
import org.municipalite.gestiondechets.model.PointCollecte;
import org.municipalite.gestiondechets.service.impl.AlerteService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
@RestController
@RequestMapping("/api/alertes")
public class AlerteController {

    @Autowired
    private AlerteService alerteService;

    // 🔴 NOUVELLE ROUTE : Créer une alerte
    @PostMapping
    public ResponseEntity<Alerte> createAlerte(@RequestBody CreateAlerteRequest request) {
        try {
            Alerte alerte = alerteService.createAlerte(
                    request.getPointCollecteId(),
                    request.getTypeAlerte(),
                    request.getMessage(),
                    request.getNiveauRemplissage()
            );
            return ResponseEntity.status(org.springframework.http.HttpStatus.CREATED).body(alerte);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(null);
        }
    }

    // 1️⃣ Liste alertes urgentes
    @GetMapping("/urgentes")
    public List<Alerte> getAlertesUrgentes() {
        return alerteService.getAlertesUrgentes();
    }

    // 2️⃣ Traiter une alerte (assigner équipe / envoyer instruction)
    @PostMapping("/{id}/traiter")
    public Alerte traiterAlerte(@PathVariable String id) {
        return alerteService.traiterAlerte(id);
    }

    // 3️⃣ Escalader une alerte
    @PostMapping("/{id}/escalader")
    public Alerte escaladerAlerte(@PathVariable String id) {
        return alerteService.escaladerAlerte(id);
    }

    @PostMapping("/{id}/ignorer")
    public Alerte ignorerAlerte(@PathVariable String id) {
        return alerteService.ignorerAlerte(id);
    }

    @PostMapping("/{id}/assigner-equipe")
    public Alerte assignerEquipe(@PathVariable String id, @RequestParam String equipe) {
        return alerteService.assignerEquipe(id, equipe);
    }

    @PostMapping("/{id}/envoyer-instruction")
    public Alerte envoyerInstruction(@PathVariable String id, @RequestBody String instruction) {
        return alerteService.envoyerInstruction(id, instruction);
    }

    @PostMapping("/{id}/replanifier-tournee")
    public Alerte replanifierTournee(@PathVariable String id, @RequestParam String nouvelleDate) {
        return alerteService.replanifierTournee(id, nouvelleDate);
    }

    // Classe interne pour la requête de création
    public static class CreateAlerteRequest {
        private String pointCollecteId;
        private String typeAlerte;
        private String message;
        private int niveauRemplissage;

        // Getters et Setters
        public String getPointCollecteId() { return pointCollecteId; }
        public void setPointCollecteId(String pointCollecteId) { this.pointCollecteId = pointCollecteId; }

        public String getTypeAlerte() { return typeAlerte; }
        public void setTypeAlerte(String typeAlerte) { this.typeAlerte = typeAlerte; }

        public String getMessage() { return message; }
        public void setMessage(String message) { this.message = message; }

        public int getNiveauRemplissage() { return niveauRemplissage; }
        public void setNiveauRemplissage(int niveauRemplissage) { this.niveauRemplissage = niveauRemplissage; }
    }
}