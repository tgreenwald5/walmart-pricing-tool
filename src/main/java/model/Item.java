package model;

public class Item {
    public long id;
    public String name;
    public String brand;
    public String category;

    public Item(long id, String name, String brand, String category) {
        this.id = id;
        this.name = name;
        this.brand = brand;
        this.category = category;
    }
}
