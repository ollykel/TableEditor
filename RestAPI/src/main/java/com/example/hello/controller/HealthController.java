package com.example.hello.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/health")
public class HealthController {
    @GetMapping
    public ResponseEntity<?> getTables() {
      // basic health check to ensure service is ok
      return ResponseEntity.ok().build();
    }
}
