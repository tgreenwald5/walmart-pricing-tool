package src.importer;

import src.model.Price;
import src.api.WalmartApi;

import java.util.Map;
import java.util.HashMap;
import java.util.ArrayList;
import java.time.Instant;

public class ApiPriceImporter {
    public static ArrayList<Price> buildPrices(ArrayList<Long> itemIds, int storeId) throws Exception {
        ArrayList<Price> prices = new ArrayList<>();

        Map<Long, Integer> pricesMap = new HashMap<>();
        pricesMap = WalmartApi.fetchItemPrices(itemIds, storeId);
        long observedAt = Instant.now().getEpochSecond();

        for (Long itemId : itemIds) {
            Integer itemPriceCents = pricesMap.get(itemId);
            if (itemPriceCents != null) {
                Price price = new Price(storeId, itemId, itemPriceCents, observedAt);
                prices.add(price);
            }
        }
        
        return prices;
    }
}
