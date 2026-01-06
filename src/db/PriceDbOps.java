package src.db;

import src.model.Price;

import java.sql.*;

public class PriceDbOps {
    public static void insertStore(Price price) throws Exception {
        Connection conn = null;
        PreparedStatement ps = null;

        try {
            conn = Database.getConnection();
            String sql = 
                    "INSERT INTO prices (price_id, store_id, item_id, price_cents, observed_at) " +
                    "VALUES (?, ?, ?, ?, ?)";
            
            ps = conn.prepareStatement(sql);
            
            ps.setLong(1, price.priceId);
            ps.setInt(2, price.storeId);
            ps.setLong(3, price.itemId);
            ps.setInt(4, price.priceCents);
            ps.setLong(5, price.observedAt);

            ps.executeUpdate();
            System.out.println("PRICE INSERTED");
        } finally {

            if (ps != null) {
                ps.close();
            }
            if (conn != null) {
                conn.close();
            }
        }
    }
    
}
