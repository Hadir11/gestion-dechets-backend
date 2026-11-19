package org.municipalite.gestiondechets.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http,
                                                    JwtAuthenticationFilter jwtAuthenticationFilter) throws Exception {
        http
                .csrf(csrf -> csrf.disable())
                .cors(cors -> {})
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .exceptionHandling(exceptions -> exceptions
                        .authenticationEntryPoint((request, response, exception) -> response.sendError(401))
                        .accessDeniedHandler((request, response, exception) -> response.sendError(403)))
                .authorizeHttpRequests(auth -> auth
                        // Le dispatch d'erreur repasse par /error : sans cette règle, un 403 ou un 404
                        // est réécrit en 401 et le client ne peut plus distinguer les deux cas.
                        .requestMatchers("/error").permitAll()
                        .requestMatchers("/actuator/health", "/actuator/info").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/auth/login").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/auth/bootstrap-admin").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/auth/test").permitAll()
                        .requestMatchers("/api/auth/register").hasRole("ADMIN")
                        .requestMatchers("/api/test/**").denyAll()
                        .requestMatchers(HttpMethod.POST, "/api/alertes").hasAnyRole("ADMIN", "CHEF_EQUIPE", "AGENT")
                        .requestMatchers(HttpMethod.POST, "/api/**")
                        .hasAnyRole("ADMIN", "CHEF_EQUIPE")
                        .requestMatchers(HttpMethod.PUT, "/api/**")
                        .hasAnyRole("ADMIN", "CHEF_EQUIPE")
                        .requestMatchers(HttpMethod.PATCH, "/api/**")
                        .hasAnyRole("ADMIN", "CHEF_EQUIPE")
                        .requestMatchers(HttpMethod.DELETE, "/api/**").hasRole("ADMIN")
                        .anyRequest().authenticated())
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}
