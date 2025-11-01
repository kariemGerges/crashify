// import mongoose from 'mongoose';

// declare global {
//     var mongoose:
//         | {
//               conn: typeof mongoose | null;
//               promise: Promise<typeof mongoose> | null;
//           }
//         | undefined;
// }

// const MONGODB_URI = process.env.MONGODB_URI;

// if (!MONGODB_URI) {
//     throw new Error(
//         'Please define the MONGODB_URI environment variable (MONGODB_URI)'
//     );
// }

// type MongooseCache = {
//     conn: typeof mongoose | null;
//     promise: Promise<typeof mongoose> | null;
// };

// const g = global as unknown as { mongoose?: MongooseCache };

// // Ensure cached is always defined and typed as non-nullable
// const cached: MongooseCache =
//     g.mongoose ?? (g.mongoose = { conn: null, promise: null });

// export default async function dbConnect() {
//     try {
//         if (cached.conn) {
//             return cached.conn;
//         }
//         if (!cached.promise) {
//             // const opts = {
//             //     useNewUrlParser: true,
//             //     useUnifiedTopology: true,
//             // };

//             cached.promise = mongoose
//                 .connect(MONGODB_URI as string)
//                 .then((mongoose) => {
//                     return mongoose;
//                 });
//         }
//         cached.conn = await cached.promise;
//         console.log('Connected to MongoDB Crashify');
//         return cached.conn;
//     } catch (error) {
//         console.error('MongoDB connection error:', error);
//         // Re-throw so callers (API routes) can handle the failure and return appropriate responses
//         throw error;
//     }
// }
import mongoose from 'mongoose';

declare global {
    var mongoose:
        | {
              conn: typeof mongoose | null;
              promise: Promise<typeof mongoose> | null;
          }
        | undefined;
}

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    throw new Error('❌ Missing environment variable: MONGODB_URI');
}

type MongooseCache = {
    conn: typeof mongoose | null;
    promise: Promise<typeof mongoose> | null;
};

const g = global as unknown as { mongoose?: MongooseCache };

const cached: MongooseCache =
    g.mongoose ?? (g.mongoose = { conn: null, promise: null });

export default async function dbConnect() {
    if (cached.conn) return cached.conn;

    if (!cached.promise) {
        console.log('[MongoDB] Attempting initial connection...');
        cached.promise = mongoose
            .connect(MONGODB_URI as string, {
                serverSelectionTimeoutMS: 10000, // Wait max 10s before throwing
                socketTimeoutMS: 20000,
                maxPoolSize: 10,
            })
            .then((mongooseInstance) => {
                console.log('✅ MongoDB connected successfully');
                return mongooseInstance;
            })
            .catch((err) => {
                // Enhanced error breakdown
                if (err.name === 'MongooseServerSelectionError') {
                    console.error('❌ MongoDB connection failed:');
                    console.error(
                        '→ Could not connect to any servers in your MongoDB Atlas cluster.'
                    );
                    console.error(
                        '→ Common causes:\n' +
                            '   1️⃣ Your IP is not whitelisted in MongoDB Atlas.\n' +
                            '   2️⃣ Network restrictions or firewall blocking the connection.\n' +
                            '   3️⃣ Invalid connection string or cluster name.\n' +
                            '   4️⃣ Wrong username/password.\n' +
                            '   5️⃣ Atlas cluster paused (if using free tier).'
                    );
                    console.error('Error details:', err.message);
                } else {
                    console.error('❌ Unexpected MongoDB error:', err);
                }
                throw err;
            });
    }

    try {
        cached.conn = await cached.promise;
        return cached.conn;
    } catch (error) {
        console.error('[MongoDB] Final connection attempt failed:', error);
        throw error;
    }
}
