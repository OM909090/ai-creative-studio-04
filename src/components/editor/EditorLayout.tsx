import { useState, useCallback } from 'react';
import { useImageEditor } from '@/hooks/useImageEditor';
import { Toolbar } from './Toolbar';
import { AdjustmentPanel } from './AdjustmentPanel';
import { FilterPanel } from './FilterPanel';
import { Canvas } from './Canvas';
import { AIAssistant } from './AIAssistant';
import { ChatMessage, ImageAdjustments } from '@/types/editor';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sliders, Wand2, PanelRightOpen, PanelRightClose } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export function EditorLayout() {
  const editor = useImageEditor();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isAILoading, setIsAILoading] = useState(false);
  const [isAIPanelOpen, setIsAIPanelOpen] = useState(true);

  const handleExport = async () => {
    const dataUrl = await editor.exportImage();
    if (dataUrl) {
      const link = document.createElement('a');
      link.download = 'edited-image.png';
      link.href = dataUrl;
      link.click();
      toast.success('Image exported successfully!');
    }
  };

  const parseAICommand = useCallback((text: string): Partial<ImageAdjustments> | null => {
    const lower = text.toLowerCase();
    const adjustments: Partial<ImageAdjustments> = {};

    // Parse percentage values
    const percentMatch = lower.match(/(\d+)\s*%/);
    const value = percentMatch ? parseInt(percentMatch[1]) : 20;

    if (lower.includes('bright')) {
      adjustments.brightness = lower.includes('decrease') || lower.includes('reduce') ? -value : value;
    }
    if (lower.includes('contrast')) {
      adjustments.contrast = lower.includes('decrease') || lower.includes('reduce') ? -value : value;
    }
    if (lower.includes('saturate') || lower.includes('saturation') || lower.includes('vibrant')) {
      adjustments.saturation = lower.includes('decrease') || lower.includes('reduce') || lower.includes('desaturate') ? -value : value;
    }
    if (lower.includes('warm')) {
      adjustments.temperature = value;
      adjustments.saturation = Math.round(value / 2);
    }
    if (lower.includes('cool')) {
      adjustments.temperature = -value;
    }
    if (lower.includes('vintage')) {
      adjustments.saturation = -20;
      adjustments.temperature = 15;
      adjustments.contrast = -10;
    }
    if (lower.includes('dramatic') || lower.includes('cinematic')) {
      adjustments.contrast = 40;
      adjustments.saturation = -10;
    }
    if (lower.includes('noir') || lower.includes('black and white')) {
      adjustments.saturation = -100;
      adjustments.contrast = 30;
    }

    return Object.keys(adjustments).length > 0 ? adjustments : null;
  }, []);

  const handleAIMessage = useCallback(async (userMessage: string) => {
    if (!editor.state.image) {
      toast.error('Please upload an image first');
      return;
    }

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: userMessage,
      timestamp: new Date(),
    };
    
    setMessages((prev) => [...prev, userMsg]);
    setIsAILoading(true);

    // Simulate AI processing
    const loadingMsg: ChatMessage = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      isLoading: true,
    };
    setMessages((prev) => [...prev, loadingMsg]);

    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Parse and apply the command
    const adjustments = parseAICommand(userMessage);
    
    let responseText: string;
    
    if (adjustments) {
      // Apply the adjustments
      Object.entries(adjustments).forEach(([key, value]) => {
        editor.updateAdjustment(key as keyof ImageAdjustments, value as number);
      });

      const adjustmentList = Object.entries(adjustments)
        .map(([key, value]) => `${key}: ${value > 0 ? '+' : ''}${value}`)
        .join(', ');
      
      responseText = `Done! I've applied the following adjustments: ${adjustmentList}. Let me know if you'd like to refine the look further.`;
    } else {
      responseText = `I understand you want to "${userMessage}". Try being more specific like "increase brightness by 30%" or "add a warm vintage look". I can adjust brightness, contrast, saturation, temperature, and more!`;
    }

    setMessages((prev) => 
      prev.map((msg) =>
        msg.id === loadingMsg.id
          ? { ...msg, content: responseText, isLoading: false }
          : msg
      )
    );
    setIsAILoading(false);
  }, [editor, parseAICommand]);

  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="absolute inset-0 bg-primary/30 rounded-lg blur-lg" />
            <div className="relative w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Wand2 className="w-5 h-5 text-primary-foreground" />
            </div>
          </div>
          <div>
            <h1 className="text-xl font-bold gradient-text">PixelForge AI</h1>
            <p className="text-xs text-muted-foreground">Intelligent Media Editor</p>
          </div>
        </div>
        
        <Toolbar
          canUndo={editor.canUndo}
          canRedo={editor.canRedo}
          zoom={editor.state.zoom}
          onUndo={editor.undo}
          onRedo={editor.redo}
          onReset={editor.reset}
          onExport={handleExport}
          onZoomIn={() => editor.setZoom(editor.state.zoom + 0.1)}
          onZoomOut={() => editor.setZoom(editor.state.zoom - 0.1)}
          onRotate={() => editor.setRotation(editor.state.rotation + 90)}
          onFitToScreen={() => editor.setZoom(1)}
        />

        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsAIPanelOpen(!isAIPanelOpen)}
          className="lg:hidden"
        >
          {isAIPanelOpen ? <PanelRightClose /> : <PanelRightOpen />}
        </Button>
      </header>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar - Tools */}
        <aside className="w-72 border-r border-border bg-card/30 backdrop-blur-sm overflow-y-auto scrollbar-thin hidden md:block">
          <Tabs defaultValue="adjustments" className="p-4">
            <TabsList className="w-full grid grid-cols-2 mb-4">
              <TabsTrigger value="adjustments" className="gap-2">
                <Sliders className="w-4 h-4" />
                Adjust
              </TabsTrigger>
              <TabsTrigger value="filters" className="gap-2">
                <Wand2 className="w-4 h-4" />
                Filters
              </TabsTrigger>
            </TabsList>
            <TabsContent value="adjustments" className="mt-0">
              <AdjustmentPanel
                adjustments={editor.state.adjustments}
                onAdjustmentChange={editor.updateAdjustment}
              />
            </TabsContent>
            <TabsContent value="filters" className="mt-0">
              <FilterPanel
                activeFilter={editor.state.activeFilter}
                onFilterSelect={editor.applyFilter}
                imageUrl={editor.state.image}
              />
            </TabsContent>
          </Tabs>
        </aside>

        {/* Canvas Area */}
        <main className="flex-1 p-6 overflow-hidden">
          <Canvas
            image={editor.state.image}
            cssFilters={editor.getCSSFilters()}
            zoom={editor.state.zoom}
            rotation={editor.state.rotation}
            onImageUpload={editor.loadImage}
          />
        </main>

        {/* Right Sidebar - AI Assistant */}
        <aside
          className={cn(
            'w-80 border-l border-border bg-card/30 backdrop-blur-sm transition-all duration-300',
            isAIPanelOpen ? 'translate-x-0' : 'translate-x-full absolute right-0 top-0 bottom-0 lg:relative lg:translate-x-0',
            'hidden lg:flex flex-col'
          )}
        >
          <AIAssistant
            messages={messages}
            isLoading={isAILoading}
            onSendMessage={handleAIMessage}
          />
        </aside>
      </div>
    </div>
  );
}
