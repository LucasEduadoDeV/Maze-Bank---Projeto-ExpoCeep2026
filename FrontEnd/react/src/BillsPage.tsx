import { AlertCircle, ArrowLeft, ArrowRight, Droplets, FileText, Info, LoaderCircle, Wifi, Zap } from 'lucide-react'
import type { PaginationMeta } from './services/api'
import type { Bill, BillCategory } from './bills'
import './BillsPage.css'

interface BillsPageProps {
  bills: Bill[]
  meta: PaginationMeta | null
  page: number
  loading: boolean
  error: string
  onBack: () => void
  onPageChange: (page: number) => void
  onRetry: () => void
  onSelectBill: (bill: Bill) => void
}

const categoryDetails: Record<BillCategory, { label: string; icon: typeof Zap }> = {
  energia: { label: 'Energia', icon: Zap },
  internet: { label: 'Internet', icon: Wifi },
  agua: { label: 'Água e saneamento', icon: Droplets },
  other: { label: 'Conta', icon: FileText },
}

const statusLabels = {
  EM_ABERTO: 'Em aberto',
  PAGO: 'Pago',
  CANCELADO: 'Cancelado',
  FATURADO: 'Faturado',
} satisfies Record<Bill['status'], string>

function formatCurrency(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function formatDueDate(value: string) {
  const dateOnly = /^\d{4}-\d{2}-\d{2}/.exec(value)?.[0]
  const date = new Date(dateOnly ? `${dateOnly}T12:00:00` : value)
  if (Number.isNaN(date.getTime())) return 'Data indisponível'

  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date)
}

function BillsPage({ bills, meta, page, loading, error, onBack, onPageChange, onRetry, onSelectBill }: BillsPageProps) {
  const total = bills.reduce((sum, bill) => sum + bill.amount, 0)

  return (
    <section className="bills-page" aria-labelledby="bills-title">
      <div className="bills-page-heading">
        <div>
          <span className="eyebrow">PAGAMENTOS</span>
          <h1 id="bills-title">Contas</h1>
          <p>Escolha uma conta para conferir os detalhes do pagamento.</p>
        </div>
        <button className="bills-back-button" type="button" onClick={onBack}>
          <ArrowLeft size={16} /> Voltar
        </button>
      </div>

      <div className="bills-demo-notice" role="note">
        <Info size={17} />
        <span><strong>Contas cadastradas.</strong> Selecione uma conta para consultar os dados antes de continuar.</span>
      </div>

      <div className="bills-overview">
        <span className="bills-overview-icon"><FileText size={19} /></span>
        <span className="bills-overview-copy">
          <small>CONTAS CADASTRADAS</small>
          <strong>{meta?.totalItems ?? 0} {(meta?.totalItems ?? 0) === 1 ? 'conta' : 'contas'}</strong>
        </span>
        <span className="bills-overview-total">
          <small>Total nesta página</small>
          <strong>{formatCurrency(total)}</strong>
        </span>
      </div>

      <div className="bills-list-heading">
        <div><h2>Suas contas</h2><p>Selecione uma conta para consultar os detalhes</p></div>
        <span>{meta?.totalItems ?? 0} disponíveis</span>
      </div>

      {error && (
        <div className="bills-state bills-error" role="alert">
          <AlertCircle size={20} />
          <strong>Não foi possível carregar as contas</strong>
          <p>{error}</p>
          <button type="button" onClick={onRetry}>Tentar novamente</button>
        </div>
      )}

      {loading && bills.length === 0 && !error ? (
        <div className="bills-state" role="status"><LoaderCircle className="bills-loading-icon" size={21} /><span>Carregando suas contas...</span></div>
      ) : !error && bills.length === 0 ? (
        <div className="bills-state bills-empty">
          <span className="bills-empty-icon"><FileText size={21} /></span>
          <strong>Nenhuma conta cadastrada</strong>
          <p>Quando você tiver contas disponíveis, elas aparecerão aqui.</p>
        </div>
      ) : (
        <div className="bills-list" aria-busy={loading}>
          {bills.map((bill) => {
          const category = categoryDetails[bill.category]
          const Icon = category.icon

          return (
            <button
              className={`bill-item${loading ? ' is-loading' : ''}`}
              key={bill.id}
              onClick={() => !loading && onSelectBill(bill)}
              type="button"
              disabled={loading}
              aria-label={`Ver conta de ${bill.title}, ${formatCurrency(bill.amount)}, vencimento ${formatDueDate(bill.dueDate)}`}
            >
              <span className={`bill-item-icon bill-item-icon-${bill.category}`}><Icon size={19} /></span>
              <span className="bill-item-main">
                <span className="bill-item-title"><strong>{bill.title}</strong><i className={`bill-status bill-status-${bill.status.toLowerCase()}`}>{statusLabels[bill.status]}</i></span>
                <span className="bill-item-company">{bill.company}</span>
                <span className="bill-item-meta">{category.label}<b>·</b> {bill.description}</span>
              </span>
              <span className="bill-item-payment">
                <strong>{formatCurrency(bill.amount)}</strong>
                <small>Vence em {formatDueDate(bill.dueDate)}</small>
              </span>
              <span className="bill-item-arrow" aria-hidden="true"><ArrowRight size={17} /></span>
            </button>
          )
        })}
        </div>
      )}

      {meta && meta.totalPages > 1 && (
        <div className="bills-pagination" aria-label="Paginação das contas">
          <button type="button" disabled={!meta.hasPrevPage || loading} onClick={() => onPageChange(page - 1)}>Anterior</button>
          <span>Página {meta.page} de {meta.totalPages}</span>
          <button type="button" disabled={!meta.hasNextPage || loading} onClick={() => onPageChange(page + 1)}>Próxima</button>
        </div>
      )}
    </section>
  )
}

export default BillsPage
