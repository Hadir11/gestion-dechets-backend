package org.municipalite.gestiondechets;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.municipalite.gestiondechets.config.CorsConfig;
import org.municipalite.gestiondechets.config.JwtAuthenticationFilter;
import org.municipalite.gestiondechets.config.SecurityConfig;
import org.municipalite.gestiondechets.controller.AgentController;
import org.municipalite.gestiondechets.controller.AlerteController;
import org.municipalite.gestiondechets.controller.TestController;
import org.municipalite.gestiondechets.controller.TourneeController;
import org.municipalite.gestiondechets.model.Employe;
import org.municipalite.gestiondechets.repository.EmployeRepository;
import org.municipalite.gestiondechets.repository.TourneeRepository;
import org.municipalite.gestiondechets.service.CustomUserDetailsService;
import org.municipalite.gestiondechets.service.JwtService;
import org.municipalite.gestiondechets.service.OptimisationTourneeService;
import org.municipalite.gestiondechets.service.impl.AlerteService;
import org.municipalite.gestiondechets.service.TourneeService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.BDDMockito.given;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Vérifie la matrice d'accès réelle, en passant par la chaîne de filtres Spring Security
 * et les jetons JWT signés. Ces tests remplacent les vérifications manuelles faites avec
 * curl : si quelqu'un rouvre une route par erreur, ils échouent.
 */
@WebMvcTest(controllers = {TestController.class, AgentController.class, TourneeController.class, AlerteController.class})
@Import({SecurityConfig.class, CorsConfig.class, JwtAuthenticationFilter.class, JwtService.class})
@TestPropertySource(properties = {
        "jwt.secret=cHJvamV0LXRlc3Qtc2VjcmV0LWF0LWxlYXN0LTMyLWJ5dGVzLWxvbmc=",
        "jwt.expiration=3600000",
        "cors.allowed.origins=http://localhost:3000"
})
class SecurityRulesTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JwtService jwtService;

    @MockBean
    private EmployeRepository employeRepository;

    @MockBean
    private TourneeRepository tourneeRepository;

    @MockBean
    private TourneeService tourneeService;

    @MockBean
    private OptimisationTourneeService optimisationTourneeService;

    @MockBean
    private AlerteService alerteService;

    @MockBean
    private CustomUserDetailsService customUserDetailsService;

    @BeforeEach
    void stubUsers() {
        given(employeRepository.findByUsername(anyString())).willAnswer(invocation -> {
            String username = invocation.getArgument(0);
            if ("agent".equals(username)) {
                return Optional.of(Employe.builder()
                        .username("agent").roleCode("AGENT").role("Agent").build());
            }
            return Optional.empty();
        });
        given(tourneeRepository.findByEmploye(org.mockito.ArgumentMatchers.any())).willReturn(List.of());

        given(customUserDetailsService.loadUserByUsername(anyString())).willAnswer(invocation -> {
            String username = invocation.getArgument(0);
            String role = "agent".equals(username) ? "ROLE_AGENT" : "ROLE_ADMIN";
            UserDetails user = User.withUsername(username).password("x").authorities(role).build();
            return user;
        });
    }

    private String tokenFor(String username, String roleCode) {
        Employe employe = Employe.builder().username(username).roleCode(roleCode).build();
        return "Bearer " + jwtService.generateToken(employe);
    }

    @Test
    void anonymousRequestsAreRejected() throws Exception {
        mockMvc.perform(get("/api/alertes")).andExpect(status().isUnauthorized());
        mockMvc.perform(get("/api/employes")).andExpect(status().isUnauthorized());
        mockMvc.perform(get("/api/tournees")).andExpect(status().isUnauthorized());
        mockMvc.perform(get("/api/agent/mes-tournees")).andExpect(status().isUnauthorized());
    }

    @Test
    void malformedTokenIsRejected() throws Exception {
        mockMvc.perform(get("/api/tournees").header("Authorization", "Bearer pas.un.jeton"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void testEndpointsRemainBlocked() throws Exception {
        mockMvc.perform(get("/api/test/hello")).andExpect(status().isUnauthorized());
        mockMvc.perform(get("/api/test/hello").header("Authorization", tokenFor("admin", "ADMIN")))
                .andExpect(status().isForbidden());
    }

    @Test
    void adminReachesTourneesAndDashboardRoutes() throws Exception {
        mockMvc.perform(get("/api/tournees").header("Authorization", tokenFor("admin", "ADMIN")))
                .andExpect(status().isOk());
    }

    @Test
    void agentCannotReachTournees() throws Exception {
        mockMvc.perform(get("/api/tournees").header("Authorization", tokenFor("agent", "AGENT")))
                .andExpect(status().isForbidden());
    }

    @Test
    void agentReachesOwnTournees() throws Exception {
        mockMvc.perform(get("/api/agent/mes-tournees").header("Authorization", tokenFor("agent", "AGENT")))
                .andExpect(status().isOk());
    }

    @Test
    void adminCannotUseTheAgentEndpoint() throws Exception {
        mockMvc.perform(get("/api/agent/mes-tournees").header("Authorization", tokenFor("admin", "ADMIN")))
                .andExpect(status().isForbidden());
    }

    @Test
    void unknownRouteReturnsNotFoundOnceAuthenticated() throws Exception {
        mockMvc.perform(get("/api/route-inexistante").header("Authorization", tokenFor("admin", "ADMIN")))
                .andExpect(status().isNotFound());
    }

    @Test
    void agentCanReportAnAlertAndReceivesCreated() throws Exception {
        given(alerteService.createAlerte(any(), any(), any(), anyInt())).willReturn(new org.municipalite.gestiondechets.model.Alerte());

        mockMvc.perform(post("/api/alertes")
                        .header("Authorization", tokenFor("agent", "AGENT"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"typeAlerte\":\"DEBORDEMENT\",\"message\":\"conteneur plein\"}"))
                .andExpect(status().isCreated());
    }
}
