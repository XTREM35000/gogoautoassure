import React, { useRef, useState } from 'react';
import { Upload, X } from 'lucide-react';
import { Button } from './button';
import { cn } from '@/lib/utils';

interface AvatarUploadProps {
  onFileSelect: (file: File) => void;
  avatarUrl?: string;
  disabled?: boolean;
  className?: string;
}

export function AvatarUpload({ onFileSelect, avatarUrl, disabled = false, className }: AvatarUploadProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('Le fichier est trop volumineux. Taille maximum : 5MB');
        return;
      }

      if (!file.type.startsWith('image/')) {
        alert('Veuillez sélectionner une image');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      onFileSelect(file);
    }
  };

  const handleClick = () => {
    if (!disabled) {
      fileInputRef.current?.click();
    }
  };

  const handleRemove = () => {
    if (!disabled) {
      setPreview(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const displayImage = preview || avatarUrl;

  return (
    <div className={cn('flex flex-col items-center gap-4', className)}>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
        disabled={disabled}
      />

      {displayImage ? (
        <div className="relative">
          <img
            src={displayImage}
            alt="Avatar"
            className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-md"
          />
          {!disabled && (
            <button
              onClick={handleRemove}
              className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      ) : (
        <Button
          type="button"
          variant="outline"
          onClick={handleClick}
          disabled={disabled}
          className={cn(
            "w-32 h-32 rounded-full border-2 border-dashed flex flex-col items-center justify-center gap-2",
            disabled && "opacity-50 cursor-not-allowed"
          )}
        >
          <Upload className="w-6 h-6 text-gray-400" />
          <span className="text-sm text-gray-500">Ajouter une photo</span>
        </Button>
      )}
    </div>
  );
}
