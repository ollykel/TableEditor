package com.example.hello.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;

import com.example.hello.entity.UserEntity;
import com.example.hello.repository.UserRepository;
import com.example.hello.config.SecurityConfig;

public class LoginService {
  public static class UsernameNotFoundException
      extends Exception
  {
    public UsernameNotFoundException(String msg)
    {
      super(msg);
    }
  }

  @Autowired
  private UserRepository    userRepository;

  @Autowired
  private PasswordEncoder   passwordEncoder;

  public boolean authenticate(String username, String rawPassword)
    throws UsernameNotFoundException
  {
      UserEntity user = this.userRepository.findByUsername(username)
          .orElseThrow(() -> new UsernameNotFoundException("User not found"));

      return this.passwordEncoder.matches(rawPassword, user.getPasswordHashed());
  }
}
