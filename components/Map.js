import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'

const pinIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41]
})

export default function Map({ shifts }) {
  const defaultCenter = [53.8, -1.5] // Yorkshire default

  return (
    <MapContainer center={defaultCenter} zoom={7} style={{ height: '400px', marginBottom: '2rem' }}>
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {shifts.map((shift) => {
        const offsetLat = shift.latitude + (Math.random() - 0.5) * 0.02
        const offsetLng = shift.longitude + (Math.random() - 0.5) * 0.02
        return (
          <Marker
            key={shift.id}
            position={[offsetLat, offsetLng]}
            icon={pinIcon}
          >
            <Popup>
              {shift.shift_date}<br />
              {shift.location}<br />
              £{shift.rate}
            </Popup>
          </Marker>
        )
      })}
    </MapContainer>
  )
}
