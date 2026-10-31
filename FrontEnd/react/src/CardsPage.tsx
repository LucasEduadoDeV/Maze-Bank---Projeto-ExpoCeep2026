import { useEffect, useState, type FormEvent } from 'react'
import {
  ArrowLeft,
  ArrowUpRight,
  Check,
  CheckCircle2,
  CreditCard,
  LockKeyhole,
  Plus,
  Shield,
  ShieldCheck,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react'
import './CardsPage.css'

interface CardsPageProps {
  onBack: () => void
}

interface CardItem {
  id: string
  name: string
  number: string
  expiry: string
  limit: string
  type: 'virtual' | 'physical'
  status: 'active' | 'blocked'
}

const initialCards: CardItem[] = [
  {
    id: '1',
    name: 'Cartão Principal',
    number: '•••• •••• •••• 4289',
    expiry: '08/29',
    limit: 'R$ 5.000,00',
    type: 'physical',
    status: 'active',
  },
  {
    id: '2',
    name: 'Maze Digital',
    number: '•••• •••• •••• 8812',
    expiry: '12/31',
    limit: 'R$ 1.200,00',
    type: 'virtual',
    status: 'active',
  },
  {
    id: '3',
    name: 'Cartão Viagem',
    number: '•••• •••• •••• 9934',
    expiry: '05/30',
    limit: 'R$ 3.500,00',
    type: 'virtual',
    status: 'active',
  },
]

const CARD_LIMIT = 3

export default function CardsPage({ onBack }: CardsPageProps) {
  const [cards, setCards] = useState<CardItem[]>(initialCards)
  const [showNewModal, setShowNewModal] = useState(false)
  const [cardName, setCardName] = useState('')
  const [cardLimit, setCardLimit] = useState('2500')
  const [cardType, setCardType] = useState<'virtual' | 'physical'>('virtual')
  const [successMsg, setSuccessMsg] = useState('')
  const activeCards = cards.filter((card) => card.status === 'active').length
  const hasReachedLimit = cards.length >= CARD_LIMIT

  useEffect(() => {
    if (!showNewModal) return

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setShowNewModal(false)
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [showNewModal])

  function showMessage(message: string) {
    setSuccessMsg(message)
    window.setTimeout(() => setSuccessMsg(''), 4000)
  }

  function handleCreateCard(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (hasReachedLimit) {
      showMessage('Você já atingiu o limite de 3 cartões.')
      setShowNewModal(false)
      return
    }

    const randomDigits = Math.floor(1000 + Math.random() * 9000)
    const newCard: CardItem = {
      id: Date.now().toString(),
      name: cardName || (cardType === 'virtual' ? 'Cartão Virtual' : 'Cartão Físico'),
      number: `•••• •••• •••• ${randomDigits}`,
      expiry: '10/31',
      limit: Number(cardLimit).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
      type: cardType,
      status: 'active',
    }

    setCards((currentCards) => [newCard, ...currentCards])
    setShowNewModal(false)
    setCardName('')
    showMessage('Cartão criado com sucesso!')
  }

  function toggleBlock(id: string) {
    setCards((currentCards) =>
      currentCards.map((card) =>
        card.id === id
          ? { ...card, status: card.status === 'active' ? 'blocked' : 'active' }
          : card,
      ),
    )
  }

  function removeCard(id: string) {
    setCards((currentCards) => currentCards.filter((card) => card.id !== id))
  }

  return (
    <section className="cards-page" aria-labelledby="cards-title">
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
              onClick={() => setShowNewModal(true)}
              type="button"
              disabled={hasReachedLimit}
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

      <div className="cards-overview" aria-label="Resumo dos cartões">
        <div className="cards-overview-item">
          <span className="cards-overview-icon"><CreditCard size={17} /></span>
          <span><strong>{cards.length.toString().padStart(2, '0')}</strong><small>cartões na carteira</small></span>
        </div>
        <span className="cards-overview-divider" />
        <div className="cards-overview-item">
          <span className="cards-overview-icon cards-overview-icon-green"><ShieldCheck size={17} /></span>
          <span><strong>{activeCards.toString().padStart(2, '0')}</strong><small>cartões ativos</small></span>
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

      {cards.length > 0 ? (
        <div className="cards-grid">
          {cards.map((card, index) => (
            <article
              className={`wallet-card${card.status === 'blocked' ? ' is-blocked' : ''}`}
              key={card.id}
              style={{ animationDelay: `${index * 70}ms` }}
            >
              <div className={`wallet-card-face wallet-card-theme-${index % 3}`}>
                <div className="wallet-card-orbit wallet-card-orbit-one" />
                <div className="wallet-card-orbit wallet-card-orbit-two" />
                <div className="wallet-card-top">
                  <span className="wallet-card-brand"><span className="wallet-card-mark">M</span> MAZE BANK</span>
                  <span className="wallet-card-kind">{card.type === 'virtual' ? 'VIRTUAL' : 'FÍSICO'}</span>
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
                {card.status === 'blocked' && (
                  <div className="wallet-card-blocked">
                    <LockKeyhole size={15} /> Cartão bloqueado
                  </div>
                )}
              </div>

              <div className="wallet-card-details">
                <div className="wallet-card-limit">
                  <span>Limite disponível</span>
                  <strong>{card.limit}</strong>
                </div>
                <span className={`wallet-card-status${card.status === 'blocked' ? ' status-blocked' : ''}`}>
                  <i /> {card.status === 'active' ? 'Ativo' : 'Bloqueado'}
                </span>
              </div>

              <div className="wallet-card-actions">
                <button
                  className="wallet-card-action"
                  onClick={() => toggleBlock(card.id)}
                  type="button"
                  aria-label={card.status === 'active' ? `Bloquear ${card.name}` : `Desbloquear ${card.name}`}
                >
                  {card.status === 'active' ? <LockKeyhole size={15} /> : <Shield size={15} />}
                  {card.status === 'active' ? 'Bloquear cartão' : 'Desbloquear'}
                </button>
                <button
                  className="wallet-card-delete"
                  onClick={() => removeCard(card.id)}
                  type="button"
                  aria-label={`Excluir ${card.name}`}
                >
                  <Trash2 size={15} />
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
          <button className="cards-create-button" onClick={() => setShowNewModal(true)} type="button">
            <Plus size={17} /> Criar meu primeiro cartão
          </button>
        </div>
      )}

      <aside className="cards-security-note">
        <span className="cards-security-icon"><ShieldCheck size={19} /></span>
        <span className="cards-security-copy">
          <strong>Mais tranquilidade para você</strong>
          <small>Bloqueie seu cartão a qualquer momento. Seus dados completos permanecem protegidos.</small>
        </span>
        <ArrowUpRight size={17} className="cards-security-arrow" />
      </aside>

      {showNewModal && (
        <div
          className="cards-modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setShowNewModal(false)
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
              >
                <X size={18} />
              </button>
              <span className="cards-eyebrow"><span /> NOVO CARTÃO</span>
              <h2 id="cards-modal-title">Do que você precisa?</h2>
              <p>Personalize seu novo cartão Maze Bank.</p>
            </div>

            <form className="cards-form" onSubmit={handleCreateCard}>
              <label className="cards-field">
                <span>Nome do cartão</span>
                <input
                  autoFocus
                  maxLength={32}
                  onChange={(event) => setCardName(event.target.value)}
                  placeholder="Ex.: Viagem, assinaturas..."
                  required
                  value={cardName}
                />
              </label>

              <label className="cards-field">
                <span>Tipo de cartão</span>
                <select
                  onChange={(event) => setCardType(event.target.value as 'virtual' | 'physical')}
                  value={cardType}
                >
                  <option value="virtual">Virtual — compras online</option>
                  <option value="physical">Físico — para o dia a dia</option>
                </select>
              </label>

              <label className="cards-field">
                <span>Limite desejado</span>
                <span className="cards-currency-field">
                  <span>R$</span>
                  <input
                    max="50000"
                    min="100"
                    onChange={(event) => setCardLimit(event.target.value)}
                    required
                    type="number"
                    value={cardLimit}
                  />
                </span>
                <small>Escolha um valor entre R$ 100 e R$ 50.000.</small>
              </label>

              <div className="cards-modal-actions">
                <button className="cards-cancel-button" onClick={() => setShowNewModal(false)} type="button">
                  Cancelar
                </button>
                <button className="cards-submit-button" type="submit">
                  <Check size={16} /> Criar cartão
                </button>
              </div>
              <div className="cards-modal-footnote"><ShieldCheck size={14} /> Seus dados estão protegidos.</div>
            </form>
          </section>
        </div>
      )}
    </section>
  )
}
