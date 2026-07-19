// src/lib/mongodb.ts (updated)
import mongoose from "mongoose";
import { env } from "@/src/config/env";

let isConnected = false;
let connectionPromise: Promise<typeof mongoose> | null = null;

export async function connectDB() {
  if (isConnected) {
    return mongoose.connection;
  }

  if (connectionPromise) {
    return connectionPromise;
  }

  try {
    connectionPromise = mongoose.connect(env.mongodbUri, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    const connection = await connectionPromise;
    isConnected = true;
    connectionPromise = null;

    console.log("✅ MongoDB connected successfully");

    // Handle connection events
    mongoose.connection.on("error", (err) => {
      console.error("MongoDB connection error:", err);
      isConnected = false;
    });

    mongoose.connection.on("disconnected", () => {
      console.warn("MongoDB disconnected");
      isConnected = false;
    });

    return connection;
  } catch (error) {
    connectionPromise = null;
    console.error("❌ MongoDB connection failed:", error);
    throw error;
  }
}

// Graceful shutdown
export async function disconnectDB() {
  if (isConnected) {
    await mongoose.disconnect();
    isConnected = false;
    console.log("MongoDB disconnected");
  }
}

// Check connection status
export function getConnectionStatus() {
  return {
    isConnected,
    readyState: mongoose.connection.readyState,
    host: mongoose.connection.host,
    name: mongoose.connection.name,
  };
}