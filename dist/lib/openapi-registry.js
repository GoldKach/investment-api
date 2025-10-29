import { OpenAPIConfig } from "./openapi-config";
// Simple registry to collect all OpenAPI routes
const openAPIRoutes = [];
export function registerOpenAPIRoutes(routes) {
    openAPIRoutes.push(...routes);
}
export function generateOpenAPIDocument() {
    const openapi = new OpenAPIConfig();
    // Register all collected routes
    openAPIRoutes.forEach((route) => {
        openapi.registerPath(route);
    });
    return openapi.generateDocument({
        title: "Products API",
        version: "1.0.0",
        description: "A REST API for managing products",
    });
}
