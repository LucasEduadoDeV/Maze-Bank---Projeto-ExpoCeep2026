import {
  ArrowDownLeft,
  ArrowRight,
  ArrowUpRight,
  Check,
  CreditCard,
  LockKeyhole,
  QrCode,
  ShieldCheck,
  Wallet,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import './LandingPage.css'

const features = [
  {
    icon: QrCode,
    number: '01',
    title: 'Pix sem complicação',
    description: 'Envie e receba transferências simuladas entre contas Maze Bank usando CPF.',
    tone: 'red',
  },
  {
    icon: CreditCard,
    number: '02',
    title: 'Cartões sob controle',
    description: 'Visualize cartões demonstrativos e gerencie seus status direto pelo painel.',
    tone: 'green',
  },
  {
    icon: ShieldCheck,
    number: '03',
    title: 'Feito para aprender',
    description: 'Uma experiência de banco virtual construída como projeto educacional.',
    tone: 'blue',
  },
] as const

function LandingPage() {
  return (
    <div className="landing-page">
      <header className="landing-header">
        <div className="landing-container landing-header-inner">
          <Link className="landing-brand" to="/" aria-label="Maze Bank, início">
            <span className="landing-mark">M</span>
            <span><strong>MAZE BANK</strong><small>OF CASTALDI</small></span>
          </Link>
          <nav className="landing-nav" aria-label="Navegação da página">
            <a href="#recursos">Recursos</a>
            <a href="#sobre">Sobre o projeto</a>
          </nav>
          <div className="landing-auth-links">
            <Link className="landing-login-link" to="/login">Acessar conta</Link>
            <Link className="landing-button landing-button-small" to="/register">Abrir conta <ArrowRight size={15} /></Link>
          </div>
        </div>
      </header>

      <main>
        <section className="landing-hero">
          <div className="landing-container landing-hero-grid">
            <div className="landing-hero-copy">
              <span className="landing-kicker"><span /> BANCO DIGITAL DO CASTALDI</span>
              <h1>Seu dinheiro.<br /><em>Seu próximo passo.</em></h1>
              <p>Uma nova forma de acompanhar sua vida financeira, com tudo o que importa em um só lugar.</p>
              <div className="landing-hero-actions">
                <Link className="landing-button landing-button-primary" to="/register">Começar agora <ArrowRight size={17} /></Link>
                <Link className="landing-text-link" to="/login">Já tenho uma conta <ArrowUpRight size={16} /></Link>
              </div>
            </div>

            <div className="landing-visual" aria-label="Prévia do painel do Maze Bank">
              <div className="visual-glow" />
              <div className="landing-dashboard-card">
                <div className="dashboard-card-top">
                  <div className="dashboard-brand"><span className="dashboard-mark">M</span><span><b>MAZE BANK</b><small>OF CASTALDI</small></span></div>
                  <span className="demo-chip"><i /> DEMO</span>
                </div>
                <div className="dashboard-greeting"><span>QUARTA-FEIRA, 28 DE OUTUBRO</span><strong>Olá, Castaldi</strong></div>
                <div className="dashboard-balance">
                  <span><Wallet size={15} /> SALDO DISPONÍVEL</span>
                  <strong>R$ 8.450,00</strong>
                  <small>Conta pessoal <i>·</i> Atualizado agora</small>
                </div>
                <div className="dashboard-shortcuts">
                  <span><i className="shortcut-pix"><QrCode size={17} /></i>Pix</span>
                  <span><i className="shortcut-card"><CreditCard size={17} /></i>Cartões</span>
                  <span><i className="shortcut-history"><ArrowUpRight size={17} /></i>Extrato</span>
                </div>
                <div className="dashboard-activity"><span className="activity-icon"><ArrowDownLeft size={16} /></span><span><b>Transferência recebida</b><small>Hoje, 10:42</small></span><strong>+ R$ 250,00</strong></div>
                <div className="dashboard-card-footer"><span><i /> AMBIENTE DE DEMONSTRAÇÃO</span><span>01 / 03</span></div>
              </div>
            </div>
          </div>
          <div className="landing-container hero-bottom-line"><span>UM PROJETO DIGITAL, PENSADO PARA VOCÊ</span><span>ROLE PARA EXPLORAR <ArrowDownLeft size={13} /></span></div>
        </section>

        <section className="landing-features" id="recursos">
          <div className="landing-container">
            <div className="features-intro">
              <div><span className="landing-kicker">O QUE VOCÊ ENCONTRA</span><h2>Uma conta que acompanha<br />suas ideias.</h2></div>
              <p>Ferramentas essenciais, uma experiência clara e espaço para construir bons hábitos financeiros.</p>
            </div>
            <div className="landing-feature-grid">
              {features.map(({ icon: Icon, number, title, description, tone }) => (
                <article className="landing-feature" key={number}>
                  <div className="feature-topline"><span className={`feature-symbol ${tone}`}><Icon size={20} /></span><span>{number} / 03</span></div>
                  <h3>{title}</h3>
                  <p>{description}</p>
                  <span className="feature-rule" />
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="landing-about" id="sobre">
          <div className="landing-container about-inner">
            <span className="about-seal"><LockKeyhole size={21} /><Check size={12} /></span>
            <div><span className="landing-kicker">TRANSPARÊNCIA EM PRIMEIRO LUGAR</span><h2>Uma simulação para<br />aprender na prática.</h2></div>
            <p>O Maze Bank é um projeto escolar. As operações e os valores apresentados são demonstrativos e não representam serviços financeiros reais.</p>
            <Link className="landing-button landing-button-light" to="/register">Conhecer o projeto <ArrowRight size={16} /></Link>
          </div>
        </section>
      </main>

      <footer className="landing-footer">
        <div className="landing-container landing-footer-inner">
          <Link className="landing-brand footer-brand" to="/" aria-label="Maze Bank, início"><span className="landing-mark">M</span><span><strong>MAZE BANK</strong><small>OF CASTALDI</small></span></Link>
          <span>© 2026 Maze Bank of Castaldi <i>·</i> Projeto escolar demonstrativo</span>
          <div><Link to="/login">Entrar</Link><Link to="/register">Criar conta</Link></div>
        </div>
      </footer>
    </div>
  )
}

export default LandingPage