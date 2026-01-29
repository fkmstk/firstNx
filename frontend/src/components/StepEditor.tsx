import { useMemo, useState } from 'react'
import type { DatasetMeta, PipelineStep } from '../types'

type Props = {
  datasets: DatasetMeta[]
  onAdd: (step: PipelineStep) => void
}

export default function StepEditor({ datasets, onAdd }: Props) {
  const [type, setType] = useState<PipelineStep['type']>('select')
  const [leftId, setLeftId] = useState<string>('')
  const [rightId, setRightId] = useState<string>('')
  const [leftTime, setLeftTime] = useState<string>('time')
  const [rightTime, setRightTime] = useState<string>('time')
  const [strategy, setStrategy] = useState<'backward' | 'forward' | 'nearest'>('nearest')
  const [tolerance, setTolerance] = useState<string>('')

  const [imputeColumn, setImputeColumn] = useState<string>('')
  const [imputeMethod, setImputeMethod] = useState<'ffill' | 'bfill' | 'mean' | 'median' | 'zero'>('ffill')

  const [filterExpr, setFilterExpr] = useState<string>('')
  const [selectColumns, setSelectColumns] = useState<string>('')

  const datasetOptions = useMemo(() => datasets, [datasets])

  const addStep = () => {
    let step: PipelineStep | null = null
    if (type === 'join') {
      if (!rightId || !leftTime || !rightTime) return
      step = {
        type: 'join',
        left_id: leftId || null,
        right_id: rightId,
        left_time_col: leftTime,
        right_time_col: rightTime,
        tolerance_ms: tolerance ? Number(tolerance) : null,
        strategy,
      }
    } else if (type === 'impute') {
      if (!imputeColumn) return
      step = { type: 'impute', column: imputeColumn, method: imputeMethod }
    } else if (type === 'filter') {
      if (!filterExpr) return
      step = { type: 'filter', expr: filterExpr }
    } else if (type === 'select') {
      const cols = selectColumns.split(',').map((c) => c.trim()).filter(Boolean)
      if (cols.length === 0) return
      step = { type: 'select', columns: cols }
    }
    if (step) onAdd(step)
  }

  return (
    <div>
      <h3>ステップ追加</h3>
      <label>
        種類
        <select value={type} onChange={(e) => setType(e.target.value as PipelineStep['type'])}>
          <option value="select">select</option>
          <option value="filter">filter</option>
          <option value="impute">impute</option>
          <option value="join">join</option>
        </select>
      </label>

      {type === 'join' && (
        <div className="grid two" style={{ marginTop: 8 }}>
          <label>
            左データセット（空で現在）
            <select value={leftId} onChange={(e) => setLeftId(e.target.value)}>
              <option value="">現在のデータ</option>
              {datasetOptions.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.filename}
                </option>
              ))}
            </select>
          </label>
          <label>
            右データセット
            <select value={rightId} onChange={(e) => setRightId(e.target.value)}>
              <option value="">選択</option>
              {datasetOptions.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.filename}
                </option>
              ))}
            </select>
          </label>
          <label>
            左時間列
            <input value={leftTime} onChange={(e) => setLeftTime(e.target.value)} />
          </label>
          <label>
            右時間列
            <input value={rightTime} onChange={(e) => setRightTime(e.target.value)} />
          </label>
          <label>
            方向
            <select value={strategy} onChange={(e) => setStrategy(e.target.value as any)}>
              <option value="nearest">nearest</option>
              <option value="backward">backward</option>
              <option value="forward">forward</option>
            </select>
          </label>
          <label>
            許容ミリ秒(任意)
            <input value={tolerance} onChange={(e) => setTolerance(e.target.value)} />
          </label>
        </div>
      )}

      {type === 'impute' && (
        <div className="grid two" style={{ marginTop: 8 }}>
          <label>
            列名
            <input value={imputeColumn} onChange={(e) => setImputeColumn(e.target.value)} />
          </label>
          <label>
            方法
            <select value={imputeMethod} onChange={(e) => setImputeMethod(e.target.value as any)}>
              <option value="ffill">ffill</option>
              <option value="bfill">bfill</option>
              <option value="mean">mean</option>
              <option value="median">median</option>
              <option value="zero">zero</option>
            </select>
          </label>
        </div>
      )}

      {type === 'filter' && (
        <div style={{ marginTop: 8 }}>
          <label>
            条件式（例: value > 10）
            <input value={filterExpr} onChange={(e) => setFilterExpr(e.target.value)} />
          </label>
        </div>
      )}

      {type === 'select' && (
        <div style={{ marginTop: 8 }}>
          <label>
            列（カンマ区切り）
            <input value={selectColumns} onChange={(e) => setSelectColumns(e.target.value)} />
          </label>
        </div>
      )}

      <div style={{ marginTop: 12 }}>
        <button type="button" onClick={addStep}>
          追加
        </button>
      </div>
    </div>
  )
}
