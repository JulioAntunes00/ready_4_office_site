import { useState, useRef } from 'react';
import { ChevronLeft, Download, Plus, Trash2, Loader2, Camera, LayoutTemplate } from 'lucide-react';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

interface Experience { id: string; titulo: string; empresa: string; periodo: string; descricao: string; }
interface Skill { id: string; nome: string; nivel: number; }
interface Education { id: string; curso: string; instituicao: string; periodo: string; }

interface CvData {
  nome: string; cargo: string; email: string; telefone: string;
  cidade: string; linkedin: string; resumo: string;
  experiencias: Experience[]; habilidades: Skill[];
  educacao: Education[]; idiomas: { id: string; nome: string; nivel: string }[];
  acento: string; foto: string | null;
  layout: 'classico' | 'moderno' | 'minimalista';
}

const ACCENT_COLORS = ['#e11d48', '#2563eb', '#10b981', '#8b5cf6', '#f59e0b', '#0891b2', '#7c3aed', '#059669'];
const uid = () => Math.random().toString(36).substr(2, 9);

function wrapText(text: string, maxChars: number): string[] {
  if (!text) return [];
  const words = text.split(' ');
  const lines: string[] = [];
  let current = '';
  for (const word of words) {
    if ((current + ' ' + word).trim().length <= maxChars) current = (current + ' ' + word).trim();
    else { if (current) lines.push(current); current = word; }
  }
  if (current) lines.push(current);
  return lines;
}

// ============ LAYOUTS ============

function LayoutClassico({ cv }: { cv: CvData }) {
  const getInitials = (n: string) => n.trim().split(' ').map(x => x[0]).slice(0, 2).join('').toUpperCase() || '?';
  return (
    <>
      <div className="cv-header" style={{ background: `linear-gradient(135deg, ${cv.acento}14 0%, ${cv.acento}05 100%)` }}>
        <div className="cv-header-accent" style={{ background: `linear-gradient(90deg, ${cv.acento}, ${cv.acento}99)` }} />
        <div className="cv-avatar" style={{ background: cv.foto ? 'transparent' : `linear-gradient(135deg, ${cv.acento}, ${cv.acento}cc)`, overflow: 'hidden', border: `3px solid ${cv.acento}` }}>
          {cv.foto ? <img src={cv.foto} alt="foto" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : getInitials(cv.nome)}
        </div>
        <div className="cv-header-info">
          <div className="cv-name">{cv.nome || 'Seu Nome'}</div>
          <div className="cv-role" style={{ color: cv.acento }}>{cv.cargo || 'Cargo / Profissão'}</div>
          <div className="cv-contact-list">
            {cv.email && <span className="cv-contact-item">✉ {cv.email}</span>}
            {cv.telefone && <span className="cv-contact-item">📞 {cv.telefone}</span>}
            {cv.cidade && <span className="cv-contact-item">📍 {cv.cidade}</span>}
            {cv.linkedin && <span className="cv-contact-item">🔗 {cv.linkedin}</span>}
          </div>
        </div>
      </div>
      <div className="cv-body">
        <div className="cv-sidebar">
          {cv.habilidades.length > 0 && (
            <div className="cv-section">
              <div className="cv-section-title" style={{ color: cv.acento, borderColor: cv.acento }}>Habilidades</div>
              {cv.habilidades.map(sk => (
                <div className="cv-skill-bar-row" key={sk.id}>
                  <div className="cv-skill-name">{sk.nome || '—'}</div>
                  <div className="cv-skill-bar-bg"><div className="cv-skill-bar-fill" style={{ width: `${(sk.nivel / 5) * 100}%`, background: cv.acento }} /></div>
                </div>
              ))}
            </div>
          )}
          {cv.educacao.length > 0 && (
            <div className="cv-section">
              <div className="cv-section-title" style={{ color: cv.acento, borderColor: cv.acento }}>Formação</div>
              {cv.educacao.map(ed => (
                <div className="cv-education-item" key={ed.id}>
                  <div className="cv-edu-course">{ed.curso || '—'}</div>
                  <div className="cv-edu-institution">{ed.instituicao}</div>
                  <div className="cv-edu-period">{ed.periodo}</div>
                </div>
              ))}
            </div>
          )}
          {cv.idiomas.length > 0 && (
            <div className="cv-section">
              <div className="cv-section-title" style={{ color: cv.acento, borderColor: cv.acento }}>Idiomas</div>
              {cv.idiomas.map(id => (
                <div className="cv-lang-item" key={id.id}>
                  <span>{id.nome || '—'}</span>
                  <span className="cv-lang-level" style={{ color: cv.acento }}>{id.nivel}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="cv-main">
          {cv.resumo && <div className="cv-section"><div className="cv-section-title" style={{ color: cv.acento, borderColor: cv.acento }}>Resumo</div><p className="cv-summary-text">{cv.resumo}</p></div>}
          {cv.experiencias.length > 0 && (
            <div className="cv-section">
              <div className="cv-section-title" style={{ color: cv.acento, borderColor: cv.acento }}>Experiência</div>
              {cv.experiencias.map(exp => (
                <div className="cv-experience-item" key={exp.id} style={{ '--cv-accent': cv.acento } as any}>
                  <div className="cv-exp-title">{exp.titulo || '—'}</div>
                  <div className="cv-exp-company" style={{ color: cv.acento }}>{exp.empresa}</div>
                  <div className="cv-exp-period">{exp.periodo}</div>
                  <div className="cv-exp-desc">{exp.descricao}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function LayoutModerno({ cv }: { cv: CvData }) {
  const getInitials = (n: string) => n.trim().split(' ').map(x => x[0]).slice(0, 2).join('').toUpperCase() || '?';
  return (
    <>
      {/* Full-width dark header */}
      <div style={{ background: `linear-gradient(135deg, ${cv.acento}, ${cv.acento}dd)`, padding: '2.5rem', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -40, right: -40, width: 200, height: 200, borderRadius: '50%', background: 'rgba(255,255,255,0.06)' }} />
        <div style={{ position: 'absolute', bottom: -20, right: 80, width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,0.04)' }} />
        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', position: 'relative', zIndex: 2 }}>
          <div style={{
            width: 90, height: 90, borderRadius: '20px', border: '3px solid rgba(255,255,255,0.4)',
            overflow: 'hidden', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.8rem', fontWeight: 900, color: cv.acento, background: 'white'
          }}>
            {cv.foto ? <img src={cv.foto} alt="foto" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : getInitials(cv.nome)}
          </div>
          <div>
            <div style={{ fontSize: '2rem', fontWeight: 900, color: 'white', letterSpacing: '-1px', lineHeight: 1.1 }}>{cv.nome || 'Seu Nome'}</div>
            <div style={{ fontSize: '1rem', fontWeight: 700, color: 'rgba(255,255,255,0.8)', margin: '0.25rem 0 0.75rem' }}>{cv.cargo || 'Cargo / Profissão'}</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem 1.2rem' }}>
              {[cv.email, cv.telefone, cv.cidade, cv.linkedin].filter(Boolean).map((c, i) => (
                <span key={i} style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.75)', fontWeight: 600 }}>{c}</span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Skills row */}
      {cv.habilidades.length > 0 && (
        <div style={{ padding: '1rem 2rem', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
          {cv.habilidades.map(sk => (
            <div key={sk.id} style={{
              padding: '0.3rem 0.75rem', borderRadius: '100px',
              background: `${cv.acento}18`, color: cv.acento,
              fontSize: '0.75rem', fontWeight: 700, border: `1px solid ${cv.acento}30`
            }}>
              {sk.nome || '—'} {'●'.repeat(sk.nivel)}{'○'.repeat(5 - sk.nivel)}
            </div>
          ))}
        </div>
      )}

      {/* Body - 2 col */}
      <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', minHeight: '500px' }}>
        <div style={{ padding: '1.5rem 2rem', borderRight: '1px solid #e2e8f0' }}>
          {cv.resumo && (
            <div className="cv-section">
              <div className="cv-section-title" style={{ color: cv.acento, borderColor: cv.acento }}>Sobre Mim</div>
              <p className="cv-summary-text">{cv.resumo}</p>
            </div>
          )}
          {cv.experiencias.length > 0 && (
            <div className="cv-section">
              <div className="cv-section-title" style={{ color: cv.acento, borderColor: cv.acento }}>Experiência</div>
              {cv.experiencias.map(exp => (
                <div key={exp.id} style={{ marginBottom: '1.2rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div className="cv-exp-title">{exp.titulo || '—'}</div>
                    <div style={{ fontSize: '0.7rem', color: '#94a3b8', flexShrink: 0, marginLeft: '0.5rem' }}>{exp.periodo}</div>
                  </div>
                  <div style={{ fontSize: '0.82rem', fontWeight: 700, color: cv.acento, margin: '0.1rem 0 0.35rem' }}>{exp.empresa}</div>
                  <div className="cv-exp-desc">{exp.descricao}</div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div style={{ padding: '1.5rem 1.5rem', background: '#fafafa' }}>
          {cv.educacao.length > 0 && (
            <div className="cv-section">
              <div className="cv-section-title" style={{ color: cv.acento, borderColor: cv.acento }}>Formação</div>
              {cv.educacao.map(ed => (
                <div className="cv-education-item" key={ed.id}>
                  <div className="cv-edu-course">{ed.curso || '—'}</div>
                  <div className="cv-edu-institution">{ed.instituicao}</div>
                  <div className="cv-edu-period">{ed.periodo}</div>
                </div>
              ))}
            </div>
          )}
          {cv.idiomas.length > 0 && (
            <div className="cv-section">
              <div className="cv-section-title" style={{ color: cv.acento, borderColor: cv.acento }}>Idiomas</div>
              {cv.idiomas.map(id => (
                <div key={id.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '0.3rem', color: '#475569' }}>
                  <span>{id.nome || '—'}</span>
                  <span style={{ fontWeight: 700, color: cv.acento }}>{id.nivel}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function LayoutMinimalista({ cv }: { cv: CvData }) {
  const getInitials = (n: string) => n.trim().split(' ').map(x => x[0]).slice(0, 2).join('').toUpperCase() || '?';
  return (
    <div style={{ padding: '3rem' }}>
      {/* Minimal header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2rem', paddingBottom: '1.5rem', borderBottom: `2px solid ${cv.acento}` }}>
        <div style={{ display: 'flex', gap: '1.2rem', alignItems: 'center' }}>
          {(cv.foto || cv.nome) && (
            <div style={{
              width: 70, height: 70, borderRadius: '50%',
              border: `2px solid ${cv.acento}`, overflow: 'hidden', flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: `${cv.acento}18`, color: cv.acento, fontSize: '1.4rem', fontWeight: 900
            }}>
              {cv.foto ? <img src={cv.foto} alt="foto" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : getInitials(cv.nome)}
            </div>
          )}
          <div>
            <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.8px' }}>{cv.nome || 'Seu Nome'}</div>
            <div style={{ fontSize: '0.9rem', fontWeight: 700, color: cv.acento, marginTop: '0.2rem' }}>{cv.cargo}</div>
          </div>
        </div>
        <div style={{ textAlign: 'right', fontSize: '0.72rem', color: '#64748b', lineHeight: 1.7 }}>
          {cv.email && <div>{cv.email}</div>}
          {cv.telefone && <div>{cv.telefone}</div>}
          {cv.cidade && <div>{cv.cidade}</div>}
          {cv.linkedin && <div>{cv.linkedin}</div>}
        </div>
      </div>

      {/* Content - single column, clean */}
      {cv.resumo && (
        <div style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ fontSize: '0.65rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '2px', color: cv.acento, marginBottom: '0.5rem' }}>Resumo</h3>
          <p style={{ fontSize: '0.85rem', color: '#475569', lineHeight: 1.7 }}>{cv.resumo}</p>
        </div>
      )}

      {cv.experiencias.length > 0 && (
        <div style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ fontSize: '0.65rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '2px', color: cv.acento, marginBottom: '0.75rem' }}>Experiência</h3>
          {cv.experiencias.map(exp => (
            <div key={exp.id} style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
              <div style={{ fontSize: '0.72rem', color: '#94a3b8', paddingTop: '0.15rem', lineHeight: 1.5 }}>
                <div style={{ fontWeight: 700 }}>{exp.periodo}</div>
                <div style={{ color: cv.acento, fontWeight: 700 }}>{exp.empresa}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#0f172a' }}>{exp.titulo || '—'}</div>
                <div style={{ fontSize: '0.78rem', color: '#475569', lineHeight: 1.5, marginTop: '0.2rem' }}>{exp.descricao}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1.5rem', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #e2e8f0' }}>
        {cv.habilidades.length > 0 && (
          <div>
            <h3 style={{ fontSize: '0.65rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '2px', color: cv.acento, marginBottom: '0.5rem' }}>Habilidades</h3>
            {cv.habilidades.map(sk => (
              <div key={sk.id} style={{ fontSize: '0.78rem', color: '#475569', marginBottom: '0.2rem' }}>• {sk.nome || '—'}</div>
            ))}
          </div>
        )}
        {cv.educacao.length > 0 && (
          <div>
            <h3 style={{ fontSize: '0.65rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '2px', color: cv.acento, marginBottom: '0.5rem' }}>Formação</h3>
            {cv.educacao.map(ed => (
              <div key={ed.id} style={{ marginBottom: '0.5rem' }}>
                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#0f172a' }}>{ed.curso || '—'}</div>
                <div style={{ fontSize: '0.72rem', color: '#64748b' }}>{ed.instituicao}</div>
                <div style={{ fontSize: '0.68rem', color: '#94a3b8' }}>{ed.periodo}</div>
              </div>
            ))}
          </div>
        )}
        {cv.idiomas.length > 0 && (
          <div>
            <h3 style={{ fontSize: '0.65rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '2px', color: cv.acento, marginBottom: '0.5rem' }}>Idiomas</h3>
            {cv.idiomas.map(id => (
              <div key={id.id} style={{ fontSize: '0.78rem', color: '#475569', marginBottom: '0.2rem' }}>
                <span style={{ fontWeight: 700 }}>{id.nome || '—'}</span> — {id.nivel}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ============ MAIN COMPONENT ============

export default function ModeloCurriculo({ onBack }: { onBack: () => void }) {
  const [isDownloading, setIsDownloading] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);

  const [cv, setCv] = useState<CvData>({
    nome: 'Maria Oliveira', cargo: 'Designer UX/UI Sênior',
    email: 'maria.oliveira@email.com', telefone: '(11) 99999-0000',
    cidade: 'São Paulo, SP', linkedin: 'linkedin.com/in/mariaoliveira',
    resumo: 'Profissional criativa com 6 anos de experiência em design de produto. Especializada em criar experiências digitais que unem estética e funcionalidade.',
    acento: '#2563eb', foto: null, layout: 'classico',
    experiencias: [
      { id: uid(), titulo: 'UX/UI Designer Sênior', empresa: 'TechCorp Digital', periodo: 'Jan 2022 – Presente', descricao: 'Liderança de projetos de produto end-to-end, desde pesquisa com usuários até entrega de interfaces funcionais.' },
      { id: uid(), titulo: 'UX Designer Pleno', empresa: 'StartupXYZ', periodo: 'Mar 2020 – Dez 2021', descricao: 'Redesenho completo do app mobile, aumentando a retenção de usuários em 35%.' },
    ],
    habilidades: [
      { id: uid(), nome: 'Figma / Sketch', nivel: 5 },
      { id: uid(), nome: 'Pesquisa de Usuário', nivel: 4 },
      { id: uid(), nome: 'Prototipagem', nivel: 5 },
      { id: uid(), nome: 'HTML/CSS', nivel: 3 },
    ],
    educacao: [{ id: uid(), curso: 'Design Gráfico', instituicao: 'FAAP – São Paulo', periodo: '2016 – 2020' }],
    idiomas: [{ id: uid(), nome: 'Português', nivel: 'Nativo' }, { id: uid(), nome: 'Inglês', nivel: 'Avançado' }],
  });

  const updateCv = (field: keyof CvData, value: any) => setCv(prev => ({ ...prev, [field]: value }));

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => updateCv('foto', reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      const pdfDoc = await PDFDocument.create();
      const page = pdfDoc.addPage([595, 842]);
      const { height } = page.getSize();
      const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      const regular = await pdfDoc.embedFont(StandardFonts.Helvetica);

      const hex = cv.acento.replace('#', '');
      const acR = parseInt(hex.substr(0, 2), 16) / 255;
      const acG = parseInt(hex.substr(2, 2), 16) / 255;
      const acB = parseInt(hex.substr(4, 2), 16) / 255;
      const accentRgb = rgb(acR, acG, acB);
      const dark = rgb(0.06, 0.09, 0.16);
      const gray = rgb(0.28, 0.34, 0.42);
      const lightGray = rgb(0.58, 0.63, 0.71);

      // Try to embed photo
      let photoImage: any = null;
      if (cv.foto) {
        try {
          const base64 = cv.foto.split(',')[1];
          if (cv.foto.includes('png')) {
            photoImage = await pdfDoc.embedPng(Uint8Array.from(atob(base64), c => c.charCodeAt(0)));
          } else {
            photoImage = await pdfDoc.embedJpg(Uint8Array.from(atob(base64), c => c.charCodeAt(0)));
          }
        } catch { /* skip if image embed fails */ }
      }

      // Header
      page.drawRectangle({ x: 0, y: height - 130, width: 595, height: 130, color: rgb(0.97, 0.98, 1) });
      page.drawRectangle({ x: 0, y: height - 4, width: 595, height: 4, color: accentRgb });

      // Photo or initials
      const photoSize = 72;
      const photoX = 40;
      const photoY = height - 115;
      if (photoImage) {
        page.drawEllipse({ x: photoX + photoSize / 2, y: photoY + photoSize / 2, xScale: photoSize / 2, yScale: photoSize / 2, color: rgb(0.9, 0.9, 0.9) });
        page.drawImage(photoImage, { x: photoX, y: photoY, width: photoSize, height: photoSize });
      } else {
        page.drawEllipse({ x: photoX + photoSize / 2, y: photoY + photoSize / 2, xScale: photoSize / 2, yScale: photoSize / 2, color: accentRgb });
      }

      const textX = photoImage || true ? photoX + photoSize + 16 : photoX;
      page.drawText(cv.nome || 'Seu Nome', { x: textX, y: height - 55, size: 20, font: bold, color: dark });
      page.drawText(cv.cargo || '', { x: textX, y: height - 74, size: 11, font: regular, color: accentRgb });
      const contacts = [cv.email, cv.telefone, cv.cidade].filter(Boolean);
      contacts.forEach((c, i) => page.drawText(c, { x: textX + (i % 3) * 145, y: height - 98, size: 8, font: regular, color: gray }));

      let y = height - 155;
      const sectionTitle = (title: string) => {
        page.drawText(title.toUpperCase(), { x: 40, y, size: 7, font: bold, color: lightGray });
        y -= 6;
        page.drawLine({ start: { x: 40, y }, end: { x: 555, y }, thickness: 1, color: rgb(0.85, 0.87, 0.9) });
        y -= 16;
      };

      sectionTitle('Resumo Profissional');
      wrapText(cv.resumo, 85).forEach(line => { page.drawText(line, { x: 40, y, size: 9, font: regular, color: gray }); y -= 13; });
      y -= 8;

      sectionTitle('Experiência Profissional');
      cv.experiencias.forEach(exp => {
        if (y < 60) return;
        page.drawText(exp.titulo || '-', { x: 40, y, size: 10, font: bold, color: dark });
        if (exp.periodo) page.drawText(exp.periodo, { x: 420, y, size: 8, font: regular, color: lightGray });
        y -= 14;
        if (exp.empresa) { page.drawText(exp.empresa, { x: 40, y, size: 9, font: regular, color: accentRgb }); y -= 12; }
        wrapText(exp.descricao, 85).forEach(line => { page.drawText(line, { x: 40, y, size: 8.5, font: regular, color: gray }); y -= 12; });
        y -= 6;
      });

      if (y > 100) {
        sectionTitle('Formação Acadêmica');
        cv.educacao.forEach(ed => {
          page.drawText(ed.curso || '-', { x: 40, y, size: 10, font: bold, color: dark });
          if (ed.periodo) page.drawText(ed.periodo, { x: 420, y, size: 8, font: regular, color: lightGray });
          y -= 13;
          if (ed.instituicao) { page.drawText(ed.instituicao, { x: 40, y, size: 8.5, font: regular, color: gray }); y -= 16; }
        });
      }

      if (cv.habilidades.length > 0 && y > 100) {
        sectionTitle('Habilidades');
        cv.habilidades.forEach((sk, i) => {
          const x = 40 + (i % 3) * 170;
          if (i % 3 === 0 && i > 0) y -= 14;
          page.drawText(sk.nome || '—', { x, y, size: 9, font: regular, color: gray });
        });
      }

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes as any], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `curriculo_${cv.nome.replace(/\s+/g, '_')}.pdf`;
      a.click();
    } catch (e) {
      alert('Erro ao gerar PDF. Tente novamente.');
    } finally {
      setIsDownloading(false);
    }
  };

  const LAYOUTS = [
    { id: 'classico', label: 'Clássico', desc: '2 colunas + sidebar' },
    { id: 'moderno', label: 'Moderno', desc: 'Header colorido' },
    { id: 'minimalista', label: 'Minimalista', desc: 'Limpo e direto' },
  ] as const;

  return (
    <div className="modelo-editor-shell fade-in">
      {/* PANEL */}
      <div className="modelo-editor-panel">
        <div className="panel-header">
          <button className="panel-back-btn" onClick={onBack}><ChevronLeft size={20} /></button>
          <div className="panel-title-group">
            <h2>Currículo</h2>
            <p>Personalize e baixe em PDF</p>
          </div>
          <button className="download-btn" onClick={handleDownload} disabled={isDownloading}>
            {isDownloading ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
            {isDownloading ? '' : 'PDF'}
          </button>
        </div>

        <div className="panel-form">
          {/* Layout Picker */}
          <div className="form-section-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><LayoutTemplate size={12} /> Layout</div>
          <div className="layout-picker">
            {LAYOUTS.map(l => (
              <button key={l.id} className={`layout-option ${cv.layout === l.id ? 'selected' : ''}`} style={cv.layout === l.id ? { borderColor: cv.acento, color: cv.acento, background: `${cv.acento}10` } : {}} onClick={() => updateCv('layout', l.id)}>
                <span className="layout-name">{l.label}</span>
                <span className="layout-desc">{l.desc}</span>
              </button>
            ))}
          </div>

          {/* Photo Upload */}
          <div className="form-section-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Camera size={12} /> Foto</div>
          <div className="photo-upload-area" onClick={() => photoInputRef.current?.click()}>
            {cv.foto ? (
              <div className="photo-preview-wrapper">
                <img src={cv.foto} alt="foto" className="photo-preview-img" />
                <button className="photo-remove-btn" onClick={e => { e.stopPropagation(); updateCv('foto', null); }}>✕</button>
              </div>
            ) : (
              <div className="photo-upload-placeholder">
                <Camera size={22} color="var(--text-secondary)" />
                <span>Clique para adicionar foto</span>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', opacity: 0.7 }}>JPG ou PNG</span>
              </div>
            )}
            <input ref={photoInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handlePhotoUpload} />
          </div>

          <div className="form-section-title">Dados Pessoais</div>
          <div className="form-field"><label>Nome Completo</label><input value={cv.nome} onChange={e => updateCv('nome', e.target.value)} placeholder="Seu nome" /></div>
          <div className="form-field"><label>Cargo / Profissão</label><input value={cv.cargo} onChange={e => updateCv('cargo', e.target.value)} placeholder="Ex: Designer UX/UI" /></div>
          <div className="form-row">
            <div className="form-field"><label>E-mail</label><input value={cv.email} onChange={e => updateCv('email', e.target.value)} /></div>
            <div className="form-field"><label>Telefone</label><input value={cv.telefone} onChange={e => updateCv('telefone', e.target.value)} /></div>
          </div>
          <div className="form-row">
            <div className="form-field"><label>Cidade, UF</label><input value={cv.cidade} onChange={e => updateCv('cidade', e.target.value)} /></div>
            <div className="form-field"><label>LinkedIn</label><input value={cv.linkedin} onChange={e => updateCv('linkedin', e.target.value)} /></div>
          </div>

          <div className="form-section-title">Resumo Profissional</div>
          <div className="form-field"><textarea rows={4} value={cv.resumo} onChange={e => updateCv('resumo', e.target.value)} /></div>

          <div className="form-section-title">Cor de Destaque</div>
          <div className="color-row">
            {ACCENT_COLORS.map(c => (
              <button key={c} className={`color-swatch ${cv.acento === c ? 'selected' : ''}`} style={{ backgroundColor: c }} onClick={() => updateCv('acento', c)} />
            ))}
          </div>

          <div className="form-section-title">Experiência Profissional</div>
          {cv.experiencias.map((exp, i) => (
            <div className="repeatable-item" key={exp.id}>
              <div className="repeatable-item-header">
                <span className="repeatable-item-label">#{i + 1}</span>
                <button className="remove-item-btn" onClick={() => updateCv('experiencias', cv.experiencias.filter(x => x.id !== exp.id))}><Trash2 size={12} /> Remover</button>
              </div>
              <div className="form-field"><input placeholder="Cargo" value={exp.titulo} onChange={e => updateCv('experiencias', cv.experiencias.map(x => x.id === exp.id ? { ...x, titulo: e.target.value } : x))} /></div>
              <div className="form-row">
                <div className="form-field"><input placeholder="Empresa" value={exp.empresa} onChange={e => updateCv('experiencias', cv.experiencias.map(x => x.id === exp.id ? { ...x, empresa: e.target.value } : x))} /></div>
                <div className="form-field"><input placeholder="Período" value={exp.periodo} onChange={e => updateCv('experiencias', cv.experiencias.map(x => x.id === exp.id ? { ...x, periodo: e.target.value } : x))} /></div>
              </div>
              <div className="form-field"><textarea rows={2} placeholder="Descrição" value={exp.descricao} onChange={e => updateCv('experiencias', cv.experiencias.map(x => x.id === exp.id ? { ...x, descricao: e.target.value } : x))} /></div>
            </div>
          ))}
          <button className="add-item-btn" onClick={() => updateCv('experiencias', [...cv.experiencias, { id: uid(), titulo: '', empresa: '', periodo: '', descricao: '' }])}><Plus size={14} /> Adicionar Experiência</button>

          <div className="form-section-title">Habilidades</div>
          {cv.habilidades.map((sk) => (
            <div className="repeatable-item" key={sk.id}>
              <div className="form-row">
                <div className="form-field"><input placeholder="Habilidade" value={sk.nome} onChange={e => updateCv('habilidades', cv.habilidades.map(x => x.id === sk.id ? { ...x, nome: e.target.value } : x))} /></div>
                <div className="form-field">
                  <select value={sk.nivel} onChange={e => updateCv('habilidades', cv.habilidades.map(x => x.id === sk.id ? { ...x, nivel: Number(e.target.value) } : x))}>
                    <option value={1}>Básico</option><option value={2}>Iniciante</option>
                    <option value={3}>Intermediário</option><option value={4}>Avançado</option><option value={5}>Expert</option>
                  </select>
                </div>
              </div>
              <button className="remove-item-btn" onClick={() => updateCv('habilidades', cv.habilidades.filter(x => x.id !== sk.id))}><Trash2 size={12} /> Remover</button>
            </div>
          ))}
          <button className="add-item-btn" onClick={() => updateCv('habilidades', [...cv.habilidades, { id: uid(), nome: '', nivel: 3 }])}><Plus size={14} /> Adicionar Habilidade</button>

          <div className="form-section-title">Formação Acadêmica</div>
          {cv.educacao.map((ed) => (
            <div className="repeatable-item" key={ed.id}>
              <div className="form-field"><input placeholder="Curso" value={ed.curso} onChange={e => updateCv('educacao', cv.educacao.map(x => x.id === ed.id ? { ...x, curso: e.target.value } : x))} /></div>
              <div className="form-row">
                <div className="form-field"><input placeholder="Instituição" value={ed.instituicao} onChange={e => updateCv('educacao', cv.educacao.map(x => x.id === ed.id ? { ...x, instituicao: e.target.value } : x))} /></div>
                <div className="form-field"><input placeholder="Período" value={ed.periodo} onChange={e => updateCv('educacao', cv.educacao.map(x => x.id === ed.id ? { ...x, periodo: e.target.value } : x))} /></div>
              </div>
              <button className="remove-item-btn" onClick={() => updateCv('educacao', cv.educacao.filter(x => x.id !== ed.id))}><Trash2 size={12} /> Remover</button>
            </div>
          ))}
          <button className="add-item-btn" onClick={() => updateCv('educacao', [...cv.educacao, { id: uid(), curso: '', instituicao: '', periodo: '' }])}><Plus size={14} /> Adicionar Formação</button>

          <div className="form-section-title">Idiomas</div>
          {cv.idiomas.map((id) => (
            <div className="repeatable-item" key={id.id}>
              <div className="form-row">
                <div className="form-field"><input placeholder="Idioma" value={id.nome} onChange={e => updateCv('idiomas', cv.idiomas.map(x => x.id === id.id ? { ...x, nome: e.target.value } : x))} /></div>
                <div className="form-field">
                  <select value={id.nivel} onChange={e => updateCv('idiomas', cv.idiomas.map(x => x.id === id.id ? { ...x, nivel: e.target.value } : x))}>
                    <option>Nativo</option><option>Fluente</option><option>Avançado</option>
                    <option>Intermediário</option><option>Básico</option>
                  </select>
                </div>
              </div>
              <button className="remove-item-btn" onClick={() => updateCv('idiomas', cv.idiomas.filter(x => x.id !== id.id))}><Trash2 size={12} /> Remover</button>
            </div>
          ))}
          <button className="add-item-btn" onClick={() => updateCv('idiomas', [...cv.idiomas, { id: uid(), nome: '', nivel: 'Intermediário' }])}><Plus size={14} /> Adicionar Idioma</button>
        </div>
      </div>

      {/* PREVIEW */}
      <div className="modelo-preview-panel">
        <div className="preview-label">Preview ao vivo — {LAYOUTS.find(l => l.id === cv.layout)?.label}</div>
        <div className="doc-sheet">
          {cv.layout === 'classico' && <LayoutClassico cv={cv} />}
          {cv.layout === 'moderno' && <LayoutModerno cv={cv} />}
          {cv.layout === 'minimalista' && <LayoutMinimalista cv={cv} />}
        </div>
      </div>
    </div>
  );
}
