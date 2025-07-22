package com.example.hello.service;

import com.example.hello.entity.UserEntity;
import com.example.hello.repository.UserRepository;
import com.example.hello.dto.CreateUserRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    public UserEntity createUser(CreateUserRequest req) {
      UserEntity  user = new UserEntity();
      String      hashedPassword = passwordEncoder.encode(req.password);

      user.setEmail(req.email);
      user.setUsername(req.username);
      user.setPasswordHashed(hashedPassword);

      return this.userRepository.save(user);
    }
}
