package com.example.hello.entity;

import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.*;
import java.io.Serializable;
import java.util.Objects;

@Entity
@Table(name = "table_cells")
@IdClass(TableCellId.class)
public class TableCell {

    @Id
    @JsonBackReference
    @ManyToOne
    @JoinColumn(name = "table_id", nullable = false)
    private TableEntity table;

    @Id
    @Column(name = "row_num")
    private int rowNum;

    @Id
    @Column(name = "column_num")
    private int columnNum;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String text;

    public TableCell() {}

    public TableCell(TableEntity table, int rowNum, int columnNum, String text) {
        this.table = table;
        this.rowNum = rowNum;
        this.columnNum = columnNum;
        this.text = text;
    }

    // Getters and setters
    public TableEntity getTable() { return table; }
    public int getRowNum() { return rowNum; }
    public int getColumnNum() { return columnNum; }
    public String getText() { return text; }

    public void setTable(TableEntity table) { this.table = table; }
    public void setRowNum(int rowNum) { this.rowNum = rowNum; }
    public void setColumnNum(int columnNum) { this.columnNum = columnNum; }
    public void setText(String text) { this.text = text; }
}
