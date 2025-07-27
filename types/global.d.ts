// Global type definitions for VendorMitra

declare global {
  // Payment and Order Status Types
  type PaymentStatus = 'pending' | 'success' | 'failed' | 'refunded'
  type OrderStatus = 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
  type UserRole = 'vendor' | 'supplier'
  
  // API Response Types
  interface ApiResponse<T = any> {
    success: boolean
    data?: T
    error?: string
    message?: string
  }
  
  // Pagination Types
  interface PaginationParams {
    page?: number
    limit?: number
    sort?: string
    order?: 'asc' | 'desc'
  }
  
  interface PaginatedResponse<T> {
    data: T[]
    pagination: {
      page: number
      limit: number
      total: number
      totalPages: number
      hasNext: boolean
      hasPrev: boolean
    }
  }
  
  // MongoDB Types
  interface MongoDBDocument {
    _id: string
    createdAt: string
    updatedAt: string
  }
  
  interface User extends MongoDBDocument {
    email: string
    role: UserRole
    emailVerified: boolean
  }
  
  interface Profile extends MongoDBDocument {
    userId: string
    firstName: string
    lastName: string
    phone?: string
    address: {
      street?: string
      city?: string
      state?: string
      pincode?: string
      country: string
    }
    avatar?: string
  }
  
  interface VendorProfile extends MongoDBDocument {
    userId: string
    businessName: string
    businessType: 'individual' | 'partnership' | 'corporation' | 'llc'
    gstNumber?: string
    panNumber?: string
    address: {
      street?: string
      city?: string
      state?: string
      pincode?: string
      country: string
    }
    phone: string
    verificationStatus: boolean
    rating: number
    totalOrders: number
  }
  
  interface SupplierProfile extends MongoDBDocument {
    userId: string
    businessName: string
    businessType: 'manufacturer' | 'wholesaler' | 'distributor' | 'retailer'
    gstNumber?: string
    panNumber?: string
    address: {
      street?: string
      city?: string
      state?: string
      pincode?: string
      country: string
    }
    phone: string
    verificationStatus: boolean
    rating: number
    totalProducts: number
    totalRevenue: number
  }
  
  interface Product extends MongoDBDocument {
    supplierId: string
    name: string
    description: string
    category: string
    price: number
    originalPrice?: number
    stock: number
    images: string[]
    specifications?: any
    isActive: boolean
    rating: number
    totalReviews: number
  }
  
  interface Order extends MongoDBDocument {
    vendorId: string
    supplierId: string
    items: Array<{
      productId: string
      quantity: number
      price: number
      total: number
    }>
    totalAmount: number
    status: OrderStatus
    paymentStatus: PaymentStatus
    paymentId?: string
    shippingAddress: {
      street?: string
      city?: string
      state?: string
      pincode?: string
      country: string
    }
    deliveryCharges: number
    commission: number
  }
  
  interface Transaction extends MongoDBDocument {
    orderId: string
    paymentRequestId: string
    amount: number
    fees: number
    commission: number
    status: PaymentStatus
    paymentMethod?: string
    buyerName?: string
    buyerEmail?: string
    buyerPhone?: string
    instamojoResponse?: any
  }
  
  interface GroupOrder extends MongoDBDocument {
    initiatorId: string
    supplierId: string
    productId: string
    targetQuantity: number
    currentQuantity: number
    pricePerUnit: number
    status: 'active' | 'completed' | 'cancelled' | 'expired'
    expiresAt: string
    participants: Array<{
      vendorId: string
      quantity: number
      joinedAt: string
    }>
  }
  
  interface Notification extends MongoDBDocument {
    userId: string
    title: string
    message: string
    type: 'order' | 'payment' | 'group_order' | 'system'
    isRead: boolean
    data?: any
  }
  
  // Cart Types
  interface CartItem {
    id: string
    name: string
    price: number
    quantity: number
    supplierId: string
    supplierName: string
    image?: string
  }
  
  // Environment Variables
  namespace NodeJS {
    interface ProcessEnv {
      NODE_ENV: 'development' | 'production' | 'test'
      MONGODB_URI: string
      JWT_SECRET: string
      NEXT_PUBLIC_APP_URL: string
      
      // Instamojo Configuration
      INSTAMOJO_API_KEY: string
      INSTAMOJO_AUTH_TOKEN: string
      INSTAMOJO_SALT: string
      INSTAMOJO_BASE_URL: string
      
      // Optional configurations
      NEXT_PUBLIC_APP_NAME?: string
      NEXT_PUBLIC_APP_DESCRIPTION?: string
    }
  }
  
  // Global mongoose instance
  var mongoose: {
    conn: any
    promise: any
  } | undefined
}

export {} 