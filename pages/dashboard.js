import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '../utils/supabaseClient'
import { useAuth } from '../context/AuthContext'

export default function Dashboard() {
  const router = useRouter()
  const { session } = useAuth()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchUserAndProfile = async () => {
      if (!session) return
      const user = session.user

      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (error || !profileData) {
        alert('Could not load profile')
        return
      }

      setProfile(profileData)
      setLoading(false)
    }

    fetchUserAndProfile()
  }, [session])

  if (loading) return <p style={{ padding: '2rem' }}>Loading dashboard...</p>
  if (!profile) return <p>No profile found</p>

  return (
    <div style={{ padding: '2rem' }}>
      <h1>Welcome, {profile.full_name}</h1>
      <p>Role: {profile.role}</p>

      {profile.role === 'dentist' && (
        <>
          <h2>Your Availability</h2>
          <p>(Placeholder: Shifts near your postcode will be listed here)</p>
        </>
      )}

      {profile.role === 'practice' && (
        <>
          <h2>Your Practice Info</h2>
          <p>Email: {profile.email}</p>
          <p>Postcode: {profile.postcode}</p>

          <h3 style={{ marginTop: '2rem' }}>Posted Shifts</h3>
          <PracticeShifts practiceId={profile.id} />
        </>
      )}
    </div>
  )
}

function PracticeShifts({ practiceId }) {
  const [shifts, setShifts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchShifts = async () => {
      const { data, error } = await supabase
        .from('shifts')
        .select('*')
        .eq('practice_id', practiceId)
        .order('shift_date', { ascending: true })

      if (!error) setShifts(data)
      setLoading(false)
    }

    fetchShifts()
  }, [practiceId])

  if (loading) return <p>Loading shifts...</p>
  if (shifts.length === 0) return <p>No shifts posted yet.</p>

  return (
    <ul>
      {shifts.map((shift) => (
        <li key={shift.id} style={{ border: '1px solid #ccc', padding: '1rem', margin: '1rem 0' }}>
          <strong>{shift.shift_date}</strong> – {shift.shift_type}<br />
          {shift.location} – £{shift.rate}<br />
          {shift.description}
        </li>
      ))}
    </ul>
  )
}
