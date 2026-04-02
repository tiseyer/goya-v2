'use client'

import dynamic from 'next/dynamic'

const ProfileMap = dynamic(() => import('./ProfileMap'), { ssr: false })

export default function ProfileMapWrapper(props: { lat: number; lng: number }) {
  return <ProfileMap {...props} />
}
