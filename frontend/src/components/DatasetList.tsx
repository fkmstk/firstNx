import type { DatasetMeta } from '../types'

type Props = {
  datasets: DatasetMeta[]
  selectedId?: string
  onSelect: (id: string) => void
}

export default function DatasetList({ datasets, selectedId, onSelect }: Props) {
  return (
    <div>
      <h3>データセット</h3>
      {datasets.length === 0 ? (
        <p style={{ fontSize: 13 }}>まだアップロードされていません。</p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {datasets.map((dataset) => (
            <li key={dataset.id} style={{ marginBottom: 8 }}>
              <button
                type="button"
                className={dataset.id === selectedId ? '' : 'secondary'}
                onClick={() => onSelect(dataset.id)}
              >
                {dataset.filename}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
