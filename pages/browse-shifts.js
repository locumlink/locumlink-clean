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

  // Filter controls
  const [filterType, setFilterType] = useState('')
  const [minRate, setMinRate] = useState('')

  useEffect(() => {
    const fetchData = async () => {
      if (!session) return
      const user = session.user

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

      const today = new Date().toISOString().split('T')[0]

      const { data: shiftsData, error: shiftsError } = await supabase
        .from('shifts')
        .select('*')
        .gt('shift_date', today)
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

    const { data, error } = await supabase.from('bookings').insert([{
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

  const filteredShifts = shifts.filter(shift => {
    if (filterType && shift.shift_type !== filterType) return false
    if (minRate && shift.rate < parseFloat(minRate)) return false
    return true
  })

  if (loading) return <p style={{ padding: '2rem' }}>Loading shifts...</p>
  if (!profile) return <p>No profile found</p>

  return (
    <div style={{ padding: '2rem' }}>
      <h2>Shifts Available Near You</h2>

      <div style={{ marginBottom: '1rem' }}>
        <label>
          Shift Type:{' '}
          <select value={filterType} onChange={(e) => setFilterType(e.target.value)}>
            <option value="">All</option>
            <option value="nhs">NHS</option>
            <option value="private">Private</option>
            <option value="mixed">Mixed</option>
          </select>
        </label>

        <label style={{ marginLeft: '2rem' }}>
          Min Rate (£):{' '}
          <input
            type="number"
            value={minRate}
            onChange={(e) => setMinRate(e.target.value)}
            style={{ width: '80px' }}
          />
        </label>
      </div>

      {filteredShifts.length === 0 && <p>No matching shifts found.</p>}

      <ul>
        {filteredShifts.map((shift) => (
          <li key={shift.id} style={{ border: '1px solid #ccc', padding: '1rem', margin: '1rem 0' }}>
            <strong>{shift.shift_date}</strong> – {shift.shift_type.toUpperCase()}<br />
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
