package org.municipalite.gestiondechets.service;

import org.springframework.stereotype.Component;

import java.time.Duration;
import java.time.Instant;
import java.util.ArrayDeque;
import java.util.Deque;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Compte les échecs de connexion par identifiant et bloque au bout de cinq.
 *
 * Sans ce garde-fou, /api/auth/login accepte autant d'essais qu'on veut.
 * Le compteur vit en mémoire : ça protège une seule instance et ça repart de zéro
 * au redémarrage. Avec plusieurs instances il faudrait un stockage partagé (Redis),
 * ce n'est pas le cas ici.
 */
@Component
public class LoginAttemptService {

    static final int MAX_ATTEMPTS = 5;
    static final Duration WINDOW = Duration.ofMinutes(15);

    private final Map<String, Deque<Instant>> failures = new ConcurrentHashMap<>();

    private static String key(String username) {
        return username == null ? "" : username.trim().toLowerCase();
    }

    /** Vrai si l'identifiant a dépassé le quota de tentatives dans la fenêtre courante. */
    public boolean isBlocked(String username) {
        Deque<Instant> attempts = failures.get(key(username));
        if (attempts == null) {
            return false;
        }
        prune(attempts);
        return attempts.size() >= MAX_ATTEMPTS;
    }

    public void loginFailed(String username) {
        Deque<Instant> attempts = failures.computeIfAbsent(key(username), k -> new ArrayDeque<>());
        synchronized (attempts) {
            prune(attempts);
            attempts.addLast(Instant.now());
        }
    }

    public void loginSucceeded(String username) {
        failures.remove(key(username));
    }

    private void prune(Deque<Instant> attempts) {
        Instant limit = Instant.now().minus(WINDOW);
        synchronized (attempts) {
            while (!attempts.isEmpty() && attempts.peekFirst().isBefore(limit)) {
                attempts.pollFirst();
            }
        }
    }
}
