package org.municipalite.gestiondechets.controller;

import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/test")
public class TestController {

    @GetMapping("/hello")
    public String hello() {
        return "✅ Hello from Spring Boot! Server time: " + System.currentTimeMillis();
    }

    @PostMapping("/echo")
    public String echo(@RequestBody String message) {
        return "📨 Echo: " + message;
    }

    @GetMapping("/public")
    public String publicEndpoint() {
        return "🔓 Endpoint public - Accessible sans authentification";
    }

    @GetMapping("/private")
    public String privateEndpoint() {
        return "🔐 Endpoint privé - Nécessite authentification";
    }
}