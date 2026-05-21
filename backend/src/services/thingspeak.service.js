const env = require('../config/env');

async function fetchThingSpeakFeed(vehicle, options = {}) {
  const url = new URL(`${env.thingspeakBaseUrl}/channels/${vehicle.channelId}/feeds.json`);
  url.searchParams.set('api_key', vehicle.readApiKey);
  url.searchParams.set('results', String(options.results || 2));
  if (options.start) url.searchParams.set('start', options.start);
  if (options.end) url.searchParams.set('end', options.end);

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`ThingSpeak ${response.status}`);
  }

  const data = await response.json();
  return data.feeds || [];
}

function mapThingSpeakFeed(vehicle, feed) {
  const latitude = Number.parseFloat(feed.field1 || '');
  const longitude = Number.parseFloat(feed.field2 || '');
  if (Number.isNaN(latitude) || Number.isNaN(longitude)) return null;

  return {
    vehicleId: vehicle.id,
    vehicleName: vehicle.name,
    timestamp: feed.created_at,
    latitude,
    longitude,
    speed: Number.parseFloat(feed.field3 || '0') || 0,
    direction: Number.parseFloat(feed.field4 || '0') || 0,
    altitude: Number.parseFloat(feed.field5 || '0') || 0,
    satellites: Number.parseInt(feed.field6 || '0', 10) || 0,
    hdop: Number.parseFloat(feed.field7 || '99') || 99,
    isOutsideFence: feed.field8 === '1',
  };
}

function dayBounds(dateString) {
  return {
    start: `${dateString} 00:00:00`,
    end: `${dateString} 23:59:59`,
  };
}

module.exports = { fetchThingSpeakFeed, mapThingSpeakFeed, dayBounds };
