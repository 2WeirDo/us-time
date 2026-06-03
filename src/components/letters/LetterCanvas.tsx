import { useRef, useEffect, useCallback, useState } from 'react';
import { Undo2, Eraser, Palette } from 'lucide-react';

interface LetterCanvasProps {
  onCanvasReady: (getDataUrl: () => string | null) => void;
}

interface Stroke {
  points: { x: number; y: number }[];
  color: string;
  width: number;
}

const COLORS = ['#FF69B4', '#FF1493', '#FFB6C1', '#FF0000', '#FF6347', '#FFA500', '#333333', '#000000'];
const BRUSH_SIZES = [2, 4, 6, 10];

export default function LetterCanvas({ onCanvasReady }: LetterCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState('#FF69B4');
  const [brushWidth, setBrushWidth] = useState(4);
  const [isEraser, setIsEraser] = useState(false);
  const strokesRef = useRef<Stroke[]>([]);
  const currentStrokeRef = useRef<Stroke | null>(null);

  // Initialize canvas size
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const resize = () => {
      const rect = container.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.scale(dpr, dpr);
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
      }
      // Redraw strokes after resize
      redrawAll();
    };

    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, []);

  const redrawAll = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;

    ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);

    for (const stroke of strokesRef.current) {
      if (stroke.points.length < 2) continue;
      ctx.beginPath();
      ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
      for (let i = 1; i < stroke.points.length; i++) {
        ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
      }
      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = stroke.width;
      ctx.stroke();
    }
  }, []);

  // Expose getDataUrl to parent
  useEffect(() => {
    onCanvasReady(() => {
      const canvas = canvasRef.current;
      if (!canvas) return null;
      return canvas.toDataURL('image/png');
    });
  }, [onCanvasReady]);

  const getPos = useCallback(
    (e: React.TouchEvent | React.MouseEvent): { x: number; y: number } => {
      const canvas = canvasRef.current;
      if (!canvas) return { x: 0, y: 0 };
      const rect = canvas.getBoundingClientRect();

      if ('touches' in e) {
        const touch = e.touches[0] || (e as React.TouchEvent).changedTouches[0];
        return { x: touch.clientX - rect.left, y: touch.clientY - rect.top };
      }
      return { x: (e as React.MouseEvent).clientX - rect.left, y: (e as React.MouseEvent).clientY - rect.top };
    },
    [],
  );

  const startDrawing = useCallback(
    (e: React.TouchEvent | React.MouseEvent) => {
      e.preventDefault();
      const pos = getPos(e);
      const strokeColor = isEraser ? '#FFFFFF' : color;
      const strokeWidth = isEraser ? brushWidth * 3 : brushWidth;

      currentStrokeRef.current = {
        points: [pos],
        color: strokeColor,
        width: strokeWidth,
      };
      setIsDrawing(true);
    },
    [color, brushWidth, isEraser, getPos],
  );

  const draw = useCallback(
    (e: React.TouchEvent | React.MouseEvent) => {
      e.preventDefault();
      if (!isDrawing || !currentStrokeRef.current) return;
      const pos = getPos(e);
      currentStrokeRef.current.points.push(pos);

      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const points = currentStrokeRef.current.points;
      if (points.length < 2) return;

      ctx.beginPath();
      ctx.moveTo(points[points.length - 2].x, points[points.length - 2].y);
      ctx.lineTo(points[points.length - 1].x, points[points.length - 1].y);
      ctx.strokeStyle = currentStrokeRef.current.color;
      ctx.lineWidth = currentStrokeRef.current.width;
      ctx.stroke();
    },
    [isDrawing, getPos],
  );

  const stopDrawing = useCallback(() => {
    if (currentStrokeRef.current && currentStrokeRef.current.points.length > 0) {
      strokesRef.current.push(currentStrokeRef.current);
    }
    currentStrokeRef.current = null;
    setIsDrawing(false);
  }, []);

  const handleUndo = useCallback(() => {
    strokesRef.current.pop();
    redrawAll();
  }, [redrawAll]);

  const handleClear = useCallback(() => {
    strokesRef.current = [];
    redrawAll();
  }, [redrawAll]);

  return (
    <div className="space-y-3">
      {/* Toolbar */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Colors */}
        <div className="flex items-center gap-1.5 bg-warm-cream rounded-full px-3 py-1.5">
          <Palette size={12} className="text-text-muted/40" />
          {COLORS.map((c) => (
            <button
              key={c}
              onClick={() => {
                setColor(c);
                setIsEraser(false);
              }}
              className={`w-5 h-5 rounded-full border-2 transition-all ${
                color === c && !isEraser
                  ? 'border-pink scale-125 ring-2 ring-pink/20'
                  : 'border-transparent'
              }`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>

        {/* Eraser */}
        <button
          onClick={() => setIsEraser(!isEraser)}
          className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
            isEraser ? 'bg-pink text-white' : 'bg-warm-cream text-text-muted'
          }`}
        >
          <Eraser size={14} />
        </button>

        {/* Undo */}
        <button
          onClick={handleUndo}
          className="w-8 h-8 rounded-full bg-warm-cream flex items-center justify-center text-text-muted hover:text-text-primary"
        >
          <Undo2 size={14} />
        </button>
      </div>

      {/* Brush sizes */}
      <div className="flex items-center gap-2">
        {BRUSH_SIZES.map((size) => (
          <button
            key={size}
            onClick={() => setBrushWidth(size)}
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
              brushWidth === size && !isEraser
                ? 'bg-pink/10 text-pink'
                : 'bg-warm-cream text-text-muted/50'
            }`}
          >
            <div
              className="rounded-full bg-current"
              style={{ width: size, height: size }}
            />
          </button>
        ))}
      </div>

      {/* Canvas */}
      <div
        ref={containerRef}
        className="relative w-full bg-white rounded-2xl border border-pink/10 overflow-hidden select-none"
        style={{ height: '280px', touchAction: 'none' }}
      >
        {/* Placeholder text */}
        {strokesRef.current.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-text-muted/20 text-sm">
            在这里写下你想说的话...
          </div>
        )}
        <canvas
          ref={canvasRef}
          className="absolute inset-0"
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
        />
      </div>

      {/* Clear */}
      {strokesRef.current.length > 0 && (
        <button
          onClick={handleClear}
          className="text-xs text-text-muted/40 hover:text-red-400 transition-colors"
        >
          清除画布
        </button>
      )}
    </div>
  );
}
