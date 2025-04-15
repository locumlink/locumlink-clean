import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '../utils/supabaseClient'
import { useAuth } from '../context/AuthContext'

export default function PostShift() {
  const router = useRouter()
  const { session } = useAuth()
  const [profile, setProfile] = useState(null)
  const [form, setForm] = useState({
    shift_date: '',
    shift_type: '',
    rate: '',
    location: '',
    description: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchProfile = async () => {
      if (!session) return
      const user = session.user

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (error) {
        console.error('Profile fetch error:', error)
        setError('Failed to load profile')
      } else {
        setProfile(data)
      }
    }

    fetchProfile()
  }, [session])

  const handleInput = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    console.log('Posting shift with profile ID:', profile.id)

    const { error } = await supabase.from('shifts').insert([{
      practice_id: profile.id,
      shift_date: form.shift_date,
      shift_type: form.shift_type,
      rate: parseFloat(form.rate),
      location: form.location,
      description: form.description
    }])

    if (error) {
      console.error('Supabase error:', error)
      setError(error.message || 'Failed to post shift')
      setLoading(false)
    } else {
      router.push('/dashboard')
    }
  }

  if (!profile) return <p style={{ padding: '2rem' }}>Loading profile...</p>

  return (
    <div style={{ padding: '2rem' }}>
      <h2>Post a Shift</h2>
      <form onSubmit={handleSubmit}>
        <label>Date:</label><br />
        <input type="date" name="shift_date" value={form.shift_date} onChange={handleInput} required /><br /><br />

        <label>Shift Type (NHS/Private):</label><br />
        <input type="text" name="shift_type" value={form.shift_type} onChange={handleInput} required /><br /><br />

        <label>Rate (£):</label><br />
        <input type="number" name="rate" value={form.rate} onChange={handleInput} required /><br /><br />

        <label>Location:</label><br />
        <input type="text" name="location" value={form.location} onChange={handleInput} required /><br /><br />

        <label>Notes (optional):</label><br />
        <textarea name="description" value={form.description} onChange={handleInput}></textarea><br /><br />

        <button type="submit" disabled={loading}>
          {loading ? 'Posting...' : 'Post Shift'}
        </button>
      </form>

      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  )
}
