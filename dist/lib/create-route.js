export function createRoute(config) {
    // Convert our simple config to RouteConfig format
    const responses = {};
    Object.entries(config.responses).forEach(([statusCode, response]) => {
        responses[statusCode] = {
            description: response.description,
            content: response.content
                ? {
                    "application/json": {
                        schema: response.content["application/json"].schema,
                    },
                }
                : undefined,
        };
    });
    return {
        method: config.method,
        path: config.path,
        tags: config.tags,
        summary: config.summary,
        description: config.description,
        request: config.request
            ? {
                params: config.request.params,
                body: config.request.body
                    ? {
                        content: {
                            "application/json": {
                                schema: config.request.body.content["application/json"].schema,
                            },
                        },
                        description: config.request.body.description,
                    }
                    : undefined,
                query: config.request.query,
            }
            : undefined,
        responses,
    };
}
