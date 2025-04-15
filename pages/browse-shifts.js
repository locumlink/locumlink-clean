import { useEffect, useState } from 'react'
import { supabase } from '../utils/supabaseClient'
import { useAuth } from '../context/AuthContext'
import dynamic from 'next/dynamic'

const MapWithNoSSR = dynamic(() => import('../components/Map'), { ssr: false })

export default function BrowseShifts() {
  const { session } = useAuth()
  const [profile, setProfile] = useState(null)
  const [shifts, setShifts] = useState([])
  const [filteredShifts, setFilteredShifts] = useState([])
  const [loading, setLoading] = useState(true)
  const [radius, setRadius] = useState(25)
  const [postcode, setPostcode] = useState('')
  const [filter, setFilter] = useState({
    type: '',
    rateMin: '',
    rateMax: '',
    date: ''
  })

  useEffect(() => {
    const fetchProfileAndShifts = async () => {
      if (!session) return

      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', session.user.id)
        .single()

      if (profileError) {
        alert('Failed to load profile')
        return
      }

      setProfile(profileData)

      const { data: shiftsData, error: shiftsError } = await supabase
        .from('shifts')
        .select('*')
        .gt('shift_date', new Date().toISOString().split('T')[0])
        .order('shift_date', { ascending: true })

      if (shiftsError) {
        alert('Failed to load shifts')
        return
      }

      setShifts(shiftsData)
      setFilteredShifts(shiftsData)
      setLoading(false)
    }

    fetchProfileAndShifts()
  }, [session])

  const handleSearch = async () => {
    if (!postcode) return

    const res = await fetch(`https://api.postcodes.io/postcodes/${encodeURIComponent(postcode)}`)
    const data = await res.json()
    if (data.status !== 200) return alert('Postcode lookup failed')

    const { latitude, longitude } = data.result

    const filtered = shifts.filter((shift) => {
      const dist = getDistanceFromLatLonInKm(latitude, longitude, shift.latitude, shift.longitude)
      if (dist > radius) return false
      if (filter.type && shift.shift_type !== filter.type) return false
      if (filter.rateMin && shift.rate < parseFloat(filter.rateMin)) return false
      if (filter.rateMax && shift.rate > parseFloat(filter.rateMax)) return false
      if (filter.date && shift.shift_date !== filter.date) return false
      return true
    })

    setFilteredShifts(filtered)
  }

  const handleEnquire = async (shiftId) => {
    if (!profile) return
    const { error } = await supabase.from('bookings').insert([{
      shift_id: shiftId,
      dentist_id: profile.id,
      status: 'pending'
    }])
    if (error) alert('Error sending enquiry')
    else alert('Enquiry sent!')
  }

  const getDistanceFromLatLonInKm = (lat1, lon1, lat2, lon2) => {
    const R = 6371
    const dLat = ((lat2 - lat1) * Math.PI) / 180
    const dLon = ((lon2 - lon1) * Math.PI) / 180
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) ** 2
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }

  // Round coords for map pins
  const roundedForMap = filteredShifts.map(shift => ({
    ...shift,
    latitude: Math.round(shift.latitude * 10) / 10,
    longitude: Math.round(shift.longitude * 10) / 10
  }))

  if (loading) return <p style={{ padding: '2rem' }}>Loading shifts...</p>
  if (!profile) return <p>No profile found</p>

  return (
    <div style={{ padding: '2rem' }}>
      <h2>Browse Shifts</h2>
      <div style={{ marginBottom: '1rem' }}>
        <label>
          Postcode:{' '}
          <input
            type="text"
            value={postcode}
            onChange={(e) => setPostcode(e.target.value)}
          />
        </label>{' '}
        <label>
          Radius (miles):{' '}
          <input
            type="number"
            value={radius}
            onChange={(e) => setRadius(e.target.value)}
            style={{ width: '60px' }}
          />
        </label>{' '}
        <label>
          Type:{' '}
          <select value={filter.type} onChange={(e) => setFilter({ ...filter, type: e.target.value })}>
            <option value="">Any</option>
            <option value="nhs">NHS</option>
            <option value="private">Private</option>
            <option value="mixed">Mixed</option>
          </select>
        </label>{' '}
        <label>
          Min Rate:{' '}
          <input
            type="number"
            value={filter.rateMin}
            onChange={(e) => setFilter({ ...filter, rateMin: e.target.value })}
            style={{ width: '60px' }}
          />
        </label>{' '}
        <label>
          Max Rate:{' '}
          <input
            type="number"
            value={filter.rateMax}
            onChange={(e) => setFilter({ ...filter, rateMax: e.target.value })}
            style={{ width: '60px' }}
          />
        </label>{' '}
        <label>
          Date:{' '}
          <input
            type="date"
            value={filter.date}
            onChange={(e) => setFilter({ ...filter, date: e.target.value })}
          />
        </label>{' '}
        <button onClick={handleSearch}>Search</button>
      </div>

      <p>Showing {filteredShifts.length} results within {radius} miles</p>

      <MapWithNoSSR shifts={roundedForMap} />

      <ul>
        {filteredShifts.map((shift) => (
          <li key={shift.id} style={{ border: '1px solid #ccc', padding: '1rem', margin: '1rem 0' }}>
            <strong>{shift.shift_date}</strong> – {shift.shift_type}<br />
            {shift.location} – £{shift.rate}<br />
            {shift.description}<br />
            <button onClick={() => handleEnquire(shift.id)}>Enquire</button>
          </li>
        ))}
      </ul>
    </div>
  )
}
