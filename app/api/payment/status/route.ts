import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase, Transaction, Order } from '@/lib/mongodb';

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    
    const { searchParams } = new URL(request.url);
    const paymentRequestId = searchParams.get('payment_request_id');
    const orderId = searchParams.get('order_id');
    
    if (!paymentRequestId && !orderId) {
      return NextResponse.json(
        { error: 'Payment request ID or order ID is required' },
        { status: 400 }
      );
    }
    
    let transaction;
    if (paymentRequestId) {
      transaction = await Transaction.findOne({ paymentRequestId });
    } else if (orderId) {
      transaction = await Transaction.findOne({ orderId });
    }
    
    if (!transaction) {
      return NextResponse.json(
        { error: 'Transaction not found' },
        { status: 404 }
      );
    }
    
    // Get order details
    const order = await Order.findById(transaction.orderId)
      .populate('vendorId')
      .populate('supplierId')
      .populate('items.productId');
    
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
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 