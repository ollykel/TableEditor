package com.example.hello.controller;

import java.util.List;
import java.util.ArrayList;
import java.util.Optional;
import java.util.Set;
import java.util.HashSet;
import java.util.Map;
import java.util.HashMap;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import jakarta.servlet.http.HttpServletRequest;

import com.example.hello.entity.TableEntity;
import com.example.hello.entity.UserEntity;
import com.example.hello.entity.TableCell;
import com.example.hello.entity.TableCell;
import com.example.hello.repository.TableRepository;
import com.example.hello.repository.TableCellRepository;
import com.example.hello.repository.UserRepository;
import com.example.hello.dto.TableCellRequest;
import com.example.hello.dto.CreateTableRequest;

@RestController
@RequestMapping("/api/v1/tables")
public class TableController {

    private final TableRepository       tableRepository;
    private final TableCellRepository   tableCellRepository;
    private final UserRepository        userRepository;

    private static interface TableFilter {
      public boolean isValid(TableEntity table);
    }

    public static class InvalidFilterException
        extends Exception
    {
      public InvalidFilterException(String msg) {
        super(msg);
      }
    }

    private static class OwnerFilter {
      private boolean     isInverse;
      private List<Long>  ownerIds;

      public OwnerFilter()
      {
        this.isInverse = false;
        this.ownerIds = new ArrayList();
      }

      public boolean    getIsInverse() { return this.isInverse; }
      public List<Long> getOwnerIds() { return this.ownerIds; }

      public void setIsInverse(boolean isInverse) {
        this.isInverse = isInverse;
      }

      public void setOwnerIds(List<Long> ownerIds) {
        this.ownerIds = ownerIds;
      }

      // === fromString ========================================================
      //
      // Generates an OwnerFilter from a string. If "me" is encountered, it is
      // replaced with the provided user id corresponding to the currently
      // authenticated user.
      //
      // @param s [IN]        -- The filter string
      // @param selfId [IN]   -- The id of the user corresponding to "me"
      // @return An owner filter specifying which owner ids to filter for (or
      // avoid)
      // @throws InvalidFilterException if the query string is not in the proper
      // format
      //
      // Expected query string format: {!?}<comma-separated list of one or more
      // user ids or me>
      //
      // CFG:
      //  S = !T | T
      //  T = VALID_ID | VALID_ID,T
      //  VALID_ID = me|<INTEGER>
      //
      // =======================================================================
      public static OwnerFilter fromString(String s, Long selfId)
        throws InvalidFilterException
      {
        if (s.isEmpty()) {
          throw new InvalidFilterException("Owner filter string cannot be empty");
        } 
        
        OwnerFilter   out = new OwnerFilter();
        String        idString = s;

        if (s.charAt(0) == '!') {
          out.setIsInverse(true);
          idString = s.substring(1);
        }

        String[]  ownerIdStrings = idString.split(",");

        if (ownerIdStrings.length < 1) {
          throw new InvalidFilterException("Owner id filter must contain at least one user id");
        }

        List<Long>  ownerIds = new ArrayList();

        for (String ids : ownerIdStrings) {
          if(ids == "me") {
            ownerIds.add(selfId);
          } else {
            try {
              ownerIds.add(Long.parseLong(ids));
            } catch (NumberFormatException e) {
              throw new InvalidFilterException("Owner ids must be long integers");
            }
          }
        }// end for (String ids : ownerIdStrings)

        out.setOwnerIds(ownerIds);

        return out;
      }
    }

    public TableController(TableRepository tableRepository, TableCellRepository cellRepository, UserRepository userRepository) {
        this.tableRepository = tableRepository;
        this.tableCellRepository = cellRepository;
        this.userRepository = userRepository;
    }

    // private List<TableEntity> filterTablesByOwner(List<TableEntity> tables, String filter)
    //   throws InvalidFilterException
    // {
    // }

    // @GetMapping
    // public List<TableEntity> getTables(HttpServletRequest req) {
    //   // PCode:
    //   // If no query:
    //   //  -> return all
    //   // Else:
    //   //  get query params
    //   //  create filter list from query params
    //   //    -> if unrecognized param, return 400
    //   //  -> return filtered entities
    //   String  querys = req.getQueryString();

    //   if (querys == null) {
    //     return this.tableRepository.findAll();
    //   } else {
    //     Map<String, String> queryParams = new HashMap();
    //   }
    // }

    @PostMapping
    public Optional<TableEntity> createTable(@RequestBody CreateTableRequest data, HttpServletRequest req) {
      // Initialize blank cells
      Object  uname = req.getAttribute("username");

      if (! (uname instanceof String)) {
        return Optional.empty();
      }

      String                username = (String) uname;
      Optional<UserEntity>  user = this.userRepository.findByUsername(username);

      if (! user.isPresent()) {
        return Optional.empty();
      } else {
        TableEntity table = new TableEntity(user.get(), data.name, data.width, data.height);
        TableEntity out = this.tableRepository.save(table);

        for (int i_row = 0; i_row < table.getHeight(); ++i_row) {
          for (int i_col = 0; i_col < table.getWidth(); ++i_col) {
            TableCell cell = new TableCell(out, i_row, i_col, "");

            this.tableCellRepository.save(cell);
          }// end for (int i_col = 0; i_col < table.getWidth(); ++i_col)
        }// end for (int i_row = 0; i_row < table.getHeight(); ++i_row)

        return Optional.of(out);
      }
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
