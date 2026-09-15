import { MongoClient, Db, Collection } from 'mongodb';

export interface UserDocument {
  _id?: any;
  phone: string;
  name: string;
  email: string;
  role: string;
  profileCompleted: boolean;
  createdAt: string;
  updatedAt: string;
  lastLoginAt: string;
}

export interface OTPVerificationDocument {
  _id?: any;
  phone: string;
  otpHash: string;
  expiresAt: Date;
  attempts: number;
  verified: boolean;
  createdAt: Date;
}

export interface UserSessionDocument {
  _id?: any;
  sessionId: string;
  userId: string;
  phone: string;
  name: string;
  role: string;
  isDemo?: boolean;
  createdAt: Date;
  expiresAt: Date;
}

// In-Memory MongoDB-compatible Collection for resilient fallback
class InMemoryCollection<T extends Record<string, any>> {
  private docs: T[] = [];
  private name: string;

  constructor(name: string) {
    this.name = name;
  }

  async createIndex(_spec: any, _options?: any): Promise<string> {
    return 'indexed';
  }

  async findOne(query: Partial<T> | Record<string, any>): Promise<T | null> {
    const match = this.docs.find((doc) => {
      return Object.entries(query).every(([key, value]) => {
        if (value && typeof value === 'object' && '$gt' in value) {
          return doc[key] > value.$gt;
        }
        if (value && typeof value === 'object' && '$lt' in value) {
          return doc[key] < value.$lt;
        }
        return doc[key] === value;
      });
    });
    return match ? { ...match } : null;
  }

  async find(query: Partial<T> | Record<string, any> = {}): Promise<{ sort: (criteria: any) => { toArray: () => Promise<T[]> }; toArray: () => Promise<T[]> }> {
    const filterFn = (doc: T) => {
      return Object.entries(query).every(([key, value]) => {
        return doc[key] === value;
      });
    };

    const results = this.docs.filter(filterFn);

    return {
      sort: (criteria: Record<string, 1 | -1>) => {
        const sorted = [...results].sort((a, b) => {
          for (const [key, dir] of Object.entries(criteria)) {
            const valA = a[key];
            const valB = b[key];
            if (valA < valB) return dir === 1 ? -1 : 1;
            if (valA > valB) return dir === 1 ? 1 : -1;
          }
          return 0;
        });
        return {
          toArray: async () => sorted.map((d) => ({ ...d })),
        };
      },
      toArray: async () => results.map((d) => ({ ...d })),
    };
  }

  async insertOne(doc: T): Promise<{ insertedId: string; acknowledged: boolean }> {
    const id = doc._id || `id_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const newDoc = { ...doc, _id: id };
    this.docs.push(newDoc);
    return { insertedId: id, acknowledged: true };
  }

  async updateOne(filter: Record<string, any>, update: Record<string, any>): Promise<{ modifiedCount: number }> {
    const doc = this.docs.find((d) => {
      return Object.entries(filter).every(([key, value]) => d[key] === value);
    });

    if (!doc) return { modifiedCount: 0 };

    if (update.$set) {
      Object.assign(doc, update.$set);
    }
    if (update.$inc) {
      for (const [key, val] of Object.entries(update.$inc)) {
        (doc as any)[key] = ((doc as any)[key] || 0) + (val as number);
      }
    }

    return { modifiedCount: 1 };
  }

  async deleteOne(filter: Record<string, any>): Promise<{ deletedCount: number }> {
    const idx = this.docs.findIndex((d) => {
      return Object.entries(filter).every(([key, value]) => d[key] === value);
    });
    if (idx !== -1) {
      this.docs.splice(idx, 1);
      return { deletedCount: 1 };
    }
    return { deletedCount: 0 };
  }

  async deleteMany(filter: Record<string, any>): Promise<{ deletedCount: number }> {
    const before = this.docs.length;
    this.docs = this.docs.filter((d) => {
      return !Object.entries(filter).every(([key, value]) => d[key] === value);
    });
    return { deletedCount: before - this.docs.length };
  }
}

class InMemoryDb {
  private collections: Map<string, InMemoryCollection<any>> = new Map();

  collection<T extends Record<string, any>>(name: string): InMemoryCollection<T> {
    if (!this.collections.has(name)) {
      this.collections.set(name, new InMemoryCollection<T>(name));
    }
    return this.collections.get(name)!;
  }
}

// Global cached connection
interface MongoConnectionState {
  client: MongoClient | null;
  db: Db | InMemoryDb | null;
  isRealMongo: boolean;
}

const state: MongoConnectionState = {
  client: null,
  db: null,
  isRealMongo: false,
};

const inMemoryFallbackDb = new InMemoryDb();

export async function connectToDatabase(): Promise<{ db: Db | InMemoryDb; isRealMongo: boolean }> {
  if (state.db) {
    return { db: state.db, isRealMongo: state.isRealMongo };
  }

  const uri = process.env.MONGODB_URI;

  if (!uri || uri.trim() === '') {
    console.log('[MongoDB] Notice: MONGODB_URI not set. Using in-memory MongoDB store for OTP & sessions.');
    state.db = inMemoryFallbackDb;
    state.isRealMongo = false;
    await setupIndexes(state.db);
    return { db: state.db, isRealMongo: false };
  }

  try {
    console.log('[MongoDB] Connecting to external MongoDB cluster...');
    const client = new MongoClient(uri, {
      maxPoolSize: 10,
      connectTimeoutMS: 5000,
      serverSelectionTimeoutMS: 5000,
    });

    await client.connect();
    const dbName = uri.split('/').pop()?.split('?')[0] || 'finpath_db';
    const db = client.db(dbName);

    state.client = client;
    state.db = db;
    state.isRealMongo = true;

    console.log(`[MongoDB] Connected successfully to database "${dbName}".`);
    await setupIndexes(db);
    return { db, isRealMongo: true };
  } catch (error: any) {
    console.warn(`[MongoDB] Failed to connect to MONGODB_URI: ${error.message}`);
    console.warn('[MongoDB] Reverting to resilient in-memory collection store for OTP authentication.');
    state.db = inMemoryFallbackDb;
    state.isRealMongo = false;
    await setupIndexes(state.db);
    return { db: state.db, isRealMongo: false };
  }
}

async function setupIndexes(db: Db | InMemoryDb) {
  try {
    const usersCol = db.collection<UserDocument>('users');
    const otpCol = db.collection<OTPVerificationDocument>('otp_verifications');
    const sessionsCol = db.collection<UserSessionDocument>('user_sessions');

    await usersCol.createIndex({ phone: 1 }, { unique: true });
    await otpCol.createIndex({ phone: 1 });
    await otpCol.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
    await sessionsCol.createIndex({ sessionId: 1 }, { unique: true });
    await sessionsCol.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
  } catch (err) {
    // Non-blocking in fallback
  }
}

export async function getUsersCollection() {
  const { db } = await connectToDatabase();
  return db.collection<UserDocument>('users');
}

export async function getOtpCollection() {
  const { db } = await connectToDatabase();
  return db.collection<OTPVerificationDocument>('otp_verifications');
}

export async function getSessionsCollection() {
  const { db } = await connectToDatabase();
  return db.collection<UserSessionDocument>('user_sessions');
}
