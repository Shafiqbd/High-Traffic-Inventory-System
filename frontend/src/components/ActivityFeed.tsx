import type { Purchase } from "../types/drop.types";

interface ActivityFeedProps {
  purchases: Purchase[];
}

export function ActivityFeed({ purchases }: ActivityFeedProps) {
  if (purchases.length === 0) {
    return null;
  }

  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };


  return (
    <div className="border-t pt-2 mt-2 mb-4">
      <h3 className="text-sm font-medium text-gray-700 mb-2">
        Latest Purchases
      </h3>
      <div className="space-y-1">
        {purchases.map((purchase) => (
          <div
            key={purchase.id}
            className="text-xs text-gray-600 flex items-center gap-12"
          >
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="font-semibold capitalize">{purchase.userName} </span>
            </div>

            <span className="text-gray-400">
              {formatTime(purchase.purchasedAt as string)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
