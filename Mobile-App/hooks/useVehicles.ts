import { Vehicle, VehicleStats } from "@/constants/types";
import { subscribeVehicles } from "@/services/vehicleService";
import { useEffect, useRef, useState } from "react";
import { announceVehicleStatus } from "@/services/voiceAssistantService";

export type { VehicleStats };

export function useVehicles() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [stats, setStats] = useState<VehicleStats>({
    total: 0,
    moving: 0,
    idle: 0,
    offline: 0,
    disabled: 0,
    fenceBreachCount: 0
  });
  const previousVehiclesRef = useRef<Vehicle[]>([]);

  useEffect(() => {
    const unsubscribe = subscribeVehicles((updated) => {
      const previousById = new Map(previousVehiclesRef.current.map((vehicle) => [vehicle.id, vehicle]));
      setVehicles(updated);
      setStats({
        total: updated.length,
        moving: updated.filter((v) => v.status === "moving").length,
        idle: updated.filter((v) => v.status === "idle").length,
        offline: updated.filter((v) => v.status === "offline").length,
        disabled: updated.filter((v) => v.status === "disabled").length,
        fenceBreachCount: updated.filter((v) => v.isOutsideFence).length
      });

      updated.forEach((vehicle) => {
        const previous = previousById.get(vehicle.id);
        if (!previous) return;
        if (previous.status === vehicle.status && previous.isOutsideFence === vehicle.isOutsideFence) return;

        announceVehicleStatus({
          name: vehicle.name,
          status: vehicle.status,
          speed: vehicle.speed,
          outsideFence: vehicle.isOutsideFence,
        }).catch(() => undefined);
      });

      previousVehiclesRef.current = updated;
    });

    return unsubscribe;
  }, []);

  return { vehicles, stats };
}
