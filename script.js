// URLs del Sheet
const CSV_URL_MENU = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vS096sKyd8yEnxylv0Ze__LocfEUvd2YM7NG375v5IBLLe9aElstkRSoxE0xBpnzVkoJppXZEBtsY51/pub?gid=0&single=true&output=csv';
//  respaldo, pero la URL tiene prioridad
const CSV_URL_CONFIG = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vS096sKyd8yEnxylv0Ze__LocfEUvd2YM7NG375v5IBLLe9aElstkRSoxE0xBpnzVkoJppXZEBtsY51/pub?gid=1614228917&single=true&output=csv';

document.addEventListener('DOMContentLoaded', () => {
    const contentDiv = document.getElementById('sabores-menu');
    const urlParams = new URLSearchParams(window.location.search);
    
    const sucursalNum = urlParams.get('sucursal'); 
    const pantallaNum = urlParams.get('pantalla'); 

    if (!sucursalNum || !pantallaNum) {
        contentDiv.innerHTML = '<h1>Error de Configuración</h1><h2 class="loading-message" style="color: red;">Faltan parámetros en la URL.</h2>';
        return;
    }

    // 1. APLICAR ESTILOS DESDE URL 
    aplicarEstilosDesdeURL(urlParams);

    // 2. Cargar el Menú directamente
  
    cargarMenu(null, sucursalNum, pantallaNum); 
    
    // 3. Recarga automática (5 min)
    setTimeout(function() {
        window.location.reload(true); 
    }, 300 * 1000); 
});

// --- NUEVA FUNCIÓN: ESTILOS DESDE URL ---
function aplicarEstilosDesdeURL(params) {
    const root = document.documentElement.style;

    // Helper para agregar # si no es "transparent"
    const getColor = (val, def) => {
        if (!val) return def;
        if (val === 'transparent') return 'transparent';
        return '#' + val;
    };

    // Lectura de parámetros (coinciden con admin_url.js)
    const bg = getColor(params.get('bg'), '#f4f4f4');
    const titleColor = getColor(params.get('tc'), '#4CAF50');
    const textColor = getColor(params.get('txtc'), '#333333');
    const fontFamily = params.get('font') ? decodeURIComponent(params.get('font')) : "'Playfair Display', serif";
    
    // Tamaños
    const titleSize = params.get('ts') ? params.get('ts') + 'px' : null;
    const textSize = params.get('txts') ? params.get('txts') + 'px' : null;

    // Asignación de variables CSS
    root.setProperty('--color-fondo', bg);
    root.setProperty('--color-categoria', titleColor);
    root.setProperty('--color-texto-normal', textColor);
    root.setProperty('--fuente-general', fontFamily);
    
    // Inyección de estilos para tamaños (más fuerte que las variables a veces)
    const styleSheet = document.createElement("style");
    let cssOverride = '';

    if (titleSize) {
        cssOverride += `.categoria h2 { font-size: ${titleSize} !important; } `;
    }
    if (textSize) {
        cssOverride += `.sabor-item { font-size: ${textSize} !important; } `;
    }
    
    styleSheet.innerText = cssOverride;
    document.head.appendChild(styleSheet);
}

// --- FUNCIONES DE CARGA Y RENDERIZADO (Sin cambios mayores) ---

function cargarMenu(config, sucursalNum, pantallaNum) {
    const contentDiv = document.getElementById('sabores-menu');
    const columnaSucursal = `Activo Sucursal ${sucursalNum}`; 
    const columnaPantalla = `Pantalla ${pantallaNum}`; 
    const regexSi = /s[íi]/i; 

    Papa.parse(CSV_URL_MENU, {
        download: true,
        header: true,
        skipEmptyLines: true, 
        transformHeader: (header) => header.trim(),
        complete: function(results) {
            const data = results.data;

            if (data.length === 0) {
                contentDiv.innerHTML = '<h1>Error de Datos</h1><h2 class="loading-message" style="color: red;">CSV vacío.</h2>';
                return;
            }
            
            // Filtrado
            const saboresFiltrados = data.filter(item => {
                const activoSucursal = item[columnaSucursal] && item[columnaSucursal].trim().match(regexSi);
                const activoPantalla = item[columnaPantalla] && item[columnaPantalla].trim().match(regexSi);
                return activoSucursal && activoPantalla;
            });

            if (saboresFiltrados.length === 0) {
                contentDiv.innerHTML = `<h1>Menú</h1><h2 class="loading-message" style="color: orange;">Sin sabores activos.</h2>`;
                return;
            }

            const saboresAgrupados = agruparPorCategoria(saboresFiltrados);
            renderizarMenu(contentDiv, sucursalNum, pantallaNum, saboresAgrupados);
        },
        error: function(error) {
            contentDiv.innerHTML = '<h1>Error Fatal</h1>';
            console.error('Error:', error);
        }
    });
}

function agruparPorCategoria(sabores) {
    return sabores.reduce((acc, sabor) => {
        const categoria = sabor.Categoría || 'Otros';
        if (!acc[categoria]) {
            acc[categoria] = [];
        }
        acc[categoria].push(sabor);
        return acc;
    }, {});
}

function renderizarMenu(container, sucursal, pantalla, grupos) {
    let html = ''; 
    const categorias = Object.keys(grupos).sort();
    const mitad = Math.ceil(categorias.length / 2);
    
    // Dividir en columnas
    const col1 = categorias.slice(0, mitad);
    const col2 = categorias.slice(mitad);

    let col1Html = '';
    col1.forEach(cat => { col1Html += crearSeccionCategoria(cat, grupos[cat]); });
    let col2Html = '';
    col2.forEach(cat => { col2Html += crearSeccionCategoria(cat, grupos[cat]); });
    
    html += `
        <div class="menu-container">
            <div>${col1Html}</div>
            <div>${col2Html}</div>
        </div>
    `;

    container.innerHTML = html;
}

function crearSeccionCategoria(categoria, sabores) {
    const saboresOrdenados = sabores.sort((a, b) => a.Sabores.localeCompare(b.Sabores)); 
    const regexSi = /s[íi]/i; 

    let html = `<section class="categoria">
        <h2>${categoria}</h2>
        <div class="sabores-grid">`;
        
    saboresOrdenados.forEach(sabor => {
        const esVegano = sabor.VEGANO && sabor.VEGANO.trim().match(regexSi);
        const esSinTACC = sabor['Sin TACC'] && sabor['Sin TACC'].trim().match(regexSi); 
        const nombreSaborMayusculas = sabor.Sabores.toUpperCase(); 

        html += `<div class="sabor-item">
            <span class="sabor-nombre">${nombreSaborMayusculas}</span>
            ${esSinTACC ? '<span class="sintacc-tag">◎</span>' : ''} 
            ${esVegano ? '<span class="vegano-tag">🌱</span>' : ''}
        </div>`;
    });
    
    html += `</div></section>`;
    return html;
}
