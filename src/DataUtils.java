package src;

import java.util.HashMap;

import java.io.BufferedReader;
import java.io.FileReader;

public class DataUtils {
    
    // return number of walmarts in each county
    public static HashMap<String, Integer> storesPerCounty(String state, String regionDataPath) throws Exception {
        HashMap<String, Integer> countyCount = new HashMap<>();
        BufferedReader br = new BufferedReader(new FileReader(regionDataPath));
        String line;

        br.readLine();
        
        while ((line = br.readLine()) != null) {
            String[] cols = line.split(",");
            if (cols[2].equals(state)) { // cols[2] = state
                if (countyCount.containsKey(cols[3])) { // if county not unique
                    countyCount.put(cols[3], countyCount.get(cols[3]) + 1);
                } else {
                    countyCount.put(cols[3], 1);
                }
            }
        }
        br.close();
        System.out.println(countyCount);
        return countyCount;
    }   
}
