import { useState } from 'react';
import { ChevronLeft, Download, Plus, Trash2, Loader2 } from 'lucide-react';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

interface Experience {
  id: string;
  titulo: string;
  empresa: string;
  periodo: string;
  descricao: string;
}

interface Skill {
  id: string;
  nome: string;
  nivel: number; // 1-5
}

interface Education {
  id: string;
  curso: string;
  instituicao: string;
  periodo: string;
}

interface CvData {
  nome: string;
  cargo: string;
  email: string;
  telefone: string;
  cidade: string;
  linkedin: string;
  resumo: string;
  experiencias: Experience[];
  habilidades: Skill[];
  educacao: Education[];
  idiomas: { id: string; nome: string; nivel: string }[];
  acento: string;
}

const ACCENT_COLORS = [
  '#e11d48', '#2563eb', '#10b981', '#8b5cf6',
  '#f59e0b', '#0891b2', '#7c3aed', '#059669',
];

const uid = () => Math.random().toString(36).substr(2, 9);

export default function ModeloCurriculo({ onBack }: { onBack: () => void }) {
  const [isDownloading, setIsDownloading] = useState(false);

  const [cv, setCv] = useState<CvData>({
    nome: 'Maria Oliveira',
    cargo: 'Designer UX/UI Sênior',
    email: 'maria.oliveira@email.com',
    telefone: '(11) 99999-0000',
    cidade: 'São Paulo, SP',
    linkedin: 'linkedin.com/in/mariaoliveira',
    resumo: 'Profissional criat iva com 6 anos de experiência em design de produto, especializada em criar experiências digitais que unem estética e funcionalidade. Apaixonada por pesquisa de usuário e prototipagem.',
    acento: '#2563eb',
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
    educacao: [
      { id: uid(), curso: 'Design Gráfico', instituicao: 'FAAP – São Paulo', periodo: '2016 – 2020' },
    ],
    idiomas: [
      { id: uid(), nome: 'Português', nivel: 'Nativo' },
      { id: uid(), nome: 'Inglês', nivel: 'Avançado' },
    ],
  });

  const updateCv = (field: keyof CvData, value: any) => setCv(prev => ({ ...prev, [field]: value }));

  const getInitials = (nome: string) => nome.trim().split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase() || '?';

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      const pdfDoc = await PDFDocument.create();
      const page = pdfDoc.addPage([595, 842]); // A4
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

      // Header background
      page.drawRectangle({ x: 0, y: height - 130, width: 595, height: 130, color: rgb(0.97, 0.98, 1) });
      // Accent top bar
      page.drawRectangle({ x: 0, y: height - 4, width: 595, height: 4, color: accentRgb });

      // Name
      page.drawText(cv.nome || 'Seu Nome', { x: 40, y: height - 55, size: 22, font: bold, color: dark });
      // Role
      page.drawText(cv.cargo || 'Sua Profissão', { x: 41, y: height - 76, size: 11, font: regular, color: accentRgb });
      // Contacts
      const contacts = [cv.email, cv.telefone, cv.cidade, cv.linkedin].filter(Boolean);
      contacts.forEach((c, i) => {
        page.drawText(c, { x: 41 + (i % 2) * 250, y: height - 100 - Math.floor(i / 2) * 15, size: 8.5, font: regular, color: gray });
      });

      let y = height - 155;
      const sectionTitle = (title: string) => {
        page.drawText(title.toUpperCase(), { x: 40, y, size: 7, font: bold, color: lightGray });
        y -= 6;
        page.drawLine({ start: { x: 40, y }, end: { x: 555, y }, thickness: 1, color: rgb(0.85, 0.87, 0.9) });
        y -= 16;
      };

      // Resumo
      sectionTitle('Resumo Profissional');
      const resumoLines = wrapText(cv.resumo, 85);
      resumoLines.forEach(line => {
        page.drawText(line, { x: 40, y, size: 9, font: regular, color: gray });
        y -= 13;
      });
      y -= 10;

      // Experiências
      sectionTitle('Experiência Profissional');
      cv.experiencias.forEach(exp => {
        if (y < 60) return;
        page.drawText(exp.titulo || '-', { x: 40, y, size: 10, font: bold, color: dark });
        const period = exp.periodo || '';
        if (period) page.drawText(period, { x: 420, y, size: 8, font: regular, color: lightGray });
        y -= 14;
        if (exp.empresa) {
          page.drawText(exp.empresa, { x: 40, y, size: 9, font: regular, color: accentRgb });
          y -= 12;
        }
        if (exp.descricao) {
          const lines = wrapText(exp.descricao, 85);
          lines.forEach(line => {
            page.drawText(line, { x: 40, y, size: 8.5, font: regular, color: gray });
            y -= 12;
          });
        }
        y -= 8;
      });

      // Educação
      if (y > 100) {
        sectionTitle('Formação Acadêmica');
        cv.educacao.forEach(ed => {
          page.drawText(ed.curso || '-', { x: 40, y, size: 10, font: bold, color: dark });
          if (ed.periodo) page.drawText(ed.periodo, { x: 420, y, size: 8, font: regular, color: lightGray });
          y -= 13;
          if (ed.instituicao) {
            page.drawText(ed.instituicao, { x: 40, y, size: 8.5, font: regular, color: gray });
            y -= 16;
          }
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
          <div className="form-section-title">Dados Pessoais</div>
          <div className="form-field"><label>Nome Completo</label><input value={cv.nome} onChange={e => updateCv('nome', e.target.value)} placeholder="Seu nome" /></div>
          <div className="form-field"><label>Cargo / Profissão</label><input value={cv.cargo} onChange={e => updateCv('cargo', e.target.value)} placeholder="Ex: Designer UX/UI" /></div>
          <div className="form-row">
            <div className="form-field"><label>E-mail</label><input value={cv.email} onChange={e => updateCv('email', e.target.value)} placeholder="email@..." /></div>
            <div className="form-field"><label>Telefone</label><input value={cv.telefone} onChange={e => updateCv('telefone', e.target.value)} placeholder="(11) 99..." /></div>
          </div>
          <div className="form-row">
            <div className="form-field"><label>Cidade, UF</label><input value={cv.cidade} onChange={e => updateCv('cidade', e.target.value)} placeholder="São Paulo, SP" /></div>
            <div className="form-field"><label>LinkedIn</label><input value={cv.linkedin} onChange={e => updateCv('linkedin', e.target.value)} placeholder="linkedin.com/..." /></div>
          </div>

          <div className="form-section-title">Sobre Você</div>
          <div className="form-field"><label>Resumo Profissional</label><textarea rows={4} value={cv.resumo} onChange={e => updateCv('resumo', e.target.value)} /></div>

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
                    <option value={1}>Básico</option>
                    <option value={2}>Iniciante</option>
                    <option value={3}>Intermediário</option>
                    <option value={4}>Avançado</option>
                    <option value={5}>Expert</option>
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
                    <option>Nativo</option>
                    <option>Fluente</option>
                    <option>Avançado</option>
                    <option>Intermediário</option>
                    <option>Básico</option>
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
        <div className="preview-label">Preview ao vivo</div>
        <div className="doc-sheet">
          {/* Header */}
          <div className="cv-header" style={{ background: `linear-gradient(135deg, ${cv.acento}14 0%, ${cv.acento}05 100%)` }}>
            <div className="cv-header-accent" style={{ background: `linear-gradient(90deg, ${cv.acento}, ${cv.acento}99)` }} />
            <div className="cv-avatar" style={{ background: `linear-gradient(135deg, ${cv.acento}, ${cv.acento}cc)` }}>
              {getInitials(cv.nome)}
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
            {/* Sidebar */}
            <div className="cv-sidebar">
              {cv.habilidades.length > 0 && (
                <div className="cv-section">
                  <div className="cv-section-title" style={{ color: cv.acento, borderColor: cv.acento }}>Habilidades</div>
                  {cv.habilidades.map(sk => (
                    <div className="cv-skill-bar-row" key={sk.id}>
                      <div className="cv-skill-name">{sk.nome || '—'}</div>
                      <div className="cv-skill-bar-bg">
                        <div className="cv-skill-bar-fill" style={{ width: `${(sk.nivel / 5) * 100}%`, background: cv.acento }} />
                      </div>
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

            {/* Main */}
            <div className="cv-main">
              {cv.resumo && (
                <div className="cv-section">
                  <div className="cv-section-title" style={{ color: cv.acento, borderColor: cv.acento }}>Resumo Profissional</div>
                  <p className="cv-summary-text">{cv.resumo}</p>
                </div>
              )}
              {cv.experiencias.length > 0 && (
                <div className="cv-section">
                  <div className="cv-section-title" style={{ color: cv.acento, borderColor: cv.acento }}>Experiência Profissional</div>
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
        </div>
      </div>
    </div>
  );
}

function wrapText(text: string, maxChars: number): string[] {
  if (!text) return [];
  const words = text.split(' ');
  const lines: string[] = [];
  let current = '';
  for (const word of words) {
    if ((current + ' ' + word).trim().length <= maxChars) {
      current = (current + ' ' + word).trim();
    } else {
      if (current) lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines;
}
