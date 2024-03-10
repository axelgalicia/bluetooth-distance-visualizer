const WebSocket = require('ws');
const noble = require('@abandonware/noble');
const wss = new WebSocket.Server({ port: 5500 });
const uniqueDevices = new Map();

const txPower = -63;

function calculateDistance(rssi) {
    return Math.pow(10, (txPower - rssi) / 20).toFixed(2);
}

noble.on('stateChange', async (state) => {
    if (state === 'poweredOn') {
        console.log('Scanning...');
        await noble.startScanningAsync([], false);
    } else {
        noble.stopScanning();
    }
});

noble.on('discover', (peripheral) => {

    if (uniqueDevices.get(peripheral.uuid) === undefined) {
        const deviceInfo = {
            name: peripheral.advertisement.localName,
            address: peripheral.address,
            uuid: peripheral.uuid,
            rssi: peripheral.rssi
        };

        uniqueDevices.set(peripheral.uuid, deviceInfo);

        console.log('discovered:', uniqueDevices.size, peripheral.uuid, peripheral.advertisement.localName);

    }
});


setInterval(() => {
    for (const [uuid, deviceInfo] of uniqueDevices.entries()) {
        // // Broadcast to all connected WebSocket clients
        wss.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
                if (client.bufferedAmount == 0) {
                    deviceInfo.distance = calculateDistance(deviceInfo.rssi);
                    client.send(JSON.stringify(deviceInfo));
                }
            }
        });
    }
}, 1000);


wss.on('connection', (client) => {
    console.log(`Client connected`);
});




console.log('WebSocket server started on ws://localhost:5500');
