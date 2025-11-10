import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const mongoUrl = process.env.MONGO_URL || "mongodb://127.0.0.1:27017/bb";

// Try connecting without database name first to see what databases exist
const baseUrl = mongoUrl.split("?")[0].split("/").slice(0, -1).join("/");
const queryParams = mongoUrl.includes("?") ? "?" + mongoUrl.split("?")[1] : "";

console.log("🔍 Connecting to MongoDB to list databases...");
console.log("📝 Base URL (hidden credentials):", baseUrl.replace(/\/\/[^:]+:[^@]+@/, "//***:***@"));

// Connect to admin database to list all databases
const adminUrl = baseUrl + "/admin" + queryParams;

mongoose
  .connect(adminUrl)
  .then(async () => {
    console.log("✅ Connected to MongoDB");
    
    try {
      // List all databases
      const adminDb = mongoose.connection.db.admin();
      const { databases } = await adminDb.listDatabases();
      
      console.log("\n📊 Available databases:");
      for (const db of databases) {
        console.log(`   - ${db.name} (${(db.sizeOnDisk / 1024 / 1024).toFixed(2)} MB)`);
      }
      
      // Check each database for users collection
      console.log("\n🔍 Checking each database for 'users' collection...");
      for (const dbInfo of databases) {
        const dbName = dbInfo.name;
        if (dbName === "admin" || dbName === "local" || dbName === "config") continue;
        
        try {
          const db = mongoose.connection.client.db(dbName);
          const collections = await db.listCollections().toArray();
          
          const usersCollection = collections.find(col => col.name === "users");
          if (usersCollection) {
            const count = await db.collection("users").countDocuments();
            console.log(`\n   ✅ Database "${dbName}" has 'users' collection with ${count} document(s)`);
            
            if (count > 0) {
              const users = await db.collection("users").find({}).limit(5).toArray();
              console.log(`   📋 Sample users:`);
              users.forEach((user, i) => {
                console.log(`      ${i + 1}. ${user.name || "No name"} (${user.email || "No email"}) - ID: ${user._id}`);
              });
            }
          }
        } catch (err) {
          console.log(`   ⚠️  Could not check database "${dbName}": ${err.message}`);
        }
      }
    } catch (err) {
      console.error("❌ Error listing databases:", err.message);
    }
    
    await mongoose.connection.close();
    console.log("\n✅ Connection closed");
    process.exit(0);
  })
  .catch((err) => {
    console.error("❌ Error:", err.message);
    process.exit(1);
  });

