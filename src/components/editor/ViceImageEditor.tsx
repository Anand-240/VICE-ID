import { forwardRef, lazy, Suspense, useEffect, useImperativeHandle, useRef, useState } from 'react';
import type { ImageEditorRef } from '@unlayer/react-image-editor';

const ImageEditor = lazy(() => import('@unlayer/react-image-editor'));

export interface ViceEditorHandle { exportImage: () => string | null; hasChanges: () => boolean; resetImage: () => Promise<boolean>; }
interface Props { image: string; onSave: (dataUrl: string) => void; onReadyChange?: (ready: boolean) => void; onCancel: () => void; minHeight?: number; }

export const ViceImageEditor = forwardRef<ViceEditorHandle, Props>(function ViceImageEditor({ image, onSave, onCancel, onReadyChange, minHeight = 590 }, ref) {
  const editorRef = useRef<ImageEditorRef>(null); const [error, setError] = useState(''); const [retryKey, setRetryKey] = useState(0);
  // Freeze this editing session's source: saving must not reload the canvas
  // and erase editable layers or its undo history.
  const source = useRef(image).current;
  const [ready, setReady] = useState(false);
  useEffect(() => { onReadyChange?.(ready && !error); }, [ready, error, onReadyChange]);
  useEffect(() => {
    if (ready || error) return;
    const timer = window.setTimeout(() => setError('The image editor could not connect. Check your connection and retry.'), 45000);
    return () => clearTimeout(timer);
  }, [ready, error, retryKey]);
  useImperativeHandle(ref, () => ({
    hasChanges: () => { try { return editorRef.current?.editor?.hasChanges() ?? false; } catch { return false; } },
    exportImage: () => { try { return editorRef.current?.editor?.getImage() ?? null; } catch { setError('Could not export this canvas. Please retry.'); return null; } },
    resetImage: async () => {
      const instance = editorRef.current?.editor;
      if (!instance) return false;
      try { await instance.reset(source); onSave(source); return true; }
      catch (cause) { setError(cause instanceof Error ? cause.message : 'The editor could not reset the image.'); return false; }
    },
  }), [source, onSave]);
  if (error) return <div className="editor-error" role="alert"><b>VISUAL STUDIO FAILED TO LOAD</b><span>{error}</span><button type="button" className="secondary" onClick={() => { setError(''); setReady(false); setRetryKey((value) => value + 1); }}>RETRY STUDIO</button></div>;
  return <><p className="editor-scroll-hint">Swipe horizontally inside the editor to reach the canvas and all tools.</p><div className="editor-scroll" role="region" aria-label="Image editing workspace" tabIndex={0}><Suspense fallback={<div className="editor-loading"><span>ACCESSING VISUAL SYSTEM</span><i /></div>}><div className="official-editor-surface"><ImageEditor key={retryKey} ref={editorRef} image={source} minHeight={minHeight} style={{ borderRadius: 8, overflow: 'hidden' }} options={{ theme: 'dark', aiAssistantOpenState: 'closed', features: { imageEditor: { tools: { crop: true, resize: true, filter: true, draw: true, text: true, shapes: true, stickers: true, frame: true } } } }} onCancel={onCancel} onLoad={() => setReady(true)} onSave={({ dataUrl }: { dataUrl: string }) => onSave(dataUrl)} onLoadError={() => setError('The subject file could not be decoded. Try JPG, PNG, or WebP.')} onError={(e: Error) => setError(e.message)} /></div></Suspense></div></>;
});
