import { useEffect, useState, type FormEvent } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  CreditCard,
  Droplets,
  Eye,
  EyeOff,
  FileText,
  Info,
  LoaderCircle,
  Star,
  ShieldCheck,
  Trash2,
  X,
  Zap,
  Wifi,
  Wallet,
} from 'lucide-react'
import type { AccountCard } from './services/api'
import { deleteSettledBill, payBillWithBalance, payBillWithCard } from './services/api'
import { getModalRoot } from './modalRoot'
import type { Bill } from './bills'
import './PayPage.css'

interface PayPageProps {
  bill: Bill
  cards: AccountCard[]
  mainCardId: string | null
  balance: number
  onBack: () => void
  onOpenCards: () => void
  onPaymentComplete: (billId: string, method: 'balance' | 'card', amount: number, cardId?: string) => void
  onBillDeleted: () => void
}

function formatCurrency(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export default function PayPage({ bill, cards, mainCardId, balance, onBack, onOpenCards, onPaymentComplete, onBillDeleted }: PayPageProps) {
  const navigate = useNavigate()
  const balanceInCents = Math.round(balance * 100)
  const billAmountInCents = Math.round(bill.amount * 100)
  const canPayWithBalance = balanceInCents >= billAmountInCents
  const shortfall = Math.max(0, bill.amount - balance)
  const [paymentError, setPaymentError] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [paymentComplete, setPaymentComplete] = useState(false)
  const [paymentResultOpen, setPaymentResultOpen] = useState(false)
  const [cardPickerOpen, setCardPickerOpen] = useState(false)
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<'balance' | 'card'>(() => {
    const hasActiveCard = cards.some((item) => item.id === mainCardId && item.status === 'ATIVO')
      || cards.some((item) => item.status === 'ATIVO')
    return hasActiveCard || !canPayWithBalance ? 'card' : 'balance'
  })
  const [selectedCardId, setSelectedCardId] = useState(
    () => cards.find((item) => item.id === mainCardId && item.status === 'ATIVO')?.id
      ?? cards.find((item) => item.status === 'ATIVO')?.id
      ?? '',
  )
  const BillIcon = { energia: Zap, internet: Wifi, agua: Droplets, other: FileText }[bill.category]
  const availableCards = cards.filter((item) => item.status === 'ATIVO')
  const selectedCard = availableCards.find((item) => item.id === selectedCardId) ?? availableCards[0] ?? null
  const selectedCardTheme = selectedCard?.theme ?? 0
  const isPayable = bill.status === 'EM_ABERTO'
  const canDelete = bill.status === 'PAGO' || bill.status === 'FATURADO'

  useEffect(() => {
    if (!confirmingDelete && !paymentResultOpen) return
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== 'Escape') return
      if (confirmingDelete && !deleting) setConfirmingDelete(false)
      if (paymentResultOpen && !submitting) setPaymentResultOpen(false)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [confirmingDelete, deleting, paymentResultOpen, submitting])

  async function handleDeleteBill() {
    if (deleting || !canDelete) return
    setDeleting(true)
    setDeleteError('')
    try {
      await deleteSettledBill(bill.id)
      onBillDeleted()
    } catch (error) {
      if (error instanceof Error && error.message === 'UNAUTHORIZED') {
        navigate('/login', { replace: true, state: { sessionExpired: true } })
        return
      }
      setDeleteError(error instanceof Error ? error.message : 'Não foi possível excluir esta conta.')
    } finally {
      setDeleting(false)
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (
      submitting
      || paymentComplete
      || !isPayable
      || !password
      || (paymentMethod === 'balance' && !canPayWithBalance)
      || (paymentMethod === 'card' && !selectedCard)
    ) return

    setPaymentError('')
    setPaymentResultOpen(false)
    setSubmitting(true)
    try {
      if (paymentMethod === 'balance') {
        await payBillWithBalance(bill.id, password)
      } else {
        if (!selectedCard) return
        await payBillWithCard(selectedCard.id, bill.id, password)
      }
      setPaymentComplete(true)
      setPaymentResultOpen(true)
      onPaymentComplete(bill.id, paymentMethod, bill.amount, paymentMethod === 'card' ? selectedCard?.id : undefined)
    } catch (error) {
      const statusCode = error instanceof Error && 'statusCode' in error
        ? Number(error.statusCode)
        : 0
      const field = error instanceof Error && 'field' in error ? String(error.field) : ''
      if (statusCode === 401 && field !== 'password') {
        navigate('/login', { replace: true, state: { sessionExpired: true } })
        return
      }
      setPaymentError(error instanceof Error ? error.message : 'Não foi possível pagar esta conta.')
      setPaymentResultOpen(true)
    } finally {
      setPassword('')
      setSubmitting(false)
    }
  }

  const statusLabel = {
    EM_ABERTO: 'Em aberto',
    PAGO: 'Pago',
    CANCELADO: 'Cancelado',
    FATURADO: 'Faturado',
  }[bill.status]
  const dueDateOnly = /^\d{4}-\d{2}-\d{2}/.exec(bill.dueDate)?.[0]

  const formattedDueDate = new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(dueDateOnly ? `${dueDateOnly}T12:00:00` : bill.dueDate))

  return (
    <section className="pay-page" aria-labelledby="pay-title">
      <button className="pay-back-button" onClick={onBack} type="button">
        <ArrowLeft size={16} />
        Contas
      </button>

      <header className="pay-heading">
        <span className="pay-eyebrow"><span /> PAGAMENTOS</span>
        <h1 id="pay-title">Pagar uma conta</h1>
        <p>Confira os dados da conta e escolha como deseja pagar.</p>
      </header>

      <div className="pay-demo-notice" role="note">
        <Info size={17} />
        <span><strong>Confirmação segura.</strong> Informe sua senha para confirmar o pagamento com {paymentMethod === 'balance' ? 'o saldo da conta' : 'o cartão selecionado'}.</span>
      </div>

      <div className="pay-layout">
        <form className="pay-form" onSubmit={handleSubmit}>
          <section className="pay-form-section" aria-labelledby="pay-bill-title">
            <div className="pay-section-heading">
              <span className="pay-section-icon"><FileText size={18} /></span>
              <div>
                <h2 id="pay-bill-title">Dados da conta</h2>
                <p>Confira as informações cadastradas antes de continuar.</p>
              </div>
            </div>

            <div className="pay-bill-preview">
              <div className={`pay-bill-logo pay-bill-logo-${bill.category}`}><BillIcon size={19} /></div>
              <div className="pay-bill-copy">
                <span>CONTA CADASTRADA</span>
                <strong>{bill.title}</strong>
                <small>{bill.company}</small>
              </div>
              <span className={`pay-example-tag pay-example-tag-${bill.status.toLowerCase()}`}>{statusLabel}</span>
            </div>

            <div className="pay-bill-details">
              <div><span>Beneficiário</span><strong>{bill.company}</strong></div>
              <div><span>Descrição</span><strong>{bill.description}</strong></div>
              <div><span>Vencimento</span><strong>{formattedDueDate}</strong></div>
            </div>
          </section>

          <section className="pay-form-section pay-method-section" aria-labelledby="pay-method-title">
            <div className="pay-section-heading">
              <span className="pay-section-icon pay-card-icon"><CreditCard size={18} /></span>
              <div>
                <h2 id="pay-method-title">Forma de pagamento</h2>
                <p>Escolha entre o saldo da conta e um cartão de crédito.</p>
              </div>
            </div>

            <div className="pay-method-options" role="radiogroup" aria-label="Forma de pagamento">
              <button
                aria-checked={paymentMethod === 'balance'}
                className={`pay-method-option pay-balance-option${paymentMethod === 'balance' ? ' is-selected' : ''}${!canPayWithBalance ? ' is-unavailable' : ''}`}
                disabled={!canPayWithBalance || submitting || paymentComplete || !isPayable}
                onClick={() => {
                  setPaymentMethod('balance')
                  setPaymentError('')
                }}
                role="radio"
                type="button"
              >
                <span className="pay-method-option-icon"><Wallet size={19} /></span>
                <span className="pay-method-option-copy">
                  <strong>Saldo da conta</strong>
                  <small>{canPayWithBalance ? 'Pague diretamente com o saldo disponível' : `Faltam ${formatCurrency(shortfall)} para cobrir esta conta`}</small>
                </span>
                <span className="pay-method-option-value">
                  <strong>{formatCurrency(balance)}</strong>
                  <small>{canPayWithBalance ? 'DISPONÍVEL' : 'SALDO INSUFICIENTE'}</small>
                </span>
                <span className="pay-method-radio" aria-hidden="true">{paymentMethod === 'balance' && <Check size={12} />}</span>
              </button>

              <button
                aria-checked={paymentMethod === 'card'}
                className={`pay-method-option pay-credit-option${paymentMethod === 'card' ? ' is-selected' : ''}`}
                disabled={submitting || paymentComplete || !isPayable}
                onClick={() => {
                  setPaymentMethod('card')
                  setPaymentError('')
                }}
                role="radio"
                type="button"
              >
                <span className="pay-method-option-icon"><CreditCard size={19} /></span>
                <span className="pay-method-option-copy">
                  <strong>Cartão de crédito</strong>
                  <small>{selectedCard ? `Pagar com o cartão final ${selectedCard.lastFour}` : 'Escolha um cartão ativo'}</small>
                </span>
                <span className="pay-method-option-value">
                  <strong>{formatCurrency(bill.amount)}</strong>
                  <small>VALOR DA CONTA</small>
                </span>
                <span className="pay-method-radio" aria-hidden="true">{paymentMethod === 'card' && <Check size={12} />}</span>
              </button>
            </div>

            {paymentMethod === 'card' && selectedCard ? (
              <div className="pay-card-picker">
                <div className={`pay-current-card wallet-card-theme-${selectedCardTheme}`}>
                  <span className="pay-current-card-brand"><span>M</span> MAZE BANK</span>
                  {selectedCard.main && <span className="pay-current-card-primary"><Star size={10} fill="currentColor" /> PRINCIPAL</span>}
                  <CreditCard className="pay-current-card-watermark" size={55} strokeWidth={1} />
                  <strong className="pay-current-card-number">•••• &nbsp;•••• &nbsp;•••• &nbsp;{selectedCard.lastFour}</strong>
                  <span className="pay-current-card-bottom">
                    <span><small>PAGAR COM</small><strong>{selectedCard.name}</strong></span>
                    <span className="pay-current-card-status"><i /> ATIVO</span>
                  </span>
                </div>
                {availableCards.length > 1 ? (
                  <>
                    <button
                      aria-controls="pay-card-options"
                      aria-expanded={cardPickerOpen}
                      className={`pay-card-picker-toggle${cardPickerOpen ? ' is-open' : ''}`}
                      disabled={submitting || paymentComplete}
                      onClick={() => setCardPickerOpen((open) => !open)}
                      type="button"
                    >
                      <span className="pay-card-picker-toggle-icon"><CreditCard size={15} /></span>
                      <span><strong>{cardPickerOpen ? 'Escolha outro cartão' : 'Usar outro cartão'}</strong><small>{availableCards.length} cartões ativos disponíveis</small></span>
                      <ChevronDown size={17} />
                    </button>
                    {cardPickerOpen && (
                      <div className="pay-card-options" id="pay-card-options" role="radiogroup" aria-label="Escolha um cartão para pagar">
                        {availableCards.map((item) => {
                          const theme = item.theme
                          const isSelected = item.id === selectedCard.id
                          return (
                            <button
                              aria-checked={isSelected}
                              className={`pay-card-option${isSelected ? ' is-selected' : ''}`}
                              key={item.id}
                              disabled={submitting || paymentComplete}
                              onClick={() => {
                                setSelectedCardId(item.id)
                                setCardPickerOpen(false)
                              }}
                              role="radio"
                              type="button"
                            >
                              <span className={`pay-card-option-swatch wallet-card-theme-${theme}`}><span>M</span><i>•••• {item.lastFour}</i></span>
                              <span className="pay-card-option-copy"><strong>{item.name}</strong><small>Final {item.lastFour} · Crédito</small></span>
                              {item.main && <span className="pay-card-option-primary"><Star size={10} fill="currentColor" /> Principal</span>}
                              {isSelected && <Check className="pay-card-option-check" size={17} />}
                            </button>
                          )
                        })}
                        <p className="pay-card-options-note"><Info size={13} /> A escolha vale somente para este pagamento e não altera seu cartão principal.</p>
                      </div>
                    )}
                  </>
                ) : (
                  <p className="pay-card-options-note"><Info size={13} /> Este é seu único cartão ativo disponível.</p>
                )}
              </div>
            ) : paymentMethod === 'card' ? (
              <div className="pay-no-card">
                <span>Nenhum cartão ativo disponível para pagar esta conta.</span>
                <button onClick={onOpenCards} type="button">Ver cartões <ArrowRight size={14} /></button>
              </div>
            ) : paymentMethod === 'balance' ? (
              <div className="pay-balance-confirmation" role={paymentComplete ? 'status' : undefined}>
                <span className="pay-balance-confirmation-icon"><CheckCircle2 size={17} /></span>
                <span>
                  <strong>{paymentComplete ? 'Saldo atualizado' : 'Pagamento pelo saldo'}</strong>
                  <small>{paymentComplete
                    ? `Pagamento concluído. Seu saldo atual é ${formatCurrency(balance)}.`
                    : `Após o pagamento, o saldo ficará em ${formatCurrency(Math.max(0, balance - bill.amount))}.`}</small>
                </span>
              </div>
            ) : null}
          </section>

          {!paymentComplete && isPayable && (
            <label className="pay-field pay-password-field" htmlFor="pay-account-password">
              Senha da conta
              <span className="pay-password-input-wrap">
                <input
                  autoComplete="current-password"
                  disabled={submitting}
                  id="pay-account-password"
                  onChange={(event) => {
                    setPassword(event.target.value)
                    setPaymentError('')
                  }}
                  required
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                />
                <button
                  aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                  className="pay-password-toggle"
                  disabled={submitting}
                  onClick={() => setShowPassword((visible) => !visible)}
                  type="button"
                >
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </span>
            </label>
          )}

          <button
            className="pay-submit-button"
            disabled={submitting || paymentComplete || !isPayable
              || !password
              || (paymentMethod === 'balance' && !canPayWithBalance)
              || (paymentMethod === 'card' && !selectedCard)}
            type="submit"
          >
            {submitting ? <><LoaderCircle className="pay-submit-loading" size={16} /> Processando pagamento...</>
              : paymentComplete || bill.status === 'PAGO' ? <>Conta paga <Check size={16} /></>
                : bill.status === 'CANCELADO' ? <>Conta cancelada</>
                  : bill.status === 'FATURADO' ? <>Conta faturada</>
                    : <>Pagar {paymentMethod === 'balance' ? 'com saldo' : 'com cartão'} <ArrowRight size={16} /></>}
          </button>
          <p className="pay-form-footnote"><ShieldCheck size={14} /> A confirmação atualiza o status da conta e debita o meio de pagamento escolhido.</p>
        </form>

        <aside className="pay-summary" aria-label={`Resumo da conta ${bill.title}`}>
          <div className="pay-summary-heading">
            <span>RESUMO DA CONTA</span>
            <span className={`pay-summary-status pay-summary-status-${bill.status.toLowerCase()}`}><i /> {statusLabel}</span>
          </div>
          <div className="pay-summary-company">
            <span className={`pay-summary-icon-${bill.category}`}><BillIcon size={19} /></span>
            <div><strong>{bill.title}</strong><small>{bill.company}</small></div>
          </div>
          <div className="pay-summary-amount-label">Valor do pagamento</div>
          <strong className="pay-summary-amount">{formatCurrency(bill.amount)}</strong>
          <div className="pay-summary-date"><CalendarDays size={15} /><span>Vencimento</span><strong>{formattedDueDate}</strong></div>
          <div className="pay-summary-divider" />
          <div className="pay-summary-total"><span>Total a pagar</span><strong>{formatCurrency(bill.amount)}</strong></div>
          <p className="pay-summary-footnote">{paymentComplete || bill.status === 'PAGO'
            ? 'Esta conta foi paga.'
            : bill.status === 'CANCELADO'
              ? 'Esta conta foi cancelada e não pode ser paga.'
              : bill.status === 'FATURADO'
                ? 'Esta conta já foi incluída em uma fatura e não pode ser paga novamente.'
                : `O valor será debitado ${paymentMethod === 'balance' ? 'do saldo da sua conta.' : 'do limite disponível do cartão selecionado.'}`}</p>
          {canDelete && (
            <button
              className="pay-delete-bill-button"
              onClick={() => {
                setDeleteError('')
                setConfirmingDelete(true)
              }}
              type="button"
            >
              <Trash2 size={15} />
              Excluir conta
            </button>
          )}
        </aside>
      </div>

      {paymentResultOpen && createPortal(
        <div
          className="pay-result-backdrop"
          onClick={(event) => {
            if (event.target === event.currentTarget && !submitting) setPaymentResultOpen(false)
          }}
        >
          <section
            aria-labelledby="pay-result-title"
            aria-modal="true"
            className={`pay-result-modal${paymentComplete ? ' pay-result-modal-success' : ' pay-result-modal-error'}`}
            role="dialog"
          >
            {!submitting && (
              <button
                aria-label="Fechar resultado do pagamento"
                className="pay-result-close"
                onClick={() => setPaymentResultOpen(false)}
                type="button"
              >
                <X size={18} />
              </button>
            )}
            <span className="pay-result-icon">
              {paymentComplete
                ? <CheckCircle2 size={31} strokeWidth={2.2} />
                : <AlertCircle size={30} strokeWidth={2.2} />}
            </span>
            <span className="pay-result-eyebrow">{paymentComplete ? 'PAGAMENTO CONCLUÍDO' : 'STATUS DO PAGAMENTO'}</span>
            <h2 id="pay-result-title">{paymentComplete ? 'Conta paga!' : 'Pagamento não confirmado'}</h2>
            <p>
              {paymentComplete
                ? `Pagamento de ${formatCurrency(bill.amount)} realizado ${paymentMethod === 'balance'
                  ? 'com o saldo da conta.'
                  : `com o cartão final ${selectedCard?.lastFour ?? ''}.`}`
                : `${paymentError} Confira o status da conta antes de tentar novamente.`}
            </p>
            {paymentComplete && <span className="pay-result-status"><Check size={14} /> PAGO</span>}
            <button
              className={`pay-result-action${paymentComplete ? ' is-success' : ' is-error'}`}
              disabled={submitting}
              onClick={() => setPaymentResultOpen(false)}
              type="button"
            >
              {paymentComplete ? 'Entendi' : 'Fechar'}
            </button>
          </section>
        </div>,
        getModalRoot(),
      )}

      {confirmingDelete && createPortal(
        <div className="pay-delete-backdrop">
          <section aria-labelledby="pay-delete-title" aria-modal="true" className="pay-delete-modal" role="dialog">
            <button aria-label="Fechar confirmação" className="pay-delete-close" disabled={deleting} onClick={() => setConfirmingDelete(false)} type="button">
              <X size={18} />
            </button>
            <span className="pay-delete-icon"><Trash2 size={23} /></span>
            <span className="pay-delete-eyebrow">EXCLUSÃO DE CONTA</span>
            <h2 id="pay-delete-title">Excluir esta conta?</h2>
            <p>O registro de “{bill.title}” será removido permanentemente. Isso não estorna o pagamento nem altera uma fatura já criada.</p>
            {deleteError && <p className="pay-delete-error" role="alert">{deleteError}</p>}
            <div className="pay-delete-actions">
              <button
                className="pay-delete-cancel"
                disabled={deleting}
                onClick={() => setConfirmingDelete(false)}
                type="button"
              >
                Cancelar
              </button>
              <button
                className="pay-delete-confirm"
                disabled={deleting}
                onClick={() => void handleDeleteBill()}
                type="button"
              >
                {deleting ? 'Excluindo...' : <><Trash2 size={15} /> Excluir conta</>}
              </button>
            </div>
          </section>
        </div>,
        getModalRoot(),
      )}
    </section>
  )
}
