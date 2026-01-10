const STYLE_URL = "mapbox://styles/greenwaldtaylor/cmk6lyxgz003w01sddexf2who";

// default lines and fills
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

// lines of selected states and counties (higher opacity)
const SELECTED_LAYERS = {
    state: "us-states-selected-lines",
    county: "us-counties-selected-lines"
};

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
}

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

            const countyFilter = ["==", ["get", "STATEFP"], stateKey]; // filter to only show counties from clicked state

            // show selected state line
            setLayerVisibility(map, SELECTED_LAYERS.state, true);
            map.setFilter(SELECTED_LAYERS.state, ["==", ["get", "STATEFP"], stateKey]);

            // clear any county selected line
            setLayerVisibility(map, SELECTED_LAYERS.county, false);
            map.setFilter(SELECTED_LAYERS.county, false);
            
            const bounds = getFeatureBounds(feature);
            map.fitBounds(bounds, {
                padding: 40,
                duration: 800,
                maxZoom: 7
            })

            showCountiesForState(map, countyFilter);

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