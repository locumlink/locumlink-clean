// pages/dashboard.js
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
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single()
      if (!error) setProfile(data)
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
          <h3>My Bookings</h3>
          <DentistBookings profile={profile} />

          <h3>Pending Reviews</h3>
          <PendingReviews profile={profile} />
        </>
      )}

      {profile.role === 'practice' && (
        <>
          <h3>Posted Shifts</h3>
          <PracticeShifts practiceId={profile.id} />

          <h3>Enquiries Received</h3>
          <EnquiryList profile={profile} />

          <h3>Pending Reviews</h3>
          <PendingReviews profile={profile} />
        </>
      )}
    </div>
  )
}

function PracticeShifts({ practiceId }) {
  const [shifts, setShifts] = useState([])
  useEffect(() => {
    supabase
      .from('shifts')
      .select('*')
      .eq('practice_id', practiceId)
      .order('shift_date', { ascending: true })
      .then(({ data }) => setShifts(data || []))
  }, [practiceId])
  return (
    <ul>
      {shifts.map(shift => (
        <li key={shift.id}>
          <strong>{shift.shift_date}</strong> — {shift.location}<br />
          {shift.shift_type} – £{shift.rate}
        </li>
      ))}
    </ul>
  )
}

function EnquiryList({ profile }) {
  const [bookings, setBookings] = useState([])
  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from('bookings')
        .select(`
          id, status, dentist_confirmed, practice_confirmed,
          shifts (id, shift_date, location, rate, practice_id),
          dentist:dentist_id (full_name, email)
        `)
        .order('created_at', { ascending: false })
      const filtered = (data || []).filter(b => b.shifts?.practice_id === profile.id)
      setBookings(filtered)
    }
    fetch()
  }, [profile.id])

  const confirm = async (bookingId) => {
    await supabase.from('bookings').update({ practice_confirmed: true }).eq('id', bookingId)
    setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, practice_confirmed: true } : b))
  }

  return (
    <ul>
      {bookings.map(b => {
        const bothConfirmed = b.practice_confirmed && b.dentist_confirmed
        return (
          <li key={b.id} style={{ marginBottom: '1rem', border: '1px solid #ccc', padding: '1rem' }}>
            <strong>{b.shifts.shift_date}</strong> – {b.shifts.location}<br />
            Rate: £{b.shifts.rate}<br />
            <em>Status: {b.status}</em><br />
            <a href={`/chat/${b.id}`}>
              <button style={{ marginTop: '0.5rem' }}>Message Dentist</button>
            </a>
            {!b.practice_confirmed && (
              <button onClick={() => confirm(b.id)} style={{ marginLeft: '1rem' }}>
                Confirm Booking
              </button>
            )}
            {bothConfirmed && (
              <>
                <p><strong>Dentist:</strong> {b.dentist?.full_name}</p>
                <p>Email: {b.dentist?.email}</p>
              </>
            )}
          </li>
        )
      })}
    </ul>
  )
}

function DentistBookings({ profile }) {
  const [bookings, setBookings] = useState([])

  useEffect(() => {
    const fetch = async () => {
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          id,
          status,
          practice_confirmed,
          dentist_confirmed,
          shifts (
            id,
            shift_date,
            location,
            rate,
            practice_id
          ),
          practice:shifts!inner.practice_id (
            id,
            full_name,
            email,
            phone
          )
        `)
        .eq('dentist_id', profile.id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching bookings:', error)
        return
      }

      setBookings(data || [])
    }

    fetch()
  }, [profile.id])

  const confirm = async (bookingId) => {
    await supabase.from('bookings').update({ dentist_confirmed: true }).eq('id', bookingId)
    setBookings(prev =>
      prev.map(b =>
        b.id === bookingId ? { ...b, dentist_confirmed: true } : b
      )
    )
  }

  return (
    <ul>
      {bookings.map(b => {
        const bothConfirmed = b.practice_confirmed && b.dentist_confirmed
        const contactDetails = bothConfirmed ? (
          <>
            <p><strong>Practice Contact:</strong></p>
            <p>Email: {b.practice?.email || 'N/A'}</p>
            <p>Phone: {b.practice?.phone || 'N/A'}</p>
          </>
        ) : (
          <p><em>Contact details will appear once booking is confirmed by both sides.</em></p>
        )

        return (
          <li key={b.id} style={{ marginBottom: '1rem', border: '1px solid #ccc', padding: '1rem' }}>
            <strong>{b.shifts.shift_date}</strong> – {b.shifts.location}<br />
            Rate: £{b.shifts.rate}<br />
            <em>Status: {b.status}</em><br />
            <a href={`/chat/${b.id}`}>
              <button style={{ marginTop: '0.5rem' }}>Open Chat</button>
            </a>
            {!b.dentist_confirmed && (
              <button onClick={() => confirm(b.id)} style={{ marginLeft: '1rem' }}>
                Confirm Booking
              </button>
            )}
            {bothConfirmed && <p><strong>Booking fully confirmed!</strong></p>}
            {contactDetails}
          </li>
        )
      })}
    </ul>
  )
}



function PendingReviews({ profile }) {
  const [pending, setPending] = useState([])
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0]
    const load = async () => {
      const { data: bookings } = await supabase
        .from('bookings')
        .select(`
          id, dentist_id, shifts (id, shift_date, location, rate, practice_id)
        `)
        .eq(profile.role === 'dentist' ? 'dentist_id' : 'practice_id', profile.id)
        .eq('status', 'accepted')

      const { data: reviews } = await supabase
        .from('reviews')
        .select('*')
        .eq('reviewer_id', profile.id)

      const reviewed = new Set(reviews.map(r => r.shift_id))
      const filtered = bookings.filter(b => b.shifts?.shift_date < today && !reviewed.has(b.shifts.id))
      setPending(filtered)
    }
    load()
  }, [profile])

  const handleSubmit = async (booking, rating, comments) => {
    await supabase.from('reviews').insert([{
      reviewer_id: profile.id,
      recipient_id: profile.role === 'dentist' ? booking.shifts.practice_id : booking.dentist_id,
      shift_id: booking.shifts.id,
      reviewer_role: profile.role,
      rating, comments
    }])
    setPending(prev => prev.filter(p => p.id !== booking.id))
  }

  if (!pending.length) return <p>No reviews due right now.</p>
  return (
    <ul>
      {pending.map(b => (
        <li key={b.id} style={{ marginBottom: '1rem', border: '1px solid #ccc', padding: '1rem' }}>
          <strong>{b.shifts.shift_date}</strong> – {b.shifts.location}<br />
          Rate: £{b.shifts.rate}
          <form onSubmit={(e) => {
            e.preventDefault()
            handleSubmit(b, parseInt(e.target.rating.value), e.target.comments.value)
          }}>
            <label>Rating:
              <select name="rating" defaultValue="5">
                {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </label><br />
            <textarea name="comments" placeholder="Optional comments" />
            <br />
            <button type="submit">Submit Review</button>
          </form>
        </li>
      ))}
    </ul>
  )
}
