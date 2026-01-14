package db;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.Statement;

public class Database {
    //private static final String URL = "jdbc:sqlite:wm_store_prices.db";
    private static final String URL = System.getenv("DB_URL");
    private static final String USER = System.getenv("DB_USER");
    private static final String PASS = System.getenv("DB_PASSWORD");

    public static Connection getConnection() throws Exception {
        Connection conn = DriverManager.getConnection(URL, USER, PASS);

        //Statement stmt = conn.createStatement();
        //stmt.execute("PRAGMA journal_mode = WAL;");
        //stmt.execute("PRAGMA busy_timeout = 5000;");
        //stmt.close();

        return conn;
    }
}
