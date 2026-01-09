package src.importer;

import src.db.*;

import src.model.Store;

import java.util.ArrayList;
import java.io.BufferedReader;
import java.io.FileReader;

public class StoreCsvImporter {

    // build Store objects from csv file
    public static ArrayList<Store> buildStores(String storesCsvPath) throws Exception {
        ArrayList<Store> stores = new ArrayList<>();

        BufferedReader reader = new BufferedReader(new FileReader(storesCsvPath));

        String row;
        reader.readLine();

        while ( (row = reader.readLine()) != null) {
            String[] cols = row.split(",");
            String storeRegion = cols[1];
            String storeState = cols[2];
            String storeCounty = cols[3];
            String storeCity = cols[4];
            int storeId = Integer.parseInt(cols[6]);
            double storeLat = Double.parseDouble(cols[7]);
            double storeLon = Double.parseDouble(cols[8]);
            String storeCountyFips = cols[9];
            String storeStateFips = cols[10];

            Store store = new Store(storeId, storeRegion, storeState, storeCounty, storeCity, storeLat, storeLon, storeCountyFips, storeStateFips);
            stores.add(store);
        }
        reader.close();

        return stores;
    }

    // add stores to db from csv file
    public static void importStores(String storesCsvPath) throws Exception {
        ArrayList<Store> stores = new ArrayList<>();
        stores = buildStores(storesCsvPath);
        for (Store store : stores) {
            StoreDbOps.insertStore(store);
        }
    }
}
