const DB_KEY = 'fluxo-estrategico-armazem-v1';

function loadDB(){
    return JSON.parse(localStorage.getItem(DB_KEY) || '{}');
}

function saveDB(data){
    localStorage.setItem(DB_KEY, JSON.stringify(data));
}