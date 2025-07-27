import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';

export async function GET() {
  let dbStatus = false;
  try {
    await connectToDatabase();
    dbStatus = true;
  } catch (error) {
    console.error('Database connection check failed:', error);
    dbStatus = false;
  }

  try {
    return NextResponse.json({
      status: dbStatus ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      service: 'VendorMitra API',
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      features: {
        authentication: true,
        payment: true,
        analytics: true,
        groupOrders: true,
        database: dbStatus,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: 'error',
        timestamp: new Date().toISOString(),
        error: 'Service unavailable',
      },
      { status: 500 }
    );
  }
} 