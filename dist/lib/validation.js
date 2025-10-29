import { z } from "zod";
export const validateRequest = (schema) => {
    return (req, res, next) => {
        try {
            if (schema.body && req.body) {
                req.body = schema.body.parse(req.body);
            }
            if (schema.params && req.params) {
                req.params = schema.params.parse(req.params);
            }
            if (schema.query && req.query) {
                req.query = schema.query.parse(req.query);
            }
            next();
        }
        catch (error) {
            if (error instanceof z.ZodError) {
                return res.status(422).json({
                    error: "Validation failed",
                    details: error.errors,
                });
            }
            next(error);
        }
    };
};
