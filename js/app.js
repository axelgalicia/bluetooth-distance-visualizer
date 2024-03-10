document.getElementById('devicesWithName').addEventListener('change', function(event) {
    updateFilters();
});

const ws = new WebSocket('ws://localhost:5500');
const svg = d3.select('svg');
const width = +svg.attr('width');
const height = +svg.attr('height');
const center = { x: width / 2, y: height / 2 };
let devices = [];
let filteredDevices = [];
let refreshIntervalId;

const rssiScale = d3.scaleLinear().domain([-30, -100]).range([100, 250]);
const colorScale = d3.scaleSequential(d3.interpolateRdYlBu).domain([-50, -100]);
const sizeScale = d3.scaleLinear().domain([100, 0.1]).range([-10, 35]); // Size based on RSSI

const tooltip = d3.select('#tooltip');

ws.onmessage = function(event) {
    devices = JSON.parse(event.data);
    if (!Array.isArray(devices)) {
        devices = [];
    }
};

ws.onclose = function(event) {
    console.log('closed', event);
}

function setRefreshFrequency() {
    clearInterval(refreshIntervalId);
    const frequency = document.getElementById('refreshFrequency').value;
    refreshIntervalId = setInterval(() => {
        updateFilters();
    }, frequency);
}

function updateFilters() {
    const rssiMin = document.getElementById('rssiMin').value || -100;
    const rssiMax = document.getElementById('rssiMax').value || 0;
    const deviceNameFilter = document.getElementById('deviceName').value.toLowerCase();
    const devicesWithName = document.getElementById('devicesWithName').checked;

    filteredDevices = devices.filter(d =>
        d.rssi >= rssiMin
        && d.rssi <= rssiMax
        && (!deviceNameFilter || (d.name && d.name.toLowerCase().includes(deviceNameFilter)))
        && ((devicesWithName && d.name !== 'Unknown') || (!devicesWithName)));

    const sortedDevices = filteredDevices.sort((a, b) => b.rssi - a.rssi);
    updateVisualization(sortedDevices);
    updateTable(sortedDevices);
}

function updateVisualization(devices) {
    svg.selectAll('circle,text,line').remove(); // Clear previous elements but keep the SVG

    devices.forEach((device, i) => {
        const angleInitial = (i * 2 * Math.PI / devices.length) - Math.PI / 2;
        let angle = angleInitial;
        const r = rssiScale(device.rssi);
        const lineColor = colorScale(device.rssi);

        function updatePosition() {
            angle += Math.random() * 0.1 - 0.005; // Slightly adjust angle for "floating" effect
            const x = center.x + Math.cos(angle) * r;
            const y = center.y + Math.sin(angle) * r;

            svg.select(`line[data-uuid="${device.uuid}"]`)
                .transition().duration(1000)
                .attr('x2', x)
                .attr('y2', y);

            svg.select(`circle[data-uuid="${device.uuid}"]`)
                .transition().duration(1000)
                .attr('cx', x)
                .attr('cy', y);

            svg.select(`text[data-uuid="${device.uuid}"]`)
                .transition().duration(1000)
                .attr('x', x)
                .attr('y', y + 4); // Adjust for visibility
        }

        svg.append('line')
            .attr('x1', center.x)
            .attr('y1', center.y)
            .attr('x2', center.x + Math.cos(angleInitial) * r)
            .attr('y2', center.y + Math.sin(angleInitial) * r)
            .attr('stroke', lineColor)
            .attr('data-uuid', device.uuid);

        svg.append('circle')
            .attr('cx', center.x + Math.cos(angleInitial) * r)
            .attr('cy', center.y + Math.sin(angleInitial) * r)
            .attr('r', sizeScale(device.distance))
            .attr('fill', lineColor)
            .attr('data-uuid', device.uuid)
            .on('mouseover', function(event) {
                tooltip.style('visibility', 'visible').text(`${device.uuid}-${device.name}`);
            })
            .on('mousemove', function(event) {
                tooltip.style('top', (event.pageY - 10) + 'px').style('left', (event.pageX + 10) + 'px');
            })
            .on('mouseout', function() {
                tooltip.style('visibility', 'hidden');
            });

        svg.append('text')
            .attr('x', center.x + Math.cos(angleInitial) * (r / 2))
            .attr('y', center.y + Math.sin(angleInitial) * (r / 2))
            .attr('text-anchor', 'middle')
            .attr('dominant-baseline', 'middle')
            .attr('fill', 'black')
            .attr('font-size', '10px')
            .attr('data-uuid', device.uuid)
            .text(`${device.distance}m`);

        svg.append('text')
            .attr('x', center.x)
            .attr('y', center.y)
            .attr('text-anchor', 'middle')
            .attr('dominant-baseline', 'middle')
            .attr('fill', 'black')
            .attr('font-size', '30px')
            .attr('data-uuid', device.uuid)
            .text(`${devices.length}`)


        svg.append('text')
            .attr('x', center.x + Math.cos(angleInitial) * r)
            .attr('y', center.y + Math.sin(angleInitial) * r + 4) // Slightly offset for visibility
            .attr('text-anchor', 'middle')
            .attr('dominant-baseline', 'middle')
            .attr('fill', 'blue')
            .attr('font-size', '10px')
            .attr('data-uuid', device.uuid)
            .text(device.name || 'unknown');

        // setInterval(updatePosition, 100); // Update position every second for each device
    });
}

function updateTable(devices) {
    const table = d3.select('#devicesTable');
    table.selectAll('tr.device').remove(); // Clear previous rows

    devices.forEach(device => {
        const row = table.append('tr').attr('class', 'device');
        row.append('td').text(device.name || 'Unknown');
        row.append('td').text(device.rssi);
        row.append('td').text(device.uuid);
        row.append('td').text(device.distance);
    });
}

// Initialize with default frequency
setRefreshFrequency();