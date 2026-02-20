document.addEventListener('DOMContentLoaded', () => {
    // ========== RELAY CONTROL ==========
    const mainRelay = document.getElementById('mainRelay');
    const subRelays = [
        document.getElementById('relay1'),
        document.getElementById('relay2'),
        document.getElementById('relay3'),
        document.getElementById('relay4')
    ];

    // Update sub-relays state based on main relay
    function updateSubRelaysState() {
        const enabled = mainRelay.checked;
        subRelays.forEach(relay => {
            relay.disabled = !enabled;
            if (!enabled) relay.checked = false;
        });
    }

    // Initial state
    updateSubRelaysState();

    // Main relay event listener
    mainRelay.addEventListener('change', () => {
        updateSubRelaysState();
        console.log('Main relay toggled:', mainRelay.checked);

        // ===== UNCOMMENT THIS FOR SERVER CONNECTION =====
        fetch(`http://localhost/electricity_monitoring/api/sync_main_relay.php?relay_status=${mainRelay.checked ? 1 : 0}`)
            .then(response => response.json())
            .then(data => console.log('Main relay updated:', data))
            .catch(err => console.error('API error:', err));
        // ================================================
    });

    // Sub-relays event listeners
    subRelays.forEach((relay, index) => {
        relay.addEventListener('change', () => {
            console.log(`Load ${index + 1} toggled:`, relay.checked);

            // ===== UNCOMMENT THIS FOR SERVER CONNECTION =====
            fetch(`http://localhost/electricity_monitoring/api/sync_relay_control.php?relay${index + 1}=${relay.checked ? 1 : 0}`)
                .then(response => response.json())
                .then(data => console.log(`Relay ${index + 1} updated:`, data))
                .catch(err => console.error('API error:', err));
            // ================================================
        });
    });

    // ========== CHART INITIALIZATION ==========
    const chartDefaults = {
        type: 'line',
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: { mode: 'index', intersect: false }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: { color: '#e9eef3' },
                    ticks: { callback: (value) => value }
                },
                x: {
                    grid: { display: false },
                    ticks: { maxRotation: 45, minRotation: 30 }
                }
            },
            elements: {
                line: { tension: 0.2, borderWidth: 2.5 },
                point: { radius: 2, hoverRadius: 4 }
            }
        }
    };

    // Voltage Chart
    const ctxVoltage = document.getElementById('voltageGraph').getContext('2d');
    const voltageChart = new Chart(ctxVoltage, {
        ...chartDefaults,
        data: {
            labels: [],
            datasets: [{
                label: 'Voltage (V)',
                data: [],
                borderColor: '#2563eb',
                backgroundColor: '#2563eb20',
                fill: false
            }]
        }
    });

    // Current Chart
    const ctxAmpere = document.getElementById('ampereGraph').getContext('2d');
    const ampereChart = new Chart(ctxAmpere, {
        ...chartDefaults,
        data: {
            labels: [],
            datasets: [{
                label: 'Current (A)',
                data: [],
                borderColor: '#16a34a',
                backgroundColor: '#16a34a20',
                fill: false
            }]
        }
    });

    // Power Chart
    const ctxPower = document.getElementById('powerGraph').getContext('2d');
    const powerChart = new Chart(ctxPower, {
        ...chartDefaults,
        data: {
            labels: [],
            datasets: [{
                label: 'Power (W)',
                data: [],
                borderColor: '#dc2626',
                backgroundColor: '#dc262620',
                fill: false
            }]
        }
    });

    // ========== LIVE DATA - CHOOSE ONE OPTION ==========

    // OPTION A: SIMULATION MODE (comment this out when connecting to server)
    /*
    // DOM elements for live stats
    const liveVoltageEl = document.getElementById('liveVoltage');
    const liveAmpereEl = document.getElementById('liveAmpere');
    const livePowerEl = document.getElementById('livePower');
    const liveFreqEl = document.getElementById('liveFrequency');
    const tableBody = document.getElementById('dataTableBody');

    // Base values for simulation
    let baseVoltage = 225;
    let baseCurrent = 3.2;
    let basePower = 690;
    let baseFreq = 50.0;
    let basePF = 0.94;
    const baseEnergy = 12.45;

    // Generate a single data row
    function generateRow(sl, timeLabel) {
        // Get current relay states
        const mainState = mainRelay.checked ? 'ON' : 'OFF';
        const r1 = document.getElementById('relay1').checked ? 'ON' : 'OFF';
        const r2 = document.getElementById('relay2').checked ? 'ON' : 'OFF';
        const r3 = document.getElementById('relay3').checked ? 'ON' : 'OFF';
        const r4 = document.getElementById('relay4').checked ? 'ON' : 'OFF';

        return {
            sl, timeLabel,
            v: baseVoltage.toFixed(1),
            a: baseCurrent.toFixed(2),
            p: basePower.toFixed(0),
            f: baseFreq.toFixed(1),
            pf: basePF.toFixed(2),
            energy: (baseEnergy + (Math.random() * 0.5)).toFixed(2),
            mainState, r1, r2, r3, r4
        };
    }

    // Update dashboard with new data
    function updateDashboard() {
        // Simulate realistic variations
        baseVoltage = Math.min(250, Math.max(200, baseVoltage + (Math.random() * 2 - 1)));
        baseCurrent = Math.min(6.5, Math.max(1.2, baseCurrent + (Math.random() * 0.2 - 0.1)));
        basePower = baseVoltage * baseCurrent * (0.92 + Math.random() * 0.06);
        baseFreq = Math.min(50.3, Math.max(49.6, baseFreq + (Math.random() * 0.1 - 0.05)));
        basePF = Math.min(0.99, Math.max(0.85, basePF + (Math.random() * 0.02 - 0.01)));

        // Round values
        const vNum = Number(baseVoltage.toFixed(1));
        const aNum = Number(baseCurrent.toFixed(2));
        const pNum = Number(basePower.toFixed(0));
        const fNum = Number(baseFreq.toFixed(1));

        // Update live stats cards
        liveVoltageEl.innerHTML = `${vNum} <span class="stat-unit">V</span>`;
        liveAmpereEl.innerHTML = `${aNum.toFixed(2)} <span class="stat-unit">A</span>`;
        livePowerEl.innerHTML = `${pNum} <span class="stat-unit">W</span>`;
        liveFreqEl.innerHTML = `${fNum.toFixed(1)} <span class="stat-unit">Hz</span>`;

        // Update charts (keep last 15 points)
        const now = new Date();
        const timeLabel = now.toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit', 
            second: '2-digit' 
        });

        [voltageChart, ampereChart, powerChart].forEach(chart => {
            if (chart.data.labels.length > 15) {
                chart.data.labels.shift();
                chart.data.datasets[0].data.shift();
            }
        });

        voltageChart.data.labels.push(timeLabel);
        voltageChart.data.datasets[0].data.push(vNum);

        ampereChart.data.labels.push(timeLabel);
        ampereChart.data.datasets[0].data.push(aNum);

        powerChart.data.labels.push(timeLabel);
        powerChart.data.datasets[0].data.push(pNum);

        voltageChart.update();
        ampereChart.update();
        powerChart.update();

        // Add new row to table
        const fullTimeStr = now.toLocaleTimeString() + ' ' + 
            now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
        
        const newRowData = generateRow(tableBody.children.length + 1, fullTimeStr);
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${newRowData.sl}</td>
            <td>${newRowData.timeLabel}</td>
            <td>${newRowData.v} V</td>
            <td>${newRowData.p} W</td>
            <td>${newRowData.a} A</td>
            <td>${newRowData.f} Hz</td>
            <td>${newRowData.pf}</td>
            <td>${newRowData.energy} kWh</td>
            <td>${newRowData.mainState}</td>
            <td>${newRowData.r1}</td>
            <td>${newRowData.r2}</td>
            <td>${newRowData.r3}</td>
            <td>${newRowData.r4}</td>
        `;

        tableBody.prepend(row);

        // Keep only last 8 rows
        while (tableBody.children.length > 8) {
            tableBody.removeChild(tableBody.lastChild);
        }
    }

    // Start periodic updates (every 2 seconds)
    setInterval(updateDashboard, 2000);

    // Initial population (5 quick updates)
    for (let i = 0; i < 5; i++) {
        setTimeout(() => updateDashboard(), i * 300);
    }
    */

    // OPTION B: REAL SERVER DATA (UNCOMMENT THIS FOR SERVER CONNECTION)

    // DOM elements for live stats
    const liveVoltageEl = document.getElementById('liveVoltage');
    const liveAmpereEl = document.getElementById('liveAmpere');
    const livePowerEl = document.getElementById('livePower');
    const liveFreqEl = document.getElementById('liveFrequency');
    const tableBody = document.getElementById('dataTableBody');

    // Fetch real data from server
    function fetchServerData() {
        fetch('http://localhost/electricity_monitoring/api/fetch_sensor_data.php')
            .then(response => response.json())
            .then(data => {
                // Update live stats with real data
                liveVoltageEl.innerHTML = `${data.voltage} <span class="stat-unit">V</span>`;
                liveAmpereEl.innerHTML = `${data.current} <span class="stat-unit">A</span>`;
                livePowerEl.innerHTML = `${data.power} <span class="stat-unit">W</span>`;
                liveFreqEl.innerHTML = `${data.frequency} <span class="stat-unit">Hz</span>`;

                // Update charts
                const now = new Date();
                const timeLabel = now.toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit'
                });

                [voltageChart, ampereChart, powerChart].forEach(chart => {
                    if (chart.data.labels.length > 15) {
                        chart.data.labels.shift();
                        chart.data.datasets[0].data.shift();
                    }
                });

                voltageChart.data.labels.push(timeLabel);
                voltageChart.data.datasets[0].data.push(data.voltage);

                ampereChart.data.labels.push(timeLabel);
                ampereChart.data.datasets[0].data.push(data.current);

                powerChart.data.labels.push(timeLabel);
                powerChart.data.datasets[0].data.push(data.power);

                voltageChart.update();
                ampereChart.update();
                powerChart.update();

                // Add row to table
                const fullTimeStr = now.toLocaleTimeString() + ' ' +
                    now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });

                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${tableBody.children.length + 1}</td>
                    <td>${fullTimeStr}</td>
                    <td>${data.voltage} V</td>
                    <td>${data.power} W</td>
                    <td>${data.current} A</td>
                    <td>${data.frequency} Hz</td>
                    <td>${data.power_factor || '0.95'}</td>
                    <td>${data.energy || '0.00'} kWh</td>
                    <td>${mainRelay.checked ? 'ON' : 'OFF'}</td>
                    <td>${document.getElementById('relay1').checked ? 'ON' : 'OFF'}</td>
                    <td>${document.getElementById('relay2').checked ? 'ON' : 'OFF'}</td>
                    <td>${document.getElementById('relay3').checked ? 'ON' : 'OFF'}</td>
                    <td>${document.getElementById('relay4').checked ? 'ON' : 'OFF'}</td>
                `;

                tableBody.prepend(row);

                // Keep only last 8 rows
                while (tableBody.children.length > 8) {
                    tableBody.removeChild(tableBody.lastChild);
                }
            })
            .catch(err => {
                console.error('API error:', err);
                // Optional: Show error message on dashboard
                document.querySelector('.status-badge').innerHTML =
                    '<i class="fas fa-exclamation-triangle" style="color: #f59e0b;"></i> CONNECTION ERROR';
            });
    }

    // Fetch data every 2 seconds
    setInterval(fetchServerData, 2000);

    // Initial fetch
    fetchServerData();

    // ========== UTILITY FUNCTIONS ==========
    // Check online status
    window.addEventListener('online', () => {
        document.querySelector('.status-badge').innerHTML =
            '<i class="fas fa-circle" style="font-size: 0.6rem;"></i> ONLINE · connected to server';
    });

    window.addEventListener('offline', () => {
        document.querySelector('.status-badge').innerHTML =
            '<i class="fas fa-circle" style="color: #ef4444; font-size: 0.6rem;"></i> OFFLINE · check connection';
    });
});
