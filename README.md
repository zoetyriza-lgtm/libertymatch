# LibertyMatch

Encuentra con quién hacer tu próxima actividad en el campus: publica un plan (correr, estudiar, comer, jugar algún deporte) con cupo limitado, y otros estudiantes se apuntan. Incluye perfil con intereses, match con solicitud/aceptación entre estudiantes afines, y un blog de experiencias con comentarios.

## Demo
- **App desplegada:** https://zoe-project-three.vercel.app/planes
- **Repositorio:** https://github.com/zoetyriza-lgtm/ZoeProject

## Stack tecnológico

| Herramienta | Función en el proyecto |
|---|---|
| **Next.js 14 (App Router)** | Framework de React: rutas, páginas y renderizado |
| **Supabase** | Base de datos PostgreSQL, autenticación, y almacenamiento de imágenes (avatares, fotos de planes y de experiencias) |
| **Tailwind CSS** | Estilos e identidad visual de la interfaz |
| **Vercel** | Hosting y despliegue automático desde GitHub |
| **Claude Code** | Asistente de IA usado como copiloto durante todo el desarrollo |

## Funcionalidades

- **Autenticación:** registro e inicio de sesión con correo/contraseña.
- **Planes:** crear, listar (con filtro y sección de recomendados), ver detalle, unirse/cancelar inscripción, foto opcional, categoría opcional.
- **Perfil:** foto, biografía y selección de intereses de una lista fija.
- **Match:** estudiantes ordenados por cuántos intereses tienen en común contigo.
- **Conexiones:** solicitud de conexión → la otra persona acepta o rechaza → quedan "conectados", con notificación en ambos pasos.
- **Mensajes directos:** una vez conectados, dos estudiantes pueden escribirse en una conversación (se actualiza sola cada 5 segundos). Protegido a nivel de base de datos: solo puedes escribirle a alguien con quien tienes una conexión aceptada.
- **Planes recurrentes:** al crear un plan se puede activar que se repita semanalmente (2 a 12 semanas), generando automáticamente una instancia por semana, todas agrupadas.
- **Notificaciones internas:** avisos cuando alguien se une/cancela un plan, cuando llega una solicitud de conexión, y cuando la aceptan.
- **Blog de experiencias:** publicar una historia (con foto opcional, etiquetada a un plan si se quiere) y comentar en las publicaciones de otros.

## Estructura del proyecto

```
app/
  planes/            → listado (+ recomendados), detalle y creación de planes
  mis-planes/         → planes creados / en los que estoy inscrito
  perfil/              → foto, bio e intereses del usuario
  match/               → estudiantes afines + botón de conectar
  conexiones/          → solicitudes recibidas y conexiones aceptadas
  mensajes/[usuarioId]/ → conversación directa con una conexión aceptada
  experiencias/         → blog de experiencias + comentarios
  notificaciones/        → avisos internos del usuario
  login/, signup/          → autenticación
components/            → Navbar, PlanCard, InterestPicker, Comentarios
lib/                   → cliente de Supabase y helper de subida de imágenes
supabase/              → schema.sql + migraciones (correr en orden)
```

## Lógica de inscripción (evitar condiciones de carrera)

La inscripción y cancelación a un plan se implementaron como funciones de PostgreSQL (`inscribirse_a_plan`, `cancelar_inscripcion`) que bloquean la fila del plan (`for update`) antes de verificar el cupo disponible. Esto evita que dos personas ocupen el mismo último cupo al mismo tiempo — un caso borde identificado desde la fase de planeación y validado en el código.

## Prompts principales usados con Claude Code

Estos son prompts reales que se usaron durante el desarrollo y qué desbloquearon:

- **"Necesito que quede como tipo Rhode Beauty y que haya algún tipo de efecto o animación que se vea interactivo"**
  → Rediseño completo de la identidad visual (paleta, tipografía itálica delicada, fondo con degradado tipo "glossy") y micro-interacciones (tarjetas que flotan al pasar el mouse, botones con elevación suave, entrada con fade-in).

- **"Error: Couldn't find any pages or app directory"** (al desplegar en Vercel)
  → Diagnóstico de que la carpeta `app/` había quedado anidada dentro de otra carpeta por un error al subir archivos a GitHub arrastrando de forma incorrecta. Se resolvió recreando el repositorio y subiendo desde la pantalla de "quick setup" (que siempre sube a la raíz).

- **"Ocurrió un error al guardar: Could not find the 'bio' column of 'profiles'"**
  → El código ya usaba columnas nuevas (`bio`, `intereses`, `foto_url`) que existían en el código pero no se habían creado todavía en la base de datos real, porque faltaba correr el script de migración correspondiente en Supabase.

- **"npm warn deprecated next@14.2.15: This version has a security vulnerability"**
  → Se identificó la versión parchada correcta (`14.2.35`) y se actualizó `package.json`.

- **"Me interesan más las funcionalidades de poder hacer match con ciertas personas acorde a los intereses"**
  → Diseño e implementación completa del sistema de match: perfil con intereses seleccionables, cálculo de afinidad por intereses compartidos, y sistema de conexiones con solicitud/aceptación (tabla `conexiones` con estados `pendiente`/`aceptada`/`rechazada`).

- **"Quiero agregar algo un poco más complejo: mensajes directos entre conexiones y planes recurrentes"**
  → Tabla `mensajes` con una política de seguridad (RLS) que exige que exista una conexión con estado `aceptada` antes de permitir el insert — es decir, la restricción de "solo puedes escribirle a tus conexiones" vive en la base de datos, no solo en la interfaz. Para los planes recurrentes, se generan varias filas en `planes` en un solo insert, todas compartiendo un `serie_id`, en vez de crear una tabla de "reglas de recurrencia" más compleja.

- **"ERROR: 42710: policy already exists"** (al re-correr una migración)
  → Se ajustó el script SQL para usar `drop policy if exists` antes de cada `create policy`, haciendo la migración segura de correr más de una vez sin romperse — una buena práctica de idempotencia que no se había aplicado en las migraciones anteriores.

## Limitaciones conocidas

- No hay chat en tiempo real real (WebSockets) — los mensajes directos se refrescan cada 5 segundos en vez de aparecer instantáneamente, como una decisión consciente para reducir complejidad y riesgo de configuración.
- No hay notificaciones push del navegador, solo notificaciones internas dentro de la app.
- El match se basa en intereses declarados por el usuario (lista fija de categorías), no en un algoritmo de recomendación más sofisticado.
- Los planes recurrentes se crean como filas independientes agrupadas por `serie_id`; cancelar o editar toda la serie a la vez no está implementado, solo plan por plan.
- El lugar del plan es texto libre, no coordenadas de mapa.
- Plan gratuito de Supabase: límites de conexiones concurrentes y almacenamiento, suficientes para el alcance de este proyecto.

## Autoevaluación

La parte de programar la lógica de la aplicación (planes, cupos, match, conexiones, mensajes) resultó relativamente directa usando Claude Code como copiloto. La mayor dificultad real estuvo en el **despliegue, la configuración y el manejo de migraciones de base de datos** — errores como la carpeta `app/` mal ubicada al subir a GitHub, migraciones que había que correr en el orden correcto, o una política de seguridad duplicada al re-ejecutar un script, tomaron más tiempo que escribir el código en sí. Esto fue un aprendizaje importante: usar IA para generar código funcional es solo una parte del trabajo real de shippear una aplicación; el resto (control de versiones, variables de entorno, migraciones idempotentes) requiere entender qué está pasando y no solo copiar y pegar sin verificar. También aprendí a distinguir advertencias inofensivas (como un aviso de "operación destructiva" en un script que en realidad solo reemplaza una política de seguridad) de errores que sí requieren detenerse a pensar antes de continuar.

## Cómo correr el proyecto en local

```bash
npm install
cp .env.example .env.local   # y llena tus llaves reales de Supabase
npm run dev
```
