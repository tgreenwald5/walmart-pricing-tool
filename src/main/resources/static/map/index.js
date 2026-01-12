import { STYLE_URL, LAYERS } from "./config.js";
import { showStates } from "./uiState.js";
import { fetchStatePricesAndColor, fetchStateStoreCounts } from "./api.js";
import { registerMapEvents } from "./events.js";

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
        showStates(map); // only states visible

        const itemId = 20971271; // item id for prices
        await fetchStatePricesAndColor(map, itemId); // initially color states by latest average

        map.setPaintProperty(LAYERS.states.fill, "fill-opacity", 0.6); // make sure state fill colors are actually visible

        await fetchStateStoreCounts(itemId); // fetch state store counts for hover popup

        registerMapEvents(map, itemId); // hover and click handling
      });

      return map
}

// automatically add map
document.addEventListener("DOMContentLoaded", () => {
    initMap();
  });