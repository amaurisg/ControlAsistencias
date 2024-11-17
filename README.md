Control de Asistencias
Bienvenido a la Aplicación de Control de Asistencias, una aplicación web progresiva (PWA) diseñada para gestionar y controlar las asistencias del personal de tu centro educativo o empresa de manera eficiente y moderna.

Esta aplicación permite:

  *Registrar asistencias diarias del personal.
  *Visualizar el total de asistencias registradas.
  *Generar reportes en formatos PDF y Excel.
  *Funcionar sin conexión a Internet gracias al uso de tecnologías como IndexedDB y Service Workers.
  *Instalarse en dispositivos móviles y computadoras como una aplicación nativa.

Tabla de Contenidos
  *Características Principales
  *Tecnologías Utilizadas
  *Requisitos Previos
  *Instalación y Configuración
  *Estructura del Proyecto
  *Uso de la Aplicación
    1. Registrar Asistencia Diaria
    2. Ver Total de Asistencias
    3. Generar Reportes
  *Instalación como Aplicación Móvil (PWA)
  *Personalización
  *Contribuciones
  *Licencia
  *Contacto
  
Características Principales
Interfaz Amigable y Moderna: Diseño inspirado en iOS, con botones y elementos visuales intuitivos.
Funcionalidad Sin Conexión: Gracias a los Service Workers y IndexedDB, la aplicación funciona offline.
Registro y Gestión de Asistencias: Fácil registro de asistencias con detalles como fecha, hora y estado.
Generación de Reportes: Exportación de datos a PDF y Excel con diseños profesionales.
Instalable como PWA: Puede instalarse en dispositivos móviles y de escritorio para un acceso rápido.
Tecnologías Utilizadas
HTML5 y CSS3: Estructura y estilos de la aplicación.
JavaScript: Lógica de la aplicación y manejo de eventos.
IndexedDB: Almacenamiento local de datos.
Service Workers: Funcionalidad offline y cacheo de recursos.
Manifest Web App: Configuración para instalar como PWA.
Bibliotecas Externas:
Font Awesome: Íconos.
jQuery: Simplificación de manipulación del DOM.
jQuery Timepicker: Selector de hora en formato de 12 horas con AM/PM.
jsPDF: Generación de PDFs.
jsPDF-AutoTable: Tablas en PDFs.
SheetJS: Generación de archivos Excel.
Requisitos Previos
Servidor Web Local: Para ejecutar la aplicación correctamente, es recomendable usar un servidor web local como Live Server en Visual Studio Code.
Conexión a Internet: Necesaria para cargar las bibliotecas externas desde los CDNs. Después de la primera carga, la aplicación funcionará sin conexión.
Instalación y Configuración
Clonar o Descargar el Repositorio:

bash
Copiar código
git clone https://github.com/tu_usuario/ControlAsistencias.git
Ubicarte en el Directorio del Proyecto:

bash
Copiar código
cd ControlAsistencias
Iniciar el Servidor Web Local:

Si usas Visual Studio Code, abre la carpeta del proyecto y ejecuta "Live Server".
O utiliza otro servidor web local como XAMPP o WAMP.
Abrir la Aplicación en el Navegador:

Accede a http://localhost:5500/ o la dirección que corresponda a tu servidor local.
Estructura del Proyecto
bash
Copiar código
/ControlAsistencias
│
├── index.html                # Página principal de la aplicación
├── manifest.json             # Archivo de configuración PWA
├── service-worker.js         # Service Worker para funcionalidad offline
│
├── /css
│   └── styles.css            # Estilos de la aplicación
│
├── /js
│   ├── app.js                # Lógica principal de la aplicación
│   ├── db.js                 # Configuración de IndexedDB
│   └── helpers.js            # Funciones auxiliares
│
├── /images
│   ├── logo.jpg              # Logo de la aplicación
│   └── fondo.jpg             # Imagen de fondo
│
└── /fonts
    └── Nunito-Regular.ttf    # Fuente personalizada (opcional)
Uso de la Aplicación
1. Registrar Asistencia Diaria
Navega a la sección "Registrar Asistencia" desde el menú principal.
Completa el formulario con:
Nombre del Personal: Selecciona un nombre de la lista.
Fecha: Selecciona la fecha de la asistencia.
Hora de Llegada y Hora de Salida: Ingresa las horas en formato de 12 horas con AM/PM.
Estado: Selecciona el estado de asistencia (Presente, Ausente, Excusa).
Haz clic en "Guardar" para registrar la asistencia.
2. Ver Total de Asistencias
Navega a "Ver Asistencias" desde el menú principal.
Visualiza la tabla con todas las asistencias registradas.
Las asistencias muestran:
Nombre, Fecha, Hora de Llegada, Hora de Salida y Estado.
Los estados se destacan con colores e íconos para facilitar su identificación.
3. Generar Reportes
Navega a "Generar Reportes" desde el menú principal.
Selecciona el formato de reporte que deseas generar:
Exportar a PDF: Genera un documento PDF con las asistencias.
Exportar a Excel: Genera un archivo Excel con las asistencias.
Los reportes incluyen tablas con diseños profesionales y estéticos.
Instalación como Aplicación Móvil (PWA)
En Dispositivos Móviles:

Abre la aplicación en el navegador web del dispositivo.
Aparecerá una opción o mensaje para "Añadir a la pantalla de inicio".
Sigue las instrucciones para instalar la aplicación.
En Computadoras de Escritorio:

Abre la aplicación en Google Chrome o Microsoft Edge.
Haz clic en el ícono de instalación en la barra de direcciones (un signo "+" o una computadora con una flecha).
Confirma la instalación.
Personalización
Nombres del Personal:

Edita el archivo js/helpers.js y actualiza la lista de nombres en la función cargarNombresPersonal().

javascript
Copiar código
const nombres = [
    'Nombre 1',
    'Nombre 2',
    // Agrega más nombres según sea necesario
];
Imágenes:

Reemplaza logo.jpg y fondo.jpg en la carpeta /images con tus propias imágenes.
Asegúrate de que las rutas en el código sean correctas.
Colores y Estilos:

Edita el archivo css/styles.css para personalizar colores, fuentes y otros estilos según tus preferencias.
Contribuciones
¡Las contribuciones son bienvenidas! Si deseas mejorar esta aplicación:

Realiza un fork del repositorio.

Crea una rama para tu característica o corrección de errores:

bash
Copiar código
git checkout -b feature/nueva-caracteristica
Realiza tus cambios y haz commit:

bash
Copiar código
git commit -m "Agrega nueva característica"
Envía tus cambios al repositorio remoto:

bash
Copiar código
git push origin feature/nueva-caracteristica
Abre un Pull Request en GitHub.

Licencia
Este proyecto está bajo la Licencia MIT. Puedes ver el archivo LICENSE para más detalles.

Contacto
Si tienes preguntas, sugerencias o necesitas ayuda, puedes contactarme a través de:

Correo electrónico: tu-email@example.com
GitHub: tu_usuario
