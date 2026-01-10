const STYLE_URL = "mapbox://styles/greenwaldtaylor/cmk6lyxgz003w01sddexf2who";

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

// set layer visibility
function setLayerVisibility(map, layerId, visible) {
    map.setLayoutProperty(layerId, "visibility", visible ? "visible" : "none");
}

// set group (both line and fill) visibility 
function setGroupVisibility(map, group, visible) {
    setLayerVisibility(map, group.line, visible);
    setLayerVisibility(map, group.fill, visible);
}


let selectedStateKey = null;

function showStates(map) {
    selectedStateKey = null;

    // show states and hide counties
    setGroupVisibility(map, LAYERS.counties, false)
    setGroupVisibility(map, LAYERS.states, true);

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
            //console.log("state data:", feature.properties); debug

            const stateKey = feature.properties.STATEFP; // get fips code state clicked on
            selectedStateKey = stateKey;

            const countyFilter = ["==", ["get", "STATEFP"], stateKey]; // filter to only show counties from clicked state

            showCountiesForState(map, countyFilter);

        });

        // a county is clicked on
        map.on("click", LAYERS.counties.fill, (e) => {
            const feature = e.features && e.features[0];
            if (!feature) {
                return;
            }
            //console.log("county data:", feature.properties); debug
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