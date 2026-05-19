import { Vehicle, VehicleStats } from "@/constants/types";
import { subscribeVehicles } from "@/services/vehicleService";
import { useEffect, useState } from "react";

export type { VehicleStats };

export function useVehicles() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [stats, setStats] = useState<VehicleStats>({
    total: 0,
    moving: 0,
    idle: 0,
    offline: 0,
    fenceBreachCount: 0
  });

  useEffect(() => {
    const unsubscribe = subscribeVehicles((updated) => {
      setVehicles(updated);
      setStats({
        total: updated.length,
        moving: updated.filter((v) => v.status === "moving").length,
        idle: updated.filter((v) => v.status === "idle").length,
        offline: updated.filter((v) => v.status === "offline").length,
        fenceBreachCount: updated.filter((v) => v.isOutsideFence).length
      });
    });

    return unsubscribe;
  }, []);

  return { vehicles, stats };
}
