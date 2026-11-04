# 🏠 Web en 3 capas: HTML · CSS · JavaScript

Página interactiva para explicar a los estudiantes **la diferencia entre HTML, CSS y JavaScript** y **cómo se complementan** en el desarrollo web.

Está hecha solo con HTML, CSS y JavaScript, sin frameworks ni instalaciones, para que el propio código sirva como ejemplo.

## ¿Qué incluye?

| Sección | Qué se aprende |
|---|---|
| **La casa** | Analogía: HTML = estructura, CSS = pintura, JS = electricidad. Con interruptores se enciende cada capa por separado o todas juntas. |
| **Cada uno por separado** | Pestañas con qué es cada tecnología, un ejemplo de código y su resultado real. |
| **Laboratorio** | Una tarjeta de perfil real. Se activan y desactivan los archivos `index.html`, `styles.css` y `script.js` y se ve el resultado, el código y la consola del navegador (incluidos los errores cuando falta el HTML). |
| **¿Cómo se complementan?** | Diagrama de Venn interactivo con las 7 combinaciones posibles y una tabla comparativa. |
| **El navegador paso a paso** | Animación de cómo el navegador lee el HTML, construye el DOM, aplica el CSS, pinta la pantalla y ejecuta el JS. |
| **Quiz** | Siete preguntas de repaso con retroalimentación. |

## Estructura

```
html-css-js-interactivo/
├── index.html      ← estructura y contenido
├── css/styles.css  ← diseño, colores y animaciones
├── js/main.js      ← interactividad
└── README.md
```

## Verlo en tu computador

Abre `index.html` con doble clic en cualquier navegador moderno (Chrome, Edge, Firefox).

## Publicarlo en GitHub Pages

1. Crea un repositorio nuevo en <https://github.com/new> llamado `html-css-js-interactivo` (público y **sin** README).
2. En esta carpeta, conecta el repositorio y sube el código:
   ```bash
   git remote add origin https://github.com/TU-USUARIO/html-css-js-interactivo.git
   git push -u origin main
   ```
3. En GitHub ve a **Settings → Pages**, en *Source* elige **Deploy from a branch**, rama **`main`** y carpeta **`/ (root)`**, y guarda.
4. En uno o dos minutos la página estará en
   `https://TU-USUARIO.github.io/html-css-js-interactivo/`

## Sugerencia para la clase

1. Empieza con **la casa**: pide a los estudiantes que adivinen qué pasará antes de encender cada capa.
2. Pasa a **cada uno por separado** para ver el código de cada tecnología.
3. En el **laboratorio**, prueben las combinaciones "raras" (solo CSS, solo JS) y lean juntos el error de la consola.
4. Cierra con el **diagrama de Venn**, el **navegador paso a paso** y el **quiz**.
