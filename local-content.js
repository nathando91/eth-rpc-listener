const WebSocket = require('ws');
const BlocknativeSdk = require('bnc-sdk');

const sdk = new BlocknativeSdk({
    dappId: 'ab248a89-73e1-465d-bd23-8cb032630277',
    networkId: 1,
    ws: WebSocket,
    onerror: (e) => console.error('BN ERROR:', e?.message || e),
    onopen: () => console.log('BN WS OPEN'),
    onclose: () => console.log('BN WS CLOSE')
});
