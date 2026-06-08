import { useEffect } from 'react';
import { useGetDropsQuery } from './services/drop/dropApi';
import { initializeSocket, joinDrop, leaveDrop, onStockUpdated, onPurchaseCompleted, cleanupSocket } from './services/socket';
import { DropCard } from './components/DropCard';
import { LoadingState, ErrorState, EmptyState } from './components/LoadingState';
import { updateRecentPurchases } from './store/slices/dropsSlice';
import { useDispatch } from 'react-redux';
import type { AppDispatch } from './store';

function App() {
  const dispatch = useDispatch<AppDispatch>();

  // RTK Query hook for fetching drops
  const { data: dropsResponse, isLoading, isError, error } = useGetDropsQuery();

  const drops = dropsResponse?.data || [];

  // Initialize Socket.io and set up real-time listeners
  useEffect(() => {
    const socket = initializeSocket();

    // Listen for stock updates
    onStockUpdated(({ dropId, availableStock }) => {
      // This will be handled by RTK Query's automatic refetch
      // or we can dispatch a manual update if needed
    });

    // Listen for purchase completions
    onPurchaseCompleted(({ dropId, recentPurchases }) => {
      dispatch(updateRecentPurchases({ dropId, purchases: recentPurchases }));
    });

    return () => {
      cleanupSocket();
    };
  }, [dispatch]);

  // Join/leave drop rooms when drops list changes
  useEffect(() => {
    if (drops.length === 0) return;

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

  // Loading state
  if (isLoading) {
    return <LoadingState />;
  }

  // Error state
  if (isError) {
    return <ErrorState message={error?.toString() || 'Failed to load drops'} />;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Sneaker Drops - Limited Edition
          </h1>
          <p className="text-gray-600">
            Reserve your favorite sneakers before they're gone!
          </p>
        </div>

        {drops.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {drops.map((drop) => (
              <DropCard
                key={drop.id}
                drop={drop}
                onReserve={(dropId) => {
                  console.log('Reserve clicked for:', dropId);
                  // TODO: Implement reserve functionality
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
