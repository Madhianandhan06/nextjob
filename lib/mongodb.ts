
import { MongoClient } from "mongodb";

declare global {
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

export default function getMongoClient() {
  if (!global._mongoClientPromise) {
    const uri = process.env.MONGO_URI;

    if (!uri) {
      throw new Error("Missing MONGO_URI environment variable.");
    }

    global._mongoClientPromise = new MongoClient(uri).connect().catch((error) => {
      global._mongoClientPromise = undefined;
      throw error;
    });
  }

  return global._mongoClientPromise;
}
