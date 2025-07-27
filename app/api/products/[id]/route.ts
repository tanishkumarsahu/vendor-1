import { NextRequest, NextResponse } from 'next/server';
import { mongoClient } from '@/lib/mongodb-client';
import jwt from 'jsonwebtoken';

// GET - Get a single product by ID
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const product = await mongoClient.from('products').select().eq('_id', params.id);

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      product,
    });
  } catch (error: any) {
    console.error('Get product error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 