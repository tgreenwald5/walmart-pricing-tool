package app;

import org.springframework.web.bind.annotation.RestController;

import db.PriceDbOps;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;

@RestController
public class TrendController {
    
    // latest avg price trend nationally for an item
    @GetMapping("/api/trend/national")
    public ArrayList<PriceDbOps.DailyAvgPricePoint> nationalAvgPriceTrend(@RequestParam long itemId) throws Exception {
        return PriceDbOps.getNationalAvgPriceTrend(itemId);
    }

    // latest avg price trend by state for an item
    @GetMapping("/api/trend/state")
    public ArrayList<PriceDbOps.DailyAvgPricePoint> stateAvgPriceTrend(@RequestParam long itemId, @RequestParam String statefp) throws Exception {
        return PriceDbOps.getStateAvgPriceTrend(itemId, statefp);
    }

    // latest avg price trend by county for an item
    @GetMapping("/api/trend/county")
    public ArrayList<PriceDbOps.DailyAvgPricePoint> countyAvgPriceTrend(@RequestParam long itemId, @RequestParam String countyFips) throws Exception {
        return PriceDbOps.getCountyAvgPriceTrend(itemId, countyFips);
    }

    // latest price trend by store for an item
    @GetMapping("/api/trend/store")
    public ArrayList<PriceDbOps.DailyAvgPricePoint> storePriceTrend(@RequestParam long itemId, @RequestParam int storeId) throws Exception {
        return PriceDbOps.getStorePriceTrend(itemId, storeId);
    }
}
