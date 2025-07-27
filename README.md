# VendorMitra - B2B Marketplace for Street Food Vendors

A comprehensive B2B marketplace platform connecting street food vendors with verified raw material suppliers across India.

## 🚀 Features

### For Vendors
- **Smart Supplier Discovery**: Find verified suppliers within 5-10km radius
- **Inventory Dashboard**: Track stock levels and get low stock alerts
- **Group Buying Power**: Join other vendors' orders for bulk pricing
- **Quality Assurance**: Rate suppliers and view quality scores

### For Suppliers
- **Order Management**: Centralized dashboard for managing orders
- **Sales Analytics**: Data-driven insights and performance metrics
- **Smart Delivery**: Optimize delivery routes and track in real-time
- **Payment Tracking**: Monitor payments and maintain cash flow

## 🛠️ Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **UI Components**: shadcn/ui, Tailwind CSS
- **Database**: MongoDB (with Mongoose)
- **Authentication**: JWT-based (using bcryptjs, jsonwebtoken)
- **Charts**: Recharts
- **Icons**: Lucide React
- **Notifications**: Sonner

## 📋 Prerequisites

- Node.js 18+ 
- npm or pnpm
- MongoDB Atlas account (or a local MongoDB instance)

## 🚀 Quick Start

### 1. Clone the Repository
```bash
git clone <repository-url>
cd vendor-mitra
```

### 2. Install Dependencies
```bash
npm install
# or
pnpm install
```

### 3. Set Up MongoDB

1. Create a new MongoDB Atlas project or use a local MongoDB instance
2. Update your `.env.local` file with your MongoDB connection string:

```env
MONGODB_URI=your_mongodb_connection_string
```

### 4. Set Up Database

1. Run the SQL script from `scripts/setup-database.sql` (if using SQL for reference) or set up your MongoDB collections as per `MONGODB_SETUP.md`
2. This will create all necessary collections and indexes

### 5. Start Development Server
```bash
npm run dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## 🧪 Testing

Visit `/test` to access the authentication test panel and verify everything is working correctly.

## 📁 Project Structure

```
vendor-1/
├── app/                    # Next.js app directory
│   ├── dashboard/         # Dashboard pages
│   ├── test/             # Test pages
│   └── globals.css       # Global styles
├── components/            # React components
│   ├── ui/               # shadcn/ui components
│   ├── AuthModal.tsx     # Authentication modal
│   ├── VendorDashboard.tsx
│   ├── SupplierDashboard.tsx
│   └── ...
├── contexts/             # React contexts
│   ├── AuthContext.tsx   # Authentication context
│   └── ...
├── lib/                  # Utility libraries
│   ├── mongodb-client.ts       # MongoDB client
│   └── utils.ts          # Utility functions
├── scripts/              # Database scripts
└── public/               # Static assets
```

## 🔧 Configuration

### Environment Variables

Create a `.env.local` file with the following variables:

```env
# MongoDB Configuration
MONGODB_URI=your_mongodb_connection_string
```

### Database Schema

The application uses the following main tables:

- `profiles` - User profiles with roles
- `vendor_profiles` - Vendor-specific information
- `supplier_profiles` - Supplier-specific information
- `products` - Product catalog
- `orders` - Order management
- `order_items` - Order line items

## 🎯 Key Features

### Authentication Flow
1. Users can sign up as either vendors or suppliers
2. Profile completion is required for first-time users
3. Role-based dashboard access

### Dashboard Features
- **Vendor Dashboard**: Product discovery, order management, group orders
- **Supplier Dashboard**: Product catalog, order management, analytics

### Real-time Features
- Live order status updates
- Real-time notifications
- Dynamic inventory management

## 🚀 Deployment

### Vercel (Recommended)
1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy!

### Other Platforms
The application can be deployed to any platform that supports Next.js:
- Netlify
- Railway
- DigitalOcean App Platform

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the `/test` page for debugging
- Review the MongoDB documentation

## 🎉 Hackathon Ready

This project is fully functional and ready for hackathon submission with:
- ✅ Complete authentication system
- ✅ Role-based dashboards
- ✅ Real database integration
- ✅ Professional UI/UX
- ✅ Mobile responsive design
- ✅ PWA support
- ✅ Comprehensive error handling

---

**Made with ❤️ for the Indian street food ecosystem**