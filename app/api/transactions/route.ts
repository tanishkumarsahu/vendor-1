import { NextRequest, NextResponse } from 'next/server';
import { mongoClient } from '@/lib/mongodb-client';
import jwt from 'jsonwebtoken';

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');

    const body = await request.json();

    const order = await mongoClient.from('orders').select().eq('_id', body.orderId);
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const transaction = await mongoClient.withTransaction(async (session) => {
      const newTransaction = await mongoClient.from('transactions').insert({
        orderId: order._id,
        paymentRequestId: body.paymentRequestId,
        amount: body.amount,
        fees: body.fees,
        commission: body.commission,
        status: 'pending',
        buyerName: body.buyerName,
        buyerEmail: body.buyerEmail,
        buyerPhone: body.buyerPhone,
        instamojoResponse: body.instamojoResponse,
      }, { session });

      await mongoClient.from('orders').update({ paymentId: body.paymentRequestId, paymentStatus: 'pending' }).eq('_id', order._id, { session });

      return newTransaction;
    });

    return NextResponse.json({ success: true, transaction });
  } catch (error: any) {
    console.error('Create transaction error:', error);

    if (error.name === 'JsonWebTokenError') {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    if (error.name === 'ValidationError') {
      return NextResponse.json({ error: 'Validation failed', details: error.message }, { status: 400 });
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 