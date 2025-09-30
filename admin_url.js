document.addEventListener('DOMContentLoaded', () => {
    // ⚠️ CORRECCIÓN CLAVE: El archivo de destino es ahora menu.html ⚠️
    const RUTA_MENU = 'menu.html'; 
    
    // URL de tu Google Sheet publicado como CSV
    const csvUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vS096sKyd8yEnxylv0Ze__LocfEUvd2YM7NG375v5IBLLe9aElstkRSoxE0xBpnzVkoJppXZEBtsY51/pub?output=csv';
    
    const generatorDiv = document.getElementById('url-generator');
    
    // --- Lógica para calcular la URL Base CORRECTA (Apuntando a menu.html) ---
    let fullPath = window.location.href;
    
    // Esto asegura que la URL generada apunte a menu.html
    let BASE_URL = fullPath.endsWith('/') 
        ? fullPath + RUTA_MENU 
        : fullPath.replace(new RegExp(window.location.pathname.split('/').pop() + '$'), RUTA_MENU);
    
    // Asume que tienes un elemento para mostrar la base de la URL en tu HTML de administrador
    const baseUrlDisplay = document.getElementById('base-url-display');
    if (baseUrlDisplay) {
        baseUrlDisplay.textContent = BASE_URL;
    }
    // -------------------------------------------------

    fetch(csvUrl)
        .then(response => response.text())
        .then(csvText => {
            const loadingElement = document.getElementById('loading');
            if (loadingElement) loadingElement.style.display = 'none';
            
            // Solo necesitamos la primera línea para los encabezados
            const headers = csvText.trim().split('\n')[0].split(',').map(h => h.trim().replace(/"/g, ''));

            // 1. Identificar Sucursales y Pantallas
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

            // 2. Generar el HTML de las URLs
            renderUrlGenerator(generatorDiv, sucursales, pantallas, BASE_URL);

        })
        .catch(error => {
            const loadingElement = document.getElementById('loading');
            if (loadingElement) loadingElement.innerHTML = 'Error al cargar los encabezados del Sheet.';
            console.error('Error fetching CSV:', error);
        });
});


/**
 * Construye y muestra la interfaz de generación de URLs.
 */
function renderUrlGenerator(container, sucursales, pantallas, baseUrl) {
    if (sucursales.length === 0 || pantallas.length === 0) {
        container.innerHTML = '<p style="color:red;">No se encontraron columnas de Sucursales (Activo Sucursal X) o Pantallas (Pantalla Y) en el Sheet.</p>';
        return;
    }

    let html = '';

    sucursales.forEach(sucursalNum => {
        html += `
        <div class="sucursal-section">
            <h2>Sucursal ${sucursalNum}</h2>
            <div class="pantallas-grid">
        `;
        
        pantallas.forEach(pantallaNum => {
            // Se genera la URL final con los parámetros correctos
            const finalUrl = `${baseUrl}?sucursal=${sucursalNum}&pantalla=${pantallaNum}`;
            
            html += `
            <div class="url-box">
                <p>Pantalla ${pantallaNum}</p>
                <input type="text" class="url-input" value="${finalUrl}" readonly onclick="this.select();">
                
                <div style="display: flex; gap: 10px;">
                    <button class="copy-btn" data-url="${finalUrl}">Copiar URL</button>
                    <a href="${finalUrl}" target="_blank" class="copy-btn" style="background-color: #007bff; text-decoration: none; text-align: center;">Abrir en Nueva Pestaña</a>
                </div>
            </div>
            `;
        });

        html += `
            </div>
        </div>
        `;
    });

    container.innerHTML = html;
    
    // 3. Añadir el evento de Copiar
    document.querySelectorAll('.copy-btn').forEach(button => {
        if (button.tagName === 'BUTTON') {
            button.addEventListener('click', (e) => {
                const urlToCopy = e.target.getAttribute('data-url');
                copiarAlPortapapeles(urlToCopy, e.target);
            });
        }
    });
}

/**
 * Función para copiar la URL al portapapeles.
 */
function copiarAlPortapapeles(texto, boton) {
    navigator.clipboard.writeText(texto).then(() => {
        const textoOriginal = boton.textContent;
        boton.textContent = '¡Copiado!';
        setTimeout(() => {
            boton.textContent = textoOriginal;
        }, 1500);
    }).catch(err => {
        console.error('Error al copiar:', err);
        alert('Error al copiar la URL. Por favor, cópiala manualmente.');
    });
}
