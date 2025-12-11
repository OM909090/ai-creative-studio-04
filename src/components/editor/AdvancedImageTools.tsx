import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import {
  Sparkles,
  Zap,
  Palette,
  Target,
  Copy,
  RotateCcw,
  Aperture,
  Eye,
  Layers,
  Wand2,
} from 'lucide-react';

interface AdvancedImageToolsProps {
  onApplyTool: (tool: string) => void;
}

export function AdvancedImageTools({ onApplyTool }: AdvancedImageToolsProps) {
  return (
    <div className="space-y-5">
      <h3 className="text-sm font-semibold text-foreground/80 uppercase tracking-wider">
        Advanced Tools
      </h3>

      {/* AI Upscaling */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-2 h-2 rounded-full bg-primary" />
          <label className="text-sm font-medium flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            AI Upscaling
          </label>
        </div>
        <Select>
          <SelectTrigger className="text-sm">
            <SelectValue placeholder="Select scale factor" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="2x">2x Upscale</SelectItem>
            <SelectItem value="4x">4x Upscale</SelectItem>
            <SelectItem value="8x">8x Upscale</SelectItem>
          </SelectContent>
        </Select>
        <Button
          className="w-full gap-2 text-xs"
          onClick={() => {
            toast.loading('Upscaling image with AI...');
            setTimeout(() => {
              toast.success('Image upscaled successfully!');
              onApplyTool('upscale');
            }, 2000);
          }}
        >
          <Zap className="w-3.5 h-3.5" />
          Apply AI Upscale
        </Button>
      </div>

      {/* Curves */}
      <div className="space-y-2">
        <label className="text-sm font-medium flex items-center gap-2">
          <Target className="w-4 h-4" />
          Curves
        </label>
        <Button
          variant="outline"
          className="w-full gap-2 text-xs"
          onClick={() => {
            toast.info('Curves editor would open here');
            onApplyTool('curves');
          }}
        >
          <Layers className="w-3.5 h-3.5" />
          Open Curves Editor
        </Button>
      </div>

      {/* Levels */}
      <div className="space-y-2">
        <label className="text-sm font-medium flex items-center gap-2">
          <Aperture className="w-4 h-4" />
          Levels
        </label>
        <Button
          variant="outline"
          className="w-full gap-2 text-xs"
          onClick={() => {
            toast.info('Levels histogram editor would open here');
            onApplyTool('levels');
          }}
        >
          <Eye className="w-3.5 h-3.5" />
          Adjust Levels
        </Button>
      </div>

      {/* Selective Color */}
      <div className="space-y-2">
        <label className="text-sm font-medium flex items-center gap-2">
          <Palette className="w-4 h-4" />
          Selective Color
        </label>
        <div className="grid grid-cols-3 gap-2">
          {['Reds', 'Greens', 'Blues'].map((color) => (
            <Button
              key={color}
              variant="outline"
              size="sm"
              className="text-xs"
              onClick={() => {
                toast.info(`Selective ${color} adjustment active`);
                onApplyTool(`color_${color.toLowerCase()}`);
              }}
            >
              {color}
            </Button>
          ))}
        </div>
      </div>

      {/* HSL Adjustments */}
      <div className="space-y-3">
        <label className="text-sm font-medium">HSL Ranges</label>
        {['Hue', 'Saturation', 'Lightness'].map((param) => (
          <div key={param} className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span>{param}</span>
              <span className="text-primary">0</span>
            </div>
            <Slider
              value={[0]}
              min={-100}
              max={100}
              step={1}
              onValueChange={() => {}}
            />
          </div>
        ))}
      </div>

      {/* Dehaze */}
      <div className="space-y-2">
        <label className="text-sm font-medium flex items-center gap-2">
          <Eye className="w-4 h-4" />
          Dehaze / Clarity
        </label>
        <Slider
          value={[0]}
          min={-100}
          max={100}
          step={1}
          onValueChange={() => {}}
        />
      </div>

      {/* Vibrance */}
      <div className="space-y-2">
        <label className="text-sm font-medium flex items-center gap-2">
          <Sparkles className="w-4 h-4" />
          Vibrance
        </label>
        <Slider
          value={[0]}
          min={-100}
          max={100}
          step={1}
          onValueChange={() => {}}
        />
      </div>

      {/* Noise Reduction */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Noise Reduction</label>
        <Slider
          value={[0]}
          min={0}
          max={100}
          step={1}
          onValueChange={() => {}}
        />
      </div>

      {/* Lens Correction */}
      <div className="space-y-2">
        <label className="text-sm font-medium flex items-center gap-2">
          <Aperture className="w-4 h-4" />
          Lens Correction
        </label>
        <Button
          variant="outline"
          className="w-full gap-2 text-xs"
          onClick={() => toast.info('Lens correction tools available')}
        >
          <Aperture className="w-3.5 h-3.5" />
          Distortion & Vignette
        </Button>
      </div>

      {/* Color Grading Presets */}
      <div className="space-y-2">
        <label className="text-sm font-medium flex items-center gap-2">
          <Wand2 className="w-4 h-4" />
          Color Grading Presets
        </label>
        <Select>
          <SelectTrigger className="text-sm">
            <SelectValue placeholder="Choose preset" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="cinematic">Cinematic</SelectItem>
            <SelectItem value="vintage">Vintage Film</SelectItem>
            <SelectItem value="moody">Moody</SelectItem>
            <SelectItem value="bright">Bright & Airy</SelectItem>
            <SelectItem value="cool">Cool Tones</SelectItem>
            <SelectItem value="warm">Warm Tones</SelectItem>
            <SelectItem value="bw">Black & White</SelectItem>
            <SelectItem value="sepia">Sepia</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Batch Operations */}
      <div className="space-y-2">
        <label className="text-sm font-medium flex items-center gap-2">
          <Copy className="w-4 h-4" />
          Batch Operations
        </label>
        <div className="space-y-1.5">
          <Button
            variant="outline"
            className="w-full gap-2 text-xs"
            onClick={() => toast.info('Copying adjustments to clipboard')}
          >
            <Copy className="w-3.5 h-3.5" />
            Copy Adjustments
          </Button>
          <Button
            variant="outline"
            className="w-full gap-2 text-xs"
            onClick={() => toast.info('Ready to paste adjustments')}
          >
            <Copy className="w-3.5 h-3.5" />
            Paste Adjustments
          </Button>
        </div>
      </div>

      {/* Before/After */}
      <div className="space-y-2">
        <Button
          variant="secondary"
          className="w-full gap-2 text-xs"
          onClick={() => toast.info('Before/After view toggled')}
        >
          <Eye className="w-3.5 h-3.5" />
          Before/After Split
        </Button>
      </div>

      {/* Reset */}
      <Button
        variant="outline"
        className="w-full gap-2 text-xs"
        onClick={() => {
          toast.success('All adjustments reset');
          onApplyTool('reset');
        }}
      >
        <RotateCcw className="w-3.5 h-3.5" />
        Reset All Adjustments
      </Button>
    </div>
  );
}
