document.addEventListener('DOMContentLoaded', () => {
    const db = loadDB();

    const kpis = [
        { area:'Recebimento', indicador:'Acuracidade', meta:'98%', atual:'96%', status:'Abaixo' },
        { area:'Separação', indicador:'Produtividade', meta:'100%', atual:'102%', status:'Ok' },
        { area:'Expedição', indicador:'Prazo', meta:'95%', atual:'93%', status:'Atenção' },
        { area:'Estoque', indicador:'Inventário', meta:'99%', atual:'98%', status:'Ok' }
    ];

    const tbody = document.getElementById('dashboardSummary');
    if(tbody){
        tbody.innerHTML = kpis.map(k => `
            <tr>
                <td>${k.area}</td>
                <td>${k.indicador}</td>
                <td>${k.meta}</td>
                <td>${k.atual}</td>
                <td>${k.status}</td>
            </tr>
        `).join('');
    }

    const kpiGrid = document.getElementById('kpiGrid');
    if(kpiGrid){
        kpiGrid.innerHTML = `
            <div class="kpi"><span>Processos</span><strong>${db.processos?.length || 0}</strong></div>
            <div class="kpi"><span>Perdas</span><strong>${db.perdas?.length || 0}</strong></div>
            <div class="kpi"><span>Planos</span><strong>${db.planos?.length || 0}</strong></div>
            <div class="kpi"><span>Indicadores</span><strong>${db.indicadores?.length || 0}</strong></div>
        `;
    }
});
function loadModule(key){
    return JSON.parse(localStorage.getItem(key) || '[]');
}

function trendText(current, previous){
    const diff = current - previous;
    const pct = previous === 0 ? 100 : ((diff / previous) * 100).toFixed(1);
    if(diff > 0) return { text: `↑ +${diff} (${pct}%)`, cls: 'up' };
    if(diff < 0) return { text: `↓ ${diff} (${pct}%)`, cls: 'down' };
    return { text: '→ estável', cls: 'flat' };
}

function avg(arr, field){
    if(!arr.length) return 0;
    return arr.reduce((a,b)=>a + Number(b[field] || 0), 0) / arr.length;
}

document.addEventListener('DOMContentLoaded', () => {
    const bpm = loadModule('bpm-armazem-v1');
    const pdca = JSON.parse(localStorage.getItem('pdca-armazem-v2') || '{}');
    const lean = JSON.parse(localStorage.getItem('lean-armazem-v1') || '{}');

    const processos = bpm.length;
    const macro = new Set(bpm.map(i => i.macroprocesso)).size;
    const sub = bpm.length;
    const areasBpm = new Set(bpm.map(i => i.area)).size;

    const pdcaProcessos = pdca.processos?.length || 0;
    const perdas = pdca.perdas?.length || 0;
    const planosAbertos = pdca.planos?.filter(p => p.status !== 'Concluído').length || 0;
    const indicadores = pdca.indicadores?.length || 0;

    const s5 = lean.s5 || [];
    const desperdicios = lean.desperdicios || [];
    const auditorias = lean.auditorias || [];
    const melhorias = lean.melhorias || [];

    const lean5s = s5.length ? avg(s5, 'score').toFixed(0) : 0;
    const leanAudit = auditorias.length;
    const leanDes = desperdicios.length;
    const leanPlan = melhorias.filter(i => i.status !== 'Concluído').length;

    const prev = {
        bpm: Number(localStorage.getItem('prev_bpm') || Math.max(0, processos - 1)),
        pdca: Number(localStorage.getItem('prev_pdca') || Math.max(0, planosAbertos - 1)),
        lean: Number(localStorage.getItem('prev_lean') || Math.max(0, Number(lean5s) - 1)),
        losses: Number(localStorage.getItem('prev_losses') || Math.max(0, perdas - 1))
    };

    localStorage.setItem('prev_bpm', processos);
    localStorage.setItem('prev_pdca', planosAbertos);
    localStorage.setItem('prev_lean', lean5s);
    localStorage.setItem('prev_losses', perdas);

    const trBpm = trendText(processos, prev.bpm);
    const trPdca = trendText(planosAbertos, prev.pdca);
    const trLean = trendText(Number(lean5s), prev.lean);
    const trLoss = trendText(perdas, prev.losses);

    document.getElementById('trendBpm').textContent = trBpm.text;
    document.getElementById('trendPdca').textContent = trPdca.text;
    document.getElementById('trendLean').textContent = trLean.text;
    document.getElementById('trendLosses').textContent = trLoss.text;

    document.getElementById('trendBpmDetail').textContent = `${macro} macroprocessos, ${sub} subprocessos e ${areasBpm} áreas mapeadas.`;
    document.getElementById('trendPdcaDetail').textContent = `${pdcaProcessos} processos, ${perdas} perdas e ${indicadores} indicadores.`;
    document.getElementById('trendLeanDetail').textContent = `${leanAudit} auditorias, ${leanDes} desperdícios e ${leanPlan} melhorias abertas.`;
    document.getElementById('trendLossesDetail').textContent = `Último saldo: ${perdas} perdas registradas.`;

    const summary = [
        { modulo:'BPM', indicador:'Processos mapeados', atual:processos, meta:'100%', tendencia:trBpm.text, status:processos > 0 ? 'Ok' : 'Sem dados' },
        { modulo:'BPM', indicador:'Macroprocessos', atual:macro, meta:'5+', tendencia:trendText(macro, Math.max(0, prev.bpm-1)).text, status:macro > 0 ? 'Ok' : 'Sem dados' },
        { modulo:'PDCA', indicador:'Planos em aberto', atual:planosAbertos, meta:'0', tendencia:trPdca.text, status:planosAbertos === 0 ? 'Concluído' : 'Atenção' },
        { modulo:'PDCA', indicador:'Perdas', atual:perdas, meta:'Reduzir', tendencia:trLoss.text, status:perdas === 0 ? 'Ok' : 'Atenção' },
        { modulo:'Lean', indicador:'5S médio', atual:`${lean5s}%`, meta:'90%+', tendencia:trLean.text, status:Number(lean5s) >= 90 ? 'Ok' : 'Atenção' },
        { modulo:'Lean', indicador:'Auditorias', atual:leanAudit, meta:'Mensal', tendencia:trendText(leanAudit, Math.max(0, leanAudit - 1)).text, status:leanAudit > 0 ? 'Ok' : 'Sem dados' }
    ];

    const tbody = document.getElementById('dashboardSummary');
    tbody.innerHTML = summary.map(r => `
        <tr>
            <td>${r.modulo}</td>
            <td>${r.indicador}</td>
            <td>${r.atual}</td>
            <td>${r.meta}</td>
            <td>${r.tendencia}</td>
            <td>${r.status}</td>
        </tr>
    `).join('');

    const kpiGrid = document.getElementById('kpiGrid');
    kpiGrid.innerHTML = `
        <div class="kpi"><span>BPM</span><strong>${processos}</strong></div>
        <div class="kpi"><span>PDCA</span><strong>${pdcaProcessos}</strong></div>
        <div class="kpi"><span>Lean</span><strong>${leanAudit + leanDes + leanPlan + s5.length}</strong></div>
        <div class="kpi"><span>Perdas</span><strong>${perdas}</strong></div>
        <div class="kpi"><span>5S médio</span><strong>${lean5s}%</strong></div>
        <div class="kpi"><span>Planos abertos</span><strong>${planosAbertos}</strong></div>
    `;
});
const DAYS = 30;

function loadJSON(key, fallback){
    try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback)); }
    catch { return fallback; }
}

function saveJSON(key, value){
    localStorage.setItem(key, JSON.stringify(value));
}

function pushHistory(key, value){
    const arr = loadJSON(key, []);
    arr.push({ d: new Date().toISOString().slice(0,10), v: Number(value) || 0 });
    while(arr.length > DAYS) arr.shift();
    saveJSON(key, arr);
    return arr;
}

function sparklineSVG(data, width=160, height=46){
    const values = data.map(x => Number(x.v ?? x));
    if(!values.length) return '<svg viewBox="0 0 160 46" class="spark-empty"></svg>';
    const min = Math.min(...values), max = Math.max(...values);
    const range = (max - min) || 1;
    const step = width / Math.max(values.length - 1, 1);
    const pts = values.map((v, i) => `${(i*step).toFixed(1)},${(height - ((v-min)/range)*height).toFixed(1)}`).join(' ');
    return `<svg viewBox="0 0 ${width} ${height}" class="spark"><polyline points="${pts}" /></svg>`;
}

function trendLabel(history){
    if(history.length < 2) return 'Sem histórico';
    const last = history[history.length-1].v;
    const prev = history[history.length-2].v;
    const diff = last - prev;
    const pct = prev === 0 ? 100 : ((diff / prev) * 100).toFixed(1);
    if(diff > 0) return `↑ +${diff} (${pct}%)`;
    if(diff < 0) return `↓ ${diff} (${pct}%)`;
    return '→ estável';
}

function loadModule(key){
    return JSON.parse(localStorage.getItem(key) || '[]');
}

document.addEventListener('DOMContentLoaded', () => {
    const bpm = loadModule('bpm-armazem-v1');
    const pdca = loadJSON('pdca-armazem-v2', {});
    const lean = loadJSON('lean-armazem-v1', {});

    const bpmCount = bpm.length;
    const pdcaPlans = pdca.planos?.filter(p => p.status !== 'Concluído').length || 0;
    const leanS5 = lean.s5?.length ? (lean.s5.reduce((a,b)=>a+Number(b.score||0),0)/lean.s5.length).toFixed(0) : 0;
    const losses = pdca.perdas?.length || 0;

    const hBpm = pushHistory('hist_bpm', bpmCount);
    const hPdca = pushHistory('hist_pdca', pdcaPlans);
    const hLean = pushHistory('hist_lean', leanS5);
    const hLoss = pushHistory('hist_loss', losses);

    const items = [
        { title:'BPM', value:bpmCount, meta:'Processos mapeados', history:hBpm, unit:'' },
        { title:'PDCA', value:pdcaPlans, meta:'Planos em aberto', history:hPdca, unit:'' },
        { title:'Lean', value:leanS5, meta:'5S médio', history:hLean, unit:'%' },
        { title:'Perdas', value:losses, meta:'Ocorrências', history:hLoss, unit:'' }
    ];

    const kpiGrid = document.getElementById('kpiGrid');
    kpiGrid.innerHTML = items.map((it, i) => `
        <div class="kpi spark-card">
            <span>${it.title}</span>
            <strong>${it.value}${it.unit}</strong>
            <div class="spark-wrap">${sparklineSVG(it.history)}</div>
            <small class="small">${trendLabel(it.history)}</small>
        </div>
    `).join('');

    const summary = [
        ['BPM','Processos',bpmCount,'Meta de cobertura','—', bpmCount > 0 ? 'Ok' : 'Sem dados'],
        ['PDCA','Planos abertos',pdcaPlans,'0','—', pdcaPlans === 0 ? 'Ok' : 'Atenção'],
        ['Lean','5S médio',`${leanS5}%`,'90%+','—', Number(leanS5) >= 90 ? 'Ok' : 'Atenção'],
        ['PDCA','Perdas',losses,'Reduzir','—', losses === 0 ? 'Ok' : 'Atenção']
    ];

    document.getElementById('dashboardSummary').innerHTML = summary.map(r => `
        <tr>
            <td>${r[0]}</td>
            <td>${r[1]}</td>
            <td>${r[2]}</td>
            <td>${r[3]}</td>
            <td>${r[4]}</td>
            <td>${r[5]}</td>
        </tr>
    `).join('');
});
const DAYS = 30;

function loadJSON(key, fallback){
    try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback)); }
    catch { return fallback; }
}

function saveJSON(key, value){
    localStorage.setItem(key, JSON.stringify(value));
}

function pushHistory(key, value){
    const arr = loadJSON(key, []);
    arr.push({ d: new Date().toISOString().slice(0,10), v: Number(value) || 0 });
    while(arr.length > DAYS) arr.shift();
    saveJSON(key, arr);
    return arr;
}

function trendLabel(history){
    if(history.length < 2) return 'Sem histórico';
    const last = history[history.length-1].v;
    const prev = history[history.length-2].v;
    const diff = last - prev;
    const pct = prev === 0 ? 100 : ((diff / prev) * 100).toFixed(1);
    if(diff > 0) return `↑ +${diff} (${pct}%)`;
    if(diff < 0) return `↓ ${diff} (${pct}%)`;
    return '→ estável';
}

function loadModule(key){
    return JSON.parse(localStorage.getItem(key) || '[]');
}

function makeLineChart(labels, datasets){
    const ctx = document.getElementById('lineChart');
    if(!ctx) return;
    if(window.lineChartInstance) window.lineChartInstance.destroy();

    window.lineChartInstance = new Chart(ctx, {
        type: 'line',
        data: { labels, datasets },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: { mode: 'index', intersect: false },
            plugins: {
                legend: { position: 'top' }
            },
            scales: {
                y: { beginAtZero: true, grid: { color: 'rgba(148,163,184,.15)' } },
                x: { grid: { color: 'rgba(148,163,184,.08)' } }
            }
        }
    });
}

function makeDonutChart(labels, data){
    const ctx = document.getElementById('donutChart');
    if(!ctx) return;
    if(window.donutChartInstance) window.donutChartInstance.destroy();

    window.donutChartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels,
            datasets: [{
                data,
                backgroundColor: ['#38bdf8', '#22c55e', '#f59e0b', '#ef4444', '#a855f7', '#14b8a6'],
                borderColor: '#0f172a',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '62%',
            plugins: {
                legend: { position: 'bottom' }
            }
        }
    });
}

document.addEventListener('DOMContentLoaded', () => {
    const bpm = loadModule('bpm-armazem-v1');
    const pdca = loadJSON('pdca-armazem-v2', {});
    const lean = loadJSON('lean-armazem-v1', {});

    const processos = bpm.length;
    const macro = new Set(bpm.map(i => i.macroprocesso)).size;
    const sub = bpm.length;
    const areasBpm = new Set(bpm.map(i => i.area)).size;

    const pdcaProcessos = pdca.processos?.length || 0;
    const perdas = pdca.perdas?.length || 0;
    const planosAbertos = pdca.planos?.filter(p => p.status !== 'Concluído').length || 0;
    const indicadores = pdca.indicadores?.length || 0;

    const s5 = lean.s5 || [];
    const desperdicios = lean.desperdicios || [];
    const auditorias = lean.auditorias || [];
    const melhorias = lean.melhorias || [];

    const lean5s = s5.length ? (s5.reduce((a,b)=>a+Number(b.score||0),0)/s5.length).toFixed(0) : 0;
    const leanAudit = auditorias.length;
    const leanDes = desperdicios.length;
    const leanPlan = melhorias.filter(i => i.status !== 'Concluído').length;

    const hBpm = pushHistory('hist_bpm', processos);
    const hPdca = pushHistory('hist_pdca', planosAbertos);
    const hLean = pushHistory('hist_lean', lean5s);
    const hLoss = pushHistory('hist_loss', perdas);

    const last30 = Array.from({length: Math.min(DAYS, Math.max(hBpm.length, hPdca.length, hLean.length, hLoss.length))}, (_,i)=>i+1);

    const currentLabels = last30.map(d => `D-${last30.length-d+1}`);

    const seriesBpm = currentLabels.map((_, i) => hBpm[i]?.v ?? null);
    const seriesPdca = currentLabels.map((_, i) => hPdca[i]?.v ?? null);
    const seriesLean = currentLabels.map((_, i) => hLean[i]?.v ?? null);
    const seriesLoss = currentLabels.map((_, i) => hLoss[i]?.v ?? null);

    document.getElementById('kpiGrid').innerHTML = `
        <div class="kpi"><span>BPM</span><strong>${processos}</strong><small class="small">${trendLabel(hBpm)}</small></div>
        <div class="kpi"><span>PDCA</span><strong>${pdcaProcessos}</strong><small class="small">${trendLabel(hPdca)}</small></div>
        <div class="kpi"><span>Lean</span><strong>${leanAudit + leanDes + leanPlan + s5.length}</strong><small class="small">${trendLabel(hLean)}</small></div>
        <div class="kpi"><span>Perdas</span><strong>${perdas}</strong><small class="small">${trendLabel(hLoss)}</small></div>
        <div class="kpi"><span>5S médio</span><strong>${lean5s}%</strong><small class="small">Última leitura</small></div>
        <div class="kpi"><span>Planos abertos</span><strong>${planosAbertos}</strong><small class="small">${trendLabel(hPdca)}</small></div>
    `;

    document.getElementById('dashboardSummary').innerHTML = `
        <tr><td>BPM</td><td>Processos mapeados</td><td>${processos}</td><td>100%</td><td>${trendLabel(hBpm)}</td><td>${processos > 0 ? 'Ok' : 'Sem dados'}</td></tr>
        <tr><td>BPM</td><td>Macroprocessos</td><td>${macro}</td><td>5+</td><td>${macro > 0 ? '→ estável' : 'Sem dados'}</td><td>${macro > 0 ? 'Ok' : 'Sem dados'}</td></tr>
        <tr><td>PDCA</td><td>Planos em aberto</td><td>${planosAbertos}</td><td>0</td><td>${trendLabel(hPdca)}</td><td>${planosAbertos === 0 ? 'Ok' : 'Atenção'}</td></tr>
        <tr><td>PDCA</td><td>Perdas</td><td>${perdas}</td><td>Reduzir</td><td>${trendLabel(hLoss)}</td><td>${perdas === 0 ? 'Ok' : 'Atenção'}</td></tr>
        <tr><td>Lean</td><td>5S médio</td><td>${lean5s}%</td><td>90%+</td><td>${trendLabel(hLean)}</td><td>${Number(lean5s) >= 90 ? 'Ok' : 'Atenção'}</td></tr>
        <tr><td>Lean</td><td>Auditorias</td><td>${leanAudit}</td><td>Mensal</td><td>→ estável</td><td>${leanAudit > 0 ? 'Ok' : 'Sem dados'}</td></tr>
    `;

    makeLineChart(currentLabels, [
        { label:'BPM', data: seriesBpm, borderColor:'#38bdf8', backgroundColor:'rgba(56,189,248,.12)', tension:.35, fill:false },
        { label:'PDCA', data: seriesPdca, borderColor:'#22c55e', backgroundColor:'rgba(34,197,94,.12)', tension:.35, fill:false },
        { label:'Lean', data: seriesLean, borderColor:'#f59e0b', backgroundColor:'rgba(245,158,11,.12)', tension:.35, fill:false },
        { label:'Perdas', data: seriesLoss, borderColor:'#ef4444', backgroundColor:'rgba(239,68,68,.12)', tension:.35, fill:false }
    ]);

    makeDonutChart(
        ['BPM','PDCA','Lean','Perdas'],
        [processos, pdcaProcessos, leanAudit + leanDes + leanPlan + s5.length, perdas]
    );
});