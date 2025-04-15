import { useRouter } from 'next/router'

export default function HomePage() {
  const router = useRouter()

  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      {/* Top Bar */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '2rem' }}>
        <button
          onClick={() => router.push('/login')}
          style={{
            padding: '0.5rem 1rem',
            fontSize: '0.9rem',
            cursor: 'pointer',
            backgroundColor: '#0070f3',
            color: '#fff',
            border: 'none',
            borderRadius: '4px'
          }}
        >
          Login
        </button>
      </div>

      {/* Main Content */}
      <div style={{ textAlign: 'center' }}>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>LocumLink Dental</h1>
        <p style={{ fontSize: '1.2rem', maxWidth: '600px', margin: '0 auto 2rem' }}>
          Connecting dental practices with available locum dentists quickly and easily. No middlemen. No fuss.
        </p>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', flexWrap: 'wrap' }}>
          <button
            onClick={() => router.push('/register')}
            style={{ padding: '1rem 2rem', fontSize: '1rem', cursor: 'pointer' }}
          >
            I’m a Dentist
          </button>
          <button
            onClick={() => router.push('/register')}
            style={{ padding: '1rem 2rem', fontSize: '1rem', cursor: 'pointer' }}
          >
            I’m a Practice
          </button>
        </div>
      </div>
    </div>
  )
}
