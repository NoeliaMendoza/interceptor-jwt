package edu.demo.jwt.auth;

import java.time.Instant;

public final class AuthDtos {

    private AuthDtos() {
    }

    public record LoginRequest(String username, String password) {
    }

    public record LoginResponse(String token, String tokenType, Instant expiresAt) {
    }
}
