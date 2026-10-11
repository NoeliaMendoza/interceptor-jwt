package edu.demo.jwt.api;

import java.util.Map;

import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class MessageController {

    @GetMapping("/mensaje")
    public Map<String, String> mensaje(Authentication authentication) {
        return Map.of("mensaje", "Acceso autorizado para " + authentication.getName() + ".");
    }
}
