'use client';

import dynamic from 'next/dynamic';

const FlowPlayer = dynamic(() => import('./FlowPlayer'), { ssr: false });

export default function FlowPlayerLoader() {
  return <FlowPlayer />;
}
