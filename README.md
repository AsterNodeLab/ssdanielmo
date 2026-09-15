# Routine OS

PWA personal para ejecutar la rutina de lunes a viernes con menos decisiones: ver qué toca ahora, marcar bloques, registrar outputs y revisar el cumplimiento semanal.

Routine OS funciona **offline-first**. La rutina y los datos locales siguen disponibles aunque no haya internet; Supabase es una capa opcional de autenticación y sincronización entre dispositivos.

## Ejecutar localmente

Requiere Node.js 22 o superior.

```bash
npm install
npm run dev
```

Para validar una versión de producción:

```bash
npm run lint
npm run build
npm run preview
```

Sin variables de Supabase, la aplicación funciona en modo local exactamente con la caché de `localStorage`.

## Persistencia offline

Los checks, horas reales, outputs de EDUVO, materias UNAM, active recall, ajustes y cambios temporales se guardan inmediatamente en `localStorage`. La interfaz nunca espera al servidor para marcar un bloque ni para mostrar la rutina.

La PWA mantiene una cola local de cambios pendientes. Cuando vuelve internet, intenta sincronizarla automáticamente. El backup local continúa disponible en **Ajustes → Exportar JSON** e **Importar JSON**.

## Sincronización Supabase

El cliente usa exclusivamente estas variables públicas de Vite:

```env
VITE_SUPABASE_URL=https://sbhhjalelwfasmshxail.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=
```

Copia `.env.example` a `.env.local` para desarrollo y completa la publishable key desde **Supabase → Project Settings → API**. Nunca uses una `service_role`, secret key ni contraseña de base de datos en el navegador o en GitHub Pages.

### Configurar el proyecto de Supabase

1. En el proyecto `sbhhjalelwfasmshxail`, abre **SQL Editor** y ejecuta [`supabase/migrations/20260824000000_routine_os_sync.sql`](supabase/migrations/20260824000000_routine_os_sync.sql).
2. En **Authentication → Providers**, deja activo **Email**.
3. En **Authentication → URL Configuration**, usa como Site URL la URL publicada y añade como Redirect URL: `https://asternodelab.github.io/ssdanielmo/`.
4. Confirma que las tablas `daily_records` y `user_settings` tienen RLS activo. La migración ya crea las políticas necesarias.

La sincronización aplica Last Write Wins por registro diario usando `updated_at`. Un dato remoto más antiguo nunca reemplaza silenciosamente una versión local más reciente. Al primer login, la caché local existente se compara con Supabase y se sube sin borrar historial.

## GitHub Pages

El workflow [`deploy.yml`](.github/workflows/deploy.yml) instala dependencias, ejecuta lint y build, y publica `dist` en GitHub Pages. Vite detecta automáticamente el nombre del repositorio a partir de `GITHUB_REPOSITORY`, por lo que el `base` funciona en `https://usuario.github.io/nombre-del-repositorio/`.

En **Settings → Secrets and variables → Actions** del repositorio `AsterNodeLab/ssdanielmo`, configura:

- Variable de repositorio `VITE_SUPABASE_URL` = `https://sbhhjalelwfasmshxail.supabase.co`.
- Secret de repositorio `VITE_SUPABASE_PUBLISHABLE_KEY` = la publishable key del proyecto.

El workflow solo inyecta esos valores durante el build. Si todavía no están configurados, el despliegue sigue compilando y la app opera en modo local; la sincronización remota se activa después de añadirlos y volver a ejecutar el workflow.

## Probar dos dispositivos

1. Configura la migración SQL, el proveedor Email y las dos variables de GitHub.
2. Abre la URL publicada en dos navegadores/dispositivos y entra con la misma cuenta.
3. Marca un bloque o guarda un output EDUVO en el primer dispositivo.
4. Espera el estado **Sincronizado** o pulsa **Sincronizar ahora** en Ajustes.
5. En el segundo dispositivo, recarga o pulsa **Sincronizar ahora** y comprueba que aparece el mismo historial.

La cuenta limita las consultas y escrituras mediante RLS: cada fila solo puede ser leída o modificada por el `auth.uid()` que coincide con `user_id`.

## Verificar modo offline

Después de abrir una vez la PWA publicada, activa el modo avión o desconecta la red. La rutina, los registros locales, los checks, el historial y los respaldos deben seguir funcionando. Al volver a conectar, el indicador pasa a sincronizando y reintenta los cambios pendientes.

## Instalar en Android

1. Abre `https://asternodelab.github.io/ssdanielmo/` en Chrome desde el Moto G Stylus.
2. Espera a que cargue una vez y abre el menú de Chrome.
3. Elige **Añadir a pantalla de inicio** o **Instalar aplicación**.

La PWA incluye manifest, iconos 192/512, icono maskable, service worker, caché offline, modo standalone y color de tema.

## Arquitectura

- `src/lib/routine.ts`: rutina central, horarios, anclas y métricas. No contiene datos de cuenta.
- `src/lib/storage.ts`: caché local, aislamiento por usuario y validación de respaldos.
- `src/lib/supabase.ts`: cliente Supabase con sesión persistente y solo publishable key.
- `src/lib/sync.ts`: cola offline, migración inicial, merge y Last Write Wins.
- `src/components/`: vistas móviles, timeline, semana, rutina, ajustes y modales.
- `supabase/migrations/`: esquema PostgreSQL y políticas RLS.
- `public/`: manifest, iconos, favicon y service worker.

## Limitaciones conocidas

- La publishable key y la migración SQL deben configurarse en Supabase/GitHub; no se incluyen secretos en el repositorio.
- La sincronización se ejecuta al iniciar sesión, al volver internet, después de cambios locales y manualmente desde Ajustes. Realtime no es necesario para el flujo y queda fuera de esta primera integración.
- La resolución de conflictos es por registro diario completo, no por campo individual. Para una app personal esto mantiene la implementación pequeña y predecible.

