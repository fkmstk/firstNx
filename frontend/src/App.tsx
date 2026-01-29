import { useEffect, useMemo, useState } from 'react'
import {
  downloadJobResult,
  getJob,
  getJobResultPreview,
  getPreview,
  listDatasets,
  runPipeline,
  uploadCsv,
} from './api/client'
import type { DatasetMeta, JobStatus, PreviewResponse } from './types'
import { usePipeline } from './state/usePipeline'
import UploadPanel from './components/UploadPanel'
import DatasetList from './components/DatasetList'
import PreviewTable from './components/PreviewTable'
import StepList from './components/StepList'
import StepEditor from './components/StepEditor'
import RunPanel from './components/RunPanel'
import ChartPanel from './components/ChartPanel'
import AnalysisPanel from './components/AnalysisPanel'

export default function App() {
  const [datasets, setDatasets] = useState<DatasetMeta[]>([])
  const [selectedDatasetId, setSelectedDatasetId] = useState<string | undefined>()
  const [preview, setPreview] = useState<PreviewResponse | null>(null)
  const [jobPreview, setJobPreview] = useState<PreviewResponse | null>(null)
  const [job, setJob] = useState<JobStatus | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const { steps, addStep, removeStep } = usePipeline()

  const refreshDatasets = async () => {
    const list = await listDatasets()
    setDatasets(list)
    return list
  }

  useEffect(() => {
    refreshDatasets().catch((err) => setError(err.message))
  }, [])

  useEffect(() => {
    if (!selectedDatasetId) return
    setLoading(true)
    setError(null)
    getPreview(selectedDatasetId)
      .then((data) => setPreview(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [selectedDatasetId])

  useEffect(() => {
    if (!job || (job.status !== 'running' && job.status !== 'queued')) return
    const timer = setInterval(async () => {
      try {
        const updated = await getJob(job.id)
        setJob(updated)
        if (updated.status === 'done') {
          const result = await getJobResultPreview(updated.id)
          setJobPreview(result)
        }
      } catch (err) {
        setError((err as Error).message)
      }
    }, 1000)
    return () => clearInterval(timer)
  }, [job])

  const handleUpload = async (file: File) => {
    setLoading(true)
    setError(null)
    try {
      const dataset = await uploadCsv(file)
      const list = await refreshDatasets()
      setSelectedDatasetId(dataset.id)
      if (!list.find((item) => item.id === dataset.id)) {
        setDatasets([...list, dataset])
      }
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  const handleRun = async () => {
    if (!selectedDatasetId) return
    setLoading(true)
    setError(null)
    try {
      const jobStatus = await runPipeline(selectedDatasetId, steps)
      setJob(jobStatus)
      setJobPreview(null)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  const chartPreview = useMemo(() => jobPreview ?? preview, [jobPreview, preview])

  return (
    <div className="container">
      <div className="header">
        <div>
          <h1 style={{ margin: 0 }}>ETL Tool</h1>
          <p style={{ margin: 0, fontSize: 13, color: '#6b7280' }}>
            CSVの前処理と分析をローカルで高速に行う
          </p>
        </div>
        <span className="badge">ローカルモード</span>
      </div>

      {error && <div style={{ color: '#b91c1c', marginBottom: 8 }}>{error}</div>}

      <div className="grid two">
        <div className="card">
          <UploadPanel onUpload={handleUpload} busy={loading} />
          <div style={{ marginTop: 12 }}>
            <DatasetList
              datasets={datasets}
              selectedId={selectedDatasetId}
              onSelect={(id) => {
                setSelectedDatasetId(id)
                setJobPreview(null)
              }}
            />
          </div>
        </div>
        <div className="card">
          <PreviewTable title="入力プレビュー" preview={preview} />
        </div>
      </div>

      <div className="grid two" style={{ marginTop: 16 }}>
        <div className="card">
          <StepEditor datasets={datasets} onAdd={addStep} />
          <div style={{ marginTop: 12 }}>
            <StepList steps={steps} onRemove={removeStep} />
          </div>
        </div>
        <div className="card">
          <RunPanel job={job} onRun={handleRun} onDownload={() => job && downloadJobResult(job.id)} />
          <div style={{ marginTop: 12 }}>
            <PreviewTable title="結果プレビュー" preview={jobPreview} />
          </div>
        </div>
      </div>

      <div className="grid two" style={{ marginTop: 16 }}>
        <div className="card">
          <ChartPanel preview={chartPreview} />
        </div>
        <div className="card">
          <AnalysisPanel datasetId={selectedDatasetId} columns={preview?.columns ?? []} />
        </div>
      </div>
    </div>
  )
}
