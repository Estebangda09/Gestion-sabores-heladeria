// --- CONFIGURACIÓN ---
const CSV_URL_MENU = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vS096sKyd8yEnxylv0Ze__LocfEUvd2YM7NG375v5IBLLe9aElstkRSoxE0xBpnzVkoJppXZEBtsY51/pub?gid=0&single=true&output=csv';
const CSV_URL_CONFIG = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vS096sKyd8yEnxylv0Ze__LocfEUvd2YM7NG375v5IBLLe9aElstkRSoxE0xBpnzVkoJppXZEBtsY51/pub?gid=1614228917&single=true&output=csv';

const INTERVALO_ACTUALIZACION = 15000; // 15 segundos

let cacheMenuData = '';
let cacheConfigData = '';

document.addEventListener('DOMContentLoaded', () => {
    const contentDiv = document.getElementById('sabores-menu');
    const urlParams = new URLSearchParams(window.location.search);
    
    const sucursalNum = urlParams.get('sucursal'); 
    const pantallaNum = urlParams.get('pantalla'); 

    if (!sucursalNum || !pantallaNum) {
        contentDiv.innerHTML = '<h1 style="color:red; background:white;">Error: Faltan parámetros en la URL</h1>';
        return;
    }

    // Carga inicial
    ejecutarCicloDeActualizacion(sucursalNum, pantallaNum);

    // Polling (Actualización automática)
    setInterval(() => {
        ejecutarCicloDeActualizacion(sucursalNum, pantallaNum);
    }, INTERVALO_ACTUALIZACION);
});

function ejecutarCicloDeActualizacion(sucursal, pantalla) {
    // 1. Configuración (Estilos/Fondo)
    fetch(CSV_URL_CONFIG)
        .then(res => res.text())
        .then(csvText => {
            if (csvText !== cacheConfigData) {
                console.log('🎨 Cambio detectado en Config');
                cacheConfigData = csvText;
                procesarConfiguracion(csvText);
            }
        })
        .catch(console.error);

    // 2. Menú (Sabores)
    fetch(CSV_URL_MENU)
        .then(res => res.text())
        .then(csvText => {
            if (csvText !== cacheMenuData) {
                console.log('🍦 Cambio detectado en Menú');
                cacheMenuData = csvText;
                procesarMenu(csvText, sucursal, pantalla);
            }
        })
        .catch(console.error);
}

function procesarConfiguracion(csvText) {
    Papa.parse(csvText, {
        header: true, skipEmptyLines: true,
        complete: function(results) {
            const configMap = {};
            results.data.forEach(row => {
                if (row.CLAVE && row.VALOR) configMap[row.CLAVE.trim()] = row.VALOR.trim();
            });
            aplicarEstilosDesdeSheet(configMap);
        }
    });
}

function procesarMenu(csvText, sucursalNum, pantallaNum) {
    const contentDiv = document.getElementById('sabores-menu');
    const columnaSucursal = `Activo Sucursal ${sucursalNum}`; 
    const columnaPantalla = `Pantalla ${pantallaNum}`; 
    const regexSi = /s[íi]/i; 

    Papa.parse(csvText, {
        header: true, skipEmptyLines: true, transformHeader: h => h.trim(),
        complete: function(results) {
            const filtrados = results.data.filter(item => {
                const s = item[columnaSucursal] && item[columnaSucursal].trim().match(regexSi);
                const p = item[columnaPantalla] && item[columnaPantalla].trim().match(regexSi);
                return s && p;
            });

            if (filtrados.length === 0) {
                contentDiv.innerHTML = `<h2 class="loading-message">Sin datos para mostrar...</h2>`;
                return;
            }
            const agrupados = agruparPorCategoria(filtrados);
            renderizarMenu(contentDiv, agrupados);
        }
    });
}

function aplicarEstilosDesdeSheet(config) {
    const root = document.documentElement.style;
    
    const fondoValor = config['color_fondo'] || '#f4f4f4'; 
    const titleColor = config['color_titulo'] || '#4CAF50';
    const textColor = config['color_texto'] || '#333333';
    const font = config['tipografia'] || 'Arial, sans-serif';
    const titleSize = config['tamano_titulo'] || '32px';
    const textSize = config['tamano_texto'] || '22px';

    // Aplicar variables
    root.setProperty('--color-categoria', titleColor);
    root.setProperty('--color-texto-normal', textColor);
    root.setProperty('--fuente-general', font);
    
    // Forzar en Body
    document.body.style.color = textColor;
    document.body.style.fontFamily = font;

    // Actualizar fondo (Video/Imagen/Color)
    actualizarFondo(fondoValor);

    // Inyectar CSS
    let styleTag = document.getElementById('dynamic-styles');
    if (!styleTag) {
        styleTag = document.createElement('style');
        styleTag.id = 'dynamic-styles';
        document.head.appendChild(styleTag);
    }
    styleTag.innerText = `
        .categoria h2 { font-size: ${titleSize} !important; color: ${titleColor} !important; }
        .sabor-item { font-size: ${textSize} !important; color: ${textColor} !important; }
        .sabor-img { border-color: ${titleColor} !important; }
    `;
}

function actualizarFondo(valor) {
    const container = document.getElementById('fondo-dinamico');
    if (!container) return;
    const val = valor.trim();
    if (container.dataset.bgActual === val) return;
    container.dataset.bgActual = val;
    container.innerHTML = '';

    if (/\.(mp4|webm|ogg)$/i.test(val)) {
        container.innerHTML = `<video class="media-fullscreen" autoplay muted loop playsinline><source src="${val}" type="video/mp4"></video>`;
    } else if (/\.(jpg|jpeg|png|gif|webp)$/i.test(val)) {
        container.innerHTML = `<img src="${val}" class="media-fullscreen" alt="Fondo">`;
    } else {
        container.style.backgroundColor = val;
    }
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
    let col1 = '', col2 = '';
    cats.slice(0, mitad).forEach(c => col1 += htmlCategoria(c, grupos[c]));
    cats.slice(mitad).forEach(c => col2 += htmlCategoria(c, grupos[c]));
    container.innerHTML = `<div class="menu-container"><div>${col1}</div><div>${col2}</div></div>`;
}

function htmlCategoria(cat, sabores) {
    const ordenados = sabores.sort((a, b) => a.Sabores.localeCompare(b.Sabores)); 
    let items = '';
    
    ordenados.forEach(s => {
        const vegano = s.VEGANO && s.VEGANO.match(/s[íi]/i);
        const tacc = s['Sin TACC'] && s['Sin TACC'].match(/s[íi]/i);
        const urlImagen = s.Imagen ? s.Imagen.trim() : ''; 
        
        const htmlImg = urlImagen 
            ? `<img src="${urlImagen}" class="sabor-img" onerror="this.style.display='none'">` 
            : '';

        items += `
        <div class="sabor-item">
            ${htmlImg}
            <div class="sabor-info">
                <span class="sabor-nombre">${s.Sabores.toUpperCase()}</span>
                <div style="white-space: nowrap;">
                    ${tacc ? '<span class="sintacc-tag">◎</span>' : ''} 
                    ${vegano ? '<span class="vegano-tag">🌱</span>' : ''}
                </div>
            </div>
        </div>`;
    });
    
    return `<section class="categoria"><h2>${cat}</h2><div class="sabores-grid">${items}</div></section>`;
}
