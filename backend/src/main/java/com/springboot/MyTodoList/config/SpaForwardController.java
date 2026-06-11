package com.springboot.MyTodoList.config;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;

@Controller
public class SpaForwardController {
    @RequestMapping(value = {"/login", "/admin", "/me", "/admin/**", "/me/**"})
    public String forward() {
        return "forward:/index.html";
    }
}
