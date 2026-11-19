package org.municipalite.gestiondechets.service;

import org.municipalite.gestiondechets.model.Employe;
import org.municipalite.gestiondechets.repository.EmployeRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class CustomUserDetailsService implements UserDetailsService {

    @Autowired
    private EmployeRepository employeRepository;

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        Optional<Employe> employe = employeRepository.findByUsername(username);
        if (employe.isEmpty()) {
            throw new UsernameNotFoundException("Utilisateur non trouvé: " + username);
        }

        Employe e = employe.get();

        String role = e.getRoleCode();
        if (role == null || role.isBlank()) {
            role = e.getRole();
        }
        role = role == null ? "" : role.trim().toUpperCase().replace('-', '_').replace(' ', '_');
        if (role.startsWith("ROLE_")) {
            role = role.substring(5);
        }
        role = switch (role) {
            case "AGENT_COLLECTE" -> "AGENT";
            case "CHEF" -> "CHEF_EQUIPE";
            case "TECHNICIEN", "CENTRE_TECHNIQUE" -> "TECH";
            case "ADMINISTRATEUR" -> "ADMIN";
            default -> role;
        };
        if (role.isBlank()) {
            throw new UsernameNotFoundException("Rôle manquant pour l'utilisateur");
        }

        return User.builder()
                .username(e.getUsername())
                .password(e.getPassword())
                .authorities("ROLE_" + role)
                .disabled(!e.isEnabled())
                .build();
    }
}
