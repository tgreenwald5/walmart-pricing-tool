package src;

import java.util.ArrayList;

import java.io.BufferedReader;
import java.io.FileReader;

import com.fasterxml.jackson.databind.JsonNode;

public class HandleData {
    public static void main(String[] args) throws Exception {
        ArrayList<String> storeIds = getStoreIdsByCounty("GA", "DeKalb");
        for (int i = 0; i < storeIds.size(); i++) {
            System.out.println(storeIds.get(i));
        }

        ArrayList<String> itemIds = new ArrayList<>();
        itemIds.add("10450114");
        itemIds.add("44390944");
        for (int i = 0; i < storeIds.size(); i++) {
            JsonNode itemsInfo = WalmartApi.getItemsByStoreId(itemIds, storeIds.get(i)); // get items prices
            if (itemsInfo == null) {
                System.out.println("Failed Store ID: " + storeIds.get(i));
                System.out.println("-----");
            } else {
                printPrices(itemsInfo);
                System.out.println("-----");
            } 
            //printPrices(itemsInfo);
            //System.out.println("-----");
        }
    }

    public static void printPrices(JsonNode root) {
        JsonNode itemsNode = root.path("items");

        // if multiple items
        if (itemsNode.isArray()) {
            for (JsonNode item : itemsNode) {
                long itemId = item.path("itemId").asLong();
                double salePrice = item.path("salePrice").asDouble();
                System.out.printf("%s : %s%n", itemId, salePrice);
            }
        
        // if single item
        } else {
            long itemId = root.path("itemId").asLong();
            double salePrice = root.path("salePrice").asDouble();
            System.out.printf("%s : %s%n", itemId, salePrice);
        }

    }

    // use state abbreviation
    public static ArrayList<String> getStoreIdsByState(String state) throws Exception {
        ArrayList<String> storeIds = new ArrayList<>();

        BufferedReader br = new BufferedReader(new FileReader("wm_store_data/se_region.csv"));
        String line;
        br.readLine();
        
        while ((line = br.readLine()) != null) {
            String[] cols = line.split(",");
            if (cols[2].equals(state)) { // cols[2] = state
                storeIds.add(cols[6]); // cols[6] = storeId
            }
        }
        br.close();

        return storeIds;
    }

    public static ArrayList<String> getStoreIdsByCounty(String state, String county) throws Exception {
        ArrayList<String> storeIds = new ArrayList<>();

        BufferedReader br = new BufferedReader(new FileReader("wm_store_data/se_region.csv"));
        String line;
        br.readLine();
        
        while ((line = br.readLine()) != null) {
            String[] cols = line.split(",");
            if (cols[2].equals(state) && cols[3].equals(county)) { // cols[2] = state and cols[3] = county
                storeIds.add(cols[6]); // cols[6] = storeId
            }
        }
        br.close();

        return storeIds;

    }
}
