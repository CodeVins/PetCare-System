import type { Role } from '../types/api'

// 병원 관리 권한(대시보드·리뷰 답글)을 가진 역할
export const OWNER_ROLES: Role[] = ['HOSPITAL_OWNER', 'ADMIN']
