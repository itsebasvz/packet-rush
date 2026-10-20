# Packet Rush

Una carrera de preguntas para **Redes de Computadoras 1**, diseñada para hasta 40 personas desde sus celulares. Cada jugador controla un paquete, responde 12 preguntas y compite en un ranking compartido.

**[Abrir el juego](https://packet-rush-drab.vercel.app) · [Panel del anfitrión](https://packet-rush-drab.vercel.app/host)**

## Jugar en clase

1. Abre `/host` y entra con la contraseña del anfitrión.
2. Crea una sala. Comparte su QR o enlace con el grupo.
3. Espera a que todos aparezcan en la lista y pulsa **Dar la salida**.
4. Cada persona responde a su ritmo. El panel actualiza las posiciones cada tres segundos.
5. Al completar todos el recorrido aparece el podio. También puedes terminar anticipadamente.
6. Descarga los resultados como CSV o crea otra carrera.

La inscripción se cierra al iniciar. Cada sala admite 40 participantes y vence a las 24 horas. Si alguien recarga, recupera su partida en el mismo navegador. Cambiar de dispositivo o borrar cookies no transfiere la sesión. Se necesita internet durante la actividad.

## Reglas

- 12 preguntas, cuatro por tema: modelo OSI, dispositivos y topologías.
- Cuatro opciones, un intento y 45 segundos por pregunta. La primera pregunta comienza con la salida común.
- Cada acierto suma 100 puntos; los errores y vencimientos suman cero.
- Leer la explicación no cuenta en el tiempo de desempate. La siguiente pregunta empieza al pulsar **Continuar**.
- Gana quien tiene más aciertos; el menor tiempo acumulado de respuesta desempata. Un empate exacto comparte posición.
- Al calcular posiciones, cada pregunta pendiente o vencida cuenta como 45 segundos. El tiempo total mostrado para desempate incluye esa penalización.
- Si se cierra anticipadamente, las preguntas pendientes quedan sin puntos.

## Stack y arquitectura

Next.js App Router, React, TypeScript, Tailwind CSS y Supabase Postgres. Next.js atiende la interfaz y las API en Vercel. El navegador consulta estado cada tres segundos; no necesita WebSockets ni acceso directo a Supabase.

Las funciones SQL calculan tiempos y resultados con el reloj del servidor. Bloqueos por sala y participante protegen la capacidad y la concurrencia. La clave primaria de respuesta impide contabilizar dos veces un intento, incluso si se reenvía después de perder conexión. Las salas guardan una copia del cuestionario.

Las tablas tienen RLS y las funciones solo son ejecutables por `service_role`. Las claves de Supabase nunca se entregan al navegador. La sesión de jugador usa un token aleatorio en una cookie `HttpOnly`; solo se almacena su hash. El anfitrión usa una cookie firmada, con límite de intentos de contraseña persistido en la base.

El código es público, por lo que el cuestionario puede consultarse en GitHub. La validación en servidor impide enviar puntos inventados; no pretende evitar que alguien consulte las respuestas publicadas.

## Desarrollo

Requisitos: Node.js 22 o posterior y pnpm 11.3.0.

```bash
pnpm install --frozen-lockfile
cp .env.example .env.local
pnpm dev
```

Completa `.env.local` con la URL y clave secreta de un proyecto dedicado de Supabase, además de dos valores aleatorios distintos para `HOST_PASSWORD` y `HOST_SESSION_SECRET`. Puedes generar cada uno con `openssl rand -hex 32`. Nunca uses el prefijo `NEXT_PUBLIC_` para estas variables ni subas los valores a GitHub.

### Supabase alojado

La CLI está instalada y fijada como dependencia de desarrollo del proyecto.

```bash
pnpm exec supabase --agent no login
pnpm exec supabase link --project-ref TU_PROJECT_REF
pnpm exec supabase db push
```

Usa un proyecto dedicado al juego. `db push` aplica las migraciones pendientes; no reinicia la base. El entorno alojado no requiere Docker.

### Supabase local

Docker es opcional para desarrollo y pruebas integradas. Los puertos del proyecto son 56320–56323.

```bash
pnpm exec supabase start
pnpm exec supabase status
```

Para desarrollo local con claves mostradas por `status`, asigna su clave `service_role` a `SUPABASE_SECRET_KEY`. Para comprobar permisos en pruebas también puedes definir `SUPABASE_ANON_KEY`. No publiques credenciales en capturas o registros.

## Cambiar preguntas

Edita `content/questions.json` y vuelve a publicar. Cada pregunta tiene `id`, `topic`, `prompt`, cuatro `options` con IDs `a`–`d`, `correctOption` y `explanation`. Mantén cuatro preguntas de cada tema. `pnpm build` valida el contenido y rechaza IDs duplicados, opciones incompletas y respuestas inexistentes. Una partida ya creada conserva su cuestionario original.

## Verificación

```bash
pnpm test
pnpm run check
pnpm build
pnpm run test:db
# Con la aplicación ejecutándose y .env.local configurado:
pnpm run test:load
pnpm exec playwright install chromium
pnpm run test:e2e
```

`test:db` crea salas aisladas, prueba 40 inscripciones concurrentes, límites, permisos, respuestas repetidas, vencimientos y cierre automático, y limpia únicamente esas salas. `test:load` prueba 40 navegadores simulados mediante HTTP, completa 480 respuestas y compara los resultados de varios clientes; deja su sala cerrada para inspección. `test:e2e` prueba el recorrido completo en vistas de computadora y celular; necesita `HOST_PASSWORD` y una base configurada. Estas pruebas no se deben ejecutar durante una partida de clase.

## Publicación

Configura `SUPABASE_URL`, `SUPABASE_SECRET_KEY`, `HOST_PASSWORD` y `HOST_SESSION_SECRET` en Vercel. La clave secreta y la contraseña se conservan fuera del repositorio. Publica con Vercel CLI:

```bash
vercel link
vercel --prod
```

Verifica que la URL de producción se abra sin autenticación de Vercel desde un celular. Haz una partida breve con dos navegadores antes de compartirla con el grupo. La contraseña de anfitrión se encuentra en la configuración privada del entorno; no está en este documento.

Para actualizar: aplica primero cualquier migración SQL pendiente, ejecuta las comprobaciones y vuelve a desplegar. Si una publicación falla, Vercel permite promover el despliegue anterior. No publiques cambios mientras el grupo esté jugando.

## Diseño

`DESIGN.md` define la paleta y los patrones visuales. Se conserva su sistema de colores, tipografía redonda, botones con relieve y estados de error suaves. Para este juego se permite el ranking por solicitud expresa del usuario. Las fuentes Baloo 2 y Nunito se sirven desde la propia aplicación; sus licencias OFL están en `public/fonts/`. Los avatares son SVG incluidos en el código.
