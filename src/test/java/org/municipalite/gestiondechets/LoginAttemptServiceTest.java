package org.municipalite.gestiondechets;

import org.junit.jupiter.api.Test;
import org.municipalite.gestiondechets.service.LoginAttemptService;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Vérifie la limitation des tentatives de connexion : au-delà de cinq échecs,
 * l'identifiant est temporairement bloqué. Sans ce garde-fou, /api/auth/login
 * accepte un nombre illimité d'essais.
 */
class LoginAttemptServiceTest {

    @Test
    void fiveFailuresBlockTheAccount() {
        LoginAttemptService service = new LoginAttemptService();

        for (int i = 0; i < 4; i++) {
            service.loginFailed("admin");
            assertThat(service.isBlocked("admin")).as("encore autorisé après %d échecs", i + 1).isFalse();
        }

        service.loginFailed("admin");
        assertThat(service.isBlocked("admin")).isTrue();
    }

    @Test
    void successfulLoginClearsTheCounter() {
        LoginAttemptService service = new LoginAttemptService();
        for (int i = 0; i < 5; i++) {
            service.loginFailed("agent");
        }
        assertThat(service.isBlocked("agent")).isTrue();

        service.loginSucceeded("agent");

        assertThat(service.isBlocked("agent")).isFalse();
    }

    @Test
    void accountsAreIndependent() {
        LoginAttemptService service = new LoginAttemptService();
        for (int i = 0; i < 5; i++) {
            service.loginFailed("agent");
        }

        assertThat(service.isBlocked("agent")).isTrue();
        assertThat(service.isBlocked("admin")).isFalse();
    }

    @Test
    void usernameIsCaseAndWhitespaceInsensitive() {
        LoginAttemptService service = new LoginAttemptService();
        for (int i = 0; i < 5; i++) {
            service.loginFailed("  Agent ");
        }

        assertThat(service.isBlocked("agent")).isTrue();
        assertThat(service.isBlocked("AGENT")).isTrue();
    }

    @Test
    void unknownUserIsNeverBlocked() {
        LoginAttemptService service = new LoginAttemptService();
        assertThat(service.isBlocked(null)).isFalse();
        assertThat(service.isBlocked("")).isFalse();
    }
}
