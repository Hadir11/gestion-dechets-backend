package org.municipalite.gestiondechets.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;

@Configuration
public class CorsConfig {

    @Value("${cors.allowed.origins:http://localhost:3000}")
    private String allowedOrigins;

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        CorsConfiguration config = new CorsConfiguration();

        config.setAllowedOrigins(Arrays.stream(allowedOrigins.split(","))
                .map(String::trim)
                .filter(origin -> !origin.isEmpty())
                .toList());

        // Autorise toutes les méthodes HTTP
        config.addAllowedMethod("*");

        // Autorise tous les headers
        config.addAllowedHeader("*");

        // L'API utilise un jeton Bearer et n'a pas besoin de cookies inter-origines.
        config.setAllowCredentials(false);

        // Enregistre cette configuration pour toutes les routes
        source.registerCorsConfiguration("/**", config);

        return source;
    }
}
