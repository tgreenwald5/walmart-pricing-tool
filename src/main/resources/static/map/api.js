import { calcPriceMedian, priceToColor, fillStateColors, fillCountyColors, calcQuantile } from "./colors.js";

// mem caches
export const cache = {itemToStateAvgCents: {}, itemAndStateToCountyAvgCents: {}, itemToStateStoreCount: {}, itemAndStateToCountyStoreCount: {}};

// fetch latest store counts (that has item) by state
export async function fetchStateStoreCounts(itemId) {
    if (cache.itemToStateStoreCount[itemId]) { // if state store count already in cache use that
        return cache.itemToStateStoreCount[itemId];
    }

    const res = await fetch(`/api/summary/latest/state/store-count?itemId=${itemId}`);
    const stateToStoreCount = await res.json();

    cache.itemToStateStoreCount[itemId] = stateToStoreCount; // add state store count to cache
    return stateToStoreCount;
}

// fetch latest store counts (that has item) by counties within selected state 
export async function fetchCountyStoreCounts(itemId, statefp) {
    const stateKey = String(statefp).padStart(2, "0");

    if (cache.itemAndStateToCountyStoreCount[itemId] && cache.itemAndStateToCountyStoreCount[itemId][stateKey]) { // if county store count in cache use that 
        return cache.itemAndStateToCountyStoreCount[itemId][stateKey];
    }

    const res = await fetch(`/api/summary/latest/county/store-count?itemId=${itemId}&statefp=${stateKey}`);
    const countyToStoreCount = await res.json();
    
    if (!cache.itemAndStateToCountyStoreCount[itemId]) {
        cache.itemAndStateToCountyStoreCount[itemId] = {};
    }
    cache.itemAndStateToCountyStoreCount[itemId][stateKey] = countyToStoreCount; // add county store count to cache

    return countyToStoreCount;
}

// fetch latest state prices and use them to color map
export async function fetchStatePricesAndColor(map, itemId) {
    if (cache.itemToStateAvgCents[itemId]) { // if latest state item avg price already in cache use that
        const stateToAvgCents = cache.itemToStateAvgCents[itemId];
        colorStates(map, stateToAvgCents);
        return stateToAvgCents;
    }

    const res = await fetch(`/api/summary/latest/state?itemId=${itemId}`);
    const stateToAvgCents = await res.json();

    cache.itemToStateAvgCents[itemId] = stateToAvgCents; // add latest state item avg price to cache

    colorStates(map, stateToAvgCents); // add price colors to states
    return stateToAvgCents;
}

// fetch latest county prices and use them to color map
export async function fetchCountyPricesAndColor(map, itemId, statefp) {
    const stateKey = String(statefp).padStart(2, "0");

    if (cache.itemAndStateToCountyAvgCents[itemId] && cache.itemAndStateToCountyAvgCents[itemId][stateKey]) { // if latest county item avg price already in cache use that
        const countyToAvgCents = cache.itemAndStateToCountyAvgCents[itemId][stateKey];
        colorCounties(map, countyToAvgCents); // add price colors to counties
        return countyToAvgCents;
    }

    const res = await fetch(`/api/summary/latest/county?itemId=${itemId}&statefp=${stateKey}`);
    const countyToAvgCents = await res.json();

    if (!cache.itemAndStateToCountyAvgCents[itemId]) { // initalize if needed
        cache.itemAndStateToCountyAvgCents[itemId] = {};
    }
    cache.itemAndStateToCountyAvgCents[itemId][stateKey] = countyToAvgCents; // add latest county item avg price to cache
    
    colorCounties(map, countyToAvgCents); // add price colors to counties
    return countyToAvgCents;
}

// calc min, median, and max price for state prices, convert them them to colors, and color states
function colorStates(map, stateToAvgCents) {
    const avgPriceVals = Object.values(stateToAvgCents).map(Number).filter(Number.isFinite); // extract the avg prices from json
    if (!avgPriceVals.length) {
        return;
    }

    const minAvgCents = calcQuantile(avgPriceVals, 0.05);
    const maxAvgCents = calcQuantile(avgPriceVals, 0.95)
    const medianAvgCents = calcPriceMedian(avgPriceVals);

    // map statefp -> color
    const stateToColor = {};
    for (const [statefp, avgCents] of Object.entries(stateToAvgCents)) {
        stateToColor[String(statefp).padStart(2, "0")] = priceToColor(Number(avgCents), minAvgCents, medianAvgCents, maxAvgCents);
    }

    fillStateColors(map, stateToColor);
}

// calc min, median, and max price for county prices, convert them them to colors, and color counties
function colorCounties(map, countyToAvgCents) {
    const avgPriceVals = Object.values(countyToAvgCents).map(Number).filter(Number.isFinite);
    if (!avgPriceVals.length) {
        return;
    }

    // calc min and max avg prices
    const minAvgCents = calcQuantile(avgPriceVals, 0.05);
    const maxAvgCents = calcQuantile(avgPriceVals, 0.95)
    const medianAvgCents = calcPriceMedian(avgPriceVals);

    // map county geoid -> color
    const countyToColor = {};
    for (const [geoid, avgCents] of Object.entries(countyToAvgCents)) {
        countyToColor[geoid] = priceToColor(Number(avgCents), minAvgCents, medianAvgCents, maxAvgCents);
    }

    fillCountyColors(map, countyToColor);
}