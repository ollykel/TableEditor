package com.example.hello.controller;

import java.util.stream.Collectors;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.ResponseEntity;

import com.example.hello.entity.UserEntity;
import com.example.hello.repository.UserRepository;
import com.example.hello.service.UserService;
import com.example.hello.dto.CreateUserRequest;

@RestController
@RequestMapping("/api/v1/users")
public class UserController {

    @Autowired
    private UserService userService;

    @Autowired
    private UserRepository  userRepository;

    // TODO: return filtered response (avoid exposing password)
    @GetMapping
    public ResponseEntity<?> getUsers() {
      List<UserEntity.PublicView> out = this.userRepository.findAll().stream()
        .map(user -> user.toPublicView())
        .collect(Collectors.toList());

      return ResponseEntity.ok(out);
    }

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
