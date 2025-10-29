import { OpenAPIRegistry, OpenApiGeneratorV3, extendZodWithOpenApi, } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";
// Extend Zod with OpenAPI
extendZodWithOpenApi(z);
export class OpenAPIConfig {
    registry;
    constructor() {
        this.registry = new OpenAPIRegistry();
    }
    // CHANGED: Use RouteConfig type directly
    registerPath(pathConfig) {
        this.registry.registerPath(pathConfig);
    }
    registerComponent(name, schema) {
        this.registry.register(name, schema);
    }
    generateDocument(info) {
        const generator = new OpenApiGeneratorV3(this.registry.definitions);
        return generator.generateDocument({
            openapi: "3.0.0",
            info,
            servers: [
                {
                    url: "http://localhost:5000",
                    description: "Development server",
                },
            ],
        });
    }
}
