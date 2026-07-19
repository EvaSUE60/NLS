// src/lib/auth/middleware.ts
import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "./jwt";
import { connectDB } from "../mongodb";
import User from "@/src/models/User";

// Extend NextRequest to include user
interface AuthenticatedRequest extends NextRequest {
  user: {
    user_id: string;
    email: string;
    role: string;
    name: string;
  };
}

export async function authMiddleware(request: NextRequest): Promise<NextResponse | null> {
  try {
    // Get token from Authorization header
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { success: false, error: "No token provided" },
        { status: 401 }
      );
    }

    const token = authHeader.split(" ")[1];
    
    // Verify token
    const decoded = verifyToken(token);
    
    // Check if user exists and is active
    await connectDB();
    const user = await User.findOne({ 
      user_id: decoded.user_id,
      is_active: true 
    }).select("+refresh_token");

    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found or inactive" },
        { status: 401 }
      );
    }

    // Add user to request context
    (request as AuthenticatedRequest).user = {
      user_id: user.user_id,
      email: user.email,
      role: user.role,
      name: user.name,
    };

    return null; // Continue to next middleware/route
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid or expired token" },
      { status: 401 }
    );
  }
}

// Role-based middleware
export function requireRole(roles: string[]) {
  return async (request: NextRequest): Promise<NextResponse | null> => {
    const authResult = await authMiddleware(request);
    if (authResult) return authResult;

    const user = (request as AuthenticatedRequest).user;
    if (!user || !roles.includes(user.role)) {
      return NextResponse.json(
        { success: false, error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    return null;
  };
}