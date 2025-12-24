# Grant Admin Permissions via MongoDB Atlas

## Method 1: Using the Script (Recommended)
```bash
cd server
node update-admin-role.js <user-email>
```

## Method 2: Using MongoDB Atlas Compass

1. **Download MongoDB Compass**: https://www.mongodb.com/products/compass
2. **Connect** using your Atlas connection string from `.env` file:
   ```
   mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/database?retryWrites=true&w=majority
   ```
3. **Navigate** to your database → `users` collection
4. **Find** the user document by email
5. **Edit** the document:
   - Change `role: "user"` to `role: "admin"`
   - Click "Update"

## Method 3: Using MongoDB Atlas Web UI

1. Go to https://cloud.mongodb.com
2. Log in to your account
3. Select your cluster
4. Click **"Browse Collections"**
5. Select your database → `users` collection
6. **Search** for the user by email
7. Click **"Edit Document"**
8. Change `role: "user"` to `role: "admin"`
9. Click **"Update"**

## Method 4: Using MongoDB Shell (mongosh)

1. **Connect** to your Atlas cluster:
   ```bash
   mongosh "mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/database"
   ```

2. **Update the user role**:
   ```javascript
   use your-database-name
   db.users.updateOne(
     { email: "user@example.com" },
     { $set: { role: "admin" } }
   )
   ```

3. **Verify** the change:
   ```javascript
   db.users.findOne({ email: "user@example.com" })
   ```

## Important Notes

⚠️ **After updating the role:**
- The user must **log out and log back in** to get a fresh JWT token with admin permissions
- The old token still contains the old role, so it won't work until they re-authenticate

## Available Roles

- `user` - Default role for regular customers
- `admin` - Full access to admin dashboard, order management, etc.
- `driver` - For delivery drivers

