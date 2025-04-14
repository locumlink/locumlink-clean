import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '../utils/supabaseClient'

export default function Dashboard() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchUserAndProfile = async () => {
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) {
        router.push('/register')
        return
      }

      setUser(user)

      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (profileError || !profileData) {
        alert('Could not load profile')
        return
      }

      setProfile(profileData)
      setLoading(false)
    }

    fetchUserAndProfile()
  }, [])

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
          <p>(Placeholder: Add and manage shifts here)</p>
        </>
      )}
    </div>
  )
}
