import { StockBar } from "./StockBar";
import { ActivityFeed } from "./ActivityFeed";
import type { DropWithPurchases } from "../types/drop.types";
import { useEffect, useState, useRef } from "react";
import { formatTime } from "../utils/helper";

interface DropCardProps {
  drop: DropWithPurchases;
  onReserve?: (dropId: string) => void;
  onPurchase?: (dropId: string) => void;
  onReservationExpired?: (dropId: string) => void;
  isReserve?: boolean;
  expiresAt?: string;
}

export function DropCard({
  drop,
  onReserve,
  onPurchase,
  onReservationExpired,
  isReserve,
  expiresAt,
}: DropCardProps) {
  const isSoldOut = drop.availableStock === 0;
  const handleReserve = () => {
    if (onReserve && !isSoldOut) {
      onReserve(drop.id);
    }
  };

  const handlePurchase = () => {
    if (onPurchase && isReserve && !isSoldOut) {
      onPurchase(drop.id);
    }
  };

  const [timeLeft, setTimeLeft] = useState(0);
  const expirationHandledRef = useRef(false);

  useEffect(() => {
    if (!expiresAt) {
      expirationHandledRef.current = false;
      return;
    }

    expirationHandledRef.current = false;

    const updateTimer = () => {
      const now = Date.now();
      const expiry = new Date(expiresAt).getTime();
      const remaining = Math.max(0, Math.floor((expiry - now) / 1000));

      setTimeLeft(remaining);

      // When timer reaches 0 and hasn't been handled yet, notify parent
      if (remaining === 0 && !expirationHandledRef.current && onReservationExpired) {
        expirationHandledRef.current = true;
        onReservationExpired(drop.id);
      }
    };

    updateTimer();

    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [expiresAt, drop.id, onReservationExpired]);

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
      <div className="p-6 flex h-full flex-col justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            {drop.name}
          </h2>
          <div className="text-2xl font-bold text-gray-900 mb-4">
            ${drop.price}
          </div>

          <StockBar
            availableStock={drop.availableStock}
            initialStock={drop.initialStock}
          />

          {drop.recentPurchases && drop.recentPurchases.length > 0 && (
            <ActivityFeed purchases={drop.recentPurchases} />
          )}

          {isReserve && timeLeft > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
              <div className="flex justify-between items-center">
                <span className="font-medium text-blue-700">
                  Reserved By You
                </span>

                <span className="font-bold text-red-600">
                  ⏰ {formatTime(timeLeft)}
                </span>
              </div>

              <p className="text-xs text-gray-500 mt-1">
                Complete your purchase before reservation expires.
              </p>
            </div>
          )}
        </div>
  
        {isReserve && timeLeft > 0 ? (
          <button
            className={`w-full mt-2 py-2 px-4 rounded-md font-medium transition-colors ${
              isSoldOut
                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                : "bg-green-600 text-white hover:bg-green-700 active:bg-blue-800"
            }`}
            disabled={isSoldOut}
            onClick={handlePurchase}
          >
            Purchase Now
          </button>
        ) : (
          <button
            className={`w-full mt-2 py-2 px-4 rounded-md font-medium transition-colors ${
              isSoldOut
                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                : "bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800"
            }`}
            disabled={isSoldOut}
            onClick={handleReserve}
          >
            {isSoldOut ? "Sold Out" : "Reserve Now"}
          </button>
        )}
      </div>
    </div>
  );
}
