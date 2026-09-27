import { Heart } from '@phosphor-icons/react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getFavorites, removeFavorite } from '../../api/hospitalApi'
import Alert from '../../components/common/Alert'
import EmptyState from '../../components/common/EmptyState'
import PageHeader from '../../components/common/PageHeader'
import { Reveal, RevealItem } from '../../components/common/Reveal'
import HospitalCard from './HospitalCard'
import HospitalTabs from './HospitalTabs'

export default function FavoriteHospitalListPage() {
  const [hospitals, setHospitals] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    getFavorites()
      .then(({ data }) => setHospitals(data.data.content))
      .catch((err) =>
        setError(err.response?.data?.message || '즐겨찾기 목록을 불러오지 못했습니다.'),
      )
      .finally(() => setLoading(false))
  }, [])

  const handleToggle = async (hospitalId) => {
    const removed = hospitals.find((hospital) => hospital.id === hospitalId)
    setHospitals((prev) => prev.filter((hospital) => hospital.id !== hospitalId))
    try {
      await removeFavorite(hospitalId)
    } catch (err) {
      // 실패하면 목록에 되돌려 놓는다
      setHospitals((prev) => [...prev, removed])
      setError(err.response?.data?.message || '삭제에 실패했습니다.')
    }
  }

  return (
    <div>
      <PageHeader title="병원" />
      <HospitalTabs />

      {loading && (
        <div className="flex flex-col gap-3">
          {[0, 1].map((i) => (
            <div key={i} className="h-30 animate-pulse rounded-2xl bg-stone-100" />
          ))}
        </div>
      )}

      {!loading && error && <Alert tone="error">{error}</Alert>}

      {!loading && !error && hospitals.length === 0 && (
        <div className="card">
          <EmptyState
            icon={Heart}
            action={
              <Link to="/hospitals" className="btn btn-primary btn-sm">
                병원 둘러보기
              </Link>
            }
          >
            즐겨찾기한 병원이 없습니다.
          </EmptyState>
        </div>
      )}

      {!loading && !error && hospitals.length > 0 && (
        <Reveal className="flex flex-col gap-3 md:grid md:grid-cols-2" stagger={0.05}>
          {hospitals.map((hospital, index) => (
            <RevealItem key={hospital.id}>
              <HospitalCard
                hospital={hospital}
                index={index}
                isFavorite
                onToggleFavorite={handleToggle}
              />
            </RevealItem>
          ))}
        </Reveal>
      )}
    </div>
  )
}
