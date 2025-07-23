package com.example.hello.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.ResponseEntity;

import com.example.hello.entity.UserEntity;
import com.example.hello.service.UserService;
import com.example.hello.dto.CreateUserRequest;

@RestController
@RequestMapping("/api/v1/users")
public class UserController {

    @Autowired
    private UserService userService;

    @PostMapping
    public ResponseEntity<?> registerUser(@RequestBody CreateUserRequest req) {
      UserEntity user = userService.createUser(req);

      if (user != null) {
        return ResponseEntity.ok(true);
      } else {
        return ResponseEntity.badRequest().body(false);
      }
    }
}
