package src.importer;

import src.model.Price;
import src.api.WalmartApi;

import java.util.Map;
import java.util.HashMap;
import java.util.ArrayList;
import java.time.LocalDate;

public class ApiPriceImporter {
    public static ArrayList<Price> buildPrices(ArrayList<Long> itemIds, int storeId) throws Exception {
        ArrayList<Price> prices = new ArrayList<>();

        Map<Long, Integer> pricesMap = new HashMap<>();
        pricesMap = WalmartApi.fetchItemPrices(itemIds, storeId);
        LocalDate observedDate = LocalDate.now();

        for (Long itemId : itemIds) {
            Integer itemPriceCents = pricesMap.get(itemId);
            if (itemPriceCents != null) {
                Price price = new Price(storeId, itemId, itemPriceCents, observedDate);
                prices.add(price);
            }
        }
        
        return prices;
    }
}
