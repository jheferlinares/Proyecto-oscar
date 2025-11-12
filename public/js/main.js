
document.addEventListener('DOMContentLoaded', function() {
    // Inicializar funcionalidades
    initializeSearch();
    initializeFilters();
    initializeDateDefaults();
    initializeTooltips();
});

// Función de búsqueda en tiempo real
function initializeSearch() {
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            filterTable();
        });
    }
}

// Función de filtros
function initializeFilters() {
    const filterTipo = document.getElementById('filterTipo');
    const filterMantenimiento = document.getElementById('filterMantenimiento');
    
    if (filterTipo) {
        filterTipo.addEventListener('change', filterTable);
    }
    
    if (filterMantenimiento) {
        filterMantenimiento.addEventListener('change', filterTable);
    }
}

// Filtrar tabla de mantenimientos
function filterTable() {
    const searchTerm = document.getElementById('searchInput')?.value.toLowerCase() || '';
    const tipoFilter = document.getElementById('filterTipo')?.value || '';
    const mantenimientoFilter = document.getElementById('filterMantenimiento')?.value || '';
    
    const table = document.getElementById('mantenimientosTable');
    if (!table) return;
    
    const rows = table.getElementsByTagName('tbody')[0].getElementsByTagName('tr');
    
    for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const cells = row.getElementsByTagName('td');
        
        if (cells.length === 0) continue;
        
        const tipo = cells[0].textContent.trim();
        const modelo = cells[1].textContent.toLowerCase();
        const tipoMantenimiento = cells[2].textContent.trim();
        const tecnico = cells[4].textContent.toLowerCase();
        
        // Verificar filtros
        const matchesSearch = modelo.includes(searchTerm) || tecnico.includes(searchTerm);
        const matchesTipo = !tipoFilter || tipo.includes(tipoFilter);
        const matchesMantenimiento = !mantenimientoFilter || tipoMantenimiento.includes(mantenimientoFilter);
        
        if (matchesSearch && matchesTipo && matchesMantenimiento) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    }
}

// Establecer fecha actual por defecto en formularios
function initializeDateDefaults() {
    const fechaInput = document.getElementById('fecha');
    if (fechaInput && !fechaInput.value) {
        const today = new Date().toISOString().split('T')[0];
        fechaInput.value = today;
    }
    
    const horaInput = document.getElementById('hora');
    if (horaInput && !horaInput.value) {
        const now = new Date();
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        horaInput.value = `${hours}:${minutes}`;
    }
}

// Inicializar tooltips de Bootstrap
function initializeTooltips() {
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });
}

// Función para confirmar eliminaciones (si se implementa)
function confirmDelete(message) {
    return confirm(message || '¿Estás seguro de que deseas eliminar este elemento?');
}

// Función para mostrar notificaciones
function showNotification(message, type = 'info') {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show position-fixed`;
    alertDiv.style.top = '20px';
    alertDiv.style.right = '20px';
    alertDiv.style.zIndex = '9999';
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    document.body.appendChild(alertDiv);
    
    // Auto-remover después de 5 segundos
    setTimeout(() => {
        if (alertDiv.parentNode) {
            alertDiv.parentNode.removeChild(alertDiv);
        }
    }, 5000);
}

// Validación de formularios
function validateForm(formId) {
    const form = document.getElementById(formId);
    if (!form) return true;
    
    const requiredFields = form.querySelectorAll('[required]');
    let isValid = true;
    
    requiredFields.forEach(field => {
        if (!field.value.trim()) {
            field.classList.add('is-invalid');
            isValid = false;
        } else {
            field.classList.remove('is-invalid');
        }
    });
    
    return isValid;
}

// Función para calcular próximo mantenimiento automáticamente
function calculateNextMaintenance() {
    const tipoMantenimiento = document.getElementById('tipoMantenimiento');
    const fecha = document.getElementById('fecha');
    const proximoInput = document.getElementById('proximoMantenimiento');
    
    if (!tipoMantenimiento || !fecha || !proximoInput) return;
    
    tipoMantenimiento.addEventListener('change', function() {
        if (fecha.value) {
            const fechaActual = new Date(fecha.value);
            let mesesAgregar = 0;
            
            switch(this.value) {
                case 'Preventivo':
                    mesesAgregar = 3;
                    break;
                case 'Correctivo':
                    mesesAgregar = 1;
                    break;
                case 'Predictivo':
                    mesesAgregar = 6;
                    break;
            }
            
            if (mesesAgregar > 0) {
                fechaActual.setMonth(fechaActual.getMonth() + mesesAgregar);
                proximoInput.value = fechaActual.toISOString().split('T')[0];
            }
        }
    });
}

// Inicializar cálculo automático si existe el formulario
document.addEventListener('DOMContentLoaded', function() {
    calculateNextMaintenance();
});