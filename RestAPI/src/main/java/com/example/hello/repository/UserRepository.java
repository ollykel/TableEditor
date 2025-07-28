package com.example.hello.repository;

import java.util.Optional;
import java.util.List;

import com.example.hello.entity.UserEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface UserRepository extends JpaRepository<UserEntity, Long> {
  Optional<UserEntity> findById(Long id);

  Optional<UserEntity> findByUsername(String username);

  Optional<UserEntity> findByEmail(String email);

  @Query(value = "SELECT u FROM UserEntity u WHERE u.email LIKE CONCAT('%', ?1, '%') OR u.username LIKE CONCAT('%', ?1, '%')")
  List<UserEntity> findByEmailOrUsernameContains(String matchs);

  @Query(value = "SELECT u FROM UserEntity u WHERE u.email LIKE CONCAT(?1, '%') OR u.username LIKE CONCAT(?1, '%')")
  List<UserEntity> findByEmailOrUsernameStartsWith(String matchs);
}
