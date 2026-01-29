document.addEventListener('DOMContentLoaded', () => {
    const RUTA_MENU = 'menu.html'; 
    const csvUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vS096sKyd8yEnxylv0Ze__LocfEUvd2YM7NG375v5IBLLe9aElstkRSoxE0xBpnzVkoJppXZEBtsY51/pub?output=csv';
    
    const generatorDiv = document.getElementById('url-generator');
    const btnApply = document.getElementById('btn-apply-changes'); 
    
    // Cálculo de URL base
    let fullPath = window.location.href;
    let BASE_URL = fullPath.endsWith('/') 
        ? fullPath + RUTA_MENU 
        : fullPath.replace(new RegExp(window.location.pathname.split('/').pop() + '$'), RUTA_MENU);
    
    // Variables caché
    let cachedSucursales = [];
    let cachedPantallas = [];

    // --- FUNCIÓN CENTRAL DE ACTUALIZACIÓN ---
    const ejecutarActualizacion = () => {
        if (cachedSucursales.length > 0) {
            renderUrlGenerator(generatorDiv, cachedSucursales, cachedPantallas, BASE_URL);
            
            // Feedback visual: Cambiar texto del botón brevemente
            const originalText = btnApply.textContent;
            btnApply.textContent = '✅ ¡URLs Actualizadas!';
            setTimeout(() => {
                btnApply.textContent = originalText;
            }, 1500);
        } else {
            alert("Aún no se han cargado los datos del Sheet.");
        }
    };

    // 1. Escuchar clic en el botón "Aplicar Cambios"
    if (btnApply) {
        btnApply.addEventListener('click', (e) => {
            e.preventDefault();
            ejecutarActualizacion();
        });
    }

    // 2. (Opcional) Mantener actualización automática al cambiar inputs
    // Si prefieres que SOLO sea con el botón, borra este bloque.
    // Yo recomiendo dejarlo para que sea fluido.
    const inputsConfig = document.querySelectorAll('.config-panel input, .config-panel select');
    inputsConfig.forEach(input => {
        input.addEventListener('change', () => { // Usamos 'change' en vez de 'input' para no saturar
            ejecutarActualizacion();
        });
    });

    // --- CARGA INICIAL ---
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

            cachedSucursales = sucursales;
            cachedPantallas = pantallas;

            // Renderizado inicial
            renderUrlGenerator(generatorDiv, sucursales, pantallas, BASE_URL);
        })
        .catch(error => {
            console.error(error);
            const loadingElement = document.getElementById('loading');
            if(loadingElement) loadingElement.textContent = "Error al cargar datos.";
        });
});

function renderUrlGenerator(container, sucursales, pantallas, baseUrl) {
    if (sucursales.length === 0) return;

    // Obtener valores del DOM
    const isTransparent = document.getElementById('conf-bg-transparent').checked;
    const bgColor = isTransparent ? 'transparent' : document.getElementById('conf-bg-color').value.replace('#', '');
    const titleColor = document.getElementById('conf-title-color').value.replace('#', '');
    const textColor = document.getElementById('conf-text-color').value.replace('#', '');
    const fontFamily = encodeURIComponent(document.getElementById('conf-font').value);
    const titleSize = document.getElementById('conf-title-size').value;
    const textSize = document.getElementById('conf-text-size').value;

    let html = '';

    sucursales.forEach(sucursalNum => {
        // Agregamos clase 'updated-flash' para animación
        html += `
        <div class="sucursal-section updated-flash"> 
            <h2>Sucursal ${sucursalNum}</h2>
            <div class="pantallas-grid">
        `;
        
        pantallas.forEach(pantallaNum => {
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
    
    // Reasignar eventos de botones
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
        const originalText = boton.textContent;
        boton.textContent = '¡Copiado!';
        setTimeout(() => boton.textContent = originalText, 1500);
    });
}
