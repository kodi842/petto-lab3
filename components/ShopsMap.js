import { MapContainer, TileLayer, Marker, Popup, CircleMarker, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

const icon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});

function ClickHandler({ onSelect }) {
  useMapEvents({ click: (e) => onSelect(e.latlng) });
  return null;
}

export default function ShopsMap({ shops, onSelect, selectedCoords }) {
  return (
    <MapContainer center={[53.195, 45.005]} zoom={13} style={{ height: '450px' }}>
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' />
      <ClickHandler onSelect={onSelect} />
      {selectedCoords && <CircleMarker center={selectedCoords} radius={9} pathOptions={{ color: '#c14624' }} />}
      {shops.map((shop, i) => (
        <Marker key={i} position={[shop.lat, shop.lng]} icon={icon}>
          <Popup><b>{shop.name}</b><br />{shop.address}</Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
