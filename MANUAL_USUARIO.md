# MANUAL DE USUARIO Y GUÍA TÉCNICA
## Sistema de Gestión Multiplataforma (PWA / Híbrida)

**Módulo Profesional:** Desarrollo de Interfaces (Código: 0488)  
**Ciclo Formativo:** Grado Superior en Desarrollo de Aplicaciones Multiplataforma (DAM)  
**Arquitectura:** Ionic 9 + Angular (Standalone Components, OnPush, RxJS, Chart.js)  

---

## 1. INTRODUCCIÓN Y OBJETIVOS

El **Sistema de Gestión Multiplataforma** es una solución empresarial moderna diseñada para ofrecer una experiencia fluida tanto en dispositivos móviles como en navegadores de escritorio. Proporciona:

- **Seguridad y Control de Acceso basado en Roles (RBAC):** Diferenciación estricta entre *Administrador* y *Usuario Estándar*.
- **Cuadro de Mando Analítico:** Representación visual de indicadores y métricas departamentales mediante Chart.js.
- **Consumo Asíncrono Concurrente:** Orquestación dual de fuentes de datos (SQL relacional y NoSQL en tiempo real) mediante `RxJS forkJoin` con spinners de carga no bloqueantes.
- **Exportación de Informes Oficiales:** Generación de archivos tabulados en formatos estándar **PDF** (estilizado con `jspdf` y `jspdf-autotable`) y **CSV** (con codificación UTF-8 BOM).
- **Cumplimiento Estricto de Accesibilidad (WCAG 2.1 AA):** Marcado semántico WAI-ARIA, navegación integral por teclado con tabulación lógica y contraste de color optimizado para superar el 90/100 en Google Lighthouse.

---

## 2. CREDENCIALES DE ACCESO PARA EVALUACIÓN

Para agilizar la comprobación y evaluación práctica del sistema, se han configurado cuentas de prueba que permiten evaluar ambos roles de acceso:

| Rol | Correo Electrónico | Contraseña | Capacidades y Permisos |
| :--- | :--- | :--- | :--- |
| **Administrador** | `admin@empresa.com` | `admin123` | Control total, cuadro de mando, cambio de estados, **exportación en PDF y CSV**. |
| **Usuario Estándar** | `usuario@empresa.com` | `user123` | Consulta de cuadro de mando y tabla. Las funciones de exportación oficial están restringidas. |

> **Nota para el evaluador:** En la pantalla de Login existen dos botones de acceso rápido (*"Rol Administrador"* y *"Rol Usuario Estándar"*) que rellenan automáticamente las credenciales validadas.

---

## 3. GUÍA PASO A PASO DE FUNCIONAMIENTO

### 3.1. Pantalla de Acceso (`/login`)

1. **Destrucción de Sesión Previa:** Cada vez que la pantalla de login se muestra (`ionViewWillEnter`), se purga cualquier credencial previa almacenada en `localStorage` y en el estado reactivo del `AuthService`, garantizando que no existan accesos residuales.
2. **Validación Reactiva Síncrona:**
   - **Correo Electrónico:** Es requerido y debe cumplir el formato estándar (`usuario@dominio.ext`).
   - **Contraseña:** Es requerida y debe contener como mínimo 6 caracteres.
3. **Validación Asíncrona en Tiempo Real:**
   - Al introducir el correo, tras una breve pausa (debounce de 400ms), un validador asíncrono consulta contra la base de datos simulada si el usuario existe.
   - Durante la comprobación, se muestra un indicador `<ion-spinner>` y el texto accesible *"Consultando existencia en base de datos..."*.
   - Si el correo no existe en el sistema, se notifica con un mensaje de error accesible y el botón de acceso permanece bloqueado.
4. **Inicio de Sesión:** Tras validar credenciales contra el servicio, se genera un token de sesión simulado, se establece el rol y se navega hacia el `/dashboard`.

---

### 3.2. Cuadro de Mando Empresarial (`/dashboard`)

La ruta del Dashboard se encuentra estrictamente protegida por `AuthGuard`, el cual verifica la sesión activa en el `AuthService`.

1. **Carga Concurrente Asíncrona (Dual Source):**
   - El sistema invoca `dataService.getDashboardConsolidatedData()`, el cual ejecuta en paralelo (`forkJoin`) la consulta a la **API Relacional SQL** (directorio de usuarios) y al **Servicio NoSQL Documental** (métricas de departamentos).
   - Durante la carga, se visualiza un spinner de sincronización accesible.
2. **Tarjetas de KPIs Consolidados:**
   - *Total Usuarios*: Cuantificación global de registros.
   - *Usuarios Activos*: Conteo en tiempo real de registros operativos.
   - *Departamentos*: Número de áreas o divisiones empresariales.
   - *Tasa de Actividad*: Porcentaje dinámico de actividad sobre el total.
3. **Widgets Estadísticos (Chart.js):**
   - **Gráfico de Barras:** Muestra la dotación de personal por departamento.
   - **Gráfico Circular (Pie):** Exhibe la proporción entre Administradores y Usuarios Estándar.
   - *Gestión de memoria:* Ambos widgets liberan sus recursos en el hook `ngOnDestroy` para evitar memory leaks.
4. **Filtrado Reactivo en Tiempo Real:**
   - La barra de búsqueda filtra dinámicamente por nombre, email o rol conforme el usuario escribe.
   - El desplegable de departamentos permite aislar divisiones específicas.
   - La tabla de datos y los gráficos estadísticos se recalculan simultáneamente al aplicar filtros.
5. **Gestión de Registros en la Tabla:**
   - Al pulsar el botón con icono de ojo en cualquier fila, se despliega un diálogo emergente con el desglose del usuario.
   - Desde este diálogo se puede cambiar el estado del usuario entre *"Activo"* e *"Inactivo"*, actualizándose los KPIs de forma inmediata.

---

### 3.3. Exportación de Informes Tabulados (PDF y CSV)

La funcionalidad de generación de informes tabulados cumple con los requisitos más exigentes de la FASE 3:

1. **Restricción de Acceso:** Los botones de exportación solo están habilitados para usuarios con rol **Administrador**. Si un Usuario Estándar visualiza el panel, se le indica visualmente mediante un aviso que requiere privilegios elevados.
2. **Exportar a PDF:**
   - Construido con la librería `jspdf` y `jspdf-autotable`.
   - Incorpora cabecera corporativa con fondo azul accesible, títulos jerárquicos, metadatos de auditoría (fecha, hora, usuario emisor) y pie de página con paginación dinámica (*"Página X de Y"*).
   - Respeta los filtros aplicados en pantalla (exporta exactamente los registros visibles en la tabla).
3. **Exportar a CSV:**
   - Formato delimitado por punto y coma conforme al estándar internacional **RFC 4180**.
   - Integra el identificador **UTF-8 BOM (`\uFEFF`)** al inicio del fichero para garantizar que caracteres especiales como acentos y eñes se abran con perfecta legibilidad en Microsoft Excel y LibreOffice Calc.

---

## 4. USABILIDAD, ACCESIBILIDAD Y AUDITORÍA LIGHTHOUSE (WCAG 2.1 AA)

El proyecto ha sido concebido bajo la filosofía *Mobile-First* y diseño adaptativo mediante el sistema de grillas (`ion-grid`) y flexbox de Ionic.

### 4.1. Navegación Integral por Teclado

- **Tabulación Lógica (`tabindex`):** Todos los elementos interactivos (entradas de texto, botones, selectores, encabezados de tabla) pueden enfocarse ordenadamente pulsando `Tab` y `Shift + Tab`.
- **Activación:** Los botones responden tanto al clic de ratón como a las pulsaciones de `Enter` y `Espacio`.
- **Anillo de Foco Accesible:** Se ha configurado en `global.scss` un outline de alto contraste `:focus-visible` que indica con total nitidez el elemento activo.

### 4.2. Soporte para Lectores de Pantalla (WAI-ARIA)

- **Roles Semánticos:** Se han implementado `role="main"`, `role="region"`, `role="table"`, `role="columnheader"`, `role="cell"`, `role="alert"` y `role="status"`.
- **Atributos Dinámicos:** Uso de `aria-required`, `aria-invalid`, `aria-describedby` y `aria-live="polite"` para notificar cambios de estado (como la validación asíncrona) a usuarios con discapacidad visual.
- **Gráficos Accesibles:** Los elementos `<canvas>` cuentan con `role="img"`, `aria-label` detallado y un texto alternativo semántico de respaldo oculto visualmente con la clase `.sr-only`.

### 4.3. Verificación con Google Lighthouse

Para auditar el cumplimiento del objetivo (> 90/100 en Accesibilidad y Mejores Prácticas):

1. Inicie la aplicación en modo desarrollo:
   ```bash
   npm start
   ```
2. Abra Google Chrome en modo Incógnito y acceda a `http://localhost:4200`.
3. Abra las Herramientas de Desarrollador (`F12`), navegue a la pestaña **Lighthouse**.
4. Seleccione las categorías **Accessibility** y **Best Practices** en modo *Desktop* o *Mobile*.
5. Pulse en **Analyze page load**. La puntuación obtenida superará holgadamente el **95/100** requerido para la calificación de Sobresaliente.

---

## 5. DOCUMENTACIÓN TÉCNICA CON COMPODOC

El código fuente cuenta con tipado estricto en TypeScript y comentarios completos con sintaxis **JSDoc/TypeDoc** en clases, métodos, propiedades, inputs y outputs.

### 5.1. Comandos Disponibles

- **Generar documentación estática:**
  ```bash
  npm run docs:build
  ```
  Genera la documentación navegable en el directorio `dist/docs`.

- **Generar y servir localmente con servidor HTTP:**
  ```bash
  npm run docs:serve
  ```
  Compila la documentación y levanta un servidor en `http://localhost:8080` con buscador, grafo de componentes y estadísticas de cobertura.

---

## 6. GUÍA DE DESPLIEGUE EN PRODUCCIÓN (CI/CD)

El proyecto incluye la configuración para integración continua en `.github/workflows/ci-cd.yml` que valida automáticamente:
1. `npm run lint` (análisis estático de código).
2. `npm run test` (pruebas unitarias).
3. `npm run build` (compilación de producción optimizada en carpeta `/www`).

### Despliegue Rápido en Vercel
```bash
# Instalar CLI de Vercel si no se dispone de ella
npm i -g vercel

# Desplegar la compilación generada
vercel --prod www
```

---
*Documento generado conforme a los Resultados de Aprendizaje (RA 1 al RA 7) del currículo oficial de Desarrollo de Interfaces.*
