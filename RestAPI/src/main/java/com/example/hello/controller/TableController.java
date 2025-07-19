package com.example.hello.controller;

import java.util.List;
import java.util.Optional;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.example.hello.entity.TableEntity;
import com.example.hello.entity.TableCell;
import com.example.hello.entity.TableCell;
import com.example.hello.repository.TableRepository;
import com.example.hello.repository.TableCellRepository;
import com.example.hello.dto.TableCellRequest;

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
      // Initialize blank cells
      TableEntity out = this.tableRepository.save(table);

      for (int i_row = 0; i_row < table.getHeight(); ++i_row) {
        for (int i_col = 0; i_col < table.getWidth(); ++i_col) {
          TableCell cell = new TableCell(out, i_row, i_col, "");

          this.tableCellRepository.save(cell);
        }// end for (int i_col = 0; i_col < table.getWidth(); ++i_col)
      }// end for (int i_row = 0; i_row < table.getHeight(); ++i_row)

      return out;
    }

    @GetMapping("{id}")
    public Optional<TableEntity> getTableById(@PathVariable("id") Long tableId) {
      return this.tableRepository.findById(tableId);
    }

    @GetMapping("{id}/cells")
    public List<TableCell> getCellsByTableId(@PathVariable("id") Long tableId) {
      return this.tableCellRepository.findByTableId(tableId);
    }

    @PostMapping("/{id}/cells")
    public ResponseEntity<?> addCell(@PathVariable("id") Long tableId, @RequestBody TableCellRequest req) {
        Optional<TableEntity> tableOpt = tableRepository.findById(tableId);
        if (tableOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        TableCell cell = new TableCell();
        cell.setTable(tableOpt.get());
        cell.setRowNum(req.rowNum);
        cell.setColumnNum(req.columnNum);
        cell.setText(req.text);

        TableCell saved = this.tableCellRepository.save(cell);
        return ResponseEntity.ok(saved);
    }
}
