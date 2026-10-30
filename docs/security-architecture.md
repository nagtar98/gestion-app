# Memoria Técnica de Arquitectura de Seguridad y Control de Acceso

**Módulo Profesional:** Desarrollo de Interfaces (Código 0488)  
**Ciclo Formativo:** Grado Superior en Desarrollo de Aplicaciones Multiplataforma (DAM 2)  
**Proyecto:** `gestion-app` (Ionic 9 / Angular Standalone Components)  
**Autor:** Ignacio Bobes  
**Fecha:** Octubre de 2026  

---

## 1. Introducción y Contexto del Proyecto

En el desarrollo de `gestion-app`, concebida como una aplicación de gestión empresarial híbrida/PWA construida sobre **Ionic 9** y **Angular Standalone Components**, la seguridad no puede plantearse como un parche visual de última hora. Proteger los datos corporativos, garantizar que cada usuario acceda únicamente a las operaciones que le corresponden y optimizar el consumo de red en dispositivos móviles requiere una arquitectura desacoplada y robusta.

Esta memoria técnica justifica las decisiones arquitectónicas implementadas y planificadas en el proyecto en torno a tres pilares fundamentales:
1. **Control de navegación en el enrutador** mediante Guards funcionales.
2. **Intercepción y gestión centralizada del tráfico de red** a través de HTTP Interceptors funcionales.
3. **Control de Acceso Basado en Roles (RBAC)** con sincronización reactiva hacia la interfaz de usuario.

```
+-----------------------------------------------------------------------------------+
|                                 NAVEGADOR / CLIENTE                               |
|                                                                                   |
|  [ URL: /dashboard ] ---> [ canMatch Guard ] ---> [ ¿Tiene Sesión Activa? ]       |
|                                     |                         |                   |
|                              NO (Bloquea descarga)      SÍ (Descarga Chunk JS)    |
|                                     v                         v                   |
|                            Redirect -> /login          [ canActivate Guard ]      |
|                                                               |                   |
|                                                               v                   |
|                                                    [ DashboardComponent ]         |
|                                                               |                   |
|                                                +--------------+---------------+   |
|                                                |                              |   |
|                                         (UI Condicional)             (Peticiones HTTP)
|                                         @if (isAdmin)                         |   |
|                                                v                              v   |
|                                      Botones de Exportación        [ HttpInterceptorFn ]
|                                      (PDF / CSV / Estados)                    |   |
|                                                                               v   |
|                                                                     Inyecta Bearer Token  
|                                                                     Captura 401 / 403     
+-------------------------------------------------------------------------------|---+
                                                                                v
                                                                   [ Supabase / Backend API ]
```

---

## Apartado A: Fundamentación Teórico-Técnica

### 1. Functional Guards en Angular / Ionic Standalone

#### Definición y ciclo de vida en el enrutamiento
Con la evolución de Angular hacia una arquitectura libre de módulos (`Standalone Components`), las interfaces clásicas basadas en clases con decorador `@Injectable()` y contratos tipo `implements CanActivate` han quedado obsoletas en favor de los **Functional Guards** (`CanActivateFn`, `CanMatchFn`, `CanDeactivateFn`).

Un Guard funcional es una función pura que se ejecuta durante una fase concreta de la resolución de rutas. Al ejecutarse dentro del contexto de inyección del framework, puede invocar dependencias directamente mediante la función `inject()` (como `Router`, `AuthService` o servicios de notificación) sin necesidad de constructores con boilerplate.

El ciclo de vida en el enrutamiento sigue una secuencia estricta:

```
[ Solicitud de Ruta ]
        |
        v
1. Evaluación de 'canMatch'  ---> ¿Coincide la ruta y cumple las condiciones?
        |                         (Si devuelve false, el Router descarta esta rama
        |                          y busca la siguiente coincidencia sin descargar JS).
        v
2. Descarga del Chunk JS     ---> Se resuelve la importación dinámica:
        |                         loadComponent: () => import(...)
        v
3. Evaluación de 'canActivate' -> ¿Tiene el usuario permiso para acceder a la vista?
        |                         (Si devuelve false o UrlTree, se aborta la activación
        |                          o se redirige a otra ruta).
        v
4. Activación de Componente   ---> Inicialización del ciclo de vida (ngOnInit, ionViewWillEnter).
        |
        x (Al intentar salir)
        v
5. Evaluación de 'canDeactivate' -> ¿Puede el usuario abandonar la pantalla actual?
                                    (Útil para confirmar cambios sin guardar en formularios).
```

* **`canMatch` (`CanMatchFn`):** Se evalúa en la fase más temprana, durante el emparejamiento (*matching*) de la URL. Si retorna `false`, el enrutador se comporta como si la definición de esa ruta no existiera, permitiendo evaluar rutas alternativas o directamente no cargar el módulo.
* **`canActivate` (`CanActivateFn`):** Se evalúa una vez que la ruta ha hecho match y su módulo/componente se ha cargado. Decide si el componente ya descargado puede inicializarse en pantalla. Retorna `true`, `false` o un `UrlTree` hacia el que redirigir.
* **`canDeactivate` (`CanDeactivateFn`):** Se ejecuta cuando el usuario intenta navegar hacia una URL distinta desde la vista actual. Permite inspeccionar el estado del componente (por ejemplo, si un formulario reactivo tiene `$dirty === true`) para prevenir pérdidas involuntarias de datos mediante un diálogo de confirmación.

#### Diferencia en rendimiento y carga perezosa (*Lazy Loading*): `canActivate` frente a `canMatch`
Esta distinción es crítica a nivel de optimización de red y seguridad:

* **Comportamiento con `canActivate`:**  
  Cuando una ruta configurada con carga perezosa (`loadComponent: () => import('./dashboard/dashboard.page')`) está protegida únicamente con `canActivate`, el enrutador de Angular **primero descarga por red el archivo JavaScript compilado (chunk)** del componente. Una vez que el código fuente ya ha viajado al navegador del cliente, el guard ejecuta su lógica. Si el guard retorna `false` o redirige a `/login`, el usuario no llegará a ver la pantalla, pero el bundle JS ya está en la memoria del navegador. Esto provoca:
  1. Consumo innecesario de datos móviles y ancho de banda en descargas que nunca se van a mostrar.
  2. Un riesgo de fuga de información (*information disclosure*), ya que un usuario con conocimientos técnicos puede inspeccionar en la pestaña *Network* de las DevTools el código fuente, endpoints internos o interfaces que contenía dicho bundle.

* **Comportamiento con `canMatch`:**  
  Con `canMatch`, la comprobación se ejecuta **antes de disparar la importación dinámica**. Si la función retorna `false`, la petición HTTP para descargar el chunk JavaScript de esa página **nunca llega a emitirse**.
  Además, `canMatch` habilita el patrón de **rutas polimórficas**: podemos definir dos rutas con el mismo path exacto (`path: 'dashboard'`), de forma que si el usuario tiene rol de Administrador se descargue y muestre el chunk de `AdminDashboardPage`, y si tiene rol estándar se descargue el chunk de `UserDashboardPage`, todo de forma transparente y sin sobrecargar el cliente con código que no le corresponde.

---

### 2. HTTP Interceptors (`HttpInterceptorFn`)

#### Mecanismo de pipeline en la inyección de peticiones HTTP
En Angular moderno, el patrón clásico basado en clases con `HTTP_INTERCEPTORS` ha sido reemplazado por la función interceptora funcional `HttpInterceptorFn`. Este mecanismo implementa el patrón de diseño **Chain of Responsibility** (Middleware):

```
[ Petición Saliente (HttpRequest) ]
              |
              v
     +-----------------+
     | authInterceptor | ---> Clona la petición e inyecta 'Authorization: Bearer <token>'
     +-----------------+
              |
              v (next)
     +-----------------+
     | Backend / Red   |
     +-----------------+
              |
              v (Respuesta Observable<HttpEvent>)
     +-----------------+
     | authInterceptor | ---> pipe(catchError(...)): Detecta errores 401/403
     +-----------------+
              |
              v
[ Componente / Servicio Consumidor ]
```

Una petición HTTP en Angular (`HttpRequest`) es un objeto estrictamente inmutable para garantizar la predictibilidad del flujo. Cada interceptor recibe la petición y una función `next: HttpHandlerFn`. El interceptor puede clonar y mutar la petición (`req.clone({ ... })`), pasar el control al siguiente eslabón con `next(clonedReq)` y procesar la respuesta asíncrona de vuelta aplicando operadores de **RxJS** en el flujo `Observable`.

#### Propagación de cabeceras de autorización (`Authorization: Bearer <token>`)
Sin un interceptor, cada llamada a la API o a Supabase en `DataService` tendría que construir manualmente las cabeceras con `HttpHeaders`. El interceptor centraliza esta responsabilidad: extrae el token de sesión activo desde `AuthService` y, si existe y la petición va dirigida a nuestros servicios de datos protegidos, inyecta la cabecera estándar de forma totalmente transparente:

```typescript
const token = authService.getToken();
if (token) {
  req = req.clone({
    setHeaders: {
      Authorization: `Bearer ${token}`
    }
  });
}
```

#### Manejo centralizado de errores de sesión (HTTP 401 / HTTP 403) y estrategia de Refresh Token
Centralizar la captura de errores en el interceptor mediante el operador `catchError` evita dispersar bloques de control de excepciones por todos los componentes de la aplicación:

* **Error HTTP 401 (Unauthorized):**  
  Señaliza que la sesión ha expirado o el token de acceso ya no es válido. En una arquitectura de producción con **flujo de Refresh Token**, el interceptor actúa de la siguiente manera:
  1. Si no hay un refresco en curso, retiene las peticiones concurrentes y lanza una llamada al endpoint `/auth/refresh` enviando el refresh token (almacenado preferentemente en una cookie `HttpOnly` para evitar ataques XSS).
  2. Si el servidor responde con un nuevo access token, se actualiza el estado en `AuthService` y, mediante el operador `switchMap`, se relanzan las peticiones que habían quedado encoladas utilizando la nueva credencial.
  3. Si el refresh token también ha expirado o falla la renovación, se ejecuta `authService.logout()`, limpiando el almacenamiento local, y se redirige al usuario a `/login` preservando en los parámetros de la URL la pantalla a la que intentaba acceder (`queryParams: { returnUrl: state.url }`).

* **Error HTTP 403 (Forbidden):**  
  Indica que el usuario está correctamente autenticado, pero **carece de los privilegios necesarios** para la operación solicitada (por ejemplo, un `Usuario Estandar` intentando ejecutar una eliminación de registro o una exportación no autorizada).  
  En este escenario **no se debe cerrar la sesión** ni redirigir a `/login`. La estrategia consiste en interceptar el error, silenciarlo para que no rompa la aplicación, y emitir una alerta visual al usuario (mediante `ToastController` o un banner accesible) notificando: *"Operación denegada: no dispones de permisos de administración para esta acción"*.

---

### 3. Control de Acceso Basado en Roles (RBAC - Role-Based Access Control)

#### Definición formal del modelo RBAC y modelado frente a identidades simples
El modelo formal **RBAC** (estandarizado por NIST / ANSI INCITS 359-2004) establece que los permisos del sistema no se asignan de forma directa a los usuarios individuales (identidades simples), sino a **Roles**. Los usuarios, a su vez, son asignados a uno o más roles.

```
[ Usuario (Identity) ] ---> asignado a ---> [ ROL (ej. Administrador) ]
                                                        |
                                                        v asocia
                                           [ CONJUNTO DE PERMISOS ]
                                           - users:read
                                           - users:write_status
                                           - reports:export_pdf
                                           - reports:export_csv
```

Modelar identidades simples mediante comprobaciones directas del tipo `if (user.email === 'admin@empresa.com')` es una mala práctica que acopla el código de la interfaz a personas físicas concretas. Con RBAC, la lógica de negocio y las directivas visuales solo preguntan por privilegios o roles abstractos. Si mañana la empresa contrata a un nuevo empleado o se crea un perfil intermedio (como `Supervisor` o `Auditor`), basta con asociar los permisos existentes al nuevo rol sin modificar una sola línea de código en los componentes.

#### Diferencia técnica y funcional entre Autenticación y Autorización
Aunque suelen confundirse, representan dos barreras de seguridad completamente diferenciadas:

* **Autenticación (AuthN - *¿Quién eres?*):**  
  Es el proceso de verificación de la identidad declarada por el sujeto. Se lleva a cabo en la pantalla de inicio de sesión (`/login`), donde el usuario introduce sus credenciales (correo y contraseña). El sistema comprueba su veracidad contra la base de datos (PostgreSQL en Supabase o catálogo local simulado) y, si coinciden, expide un token de sesión firmado criptográficamente.
* **Autorización (AuthZ - *¿Qué tienes permitido hacer?*):**  
  Ocurre una vez que la identidad ya ha sido comprobada. Evalúa si el usuario autenticado tiene el derecho o privilegio para acceder a una ruta determinada (mediante Guards) o para ejecutar una acción concreta en la vista (como descargar informes PDF o modificar el estado de un registro en la tabla).

#### Encapsulamiento del payload del token dentro del servicio centralizado de estado
Un token JWT (JSON Web Token) contiene en su sección de *Payload* una serie de declaraciones (*claims*):

```json
{
  "sub": "usr_94821",
  "email": "admin@empresa.com",
  "nombre": "Administradora Gómez",
  "rol": "Administrador",
  "permisos": ["users:read", "users:write", "reports:export"],
  "iat": 1730278800,
  "exp": 1730282400
}
```

En nuestro diseño, los componentes de la interfaz de usuario **no deben manipular ni decodificar el token directamente**. Esa lógica se encapsula en `AuthService`.  
El servicio lee y decodifica las *claims* durante el inicio de sesión y mantiene el estado sincronizado de forma reactiva a través de un `BehaviorSubject<AuthUser | null>` (o Signals modernas `currentUser = signal<AuthUser | null>(...)`).  
Los componentes consumen métodos selectores limpios y declarativos como:
* `authService.currentUser$`
* `authService.isAuthenticated(): boolean`
* `authService.isAdmin(): boolean`
* `authService.hasPermission(permission: string): boolean`

Esto asegura un único punto de verdad (*Single Source of Truth*) y permite que cualquier cambio en la sesión se propague instantáneamente a toda la interfaz mediante detección de cambios reactiva.

---

## Apartado B: Justificación de Implementación en el Proyecto

### 1. Ubicación en el Árbol de Rutas y Servicios

#### Configuración de rutas en `src/app/app.routes.ts`
En `gestion-app`, la arquitectura de navegación está diseñada para separar claramente la vista pública de acceso de las vistas operativas de gestión interna.

El archivo de rutas actual define:

```typescript
import { Routes } from '@angular/router';
import { authGuard, authMatchGuard } from './core/guards/auth-guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
  },
  {
    path: 'login',
    loadComponent: () => import('./auth/login/login.page').then((m) => m.LoginPage),
  },
  {
    path: 'dashboard',
    canMatch: [authMatchGuard],      // 1. Bloquea la descarga del bundle JS si no hay sesión
    canActivate: [authGuard],        // 2. Valida permisos y gestiona redirección contextual
    loadComponent: () => import('./dashboard/dashboard.page').then((m) => m.DashboardPage),
  },
  {
    path: '**',
    redirectTo: 'login'
  }
];
```

#### Implementación funcional de los Guards (`src/app/core/guards/auth-guard.ts`)
En lugar de depender de sintaxis obsoleta con clases, implementamos los guards de forma funcional aprovechando `inject()` y asegurando la **redirección contextual**:

```typescript
import { inject } from '@angular/core';
import { CanActivateFn, CanMatchFn, Router, UrlTree } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Guard canMatch: Previene la descarga por red del chunk JavaScript
 * del dashboard si no existe una sesión válida iniciada.
 */
export const authMatchGuard: CanMatchFn = (route, segments): boolean => {
  const authService = inject(AuthService);
  return authService.isAuthenticated();
};

/**
 * Guard canActivate: Verifica la autenticación activa y, en caso negativo,
 * redirige a /login almacenando la URL solicitada para volver tras el login.
 */
export const authGuard: CanActivateFn = (route, state): boolean | UrlTree => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated()) {
    return true;
  }

  // Redirección contextual: guardamos la URL a la que intentaba acceder en queryParams
  return router.createUrlTree(['/login'], {
    queryParams: { returnUrl: state.url }
  });
};
```

Cuando un usuario no autenticado intenta acceder directamente a `http://localhost:4200/dashboard`, el guard intercepta la navegación y construye la URL de retorno: `/login?returnUrl=%2Fdashboard`. Una vez que el usuario se valida con éxito en `LoginPage`, el controlador recupera ese parámetro:

```typescript
// En login.page.ts tras autenticación exitosa:
const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/dashboard';
this.router.navigateByUrl(returnUrl);
```

#### Jerarquía de roles en la aplicación y bloqueo de componentes
El modelo de datos (`src/app/core/models/user.model.ts`) tipifica estrictamente los roles admitidos:

```typescript
export type UserRole = 'Administrador' | 'Usuario Estandar';
```

La matriz de control de acceso para cada rol en `gestion-app` se desglosa así:

| Pantalla / Componente / Operación | Usuario No Autenticado | Usuario Estándar (`Usuario Estandar`) | Administrador (`Administrador`) |
| :--- | :---: | :---: | :---: |
| **Acceso a ruta `/login`** | Permitido | Redirige a `/dashboard` si ya hay sesión | Redirige a `/dashboard` si ya hay sesión |
| **Acceso a ruta `/dashboard`** | **Bloqueado** (Redirige a login) | **Permitido** | **Permitido** |
| **Visualización de KPIs y Gráficos Chart.js** | Inaccesible | **Permitido** (Modo consulta) | **Permitido** (Modo completo) |
| **Búsqueda y filtrado de usuarios en tabla** | Inaccesible | **Permitido** | **Permitido** |
| **Exportación de informes a PDF (`jspdf`)** | Inaccesible | **Bloqueado** (Botón oculto y protegido) | **Permitido** (Generación con membrete) |
| **Exportación de informes a CSV (UTF-8 BOM)** | Inaccesible | **Bloqueado** (Botón oculto y protegido) | **Permitido** (Descarga RFC 4180) |
| **Conmutar estado Activo / Inactivo en BD** | Inaccesible | **Bloqueado** (Acción denegada en modal) | **Permitido** (Persiste en Supabase/local) |
| **Distintivo en cabecera de la aplicación** | Ninguno | Badge neutral (`light`) con `people-outline` | Badge dorado (`warning`) con `shield-checkmark-outline` |

#### Ubicación y registro del Interceptor en `src/main.ts`
En una aplicación Angular Standalone no existe `app.module.ts`. Toda la configuración raíz de proveedores se declara en la función `bootstrapApplication` dentro de `src/main.ts`.

Para registrar el interceptor funcional de forma global:

```typescript
// src/app/core/interceptors/auth.interceptor.ts
import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const token = authService.currentUserValue?.token || localStorage.getItem('authToken');

  let authReq = req;
  if (token) {
    authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        // Sesión expirada o token inválido
        authService.logout();
        router.navigate(['/login']);
      } else if (error.status === 403) {
        // Permisos insuficientes para el recurso
        console.warn('Acceso denegado (403): Permisos de rol insuficientes.');
      }
      return throwError(() => error);
    })
  );
};
```

Y en `src/main.ts` se conecta al inyector raíz mediante `provideHttpClient(withInterceptors([...]))`:

```typescript
// src/main.ts
import { bootstrapApplication } from '@angular/platform-browser';
import { RouteReuseStrategy, provideRouter, withComponentInputBinding } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { IonicRouteStrategy, provideIonicAngular } from '@ionic/angular';

import { routes } from './app/app.routes';
import { AppComponent } from './app/app.component';
import { authInterceptor } from './app/core/interceptors/auth.interceptor';

bootstrapApplication(AppComponent, {
  providers: [
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    provideIonicAngular(),
    provideRouter(routes, withComponentInputBinding()),
    provideHttpClient(
      withInterceptors([authInterceptor]) // Registro centralizado en el root injector
    ),
  ],
});
```

**Justificación técnica:**  
Registrar el interceptor en el array de `providers` del `main.ts` garantiza su alcance en toda la aplicación. Cualquier servicio presente o futuro que consuma recursos HTTP (como las peticiones REST a Supabase o a microservicios externos) heredará automáticamente la inyección del token y la captura de errores 401/403 sin necesidad de configuración manual adicional.

---

### 2. Control Visual y Experiencia de Usuario (UI/UX Condicional)

#### Ocultación y deshabilitación declarativa con la nueva sintaxis `@if`
En `src/app/dashboard/dashboard.page.html`, adaptamos la interfaz dinámicamente según el rol recuperado por `AuthService`:

```html
<!-- Barra superior de identificación de usuario y rol -->
<ion-badge [color]="isAdmin ? 'warning' : 'light'" class="role-badge">
  <ion-icon [name]="isAdmin ? 'shield-checkmark-outline' : 'people-outline'" aria-hidden="true"></ion-icon>
  <span>{{ currentUserName }} ({{ currentUserRole }})</span>
</ion-badge>

<!-- Panel de acciones de exportación: Solo visible para Administradores -->
@if (isAdmin) {
  <div class="export-actions-group">
    <ion-button (click)="exportToPdf()" fill="solid" color="primary">
      <ion-icon slot="start" name="document-text-outline" aria-hidden="true"></ion-icon>
      Exportar Informe PDF
    </ion-button>

    <ion-button (click)="exportToCsv()" fill="outline" color="secondary">
      <ion-icon slot="start" name="download-outline" aria-hidden="true"></ion-icon>
      Exportar Datos CSV
    </ion-button>
  </div>
} @else {
  <!-- Feedback visual amigable para Usuario Estándar -->
  <div class="user-role-notice" role="status">
    <ion-icon name="information-circle-outline" aria-hidden="true"></ion-icon>
    <p>Sesión con permisos de consulta. La emisión de informes oficiales está reservada al perfil de Administrador.</p>
  </div>
}
```

Usamos la nueva sintaxis de control de flujo `@if` de Angular (que sustituye a la directiva estructural `*ngIf`). Al evaluar `@if (isAdmin)`, si el usuario tiene rol estándar, **los nodos de los botones de exportación ni siquiera se insertan en el DOM del navegador**. Esto impide que un usuario malintencionado pueda inspeccionar el árbol HTML, eliminar un atributo `disabled` con las herramientas de desarrollador e intentar pulsar el botón.

#### Principio de Defensa en Profundidad (Seguridad en Dos Capas)
La experiencia nos enseña que **la interfaz de usuario nunca debe ser la única barrera de seguridad**. Si un usuario abre la consola de JavaScript en las DevTools e invoca directamente los métodos `exportToPdf()` o `toggleUserStatus()`, la aplicación no debe confiar ciegamente en que el botón no estaba en pantalla.

Por ello, en el controlador TypeScript (`src/app/dashboard/dashboard.page.ts`) implementamos una segunda capa de protección defensiva:

```typescript
public async exportToPdf(): Promise<void> {
  // Capa 1: Guarda en el controlador TypeScript
  if (!this.isAdmin) {
    await this.presentToast('Acción denegada: Requiere privilegios de Administrador.', 'danger');
    return;
  }

  // Capa 2: Ejecución de la lógica protegida
  this.exportService.exportUsersToPdf(this.filteredUsers, {
    title: 'Informe Consolidado de Personal',
    author: `${this.currentUserName} (${this.currentUserRole})`
  });
}
```

Si no se cumple la condición de rol, el método aborta su ejecución inmediatamente y muestra una notificación accesible mediante un `ion-toast` con `role="alert"`.

#### Enfoque reactivo mediante Signals computadas y directivas personalizadas
Para escalar este control sin saturar los ciclos de detección de cambios de Angular (`OnPush`), el estado del rol se puede gestionar reactivamente mediante Signals:

```typescript
// En AuthService:
public currentUser = signal<AuthUser | null>(this.getInitialStoredUser());

// En DashboardPage:
public isAdmin = computed(() => this.authService.currentUser()?.rol === 'Administrador');
```

Y para vistas con estructuras más complejas (como pestañas en `ion-tabs` o menús laterales), se puede emplear una directiva estructural personalizada `*hasRole="['Administrador']"`, que escucha activamente los cambios del usuario y manipula el `ViewContainerRef` insertando o destruyendo la plantilla embebida según corresponda.

---

## Apartado C: Matriz de Alternativas Evaluadas

La siguiente matriz compara cuantitativa y cualitativamente las decisiones arquitectónicas adoptadas frente a las alternativas viables del ecosistema actual:

| Solución Evaluada | Seguridad y Resistencia a Manipulación | Sobrecarga de Red y Rendimiento | Mantenibilidad del Código | Escalabilidad del Sistema | Veredicto en el Proyecto |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Guards Funcionales (`canMatch` / `canActivate`)** | **Muy Alta:** Bloquea el acceso en el pipeline de enrutado antes de montar la vista. | **Óptima:** `canMatch` previene la descarga del bundle JS por red. | **Excelente:** Lógica declarativa centralizada en `app.routes.ts`. | **Muy Alta:** Permite rutas polimórficas y composición funcional. | **SELECCIONADA** |
| **Resolución en Componente (`ngOnInit` / `ionViewWillEnter`)** | **Baja:** El componente se instancia y el DOM puede llegar a renderizarse (parpadeo/FOUC). | **Mala:** El chunk JS completo viaja por red antes de denegar el acceso. | **Pésima:** Código repetido en cada controlador. Viola el principio DRY. | **Baja:** Frágil ante la creación de nuevas páginas. | **DESCARTADA** |
| **HTTP Interceptor (`HttpInterceptorFn`)** | **Alta:** Inyección automática en el 100% de las peticiones salientes. | **Óptima:** Sin impacto adicional. Permite reintentos eficientes (Refresh). | **Excelente:** Un único punto de control para token y errores 401/403. | **Muy Alta:** Desacopla por completo los servicios de datos. | **SELECCIONADA** |
| **Inyección Manual de Cabeceras en Servicios** | **Baja:** Propensa a descuidos humanos si se olvida añadir la cabecera en un método. | **Neutra:** Cabeceras redundantes escritas manualmente en cada llamada. | **Muy Mala:** Boilerplate repetitivo en cada método de cada servicio. | **Deficiente:** Modificar la estrategia de auth exige tocar decenas de ficheros. | **DESCARTADA** |
| **RBAC (Role-Based Access Control)** | **Alta:** Desacopla usuarios de permisos mediante la abstracción de Roles. | **Óptima:** Claims ligeras encapsuladas en el payload del token. | **Muy Buena:** Mapeo directo y claro con las necesidades de negocio de la app. | **Alta:** Admite nuevos perfiles (`Supervisor`, `Auditor`) reutilizando permisos. | **SELECCIONADA** |
| **Control Simple Booleano (`isAdmin: true/false`)** | **Media:** Funcional únicamente para prototipos con exactamente dos perfiles. | **Óptima:** Un solo booleano en memoria. | **Buena al inicio, Pésima al crecer:** Genera acumulación de flags incoherentes. | **Nula:** Inviable si la empresa requiere perfiles intermedios con permisos mixtos. | **DESCARTADA** |
| **ABAC (Attribute-Based Access Control)** | **Extrema:** Evalúa sujeto, recurso, acción y contexto dinámico en tiempo real. | **Media/Baja:** Exige evaluar motores de políticas complejos en cada operación. | **Compleja:** Sobrediseño (*overengineering*) para una aplicación de gestión estándar. | **Total:** Máxima granularidad a costa de una alta complejidad de configuración. | **DESCARTADA (Sobrediseño)** |

---

### Justificación Detallada de Decisiones

#### 1. Guards Funcionales frente a Resolución en Componente
La idea de comprobar permisos dentro de los hooks del ciclo de vida del componente (`ngOnInit` o `ionViewWillEnter`) fue descartada por tres motivos técnicos de peso:
1. **Fuga de código e información:** Para que se ejecute el hook de un componente cargado de forma perezosa, el navegador debe haber completado la descarga de su fichero JavaScript. Un usuario no autorizado ya tendría en su caché local el código fuente y las llamadas a la API de la pantalla restringida.
2. **Defecto visual (FOUC - *Flash of Unauthenticated Content*):** Al comprobar la sesión en el componente, la plantilla HTML comienza a renderizarse durante unos milisegundos mientras se resuelve la promesa de redirección, produciendo un molesto parpadeo donde el usuario ve fugazmente la vista privada antes de ser redirigido a `/login`.
3. **Mantenibilidad:** Exigiría inyectar `AuthService` y `Router` en cada página desarrollada, copiando bloques idénticos de redirección. Centralizarlo en `app.routes.ts` con Guards garantiza que una ruta queda protegida de forma unificada desde su propia definición.

#### 2. HTTP Interceptor frente a Inyección Manual de Cabeceras
La inyección manual de cabeceras en cada método de `DataService` o `SupabaseService` rompe el principio de **Responsabilidad Única (SRP)**. Un servicio encargado de obtener la lista de empleados o las métricas departamentales no debe preocuparse por cómo se almacena el token, cuándo caduca ni cómo se renueva.  
El interceptor actúa como un cortafuegos invisible: asegura que ninguna petición salga desprotegida por error humano y proporciona una vía única y consistente para gestionar errores de sesión (401/403) a escala de toda la aplicación.

#### 3. RBAC frente a ABAC o Flag Booleano Simple
* Descartamos el flag simple `isAdmin: boolean` porque, aunque satisface el caso básico actual de dos perfiles, condena a la aplicación a una refactorización costosa en cuanto el cliente solicite un perfil de *Supervisor de Departamento* (que debe ver las exportaciones pero no puede desactivar empleados).
* Evaluamos **ABAC**, pero su complejidad algorítmica (evaluar motores de políticas contextuales que analicen hora, IP y relaciones de propiedad de datos) representaría un caso claro de *overengineering* para la envergadura y los requerimientos del módulo.
* **RBAC** representa el balance de ingeniería óptimo: modela con elegancia la estructura organizativa de la empresa, desacopla la identidad del usuario de los privilegios del sistema y se traduce de forma natural en directivas visuales y controles de seguridad eficientes.

---

## 2. Conclusiones y Cumplimiento de Resultados de Aprendizaje

La arquitectura implementada en `gestion-app` satisface los Resultados de Aprendizaje del currículo oficial:
* **RA 1 (CE 1.b, CE 1.f):** Se estructura la navegación de forma reactiva con Standalone Components, garantizando un flujo de control seguro donde cada rol dispone de una experiencia adaptada y blindada.
* **RA 3 (CE 3.d):** El desacoplamiento entre la interfaz visual y la capa de red se consolida mediante el interceptor funcional, canalizando la autorización y los errores 401/403 de forma asíncrona.
* **RA 6 (CE 6.a):** Las decisiones técnicas se han documentado y comparado frente a alternativas viables, justificando con rigor profesional la elección de los patrones más modernos y mantenibles del ecosistema Angular/Ionic.
