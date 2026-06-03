function exportJSON(data, filename){
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}

function exportCSV(data, fields, filename){
    const header = fields.join(',');
    const rows = data.map(item =>
        fields.map(f => `"${String(item[f] ?? '').replaceAll('"', '""')}"`).join(',')
    );
    const csv = [header, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}
// WMS STRATEGIC FLOW - APP.JS (LÓGICA PRINCIPAL)

// Inicialização
document.addEventListener('DOMContentLoaded', function() {
    initSidebar();
    initExport();
    initSearch();
    console.log('✅ WMS Strategic Flow System inicializado!');
});

// Sidebar Toggle
function initSidebar() {
    const toggleBtn = document.getElementById('toggleSidebar');
    const mobileBtn = document.getElementById('mobileMenuBtn');
    const sidebar = document.getElementById('sidebar');

    if (toggleBtn) {
        toggleBtn.addEventListener('click', () => {
            sidebar.classList.toggle('active');
        });
    }

    if (mobileBtn) {
        mobileBtn.addEventListener('click', () => {
            sidebar.classList.toggle('active');
        });
    }

    // Fechar sidebar ao clicar fora no mobile
    document.addEventListener('click', (e) => {
        if (window.innerWidth <= 768) {
            if (!sidebar.contains(e.target) && !mobileBtn.contains(e.target)) {
                sidebar.classList.remove('active');
            }
        }
    });
}

// Exportar Relatório
function initExport() {
    const exportBtn = document.getElementById('exportBtn');
    if (exportBtn) {
        exportBtn.addEventListener('click', exportReport);
    }
}

function exportReport() {
    const data = Storage.getData();
    const report = {
        title: 'Relatório WMS Strategic Flow',
        date: new Date().toLocaleDateString('pt-BR'),
        kpis: data.kpis,
        orders: data.orders,
        processes: data.processes
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `wms-relatorio-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);

    alert('✅ Relatório exportado com sucesso!');
}

// Busca Global
function initSearch() {
    const searchInput = document.querySelector('.search-box input');
    if (searchInput) {
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const query = searchInput.value.toLowerCase();
                performSearch(query);
            }
        });
    }
}

function performSearch(query) {
    if (!query.trim()) return;

    const data = Storage.getData();
    const results = {
        products: [],
        orders: [],
        processes: []
    };

    // Buscar produtos
    if (data.inventory) {
        results.products = data.inventory.filter(item => 
            item.name.toLowerCase().includes(query) || 
            item.sku.toLowerCase().includes(query)
        );
    }

    // Buscar processos
    results.processes = data.processes.filter(p => 
        p.name.toLowerCase().includes(query)
    );

    if (results.products.length > 0 || results.processes.length > 0) {
        showSearchResults(results);
    } else {
        alert(`❌ Nenhum resultado para "${query}"`);
    }
}

function showSearchResults(results) {
    let message = `🔍 Resultados da busca:

`;
    
    if (results.products.length > 0) {
        message += `📦 Produtos (${results.products.length}):
`;
        results.products.slice(0, 5).forEach(p => {
            message += `  - ${p.name} (SKU: ${p.sku})
`;
        });
    }

    if (results.processes.length > 0) {
        message += `
⚙️ Processos (${results.processes.length}):
`;
        results.processes.slice(0, 5).forEach(p => {
            message += `  - ${p.name}
`;
        });
    }

    alert(message);
}

// Utilitários
function formatDate(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', { 
        day: '2-digit', 
        month: '2-digit', 
        year: 'numeric' 
    });
}

function formatDateTime(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR') + ' ' + date.toLocaleTimeString('pt-BR', { 
        hour: '2-digit', 
        minute: '2-digit' 
    });
}

function showNotification(message, type = 'success') {
    // Criar elemento de notificação
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#2563eb'};
        color: white;
        padding: 16px 24px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 9999;
        animation: slideIn 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Animações CSS para notificações
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(400px); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(400px); opacity: 0; }
    }
`;
document.head.appendChild(style);

// Funções globais para chamadas de modal/alerta
window.openModal = function(modalId) {
    document.getElementById(modalId).style.display = 'flex';
};

window.closeModal = function(modalId) {
    document.getElementById(modalId).style.display = 'none';
};

window.confirmAction = function(message, callback) {
    if (confirm(message)) {
        callback();
    }
};