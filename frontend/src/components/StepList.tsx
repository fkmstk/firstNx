import type { PipelineStep } from '../types'

type Props = {
  steps: PipelineStep[]
  onRemove: (index: number) => void
}

function describeStep(step: PipelineStep): string {
  switch (step.type) {
    case 'join':
      return `join ${step.right_id} on ${step.left_time_col} ~ ${step.right_time_col}`
    case 'impute':
      return `impute ${step.column} (${step.method})`
    case 'filter':
      return `filter ${step.expr}`
    case 'select':
      return `select ${step.columns.join(', ')}`
    default:
      return 'step'
  }
}

export default function StepList({ steps, onRemove }: Props) {
  return (
    <div>
      <h3>ステップ一覧</h3>
      {steps.length === 0 ? (
        <p style={{ fontSize: 13 }}>ステップがありません。</p>
      ) : (
        <div>
          {steps.map((step, idx) => (
            <div key={idx} className="step-item">
              <div>
                <span className="tag">{step.type}</span> {describeStep(step)}
              </div>
              <button type="button" className="secondary" onClick={() => onRemove(idx)}>
                削除
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
