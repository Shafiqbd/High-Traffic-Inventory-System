import { useState } from "react";
import {
  EmptyState,
  ErrorState,
  LoadingState,
} from "../components/LoadingState";
import { useGetDropsQuery } from "../services/drop/dropApi";
import { DropCard } from "../components/DropCard";
import { Button } from "../components/ui/Button";
import { CreateDropModal } from "../components/CreateDropModal";
import { useSelector } from "react-redux";
import { useCreateReservationMutation } from "../services/reservations/reservationsApi";
import { toast } from "react-toastify";

function Home() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [isReserve, setIsReserve] = useState<boolean>(false);
const [reservation, setReservation] = useState<
  Record<string, any>
>({});

  const auth = useSelector((state: any) => state.auth);
  const { user } = auth;
  const [createReserve] = useCreateReservationMutation();

  const { data: dropsResponse, isLoading, isError, error } = useGetDropsQuery();

  const drops = dropsResponse?.data || [];

  // Loading state
  if (isLoading) {
    return <LoadingState />;
  }

  // Error state
  if (isError) {
    return <ErrorState message={error?.toString() || "Failed to load drops"} />;
  }

  const handleReserve = async (dropId: string) => {
    const payload = {
      dropId,
      userId: user.id,
    };

    try {
      const response: any = await createReserve(payload).unwrap();
      console.log("Reserving drop:", response);
      if (response) {
        toast.success(response.message);
        setIsReserve(true);
        setReservation(response.data);
      }
    } catch (error:any) {
      console.error("Error creating reservation:", error);
      toast.error(error.data.error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header with Create Button */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Sneaker Drops - Limited Edition
            </h1>
            <p className="text-gray-600">
              Reserve your favorite sneakers before they're gone!
            </p>
          </div>
          <Button onClick={() => setIsCreateModalOpen(true)} variant="primary">
            + Create Drop
          </Button>
        </div>

        {drops.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {drops.map((drop) => (
              <DropCard
                key={drop.id}
                drop={drop}
                onReserve={(dropId) => handleReserve(dropId)}
                isReserve={reservation?.dropId === drop.id}
                expiresAt = {reservation?.expiresAt}
              />
            ))}
          </div>
        )}
      </div>

      {/* Create Drop Modal */}
      <CreateDropModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
    </div>
  );
}

export default Home;
