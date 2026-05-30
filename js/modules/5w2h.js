const W52H_KEY = '5w2h-armazem-v1';

let w52hData = JSON.parse(localStorage.getItem(W52H_KEY) || '[]');
let w52hEditId = null;

const w52hFiltros = {
    status: '',
    busca: ''
};

function saveW52H(){
    localStorage.setItem(W52H_KEY, JSON.stringify(w52hData));
}

function uid(){
    return Date.now() + '-' + Math.random().toString(36).slice(2, 8);
}

function v(id){
    return document.getElementById(id).value.trim();
}

function isLate(item){
    if(!item.when) return false;
    const today = new Date().toISOString().slice(0,10);
    return item.status !== 'Concluído' && item.when < today;
}

function refreshW52H(){
    const list = w52hData.filter(item =>
        (!w52hFiltros.status || item.status === w52hFiltros.status) &&
        (!w52hFiltros.busca || [
            item.what, item.why, item.where, item.when, item.who, item.how, item.howmuch, item.status
        ].join(' ').toLowerCase().includes(w52hFiltros.busca.toLowerCase()))
    );

    document.getElementById('tabela').innerHTML = list.map(item => `
        <tr>
            <td>${item.what}</td>
            <td>${item.who}</td>
            <td>${item.when}</td>
            <td>${item.status}${isLate(item) ? ' - Atrasado' : ''}</td>
            <td>
                <button class="btn btn-secondary" onclick="editW52H('${item.id}')">Editar</button>
                <button class="btn btn-danger" onclick="deleteW52H('${item.id}')">Excluir</button>
            </td>
        </tr>
    `).join('');

    document.getElementById('kpiAcoes').textContent = w52hData.length;
    document.getElementById('kpiAndamento').textContent = w52hData.filter(i => i.status === 'Em andamento').length;
    document.getElementById('kpiConcluidas').textContent = w52hData.filter(i => i.status === 'Concluído').length;
    document.getElementById('kpiAtrasadas').textContent = w52hData.filter(i => isLate(i)).length;
}

function clearForm(){
    ['what','why','where','when','who','how','howmuch'].forEach(id => document.getElementById(id).value = '');
    document.getElementById('status').value = 'Aberto';
    w52hEditId = null;
}

function saveAction(){
    const payload = {
        id: w52hEditId || uid(),
        what: v('what'),
        why: v('why'),
        where: v('where'),
        when: document.getElementById('when').value,
        who: v('who'),
        how: v('how'),
        howmuch: v('howmuch'),
        status: document.getElementById('status').value,
        createdAt: new Date().toISOString()
    };

    if(!payload.what || !payload.who) return;

    if(w52hEditId){
        const idx = w52hData.findIndex(i => i.id === w52hEditId);
        if(idx >= 0) w52hData[idx] = payload;
    } else {
        w52hData.unshift(payload);
    }

    saveW52H();
    clearForm();
    refreshW52H();
}

window.editW52H = function(id){
    const item = w52hData.find(i => i.id === id);
    if(!item) return;
    w52hEditId = id;
    document.getElementById('what').value = item.what;
    document.getElementById('why').value = item.why;
    document.getElementById('where').value = item.where;
    document.getElementById('when').value = item.when;
    document.getElementById('who').value = item.who;
    document.getElementById('how').value = item.how;
    document.getElementById('howmuch').value = item.howmuch;
    document.getElementById('status').value = item.status;
};

window.deleteW52H = function(id){
    if(!confirm('Excluir esta ação 5W2H?')) return;
    w52hData = w52hData.filter(i => i.id !== id);
    saveW52H();
    refreshW52H();
};

document.getElementById('btnSalvar').onclick = saveAction;

document.getElementById('btnExportJson').onclick = () => exportJSON(w52hData, '5w2h.json');
document.getElementById('btnExportCsv').onclick = () => exportCSV(
    w52hData,
    ['what','why','where','when','who','how','howmuch','status','createdAt'],
    '5w2h.csv'
);

document.getElementById('fStatus').onchange = e => {
    w52hFiltros.status = e.target.value;
    refreshW52H();
};

document.getElementById('fBusca').oninput = e => {
    w52hFiltros.busca = e.target.value;
    refreshW52H();
};

document.getElementById('btnLimparFiltros').onclick = () => {
    w52hFiltros.status = '';
    w52hFiltros.busca = '';
    document.getElementById('fStatus').value = '';
    document.getElementById('fBusca').value = '';
    refreshW52H();
};

document.addEventListener('DOMContentLoaded', refreshW52H);