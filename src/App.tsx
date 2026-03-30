import { useState } from 'react'
import ConfigurationPanel from './components/ConfigurationPanel'
import InputDataGrid from './components/InputDataGrid'
import ResultsDisplay from './components/ResultsDisplay'
import { PartRequest, StockOption, CutResult, calculateCuts, findBetterAlternative } from './utils/cuttingAlgorithm'

const DEFAULT_STOCKS: StockOption[] = [
  { id: '1', length: 12, selected: false },
  { id: '2', length: 10, selected: true },
  { id: '3', length: 6, selected: false }
]

function App() {
  const [stocks, setStocks] = useState<StockOption[]>(DEFAULT_STOCKS)
  const [parts, setParts] = useState<PartRequest[]>([])

  // Derived state to quickly tell the GUI if it needs recalculation
  const hasInput = parts.length > 0 && stocks.filter(s => s.selected).length > 0;

  let currentResult: CutResult | null = null;
  let alternativeSuggestion: { suggestedStock: number; newResult: CutResult } | null = null;
  let calculationError = null;

  if (hasInput) {
    try {
      currentResult = calculateCuts(parts, stocks);
      if (currentResult && currentResult.totalBarsNeeded > 0) {
        alternativeSuggestion = findBetterAlternative(parts, stocks, currentResult) as any;
      }
    } catch (e: any) {
      calculationError = e.message;
    }
  }

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>Steel Cut Optimizer</h1>
        <p className="subtitle">High-efficiency 1D cutting stock calculator</p>
      </header>

      <div className="main-content">
        <section className="input-section">
          <ConfigurationPanel stocks={stocks} setStocks={setStocks} />
          <br />
          <InputDataGrid parts={parts} setParts={setParts} />
        </section>

        <section className="results-section">
          {calculationError ? (
            <div className="error-banner">
              <strong>Error:</strong> {calculationError}
            </div>
          ) : currentResult && currentResult.patterns.length > 0 ? (
            <ResultsDisplay result={currentResult} alternative={alternativeSuggestion} />
          ) : (
            <div className="card empty-state">
              <div className="empty-state-content">
                <div className="empty-state-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
                  </svg>
                </div>
                <h3>Awaiting Input Data</h3>
                <p>Add stock lengths and shape patterns to generate optimal cutting instructions and minimize your steel waste.</p>
                <div className="empty-state-features">
                  <div className="feature"><span className="feature-icon">✨</span> Optimal Patterns</div>
                  <div className="feature"><span className="feature-icon">📉</span> Minimal Waste</div>
                  <div className="feature"><span className="feature-icon">📦</span> Stock Requirements</div>
                </div>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}

export default App
