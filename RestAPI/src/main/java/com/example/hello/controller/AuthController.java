package com.example.hello.controller;

import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;

import com.example.hello.util.JwtUtil;
import com.example.hello.repository.UserRepository;
import com.example.hello.entity.UserEntity;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @PostMapping
    public ResponseEntity<?> login(@RequestBody AuthRequest request) {
        // Normally you'd verify against a DB here
        Optional<UserEntity>  user = this.userRepository.findByUsername(request.getUsername());

        if (
            (user.isPresent())
            && this.passwordEncoder.matches(request.getPassword(), user.get().getPasswordHashed())
        ) {
          String token = jwtUtil.generateToken(request.getUsername());

          return ResponseEntity.ok(new AuthResponse(token));
        } else {
          return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
    }

    static class AuthRequest {
        private String username;
        private String password;

        public String getUsername() {
          return this.username;
        }

        public String getPassword() {
          return this.password;
        }
        // getters and setters
    }

    static class AuthResponse {
        private String token;
        public AuthResponse(String token) { this.token = token; }
        public String getToken() { return token; }
    }
}
