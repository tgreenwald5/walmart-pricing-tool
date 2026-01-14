package app;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

import importer.ApiPriceImporter;

//import java.util.ArrayList;
//import db.PriceDbOps;
//import importer.*;

@SpringBootApplication
public class WalmartPricingToolApplication {

	public static void main(String[] args) throws Exception {
		SpringApplication.run(WalmartPricingToolApplication.class, args);
	}

}
