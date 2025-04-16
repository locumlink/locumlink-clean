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

          <h3 style={{ marginTop: '2rem' }}>My Bookings</h3>
          <DentistBookings dentistId={profile.id} />

          <h3 style={{ marginTop: '2rem' }}>Pending Reviews</h3>
          <PendingReviews profile={profile} />
        </>
      )}

      {profile.role === 'practice' && (
        <>
          <h2>Your Practice Info</h2>
          <p>Email: {profile.email}</p>
          <p>Postcode: {profile.postcode}</p>

          <h3 style={{ marginTop: '2rem' }}>Posted Shifts</h3>
          <PracticeShifts practiceId={profile.id} />

          <h3 style={{ marginTop: '2rem' }}>Enquiries Received</h3>
          <EnquiryList practiceId={profile.id} />

          <h3 style={{ marginTop: '2rem' }}>Pending Reviews</h3>
          <PendingReviews profile={profile} />
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

function EnquiryList({ practiceId }) {
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)

  const handleAccept = async (bookingId) => {
    const { error } = await supabase
      .from('bookings')
      .update({ status: 'accepted' })
      .eq('id', bookingId)

    if (error) {
      alert('Error accepting booking')
      console.error(error)
    } else {
      alert('Booking accepted!')
      setBookings((prev) =>
        prev.map((b) =>
          b.id === bookingId ? { ...b, status: 'accepted' } : b
        )
      )
    }
  }

  useEffect(() => {
    const fetchEnquiries = async () => {
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          id,
          status,
          shift_id,
          shifts (
            id,
            practice_id,
            shift_date,
            location,
            rate
          ),
          dentist:dentist_id (
            full_name,
            email
          )
        `)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching bookings:', error)
        setLoading(false)
        return
      }

      const filtered = data.filter(
        (booking) => booking.shifts && booking.shifts.practice_id === practiceId
      )

      setBookings(filtered)
      setLoading(false)
    }

    fetchEnquiries()
  }, [practiceId])

  if (loading) return <p>Loading enquiries...</p>
  if (bookings.length === 0) return <p>No enquiries yet.</p>

  return (
    <ul>
      {bookings.map((b) => (
        <li key={b.id} style={{ border: '1px solid #ccc', padding: '1rem', margin: '1rem 0' }}>
          <strong>{b.shifts.shift_date}</strong> – {b.shifts.location}<br />
          Rate: £{b.shifts.rate}<br />
          <em>Status: {b.status}</em><br />

          {b.status !== 'accepted' && (
            <a href={`/chat/${b.id}`}>
              <button style={{ marginTop: '0.5rem' }}>Message Dentist</button>
            </a>
          )}

          {b.status === 'pending' && (
            <button onClick={() => handleAccept(b.id)} style={{ marginTop: '0.5rem' }}>
              Accept Booking
            </button>
          )}

          {b.status === 'accepted' && (
            <a href={`/chat/${b.id}`}>
              <button style={{ marginTop: '0.5rem' }}>Open Chat</button>
            </a>
          )}
          <br /><br />
          <strong>Dentist:</strong> {b.dentist?.full_name}<br />
          {b.status === 'accepted' && <span>Email: {b.dentist?.email}</span>}
        </li>
      ))}
    </ul>
  )
}

function DentistBookings({ dentistId }) {
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchMyBookings = async () => {
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          id,
          status,
          shifts (
            shift_date,
            location,
            rate
          )
        `)
        .eq('dentist_id', dentistId)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching my bookings:', error)
        setLoading(false)
        return
      }

      setBookings(data)
      setLoading(false)
    }

    fetchMyBookings()
  }, [dentistId])

  if (loading) return <p>Loading your bookings...</p>
  if (bookings.length === 0) return <p>You have no bookings yet.</p>

  return (
    <ul>
      {bookings.map((b) => (
        <li key={b.id} style={{ border: '1px solid #ccc', padding: '1rem', margin: '1rem 0' }}>
          <strong>{b.shifts.shift_date}</strong> – {b.shifts.location}<br />
          Rate: £{b.shifts.rate}<br />
          <em>Status: {b.status}</em><br />
          {b.status === 'accepted' && (
            <a href={`/chat/${b.id}`}>
              <button style={{ marginTop: '0.5rem' }}>Open Chat</button>
            </a>
          )}
        </li>
      ))}
    </ul>
  )
}

function PendingReviews({ profile }) {
  const [pending, setPending] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState({})
  const isDentist = profile.role === 'dentist'

  useEffect(() => {
    const fetchPending = async () => {
      const today = new Date().toISOString().split('T')[0]

      const { data: bookings, error } = await supabase
        .from('bookings')
        .select(`
          id,
          dentist_id,
          shifts (
            id,
            shift_date,
            location,
            rate,
            practice_id
          )
        `)
        .eq(isDentist ? 'dentist_id' : 'practice_id', profile.id)
        .eq('status', 'accepted')

      if (error) {
        console.error('Error fetching bookings:', error)
        setLoading(false)
        return
      }

      const { data: reviews } = await supabase
        .from('reviews')
        .select('*')
        .eq('reviewer_id', profile.id)

      const reviewedShiftIds = new Set(reviews.map(r => r.shift_id))

      const pastUnreviewed = bookings.filter(b => {
        const date = b.shifts?.shift_date
        return date && date < today && !reviewedShiftIds.has(b.shifts.id)
      })

      setPending(pastUnreviewed)
      setLoading(false)
    }

    fetchPending()
  }, [profile])

  const handleSubmit = async (booking, rating, comments) => {
    setSubmitting(prev => ({ ...prev, [booking.id]: true }))

    const recipientId = isDentist ? booking.shifts.practice_id : booking.dentist_id

    const { error } = await supabase.from('reviews').insert([{
      reviewer_id: profile.id,
      recipient_id: recipientId,
      shift_id: booking.shifts.id,
      reviewer_role: profile.role,
      rating,
      comments
    }])

    if (!error) {
      setPending(prev => prev.filter(p => p.id !== booking.id))
    }

    setSubmitting(prev => ({ ...prev, [booking.id]: false }))
  }

  if (loading) return <p>Loading pending reviews...</p>
  if (pending.length === 0) return <p>No reviews due right now.</p>

  return (
    <ul>
      {pending.map((b) => (
        <li key={b.id} style={{ border: '1px solid #ccc', padding: '1rem', margin: '1rem 0' }}>
          <strong>{b.shifts.shift_date}</strong> – {b.shifts.location}<br />
          Rate: £{b.shifts.rate}<br />
          <form onSubmit={e => {
            e.preventDefault()
            const rating = parseInt(e.target.rating.value)
            const comments = e.target.comments.value
            handleSubmit(b, rating, comments)
          }}>
            <label>
              Rating:
              <select name="rating" defaultValue="5">
                {[1, 2, 3, 4, 5].map(r => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </label>
            <br />
            <label>
              Comments:
              <br />
              <textarea name="comments" rows="2" style={{ width: '100%' }} />
            </label>
            <br />
            <button type="submit" disabled={submitting[b.id]}>Submit Review</button>
          </form>
        </li>
      ))}
    </ul>
  )
}
