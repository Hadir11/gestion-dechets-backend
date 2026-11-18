package org.municipalite.gestiondechets.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.filter.CorsFilter;

import java.util.Arrays;

@Configuration
public class CorsConfig {

    @Value("${cors.allowed.origins:http://localhost:3000}")
    private String allowedOrigins;

    @Bean
    public CorsFilter corsFilter() {
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

        // Autorise les cookies/credentials
        config.setAllowCredentials(true);

        // Enregistre cette configuration pour toutes les routes
        source.registerCorsConfiguration("/**", config);

        return new CorsFilter(source);
    }
}
