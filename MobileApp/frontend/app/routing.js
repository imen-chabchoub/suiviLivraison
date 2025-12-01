// app/routing.js
const ORS_API_KEY = 'eyJvcmciOiI1YjNjZTM1OTc4NTExMTAwMDFjZjYyNDgiLCJpZCI6IjNhOTY1ZDk0OTU1NjQxZmNhZDU5ZDhkMWZmNWViMzA5IiwiaCI6Im11cm11cjY0In0='; 

export async function getRoute(start, end) {
  try {
    const body = {
      coordinates: [
        [start.longitude, start.latitude],
        [end.longitude, end.latitude],
      ],
    };

    const res = await fetch(
      'https://api.openrouteservice.org/v2/directions/driving-car/geojson',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: ORS_API_KEY,
        },
        body: JSON.stringify(body),
      }
    );

    const data = await res.json();

    if (!data.features || data.features.length === 0) {
      console.log('ORS: aucun itinéraire');
      return null;
    }

    // data.features[0].geometry.coordinates = [[lon, lat], [lon, lat], ...]
    const coords = data.features[0].geometry.coordinates.map(([lon, lat]) => ({
      latitude: lat,
      longitude: lon,
    }));

    return coords;
  } catch (e) {
    console.log('Erreur ORS', e.message || e);
    return null;
  }
}
