package com.springboot.MyTodoList.controller;

import java.sql.Connection;
import java.sql.Statement;
import javax.sql.DataSource;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class DbPingController {

    private final DataSource dataSource;

    public DbPingController(DataSource dataSource) {
        this.dataSource = dataSource;
    }

    @GetMapping("/ping-db")
    public String ping() throws Exception {
        try (Connection connection = dataSource.getConnection();
             Statement statement = connection.createStatement()) {
            statement.execute("select 1 from dual");
            return "db connected";
        }
    }
}
