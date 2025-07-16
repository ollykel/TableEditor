package com.example.hello;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import java.util.Map;

@RestController
public class HelloController {

    @GetMapping("/api/v1/hello")
    public Map<String, String> sayHello() {
        return Map.of("message", "Hello World");
    }
}

