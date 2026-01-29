import type { JobStatus } from '../types'

type Props = {
  job?: JobStatus | null
  onRun: () => void
  onDownload: () => void
}

export default function RunPanel({ job, onRun, onDownload }: Props) {
  const running = job?.status === 'running' || job?.status === 'queued'
  const progress = Math.min(100, Math.round((job?.progress ?? 0) * 100))

  return (
    <div>
      <h3>実行</h3>
      <button type="button" onClick={onRun} disabled={running}>
        パイプライン実行
      </button>
      {job && (
        <div style={{ marginTop: 8 }}>
          <div className="progress">
            <div style={{ width: `${progress}%` }} />
          </div>
          <p style={{ fontSize: 12, margin: '4px 0' }}>
            {job.status} {job.message ? `- ${job.message}` : ''}
          </p>
          {job.status === 'done' && (
            <button type="button" className="secondary" onClick={onDownload}>
              結果CSVをダウンロード
            </button>
          )}
        </div>
      )}
    </div>
  )
}
