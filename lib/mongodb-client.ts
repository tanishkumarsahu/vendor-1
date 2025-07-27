import { connectToDatabase, models } from './mongodb';

// MongoDB client
export const mongoClient = {
  // Generic query function
  async query(collection: string, options: any = {}) {
    await connectToDatabase();
    
    const {
      select = '*',
      where = {},
      limit = 100,
      offset = 0,
      orderBy = { field: 'createdAt', direction: 'desc' },
      populate = []
    } = options;
    
    // Get the appropriate model
    const Model = getModelForCollection(collection);
    if (!Model) {
      return { data: null, error: `Collection ${collection} not found` };
    }
    
    try {
      // Build the query
      let query = Model.find(where);
    
      // Apply pagination
      query = query.skip(offset).limit(limit);
    
      // Apply sorting
      query = query.sort({ [orderBy.field]: orderBy.direction === 'asc' ? 1 : -1 });
    
      // Apply population for related documents
      for (const path of populate) {
        query = query.populate(path);
      }
    
      const data = await query.exec();
      return { data, error: null };
    } catch (error) {
      console.error('MongoDB query error:', error);
      return { data: null, error };
    }
  },
    
  // Collection-specific query builders
  from(collection: string) {
    return {
      select: (fields: string = '*') => {
        return {
          eq: async (field: string, value: any) => {
            return await mongoClient.query(collection, {
              where: { [field]: value },
              select: fields
            });
          },
          order: (field: string, { ascending = true } = {}) => {
            return {
              eq: async (filterField: string, filterValue: any) => {
                return await mongoClient.query(collection, {
                  where: { [filterField]: filterValue },
                  select: fields,
                  orderBy: { field, direction: ascending ? 'asc' : 'desc' }
                });
              }
            };
          }
        };
      },
      insert: async (data: any) => {
        await connectToDatabase();
        const Model = getModelForCollection(collection);
    
        if (!Model) {
          return { data: null, error: `Collection ${collection} not found` };
        }
    
        try {
          const newDoc = new Model(data);
          await newDoc.save();
          return { data: newDoc, error: null };
        } catch (error) {
          console.error('MongoDB insert error:', error);
          return { data: null, error };
        }
      },
      update: (data: any) => {
        return {
          eq: async (field: string, value: any) => {
            await connectToDatabase();
            const Model = getModelForCollection(collection);
    
            if (!Model) {
              return { data: null, error: `Collection ${collection} not found` };
            }
    
            try {
              const result = await Model.updateOne({ [field]: value }, data);
              return { data: result, error: null };
            } catch (error) {
              console.error('MongoDB update error:', error);
              return { data: null, error };
            }
          }
        };
      },
      delete: () => {
        return {
          eq: async (field: string, value: any) => {
            await connectToDatabase();
            const Model = getModelForCollection(collection);
    
            if (!Model) {
              return { data: null, error: `Collection ${collection} not found` };
            }
    
            try {
              const result = await Model.deleteOne({ [field]: value });
              return { data: result, error: null };
            } catch (error) {
              console.error('MongoDB delete error:', error);
              return { data: null, error };
            }
          }
        };
      }
    };
  }
};

// Helper function to map collection names to Mongoose models
function getModelForCollection(collection: string) {
  const collectionToModelMap: Record<string, any> = {
    'users': models.User,
    'profiles': models.Profile,
    'vendor_profiles': models.VendorProfile,
    'supplier_profiles': models.SupplierProfile,
    'products': models.Product,
    'orders': models.Order,
    'order_items': models.OrderItem,
    'transactions': models.Transaction,
    'group_orders': models.GroupOrder,
    'notifications': models.Notification
  };
  
  return collectionToModelMap[collection];
}

// Export types from MongoDB models
export type User = typeof models.User;
export type Profile = typeof models.Profile;
export type VendorProfile = typeof models.VendorProfile;
export type SupplierProfile = typeof models.SupplierProfile;
export type Product = typeof models.Product;
export type Order = typeof models.Order;
export type Transaction = typeof models.Transaction;
export type GroupOrder = typeof models.GroupOrder;
export type Notification = typeof models.Notification;