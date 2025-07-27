import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase, Order, Transaction, Product, VendorProfile, SupplierProfile } from '@/lib/mongodb';
import { instamojoService } from '@/lib/instamojo';
import jwt from 'jsonwebtoken';

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();
    const body = await request.json();
    
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
    
    // Get order details
    const { orderId, buyerDetails } = body;
    
    if (!orderId || !buyerDetails) {
      return NextResponse.json(
        { error: 'Order ID and buyer details are required' },
        { status: 400 }
      );
    }
    
    // Get order with populated data
    const order = await Order.findById(orderId)
      .populate('vendorId')
      .populate('supplierId')
      .populate('items.productId');
    
    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }
    
    // Verify the user is the order owner
    if (order.vendorId.userId.toString() !== decoded.userId) {
      return NextResponse.json(
        { error: 'Unauthorized access to order' },
        { status: 403 }
      );
    }
    
    // Calculate total amount including fees and commission
    const totalAmount = order.totalAmount;
    const fees = instamojoService.calculateFees(totalAmount);
    const commission = instamojoService.calculateCommission(totalAmount);
    const finalAmount = totalAmount + fees;
    
    // Create payment request with Instamojo
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
      return NextResponse.json(
        { error: 'Failed to create payment request' },
        { status: 500 }
      );
    }
    
    // Create transaction record
    const transaction = new Transaction({
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
    });
    
    await transaction.save();
    
    // Update order with payment information
    order.paymentId = paymentRequest.payment_request_id;
    order.paymentStatus = 'pending';
    await order.save();
    
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
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 