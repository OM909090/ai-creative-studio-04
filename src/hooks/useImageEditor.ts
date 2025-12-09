import { useState, useCallback, useRef } from 'react';
import { EditorState, ImageAdjustments, defaultAdjustments, filterPresets } from '@/types/editor';

export function useImageEditor() {
  const [state, setState] = useState<EditorState>({
    image: null,
    originalImage: null,
    adjustments: { ...defaultAdjustments },
    activeFilter: null,
    history: [{ ...defaultAdjustments }],
    historyIndex: 0,
    zoom: 1,
    rotation: 0,
  });

  const canvasRef = useRef<HTMLCanvasElement>(null);

  const loadImage = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      setState((prev) => ({
        ...prev,
        image: dataUrl,
        originalImage: dataUrl,
        adjustments: { ...defaultAdjustments },
        activeFilter: null,
        history: [{ ...defaultAdjustments }],
        historyIndex: 0,
        zoom: 1,
        rotation: 0,
      }));
    };
    reader.readAsDataURL(file);
  }, []);

  const updateAdjustment = useCallback((key: keyof ImageAdjustments, value: number) => {
    setState((prev) => {
      const newAdjustments = { ...prev.adjustments, [key]: value };
      const newHistory = [...prev.history.slice(0, prev.historyIndex + 1), newAdjustments];
      return {
        ...prev,
        adjustments: newAdjustments,
        activeFilter: null,
        history: newHistory,
        historyIndex: newHistory.length - 1,
      };
    });
  }, []);

  const applyFilter = useCallback((filterId: string) => {
    const preset = filterPresets.find((f) => f.id === filterId);
    if (!preset) return;

    setState((prev) => {
      const newAdjustments = { ...defaultAdjustments, ...preset.adjustments };
      const newHistory = [...prev.history.slice(0, prev.historyIndex + 1), newAdjustments];
      return {
        ...prev,
        adjustments: newAdjustments,
        activeFilter: filterId,
        history: newHistory,
        historyIndex: newHistory.length - 1,
      };
    });
  }, []);

  const undo = useCallback(() => {
    setState((prev) => {
      if (prev.historyIndex <= 0) return prev;
      const newIndex = prev.historyIndex - 1;
      return {
        ...prev,
        adjustments: { ...prev.history[newIndex] },
        historyIndex: newIndex,
      };
    });
  }, []);

  const redo = useCallback(() => {
    setState((prev) => {
      if (prev.historyIndex >= prev.history.length - 1) return prev;
      const newIndex = prev.historyIndex + 1;
      return {
        ...prev,
        adjustments: { ...prev.history[newIndex] },
        historyIndex: newIndex,
      };
    });
  }, []);

  const reset = useCallback(() => {
    setState((prev) => ({
      ...prev,
      adjustments: { ...defaultAdjustments },
      activeFilter: null,
      history: [...prev.history, { ...defaultAdjustments }],
      historyIndex: prev.history.length,
      zoom: 1,
      rotation: 0,
    }));
  }, []);

  const setZoom = useCallback((zoom: number) => {
    setState((prev) => ({ ...prev, zoom: Math.max(0.1, Math.min(3, zoom)) }));
  }, []);

  const setRotation = useCallback((rotation: number) => {
    setState((prev) => ({ ...prev, rotation: rotation % 360 }));
  }, []);

  const exportImage = useCallback(async () => {
    if (!canvasRef.current || !state.image) return null;
    return canvasRef.current.toDataURL('image/png');
  }, [state.image]);

  const getCSSFilters = useCallback(() => {
    const { brightness, contrast, saturation, blur, hue } = state.adjustments;
    return `
      brightness(${1 + brightness / 100})
      contrast(${1 + contrast / 100})
      saturate(${1 + saturation / 100})
      blur(${blur}px)
      hue-rotate(${hue}deg)
    `.trim();
  }, [state.adjustments]);

  return {
    state,
    canvasRef,
    loadImage,
    updateAdjustment,
    applyFilter,
    undo,
    redo,
    reset,
    setZoom,
    setRotation,
    exportImage,
    getCSSFilters,
    canUndo: state.historyIndex > 0,
    canRedo: state.historyIndex < state.history.length - 1,
  };
}
