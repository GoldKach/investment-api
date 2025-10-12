import type { Request, Response, NextFunction } from "express";
import type { z } from "zod";
import { StatusCodes } from "http-status-codes";
import { RouteConfig } from "@asteasolutions/zod-to-openapi";

export interface AppRequest extends Request {
  user?: any;
}

export interface AppResponse extends Response {}

export type AppHandler = (
  req: AppRequest,
  res: AppResponse,
  next: NextFunction
) => Promise<any> | any;

// OpenAPI route definition type - Using proper HTTP status codes
// export interface OpenAPIRoute {
//   method: "get" | "post" | "put" | "patch" | "delete";
//   path: string;
//   tags: string[];
//   summary?: string;
//   description?: string;
//   request?: {
//     params?: z.ZodType<any>;
//     body?: {
//       content: {
//         "application/json": {
//           schema: z.ZodType<any>;
//         };
//       };
//       description?: string;
//     };
//     query?: z.ZodType<any>;
//   };
//   responses: {
//     [K in StatusCodes]?: {
//       description: string;
//       content?: {
//         "application/json": {
//           schema: z.ZodType<any>;
//         };
//       };
//     };
//   };
// }
export type OpenAPIRoute = RouteConfig;
