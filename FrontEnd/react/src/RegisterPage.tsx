import { useState, type FormEvent } from 'react'
import { ArrowLeft, ArrowRight, Check, Eye, EyeOff, Fingerprint, LockKeyhole, Mail, ShieldCheck, UserRound } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { registerAccount } from './services/api'
import './RegisterPage.css'

type RegisterFields = 'name' | 'email' | 'cpf' | 'password' | 'confirmPassword'
type FieldErrors = Partial<Record<RegisterFields, string>>

function formatCpf(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 11)
  return digits
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
}

function RegisterPage() {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [cpf, setCpf] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [errors, setErrors] = useState<FieldErrors>({})
  const [requestError, setRequestError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  function validate() {
    const nextErrors: FieldErrors = {}
    const emailUser = email.trim().split('@')[0]
    const cpfDigits = cpf.replace(/\D/g, '')

    if (name.trim().length < 2) nextErrors.name = 'Informe seu nome completo.'
    if (!emailUser) nextErrors.email = 'Informe o usuário do seu e-mail.'
    if (cpfDigits.length !== 11) nextErrors.cpf = 'Informe um CPF com 11 dígitos.'
    if (password.length < 8) nextErrors.password = 'Use pelo menos 8 caracteres.'
    if (!confirmPassword) nextErrors.confirmPassword = 'Confirme sua senha.'
    else if (password !== confirmPassword) nextErrors.confirmPassword = 'As senhas não coincidem.'

    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setRequestError('')
    if (!validate()) return

    setSubmitting(true)
    try {
      await registerAccount({
        name: name.trim().toUpperCase(),
        email: `${email.trim().split('@')[0]}@gmail.com`.toLowerCase(),
        cpf,
        password,
      })
      navigate('/login', { state: { registered: true } })
    } catch (error) {
      const field = error instanceof Error && 'field' in error ? String(error.field) : ''
      const message = error instanceof Error ? error.message : 'Não foi possível criar sua conta.'
      if (field === 'email' || field === 'cpf') {
        setErrors((previous) => ({ ...previous, [field]: message }))
      } else {
        setRequestError(message)
      }
    } finally {
      setSubmitting(false)
    }
  }

  function clearFieldError(field: RegisterFields) {
    setErrors((previous) => ({ ...previous, [field]: undefined }))
    setRequestError('')
  }

  return (
    <main className="register-page">
      <section className="register-story">
        <Link className="register-brand" to="/" aria-label="Voltar para o início">
          <span className="register-brand-mark">M</span>
          <span><strong>MAZE BANK</strong><small>OF CASTALDI</small></span>
        </Link>

        <div className="register-story-copy">
          <span className="register-eyebrow"><i /> UM NOVO COMEÇO</span>
          <h1>Mais clareza.<br /><em>Mais possibilidades.</em></h1>
          <p>Crie sua conta e conheça uma experiência de banco virtual feita para explorar, aprender e organizar suas ideias.</p>
          <div className="register-points">
            <span><Check size={15} /> Cadastro simples e rápido</span>
            <span><Check size={15} /> Conta demonstrativa gratuita</span>
            <span><Check size={15} /> Seus dados protegidos no projeto</span>
          </div>
        </div>

        <div className="register-story-foot"><ShieldCheck size={16} /><span>Projeto escolar demonstrativo<br /><strong>Não é uma instituição financeira.</strong></span></div>
        <span className="register-watermark" aria-hidden="true">M</span>
      </section>

      <section className="register-form-side">
        <Link className="register-back" to="/"><ArrowLeft size={15} /> Voltar ao início</Link>
        <div className="register-form-wrap">
          <div className="register-form-heading">
            <span className="register-step">CADASTRO <i /> ETAPA 1 DE 1</span>
            <h2>Abra sua conta</h2>
            <p>Preencha seus dados para começar.</p>
          </div>

          <form className="register-form" onSubmit={handleSubmit} noValidate>
            <div className={`register-field${errors.name ? ' has-error' : ''}`}>
              <label htmlFor="register-name">Nome completo</label>
              <div className="register-input-wrap"><UserRound size={17} /><input id="register-name" autoComplete="name" placeholder="Ex.: Michael De Santa" value={name} onChange={(event) => { setName(event.target.value); clearFieldError('name') }} aria-invalid={Boolean(errors.name)} aria-describedby={errors.name ? 'register-name-error' : undefined} /></div>
              {errors.name && <span className="register-field-error" id="register-name-error">{errors.name}</span>}
            </div>

            <div className={`register-field${errors.email ? ' has-error' : ''}`}>
              <label htmlFor="register-email">E-mail</label>
              <div className="register-input-wrap register-email-wrap"><Mail size={17} /><input id="register-email" autoComplete="email" inputMode="email" placeholder="Seu email" value={email} onChange={(event) => { setEmail(event.target.value.replace(/\s/g, '').split('@')[0]); clearFieldError('email') }} aria-invalid={Boolean(errors.email)} aria-describedby={errors.email ? 'register-email-error' : undefined} /><span>@gmail.com</span></div>
              {errors.email && <span className="register-field-error" id="register-email-error">{errors.email}</span>}
            </div>

            <div className={`register-field${errors.cpf ? ' has-error' : ''}`}>
              <label htmlFor="register-cpf">CPF</label>
              <div className="register-input-wrap"><Fingerprint size={17} /><input id="register-cpf" autoComplete="off" inputMode="numeric" placeholder="000.000.000-00" value={cpf} onChange={(event) => { setCpf(formatCpf(event.target.value)); clearFieldError('cpf') }} aria-invalid={Boolean(errors.cpf)} aria-describedby={errors.cpf ? 'register-cpf-error' : undefined} /></div>
              {errors.cpf && <span className="register-field-error" id="register-cpf-error">{errors.cpf}</span>}
            </div>

            <div className={`register-field${errors.password ? ' has-error' : ''}`}>
              <label htmlFor="register-password">Senha</label>
              <div className="register-input-wrap"><LockKeyhole size={17} /><input id="register-password" autoComplete="new-password" type={showPassword ? 'text' : 'password'} placeholder="Mínimo de 8 caracteres" value={password} onChange={(event) => { setPassword(event.target.value); clearFieldError('password') }} aria-invalid={Boolean(errors.password)} aria-describedby={errors.password ? 'register-password-error' : undefined} /><button className="register-password-toggle" type="button" aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'} onClick={() => setShowPassword(!showPassword)}>{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button></div>
              {errors.password && <span className="register-field-error" id="register-password-error">{errors.password}</span>}
            </div>

            <div className={`register-field${errors.confirmPassword ? ' has-error' : ''}`}>
              <label htmlFor="register-confirm-password">Confirmar senha</label>
              <div className="register-input-wrap"><LockKeyhole size={17} /><input id="register-confirm-password" autoComplete="new-password" type={showConfirmation ? 'text' : 'password'} placeholder="Digite a senha novamente" value={confirmPassword} onChange={(event) => { setConfirmPassword(event.target.value); clearFieldError('confirmPassword') }} aria-invalid={Boolean(errors.confirmPassword)} aria-describedby={errors.confirmPassword ? 'register-confirm-password-error' : undefined} /><button className="register-password-toggle" type="button" aria-label={showConfirmation ? 'Ocultar confirmação de senha' : 'Mostrar confirmação de senha'} onClick={() => setShowConfirmation(!showConfirmation)}>{showConfirmation ? <EyeOff size={17} /> : <Eye size={17} />}</button></div>
              {errors.confirmPassword && <span className="register-field-error" id="register-confirm-password-error">{errors.confirmPassword}</span>}
            </div>

            {requestError && <div className="register-request-error" role="alert">{requestError}</div>}
            <button className="register-submit" type="submit" disabled={submitting}>{submitting ? 'Criando sua conta...' : 'Criar minha conta'} {!submitting && <ArrowRight size={17} />}</button>
          </form>

          <p className="register-login-prompt">Já tem uma conta? <Link to="/login">Fazer login</Link></p>
          <p className="register-legal">Ao continuar, você cria uma conta de demonstração do Maze Bank.</p>
        </div>
        <footer className="register-footer"><span>© 2026 Maze Bank of Castaldi</span><span>Ambiente demonstrativo</span></footer>
      </section>
    </main>
  )
}

export default RegisterPage