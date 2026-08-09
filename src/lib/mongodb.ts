// src/lib/mongodb.ts (updated with connection pooling)
import mongoose from "mongoose";
import { env } from "@/src/config/env";

let isConnected = false;
let connectionPromise: Promise<typeof mongoose> | null = null;

export async function connectDB() {
  if (isConnected && mongoose.connection.readyState === 1) {
    console.log('📊 Using existing MongoDB connection');
    return mongoose.connection;
  }

  if (connectionPromise) {
    console.log('⏳ Waiting for existing connection promise...');
    return connectionPromise;
  }

  try {
    console.log('🔄 Creating new MongoDB connection...');
    
    // ✅ Add connection pooling options
    connectionPromise = mongoose.connect(env.mongodbUri, {
      // Connection pool settings
      maxPoolSize: 10,           // Maximum number of connections in the pool
      minPoolSize: 2,            // Minimum number of connections in the pool
      maxIdleTimeMS: 30000,      // Close idle connections after 30 seconds
      
      // Timeout settings
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 10000,
      
      // Keep connection alive
      heartbeatFrequencyMS: 10000,
      
      // Retry logic
      retryWrites: true,
      retryReads: true,
    });

    const connection = await connectionPromise;
    isConnected = true;
    connectionPromise = null;

    console.log(`✅ MongoDB connected successfully (Pool Size: 10)`);

    // Handle connection events
    mongoose.connection.on("error", (err) => {
      console.error("❌ MongoDB connection error:", err);
      isConnected = false;
    });

    mongoose.connection.on("disconnected", () => {
      console.warn("⚠️ MongoDB disconnected");
      isConnected = false;
    });

    mongoose.connection.on("reconnected", () => {
      console.log("🔄 MongoDB reconnected");
      isConnected = true;
    });

    // Log connection pool status periodically (for debugging)
    if (process.env.NODE_ENV === 'development') {
      setInterval(() => {
        const poolSize = (mongoose.connection as any)?.base?.connections?.[0]?.pool?.size || 0;
        const readyState = mongoose.connection.readyState;
        const stateText = ['disconnected', 'connected', 'connecting', 'disconnecting'][readyState] || 'unknown';
        console.log(`📊 Connection Pool: size=${poolSize}, state=${stateText}`);
      }, 60000); // Every minute
    }

    return connection;
  } catch (error) {
    connectionPromise = null;
    console.error("❌ MongoDB connection failed:", error);
    throw error;
  }
}

// Graceful shutdown
export async function disconnectDB() {
  if (isConnected && mongoose.connection.readyState === 1) {
    try {
      await mongoose.disconnect();
      isConnected = false;
      console.log("✅ MongoDB disconnected gracefully");
    } catch (error) {
      console.error("❌ Error disconnecting MongoDB:", error);
    }
  }
}

// Check connection status
export function getConnectionStatus() {
  const readyState = mongoose.connection.readyState;
  const stateText = ['disconnected', 'connected', 'connecting', 'disconnecting'][readyState] || 'unknown';
  
  // Get pool size if available
  let poolSize = 0;
  try {
    poolSize = (mongoose.connection as any)?.base?.connections?.[0]?.pool?.size || 0;
  } catch (e) {
    // Ignore
  }
  
  return {
    isConnected: isConnected && readyState === 1,
    readyState,
    stateText,
    host: mongoose.connection.host,
    name: mongoose.connection.name,
    poolSize,
    maxPoolSize: 10,
  };
}

// Force close all connections (use with caution)
export async function forceCloseConnections() {
  try {
    await mongoose.disconnect();
    isConnected = false;
    console.log("🔒 All MongoDB connections closed forcibly");
  } catch (error) {
    console.error("❌ Error force closing connections:", error);
    throw error;
  }
}

// Health check endpoint helper
export async function healthCheck() {
  try {
    const status = getConnectionStatus();
    if (!status.isConnected) {
      // Try to reconnect
      await connectDB();
      const newStatus = getConnectionStatus();
      return {
        healthy: newStatus.isConnected,
        status: newStatus,
        message: newStatus.isConnected ? 'Connected' : 'Failed to reconnect',
      };
    }
    return {
      healthy: true,
      status,
      message: 'Connected',
    };
  } catch (error) {
    return {
      healthy: false,
      status: null,
      message: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}