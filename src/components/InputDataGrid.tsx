import React, { useState } from 'react'
import { PartRequest } from '../utils/cuttingAlgorithm'

interface GridProps {
  parts: PartRequest[];
  setParts: React.Dispatch<React.SetStateAction<PartRequest[]>>;
}

interface ShapeTemplate {
  name: string;
  parts: { name: string, qtyPerShape: number }[];
}

const PREDEFINED_SHAPES: Record<string, ShapeTemplate> = {
  'U-Shape': {
    name: 'U-Shape',
    parts: [
      { name: 'Base', qtyPerShape: 1 },
      { name: 'Side (Left)', qtyPerShape: 1 },
      { name: 'Side (Right)', qtyPerShape: 1 }
    ]
  },
  'L-Shape': {
    name: 'L-Shape',
    parts: [
      { name: 'Vertical', qtyPerShape: 1 },
      { name: 'Horizontal', qtyPerShape: 1 }
    ]
  },
  'Straight': {
    name: 'Straight Length',
    parts: [
      { name: 'Piece', qtyPerShape: 1 }
    ]
  }
}

export default function InputDataGrid({ parts, setParts }: GridProps) {
  const [selectedShape, setSelectedShape] = useState<string>('U-Shape')
  const [targetQuantity, setTargetQuantity] = useState<number>(200)

  // Local state for the lengths of each part of the currently selected shape
  const [partLengths, setPartLengths] = useState<Record<string, string>>({})

  const handleAddOrder = () => {
    const shape = PREDEFINED_SHAPES[selectedShape];
    if (!shape) return;

    const newParts: PartRequest[] = shape.parts.map(p => {
      const pLen = parseFloat(partLengths[p.name]);
      if (isNaN(pLen) || pLen <= 0) {
         // ignore invalid inputs safely or throw, but here we just fallback if not careful
         // we'll enforce validity below
      }
      return {
        id: Date.now().toString() + Math.random().toString(),
        name: `${selectedShape} - ${p.name}`,
        length: pLen,
        quantity: targetQuantity * p.qtyPerShape
      }
    }).filter(p => !isNaN(p.length) && p.length > 0);

    if (newParts.length > 0) {
      setParts(prev => [...prev, ...newParts]);
    }
  }

  const handleRemovePart = (id: string) => {
    setParts(prev => prev.filter(p => p.id !== id))
  }

  return (
    <div className="card data-grid-panel">
      <div className="card-header">
        <h2>Order Input Data</h2>
        <span className="badge">Spreadsheet</span>
      </div>
      
      <div className="card-body">
        {/* Order Builder Form */}
        <div className="order-builder">
          <div className="form-group row">
            <div className="col">
              <label>Shape Type</label>
              <select value={selectedShape} onChange={(e) => setSelectedShape(e.target.value)}>
                {Object.keys(PREDEFINED_SHAPES).map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="col">
              <label>Target Quantity</label>
              <input type="number" min="1" value={targetQuantity} onChange={e => setTargetQuantity(parseInt(e.target.value) || 0)} />
            </div>
          </div>

          <div className="shape-parts-grid">
            <div className="grid-header">
              <div>Part Name</div>
              <div>Qty per Shape</div>
              <div>Length (m)</div>
            </div>
            {PREDEFINED_SHAPES[selectedShape]?.parts.map((p, idx) => (
              <div className="grid-row" key={idx}>
                <div>{p.name}</div>
                <div>{p.qtyPerShape}</div>
                <div>
                  <input 
                    type="number" 
                    step="0.01" 
                    placeholder="e.g. 5.0"
                    value={partLengths[p.name] || ''}
                    onChange={(e) => setPartLengths(prev => ({ ...prev, [p.name]: e.target.value }))}
                  />
                </div>
              </div>
            ))}
          </div>

          <button className="btn btn-primary add-order-btn" onClick={handleAddOrder}>Add to Order</button>
        </div>

        <hr className="divider" />

        {/* Global Output Parts Table */}
        <div className="spreadsheet-container">
          <table className="spreadsheet-table">
            <thead>
              <tr>
                <th>Part Description</th>
                <th>Length (m)</th>
                <th>Total Qty</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {parts.length === 0 ? (
                <tr>
                  <td colSpan={4} className="empty-cell">No parts added to the order yet.</td>
                </tr>
              ) : parts.map(part => (
                <tr key={part.id}>
                  <td>{part.name}</td>
                  <td>{part.length.toFixed(2)}</td>
                  <td>{part.quantity}</td>
                  <td className="actions-cell">
                    <button className="btn btn-sm btn-danger" onClick={() => handleRemovePart(part.id)}>Remove</button>
                  </td>
                </tr>
              ))}
            </tbody>
            {parts.length > 0 && (
              <tfoot>
                <tr>
                  <td colSpan={2} style={{textAlign: 'right'}}><strong>Total Pieces to Cut:</strong></td>
                  <td><strong>{parts.reduce((sum, p) => sum + p.quantity, 0)}</strong></td>
                  <td className="actions-cell">
                    <button className="btn btn-sm btn-danger" onClick={() => setParts([])}>Clear All</button>
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>

      </div>
    </div>
  )
}
