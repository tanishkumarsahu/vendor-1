# MongoDB Setup for VendorMitra

This document provides instructions for setting up MongoDB as the default database in the VendorMitra application.

## Prerequisites

1. **MongoDB Installation**: Install MongoDB Community Edition on your system
   - [MongoDB Installation Guide](https://docs.mongodb.com/manual/installation/)
   - Or use MongoDB Atlas (cloud service)

2. **Node.js Dependencies**: The required packages are already installed:
   - `mongoose` - MongoDB ODM
   - `bcryptjs` - Password hashing
   - `jsonwebtoken` - JWT authentication

## Environment Variables

Create a `.env.local` file in your project root with the following variables:

```env
# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/vendormitra

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Application Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=VendorMitra
NEXT_PUBLIC_APP_DESCRIPTION=Connect vendors and suppliers seamlessly

# Instamojo Payment Gateway Configuration
INSTAMOJO_API_KEY=your-instamojo-api-key
INSTAMOJO_AUTH_TOKEN=your-instamojo-auth-token
INSTAMOJO_SALT=your-instamojo-salt
INSTAMOJO_BASE_URL=https://test.instamojo.com/api/1.1

# Node Environment
NODE_ENV=development
```

## Database Setup

### Option 1: Local MongoDB

1. **Start MongoDB Service**:
   ```bash
   # On Windows
   net start MongoDB
   
   # On macOS/Linux
   sudo systemctl start mongod
   ```

2. **Create Database**:
   ```bash
   mongosh
   use vendormitra
   ```

### Option 2: MongoDB Atlas (Cloud)

1. **Create Atlas Account**: [MongoDB Atlas](https://www.mongodb.com/atlas)
2. **Create Cluster**: Choose the free tier
3. **Get Connection String**: 
   - Go to "Connect" → "Connect your application"
   - Copy the connection string
   - Replace `<password>` with your database user password
   - Update `MONGODB_URI` in your `.env.local`

## Schema Migration

The application automatically creates the following collections when first accessed:

- `users` - User accounts and authentication
- `profiles` - User profile information
- `vendor_profiles` - Vendor-specific business details
- `supplier_profiles` - Supplier-specific business details
- `products` - Product catalog
- `orders` - Order management
- `transactions` - Payment transactions
- `group_orders` - Group buying functionality
- `notifications` - User notifications

## Authentication Flow

The new authentication system uses:

1. **JWT Tokens**: Stored in localStorage for session management
2. **Password Hashing**: bcryptjs for secure password storage
3. **Role-based Access**: Vendor and Supplier roles with different permissions

## API Endpoints

### Authentication
- `POST /api/auth/signup` - User registration
- `POST /api/auth/signin` - User login
- `GET /api/auth/me` - Get current user profile

### Products
- `GET /api/products` - Get supplier's products
- `POST /api/products` - Create new product
- `PUT /api/products/[id]` - Update product
- `DELETE /api/products/[id]` - Delete product

### Orders
- `POST /api/orders` - Create new order

### Payments
- `POST /api/payment/create` - Create payment request
- `POST /api/payment/webhook` - Instamojo webhook handler
- `GET /api/payment/status` - Check payment status

## Testing the Setup

1. **Start the Application**:
   ```bash
   npm run dev
   ```

2. **Test Registration**: Visit `/auth-test` to test user registration
3. **Test Login**: Use the demo accounts or create new ones
4. **Test Dashboard**: Access role-specific dashboards

## Demo Accounts

The application includes demo accounts for testing:

### Vendors
- Email: `vendor1@demo.com`, Password: `demo123`
- Email: `vendor2@demo.com`, Password: `demo123`

### Suppliers
- Email: `supplier1@demo.com`, Password: `demo123`
- Email: `supplier2@demo.com`, Password: `demo123`

## Troubleshooting

### Connection Issues
- Verify MongoDB is running
- Check connection string format
- Ensure network access (for Atlas)

### Authentication Issues
- Verify JWT_SECRET is set
- Check token expiration
- Clear localStorage if needed

### Data Issues
- Check MongoDB logs
- Verify collection permissions
- Ensure indexes are created

## Migration from Supabase

If migrating from an existing Supabase setup:

1. **Export Data**: Export your Supabase data
2. **Import to MongoDB**: Import your data into MongoDB
3. **Update Environment**: Remove Supabase variables and add MongoDB variables
4. **Test Thoroughly**: Verify all functionality works

## Security Considerations

1. **JWT Secret**: Use a strong, unique secret
2. **Database Access**: Restrict database access
3. **Environment Variables**: Never commit secrets to version control
4. **Input Validation**: All inputs are validated with Zod schemas
5. **Password Security**: Passwords are hashed with bcryptjs

## Performance Optimization

1. **Indexes**: MongoDB automatically creates indexes on `_id`
2. **Connection Pooling**: Mongoose handles connection pooling
3. **Caching**: Consider Redis for session caching in production
4. **Monitoring**: Use MongoDB Compass or Atlas for monitoring

## Production Deployment

1. **Environment**: Set `NODE_ENV=production`
2. **Database**: Use MongoDB Atlas or managed MongoDB service
3. **Security**: Use strong JWT secrets and HTTPS
4. **Monitoring**: Set up logging and monitoring
5. **Backup**: Configure regular database backups 