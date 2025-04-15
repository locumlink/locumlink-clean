import { useRouter } from 'next/router'

export default function HomePage() {
  const router = useRouter()

  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif', textAlign: 'center' }}>
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
  )
}
