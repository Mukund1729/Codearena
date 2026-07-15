package com.codearena.contest;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

@SpringBootApplication
@EnableJpaAuditing
public class ContestServiceApplication {

    public static void main(String[] args) {
        SpringApplication.run(ContestServiceApplication.class, args);
    }
}
