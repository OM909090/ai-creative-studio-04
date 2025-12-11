import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  Play,
  Download,
  Clock,
  Sparkles,
  RefreshCw,
  Loader2,
  Film,
  Scissors,
  Trash2,
  AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';

export interface GeneratedShort {
  id: string;
  title: string;
  thumbnailTime: number;
  startTime: number;
  endTime: number;
  duration: number;
  score: number;
  tags: string[];
  status: 'ready' | 'processing' | 'pending';
  path?: string; 
}

interface ShortsShowcaseProps {
  isGenerating: boolean;
  shorts: GeneratedShort[];
  onSelectShort: (short: GeneratedShort) => void;
  onRegenerateShorts: () => void;
  onDeleteShort?: (shortId: string) => void;
  onDeleteAll?: () => void;
  videoSrc: string | null;
  gridLayout?: boolean;
}

export function ShortsShowcase({
  isGenerating,
  shorts,
  onSelectShort,
  onRegenerateShorts,
  onDeleteShort,
  onDeleteAll,
  videoSrc,
  gridLayout = false,
}: ShortsShowcaseProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [videoErrors, setVideoErrors] = useState<Set<string>>(new Set());
  const [videoLoading, setVideoLoading] = useState<Set<string>>(new Set());
  const videoRefs = useRef<{ [key: string]: HTMLVideoElement | null }>({});

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleVideoError = (shortId: string) => {
    setVideoErrors(prev => new Set([...prev, shortId]));
    setVideoLoading(prev => {
      const newSet = new Set(prev);
      newSet.delete(shortId);
      return newSet;
    });
  };

  const handleVideoLoad = (shortId: string) => {
    setVideoLoading(prev => {
      const newSet = new Set(prev);
      newSet.delete(shortId);
      return newSet;
    });
  };

  const handleVideoStartLoad = (shortId: string) => {
    setVideoLoading(prev => new Set([...prev, shortId]));
  };

  const handleDownload = (short: GeneratedShort, e: React.MouseEvent) => {
    e.stopPropagation();
    toast.success(`Downloading "${short.title}"...`);
  };

  const handleKeyDown = (e: React.KeyboardEvent, short: GeneratedShort) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onSelectShort(short);
    }
  };


  const handleDeleteAll = () => {
    if (onDeleteAll) {
      onDeleteAll();
    }
  };

  // Responsive grid classes
  const getGridClasses = () => {
    return "grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 auto-rows-fr";
  };

  const getClipClasses = (index: number) => {
    const isHovered = hoveredIndex === index;
    
    return cn(
      "relative w-full aspect-[16/9] cursor-pointer group transition-all duration-300",
      "hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2",
      "bg-card border border-border/50 rounded-xl overflow-hidden shadow-lg hover:shadow-xl",
      isHovered ? "z-20 border-cyan-500/50" : "z-0"
    );
  };

  if (!videoSrc) {
    return (
      <div className="h-full flex items-center justify-center p-8">
        <div className="text-center max-w-md">
          <div className="relative mb-6">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-cyan-500/5 flex items-center justify-center mx-auto border border-cyan-500/20 shadow-lg">
              <Film className="w-10 h-10 text-cyan-400" />
            </div>
            <div className="absolute -top-1 -right-1 w-6 h-6 bg-cyan-500/20 rounded-full animate-pulse"></div>
          </div>
          <h3 className="text-xl font-semibold mb-2 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            Import a YouTube Video
          </h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Upload or import a video to generate AI-powered short clips with professional editing
          </p>
        </div>
      </div>
    );
  }

  if (isGenerating) {
    return (
      <div className="w-full h-full flex items-center justify-center p-8">
        <div className="text-center max-w-md">
          <div className="relative mb-6">
            <Loader2 className="w-12 h-12 text-cyan-400 animate-spin mx-auto" />
            <div className="absolute inset-0 rounded-full border-2 border-cyan-500/20 animate-pulse"></div>
          </div>
          <h3 className="font-semibold text-lg mb-2">Generating AI Shorts</h3>
          <p className="text-sm text-muted-foreground mb-4">Analyzing video content and creating highlights...</p>
          <div className="w-full bg-secondary/50 rounded-full h-2 overflow-hidden">
            <div className="h-full bg-gradient-to-r from-cyan-500 to-cyan-400 rounded-full animate-pulse"></div>
          </div>
        </div>
      </div>
    );
  }

  if (shorts.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center p-8">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center mx-auto mb-4 border border-border">
            <Scissors className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="font-semibold mb-2">No Shorts Generated Yet</h3>
          <p className="text-sm text-muted-foreground">Click "Generate Shorts" to create AI-powered clips from your video</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-gradient-to-b from-background to-secondary/20">
      {/* Header Bar */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border/50 bg-card/30 backdrop-blur-sm">
        {/* Left: Title with icon and count */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-cyan-500/15 to-cyan-500/5 border border-cyan-500/20 shadow-lg">
              <Sparkles className="w-5 h-5 text-cyan-400" />
            </div>
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-cyan-500 rounded-full animate-pulse"></div>
          </div>
          <div>
            <h3 className="font-semibold text-lg text-foreground">AI Generated Shorts</h3>
            <p className="text-xs text-muted-foreground flex items-center gap-2">
              <span>{shorts.length} clips ready</span>
              <span className="w-1 h-1 bg-muted-foreground/40 rounded-full"></span>
              <span className="text-cyan-400">4 per row</span>
            </p>
          </div>
        </div>

        {/* Right: Action Buttons */}
        <div className="flex items-center gap-3">
          <Button 
            variant="destructive" 
            size="sm" 
            onClick={handleDeleteAll}
            className="gap-2 bg-red-500/90 hover:bg-red-600 border-red-500/30"
            disabled={shorts.length === 0}
          >
            <Trash2 className="w-4 h-4" /> 
            Delete All
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onRegenerateShorts} 
            className="gap-2 hover:bg-cyan-500/10 hover:border-cyan-500/30 hover:text-cyan-400 transition-all duration-200"
            disabled={isGenerating}
          >
            <RefreshCw className={cn("w-4 h-4", isGenerating && "animate-spin")} /> 
            Regenerate
          </Button>
        </div>
      </div>

      {/* Grid Container */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden p-6">
        <div className={getGridClasses()}>
          {shorts.map((short, index) => {
            const hasError = videoErrors.has(short.id);
            const isLoading = videoLoading.has(short.id);
            const isHovered = hoveredIndex === index;

            return (
              <div
                key={short.id}
                className={getClipClasses(index)}
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
                onClick={() => onSelectShort(short)}
                onKeyDown={(e) => handleKeyDown(e, short)}
                tabIndex={0}
                role="button"
                aria-label={`Play clip ${index + 1}: ${short.title}`}
              >
                {/* Video Element with 16:9 aspect ratio */}
                <div className="relative w-full h-full bg-black rounded-xl overflow-hidden">
                  {/* Loading State */}
                  {isLoading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-20">
                      <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
                    </div>
                  )}

                  {/* Error State */}
                  {hasError && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm z-20">
                      <AlertCircle className="w-8 h-8 text-red-400 mb-2" />
                      <span className="text-xs text-white/80 text-center px-2">
                        Failed to load
                      </span>
                    </div>
                  )}

                  {/* Video */}
                  {short.path && !hasError && (
                    <video
                      ref={(el) => (videoRefs.current[short.id] = el)}
                      src={short.path}
                      className="w-full h-full object-cover transition-all duration-300"
                      muted
                      preload="metadata"
                      onError={() => handleVideoError(short.id)}
                      onLoadStart={() => handleVideoStartLoad(short.id)}
                      onCanPlay={() => handleVideoLoad(short.id)}
                      aria-label={`Video preview for ${short.title}`}
                    />
                  )}
                  
                  {/* Hover Overlay with Play Button */}
                  <div className={cn(
                    "absolute inset-0 bg-black/40 transition-all duration-300",
                    isHovered ? "opacity-100" : "opacity-0"
                  )}>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border-2 border-white/30 group-hover:scale-110 transition-transform">
                        <Play className="w-8 h-8 text-white fill-white ml-1" />
                      </div>
                    </div>
                  </div>

                  {/* Top-Left: Clip Number */}
                  <div className="absolute top-3 left-3 w-8 h-8 rounded-full bg-black/80 backdrop-blur-md flex items-center justify-center text-sm font-bold text-white border border-white/20 z-10">
                    {index + 1}
                  </div>

                  {/* Top-Right: AI Score (Cyan/Teal badge) */}
                  <div className="absolute top-3 right-3 px-3 py-1.5 rounded-full bg-cyan-500 text-white text-sm font-bold shadow-lg border border-cyan-400/20 z-10">
                    {short.score}%
                  </div>

                  {/* Bottom-Left: Duration */}
                  <div className="absolute bottom-3 left-3 px-3 py-1.5 rounded-lg bg-black/80 backdrop-blur-md text-sm font-medium text-white border border-white/10 flex items-center gap-2 z-10">
                    <Clock className="w-4 h-4" />
                    {formatDuration(short.duration)}
                  </div>

                  {/* Bottom-Right: Delete Button (only on hover) */}
                  {onDeleteShort && (
                    <div className={cn(
                      "absolute bottom-3 right-3 transition-all duration-200 z-10",
                      isHovered ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
                    )}>
                      <Button
                        variant="destructive"
                        size="icon"
                        className="h-8 w-8 rounded-full shadow-lg bg-red-500/90 hover:bg-red-600 border border-white/20 backdrop-blur-sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteShort(short.id);
                        }}
                        title="Delete Clip"
                        aria-label={`Delete clip ${index + 1}`}
                      >
                        <Trash2 className="w-4 h-4 text-white" />
                      </Button>
                    </div>
                  )}

                  {/* Title Overlay on Hover */}
                  {isHovered && (
                    <div className="absolute bottom-12 left-3 right-3 bg-black/80 backdrop-blur-md rounded-lg p-2 z-10">
                      <h4 className="font-semibold text-sm text-white line-clamp-2 leading-tight">{short.title}</h4>
                      <div className="flex items-center gap-2 mt-1 text-xs text-white/70">
                        <span>{short.tags.slice(0, 2).join(', ')}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}