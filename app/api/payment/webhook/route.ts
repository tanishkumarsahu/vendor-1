import { NextRequest, NextResponse } from 'next/server';
import { mongoClient } from '@/lib/mongodb-client';
import { instamojoService } from '@/lib/instamojo';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const signature = request.headers.get('X-Instamojo-Signature');
    if (!signature) {
      return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
    }
    
    const isValidSignature = instamojoService.verifyWebhookSignature(body, signature);
    if (!isValidSignature) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }
    
    const { payment_id, payment_request_id, status } = body;
    
    const transaction = await mongoClient.from('transactions').select().eq('paymentRequestId', payment_request_id);
    if (!transaction) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    }
    
    await mongoClient.withTransaction(async (session) => {
      await mongoClient.from('transactions').update({
        status: status,
        instamojoResponse: body,
        updatedAt: new Date(),
      }).eq('_id', transaction._id, { session });

      const order = await mongoClient.from('orders').select().eq('_id', transaction.orderId);
      if (order) {
        let orderUpdate: any = { updatedAt: new Date() };
        if (status === 'success') {
          orderUpdate.paymentStatus = 'paid';
          orderUpdate.status = 'confirmed';
        } else if (status === 'failed') {
          orderUpdate.paymentStatus = 'failed';
        }
        await mongoClient.from('orders').update(orderUpdate).eq('_id', order._id, { session });
        
        if (status === 'success') {
          await mongoClient.from('notifications').insert({
            userId: order.supplierId,
            title: 'Payment Received',
            message: `Payment of ₹${transaction.amount} received for order #${order._id}`,
            type: 'payment',
            data: {
              orderId: order._id,
              amount: transaction.amount,
              paymentId: payment_id,
            },
          }, { session });
        }
      }
    });
    
    return NextResponse.json({ success: true });
    
  } catch (error: any) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({ status: 'Webhook endpoint active' });
}
