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
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as any;

    const vendorProfile = await mongoClient.from('vendor_profiles').select().eq('userId', decoded.userId);
    if (!vendorProfile) {
      return NextResponse.json({ error: 'Vendor profile not found' }, { status: 404 });
    }

    const body = await request.json();

    const supplierProfile = await mongoClient.from('supplier_profiles').select().eq('_id', body.supplierId);
    if (!supplierProfile) {
      return NextResponse.json({ error: 'Supplier not found' }, { status: 404 });
    }

    const order = await mongoClient.withTransaction(async (session) => {
      const newOrder = await mongoClient.from('orders').insert({
        vendorId: vendorProfile._id,
        supplierId: supplierProfile._id,
        items: body.items,
        totalAmount: body.totalAmount,
        status: 'pending',
        paymentStatus: 'pending',
        shippingAddress: body.shippingAddress,
        deliveryCharges: body.deliveryCharges || 0,
        commission: body.commission || 0,
      }, { session });

      await mongoClient.from('vendor_profiles').update({ totalOrders: vendorProfile.totalOrders + 1 }).eq('_id', vendorProfile._id, { session });

      return newOrder;
    });

    return NextResponse.json({ success: true, order });
  } catch (error: any) {
    console.error('Create order error:', error);

    if (error.name === 'JsonWebTokenError') {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    if (error.name === 'ValidationError') {
      return NextResponse.json({ error: 'Validation failed', details: error.message }, { status: 400 });
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 