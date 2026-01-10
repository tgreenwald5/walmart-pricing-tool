package db;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.Statement;

public class Database {
    private static final String URL = "jdbc:sqlite:wm_store_prices.db";

    public static Connection getConnection() throws Exception {
        Connection conn = DriverManager.getConnection(URL);

        Statement stmt = conn.createStatement();
        stmt.execute("PRAGMA journal_mode = WAL;");
        stmt.execute("PRAGMA busy_timeout = 5000;");
        stmt.close();

        return conn;
    }
}
