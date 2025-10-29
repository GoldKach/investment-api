// utils/tokens.ts
import jwt from "jsonwebtoken";
const ACCESS_TOKEN_OPTIONS = {
    expiresIn: "60m", // 15 minutes
};
const REFRESH_TOKEN_OPTIONS = {
    expiresIn: "30d", // 7 days
};
export function generateAccessToken(payload) {
    const secret = process.env.JWT_SECRET;
    return jwt.sign(payload, secret, ACCESS_TOKEN_OPTIONS);
}
export function generateRefreshToken(payload) {
    const secret = process.env.REFRESH_TOKEN_SECRET;
    return jwt.sign(payload, secret, REFRESH_TOKEN_OPTIONS);
}
export function verifyAccessToken(token) {
    const secret = process.env.JWT_SECRET;
    return jwt.verify(token, secret);
}
export function verifyRefreshToken(token) {
    const secret = process.env.REFRESH_TOKEN_SECRET;
    return jwt.verify(token, secret);
}
