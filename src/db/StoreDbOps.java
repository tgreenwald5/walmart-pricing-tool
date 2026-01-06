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

    public static void insertStores(ArrayList<Store> stores) throws Exception {
        for (Store store : stores) {
            insertStore(store);
        }
    }

    public static Store getStoreById(int storeId) throws Exception {
        String sql = 
                "SELECT id, region, state, county, city, lat, lon " +
                "FROM stores " +
                "WHERE id = ?";
        
        
        try (Connection conn = Database.getConnection();
            PreparedStatement ps = conn.prepareStatement(sql)) {

            ps.setInt(1, storeId);

            try (ResultSet rs = ps.executeQuery()) {

                if (!rs.next()) {
                    return null;
                }

                return new Store(
                    rs.getInt("id"),
                    rs.getString("region"),
                    rs.getString("state"),
                    rs.getString("county"),
                    rs.getString("city"),
                    rs.getDouble("lat"),
                    rs.getDouble("lon")
                );
            }
        }
    }
              
}
