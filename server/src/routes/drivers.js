import { Router } from "express";
import Driver from "../models/Driver.js";
import Order from "../models/Order.js";
import User from "../models/User.js";
import jwt from "jsonwebtoken";
import { requireAdmin } from "../middleware/auth.js";

const r = Router();
const JWT_SECRET = process.env.JWT_SECRET || "dev_secret_change_me";

// ✅ Get all drivers (admin only)
r.get("/", requireAdmin, async (req, res) => {
  try {
    const drivers = await Driver.find({ isActive: true }).populate("currentOrder");
    res.json(drivers);
  } catch (err) {
    console.error("Error fetching drivers:", err);
    res.status(500).json({ error: "Failed to fetch drivers" });
  }
});

// ✅ Update driver location
r.post("/:id/location", async (req, res) => {
  try {
    const { latitude, longitude } = req.body;
    
    if (!latitude || !longitude) {
      return res.status(400).json({ error: "Latitude and longitude are required" });
    }

    const driver = await Driver.findById(req.params.id);
    if (!driver) {
      return res.status(404).json({ error: "Driver not found" });
    }

    driver.currentLocation = {
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      lastUpdated: new Date(),
    };

    await driver.save();
    
    // Emit WebSocket event for driver location update
    const io = req.app.get("io");
    if (io) {
      // Emit to order room if driver has a current order
      if (driver.currentOrder) {
        io.to(`order-${driver.currentOrder}`).emit("driver-location-updated", {
          driverId: driver._id,
          driverName: driver.name,
          latitude: driver.currentLocation.latitude,
          longitude: driver.currentLocation.longitude,
          lastUpdated: driver.currentLocation.lastUpdated,
        });
      }
      // Also emit to all admins
      io.emit("driver-location-update", {
        driverId: driver._id,
        driverName: driver.name,
        latitude: driver.currentLocation.latitude,
        longitude: driver.currentLocation.longitude,
        lastUpdated: driver.currentLocation.lastUpdated,
      });
    }
    
    res.json({ success: true, location: driver.currentLocation });
  } catch (err) {
    console.error("Error updating driver location:", err);
    res.status(500).json({ error: "Failed to update driver location" });
  }
});

// ✅ Assign driver to order (admin only)
r.post("/:driverId/assign-order/:orderId", requireAdmin, async (req, res) => {
  try {
    const driver = await Driver.findById(req.params.driverId);
    const order = await Order.findById(req.params.orderId);

    if (!driver) {
      return res.status(404).json({ error: "Driver not found" });
    }
    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    // Unassign previous order if driver has one
    if (driver.currentOrder) {
      const prevOrder = await Order.findById(driver.currentOrder);
      if (prevOrder && prevOrder.status !== "delivered" && prevOrder.status !== "canceled") {
        prevOrder.driverId = null;
        await prevOrder.save();
      }
    }

    // Assign new order
    order.driverId = driver._id;
    driver.currentOrder = order._id;
    
    await order.save();
    await driver.save();

    res.json({ success: true, order, driver });
  } catch (err) {
    console.error("Error assigning driver to order:", err);
    res.status(500).json({ error: "Failed to assign driver to order" });
  }
});

// ✅ Get current driver (for logged-in driver)
r.get("/me", async (req, res) => {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;
    if (!token) return res.status(401).json({ error: "Missing token" });

    const payload = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(payload.sub);
    if (!user) return res.status(404).json({ error: "User not found" });

    // Find driver by email
    const driver = await Driver.findOne({ email: user.email, isActive: true });
    if (!driver) {
      return res.status(404).json({ error: "No driver account found for this user" });
    }

    res.json(driver);
  } catch (err) {
    if (err.name === "JsonWebTokenError" || err.name === "TokenExpiredError") {
      return res.status(401).json({ error: "Invalid or expired token" });
    }
    console.error("Error fetching driver:", err);
    res.status(500).json({ error: "Failed to fetch driver" });
  }
});

// ✅ Update my location (for logged-in driver)
r.post("/me/location", async (req, res) => {
  try {
    const { latitude, longitude } = req.body;
    
    if (!latitude || !longitude) {
      return res.status(400).json({ error: "Latitude and longitude are required" });
    }

    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;
    if (!token) return res.status(401).json({ error: "Missing token" });

    const payload = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(payload.sub);
    if (!user) return res.status(404).json({ error: "User not found" });

    // Find driver by email
    const driver = await Driver.findOne({ email: user.email, isActive: true });
    if (!driver) {
      return res.status(404).json({ error: "No driver account found for this user" });
    }

    driver.currentLocation = {
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      lastUpdated: new Date(),
    };

    await driver.save();
    
    // Emit WebSocket event for driver location update
    const io = req.app.get("io");
    if (io) {
      // Emit to order room if driver has a current order
      if (driver.currentOrder) {
        io.to(`order-${driver.currentOrder}`).emit("driver-location-updated", {
          driverId: driver._id,
          driverName: driver.name,
          latitude: driver.currentLocation.latitude,
          longitude: driver.currentLocation.longitude,
          lastUpdated: driver.currentLocation.lastUpdated,
        });
      }
      // Also emit to all admins
      io.emit("driver-location-update", {
        driverId: driver._id,
        driverName: driver.name,
        latitude: driver.currentLocation.latitude,
        longitude: driver.currentLocation.longitude,
        lastUpdated: driver.currentLocation.lastUpdated,
      });
    }
    
    res.json({ success: true, location: driver.currentLocation });
  } catch (err) {
    if (err.name === "JsonWebTokenError" || err.name === "TokenExpiredError") {
      return res.status(401).json({ error: "Invalid or expired token" });
    }
    console.error("Error updating driver location:", err);
    res.status(500).json({ error: "Failed to update driver location" });
  }
});

// ✅ Create a new driver (admin only)
r.post("/", requireAdmin, async (req, res) => {
  try {
    const { name, phone, email } = req.body;

    if (!name || !phone) {
      return res.status(400).json({ error: "Name and phone are required" });
    }

    const driver = new Driver({
      name,
      phone,
      email,
      isActive: true,
    });

    await driver.save();
    res.json(driver);
  } catch (err) {
    console.error("Error creating driver:", err);
    res.status(500).json({ error: "Failed to create driver" });
  }
});

export default r;

