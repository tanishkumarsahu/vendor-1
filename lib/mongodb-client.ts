import { connectToDatabase, models } from './mongodb';
import { z } from 'zod';
import mongoose from 'mongoose';

// Zod schemas for input validation
const QueryOptionsSchema = z.object({
  select: z.string().optional(),
  where: z.record(z.any()).optional(),
  limit: z.number().int().positive().optional(),
  offset: z.number().int().nonnegative().optional(),
  orderBy: z.object({
    field: z.string(),
    direction: z.enum(['asc', 'desc']),
  }).optional(),
  populate: z.array(z.string()).optional(),
});

// MongoDB client
export const mongoClient = {
  // Generic query function
  async query(collection: string, options: any = {}) {
    const validatedOptions = QueryOptionsSchema.parse(options);
    await connectToDatabase();

    const {
      select = '*',
      where = {},
      limit = 100,
      offset = 0,
      orderBy = { field: 'createdAt', direction: 'desc' },
      populate = [],
    } = validatedOptions;

    const Model = getModelForCollection(collection);
    if (!Model) {
      throw new Error(`Collection ${collection} not found`);
    }

    let query = Model.find(where);

    if (select !== '*') {
      query = query.select(select);
    }

    query = query.skip(offset).limit(limit);
    query = query.sort({ [orderBy.field]: orderBy.direction === 'asc' ? 1 : -1 });

    for (const path of populate) {
      query = query.populate(path);
    }

    return query.exec();
  },

  // Collection-specific query builders
  from(collection: string) {
    return {
      select: (fields: string = '*') => ({
        eq: async (field: string, value: any) => {
          return mongoClient.query(collection, {
            where: { [field]: value },
            select: fields,
          });
        },
        order: (field: string, { ascending = true } = {}) => ({
          eq: async (filterField: string, filterValue: any) => {
            return mongoClient.query(collection, {
              where: { [filterField]: filterValue },
              select: fields,
              orderBy: { field, direction: ascending ? 'asc' : 'desc' },
            });
          },
        }),
      }),
      insert: async (data: any) => {
        await connectToDatabase();
        const Model = getModelForCollection(collection);

        if (!Model) {
          throw new Error(`Collection ${collection} not found`);
        }

        const newDoc = new Model(data);
        await newDoc.save();
        return newDoc;
      },
      update: (data: any) => ({
        eq: async (field: string, value: any) => {
          await connectToDatabase();
          const Model = getModelForCollection(collection);

          if (!Model) {
            throw new Error(`Collection ${collection} not found`);
          }

          return Model.updateOne({ [field]: value }, data);
        },
      }),
      delete: () => ({
        eq: async (field: string, value: any) => {
          await connectToDatabase();
          const Model = getModelForCollection(collection);

          if (!Model) {
            throw new Error(`Collection ${collection} not found`);
          }

          return Model.deleteOne({ [field]: value });
        },
      }),
    };
  },

  async withTransaction(callback: (session: mongoose.ClientSession) => Promise<any>) {
    await connectToDatabase();
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const result = await callback(session);
      await session.commitTransaction();
      return result;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  },
};

// Helper function to map collection names to Mongoose models
function getModelForCollection(collection: string) {
  const collectionToModelMap: Record<string, any> = {
    users: models.User,
    profiles: models.Profile,
    vendor_profiles: models.VendorProfile,
    supplier_profiles: models.SupplierProfile,
    products: models.Product,
    orders: models.Order,
    order_items: models.OrderItem,
    transactions: models.Transaction,
    group_orders: models.GroupOrder,
    notifications: models.Notification,
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