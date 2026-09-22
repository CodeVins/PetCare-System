import axiosInstance from './axiosInstance'
import { getHospitals, getSlots } from './hospitalApi'

export function createReservation({ petId, slotId, type }) {
  return axiosInstance.post('/api/reservations', { petId, slotId, type })
}

export function getMyReservations() {
  return axiosInstance.get('/api/reservations')
}

export function cancelReservation(reservationId) {
  return axiosInstance.patch(`/api/reservations/${reservationId}/cancel`)
}

// 병원 수만큼 슬롯을 N+1로 조회해서 slotId → {slot, hospitalName} 인덱스를 만든다.
// ReservationResponse/WaitlistResponse는 slotId만 갖고 있어서 시간·병원명은
// 직접 못 얻는다 — 예약 목록·대기 목록·대시보드·관리자 예약 화면이 전부 이
// 조인을 필요로 해서 여기 한 번만 둔다.
// ponytail: 병원이 많아지면 부담. 백엔드가 슬롯 조회에 hospitalId 필터를 주거나
// ReservationResponse에 hospitalName/startTime을 실어주면 이 함수는 없어도 된다.
export async function getSlotIndex() {
  const { data } = await getHospitals()
  const perHospital = await Promise.all(
    data.data.map((hospital) =>
      getSlots(hospital.id).then((res) => ({ hospital, slots: res.data.data.content })),
    ),
  )

  const slotMap = {}
  const hospitalNameBySlot = {}
  for (const { hospital, slots } of perHospital) {
    for (const slot of slots) {
      slotMap[slot.id] = slot
      hospitalNameBySlot[slot.id] = hospital.name
    }
  }
  return { slotMap, hospitalNameBySlot }
}

// 예약 목록 + 슬롯/병원 정보를 합쳐서 바로 렌더 가능한 형태로 돌려준다.
// 반려동물 이름/종/생년월일 등은 ReservationResponse에 이미 실려 온다
// (petName/petSpecies/petBirthDate/...) — 예전엔 getMyPets()로 따로 조인했지만
// 백엔드가 스냅샷을 직접 내려주기 시작해서 더 이상 필요 없다.
export async function getMyReservationsDetailed() {
  const [reservationsRes, index] = await Promise.all([getMyReservations(), getSlotIndex()])

  return reservationsRes.data.data.content.map((reservation) => ({
    ...reservation,
    slot: index.slotMap[reservation.slotId] ?? null,
    hospitalName: index.hospitalNameBySlot[reservation.slotId] ?? '병원 정보 없음',
  }))
}
