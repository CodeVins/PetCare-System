import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { loadKakaoMaps, type Kakao } from '../../lib/kakaoMap'
import type { Hospital } from '../../types/api'

const SEOUL_CITY_HALL = { lat: 37.5665, lng: 126.978 }

interface HospitalMapProps {
  hospitals: Hospital[]
  // 이름표를 띄우고 지도를 옮길 병원
  focusId?: number | null
  onFocus?: (hospitalId: number) => void
  // 이름표를 누르면 상세로 이동 (상세 화면 자신에서는 끔)
  linkToDetail?: boolean
  className?: string
}

// 좌표가 있는 병원만 마커로 찍는다. 목록이 바뀌면 전체가 보이게 범위를 맞춤
export default function HospitalMap({
  hospitals,
  focusId = null,
  onFocus,
  linkToDetail = false,
  className = '',
}: HospitalMapProps) {
  const navigate = useNavigate()
  const containerRef = useRef<HTMLDivElement>(null)
  const [kakao, setKakao] = useState<Kakao>(null)
  const [map, setMap] = useState<Kakao>(null)
  const [error, setError] = useState('')
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
      {error && (
        <p className="absolute inset-0 flex items-center justify-center p-4 text-center text-sm text-stone-500">
          {error}
        </p>
      )}
    </div>
  )
}
