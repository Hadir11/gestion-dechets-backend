package org.municipalite.gestiondechets.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Titre et description de la doc interactive servie sur /swagger-ui.html.
 * Le schéma "bearer" évite de recopier le jeton à la main dans chaque requête :
 * on le colle une fois via « Authorize » et Swagger l'ajoute tout seul.
 */
@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI gestionDechetsOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("Gestion municipale des déchets")
                        .version("1.0.0")
                        .description("""
                                API REST de démonstration : zones, points de collecte, alertes,
                                équipes, employés, véhicules et optimisation de tournées.
                                Authentifiez-vous sur POST /api/auth/login puis cliquez sur
                                « Authorize » pour envoyer le jeton Bearer.
                                """))
                .components(new Components().addSecuritySchemes("bearer",
                        new SecurityScheme()
                                .type(SecurityScheme.Type.HTTP)
                                .scheme("bearer")
                                .bearerFormat("JWT")))
                .addSecurityItem(new SecurityRequirement().addList("bearer"));
    }
}
