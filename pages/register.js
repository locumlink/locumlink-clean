import { useState } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '../utils/supabaseClient'

export default function Register() {
  const router = useRouter()
  const [role, setRole] = useState('')
  const [form, setForm] = useState({})
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  if (!supabase) {
    return <div>Loading client...</div>
  }

  const handleInput = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    const { data: authUser, error: signUpError } = await supabase.auth.signUp({ email, password })
    if (signUpError) {
      alert(signUpError.message)
      setLoading(false)
      return
    }

    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .insert([{ user_id: authUser.user.id, role, full_name: form.full_name, email, postcode: form.postcode }])
      .select().single()

    if (profileError) {
      alert(profileError.message)
      setLoading(false)
      return
    }

    if (role === 'dentist') {
      await supabase.from('dentist_details').insert([{
        profile_id: profileData.id,
        gdc_number: form.gdc_number,
        performer_number: form.performer_number,
        year_qualified: parseInt(form.year_qualified),
        uk_experience: parseInt(form.uk_experience),
        additional_skills: form.additional_skills.split(',').map(s => s.trim()),
        locum_type: form.locum_type,
        nhs_preference: form.nhs_preference,
        rate_min: parseFloat(form.rate_min),
        rate_max: parseFloat(form.rate_max),
      }])
    } else if (role === 'practice') {
      await supabase.from('practice_details').insert([{
        profile_id: profileData.id,
        practice_name: form.practice_name,
        principal_name: form.principal_name,
        contact_email: form.contact_email,
        contact_phone: form.contact_phone,
      }])
    }

    router.push('/dashboard')
  }

  return (
    <div style={{ padding: '2rem' }}>
      <h2>Register as:</h2>
      <select onChange={(e) => setRole(e.target.value)} value={role}>
        <option value="">Select</option>
        <option value="dentist">Dentist</option>
        <option value="practice">Practice</option>
      </select>

      {role && (
        <form onSubmit={handleSubmit} style={{ marginTop: '1rem' }}>
          <input name="full_name" placeholder="Full name" onChange={handleInput} required /><br />
          <input name="postcode" placeholder="Postcode" onChange={handleInput} required /><br />
          <input type="email" placeholder="Email" onChange={(e) => setEmail(e.target.value)} required /><br />
          <input type="password" placeholder="Password" onChange={(e) => setPassword(e.target.value)} required /><br />

          {role === 'dentist' && (
            <>
              <input name="gdc_number" placeholder="GDC Number" onChange={handleInput} required /><br />
              <input name="performer_number" placeholder="Performer Number" onChange={handleInput} /><br />
              <input name="year_qualified" placeholder="Year Qualified" onChange={handleInput} required /><br />
              <input name="uk_experience" placeholder="Years UK Experience" onChange={handleInput} required /><br />
              <input name="additional_skills" placeholder="Additional Skills (comma separated)" onChange={handleInput} /><br />
              <select name="locum_type" onChange={handleInput} required>
                <option value="">Locum Type</option>
                <option value="temporary">Temporary</option>
                <option value="ongoing">Ongoing</option>
              </select><br />
              <select name="nhs_preference" onChange={handleInput} required>
                <option value="">NHS/Private Preference</option>
                <option value="nhs">NHS</option>
                <option value="private">Private</option>
                <option value="either">Either</option>
              </select><br />
              <input name="rate_min" placeholder="Min Rate (£/day)" onChange={handleInput} required /><br />
              <input name="rate_max" placeholder="Max Rate (£/day)" onChange={handleInput} required /><br />
            </>
          )}

          {role === 'practice' && (
            <>
              <input name="practice_name" placeholder="Practice Name" onChange={handleInput} required /><br />
              <input name="principal_name" placeholder="Principal Dentist Name" onChange={handleInput} required /><br />
              <input name="contact_email" placeholder="Contact Email" onChange={handleInput} required /><br />
              <input name="contact_phone" placeholder="Contact Phone" onChange={handleInput} required /><br />
            </>
          )}

          <button type="submit" disabled={loading}>{loading ? 'Registering...' : 'Register'}</button>
        </form>
      )}
    </div>
  )
}

export const dynamic = "force-dynamic"
