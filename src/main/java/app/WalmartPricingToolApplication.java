package app;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

//import java.util.ArrayList;
//import db.PriceDbOps;
//import importer.*;

@SpringBootApplication
public class WalmartPricingToolApplication {

	public static void main(String[] args) throws Exception {
		SpringApplication.run(WalmartPricingToolApplication.class, args);

		/*
		ArrayList<PriceDbOps.DailyAvgPricePoint> points = new ArrayList<>();
		points = PriceDbOps.getCountyAvgPriceTrend(10450115, "39061");
		for (PriceDbOps.DailyAvgPricePoint p : points) {
			System.out.println(p.date + " - " + p.avgCents + " - " + p.storeCount);
		}
		*/
	}

}
