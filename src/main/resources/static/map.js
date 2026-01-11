const STYLE_URL = "mapbox://styles/greenwaldtaylor/cmk6lyxgz003w01sddexf2who";

// normal layers
const LAYERS = {
    states: {
        line: "us-states-lines",
        fill: "us-states-fill"
    },
    counties: {
        line: "us-counties-lines",
        fill: "us-counties-fill"
    }
};

// selected layers (higher opacity lines)
const SELECTED_LAYERS = {
    state: "us-states-selected-lines",
    county: "us-counties-selected-lines"
};

// blue(cheap) -> white(median) -> red(expensive)
const MAP_PRICE_COLORS = ["#053061","#2166ac","#4393c3","#92c5de","#d1e5f0","#f7f7f7","#fddbc7","#f4a582","#d6604d","#b2182b","#67001f"];
const NO_DATA_COLOR = "#828282";

// caches for hover lookups
let stateToAvgCentsCache = {};
let countyToAvgCentsCache = {}; // for counties of currently selected state

let stateToStoreCountCache = {};
let countyToStoreCountCache = {}; // for counties of currently selected state


// set layer visibility
function setLayerVisibility(map, layerId, visible) {
    map.setLayoutProperty(layerId, "visibility", visible ? "visible" : "none");
}

// set group (both line and fill) visibility 
function setGroupVisibility(map, group, visible) {
    setLayerVisibility(map, group.line, visible);
    setLayerVisibility(map, group.fill, visible);
}

// vars to store currently selected state and county
let selectedStateKey = null;
let selectedCountyKey = null;

function showStates(map) {
    selectedStateKey = null;

    // clear county caches when states view is entered
    countyToAvgCentsCache = {};
    countyToStoreCountCache = {};

    // show states and hide counties
    setGroupVisibility(map, LAYERS.counties, false)
    setGroupVisibility(map, LAYERS.states, true);

    // clear all selected layers
    setLayerVisibility(map, SELECTED_LAYERS.state, false);
    setLayerVisibility(map, SELECTED_LAYERS.county, false);
    map.setFilter(SELECTED_LAYERS.state, null);
    map.setFilter(SELECTED_LAYERS.county, null);

    // clear county filters
    map.setFilter(LAYERS.counties.line, null);
    map.setFilter(LAYERS.counties.fill, null);

    map.getCanvas().style.cursor = "";
}

function showCountiesForState(map, countyFilter) {
    // remove state fill so state as whole cant be clicked
    setLayerVisibility(map, LAYERS.states.line, true);
    setLayerVisibility(map, LAYERS.states.fill, false);

    // appply the county filter and show the counties
    map.setFilter(LAYERS.counties.line, countyFilter);
    map.setFilter(LAYERS.counties.fill, countyFilter);
    setGroupVisibility(map, LAYERS.counties, true);

    map.setPaintProperty(LAYERS.counties.fill, "fill-opacity", 0.6);
}

// get the bounds of clicked state for zoom in
function getFeatureBounds(feature) {
    const bounds = new mapboxgl.LngLatBounds();
    const coords = feature.geometry.coordinates;

    function extendFromCoordArray(arr) {
        for (const c of arr) {
            if (typeof c[0] === "number" && typeof c[1] === "number") {
                bounds.extend(c);
            } else {
                extendFromCoordArray(c);
            }
        }
    }

    extendFromCoordArray(coords);
    return bounds;
}

// clamp val to bounds
function clamp(idx, min, max) {
    return Math.max(min, Math.min(idx, max));
}

function calcPriceMedian(prices) {
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


// convert a price to a color 
function priceToColor(avgPrice, minAvgPrice, medianAvgPrice, maxAvgPrice) {
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
function fillStateColors(map, stateToColor) {
    const matchExpr = ["match", ["get", "STATEFP"]];
    
    for (const [statefp, color] of Object.entries(stateToColor)) {
        matchExpr.push(statefp, color);
    }

    matchExpr.push("#dddddd");

    map.setPaintProperty(LAYERS.states.fill, "fill-color", matchExpr); // add colors
}

// add county price colors to map
function fillCountyColors(map, countyToColor) {
    const matchExpr = ["match", ["get", "GEOID"]];

    for (const [geoid, color] of Object.entries(countyToColor)) {
        matchExpr.push(geoid, color);
    }

    // default if no data for a county
    matchExpr.push("#dddddd");

    map.setPaintProperty(LAYERS.counties.fill, "fill-color", matchExpr); // add colors
}

// format cents to dollars
function formatCents(cents) {
    if (cents == null || !Number.isFinite(Number(cents))) {
        return "N/A";
    }
    return `$${(Number(cents) / 100).toFixed(2)}`;
}

// format cents to dollars
function formatStoreCount(count) {
    if (count == null || !Number.isFinite(Number(count))) {
        return "0";
    }
    return Number(count).toString();
}

// fetch latest store counts (that has item) by state
async function fetchStateStoreCounts(itemId) {
    const res = await fetch(`/api/summary/latest/state/store-count?itemId=${itemId}`);

    stateToStoreCount = await res.json();
    stateToStoreCountCache = stateToStoreCount;
}

// fetch latest store counts (that has item) by counties within selected state 
async function fetchCountyStoreCounts(itemId, statefp) {
    const res = await fetch(`/api/summary/latest/county/store-count?itemId=${itemId}&statefp=${statefp}`);

    countyToStoreCount = await res.json();
    countyToStoreCountCache = countyToStoreCount;
}

// fetch the avg prices for each state from backend, get their corresponding colors, color map 
async function fetchStatePricesAndColor(map, itemId) {
    const res = await fetch(`/api/summary/latest/state?itemId=${itemId}`);
    const stateToAvgCents = await res.json(); // parse json

    stateToAvgCentsCache = stateToAvgCents; // store states prices avgs in cache

    const avgPriceVals = Object.values(stateToAvgCents).map(Number).filter(Number.isFinite); // extract the avg prices from json
    if (!avgPriceVals.length) {
        return;
    }

    // calc min and max avg prices
    const minAvgCents = Math.min(...avgPriceVals);
    const maxAvgCents = Math.max(...avgPriceVals);
    const medianAvgCents = calcPriceMedian(avgPriceVals);

    // map statefp -> color
    const stateToColor = {};
    for (const [statefp, avgCents] of Object.entries(stateToAvgCents)) {
        stateToColor[String(statefp).padStart(2, "0")] = priceToColor(Number(avgCents), minAvgCents, medianAvgCents, maxAvgCents);
    }

    fillStateColors(map, stateToColor);
}

// fetch the avg prices for each county in a state from backend, get their corresponding colors, color map
async function fetchCountyPricesAndColor(map, itemId, statefp) {
    const res = await fetch(`/api/summary/latest/county?itemId=${itemId}&statefp=${statefp}`);
    const countyToAvgCents = await res.json(); // parse json
    countyToAvgCentsCache = countyToAvgCents; // store selected state counties price avgs in cache

    const avgPriceVals = Object.values(countyToAvgCents).map(Number).filter(Number.isFinite); // extract the avg prices from json
    if (!avgPriceVals.length) {
        return;
    }

    // calc min and max avg prices
    const minAvgCents = Math.min(...avgPriceVals);
    const maxAvgCents = Math.max(...avgPriceVals);
    const medianAvgCents = calcPriceMedian(avgPriceVals);

    // map county geoid -> color
    const countyToColor = {};
    for (const [geoid, avgCents] of Object.entries(countyToAvgCents)) {
        countyToColor[String(geoid)] = priceToColor(Number(avgCents), minAvgCents, medianAvgCents, maxAvgCents);
    }

    fillCountyColors(map, countyToColor);
}


function initMap() {
    mapboxgl.accessToken = window.MAPBOX_TOKEN;

    const map = new mapboxgl.Map({
        container: "map",
        style: STYLE_URL,
        center: [-98.5795, 39.8283],
        zoom: 3
    });

    map.addControl(new mapboxgl.NavigationControl(), "top-right");

    // LOAD MAP
    map.on("load", () => {
        showStates(map);

        const itemId = 10315355; // CHOOSE ITEM HERE
        fetchStatePricesAndColor(map, itemId)
        map.setPaintProperty(LAYERS.states.fill, "fill-opacity", 0.6); // make sure colors can actually be seen

        fetchStateStoreCounts(itemId);

        // give clickable look (states)
        map.on("mouseenter", LAYERS.states.fill, () => {
            map.getCanvas().style.cursor = "pointer";
        });
        map.on("mouseleave", LAYERS.states.fill, () => {
            map.getCanvas().style.cursor = "";
        });

        // give clickable look (counties)
        map.on("mouseenter", LAYERS.counties.fill, () => {
            map.getCanvas().style.cursor = "pointer";
        });
        map.on("mouseleave", LAYERS.counties.fill, () => {
            map.getCanvas().style.cursor = "";
        });

        // pop up card on hover
        const hoverPopup = new mapboxgl.Popup({
            closeButton: false,
            closeOnClick: false,
            offset: 12
        });

        // hover over states to show avg price and store count near cursor
        map.on("mousemove", LAYERS.states.fill, (e) => {
            const feature = e.features && e.features[0];
            if (!feature) {
                return
            }

            const stateName = String(feature.properties.NAME); // name of state hovered
            const statefp = String(feature.properties.STATEFP).padStart(2, "0");

            const avgCents = stateToAvgCentsCache[statefp]; // get state avg price from cache
            const storeCount = stateToStoreCountCache[statefp];

            hoverPopup
                .setLngLat(e.lngLat)
                .setHTML(`<div style="font-size:12px">
                            <div><u><b>${stateName}</b></u></div>
                            <div>Latest Average: ${formatCents(avgCents)}</div>
                            <div>Number of Stores: ${formatStoreCount(storeCount)}</div>
                        </div>`)
                .addTo(map);

        });

        map.on("mouseleave", LAYERS.states.fill, () => {
            hoverPopup.remove();
        });


        // hover over counties to show avg price near cursor
        map.on("mousemove", LAYERS.counties.fill, (e) => {
            const feature = e.features && e.features[0];
            if (!feature) {
                return;
            }

            const countyName = String(feature.properties.NAMELSAD); // name of county hovered
            const geoid = String(feature.properties.GEOID);

            const avgCents = countyToAvgCentsCache[geoid];
            const storeCount = countyToStoreCountCache[geoid];

            hoverPopup
                .setLngLat(e.lngLat)
                .setHTML(`<div style="font-size:12px">
                            <div><u><b>${countyName}</b></u></div>
                            <div>Latest Average: ${formatCents(avgCents)}</div>
                            <div>Number of Stores: ${formatStoreCount(storeCount)}</div>
                        </div>`)
                .addTo(map);
        });

        map.on("mouseleave", LAYERS.counties.fill, () => {
            hoverPopup.remove();
        });

        // a state is clicked on
        map.on("click", LAYERS.states.fill, (e) => {
            const feature = e.features && e.features[0];
            if (!feature) {
                return;
            }
            
            selectedCountyKey = null; // clear selected county

            const stateKey = feature.properties.STATEFP; // get fips code state clicked on
            selectedStateKey = stateKey;

            console.log(feature.properties);

            const countyFilter = ["==", ["get", "STATEFP"], stateKey]; // filter to only show counties from clicked state

            // show selected state line
            setLayerVisibility(map, SELECTED_LAYERS.state, true);
            map.setFilter(SELECTED_LAYERS.state, ["==", ["get", "STATEFP"], stateKey]);

            // clear any county selected line
            setLayerVisibility(map, SELECTED_LAYERS.county, false);
            map.setFilter(SELECTED_LAYERS.county, false);

            // zoom into state
            const bounds = getFeatureBounds(feature);
            map.fitBounds(bounds, {
                padding: 40,
                duration: 800,
                maxZoom: 7
            })

            // show counties and their price colors
            showCountiesForState(map, countyFilter);
            fetchCountyPricesAndColor(map, itemId, stateKey);

            fetchCountyStoreCounts(itemId, stateKey);

        });

        // a county is clicked on
        map.on("click", LAYERS.counties.fill, (e) => {
            const feature = e.features && e.features[0];
            if (!feature) {
                return;
            }
            
            // show selected county line
            const countyKey = feature.properties.GEOID; // get fips code county clicked on
            setLayerVisibility(map, SELECTED_LAYERS.county, true);
            map.setFilter(SELECTED_LAYERS.county, ["==", ["get", "GEOID"], countyKey]);

            selectedCountyKey = countyKey; // store selected countyKey
        });


        // click on empty space to go to states view
        map.on("click", (e) => {
            const hits = map.queryRenderedFeatures(e.point, {
              layers: [LAYERS.states.fill, LAYERS.counties.fill]
            });
            if (hits.length === 0 && selectedStateKey !== null) {
              showStates(map);
            }
        });
        
    });

    return map;
}

initMap();