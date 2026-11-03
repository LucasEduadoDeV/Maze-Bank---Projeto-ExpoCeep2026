import { useEffect, useState, type FormEvent } from 'react'
import { createPortal } from 'react-dom'
import { ArrowDownLeft, ArrowLeft, CalendarDays, CheckCircle2, Clock3, Download, ReceiptText, ShieldCheck, ShoppingBag, Smartphone, Trash2, Utensils, Wallet, X } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { formatInvoiceCurrency } from './invoiceDemo'
import { deleteInvoice, payInvoiceWithBalance, type AccountInvoice, type InvoiceItem } from './services/api'
import { getModalRoot } from './modalRoot'
import './SimulateInvoicePage.css'

interface InvoiceDetailPageProps {
  invoice: AccountInvoice
  balance: number
  onBack: () => void
  onDeleted: () => void
  onPaymentComplete: () => void
}

function getInvoiceItemIcon(item: InvoiceItem): LucideIcon {
  const search = `${item.name} ${item.detail}`.toLocaleLowerCase('pt-BR')
  if (/restaurante|café|cafe|alimentação|alimentacao/.test(search)) return Utensils
  if (/streaming|assinatura|aplicativo|app/.test(search)) return Smartphone
  return ShoppingBag
}

function formatInvoiceDate(value: string, dateOnly = false) {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    ...(dateOnly && { timeZone: 'UTC' }),
  }).format(new Date(value))
}

export default function InvoiceDetailPage({ invoice, balance, onBack, onDeleted, onPaymentComplete }: InvoiceDetailPageProps) {
  const navigate = useNavigate()
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState('')
  const [confirmingPayment, setConfirmingPayment] = useState(false)
  const [paymentPassword, setPaymentPassword] = useState('')
  const [paying, setPaying] = useState(false)
  const [paymentError, setPaymentError] = useState('')
  const [paymentResult, setPaymentResult] = useState<{ amountPaid: number; invoicePaid: boolean; cardLimitRestored: number } | null>(null)
  const [paidDuringSession, setPaidDuringSession] = useState(0)
  const paidBillsTotal = invoice.items.reduce((total, item) => total + item.amount, 0)
  const additionalAmount = Math.max(0, invoice.totalAmount - paidBillsTotal)
  const totalPaid = Math.min(invoice.totalAmount, invoice.totalPaid + paidDuringSession)
  const remainingAmount = Math.max(0, invoice.totalAmount - totalPaid)
  const isPaid = invoice.status === 'Paga' || remainingAmount === 0 || paymentResult?.invoicePaid === true
  const isCancelled = invoice.status === 'Cancelada'

  useEffect(() => {
    if (!confirmingDelete && !confirmingPayment) return
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== 'Escape') return
      if (confirmingDelete && !deleting) setConfirmingDelete(false)
      if (confirmingPayment && !paying) setConfirmingPayment(false)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [confirmingDelete, confirmingPayment, deleting, paying])

  async function handlePayInvoice(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (paying || !paymentPassword || isPaid || isCancelled) return
    setPaying(true)
    setPaymentError('')
    try {
      const result = await payInvoiceWithBalance(invoice.id, paymentPassword)
      setPaymentResult(result)
      setPaidDuringSession((current) => current + result.amountPaid)
      setPaymentPassword('')
      onPaymentComplete()
    } catch (error) {
      const statusCode = error instanceof Error && 'statusCode' in error
        ? Number(error.statusCode)
        : 0
      const field = error instanceof Error && 'field' in error ? String(error.field) : ''
      if (statusCode === 401 && field !== 'password') {
        navigate('/login', { replace: true, state: { sessionExpired: true } })
        return
      }
      setPaymentError(error instanceof Error ? error.message : 'Não foi possível pagar a fatura com o saldo.')
    } finally {
      setPaymentPassword('')
      setPaying(false)
    }
  }

  async function handleDeleteInvoice() {
    if (deleting) return
    setDeleting(true)
    setDeleteError('')
    try {
      await deleteInvoice(invoice.id)
      onDeleted()
    } catch (error) {
      if (error instanceof Error && error.message === 'UNAUTHORIZED') {
        navigate('/login', { replace: true, state: { sessionExpired: true } })
        return
      }
      setDeleteError(error instanceof Error ? error.message : 'Não foi possível excluir a fatura.')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <section className="invoice-simulator" aria-labelledby="invoice-simulator-title">
      <button className="invoice-back-button" onClick={onBack} type="button">
        <ArrowLeft size={16} />
        Voltar para faturas
      </button>

      <header className="invoice-heading">
        <span className="invoice-eyebrow"><span /> FATURA DO CARTÃO</span>
        <h1 id="invoice-simulator-title">{invoice.name}</h1>
        <p>
          {invoice.card
            ? `${/^cartão\b/i.test(invoice.card.name.trim()) ? '' : 'Cartão '}${invoice.card.name}, final ${invoice.card.lastFour}.`
            : 'Cartão não identificado.'}
          {' '}Detalhes da fatura selecionada.
        </p>
      </header>

      <div className="invoice-demo-banner" role="note">
        <ShieldCheck size={18} />
        <p><strong>Fatura da sua conta.</strong> Os dados abaixo foram carregados do Maze Bank.</p>
      </div>

      <div className="invoice-layout">
        <article className="invoice-main-card">
          <div className="invoice-card-heading">
            <div className="invoice-title-lockup">
              <span className="invoice-receipt-icon"><ReceiptText size={19} /></span>
              <div>
                <span className="invoice-card-kicker">FATURA DO CARTÃO</span>
                <h2>{invoice.name}</h2>
              </div>
            </div>
            <span className={`invoice-open-status${isPaid ? ' is-paid' : ''}${isCancelled ? ' is-cancelled' : ''}`}><i /> {isPaid ? 'Paga' : invoice.status}</span>
          </div>

          <div className="invoice-total-block">
            <span>VALOR TOTAL DA FATURA</span>
            <strong>{formatInvoiceCurrency(invoice.totalAmount)}</strong>
            <p><CalendarDays size={15} /> Vencimento em <strong>{formatInvoiceDate(invoice.dueDate, true)}</strong></p>
          </div>

          <div className="invoice-payment-preview">
            <div className="invoice-payment-icon"><Clock3 size={17} /></div>
            <div>
              <strong>{invoice.items.length} {invoice.items.length === 1 ? 'conta incluída' : 'contas incluídas'}</strong>
              <span>Contas pagas vinculadas a esta fatura</span>
            </div>
            <b>{formatInvoiceCurrency(paidBillsTotal)}</b>
          </div>

          <div className="invoice-purchases">
            <div className="invoice-section-heading">
              <div>
                <span className="invoice-card-kicker">DETALHAMENTO</span>
                <h3>Itens desta fatura</h3>
              </div>
              <span>{invoice.items.length} {invoice.items.length === 1 ? 'item' : 'itens'}</span>
            </div>

            {invoice.items.length > 0 ? (
              <div className="invoice-purchase-list">
                {invoice.items.map((item) => {
                  const Icon = getInvoiceItemIcon(item)
                  return (
                    <div className="invoice-purchase" key={item.id}>
                      <span className="invoice-purchase-icon"><Icon size={17} /></span>
                      <div className="invoice-purchase-info">
                        <strong>{item.name}</strong>
                        <span>{item.detail || 'Conta paga'}</span>
                      </div>
                      <time>Conta paga</time>
                      <b>{formatInvoiceCurrency(item.amount)}</b>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="invoice-detail-empty">Esta fatura não possui contas pagas vinculadas.</div>
            )}

            {additionalAmount > 0 && (
              <div className="invoice-purchase invoice-purchase-additional">
                <span className="invoice-purchase-icon"><ReceiptText size={17} /></span>
                <div className="invoice-purchase-info">
                  <strong>Valor adicional informado</strong>
                  <span>Valor previsto ao criar a fatura</span>
                </div>
                <time>Inclusão</time>
                <b>{formatInvoiceCurrency(additionalAmount)}</b>
              </div>
            )}

            <div className="invoice-total-row">
              <span>Total da fatura</span>
              <strong>{formatInvoiceCurrency(invoice.totalAmount)}</strong>
            </div>
          </div>
        </article>

        <aside className="invoice-side-column">
          <article className="invoice-card-preview invoice-preview-summary">
            <div className="invoice-card-preview-top">
              <span className="invoice-card-brand"><span>M</span> MAZE BANK</span>
              <ReceiptText size={19} />
            </div>
            <span className="invoice-card-label">FATURA</span>
            <strong className="invoice-card-number">{invoice.name}</strong>
            <div className="invoice-card-bottom">
              <span>Vencimento {formatInvoiceDate(invoice.dueDate, true)}</span>
              <span>{isPaid ? 'Paga' : invoice.status}</span>
            </div>
          </article>

          <article className="invoice-limit-card">
            <div className="invoice-section-heading">
              <div>
                <span className="invoice-card-kicker">RESUMO</span>
                <h3>Composição da fatura</h3>
              </div>
            </div>
            <div className="invoice-limit-available invoice-composition-row">
              <span>Contas pagas</span>
              <strong>{formatInvoiceCurrency(paidBillsTotal)}</strong>
            </div>
            {additionalAmount > 0 && (
              <div className="invoice-limit-available invoice-composition-row">
                <span>Valor adicional</span>
                <strong>{formatInvoiceCurrency(additionalAmount)}</strong>
              </div>
            )}
            <div className="invoice-limit-available invoice-composition-row">
              <span>Total</span>
              <strong>{formatInvoiceCurrency(invoice.totalAmount)}</strong>
            </div>
            {totalPaid > 0 && (
              <>
                <div className="invoice-limit-available invoice-composition-row">
                  <span>Pago até agora</span>
                  <strong>{formatInvoiceCurrency(totalPaid)}</strong>
                </div>
                {!isPaid && (
                  <div className="invoice-limit-available invoice-composition-row">
                    <span>Valor restante</span>
                    <strong>{formatInvoiceCurrency(remainingAmount)}</strong>
                  </div>
                )}
              </>
            )}
            <div className="invoice-limit-available invoice-composition-row">
              <span>Criada em</span>
              <strong>{formatInvoiceDate(invoice.createdAt)}</strong>
            </div>
          </article>

          <div className={`invoice-card-due${isPaid ? ' is-paid' : ''}${isCancelled ? ' is-cancelled' : ''}`}>
            <span className="invoice-due-icon"><CalendarDays size={17} /></span>
            <p>
              <strong>{isPaid ? 'Fatura paga' : isCancelled ? 'Fatura cancelada' : 'Vencimento da fatura'}</strong>
              <span>{isPaid ? 'O pagamento foi registrado.' : isCancelled ? 'Esta fatura foi cancelada.' : `Vence em ${formatInvoiceDate(invoice.dueDate, true)}.`}</span>
            </p>
          </div>

          {paymentResult && !paymentResult.invoicePaid && (
            <div className="invoice-payment-partial" role="status">
              <Wallet size={16} />
              <span>
                Pagamento parcial de <strong>{formatInvoiceCurrency(paymentResult.amountPaid)}</strong>.
                {' '}O restante continua em aberto.
              </span>
            </div>
          )}

          {!isPaid && !isCancelled && (
            <button
              className="invoice-pay-button"
              onClick={() => {
                setPaymentError('')
                setPaymentPassword('')
                setPaymentResult(null)
                setConfirmingPayment(true)
              }}
              type="button"
            >
              <Wallet size={16} />
              Pagar com saldo
            </button>
          )}

          <button className="invoice-download-button" type="button" disabled>
            <Download size={16} />
            Baixar fatura
            <span>Em breve</span>
          </button>
          <button
            className="invoice-delete-button"
            onClick={() => {
              setDeleteError('')
              setConfirmingDelete(true)
            }}
            type="button"
          >
            <Trash2 size={16} />
            Excluir fatura
          </button>
        </aside>
      </div>

      <div className="invoice-demo-footnote">
        <ArrowDownLeft size={15} />
        <span>Os valores e itens exibidos foram retornados pela sua conta Maze Bank.</span>
      </div>

      {confirmingDelete && createPortal(
        <div className="invoice-success-backdrop">
          <section
            aria-labelledby="invoice-delete-title"
            aria-modal="true"
            className="invoice-success-modal invoice-delete-modal"
            role="dialog"
          >
            <button
              aria-label="Fechar confirmação"
              className="invoice-success-close"
              disabled={deleting}
              onClick={() => setConfirmingDelete(false)}
              type="button"
            >
              <X size={18} />
            </button>
            <span className="invoice-delete-icon"><Trash2 size={24} /></span>
            <span className="invoice-card-kicker">EXCLUSÃO DE FATURA</span>
            <h2 id="invoice-delete-title">Excluir esta fatura?</h2>
            <p>A fatura “{invoice.name}” será removida permanentemente. Esta ação não pode ser desfeita.</p>
            {deleteError && <p className="invoice-delete-error" role="alert">{deleteError}</p>}
            <div className="invoice-delete-actions">
              <button
                className="invoice-delete-cancel"
                disabled={deleting}
                onClick={() => setConfirmingDelete(false)}
                type="button"
              >
                Cancelar
              </button>
              <button
                className="invoice-delete-confirm"
                disabled={deleting}
                onClick={() => void handleDeleteInvoice()}
                type="button"
              >
                {deleting ? 'Excluindo...' : <><Trash2 size={15} /> Excluir fatura</>}
              </button>
            </div>
          </section>
        </div>,
        getModalRoot(),
      )}

      {confirmingPayment && createPortal(
        <div className="invoice-success-backdrop">
          <section
            aria-labelledby="invoice-payment-title"
            aria-modal="true"
            className="invoice-success-modal invoice-payment-modal"
            role="dialog"
          >
            <button
              aria-label="Fechar pagamento"
              className="invoice-success-close"
              disabled={paying}
              onClick={() => setConfirmingPayment(false)}
              type="button"
            >
              <X size={18} />
            </button>
            {paymentResult ? (
              <>
                <span className="invoice-success-icon"><CheckCircle2 size={26} /></span>
                <span className="invoice-card-kicker">PAGAMENTO CONFIRMADO</span>
                <h2 id="invoice-payment-title">{paymentResult.invoicePaid ? 'Fatura paga' : 'Pagamento parcial realizado'}</h2>
                <p>
                  {formatInvoiceCurrency(paymentResult.amountPaid)} foi debitado do seu saldo.
                  {' '}{formatInvoiceCurrency(paymentResult.cardLimitRestored)} voltou ao limite disponível do cartão.
                  {paymentResult.invoicePaid ? '' : ' O valor restante continua em aberto.'}
                </p>
                <button
                  className="invoice-success-confirm"
                  onClick={() => setConfirmingPayment(false)}
                  type="button"
                >
                  Concluir
                </button>
              </>
            ) : (
              <form className="invoice-payment-form" onSubmit={(event) => void handlePayInvoice(event)}>
                <span className="invoice-delete-icon invoice-payment-icon"><Wallet size={23} /></span>
                <span className="invoice-card-kicker">PAGAMENTO COM SALDO</span>
                <h2 id="invoice-payment-title">Confirmar pagamento</h2>
                <p>
                  Até <strong>{formatInvoiceCurrency(Math.min(Math.max(0, balance), remainingAmount))}</strong> será debitado
                  do saldo disponível de <strong>{formatInvoiceCurrency(balance)}</strong>.
                  Se o saldo não cobrir o valor restante, o pagamento será parcial.
                </p>
                <label className="invoice-simulation-name-field">
                  Senha da conta
                  <input
                    autoComplete="current-password"
                    autoFocus
                    onChange={(event) => setPaymentPassword(event.target.value)}
                    required
                    type="password"
                    value={paymentPassword}
                  />
                </label>
                {paymentError && <p className="invoice-payment-error" role="alert">{paymentError}</p>}
                <div className="invoice-delete-actions">
                  <button
                    className="invoice-delete-cancel"
                    disabled={paying}
                    onClick={() => setConfirmingPayment(false)}
                    type="button"
                  >
                    Cancelar
                  </button>
                  <button className="invoice-delete-confirm" disabled={paying || !paymentPassword} type="submit">
                    {paying ? 'Processando...' : <>Pagar fatura <Wallet size={15} /></>}
                  </button>
                </div>
              </form>
            )}
          </section>
        </div>,
        getModalRoot(),
      )}
    </section>
  )
}
