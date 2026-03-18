import { useState } from 'react';
import { ChevronLeft, Download, Loader2 } from 'lucide-react';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

interface CartaData {
  remetente: string;
  cargo: string;
  empresa: string;
  email: string;
  telefone: string;
  cidade: string;
  data: string;
  destinatarioEmpresa: string;
  destinatarioAtt: string;
  assunto: string;
  saudacao: string;
  corpo: string;
  despedida: string;
  assinante: string;
  cargoAssinante: string;
  tipo: 'carta' | 'declaracao';
  acento: string;
}

const ACCENT_COLORS = [
  '#0f172a', '#2563eb', '#059669', '#7c3aed',
  '#e11d48', '#0891b2', '#f59e0b', '#64748b',
];

const TIPOS = [
  { id: 'carta', label: 'Carta Formal' },
  { id: 'declaracao', label: 'Declaração' },
];

export default function ModeloCarta({ onBack }: { onBack: () => void }) {
  const [isDownloading, setIsDownloading] = useState(false);

  const today = new Date().toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' });

  const [d, setD] = useState<CartaData>({
    remetente: 'Carlos Mendes',
    cargo: 'Diretor Comercial',
    empresa: 'Empresa XYZ Ltda',
    email: 'carlos@empresaxyz.com.br',
    telefone: '(11) 98765-4321',
    cidade: 'São Paulo',
    data: today,
    destinatarioEmpresa: 'Empresa ABC S.A.',
    destinatarioAtt: 'Att.: Dra. Ana Paula Ferreira',
    assunto: 'Proposta de Parceria Estratégica',
    saudacao: 'Senhor(a),',
    corpo: `Através deste documento, venho apresentar nossa empresa com a finalidade de estabelecer uma parceria comercial mutuamente benéfica.\n\nA Empresa XYZ Ltda atua há mais de 10 anos no mercado de tecnologia, oferecendo soluções inovadoras para gestão empresarial. Nossa missão é transformar processos, aumentar a produtividade e gerar valor real para nossos parceiros.\n\nAcreditamos que uma colaboração com a Empresa ABC S.A. representaria uma oportunidade única de crescimento para ambas as organizações. Estamos à disposição para uma reunião de apresentação em data e horário de sua conveniência.`,
    despedida: 'Atenciosamente,',
    assinante: 'Carlos Mendes',
    cargoAssinante: 'Diretor Comercial — Empresa XYZ Ltda',
    tipo: 'carta',
    acento: '#0f172a',
  });

  const up = (field: keyof CartaData, val: any) => setD(prev => ({ ...prev, [field]: val }));

  const hex = d.acento.replace('#', '');
  const acR = parseInt(hex.substr(0, 2), 16) / 255;
  const acG = parseInt(hex.substr(2, 2), 16) / 255;
  const acB = parseInt(hex.substr(4, 2), 16) / 255;

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      const pdfDoc = await PDFDocument.create();
      const page = pdfDoc.addPage([595, 842]);
      const { height } = page.getSize();
      const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      const regular = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const italic = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);

      const accentRgb = rgb(acR, acG, acB);
      const dark = rgb(0.07, 0.09, 0.17);
      const gray = rgb(0.28, 0.34, 0.42);
      const lightGray = rgb(0.58, 0.63, 0.71);

      // Accent left bar
      page.drawRectangle({ x: 0, y: 0, width: 5, height, color: accentRgb });

      let y = height - 55;

      // Remetente (top right)
      const remLines = [d.remetente, d.cargo, d.empresa, d.email, d.telefone].filter(Boolean);
      remLines.forEach((l, i) => {
        page.drawText(l, {
          x: 595 - 200,
          y: y - i * 12,
          size: i === 0 ? 9.5 : 8,
          font: i === 0 ? bold : regular,
          color: i === 0 ? dark : lightGray,
        });
      });

      // Logo/Brand top-left
      page.drawText(d.empresa || 'Empresa', { x: 45, y, size: 14, font: bold, color: accentRgb });
      y -= 18;
      page.drawLine({ start: { x: 45, y }, end: { x: 200, y }, thickness: 1, color: accentRgb });
      y -= 30;

      // Data e local
      page.drawText(`${d.cidade}, ${d.data}`, { x: 45, y, size: 9, font: italic, color: gray });
      y -= 30;

      // Destinatário
      if (d.destinatarioEmpresa) {
        page.drawText(d.destinatarioEmpresa, { x: 45, y, size: 10, font: bold, color: dark });
        y -= 14;
      }
      if (d.destinatarioAtt) {
        page.drawText(d.destinatarioAtt, { x: 45, y, size: 9, font: regular, color: gray });
        y -= 25;
      }

      // Assunto
      if (d.assunto) {
        page.drawText(`Assunto: ${d.assunto}`, { x: 45, y, size: 9, font: bold, color: dark });
        y -= 25;
      }

      // Saudação
      page.drawText(d.saudacao || 'Prezado(a),', { x: 45, y, size: 10, font: bold, color: dark });
      y -= 20;

      // Corpo
      const bodyLines = wrapText(d.corpo, 82);
      bodyLines.forEach(line => {
        if (y < 80) return;
        page.drawText(line, { x: 45, y, size: 9.5, font: regular, color: gray });
        y -= 14;
      });
      y -= 20;

      // Despedida
      page.drawText(d.despedida || 'Atenciosamente,', { x: 45, y, size: 9.5, font: regular, color: dark });
      y -= 50;

      // Signature line
      page.drawLine({ start: { x: 45, y }, end: { x: 250, y }, thickness: 0.7, color: dark });
      y -= 14;
      page.drawText(d.assinante || d.remetente, { x: 45, y, size: 10, font: bold, color: dark });
      if (d.cargoAssinante) {
        y -= 13;
        page.drawText(d.cargoAssinante, { x: 45, y, size: 8.5, font: regular, color: lightGray });
      }

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes as any], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${d.tipo}_${d.remetente.replace(/\s+/g, '_')}.pdf`;
      a.click();
    } catch (e) {
      alert('Erro ao gerar PDF.');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="modelo-editor-shell fade-in">
      <div className="modelo-editor-panel">
        <div className="panel-header">
          <button className="panel-back-btn" onClick={onBack}><ChevronLeft size={20} /></button>
          <div className="panel-title-group">
            <h2>Carta / Declaração</h2>
            <p>Personalize e baixe em PDF</p>
          </div>
          <button className="download-btn" onClick={handleDownload} disabled={isDownloading}>
            {isDownloading ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
            {isDownloading ? '' : 'PDF'}
          </button>
        </div>
        <div className="panel-form">
          <div className="form-section-title">Tipo de Documento</div>
          <div className="form-field">
            <select value={d.tipo} onChange={e => up('tipo', e.target.value as any)}>
              {TIPOS.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
            </select>
          </div>

          <div className="form-section-title">Remetente</div>
          <div className="form-field"><label>Nome</label><input value={d.remetente} onChange={e => up('remetente', e.target.value)} /></div>
          <div className="form-row">
            <div className="form-field"><label>Cargo</label><input value={d.cargo} onChange={e => up('cargo', e.target.value)} /></div>
            <div className="form-field"><label>Empresa</label><input value={d.empresa} onChange={e => up('empresa', e.target.value)} /></div>
          </div>
          <div className="form-row">
            <div className="form-field"><label>E-mail</label><input value={d.email} onChange={e => up('email', e.target.value)} /></div>
            <div className="form-field"><label>Telefone</label><input value={d.telefone} onChange={e => up('telefone', e.target.value)} /></div>
          </div>
          <div className="form-row">
            <div className="form-field"><label>Cidade</label><input value={d.cidade} onChange={e => up('cidade', e.target.value)} /></div>
            <div className="form-field"><label>Data</label><input value={d.data} onChange={e => up('data', e.target.value)} /></div>
          </div>

          <div className="form-section-title">Destinatário</div>
          <div className="form-field"><label>Empresa / Órgão</label><input value={d.destinatarioEmpresa} onChange={e => up('destinatarioEmpresa', e.target.value)} /></div>
          <div className="form-field"><label>Att. / A/C</label><input value={d.destinatarioAtt} onChange={e => up('destinatarioAtt', e.target.value)} /></div>

          <div className="form-section-title">Conteúdo</div>
          <div className="form-field"><label>Assunto</label><input value={d.assunto} onChange={e => up('assunto', e.target.value)} /></div>
          <div className="form-field"><label>Saudação</label><input value={d.saudacao} onChange={e => up('saudacao', e.target.value)} /></div>
          <div className="form-field"><label>Corpo da Carta</label><textarea rows={8} value={d.corpo} onChange={e => up('corpo', e.target.value)} /></div>
          <div className="form-field"><label>Despedida</label><input value={d.despedida} onChange={e => up('despedida', e.target.value)} /></div>

          <div className="form-section-title">Assinatura</div>
          <div className="form-field"><label>Nome do Assinante</label><input value={d.assinante} onChange={e => up('assinante', e.target.value)} /></div>
          <div className="form-field"><label>Cargo / Empresa</label><input value={d.cargoAssinante} onChange={e => up('cargoAssinante', e.target.value)} /></div>

          <div className="form-section-title">Cor de Destaque</div>
          <div className="color-row">
            {ACCENT_COLORS.map(c => (
              <button key={c} className={`color-swatch ${d.acento === c ? 'selected' : ''}`} style={{ backgroundColor: c }} onClick={() => up('acento', c)} />
            ))}
          </div>
        </div>
      </div>

      {/* PREVIEW */}
      <div className="modelo-preview-panel">
        <div className="preview-label">Preview ao vivo</div>
        <div className="doc-sheet">
          <div style={{ display: 'flex', height: '100%' }}>
            {/* Accent left bar */}
            <div style={{ width: '5px', background: d.acento, flexShrink: 0, borderRadius: '0 0 0 4px' }} />

            <div className="carta-shell" style={{ flex: 1 }}>
              <div className="carta-header">
                <div>
                  <div className="carta-remetente-nome" style={{ color: d.acento }}>{d.empresa || d.remetente || 'Sua Empresa'}</div>
                  <div className="carta-remetente-info">
                    {d.remetente && <span>{d.remetente}{d.cargo ? ` — ${d.cargo}` : ''}<br /></span>}
                    {d.email && <span>{d.email}<br /></span>}
                    {d.telefone && <span>{d.telefone}</span>}
                  </div>
                </div>
                <div className="carta-data-local">
                  {d.cidade}<br />
                  {d.data}
                </div>
              </div>

              <div className="carta-divisor" style={{ background: `linear-gradient(90deg, ${d.acento}, transparent)` }} />

              {d.assunto && (
                <div className="carta-assunto">
                  <span>Assunto: </span>{d.assunto}
                </div>
              )}

              {(d.destinatarioEmpresa || d.destinatarioAtt) && (
                <div className="carta-destinatario">
                  {d.destinatarioEmpresa && <div className="carta-dest-empresa">{d.destinatarioEmpresa}</div>}
                  {d.destinatarioAtt && <div className="carta-dest-att">{d.destinatarioAtt}</div>}
                </div>
              )}

              <div className="carta-saudacao">{d.saudacao}</div>
              <div className="carta-corpo">{d.corpo}</div>
              <div className="carta-despedida">{d.despedida}</div>

              <div className="carta-assinatura">
                <div className="carta-sign-line" style={{ borderColor: d.acento }} />
                <div className="carta-sign-nome">{d.assinante || d.remetente || '—'}</div>
                {d.cargoAssinante && <div className="carta-sign-cargo">{d.cargoAssinante}</div>}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function wrapText(text: string, maxChars: number): string[] {
  if (!text) return [];
  const lines: string[] = [];
  text.split('\n').forEach(paragraph => {
    if (!paragraph.trim()) { lines.push(''); return; }
    const words = paragraph.split(/\s+/);
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
  });
  return lines;
}
