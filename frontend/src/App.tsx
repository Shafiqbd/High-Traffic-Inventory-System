import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { initializeSocket, joinDrop, leaveDrop, onStockUpdated, onPurchaseCompleted, cleanupSocket } from './services/socket';
import { fetchDrops, updateStock, updateRecentPurchases, selectAllDrops, selectDropsLoading, selectDropsError } from './store/slices/dropsSlice';
import type { RootState, AppDispatch } from './store';

function App() {
  const dispatch = useDispatch<AppDispatch>();
  const drops = useSelector(selectAllDrops);
  const loading = useSelector(selectDropsLoading);
  const error = useSelector(selectDropsError);

  useEffect(() => {
    // Fetch drops on mount
    dispatch(fetchDrops());

    // Initialize socket
    const socket = initializeSocket();

    // Listen for stock updates
    onStockUpdated(({ dropId, availableStock }) => {
      dispatch(updateStock({ dropId, availableStock }));
    });

    // Listen for purchase completions
    onPurchaseCompleted(({ dropId, recentPurchases }) => {
      dispatch(updateRecentPurchases({ dropId, purchases: recentPurchases }));
    });

    // Cleanup on unmount
    return () => {
      cleanupSocket();
    };
  }, [dispatch]);

  // Join/leave drop rooms when drops list changes
  useEffect(() => {
    const sock = initializeSocket();
    const dropIds = drops.map((d) => d.id);

    // Join all drop rooms
    dropIds.forEach((dropId) => {
      joinDrop(dropId);
    });

    return () => {
      // Leave all rooms on unmount
      dropIds.forEach((dropId) => {
        leaveDrop(dropId);
      });
    };
  }, [drops]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading drops...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-red-600">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Sneaker Drops - Limited Edition
        </h1>

        {drops.length === 0 ? (
          <div className="text-center text-gray-600 py-12">
            No active drops at the moment
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {drops.map((drop) => (
              <DropCard key={drop.id} drop={drop} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function DropCard({ drop }: { drop: any }) {
  const recentPurchases = useSelector((state: RootState) =>
    state.drops.recentPurchases[drop.id] || []
  );

  const stockPercentage = (drop.availableStock / drop.initialStock) * 100;
  const isLowStock = stockPercentage < 20;
  const isSoldOut = drop.availableStock === 0;

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          {drop.name}
        </h2>
        <div className="text-2xl font-bold text-gray-900 mb-4">
          ${drop.price}
        </div>

        <div className="mb-4">
          <div className="flex justify-between items-center mb-1">
            <span className="text-sm text-gray-600">Available Stock</span>
            <span
              className={`text-sm font-semibold ${
                isLowStock ? 'text-red-600' : 'text-green-600'
              }`}
            >
              {drop.availableStock} / {drop.initialStock}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all ${
                isSoldOut
                  ? 'bg-red-500'
                  : isLowStock
                  ? 'bg-yellow-500'
                  : 'bg-green-500'
              }`}
              style={{ width: `${Math.max(stockPercentage, 0)}%` }}
            />
          </div>
        </div>

        {recentPurchases.length > 0 && (
          <div className="border-t pt-4 mt-4">
            <h3 className="text-sm font-medium text-gray-700 mb-2">
              Latest Purchases
            </h3>
            <div className="space-y-1">
              {recentPurchases.map((purchase: any) => (
                <div
                  key={purchase.id}
                  className="text-xs text-gray-600 flex items-center gap-2"
                >
                  <span className="w-2 h-2 bg-green-500 rounded-full" />
                  <span>User {purchase.userId.slice(-6)}</span>
                  <span className="text-gray-400">
                    {new Date(purchase.createdAt).toLocaleTimeString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <button
          className={`w-full mt-4 py-2 px-4 rounded-md font-medium transition-colors ${
            isSoldOut
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
          disabled={isSoldOut}
        >
          {isSoldOut ? 'Sold Out' : 'Reserve Now'}
        </button>
      </div>
    </div>
  );
}

export default App;
