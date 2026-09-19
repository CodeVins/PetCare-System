import { PawPrint, Trash } from '@phosphor-icons/react'
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  createPet,
  deletePet,
  deletePetImage,
  getPet,
  updatePet,
  uploadPetImage,
} from '../../api/petApi'
import { BASE_URL } from '../../api/axiosInstance'
import Button from '../../components/common/Button'
import TextField from '../../components/common/TextField'
import FeedingCalculatorSection from './FeedingCalculatorSection'
import GuardianSection from './GuardianSection'
import HealthRecordSection from './HealthRecordSection'

const SPECIES_OPTIONS = [
  { value: 'DOG', label: '강아지' },
  { value: 'CAT', label: '고양이' },
]

const SIZE_OPTIONS = [
  { value: '', label: '선택 안 함' },
  { value: 'SMALL', label: '소형' },
  { value: 'MEDIUM', label: '중형' },
  { value: 'LARGE', label: '대형' },
]

export default function PetFormPage() {
  const { petId } = useParams()
  const isEdit = Boolean(petId)
  const navigate = useNavigate()

  const [name, setName] = useState('')
  const [species, setSpecies] = useState('DOG')
  const [breed, setBreed] = useState('')
  const [birthDate, setBirthDate] = useState('')
  const [size, setSize] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [role, setRole] = useState('OWNER')
  const [loading, setLoading] = useState(isEdit)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [imageSaving, setImageSaving] = useState(false)
  const [imageError, setImageError] = useState('')

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
        setImageUrl(pet.imageUrl || '')
        setRole(pet.role)
      })
      .catch((err) =>
        setError(err.response?.data?.message || '반려동물 정보를 불러오지 못했습니다.'),
      )
      .finally(() => setLoading(false))
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
    setSaving(true)
    try {
      const payload = {
        name,
        species,
        breed: breed || null,
        birthDate: birthDate || null,
        size: size || null,
      }
      if (isEdit) {
        await updatePet(petId, payload)
      } else {
        await createPet(payload)
      }
      navigate('/pets', { replace: true })
    } catch (err) {
      setError(err.response?.data?.message || '저장에 실패했습니다.')
      setSaving(false)
    }
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
    return <div className="h-64 animate-pulse rounded-2xl bg-stone-100" />
  }

  return (
    <div className="mx-auto max-w-md">
      <h1 className="mb-6 text-2xl font-bold tracking-tight text-stone-900">
        {isEdit ? '반려동물 정보 수정' : '반려동물 등록'}
      </h1>

      {isEdit && (
        <div className="mb-6 flex flex-col items-center gap-2">
          <label className="group relative flex size-24 cursor-pointer items-center justify-center overflow-hidden rounded-full bg-stone-100 ring-1 ring-stone-200">
            {imageUrl ? (
              <img
                src={`${BASE_URL}${imageUrl}`}
                alt=""
                className="size-full object-cover"
              />
            ) : (
              <PawPrint size={32} className="text-stone-300" />
            )}
            <span className="absolute inset-0 flex items-center justify-center bg-black/40 text-xs font-medium text-white opacity-0 transition-opacity group-hover:opacity-100">
              {imageSaving ? '처리 중...' : '사진 변경'}
            </span>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              disabled={imageSaving}
              onChange={handleImageChange}
            />
          </label>
          {imageError && <p className="text-xs text-red-600">{imageError}</p>}
          {imageUrl && (
            <button
              type="button"
              onClick={handleImageDelete}
              disabled={imageSaving}
              className="text-xs font-medium text-stone-500 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              사진 삭제
            </button>
          )}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="space-y-4 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm"
      >
        <TextField
          label="이름"
          value={name}
          onChange={(event) => setName(event.target.value)}
          required
        />

        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-stone-700">종</span>
          <select
            value={species}
            onChange={(event) => setSpecies(event.target.value)}
            className="w-full rounded-lg border border-stone-200 bg-stone-50 px-3.5 py-2.5 text-sm text-stone-900 focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/40"
          >
            {SPECIES_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

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

        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-stone-700">크기</span>
          <select
            value={size}
            onChange={(event) => setSize(event.target.value)}
            className="w-full rounded-lg border border-stone-200 bg-stone-50 px-3.5 py-2.5 text-sm text-stone-900 focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/40"
          >
            {SIZE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex items-center gap-2 pt-2">
          <Button type="submit" loading={saving} className="flex-1">
            {isEdit ? '저장' : '등록'}
          </Button>
          {isEdit && role === 'OWNER' && (
            <button
              type="button"
              onClick={handleDelete}
              disabled={saving}
              className="inline-flex items-center justify-center rounded-full border border-red-200 px-4 py-2.5 text-sm font-semibold text-red-600 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
              aria-label="반려동물 삭제"
            >
              <Trash size={18} />
            </button>
          )}
        </div>
      </form>

      {isEdit && (
        <div className="mt-8 space-y-8">
          <HealthRecordSection petId={petId} />
          <FeedingCalculatorSection petId={petId} species={species} />
          <GuardianSection petId={petId} isOwner={role === 'OWNER'} />
        </div>
      )}
    </div>
  )
}
