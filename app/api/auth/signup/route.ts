import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { signUpSchema } from '@/lib/validations';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('Signup request body:', body);
    
    const validatedData = signUpSchema.parse(body);
    console.log('Validated signup data:', validatedData);

    const { db } = await connectToDatabase();
    console.log('Connected to database');

    // Check if user already exists
    const existingUser = await db.collection('users').findOne({ email: validatedData.email });
    console.log('Existing user check:', existingUser ? 'User exists' : 'No existing user');
    
    if (existingUser) {
      return NextResponse.json({ error: 'User with this email already exists' }, { status: 400 });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(validatedData.password, 12);

    // Create user
    const userData = {
      email: validatedData.email,
      password: hashedPassword,
      role: validatedData.role,
      emailVerified: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await db.collection('users').insertOne(userData);
    const userId = result.insertedId;

    // Compose address string
    const address = `${validatedData.street}, ${validatedData.city}, ${validatedData.state} - ${validatedData.pincode}`;

    // Create profile
    const profileData = {
      userId: userId,
      firstName: validatedData.firstName,
      lastName: validatedData.lastName,
      businessName: validatedData.businessName,
      phone: validatedData.phone,
      address: {
        street: validatedData.street,
        city: validatedData.city,
        state: validatedData.state,
        pincode: validatedData.pincode,
        country: 'India'
      },
      gstNumber: validatedData.gstNumber || '',
      panNumber: validatedData.panNumber || '',
      foodType: validatedData.foodType || '',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await db.collection('profiles').insertOne(profileData);

    // Create role-specific profile
    const roleProfileData = {
      userId: userId,
      businessName: validatedData.businessName,
      businessType: validatedData.businessType,
      phone: validatedData.phone,
      address: {
        street: validatedData.street,
        city: validatedData.city,
        state: validatedData.state,
        pincode: validatedData.pincode,
        country: 'India'
      },
      gstNumber: validatedData.gstNumber || '',
      panNumber: validatedData.panNumber || '',
      foodType: validatedData.foodType || '',
      verificationStatus: false,
      rating: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    if (validatedData.role === 'vendor') {
      roleProfileData.totalOrders = 0;
      await db.collection('vendor_profiles').insertOne(roleProfileData);
    } else if (validatedData.role === 'supplier') {
      roleProfileData.totalProducts = 0;
      roleProfileData.totalRevenue = 0;
      await db.collection('supplier_profiles').insertOne(roleProfileData);
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: userId.toString(), email: validatedData.email, role: validatedData.role },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: '7d' }
    );

    return NextResponse.json({
      success: true,
      message: 'User registered successfully',
      user: {
        id: userId.toString(),
        email: validatedData.email,
        role: validatedData.role,
        emailVerified: false,
      },
      token,
    });
  } catch (error: any) {
    console.error('Signup error:', error);

    if (error.name === 'ZodError') {
      return NextResponse.json({ error: 'Invalid input data', details: error.errors }, { status: 400 });
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 