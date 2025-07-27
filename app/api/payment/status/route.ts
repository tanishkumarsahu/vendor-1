import { NextRequest, NextResponse } from 'next/server';
import { mongoClient } from '@/lib/mongodb-client';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const paymentRequestId = searchParams.get('payment_request_id');
    const orderId = searchParams.get('order_id');

    if (!paymentRequestId && !orderId) {
      return NextResponse.json({ error: 'Payment request ID or order ID is required' }, { status: 400 });
    }

    let transaction;
    if (paymentRequestId) {
      transaction = await mongoClient.from('transactions').select().eq('paymentRequestId', paymentRequestId);
    } else if (orderId) {
      transaction = await mongoClient.from('transactions').select().eq('orderId', orderId);
    }

    if (!transaction) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    }

    const order = await mongoClient.from('orders').select().eq('_id', transaction.orderId);

    return NextResponse.json({
      success: true,
      transaction: {
        id: transaction._id,
        paymentRequestId: transaction.paymentRequestId,
        amount: transaction.amount,
        fees: transaction.fees,
        commission: transaction.commission,
        status: transaction.status,
        buyerName: transaction.buyerName,
        buyerEmail: transaction.buyerEmail,
        buyerPhone: transaction.buyerPhone,
        createdAt: transaction.createdAt,
        updatedAt: transaction.updatedAt,
      },
      order: order ? {
        id: order._id,
        status: order.status,
        paymentStatus: order.paymentStatus,
        totalAmount: order.totalAmount,
        items: order.items,
        vendor: order.vendorId,
        supplier: order.supplierId,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
      } : null,
    });
  } catch (error: any) {
    console.error('Payment status error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 