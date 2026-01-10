package app;

import db.PriceDbOps;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
public class SummaryController {

    @GetMapping("/api/summary/latest/state")
    public Map<String, Integer> latestStateAvg(@RequestParam long itemId) throws Exception {
        return PriceDbOps.getLatestAvgPriceCentsByState(itemId);
    }
}