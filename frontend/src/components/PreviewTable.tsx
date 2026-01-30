import type { PreviewResponse } from '../types'

type Props = {
  preview?: PreviewResponse | null
  title?: string
}

export default function PreviewTable({ preview, title }: Props) {
  if (!preview) {
    return <p className="text-muted">プレビューがありません。</p>
  }

  return (
    <div>
      {title && <h3>{title}</h3>}
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              {preview.columns.map((col) => (
                <th key={col}>{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {preview.rows.map((row, idx) => (
              <tr key={idx}>
                {preview.columns.map((col) => (
                  <td key={col}>{String(row[col] ?? '')}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
