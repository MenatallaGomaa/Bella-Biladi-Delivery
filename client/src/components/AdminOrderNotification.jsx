import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "../pages/AuthContext";

// Normalize API base URL
const API_BASE = (import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_BASE || "http://localhost:4000").replace(/\/+$/, "");

export default function AdminOrderNotification({ onNavigate }) {
  const { user } = useAuth();
  const token = localStorage.getItem("token");
  
  const [newOrderPopup, setNewOrderPopup] = useState(null);
  const [confirmingOrderId, setConfirmingOrderId] = useState(null);
  const [orders, setOrders] = useState([]);
  const [userDismissedPopup, setUserDismissedPopup] = useState(false);
  // Track recently confirmed orders to prevent them from showing again
  const recentlyConfirmedRef = useRef(new Set());
  
  // Sound notification refs
  const audioContextRef = useRef(null);
  const audioSourceRef = useRef(null);
  const isPlayingRef = useRef(false);
  const popupTimerRef = useRef(null);
  const dismissTimeoutRef = useRef(null);
  // Use ref to track dismissal immediately (without waiting for state update)
  const userDismissedRef = useRef(false);
  // Track how many times popup has been shown for each order (max 3)
  const popupShowCountRef = useRef(new Map()); // Map<orderId, count>
  // HTML5 Audio fallback for better background playback
  const audioElementRef = useRef(null);
  const audioIntervalRef = useRef(null);

  // Check if user is admin
  const isAdmin = user?.role === "admin";

  // Function to create a beep sound as a data URL for HTML5 Audio (better background playback)
  const createBeepDataUrl = useCallback(() => {
    // Create a short beep sound using Web Audio API and export as WAV
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const sampleRate = audioContext.sampleRate;
    const duration = 0.4; // 400ms beep
    const numSamples = sampleRate * duration;
    const buffer = audioContext.createBuffer(1, numSamples, sampleRate);
    const data = buffer.getChannelData(0);
    
    // Generate sine wave at 800Hz with envelope
    const frequency = 800;
    for (let i = 0; i < numSamples; i++) {
      const t = i / sampleRate;
      // Apply envelope (fade in/out)
      let envelope = 1;
      if (t < 0.1) {
        envelope = t / 0.1; // Fade in
      } else if (t > 0.3) {
        envelope = (0.4 - t) / 0.1; // Fade out
      }
      data[i] = Math.sin(2 * Math.PI * frequency * t) * envelope * 0.8; // 0.8 = volume
    }
    
    // Convert to WAV (simplified inline WAV encoder)
    const writeString = (view, offset, string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };
    
    const floatTo16BitPCM = (output, offset, input) => {
      for (let i = 0; i < input.length; i++, offset += 2) {
        const s = Math.max(-1, Math.min(1, input[i]));
        output.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
      }
    };
    
    const arrayBuffer = new ArrayBuffer(44 + numSamples * 2);
    const view = new DataView(arrayBuffer);
    
    // WAV header
    writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + numSamples * 2, true);
    writeString(view, 8, 'WAVE');
    writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    writeString(view, 36, 'data');
    view.setUint32(40, numSamples * 2, true);
    floatTo16BitPCM(view, 44, data);
    
    audioContext.close();
    
    const blob = new Blob([arrayBuffer], { type: 'audio/wav' });
    return URL.createObjectURL(blob);
  }, []);

  // Function to play notification sound (looping until stopped) - LOUD and works in background
  const playNotificationSound = useCallback(() => {
    try {
      // Don't start if already playing
      if (isPlayingRef.current) return;
      
      isPlayingRef.current = true;

      // Method 1: HTML5 Audio (works better in background tabs)
      if (!audioElementRef.current) {
        const beepUrl = createBeepDataUrl();
        audioElementRef.current = new Audio(beepUrl);
        audioElementRef.current.volume = 1.0; // Maximum volume
        audioElementRef.current.preload = 'auto';
      }
      
      // Play the audio element in a loop
      const playAudioLoop = () => {
        if (!isPlayingRef.current) return;
        
        const audio = audioElementRef.current;
        if (audio) {
          audio.currentTime = 0;
          audio.play().catch((err) => {
            console.warn("HTML5 Audio play failed:", err);
          });
        }
      };
      
      // Play immediately and then every 500ms
      playAudioLoop();
      audioIntervalRef.current = setInterval(playAudioLoop, 500);

      // Method 2: Web Audio API as fallback (for better quality when tab is focused)
      // Create audio context if it doesn't exist
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      }

      const audioContext = audioContextRef.current;
      
      // Resume audio context if suspended (required for user interaction)
      if (audioContext.state === 'suspended') {
        audioContext.resume();
      }

      const playBeep = () => {
        if (!isPlayingRef.current) return;
        
        // Stop any currently playing sound
        if (audioSourceRef.current) {
          try {
            audioSourceRef.current.stop();
            audioSourceRef.current.disconnect();
          } catch (e) {
            // Ignore errors if already stopped
          }
          audioSourceRef.current = null;
        }

        // Create oscillator for notification sound (pleasant beep)
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        // Set frequency for a pleasant notification tone (800Hz)
        oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
        oscillator.type = 'sine';

        // Set volume envelope (fade in and out) - LOUDER for better noticeability
        gainNode.gain.setValueAtTime(0, audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.8, audioContext.currentTime + 0.1);
        gainNode.gain.linearRampToValueAtTime(0.8, audioContext.currentTime + 0.2);
        gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.4);

        // Play the sound
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.4);

        // Store reference to stop if needed
        audioSourceRef.current = oscillator;

        // Schedule next beep if still playing
        if (isPlayingRef.current) {
          setTimeout(() => {
            if (isPlayingRef.current) {
              playBeep();
            }
          }, 500); // Wait 500ms between beeps (0.4s sound + 0.1s pause)
        }
      };

      // Start Web Audio API beeps as well
      playBeep();
    } catch (err) {
      console.warn("Could not play notification sound:", err);
      isPlayingRef.current = false;
    }
  }, [createBeepDataUrl]);

  // Function to stop notification sound
  const stopNotificationSound = useCallback(() => {
    try {
      // Stop Web Audio API
      if (audioSourceRef.current) {
        audioSourceRef.current.stop();
        audioSourceRef.current.disconnect();
        audioSourceRef.current = null;
      }
      
      // Stop HTML5 Audio
      if (audioElementRef.current) {
        audioElementRef.current.pause();
        audioElementRef.current.currentTime = 0;
      }
      
      // Clear interval
      if (audioIntervalRef.current) {
        clearInterval(audioIntervalRef.current);
        audioIntervalRef.current = null;
      }
      
      isPlayingRef.current = false;
    } catch (err) {
      console.warn("Could not stop notification sound:", err);
    }
  }, []);

  // Fetch orders and check for unconfirmed ones
  const fetchOrders = useCallback(async (forceShowPopup = false) => {
    if (!token || !isAdmin) {
      console.log("🔔 AdminOrderNotification: Not admin or no token", { isAdmin, hasToken: !!token });
      return;
    }
    
    try {
      const headers = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      };
      
      const res = await fetch(`${API_BASE}/api/orders?status=new`, { headers });
      if (!res.ok) {
        console.log("🔔 AdminOrderNotification: API request failed", res.status);
        return;
      }
      
      // Read response body only once
      const data = await res.json();
      const ordersList = Array.isArray(data) ? data : [];
      
      console.log("🔔 AdminOrderNotification: Fetched orders", { count: ordersList.length, forceShowPopup, hasCurrentPopup: !!newOrderPopup, userDismissed: userDismissedPopup });
      
      // Update orders list
      setOrders(ordersList);
      
      // Filter out recently confirmed orders
      const filteredOrders = ordersList.filter((order) => {
        const orderId = order._id || order.ref;
        return !recentlyConfirmedRef.current.has(orderId);
      });
      
      // If current popup is a recently confirmed order, close it
      if (newOrderPopup) {
        const currentPopupOrderId = newOrderPopup._id || newOrderPopup.ref;
        if (recentlyConfirmedRef.current.has(currentPopupOrderId)) {
          console.log("🔔 AdminOrderNotification: Closing popup for recently confirmed order", currentPopupOrderId);
          setNewOrderPopup(null);
        }
      }
      
      // If there are unconfirmed orders, show the first one (or force show if requested)
      if (filteredOrders.length > 0) {
        const currentOrder = filteredOrders[0];
        const orderId = currentOrder._id || currentOrder.ref;
        const showCount = popupShowCountRef.current.get(orderId) || 0;
        const maxReminders = 3;
        
        // Check if we've already shown the popup 3 times for this order
        if (showCount >= maxReminders) {
          console.log("🔔 AdminOrderNotification: Maximum reminders (3) reached for order", currentOrder.ref);
          // Don't show popup anymore, but keep the order in the list
          return;
        }
        
        // Only show popup if user hasn't dismissed it recently
        // Check both state and ref to avoid race conditions
        const isDismissed = userDismissedPopup || userDismissedRef.current;
        // Even if forceShowPopup is true, respect user dismissal for 30 seconds
        if (!isDismissed && (forceShowPopup || !newOrderPopup)) {
          console.log("🔔 AdminOrderNotification: Showing popup for order", currentOrder.ref, `(reminder ${showCount + 1}/${maxReminders})`);
          // Increment show count for this order
          popupShowCountRef.current.set(orderId, showCount + 1);
          setNewOrderPopup(currentOrder);
          setUserDismissedPopup(false);
          userDismissedRef.current = false;
        } else if (isDismissed) {
          console.log("🔔 AdminOrderNotification: Popup dismissed by user, not showing");
        }
      } else {
        // No unconfirmed orders, close popup if open and reset counters
        console.log("🔔 AdminOrderNotification: No unconfirmed orders, closing popup");
        setNewOrderPopup(null);
        setUserDismissedPopup(false);
        userDismissedRef.current = false;
        popupShowCountRef.current.clear();
      }
    } catch (err) {
      console.error("🔔 AdminOrderNotification: Error fetching orders:", err);
    }
  }, [token, isAdmin, newOrderPopup, userDismissedPopup]);

  // Poll for unconfirmed orders every 5 seconds when admin is logged in
  useEffect(() => {
    if (!isAdmin || !token) return;
    
    // Initial fetch - show popup immediately if there are orders
    fetchOrders(true);
    
    // Poll every 5 seconds to check for new orders
    const interval = setInterval(() => {
      fetchOrders(false);
    }, 5000);

    return () => clearInterval(interval);
  }, [isAdmin, token, fetchOrders]);

  // Show popup every 30 seconds if there are unconfirmed orders (max 3 times)
  useEffect(() => {
    if (!isAdmin || !token) return;
    
    // Clear any existing timer
    if (popupTimerRef.current) {
      clearInterval(popupTimerRef.current);
      popupTimerRef.current = null;
    }
    
    // If there are unconfirmed orders, check if we should show reminders
    if (orders.length > 0) {
      const currentOrder = orders[0];
      const orderId = currentOrder._id || currentOrder.ref;
      const showCount = popupShowCountRef.current.get(orderId) || 0;
      const maxReminders = 3;
      
      // Only set up timer if we haven't reached max reminders
      if (showCount < maxReminders) {
        // Set up timer to force show popup every 30 seconds
        popupTimerRef.current = setInterval(() => {
          // Always call fetchOrders which will check current state and show count
          // fetchOrders will check if we've reached max reminders and won't show if we have
          fetchOrders(true);
        }, 30000); // 30 seconds
        
        return () => {
          if (popupTimerRef.current) {
            clearInterval(popupTimerRef.current);
            popupTimerRef.current = null;
          }
        };
      } else {
        // Already shown 3 times, don't set up timer
        console.log("🔔 AdminOrderNotification: Max reminders reached, stopping timer for order", currentOrder.ref);
      }
    } else {
      // No unconfirmed orders, clear timer
      if (popupTimerRef.current) {
        clearInterval(popupTimerRef.current);
        popupTimerRef.current = null;
      }
    }
  }, [isAdmin, token, orders, fetchOrders]);

  // Play sound when new order popup appears, stop when it disappears
  useEffect(() => {
    if (newOrderPopup) {
      // Play notification sound when new order arrives (only if not already playing)
      if (!isPlayingRef.current) {
        playNotificationSound();
      }
    } else {
      // Stop sound when popup is closed
      stopNotificationSound();
    }
  }, [newOrderPopup, playNotificationSound, stopNotificationSound]);

  // Cleanup audio context and timers on unmount
  useEffect(() => {
    return () => {
      stopNotificationSound();
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => {});
      }
      if (audioElementRef.current) {
        const url = audioElementRef.current.src;
        audioElementRef.current.pause();
        audioElementRef.current = null;
        if (url && url.startsWith('blob:')) {
          URL.revokeObjectURL(url);
        }
      }
      if (audioIntervalRef.current) {
        clearInterval(audioIntervalRef.current);
      }
      if (popupTimerRef.current) {
        clearInterval(popupTimerRef.current);
      }
      if (dismissTimeoutRef.current) {
        clearTimeout(dismissTimeoutRef.current);
      }
    };
  }, [stopNotificationSound]);

  // Confirm order function
  const confirmOrder = async (orderId) => {
    if (!token) return;
    try {
      setConfirmingOrderId(orderId);
      
      // Stop notification sound when confirming order
      stopNotificationSound();
      
      const headers = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      };
      
      const res = await fetch(`${API_BASE}/api/orders/${orderId}/confirm`, {
        method: "POST",
        headers,
      });
      
      if (!res.ok) throw new Error("Bestätigung fehlgeschlagen");
      
      // Reset show count for this order since it's confirmed
      popupShowCountRef.current.delete(orderId);
      
      // Mark this order as recently confirmed to prevent it from showing again
      recentlyConfirmedRef.current.add(orderId);
      
      // Close current popup immediately
      setNewOrderPopup(null);
      
      // Remove this order from the orders list immediately (optimistic update)
      setOrders((prevOrders) => prevOrders.filter((o) => (o._id || o.ref) !== orderId));
      
      // Reset dismissal flags so next order can show automatically
      setUserDismissedPopup(false);
      userDismissedRef.current = false;
      
      // Clear any existing dismiss timeout
      if (dismissTimeoutRef.current) {
        clearTimeout(dismissTimeoutRef.current);
        dismissTimeoutRef.current = null;
      }
      
      // Clear the reminder timer
      if (popupTimerRef.current) {
        clearInterval(popupTimerRef.current);
        popupTimerRef.current = null;
      }
      
      // Wait a moment for backend to process, then fetch next order
      // This ensures the backend has updated the order status before we fetch
      setTimeout(async () => {
        await fetchOrders(true); // Force show popup for next order
        
        // Remove from recently confirmed set after 10 seconds (order should be filtered by backend by then)
        setTimeout(() => {
          recentlyConfirmedRef.current.delete(orderId);
        }, 10000);
      }, 500);
    } catch (err) {
      alert(`Fehler: ${err.message}`);
    } finally {
      setConfirmingOrderId(null);
    }
  };

  // Debug logging
  useEffect(() => {
    console.log("🔔 AdminOrderNotification: Render check", { 
      isAdmin, 
      hasPopup: !!newOrderPopup, 
      ordersCount: orders.length,
      popupOrderRef: newOrderPopup?.ref 
    });
  }, [isAdmin, newOrderPopup, orders.length]);

  // Don't render anything if not admin
  if (!isAdmin || !newOrderPopup) return null;

  return (
    <div 
      className="fixed inset-0 bg-amber-300 bg-opacity-80 flex items-center justify-center z-50 p-2 xs:p-3 sm:p-4 overflow-y-auto"
      onClick={(e) => {
        // Close popup when clicking outside
        if (e.target === e.currentTarget) {
          stopNotificationSound();
          // Immediately set ref to prevent race conditions
          userDismissedRef.current = true;
          if (popupTimerRef.current) {
            clearInterval(popupTimerRef.current);
            popupTimerRef.current = null;
          }
          // Mark as dismissed and prevent popup from showing for 30 seconds
          // Note: We don't reset the show count, so reminders will continue up to 3 times
          setUserDismissedPopup(true);
          setNewOrderPopup(null);
          // Reset dismissed flag after 30 seconds so popup can show again (if under max reminders)
          if (dismissTimeoutRef.current) {
            clearTimeout(dismissTimeoutRef.current);
          }
          dismissTimeoutRef.current = setTimeout(() => {
            setUserDismissedPopup(false);
            userDismissedRef.current = false;
          }, 30000);
        }
      }}
    >
      <div 
        className="bg-white rounded-lg xs:rounded-xl sm:rounded-2xl shadow-2xl max-w-2xl w-full max-h-[98vh] xs:max-h-[95vh] sm:max-h-[90vh] overflow-y-auto my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-red-600 to-red-800 p-3 xs:p-4 sm:p-6 rounded-t-lg xs:rounded-t-xl sm:rounded-t-2xl sticky top-0 z-10">
          <div className="flex items-start justify-between gap-2 xs:gap-3">
            <div className="flex-1 min-w-0 pr-2">
              <h2 className="text-lg xs:text-xl sm:text-2xl font-bold text-white break-words leading-tight">🚨 NEUE BESTELLUNG</h2>
              <p className="text-red-100 mt-1 text-xs xs:text-sm sm:text-base break-words">Bestellnummer: {newOrderPopup.ref}</p>
              {(() => {
                const orderId = newOrderPopup._id || newOrderPopup.ref;
                const showCount = popupShowCountRef.current.get(orderId) || 0;
                const maxReminders = 3;
                if (showCount > 0 && showCount <= maxReminders) {
                  return (
                    <p className="text-red-200 mt-1 text-xs xs:text-sm font-semibold break-words">
                      Erinnerung {showCount} von {maxReminders}
                    </p>
                  );
                }
                return null;
              })()}
            </div>
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log("🔔 Close button clicked");
                stopNotificationSound();
                // Immediately set ref to prevent race conditions
                userDismissedRef.current = true;
                // Clear the timer so popup doesn't reappear immediately
                if (popupTimerRef.current) {
                  clearInterval(popupTimerRef.current);
                  popupTimerRef.current = null;
                }
                // Mark as dismissed and prevent popup from showing for 30 seconds
                // Note: We don't reset the show count, so reminders will continue up to 3 times
                setUserDismissedPopup(true);
                setNewOrderPopup(null);
                // Reset dismissed flag after 30 seconds so popup can show again (if under max reminders)
                if (dismissTimeoutRef.current) {
                  clearTimeout(dismissTimeoutRef.current);
                }
                dismissTimeoutRef.current = setTimeout(() => {
                  setUserDismissedPopup(false);
                  userDismissedRef.current = false;
                }, 30000);
              }}
              className="text-white hover:text-red-200 active:bg-red-700 text-xl xs:text-2xl sm:text-3xl font-bold flex-shrink-0 w-7 h-7 xs:w-8 xs:h-8 sm:w-10 sm:h-10 flex items-center justify-center rounded-full hover:bg-red-700 transition-colors touch-manipulation"
              aria-label="Schließen"
              type="button"
            >
              ×
            </button>
          </div>
        </div>
        
        {/* Content */}
        <div className="p-3 xs:p-4 sm:p-6 space-y-3 xs:space-y-4">
          {/* Customer Info */}
          <div className="bg-gray-50 rounded-lg p-2.5 xs:p-3 sm:p-4">
            <h3 className="font-semibold text-sm xs:text-base sm:text-lg mb-1.5 xs:mb-2">👤 Kundeninformationen</h3>
            <div className="space-y-1 xs:space-y-1.5 text-xs xs:text-sm">
              <p className="break-words leading-relaxed"><strong>Name:</strong> {newOrderPopup.customer?.name || "Nicht angegeben"}</p>
              <p className="break-words leading-relaxed"><strong>E-Mail:</strong> {newOrderPopup.customer?.email || "Nicht angegeben"}</p>
              <p className="break-words leading-relaxed"><strong>Telefon:</strong> {newOrderPopup.customer?.phone || "Nicht angegeben"}</p>
              {newOrderPopup.customer?.address && (
                <p className="break-words leading-relaxed"><strong>Adresse:</strong> {newOrderPopup.customer.address}</p>
              )}
              {newOrderPopup.customer?.desiredTime && (
                <p className="break-words leading-relaxed"><strong>{newOrderPopup.channel === "pickup" ? "Gewünschte Abholzeit:" : "Gewünschte Lieferzeit:"}</strong> {newOrderPopup.customer.desiredTime}</p>
              )}
              {newOrderPopup.customer?.notes && (
                <p className="mt-2 text-gray-600 break-words leading-relaxed"><strong>Notiz:</strong> {newOrderPopup.customer.notes}</p>
              )}
            </div>
          </div>

          {/* Order Items */}
          <div className="bg-white border border-gray-200 rounded-lg p-2.5 xs:p-3 sm:p-4">
            <h3 className="font-semibold text-sm xs:text-base sm:text-lg mb-2 xs:mb-3">🛒 Bestellung</h3>
            <div className="space-y-1.5 xs:space-y-2">
              {newOrderPopup.items?.map((item, idx) => (
                <div key={idx} className="flex justify-between items-start gap-2 py-1.5 xs:py-2 border-b border-gray-100 last:border-b-0">
                  <span className="font-medium text-xs xs:text-sm sm:text-base flex-1 break-words leading-relaxed">{item.qty}× {item.name}</span>
                  <span className="text-red-600 font-bold text-xs xs:text-sm sm:text-base flex-shrink-0 whitespace-nowrap ml-2">
                    €{((item.priceCents * item.qty) / 100).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-3 xs:mt-4 pt-3 xs:pt-4 border-t-2 border-red-600">
              <div className="flex justify-between items-center gap-2">
                <span className="text-sm xs:text-base sm:text-lg font-bold">Gesamtbetrag:</span>
                <span className="text-lg xs:text-xl sm:text-2xl font-bold text-red-600 whitespace-nowrap">
                  €{((newOrderPopup.totals?.grandTotalCents || 0) / 100).toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-2 xs:gap-2.5 sm:gap-3 pt-2 xs:pt-2.5 sm:pt-4">
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log("🔔 Confirm Order button clicked");
                confirmOrder(newOrderPopup._id);
              }}
              disabled={confirmingOrderId === newOrderPopup._id}
              className="w-full bg-green-600 hover:bg-green-700 active:bg-green-800 text-white font-bold py-2.5 xs:py-3 px-3 xs:px-4 sm:px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-xs xs:text-sm sm:text-base touch-manipulation min-h-[44px] flex items-center justify-center"
              type="button"
            >
              {confirmingOrderId === newOrderPopup._id ? "Wird bestätigt..." : "✅ Bestellung bestätigen"}
            </button>
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log("🔔 Edit Later button clicked");
                stopNotificationSound();
                // Immediately set ref to prevent race conditions
                userDismissedRef.current = true;
                // Clear the timer so popup doesn't reappear immediately
                if (popupTimerRef.current) {
                  clearInterval(popupTimerRef.current);
                  popupTimerRef.current = null;
                }
                // Close popup immediately
                setNewOrderPopup(null);
                // Mark as dismissed to prevent popup from showing again for 30 seconds
                // Note: We don't reset the show count, so reminders will continue up to 3 times
                setUserDismissedPopup(true);
                // Reset dismissed flag after 30 seconds so popup can show again (if under max reminders)
                if (dismissTimeoutRef.current) {
                  clearTimeout(dismissTimeoutRef.current);
                }
                dismissTimeoutRef.current = setTimeout(() => {
                  console.log("🔔 AdminOrderNotification: Dismiss timeout expired, popup can show again");
                  setUserDismissedPopup(false);
                  userDismissedRef.current = false;
                }, 30000);
              }}
              className="w-full bg-gray-300 hover:bg-gray-400 active:bg-gray-500 text-gray-800 font-bold py-2.5 xs:py-3 px-3 xs:px-4 sm:px-6 rounded-lg transition-colors text-xs xs:text-sm sm:text-base touch-manipulation min-h-[44px] flex items-center justify-center"
              type="button"
            >
              Später bearbeiten
            </button>
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log("🔔 Go to Dashboard button clicked", { onNavigate: !!onNavigate });
                stopNotificationSound();
                // Immediately set ref to prevent race conditions
                userDismissedRef.current = true;
                // Clear the timer so popup doesn't reappear immediately
                if (popupTimerRef.current) {
                  clearInterval(popupTimerRef.current);
                  popupTimerRef.current = null;
                }
                // Close popup immediately
                setNewOrderPopup(null);
                // Mark as dismissed
                setUserDismissedPopup(true);
                // Reset dismissed flag after 30 seconds so popup can show again
                if (dismissTimeoutRef.current) {
                  clearTimeout(dismissTimeoutRef.current);
                }
                dismissTimeoutRef.current = setTimeout(() => {
                  setUserDismissedPopup(false);
                  userDismissedRef.current = false;
                }, 30000);
                // Navigate immediately
                if (onNavigate && typeof onNavigate === 'function') {
                  console.log("🔔 Navigating to Admin dashboard");
                  // Use setTimeout to ensure state updates complete before navigation
                  setTimeout(() => {
                    onNavigate("Admin");
                  }, 0);
                } else {
                  console.error("🔔 onNavigate is not available or not a function", { onNavigate });
                }
              }}
              className="w-full bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white font-bold py-2.5 xs:py-3 px-3 xs:px-4 sm:px-6 rounded-lg transition-colors text-xs xs:text-sm sm:text-base touch-manipulation min-h-[44px] flex items-center justify-center"
              type="button"
            >
              Zum Dashboard
            </button>
          </div>
          
          <p className="text-[10px] xs:text-xs text-gray-500 text-center mt-1.5 xs:mt-2 px-1 xs:px-2 leading-relaxed">
            ⚡ Bitte sofort bearbeiten - Der Kunde erhält erst nach Ihrer Bestätigung eine E-Mail
          </p>
          {orders.length > 1 && (
            <p className="text-[10px] xs:text-xs text-amber-600 text-center mt-1.5 xs:mt-2 font-semibold px-1 xs:px-2 leading-relaxed">
              ⚠️ Es gibt noch {orders.length - 1} weitere unbestätigte Bestellung{orders.length - 1 > 1 ? 'en' : ''}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

