package src.db;

import src.model.Item;

import java.sql.*;

public class ItemDbOps {
    
    public static void insertItem(Item item) throws Exception {
        Connection conn = null;
        PreparedStatement ps = null;

        try {
            conn = Database.getConnection();
            String sql = 
                    "INSERT INTO items (id, name, brand, category) " +
                    "VALUES (?, ?, ?, ?)";
            
            ps = conn.prepareStatement(sql);
            
            ps.setLong(1, item.id);
            ps.setString(2, item.name);
            ps.setString(3, item.brand);
            ps.setString(4, item.category);

            ps.executeUpdate();
            System.out.println("ITEM INSERTED");
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
