package com.newtab.newtab.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import javax.sql.DataSource;
import java.sql.Connection;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/health")
@Tag(name = "Health", description = "Service health check endpoints for monitoring and orchestration")
public class HealthController {

    private final DataSource dataSource;

    public HealthController(DataSource dataSource) {
        this.dataSource = dataSource;
    }

    @GetMapping
    @Operation(
            summary = "Health check",
            description = "Checks overall service health including database connectivity. Returns UP if all dependencies are healthy, DOWN otherwise."
    )
    @ApiResponses(value = {
            @ApiResponse(
                    responseCode = "200",
                    description = "Service is healthy",
                    content = @Content(schema = @Schema(implementation = HealthResponse.class))
            ),
            @ApiResponse(
                    responseCode = "503",
                    description = "Service is unhealthy",
                    content = @Content(schema = @Schema(implementation = HealthResponse.class))
            )
    })
    public ResponseEntity<HealthResponse> health() {
        boolean dbHealthy = checkDatabase();
        HealthResponse response = new HealthResponse(
                dbHealthy ? "UP" : "DOWN",
                "newtab-service",
                dbHealthy ? "UP" : "DOWN"
        );
        return dbHealthy ? ResponseEntity.ok(response) : ResponseEntity.status(503).body(response);
    }

    @GetMapping("/liveness")
    @Operation(
            summary = "Liveness probe",
            description = "Checks if service is running. Lightweight endpoint suitable for Kubernetes liveness probes. Does not check dependencies."
    )
    @ApiResponses(value = {
            @ApiResponse(
                    responseCode = "200",
                    description = "Service is running",
                    content = @Content(schema = @Schema(implementation = LivenessResponse.class))
            )
    })
    public ResponseEntity<LivenessResponse> liveness() {
        LivenessResponse response = new LivenessResponse("UP", "newtab-service");
        return ResponseEntity.ok(response);
    }

    @GetMapping("/readiness")
    @Operation(
            summary = "Readiness probe",
            description = "Checks if the service is ready to handle requests. Verifies database connectivity. Suitable for Kubernetes readiness probes."
    )
    @ApiResponses(value = {
            @ApiResponse(
                    responseCode = "200",
                    description = "Service is ready",
                    content = @Content(schema = @Schema(implementation = HealthResponse.class))
            ),
            @ApiResponse(
                    responseCode = "503",
                    description = "Service is not ready",
                    content = @Content(schema = @Schema(implementation = HealthResponse.class))
            )
    })
    public ResponseEntity<HealthResponse> readiness() {
        boolean dbReady = checkDatabase();
        HealthResponse response = new HealthResponse(
                dbReady ? "UP" : "DOWN",
                "newtab-service",
                dbReady ? "UP" : "DOWN"
        );
        return dbReady ? ResponseEntity.ok(response) : ResponseEntity.status(503).body(response);
    }

    private boolean checkDatabase() {
        try (Connection connection = dataSource.getConnection()) {
            return connection.isValid(2);
        } catch (Exception e) {
            return false;
        }
    }

    @Schema(description = "Health check response with database status")
    public record HealthResponse(
            @Schema(description = "Overall status of service", example = "UP")
            String status,
            @Schema(description = "Name of the service", example = "newtab-service")
            String service,
            @Schema(description = "Database connectivity status", example = "UP")
            String database
    ) {}

    @Schema(description = "Liveness check response")
    public record LivenessResponse(
            @Schema(description = "Liveness status", example = "UP")
            String status,
            @Schema(description = "Name of the service", example = "newtab-service")
            String service
    ) {}
}
