import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '../utils/supabaseClient'
import { useAuth } from '../context/AuthContext'

export default function EditProfile() {
  const { session } = useAuth()
  const router = useRouter()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const fetchProfile = async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', session.user.id)
        .single()

      if (error) {
        alert('Could not load profile')
        return
      }

      setProfile(data)
      setLoading(false)
    }

    if (session) fetchProfile()
  }, [session])

  const handleChange = (e) => {
    const { name, value } = e.target
    setProfile((prev) => ({ ...prev, [name]: value }))
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)

    const updates = {
      ...profile
    }

    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', profile.id)

    setSaving(false)

    if (error) {
      alert('Failed to save profile')
    } else {
      alert('Profile updated!')
      router.push('/dashboard')
    }
  }

  if (loading) return <p style={{ padding: '2rem' }}>Loading profile...</p>
  if (!profile) return <p>No profile data found.</p>

  return (
    <div style={{ padding: '2rem' }}>
      <h2>Edit Your Profile</h2>
      <form onSubmit={handleSave}>
        <label>
          Full Name:<br />
          <input name="full_name" value={profile.full_name || ''} onChange={handleChange} required />
        </label><br /><br />
        <label>
          Email:<br />
          <input name="email" value={profile.email || ''} onChange={handleChange} required />
        </label><br /><br />
        <label>
          Postcode:<br />
          <input name="postcode" value={profile.postcode || ''} onChange={handleChange} />
        </label><br /><br />
        <label>
          Expected Rate (£):<br />
          <input name="rate_expectation" type="number" value={profile.rate_expectation || ''} onChange={handleChange} />
        </label><br /><br />
        <label>
          NHS/Private Preference:<br />
          <select name="nhs_private_pref" value={profile.nhs_private_pref || ''} onChange={handleChange}>
            <option value="">No preference</option>
            <option value="nhs">NHS</option>
            <option value="private">Private</option>
            <option value="mixed">Mixed</option>
          </select>
        </label><br /><br />
        <label>
          Additional Skills:<br />
          <textarea name="skills" value={profile.skills || ''} onChange={handleChange} rows="3" />
        </label><br /><br />
        <button type="submit" disabled={saving}>
          {saving ? 'Saving...' : 'Save Profile'}
        </button>
      </form>
    </div>
  )
}
