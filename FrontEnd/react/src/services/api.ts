export const API_URL = import.meta.env.VITE_API_URL;

import type { Bill, BillCategory, BillStatus } from '../bills'

export interface AccountUser {
  id?: string
  name: string
  balance: number | string
  email?: string
  cpf?: string
  createdAt?: string
  theme: 'LIGHT' | 'DARK'
}

export interface ActivityUser {
  name: string
  cpf?: string
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
  sender?: ActivityUser
  receiver?: ActivityUser
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

export interface CreateCardPayload {
  name: string
  monthlyIncome: number
  theme: CardTheme
}

export interface CreateInvoicePayload {
  predictedValue?: number
  nameInvoice?: string
}

export interface CreatedInvoice {
  invoiceId: string
  invoiceName: string
  totalAmount: number
  totalPredicted: number
}

export interface InvoiceItem {
  id: string
  name: string
  detail: string
  amount: number
}

export interface InvoiceCard {
  id: string
  name: string
  lastFour: string
}

export interface AccountInvoice {
  id: string
  name: string
  totalAmount: number
  totalPredicted: number
  totalPaid: number
  dueDate: string
  createdAt: string
  status: 'Em aberto' | 'Paga' | 'Cancelada'
  items: InvoiceItem[]
  card: InvoiceCard | null
}

export interface InvoicesResponse {
  data: AccountInvoice[]
  meta: PaginationMeta
}

export type CardTheme = 0 | 1 | 2

export interface CreatedCard {
  id: string
  name: string
  lastFour: string
  validateDate: string
  totalLimit: string
  freeLimit: string
  status: 'ATIVO' | 'BLOQUEADO'
  main?: boolean
  theme: CardTheme
}

export type AccountCard = CreatedCard

export interface CardSensitiveDetails {
  cardNumber: string
  cvv: string
}

export async function blockCard(cardId: string, password: string): Promise<'BLOQUEADO'> {
  return updateCardStatus(cardId, 'block', 'BLOQUEADO', password)
}

export async function unblockCard(cardId: string, password: string): Promise<'ATIVO'> {
  return updateCardStatus(cardId, 'desblock', 'ATIVO', password)
}

export async function deleteCard(cardId: string, password: string): Promise<void> {
  const response = await fetch(`${API_URL}/api/cards/${encodeURIComponent(cardId)}/delete`, {
    method: 'DELETE',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password }),
  })

  const data = await response.json().catch(() => ({})) as { deleted?: unknown; message?: unknown }
  if (response.status === 401 && data.message === 'Senha incorreta') {
    throw new Error('Senha incorreta. Confira e tente novamente.')
  }
  if (response.status === 401) throw new Error('UNAUTHORIZED')
  if (!response.ok) {
    throw new Error(typeof data.message === 'string' ? data.message : 'Não foi possível excluir o cartão.')
  }
  if (data.deleted !== true) {
    throw new Error('A resposta do servidor ao excluir o cartão é inválida.')
  }
}

export async function setMainCard(cardId: string): Promise<void> {
  const response = await fetch(`${API_URL}/api/cards/${encodeURIComponent(cardId)}/main`, {
    method: 'PATCH',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
  })

  const data = await response.json().catch(() => ({})) as { id?: unknown; main?: unknown; message?: unknown }
  if (response.status === 401) throw new Error('UNAUTHORIZED')
  if (!response.ok) {
    throw new Error(typeof data.message === 'string' ? data.message : 'Não foi possível definir o cartão principal.')
  }
  if (data.id !== cardId || data.main !== true) {
    throw new Error('A resposta do servidor ao definir o cartão principal é inválida.')
  }
}

async function updateCardStatus<TStatus extends 'ATIVO' | 'BLOQUEADO'>(
  cardId: string,
  action: 'block' | 'desblock',
  expectedStatus: TStatus,
  password: string,
): Promise<TStatus> {
  const response = await fetch(`${API_URL}/api/cards/${encodeURIComponent(cardId)}/${action}`, {
    method: 'PATCH',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password }),
  })

  const data = await response.json().catch(() => ({})) as { status?: unknown; message?: unknown }
  if (response.status === 401 && data.message === 'Senha incorreta') {
    throw new Error('Senha incorreta. Confira e tente novamente.')
  }
  if (response.status === 401) throw new Error('UNAUTHORIZED')
  if (!response.ok) {
    throw new Error(typeof data.message === 'string'
      ? data.message
      : `Não foi possível ${action === 'block' ? 'bloquear' : 'desbloquear'} o cartão.`)
  }
  if (data.status !== expectedStatus) {
    throw new Error('A resposta do servidor ao atualizar o cartão é inválida.')
  }

  return expectedStatus
}

export async function getMe(): Promise<DashboardData> {
  const response = await fetch(`${API_URL}/api/me`, {
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

export async function changeUserTheme(): Promise<'LIGHT' | 'DARK'> {
  const response = await fetch(`${API_URL}/api/me/theme`, {
    method: 'GET',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    cache: 'no-store',
  })

  const data = await response.json().catch(() => null) as {
    message?: unknown
    theme?: { theme?: unknown } | null
  } | null
  if (response.status === 401) throw new Error('UNAUTHORIZED')
  if (!response.ok) {
    throw new Error(typeof data?.message === 'string' ? data.message : 'Não foi possível alterar o tema.')
  }

  const theme = data?.theme?.theme
  if (theme !== 'LIGHT' && theme !== 'DARK') {
    throw new Error('A resposta do servidor ao alterar o tema é inválida.')
  }
  return theme
}

export async function registerAccount(payload: RegisterPayload): Promise<void> {
  const response = await fetch(`${API_URL}/api/register`, {
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
  const response = await fetch(`${API_URL}/api/login`, {
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

export async function logoutAccount(): Promise<void> {
  const response = await fetch(`${API_URL}/api/logout`, {
    method: 'POST',
    credentials: 'include',
  })

  const data = await response.json().catch(() => null) as { loggedOut?: unknown; message?: unknown } | null
  if (!response.ok) {
    throw new Error(typeof data?.message === 'string' ? data.message : 'Não foi possível encerrar sua sessão.')
  }
  if (data?.loggedOut !== true) {
    throw new Error('A resposta do servidor ao encerrar a sessão é inválida.')
  }
}

export async function createPixTransfer(payload: PixTransferPayload): Promise<void> {
  const response = await fetch(`${API_URL}/api/transaction`, {
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

export async function createInvoice(cardId: string, payload: CreateInvoicePayload): Promise<CreatedInvoice> {
  const response = await fetch(`${API_URL}/api/invoices/${encodeURIComponent(cardId)}`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  const data = await response.json().catch(() => ({})) as {
    message?: unknown
    invoice?: { invoiceId?: unknown; invoiceName?: unknown; totalAmount?: unknown; totalPredicted?: unknown }
  }
  if (response.status === 401) throw new Error('UNAUTHORIZED')
  if (!response.ok) {
    throw new Error(typeof data.message === 'string' ? data.message : 'Não foi possível criar a fatura.')
  }
  const invoice = data.invoice
  const totalAmount = typeof invoice?.totalAmount === 'number' || typeof invoice?.totalAmount === 'string'
    ? Number(invoice.totalAmount)
    : Number.NaN
  const totalPredicted = typeof invoice?.totalPredicted === 'number' || typeof invoice?.totalPredicted === 'string'
    ? Number(invoice.totalPredicted)
    : Number.NaN
  if (
    data.message !== 'Fatura criada.'
    || typeof invoice?.invoiceId !== 'string'
    || typeof invoice.invoiceName !== 'string'
    || !Number.isFinite(totalAmount)
    || totalAmount < 0
    || !Number.isFinite(totalPredicted)
    || totalPredicted < 0
  ) {
    throw new Error('A resposta do servidor ao criar a fatura é inválida.')
  }

  return {
    invoiceId: invoice.invoiceId,
    invoiceName: invoice.invoiceName,
    totalAmount,
    totalPredicted,
  }
}

export async function deleteInvoice(invoiceId: string): Promise<void> {
  const response = await fetch(`${API_URL}/api/invoices/${encodeURIComponent(invoiceId)}/delete`, {
    method: 'DELETE',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
  })

  const data = await response.json().catch(() => ({})) as { deleted?: unknown; message?: unknown }
  if (response.status === 401) throw new Error('UNAUTHORIZED')
  if (!response.ok) {
    throw new Error(typeof data.message === 'string' ? data.message : 'Não foi possível excluir a fatura.')
  }
  if (data.deleted !== true) {
    throw new Error('A resposta do servidor ao excluir a fatura é inválida.')
  }
}

export interface InvoiceBalancePayment {
  amountPaid: number
  invoicePaid: boolean
  cardLimitRestored: number
}

export async function payInvoiceWithBalance(invoiceId: string, password: string): Promise<InvoiceBalancePayment> {
  const response = await fetch(`${API_URL}/api/invoices/invoice/${encodeURIComponent(invoiceId)}/payment`, {
    method: 'PATCH',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password }),
  })

  const data = await response.json().catch(() => ({})) as ApiErrorResponse & {
    paid?: unknown
    invoiceId?: unknown
    amountPaid?: unknown
    invoicePaid?: unknown
    cardLimitRestored?: unknown
  }
  if (!response.ok) {
    if (response.status === 401 && data.field !== 'password') {
      throw Object.assign(new Error('UNAUTHORIZED'), { statusCode: response.status })
    }
    throw Object.assign(
      new Error(data.message ?? 'Não foi possível pagar a fatura com o saldo.'),
      { statusCode: response.status, field: data.field },
    )
  }

  const amountPaid = Number(data.amountPaid)
  const cardLimitRestored = Number(data.cardLimitRestored)
  if (
    data.paid !== true
    || data.invoiceId !== invoiceId
    || !Number.isFinite(amountPaid)
    || amountPaid <= 0
    || typeof data.invoicePaid !== 'boolean'
    || !Number.isFinite(cardLimitRestored)
    || cardLimitRestored < 0
  ) {
    throw new Error('A resposta do servidor ao pagar a fatura com saldo é inválida.')
  }

  return { amountPaid, invoicePaid: data.invoicePaid, cardLimitRestored }
}

function parseInvoiceItem(value: unknown, index: number): InvoiceItem {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('A resposta do servidor contém um lançamento de fatura inválido.')
  }
  const item = value as Record<string, unknown>
  const amount = Number(item.value)
  const name = typeof item.billName === 'string'
    ? item.billName
    : typeof item.name === 'string' ? item.name : ''
  const detail = typeof item.description === 'string'
    ? item.description
    : typeof item.biller === 'string' ? item.biller : 'Lançamento da fatura'

  if (!name.trim() || !Number.isFinite(amount) || amount < 0) {
    throw new Error('A resposta do servidor contém um lançamento de fatura inválido.')
  }

  return {
    id: typeof item.billId === 'string' ? item.billId : `item-${index}`,
    name: name.trim(),
    detail: detail.trim(),
    amount,
  }
}

function parseInvoice(value: unknown): AccountInvoice {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('A resposta do servidor contém uma fatura inválida.')
  }

  const invoice = value as Record<string, unknown>
  const totalAmount = Number(invoice.totalAmount)
  const totalPredicted = Number(invoice.totalPredicted ?? 0)
  const totalPaid = Number(invoice.totalPaid ?? 0)
  let card: InvoiceCard | null = null
  if (invoice.card !== null && invoice.card !== undefined) {
    if (
      typeof invoice.card !== 'object'
      || Array.isArray(invoice.card)
    ) {
      throw new Error('A resposta do servidor contém os dados do cartão da fatura inválidos.')
    }

    const rawCard = invoice.card as Record<string, unknown>
    if (
      typeof rawCard.id !== 'string'
      || typeof rawCard.name !== 'string'
      || typeof rawCard.lastFour !== 'string'
      || !/^\d{4}$/.test(rawCard.lastFour)
    ) {
      throw new Error('A resposta do servidor contém os dados do cartão da fatura inválidos.')
    }
    card = { id: rawCard.id, name: rawCard.name, lastFour: rawCard.lastFour }
  }
  const rawStatus = invoice.status
  const status = rawStatus === 'EM_ABERTO' || rawStatus === 'Em Aberto'
    ? 'Em aberto'
    : rawStatus === 'PAGO' || rawStatus === 'Pago'
      ? 'Paga'
      : rawStatus === 'CANCELADO' || rawStatus === 'Cancelado'
        ? 'Cancelada'
        : null
  const items = Array.isArray(invoice.itens)
    ? invoice.itens.map(parseInvoiceItem)
    : typeof invoice.itens === 'string'
      ? parseInvoiceItemsJson(invoice.itens)
      : null

  if (
    typeof invoice.invoiceId !== 'string'
    || typeof invoice.invoiceName !== 'string'
    || !Number.isFinite(totalAmount)
    || totalAmount < 0
    || !Number.isFinite(totalPredicted)
    || totalPredicted < 0
    || !Number.isFinite(totalPaid)
    || totalPaid < 0
    || typeof invoice.dueDate !== 'string'
    || Number.isNaN(new Date(invoice.dueDate).getTime())
    || typeof invoice.createdAt !== 'string'
    || Number.isNaN(new Date(invoice.createdAt).getTime())
    || !status
    || !items
  ) {
    throw new Error('A resposta do servidor contém uma fatura inválida.')
  }

  return {
    id: invoice.invoiceId,
    name: invoice.invoiceName,
    totalAmount,
    totalPredicted,
    totalPaid,
    dueDate: invoice.dueDate,
    createdAt: invoice.createdAt,
    status,
    items,
    card,
  }
}

function parseInvoiceItemsJson(value: string): InvoiceItem[] {
  let parsed: unknown
  try {
    parsed = JSON.parse(value)
  } catch {
    throw new Error('A resposta do servidor contém lançamentos de fatura inválidos.')
  }

  if (!Array.isArray(parsed)) {
    throw new Error('A resposta do servidor contém lançamentos de fatura inválidos.')
  }
  return parsed.map(parseInvoiceItem)
}

export async function getInvoices(page = 1, limit = 5, cardId?: string): Promise<InvoicesResponse> {
  const query = new URLSearchParams({ page: String(page), limit: String(limit) })
  if (cardId) query.set('cardId', cardId)
  const response = await fetch(`${API_URL}/api/invoices?${query}`, {
    method: 'GET',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    cache: 'no-store',
  })

  const data = await response.json().catch(() => null) as unknown
  if (response.status === 401) throw new Error('UNAUTHORIZED')
  if (!response.ok) {
    const message = typeof data === 'object' && data !== null && 'message' in data
      && typeof data.message === 'string'
      ? data.message
      : 'Não foi possível carregar suas faturas.'
    throw new Error(message)
  }

  if (
    typeof data !== 'object'
    || data === null
    || !('data' in data)
    || !Array.isArray(data.data)
    || !('meta' in data)
    || !isPaginationMeta(data.meta)
  ) {
    throw new Error('A resposta do servidor ao carregar as faturas é inválida.')
  }

  return {
    data: data.data.map(parseInvoice),
    meta: data.meta,
  }
}

export async function createCard(payload: CreateCardPayload): Promise<CreatedCard> {
  const response = await fetch(`${API_URL}/api/cards`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  const data = await response.json().catch(() => ({})) as Partial<CreatedCard> & ApiErrorResponse
  if (response.status === 401) {
    throw Object.assign(new Error('UNAUTHORIZED'), { statusCode: response.status })
  }
  if (!response.ok) {
    throw Object.assign(new Error(data.message ?? 'Não foi possível criar o cartão.'), {
      statusCode: response.status,
      field: data.field,
    })
  }

  if (
    typeof data.id !== 'string'
    || typeof data.name !== 'string'
    || typeof data.lastFour !== 'string'
    || typeof data.validateDate !== 'string'
    || typeof data.totalLimit !== 'string'
    || typeof data.freeLimit !== 'string'
    || (data.status !== 'ATIVO' && data.status !== 'BLOQUEADO')
    || (data.theme !== 0 && data.theme !== 1 && data.theme !== 2)
    || ('main' in data && typeof data.main !== 'boolean')
  ) {
    throw new Error('A resposta do servidor ao criar o cartão é inválida.')
  }

  return {
    id: data.id,
    name: data.name,
    lastFour: data.lastFour,
    validateDate: data.validateDate,
    totalLimit: data.totalLimit,
    freeLimit: data.freeLimit,
    status: data.status,
    main: data.main === true,
    theme: data.theme,
  }
}

let pendingCardsRequest: Promise<AccountCard[]> | null = null

export function getCards(): Promise<AccountCard[]> {
  if (pendingCardsRequest) return pendingCardsRequest

  const request = (async () => {
    const response = await fetch(`${API_URL}/api/cards`, {
      method: 'GET',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    })

    if (response.status === 401) throw new Error('UNAUTHORIZED')

    const data = await response.json().catch(() => null) as unknown
    if (!response.ok) {
      const message = typeof data === 'object' && data !== null && 'message' in data
        && typeof data.message === 'string'
        ? data.message
        : 'Não foi possível carregar seus cartões.'
      throw new Error(message)
    }

    if (!Array.isArray(data)) {
      throw new Error('A resposta do servidor ao carregar os cartões é inválida.')
    }

    return data.map((card: unknown): AccountCard => {
      if (
        typeof card !== 'object'
        || card === null
        || !('id' in card) || typeof card.id !== 'string'
        || !('name' in card) || typeof card.name !== 'string'
        || !('lastFour' in card) || typeof card.lastFour !== 'string'
        || !('validateDate' in card) || typeof card.validateDate !== 'string'
        || !('totalLimit' in card) || typeof card.totalLimit !== 'string'
        || !('freeLimit' in card) || typeof card.freeLimit !== 'string'
        || !('status' in card) || (card.status !== 'ATIVO' && card.status !== 'BLOQUEADO')
        || !('theme' in card) || (card.theme !== 0 && card.theme !== 1 && card.theme !== 2)
        || ('main' in card && typeof card.main !== 'boolean')
      ) {
        throw new Error('A resposta do servidor contém um cartão inválido.')
      }

      return {
        id: card.id,
        name: card.name,
        lastFour: card.lastFour,
        validateDate: card.validateDate,
        totalLimit: card.totalLimit,
        freeLimit: card.freeLimit,
        status: card.status,
        main: 'main' in card && card.main === true,
        theme: card.theme,
      }
    })
  })()

  const sharedRequest = request.finally(() => {
    if (pendingCardsRequest === sharedRequest) pendingCardsRequest = null
  })
  pendingCardsRequest = sharedRequest
  return sharedRequest
}

export async function revealCardSensitiveDetails(cardId: string, password: string): Promise<CardSensitiveDetails> {
  const response = await fetch(`${API_URL}/api/cards/${encodeURIComponent(cardId)}/details`, {
    method: 'POST',
    credentials: 'include',
    cache: 'no-store',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password }),
  })

  const data = await response.json().catch(() => ({})) as Partial<CardSensitiveDetails> & ApiErrorResponse
  if (!response.ok) {
    throw Object.assign(new Error(data.message ?? 'Não foi possível confirmar sua identidade.'), {
      statusCode: response.status,
      field: data.field,
    })
  }

  if (
    typeof data.cardNumber !== 'string'
    || !/^\d{16}$/.test(data.cardNumber)
    || typeof data.cvv !== 'string'
    || !/^\d{3}$/.test(data.cvv)
  ) {
    throw new Error('A resposta do servidor com os dados do cartão é inválida.')
  }

  return { cardNumber: data.cardNumber, cvv: data.cvv }
}

export interface PaginationMeta {
  page: number
  limit: number
  totalItems: number
  totalPages: number
  hasNextPage: boolean
  hasPrevPage: boolean
}

export interface StatementResponse {
  data: Activity[]
  meta: PaginationMeta
}

export type TransactionDetails = Activity & {
  sender: ActivityUser
  receiver: ActivityUser
}

export interface BillsResponse {
  data: Bill[]
  meta: PaginationMeta
}

function parseBillStatus(value: unknown): BillStatus | null {
  if (value === 'EM_ABERTO' || value === 'Em Aberto') return 'EM_ABERTO'
  if (value === 'PAGO' || value === 'Pago') return 'PAGO'
  if (value === 'CANCELADO' || value === 'Cancelado') return 'CANCELADO'
  if (value === 'FATURADO' || value === 'Faturado') return 'FATURADO'
  return null
}

function isPaginationMeta(value: unknown): value is PaginationMeta {
  if (!value || typeof value !== 'object') return false
  const meta = value as Record<string, unknown>
  return Number.isInteger(meta.page) && Number(meta.page) >= 1
    && Number.isInteger(meta.limit) && Number(meta.limit) >= 1
    && Number.isInteger(meta.totalItems) && Number(meta.totalItems) >= 0
    && Number.isInteger(meta.totalPages) && Number(meta.totalPages) >= 0
    && typeof meta.hasNextPage === 'boolean'
    && typeof meta.hasPrevPage === 'boolean'
}

function getBillCategory(billName: string, biller: string, description: string): BillCategory {
  const searchText = `${billName} ${biller} ${description}`.toLocaleLowerCase('pt-BR')
  if (/energia|eletric|luz/.test(searchText)) return 'energia'
  if (/internet|fibra|banda larga/.test(searchText)) return 'internet'
  if (/agua|água|saneamento/.test(searchText)) return 'agua'
  return 'other'
}

function parseBill(value: unknown): Bill {
  if (!value || typeof value !== 'object') {
    throw new Error('A resposta do servidor contém uma conta inválida.')
  }

  const bill = value as Record<string, unknown>
  const amount = Number(bill.value)
  const status = parseBillStatus(bill.status)
  if (
    typeof bill.billId !== 'string'
    || typeof bill.billName !== 'string'
    || typeof bill.biller !== 'string'
    || typeof bill.description !== 'string'
    || typeof bill.dueDate !== 'string'
    || (typeof bill.value !== 'number' && typeof bill.value !== 'string')
    || !Number.isFinite(amount) || amount <= 0
    || Number.isNaN(new Date(bill.dueDate).getTime())
    || !status
  ) {
    throw new Error('A resposta do servidor contém uma conta inválida.')
  }

  return {
    id: bill.billId,
    category: getBillCategory(bill.billName, bill.biller, bill.description),
    title: bill.billName.trim(),
    company: bill.biller.trim(),
    description: bill.description.trim(),
    amount,
    dueDate: bill.dueDate,
    status,
  }
}

export async function getBills(page = 1, limit = 5): Promise<BillsResponse> {
  const response = await fetch(`${API_URL}/api/bills?page=${page}&limit=${limit}`, {
    method: 'GET',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
  })

  if (response.status === 401) throw new Error('UNAUTHORIZED')
  let payload: {
    data?: unknown
    meta?: unknown
    message?: unknown
  }
  try {
    payload = await response.json() as typeof payload
  } catch {
    throw new Error('A resposta do servidor ao carregar contas não está em um formato válido.')
  }
  if (!response.ok) {
    throw new Error(typeof payload.message === 'string' ? payload.message : 'Não foi possível carregar suas contas.')
  }

  const meta = payload.meta
  if (
    !Array.isArray(payload.data)
    || !isPaginationMeta(meta)
  ) {
    throw new Error('A resposta do servidor ao carregar contas é inválida.')
  }

  return {
    data: payload.data.map(parseBill),
    meta,
  }
}

export async function deleteSettledBill(billId: string): Promise<void> {
  const response = await fetch(`${API_URL}/api/bills/${encodeURIComponent(billId)}/delete`, {
    method: 'DELETE',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
  })

  const data = await response.json().catch(() => ({})) as ApiErrorResponse & {
    deleted?: unknown
    billId?: unknown
  }
  if (response.status === 401) throw new Error('UNAUTHORIZED')
  if (!response.ok) {
    throw new Error(data.message ?? 'Não foi possível excluir esta conta.')
  }
  if (data.deleted !== true || data.billId !== billId) {
    throw new Error('A resposta do servidor ao excluir a conta é inválida.')
  }
}

export async function payBillWithCard(cardId: string, billId: string, password: string): Promise<void> {
  const response = await fetch(
    `${API_URL}/api/bills/cards/${encodeURIComponent(cardId)}/bills/${encodeURIComponent(billId)}`,
    {
      method: 'PATCH',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    },
  )

  const data = await response.json().catch(() => ({})) as ApiErrorResponse & {
    paid?: unknown
    billId?: unknown
  }
  if (!response.ok) {
    throw Object.assign(
      new Error(data.message ?? 'Não foi possível pagar esta conta.'),
      { statusCode: response.status, field: data.field },
    )
  }
  if (data.paid !== true || data.billId !== billId) {
    throw new Error('A resposta do servidor ao pagar a conta é inválida.')
  }
}

export async function payBillWithBalance(billId: string, password: string): Promise<void> {
  const response = await fetch(`${API_URL}/api/bills/${encodeURIComponent(billId)}`, {
    method: 'PATCH',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password }),
  })

  const data = await response.json().catch(() => ({})) as ApiErrorResponse & {
    paid?: unknown
    billId?: unknown
  }
  if (!response.ok) {
    throw Object.assign(
      new Error(data.message ?? 'Não foi possível pagar esta conta com o saldo.'),
      { statusCode: response.status, field: data.field },
    )
  }
  if (data.paid !== true || data.billId !== billId) {
    throw new Error('A resposta do servidor ao pagar a conta com saldo é inválida.')
  }
}

export async function getStatement(page = 1, limit = 10): Promise<StatementResponse> {
  const response = await fetch(`${API_URL}/api/transaction?page=${page}&limit=${limit}`, {
    method: 'GET',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
  })

  if (response.status === 401) throw new Error('UNAUTHORIZED')
  if (!response.ok) throw new Error('STATEMENT_REQUEST_FAILED')

  return (await response.json()) as StatementResponse
}

export async function getTransactionDetails(transactionId: string): Promise<TransactionDetails> {
  const response = await fetch(`${API_URL}/api/transaction/${encodeURIComponent(transactionId)}`, {
    method: 'GET',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
  })

  const data = await response.json().catch(() => ({})) as Partial<TransactionDetails> & ApiErrorResponse
  if (response.status === 401) throw new Error('UNAUTHORIZED')
  if (!response.ok) {
    throw new Error(data.message ?? 'Não foi possível carregar os detalhes desta transferência.')
  }
  if (
    typeof data.id !== 'string'
    || typeof data.amount !== 'string' && typeof data.amount !== 'number'
    || typeof data.createdAt !== 'string'
    || typeof data.description !== 'string'
    || typeof data.type !== 'string'
    || typeof data.senderId !== 'string'
    || typeof data.receiverId !== 'string'
    || !data.sender
    || typeof data.sender.name !== 'string'
    || typeof data.receiver?.name !== 'string'
  ) {
    throw new Error('A resposta do servidor com os detalhes da transferência é inválida.')
  }

  return data as TransactionDetails
}
