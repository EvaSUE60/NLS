// src/lib/auth/jwt.ts
import jwt from "jsonwebtoken";
import { env } from "@/src/config/env";

export interface TokenPayload {
  user_id: string;
  email: string;
  role: string;
}

export function generateAccessToken(user: TokenPayload): string {
  return jwt.sign(
    {
      user_id: user.user_id,
      email: user.email,
      role: user.role,
    },
    env.jwtSecret,
    { expiresIn: "7d" } // Use string literal directly
  );
}

export function generateRefreshToken(user: TokenPayload): string {
  return jwt.sign(
    {
      user_id: user.user_id,
    },
    env.jwtSecret,
    { expiresIn: "30d" } // Use string literal directly
  );
}

export function verifyToken(token: string): TokenPayload {
  return jwt.verify(token, env.jwtSecret) as TokenPayload;
}

export function generateUserId(): string {
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, "0");
  return `USR-${year}-${random}`;
}