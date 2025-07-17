package com.example.hello;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import java.util.Map;

@RestController
public class GoodbyeController {

    @GetMapping("/api/v1/goodbye")
    public Map<String, String> sayGoodbye() {
        return Map.of("message", "Goodbye World!");
    }
}
