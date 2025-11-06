import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "./src/models/User.js";

dotenv.config();

const MONGO_URL = process.env.MONGO_URL || "mongodb://localhost:27017/bb";

async function updateAdminRole() {
  try {
    await mongoose.connect(MONGO_URL);
    console.log("✅ Connected to MongoDB");

    const email = process.argv[2] || "admin@example.com";
    console.log(`\n🔍 Looking for user with email: ${email}`);

    const user = await User.findOne({ email: email.toLowerCase().trim() });

    if (!user) {
      console.log(`❌ User with email ${email} not found in database.`);
      console.log("\nAvailable users in database:");
      const allUsers = await User.find({}).select("email name role").lean();
      allUsers.forEach((u) => {
        console.log(`  - ${u.email} (name: ${u.name}, role: ${u.role || "user"})`);
      });
      process.exit(1);
    }

    console.log(`\n📋 Current user info:`);
    console.log(`   Name: ${user.name}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Current Role: ${user.role || "user"}`);

    if (user.role === "admin") {
      console.log(`\n✅ User already has admin role. No changes needed.`);
      process.exit(0);
    }

    // Update role to admin
    user.role = "admin";
    await user.save();

    console.log(`\n✅ Successfully updated user role to 'admin'`);
    console.log(`   User: ${user.email}`);
    console.log(`   New Role: ${user.role}`);
    console.log(`\n💡 Please log out and log back in to get a fresh token with admin role.`);

    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
}

updateAdminRole();

