export interface PartRequest {
  id: string;
  name: string;
  length: number;
  quantity: number;
}

export interface StockOption {
  id: string;
  length: number;
  selected: boolean;
}

export interface CutPattern {
  stockLength: number;
  cuts: { partName: string; length: number; count: number }[];
  waste: number;
  count: number;
}

export interface CutResult {
  patterns: CutPattern[];
  totalBarsNeeded: number;
  totalWaste: number;
  totalLengthUsed: number;
  wastePercentage: number;
  stockCounts: Record<number, number>;
}

// Greedily fill a single bar of `stockLength` with standard Best-Fit Decreasing
function fillSingleBar(stockLength: number, remainingParts: {name: string, length: number}[]) {
  let remainingSpace = stockLength;
  const usedParts: {name: string, length: number}[] = [];
  const unusedParts: {name: string, length: number}[] = [];

  for (const part of remainingParts) {
    if (part.length <= remainingSpace) {
      usedParts.push(part);
      remainingSpace -= part.length;
    } else {
      unusedParts.push(part);
    }
  }

  return { usedParts, unusedParts, waste: remainingSpace };
}

export function calculateCuts(partsRequest: PartRequest[], stocks: StockOption[]): CutResult {
  const activeStocks = stocks.filter(s => s.selected).sort((a, b) => b.length - a.length);
  if (activeStocks.length === 0 || partsRequest.length === 0) {
    return { patterns: [], totalBarsNeeded: 0, totalWaste: 0, totalLengthUsed: 0, wastePercentage: 0, stockCounts: {} };
  }

  // 1. Flatten all parts
  let allParts: {name: string, length: number}[] = [];
  partsRequest.forEach(req => {
    for (let i = 0; i < req.quantity; i++) {
      allParts.push({ name: req.name, length: req.length });
    }
  });

  // 2. Sort parts strictly descending
  allParts.sort((a, b) => b.length - a.length);

  const rawBars: { stock: number, cuts: {name: string, length: number}[], waste: number }[] = [];

  // Edge case: max part length > max stock length
  const maxStock = activeStocks[0].length;
  if (allParts.length > 0 && allParts[0].length > maxStock) {
    throw new Error(`Part length (${allParts[0].length}) exceeds maximum selected stock length (${maxStock}).`);
  }

  while (allParts.length > 0) {
    let bestStockDetails = null;

    // Evaluate each stock option to see which packs the highest percentage
    for (const stock of activeStocks) {
      if (stock.length < allParts[0].length) continue; // Can't even hold the biggest item

      const { usedParts, unusedParts, waste } = fillSingleBar(stock.length, allParts);
      const wastePercentage = waste / stock.length;

      if (!bestStockDetails || wastePercentage < bestStockDetails.wastePercentage) {
        bestStockDetails = { stock: stock.length, usedParts, unusedParts, waste, wastePercentage };
      }
    }

    if (!bestStockDetails) {
      throw new Error("Unable to pack remaining items.");
    }

    rawBars.push({ stock: bestStockDetails.stock, cuts: bestStockDetails.usedParts, waste: bestStockDetails.waste });
    allParts = bestStockDetails.unusedParts;
  }

  // Group identical bars into "Patterns"
  const patternsObj: Record<string, CutPattern> = {};
  rawBars.forEach(bar => {
    // tally cuts
    const cutsTally: Record<string, {partName: string, length: number, count: number}> = {};
    bar.cuts.forEach(c => {
      const key = `${c.name}|${c.length}`;
      if (!cutsTally[key]) cutsTally[key] = { partName: c.name, length: c.length, count: 0 };
      cutsTally[key].count++;
    });
    
    const cutsArray = Object.values(cutsTally).sort((a, b) => b.length - a.length);
    // stringify for signature
    const signature = `stock:${bar.stock};cuts:${cutsArray.map(c => `${c.count}x${c.length}`).join(',')}`;
    if (!patternsObj[signature]) {
      patternsObj[signature] = {
        stockLength: bar.stock,
        waste: bar.waste,
        count: 0,
        cuts: cutsArray
      };
    }
    patternsObj[signature].count++;
  });

  const patterns = Object.values(patternsObj);
  patterns.sort((a, b) => b.count - a.count); // most frequent first

  const stockCounts: Record<number, number> = {};
  let totalBarsNeeded = 0;
  let totalWaste = 0;
  let totalLengthUsed = 0;

  patterns.forEach(p => {
    totalBarsNeeded += p.count;
    totalWaste += (p.waste * p.count);
    totalLengthUsed += (p.stockLength * p.count);
    stockCounts[p.stockLength] = (stockCounts[p.stockLength] || 0) + p.count;
  });

  const wastePercentage = totalLengthUsed > 0 ? (totalWaste / totalLengthUsed) * 100 : 0;

  return { patterns, totalBarsNeeded, totalWaste, totalLengthUsed, wastePercentage, stockCounts };
}

export function findBetterAlternative(partsRequest: PartRequest[], allStocks: StockOption[], currentResult: CutResult): { suggestedStock: number, newResult: CutResult } | null {
  if (partsRequest.length === 0 || allStocks.length === 0) return null;
  
  let bestAlt: { suggestedStock: number, newResult: CutResult } | null = null;

  // Try calculating with EACH individual stock length by itself to see if it yields better waste %
  // compared to the current selection.
  for (const stock of allStocks) {
    try {
      const mockStocks = [{ ...stock, selected: true }];
      const altResult = calculateCuts(partsRequest, mockStocks);
      
      // We consider it "better" if the absolute waste is less, OR if waste percentage is significantly lower (>1% lower)
      if (altResult.totalWaste < currentResult.totalWaste) {
        if (!bestAlt || altResult.totalWaste < bestAlt.newResult.totalWaste) {
          bestAlt = { suggestedStock: stock.length, newResult: altResult };
        }
      }
    } catch (e) {
      // ignore if this stock length can't fit some parts
    }
  }

  return bestAlt;
}
