import { useState, useEffect, useRef } from "react";
import {
  EmptyState,
  ErrorState,
  LoadingState,
} from "../components/LoadingState";
import { useGetDropsQuery } from "../services/drop/dropApi";
import { DropCard } from "../components/DropCard";
import { Button } from "../components/ui/Button";
import { useDispatch, useSelector } from "react-redux";
import { useCreateReservationMutation } from "../services/reservations/reservationsApi";
import { toast } from "react-toastify";
import { useCreatePurchaseMutation } from "../services/purchase/purchaseApi";
import { initializeSocket, joinDrop } from "../services/socket";
import { handleLogout } from "../store/slices/authSlice";

function Home() {
  const [reservation, setReservation] = useState<Record<string, any>>({});
  const [localDrops, setLocalDrops] = useState<any[]>([]);
  const dispatch = useDispatch();

  const auth = useSelector((state: any) => state.auth);
  const { user } = auth;
  const [createReserve] = useCreateReservationMutation();
  const [createPurchase] = useCreatePurchaseMutation();

  const { data: dropsResponse, isLoading, isError, error } = useGetDropsQuery();

  // Sync local drops with API data
  useEffect(() => {
    if (dropsResponse?.data) {
      setLocalDrops(dropsResponse.data);
    }
  }, [dropsResponse]);

  // Track if socket is initialized
  const socketInitialized = useRef(false);
  const socketInitializedRef = useRef<ReturnType<
    typeof initializeSocket
  > | null>(null);

  // Initialize Socket immediately (don't wait for drops)
  useEffect(() => {
    if (socketInitialized.current) {
      return;
    }

    const socket = initializeSocket();
    socketInitializedRef.current = socket;
    socketInitialized.current = true;

    console.log("✅ Socket initialized, setting up event listeners...");

    // Listen for drop activation events
    socket.on("drop:activated", (data: any) => {
      console.log("🎉 Drop activated event received:", data);
      setLocalDrops((prevDrops) => {
        // Check if drop already exists
        const exists = prevDrops.some((d) => d.id === data.id);
        if (exists) {
          // Update existing drop
          return prevDrops.map((drop) =>
            drop.id === data.id
              ? { ...drop, status: data.status, availableStock: data.availableStock }
              : drop
          );
        } else {
          // Add new drop
          return [...prevDrops, { ...data, recentPurchases: [] }];
        }
      });
    });

    // Listen for drop ended events (becomes UPCOMING)
    socket.on("drop:ended", (data: any) => {
      console.log("🏁 Drop ended event received:", data);
      setLocalDrops((prevDrops) =>
        prevDrops.map((drop) =>
          drop.id === data.dropId ? { ...drop, status: "UPCOMING" } : drop
        )
      );
    });

    // Listen for purchase completed events
    socket.on("purchase:completed", (data: any) => {
      console.log("💰 Purchase completed event received:", data);
      setLocalDrops((prevDrops) =>
        prevDrops.map((drop) =>
          drop.id === data.dropId
            ? { ...drop, recentPurchases: data.recentPurchases }
            : drop
        )
      );
    });

    // Listen for stock updated events
    socket.on("stock:updated", (data: any) => {
      console.log("📦 Stock updated event received:", data);
      setLocalDrops((prevDrops) =>
        prevDrops.map((drop) =>
          drop.id === data.dropId
            ? { ...drop, availableStock: data.availableStock }
            : drop
        )
      );
    });

    // Listen for reservation expired events
    socket.on("reservation:expired", (data: any) => {
      console.log("⏰ Reservation expired event received:", data);
      setLocalDrops((prevDrops) =>
        prevDrops.map((drop) =>
          drop.id === data.dropId
            ? { ...drop, availableStock: data.availableStock }
            : drop
        )
      );
    });

    return () => {
      // Cleanup on unmount
      if (socketInitializedRef.current) {
        socketInitializedRef.current.off("drop:activated");
        socketInitializedRef.current.off("drop:ended");
        socketInitializedRef.current.off("purchase:completed");
        socketInitializedRef.current.off("stock:updated");
        socketInitializedRef.current.off("reservation:expired");
      }
      socketInitialized.current = false;
    };
  }, []); // Run once on mount


  const drops = localDrops;

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
        setReservation(response.data);
      }
    } catch (error: any) {
      console.error("Error creating reservation:", error);
      toast.error(error.data.error);
    }
  };

  const handlePurchase = async (dropId: string) => {
    const payload = {
      dropId,
      userId: user.id,
    };

    try {
      const response: any = await createPurchase(payload).unwrap();
      console.log("purchase reserve:", response);
      if (response) {
        toast.success(response.message);
        setReservation({});
      }
    } catch (error: any) {
      console.error("Error creating purchase:", error);
      toast.error(error.data.error);
    }
  };

  const handleReservationExpired = (dropId: string) => {
    console.log("Reservation expired for drop:", dropId);

    // Clear the reservation state
    setReservation({});

    // Increment local stock immediately for instant UI feedback
    setLocalDrops((prevDrops) =>
      prevDrops.map((drop) =>
        drop.id === dropId
          ? { ...drop, availableStock: drop.availableStock + 1 }
          : drop,
      ),
    );
      toast.info("Your reservation has expired");

  };

  const onClicklogout =  ()=> {
    dispatch(handleLogout());

  }

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
          <Button onClick={onClicklogout} variant="secondary">
           Logout
          </Button> 
          
           {/* <Button onClick={() => setIsCreateModalOpen(true)} variant="primary">
            + Create Drop
          </Button> */}
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
                onPurchase={(dropId) => handlePurchase(dropId)}
                onReservationExpired={handleReservationExpired}
                isReserve={reservation?.dropId === drop.id}
                expiresAt={reservation?.expiresAt}
              />
            ))}
          </div>
        )}
      </div>

      {/* Create Drop Modal */}
      {/* <CreateDropModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      /> */}
    </div>
  );
}

export default Home;
