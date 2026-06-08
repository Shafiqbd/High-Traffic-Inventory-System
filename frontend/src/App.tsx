import { useState, useEffect } from 'react';

// Static mock data for testing UI without backend
const MOCK_DROPS = [
  {
    id: 'drop1',
    name: 'Air Jordan 1 Retro High OG',
    price: '180.00',
    initialStock: 100,
    availableStock: 42,
    startsAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  },
  {
    id: 'drop2',
    name: 'Yeezy Boost 350 V2',
    price: '230.00',
    initialStock: 50,
    availableStock: 8,
    startsAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  },
  {
    id: 'drop3',
    name: 'Nike Dunk Low Retro',
    price: '110.00',
    initialStock: 75,
    availableStock: 0,
    startsAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  },
  {
    id: 'drop4',
    name: 'Adidas Forum Low 84',
    price: '100.00',
    initialStock: 60,
    availableStock: 55,
    startsAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  },
];

const MOCK_PURCHASES: Record<string, any[]> = {
  drop1: [
    { id: 'p1', userId: 'user_abc123', createdAt: new Date(Date.now() - 30000).toISOString() },
    { id: 'p2', userId: 'user_def456', createdAt: new Date(Date.now() - 60000).toISOString() },
    { id: 'p3', userId: 'user_ghi789', createdAt: new Date(Date.now() - 90000).toISOString() },
  ],
  drop2: [
    { id: 'p4', userId: 'user_jkl012', createdAt: new Date(Date.now() - 15000).toISOString() },
    { id: 'p5', userId: 'user_mno345', createdAt: new Date(Date.now() - 45000).toISOString() },
  ],
  drop3: [
    { id: 'p6', userId: 'user_pqr678', createdAt: new Date(Date.now() - 120000).toISOString() },
  ],
  drop4: [],
};

function App() {
  const [drops, setDrops] = useState(MOCK_DROPS);
  const [recentPurchases, setRecentPurchases] = useState<Record<string, any[]>>(MOCK_PURCHASES);

  // Simulate real-time stock updates (just for visual effect)
  useEffect(() => {
    const interval = setInterval(() => {
      setDrops((prev) =>
        prev.map((drop) => {
          if (drop.availableStock > 0 && Math.random() > 0.95) {
            const newStock = drop.availableStock - 1;
            const updatedDrop = { ...drop, availableStock: newStock };

            // Add a mock purchase
            if (Math.random() > 0.5) {
              const newPurchase = {
                id: `p${Date.now()}`,
                userId: `user_${Math.random().toString(36).substring(2, 11)}`,
                createdAt: new Date().toISOString(),
              };
              setRecentPurchases((prev) => ({
                ...prev,
                [drop.id]: [newPurchase, ...(prev[drop.id] || [])].slice(0, 3),
              }));
            }

            return updatedDrop;
          }
          return drop;
        })
      );
    }, 2000);

    return () => clearInterval(interval);
  }, []);

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
          <div className="text-center text-gray-600 py-12">
            No active drops at the moment
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {drops.map((drop) => (
              <DropCard
                key={drop.id}
                drop={drop}
                purchases={recentPurchases[drop.id] || []}
                onReserve={(dropId) => {
                  console.log('Reserve clicked for:', dropId);
                  // Will be connected to backend later
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function DropCard({ drop, purchases, onReserve }: { drop: any; purchases: any[]; onReserve: (dropId: string) => void }) {
  const stockPercentage = (drop.availableStock / drop.initialStock) * 100;
  const isLowStock = stockPercentage < 20;
  const isSoldOut = drop.availableStock === 0;

  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
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
              className={`h-2 rounded-full transition-all duration-300 ${
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

        {purchases.length > 0 && (
          <div className="border-t pt-4 mt-4">
            <h3 className="text-sm font-medium text-gray-700 mb-2">
              Latest Purchases
            </h3>
            <div className="space-y-1">
              {purchases.map((purchase) => (
                <div
                  key={purchase.id}
                  className="text-xs text-gray-600 flex items-center gap-2"
                >
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <span>User {purchase.userId.slice(-6)}</span>
                  <span className="text-gray-400">{formatTime(purchase.createdAt)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <button
          className={`w-full mt-4 py-2 px-4 rounded-md font-medium transition-colors ${
            isSoldOut
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800'
          }`}
          disabled={isSoldOut}
          onClick={() => onReserve(drop.id)}
        >
          {isSoldOut ? 'Sold Out' : 'Reserve Now'}
        </button>
      </div>
    </div>
  );
}

export default App;
