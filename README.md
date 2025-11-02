# Biblioteca Virtual CMI Tahuantinsuyo Bajo

Este proyecto es un sistema de gestión de documentos y biblioteca virtual construido con Next.js, Firebase y Tailwind CSS. Está diseñado para permitir a los usuarios de la organización CMI Tahuantinsuyo Bajo centralizar, buscar y gestionar recursos académicos de manera eficiente y segura.

## ✨ Funcionalidades Principales

### 1. Sistema de Autenticación y Roles de Usuario

El sistema cuenta con un robusto sistema de autenticación y tres roles de usuario con permisos bien definidos:

-   **User (Usuario):** Rol estándar.
    -   Puede ver todo el contenido público (categorías, carpetas y documentos).
    -   Puede subir, editar y eliminar **sus propios** documentos.
    -   Puede crear carpetas dentro de cualquier categoría o subcarpeta.
    -   Puede ver su historial de actividad.
    -   No puede gestionar contenido de otros usuarios ni acceder al panel de administración.

-   **Editor:** Rol con permisos de gestión de contenido.
    -   Hereda todos los permisos del rol `User`.
    -   Puede crear, editar y eliminar **cualquier documento** y **categoría** en el sistema.
    -   Puede gestionar todas las carpetas.
    -   No puede administrar usuarios.

-   **Admin (Administrador):** Rol con control total sobre el sistema.
    -   Hereda todos los permisos de los roles `User` y `Editor`.
    -   Tiene acceso exclusivo al panel de **Gestión de Usuarios**, donde puede ver a todos los usuarios y cambiar sus roles.

### 2. Organización del Contenido

La biblioteca está organizada de forma jerárquica para facilitar la navegación:

-   **Categorías:** Son los contenedores principales de la biblioteca (ej. "Cardiología", "Pediatría"). Son gestionadas exclusivamente por `Admins` y `Editores`.
-   **Carpetas:** Dentro de cada categoría, cualquier usuario autenticado puede crear carpetas para organizar documentos. Las carpetas pueden anidarse unas dentro de otras, permitiendo una estructura profunda y flexible.
-   **Documentos:** Son los archivos (PDF) que componen la biblioteca. Cada documento tiene metadatos asociados como título, autor, año, descripción, etc.

### 3. Gestión de Contenido

-   **Crear y Editar:** Los usuarios pueden añadir nuevos documentos a través de un formulario completo. Los `Admins` y `Editores` pueden gestionar categorías, y todos los usuarios autenticados pueden crear carpetas.
-   **Eliminación Segura:** Antes de eliminar una carpeta, el sistema verifica que esté vacía. Todas las acciones de eliminación muestran un diálogo de confirmación para evitar borrados accidentales.
-   **Páginas de Gestión:**
    -   `/my-documents`: Permite a los usuarios gestionar los documentos que han subido.
    -   `/admin/categories`: Panel para que `Admins` y `Editores` gestionen las categorías.
    -   `/admin/users`: Panel exclusivo para `Admins` para la gestión de roles de usuario.

### 4. Búsqueda y Visualización

-   **Filtros en la Página Principal:** La página de inicio permite buscar documentos por texto (título, autor, descripción) y filtrar los resultados por categoría y año de publicación.
-   **Búsqueda Mejorada con IA:** La página `/search` utiliza un modelo de lenguaje (Genkit) que interpreta la intención del usuario. En lugar de una simple búsqueda de texto, la IA utiliza herramientas internas para buscar de forma inteligente documentos, carpetas y categorías, presentando una lista unificada de resultados relevantes.
-   **Visualizador de PDF Embebido:** En la página de detalle de cada documento, se puede visualizar el archivo PDF directamente en el navegador, sin necesidad de descargarlo.

### 5. Auditoría y Perfil de Usuario

-   **Historial de Actividad (`/history`):** Cada usuario tiene un registro personal de las acciones que ha realizado en el sistema (crear, actualizar, eliminar contenido), proporcionando transparencia sobre su actividad.
-   **Gestión de Perfil (`/profile`):** Los usuarios pueden ver su rol, actualizar su nombre y foto de perfil, y solicitar un restablecimiento de contraseña.

## 🛠️ Arquitectura y Stack Tecnológico

-   **Framework:** Next.js con App Router.
-   **Base de Datos:** Cloud Firestore para almacenar todos los datos (documentos, usuarios, carpetas, etc.).
-   **Autenticación:** Firebase Authentication (proveedores de correo/contraseña y Google).
-   **Almacenamiento de Archivos:** Firebase Storage para alojar los archivos PDF.
-   **Reglas de Seguridad:** Reglas de Firestore y Storage para controlar el acceso y las operaciones según el rol y la propiedad del contenido.
-   **Funcionalidades de IA:** Genkit con un modelo de Google para la búsqueda inteligente.
-   **UI y Estilos:** Tailwind CSS con componentes de ShadCN UI.
-   **Manejo de Estado:** Componentes de Cliente de React (`'use client'`) con hooks para interactuar con Firebase en tiempo real (`useCollection`, `useDoc`).

## 🚀 Cómo Empezar

1.  **Explora el contenido:** Navega por las categorías en la barra lateral o usa la búsqueda en la página de inicio.
2.  **Regístrate:** Crea una cuenta para poder subir tus propios documentos. El primer usuario registrado es asignado automáticamente como `Admin`.
3.  **Gestiona contenido:** Si tienes permisos, explora los paneles de administración para gestionar categorías y usuarios.
