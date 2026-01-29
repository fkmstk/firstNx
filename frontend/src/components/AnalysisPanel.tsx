import { useState } from 'react'
import { getAnomaly, getCorrelation } from '../api/client'
import type { AnomalyResult, CorrelationResult } from '../types'

type Props = {
  datasetId?: string
  columns: string[]
}

export default function AnalysisPanel({ datasetId, columns }: Props) {
  const [corrInput, setCorrInput] = useState<string>('')
  const [corrResult, setCorrResult] = useState<CorrelationResult | null>(null)
  const [anomTime, setAnomTime] = useState<string>('')
  const [anomValue, setAnomValue] = useState<string>('')
  const [contamination, setContamination] = useState<string>('0.05')
  const [anomalyResult, setAnomalyResult] = useState<AnomalyResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const runCorrelation = async () => {
    if (!datasetId) return
    const cols = corrInput.split(',').map((c) => c.trim()).filter(Boolean)
    if (cols.length === 0) return
    setLoading(true)
    setError(null)
    try {
      const res = await getCorrelation(datasetId, cols)
      setCorrResult(res)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  const runAnomaly = async () => {
    if (!datasetId || !anomTime || !anomValue) return
    setLoading(true)
    setError(null)
    try {
      const res = await getAnomaly(datasetId, anomTime, anomValue, Number(contamination))
      setAnomalyResult(res)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <h3>分析</h3>
      {!datasetId && <p style={{ fontSize: 13 }}>データセットを選択してください。</p>}
      {datasetId && (
        <div className="grid two">
          <div>
            <label>
              相関（列をカンマ区切り）
              <input
                value={corrInput}
                onChange={(e) => setCorrInput(e.target.value)}
                placeholder={columns.slice(0, 3).join(', ')}
              />
            </label>
            <button type="button" className="secondary" onClick={runCorrelation} disabled={loading}>
              相関を計算
            </button>
            {corrResult && (
              <div style={{ marginTop: 8, fontSize: 12 }}>
                <div>columns: {corrResult.columns.join(', ')}</div>
                <div>matrix: {JSON.stringify(corrResult.matrix)}</div>
              </div>
            )}
          </div>
          <div>
            <label>
              異常検知（時間列）
              <input value={anomTime} onChange={(e) => setAnomTime(e.target.value)} />
            </label>
            <label>
              異常検知（値列）
              <input value={anomValue} onChange={(e) => setAnomValue(e.target.value)} />
            </label>
            <label>
              contamination
              <input value={contamination} onChange={(e) => setContamination(e.target.value)} />
            </label>
            <button type="button" className="secondary" onClick={runAnomaly} disabled={loading}>
              異常検知を実行
            </button>
            {anomalyResult && (
              <div style={{ marginTop: 8, fontSize: 12 }}>
                <div>threshold: {anomalyResult.threshold}</div>
                <div>points: {anomalyResult.points.length}</div>
              </div>
            )}
          </div>
        </div>
      )}
      {error && <p style={{ color: '#b91c1c', fontSize: 12 }}>{error}</p>}
    </div>
  )
}
