package app;

import db.PriceDbOps;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
public class SummaryController {

    // latest avg item price by state
    @GetMapping("/api/summary/latest/state")
    public Map<String, Integer> latestStateAvg(@RequestParam long itemId) throws Exception {
        return PriceDbOps.getLatestAvgPriceCentsByState(itemId);
    }

    // latest avg item price by county
    @GetMapping("/api/summary/latest/county")
    public Map<String, Integer> latestCountyAvg(@RequestParam long itemId, @RequestParam String statefp) throws Exception {
        return PriceDbOps.getLatestAvgPriceCentsByCounty(itemId, statefp);
    }

    // latest store count (that has an item) by state
    @GetMapping("/api/summary/latest/state/store-count")
    public Map<String, Integer> latestStateStoreCount(@RequestParam long itemId) throws Exception {
        return PriceDbOps.getLatestStoreCountByState(itemId);
    }

    // latest store count (that has an item) by county
    @GetMapping("/api/summary/latest/county/store-count")
    public Map<String, Integer> latestCountyStoreCount(@RequestParam long itemId, @RequestParam String statefp) throws Exception {
        return PriceDbOps.getLatestStoreCountByCounty(itemId, statefp);
    }




}