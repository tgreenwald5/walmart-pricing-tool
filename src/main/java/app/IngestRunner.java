package app;

import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

import importer.*;

@Component
public class IngestRunner implements ApplicationRunner {

    @Override
    public void run(ApplicationArguments args) throws Exception {

        if (!args.containsOption("ingest")) {
            return;
        }

        System.out.println("**importing prices to db**");

        ApiPriceImporter.importAllPrices();

        System.out.println("**done**");
        System.exit(0);
    }
}

