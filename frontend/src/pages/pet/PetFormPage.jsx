import { PawPrint, PencilSimple, Trash } from '@phosphor-icons/react'
import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { BASE_URL } from '../../api/axiosInstance'
import { getHealthRecords } from '../../api/healthRecordApi'
import {
  createPet,
  deletePet,
  deletePetImage,
  getPet,
  updatePet,
  uploadPetImage,
} from '../../api/petApi'
import Alert from '../../components/common/Alert'
import Button from '../../components/common/Button'
import ChoiceGroup from '../../components/common/ChoiceGroup'
import InfoRow from '../../components/common/InfoRow'
import PageHeader from '../../components/common/PageHeader'
import Tabs from '../../components/common/Tabs'
import TextField from '../../components/common/TextField'
import { calculateAge, SEX_LABEL, SPECIES_LABEL } from '../../lib/format'
import FeedingCalculatorSection from './FeedingCalculatorSection'
import GuardianSection from './GuardianSection'
import HealthRecordSection from './HealthRecordSection'

const SPECIES_OPTIONS = [
  { value: 'DOG', label: '강아지' },
  { value: 'CAT', label: '고양이' },
]

const SIZE_OPTIONS = [
  { value: 'SMALL', label: '소형' },
  { value: 'MEDIUM', label: '중형' },
  { value: 'LARGE', label: '대형' },
  { value: '', label: '선택 안 함' },
]

const SIZE_LABEL = { SMALL: '소형', MEDIUM: '중형', LARGE: '대형' }

const SEX_OPTIONS = [
  { value: 'MALE', label: '수컷' },
  { value: 'FEMALE', label: '암컷' },
  { value: '', label: '선택 안 함' },
]

// Boolean 필드라 실제 값은 true/false/null 3가지뿐이지만, ChoiceGroup은 문자열
// value로 비교하므로 폼 상태에서는 'true'/'false'/''(모름)로 다룬다.
const NEUTERED_OPTIONS = [
  { value: 'true', label: '완료' },
  { value: 'false', label: '안 함' },
  { value: '', label: '모름' },
]
const NEUTERED_LABEL = { true: '완료', false: '안 함' }

const TABS = [
  { value: 'overview', label: '개요' },
  { value: 'records', label: '건강기록' },
  { value: 'feeding', label: '급여량' },
  { value: 'guardians', label: '보호자' },
]

function formatBirthDate(birthDate) {
  return new Date(`${birthDate}T00:00:00`).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export default function PetFormPage() {
  const { petId } = useParams()
  const isEdit = Boolean(petId)
  const navigate = useNavigate()

  const [name, setName] = useState('')
  const [species, setSpecies] = useState('DOG')
  const [breed, setBreed] = useState('')
  const [birthDate, setBirthDate] = useState('')
  const [size, setSize] = useState('')
  const [sex, setSex] = useState('')
  const [neutered, setNeutered] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [role, setRole] = useState('OWNER')
  const [loading, setLoading] = useState(isEdit)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const [tab, setTab] = useState('overview')
  // 등록 화면(isEdit=false)은 폼만 보여주고, 상세 화면은 정보 카드를 먼저 보여준
  // 뒤 연필 아이콘을 눌러야 폼이 나온다.
  const [editing, setEditing] = useState(!isEdit)

  const [imageSaving, setImageSaving] = useState(false)
  const [imageError, setImageError] = useState('')

  const [latestWeight, setLatestWeight] = useState(null)
  const [weightLoading, setWeightLoading] = useState(isEdit)

  // 취소 버튼으로 되돌아갈 "마지막으로 저장된 값" 스냅샷
  const savedSnapshot = useRef(null)

  useEffect(() => {
    if (!isEdit) return
    getPet(petId)
      .then(({ data }) => {
        const pet = data.data
        setName(pet.name)
        setSpecies(pet.species)
        setBreed(pet.breed || '')
        setBirthDate(pet.birthDate || '')
        setSize(pet.size || '')
        setSex(pet.sex || '')
        setNeutered(pet.neutered == null ? '' : String(pet.neutered))
        setImageUrl(pet.imageUrl || '')
        setRole(pet.role)
        savedSnapshot.current = {
          name: pet.name,
          species: pet.species,
          breed: pet.breed || '',
          birthDate: pet.birthDate || '',
          size: pet.size || '',
          sex: pet.sex || '',
          neutered: pet.neutered == null ? '' : String(pet.neutered),
        }
      })
      .catch((err) =>
        setError(err.response?.data?.message || '반려동물 정보를 불러오지 못했습니다.'),
      )
      .finally(() => setLoading(false))
  }, [petId, isEdit])

  useEffect(() => {
    if (!isEdit) return
    // ponytail: 개요 탭용 최신 체중 하나만 필요한데 건강기록 API 전체를 불러온다.
    // 건강기록 탭에서도 같은 걸 다시 불러오는 중복 호출이 있음 — 전용
    // "최신 체중" 엔드포인트가 생기면 그걸로 교체.
    getHealthRecords(petId)
      .then(({ data }) => {
        const weights = data.data.content
          .filter((r) => r.type === 'WEIGHT' && r.weight != null)
          .sort((a, b) => b.recordedAt.localeCompare(a.recordedAt))
        setLatestWeight(weights[0] ?? null)
      })
      .catch(() => setLatestWeight(null))
      .finally(() => setWeightLoading(false))
  }, [petId, isEdit])

  const handleImageChange = async (event) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    setImageError('')
    setImageSaving(true)
    try {
      const { data } = await uploadPetImage(petId, file)
      setImageUrl(data.data.imageUrl || '')
    } catch (err) {
      setImageError(err.response?.data?.message || '이미지 업로드에 실패했습니다.')
    } finally {
      setImageSaving(false)
    }
  }

  const handleImageDelete = async () => {
    if (!window.confirm('사진을 삭제할까요?')) return
    setImageError('')
    setImageSaving(true)
    try {
      await deletePetImage(petId)
      setImageUrl('')
    } catch (err) {
      setImageError(err.response?.data?.message || '삭제에 실패했습니다.')
    } finally {
      setImageSaving(false)
    }
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setSaved(false)
    setSaving(true)
    const payload = {
      name,
      species,
      breed: breed || null,
      birthDate: birthDate || null,
      size: size || null,
      sex: sex || null,
      neutered: neutered === '' ? null : neutered === 'true',
    }
    try {
      if (isEdit) {
        await updatePet(petId, payload)
        savedSnapshot.current = { name, species, breed, birthDate, size, sex, neutered }
        setSaved(true)
        setEditing(false)
      } else {
        await createPet(payload)
        navigate('/pets', { replace: true })
      }
    } catch (err) {
      setError(err.response?.data?.message || '저장에 실패했습니다.')
    } finally {
      setSaving(false)
    }
  }

  const handleEditStart = () => {
    setError('')
    setSaved(false)
    setEditing(true)
  }

  const handleEditCancel = () => {
    const snapshot = savedSnapshot.current
    if (snapshot) {
      setName(snapshot.name)
      setSpecies(snapshot.species)
      setBreed(snapshot.breed)
      setBirthDate(snapshot.birthDate)
      setSize(snapshot.size)
      setSex(snapshot.sex)
      setNeutered(snapshot.neutered)
    }
    setError('')
    setEditing(false)
  }

  const handleDelete = async () => {
    if (!window.confirm('반려동물 정보를 삭제할까요? 되돌릴 수 없습니다.')) return
    setSaving(true)
    try {
      await deletePet(petId)
      navigate('/pets', { replace: true })
    } catch (err) {
      setError(err.response?.data?.message || '삭제에 실패했습니다.')
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl space-y-4">
        <div className="h-20 animate-pulse rounded-2xl bg-stone-100" />
        <div className="h-72 animate-pulse rounded-2xl bg-stone-100" />
      </div>
    )
  }

  const age = calculateAge(birthDate)
  const summary = [
    SPECIES_LABEL[species] ?? species,
    breed,
    age !== null && `${age}살`,
    SIZE_LABEL[size],
  ]
    .filter(Boolean)
    .join(' · ')

  const avatar = (
    <span className="icon-badge size-24 shrink-0 overflow-hidden text-brand-600">
      {imageUrl ? (
        <img src={`${BASE_URL}${imageUrl}`} alt="" className="size-full object-cover" />
      ) : (
        <PawPrint size={40} />
      )}
    </span>
  )

  const photoField = (
    <div className="flex flex-col items-center gap-2">
      <label className="group relative flex size-24 cursor-pointer items-center justify-center overflow-hidden rounded-full bg-brand-100 text-brand-600">
        {imageUrl ? (
          <img src={`${BASE_URL}${imageUrl}`} alt="" className="size-full object-cover" />
        ) : (
          <PawPrint size={40} />
        )}
        <span className="absolute inset-0 flex items-center justify-center bg-black/40 text-xs font-medium text-white opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100">
          {imageSaving ? '처리 중...' : '사진 변경'}
        </span>
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="sr-only"
          disabled={imageSaving}
          onChange={handleImageChange}
        />
      </label>
      <p className="text-[13px] text-stone-600">jpg, png, webp 파일만 올릴 수 있어요</p>
      {imageError && <p className="text-[13px] text-red-600">{imageError}</p>}
      {imageUrl && (
        <button
          type="button"
          onClick={handleImageDelete}
          disabled={imageSaving}
          className="text-[13px] font-medium text-stone-600 hover:text-red-600 disabled:opacity-50"
        >
          사진 삭제
        </button>
      )}
    </div>
  )

  const form = (
    <form onSubmit={handleSubmit} className="card flex flex-col gap-5 p-5 md:p-6">
      <TextField
        label="이름"
        value={name}
        placeholder="반려동물 이름"
        onChange={(event) => setName(event.target.value)}
        required
      />

      <ChoiceGroup
        label="종"
        value={species}
        onChange={setSpecies}
        options={SPECIES_OPTIONS}
      />

      <TextField
        label="품종"
        value={breed}
        onChange={(event) => setBreed(event.target.value)}
        placeholder="예: 말티즈"
      />

      <TextField
        label="생년월일"
        type="date"
        value={birthDate}
        onChange={(event) => setBirthDate(event.target.value)}
      />

      <ChoiceGroup label="크기" value={size} onChange={setSize} options={SIZE_OPTIONS} />

      <ChoiceGroup label="성별" value={sex} onChange={setSex} options={SEX_OPTIONS} />

      <ChoiceGroup
        label="중성화 여부"
        value={neutered}
        onChange={setNeutered}
        options={NEUTERED_OPTIONS}
      />

      <Alert tone="error">{error}</Alert>

      <div className="flex items-center gap-2">
        <Button type="submit" loading={saving} className="flex-1">
          {isEdit ? '저장' : '등록하기'}
        </Button>
        {isEdit && (
          <button
            type="button"
            onClick={handleEditCancel}
            disabled={saving}
            className="btn btn-secondary disabled:opacity-50"
          >
            취소
          </button>
        )}
        {isEdit && role === 'OWNER' && (
          <button
            type="button"
            onClick={handleDelete}
            disabled={saving}
            className="btn btn-danger px-4 disabled:opacity-50"
            aria-label="반려동물 삭제"
          >
            <Trash size={20} />
          </button>
        )}
      </div>
    </form>
  )

  // 개요 탭 읽기 전용 뷰 — 내가 등록해 둔 정보를 정리해서 보여주고,
  // 연필 아이콘을 누르면 위 form으로 전환된다.
  const overviewView = (
    <div className="flex flex-col gap-4">
      {saved && <Alert tone="ok">정보를 저장했어요.</Alert>}

      <div className="flex items-center gap-4">
        {avatar}
        <div className="min-w-0 flex-1">
          <p className="truncate text-xl font-bold">{name}</p>
          <p className="truncate text-sm text-stone-600">{summary || '정보 미등록'}</p>
        </div>
        <button
          type="button"
          onClick={handleEditStart}
          aria-label="정보 수정"
          className="flex size-11 shrink-0 items-center justify-center rounded-full border border-stone-300 text-stone-800 transition-colors hover:bg-stone-50"
        >
          <PencilSimple size={20} />
        </button>
      </div>

      <dl className="card m-0 px-4 py-1 md:px-5">
        <InfoRow term="이름">{name}</InfoRow>
        <InfoRow term="종">{SPECIES_LABEL[species] ?? species}</InfoRow>
        <InfoRow term="품종">{breed || '미등록'}</InfoRow>
        <InfoRow term="생년월일">
          {birthDate ? `${formatBirthDate(birthDate)} (${age}살)` : '미등록'}
        </InfoRow>
        <InfoRow term="크기">{size ? SIZE_LABEL[size] : '미등록'}</InfoRow>
        <InfoRow term="성별">{sex ? SEX_LABEL[sex] : '미등록'}</InfoRow>
        <InfoRow term="중성화">{neutered !== '' ? NEUTERED_LABEL[neutered] : '미등록'}</InfoRow>
        <InfoRow term="현재 체중">
          {weightLoading
            ? '불러오는 중...'
            : latestWeight
              ? `${latestWeight.weight}kg (${latestWeight.recordedAt} 기록)`
              : '기록 없음'}
        </InfoRow>
      </dl>
    </div>
  )

  if (!isEdit) {
    return (
      <div className="mx-auto max-w-2xl">
        <PageHeader back title="반려동물 등록" />
        {form}
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader back title={name || '반려동물'} subtitle={summary} />

      <Tabs tabs={TABS} value={tab} onChange={setTab} label="반려동물 정보" />

      {tab === 'overview' &&
        (editing ? (
          <div className="flex flex-col gap-6">
            {photoField}
            {form}
          </div>
        ) : (
          overviewView
        ))}
      {tab === 'records' && <HealthRecordSection petId={petId} />}
      {tab === 'feeding' && (
        <FeedingCalculatorSection petId={petId} species={species} />
      )}
      {tab === 'guardians' && (
        <GuardianSection petId={petId} isOwner={role === 'OWNER'} />
      )}
    </div>
  )
}
