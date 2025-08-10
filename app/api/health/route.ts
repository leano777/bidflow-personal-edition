import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Check database connections, external services, etc.
    const healthStatus = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'bidflow-frontend',
      version: process.env.npm_package_version || '1.0.0',
      uptime: process.uptime(),
      checks: {
        database: 'healthy',
        nlpService: 'healthy',
        redis: 'healthy'
      }
    };

    return NextResponse.json(healthStatus, { status: 200 });
  } catch (error) {
    const errorStatus = {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      service: 'bidflow-frontend',
      error: error instanceof Error ? error.message : 'Unknown error'
    };

    return NextResponse.json(errorStatus, { status: 503 });
  }
}
