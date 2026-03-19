'use client';

import { useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';

interface Props {
  label: string;
  bucket: string;
  path: string;
  accept?: string;
  helpText?: string;
  onUploaded: (url: string) => void;
  currentUrl?: string;
}

export default function FileUpload({
  label,
  bucket,
  path,
  accept = 'image/*',
  helpText,
  onUploaded,
  currentUrl,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [previewUrl, setPreviewUrl] = useState(currentUrl ?? '');

  async function handleFile(file: File) {
    setUploading(true);
    setError('');

    const ext      = file.name.split('.').pop();
    const filePath = `${path}/${Date.now()}.${ext}`;

    const { error: uploadErr } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, { upsert: true });

    if (uploadErr) {
      setError(uploadErr.message);
      setUploading(false);
      return;
    }

    const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
    const url = data.publicUrl;
    setPreviewUrl(url);
    onUploaded(url);
    setUploading(false);
  }

  function onInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }

  function onDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }

  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-semibold text-[#1B3A5C]">{label}</label>

      {previewUrl ? (
        <div className="flex items-center gap-3">
          <img
            src={previewUrl}
            alt="Uploaded"
            className="w-16 h-16 rounded-xl object-cover border border-slate-200"
          />
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="text-xs text-[#4E87A0] hover:text-[#3A7190] font-semibold transition-colors"
          >
            {uploading ? 'Uploading…' : 'Change file'}
          </button>
        </div>
      ) : (
        <div
          onDrop={onDrop}
          onDragOver={e => e.preventDefault()}
          onClick={() => inputRef.current?.click()}
          className="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center cursor-pointer hover:border-[#4E87A0] hover:bg-[#4E87A0]/5 transition-colors"
        >
          {uploading ? (
            <div className="flex flex-col items-center gap-2">
              <div className="w-6 h-6 border-2 border-[#4E87A0] border-t-transparent rounded-full animate-spin" />
              <p className="text-xs text-slate-400">Uploading…</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <svg className="w-8 h-8 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <p className="text-sm text-slate-500 font-medium">Click to upload or drag and drop</p>
            </div>
          )}
        </div>
      )}

      {error && <p className="text-xs text-rose-500">{error}</p>}
      {helpText && <p className="text-xs text-slate-400">{helpText}</p>}

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={onInputChange}
        className="hidden"
      />
    </div>
  );
}
