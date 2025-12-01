
const OPENCAGE_API_KEY = '320fadbcdbf34fd6ab4df4103d0a83c1'; 
export async function geocodeAddress(address) {
  try {
    if (!address || !address.trim()) return null;

    const url = `https://api.opencagedata.com/geocode/v1/json?q=${encodeURIComponent(
      address
    )}&key=${OPENCAGE_API_KEY}&limit=1&language=fr`;

    const res = await fetch(url);
    const data = await res.json();

    if (!data.results || data.results.length === 0) {
      console.log('Geocoding: aucun résultat pour', address);
      return null;
    }

    const { lat, lng } = data.results[0].geometry;
    return { latitude: lat, longitude: lng };
  } catch (err) {
    console.log('Erreur geocoding', err.message || err);
    return null;
  }
}
