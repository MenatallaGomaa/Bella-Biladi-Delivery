# Driver Location Sharing - Technical Architecture

## Overview
This document explains how real-time driver location sharing works in the Bella Biladi delivery application. The system allows drivers to share their location, which is then visible to both customers (for their specific orders) and administrators (for all drivers).

## Architecture Components

### 1. **Driver Side (Location Sharing)**

**Technology Used:**
- **Browser Geolocation API** (`navigator.geolocation.watchPosition()`)
- **HTTP POST requests** to update location
- **WebSocket** for real-time updates (server-side)

**How it works:**

1. **Driver activates location sharing** (`Driver.jsx`):
   - Driver clicks "Standortfreigabe starten" button
   - Browser requests location permission (if not already granted)
   - `navigator.geolocation.watchPosition()` starts watching position

2. **Location updates are sent automatically**:
   ```javascript
   navigator.geolocation.watchPosition(
     async (position) => {
       const { latitude, longitude } = position.coords;
       
       // Send to server via POST request
       await fetch(`${API_BASE}/api/drivers/me/location`, {
         method: "POST",
         headers: {
           "Content-Type": "application/json",
           Authorization: `Bearer ${token}`,
         },
         body: JSON.stringify({ latitude, longitude }),
       });
     },
     // Error handling...
     {
       enableHighAccuracy: true,  // Use GPS when available
       timeout: 10000,            // 10 second timeout
       maximumAge: 5000,         // Accept cached location up to 5 seconds old
     }
   );
   ```

3. **Update frequency**: 
   - Browser automatically calls the callback whenever position changes significantly
   - Typically updates every few seconds when moving
   - Updates less frequently when stationary

**Key Files:**
- `client/src/pages/Driver.jsx` (lines 62-146)

---

### 2. **Server Side (Location Storage & Broadcasting)**

**Technology Used:**
- **Express.js** REST API
- **Socket.io** WebSocket server
- **MongoDB** for persistent storage

**How it works:**

1. **Location Update Endpoint** (`/api/drivers/me/location`):
   ```javascript
   // Server receives location update
   driver.currentLocation = {
     latitude: parseFloat(latitude),
     longitude: parseFloat(longitude),
     lastUpdated: new Date(),
   };
   await driver.save(); // Save to MongoDB
   ```

2. **Real-time Broadcasting via WebSocket**:
   ```javascript
   const io = req.app.get("io");
   if (io) {
     // Broadcast to order-specific room (for customers)
     if (driver.currentOrder) {
       io.to(`order-${driver.currentOrder}`).emit("driver-location-updated", {
         driverId: driver._id,
         driverName: driver.name,
         latitude: driver.currentLocation.latitude,
         longitude: driver.currentLocation.longitude,
         lastUpdated: driver.currentLocation.lastUpdated,
       });
     }
     
     // Broadcast to all admins
     io.emit("driver-location-update", {
       driverId: driver._id,
       driverName: driver.name,
       latitude: driver.currentLocation.latitude,
       longitude: driver.currentLocation.longitude,
       lastUpdated: driver.currentLocation.lastUpdated,
     });
   }
   ```

**Key Files:**
- `server/src/routes/drivers.js` (lines 138-199)
- `server/src/index.js` (lines 70-175) - WebSocket setup

---

### 3. **Customer Side (Viewing Driver Location)**

**Technology Used:**
- **Socket.io Client** for real-time updates
- **Leaflet.js** for map rendering
- **HTTP GET** for initial location fetch

**How it works:**

1. **Initial Location Fetch** (`Orders.jsx`):
   ```javascript
   // Fetch current driver location when order details are opened
   const res = await fetch(`${API_BASE}/api/orders/${orderId}/driver-location`, {
     headers: { Authorization: `Bearer ${token}` },
   });
   ```

2. **Real-time Updates via WebSocket**:
   ```javascript
   // Connect to WebSocket
   socketRef.current = io(API_BASE, {
     transports: ["websocket", "polling"],
   });

   // Join order-specific room
   socketRef.current.emit("join-order-room", orderId);

   // Listen for location updates
   socketRef.current.on("driver-location-updated", (data) => {
     setDriverLocation({
       latitude: data.latitude,
       longitude: data.longitude,
       lastUpdated: data.lastUpdated,
       driverName: data.driverName,
     });
   });
   ```

3. **Map Display** (`DriverMap.jsx`):
   - Uses Leaflet.js to render map
   - Shows driver marker (🚴), restaurant (🍕), and customer location
   - Updates marker position in real-time when location changes

**Key Files:**
- `client/src/pages/Orders.jsx` (lines 179-254)
- `client/src/components/DriverMap.jsx`

---

### 4. **Admin Side (Viewing All Driver Locations)**

**Technology Used:**
- **Socket.io Client** for real-time updates
- **HTTP GET** to fetch all drivers
- **Leaflet.js** for map rendering (if implemented)

**How it works:**

1. **Fetch All Drivers** (`Admin.jsx`):
   ```javascript
   const res = await fetch(`${API_BASE}/api/drivers`, {
     headers: { Authorization: `Bearer ${token}` },
   });
   ```

2. **Real-time Updates**:
   - Admins receive all `driver-location-update` events
   - Can see location of all active drivers in real-time

**Key Files:**
- `client/src/pages/Admin.jsx`
- `server/src/routes/drivers.js` (line 182) - broadcasts to all admins

---

## Data Flow Diagram

```
┌─────────────┐
│   Driver    │
│  (Browser)  │
└──────┬──────┘
       │
       │ 1. navigator.geolocation.watchPosition()
       │    (automatic GPS updates)
       │
       ▼
┌─────────────────────────────────────┐
│  Driver.jsx                         │
│  - Watches position changes         │
│  - Sends POST /api/drivers/me/      │
│    location every few seconds       │
└──────┬──────────────────────────────┘
       │
       │ 2. HTTP POST {latitude, longitude}
       │
       ▼
┌─────────────────────────────────────┐
│  Server (Express + Socket.io)      │
│  - Saves to MongoDB                 │
│  - Broadcasts via WebSocket         │
└──────┬──────────────┬───────────────┘
       │              │
       │              │
       │ 3a. WebSocket│ 3b. WebSocket
       │    emit to   │    emit to
       │    order room│    all admins
       │              │
       ▼              ▼
┌─────────────┐  ┌─────────────┐
│  Customer   │  │   Admin     │
│  (Orders)   │  │  (Admin)    │
│             │  │             │
│ - Receives  │  │ - Receives  │
│   updates   │  │   updates   │
│   in        │  │   for all   │
│   real-time │  │   drivers   │
│             │  │             │
│ - Shows on  │  │ - Shows on  │
│   map       │  │   map       │
└─────────────┘  └─────────────┘
```

---

## Technical Details

### Location Accuracy
- **High Accuracy Mode**: `enableHighAccuracy: true` uses GPS when available
- **Fallback**: Uses network-based location (WiFi, cell towers) if GPS unavailable
- **Update Frequency**: Browser determines based on movement (typically 1-5 seconds when moving)

### WebSocket Rooms
- **Order-specific rooms**: `order-${orderId}` - Only customers with that order receive updates
- **Admin broadcasts**: Global `io.emit()` - All admins receive all driver updates
- **Room joining**: Clients emit `join-order-room` event to subscribe

### Data Storage
- **MongoDB Schema** (`Driver` model):
  ```javascript
  currentLocation: {
    latitude: Number,
    longitude: Number,
    lastUpdated: Date,
  }
  ```
- **Persistence**: Location is saved to database for historical tracking
- **Real-time**: WebSocket provides instant updates without polling

### Security
- **Authentication**: JWT tokens required for all endpoints
- **Authorization**: 
  - Drivers can only update their own location
  - Customers can only see driver location for their orders
  - Admins can see all driver locations

---

## Browser Compatibility

### Geolocation API Support
- ✅ **Chrome/Edge**: Full support
- ✅ **Firefox**: Full support
- ✅ **Safari**: Full support (iOS 3.0+, macOS 10.6+)
- ✅ **Mobile browsers**: Full support (Android Chrome, iOS Safari)

### Requirements
- **HTTPS**: Required for production (geolocation API requires secure context)
- **User Permission**: Browser will prompt user to allow location access
- **Battery Impact**: Continuous GPS tracking can drain battery (expected behavior)

---

## Performance Considerations

1. **Update Frequency**: 
   - Browser throttles updates automatically based on movement
   - Stationary drivers update less frequently (saves battery)

2. **WebSocket Efficiency**:
   - Only sends updates when location changes
   - Uses rooms to target specific clients (reduces bandwidth)

3. **Database Writes**:
   - Each location update writes to MongoDB
   - Consider indexing `currentLocation` field for faster queries

---

## Future Enhancements

1. **Location History**: Store location trail for route visualization
2. **ETA Calculation**: Calculate estimated arrival time based on distance/speed
3. **Offline Support**: Queue location updates when offline, sync when online
4. **Battery Optimization**: Reduce update frequency when battery is low
5. **Geofencing**: Alert when driver arrives at restaurant/customer location

---

## Troubleshooting

### Driver location not updating
- Check browser console for geolocation errors
- Verify location permissions are granted
- Check network connectivity
- Verify WebSocket connection is established

### Customer not seeing driver location
- Verify driver has activated location sharing
- Check WebSocket connection in browser console
- Verify order has assigned driver
- Check if driver has `currentOrder` set

### Admin not seeing driver locations
- Verify admin role in JWT token
- Check WebSocket connection
- Verify `io.emit()` is being called on server

---

## API Endpoints

### Driver Endpoints
- `POST /api/drivers/me/location` - Update own location (driver only)
- `GET /api/drivers/me` - Get own driver info

### Order Endpoints
- `GET /api/orders/:id/driver-location` - Get driver location for order (customer/admin)

### Admin Endpoints
- `GET /api/drivers` - Get all drivers (admin only)

---

## WebSocket Events

### Client → Server
- `join-order-room` - Join room for order updates
- `leave-order-room` - Leave order room

### Server → Client
- `driver-location-updated` - Driver location update (order-specific room)
- `driver-location-update` - Driver location update (admin broadcast)
- `order-status-updated` - Order status change

---

## Summary

The driver location system uses:
1. **Browser Geolocation API** to get GPS coordinates
2. **HTTP POST** to send updates to server
3. **MongoDB** to store location persistently
4. **Socket.io WebSocket** to broadcast updates in real-time
5. **Leaflet.js** to display location on maps

This architecture provides:
- ✅ Real-time location updates
- ✅ Low latency (WebSocket)
- ✅ Efficient bandwidth usage (room-based targeting)
- ✅ Secure (JWT authentication)
- ✅ Scalable (can handle many concurrent drivers)




