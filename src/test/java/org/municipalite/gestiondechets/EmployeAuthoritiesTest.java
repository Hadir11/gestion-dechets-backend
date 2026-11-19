package org.municipalite.gestiondechets;

import org.junit.jupiter.api.Test;
import org.municipalite.gestiondechets.model.Employe;
import org.springframework.security.core.GrantedAuthority;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Vérifie que la normalisation des rôles est cohérente partout où elle est utilisée
 * (filtre JWT, tableaux de bord, contrôleurs). Une régression ici ouvrirait une
 * autorisation alors qu'elle était fermée, ou bloquerait un agent légitime.
 */
class EmployeAuthoritiesTest {

    private static List<String> authoritiesOf(String roleCode, String role) {
        Employe employe = Employe.builder()
                .username("test")
                .role(role)
                .roleCode(roleCode)
                .build();
        return employe.getAuthorities().stream().map(GrantedAuthority::getAuthority).toList();
    }

    @Test
    void roleCodeIsPrefixedWithRole() {
        assertThat(authoritiesOf("ADMIN", "Administrateur")).containsExactly("ROLE_ADMIN");
        assertThat(authoritiesOf("CHEF_EQUIPE", "Chef")).containsExactly("ROLE_CHEF_EQUIPE");
    }

    @Test
    void legacyCodeIsFoldedIntoTheCanonicalOne() {
        assertThat(authoritiesOf("AGENT_COLLECTE", "Agent")).containsExactly("ROLE_AGENT");
        assertThat(authoritiesOf("CHEF", "Chef d'équipe")).containsExactly("ROLE_CHEF_EQUIPE");
        assertThat(authoritiesOf("TECHNICIEN", "Technicien")).containsExactly("ROLE_TECH");
        assertThat(authoritiesOf("ADMINISTRATEUR", "Administrateur")).containsExactly("ROLE_ADMIN");
    }

    @Test
    void roleCodeFallsBackToDisplayRole() {
        assertThat(authoritiesOf(null, "AGENT")).containsExactly("ROLE_AGENT");
        assertThat(authoritiesOf("  ", "chef")).containsExactly("ROLE_CHEF_EQUIPE");
    }

    @Test
    void separatorsAndCaseAreNormalised() {
        assertThat(authoritiesOf("chef-equipe", null)).containsExactly("ROLE_CHEF_EQUIPE");
        assertThat(authoritiesOf("agent collecte", null)).containsExactly("ROLE_AGENT");
        assertThat(authoritiesOf("ROLE_ADMIN", null)).containsExactly("ROLE_ADMIN");
    }

    @Test
    void missingRoleGrantsNothing() {
        assertThat(authoritiesOf(null, null)).isEmpty();
    }

    @Test
    void passwordAndUserDetailsInternalsAreNotSerialised() throws Exception {
        Employe employe = Employe.builder().username("agent").password("secret-hash").roleCode("AGENT").build();

        String json = new com.fasterxml.jackson.databind.ObjectMapper().writeValueAsString(employe);

        assertThat(json).doesNotContain("secret-hash");
        assertThat(json).doesNotContain("\"password\"");
        assertThat(json).doesNotContain("authorities");
        assertThat(json).doesNotContain("accountNonLocked");
    }
}
