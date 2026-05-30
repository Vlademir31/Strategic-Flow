const GANTT_KEY = 'gantt-armazem-v1';

let ganttData = JSON.parse(localStorage.getItem(GANTT_KEY) || '[]');
let ganttEditId = null;

function saveGantt(){
    localStorage.setItem(GANTT_KEY, JSON.stringify(ganttData));
}

function uid(){
    return Date.now() + '-' + Math.random().toString(36).slice(2, 8);
}

function v(id){
    return document.getElementById(id).value.trim();
}

function daysBetween(a, b){
    const d1 = new Date(a);
    const d2 = new Date(b);
    return Math.max(1, Math.ceil((d2 - d1) / 86400000) + 1);
}

function progressBar(p){
    return `<div class="progress"><div class="progress-fill" style="width:${p}%"></div></div>`;
}

function renderGantt(){
    const today = new Date().toISOString().slice(0,10);
    const list = ganttData.map(item => {
        const late = item.end && item.end < today && Number(item.progress) < 100;
        return `
            <tr>
                <td>${item.task}</td>
                <td>${item.start}</td>
                <td>${item.end}</td>
                <td>${item.progress}%${late ? ' - Atrasado' : ''}</td>
                <td>
                    <button class="btn btn-secondary" onclick="editGantt('${item.id}')">Editar</button>
                    <button class="btn btn-danger" onclick="deleteGantt('${item.id}')">Excluir</button>
                </td>
            </tr>
        `;
    }).join('');

    document.getElementById('tabelaGantt').innerHTML = list;

    document.getElementById('kpiTarefas').textContent = ganttData.length;
    document.getElementById('kpiConcluidas').textContent = ganttData.filter(i => Number(i.progress) >= 100).length;
    document.getElementById('kpiAtraso').textContent = ganttData.filter(i => i.end && i.end < today && Number(i.progress) < 100).length;
    document.getElementById('kpiProg').textContent = ganttData.length
        ? Math.round(ganttData.reduce((a,b)=>a+Number(b.progress||0),0) / ganttData.length) + '%'
        : '0%';

    const minDate = ganttData.length ? ganttData.reduce((m,i)=>!m || i.start < m ? i.start : m, null) : today;
    const maxDate = ganttData.length ? ganttData.reduce((m,i)=>!m || i.end > m ? i.end : m, null) : today;
    if(!ganttData.length){
        document.getElementById('ganttWrap').innerHTML = '<p class="muted">Nenhuma tarefa cadastrada.</p>';
        return;
    }

    const days = daysBetween(minDate, maxDate);
    const header = Array.from({length: days}, (_,i)=>{
        const d = new Date(minDate);
        d.setDate(d.getDate()+i);
        return d.toISOString().slice(0,10).slice(5);
    });

    let html = `<div class="gantt-head"><div class="gantt-task-col">Tarefa</div>${header.map(h=>`<div class="gantt-day">${h}</div>`).join('')}</div>`;

    ganttData.forEach(item => {
        const startOffset = daysBetween(minDate, item.start) - 1;
        const span = daysBetween(item.start, item.end);
        html += `<div class="gantt-row"><div class="gantt-task-col">${item.task}</div><div class="gantt-track">`;
        html += `<div class="gantt-bar" style="margin-left:${startOffset * 28}px;width:${span * 28}px">${progressBar(item.progress)}</div>`;
        html += `</div></div>`;
    });

    document.getElementById('ganttWrap').innerHTML = html;
}

function clearForm(){
    ['task','start','end','progress','obs'].forEach(id => document.getElementById(id).value = '');
    ganttEditId = null;
}

function saveTask(){
    const payload = {
        id: ganttEditId || uid(),
        task: v('task'),
        start: document.getElementById('start').value,
        end: document.getElementById('end').value,
        progress: v('progress'),
        obs: v('obs'),
        createdAt: new Date().toISOString()
    };

    if(!payload.task || !payload.start || !payload.end) return;

    if(ganttEditId){
        const idx = ganttData.findIndex(i => i.id === ganttEditId);
        if(idx >= 0) ganttData[idx] = payload;
    } else {
        ganttData.unshift(payload);
    }

    saveGantt();
    clearForm();
    renderGantt();
}

window.editGantt = function(id){
    const item = ganttData.find(i => i.id === id);
    if(!item) return;
    ganttEditId = id;
    document.getElementById('task').value = item.task;
    document.getElementById('start').value = item.start;
    document.getElementById('end').value = item.end;
    document.getElementById('progress').value = item.progress;
    document.getElementById('obs').value = item.obs;
};

window.deleteGantt = function(id){
    if(!confirm('Excluir esta tarefa?')) return;
    ganttData = ganttData.filter(i => i.id !== id);
    saveGantt();
    renderGantt();
};

document.getElementById('btnSalvar').onclick = saveTask;
document.getElementById('btnExportJson').onclick = () => exportJSON(ganttData, 'gantt.json');
document.getElementById('btnExportCsv').onclick = () => exportCSV(
    ganttData,
    ['task','start','end','progress','obs','createdAt'],
    'gantt.csv'
);

document.addEventListener('DOMContentLoaded', renderGantt);