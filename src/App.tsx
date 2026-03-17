import { useState, useEffect } from 'react';
import { 
  DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragOverlay
} from '@dnd-kit/core';
import { 
  arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, rectSortingStrategy 
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { 
  FileEdit, Layers, FileText, UploadCloud, Trash2, ChevronLeft, Sun, Moon, 
  X, Plus, Loader2, Sparkles, Menu, AlertCircle
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
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.3 : 1 };
  return <div ref={setNodeRef} style={style}><FileCard fileItem={fileItem} onRemove={onRemove} listeners={listeners} attributes={attributes} index={index} /></div>;
}

function CombinarPDFPage({ onBack }: { onBack: () => void }) {
  const [files, setFiles] = useState<PDFFileItem[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isMerging, setIsMerging] = useState(false);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));

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
          <div className="premium-card disabled">
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
          currentTool === 'combinar' ? <CombinarPDFPage onBack={() => setCurrentTool(null)} /> : <HomePage onSelectTool={setCurrentTool} />
        ) : <ModelosOnlinePage />}
      </main>
      <footer className="premium-footer"><div className="container"><p>© 2026 Ready4Office Tools</p></div></footer>
    </div>
  );
}