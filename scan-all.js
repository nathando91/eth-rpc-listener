const WebSocket = require("ws");

// List of all RPC endpoints with port 8546
const RPC_ENDPOINTS = [
    "ws://103.1.187.142:8546",
    "ws://81.0.214.216:8546"
];

// Store all WebSocket connections
const connections = [];

// Function to handle WebSocket connection for a single RPC endpoint
function createConnection(rpcUrl) {
    const ws = new WebSocket(rpcUrl);

    ws.on("open", () => {
        console.log(`Connected to ${rpcUrl}`);
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
                console.log(`[${rpcUrl}] Processing transaction hash:`, txHash);

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
                            "objects": [{ "rpcUrl": rpcUrl, "tx": txHash }]
                        },
                        "operationName": "MyMutation"
                    }),
                    "method": "POST"
                });

                if (response.ok) {
                    const result = await response.json();
                    console.log(`[${rpcUrl}] Successfully inserted transaction hash:`, result);
                } else {
                    console.error(`[${rpcUrl}] Failed to insert transaction hash:`, response.status, response.statusText);
                }
            }
        } catch (error) {
            console.error(`[${rpcUrl}] Error processing message:`, error);
        }
    });

    ws.on("error", (error) => {
        console.error(`[${rpcUrl}] WebSocket error:`, error.message);
    });

    ws.on("close", () => {
        console.log(`[${rpcUrl}] Connection closed`);
    });

    return ws;
}

// Create connections to all RPC endpoints
console.log(`Starting connections to ${RPC_ENDPOINTS.length} RPC endpoints...`);
RPC_ENDPOINTS.forEach(rpcUrl => {
    const connection = createConnection(rpcUrl);
    connections.push(connection);
});

// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log('\nShutting down gracefully...');
    connections.forEach(ws => {
        if (ws.readyState === WebSocket.OPEN) {
            ws.close();
        }
    });
    process.exit(0);
});
