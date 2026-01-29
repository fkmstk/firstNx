import { useReducer } from 'react'
import type { PipelineStep } from '../types'

type Action =
  | { type: 'add'; step: PipelineStep }
  | { type: 'update'; index: number; step: PipelineStep }
  | { type: 'remove'; index: number }
  | { type: 'set'; steps: PipelineStep[] }

function reducer(state: PipelineStep[], action: Action): PipelineStep[] {
  switch (action.type) {
    case 'add':
      return [...state, action.step]
    case 'update':
      return state.map((step, idx) => (idx === action.index ? action.step : step))
    case 'remove':
      return state.filter((_, idx) => idx !== action.index)
    case 'set':
      return action.steps
    default:
      return state
  }
}

export function usePipeline() {
  const [steps, dispatch] = useReducer(reducer, [])

  return {
    steps,
    addStep: (step: PipelineStep) => dispatch({ type: 'add', step }),
    updateStep: (index: number, step: PipelineStep) => dispatch({ type: 'update', index, step }),
    removeStep: (index: number) => dispatch({ type: 'remove', index }),
    setSteps: (steps: PipelineStep[]) => dispatch({ type: 'set', steps }),
  }
}
