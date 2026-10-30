export interface AccountUser {
  id?: string
  name: string
  balance: number | string
  email?: string
  createdAt?: string
}

export interface Activity {
  id: string
  amount: number | string
  cpf: string
  createdAt: string
  description: string
  type: string
  senderId: string
  receiverId: string
}

export interface DashboardData {
  user: AccountUser
  activities: Activity[]
}

interface GetMeResponse {
  Usuário: AccountUser
  Ativadades?: Activity[]
}

export interface RegisterPayload {
  name: string
  email: string
  cpf: string
  password: string
}

export interface ApiErrorResponse {
  message?: string
  field?: string
  errors?: Array<{ path?: string[]; message?: string }>
}

export interface LoginPayload {
  email: string
  password: string
}

export interface PixTransferPayload {
  cpf: string
  amount: number
  description: string
}

export async function getMe(): Promise<DashboardData> {
  const response = await fetch('/me', {
    method: 'GET',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
  })

  if (response.status === 401) throw new Error('UNAUTHORIZED')
  if (!response.ok) throw new Error('ACCOUNT_REQUEST_FAILED')

  const data = (await response.json()) as GetMeResponse
  return {
    user: data['Usuário'],
    activities: data['Ativadades'] ?? [],
  }
}

export async function registerAccount(payload: RegisterPayload): Promise<void> {
  const response = await fetch('/api/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  const data = (await response.json()) as ApiErrorResponse
  if (!response.ok) {
    const validationMessage = data.errors?.[0]?.message
    throw Object.assign(new Error(data.message ?? validationMessage ?? 'Não foi possível criar sua conta.'), {
      field: data.field ?? data.errors?.[0]?.path?.[0],
    })
  }
}

export async function loginAccount(payload: LoginPayload): Promise<void> {
  const response = await fetch('/api/login', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const data = (await response.json()) as ApiErrorResponse
    throw Object.assign(new Error(data.message ?? 'Não foi possível acessar sua conta.'), {
      field: data.field ?? data.errors?.[0]?.path?.[0],
    })
  }
}

export async function createPixTransfer(payload: PixTransferPayload): Promise<void> {
  const response = await fetch('/api/transaction', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  const data = await response.json().catch(() => ({})) as ApiErrorResponse
  if (!response.ok) {
    throw Object.assign(new Error(data.message ?? 'Não foi possível realizar o Pix.'), {
      statusCode: response.status,
      field: data.field,
    })
  }
}