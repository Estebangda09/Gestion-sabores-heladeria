// ⚠️ MODIFICA ESTAS URLs con las publicadas por separado ⚠️
const CSV_URL_MENU = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vS096sKyd8yEnxylv0Ze__LocfEUvd2YM7NG375v5IBLLe9aElstkRSoxE0xBpnzVkoJppXZEBtsY51/pub?gid=0&single=true&output=csv';
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

    // 1. Cargar Configuración primero
    Papa.parse(CSV_URL_CONFIG, {
        download: true,
        header: true,
        complete: function(configResults) {
            const configMap = {};
            configResults.data.forEach(row => {
                if (row.CLAVE && row.VALOR) {
                    configMap[row.CLAVE.trim()] = row.VALOR.trim(); 
                }
            });

            // 2. Aplicar estilos dinámicamente
            aplicarEstilosDinamicos(configMap);
            
            // 3. Cargar el Menú
            cargarMenu(configMap, sucursalNum, pantallaNum);
        },
        error: function(error) {
            contentDiv.innerHTML = '<h1>Error Fatal</h1><h2 class="loading-message" style="color: red;">No se pudo cargar la Configuración de Estilos.</h2>';
            console.error('Error de Papaparse al cargar Config:', error);
        }
    });

    // 4. Configurar recarga automática (se inicia solo una vez)
    setTimeout(function() {
        window.location.reload(true); 
    }, 300 * 1000); // 5 minutos
});

// --- FUNCIONES DE ESTILOS ---

function aplicarEstilosDinamicos(config) {
    const root = document.documentElement.style;
    
    // Asigna las variables CSS
    root.setProperty('--color-fondo', config.color_fondo || '#f4f4f4');
    root.setProperty('--color-texto-normal', config.color_texto_normal || '#333333');
    root.setProperty('--color-categoria', config.color_categoria || '#4CAF50');
    root.setProperty('--fuente-general', config.fuente_general || 'Arial, sans-serif');
    root.setProperty('--tamano-base-vw', config.tamano_base_vw || '0.9vw');
}

// --- FUNCIONES DE CARGA Y RENDERIZADO ---

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
                contentDiv.innerHTML = '<h1>Error de Datos</h1><h2 class="loading-message" style="color: red;">El archivo CSV de Menú está vacío o el formato es incorrecto.</h2>';
                return;
            }
            
            // Lógica de filtrado
            const saboresFiltrados = data.filter(item => {
                const activoSucursal = item[columnaSucursal] && item[columnaSucursal].trim().match(regexSi);
                const activoPantalla = item[columnaPantalla] && item[columnaPantalla].trim().match(regexSi);
                return activoSucursal && activoPantalla;
            });

            if (saboresFiltrados.length === 0) {
                contentDiv.innerHTML = `<h1>Menú</h1><h2 class="loading-message" style="color: orange;">No hay sabores activos para esta pantalla/sucursal.</h2>`;
                return;
            }

            const saboresAgrupados = agruparPorCategoria(saboresFiltrados);
            renderizarMenu(contentDiv, sucursalNum, pantallaNum, saboresAgrupados);
        },
        error: function(error) {
            contentDiv.innerHTML = '<h1>Error Fatal</h1><h2 class="loading-message" style="color: red;">No se pudo cargar el Menú. Verifique la URL y la red.</h2>';
            console.error('Error de Papaparse al cargar Menú:', error);
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
    const categoriasColumna1 = categorias.slice(0, mitad);
    const categoriasColumna2 = categorias.slice(mitad);

    let col1Html = '';
    categoriasColumna1.forEach(categoria => { col1Html += crearSeccionCategoria(categoria, grupos[categoria]); });
    let col2Html = '';
    categoriasColumna2.forEach(categoria => { col2Html += crearSeccionCategoria(categoria, grupos[categoria]); });
    
    html += `
        <div class="menu-container">
            <div>${col1Html}</div>
            <div>
                ${col2Html}
                
                <div class="referencias-box-clean">
                    <p><span class="vegano-tag">🌱</span> Vegano</p>
                    <p><span class="sintacc-tag">◎</span> Sin TACC</p>
                </div>
            </div>
        </div>
    `;

    container.innerHTML = html;
}

function crearSeccionCategoria(categoria, sabores) {
    const saboresOrdenados = sabores.sort((a, b) => a.Sabores.localeCompare(b.Sabores)); 
    let html = `<section class="categoria">
        <h2>${categoria}</h2>
        <div class="sabores-grid">`;
        
    const regexSi = /s[íi]/i; 

    saboresOrdenados.forEach(sabor => {
        const esVegano = sabor.VEGANO && sabor.VEGANO.trim().match(regexSi);
        const esSinTACC = sabor['Sin TACC'] && sabor['Sin TACC'].trim().match(regexSi); 
        // 🚨 Aplicación de MAYÚSCULAS
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
