import { useState } from 'react'
import { calculateFeeding } from '../../api/petApi'
import Button from '../../components/common/Button'
import TextField from '../../components/common/TextField'

const ACTIVITY_OPTIONS = [
  { value: 'LOW', label: '낮음' },
  { value: 'NORMAL', label: '보통' },
  { value: 'HIGH', label: '높음' },
]

export default function FeedingCalculatorSection({ petId, species }) {
  const [weightKg, setWeightKg] = useState('')
  const [activityLevel, setActivityLevel] = useState('NORMAL')
  const [foodCalorieDensityPer100g, setFoodCalorieDensityPer100g] = useState('')
  const [result, setResult] = useState(null)
  const [calculating, setCalculating] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setResult(null)
    setCalculating(true)
    try {
      const { data } = await calculateFeeding(petId, {
        weightKg: Number(weightKg),
        activityLevel,
        species,
        foodCalorieDensityPer100g: foodCalorieDensityPer100g
          ? Number(foodCalorieDensityPer100g)
          : null,
      })
      setResult(data.data)
    } catch (err) {
      setError(err.response?.data?.message || '계산에 실패했습니다.')
    } finally {
      setCalculating(false)
    }
  }

  return (
    <div className="space-y-4">
      <h2 className="text-sm font-semibold text-stone-700">급여량 계산기</h2>

      <form
        onSubmit={handleSubmit}
        className="space-y-4 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm"
      >
        <TextField
          label="체중 (kg)"
          type="number"
          step="0.1"
          min="0"
          value={weightKg}
          onChange={(event) => setWeightKg(event.target.value)}
          required
        />

        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-stone-700">활동량</span>
          <select
            value={activityLevel}
            onChange={(event) => setActivityLevel(event.target.value)}
            className="w-full rounded-lg border border-stone-200 bg-stone-50 px-3.5 py-2.5 text-sm text-stone-900 focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/40"
          >
            {ACTIVITY_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <TextField
          label="사료 칼로리 밀도 (kcal/100g, 선택 — 비우면 건식 평균 350으로 계산)"
          type="number"
          step="1"
          min="0"
          value={foodCalorieDensityPer100g}
          onChange={(event) => setFoodCalorieDensityPer100g(event.target.value)}
        />

        {error && <p className="text-sm text-red-600">{error}</p>}

        <Button type="submit" loading={calculating} className="w-full">
          계산하기
        </Button>
      </form>

      {result && (
        <div className="rounded-2xl border border-brand-200 bg-brand-50 p-6">
          <p className="text-sm text-stone-600">
            하루 권장 급여량{' '}
            <span className="font-semibold text-stone-900">
              {result.foodAmountGrams.toFixed(0)}g
            </span>{' '}
            (일일 {result.dailyCalories.toFixed(0)}kcal 기준)
          </p>
          <p className="mt-2 text-xs text-stone-500">{result.disclaimer}</p>
        </div>
      )}
    </div>
  )
}
