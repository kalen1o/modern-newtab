package com.newtab.auth.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import io.swagger.v3.oas.models.servers.Server;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI authMicroserviceOpenAPI() {
        SecurityScheme securityScheme = new io.swagger.v3.oas.models.security.SecurityScheme()
                .type(SecurityScheme.Type.HTTP)
                .scheme("bearer")
                .bearerFormat("JWT")
                .in(SecurityScheme.In.HEADER)
                .name("Authorization");

        final String securitySchemeName = "bearerAuth";

        Server localServer = new Server();
        localServer.setUrl("http://localhost:8081");
        localServer.setDescription("Local server");

        Contact contact = new Contact();
        contact.setName("NewTab Team");
        contact.setEmail("info@newtab.com");

        Info info = new Info()
                .title("Auth Service API")
                .version("1.0")
                .contact(contact)
                .description(
                        "Authentication service for NewTab application. Provides user registration, login, guest token generation, and JWT token management.")
                .termsOfService("http://newtab.com/terms");

        return new OpenAPI()
                .info(info)
                .servers(List.of(localServer))
                .addSecurityItem(new SecurityRequirement().addList(securitySchemeName))
                .components(new io.swagger.v3.oas.models.Components()
                        .addSecuritySchemes(securitySchemeName, securityScheme));
    }
}
