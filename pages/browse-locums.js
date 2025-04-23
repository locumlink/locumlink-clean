// /pages/browse-locums.js
import { useEffect, useState } from 'react'
import { supabase } from '../utils/supabaseClient'
import Link from 'next/link'

export default function BrowseLocums() {
  const [locums, setLocums] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
  const fetchLocums = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select(`
        id,
        role,
        postcode,
        dentist_details (
          uk_experience,
          additional_skills,
          locum_type,
          nhs_private_preference,
          min_rate,
          max_rate
        )
      `)
      .eq('role', 'dentist')

    console.log('Returned locums data:', data)
    console.log('Error (if any):', error)

    if (error) {
      console.error('Error fetching locums:', error)
    } else {
      setLocums(data)
    }

    setLoading(false)
  }

  fetchLocums()
}, [])


  const renderLocumCard = (locum, index) => {
    const details = locum.dentist_details || {}

    return (
      <div
        key={locum.id}
        className="border rounded-lg p-4 shadow-md bg-white flex flex-col gap-2"
      >
        <h2 className="text-xl font-semibold">Locum {String.fromCharCode(65 + index)}</h2>
        <p><strong>Experience:</strong> {details.uk_experience || 'N/A'} years</p>
        <p><strong>Skills:</strong> {details.additional_skills?.join(', ') || 'N/A'}</p>
        <p><strong>Availability:</strong> {details.locum_type || 'N/A'}</p>
        <p><strong>Prefers:</strong> {details.nhs_private_preference || 'N/A'}</p>
        <p><strong>Rate:</strong> £{details.min_rate || '?'} – £{details.max_rate || '?'}/day</p>
        <button className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
          Propose Shift
        </button>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Browse Locum Dentists</h1>
      {loading ? (
        <p>Loading...</p>
      ) : locums.length === 0 ? (
        <p>No locums found.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {locums.map((locum, index) => renderLocumCard(locum, index))}
        </div>
      )}
    </div>
  )
}
