# Cazador de Tendencias

Página con IA para un **emprendedor que importa ropa para revender en Uruguay**. Escribís una prenda (por ejemplo *"camisas mujer"* o *"bermuda"*) y la página muestra:

- **Prenda del mes**: la que más conviene destacar este mes. La elige la IA una vez por mes y todos ven la misma.
- **Análisis de tendencia**: veredicto, apuesta principal, cuántas variantes pasan los 4 filtros y mes ideal para vender.
- **Qué se está usando**: cortes, estilos, colores y telas, con estado *Fuerte / En subida / Bajando*.
- **Comparar con Shein**: lo que pagaría un cliente uruguayo comprando directo en Shein contra tu precio.
- **Tendencias**: una tarjeta por estilo con *Números* (compra afuera, puesta en Uruguay, precio de venta y margen), *Dónde se vio la tendencia* (TikTok, Instagram, Pinterest, Amazon), *Cómo venderla* (foto, copy, gancho, colores, marcas y accesos para ver fotos reales) y *Dónde traerla* (AliExpress, Alibaba, 1688, Temu, Amazon, mayoristas de Brasil y de Uruguay).
- **Ver en las webs**: Mercado Libre UY, TikTok, Instagram, Pinterest, Amazon, Shein, Google Imágenes y Google Trends con la búsqueda hecha.
- **Supuestos de importación**: dólar, envío, régimen (prestación única, franquicia), importación formal y Mercosur. Todo se recalcula al cambiarlos.
- **Público**: Todos, Mujer, Hombre o Niños. Si escribís "mujer", "hombre", "niños", etc., se detecta solo.

> Proyecto del desafío **"El Artefacto Ecommerce con IA"**, propuesta 10 *El Cazador de Tendencias*. Introducción a la Tecnología y Cultura Digital · Licenciatura en Negocios Digitales · Universidad ORT Uruguay · 2026.

## Archivos

| Archivo | Qué es |
|---|---|
| `index.html` | La página completa (HTML, CSS y JavaScript). |
| `server.js` | Servidor para Render: sirve la página, llama a la IA (Google Gemini, plan gratis) con la clave guardada en Render y elige la Prenda del mes. Sin dependencias. |
| `package.json` | Datos del proyecto para Node. |
| `README.md` | Este archivo. |

La misma `index.html` también funciona como artifact dentro de Claude; ahí usa la IA de Claude.

## Publicarla en Render (gratis)

### 1. Clave gratis de Gemini

1. Entrá a <https://aistudio.google.com> con una cuenta de Google.
2. Tocá el ícono de la llave (abajo a la izquierda) o **Dashboard → API keys**, y después **Create API key**.
3. Copiá la clave (empieza con `AIza`). **No la subas a GitHub.** Va solo en Render.

### 2. Repositorio en GitHub

1. Creá un repositorio nuevo (por ejemplo `cazador-de-tendencias`), público.
2. Tocá **uploading an existing file** y subí los 4 archivos: `index.html`, `server.js`, `package.json` y `README.md`.
3. Tocá **Commit changes**.

### 3. Web Service en Render

1. **+ New → Web Service** → elegí el repositorio → **Connect**.
2. Completá:
   - **Language:** Node
   - **Branch:** main
   - **Build Command:** `npm install`
   - **Start Command:** `node server.js`
   - **Instance Type:** Free
3. En **Environment Variables**: **Key** `GEMINI_API_KEY`, **Value** tu clave.
4. **Deploy Web Service**. Cuando diga **Live**, abrí el link: arriba tiene que decir **IA lista**.

### Ajustes opcionales (Environment Variables)

| Variable | Para qué | Por defecto |
|---|---|---|
| `LIMITE_POR_PERSONA` | Búsquedas por persona por día | `15` |
| `LIMITE_DIARIO` | Búsquedas totales por día | `300` |
| `MODELO` | Modelo de Gemini a probar primero | `gemini-3.5-flash-lite` |

## Si algo no anda

- **"Modo ejemplo" y aviso sobre `GEMINI_API_KEY`**: la variable no está cargada o tiene espacios. Revisala en Render → **Environment**.
- **"La IA gratis está saturada"**: Google limita los pedidos gratis por minuto y por día. Esperá un minuto; el cupo diario se renueva al otro día.
- **Tarda en cargar**: con el plan Free, Render duerme el servidor tras 15 minutos sin visitas; la siguiente visita tarda cerca de 1 minuto. Abrila un rato antes de presentar.
- **Errores**: Render → pestaña **Logs**.

## Cómo funciona

1. La página arma un pedido con la prenda, el público, la marca, el mes y el dólar, y se lo manda a `server.js` (`/api/ia`).
2. `server.js` le agrega la clave y se lo pasa a Gemini. Si un modelo no existe o está saturado, prueba el siguiente (Flash-Lite primero, que es el que más pedidos gratis acepta). La clave nunca llega al navegador.
3. La IA devuelve un JSON con 5 variantes; la página calcula costos, márgenes, comparación con Shein y proveedores con los supuestos de importación.
4. `/api/mes` devuelve la Prenda del mes. El servidor la elige la primera vez que alguien entra en el mes y la guarda; si Render reinicia, la vuelve a elegir.

### Fórmulas

- Puesta en Uruguay (courier) = (precio afuera + envío) × (1 + impuestos) × dólar.
- Margen = (precio de venta en Uruguay − puesta en Uruguay) ÷ precio de venta. Si no llegó a Uruguay, precio sugerido = puesta × 2.
- Shein al cliente = (precio Shein + envío) × 1,22 × dólar. Le gana a Shein si tu precio no supera 2,5 veces ese valor.

## Limitaciones (para la defensa)

- **Puntajes y precios los estima la IA** con lo que sabe; no son datos en tiempo real. Instagram, TikTok y Pinterest no dejan leer sus datos ni usar sus fotos en otras páginas; por eso cada tendencia trae enlaces a la búsqueda real y accesos para ver fotos.
- **Importación formal (70 %) y Mercosur (30 %) son estimaciones** editables. Confirmar con un despachante.
- **Plan gratis de Gemini**: tiene límite diario y Google puede usar los pedidos para mejorar sus productos. No escribir datos personales en el buscador.
- Desde el 1/5/2026 la **franquicia** es para uso personal (3 envíos y US$ 800 por año). Para revender se usa la prestación única o una importación formal.
