package com.example.hello.entity;

import com.fasterxml.jackson.annotation.JsonManagedReference;
import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.*;
import java.util.List;

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

    @Column(nullable = false)
    private int width;

    @Column(nullable = false)
    private int height;

    @JsonManagedReference
    @OneToMany(mappedBy = "table", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<TableCell> cells;

    public TableEntity() {}

    public TableEntity(UserEntity owner, String name, int width, int height) {
        this.owner = owner;
        this.name = name;
        this.width = width;
        this.height = height;
    }

    // Getters and setters
    public Long getId() { return id; }
    public UserEntity getOwner() { return owner; }
    public String getName() { return name; }
    public int getWidth() { return width; }
    public int getHeight() { return height; }
    public List<TableCell> getCells() { return cells; }

    public void setOwner(UserEntity owner) { this.owner = owner; }
    public void setName(String name) { this.name = name; }
    public void setWidth(int width) { this.width = width; }
    public void setHeight(int height) { this.height = height; }
    public void setCells(List<TableCell> cells) { this.cells = cells; }
}
