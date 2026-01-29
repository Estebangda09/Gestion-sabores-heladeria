document.addEventListener('DOMContentLoaded', () => {
    const RUTA_MENU = 'menu.html'; 
   
    const csvUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vS096sKyd8yEnxylv0Ze__LocfEUvd2YM7NG375v5IBLLe9aElstkRSoxE0xBpnzVkoJppXZEBtsY51/pub?output=csv';
    
    const generatorDiv = document.getElementById('url-generator');
    
    // Cálculo de URL base
    let fullPath = window.location.href;
    let BASE_URL = fullPath.endsWith('/') 
        ? fullPath + RUTA_MENU 
        : fullPath.replace(new RegExp(window.location.pathname.split('/').pop() + '$'), RUTA_MENU);
    
    // Variables para guardar datos y no recargar el CSV cada vez que cambias un color
    let cachedSucursales = [];
    let cachedPantallas = [];

    // --- ESCUCHA DE CAMBIOS EN EL PANEL ---
    const inputsConfig = document.querySelectorAll('.config-panel input, .config-panel select');
    inputsConfig.forEach(input => {
        input.addEventListener('input', () => {
            // Si ya tenemos datos, regeneramos las URLs con los nuevos colores/tamaños
            if (cachedSucursales.length > 0) {
                renderUrlGenerator(generatorDiv, cachedSucursales, cachedPantallas, BASE_URL);
            }
        });
    });

    // --- CARGA INICIAL DEL CSV ---
    fetch(csvUrl)
        .then(response => response.text())
        .then(csvText => {
            const loadingElement = document.getElementById('loading');
            if (loadingElement) loadingElement.style.display = 'none';
            
            const headers = csvText.trim().split('\n')[0].split(',').map(h => h.trim().replace(/"/g, ''));

            const sucursales = [];
            const pantallas = [];

            headers.forEach(header => {
                if (header.startsWith('Activo Sucursal')) {
                    const match = header.match(/Activo Sucursal (\d+)/);
                    if (match) sucursales.push(match[1]);
                } else if (header.startsWith('Pantalla')) {
                    const match = header.match(/Pantalla (\d+)/);
                    if (match) pantallas.push(match[1]);
                }
            });

            // Guardar en caché
            cachedSucursales = sucursales;
            cachedPantallas = pantallas;

            // Renderizar por primera vez
            renderUrlGenerator(generatorDiv, sucursales, pantallas, BASE_URL);

        })
        .catch(error => {
            const loadingElement = document.getElementById('loading');
            if (loadingElement) loadingElement.innerHTML = 'Error al cargar los encabezados del Sheet.';
            console.error('Error fetching CSV:', error);
        });
});


/**
 * Construye la interfaz y las URLs con parámetros de diseño.
 */
function renderUrlGenerator(container, sucursales, pantallas, baseUrl) {
    if (sucursales.length === 0 || pantallas.length === 0) {
        container.innerHTML = '<p style="color:red;">No se encontraron columnas de Sucursales o Pantallas.</p>';
        return;
    }

    // 1. OBTENER VALORES DE CONFIGURACIÓN DEL DOM
    const isTransparent = document.getElementById('conf-bg-transparent').checked;
    const bgColor = isTransparent ? 'transparent' : document.getElementById('conf-bg-color').value.replace('#', '');
    const titleColor = document.getElementById('conf-title-color').value.replace('#', '');
    const textColor = document.getElementById('conf-text-color').value.replace('#', '');
    const fontFamily = encodeURIComponent(document.getElementById('conf-font').value);
    const titleSize = document.getElementById('conf-title-size').value;
    const textSize = document.getElementById('conf-text-size').value;

    let html = '';

    sucursales.forEach(sucursalNum => {
        html += `
        <div class="sucursal-section">
            <h2>Sucursal ${sucursalNum}</h2>
            <div class="pantallas-grid">
        `;
        
        pantallas.forEach(pantallaNum => {
            // 2. CONSTRUIR URL CON PARÁMETROS
       
            let finalUrl = `${baseUrl}?sucursal=${sucursalNum}&pantalla=${pantallaNum}`;
            finalUrl += `&bg=${bgColor}`;
            finalUrl += `&tc=${titleColor}`;
            finalUrl += `&txtc=${textColor}`;
            finalUrl += `&font=${fontFamily}`;
            finalUrl += `&ts=${titleSize}`;
            finalUrl += `&txts=${textSize}`;
            
            html += `
            <div class="url-box">
                <p>Pantalla ${pantallaNum}</p>
                <input type="text" class="url-input" value="${finalUrl}" readonly onclick="this.select();">
                
                <div style="display: flex; gap: 10px;">
                    <button class="copy-btn" data-url="${finalUrl}">Copiar URL</button>
                    <a href="${finalUrl}" target="_blank" class="copy-btn" style="background-color: #007bff; text-decoration: none; text-align: center;">Abrir</a>
                </div>
            </div>
            `;
        });

        html += `</div></div>`;
    });

    container.innerHTML = html;
    
    // Eventos de Copiar
    document.querySelectorAll('.copy-btn').forEach(button => {
        if (button.tagName === 'BUTTON') {
            button.addEventListener('click', (e) => {
                const urlToCopy = e.target.getAttribute('data-url');
                copiarAlPortapapeles(urlToCopy, e.target);
            });
        }
    });
}

function copiarAlPortapapeles(texto, boton) {
    navigator.clipboard.writeText(texto).then(() => {
        const textoOriginal = boton.textContent;
        boton.textContent = '¡Copiado!';
        setTimeout(() => {
            boton.textContent = textoOriginal;
        }, 1500);
    }).catch(err => {
        console.error('Error al copiar:', err);
        alert('Error al copiar. Hazlo manualmente.');
    });
}
