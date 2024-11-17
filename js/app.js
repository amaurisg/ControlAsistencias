// Registrar el Service Worker
if ('serviceWorker' in navigator) {
    window.addEventListener('load', function () {
        navigator.serviceWorker.register('service-worker.js')
            .then(function (registration) {
                console.log('Service Worker registrado con éxito:', registration.scope);
            }, function (err) {
                console.log('Error al registrar el Service Worker:', err);
            });
    });
}

// Inicializar el timepicker en los campos de hora
$(document).ready(function () {
    $('.timepicker').timepicker({
        timeFormat: 'hh:mm p',
        interval: 15,
        minTime: '12:00am',
        maxTime: '11:45pm',
        dynamic: false,
        dropdown: true,
        scrollbar: true
    });
});

// Función para mostrar y ocultar vistas
function mostrarVista(idVista) {
    // Ocultar todas las vistas
    const vistas = document.querySelectorAll('.view');
    vistas.forEach(vista => {
        vista.classList.remove('active');
        vista.style.display = 'none';
    });

    // Mostrar la vista seleccionada
    const vistaSeleccionada = document.getElementById(idVista);
    vistaSeleccionada.classList.add('active');
    vistaSeleccionada.style.display = 'block';

    // Si es necesario, cargar contenido específico
    if (idVista === 'vista-registrar-asistencia') {
        mostrarFormularioAsistencia();
    } else if (idVista === 'vista-total-asistencias') {
        mostrarTotalAsistencias();
    }
}

// Función para mostrar el formulario de asistencia
function mostrarFormularioAsistencia() {
    // Limpiar el formulario
    document.getElementById('formAsistencia').reset();
    // Cargar los nombres del personal
    cargarNombresPersonal();
}

// Función para guardar una asistencia en la base de datos
function guardarAsistencia() {
    const nombre = document.getElementById('nombre').value;
    const fecha = document.getElementById('fecha').value;
    const horaLlegada = document.getElementById('horaLlegada').value;
    const horaSalida = document.getElementById('horaSalida').value;
    const estado = document.getElementById('estado').value;

    // Validar los campos obligatorios
    if (!nombre || !fecha || !estado) {
        alert('Por favor, complete todos los campos obligatorios (Nombre, Fecha y Estado).');
        return;
    }

    // Convertir las horas a formato de 24 horas para almacenarlas
    const horaLlegada24 = convertirHoraA24(horaLlegada);
    const horaSalida24 = convertirHoraA24(horaSalida);

    const nuevaAsistencia = {
        nombre,
        fecha,
        horaLlegada: horaLlegada24 || null,
        horaSalida: horaSalida24 || null,
        estado
    };

    const transaction = db.transaction(['asistencias'], 'readwrite');
    const objectStore = transaction.objectStore('asistencias');
    const request = objectStore.add(nuevaAsistencia);

    request.onsuccess = function () {
        alert('Asistencia guardada exitosamente.');
        document.getElementById('formAsistencia').reset();
    };

    request.onerror = function (event) {
        alert('Error al guardar la asistencia: ' + event.target.error);
    };
}

// Función para convertir hora en formato de 12 horas a 24 horas
function convertirHoraA24(hora12) {
    if (!hora12) return null;
    const [time, modifier] = hora12.split(' ');
    let [hours, minutes] = time.split(':');

    if (hours === '12') {
        hours = '00';
    }

    if (modifier.toLowerCase() === 'pm') {
        hours = parseInt(hours, 10) + 12;
    }

    return `${hours.toString().padStart(2, '0')}:${minutes}`;
}

// Función para convertir hora en formato de 24 horas a 12 horas con AM/PM
function convertirHoraA12(hora24) {
    if (!hora24) return '-';
    let [hours, minutes] = hora24.split(':');
    const hoursInt = parseInt(hours, 10);
    const modifier = hoursInt >= 12 ? 'PM' : 'AM';

    hours = hoursInt % 12 || 12;

    return `${hours}:${minutes} ${modifier}`;
}

// Función para mostrar el total de asistencias registradas
function mostrarTotalAsistencias() {
    const tbody = document.getElementById('contenido-total-asistencias');
    tbody.innerHTML = ''; // Limpiar contenido anterior

    const transaction = db.transaction(['asistencias'], 'readonly');
    const objectStore = transaction.objectStore('asistencias');
    const request = objectStore.getAll();

    request.onsuccess = function (event) {
        const datos = event.target.result;
        if (datos.length > 0) {
            datos.forEach(item => {
                const tr = document.createElement('tr');

                // Nombre
                const tdNombre = document.createElement('td');
                tdNombre.textContent = item.nombre;
                tr.appendChild(tdNombre);

                // Fecha (formateada)
                const tdFecha = document.createElement('td');
                tdFecha.textContent = formatearFecha(item.fecha);
                tr.appendChild(tdFecha);

                // Hora de Llegada (convertida a 12 horas)
                const tdHoraLlegada = document.createElement('td');
                tdHoraLlegada.textContent = convertirHoraA12(item.horaLlegada);
                tr.appendChild(tdHoraLlegada);

                // Hora de Salida (convertida a 12 horas)
                const tdHoraSalida = document.createElement('td');
                tdHoraSalida.textContent = convertirHoraA12(item.horaSalida);
                tr.appendChild(tdHoraSalida);

                // Estado
                const tdEstado = document.createElement('td');
                tdEstado.textContent = item.estado;
                // Asignar clase según el estado
                if (item.estado === 'Presente') {
                    tdEstado.classList.add('estado-presente');
                } else if (item.estado === 'Ausente') {
                    tdEstado.classList.add('estado-ausente');
                } else if (item.estado === 'Excusa') {
                    tdEstado.classList.add('estado-excusa');
                }
                tr.appendChild(tdEstado);

                tbody.appendChild(tr);
            });
        } else {
            const tr = document.createElement('tr');
            const td = document.createElement('td');
            td.colSpan = 5;
            td.textContent = 'No hay asistencias registradas.';
            td.style.textAlign = 'center';
            tr.appendChild(td);
            tbody.appendChild(tr);
        }
    };
}

// Función para formatear la fecha
function formatearFecha(fecha) {
    const opciones = { year: 'numeric', month: 'long', day: 'numeric' };
    const fechaObj = new Date(fecha);
    return fechaObj.toLocaleDateString('es-ES', opciones);
}

// Función para generar reportes en PDF o Excel
function generarReporte(formato) {
    const transaction = db.transaction(['asistencias'], 'readonly');
    const objectStore = transaction.objectStore('asistencias');
    const request = objectStore.getAll();

    request.onsuccess = function (event) {
        const datos = event.target.result;

        if (formato === 'PDF') {
            // Generar PDF con jsPDF
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();

            // Agregar título
            doc.setFontSize(18);
            doc.setTextColor(40);
            doc.text('Reporte de Asistencias', 105, 20, null, null, 'center');

            // Agregar tabla
            const columnas = ["Nombre", "Fecha", "Hora de Llegada", "Hora de Salida", "Estado"];
            const filas = datos.map(item => [
                item.nombre,
                formatearFecha(item.fecha),
                convertirHoraA12(item.horaLlegada),
                convertirHoraA12(item.horaSalida),
                item.estado
            ]);

            doc.autoTable({
                head: [columnas],
                body: filas,
                startY: 30,
                theme: 'grid',
                styles: {
                    fontSize: 10,
                    cellPadding: 4,
                    font: 'helvetica',
                    lineColor: [44, 62, 80],
                    lineWidth: 0.1,
                    textColor: [44, 62, 80]
                },
                headStyles: {
                    fillColor: [0, 122, 255],
                    textColor: [255, 255, 255],
                    fontSize: 12,
                    fontStyle: 'bold'
                },
                alternateRowStyles: {
                    fillColor: [240, 248, 255]
                },
                tableLineColor: [44, 62, 80],
                tableLineWidth: 0.1
            });

            doc.save('reporte_asistencias.pdf');

        } else if (formato === 'Excel') {
            // Generar Excel con SheetJS
            const wb = XLSX.utils.book_new();
            const ws = XLSX.utils.json_to_sheet(datos.map(item => ({
                "Nombre": item.nombre,
                "Fecha": formatearFecha(item.fecha),
                "Hora de Llegada": convertirHoraA12(item.horaLlegada),
                "Hora de Salida": convertirHoraA12(item.horaSalida),
                "Estado": item.estado
            })));

            // Aplicar estilos a las celdas de encabezado
            const rango = XLSX.utils.decode_range(ws['!ref']);
            for (let C = rango.s.c; C <= rango.e.c; ++C) {
                const address = XLSX.utils.encode_col(C) + "1";
                if (!ws[address]) continue;
                ws[address].s = {
                    font: { bold: true, color: { rgb: "FFFFFFFF" } },
                    fill: { fgColor: { rgb: "007AFF" } },
                    alignment: { horizontal: "center" }
                };
            }

            // Ajustar el ancho de las columnas
            const columnWidths = [
                { wch: 20 }, // Nombre
                { wch: 20 }, // Fecha
                { wch: 18 }, // Hora de Llegada
                { wch: 18 }, // Hora de Salida
                { wch: 12 }  // Estado
            ];
            ws['!cols'] = columnWidths;

            // Añadir la hoja al libro
            XLSX.utils.book_append_sheet(wb, ws, 'Asistencias');

            // Guardar el archivo Excel
            XLSX.writeFile(wb, 'reporte_asistencias.xlsx');
        }
    };
}

// Mostrar la vista del menú principal al cargar la página
window.onload = function () {
    mostrarVista('vista-menu-principal');
};
