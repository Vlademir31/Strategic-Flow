const DB_KEY = 'lean-armazem-v1';
const db = JSON.parse(localStorage.getItem(DB_KEY) || '{}');
db.s5 ||= [];
db.desperdicios ||= [];
db.auditorias ||= [];
db.melhorias ||= [];

const filtros = { area:'', status:'', tipo:'', busca:'' };

function saveDB(){ localStorage.setItem(DB_KEY, JSON.stringify(db)); }
function uid(){ return Date.now() + '-' + Math.random().toString(36).slice(2,8); }
function v(id){ return document.getElementById(id).value.trim(); }

function registrosLean(){
    return [
        ...db.s5.map(i => ({tipo:'5S', area:i.area, descricao:`Score ${i.score}`, status:i.status})),
        ...db.desperdicios.map(i => ({tipo:'Desperdício', area:i.area, descricao:`${i.tipo} - ${i.obs}`, status:i.status})),
        ...db.auditorias.map(i => ({tipo:'Auditoria', area:i.area, descricao:`Score ${i.score} - ${i.auditor}`, status:i.status})),
        ...db.melhorias.map(i => ({tipo:'Melhoria', area:i.area, descricao:i.acao, status:i.status}))
    ];
}

function refreshKPIs(){
    const s5 = db.s5.length ? (db.s5.reduce((a,b)=>a+Number(b.score||0),0)/db.s5.length).toFixed(0) : 0;
    document.getElementById('kpiAuditorias').textContent = db.auditorias.length;
    document.getElementById('kpi5s').textContent = s5 + '%';
    document.getElementById('kpiDesperdicios').textContent = db.desperdicios.length;
    document.getElementById('kpiPlanosLean').textContent = db.melhorias.filter(i => i.status !== 'Concluído').length;

    document.getElementById('dashLean5s').textContent = s5 + '%';
    document.getElementById('dashLeanCriticos').textContent = db.desperdicios.filter(i => Number(i.impacto) >= 10).length;
    document.getElementById('dashLeanAud').textContent = db.auditorias.filter(i => i.status === 'Concluído').length;
    document.getElementById('dashLeanPlanos').textContent = db.melhorias.filter(i => i.status !== 'Concluído').length;
}

function renderTable(){
    const rows = registrosLean().filter(r =>
        (!filtros.area || r.area.toLowerCase().includes(filtros.area.toLowerCase())) &&
        (!filtros.status || r.status === filtros.status) &&
        (!filtros.tipo || r.tipo.toLowerCase().includes(filtros.tipo.toLowerCase())) &&
        (!filtros.busca || (r.tipo + ' ' + r.area + ' ' + r.descricao + ' ' + r.status).toLowerCase().includes(filtros.busca.toLowerCase()))
    );

    document.getElementById('tabelaLean').innerHTML = rows.map(r => `
        <tr>
            <td>${r.tipo}</td>
            <td>${r.area}</td>
            <td>${r.descricao}</td>
            <td>${r.status}</td>
        </tr>
    `).join('');
}

function refresh(){
    saveDB();
    refreshKPIs();
    renderTable();
}

function addLean(type, obj){
    db[type].unshift({ id:uid(), ...obj });
    refresh();
}

document.getElementById('btnSalvar5S').onclick = () => addLean('s5', { area:v('sArea'), score:v('sScore'), status:document.getElementById('sStatus').value, obs:v('sObs') });
document.getElementById('btnSalvarDesperdicio').onclick = () => addLean('desperdicios', { tipo:v('dTipo'), area:v('dArea'), impacto:v('dImpacto'), status:document.getElementById('dStatus').value, obs:v('dObs') });
document.getElementById('btnSalvarAuditoria').onclick = () => addLean('auditorias', { area:v('aArea'), auditor:v('aAuditor'), score:v('aScore'), status:document.getElementById('aStatus').value, obs:v('aObs') });
document.getElementById('btnSalvarPlano').onclick = () => addLean('melhorias', { area:v('pArea'), acao:v('pAcao'), responsavel:v('pResp'), prazo:document.getElementById('pPrazo').value, status:document.getElementById('pStatus').value, obs:v('pObs') });

document.getElementById('btnExport5SJson').onclick = () => exportJSON(db.s5, '5s.json');
document.getElementById('btnExport5SCsv').onclick = () => exportCSV(db.s5, ['area','score','status','obs'], '5s.csv');
document.getElementById('btnExportDespJson').onclick = () => exportJSON(db.desperdicios, 'desperdicios.json');
document.getElementById('btnExportDespCsv').onclick = () => exportCSV(db.desperdicios, ['tipo','area','impacto','status','obs'], 'desperdicios.csv');
document.getElementById('btnExportAudJson').onclick = () => exportJSON(db.auditorias, 'auditorias.json');
document.getElementById('btnExportAudCsv').onclick = () => exportCSV(db.auditorias, ['area','auditor','score','status','obs'], 'auditorias.csv');
document.getElementById('btnExportPlanJson').onclick = () => exportJSON(db.melhorias, 'planos-melhoria.json');
document.getElementById('btnExportPlanCsv').onclick = () => exportCSV(db.melhorias, ['area','acao','responsavel','prazo','status','obs'], 'planos-melhoria.csv');

document.getElementById('fArea').oninput = e => { filtros.area = e.target.value; renderTable(); };
document.getElementById('fStatus').onchange = e => { filtros.status = e.target.value; renderTable(); };
document.getElementById('fTipo').oninput = e => { filtros.tipo = e.target.value; renderTable(); };
document.getElementById('fBusca').oninput = e => { filtros.busca = e.target.value; renderTable(); };

document.getElementById('btnLimparFiltros').onclick = () => {
    filtros.area = filtros.status = filtros.tipo = filtros.busca = '';
    ['fArea','fTipo','fBusca'].forEach(id => document.getElementById(id).value='');
    document.getElementById('fStatus').value = '';
    renderTable();
};

refresh();