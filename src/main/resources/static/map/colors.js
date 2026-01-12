import { MAP_PRICE_COLORS, NO_DATA_COLOR, LAYERS } from "./config.js";

// clamp val to bounds
export function clamp(idx, min, max) {
    return Math.max(min, Math.min(idx, max));
}


// calc median of prices
export function calcPriceMedian(prices) {
    if (!prices.length) {
        return 0;
    }

    const sortedPrices = prices.slice().sort((a, b) => a - b);
    const midIdx = Math.floor(sortedPrices.length / 2);

    if (sortedPrices.length % 2 == 1) {
        return sortedPrices[midIdx]
    } else {
        return (sortedPrices[midIdx - 1] + sortedPrices[midIdx]) / 2;
    }
}

// calc quantile so outliers dont flatten colors
export function calcQuantile(prices, quantile) {
    if (!prices.length) {
        return 0;
    }

    const sortedPrices = prices.slice().sort((a, b) => a - b);

    const exactIdx = (sortedPrices.length - 1) * quantile;
    const lowerIdx = Math.floor(exactIdx);
    const upperIdx = Math.min(lowerIdx + 1, sortedPrices.length - 1);

    const interpWeight = exactIdx - lowerIdx;

    const lowerPrice = sortedPrices[lowerIdx];
    const upperPrice = sortedPrices[upperIdx];

    return lowerPrice + interpWeight * (upperPrice - lowerPrice);
}


// convert a price to a color 
export function priceToColor(avgPrice, minAvgPrice, medianAvgPrice, maxAvgPrice) {
    if (!Number.isFinite(avgPrice)) {
        return NO_DATA_COLOR;
    }

    const colorCount = MAP_PRICE_COLORS.length;
    const midColorIdx = Math.floor(colorCount / 2);

    if (maxAvgPrice <= minAvgPrice) {
        return MAP_PRICE_COLORS[midColorIdx];
    }

    if (avgPrice <= medianAvgPrice) {
        const rangeBelowMedian = (medianAvgPrice - minAvgPrice) || 1;
        const norm = (avgPrice - minAvgPrice) / rangeBelowMedian;
        const colorIdx = Math.floor(norm * midColorIdx);
        return MAP_PRICE_COLORS[clamp(colorIdx, 0, midColorIdx)];
    }

    const rangeAboveMedian = (maxAvgPrice - medianAvgPrice) || 1;
    const norm = (avgPrice - medianAvgPrice) / rangeAboveMedian;
    const colorIdx = midColorIdx + Math.floor(norm * (colorCount - 1 - midColorIdx));

    return MAP_PRICE_COLORS[clamp(colorIdx, midColorIdx, colorCount - 1)];
}


// add state price colors to map
export function fillStateColors(map, stateToColor) {
    const matchExpr = ["match", ["get", "STATEFP"]];
    
    for (const [statefp, color] of Object.entries(stateToColor)) {
        matchExpr.push(statefp, color);
    }

    matchExpr.push(NO_DATA_COLOR);

    map.setPaintProperty(LAYERS.states.fill, "fill-color", matchExpr); // add colors to states
}


// add county price colors to map
export function fillCountyColors(map, countyToColor) {
    const matchExpr = ["match", ["get", "GEOID"]];

    for (const [geoid, color] of Object.entries(countyToColor)) {
        matchExpr.push(geoid, color);
    }

    // default if no data for a county
    matchExpr.push(NO_DATA_COLOR);

    map.setPaintProperty(LAYERS.counties.fill, "fill-color", matchExpr); // add colors to counties
}


// format cents to dollars
export function formatCents(cents) {
    if (cents == null || !Number.isFinite(Number(cents))) {
        return "N/A";
    }
    return `$${(Number(cents) / 100).toFixed(2)}`;
}


// format cents to dollars
export function formatStoreCount(count) {
    if (count == null || !Number.isFinite(Number(count))) {
        return "0";
    }
    return Number(count).toString();
}


