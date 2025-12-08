import { RESTAURANT_LOCATION } from "./restaurantLocation.js";

/**
 * Calculate distance between two coordinates using Haversine formula
 * @param {number} lat1 - Latitude of first point
 * @param {number} lon1 - Longitude of first point
 * @param {number} lat2 - Latitude of second point
 * @param {number} lon2 - Longitude of second point
 * @returns {number} Distance in kilometers
 */
export function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in kilometers
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Check if promotion is still active (until March 8, 2025)
 * @returns {boolean}
 */
export function isPromotionActive() {
  const today = new Date();
  const promotionEndDate = new Date(2025, 2, 8); // March 8, 2025 (month is 0-indexed)
  return today <= promotionEndDate;
}

/**
 * Calculate delivery fee based on distance and order amount
 * @param {number} distanceKm - Distance in kilometers
 * @param {number} orderAmountCents - Order amount in cents
 * @returns {object} { feeCents: number, eligible: boolean, reason?: string }
 */
export function calculateDeliveryFee(distanceKm, orderAmountCents) {
  const orderAmountEuros = orderAmountCents / 100;
  const promotionActive = isPromotionActive();

  // Up to 2 km
  if (distanceKm <= 2) {
    if (orderAmountEuros >= 20) {
      return { feeCents: 0, eligible: true };
    }
    return {
      feeCents: 0,
      eligible: false,
      reason: "Mindestbestellwert von 20€ nicht erreicht",
    };
  }

  // Up to 4 km
  if (distanceKm <= 4) {
    if (orderAmountEuros >= 20) {
      // Free during promotion
      if (promotionActive) {
        return { feeCents: 0, eligible: true };
      }
      return { feeCents: 299, eligible: true }; // 2.99€
    }
    return {
      feeCents: promotionActive ? 0 : 299,
      eligible: false,
      reason: "Mindestbestellwert von 20€ nicht erreicht",
    };
  }

  // Up to 6 km
  if (distanceKm <= 6) {
    if (orderAmountEuros >= 30) {
      return { feeCents: 399, eligible: true }; // 3.99€
    }
    return {
      feeCents: 399,
      eligible: false,
      reason: "Mindestbestellwert von 30€ nicht erreicht",
    };
  }

  // Up to 8 km
  if (distanceKm <= 8) {
    if (orderAmountEuros >= 75) {
      return { feeCents: 499, eligible: true }; // 4.99€
    }
    return {
      feeCents: 499,
      eligible: false,
      reason: "Mindestbestellwert von 75€ nicht erreicht",
    };
  }

  // Beyond 8 km - not eligible
  return {
    feeCents: 0,
    eligible: false,
    reason: "Lieferung nur bis 8 km möglich",
  };
}

/**
 * Get delivery fee description text
 * @param {number} distanceKm - Distance in kilometers
 * @returns {string}
 */
export function getDeliveryFeeDescription(distanceKm) {
  const promotionActive = isPromotionActive();

  if (distanceKm <= 2) {
    return "Bis 2 km: Gratis (ab 20€)";
  }
  if (distanceKm <= 4) {
    return promotionActive
      ? "Bis 4 km: Gratis* (ab 20€) - Aktionsangebot bis 8. März"
      : "Bis 4 km: 2,99€ (ab 20€)";
  }
  if (distanceKm <= 6) {
    return "Bis 6 km: 3,99€ (ab 30€)";
  }
  if (distanceKm <= 8) {
    return "Bis 8 km: 4,99€ (ab 75€)";
  }
  return "Lieferung nur bis 8 km möglich";
}

