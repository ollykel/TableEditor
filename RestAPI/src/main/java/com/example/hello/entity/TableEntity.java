package com.example.hello.entity;

import com.fasterxml.jackson.annotation.JsonManagedReference;
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

    @Column(nullable = false)
    private int width;

    @Column(nullable = false)
    private int height;

    @JsonManagedReference
    @OneToMany(mappedBy = "table", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<TableCell> cells;

    public TableEntity() {}

    public TableEntity(String name, int width, int height) {
        this.name = name;
        this.width = width;
        this.height = height;
    }

    // Getters and setters
    public Long getId() { return id; }
    public String getName() { return name; }
    public int getWidth() { return width; }
    public int getHeight() { return height; }
    public List<TableCell> getCells() { return cells; }

    public void setId(Long id) { this.id = id; }
    public void setName(String name) { this.name = name; }
    public void setWidth(int width) { this.width = width; }
    public void setHeight(int height) { this.height = height; }
    public void setCells(List<TableCell> cells) { this.cells = cells; }
}
