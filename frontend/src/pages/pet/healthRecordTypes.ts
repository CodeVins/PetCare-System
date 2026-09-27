import {
  ChartLineUp,
  ClipboardText,
  Drop,
  ForkKnife,
  PersonSimpleWalk,
  Stethoscope,
  Syringe,
  type Icon,
} from '@phosphor-icons/react'
import type { HealthRecordType } from '../../types/api'

interface TypeMeta {
  label: string
  icon: Icon
  // 목록 아이콘 배경/글자색 — 종류를 색으로도 구분
  tone: string
  placeholder: string
}

// 건강기록 종류별 표시 정보. 목록·필터·작성 폼이 같이 쓴다. 순서 = 화면 표시 순서
export const RECORD_TYPES: Record<HealthRecordType, TypeMeta> = {
  WEIGHT: {
    label: '체중',
    icon: ChartLineUp,
    tone: 'bg-brand-100 text-brand-700',
    placeholder: '예: 아침 공복 측정 (비워 두면 자동으로 채워요)',
  },
  VACCINATION: {
    label: '예방접종',
    icon: Syringe,
    tone: 'bg-amber-100 text-amber-800',
    placeholder: '예: 종합백신 5차',
  },
  TREATMENT: {
    label: '진료',
    icon: Stethoscope,
    tone: 'bg-rose-100 text-rose-700',
    placeholder: '예: 귀 염증으로 행복동물병원 진료, 연고 처방',
  },
  WALK: {
    label: '산책',
    icon: PersonSimpleWalk,
    tone: 'bg-sky-100 text-sky-800',
    placeholder: '예: 공원 40분',
  },
  MEAL: {
    label: '식사',
    icon: ForkKnife,
    tone: 'bg-orange-100 text-orange-800',
    placeholder: '예: 사료 60g, 간식 조금',
  },
  EXCRETION: {
    label: '배변',
    icon: Drop,
    tone: 'bg-stone-200 text-stone-700',
    placeholder: '예: 묽은 변 1회',
  },
  HEALTH_CHECK: {
    label: '자가문진',
    icon: ClipboardText,
    tone: 'bg-violet-100 text-violet-700',
    placeholder: '예: 식욕 저하 확인',
  },
}

export const RECORD_TYPE_ORDER = Object.keys(RECORD_TYPES) as HealthRecordType[]
