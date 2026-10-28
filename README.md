# Sistema de Gestión Multiplataforma (PWA/Híbrida)

[![CI/CD Pipeline](https://github.com/tu-usuario/gestion-app/actions/workflows/ci-cd.yml/badge.svg)](.github/workflows/ci-cd.yml)

Proyecto individual de evaluación práctica para el módulo **Desarrollo de Interfaces (Código: 0488)** del Ciclo Formativo de Grado Superior en **Desarrollo de Aplicaciones Multiplataforma (DAM)**.

---

## 🚀 Tecnologías Principales

- **Framework:** [Ionic Framework 9](https://ionicframework.com/)
- **Librería Base:** [Angular 22](https://angular.dev/) con arquitectura **Standalone Components**
- **Estrategia de Renderizado:** `ChangeDetectionStrategy.OnPush` en componentes clave
- **Orquestación Asíncrona:** RxJS (`forkJoin`, `timer`, `delay`, `switchMap`)
- **Métricas Visuales:** [Chart.js 4](https://www.chartjs.org/)
- **Generación de Informes:** `jspdf` y `jspdf-autotable` para PDF; CSV con codificación UTF-8 BOM
- **Documentación Técnica:** [Compodoc](https://compodoc.app/)
- **Estándar de Accesibilidad:** WAI-ARIA y WCAG 2.1 AA (Lighthouse > 95/100)

---

## 🔑 Credenciales de Acceso para Evaluación

| Rol | Correo Electrónico | Contraseña | Capacidades |
| :--- | :--- | :--- | :--- |
| **Administrador** | `admin@empresa.com` | `admin123` | Control total, cuadro de mando, gestión de estado y **exportación PDF/CSV**. |
| **Usuario Estándar** | `usuario@empresa.com` | `user123` | Visualización de cuadro de mando y registros (exportación oficial deshabilitada). |

> En la vista de login se han integrado botones de prueba que autocompletan las credenciales con un solo clic.

---

## 📦 Instalación y Puesta en Marcha

1. **Clonar el repositorio:**
   ```bash
   git clone <URL_DEL_REPOSITORIO>
   cd gestion-app
   ```

2. **Instalar dependencias:**
   ```bash
   npm install
   ```

3. **Ejecutar servidor de desarrollo:**
   ```bash
   npm start
   ```
   Acceder en el navegador a `http://localhost:4200`.

4. **Compilar para producción:**
   ```bash
   npm run build
   ```
   Los artefactos optimizados se generarán en la carpeta `www/`.

---

## 📚 Documentación Técnica (Compodoc)

Para generar e inspeccionar la documentación del código fuente generada con JSDoc/TypeDoc:

```bash
# Compilar documentación
npm run docs:build

# Servir documentación localmente
npm run docs:serve
```

---

## 📖 Manual de Usuario

El manual de usuario completo, con instrucciones detalladas paso a paso, atajos de teclado y especificaciones de accesibilidad, se encuentra disponible en:
- [MANUAL_USUARIO.md](MANUAL_USUARIO.md)
- O directamente en la aplicación a través del botón **"Ayuda / Manual"** en el panel superior del Dashboard.
