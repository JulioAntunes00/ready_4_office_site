import { useState } from 'react';
import { ChevronLeft, Download, Plus, Trash2, Loader2, Receipt, Printer } from 'lucide-react';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

interface ItemRecibo {
  id: string;
  descricao: string;
  quantidade: string;
  unidade: string;
  valorUnit: string;
}

interface ReciboData {
  numero: string;
  data: string;
  tipo: 'recibo' | 'nota';
  prestadorNome: string;
  prestadorCpfCnpj: string;
  prestadorEndereco: string;
  prestadorEmail: string;
  prestadorTelefone: string;
  clienteNome: string;
  clienteCpfCnpj: string;
  clienteEndereco: string;
  itens: ItemRecibo[];
  desconto: string;
  formaPagamento: string;
  dataPagamento: string;
  observacoes: string;
  acento: string;
}

const ACCENT_COLORS = [
  '#059669', '#2563eb', '#e11d48', '#8b5cf6',
  '#f59e0b', '#0891b2', '#0f172a', '#7c3aed',
];

const uid = () => Math.random().toString(36).substr(2, 9);

function fmt(v: string) {
  const n = parseFloat(v?.replace(',', '.')) || 0;
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}
function parseVal(v: string) { return parseFloat(v?.replace(',', '.')) || 0; }

export default function ModeloRecibo({ onBack }: { onBack: () => void }) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [layoutPb, setLayoutPb] = useState(false);

  const today = new Date().toLocaleDateString('pt-BR');
  const [r, setR] = useState<ReciboData>({
    numero: `REC-${String(new Date().getFullYear())}-001`,
    data: today,
    tipo: 'recibo',
    prestadorNome: 'João da Silva',
    prestadorCpfCnpj: '123.456.789-00',
    prestadorEndereco: 'Rua das Flores, 100 – São Paulo, SP',
    prestadorEmail: 'joao.silva@email.com',
    prestadorTelefone: '(11) 99999-0000',
    clienteNome: 'Empresa ABC Ltda',
    clienteCpfCnpj: '12.345.678/0001-99',
    clienteEndereco: 'Av. Paulista, 1000 – São Paulo, SP',
    itens: [
      { id: uid(), descricao: 'Desenvolvimento de Website', quantidade: '1', unidade: 'un', valorUnit: '3500' },
      { id: uid(), descricao: 'Manutenção Mensal', quantidade: '2', unidade: 'mês', valorUnit: '800' },
    ],
    desconto: '0',
    formaPagamento: 'Transferência bancária (PIX)',
    dataPagamento: today,
    observacoes: 'Pagamento recebido em sua totalidade. Obrigado pela confiança!',
    acento: '#059669',
  });

  const up = (f: keyof ReciboData, v: any) => setR(prev => ({ ...prev, [f]: v }));
  const upItem = (id: string, f: keyof ItemRecibo, v: string) =>
    setR(prev => ({ ...prev, itens: prev.itens.map(i => i.id === id ? { ...i, [f]: v } : i) }));

  const subtotal = r.itens.reduce((s, i) => s + parseVal(i.valorUnit) * parseVal(i.quantidade), 0);
  const desc = parseVal(r.desconto);
  const total = subtotal - desc;

  const hex = r.acento.replace('#', '');
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

      const ac = layoutPb ? rgb(0, 0, 0) : rgb(acR, acG, acB);
      const dark = rgb(0.07, 0.09, 0.17);
      const gray = rgb(0.28, 0.34, 0.42);
      const light = rgb(0.88, 0.9, 0.93);
      const white = rgb(1, 1, 1);

      const titleLabel = r.tipo === 'recibo' ? 'RECIBO DE PAGAMENTO' : 'NOTA DE SERVIÇO';

      if (layoutPb) {
        // Minimalist B&W header
        page.drawText(titleLabel, { x: 40, y: height - 45, size: 18, font: bold, color: dark });
        page.drawText(`Nº ${r.numero}`, { x: 40, y: height - 63, size: 10, font: regular, color: gray });
        page.drawText(`Data: ${r.data}`, { x: 430, y: height - 45, size: 9, font: regular, color: dark });
        page.drawText(`Pgto: ${r.dataPagamento}`, { x: 430, y: height - 59, size: 9, font: regular, color: gray });
        page.drawLine({ start: { x: 40, y: height - 75 }, end: { x: 555, y: height - 75 }, thickness: 1, color: dark });
      } else {
        // Original colored header
        page.drawRectangle({ x: 0, y: height - 100, width: 595, height: 100, color: ac });
        page.drawText(titleLabel, { x: 40, y: height - 45, size: 18, font: bold, color: white });
        page.drawText(`Nº ${r.numero}`, { x: 40, y: height - 65, size: 10, font: regular, color: white });
        page.drawText(`Data: ${r.data}`, { x: 430, y: height - 45, size: 9, font: regular, color: white });
        page.drawText(`Pgto: ${r.dataPagamento}`, { x: 430, y: height - 59, size: 9, font: regular, color: white });
      }

      let y = layoutPb ? height - 100 : height - 130;

      const sectionColor = layoutPb ? gray : ac;

      // Parties section
      page.drawText('PRESTADOR DE SERVIÇOS', { x: 40, y, size: 7, font: bold, color: sectionColor });
      y -= 6;
      page.drawLine({ start: { x: 40, y }, end: { x: 280, y }, thickness: 0.7, color: light });
      y -= 14;
      page.drawText(r.prestadorNome, { x: 40, y, size: 10, font: bold, color: dark });
      y -= 13;
      if (r.prestadorCpfCnpj) { page.drawText(`CPF/CNPJ: ${r.prestadorCpfCnpj}`, { x: 40, y, size: 8.5, font: regular, color: gray }); y -= 12; }
      if (r.prestadorEndereco) { page.drawText(r.prestadorEndereco, { x: 40, y, size: 8.5, font: regular, color: gray }); y -= 12; }
      if (r.prestadorEmail) { page.drawText(`${r.prestadorEmail} | ${r.prestadorTelefone}`, { x: 40, y, size: 8.5, font: regular, color: gray }); y -= 12; }

      y -= 10;
      page.drawText('TOMADOR DE SERVIÇOS (CLIENTE)', { x: 40, y, size: 7, font: bold, color: sectionColor });
      y -= 6;
      page.drawLine({ start: { x: 40, y }, end: { x: 555, y }, thickness: 0.7, color: light });
      y -= 14;
      page.drawText(r.clienteNome, { x: 40, y, size: 10, font: bold, color: dark });
      y -= 13;
      if (r.clienteCpfCnpj) { page.drawText(`CPF/CNPJ: ${r.clienteCpfCnpj}`, { x: 40, y, size: 8.5, font: regular, color: gray }); y -= 12; }
      if (r.clienteEndereco) { page.drawText(r.clienteEndereco, { x: 40, y, size: 8.5, font: regular, color: gray }); y -= 12; }

      y -= 15;
      page.drawText('SERVIÇOS / ITENS', { x: 40, y, size: 7, font: bold, color: sectionColor });
      y -= 6;
      page.drawLine({ start: { x: 40, y }, end: { x: 555, y }, thickness: 0.7, color: light });
      y -= 5;
      if (!layoutPb) {
        page.drawRectangle({ x: 40, y: y - 4, width: 515, height: 20, color: rgb(0.95, 0.97, 0.99) });
      }
      page.drawText('DESCRIÇÃO', { x: 45, y: y + 3, size: 7, font: bold, color: gray });
      page.drawText('QTD', { x: 330, y: y + 3, size: 7, font: bold, color: gray });
      page.drawText('UNID.', { x: 370, y: y + 3, size: 7, font: bold, color: gray });
      page.drawText('UNIT.', { x: 430, y: y + 3, size: 7, font: bold, color: gray });
      page.drawText('TOTAL', { x: 510, y: y + 3, size: 7, font: bold, color: gray });
      y -= 22;

      r.itens.forEach(item => {
        if (y < 80) return;
        page.drawText(item.descricao || '–', { x: 45, y, size: 9, font: regular, color: dark });
        page.drawText(item.quantidade, { x: 335, y, size: 9, font: regular, color: gray });
        page.drawText(item.unidade, { x: 375, y, size: 9, font: regular, color: gray });
        page.drawText(fmt(item.valorUnit), { x: 415, y, size: 9, font: regular, color: gray });
        const rowT = (parseVal(item.valorUnit) * parseVal(item.quantidade)).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        page.drawText(rowT, { x: 495, y, size: 9, font: bold, color: dark });
        y -= 16;
        page.drawLine({ start: { x: 40, y: y + 2 }, end: { x: 555, y: y + 2 }, thickness: 0.3, color: rgb(0.93, 0.94, 0.96) });
      });

      y -= 8;
      if (desc > 0) {
        page.drawText('Subtotal:', { x: 380, y, size: 9, font: regular, color: gray });
        page.drawText(subtotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }), { x: 495, y, size: 9, font: regular, color: gray });
        y -= 14;
        page.drawText('Desconto:', { x: 380, y, size: 9, font: regular, color: gray });
        page.drawText(`– ${fmt(r.desconto)}`, { x: 495, y, size: 9, font: regular, color: rgb(0.9, 0.2, 0.2) });
        y -= 14;
      }
      page.drawLine({ start: { x: 380, y }, end: { x: 555, y }, thickness: 0.5, color: light });
      y -= 4;
      page.drawText('TOTAL PAGO:', { x: 380, y, size: 10, font: bold, color: dark });
      page.drawText(total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }), { x: 470, y, size: 13, font: bold, color: layoutPb ? dark : ac });
      y -= 25;

      page.drawText(`Forma de Pagamento: ${r.formaPagamento}`, { x: 40, y, size: 9, font: regular, color: gray });
      if (r.observacoes) {
        y -= 14;
        page.drawText(r.observacoes, { x: 40, y, size: 8.5, font: regular, color: gray });
      }

      // Declaratory text
      y -= 30;
      const declText = `Declaro que recebi de ${r.clienteNome} a importância de ${total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} referente aos serviços descritos.`;
      const words = declText.split(' ');
      let line = ''; const maxC = 90;
      for (const w of words) {
        if ((line + ' ' + w).trim().length <= maxC) line = (line + ' ' + w).trim();
        else { page.drawText(line, { x: 40, y, size: 8.5, font: regular, color: gray }); y -= 12; line = w; }
      }
      if (line) { page.drawText(line, { x: 40, y, size: 8.5, font: regular, color: gray }); y -= 12; }

      // Signature
      y -= 30;
      page.drawLine({ start: { x: 40, y }, end: { x: 260, y }, thickness: 0.7, color: dark });
      y -= 14;
      page.drawText(r.prestadorNome, { x: 40, y, size: 9, font: bold, color: dark });
      y -= 12;
      page.drawText(`CPF/CNPJ: ${r.prestadorCpfCnpj}`, { x: 40, y, size: 8, font: regular, color: gray });

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes as any], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${r.tipo}_${r.numero.replace(/[^a-z0-9]/gi, '_')}.pdf`;
      a.click();
    } catch (e) { alert('Erro ao gerar PDF.'); }
    finally { setIsDownloading(false); }
  };

  return (
    <div className="modelo-editor-shell fade-in">
      {/* PANEL */}
      <div className="modelo-editor-panel">
        <div className="panel-header">
          <button className="panel-back-btn" onClick={onBack}><ChevronLeft size={20} /></button>
          <div className="panel-title-group">
            <h2>{r.tipo === 'recibo' ? 'Recibo de Pagamento' : 'Nota de Serviço'}</h2>
            <p>Personalize e baixe em PDF</p>
          </div>
          <button className="download-btn" onClick={handleDownload} disabled={isDownloading}>
            {isDownloading ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
            {isDownloading ? '' : 'PDF'}
          </button>
        </div>
        <div className="panel-form">
          {/* Layout P&B Toggle */}
          <div className="form-section-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Printer size={12} /> Modo de Impressão</div>
          <div className="layout-picker" style={{ gridTemplateColumns: '1fr 1fr' }}>
            <button className={`layout-option ${!layoutPb ? 'selected' : ''}`} style={!layoutPb ? { borderColor: r.acento, color: r.acento, background: `${r.acento}10` } : {}} onClick={() => setLayoutPb(false)}>
              <span className="layout-name">Colorido</span>
              <span className="layout-desc">Header com cor</span>
            </button>
            <button className={`layout-option ${layoutPb ? 'selected' : ''}`} style={layoutPb ? { borderColor: '#0f172a', color: '#0f172a', background: '#f1f5f9' } : {}} onClick={() => setLayoutPb(true)}>
              <span className="layout-name">Preto & Branco</span>
              <span className="layout-desc">Econômico p/ impressão</span>
            </button>
          </div>

          <div className="form-section-title">Tipo de Documento</div>
          <div className="form-field">
            <select value={r.tipo} onChange={e => up('tipo', e.target.value as any)}>
              <option value="recibo">Recibo de Pagamento</option>
              <option value="nota">Nota de Serviço</option>
            </select>
          </div>

          <div className="form-section-title">Identificação</div>
          <div className="form-row">
            <div className="form-field"><label>Número</label><input value={r.numero} onChange={e => up('numero', e.target.value)} /></div>
            <div className="form-field"><label>Data</label><input value={r.data} onChange={e => up('data', e.target.value)} /></div>
          </div>

          {!layoutPb && (
            <>
              <div className="form-section-title">Cor de Destaque</div>
              <div className="color-row">
                {ACCENT_COLORS.map(c => (
                  <button key={c} className={`color-swatch ${r.acento === c ? 'selected' : ''}`} style={{ backgroundColor: c }} onClick={() => up('acento', c)} />
                ))}
              </div>
            </>
          )}

          <div className="form-section-title">Prestador de Serviços (Você)</div>
          <div className="form-field"><label>Nome / Razão Social</label><input value={r.prestadorNome} onChange={e => up('prestadorNome', e.target.value)} /></div>
          <div className="form-field"><label>CPF / CNPJ</label><input value={r.prestadorCpfCnpj} onChange={e => up('prestadorCpfCnpj', e.target.value)} /></div>
          <div className="form-field"><label>Endereço</label><input value={r.prestadorEndereco} onChange={e => up('prestadorEndereco', e.target.value)} /></div>
          <div className="form-row">
            <div className="form-field"><label>E-mail</label><input value={r.prestadorEmail} onChange={e => up('prestadorEmail', e.target.value)} /></div>
            <div className="form-field"><label>Telefone</label><input value={r.prestadorTelefone} onChange={e => up('prestadorTelefone', e.target.value)} /></div>
          </div>

          <div className="form-section-title">Cliente / Tomador</div>
          <div className="form-field"><label>Nome / Razão Social</label><input value={r.clienteNome} onChange={e => up('clienteNome', e.target.value)} /></div>
          <div className="form-field"><label>CPF / CNPJ</label><input value={r.clienteCpfCnpj} onChange={e => up('clienteCpfCnpj', e.target.value)} /></div>
          <div className="form-field"><label>Endereço</label><input value={r.clienteEndereco} onChange={e => up('clienteEndereco', e.target.value)} /></div>

          <div className="form-section-title">Serviços / Itens</div>
          {r.itens.map((item, i) => (
            <div className="repeatable-item" key={item.id}>
              <div className="repeatable-item-header">
                <span className="repeatable-item-label">Item #{i + 1}</span>
                <button className="remove-item-btn" onClick={() => setR(p => ({ ...p, itens: p.itens.filter(x => x.id !== item.id) }))}><Trash2 size={12} /> Remover</button>
              </div>
              <div className="form-field"><input placeholder="Descrição do serviço" value={item.descricao} onChange={e => upItem(item.id, 'descricao', e.target.value)} /></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem' }}>
                <div className="form-field"><label>Qtd.</label><input type="number" min="1" value={item.quantidade} onChange={e => upItem(item.id, 'quantidade', e.target.value)} /></div>
                <div className="form-field"><label>Unid.</label><input value={item.unidade} onChange={e => upItem(item.id, 'unidade', e.target.value)} placeholder="un/h/mês" /></div>
                <div className="form-field"><label>Valor Unit.</label><input type="number" min="0" step="0.01" value={item.valorUnit} onChange={e => upItem(item.id, 'valorUnit', e.target.value)} /></div>
              </div>
            </div>
          ))}
          <button className="add-item-btn" onClick={() => setR(p => ({ ...p, itens: [...p.itens, { id: uid(), descricao: '', quantidade: '1', unidade: 'un', valorUnit: '0' }] }))}><Plus size={14} /> Adicionar Item</button>

          <div className="form-section-title">Pagamento</div>
          <div className="form-field"><label>Desconto (R$)</label><input type="number" min="0" step="0.01" value={r.desconto} onChange={e => up('desconto', e.target.value)} /></div>
          <div className="form-field"><label>Forma de Pagamento</label><input value={r.formaPagamento} onChange={e => up('formaPagamento', e.target.value)} /></div>
          <div className="form-field"><label>Data do Pagamento</label><input value={r.dataPagamento} onChange={e => up('dataPagamento', e.target.value)} /></div>
          <div className="form-field"><label>Observações</label><textarea rows={3} value={r.observacoes} onChange={e => up('observacoes', e.target.value)} /></div>
        </div>
      </div>

      {/* MOBILE PREVIEW HANDLE */}
      <div className="mobile-preview-handle">
        <div className="preview-handle-bar" />
        <div className="preview-handle-dots">
          <span /><span /><span /><span /><span /><span />
        </div>
        <div className="preview-handle-label">
          <span className="preview-handle-chevron">↓</span>
          Arraste para ver o preview
          <span className="preview-handle-chevron">↓</span>
        </div>
      </div>

      {/* PREVIEW */}
      <div className="modelo-preview-panel">
        <div className="preview-label">Preview ao vivo{layoutPb ? ' — Preto & Branco' : ''}</div>
        <div className="doc-sheet">
          {layoutPb ? (
            <>
              {/* B&W Header */}
              <div style={{ padding: '1.8rem 2rem', borderBottom: '2px solid #0f172a' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.3rem' }}>
                      <span style={{ fontSize: '1.2rem', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.3px' }}>
                        {r.tipo === 'recibo' ? 'RECIBO DE PAGAMENTO' : 'NOTA DE SERVIÇO'}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#475569', fontWeight: 600 }}>Nº {r.numero}</div>
                  </div>
                  <div style={{ textAlign: 'right', color: '#334155', fontSize: '0.78rem' }}>
                    <div><strong>Data:</strong> {r.data}</div>
                    <div><strong>Pgto:</strong> {r.dataPagamento}</div>
                  </div>
                </div>
              </div>

              {/* B&W Body */}
              <div style={{ padding: '1.5rem 2rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                  <div>
                    <div className="proposta-section-title" style={{ color: '#334155' }}>Prestador</div>
                    <div style={{ fontWeight: 800, fontSize: '0.9rem', color: '#0f172a' }}>{r.prestadorNome || '—'}</div>
                    {r.prestadorCpfCnpj && <div style={{ fontSize: '0.75rem', color: '#64748b' }}>CPF/CNPJ: {r.prestadorCpfCnpj}</div>}
                    {r.prestadorEndereco && <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{r.prestadorEndereco}</div>}
                    {r.prestadorEmail && <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{r.prestadorEmail}</div>}
                  </div>
                  <div>
                    <div className="proposta-section-title" style={{ color: '#334155' }}>Cliente</div>
                    <div style={{ fontWeight: 800, fontSize: '0.9rem', color: '#0f172a' }}>{r.clienteNome || '—'}</div>
                    {r.clienteCpfCnpj && <div style={{ fontSize: '0.75rem', color: '#64748b' }}>CPF/CNPJ: {r.clienteCpfCnpj}</div>}
                    {r.clienteEndereco && <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{r.clienteEndereco}</div>}
                  </div>
                </div>

                <div className="proposta-section-title" style={{ color: '#334155' }}>Serviços / Itens</div>
                <table className="proposta-services-table" style={{ marginBottom: 0 }}>
                  <thead>
                    <tr>
                      <th>Descrição</th>
                      <th>Qtd.</th>
                      <th>Unid.</th>
                      <th className="amount-col">Valor Unit.</th>
                      <th className="amount-col">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {r.itens.map(item => (
                      <tr key={item.id}>
                        <td>{item.descricao || '—'}</td>
                        <td style={{ textAlign: 'center' }}>{item.quantidade}</td>
                        <td style={{ textAlign: 'center' }}>{item.unidade}</td>
                        <td className="amount-col">{fmt(item.valorUnit)}</td>
                        <td className="amount-col" style={{ fontWeight: 700 }}>
                          {(parseVal(item.valorUnit) * parseVal(item.quantidade)).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div style={{ borderTop: '2px solid #cbd5e1', padding: '0.75rem 0', textAlign: 'right' }}>
                  {desc > 0 && (
                    <div style={{ fontSize: '0.82rem', color: '#64748b', marginBottom: '0.3rem' }}>
                      Subtotal: {subtotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} &nbsp;|&nbsp;
                      Desconto: <span style={{ color: '#334155' }}>– {fmt(r.desconto)}</span>
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'baseline', gap: '1rem' }}>
                    <span style={{ fontWeight: 800, color: '#475569', fontSize: '0.85rem' }}>TOTAL PAGO:</span>
                    <span style={{ fontSize: '1.4rem', fontWeight: 900, color: '#0f172a' }}>
                      {total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </span>
                  </div>
                </div>

                {(r.formaPagamento || r.dataPagamento) && (
                  <div style={{ border: '1px solid #cbd5e1', borderRadius: '10px', padding: '0.75rem 1rem', marginTop: '1rem', fontSize: '0.8rem', color: '#334155' }}>
                    <strong>Forma de Pagamento:</strong> {r.formaPagamento}{r.dataPagamento && ` — Pago em ${r.dataPagamento}`}
                  </div>
                )}

                {r.observacoes && (
                  <div style={{ marginTop: '1rem', fontSize: '0.78rem', color: '#64748b', fontStyle: 'italic' }}>{r.observacoes}</div>
                )}

                <div style={{ marginTop: '1.5rem', padding: '1rem', background: '#fafafa', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '0.8rem', color: '#475569', lineHeight: 1.6 }}>
                  Declaro que recebi de <strong>{r.clienteNome || '—'}</strong> a importância de{' '}
                  <strong style={{ color: '#0f172a' }}>{total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</strong>{' '}
                  referente aos serviços descritos acima.
                </div>

                <div style={{ marginTop: '2rem' }}>
                  <div style={{ width: '200px', borderTop: `1.5px solid #0f172a`, marginBottom: '0.4rem' }} />
                  <div style={{ fontWeight: 800, fontSize: '0.88rem', color: '#0f172a' }}>{r.prestadorNome || '—'}</div>
                  {r.prestadorCpfCnpj && <div style={{ fontSize: '0.75rem', color: '#64748b' }}>CPF/CNPJ: {r.prestadorCpfCnpj}</div>}
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Colored Header */}
              <div style={{ background: r.acento, padding: '1.8rem 2rem', position: 'relative' }}>
                <div style={{ position: 'absolute', top: 0, right: 0, width: '120px', height: '100%', background: 'rgba(255,255,255,0.05)', borderRadius: '0 0 0 60px' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.3rem' }}>
                      <Receipt size={20} color="rgba(255,255,255,0.9)" />
                      <span style={{ fontSize: '1.2rem', fontWeight: 900, color: 'white', letterSpacing: '-0.3px' }}>
                        {r.tipo === 'recibo' ? 'RECIBO DE PAGAMENTO' : 'NOTA DE SERVIÇO'}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.75)', fontWeight: 600 }}>Nº {r.numero}</div>
                  </div>
                  <div style={{ textAlign: 'right', color: 'rgba(255,255,255,0.85)', fontSize: '0.78rem' }}>
                    <div><strong>Data:</strong> {r.data}</div>
                    <div><strong>Pgto:</strong> {r.dataPagamento}</div>
                  </div>
                </div>
              </div>

              {/* Colored Body */}
              <div style={{ padding: '1.5rem 2rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                  <div>
                    <div className="proposta-section-title">Prestador</div>
                    <div style={{ fontWeight: 800, fontSize: '0.9rem', color: '#0f172a' }}>{r.prestadorNome || '—'}</div>
                    {r.prestadorCpfCnpj && <div style={{ fontSize: '0.75rem', color: '#64748b' }}>CPF/CNPJ: {r.prestadorCpfCnpj}</div>}
                    {r.prestadorEndereco && <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{r.prestadorEndereco}</div>}
                    {r.prestadorEmail && <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{r.prestadorEmail}</div>}
                  </div>
                  <div>
                    <div className="proposta-section-title">Cliente</div>
                    <div style={{ fontWeight: 800, fontSize: '0.9rem', color: '#0f172a' }}>{r.clienteNome || '—'}</div>
                    {r.clienteCpfCnpj && <div style={{ fontSize: '0.75rem', color: '#64748b' }}>CPF/CNPJ: {r.clienteCpfCnpj}</div>}
                    {r.clienteEndereco && <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{r.clienteEndereco}</div>}
                  </div>
                </div>

                <div className="proposta-section-title">Serviços / Itens</div>
                <table className="proposta-services-table" style={{ marginBottom: 0 }}>
                  <thead>
                    <tr>
                      <th>Descrição</th>
                      <th>Qtd.</th>
                      <th>Unid.</th>
                      <th className="amount-col">Valor Unit.</th>
                      <th className="amount-col">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {r.itens.map(item => (
                      <tr key={item.id}>
                        <td>{item.descricao || '—'}</td>
                        <td style={{ textAlign: 'center' }}>{item.quantidade}</td>
                        <td style={{ textAlign: 'center' }}>{item.unidade}</td>
                        <td className="amount-col">{fmt(item.valorUnit)}</td>
                        <td className="amount-col" style={{ fontWeight: 700 }}>
                          {(parseVal(item.valorUnit) * parseVal(item.quantidade)).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div style={{ borderTop: '2px solid #e2e8f0', padding: '0.75rem 0', textAlign: 'right' }}>
                  {desc > 0 && (
                    <div style={{ fontSize: '0.82rem', color: '#64748b', marginBottom: '0.3rem' }}>
                      Subtotal: {subtotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} &nbsp;|&nbsp;
                      Desconto: <span style={{ color: '#ef4444' }}>– {fmt(r.desconto)}</span>
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'baseline', gap: '1rem' }}>
                    <span style={{ fontWeight: 800, color: '#475569', fontSize: '0.85rem' }}>TOTAL PAGO:</span>
                    <span style={{ fontSize: '1.4rem', fontWeight: 900, color: r.acento }}>
                      {total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </span>
                  </div>
                </div>

                {(r.formaPagamento || r.dataPagamento) && (
                  <div style={{ background: `${r.acento}0d`, border: `1px solid ${r.acento}30`, borderRadius: '10px', padding: '0.75rem 1rem', marginTop: '1rem', fontSize: '0.8rem', color: '#334155' }}>
                    <strong>Forma de Pagamento:</strong> {r.formaPagamento}{r.dataPagamento && ` — Pago em ${r.dataPagamento}`}
                  </div>
                )}

                {r.observacoes && (
                  <div style={{ marginTop: '1rem', fontSize: '0.78rem', color: '#64748b', fontStyle: 'italic' }}>{r.observacoes}</div>
                )}

                <div style={{ marginTop: '1.5rem', padding: '1rem', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '0.8rem', color: '#475569', lineHeight: 1.6 }}>
                  Declaro que recebi de <strong>{r.clienteNome || '—'}</strong> a importância de{' '}
                  <strong style={{ color: r.acento }}>{total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</strong>{' '}
                  referente aos serviços descritos acima.
                </div>

                <div style={{ marginTop: '2rem' }}>
                  <div style={{ width: '200px', borderTop: `1.5px solid #0f172a`, marginBottom: '0.4rem' }} />
                  <div style={{ fontWeight: 800, fontSize: '0.88rem', color: '#0f172a' }}>{r.prestadorNome || '—'}</div>
                  {r.prestadorCpfCnpj && <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>CPF/CNPJ: {r.prestadorCpfCnpj}</div>}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
