import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase, Product, SupplierProfile } from '@/lib/mongodb';
import jwt from 'jsonwebtoken';

// PUT - Update a product
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
    
    // Find and update product
    const product = await Product.findOneAndUpdate(
      { _id: params.id, supplierId: supplierProfile._id },
      {
        name: body.name,
        description: body.description,
        category: body.category,
        price: body.price,
        originalPrice: body.originalPrice,
        stock: body.stock,
        images: body.images || [],
        updatedAt: new Date(),
      },
      { new: true }
    );
    
    if (!product) {
      return NextResponse.json(
        { error: 'Product not found or unauthorized' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      product,
    });
    
  } catch (error: any) {
    console.error('Update product error:', error);
    
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

// DELETE - Delete a product
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
    
    // Find and delete product
    const product = await Product.findOneAndDelete({
      _id: params.id,
      supplierId: supplierProfile._id,
    });
    
    if (!product) {
      return NextResponse.json(
        { error: 'Product not found or unauthorized' },
        { status: 404 }
      );
    }
    
    // Update supplier's total products count
    supplierProfile.totalProducts = Math.max(0, supplierProfile.totalProducts - 1);
    await supplierProfile.save();
    
    return NextResponse.json({
      success: true,
      message: 'Product deleted successfully',
    });
    
  } catch (error: any) {
    console.error('Delete product error:', error);
    
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