// Dans AuthServiceImpl.java
package org.municipalite.gestiondechets.service.impl;

import org.municipalite.gestiondechets.model.Employe;
import org.municipalite.gestiondechets.repository.EmployeRepository;
import org.municipalite.gestiondechets.service.AuthService;
import org.municipalite.gestiondechets.service.CustomUserDetailsService;
import org.municipalite.gestiondechets.service.JwtService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class AuthServiceImpl implements AuthService {

    @Autowired
    private EmployeRepository employeRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private CustomUserDetailsService userDetailsService;

    @Override
    public String login(String username, String password) {
        if (username == null || username.isBlank() || password == null || password.isBlank()) {
            throw new IllegalArgumentException("Nom d'utilisateur et mot de passe requis");
        }
        var userDetails = userDetailsService.loadUserByUsername(username);

        if (!passwordEncoder.matches(password, userDetails.getPassword())) {
            throw new RuntimeException("Mot de passe incorrect");
        }

        if (!userDetails.isEnabled()) {
            throw new RuntimeException("Compte désactivé");
        }

        // Récupère l'employé pour générer le token
        Employe employe = getEmployeByUsername(username);
        return jwtService.generateToken(employe);
    }

    @Override
    public Employe register(Employe employe) {
        if (employe == null || employe.getUsername() == null || employe.getUsername().isBlank()
                || employe.getPassword() == null || employe.getPassword().length() < 12
                || employe.getNom() == null || employe.getNom().isBlank()
                || employe.getPrenom() == null || employe.getPrenom().isBlank()) {
            throw new IllegalArgumentException("Nom, prénom, identifiant et mot de passe (12 caractères minimum) requis");
        }
        employe.setUsername(employe.getUsername().trim());
        employe.setRoleCode(normalizeRole(employe.getRoleCode(), employe.getRole()));
        if (employe.getRoleCode().isBlank()) {
            throw new IllegalArgumentException("Rôle invalide");
        }
        Optional<Employe> existingByUsername = employeRepository.findByUsername(employe.getUsername());
        if (existingByUsername.isPresent()) {
            throw new IllegalArgumentException("Nom d'utilisateur déjà existant");
        }
        if (employe.getEmail() != null && !employe.getEmail().isBlank()
                && employeRepository.findByEmailIgnoreCase(employe.getEmail().trim()).isPresent()) {
            throw new IllegalArgumentException("Adresse e-mail déjà utilisée");
        }
        employe.setEmail(employe.getEmail() == null ? null : employe.getEmail().trim().toLowerCase());

        employe.setPassword(passwordEncoder.encode(employe.getPassword()));
        employe.setEnabled(true);
        return employeRepository.save(employe);
    }

    @Override
    public Employe registerByAdmin(Employe employe) {
        return register(employe);  // Même logique
    }

    @Override
    public Employe bootstrapAdmin(Employe employe) {
        if (employeRepository.countByRoleCode("ADMIN") > 0) {
            throw new IllegalStateException("Un compte administrateur existe déjà");
        }
        employe.setRole("Administrateur");
        employe.setRoleCode("ADMIN");
        return register(employe);
    }

    private String normalizeRole(String roleCode, String displayRole) {
        String role = roleCode == null || roleCode.isBlank() ? displayRole : roleCode;
        if (role == null) return "";
        role = role.trim().toUpperCase().replace('-', '_').replace(' ', '_');
        if (role.startsWith("ROLE_")) role = role.substring(5);
        return switch (role) {
            case "AGENT_COLLECTE" -> "AGENT";
            case "CHEF" -> "CHEF_EQUIPE";
            case "ADMINISTRATEUR" -> "ADMIN";
            case "TECHNICIEN", "CENTRE_TECHNIQUE" -> "TECH";
            case "AGENT_TRI" -> "RESPONSABLE_RECYCLAGE";
            case "ADMIN", "CHEF_EQUIPE", "AGENT", "TECH", "RESPONSABLE_RECYCLAGE" -> role;
            default -> "";
        };
    }

    @Override
    public Employe getEmployeByUsername(String username) {
        return employeRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Employé non trouvé: " + username));
    }
}
