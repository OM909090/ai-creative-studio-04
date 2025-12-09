import { Slider } from '@/components/ui/slider';
import { ImageAdjustments } from '@/types/editor';
import {
  Sun,
  Contrast,
  Droplets,
  Aperture,
  Thermometer,
  Sparkles,
  Palette,
} from 'lucide-react';

interface AdjustmentPanelProps {
  adjustments: ImageAdjustments;
  onAdjustmentChange: (key: keyof ImageAdjustments, value: number) => void;
}

const adjustmentConfigs = [
  { key: 'brightness' as const, label: 'Brightness', icon: Sun, min: -100, max: 100 },
  { key: 'contrast' as const, label: 'Contrast', icon: Contrast, min: -100, max: 100 },
  { key: 'saturation' as const, label: 'Saturation', icon: Droplets, min: -100, max: 100 },
  { key: 'exposure' as const, label: 'Exposure', icon: Aperture, min: -100, max: 100 },
  { key: 'temperature' as const, label: 'Temperature', icon: Thermometer, min: -100, max: 100 },
  { key: 'hue' as const, label: 'Hue', icon: Palette, min: -180, max: 180 },
  { key: 'sharpen' as const, label: 'Sharpen', icon: Sparkles, min: 0, max: 100 },
];

export function AdjustmentPanel({ adjustments, onAdjustmentChange }: AdjustmentPanelProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-foreground/80 uppercase tracking-wider">
        Adjustments
      </h3>
      <div className="space-y-5">
        {adjustmentConfigs.map(({ key, label, icon: Icon, min, max }) => (
          <div key={key} className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Icon className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-foreground/90">{label}</span>
              </div>
              <span className="text-xs font-mono text-primary w-10 text-right">
                {adjustments[key] > 0 ? '+' : ''}{adjustments[key]}
              </span>
            </div>
            <Slider
              value={[adjustments[key]]}
              min={min}
              max={max}
              step={1}
              onValueChange={([value]) => onAdjustmentChange(key, value)}
              className="cursor-pointer"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
