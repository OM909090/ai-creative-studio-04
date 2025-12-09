import { useRef, useEffect } from 'react';
import { Upload, ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface CanvasProps {
  image: string | null;
  cssFilters: string;
  zoom: number;
  rotation: number;
  onImageUpload: (file: File) => void;
}

export function Canvas({ image, cssFilters, zoom, rotation, onImageUpload }: CanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      onImageUpload(file);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImageUpload(file);
    }
  };

  return (
    <div
      ref={containerRef}
      className="canvas-container flex-1 flex items-center justify-center min-h-[400px]"
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
    >
      {image ? (
        <div
          className="relative transition-transform duration-200 ease-out"
          style={{
            transform: `scale(${zoom}) rotate(${rotation}deg)`,
          }}
        >
          <img
            src={image}
            alt="Editing"
            className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-2xl"
            style={{ filter: cssFilters }}
          />
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center gap-6 p-12 animate-fade-in">
          <div className="relative">
            <div className="absolute inset-0 bg-primary/20 rounded-full blur-3xl animate-pulse-slow" />
            <div className="relative w-24 h-24 rounded-full bg-secondary/50 border border-border/50 flex items-center justify-center">
              <ImageIcon className="w-10 h-10 text-muted-foreground" />
            </div>
          </div>
          <div className="text-center space-y-2">
            <h3 className="text-xl font-semibold text-foreground">
              Drop your image here
            </h3>
            <p className="text-muted-foreground text-sm">
              or click to browse from your device
            </p>
          </div>
          <Button
            variant="glow"
            size="lg"
            onClick={() => fileInputRef.current?.click()}
            className="gap-2"
          >
            <Upload className="w-4 h-4" />
            Upload Image
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
          <p className="text-xs text-muted-foreground/60">
            Supports JPG, PNG, WEBP, and GIF
          </p>
        </div>
      )}
    </div>
  );
}
