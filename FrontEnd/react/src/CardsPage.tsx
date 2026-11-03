import { useEffect, useState, type FormEvent } from 'react'
import { createPortal } from 'react-dom'
import {
  ArrowRight,
  ArrowLeft,
  ArrowUpRight,
  CalendarDays,
  Check,
  CheckCircle2,
  CreditCard,
  Eye,
  EyeOff,
  Globe2,
  LockKeyhole,
  Plus,
  ShoppingBag,
  ShieldCheck,
  Sparkles,
  Star,
  Trash2,
  X,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { blockCard, createCard, deleteCard, getCards, revealCardSensitiveDetails, setMainCard, unblockCard } from './services/api'
import type { AccountCard, CardTheme } from './services/api'
import { getModalRoot } from './modalRoot'
import './CardsPage.css'

interface CardsPageProps {
  onBack: () => void
  openCardId: string | null
  onOpenCardHandled: () => void
  mainCardId: string | null
  onSetMainCard: (card: AccountCard) => void
  onSyncCard: (card: AccountCard) => void
  onRemoveMainCard: (cardId: string) => void
}

interface CardItem {
  id: string
  name: string
  number: string
  expiry: string
  limit: string
  totalLimit: number
  availableLimit: number
  status: 'active' | 'blocked'
  theme: CardTheme
  accountCard: AccountCard
}

type CardAction = 'block' | 'unblock' | 'delete'

const CARD_LIMIT = 3

function toCardItem(card: AccountCard): CardItem {
  const totalLimit = Number(card.totalLimit)
  const availableLimit = Number(card.freeLimit)
  const validateDate = new Date(card.validateDate)
  if (!Number.isFinite(totalLimit) || !Number.isFinite(availableLimit) || Number.isNaN(validateDate.getTime())) {
    throw new Error('A resposta do servidor contém dados inválidos para um cartão.')
  }

  return {
    id: card.id,
    name: card.name,
    number: `•••• •••• •••• ${card.lastFour}`,
    expiry: validateDate.toLocaleDateString('pt-BR', {
      month: '2-digit',
      year: '2-digit',
      timeZone: 'UTC',
    }),
    limit: totalLimit.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
    totalLimit,
    availableLimit,
    status: card.status === 'ATIVO' ? 'active' : 'blocked',
    theme: card.theme,
    accountCard: card,
  }
}

export default function CardsPage({ onBack, openCardId, onOpenCardHandled, mainCardId, onSetMainCard, onSyncCard, onRemoveMainCard }: CardsPageProps) {
  const navigate = useNavigate()
  const [cards, setCards] = useState<CardItem[]>([])
  const [cardsLoading, setCardsLoading] = useState(true)
  const [cardsLoadError, setCardsLoadError] = useState('')
  const [cardsReload, setCardsReload] = useState(0)
  const [showNewModal, setShowNewModal] = useState(false)
  const [cardName, setCardName] = useState('')
  const [monthlyIncome, setMonthlyIncome] = useState('2500')
  const [cardTheme, setCardTheme] = useState<CardTheme>(0)
  const [successMsg, setSuccessMsg] = useState('')
  const [actionError, setActionError] = useState('')
  const [updatingCardId, setUpdatingCardId] = useState<string | null>(null)
  const [settingMainCardId, setSettingMainCardId] = useState<string | null>(null)
  const [pendingCardAction, setPendingCardAction] = useState<{ card: CardItem; action: CardAction } | null>(null)
  const [statusPassword, setStatusPassword] = useState('')
  const [statusPasswordError, setStatusPasswordError] = useState('')
  const [requestError, setRequestError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showBenefits, setShowBenefits] = useState(false)
  const [selectedCard, setSelectedCard] = useState<CardItem | null>(null)
  const hasReachedLimit = cards.length >= CARD_LIMIT

  useEffect(() => {
    let active = true

    getCards()
      .then((accountCards) => {
        if (!active) return
        const cardItems = accountCards.map((card) => toCardItem(card))
        setCards(cardItems)
        if (openCardId) {
          const cardToOpen = cardItems.find((card) => card.id === openCardId)
          if (cardToOpen) setSelectedCard(cardToOpen)
          onOpenCardHandled()
        }
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
  }, [cardsReload, navigate, openCardId, onOpenCardHandled])

  useEffect(() => {
    if (!showNewModal) return

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape' && !isSubmitting) setShowNewModal(false)
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [showNewModal, isSubmitting])

  useEffect(() => {
    if (!pendingCardAction) return

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape' && !updatingCardId) closeCardActionConfirmation()
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [pendingCardAction, updatingCardId])

  function showMessage(message: string) {
    setSuccessMsg(message)
    window.setTimeout(() => setSuccessMsg(''), 4000)
  }

  function scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' })
    document.querySelector('.main-column')?.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function openBenefits() {
    setShowBenefits(true)
    scrollToTop()
  }

  function closeBenefits() {
    setShowBenefits(false)
    scrollToTop()
  }

  function closeCardDetails() {
    setSelectedCard(null)
    scrollToTop()
  }

  function retryCardsLoad() {
    setCardsLoadError('')
    setCardsLoading(true)
    setCardsReload((current) => current + 1)
  }

  function openStatusConfirmation(card: CardItem) {
    openCardActionConfirmation(card, card.status === 'blocked' ? 'unblock' : 'block')
  }

  function openCardActionConfirmation(card: CardItem, action: CardAction) {
    setPendingCardAction({ card, action })
    setStatusPassword('')
    setStatusPasswordError('')
  }

  function closeCardActionConfirmation() {
    setPendingCardAction(null)
    setStatusPassword('')
    setStatusPasswordError('')
  }

  async function handleSetMainCard(card: CardItem) {
    if (settingMainCardId || mainCardId === card.id) return

    setSettingMainCardId(card.id)
    setActionError('')
    try {
      await setMainCard(card.id)
      onSetMainCard({ ...card.accountCard, main: true })
      showMessage(`O cartão “${card.name}” agora é o principal.`)
    } catch (error: unknown) {
      if (error instanceof Error && error.message === 'UNAUTHORIZED') {
        navigate('/login', { replace: true, state: { sessionExpired: true } })
        return
      }

      setActionError(error instanceof Error
        ? error.message
        : 'Não foi possível definir o cartão principal.')
    } finally {
      setSettingMainCardId(null)
    }
  }

  async function handleCardAction(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!pendingCardAction || updatingCardId) return

    const { card, action } = pendingCardAction
    setUpdatingCardId(card.id)
    setStatusPasswordError('')
    try {
      if (action === 'delete') {
        await deleteCard(card.id, statusPassword)
        setCards((currentCards) => currentCards.filter((currentCard) => currentCard.id !== card.id))
        setSelectedCard((currentCard) => currentCard?.id === card.id ? null : currentCard)
        onRemoveMainCard(card.id)
        showMessage(`O cartão “${card.name}” foi excluído.`)
      } else {
        const status = action === 'unblock'
          ? await unblockCard(card.id, statusPassword)
          : await blockCard(card.id, statusPassword)
        const updatedCardStatus = status === 'ATIVO' ? 'active' : 'blocked'
        onSyncCard({
          ...card.accountCard,
          status,
        })
        setCards((currentCards) => currentCards.map((currentCard) => (
          currentCard.id === card.id
            ? {
                ...currentCard,
                status: updatedCardStatus,
                accountCard: { ...currentCard.accountCard, status },
              }
            : currentCard
        )))
        setSelectedCard((currentCard) => currentCard?.id === card.id
          ? { ...currentCard, status: updatedCardStatus }
          : currentCard)
        showMessage(action === 'unblock'
          ? `O cartão “${card.name}” foi desbloqueado.`
          : `O cartão “${card.name}” foi bloqueado.`)
      }
      closeCardActionConfirmation()
    } catch (error: unknown) {
      if (error instanceof Error && error.message === 'UNAUTHORIZED') {
        navigate('/login', { replace: true, state: { sessionExpired: true } })
        return
      }

      setStatusPassword('')
      setStatusPasswordError(error instanceof Error
        ? error.message
        : `Não foi possível ${action === 'delete' ? 'excluir' : action === 'unblock' ? 'desbloquear' : 'bloquear'} o cartão.`)
    } finally {
      setUpdatingCardId(null)
    }
  }

  async function handleCreateCard(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (isSubmitting) return

    if (hasReachedLimit) {
      showMessage('Você já atingiu o limite de 3 cartões.')
      setShowNewModal(false)
      return
    }

    setIsSubmitting(true)
    setRequestError('')

    try {
      const createdCard = await createCard({
        name: cardName.trim(),
        monthlyIncome: Number(monthlyIncome),
        theme: cardTheme,
      })
      const newCard = toCardItem(createdCard)

      setCards((currentCards) => [newCard, ...currentCards])
      onSyncCard(createdCard)
      setShowNewModal(false)
      setCardName('')
      setMonthlyIncome('2500')
      showMessage('Cartão criado com sucesso!')
    } catch (error: unknown) {
      if (error instanceof Error && error.message === 'UNAUTHORIZED') {
        navigate('/login', { replace: true, state: { sessionExpired: true } })
        return
      }

      setRequestError(error instanceof Error ? error.message : 'Não foi possível criar o cartão.')
    } finally {
      setIsSubmitting(false)
    }
  }

  function openNewCardModal() {
    const usedThemes = new Set(cards.map((card) => card.theme))
    const nextTheme = ([0, 1, 2] as const).find((theme) => !usedThemes.has(theme)) ?? 0
    setCardTheme(nextTheme)
    setShowNewModal(true)
  }

  if (showBenefits) return <CardBenefitsPage onBack={closeBenefits} />
  if (selectedCard) return <CardDetailsPage card={selectedCard} onBack={closeCardDetails} />

  return (
    <section className={`cards-page${showNewModal ? ' cards-modal-open' : ''}`} aria-labelledby="cards-title">
      <header className="cards-page-header">
        <button className="cards-back-button" onClick={onBack} type="button">
          <ArrowLeft size={16} />
          <span>Visão geral</span>
        </button>

        <div className="cards-heading-row">
          <div className="cards-heading-copy">
            <span className="cards-eyebrow"><span /> SUA CARTEIRA MAZE</span>
            <h1 id="cards-title">Seus cartões,<br className="cards-title-break" /> do seu jeito.</h1>
            <p>Mais controle para cada compra, em qualquer lugar.</p>
          </div>

          <div className="cards-heading-action">
            <span className="cards-limit-label">
              <CreditCard size={14} />
              {cards.length} de {CARD_LIMIT} cartões
            </span>
            <button
              className="cards-create-button"
              onClick={openNewCardModal}
              type="button"
              disabled={hasReachedLimit || cardsLoading || Boolean(cardsLoadError)}
            >
              <Plus size={17} />
              Novo cartão
            </button>
          </div>
        </div>
      </header>

      {successMsg && (
        <div className="cards-toast" role="status">
          <CheckCircle2 size={18} />
          <span>{successMsg}</span>
          <button onClick={() => setSuccessMsg('')} type="button" aria-label="Fechar aviso">
            <X size={15} />
          </button>
        </div>
      )}
      {actionError && (
        <div className="cards-toast cards-toast-error" role="alert">
          <span>{actionError}</span>
          <button onClick={() => setActionError('')} type="button" aria-label="Fechar erro">
            <X size={15} />
          </button>
        </div>
      )}

      <div className="cards-overview" aria-label="Resumo dos cartões">
        <div className="cards-overview-item">
          <span className="cards-overview-icon"><CreditCard size={17} /></span>
          <span><strong>{cards.length}</strong><small>cartões na carteira</small></span>
        </div>
        <span className="cards-overview-divider" />
        <div className="cards-overview-item">
          <span className="cards-overview-icon cards-overview-icon-green"><ShieldCheck size={17} /></span>
          <span><strong>{cards.length}</strong><small>cartões virtuais</small></span>
        </div>
        <span className="cards-overview-divider" />
        <div className="cards-overview-note">
          <Sparkles size={16} />
          <span>Segurança em primeiro lugar.<br /><strong>Você controla cada cartão.</strong></span>
        </div>
      </div>

      <div className="cards-section-heading">
        <div>
          <span className="cards-section-kicker">VISÃO GERAL</span>
          <h2>Minha carteira</h2>
        </div>
        <span className="cards-section-count">{cards.length} {cards.length === 1 ? 'cartão' : 'cartões'}</span>
      </div>

      {cardsLoading ? (
        <div className="cards-empty" role="status">
          <span><CreditCard size={23} /></span>
          <h3>Carregando seus cartões</h3>
          <p>Estamos buscando sua carteira Maze Bank.</p>
        </div>
      ) : cardsLoadError ? (
        <div className="cards-load-error" role="alert">
          <div>
            <strong>Não foi possível carregar seus cartões</strong>
            <p>{cardsLoadError}</p>
          </div>
          <button onClick={retryCardsLoad} type="button">
            Tentar novamente
          </button>
        </div>
      ) : cards.length > 0 ? (
        <div className="cards-grid">
          {cards.map((card, index) => (
            <article
              className={`wallet-card${mainCardId === card.id ? ' wallet-card-primary' : ''}`}
              key={card.id}
              style={{ animationDelay: `${index * 70}ms` }}
            >
              <button
                className={`wallet-card-face wallet-card-face-button wallet-card-theme-${card.theme}`}
                onClick={() => {
                  setSelectedCard(card)
                  scrollToTop()
                }}
                type="button"
                aria-label={`Ver detalhes do cartão ${card.name}, final ${card.number.slice(-4)}`}
              >
                <div className="wallet-card-orbit wallet-card-orbit-one" />
                <div className="wallet-card-orbit wallet-card-orbit-two" />
                <div className="wallet-card-top">
                  <span className="wallet-card-brand"><span className="wallet-card-mark">M</span> MAZE BANK</span>
                  <span className="wallet-card-top-badges">
                    {mainCardId === card.id && <span className="wallet-card-primary-badge"><Star size={10} fill="currentColor" /> PRINCIPAL</span>}
                    <span className="wallet-card-kind">VIRTUAL</span>
                  </span>
                </div>

                <div className="wallet-card-chip" aria-hidden="true">
                  <span /><span /><span /><span />
                </div>

                <div className="wallet-card-number">{card.number}</div>
                <div className="wallet-card-bottom">
                  <span className="wallet-card-owner">{card.name}</span>
                  <span className="wallet-card-expiry"><small>VALIDADE</small>{card.expiry}</span>
                  <span className="wallet-card-contactless" aria-label="Pagamento por aproximação"><span /><span /><span /></span>
                </div>
              </button>

              <div className="wallet-card-details">
                <div className="wallet-card-limit">
                  <span>Limite configurado</span>
                  <strong>{card.limit}</strong>
                </div>
                <span className={`wallet-card-status${card.status === 'blocked' ? ' status-blocked' : ''}`}>
                  <i /> {card.status === 'active' ? 'Ativo' : 'Bloqueado'}
                </span>
              </div>

              <button
                className={`wallet-card-primary-action${mainCardId === card.id ? ' is-selected' : ''}`}
                onClick={() => void handleSetMainCard(card)}
                type="button"
                disabled={mainCardId === card.id || settingMainCardId !== null || updatingCardId !== null || pendingCardAction !== null}
                aria-pressed={mainCardId === card.id}
              >
                <Star size={14} fill={mainCardId === card.id ? 'currentColor' : 'none'} />
                {settingMainCardId === card.id
                  ? 'Definindo como principal...'
                  : mainCardId === card.id ? 'Cartão principal' : 'Definir como principal'}
              </button>

              <div className="wallet-card-actions">
                <button
                  className={`wallet-card-action${card.status === 'blocked' ? ' wallet-card-action-blocked' : ''}`}
                  onClick={() => openStatusConfirmation(card)}
                  type="button"
                  disabled={updatingCardId !== null || pendingCardAction !== null}
                  aria-label={`${card.status === 'blocked' ? 'Desbloquear' : 'Bloquear'} ${card.name}`}
                >
                  <LockKeyhole size={14} />
                  {updatingCardId === card.id
                    ? (card.status === 'blocked' ? 'Desbloqueando...' : 'Bloqueando...')
                    : card.status === 'blocked' ? 'Desbloquear cartão' : 'Bloquear cartão'}
                </button>
                <button
                  className="wallet-card-delete"
                  onClick={() => openCardActionConfirmation(card, 'delete')}
                  type="button"
                  disabled={updatingCardId !== null || pendingCardAction !== null}
                  aria-label={`Excluir ${card.name}`}
                >
                  <Trash2 size={15} />
                  Excluir cartão
                </button>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="cards-empty">
          <span><CreditCard size={23} /></span>
          <h3>Sua carteira está vazia</h3>
          <p>Crie seu primeiro cartão para começar a organizar suas compras.</p>
          <button className="cards-create-button" onClick={openNewCardModal} type="button">
            <Plus size={17} /> Criar meu primeiro cartão
          </button>
        </div>
      )}

      <button className="cards-security-note" onClick={openBenefits} type="button">
        <span className="cards-security-icon"><Sparkles size={19} /></span>
        <span className="cards-security-copy">
          <strong>Saiba mais sobre seus cartões Maze Bank</strong>
          <small>Descubra como os cartões virtuais e seus limites funcionam.</small>
        </span>
        <ArrowRight size={17} className="cards-security-arrow" />
      </button>

      {showNewModal && createPortal(
        <div
          className="cards-modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !isSubmitting) setShowNewModal(false)
          }}
        >
          <section
            aria-labelledby="cards-modal-title"
            aria-modal="true"
            className="cards-modal"
            role="dialog"
          >
            <div className="cards-modal-heading">
              <span className="cards-modal-icon"><CreditCard size={19} /></span>
              <button
                className="cards-modal-close"
                onClick={() => setShowNewModal(false)}
                type="button"
                aria-label="Fechar"
                disabled={isSubmitting}
              >
                <X size={18} />
              </button>
              <span className="cards-eyebrow"><span /> NOVO CARTÃO</span>
              <h2 id="cards-modal-title">Do que você precisa?</h2>
              <p>Personalize seu novo cartão virtual Maze Bank.</p>
            </div>

            <form className="cards-form" onSubmit={handleCreateCard}>
              <label className="cards-field">
                <span>Nome do cartão</span>
                <input
                  autoFocus
                  maxLength={30}
                  onChange={(event) => setCardName(event.target.value)}
                  placeholder="Ex.: Viagem, assinaturas..."
                  required
                  value={cardName}
                  disabled={isSubmitting}
                />
              </label>

              <label className="cards-field">
                <span>Renda Mensal</span>
                <span className="cards-currency-field">
                  <span>R$</span>
                  <input
                    min="1621"
                    onChange={(event) => setMonthlyIncome(event.target.value)}
                    required
                    step="0.01"
                    type="number"
                    value={monthlyIncome}
                    disabled={isSubmitting}
                  />
                </span>
              </label>

              <fieldset className="cards-color-field" disabled={isSubmitting}>
                <legend>Cor do cartão</legend>
                <div className="cards-color-options">
                  {([
                    { theme: 0, label: 'Preto', className: 'wallet-card-theme-0' },
                    { theme: 1, label: 'Verde', className: 'wallet-card-theme-1' },
                    { theme: 2, label: 'Vermelho', className: 'wallet-card-theme-2' },
                  ] as const).map((option) => (
                    <button
                      aria-pressed={cardTheme === option.theme}
                      className={`cards-color-option${cardTheme === option.theme ? ' is-selected' : ''}`}
                      key={option.theme}
                      onClick={() => setCardTheme(option.theme)}
                      type="button"
                    >
                      <span className={`cards-color-swatch ${option.className}`}><span>M</span></span>
                      <span>{option.label}</span>
                      {cardTheme === option.theme && <Check size={14} />}
                    </button>
                  ))}
                </div>
              </fieldset>

              {requestError && <p className="cards-request-error" role="alert">{requestError}</p>}

              <div className="cards-modal-actions">
                <button className="cards-cancel-button" onClick={() => setShowNewModal(false)} type="button" disabled={isSubmitting}>
                  Cancelar
                </button>
                <button className="cards-submit-button" type="submit" disabled={isSubmitting}>
                  <Check size={16} /> {isSubmitting ? 'Criando cartão...' : 'Criar cartão'}
                </button>
              </div>
              <div className="cards-modal-footnote"><ShieldCheck size={14} /> Seus dados estão protegidos.</div>
            </form>
          </section>
        </div>,
        getModalRoot(),
      )}
      {pendingCardAction && createPortal(
        <div
          className="cards-modal-backdrop card-identity-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !updatingCardId) closeCardActionConfirmation()
          }}
        >
          <section
            aria-labelledby="card-action-confirm-title"
            aria-modal="true"
            className="cards-modal card-identity-modal"
            role="dialog"
          >
            <div className="cards-modal-heading">
              <span className={`cards-modal-icon${pendingCardAction.action === 'delete' ? ' cards-delete-modal-icon' : ''}`}>
                {pendingCardAction.action === 'delete' ? <Trash2 size={20} /> : <ShieldCheck size={20} />}
              </span>
              <button
                className="cards-modal-close"
                onClick={closeCardActionConfirmation}
                type="button"
                aria-label="Fechar confirmação"
                disabled={Boolean(updatingCardId)}
              >
                <X size={17} />
              </button>
              <span className="cards-eyebrow"><span /> {pendingCardAction.action === 'delete' ? 'EXCLUSÃO DO CARTÃO' : 'PROTEÇÃO DO SEU CARTÃO'}</span>
              <h2 id="card-action-confirm-title">
                {pendingCardAction.action === 'delete' ? 'Excluir cartão?' : 'Confirmar identidade'}
              </h2>
              <p>
                {pendingCardAction.action === 'delete'
                  ? `Esta ação é permanente. Digite sua senha para excluir o cartão “${pendingCardAction.card.name}”.`
                  : `Digite sua senha para ${pendingCardAction.action === 'block' ? 'bloquear' : 'desbloquear'} o cartão “${pendingCardAction.card.name}”.`}
              </p>
            </div>
            <form className="cards-form" onSubmit={handleCardAction}>
              <label className="cards-field" htmlFor="card-action-password">
                Senha da conta
                <input
                  id="card-action-password"
                  type="password"
                  autoComplete="current-password"
                  autoFocus
                  required
                  value={statusPassword}
                  onChange={(event) => {
                    setStatusPassword(event.target.value)
                    setStatusPasswordError('')
                  }}
                  disabled={Boolean(updatingCardId)}
                />
              </label>
              {statusPasswordError && <p className="cards-request-error" role="alert">{statusPasswordError}</p>}
              <div className="cards-modal-actions">
                <button
                  className="cards-cancel-button"
                  onClick={closeCardActionConfirmation}
                  type="button"
                  disabled={Boolean(updatingCardId)}
                >
                  Cancelar
                </button>
                <button
                  className={`cards-submit-button${pendingCardAction.action === 'delete' ? ' cards-delete-confirm-button' : ''}`}
                  type="submit"
                  disabled={Boolean(updatingCardId) || !statusPassword}
                >
                  {pendingCardAction.action === 'delete' ? <Trash2 size={15} /> : <LockKeyhole size={15} />}
                  {updatingCardId
                    ? (pendingCardAction.action === 'delete'
                      ? 'Excluindo...'
                      : pendingCardAction.action === 'block' ? 'Bloqueando...' : 'Desbloqueando...')
                    : (pendingCardAction.action === 'delete'
                      ? 'Excluir definitivamente'
                      : pendingCardAction.action === 'block' ? 'Bloquear cartão' : 'Desbloquear cartão')}
                </button>
              </div>
              <div className="cards-modal-footnote"><LockKeyhole size={13} /> A senha é verificada com segurança e não fica salva.</div>
            </form>
          </section>
        </div>,
        getModalRoot(),
      )}
    </section>
  )
}

function CardDetailsPage({ card, onBack }: { card: CardItem; onBack: () => void }) {
  const navigate = useNavigate()
  const [identityModalOpen, setIdentityModalOpen] = useState(false)
  const [identityPassword, setIdentityPassword] = useState('')
  const [identityError, setIdentityError] = useState('')
  const [isVerifyingIdentity, setIsVerifyingIdentity] = useState(false)
  const [sensitiveDetails, setSensitiveDetails] = useState<{ cardNumber: string; cvv: string } | null>(null)
  const usedLimit = Math.max(0, card.totalLimit - card.availableLimit)
  const usedPercent = card.totalLimit > 0
    ? Math.min(100, (usedLimit / card.totalLimit) * 100)
    : 0
  const formattedCardNumber = sensitiveDetails
    ? sensitiveDetails.cardNumber.replace(/(\d{4})(?=\d)/g, '$1 ')
    : card.number

  useEffect(() => {
    if (!identityModalOpen) return

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape' && !isVerifyingIdentity) setIdentityModalOpen(false)
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [identityModalOpen, isVerifyingIdentity])

  async function handleIdentityConfirmation(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (isVerifyingIdentity) return

    setIsVerifyingIdentity(true)
    setIdentityError('')
    try {
      const details = await revealCardSensitiveDetails(card.id, identityPassword)
      setSensitiveDetails(details)
      setIdentityPassword('')
      setIdentityModalOpen(false)
    } catch (error: unknown) {
      const statusCode = error instanceof Error && 'statusCode' in error
        ? Number(error.statusCode)
        : 0
      if (statusCode === 401) {
        navigate('/login', { replace: true, state: { sessionExpired: true } })
        return
      }
      setIdentityPassword('')
      setIdentityError(error instanceof Error ? error.message : 'Não foi possível confirmar sua identidade.')
    } finally {
      setIsVerifyingIdentity(false)
    }
  }

  return (
    <section className="card-detail-page" aria-labelledby="card-detail-title">
      <button className="cards-back-button card-detail-back" onClick={onBack} type="button">
        <ArrowLeft size={16} />
        <span>Voltar à carteira</span>
      </button>

      <header className="card-detail-heading">
        <div>
          <span className="cards-eyebrow"><span /> SUA CARTEIRA MAZE</span>
          <h1 id="card-detail-title">Detalhes do cartão</h1>
          <p>Confira as informações e o limite do seu cartão virtual.</p>
        </div>
        <span className={`wallet-card-status card-detail-status${card.status === 'blocked' ? ' status-blocked' : ''}`}>
          <i /> {card.status === 'active' ? 'Ativo' : 'Bloqueado'}
        </span>
      </header>

      <div className="card-detail-layout">
        <article className="card-detail-visual">
          <div className="card-detail-visual-heading">
            <span>SEU CARTÃO VIRTUAL</span>
            <CreditCard size={17} />
          </div>
          <div className={`wallet-card-face card-detail-face wallet-card-theme-${card.theme}`}>
            <div className="wallet-card-orbit wallet-card-orbit-one" />
            <div className="wallet-card-orbit wallet-card-orbit-two" />
            <div className="wallet-card-top">
              <span className="wallet-card-brand"><span className="wallet-card-mark">M</span> MAZE BANK</span>
              <span className="wallet-card-kind">VIRTUAL</span>
            </div>
            <div className="wallet-card-chip" aria-hidden="true">
              <span /><span /><span /><span />
            </div>
            <div className={`wallet-card-number${sensitiveDetails ? ' card-detail-number-revealed' : ''}`}>{formattedCardNumber}</div>
            <div className="wallet-card-bottom">
              <span className="wallet-card-owner">{card.name}</span>
              <span className="wallet-card-expiry"><small>VALIDADE</small>{card.expiry}</span>
              <span className="wallet-card-contactless" aria-label="Pagamento por aproximação"><span /><span /><span /></span>
            </div>
          </div>
          <div className="card-detail-visual-footer">
            <span><ShieldCheck size={15} /> Cartão virtual Maze Bank</span>
            <span>{sensitiveDetails ? formattedCardNumber : card.number}</span>
          </div>
        </article>

        <article className="card-detail-limit-panel">
          <span className="card-detail-panel-kicker">LIMITE DO CARTÃO</span>
          <strong className="card-detail-available">
            {card.availableLimit.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </strong>
          <span className="card-detail-available-label">disponível para usar</span>
          <div className="card-detail-progress" aria-label={`${Math.round(usedPercent)}% do limite utilizado`}>
            <span style={{ width: `${usedPercent}%` }} />
          </div>
          <div className="card-detail-limit-legend">
            <span>Utilizado <strong>{usedLimit.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</strong></span>
            <span>Total <strong>{card.totalLimit.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</strong></span>
          </div>
          <div className="card-detail-panel-divider" />
          <div className="card-detail-meta-row">
            <span><CreditCard size={15} /> Nome do cartão</span>
            <strong>{card.name}</strong>
          </div>
          <div className="card-detail-meta-row">
            <span><LockKeyhole size={15} /> Número do cartão</span>
            <strong>{sensitiveDetails ? formattedCardNumber : `•••• •••• •••• ${card.number.slice(-4)}`}</strong>
          </div>
          <div className="card-detail-meta-row">
            <span><CalendarDays size={15} /> Validade</span>
            <strong>{card.expiry}</strong>
          </div>
          <div className="card-detail-meta-row">
            <span><LockKeyhole size={15} /> CVV</span>
            <strong>{sensitiveDetails ? sensitiveDetails.cvv : '•••'}</strong>
          </div>
          {sensitiveDetails ? (
            <button
              className="card-detail-reveal-button card-detail-hide-button"
              onClick={() => setSensitiveDetails(null)}
              type="button"
            >
              <EyeOff size={15} /> Ocultar dados do cartão
            </button>
          ) : (
            <button
              className="card-detail-reveal-button"
              onClick={() => {
                setIdentityError('')
                setIdentityPassword('')
                setIdentityModalOpen(true)
              }}
              type="button"
            >
              <Eye size={15} /> Confirmar identidade para ver dados
            </button>
          )}
        </article>
      </div>

      <aside className="card-detail-security-note">
        <span><ShieldCheck size={19} /></span>
        <div>
          <strong>Confirmação de identidade</strong>
          <p>O número completo e o CVV só aparecem após confirmar sua senha.</p>
        </div>
      </aside>

      {identityModalOpen && createPortal(
        <div
          className="cards-modal-backdrop card-identity-backdrop"
          onClick={() => {
            if (!isVerifyingIdentity) setIdentityModalOpen(false)
          }}
        >
          <section
            className="cards-modal card-identity-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="card-identity-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="cards-modal-heading">
              <span className="cards-modal-icon"><ShieldCheck size={20} /></span>
              <button
                className="cards-modal-close"
                onClick={() => setIdentityModalOpen(false)}
                type="button"
                aria-label="Fechar confirmação de identidade"
                disabled={isVerifyingIdentity}
              >
                <X size={17} />
              </button>
              <span className="cards-eyebrow"><span /> PROTEÇÃO DO SEU CARTÃO</span>
              <h2 id="card-identity-title">Confirmar identidade</h2>
              <p>Digite sua senha de acesso para consultar os dados deste cartão.</p>
            </div>
            <form className="cards-form" onSubmit={handleIdentityConfirmation}>
              <label className="cards-field" htmlFor="card-identity-password">
                Senha da conta
                <input
                  id="card-identity-password"
                  type="password"
                  autoComplete="current-password"
                  autoFocus
                  required
                  value={identityPassword}
                  onChange={(event) => {
                    setIdentityPassword(event.target.value)
                    setIdentityError('')
                  }}
                  disabled={isVerifyingIdentity}
                />
              </label>
              {identityError && <p className="cards-request-error" role="alert">{identityError}</p>}
              <div className="cards-modal-actions">
                <button
                  className="cards-cancel-button"
                  onClick={() => setIdentityModalOpen(false)}
                  type="button"
                  disabled={isVerifyingIdentity}
                >
                  Cancelar
                </button>
                <button className="cards-submit-button" type="submit" disabled={isVerifyingIdentity || !identityPassword}>
                  <ShieldCheck size={15} />
                  {isVerifyingIdentity ? 'Verificando...' : 'Confirmar'}
                </button>
              </div>
              <div className="cards-modal-footnote"><LockKeyhole size={13} /> A senha é verificada com segurança e não fica salva.</div>
            </form>
          </section>
        </div>,
        getModalRoot(),
      )}
    </section>
  )
}

function CardBenefitsPage({ onBack }: { onBack: () => void }) {
  return (
    <section className="card-benefits-page" aria-labelledby="card-benefits-title">
      <button className="cards-back-button card-benefits-back" onClick={onBack} type="button">
        <ArrowLeft size={16} />
        <span>Voltar aos cartões</span>
      </button>

      <section className="card-benefits-hero">
        <div className="card-benefits-copy">
          <span className="cards-eyebrow"><span /> CARTÃO VIRTUAL MAZE BANK</span>
          <h1 id="card-benefits-title">Seu dinheiro.<br />Suas regras.</h1>
          <p>Um cartão para cada plano, com um limite escolhido por você e um nome que faz sentido para sua rotina.</p>
          <a className="card-benefits-scroll" href="#maze-card">
            <span className="card-benefits-scroll-icon"><ArrowUpRight size={15} /></span>
            <span>Role para conhecer<br /><strong>o seu cartão Maze</strong></span>
          </a>
        </div>

        <div className="card-benefits-card-stage" id="maze-card" aria-label="Ilustração de um cartão virtual Maze Bank">
          <div className="benefits-vertical-card">
            <div className="benefits-card-top">
              <span className="benefits-card-brand"><span>M</span> MAZE BANK</span>
              <span className="benefits-card-contactless"><i /><i /><i /></span>
            </div>
            <div className="benefits-card-pattern" />
            <div className="benefits-card-chip"><i /><i /><i /><i /></div>
            <div className="benefits-card-number">•••• &nbsp; ••••<br />•••• &nbsp; 4289</div>
            <div className="benefits-card-divider" />
            <div className="benefits-card-name">MAZE PRINCIPAL</div>
            <div className="benefits-card-bottom">
              <span>VIRTUAL<br /><strong>MAZE SIGNATURE</strong></span>
              <span className="benefits-card-mark">M</span>
            </div>
            <span className="benefits-card-vertical-label">MAZE BANK · OF CASTALDI</span>
          </div>
        </div>
      </section>

      <section className="card-benefits-details" id="card-benefits-details">
        <div className="card-benefits-section-heading">
          <span className="cards-eyebrow"><span /> FEITO PARA A SUA ROTINA</span>
          <h2>Um cartão. Mais possibilidades.</h2>
          <p>Conheça o que você já pode fazer com seu cartão virtual Maze.</p>
        </div>

        <div className="card-benefits-grid">
          <article className="card-benefit-item">
            <span className="card-benefit-icon"><Globe2 size={20} /></span>
            <span className="card-benefit-number">01</span>
            <h3>Pronto para o digital</h3>
            <p>Use seu cartão virtual em compras online e organize seus pagamentos com mais praticidade.</p>
          </article>
          <article className="card-benefit-item">
            <span className="card-benefit-icon"><CreditCard size={20} /></span>
            <span className="card-benefit-number">02</span>
            <h3>Um limite por cartão</h3>
            <p>Defina o limite desejado ao criar cada cartão e acompanhe essa informação na sua carteira.</p>
          </article>
          <article className="card-benefit-item">
            <span className="card-benefit-icon"><ShoppingBag size={20} /></span>
            <span className="card-benefit-number">03</span>
            <h3>Do seu jeito</h3>
            <p>Dê um nome para cada cartão, como “Assinaturas” ou “Viagem”, e encontre tudo com facilidade.</p>
          </article>
        </div>

        <aside className="card-benefits-limit-note">
          <span><ShieldCheck size={19} /></span>
          <p><strong>Sobre os limites</strong><br />O valor é escolhido no momento da criação. As regras para alteração e compartilhamento de limite serão definidas em uma próxima etapa.</p>
        </aside>

        <button className="card-benefits-return" onClick={onBack} type="button">
          <ArrowLeft size={16} /> Voltar para minha carteira
        </button>
      </section>
    </section>
  )
}
