import { useEffect, useState } from 'react'
import {
  ArrowDownLeft,
  ArrowUpRight,
  Bell,
  ChevronRight,
  CircleHelp,
  CreditCard,
  Eye,
  EyeOff,
  FileClock,
  Gauge,
  LayoutDashboard,
  LogOut,
  MonitorSmartphone,
  Moon,
  MoreHorizontal,
  Plus,
  QrCode,
  Settings2,
  Sun,
  Wallet,
} from 'lucide-react'
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import { getMe, type AccountUser, type Activity } from './services/api'
import './MainMenu.css'
import LandingPage from './LandingPage'
import RegisterPage from './RegisterPage'
import LoginPage from './LoginPage'
import PixPage from './PixPage'

type Tab = 'home' | 'statement' | 'settings' | 'pix'

const navigation = [
  { id: 'home', label: 'Visão geral', icon: LayoutDashboard },
  { id: 'statement', label: 'Extrato', icon: FileClock },
  { id: 'settings', label: 'Ajustes', icon: Settings2 },
] as const

const todayLabel = new Intl.DateTimeFormat('pt-BR', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
}).format(new Date()).toLocaleUpperCase('pt-BR')

function App() {
  const location = useLocation()
  const navigate = useNavigate()
  const [user, setUser] = useState<AccountUser | null>(null)
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [activeTab, setActiveTab] = useState<Tab>('home')
  const [balanceHidden, setBalanceHidden] = useState(true)
  const [darkMode, setDarkMode] = useState(false)
  const [previewMode, setPreviewMode] = useState(false)
  const [notice, setNotice] = useState('')

  useEffect(() => {
    if (location.pathname !== '/dashboard') return

    let active = true

    getMe()
      .then((data) => {
        if (active) {
          setUser(data.user)
          setActivities(data.activities)
        }
      })
      .catch((error: unknown) => {
        if (!active) return
        if (error instanceof Error && error.message === 'UNAUTHORIZED') {
          navigate('/login', { replace: true, state: { sessionExpired: true } })
        } else {
          setLoadError('Não foi possível carregar sua conta. Confira se o backend está rodando.')
        }
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [location.pathname, navigate])

  const firstName = user?.name.trim().split(/\s+/)[0] ?? '???'
  const formattedName = firstName
    ? firstName.charAt(0).toLocaleUpperCase('pt-BR') + firstName.slice(1).toLocaleLowerCase('pt-BR')
    : 'Olá'
  const formattedBalance = Number(user?.balance ?? 0).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  })
  const activeLabel = activeTab === 'pix' ? 'Pix' : navigation.find((item) => item.id === activeTab)?.label
  function showComingSoon(feature: string) {
    setNotice(`${feature} estará disponível em breve.`)
    window.setTimeout(() => setNotice(''), 3800)
  }

  async function refreshAccount() {
    const data = await getMe()
    setUser(data.user)
    setActivities(data.activities)
    setLoadError('')
  }

  const dashboard = (
    <div className={`bank-app${darkMode ? ' theme-dark' : ''}${previewMode ? ' preview-mode' : ''}`}>
      <aside className="sidebar">
        <a className="brand" href="#inicio" onClick={() => setActiveTab('home')} aria-label="Maze Bank, início">
          <span className="brand-mark">M</span>
          <span className="brand-copy"><strong>MAZE BANK</strong><small>OF CASTALDI</small></span>
        </a>

        <div className="sidebar-label">MENU PRINCIPAL</div>
        <nav className="side-nav" aria-label="Navegação principal">
          {navigation.map(({ id, label, icon: Icon }) => (
            <button
              className={`side-link${activeTab === id || (activeTab === 'pix' && id === 'home') ? ' active' : ''}`}
              key={id}
              onClick={() => setActiveTab(id)}
              type="button"
            >
              <Icon size={18} strokeWidth={1.8} />
              <span>{label}</span>
              {id === 'home' && <span className="active-indicator" />}
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="help-callout">
            <span className="help-icon"><CircleHelp size={17} /></span>
            <div><strong>Precisa de ajuda?</strong><span>Fale com nosso suporte</span></div>
            <ChevronRight size={16} />
          </div>
          <button className="profile-row" type="button" onClick={() => showComingSoon('Perfil')}>
            <span className="profile-avatar">{formattedName.slice(0, 1)}</span>
            <span className="profile-copy"><strong>{loading ? 'Carregando...' : formattedName}</strong><small>Conta pessoal</small></span>
            <MoreHorizontal size={19} />
          </button>
        </div>
      </aside>

      <div className="main-column">
        <header className="topbar">
          <div className="breadcrumb"><span>Conta</span><ChevronRight size={14} /><strong>{activeLabel}</strong></div>
          <div className="topbar-actions">
            <span className="account-status"><i /> Conta ativa</span>
            <button className="icon-button preview-toggle" type="button" title={previewMode ? 'Sair da visualização compacta' : 'Visualizar como celular'} aria-label={previewMode ? 'Sair da visualização compacta' : 'Visualizar como celular'} onClick={() => setPreviewMode(!previewMode)}>
              <MonitorSmartphone size={18} />
            </button>
            <button className="icon-button" type="button" title="Notificações" aria-label="Notificações" onClick={() => showComingSoon('Notificações')}>
              <Bell size={18} /><i className="notification-dot" />
            </button>
            <button className="top-avatar" type="button" aria-label="Abrir ajustes da conta" onClick={() => setActiveTab('settings')}>{formattedName.slice(0, 1)}</button>
          </div>
        </header>

        <main className="page-content">
          {activeTab === 'home' && (
            <>
              <section className="page-heading">
                <div><span className="eyebrow">{todayLabel}</span><h1>Olá, {formattedName}</h1><p>Veja o resumo da sua conta hoje.</p></div>
                <button className="quiet-button" type="button" onClick={() => setActiveTab('statement')}><FileClock size={16} /> Ver extrato</button>
              </section>

              {loadError && <div className="inline-alert" role="alert">{loadError}</div>}

              <section className="overview-grid" aria-label="Resumo da conta">
                <article className="balance-panel">
                  <div className="balance-panel-top"><span className="balance-label"><Wallet size={16} /> SALDO DISPONÍVEL</span><span className="balance-updated"><i /> ATUALIZADO AGORA</span></div>
                  <div className="balance-line"><p>{loading ? 'Carregando...' : loadError ? 'Indisponível' : balanceHidden ? 'R$ ••••••' : formattedBalance}</p><button className="balance-visibility" type="button" aria-label={balanceHidden ? 'Mostrar saldo' : 'Ocultar saldo'} title={balanceHidden ? 'Mostrar saldo' : 'Ocultar saldo'} onClick={() => setBalanceHidden(!balanceHidden)}>{balanceHidden ? <Eye size={18} /> : <EyeOff size={18} />}</button></div>
                  <div className="balance-panel-footer"><span>Maze Bank <b>•</b> Conta pessoal</span><button type="button" onClick={() => setActiveTab('statement')}>Detalhes da conta <ArrowUpRight size={15} /></button></div>
                  <span className="balance-watermark" aria-hidden="true">M</span>
                </article>
                <article className="account-card">
                  <div className="account-card-heading"><span className="account-card-icon"><CreditCard size={19} /></span><button type="button" aria-label="Mais opções do cartão" onClick={() => showComingSoon('Cartões')}><MoreHorizontal size={20} /></button></div>
                  <span className="account-card-label">CARTÃO PRINCIPAL</span>
                  <strong className="account-card-number">•••• &nbsp;•••• &nbsp;•••• &nbsp;••••</strong>
                  <div className="account-card-footer"><span>MAZE BANK</span><span className="card-chip" aria-label="Chip do cartão"><i /><i /><i /><i /></span></div>
                </article>
              </section>

              <section className="quick-section">
                <div className="section-heading"><div><h2>Atalhos</h2><p>O que você quer fazer?</p></div></div>
                <div className="quick-actions">
                  <button className="quick-action" type="button" onClick={() => setActiveTab('pix')}><span className="quick-icon pix-icon"><QrCode size={20} /></span><span><strong>Fazer um Pix</strong><small>Envie dinheiro em segundos</small></span><ChevronRight size={17} /></button>
                  <button className="quick-action" type="button" onClick={() => showComingSoon('Pagamentos')}><span className="quick-icon pay-icon"><ArrowUpRight size={20} /></span><span><strong>Pagar uma conta</strong><small>Boletos e contas do dia a dia</small></span><ChevronRight size={17} /></button>
                  <button className="quick-action" type="button" onClick={() => showComingSoon('Depósitos')}><span className="quick-icon deposit-icon"><Plus size={20} /></span><span><strong>Adicionar dinheiro</strong><small>Veja formas de depositar</small></span><ChevronRight size={17} /></button>
                </div>
              </section>

              <section className="activity-section">
                <div className="section-heading activity-heading"><div><h2>Atividade recente</h2><p>Suas movimentações mais recentes</p></div><button className="text-link" type="button" onClick={() => setActiveTab('statement')}>Ver tudo <ArrowUpRight size={15} /></button></div>
                {activities.length === 0 ? (
                  <div className="activity-empty"><span className="empty-icon"><Gauge size={21} /></span><div><strong>Nenhuma atividade por aqui</strong><p>Quando houver movimentações, elas aparecerão nesta lista.</p></div></div>
                ) : (
                  <div className="activity-list">
                    {activities.map((item) => {
                      const isOutgoing = user?.id ? item.senderId === user.id : true
                      const formattedAmount = Number(item.amount).toLocaleString('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      })
                      const formattedDate = new Intl.DateTimeFormat('pt-BR', {
                        day: '2-digit',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      }).format(new Date(item.createdAt))

                      return (
                        <article key={item.id} className="activity-item">
                          <span className={`activity-item-icon ${isOutgoing ? 'sent' : 'received'}`}>
                            {isOutgoing ? <ArrowUpRight size={18} /> : <ArrowDownLeft size={18} />}
                          </span>
                          <div className="activity-item-details">
                            <strong className="activity-item-title">
                              {item.description || (isOutgoing ? 'Transferência enviada' : 'Transferência recebida')}
                            </strong>
                            <span className="activity-item-meta">
                              <span>Pix</span>
                              <span>•</span>
                              <time dateTime={item.createdAt}>{formattedDate}</time>
                            </span>
                          </div>
                          <span className={`activity-item-amount ${isOutgoing ? 'sent' : 'received'}`}>
                            {isOutgoing ? `- ${formattedAmount}` : `+ ${formattedAmount}`}
                          </span>
                        </article>
                      )
                    })}
                  </div>
                )}
              </section>
            </>
          )}

          {activeTab === 'pix' && <PixPage onBack={() => setActiveTab('home')} onTransferComplete={refreshAccount} />}

          {activeTab === 'statement' && (
            <section className="subpage">
              <div className="page-heading"><div><span className="eyebrow">SUA CONTA</span><h1>Extrato</h1><p>Acompanhe entradas e saídas da sua conta.</p></div></div>
              <div className="empty-page"><span className="empty-icon"><FileClock size={22} /></span><h2>Seu extrato está começando</h2><p>As movimentações aparecerão aqui quando os recursos de transferência e pagamento estiverem disponíveis.</p></div>
            </section>
          )}

          {activeTab === 'settings' && (
            <section className="subpage">
              <div className="page-heading"><div><span className="eyebrow">PERSONALIZE</span><h1>Ajustes da conta</h1><p>Gerencie suas preferências do Maze Bank.</p></div></div>
              <div className="settings-list">
                <div className="setting-row"><span className="setting-icon"><Moon size={19} /></span><span className="setting-copy"><strong>Modo escuro</strong><small>Altere a aparência do aplicativo</small></span><button className={`switch${darkMode ? ' is-on' : ''}`} type="button" role="switch" aria-checked={darkMode} aria-label="Ativar modo escuro" onClick={() => setDarkMode(!darkMode)}><span /></button></div>
                <div className="setting-row"><span className="setting-icon"><LogOut size={19} /></span><span className="setting-copy"><strong>Sessão da conta</strong><small>Para sair, use a opção disponível na tela de acesso.</small></span></div>
              </div>
              <div className="theme-note"><Sun size={16} /> A preferência de tema vale apenas durante esta visita.</div>
            </section>
          )}
        </main>

        <footer className="page-footer"><span>© 2026 Maze Bank of Castaldi</span><span>Seu dinheiro, no seu ritmo.</span></footer>
      </div>

      <nav className="mobile-nav" aria-label="Navegação principal">
        {navigation.map(({ id, label, icon: Icon }) => <button className={activeTab === id || (activeTab === 'pix' && id === 'home') ? 'active' : ''} key={id} onClick={() => setActiveTab(id)} type="button"><Icon size={19} /><span>{label}</span></button>)}
      </nav>
      {notice && <div className="toast" role="status">{notice}</div>}
    </div>
  )

  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/dashboard" element={dashboard} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
