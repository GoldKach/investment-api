import {
  OpenAPIRegistry,
  OpenApiGeneratorV3,
  extendZodWithOpenApi,
  type RouteConfig, // <-- ADDED this import
} from "@asteasolutions/zod-to-openapi";
import type { OpenAPIObject } from "openapi3-ts/oas30";
import { z } from "zod";

// Extend Zod with OpenAPI
extendZodWithOpenApi(z);

export class OpenAPIConfig {
  private registry: OpenAPIRegistry;

  constructor() {
    this.registry = new OpenAPIRegistry();
  }

  // CHANGED: Use RouteConfig type directly
  registerPath(pathConfig: RouteConfig) {
    this.registry.registerPath(pathConfig);
  }

  registerComponent(name: string, schema: z.ZodType<any>) {
    this.registry.register(name, schema);
  }

  generateDocument(info: {
    title: string;
    version: string;
    description?: string;
  }): OpenAPIObject {
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
