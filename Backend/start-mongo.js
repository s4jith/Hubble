const { MongoMemoryServer } = require('mongodb-memory-server');

async function startMongo() {
  try {
    const mongod = await MongoMemoryServer.create({
      instance: {
        port: 27017,
        dbName: 'social-platform',
      }
    });
    console.log(`✅ Memory MongoDB is running at: ${mongod.getUri()}`);
    console.log(`Leave this process running...`);
    
    // Keep process alive
    setInterval(() => {}, 1000 * 60 * 60);
  } catch (err) {
    console.error("Failed to start MongoMemoryServer:", err);
  }
}

startMongo();
