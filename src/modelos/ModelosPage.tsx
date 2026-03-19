import { useState } from 'react';
import { FileText, Briefcase, Mail, Sparkles, Star, ArrowRight, Receipt, ScrollText } from 'lucide-react';
import ModeloCurriculo from './ModeloCurriculo';
import ModeloProposta from './ModeloProposta';
import ModeloCarta from './ModeloCarta';
import ModeloRecibo from './ModeloRecibo';
import ModeloContrato from './ModeloContrato';
import './modelos.css';

type Modelo = 'curriculo' | 'proposta' | 'carta' | 'recibo' | 'contrato' | null;

const MODELOS = [
  {
    id: 'curriculo' as Modelo,
    icon: <FileText size={28} />,
    title: 'Currículo Profissional',
    description: '3 layouts exclusivos, upload de foto, habilidades e exportação em PDF.',
    tag: 'Mais Popular',
    tagColor: '#10b981',
    gradient: 'linear-gradient(135deg, #10b981, #059669)',
    badgeIcon: <Star size={11} />,
    isNew: false,
  },
  {
    id: 'proposta' as Modelo,
    icon: <Briefcase size={28} />,
    title: 'Proposta Comercial',
    description: 'Apresente serviços e valores com profissionalismo e clareza total.',
    tag: 'Para Negócios',
    tagColor: '#3b82f6',
    gradient: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
    badgeIcon: <Sparkles size={11} />,
    isNew: false,
  },
  {
    id: 'carta' as Modelo,
    icon: <Mail size={28} />,
    title: 'Carta / Declaração',
    description: 'Modelo formal para cartas, declarações e correspondências oficiais.',
    tag: 'Versátil',
    tagColor: '#8b5cf6',
    gradient: 'linear-gradient(135deg, #8b5cf6, #6d28d9)',
    badgeIcon: <Star size={11} />,
    isNew: false,
  },
  {
    id: 'recibo' as Modelo,
    icon: <Receipt size={28} />,
    title: 'Recibo / Nota de Serviço',
    description: 'Comprove pagamentos recebidos com itens, valores e assinatura.',
    tag: 'Novo',
    tagColor: '#f59e0b',
    gradient: 'linear-gradient(135deg, #f59e0b, #d97706)',
    badgeIcon: <Sparkles size={11} />,
    isNew: true,
  },
  {
    id: 'contrato' as Modelo,
    icon: <ScrollText size={28} />,
    title: 'Contrato de Serviços',
    description: 'Contrato profissional com cláusulas, obrigações e assinaturas.',
    tag: 'Novo',
    tagColor: '#e11d48',
    gradient: 'linear-gradient(135deg, #e11d48, #be123c)',
    badgeIcon: <Sparkles size={11} />,
    isNew: true,
  },
];

export default function ModelosPage() {
  const [selected, setSelected] = useState<Modelo>(null);

  if (selected === 'curriculo') return <ModeloCurriculo onBack={() => setSelected(null)} />;
  if (selected === 'proposta') return <ModeloProposta onBack={() => setSelected(null)} />;
  if (selected === 'carta') return <ModeloCarta onBack={() => setSelected(null)} />;
  if (selected === 'recibo') return <ModeloRecibo onBack={() => setSelected(null)} />;
  if (selected === 'contrato') return <ModeloContrato onBack={() => setSelected(null)} />;

  return (
    <div className="modelos-page fade-in">
      <div className="container">
        <div className="modelos-hero">
          <div className="hero-badge">
            <Sparkles size={14} style={{ color: 'var(--primary)' }} />
            5 Modelos Gratuitos
          </div>
          <h1 className="modelos-title">Modelos Prontos para Usar</h1>
          <p className="modelos-subtitle">
            Preencha, personalize com suas cores e baixe em PDF sem precisar de nenhum software instalado.
          </p>
        </div>

        <div className="modelos-grid-5">
          {MODELOS.map((m) => (
            <div
              key={m.id!}
              className={`modelo-card ${m.isNew ? 'modelo-card-new' : ''}`}
              onClick={() => setSelected(m.id)}
            >
              {m.isNew && <div className="modelo-new-ribbon">Novo</div>}
              <div className="modelo-card-badge" style={{ backgroundColor: `${m.tagColor}18`, color: m.tagColor }}>
                {m.badgeIcon}
                {m.tag}
              </div>
              <div className="modelo-card-icon" style={{ background: m.gradient }}>
                {m.icon}
              </div>
              <h3>{m.title}</h3>
              <p>{m.description}</p>
              <div className="modelo-card-cta">
                <span>Usar modelo</span>
                <ArrowRight size={16} />
              </div>
            </div>
          ))}
        </div>

        <div className="modelos-features">
          <div className="modelos-feature-item">
            <div className="feature-dot" style={{ background: '#10b981' }} />
            <span>100% gratuito</span>
          </div>
          <div className="modelos-feature-item">
            <div className="feature-dot" style={{ background: '#3b82f6' }} />
            <span>Seus dados ficam só no seu navegador</span>
          </div>
          <div className="modelos-feature-item">
            <div className="feature-dot" style={{ background: '#8b5cf6' }} />
            <span>Download instantâneo em PDF</span>
          </div>
          <div className="modelos-feature-item">
            <div className="feature-dot" style={{ background: '#f59e0b' }} />
            <span>Preview ao vivo em tempo real</span>
          </div>
        </div>
      </div>
    </div>
  );
}
