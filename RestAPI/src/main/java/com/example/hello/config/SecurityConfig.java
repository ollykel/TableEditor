package com.example.hello.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.http.HttpMethod;

@Configuration
public class SecurityConfig {
  @Bean
  public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
      http
          .csrf().disable() // disable CSRF for development/testing
          .authorizeHttpRequests(auth -> auth
              .requestMatchers("/api/v1/auth/**").permitAll()
              .requestMatchers(HttpMethod.POST, "/api/v1/users").anonymous()
              .anyRequest().authenticated() // allow all endpoints without auth
          );
      return http.build();
  }
  
  @Bean
  public PasswordEncoder passwordEncoder() {
    return new BCryptPasswordEncoder();
  }
}// end public class SecurityConfig
