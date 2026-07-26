# LibertyMatch

Encuentra con quién hacer tu próxima actividad en el campus: publica un plan (correr, estudiar, comer, jugar algún deporte) con cupo limitado, y otros estudiantes se apuntan.

## Demo
- **App desplegada:** _[pega aquí tu URL de Vercel, ej. https://libertymatch.vercel.app]_
- **Repositorio:** _[pega aquí el link de este repo en GitHub]_

## Stack tecnológico

| Herramienta | Función en el proyecto |
|---|---|
| **Next.js 14 (App Router)** | Framework de React: rutas, páginas y renderizado |
| **Supabase** | Base de datos PostgreSQL + autenticación de usuarios |
| **Tailwind CSS** | Estilos de la interfaz |
| **Vercel** | Hosting y despliegue automático desde GitHub |
| **Claude Code** | Asistente de IA usado como copiloto durante el desarrollo |

Ver el documento de planeación completo (`Documento de Definición del Proyecto Final`) para la justificación detallada de cada herramienta frente a alternativas.

## Estructura del proyecto

```
app/
  planes/            → listado, detalle y creación de planes
  mis-planes/         → planes creados / en los que estoy inscrito
  notificaciones/      → avisos internos del usuario
  login/, signup/       → autenticación
components/           → Navbar y PlanCard (componentes reutilizables)
lib/supabaseClient.js  → cliente único de Supabase
supabase/schema.sql    → tablas, seguridad (RLS) y funciones de base de datos
```

## Lógica de inscripción (evitar condiciones de carrera)

La inscripción y cancelación a un plan **no** se hacen con un simple `insert`/`delete` desde el frontend. Se implementaron como funciones de PostgreSQL (`inscribirse_a_plan`, `cancelar_inscripcion`) que bloquean la fila del plan (`for update`) antes de verificar el cupo disponible. Esto evita que dos personas ocupen el mismo último cupo al mismo tiempo — un caso borde identificado desde la fase de planeación.

## Prompts principales usados con Claude Code

_(Esta sección se completa conforme se use Claude Code para ajustar o depurar el proyecto. Ejemplos de formato:)_

- **Prompt:** "Agrega manejo de error cuando la fecha de un plan ya pasó, mostrando un mensaje claro en el formulario de creación."
  **Qué desbloqueó:** validación de fecha en el formulario de creación de planes.

- **Prompt:** "Explícame por qué la inscripción al último cupo podría fallar si dos personas se inscriben al mismo tiempo, y ayúdame a resolverlo con Supabase."
  **Qué desbloqueó:** las funciones `inscribirse_a_plan` / `cancelar_inscripcion` con bloqueo de fila.

## Limitaciones conocidas

- No hay chat en tiempo real entre participantes (queda como trabajo futuro).
- No hay sistema de calificación/reputación de usuarios.
- El lugar del plan es texto libre, no coordenadas de mapa.
- Plan gratuito de Supabase: límites de conexiones concurrentes y almacenamiento, suficientes para el alcance de este proyecto.

## Autoevaluación

_(Completar al terminar el proyecto: qué funcionó bien, qué se tuvo que ajustar respecto al plan original, y qué se aprendió sobre el uso de IA como copiloto de código.)_

## Cómo correr el proyecto en local

```bash
npm install
cp .env.example .env.local   # y llena tus llaves reales de Supabase
npm run dev
```
