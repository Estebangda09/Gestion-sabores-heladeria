// URL de tu Google Sheet publicado como CSV
// ⚠️ REEMPLAZA ESTA URL CON LA TUYA SI ES DIFERENTE ⚠️
const CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vS096sKyd8yEnxylv0Ze__LocfEUvd2YM7NG375v5IBLLe9aElstkRSoxE0xBpnzVkoJppXZEBtsY51/pub?output=csv';

document.addEventListener('DOMContentLoaded', () => {
    const contentDiv = document.getElementById('sabores-menu');
    const urlParams = new URLSearchParams(window.location.search);
    
    const sucursalNum = urlParams.get('sucursal'); 
    const pantallaNum = urlParams.get('pantalla'); 

    if (!sucursalNum || !pantallaNum) {
        contentDiv.innerHTML = '<h1>Error de Configuración</h1><h2 class="loading-message" style="color: red;">Faltan parámetros. Usa una URL como: index.html?sucursal=1&pantalla=1</h2>';
        return;
    }

    // Nombres de columna que coinciden con los encabezados de tu Sheet (con espacios)
    const columnaSucursal = `Activo Sucursal ${sucursalNum}`; 
    const columnaPantalla = `Pantalla ${pantallaNum}`; 
    
    // --- LÓGICA DE CARGA USANDO PAPAPARSE ---
    Papa.parse(CSV_URL, {
        download: true,   // Descarga el archivo desde la URL
        header: true,     // Convierte la primera fila en claves de objeto
        skipEmptyLines: true, 
        transformHeader: (header) => header.trim(), // Limpia los espacios de borde de los encabezados
        complete: function(results) {
            const data = results.data;

            if (data.length === 0) {
                contentDiv.innerHTML = '<h1>Error de Datos</h1><h2 class="loading-message" style="color: red;">El archivo CSV está vacío o el formato es incorrecto.</h2>';
                return;
            }

            // LÓGICA DE FILTRADO
            const regexSi = /s[íi]/i; // Busca 'si' o 'sí', ignorando mayúsculas/minúsculas
            
            const saboresFiltrados = data.filter(item => {
                const valorSucursal = item[columnaSucursal];
                const valorPantalla = item[columnaPantalla];
                
                // Trim y regex para ignorar cualquier espacio extra (como el 'si ')
                const activoSucursal = valorSucursal && valorSucursal.trim().match(regexSi);
                const activoPantalla = valorPantalla && valorPantalla.trim().match(regexSi);
                
                return activoSucursal && activoPantalla;
            });

            if (saboresFiltrados.length === 0) {
                contentDiv.innerHTML = `<h1>Menú</h1><h2 class="loading-message" style="color: orange;">No hay sabores activos para Pantalla ${pantallaNum} en Sucursal ${sucursalNum}.</h2>`;
                return;
            }

            const saboresAgrupados = agruparPorCategoria(saboresFiltrados);
            renderizarMenu(contentDiv, sucursalNum, pantallaNum, saboresAgrupados);

            // 🚨 RECARGA AUTOMÁTICA: Recarga la página CADA 5 MINUTOS 🚨
            setTimeout(function() {
                window.location.reload(true); 
            }, 300 * 1000); // 300 segundos = 5 minutos
        },
        error: function(error) {
            contentDiv.innerHTML = '<h1>Error Fatal</h1><h2 class="loading-message" style="color: red;">No se pudo conectar o procesar el menú. Verifique la URL y la red.</h2>';
            console.error('Error de Papaparse:', error);
        }
    });
});

/**
 * Agrupa los sabores por su campo 'Categoría'.
 */
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

/**
 * Construye e inyecta el HTML del menú en la página.
 * (Sin título principal. Incluye la caja de referencias limpia.)
 */
function renderizarMenu(container, sucursal, pantalla, grupos) {
    let html = ''; // Comienza sin título principal
    
    const categorias = Object.keys(grupos).sort();

    // Divide las categorías para el diseño de dos columnas principales
    const mitad = Math.ceil(categorias.length / 2);
    const categoriasColumna1 = categorias.slice(0, mitad);
    const categoriasColumna2 = categorias.slice(mitad);

    let col1Html = '';
    categoriasColumna1.forEach(categoria => { col1Html += crearSeccionCategoria(categoria, grupos[categoria]); });
    let col2Html = '';
    categoriasColumna2.forEach(categoria => { col2Html += crearSeccionCategoria(categoria, grupos[categoria]); });
    
    // El contenedor principal de 2 columnas
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

/**
 * Función auxiliar para crear el HTML de una sola sección de categoría.
 * (Solo genera etiquetas para Sin TACC y Vegano)
 */
function crearSeccionCategoria(categoria, sabores) {
    // Ordena los sabores.
    const saboresOrdenados = sabores.sort((a, b) => a.Sabores.localeCompare(b.Sabores)); 

    let html = `<section class="categoria">
        <h2>${categoria}</h2>
        <div class="sabores-grid">`;
        
    const regexSi = /s[íi]/i; 

    saboresOrdenados.forEach(sabor => {
        const esVegano = sabor.VEGANO && sabor.VEGANO.trim().match(regexSi);
        // Usa la clave de columna tal como se lee del CSV (con espacios)
        const esSinTACC = sabor['Sin TACC'] && sabor['Sin TACC'].trim().match(regexSi); 
        
        // 🚨 CAMBIO AQUÍ: Convertir el nombre del sabor a mayúsculas
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