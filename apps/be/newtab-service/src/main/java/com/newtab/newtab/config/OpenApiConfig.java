package com.newtab.newtab.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.servers.Server;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI newtabMicroserviceOpenAPI() {
        Server localServer = new Server();
        localServer.setUrl("http://localhost:8082");
        localServer.setDescription("Local server");

        Contact contact = new Contact();
        contact.setName("NewTab Team");
        contact.setEmail("info@newtab.com");

        Info info = new Info()
                .title("NewTab Service API")
                .version("1.0")
                .contact(contact)
                .description(
                        "Main NewTab service for search history, sponsors, and news articles management. Provides CRUD operations for search history, sponsor rotation, news caching, and user preferences.")
                .termsOfService("http://newtab.com/terms");

        return new OpenAPI()
                .info(info)
                .servers(List.of(localServer));
    }
}
