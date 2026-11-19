package org.municipalite.gestiondechets.controller;

import org.municipalite.gestiondechets.model.Employe;
import org.municipalite.gestiondechets.service.AuthService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpStatus;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private AuthService authService;

    @Autowired
    private org.municipalite.gestiondechets.service.LoginAttemptService loginAttemptService;

    @Value("${security.bootstrap-token:}")
    private String bootstrapToken;

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> credentials) {
        String username = credentials.get("username");

        if (loginAttemptService.isBlocked(username)) {
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS).body(Map.of(
                    "success", false,
                    "message", "Trop de tentatives échouées. Réessayez dans quelques minutes."
            ));
        }

        try {
            String password = credentials.get("password");

            String token = authService.login(username, password);

            // Récupère l'employé pour les infos supplémentaires
            Employe employe = authService.getEmployeByUsername(username);
            loginAttemptService.loginSucceeded(username);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Connexion réussie");
            response.put("token", token);
            response.put("username", employe.getUsername());
            response.put("role", employe.getRole());
            response.put("roleCode", employe.getRoleCode());
            response.put("nom", employe.getNom());
            response.put("prenom", employe.getPrenom());
            response.put("email", employe.getEmail());

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            loginAttemptService.loginFailed(username);
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of(
                    "success", false,
                    "message", "Identifiant ou mot de passe invalide"
            ));
        }
    }

    @PostMapping("/register")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> register(@RequestBody Employe employe) {
        try {
            Employe savedEmploye = authService.register(employe);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Employé créé avec succès");
            response.put("data", savedEmploye);

            return ResponseEntity.status(HttpStatus.CREATED).body(response);

        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", e.getMessage()
            ));
        }
    }

    @PostMapping("/bootstrap-admin")
    public ResponseEntity<?> bootstrapAdmin(@RequestHeader(value = "X-Bootstrap-Token", required = false) String suppliedToken,
                                            @RequestBody Employe employe) {
        if (bootstrapToken.isBlank() || suppliedToken == null
                || !MessageDigest.isEqual(bootstrapToken.getBytes(StandardCharsets.UTF_8),
                        suppliedToken.getBytes(StandardCharsets.UTF_8))) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "Jeton de configuration invalide"));
        }
        try {
            // Bootstrap is implemented by the auth service so the one-time check and account creation share persistence rules.
            Employe savedEmploye = authService.bootstrapAdmin(employe);
            return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                    "success", true,
                    "message", "Compte administrateur initial créé. Retirez maintenant BOOTSTRAP_ADMIN_TOKEN.",
                    "username", savedEmploye.getUsername()
            ));
        } catch (IllegalStateException exception) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("message", exception.getMessage()));
        } catch (Exception exception) {
            return ResponseEntity.badRequest().body(Map.of("message", exception.getMessage()));
        }
    }
}
