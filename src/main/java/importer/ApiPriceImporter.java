package importer;

import model.*;
import api.WalmartApi;
import db.*;

import java.util.Map;
import java.util.HashMap;
import java.util.ArrayList;
import java.time.LocalDate;
import java.util.concurrent.*;

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

    // fetch all prices from every store and insert into db
    public static void importAllPrices() throws Exception {
        // arraylist of all item ids
        ArrayList<Item> items = new ArrayList<>();
        items = ItemDbOps.getAllItems();
        ArrayList<Long> itemIds = new ArrayList<>();
        for (Item item : items) {
            itemIds.add(item.id);
        }

        // arraylist of all store ids
        ArrayList<Store> stores = new ArrayList<>();
        stores = StoreDbOps.getAllStores();
        ArrayList<Integer> storeIds = new ArrayList<>();
        for (int i = 0; i < stores.size(); i++) { // number of stores processed
            storeIds.add(stores.get(i).id);
        }

        int THREADS = 8;
        ExecutorService pool = Executors.newFixedThreadPool(THREADS);
        ArrayList<Future<?>> futures = new ArrayList<>();
        
        for (int i = 0; i < storeIds.size(); i++) { // loop through storeIds
            int storeId = storeIds.get(i);

            Future<?> f = pool.submit(() -> {
                try {
                    ArrayList<Price> prices = buildPrices(itemIds, storeId); // make price object for each item at a single store
                    PriceDbOps.insertPricesBatch(prices);
                    /*
                    for (int j = 0; j < prices.size(); j++) { // loop through price objects
                        PriceDbOps.insertPrice(prices.get(j));
                    }
                    */

                } catch (RuntimeException e) {
                    System.out.println("API failed at store: " + storeId);
                } catch (Exception e) {
                    System.out.println("Failed at store: " + storeId + " err=" + e.getMessage());
                }
            });
            futures.add(f);
            
        }

        for (Future<?> f : futures) {
            f.get();
        }
        pool.shutdown();

    }
}
