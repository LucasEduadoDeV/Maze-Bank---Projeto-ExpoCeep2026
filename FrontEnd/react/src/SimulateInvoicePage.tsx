import { useEffect, useState, type FormEvent } from 'react'
import { createPortal } from 'react-dom'
import { ArrowLeft, BarChart3, CalendarDays, Check, CheckCircle2, ShieldCheck, Sparkles, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { createInvoice, type AccountCard } from './services/api'
import { getModalRoot } from './modalRoot'
import './SimulateInvoicePage.css'

interface SimulateInvoicePageProps {
  cards: AccountCard[]
  cardsLoading: boolean
  cardsError: string
  onBack: () => void
}

export default function SimulateInvoicePage({ cards, cardsLoading, cardsError, onBack }: SimulateInvoicePageProps) {
  const navigate = useNavigate()
  const [selectedCardId, setSelectedCardId] = useState('')
  const [plannedSpend, setPlannedSpend] = useState('')
  const [invoiceName, setInvoiceName] = useState('')
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [requestError, setRequestError] = useState('')
  const selectedCard = cards.find((card) => card.id === selectedCardId) ?? null

  useEffect(() => {
    if (!cards.length || cards.some((card) => card.id === selectedCardId)) return
    setSelectedCardId(cards.find((card) => card.main)?.id ?? cards[0].id)
  }, [cards, selectedCardId])

  useEffect(() => {
    if (!showSuccessModal) return
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setShowSuccessModal(false)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [showSuccessModal])

  async function handleSimulation(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const hasPlannedSpend = plannedSpend.trim() !== ''
    const planned = hasPlannedSpend ? Number(plannedSpend) : undefined
    if (
      !selectedCard
      || (planned !== undefined && (!Number.isFinite(planned) || planned < 0 || planned > 99999999.99))
      || isSubmitting
    ) return

    const submittedName = invoiceName.trim()
    setRequestError('')
    setIsSubmitting(true)

    try {
      await createInvoice(selectedCard.id, {
        ...(planned !== undefined && { predictedValue: planned }),
        ...(submittedName && { nameInvoice: submittedName }),
      })
      setShowSuccessModal(true)
    } catch (error) {
      if (error instanceof Error && error.message === 'UNAUTHORIZED') {
        navigate('/login', { replace: true, state: { sessionExpired: true } })
        return
      }
      setRequestError(error instanceof Error ? error.message : 'Não foi possível criar a fatura.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="invoice-simulator invoice-simulation-page" aria-labelledby="invoice-simulator-title">
      <button className="invoice-back-button" onClick={onBack} type="button">
        <ArrowLeft size={16} />
        Visão geral
      </button>

      <header className="invoice-heading">
        <span className="invoice-eyebrow"><span /> PLANEJAMENTO DO CARTÃO</span>
        <h1 id="invoice-simulator-title">Simular Fatura</h1>
        <p>Planeje seus gastos futuros e confira as contas já pagas no cartão selecionado.</p>
      </header>

      <div className="invoice-demo-banner" role="note">
        <ShieldCheck size={18} />
        <p><strong>Importante:</strong> apenas contas já pagas entram no valor cobrável. O valor previsto fica separado e não pode ser pago.</p>
      </div>

      <div className="invoice-simulation-layout">
        <form className="invoice-simulation-form" onSubmit={handleSimulation}>
          <div className="invoice-section-heading">
            <div>
              <span className="invoice-card-kicker">NOVA FATURA</span>
              <h2>Informe os dados da fatura</h2>
            </div>
            <span className="invoice-simulation-spark"><Sparkles size={18} /></span>
          </div>

          <fieldset className="invoice-card-selector" disabled={cardsLoading || cards.length === 0 || isSubmitting}>
            <legend>Cartão de crédito</legend>
            {cardsLoading ? (
              <p className="invoice-card-selector-message">Carregando cartões...</p>
            ) : cards.length === 0 ? (
              <p className="invoice-card-selector-message" role={cardsError ? 'alert' : undefined}>
                {cardsError || 'Crie um cartão para incluí-lo na simulação.'}
              </p>
            ) : (
              <div className="invoice-card-options" role="radiogroup" aria-label="Selecione um cartão de crédito">
                {cards.map((card) => (
                  <button
                    className={`invoice-card-option${selectedCardId === card.id ? ' is-selected' : ''}`}
                    type="button"
                    key={card.id}
                    role="radio"
                    aria-checked={selectedCardId === card.id}
                    onClick={() => {
                      setSelectedCardId(card.id)
                      setRequestError('')
                    }}
                  >
                    <span className={`invoice-card-option-visual wallet-card-theme-${card.theme}`}>
                      <span className="invoice-card-option-brand"><span>M</span> MAZE BANK</span>
                      <span className="invoice-card-option-number">•••• {card.lastFour}</span>
                    </span>
                    <span className="invoice-card-option-info">
                      <strong>{card.name}</strong>
                      <small>Final {card.lastFour}{card.main ? ' · Principal' : ''}</small>
                    </span>
                    <span className="invoice-card-option-check" aria-hidden="true">
                      {selectedCardId === card.id && <Check size={14} />}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </fieldset>

          <label className="invoice-simulation-field">
            <span>Valor previsto de gastos</span>
            <span className="invoice-simulation-currency">
              <span>R$</span>
              <input
                type="number"
                min="0"
                max="99999999.99"
                step="0.01"
                placeholder="0,00"
                value={plannedSpend}
                onChange={(event) => {
                  setPlannedSpend(event.target.value)
                  setRequestError('')
                }}
                disabled={isSubmitting}
                onInvalid={(event) => {
                  event.preventDefault()
                  const input = event.currentTarget
                  input.setCustomValidity(
                    input.validity.rangeOverflow
                      ? 'O valor máximo permitido é R$ 99.999.999,99.'
                      : 'Informe um valor igual ou maior que zero.',
                  )
                  input.reportValidity()
                }}
                onInput={(event) => event.currentTarget.setCustomValidity('')}
              />
            </span>
            <small>Opcional. Usado apenas para planejamento; não será somado ao valor cobrável da fatura.</small>
          </label>

          <button className="invoice-simulation-submit" type="submit" disabled={!selectedCard || isSubmitting}>
            <BarChart3 size={17} />
            {isSubmitting ? 'Registrando simulação...' : 'Simular fatura'}
          </button>
          {requestError && <p className="invoice-create-error" role="alert">{requestError}</p>}
        </form>

        <aside className="invoice-simulation-result">
          <span className="invoice-simulation-result-icon"><CalendarDays size={20} /></span>
          <span className="invoice-card-kicker">PERSONALIZE SUA FATURA</span>
          <label className="invoice-simulation-name-field">
            <span>Nome da fatura <small>(opcional)</small></span>
            <input
              type="text"
              maxLength={30}
              placeholder="Ex.: Viagem de dezembro"
              value={invoiceName}
              onChange={(event) => {
                setInvoiceName(event.target.value)
                setRequestError('')
              }}
              disabled={isSubmitting}
            />
          </label>
          <p className="invoice-simulation-name-hint">Use um nome para encontrar sua fatura com mais facilidade.</p>
        </aside>
      </div>

      {showSuccessModal && createPortal(
        <div className="invoice-success-backdrop">
          <section
            aria-labelledby="invoice-success-title"
            aria-modal="true"
            className="invoice-success-modal"
            role="dialog"
          >
            <button
              aria-label="Fechar confirmação"
              className="invoice-success-close"
              onClick={() => setShowSuccessModal(false)}
              type="button"
            >
              <X size={18} />
            </button>
            <span className="invoice-success-icon"><CheckCircle2 size={26} /></span>
            <span className="invoice-card-kicker">OPERAÇÃO CONCLUÍDA</span>
            <h2 id="invoice-success-title">Fatura criada</h2>
            <p>Sua fatura foi criada com sucesso e já está disponível em Ver Faturas.</p>
            <button
              className="invoice-success-confirm"
              onClick={() => setShowSuccessModal(false)}
              type="button"
            >
              Entendi
            </button>
          </section>
        </div>,
        getModalRoot(),
      )}
    </section>
  )
}
