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

  useEffect(() => {
    const fetchData = async () => {
      if (!session) return
      const user = session.user

      // Get dentist's profile
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
        .gt('shift_date', new Date().toISOString().split('T')[0]) // today or later
        .order('shift_date', { ascending: true })

      if (shiftsError) {
        alert('Failed to load shifts')
        return
      }

      // Exclude shifts posted by self (not needed if no dentists post, but safe)
      const filtered = shiftsData.filter(
        (shift) => shift.practice_id !== profileData.id
      )

      setShifts(filtered)
      setLoading(false)
    }

    fetchData()
  }, [session])

  if (loading) return <p style={{ padding: '2rem' }}>Loading shifts...</p>
  if (!profile) return <p>No profile found</p>

  return (
    <div style={{ padding: '2rem' }}>
      <h2>Shifts Available Near You</h2>

      {shifts.length === 0 && <p>No current shifts found.</p>}

      <ul>
        {shifts.map((shift) => (
          <li key={shift.id} style={{ border: '1px solid #ccc', padding: '1rem', margin: '1rem 0' }}>
            <strong>{shift.shift_date}</strong> – {shift.shift_type}<br />
            {shift.location} – £{shift.rate}<br />
            {shift.description}
          </li>
        ))}
      </ul>
    </div>
  )
}
