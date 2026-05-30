const DB_KEY = 'pdca-armazem-v2';

const db = JSON.parse(localStorage.getItem(DB_KEY) || '{}');
db.processos ||= [];
db.perdas ||= [];
db.sipoc ||= [];
db.indicadores ||= [];
db.planos ||= [];

let editState = { module: null, index: null };

const filtros = {
    status: '',
    area: '',
    resp: '',
    inicio: '',
    fim: ''
};

function saveDB(){
    localStorage.setItem(DB_KEY, JSON.stringify(db));
}

function uid(){
    return Date.now() + '-' + Math.random().toString(36).slice(2, 8);
}

function getInput(id){ return document.getElementById(id).value.trim(); }

function exportJSON(data, filename){
    const blob = new Blob([JSON.stringify(data, null, 2)], {type:'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}

function exportCSV(data, fields, filename){
    if(!data.length) return;
    const header = fields.join(',');
    const rows = data.map(item =>
        fields.map(f => `"${String(item[f] ?? '').replaceAll('"', '""')}"`).join(',')
    );
    const csv = [header, ...rows].join('\n');
    const blob = new Blob([csv], {type:'text/csv;charset=utf-8;'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}

function openModal(module, index){
    editState = { module, index };
    const modal = document.getElementById('modalBackdrop');
    const title = document.getElementById('modalTitle');
    const fields = document.getElementById('modalFields');
    const item = db[module][index];

    const configs = {
        processos: [
            ['editProcesso','Processo', item.processo || ''],
            ['editArea','Área', item.area || ''],
            ['editResp','Responsável', item.responsavel || ''],
            ['editStatus','Status', item.status || 'Ativo'],
            ['editObs','Observação', item.obs || '', 'textarea']
        ],
        perdas: [
            ['editTipo','Tipo', item.tipo || ''],
            ['editProc','Processo', item.processo || ''],
            ['editImpacto','Impacto', item.impacto || ''],
            ['editUnidade','Unidade', item.unidade || ''],
            ['editCausa','Causa', item.causa || '', 'textarea']
        ],
        sipoc: [
            ['editSup','Suppliers', item.suppliers || ''],
            ['editInp','Inputs', item.inputs || ''],
            ['editProcS','Process', item.process || ''],
            ['editOut','Outputs', item.outputs || ''],
            ['editCus','Customers', item.customers || '']
        ],
        indicadores: [
            ['editInd','Indicador', item.indicador || ''],
            ['editMeta','Meta', item.meta || ''],
            ['editReal','Realizado', item.realizado || ''],
            ['editUnid','Unidade', item.unidade || '']
        ],
        planos: [
            ['editTopico','Tópico', item.topico || ''],
            ['editAcao','Ação', item.acao || ''],
            ['editRespP','Responsável', item.responsavel || ''],
            ['editPrazo','Prazo', item.prazo || '', 'date'],
            ['editStatusP','Status', item.status || 'Aberto'],
            ['editDetalhe','Detalhes', item.detalhe || '', 'textarea']
        ]
    };

    title.textContent = `Editar ${module}`;
    fields.innerHTML = configs[module].map(([id,label,value,type='text']) => `
        <div class="form-group ${type === 'textarea' ? 'full' : ''}">
            <label for="${id}">${label}</label>
            ${type === 'textarea'
                ? `<textarea id="${id}">${value}</textarea>`
                : `<input id="${id}" type="${type}" value="${value}">`}
        </div>
    `).join('');

    modal.classList.add('show');
    modal.setAttribute('aria-hidden','false');
}

function closeModal(){
    const modal = document.getElementById('modalBackdrop');
    modal.classList.remove('show');
    modal.setAttribute('aria-hidden','true');
    editState = { module: null, index: null };
}

function renderKPIs(){
    document.getElementById('kpiProcessos').textContent = db.processos.length;
    document.getElementById('kpiPerdas').textContent = db.perdas.length;
    document.getElementById('kpiPlanos').textContent = db.planos.filter(p => p.status !== 'Concluído').length;
    document.getElementById('kpiIndicadores').textContent = db.indicadores.length;
}

function renderProcessos(){
    const tbody = document.getElementById('tabelaProcessos');
    const rows = db.processos.filter(item =>
        (!filtros.status || item.status === filtros.status) &&
        (!filtros.area || item.area.toLowerCase().includes(filtros.area.toLowerCase())) &&
        (!filtros.resp || item.responsavel.toLowerCase().includes(filtros.resp.toLowerCase())) &&
        (!filtros.inicio || item.createdAtISO >= filtros.inicio) &&
        (!filtros.fim || item.createdAtISO <= filtros.fim)
    );

    tbody.innerHTML = rows.map((item, index) => `
        <tr>
            <td>${item.processo}</td>
            <td>${item.area}</td>
            <td>${item.responsavel}</td>
            <td>${item.status}</td>
            <td>${item.createdAt}</td>
            <td>
                <button class="btn btn-secondary" onclick="openModal('processos', ${index})">Editar</button>
                <button class="btn btn-danger" onclick="deleteItem('processos', ${index})">Excluir</button>
            </td>
        </tr>
    `).join('');
}

function renderPerdas(){
    const tbody = document.getElementById('tabelaPerdas');
    tbody.innerHTML = db.perdas.map((item, index) => `
        <tr>
            <td>${item.tipo}</td>
            <td>${item.processo}</td>
            <td>${item.impacto}</td>
            <td>${item.unidade}</td>
            <td>${item.causa}</td>
            <td>
                <button class="btn btn-secondary" onclick="openModal('perdas', ${index})">Editar</button>
                <button class="btn btn-danger" onclick="deleteItem('perdas', ${index})">Excluir</button>
            </td>
        </tr>
    `).join('');
}

function renderSipoc(){
    const tbody = document.getElementById('tabelaSipoc');
    tbody.innerHTML = db.sipoc.map((item, index) => `
        <tr>
            <td>${item.suppliers}</td>
            <td>${item.inputs}</td>
            <td>${item.process}</td>
            <td>${item.outputs}</td>
            <td>${item.customers}</td>
            <td>
                <button class="btn btn-secondary" onclick="openModal('sipoc', ${index})">Editar</button>
                <button class="btn btn-danger" onclick="deleteItem('sipoc', ${index})">Excluir</button>
            </td>
        </tr>
    `).join('');
}

function renderIndicadores(){
    const tbody = document.getElementById('tabelaIndicadores');
    tbody.innerHTML = db.indicadores.map((item, index) => {
        const status = Number(item.realizado) >= Number(item.meta) ? 'Dentro da meta' : 'Abaixo da meta';
        return `
            <tr>
                <td>${item.indicador}</td>
                <td>${item.meta}</td>
                <td>${item.realizado}</td>
                <td>${item.unidade}</td>
                <td>${status}</td>
                <td>
                    <button class="btn btn-secondary" onclick="openModal('indicadores', ${index})">Editar</button>
                    <button class="btn btn-danger" onclick="deleteItem('indicadores', ${index})">Excluir</button>
                </td>
            </tr>
        `;
    }).join('');
}

function renderPlanos(){
    const tbody = document.getElementById('tabelaPlanos');
    tbody.innerHTML = db.planos.map((item, index) => `
        <tr>
            <td>${item.topico}</td>
            <td>${item.acao}</td>
            <td>${item.responsavel}</td>
            <td>${item.prazo}</td>
            <td>${item.status}</td>
            <td>
                <button class="btn btn-secondary" onclick="openModal('planos', ${index})">Editar</button>
                <button class="btn btn-danger" onclick="deleteItem('planos', ${index})">Excluir</button>
            </td>
        </tr>
    `).join('');
}

function refreshAll(){
    saveDB();
    renderKPIs();
    renderProcessos();
    renderPerdas();
    renderSipoc();
    renderIndicadores();
    renderPlanos();
}

function deleteItem(module, index){
    db[module].splice(index, 1);
    refreshAll();
}

document.getElementById('btnSalvarProcesso').onclick = () => {
    const now = new Date();
    db.processos.unshift({
        id: uid(),
        processo: getInput('procNome'),
        area: getInput('procArea'),
        responsavel: getInput('procResp'),
        status: document.getElementById('procStatus').value,
        obs: getInput('procObs'),
        createdAt: now.toLocaleString('pt-BR'),
        createdAtISO: now.toISOString().slice(0,10)
    });
    refreshAll();
};

document.getElementById('btnSalvarPerda').onclick = () => {
    db.perdas.unshift({
        id: uid(),
        tipo: getInput('perdaTipo'),
        processo: getInput('perdaProc'),
        impacto: getInput('perdaImpacto'),
        unidade: getInput('perdaUnid'),
        causa: getInput('perdaCausa')
    });
    refreshAll();
};

document.getElementById('btnSalvarSipoc').onclick = () => {
    db.sipoc.unshift({
        id: uid(),
        suppliers: getInput('sipSup'),
        inputs: getInput('sipInp'),
        process: getInput('sipProc'),
        outputs: getInput('sipOut'),
        customers: getInput('sipCus')
    });
    refreshAll();
};

document.getElementById('btnSalvarIndicador').onclick = () => {
    db.indicadores.unshift({
        id: uid(),
        indicador: getInput('indNome'),
        meta: getInput('indMeta'),
        realizado: getInput('indReal'),
        unidade: getInput('indUnid')
    });
    refreshAll();
};

document.getElementById('btnSalvarPlano').onclick = () => {
    db.planos.unshift({
        id: uid(),
        topico: getInput('plTopico'),
        acao: getInput('plAcao'),
        responsavel: getInput('plResp'),
        prazo: document.getElementById('plPrazo').value,
        status: document.getElementById('plStatus').value,
        detalhe: getInput('plDetalhe')
    });
    refreshAll();
};

document.getElementById('btnExportProcessoJson').onclick = () => exportJSON(db.processos, 'processos.json');
document.getElementById('btnExportProcessoCsv').onclick = () => exportCSV(db.processos, ['processo','area','responsavel','status','obs','createdAt'], 'processos.csv');

document.getElementById('btnExportPerdaJson').onclick = () => exportJSON(db.perdas, 'perdas.json');
document.getElementById('btnExportPerdaCsv').onclick = () => exportCSV(db.perdas, ['tipo','processo','impacto','unidade','causa'], 'perdas.csv');

document.getElementById('btnExportSipocJson').onclick = () => exportJSON(db.sipoc, 'sipoc.json');
document.getElementById('btnExportSipocCsv').onclick = () => exportCSV(db.sipoc, ['suppliers','inputs','process','outputs','customers'], 'sipoc.csv');

document.getElementById('btnExportIndicadorJson').onclick = () => exportJSON(db.indicadores, 'indicadores.json');
document.getElementById('btnExportIndicadorCsv').onclick = () => exportCSV(db.indicadores, ['indicador','meta','realizado','unidade'], 'indicadores.csv');

document.getElementById('btnExportPlanoJson').onclick = () => exportJSON(db.planos, 'planos.json');
document.getElementById('btnExportPlanoCsv').onclick = () => exportCSV(db.planos, ['topico','acao','responsavel','prazo','status','detalhe'], 'planos.csv');

document.getElementById('filtroStatus').onchange = e => { filtros.status = e.target.value; renderProcessos(); };
document.getElementById('filtroArea').oninput = e => { filtros.area = e.target.value; renderProcessos(); };
document.getElementById('filtroResp').oninput = e => { filtros.resp = e.target.value; renderProcessos(); };
document.getElementById('filtroPeriodoInicio').onchange = e => { filtros.inicio = e.target.value; renderProcessos(); };
document.getElementById('filtroPeriodoFim').onchange = e => { filtros.fim = e.target.value; renderProcessos(); };

document.getElementById('btnLimparFiltros').onclick = () => {
    filtros.status = '';
    filtros.area = '';
    filtros.resp = '';
    filtros.inicio = '';
    filtros.fim = '';
    document.getElementById('filtroStatus').value = '';
    document.getElementById('filtroArea').value = '';
    document.getElementById('filtroResp').value = '';
    document.getElementById('filtroPeriodoInicio').value = '';
    document.getElementById('filtroPeriodoFim').value = '';
    renderProcessos();
};

document.getElementById('btnCancelarEdicao').onclick = closeModal;

document.getElementById('formEdicao').onsubmit = e => {
    e.preventDefault();
    const { module, index } = editState;

    if(module === 'processos'){
        db.processos[index] = {
            ...db.processos[index],
            processo: getInput('editProcesso'),
            area: getInput('editArea'),
            responsavel: getInput('editResp'),
            status: document.getElementById('editStatus').value,
            obs: getInput('editObs')
        };
    }

    if(module === 'perdas'){
        db.perdas[index] = {
            ...db.perdas[index],
            tipo: getInput('editTipo'),
            processo: getInput('editProc'),
            impacto: getInput('editImpacto'),
            unidade: getInput('editUnidade'),
            causa: getInput('editCausa')
        };
    }

    if(module === 'sipoc'){
        db.sipoc[index] = {
            ...db.sipoc[index],
            suppliers: getInput('editSup'),
            inputs: getInput('editInp'),
            process: getInput('editProcS'),
            outputs: getInput('editOut'),
            customers: getInput('editCus')
        };
    }

    if(module === 'indicadores'){
        db.indicadores[index] = {
            ...db.indicadores[index],
            indicador: getInput('editInd'),
            meta: getInput('editMeta'),
            realizado: getInput('editReal'),
            unidade: getInput('editUnid')
        };
    }

    if(module === 'planos'){
        db.planos[index] = {
            ...db.planos[index],
            topico: getInput('editTopico'),
            acao: getInput('editAcao'),
            responsavel: getInput('editRespP'),
            prazo: document.getElementById('editPrazo').value,
            status: document.getElementById('editStatusP').value,
            detalhe: getInput('editDetalhe')
        };
    }

    closeModal();
    refreshAll();
};

document.getElementById('modalBackdrop').onclick = e => {
    if(e.target.id === 'modalBackdrop') closeModal();
};

document.addEventListener('keydown', e => {
    if(e.key === 'Escape') closeModal();
});

refreshAll();