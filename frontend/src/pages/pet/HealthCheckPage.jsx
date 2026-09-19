import { useEffect, useState } from 'react'
import { getHealthCheckQuestions, submitHealthCheck } from '../../api/healthCheckApi'
import { getMyPets } from '../../api/petApi'
import Button from '../../components/common/Button'

const RISK_LABEL = { LOW: '낮음', MEDIUM: '주의', HIGH: '높음' }
const RISK_STYLE = {
  LOW: 'bg-brand-50 text-brand-700',
  MEDIUM: 'bg-amber-50 text-amber-700',
  HIGH: 'bg-red-50 text-red-700',
}

export default function HealthCheckPage() {
  const [questions, setQuestions] = useState([])
  const [pets, setPets] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [petId, setPetId] = useState('')
  const [answers, setAnswers] = useState({})
  const [saveRecord, setSaveRecord] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [result, setResult] = useState(null)

  useEffect(() => {
    Promise.all([getHealthCheckQuestions(), getMyPets()])
      .then(([questionsRes, petsRes]) => {
        setQuestions(questionsRes.data.data)
        setPets(petsRes.data.data.content)
        if (petsRes.data.data.content.length > 0) {
          setPetId(String(petsRes.data.data.content[0].id))
        }
      })
      .catch((err) =>
        setError(err.response?.data?.message || '문진 정보를 불러오지 못했습니다.'),
      )
      .finally(() => setLoading(false))
  }, [])

  const allAnswered = questions.length > 0 && questions.every((q) => answers[q.id])

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSubmitError('')
    if (!petId) {
      setSubmitError('반려동물을 선택해주세요.')
      return
    }
    if (!allAnswered) {
      setSubmitError('모든 문항에 답해주세요.')
      return
    }
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
  }

  if (loading) {
    return <div className="h-64 animate-pulse rounded-2xl bg-stone-100" />
  }

  if (error) {
    return <p className="text-sm text-red-600">{error}</p>
  }

  if (pets.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-stone-300 p-6 text-center text-sm text-stone-500">
        먼저 반려동물을 등록해주세요.
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-md space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-stone-900">건강 자가문진</h1>
        <p className="mt-1 text-sm text-stone-500">
          진단이 아닌 참고용입니다. 이상이 느껴지면 병원에 방문해주세요.
        </p>
      </div>

      {result ? (
        <div className="space-y-4">
          <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-stone-700">위험도</p>
              <span
                className={`rounded-full px-2.5 py-1 text-xs font-semibold ${RISK_STYLE[result.riskLevel]}`}
              >
                {RISK_LABEL[result.riskLevel]}
              </span>
            </div>
            <p className="mt-2 text-sm text-stone-600">총점 {result.totalScore}점</p>
            <p className="mt-2 text-sm text-stone-600">{result.comparisonNote}</p>
            <p className="mt-3 text-xs text-stone-400">{result.disclaimer}</p>
            {result.savedHealthRecordId && (
              <p className="mt-2 text-xs text-brand-700">건강기록에 저장되었습니다.</p>
            )}
          </div>
          <Button type="button" onClick={handleReset} className="w-full">
            다시 하기
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-stone-700">반려동물</span>
            <select
              value={petId}
              onChange={(event) => setPetId(event.target.value)}
              className="w-full rounded-lg border border-stone-200 bg-stone-50 px-3.5 py-2.5 text-sm text-stone-900 focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/40"
            >
              {pets.map((pet) => (
                <option key={pet.id} value={pet.id}>
                  {pet.name}
                </option>
              ))}
            </select>
          </label>

          {questions.map((question) => (
            <div
              key={question.id}
              className="rounded-2xl border border-stone-200 bg-white p-4"
            >
              <p className="mb-3 text-sm font-medium text-stone-900">{question.text}</p>
              <div className="space-y-2">
                {question.options.map((option) => (
                  <label
                    key={option.id}
                    className="flex items-center gap-2 text-sm text-stone-700"
                  >
                    <input
                      type="radio"
                      name={question.id}
                      value={option.id}
                      checked={answers[question.id] === option.id}
                      onChange={() =>
                        setAnswers((prev) => ({ ...prev, [question.id]: option.id }))
                      }
                      className="accent-brand-600"
                    />
                    {option.label}
                  </label>
                ))}
              </div>
            </div>
          ))}

          <label className="flex items-center gap-2 text-sm text-stone-600">
            <input
              type="checkbox"
              checked={saveRecord}
              onChange={(event) => setSaveRecord(event.target.checked)}
              className="accent-brand-600"
            />
            결과를 건강기록에 저장
          </label>

          {submitError && <p className="text-sm text-red-600">{submitError}</p>}

          <Button type="submit" loading={submitting} className="w-full">
            결과 확인
          </Button>
        </form>
      )}
    </div>
  )
}
