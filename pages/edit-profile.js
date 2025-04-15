import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '../utils/supabaseClient'
import { useAuth } from '../context/AuthContext'

export default function EditProfile() {
  const router = useRouter()
  const { session } = useAuth()
  const [profile, setProfile] = useState(null)
  const [form, setForm] = useState({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!session) return

    const fetchProfile = async () => {
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

      const updates = { ...profileData }

      if (profileData.role === 'dentist') {
        const { data: dentistData } = await supabase
          .from('dentist_details')
          .select('*')
          .eq('profile_id', profileData.id)
          .single()
        Object.assign(updates, dentistData)
      }

      if (profileData.role === 'practice') {
        const { data: practiceData } = await supabase
          .from('practice_details')
          .select('*')
          .eq('profile_id', profileData.id)
          .single()
        Object.assign(updates, practiceData)
      }

      setProfile(profileData)
      setForm(updates)
      setLoading(false)
    }

    fetchProfile()
  }, [session])

  const handleInput = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)

    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        full_name: form.full_name,
        email: form.email,
        postcode: form.postcode
      })
      .eq('id', profile.id)

    let detailsError = null

    if (profile.role === 'dentist') {
      const { error } = await supabase
        .from('dentist_details')
        .update({
          gdc_number: form.gdc_number,
          performer_number: form.performer_number,
          year_qualified: parseInt(form.year_qualified),
          uk_experience: parseInt(form.uk_experience),
          additional_skills: form.additional_skills?.split(',').map(s => s.trim()),
          locum_type: form.locum_type,
          nhs_preference: form.nhs_preference,
          rate_min: parseFloat(form.rate_min),
          rate_max: parseFloat(form.rate_max),
        })
        .eq('profile_id', profile.id)
      detailsError = error
    }

    if (profile.role === 'practice') {
      const { error } = await supabase
        .from('practice_details')
        .update({
          practice_name: form.practice_name,
          principal_name: form.principal_name,
          contact_email: form.contact_email,
          contact_phone: form.contact_phone,
        })
        .eq('profile_id', profile.id)
      detailsError = error
    }

    setSaving(false)

    if (profileError || detailsError) {
      alert('Error saving profile')
    } else {
      alert('Profile updated!')
      router.push('/dashboard')
    }
  }

  if (loading) return <p style={{ padding: '2rem' }}>Loading profile...</p>

  return (
    <div style={{ padding: '2rem' }}>
      <h2>Edit Profile</h2>
      <form onSubmit={handleSubmit}>
        <input name="full_name" value={form.full_name || ''} onChange={handleInput} placeholder="Full name" required /><br />
        <input name="postcode" value={form.postcode || ''} onChange={handleInput} placeholder="Postcode" required /><br />
        <input name="email" value={form.email || ''} onChange={handleInput} placeholder="Email" required /><br /><br />

        {profile.role === 'dentist' && (
          <>
            <input name="gdc_number" value={form.gdc_number || ''} onChange={handleInput} placeholder="GDC Number" required /><br />
            <input name="performer_number" value={form.performer_number || ''} onChange={handleInput} placeholder="Performer Number" /><br />
            <input name="year_qualified" value={form.year_qualified || ''} onChange={handleInput} placeholder="Year Qualified" required /><br />
            <input name="uk_experience" value={form.uk_experience || ''} onChange={handleInput} placeholder="Years UK Experience" required /><br />
            <input name="additional_skills" value={form.additional_skills?.join(', ') || ''} onChange={handleInput} placeholder="Additional Skills (comma separated)" /><br />
            <select name="locum_type" value={form.locum_type || ''} onChange={handleInput} required>
              <option value="">Locum Type</option>
              <option value="temporary">Temporary</option>
              <option value="ongoing">Ongoing</option>
            </select><br />
            <select name="nhs_preference" value={form.nhs_preference || ''} onChange={handleInput} required>
              <option value="">NHS/Private Preference</option>
              <option value="nhs">NHS</option>
              <option value="private">Private</option>
              <option value="either">Either</option>
            </select><br />
            <input name="rate_min" value={form.rate_min || ''} onChange={handleInput} placeholder="Min Rate (£/day)" required /><br />
            <input name="rate_max" value={form.rate_max || ''} onChange={handleInput} placeholder="Max Rate (£/day)" required /><br />
          </>
        )}

        {profile.role === 'practice' && (
          <>
            <input name="practice_name" value={form.practice_name || ''} onChange={handleInput} placeholder="Practice Name" required /><br />
            <input name="principal_name" value={form.principal_name || ''} onChange={handleInput} placeholder="Principal Dentist Name" required /><br />
            <input name="contact_email" value={form.contact_email || ''} onChange={handleInput} placeholder="Contact Email" required /><br />
            <input name="contact_phone" value={form.contact_phone || ''} onChange={handleInput} placeholder="Contact Phone" required /><br />
          </>
        )}

        <button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save Profile'}</button>
      </form>
    </div>
  )
}
