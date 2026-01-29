import { useRef, useState } from 'react'

type Props = {
  onUpload: (file: File) => void
  busy?: boolean
}

export default function UploadPanel({ onUpload, busy }: Props) {
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement | null>(null)

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return
    onUpload(files[0])
  }

  return (
    <div
      className="drag-area"
      style={{ borderColor: dragging ? '#2563eb' : undefined }}
      onDragOver={(e) => {
        e.preventDefault()
        setDragging(true)
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault()
        setDragging(false)
        handleFiles(e.dataTransfer.files)
      }}
    >
      <p>CSVをドラッグ&ドロップ</p>
      <p style={{ fontSize: 12, color: '#6b7280' }}>またはファイル選択</p>
      <button
        type="button"
        className="secondary"
        onClick={() => inputRef.current?.click()}
        disabled={busy}
      >
        ファイルを選択
      </button>
      <input
        ref={inputRef}
        type="file"
        accept=".csv,text/csv"
        style={{ display: 'none' }}
        onChange={(e) => handleFiles(e.target.files)}
      />
    </div>
  )
}
