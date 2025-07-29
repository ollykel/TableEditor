package com.example.hello.entity;

import com.fasterxml.jackson.annotation.JsonManagedReference;
import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.*;
import java.util.Collection;
import java.util.List;
import java.util.Set;

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
        private Long ownerId;
        private int width;
        private int height;

        public PublicView(TableEntity table) {
          this.id = table.getId();
          this.name = table.getName();
          this.ownerId = table.getOwner().getId();
          this.width = table.getWidth();
          this.height = table.getHeight();
        }

        public Long getId() { return this.id; }
        public String getName() { return this.name; }
        public Long getOwnerId() { return this.ownerId; }
        public int getWidth() { return this.width; }
        public int getHeight() { return this.height; }
    }

    public TableEntity() {}

    public TableEntity(UserEntity owner, String name, int width, int height) {
        this.owner = owner;
        this.name = name;
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
    public int getWidth() { return width; }
    public int getHeight() { return height; }
    public List<TableCell> getCells() { return cells; }

    public void setOwner(UserEntity owner) { this.owner = owner; }
    public void addSharedUser(UserEntity user) { this.sharedUsers.add(user); }
    public void addSharedUsers(Collection<UserEntity> users) { this.sharedUsers.addAll(users); }
    public void removeSharedUser(UserEntity user) { this.sharedUsers.remove(user); }
    public void setName(String name) { this.name = name; }
    public void setWidth(int width) { this.width = width; }
    public void setHeight(int height) { this.height = height; }
    public void setCells(List<TableCell> cells) { this.cells = cells; }

    public boolean userHasAccess(UserEntity user) {
      return this.getOwner().equals(user) || this.sharedUsers.contains(user);
    }
}
