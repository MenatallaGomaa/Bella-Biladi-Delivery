// Store hours configuration
// Monday-Saturday: 11:00-22:00, Sunday: 11:00-23:00
const STORE_HOURS = {
  0: { open: 11, close: 23 }, // Sunday
  1: { open: 11, close: 22 }, // Monday
  2: { open: 11, close: 22 }, // Tuesday
  3: { open: 11, close: 22 }, // Wednesday
  4: { open: 11, close: 22 }, // Thursday
  5: { open: 11, close: 22 }, // Friday
  6: { open: 11, close: 22 }, // Saturday
};

/**
 * Check if the store is currently open
 * @returns {boolean} True if store is open, false otherwise
 */
export function isStoreOpen() {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  const currentTimeInMinutes = currentHour * 60 + currentMinute;
  
  const storeHours = STORE_HOURS[dayOfWeek];
  if (!storeHours) {
    return false;
  }
  
  const openTime = storeHours.open * 60; // Convert to minutes
  const closeTime = storeHours.close * 60; // Convert to minutes
  const lastOrderTime = closeTime - 30; // Last 30 minutes no orders
  
  return currentTimeInMinutes >= openTime && currentTimeInMinutes < lastOrderTime;
}

/**
 * Get store opening hours as formatted string
 * @returns {string} Formatted opening hours
 */
export function getStoreHoursString() {
  const dayNames = ["Sonntag", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag"];
  
  // Group days with same hours
  const hoursMap = {};
  Object.keys(STORE_HOURS).forEach(day => {
    const key = `${STORE_HOURS[day].open}-${STORE_HOURS[day].close}`;
    if (!hoursMap[key]) {
      hoursMap[key] = [];
    }
    hoursMap[key].push(parseInt(day));
  });
  
  // Format hours
  const formatTime = (hour) => `${hour.toString().padStart(2, '0')}:00`;
  
  const parts = [];
  Object.keys(hoursMap).forEach(key => {
    const [open, close] = key.split('-').map(Number);
    const days = hoursMap[key];
    
    if (days.length === 1) {
      parts.push(`${dayNames[days[0]]}: ${formatTime(open)} - ${formatTime(close)} Uhr`);
    } else if (days.length === 2 && days.includes(0) && days.includes(6)) {
      parts.push(`${dayNames[0]} & ${dayNames[6]}: ${formatTime(open)} - ${formatTime(close)} Uhr`);
    } else {
      const dayLabels = days.map(d => dayNames[d]);
      const firstDay = dayLabels[0];
      const lastDay = dayLabels[dayLabels.length - 1];
      parts.push(`${firstDay} - ${lastDay}: ${formatTime(open)} - ${formatTime(close)} Uhr`);
    }
  });
  
  return parts.join('\n');
}

export { STORE_HOURS };

