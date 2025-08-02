'use client';

import { useState, useRef } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { toast } from 'sonner';
import { Camera, Upload, X } from 'lucide-react';
import type { SessionUser } from '@/types/user';

interface AvatarUploadProps {
  user: SessionUser;
  onAvatarChange: (_url: string | null) => void;
}

export function AvatarUpload({ user, onAvatarChange }: AvatarUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const file = files[0];

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file');
      return;
    }

    // Validate file size (2MB limit for avatars)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image size must be less than 2MB');
      return;
    }

    uploadAvatar(file);
  };

  const uploadAvatar = async (file: File) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', 'avatars');
      formData.append('quality', '85');

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Upload failed');
      }

      const result = await response.json();

      // Update the user's avatar
      await updateUserAvatar(result.url);

      toast.success('Avatar updated successfully!');
    } catch (error) {
      console.error('Avatar upload error:', error);
      toast.error(
        error instanceof Error ? error.message : 'Failed to upload avatar'
      );
    } finally {
      setUploading(false);
    }
  };

  const updateUserAvatar = async (avatarUrl: string) => {
    try {
      const response = await fetch('/api/users/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ avatar_url: avatarUrl }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update avatar');
      }

      onAvatarChange(avatarUrl);
    } catch (error) {
      console.error('Error updating avatar:', error);
      throw error;
    }
  };

  const removeAvatar = async () => {
    try {
      await updateUserAvatar('');
      toast.success('Avatar removed successfully!');
    } catch (error) {
      console.error('Error removing avatar:', error);
      toast.error('Failed to remove avatar');
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const getInitials = () => {
    const firstName = user.firstName || '';
    const lastName = user.lastName || '';
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Camera className="h-5 w-5" />
          Profile Picture
        </CardTitle>
        <CardDescription>
          Upload a profile picture that will be displayed in the sidebar
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4">
          <Avatar className="h-20 w-20">
            <AvatarImage src={user.image || user.avatar_url} alt={user.name} />
            <AvatarFallback className="text-lg font-semibold">
              {getInitials()}
            </AvatarFallback>
          </Avatar>

          <div className="flex flex-col gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              <Upload className="mr-2 h-4 w-4" />
              {uploading ? 'Uploading...' : 'Upload New'}
            </Button>

            {user.image || user.avatar_url ? (
              <Button
                variant="outline"
                size="sm"
                onClick={removeAvatar}
                disabled={uploading}
              >
                <X className="mr-2 h-4 w-4" />
                Remove
              </Button>
            ) : null}
          </div>
        </div>

        <div
          className={`rounded-lg border-2 border-dashed p-6 text-center transition-colors ${
            dragOver
              ? 'border-primary bg-primary/5'
              : 'border-muted-foreground/25'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <Upload className="text-muted-foreground mx-auto mb-2 h-8 w-8" />
          <p className="text-muted-foreground text-sm">
            Drag and drop an image here, or{' '}
            <button
              type="button"
              className="text-primary hover:underline"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              click to browse
            </button>
          </p>
          <p className="text-muted-foreground mt-1 text-xs">
            PNG, JPG, or WebP up to 2MB
          </p>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={e => handleFileSelect(e.target.files)}
          className="hidden"
        />
      </CardContent>
    </Card>
  );
}
