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
      .select('*, shifts(*), dentist:dentist_id(*), practice:shifts(practice_id)')
      .eq('id', bookingId)
      .single()
    if (error) return console.error(error)
    setBooking(data)
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
      /\b\d{10,}\b/, // long numbers (e.g., phone)
      /\b0\d{9,}\b/, // UK phone format
      /\+44\s?\d{9,}/, // international UK format
      /@\w+\.\w+/, // email-like
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
      alert('Sorry — please don’t share contact details in messages. Use this chat to coordinate only.')
      return
    }

    const { error } = await supabase.from('messages').insert([{
      chat_id: bookingId,
      sender_id: profile.id,
      message: newMessage
    }])

    if (error) return console.error(error)

    setNewMessage('')
    fetchMessages()
  }

  useEffect(() => {
    if (!bookingId || !session) return
    fetchProfile()
  }, [session, bookingId])

  useEffect(() => {
    if (!profile || !bookingId) return
    fetchBooking()
    fetchMessages()
    setLoading(false)
  }, [profile, bookingId])

  if (loading) return <p style={{ padding: '2rem' }}>Loading chat...</p>
  if (!booking || !profile) return <p>Booking or profile not found.</p>

  const isParticipant =
    booking.dentist_id === profile.id || booking.shifts.practice_id === profile.id

  if (!isParticipant) return <p>You are not authorized to view this chat.</p>

  const getSenderLabel = (msg) => {
    if (msg.sender_id === profile.id) return 'You'
    return booking.dentist_id === msg.sender_id ? 'Dentist' : 'Practice'
  }

  return (
    <div style={{ padding: '2rem' }}>
      <h2>Chat for Shift on {booking.shifts?.shift_date}</h2>
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
