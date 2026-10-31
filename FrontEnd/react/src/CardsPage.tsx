import { useState } from 'react'
import { ArrowLeft, Plus, CreditCard, Shield, Lock, Trash2, CheckCircle2 } from 'lucide-react'
import './PixPage.css' // Reutilizamos estilos limpos de formulários/páginas

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

export default function CardsPage({ onBack }: CardsPageProps) {
  const [cards, setCards] = useState<CardItem[]>([
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
  ])

  const [showNewModal, setShowNewModal] = useState(false)
  const [cardName, setCardName] = useState('')
  const [cardLimit, setCardLimit] = useState('2500')
  const [cardType, setCardType] = useState<'virtual' | 'physical'>('virtual')
  const [successMsg, setSuccessMsg] = useState('')

  function handleCreateCard(e: React.FormEvent) {
    e.preventDefault()
    if (cards.length >= 3) {
      setSuccessMsg('Limite máximo de 3 cartões atingido para teste.')
      setShowNewModal(false)
      setTimeout(() => setSuccessMsg(''), 4000)
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

    setCards([newCard, ...cards])
    setShowNewModal(false)
    setCardName('')
    setSuccessMsg('Cartão criado com sucesso!')
    setTimeout(() => setSuccessMsg(''), 4000)
  }

  function toggleBlock(id: string) {
    setCards(cards.map(c => c.id === id ? { ...c, status: c.status === 'active' ? 'blocked' : 'active' } : c))
  }

  function removeCard(id: string) {
    setCards(cards.filter(c => c.id !== id))
  }

  const cardThemes = [
    { bg: 'linear-gradient(135deg, #1f2937 0%, #111827 100%)', border: 'rgba(255, 255, 255, 0.1)' },
    { bg: 'linear-gradient(135deg, #064e3b 0%, #022c22 100%)', border: 'rgba(129, 199, 166, 0.2)' },
    { bg: 'linear-gradient(135deg, #7f1d1d 0%, #450a0a 100%)', border: 'rgba(248, 113, 113, 0.2)' },
  ]

  return (
    <section className="subpage">
      <div className="page-heading">
        <div>
          <button className="quiet-button" onClick={onBack} style={{ marginBottom: '12px' }}>
            <ArrowLeft size={16} /> Voltar à visão geral
          </button>
          <span className="eyebrow">MEUS CARTÕES</span>
          <h1>Gerencie seus cartões</h1>
          <p>Visualize seus cartões ou solicite um novo (máximo de 3 cartões).</p>
        </div>
        <button className="quiet-button" style={{ padding: '8px 14px', background: 'var(--red)', color: 'white', border: 0, borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, fontSize: '11px' }} onClick={() => setShowNewModal(true)}>
          <Plus size={16} /> Novo Cartão
        </button>
      </div>

      {successMsg && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px', background: '#eefcf5', border: '1px solid #b4e6cb', color: '#1b633e', borderRadius: '6px', marginBottom: '20px', fontSize: '12px', fontWeight: 600 }}>
          <CheckCircle2 size={18} /> {successMsg}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '30px' }}>
        {cards.map((card, index) => {
          const theme = cardThemes[index % cardThemes.length]
          return (
            <div key={card.id} style={{ background: card.status === 'blocked' ? '#333' : theme.bg, color: '#fff', borderRadius: '14px', padding: '22px 24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '190px', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.15)', position: 'relative', overflow: 'hidden', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)' }} onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 16px 32px -6px rgba(0,0,0,0.25)' }} onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 10px 25px -5px rgba(0,0,0,0.15)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <span style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '1px', opacity: 0.7, fontWeight: 700 }}>{card.type === 'virtual' ? 'Virtual' : 'Físico'}</span>
                  <h3 style={{ margin: '2px 0 0', fontSize: '14px', fontWeight: 700 }}>{card.name}</h3>
                </div>
                <CreditCard size={20} style={{ opacity: 0.8 }} />
              </div>

              <div style={{ margin: '12px 0 16px' }}>
                <div style={{ fontSize: '15px', fontFamily: 'monospace', letterSpacing: '1.5px', opacity: card.status === 'blocked' ? 0.4 : 1 }}>{card.number}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px', fontSize: '11px', opacity: 0.8 }}>
                  <span>Exp: {card.expiry}</span>
                  <span>Lim: {card.limit}</span>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '10px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                <span style={{ fontSize: '9px', padding: '2px 6px', borderRadius: '4px', background: card.status === 'active' ? 'rgba(40,167,69,0.2)' : 'rgba(220,53,69,0.2)', color: card.status === 'active' ? '#4cd964' : '#ff6b6b', fontWeight: 700 }}>
                  {card.status === 'active' ? 'ATIVO' : 'BLOQUEADO'}
                </span>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={() => toggleBlock(card.id)} title={card.status === 'active' ? 'Bloquear cartão' : 'Desbloquear cartão'} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', padding: '5px', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                    {card.status === 'active' ? <Lock size={12} /> : <Shield size={12} />}
                  </button>
                  <button onClick={() => removeCard(card.id)} title="Excluir cartão" style={{ background: 'transparent', border: '1px solid rgba(220,53,69,0.4)', color: '#ff6b6b', padding: '5px', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {showNewModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'grid', placeItems: 'center', zIndex: 50, padding: '20px', animation: 'fadeIn 0.25s cubic-bezier(0.4, 0, 0.2, 1)' }}>
          <div style={{ background: 'var(--surface)', padding: '28px', borderRadius: '14px', width: '100%', maxWidth: '420px', boxShadow: '0 20px 40px -10px rgba(0,0,0,0.2)', animation: 'scaleUp 0.25s cubic-bezier(0.4, 0, 0.2, 1)' }}>
            <h2 style={{ margin: '0 0 8px', fontSize: '18px', fontWeight: 700 }}>Solicitar Novo Cartão</h2>
            <p style={{ margin: '0 0 20px', color: 'var(--muted)', fontSize: '12px' }}>Escolha o tipo e o apelido para o seu novo cartão Maze Bank.</p>
            
            <form onSubmit={handleCreateCard} style={{ display: 'grid', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, marginBottom: '6px' }}>Apelido do Cartão</label>
                <input
                  type="text"
                  placeholder="Ex: Assinaturas, Viagem, Compras"
                  value={cardName}
                  onChange={(e) => setCardName(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--line)', borderRadius: '6px', fontSize: '12px', background: 'var(--surface-soft)', color: 'var(--ink)' }}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, marginBottom: '6px' }}>Tipo de Cartão</label>
                <select
                  value={cardType}
                  onChange={(e) => setCardType(e.target.value as 'virtual' | 'physical')}
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--line)', borderRadius: '6px', fontSize: '12px', background: 'var(--surface-soft)', color: 'var(--ink)' }}
                >
                  <option value="virtual">Cartão Virtual (Recomendado para internet)</option>
                  <option value="physical">Cartão Físico (Enviado para sua casa)</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, marginBottom: '6px' }}>Limite Desejado (R$)</label>
                <input
                  type="number"
                  value={cardLimit}
                  onChange={(e) => setCardLimit(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--line)', borderRadius: '6px', fontSize: '12px', background: 'var(--surface-soft)', color: 'var(--ink)' }}
                  min="100"
                  max="50000"
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button type="button" onClick={() => setShowNewModal(false)} style={{ flex: 1, padding: '10px', border: '1px solid var(--line)', background: 'transparent', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}>
                  Cancelar
                </button>
                <button type="submit" style={{ flex: 1, padding: '10px', border: 0, background: 'var(--red)', color: 'white', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}>
                  Criar Cartão
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  )
}
