import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase, Transaction, Order, SupplierProfile, Notification } from '@/lib/mongodb';
import { instamojoService } from '@/lib/instamojo';

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();
    const body = await request.json();
    
    // Verify webhook signature
    const signature = request.headers.get('X-Instamojo-Signature');
    if (!signature) {
      return NextResponse.json(
        { error: 'Missing signature' },
        { status: 400 }
      );
    }
    
    const isValidSignature = instamojoService.verifyWebhookSignature(body, signature);
    if (!isValidSignature) {
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      );
    }
    
    const { payment_id, payment_request_id, status } = body;
    
    // Find transaction
    const transaction = await Transaction.findOne({ paymentRequestId: payment_request_id });
    if (!transaction) {
      return NextResponse.json(
        { error: 'Transaction not found' },
        { status: 404 }
      );
    }
    
    // Update transaction status
    transaction.status = status;
    transaction.instamojoResponse = body;
    transaction.updatedAt = new Date();
    await transaction.save();
    
    // Update order status
    const order = await Order.findById(transaction.orderId);
    if (order) {
      if (status === 'success') {
        order.paymentStatus = 'paid';
        order.status = 'confirmed';
      } else if (status === 'failed') {
        order.paymentStatus = 'failed';
      }
      order.updatedAt = new Date();
      await order.save();
      
      // Send notification to supplier for successful payment
      if (status === 'success') {
        const notification = new Notification({
          userId: order.supplierId,
          title: 'Payment Received',
          message: `Payment of ₹${transaction.amount} received for order #${order._id}`,
          type: 'payment',
          data: {
            orderId: order._id,
            amount: transaction.amount,
            paymentId: payment_id,
          },
        });
        await notification.save();
      }
    }
    
    return NextResponse.json({ success: true });
    
  } catch (error: any) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  // Webhook verification endpoint
  return NextResponse.json({ status: 'Webhook endpoint active' });
}
