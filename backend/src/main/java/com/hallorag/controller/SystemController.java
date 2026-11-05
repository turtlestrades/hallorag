package com.hallorag.controller;

import com.hallorag.model.SystemStatus;
import com.hallorag.service.SystemHealthService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/system")
public class SystemController {

    private final SystemHealthService healthService;

    public SystemController(SystemHealthService healthService) {
        this.healthService = healthService;
    }

    @GetMapping("/status")
    public ResponseEntity<SystemStatus> getStatus() {
        return ResponseEntity.ok(healthService.getStatus());
    }
}

