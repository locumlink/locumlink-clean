import { useEffect, useState } from 'react'
import { supabase } from '../utils/supabaseClient'
import { useAuth } from '../context/AuthContext'

export default function BrowseShifts() {
  const { session } = useAuth()
  const [profile, setProfile] = useState(null)
  const [shifts, setShifts] = useState([])
  const [loading, setLoading] = useState(false)

  const [postcode, setPostcode] = useState('')
  const [radius, setRadius] = useState(20)
  const [shiftType, setShiftType] = useState('')
  const [minRate, setMinRate] = useState('')

  useEffect(() => {
    if (!session) return
    const fetchProfile = async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', session.user.id)
        .single()
      if (!error) setProfile(data)
    }
    fetchProfile()
  }, [session])

  const haversineDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371
    const toRad = x => (x * Math.PI) / 180
    const dLat = toRad(lat2 - lat1)
    const dLon = toRad(lon2 - lon1)
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) ** 2
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }

  const fetchShifts = async () => {
    if (!postcode) {
      alert('Please enter a postcode')
      return
    }

    setLoading(true)
    try {
      const geoRes = await fetch(`https://api.postcodes.io/postcodes/${encodeURIComponent(postcode)}`)
      const geoData = await geoRes.json()

      if (geoData.status !== 200) throw new Error('Postcode not found')

      const { latitude, longitude } = geoData.result

      const { data: shiftsData, error } = await supabase
        .from('shifts')
        .select('*')
        .gt('shift_date', new Date().toISOString().split('T')[0])
        .order('shift_date', { ascending: true })

      if (error) throw error

      const filtered = shiftsData.filter(shift => {
        const distance = haversineDistance(latitude, longitude, shift.latitude, shift.longitude)
        const matchesType = shiftType ? shift.shift_type === shiftType : true
        const matchesRate = minRate ? shift.rate >= parseFloat(minRate) : true
        return distance <= radius && matchesType && matchesRate
      })

      setShifts(filtered)
    } catch (err) {
      console.error(err)
      alert('Failed to fetch shifts')
    }
    setLoading(false)
  }

  return (
    <div style={{ padding: '2rem' }}>
      <h2>Find Locum Shifts Near You</h2>

      <label>
        Your Postcode:
        <input
          type="text"
          value={postcode}
          onChange={(e) => setPostcode(e.target.value)}
          style={{ marginLeft: '1rem' }}
        />
      </label>
      <br /><br />

      <label>
        Radius (km):
        <input
          type="number"
          value={radius}
          onChange={(e) => setRadius(Number(e.target.value))}
          min={1}
          style={{ marginLeft: '1rem' }}
        />
      </label>
      <br /><br />

      <label>
        NHS/Private/Mixed:
        <select value={shiftType} onChange={(e) => setShiftType(e.target.value)} style={{ marginLeft: '1rem' }}>
          <option value="">Any</option>
          <option value="nhs">NHS</option>
          <option value="private">Private</option>
          <option value="mixed">Mixed</option>
        </select>
      </label>
      <br /><br />

      <label>
        Minimum Rate (£):
        <input
          type="number"
          value={minRate}
          onChange={(e) => setMinRate(e.target.value)}
          style={{ marginLeft: '1rem' }}
        />
      </label>
      <br /><br />

      <button onClick={fetchShifts}>Search</button>

      {loading ? (
        <p>Loading shifts...</p>
      ) : (
        <ul>
          {shifts.length === 0 ? (
            <p>No matching shifts found.</p>
          ) : (
            shifts.map((shift) => (
              <li key={shift.id} style={{ border: '1px solid #ccc', padding: '1rem', margin: '1rem 0' }}>
                <strong>{shift.shift_date}</strong> – {shift.shift_type}<br />
                {shift.location} – £{shift.rate}<br />
                {shift.description}
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  )
}
