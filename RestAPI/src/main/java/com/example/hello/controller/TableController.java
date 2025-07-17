package com.example.hello.controller;

import com.example.hello.entity.TableEntity;
import com.example.hello.entity.TableCell;
import com.example.hello.repository.TableRepository;
import com.example.hello.repository.TableCellRepository;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/tables")
public class TableController {

    private final TableRepository     tableRepository;
    private final TableCellRepository tableCellRepository;

    public TableController(TableRepository tableRepository, TableCellRepository cellRepository) {
        this.tableRepository = tableRepository;
        this.tableCellRepository = cellRepository;
    }

    @GetMapping
    public List<TableEntity> getAllTables() {
        return tableRepository.findAll();
    }

    @PostMapping
    public TableEntity createTable(@RequestBody TableEntity table) {
        return tableRepository.save(table);
    }

    @GetMapping("{id}/cells")
    public List<TableCell> getCellsByTableId(@PathVariable("id") Long tableId) {
      return this.tableCellRepository.findByTableId(tableId);
    }
}
