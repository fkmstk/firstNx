import type {
  AnomalyResult,
  CorrelationResult,
  DatasetMeta,
  JobStatus,
  PipelineStep,
  PreviewResponse,
} from '../types'

const API_BASE = '/api'

async function handle<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const message = await res.text()
    throw new Error(message || 'API error')
  }
  return res.json() as Promise<T>
}

export async function uploadCsv(file: File): Promise<DatasetMeta> {
  const form = new FormData()
  form.append('file', file)
  const res = await fetch(`${API_BASE}/upload`, { method: 'POST', body: form })
  return handle<DatasetMeta>(res)
}

export async function listDatasets(): Promise<DatasetMeta[]> {
  const res = await fetch(`${API_BASE}/datasets`)
  return handle<DatasetMeta[]>(res)
}

export async function getPreview(datasetId: string, limit?: number): Promise<PreviewResponse> {
  const url = new URL(`${API_BASE}/datasets/${datasetId}/preview`, window.location.origin)
  if (limit) url.searchParams.set('limit', String(limit))
  const res = await fetch(url.toString())
  return handle<PreviewResponse>(res)
}

export async function runPipeline(datasetId: string, steps: PipelineStep[]): Promise<JobStatus> {
  const res = await fetch(`${API_BASE}/pipeline/run`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ dataset_id: datasetId, steps }),
  })
  return handle<JobStatus>(res)
}

export async function getJob(jobId: string): Promise<JobStatus> {
  const res = await fetch(`${API_BASE}/jobs/${jobId}`)
  return handle<JobStatus>(res)
}

export async function getJobResultPreview(jobId: string, limit?: number): Promise<PreviewResponse> {
  const url = new URL(`${API_BASE}/jobs/${jobId}/result/preview`, window.location.origin)
  if (limit) url.searchParams.set('limit', String(limit))
  const res = await fetch(url.toString())
  return handle<PreviewResponse>(res)
}

export function downloadJobResult(jobId: string): void {
  window.location.href = `${API_BASE}/jobs/${jobId}/result/download`
}

export async function getCorrelation(
  datasetId: string,
  columns: string[],
): Promise<CorrelationResult> {
  const res = await fetch(`${API_BASE}/analysis/correlation`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ dataset_id: datasetId, columns }),
  })
  return handle<CorrelationResult>(res)
}

export async function getAnomaly(
  datasetId: string,
  timeCol: string,
  valueCol: string,
  contamination: number,
): Promise<AnomalyResult> {
  const res = await fetch(`${API_BASE}/analysis/anomaly`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      dataset_id: datasetId,
      time_col: timeCol,
      value_col: valueCol,
      contamination,
    }),
  })
  return handle<AnomalyResult>(res)
}
