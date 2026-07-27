const { MongoClient } = require('mongoose').mongo;
require('dotenv').config();

// Local MongoDB URI
const LOCAL_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/sibis';

// Remote Atlas URI from command line argument
const REMOTE_URI = process.argv[2];

if (!REMOTE_URI) {
  console.error('\x1b[31mError: Please provide your MongoDB Atlas connection string as an argument.\x1b[0m');
  console.error('\nUsage:');
  console.error('  node migrate.js "mongodb+srv://<username>:<password>@cluster0.xxxxxx.mongodb.net/sibis"');
  process.exit(1);
}

async function migrate() {
  console.log(`Connecting to Local DB: ${LOCAL_URI}...`);
  const localClient = new MongoClient(LOCAL_URI);
  await localClient.connect();
  const localDb = localClient.db();

  console.log(`Connecting to Remote Atlas DB...`);
  const remoteClient = new MongoClient(REMOTE_URI);
  await remoteClient.connect();
  const remoteDb = remoteClient.db();

  console.log('\nFetching local collections...');
  const collections = await localDb.listCollections().toArray();

  for (const collectionInfo of collections) {
    const colName = collectionInfo.name;
    
    // Skip MongoDB system collections
    if (colName.startsWith('system.')) continue;

    console.log(`\n----------------------------------------`);
    console.log(`Collection: \x1b[36m${colName}\x1b[0m`);
    
    const localCol = localDb.collection(colName);
    const remoteCol = remoteDb.collection(colName);

    // Fetch all documents from local
    const documents = await localCol.find({}).toArray();
    console.log(`  -> Found \x1b[33m${documents.length}\x1b[0m documents locally.`);

    if (documents.length > 0) {
      console.log(`  -> Clearing existing documents in Atlas collection to avoid duplicates...`);
      await remoteCol.deleteMany({});
      
      console.log(`  -> Inserting documents into Atlas...`);
      const insertResult = await remoteCol.insertMany(documents);
      console.log(`  -> \x1b[32mSuccessfully copied ${insertResult.insertedCount} documents!\x1b[0m`);
    } else {
      console.log(`  -> Collection is empty, skipping copy.`);
    }
  }

  console.log('\n----------------------------------------');
  console.log('\x1b[32;1mMigration completed successfully!\x1b[0m\n');

  await localClient.close();
  await remoteClient.close();
}

migrate().catch(async (err) => {
  console.error('\n\x1b[31mMigration failed:\x1b[0m', err.message);
  process.exit(1);
});
