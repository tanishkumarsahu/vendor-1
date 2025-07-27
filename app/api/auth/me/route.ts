import { NextRequest, NextResponse } from 'next/server';
import { mongoClient } from '@/lib/mongodb-client';
import jwt from 'jsonwebtoken';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as any;

    const user = await mongoClient.from('users').select('-password').eq('_id', decoded.userId);

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const [profile, roleProfile] = await Promise.all([
      mongoClient.from('profiles').select().eq('userId', user._id),
      user.role === 'vendor'
        ? mongoClient.from('vendor_profiles').select().eq('userId', user._id)
        : mongoClient.from('supplier_profiles').select().eq('userId', user._id),
    ]);

    return NextResponse.json({
      success: true,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        emailVerified: user.emailVerified,
        profile,
        roleProfile,
      },
    });
  } catch (error: any) {
    console.error('Get user error:', error);

    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 