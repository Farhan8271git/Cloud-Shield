import { sendError } from "../utils/response.js";

const validateRegister = (schema) => {
    return (req, res, next) => {
        try {
            req.body = schema.parse(req.body);
            next();
        } catch (error) {
            return sendError(res, 400, error.errors?.[0].message || "validation failed");
        };
    }
};

export default validateRegister;