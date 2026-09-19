import { ClipboardText, PawPrint, Plus } from '@phosphor-icons/react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { BASE_URL } from '../../api/axiosInstance'
import { getMyPets } from '../../api/petApi'
import { Reveal, RevealItem } from '../../components/common/Reveal'

const SPECIES_LABEL = { DOG: '강아지', CAT: '고양이' }

function calculateAge(birthDate) {
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-stone-900">반려동물</h1>
        <div className="flex items-center gap-2">
          <Link
            to="/health-check"
            className="inline-flex items-center gap-1.5 rounded-full border border-stone-200 px-4 py-2 text-sm font-medium text-stone-700 transition-colors hover:border-brand-200 hover:text-brand-700"
          >
            <ClipboardText size={16} />
            건강 자가문진
          </Link>
          <Link
            to="/pets/new"
            className="inline-flex items-center gap-1.5 rounded-full bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
          >
            <Plus size={16} weight="bold" />
            등록
          </Link>
        </div>
      </div>

      {loading && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {[0, 1].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl bg-stone-100" />
          ))}
        </div>
      )}

      {!loading && error && <p className="text-sm text-red-600">{error}</p>}

      {!loading && !error && pets.length === 0 && (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-stone-300 py-16 text-center">
          <PawPrint size={32} className="text-stone-300" />
          <p className="text-sm text-stone-500">
            등록된 반려동물이 없습니다. 첫 반려동물을 등록해보세요.
          </p>
        </div>
      )}

      {!loading && !error && pets.length > 0 && (
        <Reveal className="grid grid-cols-1 gap-3 sm:grid-cols-2" stagger={0.05}>
          {pets.map((pet) => {
            const age = calculateAge(pet.birthDate)
            return (
              <RevealItem key={pet.id}>
                <Link
                  to={`/pets/${pet.id}`}
                  className="flex items-center gap-3 rounded-2xl border border-stone-200 bg-white p-4 transition-[border-color,transform] duration-150 hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-md"
                >
                  <span className="flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-brand-50">
                    {pet.imageUrl ? (
                      <img
                        src={`${BASE_URL}${pet.imageUrl}`}
                        alt=""
                        className="size-full object-cover"
                      />
                    ) : (
                      <PawPrint weight="fill" size={22} className="text-brand-600" />
                    )}
                  </span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="truncate font-medium text-stone-900">{pet.name}</p>
                      {pet.role === 'GUARDIAN' && (
                        <span className="shrink-0 rounded-full bg-stone-100 px-2 py-0.5 text-[10px] font-semibold text-stone-500">
                          공동보호자
                        </span>
                      )}
                    </div>
                    <p className="truncate text-sm text-stone-500">
                      {SPECIES_LABEL[pet.species]} · {pet.breed || '품종 미등록'}
                      {age !== null && ` · ${age}살`}
                    </p>
                  </div>
                </Link>
              </RevealItem>
            )
          })}
        </Reveal>
      )}
    </div>
  )
}
