package edu.demo.jwt.auth;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Base64;
import java.util.LinkedHashMap;
import java.util.Map;

import javax.crypto.Mac;
import javax.crypto.SecretKey;

import edu.demo.jwt.auth.AuthDtos.LoginRequest;
import edu.demo.jwt.auth.AuthDtos.LoginResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import tools.jackson.core.JacksonException;
import tools.jackson.databind.ObjectMapper;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final SecretKey jwtSecretKey;
    private final ObjectMapper objectMapper;
    private final long tokenLifetimeMinutes;

    public AuthController(
            AuthenticationManager authenticationManager,
            SecretKey jwtSecretKey,
            ObjectMapper objectMapper,
            @Value("${app.jwt.ttl-minutes:15}") long tokenLifetimeMinutes) {
        this.authenticationManager = authenticationManager;
        this.jwtSecretKey = jwtSecretKey;
        this.objectMapper = objectMapper;
        this.tokenLifetimeMinutes = tokenLifetimeMinutes;
    }

    @PostMapping("/login")
    public LoginResponse login(@RequestBody LoginRequest request) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.username(), request.password()));

        Instant issuedAt = Instant.now();
        Instant expiresAt = issuedAt.plus(tokenLifetimeMinutes, ChronoUnit.MINUTES);
        String role = authentication.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .filter(authority -> authority.startsWith("ROLE_"))
                .map(authority -> authority.substring("ROLE_".length()).toLowerCase())
                .findFirst()
                .orElse("user");

        return new LoginResponse(
                createToken(authentication.getName(), role, issuedAt, expiresAt),
                "Bearer",
                expiresAt);
    }

    private String createToken(String username, String role, Instant issuedAt, Instant expiresAt) {
        Map<String, Object> header = Map.of("alg", "HS256", "typ", "JWT");
        Map<String, Object> claims = new LinkedHashMap<>();
        claims.put("sub", username);
        claims.put("rol", role);
        claims.put("iat", issuedAt.getEpochSecond());
        claims.put("exp", expiresAt.getEpochSecond());

        try {
            String encodedHeader = encodeJson(header);
            String encodedClaims = encodeJson(claims);
            String content = encodedHeader + "." + encodedClaims;
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(jwtSecretKey);
            String signature = Base64.getUrlEncoder()
                    .withoutPadding()
                    .encodeToString(mac.doFinal(content.getBytes(java.nio.charset.StandardCharsets.US_ASCII)));
            return content + "." + signature;
        } catch (java.security.GeneralSecurityException | JacksonException exception) {
            throw new IllegalStateException("No se pudo firmar el JWT.", exception);
        }
    }

    private String encodeJson(Object value) throws JacksonException {
        return Base64.getUrlEncoder()
                .withoutPadding()
                .encodeToString(objectMapper.writeValueAsBytes(value));
    }
}
