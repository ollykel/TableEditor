package com.example.hello.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.http.HttpMethod;
import org.springframework.beans.factory.annotation.Autowired;

import com.example.hello.filter.JwtFilter;

@Configuration
public class SecurityConfig {
  @Bean
  public SecurityFilterChain filterChain(HttpSecurity http, JwtFilter jwtFilter) throws Exception {
      return http
          .csrf().disable() // disable CSRF for development/testing
          .authorizeHttpRequests(auth -> auth
              .requestMatchers("/api/v1/auth/**").permitAll()
              .requestMatchers("/api/v1/health").permitAll()
              .requestMatchers(HttpMethod.POST, "/api/v1/users").anonymous()
              .anyRequest().authenticated() // allow all endpoints without auth
          )
          .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class)
          .build();
  }
  
  @Bean
  public PasswordEncoder passwordEncoder() {
    return new BCryptPasswordEncoder();
  }
}// end public class SecurityConfig
