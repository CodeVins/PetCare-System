const WIDTH = 300
const HEIGHT = 100
const PADDING = 12
const BRAND_COLOR = '#3f8079'

export default function WeightChart({ records }) {
  if (records.length < 2) return null

  const weights = records.map((record) => record.weight)
  const minWeight = Math.min(...weights)
  const maxWeight = Math.max(...weights)
  const range = maxWeight - minWeight || 1

  const points = records.map((record, index) => {
    const x = PADDING + (index / (records.length - 1)) * (WIDTH - PADDING * 2)
    const y =
      HEIGHT - PADDING - ((record.weight - minWeight) / range) * (HEIGHT - PADDING * 2)
    return { x, y }
  })

  const polylinePoints = points.map((p) => `${p.x},${p.y}`).join(' ')
  const latest = records[records.length - 1]

  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
      <div className="mb-3 flex items-baseline justify-between">
        <h3 className="text-sm font-semibold text-stone-700">체중 변화</h3>
        <p className="text-lg font-semibold text-stone-900">{latest.weight}kg</p>
      </div>
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="h-28 w-full"
        preserveAspectRatio="none"
      >
        <polyline
          points={polylinePoints}
          fill="none"
          stroke={BRAND_COLOR}
          strokeWidth="2"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {points.map((p, index) => (
          <circle key={index} cx={p.x} cy={p.y} r="2.5" fill={BRAND_COLOR} />
        ))}
      </svg>
      <div className="mt-1 flex justify-between text-xs text-stone-400">
        <span>{records[0].recordedAt}</span>
        <span>{latest.recordedAt}</span>
      </div>
    </div>
  )
}
