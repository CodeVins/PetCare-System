const WIDTH = 326
const HEIGHT = 132
const LEFT = 28 // y축 눈금 라벨 자리
const RIGHT = 18
const TOP = 20
const BOTTOM = 40 // x축 날짜 라벨 자리
const BRAND = '#0F766E'

const monthLabel = (recordedAt) => `${new Date(recordedAt).getMonth() + 1}월`

export default function WeightChart({ records }) {
  if (records.length < 2) return null

  const weights = records.map((record) => record.weight)
  const min = Math.min(...weights)
  const max = Math.max(...weights)
  // 전부 같은 체중이면 range가 0이라 선이 위쪽에 붙는다 → 최소 0.5kg 폭을 준다
  const pad = Math.max((max - min) * 0.2, 0.25)
  const low = min - pad
  const high = max + pad
  const range = high - low

  const x = (index) => LEFT + (index / (records.length - 1)) * (WIDTH - LEFT - RIGHT)
  const y = (weight) =>
    TOP + (1 - (weight - low) / range) * (HEIGHT - TOP - BOTTOM)

  const points = records.map((record, index) => ({
    x: x(index),
    y: y(record.weight),
    ...record,
  }))
  const latest = records[records.length - 1]
  const first = records[0]

  // y축 눈금 3개 (위/가운데/아래)
  const ticks = [high, (high + low) / 2, low].map((value) => ({
    value,
    y: y(value),
  }))

  return (
    <section className="card p-5 md:p-6" aria-labelledby="h-weight">
      <h2 id="h-weight" className="text-sm font-medium text-stone-600">
        현재 체중
      </h2>
      <p className="mb-2 flex items-baseline gap-1">
        <span className="font-display text-[40px] leading-tight">{latest.weight}</span>
        <span className="font-medium text-stone-600">kg</span>
      </p>

      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="block h-33 w-full"
        role="img"
        aria-label={`체중 변화 그래프: ${first.recordedAt} ${first.weight}kg에서 ${latest.recordedAt} ${latest.weight}kg`}
      >
        <g stroke="#E7E5E4" strokeWidth="1">
          {ticks.map((tick) => (
            <line key={tick.value} x1={LEFT} y1={tick.y} x2={WIDTH - 8} y2={tick.y} />
          ))}
        </g>
        <g fill="#57534E" fontSize="12">
          {ticks.map((tick) => (
            <text key={tick.value} x="0" y={tick.y + 4}>
              {tick.value.toFixed(1)}
            </text>
          ))}
        </g>

        <polyline
          points={points.map((p) => `${p.x},${p.y}`).join(' ')}
          fill="none"
          stroke={BRAND}
          strokeWidth="2.5"
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        <g fill="#ffffff" stroke={BRAND} strokeWidth="2">
          {points.slice(0, -1).map((p) => (
            <circle key={p.id} cx={p.x} cy={p.y} r="4" />
          ))}
        </g>
        <circle
          cx={points[points.length - 1].x}
          cy={points[points.length - 1].y}
          r="5.5"
          fill={BRAND}
        />

        <g fill="#57534E" fontSize="12" textAnchor="middle">
          {points.map((p, index) =>
            // 점이 촘촘하면 라벨이 겹치므로 6개를 넘으면 건너뛰며 찍는다
            index % Math.ceil(points.length / 6) === 0 ||
            index === points.length - 1 ? (
              <text key={p.id} x={p.x} y={HEIGHT - 16}>
                {monthLabel(p.recordedAt)}
              </text>
            ) : null,
          )}
        </g>
      </svg>
    </section>
  )
}
