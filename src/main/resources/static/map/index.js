import { STYLE_URL, LAYERS, STORE_POINTS_SOURCE, STORE_MARKERS_LAYER } from "./config.js";
import { uiState, showStates } from "./uiState.js";
import { fetchNationalTrend, fetchStatePricesAndColor, fetchStateStoreCounts } from "./api.js";
import { registerMapEvents } from "./events.js";
import { initTrendChart, updateTrendChart } from "./chart.js";

function setupItemNav(map) {
    const buttons = Array.from(document.querySelectorAll(".itemBtn"));

    // just set the chosen item button as active
    function setActive(btn) {
        for (const b of buttons) {
            b.classList.remove("active");
        }
        btn.classList.add("active");
    }

    // mark default selected item as active on load
    for (const b of buttons) {
        const id = Number(b.dataset.itemId);
        if (id === uiState.selectedItemId) {
            setActive(b);
            break;
        } 
    }

    for (const btn of buttons) {
        btn.addEventListener("click", async () => {
            const itemId = Number(btn.dataset.itemId);

            if (itemId === uiState.selectedItemId) {
                return;
            }

            uiState.selectedItemId = itemId;
            uiState.selectedItemName = btn.textContent;

            setActive(btn);

            showStates(map);
            map.setPaintProperty(LAYERS.states.fill, "fill-opacity", 0.6);

            await fetchStatePricesAndColor(map, itemId);
            await fetchStateStoreCounts(itemId);

            const nationalTrend = await fetchNationalTrend(itemId);
            updateTrendChart(window.__trendChart, nationalTrend, "National (All U.S States)", uiState.selectedItemName);
        });
    }
}

export function initMap() {
    mapboxgl.accessToken = window.MAPBOX_TOKEN;

    const map = new mapboxgl.Map({
        container: "map",
        style: STYLE_URL,
        center: [-98.5795, 39.8283],
        zoom: 3
      });

      map.addControl(new mapboxgl.NavigationControl(), "top-right");

      map.on("load", async () => {
        map.resize();

        showStates(map); // only states visible

        await fetchStatePricesAndColor(map, uiState.selectedItemId); // initially color states by latest average

        map.setPaintProperty(LAYERS.states.fill, "fill-opacity", 0.6); // make sure state fill colors are actually visible

        await fetchStateStoreCounts(uiState.selectedItemId); // fetch state store counts for hover popup

        const nationalTrend = await fetchNationalTrend(uiState.selectedItemId);
        updateTrendChart(window.__trendChart, nationalTrend, "National (All U.S States)", uiState.selectedItemName);

        map.addSource(STORE_POINTS_SOURCE.id, STORE_POINTS_SOURCE.source);
        map.addLayer(STORE_MARKERS_LAYER);
        map.setPaintProperty(STORE_MARKERS_LAYER.id, "circle-opacity", 0.6);

        registerMapEvents(map); // hover and click handling
      });

      return map
}

// automatically add map
document.addEventListener("DOMContentLoaded", () => {
  const map = initMap();
  setupItemNav(map);

  const chart = initTrendChart();
  window.__trendChart = chart;
});