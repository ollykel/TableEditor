package com.example.hello.controller;

import java.util.stream.Collectors;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpStatus;

import jakarta.servlet.http.HttpServletRequest;

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
    public ResponseEntity<?> getUsers(HttpServletRequest req) {
      Map<String, String[]> params = req.getParameterMap();

      if (params.isEmpty()) {
        List<UserEntity.PublicView> out = this.userRepository.findAll().stream()
          .map(user -> user.toPublicView())
          .collect(Collectors.toList());

        return ResponseEntity.ok(out);
      } else {
        for (Map.Entry<String, String[]> entry : params.entrySet()) {
          String    key = entry.getKey();
          String[]  value = entry.getValue();

          // For now, just process the first query we encounter.
          // TODO: more robust query parsing.
          switch (key) {
            case "contains":
              {
                String  querys = String.join(" ", value);

                return ResponseEntity.ok(
                  this.userRepository.findByEmailOrUsernameContains(querys)
                    .stream()
                    .map(user -> user.toPublicView())
                    .collect(Collectors.toList())
                );
              }
            case "starts_with":
              {
                String  querys = String.join(" ", value);

                return ResponseEntity.ok(
                  this.userRepository.findByEmailOrUsernameStartsWith(querys)
                    .stream()
                    .map(user -> user.toPublicView())
                    .collect(Collectors.toList())
                );
              }
            default:
              return new ResponseEntity(
                String.format("Unrecognized query parameter \"%s\"", key),
                HttpStatus.BAD_REQUEST
              );
          }// end switch (key)
        }// end for (Map.Entry<String, String[]> entry : params.entries())

        return new ResponseEntity("No recognized filter found in query", HttpStatus.BAD_REQUEST);
      }
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
