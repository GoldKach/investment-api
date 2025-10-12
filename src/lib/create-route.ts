import type { RouteConfig } from "@asteasolutions/zod-to-openapi";
import { RouteParameter } from "@asteasolutions/zod-to-openapi/dist/openapi-registry";
import type { z } from "zod";

interface CreateRouteInput {
  method: "get" | "post" | "put" | "patch" | "delete";
  path: string;
  tags?: string[];
  summary?: string;
  description?: string;
  request?: {
    params?: RouteParameter;
    body?: {
      content: {
        "application/json": {
          schema: z.ZodType<any>;
        };
      };
      description?: string;
    };
    query?: RouteParameter;
  };
  responses: {
    [statusCode: number]: {
      description: string;
      content?: {
        "application/json": {
          schema: z.ZodType<any>;
        };
      };
    };
  };
}

export function createRoute(config: CreateRouteInput): RouteConfig {
  // Convert our simple config to RouteConfig format
  const responses: { [statusCode: string]: any } = {};

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
                    schema:
                      config.request.body.content["application/json"].schema,
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
