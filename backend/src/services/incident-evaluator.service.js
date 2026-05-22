function createId(parts) {
  return parts.join(':').replace(/\s+/g, '-').toLowerCase();
}

function metersBetween(lat1, lon1, lat2, lon2) {
  const earthRadius = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return earthRadius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function activeZoneFor(vehicle, zones) {
  const vehicleZones = zones.filter((zone) => zone.vehicleId === vehicle.id);
  if (vehicleZones.length === 0) return null;

  const hour = new Date(vehicle.lastSeen || Date.now()).getHours();
  return (
    vehicleZones.find((zone) => {
      if (zone.activeFromHour == null || zone.activeToHour == null) return true;
      if (zone.activeFromHour <= zone.activeToHour) {
        return hour >= zone.activeFromHour && hour < zone.activeToHour;
      }
      return hour >= zone.activeFromHour || hour < zone.activeToHour;
    }) || vehicleZones[0]
  );
}

function isOutsideActiveZone(currentPoint, activeZone) {
  if (!activeZone) return currentPoint.isOutsideFence;
  const distance = metersBetween(
    currentPoint.latitude,
    currentPoint.longitude,
    activeZone.latitude,
    activeZone.longitude
  );
  return distance > activeZone.radius;
}

function buildIncidentsForVehicle(vehicle, currentPoint, previousPoint, activeZone, protectionStates, todayPoints) {
  const incidents = [];
  const protection = protectionStates.find((entry) => entry.vehicleId === vehicle.id);
  const ageMinutes = Math.round((Date.now() - new Date(currentPoint.timestamp).getTime()) / 60000);
  const currentHour = new Date(currentPoint.timestamp).getHours();
  const overspeedCount = todayPoints.filter((point) => point.speed >= 80).length;
  const outsideZone = isOutsideActiveZone(currentPoint, activeZone);

  if (outsideZone) {
    incidents.push({
      incidentKey: createId([vehicle.id, currentPoint.timestamp.slice(0, 16), 'geofence']),
      vehicleId: vehicle.id,
      vehicleName: vehicle.name,
      timestamp: new Date(currentPoint.timestamp),
      title: 'Vehicle outside assigned zone',
      description: `${vehicle.name} is outside the permitted area.`,
      severity: 'warning',
      category: 'geofence',
      relatedZoneName: activeZone ? activeZone.name : null,
      payload: { currentPoint },
    });
  }

  if (ageMinutes >= 10) {
    incidents.push({
      incidentKey: createId([vehicle.id, currentPoint.timestamp.slice(0, 16), 'offline']),
      vehicleId: vehicle.id,
      vehicleName: vehicle.name,
      timestamp: new Date(currentPoint.timestamp),
      title: 'Vehicle connection lost',
      description: `${vehicle.name} has not reported in for ${ageMinutes} minutes.`,
      severity: ageMinutes >= 30 ? 'critical' : 'warning',
      category: 'offline',
      relatedZoneName: null,
      payload: { ageMinutes },
    });
  }

  if (protection && protection.armed && currentPoint.speed > 5) {
    incidents.push({
      incidentKey: createId([vehicle.id, currentPoint.timestamp.slice(0, 16), 'armed-move']),
      vehicleId: vehicle.id,
      vehicleName: vehicle.name,
      timestamp: new Date(currentPoint.timestamp),
      title: 'Protected vehicle moved',
      description: `${vehicle.name} moved while protection mode was armed.`,
      severity: 'critical',
      category: 'security',
      relatedZoneName: activeZone ? activeZone.name : null,
      payload: { currentPoint },
    });
  }

  if (currentHour >= 21 || currentHour <= 5) {
    incidents.push({
      incidentKey: createId([vehicle.id, currentPoint.timestamp.slice(0, 13), 'night']),
      vehicleId: vehicle.id,
      vehicleName: vehicle.name,
      timestamp: new Date(currentPoint.timestamp),
      title: 'Night movement detected',
      description: `${vehicle.name} is moving during protected hours.`,
      severity: currentPoint.speed > 10 ? 'critical' : 'warning',
      category: 'security',
      relatedZoneName: null,
      payload: { currentPoint },
    });
  }

  if (overspeedCount > 0) {
    incidents.push({
      incidentKey: createId([vehicle.id, currentPoint.timestamp.slice(0, 13), 'overspeed']),
      vehicleId: vehicle.id,
      vehicleName: vehicle.name,
      timestamp: new Date(currentPoint.timestamp),
      title: 'Repeated overspeeding detected',
      description: `${vehicle.name} exceeded 80 km/h ${overspeedCount} times today.`,
      severity: overspeedCount >= 4 ? 'critical' : 'warning',
      category: 'driving',
      relatedZoneName: null,
      payload: { overspeedCount },
    });
  }

  if (activeZone) {
    const currentDistance = metersBetween(
      currentPoint.latitude,
      currentPoint.longitude,
      activeZone.latitude,
      activeZone.longitude
    );
    const previousDistance = previousPoint
      ? metersBetween(previousPoint.latitude, previousPoint.longitude, activeZone.latitude, activeZone.longitude)
      : currentDistance;
    const movingOutward = currentDistance > previousDistance + 5;
    const boundaryGap = activeZone.radius - currentDistance;

    if (boundaryGap > 0) {
      const proximityScore = Math.max(0, Math.min(1, 1 - boundaryGap / 250));
      const speedScore = Math.max(0, Math.min(1, currentPoint.speed / 60));
      const breachProbability = Math.max(
        0.15,
        Math.min(0.98, 0.15 + proximityScore * 0.45 + speedScore * 0.2 + (movingOutward ? 0.2 : 0.05))
      );

      if (breachProbability >= 0.7) {
        const minutesToBreach =
          currentPoint.speed > 5 && movingOutward
            ? Math.max(1, Math.round((((boundaryGap / 1000) / currentPoint.speed) * 60)))
            : null;

        incidents.push({
          incidentKey: createId([vehicle.id, currentPoint.timestamp.slice(0, 16), 'predictive']),
          vehicleId: vehicle.id,
          vehicleName: vehicle.name,
          timestamp: new Date(currentPoint.timestamp),
          title: 'Predictive alert',
          description: minutesToBreach != null
            ? `${vehicle.name} is likely to leave ${activeZone.name} in about ${minutesToBreach} minute${minutesToBreach === 1 ? '' : 's'}.`
            : `${vehicle.name} is trending toward the edge of ${activeZone.name}.`,
          severity: breachProbability >= 0.85 ? 'critical' : 'warning',
          category: 'system',
          relatedZoneName: activeZone.name,
          payload: { breachProbability, minutesToBreach },
        });
      }
    }
  }

  return incidents;
}

module.exports = { activeZoneFor, buildIncidentsForVehicle };
