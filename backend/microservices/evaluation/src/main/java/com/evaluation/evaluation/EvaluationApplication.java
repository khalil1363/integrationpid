package com.evaluation.evaluation;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.client.discovery.EnableDiscoveryClient;

@SpringBootApplication
@EnableDiscoveryClient
public class EvaluationApplication {

	public static void main(String[] args) {
		SpringApplication.run(EvaluationApplication.class, args);
	}

	// CORS is handled only at the gateway (8080). Do not add CORS here when behind the gateway,
	// or the response would have duplicate Access-Control-Allow-Origin headers.
}
