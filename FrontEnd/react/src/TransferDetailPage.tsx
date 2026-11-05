import { useEffect, useState } from 'react'
import { ArrowDownLeft, ArrowLeft, ArrowUpRight, BadgeCheck, CalendarDays, FileText, Fingerprint, Hash, QrCode, UserRound } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { getTransactionDetails, type TransactionDetails } from './services/api'
import './TransferDetailPage.css'

interface TransferDetailPageProps {
  transactionId: string
  userId?: string
  onBack: () => void
}

function formatCpf(cpf?: string) {
  const digits = cpf?.replace(/\D/g, '') ?? ''
  return digits.length === 11
    ? `•••.•••.•••-${digits.slice(-2)}`
    : 'Não informado'
}

function formatDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Data indisponível'
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

export default function TransferDetailPage({ transactionId, userId, onBack }: TransferDetailPageProps) {
  const navigate = useNavigate()
  const [transfer, setTransfer] = useState<TransactionDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [reload, setReload] = useState(0)

  useEffect(() => {
    function refreshTransfer() {
      setReload((current) => current + 1)
    }

    window.addEventListener('maze:account-updated', refreshTransfer)
    return () => window.removeEventListener('maze:account-updated', refreshTransfer)
  }, [])

  useEffect(() => {
    let active = true

    getTransactionDetails(transactionId)
      .then((data) => {
        if (active) {
          setTransfer(data)
          setError('')
        }
      })
      .catch((requestError: unknown) => {
        if (!active) return
        if (requestError instanceof Error && requestError.message === 'UNAUTHORIZED') {
          navigate('/login', { replace: true, state: { sessionExpired: true } })
          return
        }
        setTransfer(null)
        setError(requestError instanceof Error
          ? requestError.message
          : 'Não foi possível carregar os detalhes desta transferência.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [transactionId, navigate, reload])

  const isOutgoing = transfer && userId ? transfer.senderId === userId : true
  const amount = transfer
    ? Number(transfer.amount).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
    : ''

  return (
    <section className="transfer-detail-page">
      <div className="transfer-detail-heading">
        <button className="quiet-button" type="button" onClick={onBack}>
          <ArrowLeft size={16} /> Voltar
        </button>
        <div>
          <span className="eyebrow">MOVIMENTAÇÃO DA CONTA</span>
          <h1>Detalhes da transferência</h1>
          <p>Confira os dados e participantes desta movimentação.</p>
        </div>
      </div>

      {loading ? (
        <div className="transfer-detail-state" role="status">
          <span className="transfer-detail-state-icon"><FileText size={22} /></span>
          <h2>Carregando transferência...</h2>
        </div>
      ) : error ? (
        <div className="transfer-detail-state transfer-detail-error" role="alert">
          <span className="transfer-detail-state-icon"><FileText size={22} /></span>
          <h2>Não foi possível abrir esta transferência</h2>
          <p>{error}</p>
          <button className="quiet-button" type="button" onClick={onBack}>Voltar para movimentações</button>
        </div>
      ) : transfer ? (
        <div className="transfer-detail-content">
          <section className={`transfer-receipt${isOutgoing ? ' is-outgoing' : ' is-incoming'}`} aria-label="Resumo da transferência">
            <span className="transfer-receipt-watermark" aria-hidden="true">M</span>
            <div className="transfer-receipt-status"><BadgeCheck size={17} /> Transferência concluída</div>
            <span className="transfer-receipt-label">{isOutgoing ? 'Valor enviado' : 'Valor recebido'}</span>
            <strong className="transfer-receipt-amount">{isOutgoing ? '− ' : '+ '}{amount}</strong>
            <span className="transfer-receipt-date"><CalendarDays size={15} /> {formatDate(transfer.createdAt)}</span>
          </section>

          <section className="transfer-detail-card">
            <div className="transfer-detail-card-heading">
              <span className="transfer-detail-card-icon"><FileText size={18} /></span>
              <div><h2>Dados da transferência</h2><p>Informações registradas na operação</p></div>
            </div>
            <dl className="transfer-detail-list">
              <div className="transfer-detail-row">
                <dt><Hash size={15} /> Identificador</dt>
                <dd className="transfer-identifier">{transfer.id}</dd>
              </div>
              <div className="transfer-detail-row">
                <dt><QrCode size={15} /> Tipo</dt>
                <dd>{transfer.type.toLocaleUpperCase('pt-BR') === 'TRANSACTION' ? 'Pix' : transfer.type}</dd>
              </div>
              <div className="transfer-detail-row">
                <dt><FileText size={15} /> Descrição</dt>
                <dd>{transfer.description.trim() || 'Sem descrição'}</dd>
              </div>
            </dl>
          </section>

          <section className="transfer-detail-card">
            <div className="transfer-detail-card-heading">
              <span className="transfer-detail-card-icon"><UserRound size={18} /></span>
              <div><h2>Participantes</h2><p>Origem e destino do valor</p></div>
            </div>
            <div className="transfer-participants">
              {[transfer.sender, transfer.receiver].map((participant, index) => (
                <article className="transfer-participant" key={index === 0 ? transfer.senderId : transfer.receiverId}>
                  <span className={`transfer-participant-icon ${index === 0 ? 'sender' : 'receiver'}`}>
                    {index === 0 ? <ArrowUpRight size={17} /> : <ArrowDownLeft size={17} />}
                  </span>
                  <div className="transfer-participant-copy">
                    <span>{index === 0 ? 'Enviado por' : 'Recebido por'}</span>
                    <strong>{participant.name}</strong>
                    <small><Fingerprint size={13} /> CPF {formatCpf(participant.cpf)}</small>
                  </div>
                  <span className={`transfer-participant-direction ${index === 0 ? 'sender' : 'receiver'}`}>
                    {index === 0 ? 'Origem' : 'Destino'}
                  </span>
                </article>
              ))}
            </div>
          </section>
        </div>
      ) : null}
    </section>
  )
}
