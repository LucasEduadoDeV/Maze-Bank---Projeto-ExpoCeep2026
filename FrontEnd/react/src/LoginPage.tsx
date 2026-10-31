import { useState, type FormEvent } from 'react'
import { ArrowLeft, ArrowRight, Check, Eye, EyeOff, LockKeyhole, Mail, ShieldCheck } from 'lucide-react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { loginAccount } from './services/api'
import './LoginPage.css'

type LoginField = 'email' | 'password'
type LoginErrors = Partial<Record<LoginField, string>>

function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const navigationState = location.state as { registered?: boolean; sessionExpired?: boolean } | null
  const registered = navigationState?.registered ?? false
  const sessionExpired = navigationState?.sessionExpired ?? false
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState<LoginErrors>({})
  const [requestError, setRequestError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  function clearFieldError(field: LoginField) {
    setErrors((previous) => ({ ...previous, [field]: undefined }))
    setRequestError('')
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setRequestError('')

    const nextErrors: LoginErrors = {}
    const emailUser = email.trim().split('@')[0]
    if (!emailUser) nextErrors.email = 'Informe o usuário do seu e-mail.'
    if (!password) nextErrors.password = 'Informe sua senha.'
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    setSubmitting(true)
    try {
      await loginAccount({
        email: `${emailUser}@gmail.com`.toLowerCase(),
        password,
      })
      navigate('/dashboard', { replace: true })
    } catch (error) {
      const field = error instanceof Error && 'field' in error ? String(error.field) : ''
      const message = error instanceof Error ? error.message : 'Não foi possível acessar sua conta.'
      if (field === 'email' || field === 'password') {
        setErrors((previous) => ({ ...previous, [field]: message }))
      } else {
        setRequestError(message)
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="login-page">
      <section className="login-story">
        <Link className="login-brand" to="/" aria-label="Voltar para o início">
          <span className="login-brand-mark">M</span>
          <span><strong>MAZE BANK</strong><small>OF CASTALDI</small></span>
        </Link>

        <div className="login-story-copy">
          <span className="login-eyebrow"><i /> SEU BANCO VIRTUAL</span>
          <h1>Bom ter você<br /><em>por aqui.</em></h1>
          <p>Acesse sua conta para acompanhar seu saldo e explorar o painel demonstrativo do Maze Bank.</p>
          <div className="login-demo-card">
            <span className="login-demo-icon"><ShieldCheck size={18} /></span>
            <span><strong>Ambiente de demonstração</strong><small>Projeto escolar, sem operações financeiras reais.</small></span>
          </div>
        </div>

        <div className="login-story-foot"><Check size={15} /><span>Bem-vindo de volta ao Maze Bank</span></div>
        <span className="login-watermark" aria-hidden="true">M</span>
      </section>

      <section className="login-form-side">
        <Link className="login-back" to="/"><ArrowLeft size={15} /> Voltar ao início</Link>
        <div className="login-form-wrap">
          <div className="login-form-heading">
            <span className="login-step">ACESSO À CONTA</span>
            <h2>Bem-vindo de volta</h2>
            <p>Entre com os dados da sua conta.</p>
          </div>

          {registered && <div className="login-success" role="status"><Check size={16} /><span>Conta criada com sucesso. Agora você já pode entrar.</span></div>}
          {sessionExpired && <div className="login-session-expired" role="status">Sua sessão expirou ou o token é inválido. Entre novamente para continuar.</div>}

          <form className="login-form" onSubmit={handleSubmit} noValidate>
            <div className={`login-field${errors.email ? ' has-error' : ''}`}>
              <label htmlFor="login-email">E-mail</label>
              <div className="login-input-wrap"><Mail size={17} /><input id="login-email" autoComplete="email" inputMode="email" placeholder="Seu email" value={email} onChange={(event) => { setEmail(event.target.value.replace(/\s/g, '').split('@')[0]); clearFieldError('email') }} aria-invalid={Boolean(errors.email)} aria-describedby={errors.email ? 'login-email-error' : undefined} /><span>@gmail.com</span></div>
              {errors.email && <span className="login-field-error" id="login-email-error">{errors.email}</span>}
            </div>

            <div className={`login-field${errors.password ? ' has-error' : ''}`}>
              <div className="login-password-label"><label htmlFor="login-password">Senha</label></div>
              <div className="login-input-wrap"><LockKeyhole size={17} /><input id="login-password" autoComplete="current-password" type={showPassword ? 'text' : 'password'} placeholder="Sua senha" value={password} onChange={(event) => { setPassword(event.target.value); clearFieldError('password') }} aria-invalid={Boolean(errors.password)} aria-describedby={errors.password ? 'login-password-error' : undefined} /><button className="login-password-toggle" type="button" aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'} onClick={() => setShowPassword(!showPassword)}>{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button></div>
              {errors.password && <span className="login-field-error" id="login-password-error">{errors.password}</span>}
            </div>

            {requestError && <div className="login-request-error" role="alert">{requestError}</div>}
            <button className="login-submit" type="submit" disabled={submitting}>{submitting ? 'Verificando acesso...' : 'Entrar na minha conta'} {!submitting && <ArrowRight size={17} />}</button>
          </form>

          <p className="login-register-prompt">Ainda não tem uma conta? <Link to="/register">Criar conta</Link></p>
          <div className="login-form-note"><LockKeyhole size={14} /><span>Sua sessão é protegida por autenticação do Maze Bank.</span></div>
        </div>
        <footer className="login-footer"><span>© 2026 Maze Bank of Castaldi</span><span>Ambiente demonstrativo</span></footer>
      </section>
    </main>
  )
}

export default LoginPage