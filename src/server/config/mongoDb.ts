import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGO_URI;

if (!MONGODB_URI) {
    throw new Error('Please define the MONGO_URI environment variable');
}

let cached = global.mongoose;

if (!cached) {
    cached = global.mongoose = { conn: null, promise: null };
}

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
                .connect(MONGODB_URI)
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
