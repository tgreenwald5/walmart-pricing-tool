import { LAYERS, SELECTED_LAYERS, STORE_MARKERS_LAYER } from "./config.js";
import { cache, fetchCountyPricesAndColor, fetchCountyStoreCounts, fetchNationalTrend, fetchCountyTrend, fetchStateTrend, fetchCountyStoreData } from "./api.js";
import { formatCents, formatStoreCount } from "./colors.js";
import { uiState, showStates, showCountiesForState, selectStateOutline, selectCountyOutline, setLayerVisibility, clearSelectionOutlines, showCountyStoreMarkers, clearCountyStoreMarkers } from "./uiState.js";
import { updateTrendChart } from "./chart.js";


// hover popup card, cursor changes, and click zoom
export function registerMapEvents(map) {
    // change cursor so states and counties look more clickable
    map.on("mouseenter", LAYERS.states.fill, () => {
        map.getCanvas().style.cursor = "pointer";
    });
    map.on("mouseleave", LAYERS.states.fill, () => {
        map.getCanvas().style.cursor = "";
    });

    map.on("mouseenter", LAYERS.counties.fill, () => {
        map.getCanvas().style.cursor = "pointer";
    });
    map.on("mouseleave", LAYERS.counties.fill, () => {
        map.getCanvas().style.cursor = "";
    });

    // hover pop up
    const hoverPopup = new mapboxgl.Popup({
        closeButton: false,
        closeOnClick: false,
        offset: 12
    });

    // show avg price and store count when hovering over state
    map.on("mousemove", LAYERS.states.fill, (e) => {
        const feature = e.features && e.features[0];
        if (!feature) {
            return;
        }

        const stateName = String(feature.properties.NAME);
        const statefp = String(feature.properties.STATEFP).padStart(2, "0");

        // get avg price and and store count from cache
        const stateToAvgCents = cache.itemToStateAvgCents[uiState.selectedItemId] || {};
        const stateToStoreCount = cache.itemToStateStoreCount[uiState.selectedItemId] || {};
        const avgCents = stateToAvgCents[statefp];
        const storeCount = stateToStoreCount[statefp];

        // popup card wit states name, avg price of item, and number of stores with that item
        hoverPopup
            .setLngLat(e.lngLat)
            .setHTML(
            `<div style="font-size:12px">
                <div><u><b>${stateName}</b></u></div>
                <div>Latest Average Price: ${formatCents(avgCents)}</div>
                <div>Number of Stores With Item: ${formatStoreCount(storeCount)}</div>
            </div>`).addTo(map);
    });

    map.on("mouseleave", LAYERS.states.fill, () => {
        hoverPopup.remove();
    });

    // show avg price and store count when hovering over county
    map.on("mousemove", LAYERS.counties.fill, (e) => {
        const feature = e.features && e.features[0];
        if (!feature) {
            return;
        }
        
        const stateKey = uiState.selectedStateFp;
        if (!stateKey) {
            return;
        }

        // get the hovered over countys name and geoid
        const countyName = String(feature.properties.NAMELSAD);
        const geoid = String(feature.properties.GEOID);

        // get avg price and and store count from cache
        const countyToAvgCents = (cache.itemAndStateToCountyAvgCents[uiState.selectedItemId] && cache.itemAndStateToCountyAvgCents[uiState.selectedItemId][stateKey]) || {};
        const countyToStoreCount = (cache.itemAndStateToCountyStoreCount[uiState.selectedItemId] && cache.itemAndStateToCountyStoreCount[uiState.selectedItemId][stateKey]) || {};
        const avgCents = countyToAvgCents[geoid];
        const storeCount = countyToStoreCount[geoid];

        // popup card with countys name, avg price of item, and number of stores with that item
        hoverPopup
            .setLngLat(e.lngLat)
            .setHTML(
            `<div style="font-size:12px">
                <div><u><b>${countyName}</b></u></div>
                <div>Latest Average Price: ${formatCents(avgCents)}</div>
                <div>Number of Stores With Item: ${formatStoreCount(storeCount)}</div>
            </div>`
            ).addTo(map);
    });

    map.on("mouseleave", LAYERS.counties.fill, () => {
        hoverPopup.remove();
    });

    map.on("mousemove", STORE_MARKERS_LAYER.id , (e) => {
        const feature = e.features && e.features[0];
        if (!feature) {
            return;
        }

        const cityName = feature.properties.city_name;
        const latestCents = feature.properties.latest_cents;
        const storeId = feature.properties.store_id;
        const observedDate = feature.properties.observed_date

        const storeForm = `${cityName}, ${uiState.selectedStateName} | Store #: ${storeId}`;
        console.log(observedDate);

        hoverPopup
            .setLngLat(e.lngLat)
            .setHTML(
            `<div style="font-size:12px">
                <div><u><b>${storeForm}</b></u></div>
                <div>Latest Price: ${formatCents(latestCents)}</div>
                <div>Last Updated On: ${observedDate}</div>
            </div>`
            ).addTo(map);

    });

    map.on("mouseleave", STORE_MARKERS_LAYER.id, () => {
        hoverPopup.remove();
    });

    // click on state to show selected lines and zoom into its counties
    map.on("click", LAYERS.states.fill, async (e) => {
        const feature = e.features && e.features[0];
        if (!feature) {
            return;
        }

        // clear any prev county selection lines
        setLayerVisibility(map, SELECTED_LAYERS.county, false);
        map.setFilter(SELECTED_LAYERS.county, null);

        uiState.selectedStateName = String(feature.properties.NAME);

        const stateKey = String(feature.properties.STATEFP).padStart(2, "0");

        // show selected state outline
        selectStateOutline(map, stateKey);

        // filter to just counties for selected state
        showCountiesForState(map, stateKey);

        // make sure county fills are visible
        map.setPaintProperty(LAYERS.counties.fill, "fill-opacity", 0.6);

        // zoom in on selected state
        const bounds = getFeatureBounds(feature);
        map.fitBounds(bounds, {
            padding: 40,
            duration: 800,
            maxZoom: 7
        });

        // fetch avg prices and store counts and color counties
        await fetchCountyPricesAndColor(map, uiState.selectedItemId, stateKey);
        await fetchCountyStoreCounts(uiState.selectedItemId, stateKey);

        const stateTrend = await fetchStateTrend(uiState.selectedItemId, stateKey);
        updateTrendChart(window.__trendChart, stateTrend, uiState.selectedStateName, uiState.selectedItemName);
    });

    // click on a county to show selected outlines and store markers
    map.on("click", LAYERS.counties.fill, async (e) => {
        const feature = e.features && e.features[0];
        if (!feature) {
            return;
        }

        const countyName = String(feature.properties.NAMELSAD);
        
        const countyKey = String(feature.properties.GEOID);
        uiState.selectedCountyGeoid = countyKey;

        selectCountyOutline(map, countyKey);

        const bounds = getFeatureBounds(feature);
        map.fitBounds(bounds, {
            padding: 20,
            duration: 800,
            maxZoom: 9
        });

        showCountyStoreMarkers(map, uiState.selectedItemId, countyKey);

        const countyTrend = await fetchCountyTrend(uiState.selectedItemId, countyKey);
        const countyAndState = countyName + ", " + uiState.selectedStateName;
        updateTrendChart(window.__trendChart, countyTrend, countyAndState, uiState.selectedItemName);
    });

    /*
    map.on("click", STORE_MARKERS_LAYER.id, async (e) => {
        const feature = e.features && e.features[0];
        if (!feature) {
            return;
        }

    })
    */

    map.on("click", async (e) => {
        const hits = map.queryRenderedFeatures(e.point, {
            layers: [LAYERS.states.fill, LAYERS.counties.fill]
        });

        // go back to all states view on blank space click
        if (hits.length === 0 && uiState.selectedStateFp !== null) {
            hoverPopup.remove();

            clearSelectionOutlines(map); // clear selected lines and filters

            clearCountyStoreMarkers(map); // clear county store markers

            showStates(map);

            // re add state fill opacity
            map.setPaintProperty(LAYERS.states.fill, "fill-opacity", 0.6);
            
            const nationalTrend = await fetchNationalTrend(uiState.selectedItemId);
            updateTrendChart(window.__trendChart, nationalTrend, "National (All U.S. States)", uiState.selectedItemName);
        }
    });
}

// get bounds of state or county for zoom in
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
