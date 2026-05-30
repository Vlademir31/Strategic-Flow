const DB_KEY = 'bpm-armazem-v1';

const db = JSON.parse(localStorage.getItem(DB_KEY) || '[]');

let editIndex = null;

const filtros = {
    area: '',
    status: '',
    macro: '',
    busca: ''
};

function saveDB(){
    localStorage.setItem(DB_KEY, JSON.stringify(db));
}

function uid(){
    return Date.now() + '-' + Math.random().toString(36).slice(2, 8);
}

function getValue(id){
    return document.getElementById(id).value.trim();
}

function openModal(index){
    editIndex = index;
    const item = db[index];
    const modal = document.getElementById('modalBackdrop');
    document.getElementById('modalTitle').textContent = 'Editar mapeamento';
    document.getElementById('modalFields').innerHTML = `
        <div class="form-group"><label for="eMacro">Macroprocesso</label><input id="eMacro" value="${item.macroprocesso}"></div>
        <div class="form-group"><label for="eProcesso">Processo</label><input id="eProcesso" value="${item.processo}"></div>
        <div class="form-group"><label for="eSub">Subprocesso</label><input id="eSub" value="${item.subprocesso}"></div>
        <div class="form-group"><label for="eArea">Área</label><input id="eArea" value="${item.area}"></div>
        <div class="form-group"><label for="eResp">Responsável</label><input id="eResp" value="${item.responsavel}"></div>
        <div class="form-group"><label for="eStatus">Status</label>
            <select id="eStatus">
                <option value="Ativo" ${item.status === 'Ativo' ? 'selected' : ''}>Ativo</option>
                <option value="Em análise" ${item.status === 'Em análise' ? 'selected' : ''}>Em análise</option>
                <option value="Parado" ${item.status === 'Parado' ? 'selected' : ''}>Parado</option>
            </select>
        </div>
        <div class="form-group full"><label for="eDesc">Descrição</label><textarea id="eDesc">${item.descricao}</textarea></div>
    `;
    modal.classList.add('show');
    modal.setAttribute('aria-hidden', 'false');
}

function closeModal(){
    const modal = document.getElementById('modalBackdrop');
    modal.classList.remove('show');
    modal.setAttribute('aria-hidden', 'true');
    editIndex = null;
}

function renderKPIs(){
    document.getElementById('kpiMacro').textContent = new Set(db.map(i => i.macroprocesso)).size;
    document.getElementById('kpiProcessos').textContent = new Set(db.map(i => i.processo)).size;
    document.getElementById('kpiSub').textContent = db.length;
    document.getElementById('kpiAreas').textContent = new Set(db.map(i => i.area)).size;

    document.getElementById('dashAtivos').textContent = db.filter(i => i.status === 'Ativo').length;
    document.getElementById('dashAnalise').textContent = db.filter(i => i.status === 'Em análise').length;
    document.getElementById('dashCriticos').textContent = db.filter(i => i.status === 'Parado').length;
    document.getElementById('dashMacroUnicos').textContent = new Set(db.map(i => i.macroprocesso)).size;
}

function renderTable(){
    const tbody = document.getElementById('tabelaBpm');
    const list = db.filter(item =>
        (!filtros.area || item.area.toLowerCase().includes(filtros.area.toLowerCase())) &&
        (!filtros.status || item.status === filtros.status) &&
        (!filtros.macro || item.macroprocesso.toLowerCase().includes(filtros.macro.toLowerCase())) &&
        (!filtros.busca || [item.macroprocesso, item.processo, item.subprocesso, item.area, item.responsavel]
            .join(' ')
            .toLowerCase()
            .includes(filtros.busca.toLowerCase()))
    );

    tbody.innerHTML = list.map((item, index) => `
        <tr>
            <td>${item.macroprocesso}</td>
            <td>${item.processo}</td>
            <td>${item.subprocesso}</td>
            <td>${item.area}</td>
            <td>${item.responsavel}</td>
            <td>${item.status}</td>
            <td>
                <button class="btn btn-secondary" onclick="openModal(${index})">Editar</button>
                <button class="btn btn-danger" onclick="deleteItem(${index})">Excluir</button>
            </td>
        </tr>
    `).join('');
}

function refresh(){
    saveDB();
    renderKPIs();
    renderTable();
}

function deleteItem(index){
    db.splice(index, 1);
    refresh();
}

document.getElementById('btnSalvar').onclick = () => {
    db.unshift({
        id: uid(),
        macroprocesso: getValue('macro'),
        processo: getValue('processo'),
        subprocesso: getValue('subprocesso'),
        area: getValue('area'),
        responsavel: getValue('responsavel'),
        status: document.getElementById('status').value,
        descricao: getValue('descricao'),
        createdAt: new Date().toLocaleString('pt-BR')
    });
    refresh();
};

document.getElementById('btnExportJson').onclick = () => exportJSON(db, 'bpm.json');
document.getElementById('btnExportCsv').onclick = () =>
    exportCSV(db, ['macroprocesso','processo','subprocesso','area','responsavel','status','descricao','createdAt'], 'bpm.csv');

document.getElementById('fArea').oninput = e => { filtros.area = e.target.value; renderTable(); };
document.getElementById('fStatus').onchange = e => { filtros.status = e.target.value; renderTable(); };
document.getElementById('fMacro').oninput = e => { filtros.macro = e.target.value; renderTable(); };
document.getElementById('fBusca').oninput = e => { filtros.busca = e.target.value; renderTable(); };

document.getElementById('btnLimparFiltros').onclick = () => {
    filtros.area = '';
    filtros.status = '';
    filtros.macro = '';
    filtros.busca = '';
    document.getElementById('fArea').value = '';
    document.getElementById('fStatus').value = '';
    document.getElementById('fMacro').value = '';
    document.getElementById('fBusca').value = '';
    renderTable();
};

document.getElementById('btnCancelarEdicao').onclick = closeModal;

document.getElementById('formEdicao').onsubmit = e => {
    e.preventDefault();
    if(editIndex === null) return;
    db[editIndex] = {
        ...db[editIndex],
        macroprocesso: getValue('eMacro'),
        processo: getValue('eProcesso'),
        subprocesso: getValue('eSub'),
        area: getValue('eArea'),
        responsavel: getValue('eResp'),
        status: document.getElementById('eStatus').value,
        descricao: getValue('eDesc')
    };
    closeModal();
    refresh();
};

document.getElementById('modalBackdrop').onclick = e => {
    if(e.target.id === 'modalBackdrop') closeModal();
};

document.addEventListener('keydown', e => {
    if(e.key === 'Escape') closeModal();
});

refresh();