# MANUAL DE USUARIO Y GUÍA TÉCNICA
## Sistema de Gestión Multiplataforma (PWA / Híbrida)

**Módulo Profesional:** Desarrollo de Interfaces (Código: 0488)  
**Ciclo Formativo:** Grado Superior en Desarrollo de Aplicaciones Multiplataforma (DAM)  
**Arquitectura:** Ionic 9 + Angular (Standalone Components, OnPush, RxJS, Chart.js, Supabase)  

---

## 1. INTRODUCCIÓN Y OBJETIVOS

El **Sistema de Gestión Multiplataforma** es una solución empresarial moderna diseñada para ofrecer una experiencia fluida tanto en dispositivos móviles como en navegadores de escritorio. Proporciona:

- **Seguridad y Control de Acceso basado en Roles (RBAC):** Diferenciación estricta entre *Administrador* y *Usuario Estándar*.
- **Integración con Supabase en la Nube:** Conexión con PostgreSQL en la nube y soporte para imágenes y fotografías de perfil de empleados.
- **Cuadro de Mando Analítico:** Representación visual de indicadores y métricas departamentales mediante Chart.js utilizando gráficos de **línea curvada de área** y **doughnut** (sin gráficos de barras).
- **Consumo Asíncrono Concurrente:** Orquestación dual de fuentes de datos (Supabase/SQL relacional y NoSQL en tiempo real) mediante `RxJS forkJoin` con spinners de carga no bloqueantes.
- **Exportación de Informes Oficiales:** Generación de archivos tabulados en formatos estándar **PDF** (estilizado con `jspdf` y `jspdf-autotable`) y **CSV** (con codificación UTF-8 BOM).
- **Cumplimiento Estricto de Accesibilidad (WCAG 2.1 AA):** Marcado semántico WAI-ARIA, navegación integral por teclado con tabulación lógica y contraste de color optimizado para superar el 90/100 en Google Lighthouse.

---

## 2. GUÍA RÁPIDA: CÓMO CREAR Y ENLAZAR LA BASE DE DATOS EN SUPABASE

### Paso 2.1: Crear el proyecto en Supabase
1. Accede a [https://supabase.com/](https://supabase.com/) e inicia sesión (o crea una cuenta gratuita con GitHub).
2. Haz clic en **"New project"**, asígnale un nombre (ej. `gestion-app`), una contraseña de base de datos y selecciona tu región (ej. *Frankfurt* o *London*).
3. Espera 1 minuto a que se complete el aprovisionamiento.

### Paso 2.2: Crear la tabla e insertar datos de prueba con imágenes
1. En el panel izquierdo de Supabase, entra en **SQL Editor**.
2. Pulsa en **"New query"**.
3. Copia y pega el contenido del archivo [`supabase_setup.sql`](supabase_setup.sql) incluido en la raíz de este proyecto.
4. Pulsa en **"Run"** (o presiona `Ctrl + Enter`).
5. Se creará automáticamente la tabla `usuarios`, se configurarán las políticas RLS y se insertarán 8 usuarios de prueba con fotografías de perfil reales (`avatar_url`).

### Paso 2.3: Enlazar las credenciales con la aplicación
1. En Supabase, ve a **Project Settings** (icono de engranaje) -> **API**.
2. Copia:
   - **Project URL** (ejemplo: `https://abcdefghijkl.supabase.co`).
   - **Project API Keys** -> clave `anon` / `public`.
3. Abre el archivo [`src/environments/environment.ts`](src/environments/environment.ts) en este proyecto y sustituye las claves:
   ```typescript
   export const environment = {
     production: false,
     supabase: {
       url: 'https://TU-PROYECTO.supabase.co',
       anonKey: 'TU-CLAVE-ANONIMA-PUBLICA'
     }
   };
   ```
4. ¡Listo! La aplicación detectará automáticamente las credenciales reales de Supabase y consumirá los registros e imágenes directamente de la base de datos en la nube. Si no se configuran, la aplicación dispone de un fallback transparente que emula la API con imágenes sintéticas idénticas.

---

## 3. CREDENCIALES DE ACCESO PARA EVALUACIÓN

Para agilizar la comprobación y evaluación práctica del sistema, se han configurado cuentas de prueba que permiten evaluar ambos roles de acceso:

| Rol | Correo Electrónico | Contraseña | Capacidades y Permisos |
| :--- | :--- | :--- | :--- |
| **Administrador** | `admin@empresa.com` | `admin123` | Control total, cuadro de mando, cambio de estados, **exportación en PDF y CSV**. |
| **Usuario Estándar** | `usuario@empresa.com` | `user123` | Consulta de cuadro de mando y tabla. Las funciones de exportación oficial están restringidas. |

> **Nota para el evaluador:** En la pantalla de Login existen dos botones de acceso rápido (*"Rol Administrador"* y *"Rol Usuario Estándar"*) que rellenan automáticamente las credenciales validadas.

---

## 4. GUÍA PASO A PASO DE FUNCIONAMIENTO

### 4.1. Pantalla de Acceso (`/login`)

1. **Destrucción de Sesión Previa:** Cada vez que la pantalla de login se muestra (`ionViewWillEnter`), se purga cualquier credencial previa almacenada en `localStorage` y en el estado reactivo del `AuthService`, garantizando que no existan accesos residuales.
2. **Validación Reactiva Síncrona:**
   - **Correo Electrónico:** Requerido y formato estándar (`usuario@dominio.ext`).
   - **Contraseña:** Requerida y mínimo 6 caracteres.
3. **Validación Asíncrona en Tiempo Real:**
   - Al introducir el correo, tras un debounce de 400ms, un validador asíncrono consulta contra Supabase / base de datos si el usuario existe.
   - Durante la comprobación, se muestra un indicador `<ion-spinner>` y el texto accesible *"Consultando existencia en base de datos..."*.
   - Si el correo no existe en el sistema, se notifica con un mensaje de error accesible y el botón de acceso permanece bloqueado.
4. **Inicio de Sesión:** Tras validar credenciales contra el servicio, se genera un token de sesión simulado, se establece el rol y se navega hacia el `/dashboard`.

---

### 4.2. Cuadro de Mando Empresarial (`/dashboard`)

La ruta del Dashboard se encuentra estrictamente protegida por `AuthGuard`, el cual verifica la sesión activa en el `AuthService`.

1. **Carga Concurrente Asíncrona (Dual Source):**
   - El sistema invoca `dataService.getDashboardConsolidatedData()`, ejecutando en paralelo (`forkJoin`) la consulta a la base de datos relacional (Supabase/SQL) y al servicio en tiempo real (NoSQL).
   - Durante la carga, se visualiza un spinner de sincronización accesible.
2. **Tarjetas de KPIs Consolidados:**
   - *Total Usuarios*: Cuantificación global de registros.
   - *Usuarios Activos*: Conteo en tiempo real de registros operativos.
   - *Departamentos*: Número de áreas o divisiones empresariales.
   - *Tasa de Actividad*: Porcentaje dinámico de actividad sobre el total.
3. **Widgets Estadísticos (Chart.js - Sin Gráficos de Barras):**
   - **Gráfico de Línea Curvada de Área:** Representa la evolución y dotación de personal por departamento con curva estética (`tension: 0.35`) y relleno degradado accesible.
   - **Gráfico Doughnut (Anillo):** Exhibe la proporción de roles entre Administradores y Usuarios Estándar.
   - *Gestión de memoria:* Ambos widgets liberan sus recursos en el hook `ngOnDestroy` para evitar memory leaks.
4. **Visualización de Fotografías / Imágenes de Perfil:**
   - La tabla incluye la columna **Foto** con la miniatura circular del avatar del usuario (`avatar_url`), compatible con imágenes de Supabase Storage o URLs CDN con texto alternativo accesible y fallback de iniciales.
5. **Filtrado Reactivo en Tiempo Real:**
   - La barra de búsqueda filtra dinámicamente por nombre, email o rol conforme el usuario escribe.
   - El desplegable de departamentos permite aislar divisiones específicas.
   - La tabla de datos y los gráficos estadísticos se recalculan simultáneamente al aplicar filtros.
6. **Gestión de Registros en la Tabla:**
   - Al pulsar el botón con icono de ojo en cualquier fila, se despliega una ficha con la fotografía en alta resolución del usuario y sus datos.
   - Desde este diálogo se puede conmutar el estado del usuario entre *"Activo"* e *"Inactivo"*, actualizándose en Supabase y refrescándose los KPIs.

---

### 4.3. Exportación de Informes Tabulados (PDF y CSV)

1. **Restricción de Acceso:** Los botones de exportación solo están habilitados para usuarios con rol **Administrador**.
2. **Exportar a PDF:**
   - Construido con la librería `jspdf` y `jspdf-autotable`.
   - Incorpora cabecera corporativa con fondo azul accesible, títulos jerárquicos, metadatos de auditoría (fecha, hora, usuario emisor) y pie de página con paginación dinámica (*"Página X de Y"*).
   - Respeta los filtros aplicados en pantalla (exporta exactamente los registros visibles en la tabla).
3. **Exportar a CSV:**
   - Formato delimitado por punto y coma conforme al estándar internacional **RFC 4180**.
   - Integra el identificador **UTF-8 BOM (`\uFEFF`)** al inicio del fichero para garantizar que caracteres especiales como acentos y eñes se abran con perfecta legibilidad en Microsoft Excel y LibreOffice Calc.

---

## 5. USABILIDAD, ACCESIBILIDAD Y AUDITORÍA LIGHTHOUSE (WCAG 2.1 AA)

- **Tabulación Lógica (`tabindex`):** Todos los elementos interactivos pueden enfocarse ordenadamente con `Tab`.
- **Anillo de Foco Accesible:** Configurado en `global.scss` un outline de alto contraste `:focus-visible`.
- **WAI-ARIA:** Atributos `role="main"`, `role="region"`, `role="table"`, `role="columnheader"`, `role="cell"`, `role="alert"` y `aria-live="polite"`.
- **Canvas Accesible:** Elementos `<canvas>` con `role="img"`, `aria-label` detallado y fallback semántico con la clase `.sr-only`.

---

## 6. DOCUMENTACIÓN TÉCNICA CON COMPODOC

```bash
# Generar documentación estática en dist/docs
npm run docs:build

# Servir documentación con servidor HTTP local
npm run docs:serve
```

---
*Documento actualizado conforme a las directrices docentes y Resultados de Aprendizaje oficiales.*
