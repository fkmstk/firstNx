declare module 'react-plotly.js/factory' {
  import type { ComponentType } from 'react'
  const createPlotlyComponent: (plotly: any) => ComponentType<any>
  export default createPlotlyComponent
}

declare module 'plotly.js-basic-dist' {
  const Plotly: any
  export default Plotly
}
