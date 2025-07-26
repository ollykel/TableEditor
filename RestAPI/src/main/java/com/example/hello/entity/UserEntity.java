package com.example.hello.entity;

import java.util.List;
import java.util.Set;

import jakarta.persistence.*;
import com.fasterxml.jackson.annotation.JsonManagedReference;

@Entity
@Table(name = "users")
public class UserEntity {

  // === class PublicView ======================================================
  //
  // Exposes only information that should be visible to public users (i.e. no
  // passwords).
  //
  // Excludes relational data (i.e. owned tables, shared tables)
  //
  // ===========================================================================
  public static class PublicView {
      private Long      id;
      private String    username;
      private String    email;

      public PublicView(Long id, String username, String email) {
          this.id = id;
          this.username = username;
          this.email = email;
      }

      public Long     getId() { return this.id; }
      public String   getUsername() { return this.username; }
      public String   getEmail() { return this.email; }
  }

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(nullable = false, length = 256)
  private String username;

  @Column(nullable = false, length = 256)
  private String email;

  @Column(name="password_hashed", nullable = false, length = 60)
  private String passwordHashed;

  @JsonManagedReference
  @OneToMany(mappedBy = "owner", cascade = CascadeType.ALL, orphanRemoval = true)
  private List<TableEntity> ownTables;

  @JsonManagedReference
  @ManyToMany
  @JoinTable(
    name = "table_shares",
    joinColumns = @JoinColumn(name = "user_id"),
    inverseJoinColumns = @JoinColumn(name = "table_id"))
  private Set<TableEntity> sharedTables;

  public UserEntity() {}

  public Long getId() {
    return this.id;
  }

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

  public List<TableEntity> getOwnTables() {
    return this.ownTables;
  }

  public PublicView toPublicView() {
    return new PublicView(
      this.getId(),
      this.getUsername(),
      this.getEmail()
    );
  }
}// end public class UserEntity
