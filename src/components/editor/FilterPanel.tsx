import { filterPresets } from '@/types/editor';
import { cn } from '@/lib/utils';

interface FilterPanelProps {
  activeFilter: string | null;
  onFilterSelect: (filterId: string) => void;
  imageUrl: string | null;
}

export function FilterPanel({ activeFilter, onFilterSelect, imageUrl }: FilterPanelProps) {
  const getFilterStyle = (filterId: string) => {
    const preset = filterPresets.find((f) => f.id === filterId);
    if (!preset || !preset.adjustments) return {};
    
    const { brightness = 0, contrast = 0, saturation = 0 } = preset.adjustments;
    return {
      filter: `brightness(${1 + brightness / 100}) contrast(${1 + contrast / 100}) saturate(${1 + saturation / 100})`,
    };
  };

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-foreground/80 uppercase tracking-wider">
        Filters
      </h3>
      <div className="grid grid-cols-2 gap-2">
        {filterPresets.map((filter) => (
          <button
            key={filter.id}
            onClick={() => onFilterSelect(filter.id)}
            className={cn(
              'relative group rounded-lg overflow-hidden transition-all duration-200',
              'border-2 hover:border-primary/50',
              activeFilter === filter.id
                ? 'border-primary ring-2 ring-primary/30'
                : 'border-border/50'
            )}
          >
            <div
              className="aspect-square bg-gradient-to-br from-secondary to-muted flex items-center justify-center"
              style={imageUrl ? {
                backgroundImage: `url(${imageUrl})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                ...getFilterStyle(filter.id),
              } : {}}
            >
              {!imageUrl && (
                <div
                  className="w-full h-full bg-gradient-to-br from-primary/20 to-accent/20"
                  style={getFilterStyle(filter.id)}
                />
              )}
            </div>
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-background/90 to-transparent p-2">
              <span className="text-xs font-medium">{filter.name}</span>
            </div>
            {activeFilter === filter.id && (
              <div className="absolute inset-0 bg-primary/10 flex items-center justify-center">
                <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                  <svg className="w-4 h-4 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
