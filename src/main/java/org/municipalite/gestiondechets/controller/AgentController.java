package org.municipalite.gestiondechets.controller;

import org.municipalite.gestiondechets.model.Employe;
import org.municipalite.gestiondechets.model.Tournee;
import org.municipalite.gestiondechets.repository.EmployeRepository;
import org.municipalite.gestiondechets.repository.TourneeRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/api/agent")
@PreAuthorize("hasRole('AGENT')")
public class AgentController {
    private final EmployeRepository employeRepository;
    private final TourneeRepository tourneeRepository;

    public AgentController(EmployeRepository employeRepository, TourneeRepository tourneeRepository) {
        this.employeRepository = employeRepository;
        this.tourneeRepository = tourneeRepository;
    }

    @GetMapping("/mes-tournees")
    public List<Tournee> getMesTournees(Authentication authentication) {
        Employe employe = employeRepository.findByUsername(authentication.getName())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Compte employé introuvable"));
        return tourneeRepository.findByEmploye(employe);
    }
}
