import { useState } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '../utils/supabaseClient'
import { useAuth } from '../context/AuthContext'

export default function PostShift() {
  const router = useRouter()
  const { session } = useAuth()
  const [formData, setFormData] = useState({
    shift_date: '',
    shift_type: '',
    rate: '',
    location: '',
    description: ''
  })
  const [submitting, setSubmitting] = useState(false)

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const fetchLatLng = async (postcode) => {
    const res = await fetch(`https://api.postcodes.io/postcodes/${encodeURIComponent(postcode)}`)
    const data = await res.json()
    if (data.status === 200) {
      return {
        lat: data.result.latitude,
        lng: data.result.longitude
      }
    } else {
      throw new Error('Postcode lookup failed')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const user = session.user
      const profileRes = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (profileRes.error) throw new Error('Profile not found')
      const profile = profileRes.data

      const { lat, lng } = await fetchLatLng(formData.location)

      const { error } = await supabase.from('shifts').insert([{
        practice_id: profile.id,
        shift_date: formData.shift_date,
        shift_type: formData.shift_type,
        rate: parseFloat(formData.rate),
        location: formData.location,
        description: formData.description,
        latitude: lat,
        longitude: lng
      }])

      if (error) throw error

      alert('Shift posted!')
      router.push('/dashboard')
    } catch (err) {
      console.error(err)
      alert('Failed to post shift')
    }

    setSubmitting(false)
  }

  return (
    <div style={{ padding: '2rem' }}>
      <h2>Post a Shift</h2>
      <form onSubmit={handleSubmit}>
        <label>
          Date:<br />
          <input type="date" name="shift_date" value={formData.shift_date} onChange={handleChange} required />
        </label><br /><br />
        <label>
          Shift Type:<br />
          <select name="shift_type" value={formData.shift_type} onChange={handleChange} required>
            <option value="">Select</option>
            <option value="Full Day">Full Day</option>
            <option value="Half Day">Half Day</option>
            <option value="AM">AM</option>
            <option value="PM">PM</option>
          </select>
        </label><br /><br />
        <label>
          Rate (£):<br />
          <input type="number" name="rate" value={formData.rate} onChange={handleChange} required />
        </label><br /><br />
        <label>
          Postcode:<br />
          <input type="text" name="location" value={formData.location} onChange={handleChange} required />
        </label><br /><br />
        <label>
          Description:<br />
          <textarea name="description" value={formData.description} onChange={handleChange} rows="4" />
        </label><br /><br />
        <button type="submit" disabled={submitting}>{submitting ? 'Posting...' : 'Post Shift'}</button>
      </form>
    </div>
  )
}