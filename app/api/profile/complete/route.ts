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

    const body = await request.json();

    await mongoClient.withTransaction(async (session) => {
      const user = await mongoClient.from('users').select().eq('_id', decoded.userId);
      if (!user) {
        throw new Error('User not found');
      }

      await mongoClient.from('users').update({ role: body.role }).eq('_id', user._id, { session });

      let profile = await mongoClient.from('profiles').select().eq('userId', user._id);
      const profileData = {
        phone: body.phone,
        address: {
          street: body.street,
          city: body.city,
          state: body.state,
          pincode: body.pincode,
          country: 'India',
        },
      };

      if (!profile) {
        await mongoClient.from('profiles').insert({ userId: user._id, firstName: user.email.split('@')[0], lastName: '', ...profileData }, { session });
      } else {
        await mongoClient.from('profiles').update(profileData).eq('userId', user._id, { session });
      }

      const roleProfileData = {
        businessName: body.businessName,
        businessType: body.businessType,
        gstNumber: body.gstNumber,
        panNumber: body.panNumber,
        address: {
          street: body.street,
          city: body.city,
          state: body.state,
          pincode: body.pincode,
          country: 'India',
        },
        phone: body.phone,
      };

      if (body.role === 'vendor') {
        let vendorProfile = await mongoClient.from('vendor_profiles').select().eq('userId', user._id);
        if (!vendorProfile) {
          await mongoClient.from('vendor_profiles').insert({ userId: user._id, verificationStatus: false, rating: 0, totalOrders: 0, ...roleProfileData }, { session });
        } else {
          await mongoClient.from('vendor_profiles').update(roleProfileData).eq('userId', user._id, { session });
        }
      } else if (body.role === 'supplier') {
        let supplierProfile = await mongoClient.from('supplier_profiles').select().eq('userId', user._id);
        if (!supplierProfile) {
          await mongoClient.from('supplier_profiles').insert({ userId: user._id, verificationStatus: false, rating: 0, totalProducts: 0, totalRevenue: 0, ...roleProfileData }, { session });
        } else {
          await mongoClient.from('supplier_profiles').update(roleProfileData).eq('userId', user._id, { session });
        }
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Profile completed successfully',
      user: {
        id: decoded.userId,
        email: body.email, // Assuming email is part of the body or can be retrieved from decoded token
        role: body.role,
        emailVerified: true, // Assuming email is verified after profile completion
      },
    });
  } catch (error: any) {
    console.error('Profile completion error:', error);

    if (error.name === 'JsonWebTokenError') {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    if (error.name === 'ValidationError' || error.message === 'User not found') {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 