package src;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.Map;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

public class WalmartApi {

    public static JsonNode getItemsByStoreId(ArrayList<String> itemIds, String storeId) throws Exception {

        // id and keys
        String consumerId = System.getenv("WM_CONSUMER_ID");
        String keyVersion = System.getenv("WM_KEY_VERSION");
        String privateKey = System.getenv("WM_PRIVATE_KEY");
        
        String url = "";
        if (itemIds.size() == 1) {
            url =
                "https://developer.api.walmart.com/api-proxy/service/affil/product/v2/items/" +
                itemIds.get(0) +
                "?storeId=" + storeId;
        } else {
            String itemIdsStr = "";
            for (int i = 0; i < itemIds.size() - 1; i++) {
                itemIdsStr += (itemIds.get(i) + ",");
            }
            itemIdsStr += itemIds.get(itemIds.size() - 1);

            url = "https://developer.api.walmart.com/api-proxy/service/affil/product/v2/items?" +
                "ids=" + itemIdsStr +
                "&storeId=" + storeId;
        }
        
        
        // unix timestamp
        String timestamp = String.valueOf(System.currentTimeMillis());

        // headers
        Map<String, String> headers = new HashMap<>();
        headers.put("WM_CONSUMER.ID", consumerId);
        headers.put("WM_CONSUMER.INTIMESTAMP", timestamp);
        headers.put("WM_SEC.KEY_VERSION", keyVersion);

        // sign headers
        SignatureGenerator signer = new SignatureGenerator();
        String[] canonical = SignatureGenerator.canonicalize(headers);
        String signature = signer.generateSignature(privateKey, canonical[1]);

        // http request
        HttpRequest request = HttpRequest.newBuilder()
            .uri(URI.create(url))
            .GET()
            .header("WM_CONSUMER.ID", consumerId)
            .header("WM_CONSUMER.INTIMESTAMP", timestamp)
            .header("WM_SEC.KEY_VERSION", keyVersion)
            .header("WM_SEC.AUTH_SIGNATURE", signature)
            .build();

        HttpClient client = HttpClient.newHttpClient();
        HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
        
        // get structured json data
        if (response.statusCode() != 200) { // store id doesnt exist anymore or smth else wrong
            return null;
        }

        String prodInfo = response.body();
        ObjectMapper mapper = new ObjectMapper();
        JsonNode root = mapper.readTree(prodInfo);
        return root;
    }

}

