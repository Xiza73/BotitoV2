import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import { afterAll, beforeAll, beforeEach } from "vitest";

/**
 * Boots a single in-memory MongoDB instance for the calling test file
 * and connects mongoose to it. Truncates every collection before each
 * test so cases are isolated.
 *
 * Call once at the top level of a *.test.ts file before any describe()
 * — the hooks (beforeAll / afterAll / beforeEach) attach to the file's
 * scope automatically.
 */
export const setupInMemoryMongo = () => {
  let mongo: MongoMemoryServer;

  beforeAll(async () => {
    mongo = await MongoMemoryServer.create();
    await mongoose.connect(mongo.getUri());
  }, 120000); // first run downloads the mongod binary; CI-friendly

  afterAll(async () => {
    await mongoose.disconnect();
    await mongo.stop();
  });

  beforeEach(async () => {
    for (const collection of Object.values(mongoose.connection.collections)) {
      await collection.deleteMany({});
    }
  });
};
