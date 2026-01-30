import { useEffect, useMemo, useState } from 'react'
import createPlotlyComponent from 'react-plotly.js/factory'
import Plotly from 'plotly.js-basic-dist'
import type { PreviewResponse } from '../types'

type Props = {
  preview?: PreviewResponse | null
}

const Plot = createPlotlyComponent(Plotly)

export default function ChartPanel({ preview }: Props) {
  const columns = preview?.columns ?? []
  const [xKey, setXKey] = useState<string>(columns[0] ?? '')
  const [yKey, setYKey] = useState<string>(columns[1] ?? '')

  const rows = preview?.rows ?? []

  useEffect(() => {
    if (columns.length === 0) {
      setXKey('')
      setYKey('')
      return
    }
    setXKey((prev) => (prev && columns.includes(prev) ? prev : columns[0] ?? ''))
    setYKey((prev) => {
      if (prev && columns.includes(prev)) return prev
      return columns[1] ?? columns[0] ?? ''
    })
  }, [columns])

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
        marker: { color: '#ff4d00', size: 6 },
        line: { color: '#ff4d00', width: 2 },
      },
    ]
  }, [rows, xKey, yKey])

  if (!preview) {
    return <p className="text-muted">可視化するデータがありません。</p>
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
            margin: { l: 50, r: 20, t: 20, b: 50 },
            paper_bgcolor: 'rgba(0,0,0,0)',
            plot_bgcolor: 'rgba(30,30,30,0.5)',
            font: { family: 'Space Mono, monospace', color: '#e8e4dc' },
            xaxis: {
              gridcolor: '#2a2a2a',
              linecolor: '#2a2a2a',
              tickfont: { size: 10, color: '#6b6b6b' },
              zerolinecolor: '#3d3d3d',
            },
            yaxis: {
              gridcolor: '#2a2a2a',
              linecolor: '#2a2a2a',
              tickfont: { size: 10, color: '#6b6b6b' },
              zerolinecolor: '#3d3d3d',
            },
          }}
          config={{ displayModeBar: false }}
          style={{ width: '100%' }}
        />
      </div>
    </div>
  )
}
