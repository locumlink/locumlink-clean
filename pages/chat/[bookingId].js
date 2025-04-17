import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '../../utils/supabaseClient'
import { useAuth } from '../../context/AuthContext'

export default function ChatPage() {
  const router = useRouter()
  const { bookingId } = router.query
  const { session } = useAuth()
  const [profile, setProfile] = useState(null)
  const [booking, setBooking] = useState(null)
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [confirming, setConfirming] = useState(false)
  const [contactDetails, setContactDetails] = useState(null)

  const fetchProfile = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', session.user.id)
      .single()
    if (error) return console.error(error)
    setProfile(data)
  }

  const fetchBooking = async () => {
    const { data, error } = await supabase
      .from('bookings')
      .select(`
        *,
        shifts (
          id, shift_date, location, rate, practice_id
        ),
        dentist:dentist_id (
          id, full_name, email
        )
      `)
      .eq('id', bookingId)
      .single()

    if (error) return console.error(error)
    setBooking(data)

    // Get contact details using the practice_id
    const practiceId = data?.shifts?.practice_id
    if (practiceId) {
      const { data: contactData, error: contactError } = await supabase
        .from('practice_details')
        .select('contact_email, contact_phone')
        .eq('profile_id', practiceId)
        .single()
      if (contactError) {
        console.error('Error fetching contact info:', contactError)
      } else {
        setContactDetails(contactData)
      }
    }
  }

  const fetchMessages = async () => {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('chat_id', bookingId)
      .order('created_at', { ascending: true })
    if (error) return console.error(error)
    setMessages(data)
  }

  const containsContactInfo = (text) => {
    const contactPatterns = [
      /\b\d{10,}\b/,
      /\b0\d{9,}\b/,
      /\+44\s?\d{9,}/,
      /@\w+\.\w+/,
      /\bemail\b/i,
      /\bphone\b/i,
      /\bcall me\b/i,
      /\btext me\b/i,
      /\bmessage me\b/i,
      /instagram|facebook|snapchat|tiktok|twitter/i,
    ]
    return contactPatterns.some((regex) => regex.test(text))
  }

  const sendMessage = async () => {
    if (!newMessage.trim()) return
    if (containsContactInfo(newMessage)) {
      alert('Please don’t share contact details in chat.')
      return
    }

    const { error } = await supabase.from('messages').insert([{
      chat_id: bookingId,
      sender_id: profile.id,
      message: newMessage
    }])

    if (!error) {
      setNewMessage('')
      fetchMessages()
    }
  }

  const confirmBooking = async () => {
    setConfirming(true)
    const columnToUpdate = booking.dentist_id === profile.id
      ? 'dentist_confirmed'
      : 'practice_confirmed'

    const { error } = await supabase
      .from('bookings')
      .update({ [columnToUpdate]: true })
      .eq('id', bookingId)

    if (!error) fetchBooking()
    else alert('Error confirming shift')

    setConfirming(false)
  }

  useEffect(() => {
    if (bookingId && session) fetchProfile()
  }, [session, bookingId])

  useEffect(() => {
    if (profile && bookingId) {
      fetchBooking()
      fetchMessages()
      setLoading(false)
    }
  }, [profile, bookingId])

  if (loading) return <p style={{ padding: '2rem' }}>Loading chat...</p>
  if (!booking || !profile) return <p>Booking or profile not found.</p>

  const isParticipant = booking.dentist_id === profile.id || booking.shifts.practice_id === profile.id
  if (!isParticipant) return <p>You are not authorized to view this chat.</p>

  const getSenderLabel = (msg) => {
    if (msg.sender_id === profile.id) return 'You'
    return booking.dentist_id === msg.sender_id ? 'Dentist' : 'Practice'
  }

  const bothConfirmed = booking.dentist_confirmed && booking.practice_confirmed
  const userConfirmed = profile.id === booking.dentist_id
    ? booking.dentist_confirmed
    : booking.practice_confirmed

  return (
    <div style={{ padding: '2rem' }}>
      <h2>Chat for Shift on {booking.shifts?.shift_date}</h2>
      <p>Status: {bothConfirmed ? '✅ Booking confirmed' : userConfirmed ? '✅ You’ve confirmed' : 'Pending confirmation'}</p>

      {!bothConfirmed && (
        <button onClick={confirmBooking} disabled={userConfirmed || confirming}>
          {userConfirmed ? 'Waiting for other party...' : confirming ? 'Confirming...' : 'Confirm Booking'}
        </button>
      )}

      {bothConfirmed && (
        <div style={{ margin: '1rem 0', padding: '1rem', background: '#e0ffe0', border: '1px solid #8bc34a' }}>
          <strong>Contact Details:</strong><br />
          {profile.id === booking.dentist_id ? (
            <>
              <p>Email: {contactDetails?.contact_email || 'N/A'}</p>
              <p>Phone: {contactDetails?.contact_phone || 'N/A'}</p>
            </>
          ) : (
            <>
              <p>Email: {booking.dentist?.email || 'N/A'}</p>
            </>
          )}
        </div>
      )}

      <div style={{
        border: '1px solid #ccc',
        padding: '1rem',
        height: '300px',
        overflowY: 'scroll',
        marginBottom: '1rem',
        background: '#f9f9f9'
      }}>
        {messages.map((msg) => (
          <div key={msg.id} style={{ marginBottom: '0.5rem' }}>
            <strong>{getSenderLabel(msg)}</strong>: {msg.message}
            <div style={{ fontSize: '0.8rem', color: '#666' }}>{new Date(msg.created_at).toLocaleString()}</div>
          </div>
        ))}
      </div>

      <form onSubmit={(e) => {
        e.preventDefault()
        sendMessage()
      }}>
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type your message..."
          style={{ width: '80%' }}
        />
        <button type="submit" style={{ marginLeft: '1rem' }}>Send</button>
      </form>
    </div>
  )
}
