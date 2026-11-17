import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { loadKakaoMaps, type Kakao } from '../../lib/kakaoMap'
import type { Hospital } from '../../types/api'

const SEOUL_CITY_HALL = { lat: 37.5665, lng: 126.978 }
// 지도를 아주 넓게 축소한 채 검색하면 후보가 너무 많아져서 반경 상한
const MAX_AREA_RADIUS_KM = 30

export interface MapArea {
  lat: number
  lng: number
  radiusKm: number
}

// 두 좌표 사이 거리(km) — 화면 중심에서 모서리까지를 반경으로 씀
function distanceKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const rad = (d: number) => (d * Math.PI) / 180
  const dLat = rad(b.lat - a.lat)
  const dLng = rad(b.lng - a.lng)
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2
  return 6371 * 2 * Math.asin(Math.sqrt(h))
}

interface HospitalMapProps {
  hospitals: Hospital[]
  // 이름표를 띄우고 지도를 옮길 병원
  focusId?: number | null
  onFocus?: (hospitalId: number) => void
  // 이름표를 누르면 상세로 이동 (상세 화면 자신에서는 끔)
  linkToDetail?: boolean
  // 사용자가 지도를 움직이면 "이 지역에서 다시 검색" 버튼 → 화면 영역을 감싸는 원으로 콜백
  onAreaSearch?: (area: MapArea) => void
  // 목록이 바뀔 때 마커가 다 보이게 범위를 맞출지 — 지도 영역으로 검색한 결과면 사용자가 맞춘 화면을 유지
  autoFit?: boolean
  className?: string
}

// 좌표가 있는 병원만 마커로 찍는다. 목록이 바뀌면 전체가 보이게 범위를 맞춤
export default function HospitalMap({
  hospitals,
  focusId = null,
  onFocus,
  linkToDetail = false,
  onAreaSearch,
  autoFit = true,
  className = '',
}: HospitalMapProps) {
  const navigate = useNavigate()
  const containerRef = useRef<HTMLDivElement>(null)
  const [kakao, setKakao] = useState<Kakao>(null)
  const [map, setMap] = useState<Kakao>(null)
  const [error, setError] = useState('')
  // 사용자가 끌거나 확대·축소했는지 — 코드가 범위를 맞추며 생기는 확대 변화는 빼려고 programmatic으로 표시
  const [moved, setMoved] = useState(false)
  const programmatic = useRef(false)
  // 마커 클릭 핸들러가 최신 onFocus를 부르도록 (마커를 매 렌더 다시 만들지 않으려고)
  const onFocusRef = useRef(onFocus)
  onFocusRef.current = onFocus

  const located = hospitals.filter((h) => h.latitude != null && h.longitude != null)
  const locatedKey = located.map((h) => h.id).join(',')

  useEffect(() => {
    let cancelled = false
    loadKakaoMaps()
      .then((k) => {
        if (cancelled || !containerRef.current) return
        const center = new k.maps.LatLng(SEOUL_CITY_HALL.lat, SEOUL_CITY_HALL.lng)
        setKakao(k)
        setMap(new k.maps.Map(containerRef.current, { center, level: 7 }))
      })
      .catch((err: Error) => !cancelled && setError(err.message))
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!map || !onAreaSearch) return
    const onDrag = () => setMoved(true)
    const onZoom = () => !programmatic.current && setMoved(true)
    const onIdle = () => {
      programmatic.current = false
    }
    kakao.maps.event.addListener(map, 'dragend', onDrag)
    kakao.maps.event.addListener(map, 'zoom_changed', onZoom)
    kakao.maps.event.addListener(map, 'idle', onIdle)
    return () => {
      kakao.maps.event.removeListener(map, 'dragend', onDrag)
      kakao.maps.event.removeListener(map, 'zoom_changed', onZoom)
      kakao.maps.event.removeListener(map, 'idle', onIdle)
    }
    // 버튼 표시 여부만 필요해서 콜백이 바뀔 때마다(인라인 함수) 다시 등록하지 않음
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, kakao, !!onAreaSearch])

  const searchArea = () => {
    const center = map.getCenter()
    const corner = map.getBounds().getNorthEast()
    const c = { lat: center.getLat(), lng: center.getLng() }
    const radiusKm = Math.min(distanceKm(c, { lat: corner.getLat(), lng: corner.getLng() }), MAX_AREA_RADIUS_KM)
    setMoved(false)
    onAreaSearch?.({ ...c, radiusKm: Math.round(radiusKm * 100) / 100 })
  }

  // 마커 + 범위 맞춤. 컨테이너 크기가 바뀌면(모바일 지도 펼침 등) 다시 맞춤 — 숨겨진 채 만든 지도는 깨져 보여서
  useEffect(() => {
    if (!map) return
    const markers = located.map((h) => {
      const marker = new kakao.maps.Marker({
        map,
        position: new kakao.maps.LatLng(h.latitude, h.longitude),
        title: h.name,
      })
      kakao.maps.event.addListener(marker, 'click', () => onFocusRef.current?.(h.id))
      return marker
    })
    const fit = () => {
      map.relayout()
      // 변경(2026-11-17): 지도 영역 검색 결과면 범위를 다시 맞추지 않음 — 사용자가 맞춘 화면이 튀지 않게, 코드가 맞춘
      // 확대는 "이 지역에서 다시 검색" 버튼을 띄우지 않게 표시 (이전: 목록이 바뀌면 항상 마커 전체로 맞춤)
      if (!autoFit) return
      programmatic.current = true
      if (located.length === 1) {
        map.setLevel(3)
        map.setCenter(markers[0].getPosition())
      } else if (located.length > 1) {
        const bounds = new kakao.maps.LatLngBounds()
        markers.forEach((m) => bounds.extend(m.getPosition()))
        map.setBounds(bounds)
      }
    }
    fit()
    const observer = new ResizeObserver(fit)
    observer.observe(containerRef.current!)
    return () => {
      observer.disconnect()
      markers.forEach((m) => m.setMap(null))
    }
    // locatedKey로 목록 변화를 판단 (배열은 렌더마다 새로 만들어짐)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, locatedKey])

  // 선택한 병원 이름표
  useEffect(() => {
    const target = located.find((h) => h.id === focusId)
    if (!map || !target) return
    const position = new kakao.maps.LatLng(target.latitude, target.longitude)
    const label = document.createElement(linkToDetail ? 'button' : 'span')
    label.textContent = target.name
    label.className =
      'mb-11 block rounded-full bg-white px-3 py-1 text-[13px] font-bold text-stone-900 shadow-md ring-1 ring-stone-200' +
      (linkToDetail ? ' cursor-pointer hover:text-brand-700' : '')
    if (linkToDetail) label.onclick = () => navigate(`/hospitals/${target.id}`)
    const overlay = new kakao.maps.CustomOverlay({ map, position, content: label, yAnchor: 1, zIndex: 3 })
    if (located.length > 1) map.panTo(position)
    return () => overlay.setMap(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, focusId, locatedKey])

  return (
    <div className={`relative overflow-hidden rounded-2xl border border-stone-200 bg-stone-100 ${className}`}>
      <div ref={containerRef} className="size-full" />
      {moved && onAreaSearch && (
        <button
          type="button"
          onClick={searchArea}
          className="absolute left-1/2 top-3 z-10 -translate-x-1/2 rounded-full bg-white px-4 py-2 text-sm font-bold text-brand-700 shadow-md ring-1 ring-stone-200 hover:bg-brand-50"
        >
          이 지역에서 다시 검색
        </button>
      )}
      {error && (
        <p className="absolute inset-0 flex items-center justify-center p-4 text-center text-sm text-stone-500">
          {error}
        </p>
      )}
    </div>
  )
}
