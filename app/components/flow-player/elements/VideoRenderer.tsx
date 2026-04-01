'use client';

import { FlowElement } from '@/lib/flows/types';

interface ElementRendererProps {
  element: FlowElement;
  value: unknown;
  onChange: (value: unknown) => void;
  disabled?: boolean;
}

function extractYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

export default function VideoRenderer({ element }: ElementRendererProps) {
  if (element.type !== 'video') return null;

  const youtubeId = extractYouTubeId(element.url);

  return (
    <div className="space-y-2">
      {element.label && (
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{element.label}</p>
      )}
      <div className="w-full rounded-lg aspect-video overflow-hidden bg-black">
        {youtubeId ? (
          <iframe
            src={`https://www.youtube.com/embed/${youtubeId}`}
            title={element.label || 'Video'}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="w-full h-full"
          />
        ) : (
          <video
            src={element.url}
            controls
            className="w-full h-full"
          />
        )}
      </div>
      {element.help_text && (
        <p className="text-sm text-gray-500 dark:text-gray-400">{element.help_text}</p>
      )}
    </div>
  );
}
