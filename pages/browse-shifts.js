import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../utils/supabaseClient';
import { useAuth } from '../context/AuthContext';
import dynamic from 'next/dynamic';

const Map = dynamic(() => import('react-leaflet').then(mod => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then(mod => mod.TileLayer), { ssr: false });
const Marker = dynamic(() => import('react-leaflet').then(mod => mod.Marker), { ssr: false });
const Popup = dynamic(() => import('react-leaflet').then(mod => mod.Popup), { ssr: false });

export default function BrowseShifts() {
  const router = useRouter();
  const { session } = useAuth();
  const [profile, setProfile] = useState(null);
  const [shifts, setShifts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!session) return;
      const user = session.user;

      // Get dentist's profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (profileError) {
        alert('Failed to load profile');
        return;
      }

      setProfile(profileData);

      // Get all shifts with practice info
      const { data: shiftsData, error: shiftsError } = await supabase
        .from('shifts')
        .select('id, shift_date, shift_type, rate, description, location, is_nhs');

      if (shiftsError) {
        alert('Failed to load shifts');
        return;
      }

      setShifts(shiftsData);
      setLoading(false);
    };

    fetchData();
  }, [session]);

  const handleEnquire = async (shiftId) => {
    if (!profile) return;

    const { data, error } = await supabase.from('bookings').insert([
      {
        shift_id: shiftId,
        dentist_id: profile.id,
        status: 'pending',
      },
    ]);

    if (error) {
      alert('Failed to submit enquiry');
      console.error(error);
    } else {
      alert('Enquiry submitted!');
    }
  };

  if (loading) return <p style={{ padding: '2rem' }}>Loading shifts...</p>;
  if (!profile) return <p>No profile found</p>;

  return (
    <div style={{ padding: '2rem' }}>
      <h2>Shifts Available Near You</h2>
      <p>{shifts.length} shift{shifts.length !== 1 && 's'} found</p>

      <Map style={{ height: '500px', width: '100%' }} center={[51.505, -0.09]} zoom={13}>
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        {shifts.map((shift) => (
          <Marker key={shift.id} position={shift.location}>
            <Popup>
              <strong>{shift.shift_date}</strong> – {shift.shift_type}<br />
              <strong>Rate:</strong> £{shift.rate}<br />
              <strong>Description:</strong> {shift.description}<br />
              <strong>Type:</strong> {shift.is_nhs ? 'NHS' : 'Private'}<br />
              <button onClick={() => handleEnquire(shift.id)}>Enquire</button>
            </Popup>
          </Marker>
        ))}
      </Map>
    </div>
  );
}
