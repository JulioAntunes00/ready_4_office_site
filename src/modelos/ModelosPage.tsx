import { useState } from 'react';
import { FileText, Briefcase, Mail, Eye, Sparkles, Star, ArrowRight } from 'lucide-react';
import ModeloCurriculo from './ModeloCurriculo';
import ModeloProposta from './ModeloProposta';
import ModeloCarta from './ModeloCarta';
import './modelos.css';

type Modelo = 'curriculo' | 'proposta' | 'carta' | null;

const MODELOS = [
  {
    id: 'curriculo' as Modelo,
    icon: <FileText size={28} />,
    title: 'Currículo Profissional',
    description: 'Template moderno com foto, experiências, habilidades e formação.',
    tag: 'Mais Popular',
    tagColor: '#10b981',
    gradient: 'linear-gradient(135deg, #10b981, #059669)',
    badgeIcon: <Star size={11} />,
  },
  {
    id: 'proposta' as Modelo,
    icon: <Briefcase size={28} />,
    title: 'Proposta Comercial',
    description: 'Apresente serviços e valores com profissionalismo e clareza.',
    tag: 'Para Negócios',
    tagColor: '#3b82f6',
    gradient: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
    badgeIcon: <Sparkles size={11} />,
  },
  {
    id: 'carta' as Modelo,
    icon: <Mail size={28} />,
    title: 'Carta / Declaração',
    description: 'Modelo formal para cartas, declarações e correspondências oficiais.',
    tag: 'Versátil',
    tagColor: '#8b5cf6',
    gradient: 'linear-gradient(135deg, #8b5cf6, #6d28d9)',
    badgeIcon: <Eye size={11} />,
  },
];

export default function ModelosPage() {
  const [selected, setSelected] = useState<Modelo>(null);

  if (selected === 'curriculo') return <ModeloCurriculo onBack={() => setSelected(null)} />;
  if (selected === 'proposta') return <ModeloProposta onBack={() => setSelected(null)} />;
  if (selected === 'carta') return <ModeloCarta onBack={() => setSelected(null)} />;

  return (
    <div className="modelos-page fade-in">
      <div className="container">
        <div className="modelos-hero">
          <div className="hero-badge">
            <Sparkles size={14} style={{ color: 'var(--primary)' }} />
            Modelos Gratuitos
          </div>
          <h1 className="modelos-title">Modelos Prontos para Usar</h1>
          <p className="modelos-subtitle">
            Preencha, personalize e baixe em PDF sem precisar de nenhum software instalado.
          </p>
        </div>

        <div className="modelos-grid">
          {MODELOS.map((m) => (
            <div
              key={m.id!}
              className="modelo-card"
              onClick={() => setSelected(m.id)}
            >
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
        </div>
      </div>
    </div>
  );
}
