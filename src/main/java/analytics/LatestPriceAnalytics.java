package analytics;

import db.PriceDbOps;
import model.*;

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

    /*
    // get the latest average price of a specific item in the whole US
    public static int getLatestCountryAvgForItem(long itemId) throws Exception {
        ArrayList<Price> prices = new ArrayList<>();
        prices = PriceDbOps.getLatestCountryItemPrices(itemId);
        return calcAvgPrice(prices);
    }
    */

    /*
    // get the latest average price of a specific item in a specific state
    public static int getLatestStateAvgForItem(long id, String stateFips) throws Exception {
        ArrayList<Price> prices = new ArrayList<>();
        prices = PriceDbOps.getLatestStateItemPrices(id, stateFips);
        return calcAvgPrice(prices);
    }
    */

    /*
    // get the latest average price of a specific item in a specific county
    public static int getLatestCountyAvgForItem(long id, String countyFips) throws Exception {
        ArrayList<Price> prices = new ArrayList<>();
        prices = PriceDbOps.getLatestCountyItemPrices(id, countyFips);
        return calcAvgPrice(prices);
    }
    */

    



    
}
