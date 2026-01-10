package src.db;

import src.model.Item;

import java.sql.*;
import java.util.ArrayList;

public class ItemDbOps {
    
    // insert single item into db
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

    // return all item objects from db
    public static ArrayList<Item> getAllItems() throws Exception {
        ArrayList<Item> items = new ArrayList<>();

        Connection conn = null;
        PreparedStatement ps = null;
        ResultSet rs = null;

        try {
            conn = Database.getConnection();

            String sql = "SELECT * FROM items";
            ps = conn.prepareStatement(sql);
            rs = ps.executeQuery();

            while (rs.next()) {
                Item item = new Item(
                    rs.getLong("id"),
                    rs.getString("name"),
                    rs.getString("brand"),
                    rs.getString("category")
                );
                items.add(item);
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
        return items;
    }
}
