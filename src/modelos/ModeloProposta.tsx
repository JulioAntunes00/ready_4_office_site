import { useState } from 'react';
import { ChevronLeft, Download, Plus, Trash2, Loader2 } from 'lucide-react';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

interface Servico {
  id: string;
  descricao: string;
  quantidade: string;
  valor: string;
}

interface PropostaData {
  empresa: string;
  cnpj: string;
  email: string;
  telefone: string;
  endereco: string;
  clienteNome: string;
  clienteEmpresa: string;
  clienteEmail: string;
  numero: string;
  data: string;
  validadeAte: string;
  intro: string;
  servicos: Servico[];
  formaPagamento: string;
  prazoExecucao: string;
  observacoes: string;
  responsavel: string;
  acento: string;
}

const ACCENT_COLORS = [
  '#2563eb', '#e11d48', '#059669', '#8b5cf6',
  '#f59e0b', '#0891b2', '#dc2626', '#0f172a',
];

const uid = () => Math.random().toString(36).substr(2, 9);

function formatCurrency(val: string) {
  const num = parseFloat(val.replace(',', '.')) || 0;
  return num.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function parseVal(v: string) {
  return parseFloat(v.replace(',', '.')) || 0;
}

export default function ModeloProposta({ onBack }: { onBack: () => void }) {
  const [isDownloading, setIsDownloading] = useState(false);

  const today = new Date();
  const todayStr = today.toLocaleDateString('pt-BR');
  const validadeStr = new Date(today.getTime() + 30 * 86400000).toLocaleDateString('pt-BR');

  const [p, setP] = useState<PropostaData>({
    empresa: 'Agência Creative',
    cnpj: '12.345.678/0001-99',
    email: 'contato@agenciacreative.com.br',
    telefone: '(11) 3000-0000',
    endereco: 'Av. Paulista, 1234 – São Paulo, SP',
    clienteNome: 'João Silva',
    clienteEmpresa: 'Empresa ABC Ltda',
    clienteEmail: 'joao.silva@empresaabc.com.br',
    numero: '2026-001',
    data: todayStr,
    validadeAte: validadeStr,
    intro: 'Prezado(a) João Silva,\n\nÉ com grande satisfação que apresentamos nossa proposta comercial para atender às necessidades da Empresa ABC Ltda. Estamos comprometidos em entregar resultados de excelência.',
    servicos: [
      { id: uid(), descricao: 'Criação de Identidade Visual', quantidade: '1', valor: '2500' },
      { id: uid(), descricao: 'Desenvolvimento Web (Landing Page)', quantidade: '1', valor: '3800' },
      { id: uid(), descricao: 'Gestão de Redes Sociais (mensal)', quantidade: '3', valor: '1200' },
    ],
    formaPagamento: '50% na assinatura do contrato e 50% na entrega do projeto.',
    prazoExecucao: '30 dias úteis após assinatura do contrato.',
    observacoes: 'Os valores apresentados são fixos e não incluem custos de terceiros (hosting, domínio, anúncios pagos).',
    responsavel: 'Carlos Mendes',
    acento: '#2563eb',
  });

  const up = (field: keyof PropostaData, value: any) => setP(prev => ({ ...prev, [field]: value }));

  const total = p.servicos.reduce((sum, s) => sum + parseVal(s.valor) * parseVal(s.quantidade), 0);
  const totalStr = total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const hex = p.acento.replace('#', '');
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

      const accentRgb = rgb(acR, acG, acB);
      const white = rgb(1, 1, 1);
      const dark = rgb(0.07, 0.09, 0.17);
      const gray = rgb(0.28, 0.34, 0.42);
      const lightGray = rgb(0.58, 0.63, 0.71);

      // Header bg
      page.drawRectangle({ x: 0, y: height - 140, width: 595, height: 140, color: accentRgb });

      page.drawText(p.empresa || 'Sua Empresa', { x: 40, y: height - 55, size: 18, font: bold, color: white });
      page.drawText(`Proposta Comercial Nº ${p.numero}`, { x: 40, y: height - 76, size: 10, font: regular, color: rgb(1, 1, 1) });

      const metaY = height - 110;
      page.drawText(`Para: ${p.clienteEmpresa}`, { x: 40, y: metaY, size: 9, font: regular, color: white });
      page.drawText(`Validade: ${p.validadeAte}`, { x: 40, y: metaY - 14, size: 9, font: regular, color: white });
      page.drawText(`Data: ${p.data}`, { x: 350, y: metaY, size: 9, font: regular, color: white });

      let y = height - 170;

      const sectionTitle = (title: string) => {
        page.drawText(title.toUpperCase(), { x: 40, y, size: 7, font: bold, color: lightGray });
        y -= 7;
        page.drawLine({ start: { x: 40, y }, end: { x: 555, y }, thickness: 0.5, color: rgb(0.85, 0.87, 0.9) });
        y -= 16;
      };

      // Intro
      sectionTitle('Apresentação');
      const introLines = wrapText(p.intro, 88);
      introLines.slice(0, 4).forEach(line => {
        page.drawText(line, { x: 40, y, size: 9, font: regular, color: gray });
        y -= 13;
      });
      y -= 10;

      // Services
      sectionTitle('Serviços Propostos');
      // Table header
      page.drawRectangle({ x: 40, y: y - 2, width: 515, height: 20, color: rgb(0.95, 0.96, 0.98) });
      page.drawText('DESCRIÇÃO', { x: 45, y: y + 3, size: 7, font: bold, color: lightGray });
      page.drawText('QTD', { x: 380, y: y + 3, size: 7, font: bold, color: lightGray });
      page.drawText('VALOR UNIT.', { x: 420, y: y + 3, size: 7, font: bold, color: lightGray });
      page.drawText('TOTAL', { x: 515, y: y + 3, size: 7, font: bold, color: lightGray });
      y -= 20;

      p.servicos.forEach(s => {
        page.drawText(s.descricao || '–', { x: 45, y, size: 9, font: regular, color: dark });
        page.drawText(s.quantidade || '1', { x: 380, y, size: 9, font: regular, color: gray });
        page.drawText(formatCurrency(s.valor), { x: 420, y, size: 9, font: regular, color: gray });
        const rowTotal = (parseVal(s.valor) * parseVal(s.quantidade)).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        page.drawText(rowTotal, { x: 515, y, size: 9, font: bold, color: dark });
        y -= 18;
        page.drawLine({ start: { x: 40, y: y + 4 }, end: { x: 555, y: y + 4 }, thickness: 0.3, color: rgb(0.9, 0.92, 0.95) });
      });

      // Total
      y -= 5;
      page.drawText('TOTAL GERAL', { x: 380, y, size: 9, font: bold, color: dark });
      page.drawText(totalStr, { x: 500, y, size: 12, font: bold, color: accentRgb });
      y -= 25;

      // Payment
      sectionTitle('Condições e Prazo');
      page.drawText(`Pagamento: ${p.formaPagamento}`, { x: 40, y, size: 9, font: regular, color: gray });
      y -= 13;
      page.drawText(`Prazo: ${p.prazoExecucao}`, { x: 40, y, size: 9, font: regular, color: gray });
      y -= 25;

      // Footer
      page.drawLine({ start: { x: 40, y }, end: { x: 555, y }, thickness: 0.5, color: rgb(0.9, 0.9, 0.9) });
      y -= 20;
      page.drawText(p.empresa, { x: 40, y, size: 8, font: bold, color: dark });
      page.drawText(`CNPJ: ${p.cnpj}`, { x: 40, y: y - 12, size: 7.5, font: regular, color: lightGray });
      // Signature area
      if (y > 60) {
        page.drawLine({ start: { x: 360, y }, end: { x: 555, y }, thickness: 0.5, color: dark });
        page.drawText(p.responsavel || 'Responsável', { x: 380, y: y - 14, size: 8.5, font: bold, color: dark });
      }

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes as any], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `proposta_${p.numero.replace(/\//g, '-')}.pdf`;
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
            <h2>Proposta Comercial</h2>
            <p>Personalize e baixe em PDF</p>
          </div>
          <button className="download-btn" onClick={handleDownload} disabled={isDownloading}>
            {isDownloading ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
            {isDownloading ? '' : 'PDF'}
          </button>
        </div>
        <div className="panel-form">
          <div className="form-section-title">Sua Empresa</div>
          <div className="form-field"><label>Nome da Empresa</label><input value={p.empresa} onChange={e => up('empresa', e.target.value)} /></div>
          <div className="form-row">
            <div className="form-field"><label>CNPJ</label><input value={p.cnpj} onChange={e => up('cnpj', e.target.value)} /></div>
            <div className="form-field"><label>Telefone</label><input value={p.telefone} onChange={e => up('telefone', e.target.value)} /></div>
          </div>
          <div className="form-field"><label>Endereço</label><input value={p.endereco} onChange={e => up('endereco', e.target.value)} /></div>

          <div className="form-section-title">Cliente</div>
          <div className="form-row">
            <div className="form-field"><label>Nome</label><input value={p.clienteNome} onChange={e => up('clienteNome', e.target.value)} /></div>
            <div className="form-field"><label>Empresa</label><input value={p.clienteEmpresa} onChange={e => up('clienteEmpresa', e.target.value)} /></div>
          </div>

          <div className="form-section-title">Proposta</div>
          <div className="form-row">
            <div className="form-field"><label>Nº Proposta</label><input value={p.numero} onChange={e => up('numero', e.target.value)} /></div>
            <div className="form-field"><label>Data</label><input value={p.data} onChange={e => up('data', e.target.value)} /></div>
          </div>
          <div className="form-field"><label>Validade até</label><input value={p.validadeAte} onChange={e => up('validadeAte', e.target.value)} /></div>
          <div className="form-field"><label>Texto de Apresentação</label><textarea rows={4} value={p.intro} onChange={e => up('intro', e.target.value)} /></div>

          <div className="form-section-title">Cor de Destaque</div>
          <div className="color-row">
            {ACCENT_COLORS.map(c => (
              <button key={c} className={`color-swatch ${p.acento === c ? 'selected' : ''}`} style={{ backgroundColor: c }} onClick={() => up('acento', c)} />
            ))}
          </div>

          <div className="form-section-title">Serviços / Itens</div>
          {p.servicos.map((s, i) => (
            <div className="repeatable-item" key={s.id}>
              <div className="repeatable-item-header">
                <span className="repeatable-item-label">Item #{i + 1}</span>
                <button className="remove-item-btn" onClick={() => up('servicos', p.servicos.filter(x => x.id !== s.id))}><Trash2 size={12} /> Remover</button>
              </div>
              <div className="form-field"><input placeholder="Descrição do serviço" value={s.descricao} onChange={e => up('servicos', p.servicos.map(x => x.id === s.id ? { ...x, descricao: e.target.value } : x))} /></div>
              <div className="form-row">
                <div className="form-field"><label>Qtd.</label><input type="number" min="1" value={s.quantidade} onChange={e => up('servicos', p.servicos.map(x => x.id === s.id ? { ...x, quantidade: e.target.value } : x))} /></div>
                <div className="form-field"><label>Valor Unit. (R$)</label><input type="number" min="0" step="0.01" value={s.valor} onChange={e => up('servicos', p.servicos.map(x => x.id === s.id ? { ...x, valor: e.target.value } : x))} /></div>
              </div>
            </div>
          ))}
          <button className="add-item-btn" onClick={() => up('servicos', [...p.servicos, { id: uid(), descricao: '', quantidade: '1', valor: '0' }])}><Plus size={14} /> Adicionar Item</button>

          <div className="form-section-title">Condições</div>
          <div className="form-field"><label>Forma de Pagamento</label><textarea rows={2} value={p.formaPagamento} onChange={e => up('formaPagamento', e.target.value)} /></div>
          <div className="form-field"><label>Prazo de Execução</label><input value={p.prazoExecucao} onChange={e => up('prazoExecucao', e.target.value)} /></div>
          <div className="form-field"><label>Observações</label><textarea rows={3} value={p.observacoes} onChange={e => up('observacoes', e.target.value)} /></div>
          <div className="form-field"><label>Responsável / Assinatura</label><input value={p.responsavel} onChange={e => up('responsavel', e.target.value)} /></div>
        </div>
      </div>

      {/* PREVIEW */}
      <div className="modelo-preview-panel">
        <div className="preview-label">Preview ao vivo</div>
        <div className="doc-sheet">
          <div className="proposta-header" style={{ background: `linear-gradient(135deg, ${p.acento}, ${p.acento}cc)` }}>
            <div className="proposta-empresa-nome">{p.empresa || 'Sua Empresa'}</div>
            <div className="proposta-titulo">Proposta Comercial — Nº {p.numero}</div>
            <div className="proposta-meta">
              <div className="proposta-meta-item"><span className="proposta-meta-label">Para</span><span className="proposta-meta-value">{p.clienteEmpresa || '—'}</span></div>
              <div className="proposta-meta-item"><span className="proposta-meta-label">Data</span><span className="proposta-meta-value">{p.data}</span></div>
              <div className="proposta-meta-item"><span className="proposta-meta-label">Válido até</span><span className="proposta-meta-value">{p.validadeAte}</span></div>
            </div>
          </div>

          <div className="proposta-body">
            <div className="proposta-section">
              <div className="proposta-section-title">Apresentação</div>
              <p className="proposta-intro-text" style={{ whiteSpace: 'pre-wrap' }}>{p.intro}</p>
            </div>

            <div className="proposta-section">
              <div className="proposta-section-title">Serviços Propostos</div>
              <table className="proposta-services-table">
                <thead>
                  <tr>
                    <th>Descrição</th>
                    <th style={{ textAlign: 'center' }}>Qtd.</th>
                    <th className="amount-col">Val. Unit.</th>
                    <th className="amount-col">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {p.servicos.map(s => (
                    <tr key={s.id}>
                      <td>{s.descricao || '—'}</td>
                      <td style={{ textAlign: 'center' }}>{s.quantidade}</td>
                      <td className="amount-col">{formatCurrency(s.valor)}</td>
                      <td className="amount-col" style={{ fontWeight: 700 }}>{(parseVal(s.valor) * parseVal(s.quantidade)).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="proposta-total-row">
                <span className="proposta-total-label">TOTAL GERAL</span>
                <span className="proposta-total-value" style={{ color: p.acento }}>{totalStr}</span>
              </div>
            </div>

            {(p.formaPagamento || p.prazoExecucao) && (
              <div className="proposta-section">
                <div className="proposta-section-title">Condições Comerciais</div>
                {p.formaPagamento && <p className="proposta-terms-text"><strong>Pagamento:</strong> {p.formaPagamento}</p>}
                {p.prazoExecucao && <p className="proposta-terms-text" style={{ marginTop: '0.5rem' }}><strong>Prazo:</strong> {p.prazoExecucao}</p>}
                {p.observacoes && <p className="proposta-terms-text" style={{ marginTop: '0.5rem', fontStyle: 'italic' }}>{p.observacoes}</p>}
              </div>
            )}
          </div>

          <div className="proposta-footer">
            <div className="proposta-footer-info">
              <strong>{p.empresa}</strong><br />
              CNPJ: {p.cnpj}<br />
              {p.email} | {p.telefone}
            </div>
            <div className="proposta-sign-area">
              <div className="proposta-sign-line" />
              <div className="proposta-sign-name">{p.responsavel || 'Responsável'}</div>
              <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{p.empresa}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function wrapText(text: string, maxChars: number): string[] {
  if (!text) return [];
  const words = text.split(/\s+/);
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
