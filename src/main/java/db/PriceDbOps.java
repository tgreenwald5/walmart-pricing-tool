package db;

import model.*;

import java.sql.*;
import java.util.ArrayList;
//import java.time.LocalDate;
import java.util.Map;

import java.util.HashMap;

public class PriceDbOps {

    // insert price in db
    public static void insertPrice(Price price) throws Exception {
        Connection conn = null;
        PreparedStatement ps = null;

        try {
            conn = Database.getConnection();
            String sql = 
                    "INSERT INTO prices (store_id, item_id, price_cents, observed_date) " +
                    "VALUES (?, ?, ?, ?) " + 
                    "ON CONFLICT(store_id, item_id, observed_date) " + // if specific item price in specific store on specific day alrdy exists
                    "DO UPDATE SET price_cents = excluded.price_cents"; // update row instead of adding new
                    
            ps = conn.prepareStatement(sql);
            
            ps.setInt(1, price.storeId);
            ps.setLong(2, price.itemId);
            ps.setInt(3, price.priceCents);
            ps.setString(4, price.observedDate.toString());

            ps.executeUpdate();
            //System.out.println("PRICE INSERTED");
        } finally {

            if (ps != null) {
                ps.close();
            }
            if (conn != null) {
                conn.close();
            }
        
        }
    }

    // return all Price objects from db
    public static ArrayList<Price> getAllPrices() throws Exception {
        ArrayList<Price> prices = new ArrayList<>();

        Connection conn = null;
        PreparedStatement ps = null;
        ResultSet rs = null;

        try {
            conn = Database.getConnection();

            String sql = "SELECT * FROM prices";
            ps = conn.prepareStatement(sql);
            rs = ps.executeQuery();

            while (rs.next()) {
                Price price = new Price(
                    rs.getLong("price_id"),
                    rs.getInt("store_id"),
                    rs.getLong("item_id"),
                    rs.getInt("price_cents"),
                    rs.getString("observed_date")
                );
                prices.add(price);
            }

        } finally {
            if (rs != null) {
                rs.close();
            }
            if (ps != null) {
                ps.close();
            }
            if (conn != null) {
                conn.close();
            }
        }
        return prices;
    }

    // return the latest date prices were collected  at
    public static String getLatestObservedDate() throws Exception {
        Connection conn = null;
        PreparedStatement ps = null;
        ResultSet rs = null;

        try {
            conn = Database.getConnection();

            String sql = "SELECT MAX(observed_date) AS max_date FROM prices";
            ps = conn.prepareStatement(sql);
            rs = ps.executeQuery();

            if (rs.next()) {
                return rs.getString("max_date");
            }
            return null;

            
        } finally {
            if (rs != null) {
                rs.close();
            }
            if (ps != null) {
                ps.close();
            }
            if (conn != null) {
                conn.close();
            }

        }
    }

    // return the latest date prices were collected at for specific item (items may not all be collected on same latest day)
    public static String getLatestObservedDateForItem(long itemId) throws Exception {
        Connection conn = null;
        PreparedStatement ps = null;
        ResultSet rs = null;

        try {
            conn = Database.getConnection();

            String sql = "SELECT MAX(observed_date) AS max_date FROM prices WHERE item_id = ?";
            ps = conn.prepareStatement(sql);
            ps.setLong(1, itemId);
            rs = ps.executeQuery();

            if (rs.next()) {
                return rs.getString("max_date");
            }
            return null;

            
        } finally {
            if (rs != null) {
                rs.close();
            }
            if (ps != null) {
                ps.close();
            }
            if (conn != null) {
                conn.close();
            }

        }
    }


    // get all of the latest prices of a specific item in the US
    public static ArrayList<Price> getLatestCountryItemPrices(long itemId) throws Exception {
        ArrayList<Price> prices = new ArrayList<>();

        String latestDate  = getLatestObservedDate();
        if (latestDate == null) {
            return prices;
        }

        Connection conn = null;
        PreparedStatement ps = null;
        ResultSet rs = null;

        try {
            conn = Database.getConnection();

            String sql = 
                    "SELECT * FROM prices " +
                    "WHERE observed_date = ? AND item_id = ?";
            
            ps = conn.prepareStatement(sql);
            ps.setString(1, latestDate);
            ps.setLong(2, itemId);

            rs = ps.executeQuery();

            while (rs.next()) {
                Price price = new Price(
                    rs.getLong("price_id"),
                    rs.getInt("store_id"),
                    rs.getLong("item_id"),
                    rs.getInt("price_cents"),
                    rs.getString("observed_date")
                );
                prices.add(price);
            }

        } finally {
            if (rs != null) {
                rs.close();
            }
            if (ps != null) {
                ps.close();
            }
            if (conn != null) {
                conn.close();
            }
        }

        return prices;
    }

    /*
    // get all of the latest prices of a specific item in a specific state (input state fips)
    public static ArrayList<Price> getLatestStateItemPrices(long itemId, String stateFips) throws Exception {
        ArrayList<Price> prices = new ArrayList<>();

        String latestDate  = getLatestObservedDate();
        if (latestDate == null) {
            return prices;
        }

        Connection conn = null;
        PreparedStatement ps = null;
        ResultSet rs = null;

        try {
            conn = Database.getConnection();

            String sql = 
                    "SELECT p.* FROM prices p " +
                    "JOIN stores s ON p.store_id = s.id " +
                    "WHERE p.observed_date = ? AND p.item_id = ? AND s.state_fips = ?";
            
            ps = conn.prepareStatement(sql);
            ps.setString(1, latestDate);
            ps.setLong(2, itemId);
            ps.setString(3, stateFips);

            rs = ps.executeQuery();

            while (rs.next()) {
                Price price = new Price(
                    rs.getLong("price_id"),
                    rs.getInt("store_id"),
                    rs.getLong("item_id"),
                    rs.getInt("price_cents"),
                    rs.getString("observed_date")
                );
                prices.add(price);
            }

        } finally {
            if (rs != null) {
                rs.close();
            }
            if (ps != null) {
                ps.close();
            }
            if (conn != null) {
                conn.close();
            }
        }

        return prices;
    }
    */

    // get latest average price (cents) of inputted item in every state 
    public static Map<String, Integer> getLatestAvgPriceCentsByState(long itemId) throws Exception {
        Map<String, Integer> stateToAvgCents = new HashMap<>();

        String latestDate = getLatestObservedDateForItem(itemId);
        if (latestDate == null) {
            return stateToAvgCents;
        }

        Connection conn = null;
        PreparedStatement ps = null;
        ResultSet rs = null;

        try {
            conn = Database.getConnection();

            String sql =
                "SELECT s.state_fips AS statefp, AVG(p.price_cents) AS avg_cents " +
                "FROM prices p " +
                "JOIN stores s ON s.id = p.store_id " +
                "WHERE p.observed_date = ? AND p.item_id = ? " +
                "GROUP BY s.state_fips";
            
            ps = conn.prepareStatement(sql);
            ps.setString(1, latestDate);
            ps.setLong(2, itemId);

            rs = ps.executeQuery();

            while (rs.next()) {
                String stateFp = rs.getString("statefp");
                double avgCents = rs.getDouble("avg_cents");
    
                int rounded = (int) Math.round(avgCents);
                stateToAvgCents.put(stateFp, rounded);
            }
        } finally {
            if (rs != null) {
                rs.close();
            }
            if (ps != null) {
                ps.close();
            }
            if (conn != null) {
                conn.close();
            }
        }
        return stateToAvgCents;
    }

    

    // get all of the latest prices of a specific item in a specific county (input county fips)
    public static ArrayList<Price> getLatestCountyItemPrices(long itemId, String countyFips) throws Exception {
        ArrayList<Price> prices = new ArrayList<>();

        String latestDate  = getLatestObservedDate();
        if (latestDate == null) {
            return prices;
        }

        Connection conn = null;
        PreparedStatement ps = null;
        ResultSet rs = null;

        try {
            conn = Database.getConnection();

            String sql = 
                    "SELECT p.* FROM prices p " +
                    "JOIN stores s ON p.store_id = s.id " +
                    "WHERE p.observed_date = ? AND p.item_id = ? AND s.county_fips = ?";
            
            ps = conn.prepareStatement(sql);
            ps.setString(1, latestDate);
            ps.setLong(2, itemId);
            ps.setString(3, countyFips);

            rs = ps.executeQuery();

            while (rs.next()) {
                Price price = new Price(
                    rs.getLong("price_id"),
                    rs.getInt("store_id"),
                    rs.getLong("item_id"),
                    rs.getInt("price_cents"),
                    rs.getString("observed_date")
                );
                prices.add(price);
            }

        } finally {
            if (rs != null) {
                rs.close();
            }
            if (ps != null) {
                ps.close();
            }
            if (conn != null) {
                conn.close();
            }
        }

        return prices;
    }
}
