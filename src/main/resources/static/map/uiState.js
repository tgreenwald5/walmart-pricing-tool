import { fetchCountyStoreData } from "./api.js";
import { LAYERS, SELECTED_LAYERS, STORE_POINTS_SOURCE } from "./config.js";

export const uiState = { selectedStateFp: null, selectedStateName: null, selectedCountyGeoid: null, 
    selectedItemId: 10450115, selectedItemName: "Milk, 1 Gallon (Great Value)" };

// set layer visibility
export function setLayerVisibility(map, layerId, visible) {
    map.setLayoutProperty(layerId, "visibility", visible ? "visible" : "none");
}

// set group (both line and fill) visibility 
export function setGroupVisibility(map, group, visible) {
    setLayerVisibility(map, group.line, visible);
    setLayerVisibility(map, group.fill, visible);
}

export function showStates(map) {
    // show states and hide counties
    setGroupVisibility(map, LAYERS.states, true);
    setGroupVisibility(map, LAYERS.counties, false);

    // clear all selected layers
    setLayerVisibility(map, SELECTED_LAYERS.state, false);
    setLayerVisibility(map, SELECTED_LAYERS.county, false);

    // clear selected state and county
    uiState.selectedStateFp = null;
    uiState.selectedCountyGeoid = null;
    uiState.selectedStateName = null;

    // clear filters so the selected layers dont stick
    map.setFilter(SELECTED_LAYERS.state, null);
    map.setFilter(SELECTED_LAYERS.county, null);
}

// show counties but only for selected state
export function showCountiesForState(map, statefp) {
    const stateKey = String(statefp).padStart(2, "0");

    // remove state fill so state as whole cant be clicked
    setLayerVisibility(map, LAYERS.states.line, true);
    setLayerVisibility(map, LAYERS.states.fill, false);

    // show counties but of only of selected state
    setGroupVisibility(map, LAYERS.counties, true);
    map.setFilter(LAYERS.counties.fill, ["==", ["get", "STATEFP"], stateKey]);
    map.setFilter(LAYERS.counties.line, ["==", ["get", "STATEFP"], stateKey]);
    
    // keep track of selections
    uiState.selectedStateFp = stateKey;
    uiState.selectedCountyGeoid = null;

    // reset selected county outline filter
    map.setFilter(SELECTED_LAYERS.county, null);
    setLayerVisibility(map, SELECTED_LAYERS.county, false);
}

// show store markers of a county
export async function showCountyStoreMarkers(map, itemId, countyGeoid) {
    const countyStoreData = await fetchCountyStoreData(itemId, countyGeoid);
    const features = countyStoreData.map(csd => ({
        type: "Feature",
        geometry: {
            type: "Point",
            coordinates: [Number(csd.lon), Number(csd.lat)]
        },
        properties: {
            store_id: csd.storeId,
            city_name: csd.city,
            latest_cents: csd.latestCents,
            observed_date: csd.observedDate
        }
    }));

    const featCollection = { type: "FeatureCollection", features };
    const src = map.getSource(STORE_POINTS_SOURCE.id);
    if (src) {
        src.setData(featCollection);
    }
    setLayerVisibility(map, LAYERS.counties.line, true);
    setLayerVisibility(map, LAYERS.counties.fill, false);
}

// clear store markers county
export function clearCountyStoreMarkers(map) {
    const src = map.getSource(STORE_POINTS_SOURCE.id);
    if (src) {
        src.setData({ type: "FeatureCollection", features: [] });
    }
}

// show selected state with high opacity lines
export function selectStateOutline(map, statefp) {
    const stateKey = String(statefp).padStart(2, "0");
    uiState.selectedStateFp = stateKey;

    map.setFilter(SELECTED_LAYERS.state, ["==", ["get", "STATEFP"], stateKey]);
    setLayerVisibility(map, SELECTED_LAYERS.state, true);
}

// show selected county with high opacity lines
export function selectCountyOutline(map, countyGeoid) {
    const geoidKey = String(countyGeoid);
    uiState.selectedCountyGeoid = geoidKey;
  
    map.setFilter(SELECTED_LAYERS.county, ["==", ["get", "GEOID"], geoidKey]);
    setLayerVisibility(map, SELECTED_LAYERS.county, true);
}

// clear any selected state or county lines
export function clearSelectionOutlines(map) {
    uiState.selectedStateFp = null;
    uiState.selectedCountyGeoid = null;

    map.setFilter(SELECTED_LAYERS.state, null);
    map.setFilter(SELECTED_LAYERS.county, null);

    setLayerVisibility(map, SELECTED_LAYERS.state, false);
    setLayerVisibility(map, SELECTED_LAYERS.county, false);
}