package org.municipalite.gestiondechets.service;

import lombok.extern.slf4j.Slf4j;
import org.municipalite.gestiondechets.model.Tournee;
import org.municipalite.gestiondechets.model.Vehicule;
import org.municipalite.gestiondechets.repository.TourneeRepository;
import org.municipalite.gestiondechets.repository.VehiculeRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Service
public class AutoLiberationService {

    @Autowired
    private TourneeRepository tourneeRepository;

    @Autowired
    private VehiculeRepository vehiculeRepository;

    /**
     * Toutes les minutes, passe en TERMINÉE les tournées dont l'heure de fin estimée
     * est dépassée, et remet leur véhicule à disposition.
     */
    @Scheduled(fixedRate = 60000)
    public void libererVehiculesTourneesTerminees() {
        List<Tournee> tournees = tourneeRepository.findByStatus("PLANIFIÉE");

        int vehiculesLiberes = 0;

        for (Tournee tournee : tournees) {
            if (tournee.getVehicule() != null &&
                    tournee.getDateHeureFinEstimee() != null &&
                    LocalDateTime.now().isAfter(tournee.getDateHeureFinEstimee())) {

                tournee.setStatus("TERMINÉE");
                tourneeRepository.save(tournee);

                Vehicule vehicule = tournee.getVehicule();
                vehicule.setDisponible(true);
                vehiculeRepository.save(vehicule);

                vehiculesLiberes++;
                log.info("Tournée {} terminée, véhicule {} libéré", tournee.get_id(), vehicule.getMatricule());
            }
        }

        if (vehiculesLiberes > 0) {
            log.info("{} véhicule(s) libéré(s) automatiquement", vehiculesLiberes);
        }
    }

    /**
     * Filet de sécurité toutes les cinq minutes : un véhicule marqué indisponible
     * sans aucune tournée planifiée est débloqué.
     */
    @Scheduled(fixedRate = 300000)
    public void libererVehiculesBloques() {
        List<Vehicule> vehiculesBloques = vehiculeRepository.findByDisponibleFalse();

        for (Vehicule vehicule : vehiculesBloques) {
            List<Tournee> tourneesVehicule = tourneeRepository.findByVehiculeAndStatus(vehicule, "PLANIFIÉE");

            if (tourneesVehicule.isEmpty()) {
                vehicule.setDisponible(true);
                vehiculeRepository.save(vehicule);
                log.warn("Véhicule {} débloqué : aucune tournée planifiée ne le retenait", vehicule.getMatricule());
            }
        }
    }
}
