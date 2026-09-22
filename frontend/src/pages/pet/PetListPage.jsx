import { ClipboardText, PawPrint, Plus } from '@phosphor-icons/react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { BASE_URL } from '../../api/axiosInstance'
import { getMyPets } from '../../api/petApi'
import EmptyState from '../../components/common/EmptyState'
import PageHeader from '../../components/common/PageHeader'
import { Reveal, RevealItem } from '../../components/common/Reveal'
import { calculateAge, SPECIES_LABEL } from '../../lib/format'

// 카드마다 액센트를 teal → amber → sky 로 돌린다 (DESIGN_SPEC 보조 액센트 순환)
const ACCENTS = [
  ['icon-badge', 'bg-brand-50 text-brand-700'],
  ['icon-badge icon-badge-amber', 'bg-amber-50 text-amber-800'],
  ['icon-badge icon-badge-sky', 'bg-sky-50 text-sky-800'],
]

export default function PetListPage() {
  const [pets, setPets] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    getMyPets()
      .then(({ data }) => setPets(data.data.content))
      .catch((err) =>
        setError(err.response?.data?.message || '반려동물 목록을 불러오지 못했습니다.'),
      )
      .finally(() => setLoading(false))
  }, [])

  return (
    <div>
      <PageHeader
        title="반려동물"
        action={
          <>
            <Link to="/health-check" className="btn btn-secondary btn-sm">
              <ClipboardText size={18} />
              <span className="hidden sm:inline">건강 자가문진</span>
            </Link>
            <Link to="/pets/new" className="btn btn-primary btn-sm">
              <Plus size={18} weight="bold" />
              등록
            </Link>
          </>
        }
      />

      {loading && (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-49 animate-pulse rounded-2xl bg-stone-100" />
          ))}
        </div>
      )}

      {!loading && error && <p className="text-[15px] text-red-600">{error}</p>}

      {!loading && !error && pets.length === 0 && (
        <div className="card">
          <EmptyState
            icon={PawPrint}
            action={
              <Link to="/pets/new" className="btn btn-primary btn-sm">
                <Plus size={18} weight="bold" />
                반려동물 등록
              </Link>
            }
          >
            등록된 반려동물이 없습니다. 첫 반려동물을 등록해 보세요.
          </EmptyState>
        </div>
      )}

      {!loading && !error && pets.length > 0 && (
        <Reveal className="grid grid-cols-2 gap-3 lg:grid-cols-4" stagger={0.05}>
          {pets.map((pet, index) => {
            const age = calculateAge(pet.birthDate)
            const [avatarClass, speciesClass] = ACCENTS[index % ACCENTS.length]
            return (
              <RevealItem key={pet.id}>
                <Link
                  to={`/pets/${pet.id}`}
                  className="card-interactive flex h-full flex-col items-center gap-1.5 px-3 pb-4 pt-5 text-center"
                >
                  <span className={`${avatarClass} mb-1 size-20 overflow-hidden`}>
                    {pet.imageUrl ? (
                      <img
                        src={`${BASE_URL}${pet.imageUrl}`}
                        alt=""
                        className="size-full object-cover"
                      />
                    ) : (
                      <PawPrint size={38} />
                    )}
                  </span>
                  <span className="w-full truncate text-[17px] font-bold">{pet.name}</span>
                  <span className="flex flex-wrap justify-center gap-1.5">
                    <span
                      className={`badge h-6 px-2.5 text-xs ${speciesClass}`}
                    >
                      {SPECIES_LABEL[pet.species] ?? pet.species}
                    </span>
                    {pet.role === 'GUARDIAN' && (
                      <span className="badge badge-neutral h-6 px-2.5 text-xs">
                        공동보호자
                      </span>
                    )}
                  </span>
                  <span className="w-full truncate text-[13px] text-stone-600">
                    {pet.breed || '품종 미등록'}
                    {age !== null && ` · ${age}살`}
                  </span>
                </Link>
              </RevealItem>
            )
          })}

          <RevealItem>
            <Link
              to="/pets/new"
              className="flex h-full min-h-49 flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-stone-300 p-4 text-stone-600 transition-colors hover:border-brand-600 hover:text-brand-600"
            >
              <Plus size={30} />
              <span className="text-sm font-medium">반려동물 등록</span>
            </Link>
          </RevealItem>
        </Reveal>
      )}
    </div>
  )
}
