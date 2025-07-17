package com.example.hello.repository;

import com.example.hello.entity.TableCell;
import com.example.hello.entity.TableCellId;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TableCellRepository extends JpaRepository<TableCell, TableCellId> {
    List<TableCell> findByTableId(Long tableId);
}
