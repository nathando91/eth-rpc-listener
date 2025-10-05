const WebSocket = require("ws");
const RPC_URL = "ws://49.0.207.158:8546";
const ws = new WebSocket(RPC_URL);


ws.on("open", () => {
    ws.send(JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "eth_subscribe",
        params: ["newPendingTransactions"]
    }));
});

ws.on("message", async (data) => {
    try {
        const txHash = JSON.parse(data).params?.result;
        if (txHash) {
            console.log("Processing transaction hash:", txHash);

            const response = await fetch("http://localhost:8090/v1/graphql", {
                "headers": {
                    "accept": "*/*",
                    "accept-language": "en-US,en;q=0.9,ko-KR;q=0.8,ko;q=0.7,ja-JP;q=0.6,ja;q=0.5,vi;q=0.4,th;q=0.3",
                    "content-type": "application/json",
                    "sec-ch-ua": "\"Chromium\";v=\"140\", \"Not=A?Brand\";v=\"24\", \"Google Chrome\";v=\"140\"",
                    "sec-ch-ua-mobile": "?0",
                    "sec-ch-ua-platform": "\"macOS\"",
                    "sec-fetch-dest": "empty",
                    "sec-fetch-mode": "cors",
                    "sec-fetch-site": "same-origin",
                    "x-hasura-admin-secret": "nathanDo123",
                    "Referer": "http://localhost:8090/console/api/api-explorer"
                },
                "body": JSON.stringify({
                    "query": "mutation MyMutation($objects: [PendingHashInsertInput!] = {}) {\n  insertPendingHash(objects: $objects, onConflict: {constraint: pending_hash_pkey, updateColumns: to}) {\n    affectedRows\n  }\n}",
                    "variables": {
                        "objects": [{ "rpcUrl": RPC_URL, "tx": txHash }]
                    },
                    "operationName": "MyMutation"
                }),
                "method": "POST"
            });

            if (response.ok) {
                const result = await response.json();
                console.log("Successfully inserted transaction hash:", result);
            } else {
                console.error("Failed to insert transaction hash:", response.status, response.statusText);
            }
        }
    } catch (error) {
        console.error("Error processing message:", error);
    }
});
