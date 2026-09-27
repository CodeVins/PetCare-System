import { useState } from 'react'
import { calculateFeeding } from '../../api/petApi'
import Alert from '../../components/common/Alert'
import Button from '../../components/common/Button'
import ChoiceGroup from '../../components/common/ChoiceGroup'
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
    <section className="flex flex-col gap-4" aria-labelledby="h-feeding">
      <form onSubmit={handleSubmit} className="card flex flex-col gap-4 p-5 md:p-6">
        <h2 id="h-feeding" className="h-section">
          급여량 계산기
        </h2>

        <div>
          <label
            htmlFor="feeding-weight"
            className="mb-1.5 block text-sm font-medium text-stone-700"
          >
            체중
          </label>
          <div className="relative">
            <input
              id="feeding-weight"
              type="number"
              step="0.1"
              min="0"
              value={weightKg}
              onChange={(event) => setWeightKg(event.target.value)}
              className="input pr-12"
              required
            />
            <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-sm text-stone-600">
              kg
            </span>
          </div>
        </div>

        <ChoiceGroup
          label="활동량"
          value={activityLevel}
          onChange={setActivityLevel}
          options={ACTIVITY_OPTIONS}
        />

        <TextField
          label="사료 칼로리 밀도"
          type="number"
          step="1"
          min="0"
          placeholder="350"
          hint="kcal/100g · 비우면 건식 사료 평균 350으로 계산합니다."
          value={foodCalorieDensityPer100g}
          onChange={(event) => setFoodCalorieDensityPer100g(event.target.value)}
        />

        <Alert tone="error">{error}</Alert>

        <Button type="submit" loading={calculating} className="w-full">
          계산하기
        </Button>
      </form>

      {result && (
        <div className="rounded-2xl border border-brand-200 bg-brand-50 p-5 md:p-6">
          <p className="text-sm text-stone-600">하루 권장 급여량</p>
          <p className="flex items-baseline gap-1">
            <span className="font-display text-[40px] leading-tight text-brand-700">
              {result.foodAmountGrams.toFixed(0)}
            </span>
            <span className="font-medium text-stone-600">g</span>
          </p>
          <p className="text-sm text-stone-600">
            일일 {result.dailyCalories.toFixed(0)}kcal 기준
          </p>
          <p className="mt-3 text-[13px] text-stone-600">{result.disclaimer}</p>
        </div>
      )}
    </section>
  )
}
