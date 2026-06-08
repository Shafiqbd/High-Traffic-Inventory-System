interface StockBarProps {
  availableStock: number;
  initialStock: number;
}

export function StockBar({ availableStock, initialStock }: StockBarProps) {
  const stockPercentage = (availableStock / initialStock) * 100;
  const isLowStock = stockPercentage < 20;
  const isSoldOut = availableStock === 0;

  const getBarColor = () => {
    if (isSoldOut) return 'bg-red-500';
    if (isLowStock) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getTextColor = () => {
    if (isSoldOut) return 'text-red-600';
    if (isLowStock) return 'text-red-600';
    return 'text-green-600';
  };

  return (
    <div className="mb-4">
      <div className="flex justify-between items-center mb-1">
        <span className="text-sm text-gray-600">Available Stock</span>
        <span className={`text-sm font-semibold ${getTextColor()}`}>
          {availableStock} / {initialStock}
        </span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className={`h-2 rounded-full transition-all duration-300 ${getBarColor()}`}
          style={{ width: `${Math.max(stockPercentage, 0)}%` }}
        />
      </div>
    </div>
  );
}
