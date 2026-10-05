// 백엔드 DTO(record)를 그대로 옮긴 타입. 백엔드 필드가 바뀌면 여기부터 고친다.
// LocalDate/LocalDateTime/LocalTime은 JSON에서 ISO 문자열로 온다.

export type ISODate = string // 'YYYY-MM-DD'
export type ISODateTime = string // 'YYYY-MM-DDTHH:mm:ss'

export interface ApiResponse<T> {
  success: boolean
  data: T
  message: string | null
}

export interface PageResponse<T> {
  content: T[]
  page: number
  size: number
  totalElements: number
  totalPages: number
}

// ── enum ──────────────────────────────────────────────
export type Role = 'USER' | 'HOSPITAL_OWNER' | 'ADMIN'
export type PetSpecies = 'DOG' | 'CAT'
export type PetSize = 'SMALL' | 'MEDIUM' | 'LARGE'
export type PetSex = 'MALE' | 'FEMALE'
export type PetRole = 'OWNER' | 'GUARDIAN'
export type ReservationStatus = 'PENDING' | 'CONFIRMED' | 'REJECTED' | 'CANCELLED' | 'NO_SHOW'
export type ReservationType =
  | 'CHECKUP'
  | 'VACCINATION'
  | 'TREATMENT'
  | 'SURGERY'
  | 'GROOMING'
  | 'ETC'
export type SlotStatus = 'AVAILABLE' | 'RESERVED'
export type NotificationType =
  | 'RESERVATION_REQUESTED'
  | 'RESERVATION_CONFIRMED'
  | 'RESERVATION_REJECTED'
  | 'RESERVATION_CANCELLED'
  | 'RESERVATION_REMINDER'
  | 'RESERVATION_NO_SHOW'
  | 'VACCINATION_DUE_SOON'
  | 'FAVORITE_HOSPITAL_NEW_SLOT'
  | 'CHAT_MESSAGE_RECEIVED'
  | 'WAITLIST_SLOT_AVAILABLE'
  | 'TREATMENT_RECORDED'
export type NotificationCategory = 'RESERVATION' | 'VACCINATION' | 'FAVORITE' | 'CHAT' | 'WAITLIST'
export type HealthRecordType =
  | 'WEIGHT'
  | 'VACCINATION'
  | 'TREATMENT'
  | 'WALK'
  | 'MEAL'
  | 'EXCRETION'
  | 'HEALTH_CHECK'
export type ActivityLevel = 'LOW' | 'NORMAL' | 'HIGH'
export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH'
export type DayOfWeek =
  | 'MONDAY'
  | 'TUESDAY'
  | 'WEDNESDAY'
  | 'THURSDAY'
  | 'FRIDAY'
  | 'SATURDAY'
  | 'SUNDAY'

// ── auth / user ───────────────────────────────────────
export interface TokenResponse {
  accessToken: string
  refreshToken: string
  expiresIn: number
}

export interface SignupResponse {
  id: number
  email: string
}

export interface User {
  id: number
  email: string
  role: Role
  suspended: boolean
}

export interface UserStats {
  reservationCount: number
  noShowCount: number
  replyCount: number
  petCount: number
  guardianCount: number
}

export interface UpcomingVaccination {
  petId: number
  petName: string
  healthRecordId: number
  nextDueDate: ISODate
  daysRemaining: number
}

// ── pet ───────────────────────────────────────────────
export interface Pet {
  id: number
  name: string
  species: PetSpecies
  breed: string | null
  birthDate: ISODate | null
  size: PetSize | null
  sex: PetSex | null
  neutered: boolean | null
  imageUrl: string | null
  role: PetRole
}

export interface PetPayload {
  name: string
  species: PetSpecies
  breed?: string | null
  birthDate?: ISODate | null
  size?: PetSize | null
  sex?: PetSex | null
  neutered?: boolean | null
}

export interface PetGuardian {
  userId: number
  email: string
  addedAt: ISODateTime
}

export interface HealthRecord {
  id: number
  petId: number
  type: HealthRecordType
  recordedAt: ISODate
  content: string
  weight: number | null
  nextDueDate: ISODate | null
  // 병원이 진료 후 작성한 기록이면 병원 이름 (보호자는 수정·삭제 불가), 직접 쓴 기록이면 null
  hospitalName: string | null
}

export interface HealthRecordPayload {
  type: HealthRecordType
  recordedAt: ISODate
  content: string
  weight?: number | null
  nextDueDate?: ISODate | null
}

export interface FeedingCalculatorPayload {
  weightKg: number
  activityLevel: ActivityLevel
  species: PetSpecies
  foodCalorieDensityPer100g?: number | null
}

export interface FeedingCalculatorResult {
  rer: number
  derCoefficient: number
  dailyCalories: number
  foodCalorieDensityPer100g: number
  foodAmountGrams: number
  disclaimer: string
}

export interface HealthCheckOption {
  id: string
  label: string
  riskScore: number
}

export interface HealthCheckQuestion {
  id: string
  category: string
  text: string
  options: HealthCheckOption[]
}

export interface HealthCheckSubmitPayload {
  petId: number
  answers: { questionId: string; optionId: string }[]
  saveRecord?: boolean
}

export interface HealthCheckResult {
  totalScore: number
  riskLevel: RiskLevel
  comparisonNote: string | null
  disclaimer: string
  savedHealthRecordId: number | null
}

// ── hospital ──────────────────────────────────────────
export interface Hospital {
  id: number
  name: string
  address: string | null
  latitude: number | null
  longitude: number | null
  openingHours: string | null
  specialty: string | null
  is24Hours: boolean | null
  hasParking: boolean | null
  avgTreatmentPrice: number | null
  imageUrl: string | null
  averageRating: number | null
  reviewCount: number
  distanceKm: number | null
}

export interface HospitalPayload {
  name: string
  address?: string | null
  latitude?: number | null
  longitude?: number | null
  openingHours?: string | null
  specialty?: string | null
  is24Hours?: boolean | null
  hasParking?: boolean | null
  avgTreatmentPrice?: number | null
}

export type HospitalSort = 'NAME_ASC' | 'RATING_DESC' | 'REVIEW_COUNT_DESC'

export interface HospitalSearchParams {
  keyword?: string
  minRating?: number
  sort?: HospitalSort
  lat?: number
  lng?: number
  radiusKm?: number
  is24Hours?: boolean
  hasParking?: boolean
}

export interface Slot {
  id: number
  hospitalId: number
  startTime: ISODateTime
  endTime: ISODateTime
  status: SlotStatus
}

export interface SlotBulkPayload {
  startDate: ISODate
  endDate: ISODate
  daysOfWeek: DayOfWeek[]
  startTime: string // 'HH:mm'
  endTime: string
  intervalMinutes: number
}

export interface SlotBulkResult {
  created: number
  skipped: number
}

export interface ReviewReply {
  id: number
  content: string
  createdAt: ISODateTime
}

export interface Review {
  id: number
  rating: number
  content: string
  createdAt: ISODateTime
  reply: ReviewReply | null
  mine: boolean
  // 리뷰 사진(최대 3장, /uploads/reviews/...)
  imageUrls: string[]
}

// 변경(2026-09-30): hospitalName·reviewCreatedAt·작성자/신고자 이메일 추가 — 관리 화면에서 사람·날짜로
// 확인·필터링하려고 (이전: reporterId만 있고 병원명은 병원 목록을 따로 받아 조인)
export interface ReviewReport {
  id: number
  reviewId: number
  hospitalId: number
  hospitalName: string
  reviewContent: string
  reviewRating: number
  reviewHidden: boolean
  reviewCreatedAt: ISODateTime
  reviewAuthorId: number
  reviewAuthorEmail: string
  reporterId: number
  reporterEmail: string
  reason: string
  createdAt: ISODateTime
}

// GET /api/admin/reviews — 관리자(전체)/병원 소유자(본인 병원) 리뷰 관리 목록
export interface ManagedReview {
  id: number
  hospitalId: number
  hospitalName: string
  authorId: number
  authorEmail: string
  rating: number
  content: string
  hidden: boolean
  reportCount: number
  reply: ReviewReply | null
  createdAt: ISODateTime
  imageUrls: string[]
}

// GET /api/users/me/reviews — 마이페이지 "내가 쓴 리뷰"
export interface MyReview {
  id: number
  hospitalId: number
  hospitalName: string
  rating: number
  content: string
  hidden: boolean
  reply: ReviewReply | null
  createdAt: ISODateTime
  imageUrls: string[]
}

// 관리 화면 리뷰/신고 목록 필터 — 빈 값은 보내지 않는다. from/to는 작성일(리뷰)·신고일(신고) 'YYYY-MM-DD'
export interface ReviewFilter {
  hospitalId?: number
  author?: string
  reporter?: string
  from?: ISODate
  to?: ISODate
  hidden?: boolean
  sort?: string // 'createdAt,desc' | 'createdAt,asc' | 'rating,desc' | 'rating,asc'
}

// ── reservation ───────────────────────────────────────
export interface Reservation {
  id: number
  petId: number
  petName: string | null
  petSpecies: PetSpecies | null
  petBreed: string | null
  petBirthDate: ISODate | null
  petSize: PetSize | null
  petSex: PetSex | null
  petNeutered: boolean | null
  petImageUrl: string | null
  slotId: number
  status: ReservationStatus
  type: ReservationType | null
  hospitalId: number
  hospitalName: string
  startTime: ISODateTime
  endTime: ISODateTime
  // 예약 때 보호자가 남긴 증상·요청 메모, 첨부한 자가 문진(예약 당시 복사본)
  memo: string | null
  healthCheckSummary: string | null
  healthCheckDate: ISODate | null
}

export interface Waitlist {
  id: number
  slotId: number
  petId: number
  petName: string
  hospitalId: number
  hospitalName: string
  startTime: ISODateTime
  endTime: ISODateTime
}

// ── notification / chat ───────────────────────────────
export interface Notification {
  id: number
  type: NotificationType
  content: string
  read: boolean
  createdAt: ISODateTime
}

export interface NotificationPreference {
  category: NotificationCategory
  enabled: boolean
}

export interface ChatRoom {
  id: number
  hospitalId: number
  hospitalName: string
  customerId: number
  customerEmail: string
  // 변경(2026-10-02): 내 기준 안 읽은 메시지 수 (이전: 없음)
  unreadCount: number
}

export interface ChatMessage {
  id: number
  roomId: number
  senderId: number
  senderEmail: string
  content: string
  createdAt: ISODateTime
}

// ── admin ─────────────────────────────────────────────
export interface StatsSummary {
  totalUsers: number
  totalPets: number
  totalHospitals: number
  totalReservations: number
  confirmedReservations: number
  cancelledReservations: number
  noShowReservations: number
}

export interface HospitalStats {
  hospitalId: number
  hospitalName: string
  reservationCount: number
  reviewCount: number
  averageRating: number | null
}

// GET /api/admin/stats/hospitals/{id}?days= — 병원 하나의 최근 N일 통계(예약 시작 시간 기준).
// 비율은 0~1, 분모가 0이면 null
export interface HospitalPeriodStats {
  hospitalId: number
  hospitalName: string
  from: ISODate
  to: ISODate
  totalReservations: number
  countByStatus: Record<ReservationStatus, number>
  countByType: Partial<Record<ReservationType, number>>
  noShowRate: number | null
  cancelRate: number | null
  slotCount: number
  reservedSlotCount: number
  // booked: 대기·확정·노쇼, cancelled: 취소·거절
  daily: { date: ISODate; booked: number; cancelled: number }[]
}
