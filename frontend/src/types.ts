export type ColumnInfo = {
  name: string
  dtype: string
}

export type DatasetMeta = {
  id: string
  filename: string
  path: string
  row_count?: number | null
  columns: ColumnInfo[]
}

export type PreviewResponse = {
  columns: string[]
  rows: Record<string, unknown>[]
}

export type JoinStep = {
  type: 'join'
  left_id?: string | null
  right_id: string
  left_time_col: string
  right_time_col: string
  tolerance_ms?: number | null
  strategy: 'backward' | 'forward' | 'nearest'
}

export type ImputeStep = {
  type: 'impute'
  column: string
  method: 'ffill' | 'bfill' | 'mean' | 'median' | 'zero'
}

export type FilterStep = {
  type: 'filter'
  expr: string
}

export type SelectStep = {
  type: 'select'
  columns: string[]
}

export type PipelineStep = JoinStep | ImputeStep | FilterStep | SelectStep

export type JobStatus = {
  id: string
  status: 'queued' | 'running' | 'done' | 'error'
  progress: number
  message?: string | null
  result?: {
    result_path?: string
    row_count?: number
    columns?: string[]
  } | null
}

export type CorrelationResult = {
  columns: string[]
  matrix: number[][]
}

export type AnomalyPoint = {
  index: number
  time: string
  value: number
  score: number
}

export type AnomalyResult = {
  threshold: number
  points: AnomalyPoint[]
}
