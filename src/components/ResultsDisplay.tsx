
import { CutResult } from '../utils/cuttingAlgorithm'

interface ResultsProps {
  result: CutResult;
  alternative: { suggestedStock: number; newResult: CutResult } | null;
}

export default function ResultsDisplay({ result, alternative }: ResultsProps) {
  
  return (
    <div className="results-container">
      
      <div className="summary-cards">
        <div className="summary-card">
          <div className="summary-title">Total Bars Needed</div>
          <div className="summary-value">{result.totalBarsNeeded}</div>
          <div className="summary-sub">
            {Object.entries(result.stockCounts).map(([len, count]) => `${count}x ${len}m`).join(' + ')}
          </div>
        </div>
        <div className="summary-card">
          <div className="summary-title">Overall Waste</div>
          <div className="summary-value warning">{result.totalWaste.toFixed(2)}m</div>
          <div className="summary-sub">{result.wastePercentage.toFixed(1)}% of total steel</div>
        </div>
      </div>

      {alternative && (
        <div className="alert alert-success mt-2">
          <strong>Insight:</strong> If you only used <strong>{alternative.suggestedStock}m</strong> stock bars, 
          you would reduce total waste to <strong>{alternative.newResult.totalWaste.toFixed(2)}m</strong> 
          ({alternative.newResult.wastePercentage.toFixed(1)}%).
        </div>
      )}

      <div className="card mt-2 patterns-card">
        <div className="card-header">
          <h2>Cutting Instructions</h2>
          <span className="badge">Optimal Pattern</span>
        </div>
        <div className="card-body">
          <div className="patterns-list">
            {result.patterns.map((p, idx) => (
              <div key={idx} className="pattern-row">
                <div className="pattern-header">
                  <strong>Pattern #{idx + 1}</strong>
                  <span className="pattern-repeats">Repeat {p.count} times</span>
                </div>
                
                <div className="cut-visualizer">
                  <div className="cut-bar">
                    {p.cuts.map((c, cIdx) => (
                      Array.from({length: c.count}).map((_, i) => (
                        <div 
                          key={`${cIdx}-${i}`} 
                          className="cut-segment" 
                          style={{ width: `${(c.length / p.stockLength) * 100}%` }}
                          title={`Piece: ${c.length}m (${c.partName})`}
                        >
                          {c.length}m
                        </div>
                      ))
                    ))}
                    {p.waste > 0 && (
                      <div 
                        className="cut-segment waste" 
                        style={{ width: `${(p.waste / p.stockLength) * 100}%` }}
                        title={`Waste: ${p.waste}m`}
                      >
                      </div>
                    )}
                  </div>
                  <div className="cut-details">
                    Cut from <strong>{p.stockLength}m bar</strong>:{' '}
                    {p.cuts.map(c => <span key={c.partName} className="cut-badge">{c.count}x {c.length}m ({c.partName})</span>)}
                    <span className="waste-badge">Waste: {p.waste.toFixed(2)}m</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  )
}
