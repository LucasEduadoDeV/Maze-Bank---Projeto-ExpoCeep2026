import { useState, type FormEvent } from 'react'
import { ArrowLeft, ArrowRight, Check, Clock3, Info, KeyRound, QrCode, ShieldCheck, UserRound, Wallet } from 'lucide-react'
import './PixPage.css'

interface PixPageProps {
  onBack: () => void
}

type PixErrors = { cpf?: string; amount?: string }

function formatCpf(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 11)
  return digits
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
}

function parseAmount(value: string) {
  const normalized = value.trim().replace(/\./g, '').replace(',', '.')
  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) return 0
  return Number(normalized)
}

function formatCurrency(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function maskCpf(value: string) {
  const digits = value.replace(/\D/g, '')
  return `•••.•••.•••-${digits.slice(-2)}`
}

function PixPage({ onBack }: PixPageProps) {
  const [step, setStep] = useState<'details' | 'review'>('details')
  const [cpf, setCpf] = useState('')
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [errors, setErrors] = useState<PixErrors>({})

  const numericAmount = parseAmount(amount)

  function handleContinue(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const nextErrors: PixErrors = {}
    if (cpf.replace(/\D/g, '').length !== 11) nextErrors.cpf = 'Informe um CPF com 11 dígitos.'
    if (numericAmount <= 0) nextErrors.amount = 'Informe um valor maior que R$ 0,00.'
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length === 0) setStep('review')
  }

  return (
    <section className="pix-page">
      <div className="pix-page-heading">
        <div>
          <span className="eyebrow">TRANSFERÊNCIAS</span>
          <h1>Pix</h1>
          <p>Envie dinheiro para outra conta Maze Bank.</p>
        </div>
        <button className="pix-back-button" type="button" onClick={onBack}><ArrowLeft size={16} /> Voltar</button>
      </div>

      <div className="pix-progress" aria-label={`Etapa ${step === 'details' ? 1 : 2} de 2`}>
        <span className="pix-progress-step current"><i>{step === 'review' ? <Check size={13} /> : '1'}</i><b>Dados do Pix</b></span>
        <span className={`pix-progress-line${step === 'review' ? ' complete' : ''}`} />
        <span className={`pix-progress-step${step === 'review' ? ' current' : ''}`}><i>2</i><b>Revisão</b></span>
      </div>

      {step === 'details' ? (
        <div className="pix-layout">
          <form className="pix-form-panel pix-form" onSubmit={handleContinue} noValidate>
            <div className="pix-panel-heading">
              <span className="pix-panel-icon"><QrCode size={19} /></span>
              <div><h2>Para quem você vai enviar?</h2><p>Use o CPF cadastrado no Maze Bank como chave Pix.</p></div>
            </div>

            <div className={`pix-field${errors.cpf ? ' has-error' : ''}`}>
              <label htmlFor="pix-cpf">CPF de quem recebe</label>
              <div className="pix-input-wrap"><UserRound size={17} /><input id="pix-cpf" inputMode="numeric" autoComplete="off" placeholder="000.000.000-00" value={cpf} onChange={(event) => { setCpf(formatCpf(event.target.value)); setErrors((previous) => ({ ...previous, cpf: undefined })) }} aria-invalid={Boolean(errors.cpf)} aria-describedby={errors.cpf ? 'pix-cpf-error' : 'pix-cpf-hint'} /></div>
              {errors.cpf ? <span className="pix-field-error" id="pix-cpf-error">{errors.cpf}</span> : <span className="pix-field-hint" id="pix-cpf-hint">O destinatário será identificado após conectar a API.</span>}
            </div>

            <div className={`pix-field${errors.amount ? ' has-error' : ''}`}>
              <label htmlFor="pix-amount">Valor da transferência</label>
              <div className="pix-amount-wrap"><span>R$</span><input id="pix-amount" inputMode="decimal" placeholder="0,00" value={amount} onChange={(event) => { setAmount(event.target.value.replace(/[^\d,]/g, '').replace(/(,.*),/g, '$1').slice(0, 12)); setErrors((previous) => ({ ...previous, amount: undefined })) }} aria-invalid={Boolean(errors.amount)} aria-describedby={errors.amount ? 'pix-amount-error' : undefined} /></div>
              {errors.amount && <span className="pix-field-error" id="pix-amount-error">{errors.amount}</span>}
            </div>

            <div className="pix-field">
              <label htmlFor="pix-description">Descrição <span>Opcional</span></label>
              <input className="pix-plain-input" id="pix-description" maxLength={80} placeholder="Ex.: divisão do jantar" value={description} onChange={(event) => setDescription(event.target.value)} />
              <span className="pix-character-count">{description.length}/80</span>
            </div>

            <button className="pix-continue" type="submit">Revisar Pix <ArrowRight size={17} /></button>
          </form>

          <aside className="pix-side-note">
            <div className="pix-side-note-icon"><ShieldCheck size={19} /></div>
            <span className="pix-side-label">TRANSFERÊNCIA SEGURA</span>
            <h2>Confira antes de enviar.</h2>
            <p>Na próxima etapa você revisa os dados. O nome do destinatário só será confirmado quando a consulta ao backend estiver conectada.</p>
            <div className="pix-note-divider" />
            <div className="pix-demo-note"><Info size={15} /><span>Esta é uma transferência demonstrativa. Nenhum dinheiro real será movimentado nesta etapa.</span></div>
          </aside>
        </div>
      ) : (
        <div className="pix-layout pix-review-layout">
          <section className="pix-form-panel pix-review-panel">
            <div className="pix-panel-heading">
              <span className="pix-panel-icon"><Check size={19} /></span>
              <div><h2>Revise os dados do Pix</h2><p>Confira os dados antes de continuar.</p></div>
            </div>
            <div className="pix-review-recipient"><span className="pix-review-avatar"><UserRound size={18} /></span><span><small>CHAVE CPF</small><strong>{maskCpf(cpf)}</strong><em>Destinatário pendente de identificação</em></span><KeyRound size={17} /></div>
            <div className="pix-review-rows">
              <div><span>Valor</span><strong>{formatCurrency(numericAmount)}</strong></div>
              <div><span>Descrição</span><strong>{description.trim() || 'Sem descrição'}</strong></div>
              <div><span>Tipo</span><strong>Pix entre contas Maze Bank</strong></div>
            </div>
            <button className="pix-edit-button" type="button" onClick={() => setStep('details')}><ArrowLeft size={15} /> Editar dados</button>
          </section>

          <aside className="pix-side-note pix-pending-note">
            <span className="pix-pending-icon"><Clock3 size={19} /></span>
            <span className="pix-side-label">AGUARDANDO BACKEND</span>
            <h2>O Pix ainda não foi enviado.</h2>
            <p>Quando o endpoint de transferência estiver pronto, esta etapa poderá confirmar o destinatário e concluir a operação.</p>
            <div className="pix-demo-note"><Info size={15} /><span>Nenhuma transferência foi realizada. Seus dados continuam nesta tela para revisão.</span></div>
            <button className="pix-confirm-disabled" type="button" disabled><Wallet size={16} /> Confirmar e enviar Pix</button>
          </aside>
        </div>
      )}

      <footer className="pix-page-footer"><span><ShieldCheck size={14} /> Maze Bank · Ambiente demonstrativo</span><span>As transferências ainda não estão habilitadas.</span></footer>
    </section>
  )
}

export default PixPage