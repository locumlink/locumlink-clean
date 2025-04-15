import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '../utils/supabaseClient'
import { useAuth } from '../context/AuthContext'

export default function BrowseShifts() {
  const router = useRouter()
  const { session } = useAuth()
  const [profile, setProfile] = useState(null)
  const [shifts, setShifts] = useState([])
  const [loading, setLoading] = useState(true)

  // Filter states
  const [postcodeFilter, setPostcodeFilter] = useState('')
  const [shiftTypeFilter, setShiftTypeFilter] = useState('')
  const [rateMin, setRateMin] = useState('')
  const [rateMax, setRateMax] = useState('')
  const [nhsPreference, setNhsPreference] = useState('any')

  useEffect(() => {
    const fetchData = async () => {
      if (!session) return
      const user = session.user

      // Get dentist profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (profileError) {
        alert('Failed to load profile')
        return
      }

      setProfile(profileData)

      // Get all upcoming shifts
      const { data: shiftsData, error: shiftsError } = await supabase
        .from('shifts')
        .select('*')
        .gt('shift_date', new Date().toISOString().split('T')[0])
        .order('shift_date', { ascending: true })

      if (shiftsError) {
        alert('Failed to load shifts')
        return
      }

      const filtered = shiftsData.filter(
        (shift) => shift.practice_id !== profileData.id
      )

      setShifts(filtered)
      setLoading(false)
    }

    fetchData()
  }, [session])

  const handleEnquire = async (shiftId) => {
    if (!profile) return

    const { error } = await supabase.from('bookings').insert([{
      shift_id: shiftId,
      dentist_id: profile.id,
      status: 'pending'
    }])

    if (error) {
      alert('Failed to submit enquiry')
      console.error(error)
    } else {
      alert('Enquiry submitted!')
    }
  }

  const applyFilters = (shifts) => {
    return shifts.filter((shift) => {
      if (postcodeFilter && !shift.location.toLowerCase().includes(postcodeFilter.toLowerCase())) {
        return false
      }
      if (shiftTypeFilter && shift.shift_type !== shiftTypeFilter) {
        return false
      }
      if (rateMin && shift.rate < parseFloat(rateMin)) {
        return false
      }
      if (rateMax && shift.rate > parseFloat(rateMax)) {
        return false
      }
      if (nhsPreference === 'nhs' && !shift.description.toLowerCase().includes('nhs')) {
        return false
      }
      if (nhsPreference === 'private' && !shift.description.toLowerCase().includes('private')) {
        return false
      }
      return true
    })
  }

  if (loading) return <p style={{ padding: '2rem' }}>Loading shifts...</p>
  if (!profile) return <p>No profile found</p>

  const visibleShifts = applyFilters(shifts)

  return (
    <div style={{ padding: '2rem' }}>
      <h2>Shifts Available Near You</h2>

      {/* Filters */}
      <div style={{ marginBottom: '2rem' }}>
        <label>
          Postcode filter:{' '}
          <input
            type="text"
            value={postcodeFilter}
            onChange={(e) => setPostcodeFilter(e.target.value)}
            placeholder="e.g. LS1"
          />
        </label>{' '}
        <label>
          Shift Type:{' '}
          <select value={shiftTypeFilter} onChange={(e) => setShiftTypeFilter(e.target.value)}>
            <option value="">Any</option>
            <option value="Full Day">Full Day</option>
            <option value="AM">AM</option>
            <option value="PM">PM</option>
            <option value="Half Day">Half Day</option>
          </select>
        </label>{' '}
        <label>
          Min Rate:{' '}
          <input
            type="number"
            value={rateMin}
            onChange={(e) => setRateMin(e.target.value)}
            style={{ width: '80px' }}
          />
        </label>{' '}
        <label>
          Max Rate:{' '}
          <input
            type="number"
            value={rateMax}
            onChange={(e) => setRateMax(e.target.value)}
            style={{ width: '80px' }}
          />
        </label>{' '}
        <label>
          NHS/Private:{' '}
          <select value={nhsPreference} onChange={(e) => setNhsPreference(e.target.value)}>
            <option value="any">Any</option>
            <option value="nhs">NHS</option>
            <option value="private">Private</option>
          </select>
        </label>
      </div>

      {visibleShifts.length === 0 && <p>No matching shifts found.</p>}

      <ul>
        {visibleShifts.map((shift) => (
          <li key={shift.id} style={{ border: '1px solid #ccc', padding: '1rem', margin: '1rem 0' }}>
            <strong>{shift.shift_date}</strong> – {shift.shift_type}<br />
            {shift.location} – £{shift.rate}<br />
            {shift.description}<br /><br />

            <button onClick={() => handleEnquire(shift.id)}>
              Enquire
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
