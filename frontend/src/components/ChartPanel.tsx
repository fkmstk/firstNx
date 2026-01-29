import { useMemo, useState } from 'react'
import Plot from 'react-plotly.js'
import type { PreviewResponse } from '../types'

type Props = {
  preview?: PreviewResponse | null
}

export default function ChartPanel({ preview }: Props) {
  const columns = preview?.columns ?? []
  const [xKey, setXKey] = useState<string>(columns[0] ?? '')
  const [yKey, setYKey] = useState<string>(columns[1] ?? '')

  const rows = preview?.rows ?? []

  const plotData = useMemo(() => {
    if (!xKey || !yKey) return []
    const x = rows.map((row) => row[xKey])
    const y = rows.map((row) => Number(row[yKey]))
    return [
      {
        x,
        y,
        type: 'scatter',
        mode: 'lines+markers',
        marker: { color: '#2563eb' },
      },
    ]
  }, [rows, xKey, yKey])

  if (!preview) {
    return <p style={{ fontSize: 13 }}>可視化するデータがありません。</p>
  }

  return (
    <div>
      <h3>時系列可視化</h3>
      <div className="grid two">
        <label>
          X軸
          <select value={xKey} onChange={(e) => setXKey(e.target.value)}>
            <option value="">選択</option>
            {columns.map((col) => (
              <option key={col} value={col}>
                {col}
              </option>
            ))}
          </select>
        </label>
        <label>
          Y軸
          <select value={yKey} onChange={(e) => setYKey(e.target.value)}>
            <option value="">選択</option>
            {columns.map((col) => (
              <option key={col} value={col}>
                {col}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div style={{ marginTop: 12 }}>
        <Plot
          data={plotData}
          layout={{
            height: 320,
            margin: { l: 40, r: 20, t: 20, b: 40 },
            paper_bgcolor: 'rgba(0,0,0,0)',
            plot_bgcolor: 'rgba(0,0,0,0)',
          }}
          config={{ displayModeBar: false }}
          style={{ width: '100%' }}
        />
      </div>
    </div>
  )
}
