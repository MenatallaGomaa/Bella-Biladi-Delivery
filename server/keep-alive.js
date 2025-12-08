#!/usr/bin/env node

/**
 * Keep-alive ping script for Render.com backend
 * Pings the health check endpoint every 10 minutes to prevent cold starts
 * 
 * Usage:
 *   node keep-alive.js
 * 
 * Or run as a background service:
 *   nohup node keep-alive.js > keep-alive.log 2>&1 &
 * 
 * Or use PM2:
 *   pm2 start keep-alive.js --name keep-alive
 */

import dotenv from "dotenv";
dotenv.config();

const API_URL = process.env.API_URL || process.env.VITE_API_BASE_URL || "https://bella-biladi-api.onrender.com";
const PING_INTERVAL = 10 * 60 * 1000; // 10 minutes in milliseconds
const HEALTH_ENDPOINT = `${API_URL.replace(/\/+$/, "")}/api/health`;

console.log("🔄 Keep-alive ping service started");
console.log(`📍 Target: ${HEALTH_ENDPOINT}`);
console.log(`⏰ Interval: ${PING_INTERVAL / 1000 / 60} minutes`);

let pingCount = 0;
let lastSuccessTime = null;
let consecutiveFailures = 0;

async function ping() {
  pingCount++;
  const startTime = Date.now();
  
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000); // 30 second timeout
    
    const response = await fetch(HEALTH_ENDPOINT, {
      method: "GET",
      signal: controller.signal,
      headers: {
        "User-Agent": "BellaBiladi-KeepAlive/1.0"
      }
    });
    
    clearTimeout(timeout);
    const duration = Date.now() - startTime;
    
    if (response.ok) {
      const data = await response.json().catch(() => ({}));
      lastSuccessTime = new Date().toISOString();
      consecutiveFailures = 0;
      console.log(`✅ Ping #${pingCount} successful (${duration}ms) - Status: ${data.status || "ok"}`);
    } else {
      consecutiveFailures++;
      console.warn(`⚠️  Ping #${pingCount} failed - HTTP ${response.status} (${duration}ms)`);
    }
  } catch (error) {
    consecutiveFailures++;
    const duration = Date.now() - startTime;
    
    if (error.name === "AbortError") {
      console.error(`❌ Ping #${pingCount} timed out after ${duration}ms`);
    } else {
      console.error(`❌ Ping #${pingCount} error: ${error.message} (${duration}ms)`);
    }
    
    if (consecutiveFailures >= 3) {
      console.error(`🚨 ${consecutiveFailures} consecutive failures - backend may be down`);
    }
  }
}

// Initial ping
console.log("🚀 Starting initial ping...");
ping();

// Schedule periodic pings
const intervalId = setInterval(ping, PING_INTERVAL);

// Graceful shutdown
process.on("SIGINT", () => {
  console.log("\n🛑 Shutting down keep-alive service...");
  clearInterval(intervalId);
  console.log(`📊 Total pings sent: ${pingCount}`);
  if (lastSuccessTime) {
    console.log(`✅ Last successful ping: ${lastSuccessTime}`);
  }
  process.exit(0);
});

process.on("SIGTERM", () => {
  console.log("\n🛑 Shutting down keep-alive service...");
  clearInterval(intervalId);
  console.log(`📊 Total pings sent: ${pingCount}`);
  if (lastSuccessTime) {
    console.log(`✅ Last successful ping: ${lastSuccessTime}`);
  }
  process.exit(0);
});

