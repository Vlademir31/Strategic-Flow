const ABC_KEY = 'abc-armazem-v1';

let abcData = JSON.parse(localStorage.getItem(ABC_KEY) || '[]');
let abcEditId = null;

const abcFiltros = {
    grupo: '',
    busca: ''
};

function saveABC(){
    localStorage.setItem(ABC_KEY, JSON.stringify(abcData));
}

function uid(){
    return Date.now() + '-' + Math.random().toString(36).slice(2, 8);
}

function val(id){
    return document.getElementById(id).value.trim();
}

function renderABC(){
    const list = abcData.filter(item =>
        (!abcFiltros.grupo || item.grupo === abcFiltros.grupo) &&
        (!abcFiltros.busca || [
            item.nome,
            item.codigo,
            item.obs,
            item.grupo
        ].join(' ').toLowerCase().includes(abcFiltros.busca.toLowerCase()))
    );

    document.getElementById('tabelaABC').innerHTML = list.map(item => `
        <tr>
            <td>${item.nome}</td>
            <td>${item.codigo}</td>
            <td>${Number(item.valor).toLocaleString('pt-BR', {style:'currency', currency:'BRL'})}</td>
            <td>${item.qtd}</td>
            <td>${item.grupo}</td>
            <td>
                <button class="btn btn-secondary" onclick="editABC('${item.id}')">Editar</button>
                <button class="btn btn-danger" onclick="deleteABC('${item.id}')">Excluir</button>
            </td>
        </tr>
    `).join('');

    document.getElementById('kpiA').textContent = abcData.filter(i => i.grupo === 'A').length;
    document.getElementById('kpiB').textContent = abcData.filter(i => i.grupo === 'B').length;
    document.getElementById('kpiC').textContent = abcData.filter(i => i.grupo === 'C').length;
    document.getElementById('kpiTotal').textContent = abcData.length;
}

function resetFormABC(){
    ['itemNome','itemCodigo','itemValor','itemQtd','itemObs'].forEach(id => document.getElementById(id).value = '');
    document.getElementById('itemGrupo').value = 'A';
    abcEditId = null;
}

function saveFormABC(){
    const payload = {
        id: abcEditId || uid(),
        nome: val('itemNome'),
        codigo: val('itemCodigo'),
        valor: val('itemValor'),
        qtd: val('itemQtd'),
        grupo: document.getElementById('itemGrupo').value,
        obs: val('itemObs'),
        createdAt: new Date().toISOString()
    };

    if (!payload.nome || !payload.codigo) return;

    if (abcEditId) {
        const idx = abcData.findIndex(i => i.id === abcEditId);
        if (idx >= 0) abcData[idx] = payload;
    } else {
        abcData.unshift(payload);
    }

    saveABC();
    resetFormABC();
    renderABC();
}

window.editABC = function(id){
    const item = abcData.find(i => i.id === id);
    if(!item) return;
    abcEditId = id;
    document.getElementById('itemNome').value = item.nome;
    document.getElementById('itemCodigo').value = item.codigo;
    document.getElementById('itemValor').value = item.valor;
    document.getElementById('itemQtd').value = item.qtd;
    document.getElementById('itemGrupo').value = item.grupo;
    document.getElementById('itemObs').value = item.obs;
};

window.deleteABC = function(id){
    if(!confirm('Excluir este item da curva ABC?')) return;
    abcData = abcData.filter(i => i.id !== id);
    saveABC();
    renderABC();
};

document.getElementById('btnSalvar').onclick = saveFormABC;

document.getElementById('btnExportJson').onclick = () => exportJSON(abcData, 'abc.json');
document.getElementById('btnExportCsv').onclick = () => exportCSV(
    abcData,
    ['nome','codigo','valor','qtd','grupo','obs','createdAt'],
    'abc.csv'
);

document.getElementById('fGrupo').onchange = e => {
    abcFiltros.grupo = e.target.value;
    renderABC();
};

document.getElementById('fBusca').oninput = e => {
    abcFiltros.busca = e.target.value;
    renderABC();
};

document.getElementById('btnLimparFiltros').onclick = () => {
    abcFiltros.grupo = '';
    abcFiltros.busca = '';
    document.getElementById('fGrupo').value = '';
    document.getElementById('fBusca').value = '';
    renderABC();
};

document.addEventListener('DOMContentLoaded', renderABC);