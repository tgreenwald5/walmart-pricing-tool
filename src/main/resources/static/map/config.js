export const STYLE_URL = "mapbox://styles/greenwaldtaylor/cmk6lyxgz003w01sddexf2who";

// normal layers
export const LAYERS = {
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
export const SELECTED_LAYERS = {
    state: "us-states-selected-lines",
    county: "us-counties-selected-lines"
};

// data source for store markers
export const STORE_POINTS_SOURCE = {
    id: "store-points",
    source: {
        type: "geojson",
        data: {
            type: "FeatureCollection",
            features: []
        }
    }
};

// layer to display store location markers
export const STORE_MARKERS_LAYER = {
    id: "store-markers",
    type: "circle",
    source: "store-points",
    paint: {
        "circle-radius": 5,
        "circle-color": "#ffffff",
        "circle-stroke-width": 2,
        "circle-stroke-color": "#111111",
        "circle-opacity": 0.95
    }
};

// blue(cheap) -> white(median) -> red(expensive)
export const MAP_PRICE_COLORS = ["#053061","#2166ac","#4393c3","#92c5de","#d1e5f0","#f7f7f7","#fddbc7","#f4a582","#d6604d","#b2182b","#67001f"];
export const NO_DATA_COLOR = "#828282";