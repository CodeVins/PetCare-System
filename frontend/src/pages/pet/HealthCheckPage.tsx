import { PawPrint } from '@phosphor-icons/react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { BASE_URL } from '../../api/axiosInstance'
import { getHealthCheckQuestions, submitHealthCheck } from '../../api/healthCheckApi'
import { getMyPets } from '../../api/petApi'
import Alert from '../../components/common/Alert'
import Button from '../../components/common/Button'
import EmptyState from '../../components/common/EmptyState'
import PageHeader from '../../components/common/PageHeader'
import { petSubtitle } from '../../lib/format'

const RISK = {
  LOW: ['낮음', 'bg-green-100 text-green-800'],
  MEDIUM: ['주의', 'bg-amber-100 text-amber-800'],
  HIGH: ['높음', 'bg-red-100 text-red-700'],
}

const ACCENTS = ['', 'icon-badge-amber', 'icon-badge-sky']

export default function HealthCheckPage() {
  const [questions, setQuestions] = useState([])
  const [pets, setPets] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [petId, setPetId] = useState('')
  const [answers, setAnswers] = useState({})
  const [saveRecord, setSaveRecord] = useState(true)
  // -1 = 시작 화면(반려동물 선택), 0..n-1 = 문항, 결과는 result로 판단
  const [step, setStep] = useState(-1)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [result, setResult] = useState(null)

  useEffect(() => {
    Promise.all([getHealthCheckQuestions(), getMyPets()])
      .then(([questionsRes, petsRes]) => {
        setQuestions(questionsRes.data.data)
        const list = petsRes.data.data.content
        setPets(list)
        if (list.length > 0) setPetId(String(list[0].id))
      })
      .catch((err) =>
        setError(err.response?.data?.message || '문진 정보를 불러오지 못했습니다.'),
      )
      .finally(() => setLoading(false))
  }, [])

  const selectedPet = pets.find((pet) => String(pet.id) === petId)

  const handleSubmit = async () => {
    setSubmitError('')
    setSubmitting(true)
    try {
      const { data } = await submitHealthCheck({
        petId: Number(petId),
        answers: Object.entries(answers).map(([questionId, optionId]) => ({
          questionId,
          optionId,
        })),
        saveRecord,
      })
      setResult(data.data)
    } catch (err) {
      setSubmitError(err.response?.data?.message || '제출에 실패했습니다.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleReset = () => {
    setAnswers({})
    setResult(null)
    setSubmitError('')
    setStep(-1)
  }

  if (loading) {
    return <div className="h-64 animate-pulse rounded-2xl bg-stone-100" />
  }

  if (error) {
    return <Alert tone="error">{error}</Alert>
  }

  if (pets.length === 0) {
    return (
      <div className="card">
        <EmptyState
          icon={PawPrint}
          action={
            <Link to="/pets/new" className="btn btn-primary btn-sm">
              반려동물 등록
            </Link>
          }
        >
          먼저 반려동물을 등록해 주세요.
        </EmptyState>
      </div>
    )
  }

  // ── 결과 ────────────────────────────────────────────────────────────────
  if (result) {
    const [riskLabel, riskStyle] = RISK[result.riskLevel] ?? ['—', 'badge-neutral']
    return (
      <div className="mx-auto flex max-w-xl flex-col gap-4">
        <PageHeader title="자가문진 결과" />

        <section className="card flex flex-col items-center gap-3 px-5 py-6 text-center">
          <h2 className="text-sm font-medium text-stone-600">
            {selectedPet?.name}의 자가문진 결과
          </h2>
          <span
            className={`flex h-11 items-center rounded-full px-6 font-display text-[26px] ${riskStyle}`}
          >
            {riskLabel}
          </span>
          <p className="text-[15px]">{result.comparisonNote}</p>
          <div className="flex w-full justify-between border-t border-stone-100 pt-3 text-sm">
            <span className="text-stone-600">총점</span>
            <b>{result.totalScore}점</b>
          </div>
        </section>

        <p className="px-1 text-xs text-stone-600">{result.disclaimer}</p>

        {result.savedHealthRecordId && <Alert tone="ok">건강기록에 저장했어요.</Alert>}

        <div className="flex gap-2.5">
          <button type="button" onClick={handleReset} className="btn btn-secondary w-30">
            다시 하기
          </button>
          <Link to="/pets" className="btn-primary flex-1 shadow">
            완료
          </Link>
        </div>
      </div>
    )
  }

  // ── 시작: 반려동물 선택 ─────────────────────────────────────────────────
  if (step === -1) {
    return (
      <div className="mx-auto flex max-w-xl flex-col gap-5">
        <div>
          <h1 className="text-[28px] leading-snug">오늘 컨디션은 어때요?</h1>
          <p className="mt-2 text-stone-600">
            {questions.length}개 문항으로 지금 상태를 가볍게 확인해 볼게요.
          </p>
        </div>

        <div role="radiogroup" aria-label="반려동물 선택" className="flex flex-col gap-2.5">
          {pets.map((pet, index) => {
            const selected = String(pet.id) === petId
            return (
              <label
                key={pet.id}
                className={`flex cursor-pointer items-center gap-3.5 rounded-2xl p-3.5 transition-colors ${
                  selected
                    ? 'border-2 border-brand-600 bg-brand-50'
                    : 'card hover:bg-stone-50'
                }`}
              >
                <span
                  className={`icon-badge size-14 overflow-hidden ${ACCENTS[index % ACCENTS.length]}`}
                >
                  {pet.imageUrl ? (
                    <img
                      src={`${BASE_URL}${pet.imageUrl}`}
                      alt=""
                      className="size-full object-cover"
                    />
                  ) : (
                    <PawPrint size={28} />
                  )}
                </span>
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate text-[17px] font-bold">{pet.name}</span>
                  <span className="truncate text-[13px] text-stone-600">
                    {[petSubtitle(pet), pet.breed].filter(Boolean).join(' · ')}
                  </span>
                </span>
                <input
                  type="radio"
                  name="health-check-pet"
                  value={pet.id}
                  checked={selected}
                  onChange={(event) => setPetId(event.target.value)}
                  className="size-6 accent-brand-600"
                />
              </label>
            )
          })}
        </div>

        <label className="flex min-h-12 items-center gap-3 text-[15px]">
          <input
            type="checkbox"
            checked={saveRecord}
            onChange={(event) => setSaveRecord(event.target.checked)}
            className="size-5 accent-brand-600"
          />
          결과를 건강기록에 저장
        </label>

        <Button type="button" onClick={() => setStep(0)} className="w-full shadow">
          시작하기
        </Button>
      </div>
    )
  }

  // ── 문항 (한 번에 하나씩) ───────────────────────────────────────────────
  const question = questions[step]
  const isLast = step === questions.length - 1
  const answered = Boolean(answers[question.id])

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-6">
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between text-sm">
          <span className="font-bold text-brand-600">{selectedPet?.name}</span>
          <span className="text-stone-600">
            <b className="text-stone-900">{step + 1}</b> / {questions.length}
          </span>
        </div>
        <div
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={questions.length}
          aria-valuenow={step + 1}
          aria-label="문항 진행"
          className="h-2 overflow-hidden rounded-full bg-stone-200"
        >
          <div
            className="h-full rounded-full bg-brand-600 transition-[width] duration-300 motion-reduce:transition-none"
            style={{ width: `${((step + 1) / questions.length) * 100}%` }}
          />
        </div>
      </div>

      <fieldset className="flex flex-col gap-4 border-0 p-0">
        <legend className="mb-4 font-display text-[28px] leading-snug">
          {question.text}
        </legend>
        {question.options.map((option) => {
          const selected = answers[question.id] === option.id
          return (
            <label
              key={option.id}
              className={`flex min-h-16 cursor-pointer items-center gap-3.5 rounded-2xl p-3.5 text-base transition-colors ${
                selected
                  ? 'border-2 border-brand-600 bg-brand-50 font-bold text-brand-700'
                  : 'card hover:bg-stone-50'
              }`}
            >
              <input
                type="radio"
                name={question.id}
                value={option.id}
                checked={selected}
                onChange={() =>
                  setAnswers((prev) => ({ ...prev, [question.id]: option.id }))
                }
                className="size-6 accent-brand-600"
              />
              {option.label}
            </label>
          )
        })}
      </fieldset>

      <Alert tone="error">{submitError}</Alert>

      <div className="flex gap-2.5">
        <button
          type="button"
          onClick={() => setStep((s) => s - 1)}
          className="btn btn-secondary w-26"
        >
          이전
        </button>
        {isLast ? (
          <Button
            type="button"
            onClick={handleSubmit}
            loading={submitting}
            disabled={!answered}
            className="flex-1 shadow"
          >
            결과 확인
          </Button>
        ) : (
          <Button
            type="button"
            onClick={() => setStep((s) => s + 1)}
            disabled={!answered}
            className="flex-1 shadow"
          >
            다음
          </Button>
        )}
      </div>
    </div>
  )
}
