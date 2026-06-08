export function LoadingState() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <p className="mt-2 text-gray-600">Loading drops...</p>
      </div>
    </div>
  );
}

export function ErrorState({ message }: { message: string }) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="text-red-500 text-4xl mb-2">⚠️</div>
        <p className="text-red-600">{message}</p>
      </div>
    </div>
  );
}

export function EmptyState() {
  return (
    <div className="text-center text-gray-600 py-12">
      <div className="text-4xl mb-4">📦</div>
      <p>No active drops at the moment</p>
    </div>
  );
}
