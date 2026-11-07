import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import {
  ArrowDownLeft,
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  CalendarDays,
  ChevronRight,
  CreditCard,
  Fingerprint,
  Eye,
  EyeOff,
  FileClock,
  Gauge,
  LayoutDashboard,
  LogOut,
  Mail,
  Moon,
  MoreHorizontal,
  QrCode,
  Settings2,
  Sun,
  UserRound,
  Wallet,
  Star,
} from 'lucide-react'
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import { changeUserTheme, getBills, getCards, getMe, getStatement, logoutAccount, type AccountCard, type AccountUser, type Activity, type PaginationMeta } from './services/api'
import './MainMenu.css'
import './StatementPage.css'
import './DashboardActivity.css'
import './DashboardBackground.css'
import './AppPageBackgrounds.css'
import './SettingsPage.css'
import './DashboardPolish.css'
import LandingPage from './LandingPage'
import RegisterPage from './RegisterPage'
import LoginPage from './LoginPage'
import PixPage from './PixPage'
import CardsPage from './CardsPage'
import PayPage from './PayPage'
import BillsPage from './BillsPage'
import InvoiceHistoryPage from './InvoiceHistoryPage'
import SimulateInvoicePage from './SimulateInvoicePage'
import TransferDetailPage from './TransferDetailPage'
import type { Bill } from './bills'
import { API_URL } from './services/api'

type Tab = 'home' | 'statement' | 'settings' | 'profile' | 'pix' | 'cards' | 'bills' | 'pay' | 'invoice' | 'invoices' | 'transfer'

const tabPaths: Record<Exclude<Tab, 'transfer'>, string> = {
  home: '/dashboard',
  statement: '/dashboard/statement',
  settings: '/dashboard/settings',
  profile: '/dashboard/profile',
  pix: '/dashboard/pix',
  cards: '/dashboard/cards',
  bills: '/dashboard/bills',
  pay: '/dashboard/pay',
  invoice: '/dashboard/invoice',
  invoices: '/dashboard/invoices',
}

function getTabFromPath(pathname: string): Tab {
  if (pathname.startsWith('/dashboard/transfers/')) return 'transfer'
  const route = Object.entries(tabPaths).find(([, path]) => pathname === path)
  return (route?.[0] as Tab | undefined) ?? 'home'
}

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

function maskCpf(cpf?: string) {
  const digits = cpf?.replace(/\D/g, '') ?? ''
  return digits.length === 11 ? `•••.•••.•••-${digits.slice(-2)}` : 'Não informado'
}

function formatMemberSince(createdAt?: string) {
  if (!createdAt) return 'Não informado'
  const date = new Date(createdAt)
  if (Number.isNaN(date.getTime())) return 'Não informado'
  return new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(date)
}

function getUserInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toLocaleUpperCase('pt-BR'))
    .join('')
}

function App() {
  const location = useLocation()
  const navigate = useNavigate()
  const isDashboardRoute = location.pathname.startsWith('/dashboard')
  const activeTab = getTabFromPath(location.pathname)
  const transferReturnTab = new URLSearchParams(location.search).get('from') === 'statement' ? 'statement' : 'home'
  const selectedTransferId = activeTab === 'transfer'
    ? decodeURIComponent(location.pathname.slice('/dashboard/transfers/'.length))
    : null
  const [user, setUser] = useState<AccountUser | null>(null)
  const [activities, setActivities] = useState<Activity[]>([])
  const [accountCards, setAccountCards] = useState<AccountCard[]>([])
  const [mainCardId, setMainCardId] = useState<string | null>(null)
  const [openCardId, setOpenCardId] = useState<string | null>(null)
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null)
  const [cardsLoading, setCardsLoading] = useState(true)
  const [cardsLoadError, setCardsLoadError] = useState('')
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [realtimeStatus, setRealtimeStatus] = useState<'connecting' | 'connected' | 'offline'>('connecting')
  const [statementRefresh, setStatementRefresh] = useState(0)
  const [balanceHidden, setBalanceHidden] = useState(true)
  const [darkMode, setDarkMode] = useState(false)
  const [themeUpdating, setThemeUpdating] = useState(false)
  const [themeError, setThemeError] = useState('')
  const [logoutLoading, setLogoutLoading] = useState(false)
  const [logoutError, setLogoutError] = useState('')
  const balanceAmountRef = useRef<HTMLParagraphElement>(null)
  const previousBalanceRef = useRef<number | null>(null)

  useLayoutEffect(() => {
    if (window.matchMedia('(max-width: 760px)').matches) {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
    }
  }, [activeTab, location.pathname])

  useLayoutEffect(() => {
    const balance = user ? Number(user.balance) : null
    const previousBalance = previousBalanceRef.current
    previousBalanceRef.current = balance

    if (
      balance === null
      || previousBalance === null
      || !Number.isFinite(balance)
      || balance === previousBalance
      || window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      return
    }

    const amountElement = balanceAmountRef.current
    if (!amountElement) return

    const accent = balance > previousBalance ? '#8fe0aa' : '#ffaaa4'
    amountElement.animate(
      [
        { transform: 'scale(1)', color: '#ffffff', filter: 'drop-shadow(0 0 0 transparent)' },
        { transform: 'scale(1.055)', color: accent, filter: `drop-shadow(0 0 12px ${accent})` },
        { transform: 'scale(1)', color: '#ffffff', filter: 'drop-shadow(0 0 0 transparent)' },
      ],
      { duration: 850, easing: 'ease-out' },
    )
  }, [user])

  // Statement pagination state
  const [statementData, setStatementData] = useState<Activity[]>([])
  const [statementMeta, setStatementMeta] = useState<PaginationMeta | null>(null)
  const [statementPage, setStatementPage] = useState(1)
  const [statementLoading, setStatementLoading] = useState(false)
  const [bills, setBills] = useState<Bill[]>([])
  const [billsMeta, setBillsMeta] = useState<PaginationMeta | null>(null)
  const [billsPage, setBillsPage] = useState(1)
  const [billsLoading, setBillsLoading] = useState(false)
  const [billsError, setBillsError] = useState('')
  const billsRequestId = useRef(0)

  useEffect(() => {
    if (!location.pathname.startsWith('/dashboard') || activeTab !== 'statement') return

    let active = true
    setStatementLoading(true)

    getStatement(statementPage, 10)
      .then((res) => {
        if (active) {
          setStatementData(res.data)
          setStatementMeta(res.meta)
        }
      })
      .catch((error: unknown) => {
        if (!active) return
        if (error instanceof Error && error.message === 'UNAUTHORIZED') {
          navigate('/login', { replace: true, state: { sessionExpired: true } })
        }
      })
      .finally(() => {
        if (active) setStatementLoading(false)
      })

    return () => {
      active = false
    }
  }, [location.pathname, activeTab, statementPage, statementRefresh, navigate])

  useEffect(() => {
    if (!isDashboardRoute) return

    let active = true

    getMe()
      .then((data) => {
        if (active) {
          setUser(data.user)
          setActivities(data.activities)
          setDarkMode(data.user.theme === 'DARK')
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
  }, [isDashboardRoute, navigate])

  useEffect(() => {
    if (!isDashboardRoute) return

    let active = true

    getCards()
      .then((cards) => {
        if (!active) return
        setAccountCards(cards)
        setMainCardId(cards.find((card) => card.main)?.id ?? null)
        setCardsLoadError('')
      })
      .catch((error: unknown) => {
        if (!active) return
        if (error instanceof Error && error.message === 'UNAUTHORIZED') {
          navigate('/login', { replace: true, state: { sessionExpired: true } })
          return
        }
        setCardsLoadError(error instanceof Error ? error.message : 'Não foi possível carregar seus cartões.')
      })
      .finally(() => {
        if (active) setCardsLoading(false)
      })

    return () => {
      active = false
    }
  }, [isDashboardRoute, navigate])

  const mainCard = accountCards.find((card) => card.id === mainCardId) ?? null
  const mainCardTheme = mainCard?.theme ?? 0
  const firstName = user?.name.trim().split(/\s+/)[0] ?? '???'
  const formattedName = firstName
    ? firstName.charAt(0).toLocaleUpperCase('pt-BR') + firstName.slice(1).toLocaleLowerCase('pt-BR')
    : 'Olá'
  const formattedBalance = Number(user?.balance ?? 0).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  })
  const statementTotals = statementData.reduce((totals, item) => {
    const amount = Number(item.amount)
    if (!Number.isFinite(amount) || amount < 0) return totals
    const isOutgoing = user?.id ? item.senderId === user.id : true
    return isOutgoing
      ? { ...totals, outgoing: totals.outgoing + amount }
      : { ...totals, incoming: totals.incoming + amount }
  }, { incoming: 0, outgoing: 0 })
  const activeLabel = activeTab === 'profile' ? 'Meu perfil' : activeTab === 'pix' ? 'Pix' : activeTab === 'cards' ? 'Cartões' : activeTab === 'bills' ? 'Contas' : activeTab === 'pay' ? 'Pagar' : activeTab === 'invoice' ? 'Simular fatura' : activeTab === 'invoices' ? 'Faturas' : activeTab === 'transfer' ? 'Detalhes da transferência' : navigation.find((item) => item.id === activeTab)?.label
  function goToTab(tab: Tab) {
    if (tab === 'transfer') return
    const path = tabPaths[tab]
    if (location.pathname !== path) navigate(path)
  }

  const refreshAccount = useCallback(async () => {
    const data = await getMe()
    setUser(data.user)
    setActivities(data.activities)
    setLoadError('')
  }, [])
  const handleOpenCardHandled = useCallback(() => setOpenCardId(null), [])

  const loadBills = useCallback(async (page: number) => {
    const requestId = billsRequestId.current + 1
    billsRequestId.current = requestId
    setBillsLoading(true)
    setBillsError('')

    try {
      const response = await getBills(page, 5)
      if (requestId !== billsRequestId.current) return
      setBills(response.data)
      setSelectedBill((current) => current
        ? response.data.find((bill) => bill.id === current.id) ?? null
        : null)
      setBillsMeta(response.meta)
      setBillsPage(response.meta.page)
    } catch (error) {
      if (requestId !== billsRequestId.current) return
      if (error instanceof Error && error.message === 'UNAUTHORIZED') {
        navigate('/login', { replace: true, state: { sessionExpired: true } })
        return
      }
      setBillsError(error instanceof Error ? error.message : 'Não foi possível carregar suas contas.')
    } finally {
      if (requestId === billsRequestId.current) setBillsLoading(false)
    }
  }, [navigate])

  useEffect(() => {
    function refreshLiveData() {
      void refreshAccount().catch((error: unknown) => {
        if (error instanceof Error && error.message === 'UNAUTHORIZED') {
          navigate('/login', { replace: true, state: { sessionExpired: true } })
          return
        }
        setLoadError(error instanceof Error ? error.message : 'Não foi possível atualizar sua conta.')
      })
      void getCards()
        .then((cards) => {
          setAccountCards(cards)
          setMainCardId(cards.find((card) => card.main)?.id ?? null)
          setCardsLoadError('')
        })
        .catch((error: unknown) => {
          if (error instanceof Error && error.message === 'UNAUTHORIZED') {
            navigate('/login', { replace: true, state: { sessionExpired: true } })
            return
          }
          setCardsLoadError(error instanceof Error ? error.message : 'Não foi possível atualizar seus cartões.')
        })

      if (activeTab === 'statement') {
        setStatementRefresh((current) => current + 1)
      }
      if (activeTab === 'bills' || activeTab === 'pay') {
        void loadBills(billsPage)
      }
    }

    window.addEventListener('maze:account-updated', refreshLiveData)
    return () => window.removeEventListener('maze:account-updated', refreshLiveData)
  }, [activeTab, billsPage, loadBills, navigate, refreshAccount])

  useEffect(() => {
    if (!location.pathname.startsWith('/dashboard')) {
      return
    }

    let active = true
    let reconnectTimer: number | undefined
    let reconnectDelay = 1000
    let socket: WebSocket | null = null

    function connect() {
      if (!active) return
      setRealtimeStatus('connecting')
      const socketUrl = new URL('/ws', API_URL);

      socketUrl.protocol =
      socketUrl.protocol === 'https:' ? 'wss:' : 'ws:';

      socket = new WebSocket(socketUrl);

      socket.onopen = () => {
        if (!active) return
        reconnectDelay = 1000
        setRealtimeStatus('connected')
      }

      socket.onmessage = (event) => {
        if (typeof event.data !== 'string') return
        let message: unknown
        try {
          message = JSON.parse(event.data)
        } catch {
          return
        }
        if (
          typeof message === 'object'
          && message !== null
          && 'type' in message
          && message.type === 'account.updated'
        ) {
          window.dispatchEvent(new Event('maze:account-updated'))
        }
      }

      socket.onclose = (event) => {
        if (!active) return
        setRealtimeStatus('offline')
        if (event.code === 4401) {
          navigate('/login', { replace: true, state: { sessionExpired: true } })
          return
        }
        reconnectTimer = window.setTimeout(connect, reconnectDelay)
        reconnectDelay = Math.min(reconnectDelay * 2, 15_000)
      }

      socket.onerror = () => socket?.close()
    }

    connect()
    return () => {
      active = false
      if (reconnectTimer !== undefined) window.clearTimeout(reconnectTimer)
      socket?.close(1000, 'Page changed')
    }
  }, [location.pathname, navigate])

  function openBills() {
    setSelectedBill(null)
    void loadBills(1)
    goToTab('bills')
  }

  function openTransfer(transactionId: string, origin: 'home' | 'statement') {
    navigate(`/dashboard/transfers/${encodeURIComponent(transactionId)}?from=${origin}`)
  }

  async function toggleUserTheme() {
    if (themeUpdating) return
    setThemeUpdating(true)
    setThemeError('')
    try {
      const theme = await changeUserTheme()
      setDarkMode(theme === 'DARK')
      setUser((current) => current ? { ...current, theme } : current)
    } catch (error) {
      if (error instanceof Error && error.message === 'UNAUTHORIZED') {
        navigate('/login', { replace: true, state: { sessionExpired: true } })
        return
      }
      setThemeError(error instanceof Error ? error.message : 'Não foi possível alterar o tema.')
    } finally {
      setThemeUpdating(false)
    }
  }

  async function handleLogout() {
    if (logoutLoading) return
    setLogoutLoading(true)
    setLogoutError('')
    try {
      await logoutAccount()
      navigate('/login', { replace: true })
    } catch (error) {
      setLogoutError(error instanceof Error ? error.message : 'Não foi possível encerrar sua sessão.')
    } finally {
      setLogoutLoading(false)
    }
  }

  function markBillAsPaid(billId: string, method: 'balance' | 'card', amount: number, cardId?: string) {
    setBills((current) => current.map((bill) => bill.id === billId ? { ...bill, status: 'PAGO' } : bill))
    setSelectedBill((current) => current?.id === billId ? { ...current, status: 'PAGO' } : current)
    if (method === 'balance') {
      setUser((current) => current
        ? { ...current, balance: Math.max(0, Math.round((Number(current.balance) - amount) * 100) / 100).toFixed(2) }
        : current)
    } else if (cardId) {
      setAccountCards((current) => current.map((card) => card.id === cardId
        ? { ...card, freeLimit: Math.max(0, Math.round((Number(card.freeLimit) - amount) * 100) / 100).toFixed(2) }
        : card))
    }
  }

  const dashboard = (
    <div className={`bank-app${darkMode ? ' theme-dark' : ''}${activeTab === 'home' ? ' dashboard-home-active' : ''} page-bg-${activeTab}`}>
      <aside className="sidebar">
        <a className="brand" href="/dashboard" onClick={(event) => { event.preventDefault(); goToTab('home') }} aria-label="Maze Bank, início">
          <span className="brand-mark">M</span>
          <span className="brand-copy"><strong>MAZE BANK</strong><small>OF CASTALDI</small></span>
        </a>

        <div className="sidebar-label">MENU PRINCIPAL</div>
        <nav className="side-nav" aria-label="Navegação principal">
          {navigation.map(({ id, label, icon: Icon }) => (
            <button
              className={`side-link${activeTab === id || (activeTab === 'pix' && id === 'home') || (activeTab === 'transfer' && transferReturnTab === id) ? ' active' : ''}`}
              key={id}
              onClick={() => goToTab(id)}
              type="button"
              aria-current={activeTab === id || (activeTab === 'pix' && id === 'home') || (activeTab === 'transfer' && transferReturnTab === id) ? 'page' : undefined}
            >
              <Icon size={18} strokeWidth={1.8} />
              <span>{label}</span>
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <button className="profile-row" type="button" aria-current={activeTab === 'profile' ? 'page' : undefined} onClick={() => goToTab('profile')}>
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
            <span
              className={`account-status${realtimeStatus === 'connected' ? ' is-online' : realtimeStatus === 'connecting' ? ' is-connecting' : ' is-offline'}`}
              title={realtimeStatus === 'connected' ? 'Atualizações em tempo real ativas' : 'Atualizações em tempo real indisponíveis no momento'}
              aria-label={realtimeStatus === 'connected'
                ? 'Atualizações em tempo real ativas'
                : realtimeStatus === 'connecting'
                  ? 'Conectando às atualizações em tempo real'
                  : 'Atualizações em tempo real offline'}
            >
              <i /> {realtimeStatus === 'connected' ? 'Ao vivo' : realtimeStatus === 'connecting' ? 'Conectando' : 'Offline'}
            </span>
            <button className="top-avatar" type="button" aria-label="Abrir perfil de demonstração" aria-current={activeTab === 'profile' ? 'page' : undefined} onClick={() => goToTab('profile')}>{formattedName.slice(0, 1)}</button>
          </div>
        </header>

        <main className="page-content">
          {activeTab === 'transfer' && selectedTransferId && (
            <TransferDetailPage
              key={selectedTransferId}
              transactionId={selectedTransferId}
              userId={user?.id}
              onBack={() => goToTab(transferReturnTab)}
            />
          )}

          {activeTab === 'home' && (
            <>
              <section className="page-heading dashboard-welcome">
                <div><span className="eyebrow">{todayLabel}</span><h1>Olá, {formattedName}</h1><p>Veja o resumo da sua conta hoje.</p></div>
                <button className="quiet-button" type="button" aria-label="Ver extrato" title="Ver extrato" onClick={() => goToTab('statement')}><FileClock size={16} /> Ver extrato</button>
              </section>

              {loadError && <div className="inline-alert" role="alert">{loadError}</div>}

              <section className="overview-grid dashboard-overview" aria-label="Resumo da conta">
                <article className="balance-panel">
                  <div className="balance-panel-top"><span className="balance-label"><Wallet size={16} /> SALDO DISPONÍVEL</span><span className="balance-updated"><i /> ATUALIZADO AGORA</span></div>
                  <div className="balance-line"><p ref={balanceAmountRef}>{loading ? 'Carregando...' : loadError ? 'Indisponível' : balanceHidden ? 'R$ ••••••' : formattedBalance}</p><button className="balance-visibility" type="button" aria-label={balanceHidden ? 'Mostrar saldo' : 'Ocultar saldo'} title={balanceHidden ? 'Mostrar saldo' : 'Ocultar saldo'} onClick={() => setBalanceHidden(!balanceHidden)}>{balanceHidden ? <Eye size={18} /> : <EyeOff size={18} />}</button></div>
                  <div className="balance-panel-footer"><span>Maze Bank <b>•</b> Conta pessoal</span><button type="button" onClick={() => goToTab('statement')}>Detalhes da conta <ArrowUpRight size={15} /></button></div>
                  <span className="balance-watermark" aria-hidden="true">M</span>
                </article>
                <div className="dashboard-card-group">
                  <button
                    className={`account-card-face wallet-card-theme-${mainCardTheme}${mainCard?.status === 'BLOQUEADO' ? ' account-card-blocked' : ''}`}
                    type="button"
                    onClick={() => {
                      setOpenCardId(mainCard?.id ?? null)
                      goToTab('cards')
                    }}
                    aria-label={mainCard ? `Ver detalhes do cartão principal ${mainCard.name}, final ${mainCard.lastFour}` : 'Abrir carteira de cartões'}
                  >
                    <span className="dashboard-card-orbit dashboard-card-orbit-one" />
                    <span className="dashboard-card-orbit dashboard-card-orbit-two" />
                    {mainCard ? (
                      <>
                        <div className="dashboard-card-top">
                          <span className="dashboard-card-brand"><span className="dashboard-card-mark">M</span> MAZE BANK</span>
                          <span className="dashboard-card-badge">
                            {mainCard.status === 'BLOQUEADO' ? 'BLOQUEADO' : <><Star size={10} fill="currentColor" /> PRINCIPAL</>}
                          </span>
                        </div>
                        <span className="dashboard-card-chip" aria-label="Chip do cartão"><i /><i /><i /><i /></span>
                        <strong className="dashboard-card-number">•••• &nbsp;•••• &nbsp;•••• &nbsp;{mainCard.lastFour}</strong>
                        <div className="dashboard-card-footer">
                          <span className="dashboard-card-owner">{mainCard.name}</span>
                          <span className="dashboard-card-expiry">
                            <small>VALIDADE</small>
                            {new Date(mainCard.validateDate).toLocaleDateString('pt-BR', { month: '2-digit', year: '2-digit', timeZone: 'UTC' })}
                          </span>
                        </div>
                      </>
                    ) : (
                      <div className="dashboard-card-empty">
                        <span>{cardsLoading ? 'CARREGANDO' : 'CARTÃO MAZE BANK'}</span>
                        <strong>{cardsLoadError ? 'Cartão indisponível' : 'Seu cartão principal aparecerá aqui'}</strong>
                        <p>{cardsLoadError || (accountCards.length ? 'Escolha um cartão na sua carteira.' : 'Acesse sua carteira para conferir seus cartões.')}</p>
                      </div>
                    )}
                  </button>
                  <button className="dashboard-card-link" type="button" onClick={() => goToTab('cards')}>
                    <span className="dashboard-card-link-icon"><CreditCard size={16} /></span>
                    <span className="dashboard-card-link-copy">
                      <strong>Gerenciar cartões</strong>
                      <small>Acesse sua carteira Maze</small>
                    </span>
                    <ArrowRight size={16} />
                  </button>
                </div>
              </section>

              <section className="quick-section dashboard-quick-section">
                <div className="section-heading"><div><h2>Atalhos</h2><p>O que você quer fazer?</p></div></div>
                <div className="quick-actions">
                  <button className="quick-action" type="button" onClick={() => goToTab('pix')}><span className="quick-icon pix-icon"><QrCode size={20} /></span><span><strong>Fazer um Pix</strong><small>Envie dinheiro em segundos</small></span><ChevronRight size={17} /></button>
                  <button className="quick-action" type="button" onClick={openBills}><span className="quick-icon pay-icon"><ArrowUpRight size={20} /></span><span><strong>Pagar uma conta</strong><small>Boletos e contas do dia a dia</small></span><ChevronRight size={17} /></button>
                  <button className="quick-action" type="button" onClick={() => goToTab('invoice')}><span className="quick-icon invoice-icon"><CreditCard size={20} /></span><span><strong>Simular Fatura</strong><small>Simule uma nova fatura</small></span><ChevronRight size={17} /></button>
                  <button className="quick-action" type="button" onClick={() => goToTab('invoices')}><span className="quick-icon invoices-icon"><FileClock size={20} /></span><span><strong>Ver Faturas</strong><small>Acesse suas faturas do cartão</small></span><ChevronRight size={17} /></button>
                </div>
              </section>

              <section className="activity-section dashboard-activity-section">
                <div className="section-heading activity-heading"><div><h2>Atividade recente</h2><p>Suas movimentações mais recentes</p></div><button className="text-link" type="button" onClick={() => goToTab('statement')}>Ver tudo <ArrowUpRight size={15} /></button></div>
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
                        <button
                          key={item.id}
                          className="activity-item dashboard-activity-item"
                          type="button"
                          onClick={() => openTransfer(item.id, 'home')}
                          aria-label={`Ver detalhes da transferência ${isOutgoing ? 'enviada' : 'recebida'} de ${formattedAmount}`}
                        >
                          <span className={`activity-item-icon ${isOutgoing ? 'sent' : 'received'}`}>
                            {isOutgoing ? <ArrowUpRight size={18} /> : <ArrowDownLeft size={18} />}
                          </span>
                          <div className="activity-item-details">
                            <strong className="activity-item-title">
                              {item.description?.trim() || (isOutgoing ? 'Transferência enviada' : 'Transferência recebida')}
                            </strong>
                            <span className="activity-item-meta">
                              <span className="activity-meta-type">Pix</span>
                              <span className="activity-meta-separator">•</span>
                              <time dateTime={item.createdAt}>{formattedDate}</time>
                              {(isOutgoing ? item.receiver?.name : item.sender?.name) && (
                                <>
                                  <span className="activity-meta-separator">|</span>
                                  <span className="activity-meta-party">
                                    {isOutgoing
                                      ? `Para: ${item.receiver?.name}`
                                      : `De: ${item.sender?.name}`}
                                  </span>
                                </>
                              )}
                            </span>
                          </div>
                          <span className={`activity-item-amount ${isOutgoing ? 'sent' : 'received'}`}>
                            {isOutgoing ? `- ${formattedAmount}` : `+ ${formattedAmount}`}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                )}
              </section>
            </>
          )}

          {activeTab === 'pix' && <PixPage onBack={() => goToTab('home')} onTransferComplete={refreshAccount} />}

          {activeTab === 'invoice' && (
            <SimulateInvoicePage
              cards={accountCards}
              cardsLoading={cardsLoading}
              cardsError={cardsLoadError}
              onBack={() => goToTab('home')}
            />
          )}

          {activeTab === 'invoices' && (
            <InvoiceHistoryPage
              cards={accountCards}
              cardsLoading={cardsLoading}
              cardsError={cardsLoadError}
              balance={Number(user?.balance ?? 0)}
              onBack={() => goToTab('home')}
              onOpenCards={() => goToTab('cards')}
              onPaymentComplete={() => {
                void refreshAccount().catch((error: unknown) => {
                  setLoadError(error instanceof Error ? error.message : 'O pagamento foi feito, mas não foi possível atualizar o saldo.')
                })
                void getCards().then((cards) => {
                  setAccountCards(cards)
                  setMainCardId(cards.find((card) => card.main)?.id ?? null)
                  setCardsLoadError('')
                }).catch((error: unknown) => {
                  if (error instanceof Error && error.message === 'UNAUTHORIZED') {
                    navigate('/login', { replace: true, state: { sessionExpired: true } })
                    return
                  }
                  setCardsLoadError(error instanceof Error ? error.message : 'O pagamento foi feito, mas não foi possível atualizar o limite do cartão.')
                })
              }}
            />
          )}

          {activeTab === 'bills' && (
            <BillsPage
              bills={bills}
              meta={billsMeta}
              page={billsPage}
              loading={billsLoading}
              error={billsError}
              onBack={() => goToTab('home')}
              onPageChange={(page) => void loadBills(page)}
              onRetry={() => void loadBills(billsPage)}
              onSelectBill={(bill) => {
                setSelectedBill(bill)
                goToTab('pay')
              }}
            />
          )}

          {activeTab === 'pay' && selectedBill && (
            <PayPage
              bill={selectedBill}
              cards={accountCards}
              mainCardId={mainCardId}
              balance={Number(user?.balance ?? 0)}
              onBack={() => goToTab('bills')}
              onOpenCards={() => goToTab('cards')}
              onPaymentComplete={markBillAsPaid}
              onBillDeleted={() => {
                setSelectedBill(null)
                goToTab('bills')
                void loadBills(bills.length === 1 && billsPage > 1 ? billsPage - 1 : billsPage)
              }}
            />
          )}

          {activeTab === 'cards' && (
            <CardsPage
              onBack={() => goToTab('home')}
              openCardId={openCardId}
              onOpenCardHandled={handleOpenCardHandled}
              mainCardId={mainCardId}
              onSetMainCard={(card) => {
                setMainCardId(card.id)
                setAccountCards((cards) => {
                  const hasCard = cards.some((currentCard) => currentCard.id === card.id)
                  return [
                    ...cards.map((currentCard) => ({ ...currentCard, main: currentCard.id === card.id })),
                    ...(!hasCard ? [{ ...card, main: true }] : []),
                  ]
                })
              }}
              onSyncCard={(card) => {
                setAccountCards((cards) => {
                  const hasCard = cards.some((currentCard) => currentCard.id === card.id)
                  return [
                    ...cards.map((currentCard) => (
                      currentCard.id === card.id
                        ? { ...card, main: currentCard.id === mainCardId }
                        : currentCard
                    )),
                    ...(!hasCard ? [{ ...card, main: card.id === mainCardId }, ...cards] : []),
                  ]
                })
              }}
              onRemoveMainCard={(cardId) => {
                if (mainCardId === cardId) setMainCardId(null)
                setAccountCards((cards) => cards.filter((card) => card.id !== cardId))
              }}
            />
          )}

          {activeTab === 'profile' && (
            <section className="subpage profile-page">
              <div className="page-heading">
                <div><span className="eyebrow">SUA CONTA MAZE</span><h1>Meu perfil</h1><p>Confira os dados cadastrados na sua conta.</p></div>
              </div>

              {loading ? (
                <div className="profile-load-state" role="status"><UserRound size={20} /><span>Carregando os dados do perfil...</span></div>
              ) : !user ? (
                <div className="profile-load-state profile-load-error" role="alert">{loadError || 'Não foi possível carregar os dados do perfil.'}</div>
              ) : (
                <>
                  <article className="profile-hero">
                    <div className="profile-hero-identity">
                      <span className="profile-hero-avatar" aria-hidden="true">{getUserInitials(user.name)}</span>
                      <div className="profile-hero-copy">
                        <span className="profile-hero-kicker"><BadgeCheck size={14} /> CONTA PESSOAL</span>
                        <h2>{user.name}</h2>
                        <p>{user.email || 'E-mail não informado'}</p>
                      </div>
                    </div>
                    <span className="profile-member-badge"><i /> Cliente desde {formatMemberSince(user.createdAt)}</span>
                    <span className="profile-hero-watermark" aria-hidden="true">M</span>
                  </article>

                  <div className="profile-detail-grid">
                    <section className="profile-detail-card" aria-labelledby="profile-personal-heading">
                      <div className="profile-card-heading"><span className="profile-detail-icon"><UserRound size={17} /></span><div><h2 id="profile-personal-heading">Dados pessoais</h2><p>Informações cadastradas na sua conta</p></div></div>
                      <dl className="profile-data-list">
                        <div className="profile-data-row"><dt><UserRound size={15} /> Nome completo</dt><dd>{user.name}</dd></div>
                        <div className="profile-data-row"><dt><Mail size={15} /> E-mail</dt><dd>{user.email || 'Não informado'}</dd></div>
                        <div className="profile-data-row"><dt><Fingerprint size={15} /> CPF</dt><dd>{maskCpf(user.cpf)}</dd></div>
                      </dl>
                    </section>

                    <div className="profile-side-column">
                      <section className="profile-detail-card profile-account-card" aria-labelledby="profile-account-heading">
                        <div className="profile-card-heading"><span className="profile-detail-icon"><CreditCard size={17} /></span><div><h2 id="profile-account-heading">Dados da conta</h2><p>Informações da conta Maze Bank</p></div></div>
                        <dl className="profile-data-list">
                          <div className="profile-data-row"><dt>Identificador</dt><dd className="profile-id-value" title={user.id || undefined}>{user.id || 'Indisponível'}</dd></div>
                          <div className="profile-data-row"><dt>Tipo de conta</dt><dd>Conta pessoal</dd></div>
                          <div className="profile-data-row"><dt>Cadastro</dt><dd><CalendarDays size={14} /> {formatMemberSince(user.createdAt)}</dd></div>
                          <div className="profile-data-row"><dt>Tema da conta</dt><dd>{user.theme === 'DARK' ? 'Escuro' : 'Claro'}</dd></div>
                        </dl>
                        <div className="profile-account-status"><i /> Conta ativa</div>
                      </section>
                    </div>
                  </div>
                </>
              )}
            </section>
          )}

          {activeTab === 'statement' && (
            <section className="subpage statement-page">
              <div className="page-heading">
                <div>
                  <span className="eyebrow">SUA CONTA</span>
                  <h1>Extrato</h1>
                  <p>Uma visão clara de cada movimentação da sua conta.</p>
                </div>
              </div>

              {statementLoading && statementData.length === 0 ? (
                <div className="empty-page statement-empty">
                  <span className="empty-icon"><FileClock size={22} /></span>
                  <h2>Carregando extrato...</h2>
                </div>
              ) : statementData.length === 0 ? (
                <div className="empty-page statement-empty">
                  <span className="empty-icon"><FileClock size={22} /></span>
                  <h2>Seu extrato está começando</h2>
                  <p>As movimentações aparecerão aqui quando você realizar ou receber transferências.</p>
                </div>
              ) : (
                <div className="statement-container">
                  <section className="statement-overview" aria-label="Resumo das movimentações desta página">
                    <span className="statement-overview-watermark" aria-hidden="true">M</span>
                    <div className="statement-overview-heading">
                      <span className="statement-overview-icon"><FileClock size={20} /></span>
                      <div>
                        <span className="statement-overview-kicker">MOVIMENTAÇÕES DA CONTA</span>
                        <h2>Seu dinheiro em movimento</h2>
                      </div>
                      <span className="statement-page-count">{statementData.length} {statementData.length === 1 ? 'registro' : 'registros'}</span>
                    </div>
                    <div className="statement-summary-grid">
                      <article className="statement-summary-item">
                        <span className="statement-summary-label">Entradas nesta página</span>
                        <strong className="statement-summary-value incoming">
                          + {statementTotals.incoming.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </strong>
                      </article>
                      <article className="statement-summary-item">
                        <span className="statement-summary-label">Saídas nesta página</span>
                        <strong className="statement-summary-value outgoing">
                          − {statementTotals.outgoing.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </strong>
                      </article>
                    </div>
                  </section>

                  <section className="statement-ledger" aria-label="Lista de movimentações">
                    <div className="statement-ledger-heading">
                      <div>
                        <span className="statement-ledger-kicker">HISTÓRICO</span>
                        <h2>Movimentações recentes</h2>
                      </div>
                      <span className="statement-sort"><CalendarDays size={14} /> Mais recentes primeiro</span>
                    </div>
                    <div className="activity-list">
                      {statementData.map((item) => {
                        const isOutgoing = user?.id ? item.senderId === user.id : true
                        const formattedAmount = Number(item.amount).toLocaleString('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                        })
                        const formattedDate = new Intl.DateTimeFormat('pt-BR', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        }).format(new Date(item.createdAt))

                        return (
                          <button
                            key={item.id}
                            className={`activity-item${isOutgoing ? ' is-outgoing' : ' is-incoming'}`}
                            type="button"
                            onClick={() => openTransfer(item.id, 'statement')}
                            aria-label={`Ver detalhes da transferência ${isOutgoing ? 'enviada' : 'recebida'} de ${formattedAmount}`}
                          >
                            <span className={`activity-item-icon ${isOutgoing ? 'sent' : 'received'}`}>
                              {isOutgoing ? <ArrowUpRight size={20} /> : <ArrowDownLeft size={20} />}
                            </span>
                            <div className="activity-item-details">
                              <strong className="activity-item-title">
                                {item.description?.trim() || (isOutgoing ? 'Transferência enviada' : 'Transferência recebida')}
                              </strong>
                              <span className="activity-item-meta">
                                <span className="activity-meta-type"><QrCode size={13} /> Pix</span>
                                <time dateTime={item.createdAt}>{formattedDate}</time>
                                {(isOutgoing ? item.receiver?.name : item.sender?.name) && (
                                  <span className="activity-meta-party">
                                    {isOutgoing ? `Para ${item.receiver?.name}` : `De ${item.sender?.name}`}
                                  </span>
                                )}
                              </span>
                            </div>
                            <div className="activity-item-result">
                              <span className="activity-status"><i /> Concluído</span>
                              <strong className={`activity-item-amount ${isOutgoing ? 'sent' : 'received'}`}>
                                {isOutgoing ? `− ${formattedAmount}` : `+ ${formattedAmount}`}
                              </strong>
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  </section>

                  {statementMeta && statementMeta.totalPages > 1 && (
                    <div className="pagination-controls statement-pagination">
                      <button
                        className="quiet-button"
                        type="button"
                        disabled={!statementMeta.hasPrevPage || statementLoading}
                        onClick={() => setStatementPage((prev) => Math.max(1, prev - 1))}
                      >
                        Anterior
                      </button>
                      <span>
                        Página {statementMeta.page} de {statementMeta.totalPages} ({statementMeta.totalItems} transações)
                      </span>
                      <button
                        className="quiet-button"
                        type="button"
                        disabled={!statementMeta.hasNextPage || statementLoading}
                        onClick={() => setStatementPage((prev) => prev + 1)}
                      >
                        Próxima
                      </button>
                    </div>
                  )}
                </div>
              )}
            </section>
          )}

          {activeTab === 'settings' && (
            <section className="subpage settings-page">
              <div className="page-heading"><div><span className="eyebrow">PERSONALIZE</span><h1>Ajustes da conta</h1><p>Gerencie suas preferências do Maze Bank.</p></div></div>
              <div className="settings-list">
                <div className="setting-row"><span className="setting-icon"><Moon size={19} /></span><span className="setting-copy"><strong>Modo escuro</strong><small>Preferência salva na sua conta</small></span><button className={`switch${darkMode ? ' is-on' : ''}`} type="button" role="switch" aria-checked={darkMode} aria-label={darkMode ? 'Desativar modo escuro' : 'Ativar modo escuro'} disabled={themeUpdating || loading} onClick={() => void toggleUserTheme()}><span /></button></div>
                <div className="setting-row">
                  <span className="setting-icon"><LogOut size={19} /></span>
                  <span className="setting-copy"><strong>Sessão da conta</strong><small>Encerre sua sessão neste dispositivo.</small></span>
                  <button className="logout-button" type="button" onClick={() => void handleLogout()} disabled={logoutLoading} aria-busy={logoutLoading}>
                    {logoutLoading ? 'Saindo...' : 'Sair'}
                    {!logoutLoading && <LogOut size={16} />}
                  </button>
                </div>
              </div>
              {themeError && <div className="theme-note theme-error" role="alert">{themeError}</div>}
              {logoutError
                ? <div className="theme-note theme-error" role="alert">{logoutError}</div>
                : !themeError && <div className="theme-note" role="status"><Sun size={16} /> A preferência de tema é salva na sua conta.</div>}
            </section>
          )}
        </main>

        <footer className="page-footer"><span>© 2026 Maze Bank of Castaldi</span><span>Seu dinheiro, no seu ritmo.</span></footer>
      </div>

      <nav className="mobile-nav" aria-label="Navegação principal">
        {navigation.map(({ id, label, icon: Icon }) => {
          const isActive = activeTab === id || (activeTab === 'pix' && id === 'home') || (activeTab === 'transfer' && transferReturnTab === id)
          return <button className={isActive ? 'active' : ''} key={id} onClick={() => goToTab(id)} type="button" aria-current={isActive ? 'page' : undefined}><Icon size={19} /><span>{label}</span></button>
        })}
      </nav>
    </div>
  )

  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/dashboard/*" element={dashboard} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
