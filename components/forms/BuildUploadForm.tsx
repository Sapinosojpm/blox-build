'use client';

import { useState } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { useBuildStore } from '@/store/useBuildStore';
import { useUIStore } from '@/store/useUIStore';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Upload, X, HelpCircle, Sparkles } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

const CATEGORIES = [
  'Modern Mansion',
  'Suburban Family Home',
  'Cozy Cottage',
  'Cafe / Restaurant',
  'City / Town Roleplay',
  'Hotel / Resort',
];

const STYLES = ['Aesthetic', 'Linen', 'Minimalist', 'Industrial', 'Blush', 'Rustic', 'Modern'];

const PRESETS = [
  'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=600',
  'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&q=80&w=600',
  'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&q=80&w=600',
  'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&q=80&w=600',
];

const compressImage = (file: File, maxDimension = 1200, quality = 0.85): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Resize keeping aspect ratio if dimensions exceed maximum
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(file); // Fallback if 2d context not available
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              resolve(file); // Fallback
            }
          },
          'image/jpeg',
          quality
        );
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
};

export default function BuildUploadForm() {
  const { user, isDemoMode } = useAuthStore();
  const { addBuild } = useBuildStore();
  const { setUploadModalOpen, addToast } = useUIStore();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [style, setStyle] = useState(STYLES[0]);
  const [budget, setBudget] = useState('250000');
  const [images, setImages] = useState<string[]>([PRESETS[0]]);
  const [uploading, setUploading] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];

    // Enforce tier-based image upload limits (3 for Free, 5 for Elite/Pro)
    const maxImages = user?.subscription_tier === 'free' ? 3 : 5;
    if (images.length >= maxImages) {
      addToast(`Limit reached! Your ${user?.subscription_tier?.toUpperCase()} tier is allowed up to ${maxImages} images per build post.`, 'error');
      return;
    }

    // 1. File Size Verification (Max 5MB)
    const MAX_SIZE_MB = 5;
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      addToast(`Selected image is too large! Please choose a file smaller than ${MAX_SIZE_MB}MB.`, 'error');
      return;
    }

    if (isDemoMode) {
      // Demo local file simulation
      setUploading(true);
      setTimeout(() => {
        const randomPreset = PRESETS[Math.floor(Math.random() * PRESETS.length)];
        setImages([randomPreset, ...images]);
        setUploading(false);
        addToast('Image processed and simulated successfully!', 'success');
      }, 1000);
      return;
    }

    try {
      setUploading(true);
      addToast('Compressing and optimizing build image...', 'info');

      // 2. Perform Client-Side Canvas Compression
      const compressedBlob = await compressImage(file);
      const optimizedFile = new File([compressedBlob], `${file.name.replace(/\.[^/.]+$/, "")}.jpg`, {
        type: 'image/jpeg',
      });

      const supabase = createClient();
      const fileName = `${Math.random()}.jpg`;
      const filePath = `builds/${user?.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('build-images')
        .upload(filePath, optimizedFile, {
          contentType: 'image/jpeg',
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('build-images').getPublicUrl(filePath);
      if (data?.publicUrl) {
        setImages([data.publicUrl, ...images]);
        addToast('Image optimized and uploaded successfully to Supabase Storage!', 'success');
      }
    } catch (err: any) {
      console.error('Storage upload failed:', err);
      // Fallback
      const randomPreset = PRESETS[Math.floor(Math.random() * PRESETS.length)];
      setImages([randomPreset, ...images]);
      
      // Toast the exact error message so the user knows what policy or bucket issue occurred!
      const errorMessage = err?.message || 'Unknown network error';
      addToast(`Upload failed: ${errorMessage}. Mockup applied.`, 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!title || !description || !budget) {
      addToast('Please fill out all required fields', 'error');
      return;
    }

    if (images.length === 0) {
      addToast('Please upload at least one image', 'error');
      return;
    }

    const payload = {
      user_id: user.id,
      title,
      description,
      images,
      category,
      style,
      budget: parseInt(budget, 10),
      profiles: user,
    };

    const success = await addBuild(payload, isDemoMode);
    if (success) {
      addToast('Your build has been published successfully!', 'success');
      setUploadModalOpen(false);
    } else {
      addToast('Failed to publish build.', 'error');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      {/* Title */}
      <Input
        label="Build Title"
        placeholder="e.g. Modern Linen Waterfront Villa"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        required
      />

      {/* Description */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
          Description
        </label>
        <textarea
          className="w-full px-4 py-3 bg-[#111622] rounded-xl border border-white/5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blox-cyan focus:ring-1 focus:ring-blox-cyan/30 transition-all duration-300 min-h-[100px]"
          placeholder="Detail your build, special features, gamepass requirements, rooms included, time taken, custom decals used, etc."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
        />
      </div>

      {/* Grid selectors */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Category */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
            Category
          </label>
          <select
            className="w-full px-4 py-3 bg-[#111622] rounded-xl border border-white/5 text-sm text-white focus:outline-none focus:border-blox-cyan transition-colors"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        {/* Style */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
            Build Style
          </label>
          <select
            className="w-full px-4 py-3 bg-[#111622] rounded-xl border border-white/5 text-sm text-white focus:outline-none focus:border-blox-cyan transition-colors"
            value={style}
            onChange={(e) => setStyle(e.target.value)}
          >
            {STYLES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        {/* Budget */}
        <Input
          label="Budget (Bloxburg Cash)"
          type="number"
          placeholder="e.g. 250000"
          value={budget}
          onChange={(e) => setBudget(e.target.value)}
          required
        />
      </div>

      {/* Image Upload Area */}
      <div className="flex flex-col gap-2">
        <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
          Upload Build Images (Supports multi-upload)
        </label>
        
        <div className="flex items-center gap-3 overflow-x-auto py-2">
          {/* Upload Button Box */}
          <label className="flex flex-col items-center justify-center w-24 h-24 rounded-xl border-2 border-dashed border-white/10 hover:border-blox-cyan/50 bg-[#111622] cursor-pointer transition-colors shrink-0">
            <Upload size={20} className="text-gray-400" />
            <span className="text-[10px] text-gray-400 font-bold mt-1">Upload</span>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileUpload}
              disabled={uploading}
            />
          </label>

          {/* List of uploaded image thumbnails */}
          {images.map((img, i) => (
            <div key={i} className="relative w-24 h-24 rounded-xl border border-white/5 overflow-hidden bg-blox-gray shrink-0 group">
              <img src={img} alt="Build Thumbnail" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => handleRemoveImage(i)}
                className="absolute top-1 right-1 p-1 bg-black/80 rounded-full text-blox-red hover:text-white transition-colors cursor-pointer"
              >
                <X size={10} />
              </button>
            </div>
          ))}
        </div>
        
        <p className="text-[10px] text-gray-500 font-medium leading-relaxed">
          💡 If you are testing offline, we will automatically supply a high-quality mockup architectural picture. Supports PNG, JPG.
        </p>
      </div>

      {/* Form Buttons */}
      <div className="flex justify-end gap-3 mt-4">
        <Button type="button" variant="ghost" onClick={() => setUploadModalOpen(false)}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" glow={true} disabled={uploading}>
          {uploading ? 'Processing Image...' : 'Publish Build Post'}
        </Button>
      </div>
    </form>
  );
}
