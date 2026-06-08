import { StockBar } from './StockBar';
import { ActivityFeed } from './ActivityFeed';
import type { DropWithPurchases } from '../types/drop.types';

interface DropCardProps {
  drop: DropWithPurchases;
  onReserve?: (dropId: string) => void;
}

export function DropCard({ drop, onReserve }: DropCardProps) {
  const isSoldOut = drop.availableStock === 0;

  const handleReserve = () => {
    if (onReserve && !isSoldOut) {
      onReserve(drop.id);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
      <div className="p-6">
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

        <button
          className={`w-full mt-4 py-2 px-4 rounded-md font-medium transition-colors ${
            isSoldOut
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800'
          }`}
          disabled={isSoldOut}
          onClick={handleReserve}
        >
          {isSoldOut ? 'Sold Out' : 'Reserve Now'}
        </button>
      </div>
    </div>
  );
}
