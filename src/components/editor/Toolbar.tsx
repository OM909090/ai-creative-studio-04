import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Undo2,
  Redo2,
  RotateCcw,
  Download,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Maximize2,
} from 'lucide-react';

interface ToolbarProps {
  canUndo: boolean;
  canRedo: boolean;
  zoom: number;
  onUndo: () => void;
  onRedo: () => void;
  onReset: () => void;
  onExport: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onRotate: () => void;
  onFitToScreen: () => void;
}

export function Toolbar({
  canUndo,
  canRedo,
  zoom,
  onUndo,
  onRedo,
  onReset,
  onExport,
  onZoomIn,
  onZoomOut,
  onRotate,
  onFitToScreen,
}: ToolbarProps) {
  const tools = [
    { icon: Undo2, label: 'Undo', onClick: onUndo, disabled: !canUndo },
    { icon: Redo2, label: 'Redo', onClick: onRedo, disabled: !canRedo },
    { icon: RotateCcw, label: 'Reset', onClick: onReset },
    { type: 'divider' },
    { icon: ZoomOut, label: 'Zoom Out', onClick: onZoomOut },
    { icon: ZoomIn, label: 'Zoom In', onClick: onZoomIn },
    { icon: Maximize2, label: 'Fit to Screen', onClick: onFitToScreen },
    { type: 'divider' },
    { icon: RotateCw, label: 'Rotate', onClick: onRotate },
    { type: 'divider' },
    { icon: Download, label: 'Export', onClick: onExport, primary: true },
  ];

  return (
    <div className="glass-panel flex items-center gap-1 p-2 rounded-xl">
      {tools.map((tool, index) => {
        if (tool.type === 'divider') {
          return <div key={index} className="w-px h-6 bg-border mx-1" />;
        }

        const Icon = tool.icon!;

        return (
          <Tooltip key={tool.label}>
            <TooltipTrigger asChild>
              <Button
                variant={tool.primary ? 'default' : 'tool'}
                size="icon-sm"
                onClick={tool.onClick}
                disabled={tool.disabled}
                className={tool.primary ? 'glow-primary' : ''}
              >
                <Icon className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p>{tool.label}</p>
            </TooltipContent>
          </Tooltip>
        );
      })}
      <div className="ml-2 px-2 py-1 rounded-md bg-secondary text-xs font-mono text-muted-foreground">
        {Math.round(zoom * 100)}%
      </div>
    </div>
  );
}
