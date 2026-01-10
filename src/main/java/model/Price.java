package model;

import java.time.LocalDate;

public class Price {
    public long priceId;
    public int storeId;
    public long itemId;
    public int priceCents;
    public LocalDate observedDate;

    // constructor for new price objects (before db insert)
    public Price(int storeId, long itemId, int priceCents, LocalDate observedDate) {
        this.storeId = storeId;
        this.itemId = itemId;
        this.priceCents = priceCents;
        this.observedDate = observedDate;
    }

    // constructor for rows read from db (after db insert)
    public Price(long priceId, int storeId, long itemId, int priceCents, String observedDate) {
        this.priceId = priceId;
        this.storeId = storeId;
        this.itemId = itemId;
        this.priceCents = priceCents;
        this.observedDate = LocalDate.parse(observedDate); // convert because stored as string in db
    }
}
