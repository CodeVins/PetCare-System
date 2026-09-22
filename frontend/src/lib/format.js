// 화면 6~7곳에 흩어져 있던 같은 포맷터들을 여기로 모음.

export const SPECIES_LABEL = { DOG: '강아지', CAT: '고양이' }
export const SEX_LABEL = { MALE: '수컷', FEMALE: '암컷' }
export const RESERVATION_TYPE_LABEL = {
  CHECKUP: '정기검진',
  VACCINATION: '예방접종',
  TREATMENT: '진료',
  SURGERY: '수술',
  GROOMING: '미용',
  ETC: '기타',
}

export function calculateAge(birthDate) {
  if (!birthDate) return null
  const birth = new Date(birthDate)
  const now = new Date()
  let age = now.getFullYear() - birth.getFullYear()
  const hadBirthdayThisYear =
    now.getMonth() > birth.getMonth() ||
    (now.getMonth() === birth.getMonth() && now.getDate() >= birth.getDate())
  if (!hadBirthdayThisYear) age -= 1
  return age
}

// "강아지 · 3살" — 홈 아바타, 반려동물 목록 부제
export function petSubtitle(pet) {
  const age = calculateAge(pet.birthDate)
  return [SPECIES_LABEL[pet.species] ?? pet.species, age !== null && `${age}살`]
    .filter(Boolean)
    .join(' · ')
}

// "보리 · 강아지 · 3살" — ReservationResponse가 실어 보내는 반려동물 스냅샷으로
// 만드는 캡션(예약 목록/대시보드/관리자 예약 화면 공통).
export function reservationPetCaption(reservation) {
  const age = calculateAge(reservation.petBirthDate)
  return [
    reservation.petName,
    SPECIES_LABEL[reservation.petSpecies] ?? reservation.petSpecies,
    age !== null && `${age}살`,
  ]
    .filter(Boolean)
    .join(' · ')
}

export function formatDday(daysRemaining) {
  if (daysRemaining === 0) return 'D-DAY'
  if (daysRemaining < 0) return `D+${Math.abs(daysRemaining)}`
  return `D-${daysRemaining}`
}

const time = (value) =>
  new Date(value).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })

// "9월 24일 (목)" — 날짜만 오는 값(YYYY-MM-DD)은 UTC 파싱을 피하려고 T00:00:00을 붙인다
export function formatDateLabel(dateOnly) {
  return new Date(`${dateOnly}T00:00:00`).toLocaleDateString('ko-KR', {
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  })
}

export function formatTimeRange(startTime, endTime) {
  return `${time(startTime)} - ${time(endTime)}`
}

// "9월 24일 (목) 14:30 - 15:00"
export function formatSlot(slot) {
  const date = new Date(slot.startTime).toLocaleDateString('ko-KR', {
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  })
  return `${date} ${formatTimeRange(slot.startTime, slot.endTime)}`
}

// "9월 24일 14:30"
export function formatDateTime(value) {
  return new Date(value).toLocaleString('ko-KR', {
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}
