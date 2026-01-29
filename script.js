// URLs del Sheet
const CSV_URL_MENU = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vS096sKyd8yEnxylv0Ze__LocfEUvd2YM7NG375v5IBLLe9aElstkRSoxE0xBpnzVkoJppXZEBtsY51/pub?gid=0&single=true&output=csv';

document.addEventListener('DOMContentLoaded', () => {
    const contentDiv = document.getElementById('sabores-menu');
    const urlParams = new URLSearchParams(window.location.search);
    
    const sucursalNum = urlParams.get('sucursal'); 
    const pantallaNum = urlParams.get('pantalla'); 

    if (!sucursalNum || !pantallaNum) {
        contentDiv.innerHTML = '<h1>Faltan parámetros</h1><p>Asegúrate de copiar la URL completa desde el generador.</p>';
        return;
    }

    // 1. APLICAR ESTILOS (Reforzado)
    aplicarEstilosDesdeURL(urlParams);

    // 2. CARGAR MENÚ
    cargarMenu(sucursalNum, pantallaNum); 
    
    // Recarga automática (5 min)
    setTimeout(() => window.location.reload(true), 300 * 1000); 
});

// --- FUNCIÓN DE ESTILOS MÁS AGRESIVA ---
function aplicarEstilosDesdeURL(params) {
    const root = document.documentElement.style;

    // Helper: asegura que tenga # si no es transparent
    const getColor = (val, def) => {
        if (!val) return def;
        if (val === 'transparent') return 'transparent';
        // Si ya trae # lo dejamos, si no, se lo ponemos
        return val.startsWith('#') ? val : '#' + val;
    };

    // Obtener valores
    const bg = getColor(params.get('bg'), '#f4f4f4');
    const titleColor = getColor(params.get('tc'), '#4CAF50');
    const textColor = getColor(params.get('txtc'), '#333333');
    const fontFamily = params.get('font') ? decodeURIComponent(params.get('font')) : "'Playfair Display', serif";
    
    const titleSize = params.get('ts') ? params.get('ts') + 'px' : '32px';
    const textSize = params.get('txts') ? params.get('txts') + 'px' : '22px';

    // 1. Aplicar variables CSS
    root.setProperty('--color-fondo', bg);
    root.setProperty('--color-categoria', titleColor);
    root.setProperty('--color-texto-normal', textColor);
    root.setProperty('--fuente-general', fontFamily);

    // 2. FORZAR FONDO DIRECTAMENTE EN EL BODY (Soluciona el problema de fondo)
    document.body.style.backgroundColor = bg;
    document.body.style.color = textColor;
    document.body.style.fontFamily = fontFamily;

    // 3. INYECTAR CSS DINÁMICO CON !important (Soluciona tamaños y colores rebeldes)
    const styleSheet = document.createElement("style");
    styleSheet.innerText = `
        .categoria h2 { 
            font-size: ${titleSize} !important; 
            color: ${titleColor} !important;
        }
        .sabor-item { 
            font-size: ${textSize} !important; 
            color: ${textColor} !important;
        }
        .sabor-nombre {
            font-family: ${fontFamily} !important;
        }
    `;
    document.head.appendChild(styleSheet);
}

// --- RESTO DE FUNCIONES (Sin cambios lógicos) ---

function cargarMenu(sucursalNum, pantallaNum) {
    const contentDiv = document.getElementById('sabores-menu');
    const columnaSucursal = `Activo Sucursal ${sucursalNum}`; 
    const columnaPantalla = `Pantalla ${pantallaNum}`; 
    const regexSi = /s[íi]/i; 

    Papa.parse(CSV_URL_MENU, {
        download: true,
        header: true,
        skipEmptyLines: true, 
        transformHeader: (h) => h.trim(),
        complete: function(results) {
            const data = results.data;
            const filtrados = data.filter(item => {
                const s = item[columnaSucursal] && item[columnaSucursal].trim().match(regexSi);
                const p = item[columnaPantalla] && item[columnaPantalla].trim().match(regexSi);
                return s && p;
            });

            if (filtrados.length === 0) {
                contentDiv.innerHTML = `<h2 class="loading-message">No hay sabores activos para Sucursal ${sucursalNum} / Pantalla ${pantallaNum}</h2>`;
                return;
            }

            const agrupados = agruparPorCategoria(filtrados);
            renderizarMenu(contentDiv, agrupados);
        },
        error: (err) => console.error('Error CSV:', err)
    });
}

function agruparPorCategoria(sabores) {
    return sabores.reduce((acc, sabor) => {
        const cat = sabor.Categoría || 'Otros';
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(sabor);
        return acc;
    }, {});
}

function renderizarMenu(container, grupos) {
    const cats = Object.keys(grupos).sort();
    const mitad = Math.ceil(cats.length / 2);
    const col1 = cats.slice(0, mitad);
    const col2 = cats.slice(mitad);

    let h1 = '', h2 = '';
    col1.forEach(c => h1 += htmlCategoria(c, grupos[c]));
    col2.forEach(c => h2 += htmlCategoria(c, grupos[c]));
    
    container.innerHTML = `<div class="menu-container"><div>${h1}</div><div>${h2}</div></div>`;
}

function htmlCategoria(cat, sabores) {
    const ordenados = sabores.sort((a, b) => a.Sabores.localeCompare(b.Sabores)); 
    const regexSi = /s[íi]/i; 
    let items = '';
    
    ordenados.forEach(s => {
        const vegano = s.VEGANO && s.VEGANO.trim().match(regexSi);
        const tacc = s['Sin TACC'] && s['Sin TACC'].trim().match(regexSi); 
        items += `
        <div class="sabor-item">
            <span class="sabor-nombre">${s.Sabores.toUpperCase()}</span>
            ${tacc ? '<span class="sintacc-tag">◎</span>' : ''} 
            ${vegano ? '<span class="vegano-tag">🌱</span>' : ''}
        </div>`;
    });
    
    return `<section class="categoria"><h2>${cat}</h2><div class="sabores-grid">${items}</div></section>`;
}
