package src.analytics;

import src.db.PriceDbOps;
import src.model.*;

import java.util.ArrayList;

public class LatestPriceAnalytics {

    // calc avg price of price objects and return avg price in cents
    public static int calcAvgPrice(ArrayList<Price> prices) throws Exception {
        if (prices.size() == 0) {
            return 0;
        }

        long priceSum = 0;
        for (Price price : prices) {
            priceSum += price.priceCents;
        }

        double avgPrice = (double) priceSum / prices.size();
        return (int) Math.round(avgPrice);
    }

    // get the latest average price of an item in the US
    public static int getLatestCountryAvgForItem(long itemId) throws Exception {
        ArrayList<Price> prices = new ArrayList<>();
        prices = PriceDbOps.getLatestCountryItemPrices(itemId);
        return calcAvgPrice(prices);
    }
}
