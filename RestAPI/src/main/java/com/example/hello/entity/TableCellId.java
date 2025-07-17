package com.example.hello.entity;

import java.io.Serializable;
import java.util.Objects;

public class TableCellId implements Serializable {
    private Long table;
    private int rowNum;
    private int columnNum;

    public TableCellId() {}

    public TableCellId(Long table, int rowNum, int columnNum) {
        this.table = table;
        this.rowNum = rowNum;
        this.columnNum = columnNum;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof TableCellId)) return false;
        TableCellId that = (TableCellId) o;
        return rowNum == that.rowNum &&
               columnNum == that.columnNum &&
               Objects.equals(table, that.table);
    }

    @Override
    public int hashCode() {
        return Objects.hash(table, rowNum, columnNum);
    }
}
