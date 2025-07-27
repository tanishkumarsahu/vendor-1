import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase, Transaction, Order } from '@/lib/mongodb';
import jwt from 'jsonwebtoken';

// POST - Create a new transaction
export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();
    
    // Verify authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as any;
    
    const body = await request.json();
    
    // Verify order exists
    const order = await Order.findById(body.orderId);
    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }
    
    // Create new transaction
    const transaction = new Transaction({
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
    });
    
    await transaction.save();
    
    // Update order with payment ID
    order.paymentId = body.paymentRequestId;
    order.paymentStatus = 'pending';
    await order.save();
    
    return NextResponse.json({
      success: true,
      transaction,
    });
    
  } catch (error: any) {
    console.error('Create transaction error:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }
    
    if (error.name === 'ValidationError') {
      return NextResponse.json(
        { error: 'Validation failed', details: error.message },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 