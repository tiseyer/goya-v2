'use client';

import { useRef, useState } from 'react';
import { Upload } from 'lucide-react';
import { FlowElement } from '@/lib/flows/types';

interface ElementRendererProps {
  element: FlowElement;
  value: unknown;
  onChange: (value: unknown) => void;
  disabled?: boolean;
}

export default function ImageUploadRenderer({ element, value, onChange, disabled }: ElementRendererProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  if (element.type !== 'image_upload') return null;

  const handleFile = (file: File) => {
    if (!file.type.startsWith('image/')) return;
    const url = URL.createObjectURL(file);
    setPreview(url);
    onChange(file);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const currentFile = value instanceof File ? value : null;

  return (
    <div className="space-y-1.5">
      {element.label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {element.label}
          {element.required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <div
        onClick={() => !disabled && inputRef.current?.click()}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={[
          'border-2 border-dashed rounded-xl p-6 text-center transition-all',
          isDragOver
            ? 'border-[var(--color-primary)] bg-[var(--goya-primary-50)]'
            : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500',
          disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer',
        ].join(' ')}
      >
        {preview ? (
          <div className="space-y-3">
            <img
              src={preview}
              alt="Upload preview"
              className="max-w-full max-h-48 mx-auto rounded-lg object-contain"
            />
            {currentFile && (
              <p className="text-sm text-gray-500 dark:text-gray-400">{currentFile.name}</p>
            )}
            {!disabled && (
              <p className="text-sm text-[var(--color-primary)]">Click to change image</p>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            <Upload className="mx-auto text-gray-400" size={32} />
            <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
              Click to upload or drag and drop
            </p>
            <p className="text-xs text-gray-400">PNG, JPG, GIF, WebP accepted</p>
          </div>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          onChange={handleChange}
          disabled={disabled}
          className="hidden"
        />
      </div>
      {element.help_text && (
        <p className="text-sm text-gray-500 dark:text-gray-400">{element.help_text}</p>
      )}
    </div>
  );
}
