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
    throw new Error('Please define the MONGO_URI environment variable');
}

type MongooseCache = {
    conn: typeof mongoose | null;
    promise: Promise<typeof mongoose> | null;
};

const g = global as unknown as { mongoose?: MongooseCache };

// Ensure cached is always defined and typed as non-nullable
const cached: MongooseCache =
    g.mongoose ?? (g.mongoose = { conn: null, promise: null });

export default async function dbConnect() {
    try {
        if (cached.conn) {
            return cached.conn;
        }
        if (!cached.promise) {
            // const opts = {
            //     useNewUrlParser: true,
            //     useUnifiedTopology: true,
            // };

            cached.promise = mongoose
                .connect(MONGODB_URI as string)
                .then((mongoose) => {
                    return mongoose;
                });
            console.log('Connected to MongoDB Crashify');
        }
        cached.conn = await cached.promise;
        console.log('Connected to MongoDB Crashify');
        return cached.conn;
    } catch (error) {
        console.log(error);
    }
}
