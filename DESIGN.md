# Kumon Alice — Sistema de Diseño
> Base de diseño para toda la web. Derivado de la estética Duolingo (ver `docs/DUOLINGO_REFERENCE.md`) con la paleta oficial de Kumon (extraída del CSS de producción de kumon.co.uk, 2026-07-02).

**Tema:** claro · **Idioma:** español · **Enfoque:** mobile-first SIEMPRE

El diseño se siente como un salón de clases gamificado, calmado y alentador. Su núcleo combina tres decisiones: tipografía redonda y regordeta para titulares, el "Kumon Blue" cian que baña las acciones primarias e identidad, y profundidad táctil mediante botones 3D con sombra sólida inferior. El layout usa amplio espacio en blanco como lienzo limpio sobre el que los elementos de color destacan. A diferencia de Duolingo (verde enérgico), la paleta Kumon es predominantemente azul: transmite calma, foco y confianza — exactamente lo que necesita un alumno con dificultades de aprendizaje. La energía y celebración se reservan para los acentos cálidos (amarillo, mint, rosa).

## Psicología del color (por qué esta paleta funciona para este alumno)

| Color | Efecto psicológico | Uso en la app |
|-------|-------------------|---------------|
| Azul cian (`#7dcdf4`) | Calma, apertura, reduce ansiedad. Asociado a cielo e inteligencia (simbolismo oficial de Kumon) | Identidad, fondos de marca, elementos interactivos suaves |
| Indigo (`#4F3DD9`) | Confianza, profundidad, seriedad amable | CTAs primarios — contraste AA con texto blanco |
| Amarillo (`#FFB200`) | Alegría, recompensa, dopamina | EXCLUSIVO para celebración: rachas, medallas, confeti, XP |
| Mint (`#ACF0D1`) | Frescura, éxito suave, no agresivo | Fondos de estados correctos/completados |
| Verde (`#00A63E`) | Confirmación clara | Texto/icono de respuesta correcta |
| Rojo (`#D4183D`) | Alerta | **Usar con moderación extrema**: solo texto/borde breve en respuesta incorrecta, nunca pantallas rojas ni X gigantes. El alumno tiene dificultades — el error se comunica suave y se acompaña siempre de la respuesta correcta |
| Rosa (`#ff83ae`) | Amabilidad, juego | Acentos de ilustración únicamente |

Regla de oro: **el error nunca grita, el acierto siempre celebra.**

## Tokens — Colores

| Nombre | Valor | Token | Rol |
|--------|-------|-------|-----|
| Kumon Blue | `#7dcdf4` | `--color-kumon-blue` | Color de marca: highlights, fondos de héroe, elementos interactivos secundarios, logo |
| Kumon Blue Dark | `#4fb3e8` | `--color-kumon-blue-dark` | Sombra 3D inferior de botones Kumon Blue, estados hover |
| Indigo | `#4F3DD9` | `--color-indigo` | CTAs primarios, énfasis fuerte, links |
| Indigo Dark | `#3b2da8` | `--color-indigo-dark` | Sombra 3D inferior de botones indigo |
| Kumon Blue Light | `#e4f5fd` | `--color-kumon-blue-light` | Tintes de fondo para estados activos/seleccionados |
| Mint | `#ACF0D1` | `--color-mint` | Fondos de éxito, pills de logro |
| Sunshine Yellow | `#FFB200` | `--color-sunshine-yellow` | Recompensas, rachas, celebración — exclusivo de gamificación e ilustraciones |
| Pink | `#ff83ae` | `--color-pink` | Acentos de ilustración únicamente |
| Success Green | `#00A63E` | `--color-success` | Respuesta correcta (texto/icono) |
| Error Red | `#D4183D` | `--color-error` | Respuesta incorrecta (uso mínimo, nunca dominante) |
| Snow White | `#ffffff` | `--color-snow-white` | Superficies de cards, texto de botones |
| Cloud | `#f8f9fa` | `--color-cloud` | Fondo de página |
| Mist | `#e3e5ec` | `--color-mist` | Bordes, divisores, paneles sutiles |
| Silver | `#bdbdbd` | `--color-silver` | Placeholders, estados deshabilitados |
| Graphite | `#6b7280` | `--color-graphite` | Texto descriptivo secundario |
| Ink | `#1F1F1F` | `--color-ink` | Texto principal y titulares |

## Tokens — Tipografía

### Baloo 2 — titulares · `--font-display`
- **Google Fonts:** Baloo 2 (equivalente al 'Feather' de Duolingo; soporte completo de español)
- **Pesos:** 700, 800
- **Tamaños:** 32px (móvil) → 48px, 64px (desktop)
- **Line height:** 1.20 · **Letter spacing:** -0.02em
- **Rol:** exclusivo para titulares grandes e impactantes (H1, H2) y los números gigantes de las flashcards. Redondo, pesado, juguetón y confiado.

### Nunito — UI y cuerpo · `--font-body`
- **Google Fonts:** Nunito (equivalente al 'din-round' de Duolingo)
- **Pesos:** 500, 700, 800
- **Tamaños:** 13px, 15px, 17px, 19px, 32px
- **Line height:** 1.15–1.47 · **Letter spacing:** 0.05em (textura abierta y legible, rasgo firma)
- **Rol:** todo el texto de UI, cuerpo y botones. Peso 700+ para botones y énfasis.

### Escala tipográfica (mobile-first: base móvil, escala en `md:`)

| Rol | Móvil | Desktop | Line Height | Token |
|-----|-------|---------|-------------|-------|
| caption | 13px | 13px | 1.4 | `--text-caption` |
| body | 15px | 15px | 1.4 | `--text-body` |
| heading-sm | 17px | 19px | 1.2 | `--text-heading-sm` |
| heading | 24px | 32px | 1.2 | `--text-heading` |
| heading-lg | 32px | 48px | 1.2 | `--text-heading-lg` |
| display | 48px | 64px | 1.2 | `--text-display` |
| flashcard | 56px | 96px | 1.1 | `--text-flashcard` |

## Tokens — Espaciado y formas

**Unidad base:** 4px · **Densidad:** cómoda (touch-first)

### Escala de espaciado
8px · 12px · 16px · 24px · 32px · 40px · 48px · 64px · 80px · 96px
(tokens `--spacing-8` … `--spacing-96`)

### Border radius

| Elemento | Valor |
|----------|-------|
| cards | 16px |
| inputs | 12px |
| botones | 12px |
| teclas numéricas | 16px |
| pills/badges | 9999px |

### Layout

- **Mobile-first:** diseñar en 375px, escalar hacia arriba. Nunca al revés.
- **Touch targets:** mínimo 48×48px (teclado numérico: mínimo 56×56px)
- **Page max-width:** 1140px (dashboard maestra); vistas de alumno centradas máx. 480px incluso en desktop
- **Gap de sección:** 48px móvil / 80px desktop
- **Padding de card:** 16px móvil / 24px desktop
- **Gap entre elementos:** 16px
- **Safe areas:** respetar `env(safe-area-inset-*)` en vistas de alumno

## Componentes

### Botón primario 3D
CTA principal. Fondo `--color-indigo`, texto blanco, radius 12px, Nunito 15px peso 800, MAYÚSCULAS con letter-spacing 0.05em, padding 16px 32px, `box-shadow: 0 4px 0 var(--color-indigo-dark)`. Al presionar: se traslada 4px hacia abajo y la sombra desaparece (sensación física de tecla).

### Botón secundario 3D (Kumon Blue)
Igual que el primario pero fondo `--color-kumon-blue`, texto `--color-ink` (el cian claro no soporta texto blanco), sombra `0 4px 0 var(--color-kumon-blue-dark)`.

### Botón outline
Fondo transparente, texto `--color-indigo`, borde 2px `--color-mist`, radius 12px, `box-shadow: 0 2px 0 var(--color-mist)`.

### Flashcard
Tarjeta central protagonista: fondo blanco, radius 16px, borde 2px `--color-mist`, la operación en Baloo 2 a `--text-flashcard` color `--color-ink`. Correcto → borde y tinte `--color-mint` + check `--color-success`. Incorrecto → borde `--color-error` sutil + respuesta correcta mostrada en grande.

### Teclado numérico
Grid 3×4 propio en pantalla (nunca teclado del sistema). Teclas mínimo 56×56px, radius 16px, fondo blanco, borde 2px `--color-mist`, `box-shadow: 0 2px 0 var(--color-mist)`, dígito en Baloo 2 24px. Efecto de presión igual que botones 3D.

### Barra de progreso
Track `--color-mist`, fill `--color-kumon-blue` con radius completo, altura 16px. En celebración de sesión completada el fill cambia a `--color-sunshine-yellow`.

### Heatmap de dominio (dashboard maestra)
Grid de celdas con radius 6px. Escala: sin datos `--color-mist` → débil `#fecaca` (rojo suave, no `--color-error` puro) → medio `#fde68a` → dominado `--color-mint`/`--color-success`. Legible en 2 segundos.

### Pill de logro
Fondo `--color-mint` o tinte amarillo `rgba(255,178,0,0.32)`, radius completo, texto `--color-ink` peso 700.

## Sí y No

### Sí
- Usar Indigo `#4F3DD9` para todo CTA primario; Kumon Blue `#7dcdf4` para identidad y acciones secundarias.
- Radius 12px+ en todo componente interactivo; nada de esquinas filosas.
- Baloo 2 exclusivamente para titulares grandes y números de flashcards.
- Profundidad SOLO con sombra sólida inferior (`box-shadow: 0 4px 0 <tono oscuro>`); resto de UI plana.
- Amarillo `#FFB200` reservado a recompensas y celebración — así conserva su poder dopamínico.
- Feedback de error suave: breve, acompañado de la respuesta correcta, nunca dominante.
- Diseñar cada pantalla primero en 375px; touch targets ≥48px.
- Texto de botones en MAYÚSCULAS con Nunito 800 y letter-spacing abierto.

### No
- No usar sombras difusas tradicionales para elevación en cards o paneles (sistema plano).
- No usar texto blanco sobre Kumon Blue `#7dcdf4` (falla contraste; usar `--color-ink`).
- No usar rojo como color de pantalla, fondo o ilustración — solo señal puntual de error.
- No usar Baloo 2 en texto pequeño ni cuerpo.
- No usar el teclado del sistema para respuestas del alumno.
- No introducir colores fuera de esta paleta.
- No usar leaderboards ni comparaciones entre alumnos (principio pedagógico del proyecto).
- No diseñar desktop-first.

## Elevación
Sistema intencionalmente plano. La profundidad existe exclusivamente en elementos presionables (botones, teclas) mediante borde inferior sólido de tono más oscuro que simula una tecla física. Cards y contenedores permanecen planos sobre el fondo `--color-cloud`, separados por bordes `--color-mist`.

## Imaginería
Ilustraciones vectoriales planas, amigables y orgánicas: formas redondeadas, rasgos simples. Paleta de ilustración: Kumon Blue, Indigo, Sunshine Yellow, Mint y Pink. Cada pantalla clave del alumno (home, fin de sesión, logros) se acompaña de una ilustración o mascota que hace tangible el progreso. Estilo celebratorio en fin de sesión (confeti amarillo). Nunca ilustraciones tristes o de regaño en errores.

## Layout
Vistas de alumno: una sola columna centrada (máx. 480px), la flashcard domina la pantalla, controles al alcance del pulgar (zona inferior). Dashboard maestra: layout centrado máx. 1140px, responsive con cards apilables en móvil. Contenido "flota" sobre el fondo claro sin contenedores de color de fondo pesados — estructura abierta y enfocada.

## Guía rápida para agentes

### Referencia rápida de color
- **Fondo de página**: `#f8f9fa` (Cloud)
- **Texto principal**: `#1F1F1F` (Ink)
- **CTA primario**: `#4F3DD9` (Indigo) + sombra `#3b2da8`
- **Marca / secundario**: `#7dcdf4` (Kumon Blue) + sombra `#4fb3e8`, texto `#1F1F1F`
- **Correcto**: `#00A63E` sobre tinte `#ACF0D1`
- **Error**: `#D4183D` (mínimo, nunca dominante)
- **Celebración**: `#FFB200`
- **Bordes**: `#e3e5ec` (Mist)

### Prompts de componente de ejemplo
1. **Botón primario**: "Botón con texto 'EMPEZAR'. Fondo `#4F3DD9`, texto `#ffffff`, radius 12px, Nunito 15px peso 800, letter-spacing 0.05em, padding 16px 32px, `box-shadow: 0 4px 0 #3b2da8`. En `:active`: `translateY(4px)` y sombra 0."
2. **Titular**: "Titular 'a practicar.' en Baloo 2, 48px móvil / 64px desktop, peso 800, color `#4F3DD9`, letter-spacing -0.02em."
3. **Tecla numérica**: "Tecla '7' de 64×64px, fondo `#ffffff`, borde 2px `#e3e5ec`, radius 16px, dígito Baloo 2 24px color `#1F1F1F`, `box-shadow: 0 2px 0 #e3e5ec`."

## Quick Start

### Tailwind v4

```css
@theme {
  /* Colores */
  --color-kumon-blue: #7dcdf4;
  --color-kumon-blue-dark: #4fb3e8;
  --color-kumon-blue-light: #e4f5fd;
  --color-indigo: #4f3dd9;
  --color-indigo-dark: #3b2da8;
  --color-mint: #acf0d1;
  --color-sunshine-yellow: #ffb200;
  --color-pink: #ff83ae;
  --color-success: #00a63e;
  --color-error: #d4183d;
  --color-snow-white: #ffffff;
  --color-cloud: #f8f9fa;
  --color-mist: #e3e5ec;
  --color-silver: #bdbdbd;
  --color-graphite: #6b7280;
  --color-ink: #1f1f1f;

  /* Tipografía */
  --font-display: 'Baloo 2', ui-sans-serif, system-ui, sans-serif;
  --font-body: 'Nunito', ui-sans-serif, system-ui, sans-serif;

  /* Escala (móvil; escalar con md:) */
  --text-caption: 13px;
  --text-body: 15px;
  --text-heading-sm: 17px;
  --text-heading: 24px;
  --text-heading-lg: 32px;
  --text-display: 48px;
  --text-flashcard: 56px;

  /* Espaciado */
  --spacing-8: 8px;
  --spacing-12: 12px;
  --spacing-16: 16px;
  --spacing-24: 24px;
  --spacing-32: 32px;
  --spacing-40: 40px;
  --spacing-48: 48px;
  --spacing-64: 64px;
  --spacing-80: 80px;
  --spacing-96: 96px;

  /* Radius */
  --radius-buttons: 12px;
  --radius-inputs: 12px;
  --radius-cards: 16px;
  --radius-keys: 16px;
}
```

### Fuentes (Google Fonts vía next/font)

```ts
import { Baloo_2, Nunito } from 'next/font/google';

const balloo = Baloo_2({ subsets: ['latin'], weight: ['700', '800'], variable: '--font-display' });
const nunito = Nunito({ subsets: ['latin'], weight: ['500', '700', '800'], variable: '--font-body' });
```

## Fuentes de la paleta
- Hex extraídos de variables `:root` del CSS de producción de https://www.kumon.co.uk/ (2026-07-02). Kumon MX está tras Cloudflare; Kumon UK comparte el sistema de diseño global.
- `#00A63E` / `#D4183D` provienen de la capa de rediseño `new-2025.css` de Kumon UK.
- Kumon no publica Pantone oficial; "Kumon Blue" se define simbólicamente (cielo, inteligencia, honestidad) en kumongroup.com.
