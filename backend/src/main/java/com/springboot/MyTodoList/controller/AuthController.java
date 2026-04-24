package com.springboot.MyTodoList.controller;

import com.springboot.MyTodoList.model.Usuario;
import com.springboot.MyTodoList.service.ToDoItemService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class AuthController {

    @Autowired
    private ToDoItemService toDoItemService;

    @GetMapping(value = "/auth/me")
    public ResponseEntity<Usuario> getCurrentUser(
        @RequestParam(value = "username", defaultValue = "fernanda") String username
    ) {
        Usuario usuario = toDoItemService.getUserProfile(username);
        return new ResponseEntity<>(usuario, HttpStatus.OK);
    }
}
