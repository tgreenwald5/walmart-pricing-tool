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

const MAP_PRICE_COLORS = ["#e8f5e9", "#c8e6c9", "#81c784", "#43a047", "#1b5e20"]


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

// convert a price to a color 
function priceToColor(price, minPrice, maxPrice) {
    if (maxPrice <= minPrice) { // if all prices same
        return MAP_PRICE_COLORS[2];
    }

    const t = (price - minPrice) / (maxPrice - minPrice); // norm
    const idx = Math.floor(t * MAP_PRICE_COLORS.length);
    const clampIdx = Math.max(0, Math.min(MAP_PRICE_COLORS.length - 1, idx)); // clamp to price bounds

    return MAP_PRICE_COLORS[clampIdx];
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

// fetch the avg prices for each state from backend, get their corresponding colors, color map 
async function fetchStatePricesAndColor(map, itemId) {
    const res = await fetch(`/api/summary/latest/state?itemId=${itemId}`);
    const stateToAvgCents = await res.json(); // parse json

    const values = Object.values(stateToAvgCents).map(Number); // extract the avg prices from json
    if (!values.length) {
        return;
    }

    // calc min and max avg prices
    const minAvgCents = Math.min(...values);
    const maxAvgCents = Math.max(...values);

    // map statefp -> color
    const stateToColor = {};
    for (const [statefp, cents] of Object.entries(stateToAvgCents)) {
        stateToColor[String(statefp).padStart(2, "0")] = priceToColor(Number(cents), minAvgCents, maxAvgCents); // pad w 0s if not 2 digits already
    }

    fillStateColors(map, stateToColor);
}

// fetch the avg prices for each county in a state from backend, get their corresponding colors, color map
async function fetchCountyPricesAndColor(map, itemId, statefp) {
    const res = await fetch(`/api/summary/latest/county?itemId=${itemId}&statefp=${statefp}`);
    const countyToAvgCents = await res.json(); // parse json

    const values = Object.values(countyToAvgCents).map(Number); // extract the avg prices from json
    if (!values.length) {
        return;
    }

    // calc min and max avg prices
    const minAvgCents = Math.min(...values);
    const maxAvgCents = Math.max(...values);

    // map county geoid -> color
    const countyToColor = {};
    for (const [geoid, cents] of Object.entries(countyToAvgCents)) {
        countyToColor[String(geoid)] = priceToColor(Number(cents), minAvgCents, maxAvgCents);
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

    map.on("load", () => {
        showStates(map);

        const itemId = 10450115; // CHOOSE ITEM HERE
        fetchStatePricesAndColor(map, itemId)
        map.setPaintProperty(LAYERS.states.fill, "fill-opacity", 0.6); // make sure colors can actually be seen

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