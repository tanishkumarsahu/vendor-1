import { NextRequest, NextResponse } from 'next/server';
import { mongoClient } from '@/lib/mongodb-client';
import { instamojoService } from '@/lib/instamojo';
import jwt from 'jsonwebtoken';

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as any;

    const body = await request.json();
    const { orderId, buyerDetails } = body;

    if (!orderId || !buyerDetails) {
      return NextResponse.json({ error: 'Order ID and buyer details are required' }, { status: 400 });
    }

    const order = await mongoClient.from('orders').select().eq('_id', orderId);

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const vendorProfile = await mongoClient.from('vendor_profiles').select().eq('_id', order.vendorId);
    if (vendorProfile.userId.toString() !== decoded.userId) {
      return NextResponse.json({ error: 'Unauthorized access to order' }, { status: 403 });
    }

    const totalAmount = order.totalAmount;
    const fees = instamojoService.calculateFees(totalAmount);
    const commission = instamojoService.calculateCommission(totalAmount);
    const finalAmount = totalAmount + fees;

    const paymentRequest = await instamojoService.createPaymentRequest({
      amount: finalAmount,
      purpose: `Order #${order._id}`,
      buyer_name: buyerDetails.name,
      email: buyerDetails.email,
      phone: buyerDetails.phone,
      redirect_url: `${process.env.NEXT_PUBLIC_APP_URL}/payment/success`,
      webhook: `${process.env.NEXT_PUBLIC_APP_URL}/api/payment/webhook`,
    });

    if (!paymentRequest.success) {
      return NextResponse.json({ error: 'Failed to create payment request' }, { status: 500 });
    }

    await mongoClient.withTransaction(async (session) => {
      await mongoClient.from('transactions').insert({
        orderId: order._id,
        paymentRequestId: paymentRequest.payment_request_id,
        amount: finalAmount,
        fees,
        commission,
        status: 'pending',
        buyerName: buyerDetails.name,
        buyerEmail: buyerDetails.email,
        buyerPhone: buyerDetails.phone,
        instamojoResponse: paymentRequest,
      }, { session });

      await mongoClient.from('orders').update({ paymentId: paymentRequest.payment_request_id, paymentStatus: 'pending' }).eq('_id', order._id, { session });
    });

    return NextResponse.json({
      success: true,
      paymentUrl: paymentRequest.longurl,
      paymentRequestId: paymentRequest.payment_request_id,
      amount: finalAmount,
      fees,
      commission,
    });
  } catch (error: any) {
    console.error('Payment creation error:', error);

    if (error.name === 'JsonWebTokenError') {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 