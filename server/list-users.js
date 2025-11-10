import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "./src/models/User.js";

dotenv.config();

const mongoUrl = process.env.MONGO_URL || "mongodb://127.0.0.1:27017/test";

// Ensure database name is specified
let finalUrl = mongoUrl;
if (mongoUrl.includes("mongodb+srv://") || mongoUrl.includes("mongodb://")) {
  try {
    const url = new URL(mongoUrl.replace("mongodb+srv://", "https://").replace("mongodb://", "http://"));
    const pathname = url.pathname;
    const dbName = pathname.split("/").filter(p => p && !p.includes("?")).pop();
    
    if (!dbName || dbName.length < 2) {
      const queryIndex = mongoUrl.indexOf("?");
      if (queryIndex > 0) {
        // Remove trailing slash before query params, then add /test (MongoDB Atlas default)
        const baseUrl = mongoUrl.substring(0, queryIndex).replace(/\/+$/, "");
        finalUrl = baseUrl + "/test" + mongoUrl.substring(queryIndex);
      } else {
        // Remove trailing slash, then add /test
        finalUrl = mongoUrl.replace(/\/+$/, "") + "/test";
      }
    }
  } catch (e) {
    if (!mongoUrl.match(/\/[^\/\?]+(\?|$)/)) {
      const queryIndex = mongoUrl.indexOf("?");
      if (queryIndex > 0) {
        finalUrl = mongoUrl.substring(0, queryIndex) + "/bb" + mongoUrl.substring(queryIndex);
      } else {
        finalUrl = mongoUrl.replace(/\/+$/, "") + "/bb";
      }
    }
  }
}

console.log("🔍 Connecting to MongoDB...");
console.log("📝 Connection string (hidden credentials):", finalUrl.replace(/\/\/[^:]+:[^@]+@/, "//***:***@"));

mongoose
  .connect(finalUrl)
  .then(async () => {
    console.log("✅ Connected to MongoDB");
    console.log("📊 Database name:", mongoose.connection.db.databaseName);
    
    // List all collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log("\n📋 Available collections:");
    collections.forEach(col => {
      console.log(`   - ${col.name}`);
    });
    
    // Find all users
    console.log("\n👥 Users in 'users' collection:");
    const users = await User.find({}).select("_id name email role emailVerified createdAt").lean();
    
    if (users.length === 0) {
      console.log("   ⚠️  No users found in the 'users' collection");
      
      // Check if there are any other collections that might contain users
      console.log("\n🔍 Checking other collections for user data...");
      for (const col of collections) {
        if (col.name.toLowerCase().includes("user")) {
          const count = await mongoose.connection.db.collection(col.name).countDocuments();
          console.log(`   - ${col.name}: ${count} documents`);
        }
      }
    } else {
      console.log(`   Found ${users.length} user(s):\n`);
      users.forEach((user, index) => {
        console.log(`   ${index + 1}. ${user.name || "No name"}`);
        console.log(`      Email: ${user.email}`);
        console.log(`      ID: ${user._id}`);
        console.log(`      Role: ${user.role || "user"}`);
        console.log(`      Email Verified: ${user.emailVerified || false}`);
        console.log(`      Created: ${user.createdAt || "Unknown"}`);
        console.log("");
      });
    }
    
    // Check specific user by email
    const testEmail = "minafathi98@gmail.com";
    console.log(`\n🔍 Searching for user with email: ${testEmail}`);
    const specificUser = await User.findOne({ email: testEmail }).lean();
    if (specificUser) {
      console.log("✅ User found:");
      console.log(JSON.stringify(specificUser, null, 2));
    } else {
      console.log("❌ User not found with that email");
    }
    
    await mongoose.connection.close();
    console.log("\n✅ Connection closed");
    process.exit(0);
  })
  .catch((err) => {
    console.error("❌ Error:", err);
    process.exit(1);
  });

