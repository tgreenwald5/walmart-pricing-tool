import { calcPriceMedian, priceToColor, fillStateColors, fillCountyColors, calcQuantile } from "./colors.js";

// mem caches
export const cache = {
    // latest data caches
    itemToStateAvgCents: {}, // itemId -> {statefp: avgPriceCents}
    itemAndStateToCountyAvgCents: {}, // itemId -> statefp -> {geoid: avgPriceCents}
    itemToStateStoreCount: {}, // itemId -> {statefp: storeCount}
    itemAndStateToCountyStoreCount: {}, // itemId -> statefp -> {geoid: storeCount}

    // trend caches
    itemToNationalTrend: {}, // itemId -> {data, cachedTime}
    itemAndStateToStateTrend: {}, // itemId -> statefp -> {data, cachedTime}
    itemAndCountyToCountyTrend: {}, // itemId -> countyFips -> {data, cachedTime}
    itemAndStoreToStoreTrend: {}, // itemId -> storeId -> {data, cachedTime}

    // store marker cache
    itemAndCountyToCountyStoreData: {} // itemId -> countyFips -> {data, cachedTime}

};

const TREND_CACHE_LIFESPAN = 10 * 60 * 2000; // mins cache is usable

function isFresh(entry) {
    return !!entry && (Date.now() - entry.cachedTime) < TREND_CACHE_LIFESPAN;
}

function setEntry(obj, key, data) {
    obj[key] = { data, cachedTime: Date.now() };
    return data;
}

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

// fetch county latest store prices for an item
export async function fetchCountyStoreData(itemId, countyFips) {
    const countyKey = String(countyFips).padStart(5, "0");

    if (!cache.itemAndCountyToCountyStoreData[itemId]) {
        cache.itemAndCountyToCountyStoreData[itemId] = {};
    }
    const entry = cache.itemAndCountyToCountyStoreData[itemId][countyKey];
    if (isFresh(entry)) {
        return entry.data;
    }

    const res = await fetch(`/api/summary/latest/county/store-data?itemId=${itemId}&countyFips=${countyKey}`);
    const data = await res.json();
    cache.itemAndCountyToCountyStoreData[itemId][countyKey] = { data, cachedTime: Date.now() };
    return data;
}


// ***** PRICE TRENDS *****

// fetch nationl avg price trend for an item
export async function fetchNationalTrend(itemId) {
    const entry = cache.itemToNationalTrend[itemId];
    if (isFresh(entry)) {
        return entry.data;
    }
    const res = await fetch(`/api/trend/national?itemId=${itemId}`);
    const data = await res.json();
    return setEntry(cache.itemToNationalTrend, itemId, data);
}

// fetch state avg price trend for an item
export async function fetchStateTrend(itemId, statefp) {
    const stateKey = String(statefp).padStart(2, "0");
    if (!cache.itemAndStateToStateTrend[itemId]) {
        cache.itemAndStateToStateTrend[itemId] = {};
    }
    const entry = cache.itemAndStateToStateTrend[itemId][stateKey];
    if (isFresh(entry)) {
        return entry.data;
    }

    const res = await fetch(`/api/trend/state?itemId=${itemId}&statefp=${stateKey}`);
    const data = await res.json();
    cache.itemAndStateToStateTrend[itemId][stateKey] = { data, cachedTime: Date.now() };
    return data;
}

// fetch county avg price trend for an item
export async function fetchCountyTrend(itemId, countyFips) {
    const countyKey = String(countyFips).padStart(5, "0");
    if (!cache.itemAndCountyToCountyTrend[itemId]) {
        cache.itemAndCountyToCountyTrend[itemId] = {};
    }
    const entry = cache.itemAndCountyToCountyTrend[itemId][countyKey];
    if (isFresh(entry)) {
        return entry.data;
    }

    const res = await fetch(`/api/trend/county?itemId=${itemId}&countyFips=${countyKey}`);
    const data = await res.json();
    cache.itemAndCountyToCountyTrend[itemId][countyKey] = { data, cachedTime: Date.now() };
    return data;
}

// fetch county store price trend for an item
export async function fetchCountyStoreTrend(itemId, storeId) {
    const storeKey = String(storeId);

    if (!cache.itemAndStoreToStoreTrend[itemId]) {
        cache.itemAndStoreToStoreTrend[itemId] = {};
    }
    const entry = cache.itemAndStoreToStoreTrend[itemId][storeKey];
    if (isFresh(entry)) {
        return entry.data;
    }

    const res = await fetch(`/api/trend/store?itemId=${itemId}&storeId=${storeKey}`);
    const data = await res.json();
    cache.itemAndStoreToStoreTrend[itemId][storeKey] = { data, cachedTime: Date.now() };
    return data;
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