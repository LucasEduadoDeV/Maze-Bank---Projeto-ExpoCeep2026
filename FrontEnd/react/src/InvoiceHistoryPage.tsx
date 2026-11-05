import { useEffect, useLayoutEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, ArrowRight, CalendarDays, ChevronRight, CreditCard, ReceiptText } from 'lucide-react'
import InvoiceDetailPage from './InvoiceDetailPage'
import { formatInvoiceCurrency } from './invoiceDemo'
import { getInvoices, type AccountCard, type AccountInvoice, type PaginationMeta } from './services/api'
import './SimulateInvoicePage.css'

interface InvoiceHistoryPageProps {
  cards: AccountCard[]
  cardsLoading: boolean
  cardsError: string
  balance: number
  onBack: () => void
  onOpenCards: () => void
  onPaymentComplete: () => void
}

export default function InvoiceHistoryPage({
  cards,
  cardsLoading,
  cardsError,
  balance,
  onBack,
  onOpenCards,
  onPaymentComplete,
}: InvoiceHistoryPageProps) {
  const navigate = useNavigate()
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null)
  const [invoices, setInvoices] = useState<AccountInvoice[]>([])
  const [meta, setMeta] = useState<PaginationMeta | null>(null)
  const [page, setPage] = useState(1)
  const [reload, setReload] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [selectedInvoice, setSelectedInvoice] = useState<AccountInvoice | null>(null)

  const selectedCard = cards.find((card) => card.id === selectedCardId) ?? null

  useEffect(() => {
    function refreshInvoices() {
      setReload((current) => current + 1)
    }

    window.addEventListener('maze:account-updated', refreshInvoices)
    return () => window.removeEventListener('maze:account-updated', refreshInvoices)
  }, [])

  useLayoutEffect(() => {
    if (window.matchMedia('(max-width: 760px)').matches) {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
    }
  }, [selectedCardId, selectedInvoice])

  useEffect(() => {
    if (!selectedCardId) {
      setInvoices([])
      setMeta(null)
      setLoading(false)
      return
    }

    let active = true
    setLoading(true)
    setError('')

    getInvoices(page, 5, selectedCardId)
      .then((response) => {
        if (!active) return
        const lastPage = Math.max(1, response.meta.totalPages)
        if (page > lastPage) {
          setPage(lastPage)
          return
        }
        setInvoices(response.data)
        setMeta(response.meta)
        setSelectedInvoice((current) => current
          ? response.data.find((invoice) => invoice.id === current.id) ?? null
          : null)
      })
      .catch((requestError: unknown) => {
        if (!active) return
        if (requestError instanceof Error && requestError.message === 'UNAUTHORIZED') {
          navigate('/login', { replace: true, state: { sessionExpired: true } })
          return
        }
        setError(requestError instanceof Error ? requestError.message : 'Não foi possível carregar suas faturas.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [navigate, page, reload, selectedCardId])

  if (selectedInvoice) {
    return (
      <InvoiceDetailPage
        invoice={selectedInvoice}
        balance={balance}
        onBack={() => setSelectedInvoice(null)}
        onDeleted={() => {
          setSelectedInvoice(null)
          setReload((current) => current + 1)
        }}
        onPaymentComplete={() => {
          setReload((current) => current + 1)
          onPaymentComplete()
        }}
      />
    )
  }

  function chooseCard(cardId: string) {
    setSelectedCardId(cardId)
    setPage(1)
    setInvoices([])
    setMeta(null)
  }

  return (
    <section className="invoice-simulator invoice-history-page" aria-labelledby="invoice-history-title">
      <button className="invoice-back-button" onClick={onBack} type="button">
        <ArrowLeft size={16} />
        Visão geral
      </button>

      <header className="invoice-heading">
        <span className="invoice-eyebrow"><span /> CARTÃO DE CRÉDITO</span>
        <h1 id="invoice-history-title">Ver Faturas</h1>
        <p>Acompanhe os valores e status das suas faturas do cartão.</p>
      </header>

      {!selectedCardId ? (
        <>
          <div className="invoice-history-heading">
            <div>
              <span className="invoice-card-kicker">SUA CARTEIRA</span>
              <h2>Escolha um cartão</h2>
            </div>
            {!cardsLoading && !cardsError && (
              <span className="invoice-history-card-filter">
                {cards.length} {cards.length === 1 ? 'cartão' : 'cartões'}
              </span>
            )}
          </div>

          {cardsLoading ? (
            <div className="invoice-history-state" role="status">Carregando seus cartões...</div>
          ) : cardsError ? (
            <div className="invoice-history-state" role="alert">
              <CreditCard size={22} />
              <strong>Não foi possível carregar seus cartões</strong>
              <span>{cardsError}</span>
              <button className="invoice-history-action" onClick={onOpenCards} type="button">Ir para cartões</button>
            </div>
          ) : cards.length === 0 ? (
            <div className="invoice-history-state">
              <CreditCard size={22} />
              <strong>Você ainda não possui cartões</strong>
              <span>Adicione um cartão para consultar as faturas vinculadas a ele.</span>
              <button className="invoice-history-action" onClick={onOpenCards} type="button">Ver cartões</button>
            </div>
          ) : (
            <div className="invoice-card-picker" aria-label="Cartões disponíveis">
              {cards.map((card) => (
                <button
                  className={`account-card-face wallet-card-theme-${card.theme}${card.status === 'BLOQUEADO' ? ' account-card-blocked' : ''}`}
                  key={card.id}
                  onClick={() => chooseCard(card.id)}
                  type="button"
                  aria-label={`Ver faturas do cartão ${card.name}, final ${card.lastFour}`}
                >
                  <span className="dashboard-card-orbit dashboard-card-orbit-one" />
                  <span className="dashboard-card-orbit dashboard-card-orbit-two" />
                  <span className="dashboard-card-top">
                    <span className="dashboard-card-brand"><span className="dashboard-card-mark">M</span> MAZE BANK</span>
                    <span className="dashboard-card-badge">{card.status === 'BLOQUEADO' ? 'BLOQUEADO' : 'CRÉDITO'}</span>
                  </span>
                  <span className="dashboard-card-chip"><i /><i /><i /><i /></span>
                  <span className="dashboard-card-number">•••• •••• •••• {card.lastFour}</span>
                  <span className="dashboard-card-footer">
                    <span className="dashboard-card-owner">{card.name}</span>
                    <span className="invoice-card-choice-action">Ver faturas <ChevronRight size={14} /></span>
                  </span>
                </button>
              ))}
            </div>
          )}

          <div className="invoice-history-footnote">
            <span>Selecione um cartão para visualizar somente as faturas dele.</span>
          </div>
        </>
      ) : (
        <>
          <div className="invoice-history-heading">
            <div>
              <span className="invoice-card-kicker">FATURAS DO CARTÃO</span>
              <h2>{selectedCard?.name ?? 'Cartão selecionado'}</h2>
              {selectedCard && <span className="invoice-history-selected-card">Final {selectedCard.lastFour}</span>}
            </div>
            <button
              className="invoice-history-card-filter invoice-history-change-card"
              onClick={() => {
                setSelectedCardId(null)
                setPage(1)
                setError('')
              }}
              type="button"
            >
              <ArrowLeft size={14} />
              Todos os cartões
            </button>
          </div>

          {meta && (
            <div className="invoice-history-count">
              {meta.totalItems} {meta.totalItems === 1 ? 'fatura' : 'faturas'}
            </div>
          )}

          {error && (
            <div className="invoice-history-error" role="alert">
              <span>{error}</span>
              <button type="button" onClick={() => setReload((current) => current + 1)}>Tentar novamente</button>
            </div>
          )}

          {loading ? (
            <div className="invoice-history-state" role="status">Carregando faturas...</div>
          ) : error ? null : invoices.length === 0 ? (
            <div className="invoice-history-state">
              <ReceiptText size={22} />
              <strong>Nenhuma fatura neste cartão</strong>
              <span>Quando uma fatura for criada para este cartão, ela aparecerá aqui.</span>
            </div>
          ) : (
            <>
              <div className="invoice-history-list">
                {invoices.map((invoice) => {
                  const isPaid = invoice.status === 'Paga'
                  const dueDate = new Intl.DateTimeFormat('pt-BR', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                    timeZone: 'UTC',
                  }).format(new Date(invoice.dueDate))
                  return (
                    <button
                      className="invoice-history-item"
                      key={invoice.id}
                      onClick={() => setSelectedInvoice(invoice)}
                      type="button"
                      aria-label={`Abrir fatura ${invoice.name}, ${formatInvoiceCurrency(invoice.totalAmount)}, ${invoice.status}`}
                    >
                      <span className={`invoice-history-icon${isPaid ? ' is-paid' : ''}`}><ReceiptText size={19} /></span>
                      <span className="invoice-history-main">
                        <strong>{invoice.name}</strong>
                        <span><CalendarDays size={13} /> Vencimento {dueDate}</span>
                      </span>
                      <span className="invoice-history-amount">
                        <strong>{formatInvoiceCurrency(invoice.totalAmount)}</strong>
                        <span className={`invoice-history-status${isPaid ? ' is-paid' : ''}${invoice.status === 'Cancelada' ? ' is-cancelled' : ''}`}><i /> {invoice.status}</span>
                      </span>
                      <ArrowRight className="invoice-history-arrow" size={18} />
                    </button>
                  )
                })}
              </div>

              {meta && meta.totalPages > 1 && (
                <div className="invoice-history-pagination" aria-label="Paginação das faturas">
                  <button type="button" disabled={!meta.hasPrevPage || loading} onClick={() => setPage((current) => Math.max(1, current - 1))}>
                    Anterior
                  </button>
                  <span>Página {meta.page} de {meta.totalPages}</span>
                  <button type="button" disabled={!meta.hasNextPage || loading} onClick={() => setPage((current) => current + 1)}>
                    Próxima
                  </button>
                </div>
              )}
            </>
          )}

          <div className="invoice-history-footnote">
            <span>Selecione uma fatura para ver o detalhamento completo.</span>
          </div>
        </>
      )}
    </section>
  )
}
