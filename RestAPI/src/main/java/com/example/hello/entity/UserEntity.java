package com.example.hello.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "users")
public class UserEntity {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(nullable = false, length = 256)
  private String username;

  @Column(nullable = false, length = 256)
  private String email;

  @Column(name="password_hashed", nullable = false, length = 60)
  private String passwordHashed;

  public UserEntity() {}

  public String getUsername() {
    return this.username;
  }

  public void setUsername(String username) {
    this.username = username;
  }

  public String getEmail() {
    return this.email;
  }

  public void setEmail(String email) {
    this.email = email;
  }

  public String getPasswordHashed() {
    return this.passwordHashed;
  }

  public void setPasswordHashed(String passwordHashed) {
    this.passwordHashed = passwordHashed;
  }

}// end public class UserEntity
