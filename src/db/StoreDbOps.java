package src.db;

import src.model.Store;

import java.sql.*;
import java.util.ArrayList;

public class StoreDbOps {
    
    public static void insertStore(Store store) throws Exception {
        Connection conn = null;
        PreparedStatement ps = null;

        try {
            conn = Database.getConnection();
            String sql = 
                    "INSERT INTO stores (id, region, state, county, city, lat, lon) " +
                    "VALUES (?, ?, ?, ?, ?, ?, ?)";
            
            ps = conn.prepareStatement(sql);
            
            ps.setInt(1, store.id);
            ps.setString(2, store.region);
            ps.setString(3, store.state);
            ps.setString(4, store.county);
            ps.setString(5, store.city);
            ps.setDouble(6, store.lat);
            ps.setDouble(7, store.lon);

            ps.executeUpdate();
            System.out.println("STORE INSERTED");
        } finally {

            if (ps != null) {
                ps.close();
            }
            if (conn != null) {
                conn.close();
            }
        }
    }

    
    public static Store getStoreById(int storeId) throws Exception {
        Connection conn = null;
        PreparedStatement ps = null;
        ResultSet rs = null;

        try {
            conn = Database.getConnection();

            String sql = 
                "SELECT id, region, state, county, city, lat, lon " +
                "FROM stores " +
                "WHERE id = ?";

            ps = conn.prepareStatement(sql);
            ps.setInt(1, storeId);

            rs = ps.executeQuery();
            if (!rs.next()) {
                return null;
            }

            Store store = new Store(
            rs.getInt("id"),
            rs.getString("region"),
            rs.getString("state"),
            rs.getString("county"),
            rs.getString("city"),
            rs.getDouble("lat"),
            rs.getDouble("lon")
            );

            return store;

        } finally {
            if (ps != null) {
                ps.close();
            }
            if (conn != null) {
                conn.close();
            }
        }
    }


    public static ArrayList<Store> getAllStores() throws Exception {
        ArrayList<Store> stores = new ArrayList<>();

        Connection conn = null;
        PreparedStatement ps = null;
        ResultSet rs = null;

        try {
            conn = Database.getConnection();

            String sql = "SELECT * FROM stores";
            ps = conn.prepareStatement(sql);
            rs = ps.executeQuery();

            while (rs.next()) {
                Store store = new Store(
                    rs.getInt("id"),
                    rs.getString("region"),
                    rs.getString("state"),
                    rs.getString("county"),
                    rs.getString("city"),
                    rs.getDouble("lat"),
                    rs.getDouble("lon")
                );
                stores.add(store);
            }

        } finally {
            if (ps != null) {
                ps.close();
            }
            if (conn != null) {
                conn.close();
            }
        }
        return stores;
    }
              
}
