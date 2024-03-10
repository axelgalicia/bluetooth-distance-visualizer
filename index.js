const WebSocket = require('ws');
const noble = require('@abandonware/noble');
const PORT = 5500;
const TX_POWER = -65; // Adjust based on your device's specifics 1m from device

// Initialize WebSocket server
const wss = new WebSocket.Server({ port: PORT });
console.log(`WebSocket server started on ws://localhost:${PORT}`);

// Map to track unique devices by UUID
const uniqueDevices = new Map();

// Calculate approximate distance from RSSI
function calculateDistance(rssi) {
    return Math.pow(10, (TX_POWER - rssi) / 20).toFixed(2);
}

// Handle Noble state changes
noble.on('stateChange', async (state) => {
    if (state === 'poweredOn') {
        console.log('Bluetooth is powered on. Starting scanning...');
        await noble.startScanningAsync([], true); // Set to false to scan for all devices, not just those advertising services
    } else {
        console.log('Bluetooth is powered off. Stopping scanning.');
        noble.stopScanning();
    }
});

// Discover new Bluetooth peripherals
noble.on('discover', (peripheral) => {

    const existingDevice = uniqueDevices.get(peripheral.uuid);

    let distance = 0;

    const deviceInfo = {
        name: peripheral.advertisement.localName || 'Unknown',
        address: peripheral.address,
        uuid: peripheral.uuid,
        rssi: peripheral.rssi,
        distance,
    };

    if (existingDevice === undefined || existingDevice.rssi !== peripheral.rssi) {
        deviceInfo.distance = calculateDistance(peripheral.rssi);
    } else if (existingDevice.rssi === peripheral.rssi) {
        deviceInfo.distance = existingDevice.distance;
    }

    uniqueDevices.set(peripheral.uuid, deviceInfo);

    if (existingDevice === undefined) {
        console.log(`Discovered new device: [${deviceInfo.name}] with UUID: ${deviceInfo.uuid}, total: [${uniqueDevices.size}]`);
    }

});

// Periodically send device information to all connected WebSocket clients
setInterval(() => {
    uniqueDevices.forEach((deviceInfo) => {
        const dataToSend = JSON.stringify(deviceInfo);

        wss.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN && client.bufferedAmount === 0) {
                client.send(dataToSend);
            }
        });
    });
}, 20);

// Handle new WebSocket connections
wss.on('connection', (client) => {
    console.log('New client connected');
    client.on('close', () => console.log('Client disconnected'));
    client.on('error', (error) => console.error('WebSocket error:', error));
});
