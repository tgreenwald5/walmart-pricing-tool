package src.model;

public class Store {
    public int id;
    public String region;
    public String state;
    public String county;
    public String city;
    public double lat;
    public double lon;

    public Store(int id, String region, String state, String county, String city, double lat, double lon) {
        this.id = id;
        this.region = region;
        this.state = state;
        this.county = county;
        this.city = city;
        this.lat = lat;
        this.lon = lon;
    }
}
