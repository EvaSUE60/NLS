// src/app/api/health/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectDB, getConnectionStatus, healthCheck } from "@/src/lib/mongodb";
import { env } from "@/src/config/env";
import mongoose from "mongoose";

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // Get the request's user agent for logging
    const userAgent = request.headers.get('user-agent') || 'unknown';
    
    console.log(`🩺 Health check requested from: ${userAgent}`);

    // Check MongoDB connection
    let dbStatus = {
      connected: false,
      state: 'disconnected',
      host: 'unknown',
      database: 'unknown',
      poolSize: 0,
      maxPoolSize: 0,
      message: '',
    };

    let dbHealth = null;

    try {
      // Try to connect and get status
      await connectDB();
      dbHealth = await healthCheck();
      
      if (dbHealth.healthy) {
        const status = getConnectionStatus();
        dbStatus = {
          connected: status.isConnected,
          state: status.stateText,
          host: status.host || 'unknown',
          database: status.name || 'unknown',
          poolSize: status.poolSize || 0,
          maxPoolSize: status.maxPoolSize || 10,
          message: 'Connected',
        };
      } else {
        dbStatus = {
          connected: false,
          state: 'error',
          host: 'unknown',
          database: 'unknown',
          poolSize: 0,
          maxPoolSize: 10,
          message: dbHealth.message || 'Connection failed',
        };
      }
    } catch (error) {
      console.error('❌ Database health check failed:', error);
      dbStatus = {
        connected: false,
        state: 'error',
        host: 'unknown',
        database: 'unknown',
        poolSize: 0,
        maxPoolSize: 10,
        message: error instanceof Error ? error.message : 'Unknown database error',
      };
    }

    const endTime = Date.now();
    const responseTime = endTime - startTime;

    // Build response
    const isHealthy = dbStatus.connected;

    const response = {
      success: true,
      timestamp: new Date().toISOString(),
      status: isHealthy ? 'healthy' : 'unhealthy',
      responseTime: `${responseTime}ms`,
      environment: env.nodeEnv,
      
      services: {
        database: {
          status: isHealthy ? 'operational' : 'degraded',
          ...dbStatus,
        },
        api: {
          status: 'operational',
          version: '1.0.0',
          uptime: process.uptime(),
        },
      },
      
      // Additional system info (optional)
      system: {
        memory: process.memoryUsage(),
        nodeVersion: process.version,
        platform: process.platform,
      },
    };

    // Return 200 if healthy, 503 if unhealthy
    const statusCode = isHealthy ? 200 : 503;
    
    return NextResponse.json(response, { status: statusCode });

  } catch (error) {
    console.error('❌ Health check error:', error);
    
    return NextResponse.json(
      {
        success: false,
        timestamp: new Date().toISOString(),
        status: 'error',
        error: error instanceof Error ? error.message : 'Health check failed',
        responseTime: `${Date.now() - startTime}ms`,
      },
      { status: 500 }
    );
  }
}

// OPTIONS handler for CORS if needed
export async function OPTIONS() {
  return NextResponse.json(
    {},
    {
      headers: {
        'Allow': 'GET, OPTIONS',
      },
    }
  );
}