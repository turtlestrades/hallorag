package com.hallorag;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import com.hallorag.config.RagProperties;

@SpringBootApplication
@EnableConfigurationProperties(RagProperties.class)
public class HalloragApplication {

    public static void main(String[] args) {
        SpringApplication.run(HalloragApplication.class, args);
    }
}

