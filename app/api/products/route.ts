import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase, Product, SupplierProfile } from '@/lib/mongodb';
import jwt from 'jsonwebtoken';

// GET - Get all products for the authenticated supplier
export async function GET(request: NextRequest) {
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
    
    // Get supplier profile
    const supplierProfile = await SupplierProfile.findOne({ userId: decoded.userId });
    if (!supplierProfile) {
      return NextResponse.json(
        { error: 'Supplier profile not found' },
        { status: 404 }
      );
    }
    
    // Get products for this supplier
    const products = await Product.find({ supplierId: supplierProfile._id })
      .sort({ createdAt: -1 });
    
    return NextResponse.json({
      success: true,
      products,
    });
    
  } catch (error: any) {
    console.error('Get products error:', error);
    
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

// POST - Create a new product
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
    
    // Get supplier profile
    const supplierProfile = await SupplierProfile.findOne({ userId: decoded.userId });
    if (!supplierProfile) {
      return NextResponse.json(
        { error: 'Supplier profile not found' },
        { status: 404 }
      );
    }
    
    const body = await request.json();
    
    // Create new product
    const product = new Product({
      supplierId: supplierProfile._id,
      name: body.name,
      description: body.description,
      category: body.category,
      price: body.price,
      originalPrice: body.originalPrice,
      stock: body.stock,
      images: body.images || [],
      isActive: true,
    });
    
    await product.save();
    
    // Update supplier's total products count
    supplierProfile.totalProducts += 1;
    await supplierProfile.save();
    
    return NextResponse.json({
      success: true,
      product,
    });
    
  } catch (error: any) {
    console.error('Create product error:', error);
    
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