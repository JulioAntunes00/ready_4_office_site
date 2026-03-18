import { useState, useEffect, useRef } from 'react';
import { 
  DndContext, closestCenter, KeyboardSensor, PointerSensor, TouchSensor, MouseSensor, useSensor, useSensors, DragOverlay
} from '@dnd-kit/core';
import { 
  arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, rectSortingStrategy 
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { 
  Trash2, Type, Pencil, Download, Image as ImageIcon, FileText, Settings, Sparkles, 
  Wand2, Shield, Lock, Zap, ArrowRight, Layers, Layout, ChevronLeft, UploadCloud, 
  Save, Loader2, MousePointer2, Undo, ZoomIn, ZoomOut, Hand, AlertCircle, X, Plus, 
  FileEdit, Moon, Sun, Menu 
} from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { PDFDocument } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';

// SOLUÇÃO SÊNIOR: Importa o worker do próprio pacote instalado para o build do Vite
// Isso resolve 100% dos erros de "Failed to fetch" na Hostinger
import pdfWorker from 'pdfjs-dist/build/pdf.worker.mjs?url';
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

import './App.css';
import './index.css';

interface PDFFileItem {
  id: string;
  file: File;
  previewUrl?: string;
  isError?: boolean;
}

function FileCard({ fileItem, isDragging, onRemove, listeners, attributes, index }: any) {
  return (
    <div className={`file-item-card premium-preview-card ${isDragging ? 'is-dragging' : ''}`} {...listeners} {...attributes}>
      <div className="preview-frame">
        {fileItem.previewUrl ? (
          <img src={fileItem.previewUrl} alt="Preview" className="pdf-page-render" />
        ) : fileItem.isError ? (
          <div className="preview-loading-state" style={{ color: '#ef4444', flexDirection: 'column', padding: '10px' }}>
            <AlertCircle size={24} />
            <span style={{ fontSize: '0.6rem', marginTop: '4px' }}>Falha ao renderizar</span>
          </div>
        ) : (
          <div className="preview-loading-state">
            <Loader2 className="animate-spin" size={24} />
          </div>
        )}
        <div className="page-number-badge">{index + 1}</div>
        {onRemove && <button onClick={(e) => { e.stopPropagation(); onRemove(); }} className="delete-page-btn"><X size={14} /></button>}
      </div>
      <div className="card-footer-label"><span className="file-label-text">{fileItem.file.name}</span></div>
    </div>
  );
}

function SortableFileItem({ id, fileItem, onRemove, index }: any) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style: React.CSSProperties = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.3 : 1, touchAction: 'none' };
  return <div ref={setNodeRef} style={style}><FileCard fileItem={fileItem} onRemove={onRemove} listeners={listeners} attributes={attributes} index={index} /></div>;
}

function CombinarPDFPage({ onBack }: { onBack: () => void }) {
  const [files, setFiles] = useState<PDFFileItem[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isMerging, setIsMerging] = useState(false);
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const generatePreview = async (file: File): Promise<string> => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
      const pdf = await loadingTask.promise;
      const page = await pdf.getPage(1);
      const viewport = page.getViewport({ scale: 0.4 });
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      if (!context) return '';
      canvas.height = viewport.height;
      canvas.width = viewport.width;
      await page.render({ canvasContext: context, viewport: viewport, canvas: canvas as any }).promise;
      return canvas.toDataURL('image/png');
    } catch (e) {
      console.error('Erro de renderização:', e);
      return '';
    }
  };

  const onDrop = async (acceptedFiles: File[]) => {
    const newItems = acceptedFiles.map(file => ({ id: Math.random().toString(36).substr(2, 9), file }));
    setFiles(prev => [...prev, ...newItems]);
    for (const item of newItems) {
      const url = await generatePreview(item.file);
      setFiles(prev => prev.map(f => f.id === item.id ? { ...f, previewUrl: url, isError: !url } : f));
    }
  };

  const { getRootProps, getInputProps, open } = useDropzone({ onDrop, accept: { 'application/pdf': ['.pdf'] } });

  const handleMerge = async () => {
    setIsMerging(true);
    try {
      const mergedPdf = await PDFDocument.create();
      for (const item of files) {
        const arrayBuffer = await item.file.arrayBuffer();
        const pdf = await PDFDocument.load(arrayBuffer);
        const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
        copiedPages.forEach(p => mergedPdf.addPage(p));
      }
      const pdfBytes = await mergedPdf.save();
      const blob = new Blob([pdfBytes as any], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = `Ready4Office_combinado.pdf`; a.click();
    } catch (e) { alert('Erro ao combinar arquivos.'); }
    finally { setIsMerging(false); }
  };

  return (
    <div className="tool-container fade-in">
      <div className="container">
        <button onClick={onBack} className="back-pill-btn"><ChevronLeft size={18} /> Voltar</button>
        <div className="tool-intro"><h1>Combinar arquivos PDF</h1><p>Arraste para organizar seus documentos na ordem desejada.</p></div>
        {files.length > 0 && (
          <div className="editor-workspace top-focus">
            <div className="workspace-header"><div className="file-count-info"><span className="count-number">{files.length}</span> documentos</div><button onClick={() => setFiles([])} className="clear-all-btn"><Trash2 size={16} /> Limpar</button></div>
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={e => setActiveId(e.active.id as string)} onDragEnd={e => {
              const { active, over } = e;
              if (over && active.id !== over.id) { setFiles(items => { const oldIndex = items.findIndex(i => i.id === active.id); const newIndex = items.findIndex(i => i.id === over.id); return arrayMove(items, oldIndex, newIndex); }); }
              setActiveId(null);
            }}>
              <SortableContext items={files.map(f => f.id)} strategy={rectSortingStrategy}>
                <div className="premium-file-grid larger-grid">
                  {files.map((f, index) => (<SortableFileItem key={f.id} id={f.id} fileItem={f} index={index} onRemove={() => setFiles(prev => prev.filter(i => i.id !== f.id))} />))}
                  <div className="add-more-pill-card" onClick={open}><Plus size={32} /><span>Adicionar</span></div>
                </div>
              </SortableContext>
              <DragOverlay>{activeId && files.find(f => f.id === activeId) ? <FileCard fileItem={files.find(f => f.id === activeId)} isDragging index={files.findIndex(f => f.id === activeId)} /> : null}</DragOverlay>
            </DndContext>
          </div>
        )}
        <div {...getRootProps()} className={`premium-dropzone ${files.length > 0 ? 'compact' : ''}`}><input {...getInputProps()} /><div className="dropzone-content"><div className="upload-icon-circle"><UploadCloud size={32} /></div><h3>{files.length > 0 ? 'Adicionar mais' : 'Selecionar arquivos PDF'}</h3></div></div>
        {files.length > 0 && <div className="action-bar-floating"><button onClick={handleMerge} disabled={files.length < 2 || isMerging} className="primary-action-btn">{isMerging ? 'Processando...' : 'Combinar PDF'}</button></div>}
      </div>
    </div>
  );
}

function EditorPDFPage({ onBack }: { onBack: () => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [zoom, setZoom] = useState(window.innerWidth <= 768 ? 0.7 : 1);
  const [activeTool, setActiveTool] = useState<'hand' | 'cursor' | 'text' | 'pencil'>(window.innerWidth <= 768 ? 'hand' : 'cursor');
  const [activeColor, setActiveColor] = useState('#0f172a'); // Padrão agora é preto
  const [isExporting, setIsExporting] = useState(false);
  const [baseSize, setBaseSize] = useState({ width: 0, height: 0 });
  
  // Anotações e interação
  const [annotations, setAnnotations] = useState<any[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPath, setCurrentPath] = useState<{x: number, y: number}[]>([]);
  const [editingTextId, setEditingTextId] = useState<string | null>(null);
  const [draggingTextId, setDraggingTextId] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollWrapperRef = useRef<HTMLDivElement>(null);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0, scrollLeft: 0, scrollTop: 0 });

  const onDrop = async (acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) setFile(acceptedFiles[0]);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop, accept: { 'application/pdf': ['.pdf'] }, maxFiles: 1 
  });

  useEffect(() => {
    if (!file) return;
    const loadPdf = async () => {
      try {
        const arrayBuffer = await file.arrayBuffer();
        const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
        const pdf = await loadingTask.promise;
        setPdfDoc(pdf);
        setTotalPages(pdf.numPages);
        setCurrentPage(1);
      } catch (e) {
        console.error("Erro ao carregar PDF", e);
        alert("Erro ao carregar PDF.");
      }
    };
    loadPdf();
  }, [file]);

  useEffect(() => {
    if (!pdfDoc || !canvasRef.current) return;
    let renderTask: any = null;
    const renderPage = async () => {
      try {
        const page = await pdfDoc.getPage(currentPage);
        
        const dpr = window.devicePixelRatio || 1;
        const baseViewport = page.getViewport({ scale: 1 });
        setBaseSize({ width: baseViewport.width, height: baseViewport.height });
        
        // Render quality maxes at 3 to avoid mobile Safari crashes on memory limits
        const renderScale = Math.min(zoom * dpr, 3);
        const renderViewport = page.getViewport({ scale: renderScale });
        
        const canvas = canvasRef.current!;
        const context = canvas.getContext('2d');
        if (!context) return;
        
        canvas.width = renderViewport.width;
        canvas.height = renderViewport.height;
        canvas.style.width = `${baseViewport.width}px`;
        canvas.style.height = `${baseViewport.height}px`;

        renderTask = page.render({ canvasContext: context, viewport: renderViewport });
        await renderTask.promise;
      } catch (e: any) {
        if (e.name !== 'RenderingCancelledException') console.error("Erro renderização", e);
      }
    };
    renderPage();
    return () => { if (renderTask) renderTask.cancel(); };
  }, [pdfDoc, currentPage, zoom]);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const arrayBuffer = await file!.arrayBuffer();
      const pdf = await PDFDocument.load(arrayBuffer);
      
      // We embed a standard font for text
      const helveticaFont = await pdf.embedFont('Helvetica');
      const pages = pdf.getPages();

      // Get viewport of page 1 at scale 1 to find the base dimensions we used for storing coordinates
      // pdfjs-dist scale 1 usually matches pdf-lib's default point sizes.
      // But we need to handle y-axis inversion! `pdf-lib` (0,0) is bottom-left. `pdfjs` (0,0) is top-left.
      // Because we store annotations by page, we will iterate over pages.

      for (let i = 0; i < pages.length; i++) {
        const pageAnnotations = annotations.filter(a => a.page === i + 1);
        if (pageAnnotations.length === 0) continue;

        const pPage = pages[i];
        const { height } = pPage.getSize();

        // In pdfjs, if a page is rotated, scale: 1 might swap width/height.
        // For simplicity, we assume no rotation mismatch, or we rely on the height we have.
        // The Y coordinate from top-left (our x, y) needs to be inverted: new_y = height - y.
        // Wait, text is drawn from its baseline. SVG overlay `transform: translateY(-50%)` means our `y` is the vertical center of the text.
        // So `pdfLibY = height - y - (fontSize / 2)` approximately to match visual baseline.

        for (const ann of pageAnnotations) {
          if (ann.type === 'text') {
            const hexColor = ann.color.replace('#', '');
            const r = parseInt(hexColor.substr(0, 2), 16) / 255;
            const g = parseInt(hexColor.substr(2, 2), 16) / 255;
            const b = parseInt(hexColor.substr(4, 2), 16) / 255;

            // Simple baseline adjustment:
            const pdfY = height - ann.y - (ann.fontSize * 0.25);

            pPage.drawText(ann.content, {
              x: ann.x,
              y: pdfY,
              size: ann.fontSize,
              font: helveticaFont,
              color: { type: 'RGB', red: r, green: g, blue: b } as any, // fallback type
            });
          } else if (ann.type === 'draw') {
            const hexColor = ann.color.replace('#', '');
            const r = parseInt(hexColor.substr(0, 2), 16) / 255;
            const g = parseInt(hexColor.substr(2, 2), 16) / 255;
            const b = parseInt(hexColor.substr(4, 2), 16) / 255;

            // Draw lines between points
            for (let j = 0; j < ann.path.length - 1; j++) {
              const p1 = ann.path[j];
              const p2 = ann.path[j + 1];
              pPage.drawLine({
                start: { x: p1.x, y: height - p1.y },
                end: { x: p2.x, y: height - p2.y },
                thickness: ann.strokeWidth,
                color: { type: 'RGB', red: r, green: g, blue: b } as any,
              });
            }
          }
        }
      }

      const pdfBytes = await pdf.save();
      const blob = new Blob([pdfBytes as any], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); 
      a.href = url; 
      a.download = `Ready4Office_editado_${file!.name}`; 
      a.click();
    } catch (e) {
      console.error("Erro ao exportar", e);
      alert("Ocorreu um erro ao salvar o documento.");
    } finally {
      setIsExporting(false);
    }
  }

  // ==== INTERAÇÕES DO MOUSE / TOUCH ====
  const getCoordinates = (e: React.MouseEvent<HTMLDivElement> | React.PointerEvent<HTMLDivElement>) => {
    if (!containerRef.current) return { x: 0, y: 0 };
    const rect = containerRef.current.getBoundingClientRect();
    // containerRef is the canvas-frame (no CSS transform applied on it now).
    // Coordinates are relative to the canvas at native scale=1 (for pdf-lib accuracy).
    // The canvas is rendered at devicePixelRatio but canvas.style.width = viewport.width / dpr,
    // so the bounding rect already matches the pdf-lib point space at zoom=1.
    // When user changes zoom we apply it via CSS on the canvas-frame, so getBoundingClientRect
    // returns the zoomed rect. We must divide by zoom to get back to canvas-space coords.
    return {
      x: (e.clientX - rect.left) / zoom,
      y: (e.clientY - rect.top) / zoom
    };
  };

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    // If we're dragging, ignore
    if (draggingTextId) return;

    if (activeTool === 'hand') {
      if (e.pointerType === 'mouse') {
        const wrapper = scrollWrapperRef.current;
        if (wrapper) {
          setIsPanning(true);
          setPanStart({ x: e.clientX, y: e.clientY, scrollLeft: wrapper.scrollLeft, scrollTop: wrapper.scrollTop });
          try { (e.target as HTMLDivElement).setPointerCapture(e.pointerId); } catch (e) {}
        }
      }
      return;
    }

    if (activeTool === 'pencil') {
      const { x, y } = getCoordinates(e);
      setIsDrawing(true);
      setCurrentPath([{ x, y }]);
    }
  };

  const onClickLayer = (e: React.MouseEvent<HTMLDivElement>) => {
    if (activeTool === 'text') {
      const { x, y } = getCoordinates(e);
      const newId = Math.random().toString(36).substr(2, 9);
      setAnnotations(prev => [...prev, { id: newId, type: 'text', page: currentPage, x, y, color: activeColor, content: '', fontSize: 16 }]);
      setEditingTextId(newId);
      setActiveTool('cursor');
    }
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isPanning && scrollWrapperRef.current) {
      const dx = e.clientX - panStart.x;
      const dy = e.clientY - panStart.y;
      scrollWrapperRef.current.scrollLeft = panStart.scrollLeft - dx;
      scrollWrapperRef.current.scrollTop = panStart.scrollTop - dy;
      return;
    }

    if (draggingTextId && activeTool === 'cursor') {
      const { x, y } = getCoordinates(e);
      setAnnotations(prev => prev.map(a => a.id === draggingTextId ? { ...a, x, y } : a));
      return;
    }

    if (!isDrawing || activeTool !== 'pencil') return;
    const { x, y } = getCoordinates(e);
    setCurrentPath(prev => [...prev, { x, y }]);
  };

  const onPointerUp = (e?: React.PointerEvent<HTMLDivElement>) => {
    if (isPanning) {
      setIsPanning(false);
      if (e) try { (e.target as HTMLDivElement).releasePointerCapture(e.pointerId); } catch {}
      return;
    }

    if (draggingTextId) {
      setDraggingTextId(null);
      return;
    }

    if (isDrawing && activeTool === 'pencil') {
      setIsDrawing(false);
      if (currentPath.length > 1) {
        setAnnotations(prev => [...prev, {
          id: Math.random().toString(36).substr(2, 9),
          type: 'draw',
          page: currentPage,
          path: currentPath,
          color: activeColor,
          strokeWidth: 2
        }]);
      }
      setCurrentPath([]);
    }
  };
  
  const onUndo = () => {
    setAnnotations(prev => prev.slice(0, -1));
  };

  return (
    <div className="tool-container fade-in">
      <div className="container" style={{ maxWidth: file ? '100%' : '1200px' }}>
        {!file && (
          <>
            <button onClick={onBack} className="back-pill-btn"><ChevronLeft size={18} /> Voltar</button>
            <div className="tool-intro">
              <h1>Editor de PDF</h1>
              <p>Adicione textos, assinaturas e anotações em seu documento.</p>
            </div>
            <div {...getRootProps()} className={`premium-dropzone ${isDragActive ? 'active' : ''}`}>
              <input {...getInputProps()} />
              <div className="dropzone-content">
                <div className="upload-icon-circle"><UploadCloud size={32} /></div>
                <h3>Selecione um arquivo PDF</h3>
                <p>Ou arraste e solte aqui</p>
              </div>
            </div>
          </>
        )}
        
        {file && (
          <div className="editor-layout">
            <div className="editor-top-bar">
              <div className="etb-left">
                <button onClick={() => setFile(null)} className="icon-btn-toggle" title="Trocar arquivo"><ChevronLeft size={20}/></button>
                <div className="file-name-pill hide-mobile">{file.name}</div>
              </div>
              <div className="etb-right">
                <button className="primary-action-btn small-btn" onClick={handleExport} disabled={isExporting}>
                  {isExporting ? <Loader2 className="animate-spin" size={16}/> : <Save size={16}/>}
                  <span className="hide-mobile">Salvar PDF</span>
                </button>
              </div>
            </div>
            
            <div className="editor-main-area">
              <div className="editor-island-toolbar">
                <div className="toolbar-section">
                  <button className={`tool-btn ${activeTool === 'hand' ? 'active' : ''}`} onClick={() => setActiveTool('hand')} title="Mover Folha"><Hand size={18}/><span className="tool-label">Mover</span></button>
                  <button className={`tool-btn ${activeTool === 'cursor' ? 'active' : ''}`} onClick={() => setActiveTool('cursor')} title="Seleção"><MousePointer2 size={18}/><span className="tool-label">Seleção</span></button>
                  <button className={`tool-btn ${activeTool === 'text' ? 'active' : ''}`} onClick={() => setActiveTool('text')} title="Inserir Texto"><Type size={18}/><span className="tool-label">Texto</span></button>
                  <button className={`tool-btn ${activeTool === 'pencil' ? 'active' : ''}`} onClick={() => setActiveTool('pencil')} title="Lápis / Assinatura"><Pencil size={18}/><span className="tool-label">Lápis</span></button>
                </div>
                {(activeTool === 'text' || activeTool === 'pencil' || editingTextId || draggingTextId) && (
                  <div className="toolbar-section color-section">
                    <span className="toolbar-label">Cor:</span>
                    {['#e11d48', '#2563eb', '#16a34a', '#0f172a', '#f59e0b'].map(color => (
                      <button 
                        key={color} 
                        className={`color-btn ${activeColor === color ? 'active' : ''}`} 
                        style={{ backgroundColor: color }} 
                        onPointerDown={(e) => e.preventDefault()}
                        onClick={() => {
                          setActiveColor(color);
                          if (editingTextId) {
                            setAnnotations(prev => prev.map(a => a.id === editingTextId ? { ...a, color } : a));
                          }
                          if (draggingTextId) {
                            setAnnotations(prev => prev.map(a => a.id === draggingTextId ? { ...a, color } : a));
                          }
                        }} 
                      />
                    ))}
                  </div>
                )}
                
                <div className="toolbar-section" style={{ marginLeft: 'auto' }}>
                  <button className="icon-btn-toggle" onClick={() => setZoom(z => Math.max(0.5, z - 0.2))}><ZoomOut size={16}/></button>
                  <span className="zoom-label">{Math.round(zoom * 100)}%</span>
                  <button className="icon-btn-toggle" onClick={() => setZoom(z => Math.min(3, z + 0.2))}><ZoomIn size={16}/></button>
                </div>
                
                <div className="toolbar-section">
                  <button className="tool-btn" title="Desfazer" onClick={onUndo} disabled={annotations.length === 0}><Undo size={18}/><span className="tool-label">Desfazer</span></button>
                </div>
              </div>

              <div className="editor-canvas-wrapper" ref={scrollWrapperRef}>
                <div className="page-controls-float">
                  <button disabled={currentPage <= 1} onClick={() => setCurrentPage(p => p - 1)} className="icon-btn-toggle shadow-sm"><ChevronLeft size={20}/></button>
                  <span className="page-indicator">{currentPage} / {totalPages || '-'}</span>
                  <button disabled={currentPage >= totalPages} onClick={() => setCurrentPage(p => p + 1)} className="icon-btn-toggle shadow-sm" style={{ transform: 'rotate(180deg)' }}><ChevronLeft size={20}/></button>
                </div>
                
                <div 
                  className="canvas-zoom-container"
                  style={{ 
                    width: pdfDoc ? baseSize.width * zoom : '100%', 
                    height: pdfDoc ? baseSize.height * zoom + 100 : 'auto', // +100 to ensure bottom shadow visibility
                    position: 'relative',
                    transition: '0.3s',
                    margin: '0 auto'
                  }}
                >
                  <div 
                    className="canvas-frame" 
                    ref={containerRef}
                    style={{ 
                      transform: `scale(${zoom})`, 
                      transformOrigin: 'top left',
                      width: pdfDoc ? baseSize.width : 'auto',
                      height: pdfDoc ? baseSize.height : 'auto'
                    }}
                  >
                    {!pdfDoc && (
                      <div className="canvas-loading">
                        <Loader2 className="animate-spin text-primary" size={32} />
                        <span>Processando documento...</span>
                      </div>
                    )}
                    <canvas ref={canvasRef} className="pdf-render-canvas" />
                    
                    {pdfDoc && (
                      <div 
                        className="interactive-layer"
                        onPointerDown={onPointerDown}
                        onPointerMove={onPointerMove}
                        onPointerUp={onPointerUp}
                        onPointerLeave={onPointerUp}
                        onClick={onClickLayer}
                        style={{ 
                          cursor: activeTool === 'text' ? 'text' : activeTool === 'pencil' ? 'crosshair' : activeTool === 'hand' ? (isPanning ? 'grabbing' : 'grab') : 'default',
                          touchAction: activeTool === 'pencil' ? 'none' : 'pan-x pan-y'
                        }}
                      >
                        {/* SVGs dos desenhos */}
                        <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
                          {annotations.filter(a => a.page === currentPage && a.type === 'draw').map(a => (
                            <polyline 
                              key={a.id}
                              points={a.path.map((p: any) => `${p.x},${p.y}`).join(' ')}
                              fill="none" stroke={a.color} strokeWidth={a.strokeWidth} strokeLinecap="round" strokeLinejoin="round"
                            />
                          ))}
                          {isDrawing && currentPath.length > 0 && (
                            <polyline 
                              points={currentPath.map(p => `${p.x},${p.y}`).join(' ')}
                              fill="none" stroke={activeColor} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
                            />
                          )}
                        </svg>

                        {/* Textos */}
                        {annotations.filter(a => a.page === currentPage && a.type === 'text').map(a => (
                          <div 
                            key={a.id} 
                            style={{ position: 'absolute', left: a.x, top: a.y, transform: 'translateY(-50%)', pointerEvents: 'auto' }}
                            onPointerDown={(e) => {
                              if (activeTool === 'cursor' && editingTextId !== a.id) {
                                e.stopPropagation();
                                if (e.pointerType === 'mouse' || e.pointerType === 'touch') {
                                  (e.target as any).setPointerCapture(e.pointerId);
                                }
                                setDraggingTextId(a.id);
                                setActiveColor(a.color); // Sync the color picker
                              } else {
                                e.stopPropagation();
                              }
                            }}
                            onPointerUp={(e) => {
                              if (draggingTextId === a.id) {
                                if (e.pointerType === 'mouse' || e.pointerType === 'touch') {
                                  (e.target as any).releasePointerCapture(e.pointerId);
                                }
                                setDraggingTextId(null);
                              }
                            }}
                          >
                            {editingTextId === a.id ? (
                              <input 
                                autoFocus
                                type="text"
                                value={a.content}
                                onChange={(e) => setAnnotations(prev => prev.map(ann => ann.id === a.id ? { ...ann, content: e.target.value } : ann))}
                                onBlur={() => {
                                  setEditingTextId(null);
                                  if (!a.content.trim()) setAnnotations(prev => prev.filter(ann => ann.id !== a.id));
                                }}
                                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); setEditingTextId(null); } }}
                                style={{ 
                                  color: a.color, fontSize: `${a.fontSize}px`, background: 'rgba(255,255,250,0.85)',
                                  border: `2px solid ${a.color}`, outline: 'none', padding: '4px 6px',
                                  borderRadius: '4px', minWidth: '120px', fontFamily: 'Helvetica, sans-serif',
                                  boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                                }}
                              />
                            ) : (
                              <div 
                                onClick={(e) => { 
                                  if (!draggingTextId && activeTool === 'cursor') {
                                    e.stopPropagation(); 
                                    setEditingTextId(a.id); 
                                    setActiveColor(a.color); // Sync the color picker
                                  }
                                }}
                                style={{ 
                                  touchAction: activeTool === 'cursor' ? 'none' : 'auto',
                                  color: a.color, fontSize: `${a.fontSize}px`, 
                                  cursor: activeTool === 'cursor' ? (draggingTextId === a.id ? 'grabbing' : 'grab') : 'inherit', 
                                  padding: '2px 4px', whiteSpace: 'nowrap', fontFamily: 'Helvetica, sans-serif',
                                  background: 'transparent', borderRadius: '4px',
                                  border: (activeTool === 'cursor' && !draggingTextId) ? '1px dashed transparent' : 'none',
                                  userSelect: 'none'
                                }}
                                onMouseEnter={(e) => {
                                  if (activeTool === 'cursor' && !draggingTextId) e.currentTarget.style.border = '1px dashed #cbd5e1';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.border = '1px dashed transparent';
                                }}
                              >
                                {a.content || '(texto vazio)'}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ModelosOnlinePage() {
  return (
    <div className="tool-container fade-in">
      <div className="container" style={{ textAlign: 'center', padding: '6rem 0' }}>
        <div className="upload-icon-circle" style={{ backgroundColor: 'var(--surface-2)', color: 'var(--primary)', marginBottom: '2rem' }}><Sparkles size={32} /></div>
        <h1 className="hero-mobile-title">Modelos Online</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>Em desenvolvimento. Prepare-se para modelos incríveis.</p>
      </div>
    </div>
  );
}

function HomePage({ onSelectTool }: { onSelectTool: (tool: string) => void }) {
  return (
    <div className="home-hero-section">
      <div className="container">
        <div className="hero-text fade-in">
          <h1 className="hero-mobile-title">Pronto para o seu escritório</h1>
          <p>Ferramentas PDF rápidas, seguras e 100% privadas no seu navegador.</p>
        </div>
        <div className="premium-grid">
          <div className="premium-card highlight" onClick={() => onSelectTool('combinar')}>
            <div className="card-tag">Destaque</div>
            <div className="p-card-icon combiner"><Layers size={32} /></div>
            <h3>Combinar PDF</h3>
            <p>Mescle múltiplos arquivos PDF em um só documento organizado.</p>
          </div>
          <div className="premium-card" onClick={() => onSelectTool('editor')}>
            <div className="p-card-icon editor"><FileEdit size={32} /></div>
            <h3>Editor de PDF</h3>
            <p>Adicione textos, formas e anotações facilmente.</p>
          </div>
          <div className="premium-card disabled">
            <div className="p-card-icon word"><FileText size={32} /></div>
            <h3>PDF para Word</h3>
            <p>Converta PDFs para o formato Word 100% editável.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [activeTab, setActiveTab] = useState<'ferramentas' | 'modelos'>('ferramentas');
  const [currentTool, setCurrentTool] = useState<string | null>(null);
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('theme') === 'dark');
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light');
    localStorage.setItem('theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  return (
    <div className="app-shell">
      <nav className="navbar">
        <div className="container nav-wrapper">
          <div className="nav-left" onClick={() => { setActiveTab('ferramentas'); setCurrentTool(null); }}>
            <span className="logo-text">Ready4Office<span className="logo-dot">.</span></span>
          </div>
          <div className="nav-center hide-mobile">
            <div className="pill-group">
              <button className={`pill-btn ${activeTab === 'ferramentas' ? 'active' : ''}`} onClick={() => { setActiveTab('ferramentas'); setCurrentTool(null); }}>Ferramentas</button>
              <button className={`pill-btn ${activeTab === 'modelos' ? 'active' : ''}`} onClick={() => { setActiveTab('modelos'); setCurrentTool(null); }}>Modelos</button>
            </div>
          </div>
          <div className="nav-right">
            <button 
              className={`theme-toggle-switch ${darkMode ? 'dark' : 'light'}`} 
              onClick={() => setDarkMode(!darkMode)}
              title="Alternar tema"
              aria-label="Alternar tema"
            >
              <div className="toggle-thumb">
                {darkMode ? <Moon size={14} /> : <Sun size={14} />}
              </div>
            </button>
            <button className="mobile-menu-btn show-mobile icon-btn-toggle" onClick={() => setMenuOpen(!menuOpen)}>
              {menuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
        {menuOpen && (
          <>
            <div className="mobile-menu-overlay fade-in" onClick={() => setMenuOpen(false)}></div>
            <div className="mobile-menu slide-down">
              <button 
                className={activeTab === 'ferramentas' ? 'active' : ''}
                onClick={() => { setActiveTab('ferramentas'); setCurrentTool(null); setMenuOpen(false); }}
              >
                Ferramentas
              </button>
              <button 
                className={activeTab === 'modelos' ? 'active' : ''}
                onClick={() => { setActiveTab('modelos'); setCurrentTool(null); setMenuOpen(false); }}
              >
                Modelos
              </button>
            </div>
          </>
        )}
      </nav>
      <main className="content">
        {activeTab === 'ferramentas' ? (
          currentTool === 'combinar' ? <CombinarPDFPage onBack={() => setCurrentTool(null)} /> : 
          currentTool === 'editor' ? <EditorPDFPage onBack={() => setCurrentTool(null)} /> : 
          <HomePage onSelectTool={setCurrentTool} />
        ) : <ModelosOnlinePage />}
      </main>
      <footer className="premium-footer"><div className="container"><p>© 2026 Ready4Office Tools</p></div></footer>
    </div>
  );
}