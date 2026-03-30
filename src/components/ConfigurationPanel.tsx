import React, { useState } from 'react'
import { StockOption } from '../utils/cuttingAlgorithm'

interface ConfigProps {
  stocks: StockOption[];
  setStocks: React.Dispatch<React.SetStateAction<StockOption[]>>;
}

export default function ConfigurationPanel({ stocks, setStocks }: ConfigProps) {
  const [newLength, setNewLength] = useState<string>('')

  const handleToggle = (id: string) => {
    setStocks(prev => prev.map(s => s.id === id ? { ...s, selected: !s.selected } : s))
  }

  const handleRemove = (id: string) => {
    setStocks(prev => prev.filter(s => s.id !== id))
  }

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(newLength);
    if (!isNaN(val) && val > 0) {
      setStocks(prev => [...prev, { id: Date.now().toString(), length: val, selected: true }]);
      setNewLength('');
    }
  }

  return (
    <div className="card configuration-panel">
      <div className="card-header">
        <h2>Stock Bar Lengths</h2>
        <span className="badge">Inputs</span>
      </div>
      <div className="card-body">
        <p className="help-text">Select the lengths of stock steel bars you have available.</p>
        <div className="stock-chips">
          {stocks.map(stock => (
            <div key={stock.id} className={`stock-chip ${stock.selected ? 'active' : ''}`}>
              <label className="checkbox-label">
                <input 
                  type="checkbox" 
                  checked={stock.selected} 
                  onChange={() => handleToggle(stock.id)} 
                />
                {stock.length}m
              </label>
              <button className="remove-btn" onClick={() => handleRemove(stock.id)} aria-label="Remove stock">×</button>
            </div>
          ))}
        </div>
        <form className="add-stock-form" onSubmit={handleAdd}>
          <input 
            type="number" 
            step="0.01"
            min="0.1"
            placeholder="e.g. 15.5" 
            value={newLength} 
            onChange={(e) => setNewLength(e.target.value)} 
          />
          <button type="submit" className="btn btn-secondary">Add Length</button>
        </form>
      </div>
    </div>
  )
}
