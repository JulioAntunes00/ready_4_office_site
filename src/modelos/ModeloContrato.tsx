import { useState } from 'react';
import { ChevronLeft, Download, Loader2 } from 'lucide-react';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

interface ContratoData {
  numero: string;
  cidade: string;
  data: string;
  // Contratante
  contratanteNome: string;
  contratanteCpfCnpj: string;
  contratanteEndereco: string;
  contratanteEmail: string;
  // Contratado
  contratadoNome: string;
  contratadoCpfCnpj: string;
  contratadoEndereco: string;
  contratadoEmail: string;
  contratadoProfissao: string;
  // Objeto
  objeto: string;
  prazoInicio: string;
  prazoFim: string;
  // Financeiro
  valorTotal: string;
  formaPagamento: string;
  // Obrigações
  obrigacoesContratado: string;
  obrigacoesContratante: string;
  // Rescisão
  noticePrioridade: string;
  clausulasAdicionais: string;
  acento: string;
}

const ACCENT_COLORS = [
  '#0f172a', '#1e40af', '#047857', '#7c3aed',
  '#b45309', '#0e7490', '#dc2626', '#374151',
];

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

export default function ModeloContrato({ onBack }: { onBack: () => void }) {
  const [isDownloading, setIsDownloading] = useState(false);

  const today = new Date().toLocaleDateString('pt-BR');
  const [c, setC] = useState<ContratoData>({
    numero: `CT-${new Date().getFullYear()}-001`,
    cidade: 'São Paulo',
    data: today,
    contratanteNome: 'Empresa ABC Ltda',
    contratanteCpfCnpj: '12.345.678/0001-99',
    contratanteEndereco: 'Av. Paulista, 1000, São Paulo – SP',
    contratanteEmail: 'contato@empresaabc.com.br',
    contratadoNome: 'João da Silva',
    contratadoCpfCnpj: '123.456.789-00',
    contratadoEndereco: 'Rua das Flores, 100, São Paulo – SP',
    contratadoEmail: 'joao.silva@email.com',
    contratadoProfissao: 'Desenvolvedor Web',
    objeto: 'Prestação de serviços de desenvolvimento web para criação de website institucional com design responsivo, sistema de contato e integração com redes sociais.',
    prazoInicio: today,
    prazoFim: new Date(Date.now() + 60 * 86400000).toLocaleDateString('pt-BR'),
    valorTotal: '6.000,00',
    formaPagamento: '50% na assinatura e 50% na entrega final do projeto.',
    obrigacoesContratado: 'Executar os serviços com qualidade e profissionalismo;\nEntregar as etapas acordadas no prazo estipulado;\nManter sigilo sobre informações confidenciais do Contratante;\nPrestar suporte técnico durante 30 dias após a entrega.',
    obrigacoesContratante: 'Efetuar os pagamentos nos prazos acordados;\nFornecer materiais e informações necessários para execução do serviço;\nApresentar feedback em até 5 dias úteis após cada entrega.',
    noticePrioridade: '15 (quinze)',
    clausulasAdicionais: '',
    acento: '#0f172a',
  });

  const up = (f: keyof ContratoData, v: string) => setC(prev => ({ ...prev, [f]: v }));

  const hex = c.acento.replace('#', '');
  const acR = parseInt(hex.substr(0, 2), 16) / 255;
  const acG = parseInt(hex.substr(2, 2), 16) / 255;
  const acB = parseInt(hex.substr(4, 2), 16) / 255;

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      const pdfDoc = await PDFDocument.create();
      const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      const regular = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const italic = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);

      const ac = rgb(acR, acG, acB);
      const dark = rgb(0.07, 0.09, 0.17);
      const gray = rgb(0.28, 0.34, 0.42);

      let page = pdfDoc.addPage([595, 842]);
      let { height } = page.getSize();
      let y = height - 50;

      const drawText = async (text: string, opts: any) => {
        if (y < 60) {
          page = pdfDoc.addPage([595, 842]);
          y = page.getSize().height - 50;
        }
        page.drawText(text, opts);
      };

      const drawSection = async (title: string) => {
        if (y < 100) {
          page = pdfDoc.addPage([595, 842]);
          y = page.getSize().height - 50;
        }
        y -= 10;
        await drawText(title, { x: 40, y, size: 8, font: bold, color: ac });
        y -= 7;
        page.drawLine({ start: { x: 40, y }, end: { x: 555, y }, thickness: 0.8, color: ac });
        y -= 16;
      };

      const drawPara = async (text: string, maxC: number = 86) => {
        const lines = wrapText(text, maxC);
        for (const line of lines) {
          if (y < 60) {
            page = pdfDoc.addPage([595, 842]);
            y = page.getSize().height - 50;
          }
          page.drawText(line || ' ', { x: 40, y, size: 9, font: regular, color: gray });
          y -= 13;
        }
      };

      // Header accent bar
      page.drawRectangle({ x: 0, y: height - 6, width: 595, height: 6, color: ac });

      // Title
      page.drawText('CONTRATO DE PRESTAÇÃO DE SERVIÇOS', { x: 40, y, size: 14, font: bold, color: dark });
      y -= 18;
      page.drawText(`Nº ${c.numero}`, { x: 40, y, size: 9, font: regular, color: gray });
      y -= 30;

      // Parties
      await drawSection('DAS PARTES CONTRATANTES');
      await drawText(`CONTRATANTE: ${c.contratanteNome}`, { x: 40, y, size: 9, font: bold, color: dark });
      y -= 13;
      if (c.contratanteCpfCnpj) { await drawPara(`CPF/CNPJ: ${c.contratanteCpfCnpj} | ${c.contratanteEndereco}`); }
      y -= 6;
      await drawText(`CONTRATADO(A): ${c.contratadoNome}`, { x: 40, y, size: 9, font: bold, color: dark });
      y -= 13;
      if (c.contratadoCpfCnpj) { await drawPara(`CPF/CNPJ: ${c.contratadoCpfCnpj} | ${c.contratadoEndereco}`); }
      y -= 6;
      await drawPara('As partes acima qualificadas resolvem celebrar o presente Contrato de Prestação de Serviços, que se regerá pelas cláusulas e condições seguintes:');

      // Objeto
      await drawSection('CLÁUSULA 1ª – DO OBJETO');
      await drawPara(`O(A) CONTRATADO(A) obriga-se a prestar ao CONTRATANTE os seguintes serviços: ${c.objeto}`);

      // Prazo
      await drawSection('CLÁUSULA 2ª – DO PRAZO');
      await drawPara(`O prazo de vigência do presente contrato é de ${c.prazoInicio} até ${c.prazoFim}, podendo ser prorrogado mediante acordo escrito entre as partes.`);

      // Valor
      await drawSection('CLÁUSULA 3ª – DO VALOR E FORMA DE PAGAMENTO');
      await drawPara(`O valor total pelos serviços prestados será de R$ ${c.valorTotal} (${c.valorTotal} reais).`);
      await drawPara(`Forma de pagamento: ${c.formaPagamento}`);

      // Obrigações Contratado
      await drawSection('CLÁUSULA 4ª – DAS OBRIGAÇÕES DO(A) CONTRATADO(A)');
      await drawPara(c.obrigacoesContratado);

      // Obrigações Contratante
      await drawSection('CLÁUSULA 5ª – DAS OBRIGAÇÕES DO CONTRATANTE');
      await drawPara(c.obrigacoesContratante);

      // Rescisão
      await drawSection('CLÁUSULA 6ª – DA RESCISÃO');
      await drawPara(`O presente contrato poderá ser rescindido por qualquer uma das partes, mediante notificação prévia de ${c.noticePrioridade} dias, por escrito, sem ônus para a parte notificante, desde que não haja inadimplência.`);

      // Cláusulas adicionais
      if (c.clausulasAdicionais) {
        await drawSection('CLÁUSULA 7ª – DISPOSIÇÕES GERAIS');
        await drawPara(c.clausulasAdicionais);
      }

      // Forum
      const clausulaForo = (c.clausulasAdicionais ? 8 : 7);
      await drawSection(`CLÁUSULA ${clausulaForo}ª – DO FORO`);
      await drawPara(`Fica eleito o foro da Comarca de ${c.cidade} para dirimir quaisquer controvérsias oriundas do presente contrato, com renúncia expressa a qualquer outro.`);

      // Signature
      if (y < 180) {
        page = pdfDoc.addPage([595, 842]);
        y = page.getSize().height - 50;
      }
      y -= 20;
      page.drawText(`Por estarem assim acordados, firmam o presente instrumento em 2 (duas) vias de igual teor.`, { x: 40, y, size: 8.5, font: italic, color: gray });
      y -= 16;
      page.drawText(`${c.cidade}, ${c.data}`, { x: 40, y, size: 9, font: regular, color: dark });
      y -= 50;

      page.drawLine({ start: { x: 40, y }, end: { x: 260, y }, thickness: 0.7, color: dark });
      page.drawLine({ start: { x: 310, y }, end: { x: 555, y }, thickness: 0.7, color: dark });
      y -= 14;
      page.drawText(c.contratanteNome, { x: 40, y, size: 8.5, font: bold, color: dark });
      page.drawText(c.contratadoNome, { x: 310, y, size: 8.5, font: bold, color: dark });
      y -= 12;
      page.drawText('CONTRATANTE', { x: 40, y, size: 7.5, font: regular, color: gray });
      page.drawText('CONTRATADO(A)', { x: 310, y, size: 7.5, font: regular, color: gray });

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes as any], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `contrato_${c.numero.replace(/[^a-z0-9]/gi, '_')}.pdf`;
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
            <h2>Contrato de Serviços</h2>
            <p>Personalize e baixe em PDF</p>
          </div>
          <button className="download-btn" onClick={handleDownload} disabled={isDownloading}>
            {isDownloading ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
            {isDownloading ? '' : 'PDF'}
          </button>
        </div>
        <div className="panel-form">
          <div className="form-section-title">Identificação</div>
          <div className="form-row">
            <div className="form-field"><label>Nº do Contrato</label><input value={c.numero} onChange={e => up('numero', e.target.value)} /></div>
            <div className="form-field"><label>Data</label><input value={c.data} onChange={e => up('data', e.target.value)} /></div>
          </div>
          <div className="form-field"><label>Cidade</label><input value={c.cidade} onChange={e => up('cidade', e.target.value)} /></div>

          <div className="form-section-title">Cor de Destaque</div>
          <div className="color-row">
            {ACCENT_COLORS.map(col => (
              <button key={col} className={`color-swatch ${c.acento === col ? 'selected' : ''}`} style={{ backgroundColor: col }} onClick={() => up('acento', col)} />
            ))}
          </div>

          <div className="form-section-title">Contratante (Quem Contrata)</div>
          <div className="form-field"><label>Nome / Razão Social</label><input value={c.contratanteNome} onChange={e => up('contratanteNome', e.target.value)} /></div>
          <div className="form-field"><label>CPF / CNPJ</label><input value={c.contratanteCpfCnpj} onChange={e => up('contratanteCpfCnpj', e.target.value)} /></div>
          <div className="form-field"><label>Endereço</label><input value={c.contratanteEndereco} onChange={e => up('contratanteEndereco', e.target.value)} /></div>
          <div className="form-field"><label>E-mail</label><input value={c.contratanteEmail} onChange={e => up('contratanteEmail', e.target.value)} /></div>

          <div className="form-section-title">Contratado(a) (Quem Presta)</div>
          <div className="form-field"><label>Nome Completo</label><input value={c.contratadoNome} onChange={e => up('contratadoNome', e.target.value)} /></div>
          <div className="form-row">
            <div className="form-field"><label>CPF / CNPJ</label><input value={c.contratadoCpfCnpj} onChange={e => up('contratadoCpfCnpj', e.target.value)} /></div>
            <div className="form-field"><label>Profissão</label><input value={c.contratadoProfissao} onChange={e => up('contratadoProfissao', e.target.value)} /></div>
          </div>
          <div className="form-field"><label>Endereço</label><input value={c.contratadoEndereco} onChange={e => up('contratadoEndereco', e.target.value)} /></div>

          <div className="form-section-title">Objeto e Prazo</div>
          <div className="form-field"><label>Descrição dos Serviços</label><textarea rows={4} value={c.objeto} onChange={e => up('objeto', e.target.value)} /></div>
          <div className="form-row">
            <div className="form-field"><label>Início</label><input value={c.prazoInicio} onChange={e => up('prazoInicio', e.target.value)} /></div>
            <div className="form-field"><label>Término</label><input value={c.prazoFim} onChange={e => up('prazoFim', e.target.value)} /></div>
          </div>

          <div className="form-section-title">Valor e Pagamento</div>
          <div className="form-field"><label>Valor Total (R$)</label><input value={c.valorTotal} onChange={e => up('valorTotal', e.target.value)} placeholder="Ex: 5.000,00" /></div>
          <div className="form-field"><label>Forma de Pagamento</label><textarea rows={2} value={c.formaPagamento} onChange={e => up('formaPagamento', e.target.value)} /></div>

          <div className="form-section-title">Obrigações do Contratado</div>
          <div className="form-field"><textarea rows={5} value={c.obrigacoesContratado} onChange={e => up('obrigacoesContratado', e.target.value)} /></div>

          <div className="form-section-title">Obrigações do Contratante</div>
          <div className="form-field"><textarea rows={3} value={c.obrigacoesContratante} onChange={e => up('obrigacoesContratante', e.target.value)} /></div>

          <div className="form-section-title">Rescisão</div>
          <div className="form-field"><label>Aviso Prévio (ex: "15 (quinze)")</label><input value={c.noticePrioridade} onChange={e => up('noticePrioridade', e.target.value)} /></div>

          <div className="form-section-title">Cláusulas Adicionais (Opcional)</div>
          <div className="form-field"><textarea rows={4} placeholder="Outras condições específicas..." value={c.clausulasAdicionais} onChange={e => up('clausulasAdicionais', e.target.value)} /></div>
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
        <div className="preview-label">Preview ao vivo</div>
        <div className="doc-sheet">
          {/* Accent top bar */}
          <div style={{ height: '6px', background: c.acento }} />

          <div style={{ padding: '2rem 2.5rem' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.3px', marginBottom: '0.3rem' }}>
              CONTRATO DE PRESTAÇÃO DE SERVIÇOS
            </h2>
            <p style={{ fontSize: '0.78rem', color: '#64748b', marginBottom: '2rem' }}>Nº {c.numero}</p>

            {/* Parties */}
            <div className="contrato-section-title" style={{ color: c.acento, borderColor: c.acento }}>DAS PARTES CONTRATANTES</div>
            <div className="contrato-party-grid">
              <div className="contrato-party-box">
                <div className="contrato-party-label">CONTRATANTE</div>
                <div className="contrato-party-name">{c.contratanteNome || '—'}</div>
                <div className="contrato-party-info">CPF/CNPJ: {c.contratanteCpfCnpj}</div>
                <div className="contrato-party-info">{c.contratanteEndereco}</div>
                <div className="contrato-party-info">{c.contratanteEmail}</div>
              </div>
              <div className="contrato-party-box" style={{ borderColor: c.acento, background: `${c.acento}0a` }}>
                <div className="contrato-party-label" style={{ color: c.acento }}>CONTRATADO(A)</div>
                <div className="contrato-party-name">{c.contratadoNome || '—'}</div>
                <div className="contrato-party-info">{c.contratadoProfissao}</div>
                <div className="contrato-party-info">CPF/CNPJ: {c.contratadoCpfCnpj}</div>
                <div className="contrato-party-info">{c.contratadoEndereco}</div>
              </div>
            </div>

            {/* Clauses preview */}
            <div className="contrato-section-title" style={{ color: c.acento, borderColor: c.acento }}>CLÁUSULA 1ª – DO OBJETO</div>
            <p className="contrato-clause-text">{c.objeto || '—'}</p>

            <div className="contrato-section-title" style={{ color: c.acento, borderColor: c.acento }}>CLÁUSULA 2ª – DO PRAZO</div>
            <p className="contrato-clause-text">Vigência: <strong>{c.prazoInicio}</strong> até <strong>{c.prazoFim}</strong></p>

            <div className="contrato-section-title" style={{ color: c.acento, borderColor: c.acento }}>CLÁUSULA 3ª – DO VALOR</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', margin: '0.5rem 0 0.3rem' }}>
              <span style={{ fontSize: '1.3rem', fontWeight: 900, color: c.acento }}>R$ {c.valorTotal}</span>
            </div>
            <p className="contrato-clause-text">{c.formaPagamento}</p>

            <div className="contrato-section-title" style={{ color: c.acento, borderColor: c.acento }}>CLÁUSULA 4ª – OBRIGAÇÕES CONTRATADO(A)</div>
            <div className="contrato-clause-text" style={{ whiteSpace: 'pre-wrap' }}>{c.obrigacoesContratado}</div>

            <div className="contrato-section-title" style={{ color: c.acento, borderColor: c.acento }}>CLÁUSULA 5ª – OBRIGAÇÕES CONTRATANTE</div>
            <div className="contrato-clause-text" style={{ whiteSpace: 'pre-wrap' }}>{c.obrigacoesContratante}</div>

            {/* Signature area */}
            <div style={{ marginTop: '2.5rem', paddingTop: '1rem', borderTop: '1px solid #e2e8f0' }}>
              <p style={{ fontSize: '0.78rem', color: '#64748b', marginBottom: '2rem', fontStyle: 'italic' }}>
                {c.cidade}, {c.data}
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                <div>
                  <div style={{ borderTop: `1px solid #0f172a`, paddingTop: '0.4rem' }}>
                    <div style={{ fontWeight: 700, fontSize: '0.82rem', color: '#0f172a' }}>{c.contratanteNome || '—'}</div>
                    <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>CONTRATANTE</div>
                  </div>
                </div>
                <div>
                  <div style={{ borderTop: `1px solid ${c.acento}`, paddingTop: '0.4rem' }}>
                    <div style={{ fontWeight: 700, fontSize: '0.82rem', color: '#0f172a' }}>{c.contratadoNome || '—'}</div>
                    <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>CONTRATADO(A)</div>
                  </div>
                </div>
              </div>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}
