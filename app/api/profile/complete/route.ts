import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase, User, Profile, VendorProfile, SupplierProfile } from '@/lib/mongodb';
import jwt from 'jsonwebtoken';

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
    
    // Get user
    const user = await User.findById(decoded.userId);
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    // Update user role
    user.role = body.role;
    await user.save();
    
    // Create or update profile
    let profile = await Profile.findOne({ userId: user._id });
    if (!profile) {
      profile = new Profile({
        userId: user._id,
        firstName: user.email.split('@')[0], // Default to email prefix
        lastName: '',
        phone: body.phone,
        address: {
          street: body.street,
          city: body.city,
          state: body.state,
          pincode: body.pincode,
          country: 'India',
        },
      });
    } else {
      profile.phone = body.phone;
      profile.address = {
        street: body.street,
        city: body.city,
        state: body.state,
        pincode: body.pincode,
        country: 'India',
      };
    }
    await profile.save();
    
    // Create role-specific profile
    if (body.role === 'vendor') {
      let vendorProfile = await VendorProfile.findOne({ userId: user._id });
      if (!vendorProfile) {
        vendorProfile = new VendorProfile({
          userId: user._id,
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
          verificationStatus: false,
          rating: 0,
          totalOrders: 0,
        });
      } else {
        vendorProfile.businessName = body.businessName;
        vendorProfile.businessType = body.businessType;
        vendorProfile.gstNumber = body.gstNumber;
        vendorProfile.panNumber = body.panNumber;
        vendorProfile.address = {
          street: body.street,
          city: body.city,
          state: body.state,
          pincode: body.pincode,
          country: 'India',
        };
        vendorProfile.phone = body.phone;
      }
      await vendorProfile.save();
    } else if (body.role === 'supplier') {
      let supplierProfile = await SupplierProfile.findOne({ userId: user._id });
      if (!supplierProfile) {
        supplierProfile = new SupplierProfile({
          userId: user._id,
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
          verificationStatus: false,
          rating: 0,
          totalProducts: 0,
          totalRevenue: 0,
        });
      } else {
        supplierProfile.businessName = body.businessName;
        supplierProfile.businessType = body.businessType;
        supplierProfile.gstNumber = body.gstNumber;
        supplierProfile.panNumber = body.panNumber;
        supplierProfile.address = {
          street: body.street,
          city: body.city,
          state: body.state,
          pincode: body.pincode,
          country: 'India',
        };
        supplierProfile.phone = body.phone;
      }
      await supplierProfile.save();
    }
    
    return NextResponse.json({
      success: true,
      message: 'Profile completed successfully',
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        emailVerified: user.emailVerified,
      },
    });
    
  } catch (error: any) {
    console.error('Profile completion error:', error);
    
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