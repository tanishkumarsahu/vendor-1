import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase, User, Profile, VendorProfile, SupplierProfile } from '@/lib/mongodb';
import { signUpSchema } from '@/lib/validations';

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();
    const body = await request.json();
    
    // Validate input
    const validatedData = signUpSchema.parse(body);
    
    // Check if user already exists
    const existingUser = await User.findOne({ email: validatedData.email });
    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      );
    }
    
    // Create user
    const user = new User({
      email: validatedData.email,
      password: validatedData.password,
      role: validatedData.role,
    });
    
    await user.save();
    
    // Create profile
    const profile = new Profile({
      userId: user._id,
      firstName: validatedData.firstName,
      lastName: validatedData.lastName,
      phone: validatedData.phone,
      address: {
        street: validatedData.street,
        city: validatedData.city,
        state: validatedData.state,
        pincode: validatedData.pincode,
      },
    });
    
    await profile.save();
    
    // Create role-specific profile
    if (validatedData.role === 'vendor') {
      const vendorProfile = new VendorProfile({
        userId: user._id,
        businessName: validatedData.businessName,
        businessType: validatedData.businessType,
        gstNumber: validatedData.gstNumber,
        panNumber: validatedData.panNumber,
        address: {
          street: validatedData.street,
          city: validatedData.city,
          state: validatedData.state,
          pincode: validatedData.pincode,
        },
        phone: validatedData.phone,
      });
      
      await vendorProfile.save();
    } else if (validatedData.role === 'supplier') {
      const supplierProfile = new SupplierProfile({
        userId: user._id,
        businessName: validatedData.businessName,
        businessType: validatedData.businessType,
        gstNumber: validatedData.gstNumber,
        panNumber: validatedData.panNumber,
        address: {
          street: validatedData.street,
          city: validatedData.city,
          state: validatedData.state,
          pincode: validatedData.pincode,
        },
        phone: validatedData.phone,
      });
      
      await supplierProfile.save();
    }
    
    // Generate JWT token
    const token = user.generateToken();
    
    return NextResponse.json({
      success: true,
      message: 'User registered successfully',
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        emailVerified: user.emailVerified,
      },
      token,
    });
    
  } catch (error: any) {
    console.error('Signup error:', error);
    
    if (error.name === 'ValidationError') {
      return NextResponse.json(
        { error: 'Validation failed', details: error.message },
        { status: 400 }
      );
    }
    
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid input data', details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 