// WMS STRATEGIC FLOW - DASHBOARD
document.addEventListener('DOMContentLoaded', function() {
    loadKPIs();
    loadSummary();
    loadCharts();
    if (document.getElementById('exportBtn')) document.getElementById('exportBtn').addEventListener('click', exportReport);
    if (document.getElementById('refreshBtn')) document.getElementById('refreshBtn').addEventListener('click', () => { loadKPIs(); loadSummary(); });
    if (document.getElementById('toggleSidebar')) document.getElementById('toggleSidebar').addEventListener('click', () => { document.getElementById('sidebar').classList.toggle('active'); });
    if (document.getElementById('mobileMenuBtn')) document.getElementById('mobileMenuBtn').addEventListener('click', () => { document.getElementById('sidebar').classList.toggle('active'); });
});

function loadKPIs() {
    const kpis = Storage.getData().kpis;
    if (document.getElementById('kpiOtif')) document.getElementById('kpiOtif').textContent = kpis.otif + '%';
    if (document.getElementById('kpiAccuracy')) document.getElementById('kpiAccuracy').textContent = kpis.accuracy + '%';
    if (document.getElementById('kpiPicking')) document.getElementById('kpiPicking').textContent = kpis.picking.toFixed(1) + ' min';
    if (document.getElementById('kpiDamages')) document.getElementById('kpiDamages').textContent = kpis.damages + '%';
    if (document.getElementById('kpiProductivity')) document.getElementById('kpiProductivity').textContent = kpis.productivity + ' ped/h';
    if (document.getElementById('kpiLeadTime')) document.getElementById('kpiLeadTime').textContent = kpis.leadTime.toFixed(1) + ' h';
    if (document.getElementById('otifValue')) document.getElementById('otifValue').textContent = kpis.otif + '%';
    if (document.getElementById('accuracyValue')) document.getElementById('accuracyValue').textContent = kpis.accuracy + '%';
    if (document.getElementById('totalOrders')) document.getElementById('totalOrders').textContent = Storage.getData().orders.today;
}

function loadSummary() {
    const kpis = Storage.getData().kpis;
    const summary = [
        { area: 'OTIF', indicator: 'On-Time In-Full', target: '95%', current: kpis.otif + '%', status: kpis.otif >= 95 ? 'ok' : 'warning', trend: '+2.3%' },
        { area: 'Inventário', indicator: 'Precisão', target: '98%', current: kpis.accuracy + '%', status: kpis.accuracy >= 98 ? 'ok' : 'warning', trend: '+5.1%' },
        { area: 'Picking', indicator: 'Tempo médio', target: '< 10 min', current: kpis.picking.toFixed(1) + ' min', status: kpis.picking < 10 ? 'ok' : 'warning', trend: '+1.2 min' },
        { area: 'Avarias', indicator: '% total', target: '< 2%', current: kpis.damages + '%', status: kpis.damages < 2 ? 'ok' : 'danger', trend: '-1.5%' },
        { area: 'Produtividade', indicator: 'Pedidos/hora', target: '80 ped/h', current: kpis.productivity + ' ped/h', status: kpis.productivity >= 80 ? 'ok' : 'warning', trend: '+12%' },
        { area: 'Lead Time', indicator: 'Recebimento → Expedição', target: '< 24 h', current: kpis.leadTime.toFixed(1) + ' h', status: kpis.leadTime < 24 ? 'ok' : 'warning', trend: '-4 h' }
    ];
    const tbody = document.getElementById('dashboardSummary');
    if (!tbody) return;
    tbody.innerHTML = summary.map(row => `<tr><td><strong>${row.area}</strong></td><td>${row.indicator}</td><td>${row.target}</td><td><strong>${row.current}</strong></td><td><span class="status ${row.status}">${row.status === 'ok' ? 'OK' : 'Atenção'}</span></td><td>${row.trend}</td></tr>`).join('');
}

function loadCharts() {
    const lineCtx = document.getElementById('lineChart');
    if (lineCtx) {
        new Chart(lineCtx.getContext('2d'), {
            type: 'line',
            data: {
                labels: ['Semana 1', 'Semana 2', 'Semana 3', 'Semana 4'],
                datasets: [{
                    label: 'Desempenho',
                    data: [92, 95, 96, 94],
                    borderColor: '#4CAF50',
                    backgroundColor: 'rgba(76, 175, 80, 0.2)',
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    }
                }
            }
        });
    }
}
