'use client';

import { useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';

interface Props {
  label?: string;
  helpText?: string;
  accept?: string;
  maxSizeMB?: number;
  bucket: string;
  storagePath: string;
  buttonLabel?: string;
  onUploaded: (url: string) => void;
  currentUrl?: string;
}

export default function FileUpload({
  label,
  helpText,
  accept = 'image/*',
  maxSizeMB,
  bucket,
  storagePath,
  buttonLabel = 'UPLOAD FILE',
  onUploaded,
  currentUrl,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const [uploadedUrl, setUploadedUrl] = useState(currentUrl ?? '');
  const [uploadedName, setUploadedName] = useState('');

  const isImage = (url: string) => /\.(jpg|jpeg|png|webp|gif)$/i.test(url);

  async function handleFile(file: File) {
    setError('');

    if (maxSizeMB && file.size > maxSizeMB * 1024 * 1024) {
      setError(`File must be under ${maxSizeMB}MB`);
      return;
    }

    setUploading(true);
    setProgress(0);
    setUploadedName(file.name);

    const ext = file.name.split('.').pop();
    const filePath = `${storagePath}.${ext}`;

    // Use XMLHttpRequest for progress tracking
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData?.session?.access_token ?? supabaseKey;

    await new Promise<void>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          setProgress(Math.round((e.loaded / e.total) * 100));
        }
      });
      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve();
        } else {
          reject(new Error(xhr.responseText));
        }
      });
      xhr.addEventListener('error', () => reject(new Error('Upload failed')));
      xhr.open('POST', `${supabaseUrl}/storage/v1/object/${bucket}/${filePath}`);
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      xhr.setRequestHeader('x-upsert', 'true');
      xhr.setRequestHeader('Content-Type', file.type);
      xhr.send(file);
    }).catch(err => {
      setError(String(err.message ?? 'Upload failed'));
      setUploading(false);
      return;
    });

    if (error) return;

    // Get public URL (for profile-photos) or construct path (for private buckets)
    let url: string;
    const { data: publicData } = supabase.storage.from(bucket).getPublicUrl(filePath);
    if (publicData.publicUrl && !publicData.publicUrl.includes('undefined')) {
      url = publicData.publicUrl;
    } else {
      // For private buckets, store the path and generate signed URLs on demand
      url = filePath;
    }

    setUploadedUrl(url);
    onUploaded(url);
    setUploading(false);
    setProgress(100);
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

  function handleRemove() {
    setUploadedUrl('');
    setUploadedName('');
    setProgress(0);
    if (inputRef.current) inputRef.current.value = '';
    onUploaded('');
  }

  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-semibold text-[#1B3A5C]">{label}</label>
      )}

      {uploadedUrl ? (
        <div className="border border-slate-200 rounded-xl p-4">
          {isImage(uploadedUrl) ? (
            <div className="flex items-center gap-3">
              <img
                src={uploadedUrl}
                alt="Uploaded"
                className="w-16 h-16 rounded-lg object-cover border border-slate-100"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[#1B3A5C] truncate">Image uploaded</p>
                <p className="text-xs text-slate-400 truncate">{uploadedName}</p>
              </div>
              <button
                type="button"
                onClick={handleRemove}
                className="text-xs text-rose-400 hover:text-rose-600 font-semibold shrink-0"
              >
                Remove
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center shrink-0">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[#1B3A5C]">File uploaded</p>
                <p className="text-xs text-slate-400 truncate">{uploadedName}</p>
              </div>
              <button
                type="button"
                onClick={handleRemove}
                className="text-xs text-rose-400 hover:text-rose-600 font-semibold shrink-0"
              >
                Remove
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="flex items-stretch gap-3">
          <div
            onDrop={onDrop}
            onDragOver={e => e.preventDefault()}
            className="flex-1 border-2 border-dashed border-slate-200 rounded-xl p-5 cursor-pointer hover:border-[#9e6b7a] hover:bg-[#9e6b7a]/5 transition-colors"
            onClick={() => inputRef.current?.click()}
          >
            {uploading ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: '#9e6b7a', borderTopColor: 'transparent' }} />
                  <span className="text-xs text-slate-500">Uploading… {progress}%</span>
                </div>
                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${progress}%`, background: '#9e6b7a' }}
                  />
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-1 text-center">
                <svg className="w-7 h-7 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <p className="text-xs text-slate-500 font-medium">Drag and drop files here</p>
                {maxSizeMB && (
                  <p className="text-xs text-slate-400">Max. file size: {maxSizeMB}MB</p>
                )}
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="px-4 py-2 rounded-xl font-semibold text-xs text-white bg-blue-600 hover:bg-blue-700 transition-colors disabled:opacity-50 shrink-0 self-stretch flex items-center"
          >
            {buttonLabel}
          </button>
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
