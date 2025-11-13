import { Router } from "express";
import Driver from "../models/Driver.js";
import Order from "../models/Order.js";
import { requireAdmin } from "../middleware/auth.js";

const r = Router();

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

