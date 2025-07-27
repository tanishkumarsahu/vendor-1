import { NextRequest, NextResponse } from 'next/server';
import { mongoClient } from '@/lib/mongodb-client';
import { signUpSchema } from '@/lib/validations';
import { User } from '@/lib/mongodb';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = signUpSchema.parse(body);

    const existingUser = await mongoClient.from('users').select('_id').eq('email', validatedData.email);
    if (existingUser) {
      return NextResponse.json({ error: 'User with this email already exists' }, { status: 400 });
    }

    const user = await mongoClient.withTransaction(async (session) => {
      const newUser = await mongoClient.from('users').insert(validatedData, { session });

      const profileData = {
        userId: newUser._id,
        firstName: validatedData.firstName,
        lastName: validatedData.lastName,
        phone: validatedData.phone,
        address: {
          street: validatedData.street,
          city: validatedData.city,
          state: validatedData.state,
          pincode: validatedData.pincode,
        },
      };
      await mongoClient.from('profiles').insert(profileData, { session });

      const roleProfileData = {
        userId: newUser._id,
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
      };

      if (validatedData.role === 'vendor') {
        await mongoClient.from('vendor_profiles').insert(roleProfileData, { session });
      } else if (validatedData.role === 'supplier') {
        await mongoClient.from('supplier_profiles').insert(roleProfileData, { session });
      }

      return newUser;
    });

    const token = new User(user).generateToken();

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

    if (error.name === 'ZodError') {
      return NextResponse.json({ error: 'Invalid input data', details: error.errors }, { status: 400 });
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 