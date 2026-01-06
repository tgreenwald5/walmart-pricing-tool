package src.model;

public class Price {
    public long priceId;
    public int storeId;
    public long itemId;
    public int priceCents;
    public long observedAt;

    // constructor for new price objects (before db insert)
    public Price(int storeId, long itemId, int priceCents, long observedAt) {
        this.storeId = storeId;
        this.itemId = itemId;
        this.priceCents = priceCents;
        this.observedAt = observedAt;
    }

    // constructor for rows read from db (after db insert)
    public Price(long priceId, int storeId, long itemId, int priceCents, long observedAt) {
        this.priceId = priceId;
        this.storeId = storeId;
        this.itemId = itemId;
        this.priceCents = priceCents;
        this.observedAt = observedAt;
    }
}
