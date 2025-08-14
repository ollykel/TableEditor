package com.example.hello.entity;

import java.time.ZonedDateTime;

import com.fasterxml.jackson.annotation.JsonManagedReference;
import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.*;
import java.util.Collection;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Entity
@Table(name = "tables")
public class TableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 256)
    private String name;

    @JsonBackReference
    @ManyToOne
    @JoinColumn(name = "owner_id", nullable = false)
    private UserEntity owner;

    @Column(nullable = false, name = "time_created")
    private ZonedDateTime timeCreated;

    @JsonManagedReference
    @ManyToMany
    @JoinTable(
      name = "table_shares",
      joinColumns = @JoinColumn(name = "table_id"),
      inverseJoinColumns = @JoinColumn(name = "user_id"))
    private Set<UserEntity> sharedUsers;

    @Column(nullable = false)
    private int width;

    @Column(nullable = false)
    private int height;

    @JsonManagedReference
    @OneToMany(mappedBy = "table", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<TableCell> cells;

    public static class PublicView {
        private Long id;
        private String name;
        private UserEntity.PublicView owner;
        private ZonedDateTime timeCreated;
        private int width;
        private int height;
        private List<UserEntity.PublicView> sharedUsers;

        public PublicView(TableEntity table) {
          this.id = table.getId();
          this.name = table.getName();
          this.owner = table.getOwner().toPublicView();
          this.timeCreated = table.getTimeCreated();
          this.width = table.getWidth();
          this.height = table.getHeight();
          this.sharedUsers = table.getSharedUsers().stream()
            .map(user -> user.toPublicView())
            .collect(Collectors.toList());
        }

        public Long getId() { return this.id; }
        public String getName() { return this.name; }
        public UserEntity.PublicView getOwner() { return this.owner; }
        public ZonedDateTime getTimeCreated() { return this.timeCreated; }
        public int getWidth() { return this.width; }
        public int getHeight() { return this.height; }
        public List<UserEntity.PublicView> getSharedUsers() {
          return this.sharedUsers;
        }
    }

    public TableEntity() {}

    public TableEntity(UserEntity owner, String name, ZonedDateTime timeCreated, int width, int height) {
        this.owner = owner;
        this.name = name;
        this.timeCreated = timeCreated;
        this.width = width;
        this.height = height;
    }

    public PublicView toPublicView() {
      return new PublicView(this);
    }

    // Getters and setters
    public Long getId() { return id; }
    public UserEntity getOwner() { return owner; }
    public Set<UserEntity> getSharedUsers() { return this.sharedUsers; }
    public String getName() { return name; }
    public ZonedDateTime getTimeCreated() { return this.timeCreated; }
    public int getWidth() { return width; }
    public int getHeight() { return height; }
    public List<TableCell> getCells() { return cells; }

    public void setOwner(UserEntity owner) { this.owner = owner; }
    public void addSharedUser(UserEntity user) { this.sharedUsers.add(user); }
    public void addSharedUsers(Collection<UserEntity> users) { this.sharedUsers.addAll(users); }
    public void setSharedUsers(Collection<UserEntity> users) {
      this.sharedUsers.retainAll(users);
      this.sharedUsers.addAll(users);
    }
    public void removeSharedUser(UserEntity user) { this.sharedUsers.remove(user); }
    public void setName(String name) { this.name = name; }
    public void setWidth(int width) { this.width = width; }
    public void setHeight(int height) { this.height = height; }
    public void setCells(List<TableCell> cells) { this.cells = cells; }

    public boolean userHasAccess(UserEntity user) {
      return this.getOwner().equals(user) || this.sharedUsers.contains(user);
    }
}
