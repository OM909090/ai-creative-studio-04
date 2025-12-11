import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Sparkles, 
  Send, 
  Bot, 
  User, 
  Loader2, 
  Zap,
  Wand2,
  Scissors,
  Palette,
  Music,
  Subtitles,
  Layers,
  Film,
  Zap as ZapIcon
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isLoading?: boolean;
}

interface VideoAIAssistantProps {
  isProcessing: boolean;
  onAICommand: (prompt: string) => void;
  currentAdjustments?: Record<string, number>;
}

const videoSuggestions = [
  { icon: Scissors, text: 'Auto cut boring parts', category: 'trim' },
  { icon: Palette, text: 'Cinematic color grade', category: 'color' },
  { icon: Music, text: 'Add background music', category: 'audio' },
  { icon: Subtitles, text: 'Generate captions', category: 'subtitle' },
  { icon: Film, text: 'Apply VHS effect', category: 'effect' },
  { icon: Layers, text: 'Smooth transitions', category: 'transition' },
  { icon: ZapIcon, text: 'AI enhance quality', category: 'enhance' },
  { icon: Wand2, text: 'Auto stabilize video', category: 'stabilize' },
];

export function VideoAIAssistant({ 
  isProcessing, 
  onAICommand,
  currentAdjustments 
}: VideoAIAssistantProps) {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isProcessing) {
      const userMsg: Message = {
        id: Date.now().toString(),
        role: 'user',
        content: input.trim(),
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, userMsg]);
      onAICommand(input.trim());
      setInput('');

      // Simulate AI response
      setTimeout(() => {
        const assistantMsg: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: 'I\'ve analyzed your video. Applying AI enhancements now...',
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, assistantMsg]);
      }, 1500);
    }
  };

  const handleSuggestion = (suggestion: typeof videoSuggestions[0]) => {
    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: suggestion.text,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    onAICommand(suggestion.text);
    setSelectedCategory(suggestion.category);

    setTimeout(() => {
      const responses: Record<string, string> = {
        trim: 'Scanning video for content relevance and cutting out slow parts...',
        color: 'Applying cinematic color grading with contrast enhancement...',
        audio: 'Searching for royalty-free background music matching your content...',
        subtitle: 'Generating captions using AI speech recognition...',
        effect: 'Applying retro VHS effect with tape distortion...',
        transition: 'Adding smooth cross-dissolves between clips...',
        enhance: 'Upscaling video quality and sharpening details...',
        stabilize: 'Analyzing motion vectors for video stabilization...',
      };

      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: responses[suggestion.category] || 'Processing your request...',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMsg]);
    }, 1500);
  };

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-card/80 to-card/40">
      {/* Header */}
      <div className="p-4 border-b border-border/50 bg-gradient-to-r from-primary/10 via-accent/5 to-primary/5">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="absolute inset-0 bg-primary/30 rounded-full blur-md animate-pulse" />
            <div className="relative w-10 h-10 rounded-full bg-gradient-to-br from-primary via-accent to-primary flex items-center justify-center">
              <Film className="w-5 h-5 text-primary-foreground" />
            </div>
          </div>
          <div>
            <h3 className="font-bold text-sm flex items-center gap-2">
              Video AI Studio
              <span className="text-xs px-2 py-1 rounded-full bg-primary/20 text-primary font-medium">Pro</span>
            </h3>
            <p className="text-xs text-muted-foreground">Advanced video editing AI</p>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        {messages.length === 0 ? (
          <div className="space-y-4 h-full flex flex-col justify-between">
            {/* Welcome Message */}
            <div className="glass-panel rounded-xl p-4 space-y-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                <h4 className="font-semibold text-sm">Welcome to Video AI Studio</h4>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                I'm your advanced AI video editor. I can help you with cutting, effects, color grading, audio editing, auto-captions, and much more. Describe what you want to do or use the quick actions below.
              </p>
              <div className="pt-2 border-t border-border/30">
                <p className="text-xs text-muted-foreground/70 font-medium mb-3">💡 Try these actions:</p>
              </div>
            </div>

            {/* Suggestions Grid */}
            <div className="space-y-2">
              {videoSuggestions.map((suggestion) => {
                const Icon = suggestion.icon;
                return (
                  <button
                    key={suggestion.text}
                    onClick={() => handleSuggestion(suggestion)}
                    disabled={isProcessing}
                    className="w-full flex items-center gap-3 p-3 rounded-lg bg-secondary/30 hover:bg-secondary/60 border border-border/30 hover:border-primary/50 transition-all text-left group disabled:opacity-50"
                  >
                    <Icon className="w-4 h-4 text-primary group-hover:text-primary/80 flex-shrink-0" />
                    <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                      {suggestion.text}
                    </span>
                    <Zap className="w-3 h-3 text-muted-foreground/50 ml-auto group-hover:text-primary/50 flex-shrink-0" />
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  'flex gap-3 animate-fade-in',
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                )}
              >
                {message.role === 'assistant' && (
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Bot className="w-4 h-4 text-primary-foreground" />
                  </div>
                )}
                <div
                  className={cn(
                    'max-w-[75%] rounded-xl px-4 py-3 text-sm',
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground rounded-br-none'
                      : 'glass-panel rounded-bl-none border border-border/50'
                  )}
                >
                  {message.isLoading ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-primary" />
                      <span>Processing your request...</span>
                    </div>
                  ) : (
                    <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
                  )}
                </div>
                {message.role === 'user' && (
                  <div className="w-7 h-7 rounded-full bg-secondary flex items-center justify-center flex-shrink-0 mt-0.5">
                    <User className="w-4 h-4 text-secondary-foreground" />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </ScrollArea>

      {/* Input Area */}
      <form onSubmit={handleSubmit} className="p-4 border-t border-border/50 bg-card/50 space-y-3">
        {/* Quick Preset Buttons */}
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: 'Cinematic', prompt: 'Apply cinematic color grading and smooth transitions' },
            { label: 'Professional', prompt: 'Make this look professional with color correction' },
            { label: 'Social Media', prompt: 'Optimize for social media (fast cuts, trending effects)' },
            { label: 'Clean & Minimal', prompt: 'Simple, clean editing with minimal effects' },
          ].map((preset) => (
            <button
              key={preset.label}
              type="button"
              onClick={() => {
                setInput(preset.prompt);
                const event = new Event('submit', { bubbles: true }) as any;
                event.preventDefault = () => {};
                handleSubmit(event);
              }}
              disabled={isProcessing}
              className="text-xs px-3 py-2 rounded-lg bg-secondary/40 hover:bg-secondary/60 text-secondary-foreground border border-border/30 transition-all disabled:opacity-50 font-medium"
            >
              {preset.label}
            </button>
          ))}
        </div>

        {/* Input Field */}
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Describe your editing vision..."
            disabled={isProcessing}
            className="bg-secondary/50 border-border/50 focus:border-primary/50 text-sm"
          />
          <Button
            type="submit"
            size="icon"
            disabled={!input.trim() || isProcessing}
            className="flex-shrink-0"
          >
            {isProcessing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>

        {/* Status Info */}
        <div className="text-xs text-muted-foreground text-center">
          {isProcessing ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-2 h-2 bg-primary rounded-full animate-pulse" />
              AI is processing your video...
            </span>
          ) : (
            'Ready to edit'
          )}
        </div>
      </form>
    </div>
  );
}
