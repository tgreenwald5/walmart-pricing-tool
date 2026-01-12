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


    // get latest average price (cents) of inputted item in every county in a state
    public static Map<String, Integer> getLatestAvgPriceCentsByCounty(long itemId, String stateFp) throws Exception {
        Map<String, Integer> countyToAvgCents = new HashMap<>();

        String latestDate = getLatestObservedDateForItem(itemId);
        if (latestDate == null) {
            return countyToAvgCents;
        }

        Connection conn = null;
        PreparedStatement ps = null;
        ResultSet rs = null;

        try {
            conn = Database.getConnection();

            String sql =
                    "SELECT s.county_fips AS geoid, AVG(p.price_cents) AS avg_cents " +
                    "FROM prices p " +
                    "JOIN stores s ON s.id = p.store_id " +
                    "WHERE p.observed_date = ? AND p.item_id = ? AND s.state_fips = ? " +
                    "GROUP BY s.county_fips";
            
            ps = conn.prepareStatement(sql);
            ps.setString(1, latestDate);
            ps.setLong(2, itemId);
            ps.setString(3, stateFp);

            rs = ps.executeQuery();

            while (rs.next()) {
                String geoid = rs.getString("geoid");

                double avgCents = rs.getDouble("avg_cents");
                int rounded = (int) Math.round(avgCents);

                countyToAvgCents.put(geoid, rounded);
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
        return countyToAvgCents;
    }

    public static Map<String, Integer> getLatestStoreCountByState(long itemId) throws Exception {
        Map<String, Integer> stateToStoreCount = new HashMap<>();

        String latestDate = getLatestObservedDateForItem(itemId);
        if (latestDate == null) {
            return stateToStoreCount;
        }

        Connection conn = null;
        PreparedStatement ps = null;
        ResultSet rs = null;

        try {
            conn = Database.getConnection();

            String sql =
                    "SELECT s.state_fips AS statefp, COUNT(DISTINCT p.store_id) AS store_count " +
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
                int storeCount = rs.getInt("store_count");

                stateToStoreCount.put(stateFp, storeCount);
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
        return stateToStoreCount;
    }

    public static Map<String, Integer> getLatestStoreCountByCounty(long itemId, String stateFp) throws Exception {
        Map<String, Integer> countyToStoreCount = new HashMap<>();

        String latestDate = getLatestObservedDateForItem(itemId);
        if (latestDate == null) {
            return countyToStoreCount;
        }

        Connection conn = null;
        PreparedStatement ps = null;
        ResultSet rs = null;

        try {
            conn = Database.getConnection();

            String sql =
                    "SELECT s.county_fips AS geoid, COUNT(DISTINCT p.store_id) AS store_count " +
                    "FROM prices p " +
                    "JOIN stores s ON s.id = p.store_id " +
                    "WHERE p.observed_date = ? AND p.item_id = ? AND s.state_fips = ? " +
                    "GROUP BY s.county_fips";
            
            ps = conn.prepareStatement(sql);
            ps.setString(1, latestDate);
            ps.setLong(2, itemId);
            ps.setString(3, stateFp);

            rs = ps.executeQuery();

            while (rs.next()) {
                String geoid = rs.getString("geoid");
                int storeCount = rs.getInt("store_count");

                countyToStoreCount.put(geoid, storeCount);
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
        return countyToStoreCount;
    }

    // class for historical price trends
    public static class DailyAvgPricePoint {
        public String date; // yyyy-mm-dd
        public int avgCents;
        public int storeCount;

        public DailyAvgPricePoint(String date, int avgCents, int storeCount) {
            this.date = date;
            this.avgCents = avgCents;
            this.storeCount = storeCount;
        }

    }
    private static final String EXCLUDED_DATE = "2026-01-06"; // day i didnt collect data from many stores

    // get avg price trend of the entire us for an item
    public static ArrayList<DailyAvgPricePoint> getNationalAvgPriceTrend(long itemId) throws Exception {
        ArrayList<DailyAvgPricePoint> points = new ArrayList<>();

        Connection conn = null;
        PreparedStatement ps = null;
        ResultSet rs = null;

        try {
            conn = Database.getConnection();

            String sql =
                    "SELECT p.observed_date AS day, AVG(p.price_cents) as avg_cents, COUNT(DISTINCT p.store_id) as store_count " +
                    "FROM prices p " +
                    "WHERE p.item_id = ? AND p.observed_date <> ? " +
                    "GROUP by p.observed_date " +
                    "ORDER BY p.observed_date ASC";
            
            ps = conn.prepareStatement(sql);
            ps.setLong(1, itemId);
            ps.setString(2, EXCLUDED_DATE);

            rs = ps.executeQuery();

            while (rs.next()) {
                String day = rs.getString("day");

                double avgCents = rs.getDouble("avg_cents");
                int rounded = (int) Math.round(avgCents);

                int storeCount = rs.getInt("store_count");

                DailyAvgPricePoint point = new DailyAvgPricePoint(day, rounded, storeCount);
                points.add(point);
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
        return points;

    }

    // get avg price trend of state for an item
    public static ArrayList<DailyAvgPricePoint> getStateAvgPriceTrend(long itemId, String stateFp) throws Exception {
        ArrayList<DailyAvgPricePoint> points = new ArrayList<>();

        Connection conn = null;
        PreparedStatement ps = null;
        ResultSet rs = null;

        try {
            conn = Database.getConnection();

            String sql =
                    "SELECT p.observed_date AS day, AVG(p.price_cents) as avg_cents, COUNT(DISTINCT p.store_id) as store_count " +
                    "FROM prices p " +
                    "JOIN stores s ON s.id = p.store_id " +
                    "WHERE p.item_id = ? AND s.state_fips = ? AND p.observed_date <> ? " +
                    "GROUP by p.observed_date " +
                    "ORDER BY p.observed_date ASC";
            
            ps = conn.prepareStatement(sql);
            ps.setLong(1, itemId);
            ps.setString(2, stateFp);
            ps.setString(3, EXCLUDED_DATE);

            rs = ps.executeQuery();

            while (rs.next()) {
                String day = rs.getString("day");

                double avgCents = rs.getDouble("avg_cents");
                int rounded = (int) Math.round(avgCents);

                int storeCount = rs.getInt("store_count");

                DailyAvgPricePoint point = new DailyAvgPricePoint(day, rounded, storeCount);
                points.add(point);
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
        return points;

    }


    // get avg price trend of county for an item
    public static ArrayList<DailyAvgPricePoint> getCountyAvgPriceTrend(long itemId, String countyFips) throws Exception {
        ArrayList<DailyAvgPricePoint> points = new ArrayList<>();

        Connection conn = null;
        PreparedStatement ps = null;
        ResultSet rs = null;

        try {
            conn = Database.getConnection();

            String sql =
                    "SELECT p.observed_date AS day, AVG(p.price_cents) as avg_cents, COUNT(DISTINCT p.store_id) as store_count " +
                    "FROM prices p " +
                    "JOIN stores s ON s.id = p.store_id " +
                    "WHERE p.item_id = ? AND s.county_fips = ? AND p.observed_date <> ? " +
                    "GROUP by p.observed_date " +
                    "ORDER BY p.observed_date ASC";
            
            ps = conn.prepareStatement(sql);
            ps.setLong(1, itemId);
            ps.setString(2, countyFips);
            ps.setString(3, EXCLUDED_DATE);

            rs = ps.executeQuery();

            while (rs.next()) {
                String day = rs.getString("day");

                double avgCents = rs.getDouble("avg_cents");
                int rounded = (int) Math.round(avgCents);

                int storeCount = rs.getInt("store_count");

                DailyAvgPricePoint point = new DailyAvgPricePoint(day, rounded, storeCount);
                points.add(point);
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
        return points;

    }

}

