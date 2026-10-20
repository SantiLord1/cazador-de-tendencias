# Cazador de Tendencias

Herramienta web con IA que ayuda a un **emprendedor que importa ropa para revender en Uruguay** a decidir **qué prendas traer, de dónde y a qué precio venderlas**.

Escribís una prenda (por ejemplo, *"camisas mujer"* o *"bermuda"*) y la página muestra:

- qué estilos de esa prenda son tendencia en **TikTok, Instagram, Pinterest y Amazon**;
- cuánto cuesta comprarlos afuera y **cuánto quedan puestos en Uruguay**, con envío e impuestos;
- a cuánto se venden en Uruguay y el **margen** que deja cada uno;
- si el precio **le gana a Shein**;
- **dónde comprarlos** (AliExpress, Alibaba, 1688, Temu, Amazon, mayoristas de Brasil y de Uruguay);
- **cómo presentarlos**: fotos de referencia, colores, copy para Instagram y gancho para TikTok.

> Proyecto del desafío **"El Artefacto Ecommerce con IA"**, propuesta 10 *El Cazador de Tendencias / Curaduría de Productos*.
> Introducción a la Tecnología y Cultura Digital · Licenciatura en Negocios Digitales · Universidad ORT Uruguay · 2026.

---

## Funciones

| Sección | Qué hace |
|---|---|
| **Prenda del mes** | Una tarjeta con forma de notificación. Cada mes la IA elige la prenda que más conviene destacar según las tendencias y la estación en Uruguay, y arma un historial de meses anteriores. |
| **Buscar** | Buscador de prendas con marca opcional y público (**Todos · Mujer · Hombre · Niños**). Si escribís "mujer", "hombre", "niños", etc., el público se detecta solo. |
| **Análisis de tendencia** | Veredicto, apuesta principal, variantes analizadas, cuántas pasan los 4 filtros y mes ideal para vender. |
| **Qué se está usando** | Radiografía de la prenda: cortes, estilos, colores y telas, con estado **Fuerte / En subida / Bajando**. |
| **Comparar con Shein** | Lo que pagaría un cliente uruguayo comprando directo en Shein contra tu precio de venta. |
| **Tendencias** | Una tarjeta por estilo con 5 cuadrantes: fotos, números, dónde se vio la tendencia, cómo venderla y **dónde traerla**. |
| **Ver en las webs** | Accesos directos con la búsqueda ya hecha en Mercado Libre UY, TikTok, Instagram, Pinterest, Amazon, Shein, Google Imágenes y Google Trends. |
| **Supuestos de importación** | Dólar, envío, régimen de entrada, impuestos y costos de importación formal y Mercosur. Todo se recalcula al cambiarlos. |

### Los 4 filtros

1. **Tendencia vs. moda pasajera**: ¿le queda al menos una temporada más?
2. **¿Sirve para Uruguay?**: clima y estilo locales.
3. **¿Hay lugar acá?**: poca oferta o mala oferta en el mercado uruguayo.
4. **¿Le gana a Shein?**: tu precio no supera 2,5 veces lo que el cliente pagaría en Shein (ver fórmulas).

La **apuesta principal** es la tendencia que pasa más filtros; si empatan, gana la de mayor puntaje.

---

## Cómo usarla

La página es **un solo archivo HTML**, sin instalación ni servidor propio. Funciona de tres formas:

| Modo | Cuándo | IA | Datos y fotos que suben |
|---|---|---|---|
| **Dentro de Claude** | Publicada como artifact en claude.ai | La de la cuenta de Claude de quien la abre | Base de datos compartida del artifact |
| **Con clave de API** | Abierta desde GitHub Pages o el archivo local, con una clave cargada en *Supuestos de importación* | API de Claude (Anthropic) | Se guardan en el navegador (localStorage) |
| **Modo ejemplo** | Sin Claude y sin clave | No hay búsqueda en vivo | Muestra el ejemplo precargado de bermudas |

### Abrirla en la computadora

1. Descargá o cloná el repositorio.
2. Abrí `index.html` con doble clic. También funciona sin servidor.

### Activar la búsqueda en vivo fuera de Claude

1. Conseguí una clave de la API de Claude en <https://console.anthropic.com>.
2. En la página, abrí **Supuestos de importación**, pegá la clave y tocá **Guardar clave**.
3. La clave queda guardada **solo en tu navegador**. **Nunca la subas al repositorio**: cualquiera que la vea podría usarla a tu costo.

El modelo por defecto es `claude-sonnet-5-5` y se puede cambiar en el mismo panel.

### Publicarla gratis con GitHub Pages

Ver [`docs/publicar-en-github.md`](docs/publicar-en-github.md).

---

## Estructura del repositorio

```
cazador-de-tendencias/
├── index.html              # la página completa (HTML + CSS + JavaScript)
├── data/
│   ├── biblioteca.js       # biblioteca de fotos por tipo de prenda (la usa la página)
│   └── biblioteca.json     # la misma biblioteca en JSON, para leer o reutilizar
├── img/
│   └── biblioteca/         # 51 fotos de referencia (Unsplash, licencia libre)
├── docs/
│   ├── como-funciona.md    # arquitectura, IA, fórmulas y decisiones
│   └── publicar-en-github.md
├── CREDITOS.md             # fotógrafo y enlace de cada foto
├── LICENSE
└── README.md
```

---

## Tecnología

- **HTML, CSS y JavaScript puro**, sin frameworks ni compilación.
- **IA**: Claude (Anthropic). Dentro de Claude usa la capacidad `sample` del artifact; fuera de Claude llama a la API de Mensajes de Anthropic desde el navegador.
- **Datos**: base de datos del artifact (`db`) dentro de Claude, o `localStorage` fuera.
- **Fotos**: biblioteca propia de 51 fotos y fotos que suben los usuarios (pegar con Ctrl+V, arrastrar o subir).
- **Tipografías**: Bodoni Moda y Albert Sans (Google Fonts).

El detalle de la arquitectura, los pedidos a la IA y las fórmulas está en [`docs/como-funciona.md`](docs/como-funciona.md).

---

## Limitaciones (importante para la defensa)

- **Los puntajes de tendencia y los precios los estima la IA** con lo que sabe; no son datos en tiempo real. Instagram, TikTok y Pinterest no permiten leer sus datos libremente, y Shein bloquea las consultas automáticas. Por eso cada tendencia trae enlaces a la búsqueda real ("Dónde se vio la tendencia", "Ver en Shein", "Buscar" en cada proveedor y la sección "Ver en las webs").
- **Las fotos son de referencia**, elegidas según el tipo de prenda. Una página no puede traer fotos de otras webs mientras alguien la usa (bloqueo de seguridad del navegador y de Claude). Para mostrar el producto exacto, se pega la foto en la tarjeta.
- **Los porcentajes de importación formal (70 %) y Mercosur (30 %) son estimaciones** y se pueden cambiar. Hay que confirmarlos con un despachante de aduana antes de importar.
- La **franquicia** de compras al exterior es para uso personal. Para revender se usa la prestación única o una importación formal.

---

## Fuentes

- Régimen de franquicias desde el 1/5/2026 (Decreto 50/2026): [El Observador](https://www.elobservador.com.uy/economia-y-empresas/nuevo-regimen-compras-web-el-exterior-franquicias-que-cambiara-el-usuario-y-como-se-facturara-el-iva-n6041921) · [Ámbito](https://www.ambito.com/uruguay/efecto-temu-ya-tiene-fecha-el-tope-anual-us-800-compras-online-franquicia-n6256683)
- Dólar de referencia cercano a $ 40: [Ámbito](https://www.ambito.com/uruguay/el-dolar-subio-y-cerro-firme-encima-los-40-n6307931)
- Fotos: [Unsplash](https://unsplash.com) (ver [`CREDITOS.md`](CREDITOS.md))
