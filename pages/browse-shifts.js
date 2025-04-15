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

      // Get all shifts with practice info
      const { data: shiftsData, error: shiftsError } = await supabase
        .from('shifts')
        .select(`
          *,
          practice:practice_id (
            full_name,
            email,
            postcode
          )
        `)
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

  if (loading) return <p style={{ padding: '2rem' }}>Loading shifts...</p>
  if (!profile) return <p>No profile found</p>

  return (
    <div style={{ padding: '2rem' }}>
      <h2>Shifts Available Near You</h2>
      <p>{shifts.length} shift{shifts.length !== 1 && 's'} found</p>

      <ul>
        {shifts.map((shift) => (
          <li key={shift.id} style={{ border: '1px solid #ccc', padding: '1rem', margin: '1rem 0' }}>
            <strong>{shift.shift_date}</strong> – {shift.shift_type}<br />
            <strong>Location:</strong> {shift.location} – £{shift.rate}<br />
            <strong>Description:</strong> {shift.description}<br /><br />

            <strong>Practice:</strong> {shift.practice?.full_name || 'Unknown'}<br />
            <strong>Postcode:</strong> {shift.practice?.postcode}<br />
            {/* Placeholder for rating */}
            <strong>Rating:</strong> ★★★★☆ (placeholder)<br /><br />

            <button onClick={() => handleEnquire(shift.id)}>Enquire</button>
          </li>
        ))}
      </ul>
    </div>
  )
}
