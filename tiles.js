/* =========================================================================
   TILES DE "EXPLORA POR MARCA" (la cuadrícula de la página de inicio)
   =========================================================================

   Aquí controlas la foto y el color de cada cuadro, sin tocar ningún
   otro archivo. Son 12 en total, en el mismo orden que tu ejemplo.

   -------------------------------------------------------------------------
   REGLA DE ORO PARA LAS FOTOS (para evitar problemas de derechos):
   ✅ SÍ: una foto tuya de un par físico real (como las que ya subiste a
      la carpeta "images/" para el catálogo).
   ❌ NO: logos oficiales de las marcas, ni fotos de estudio/publicidad
      encontradas en internet (aunque no tengan marca de agua) — esas
      son propiedad de quien las tomó/publicó, casi siempre la marca.
   Por eso los cuadros usan el NOMBRE de la marca en texto, nunca el
   logo oficial (el Jumpman, el swoosh, el trébol, etc. son marcas
   registradas y no se pueden reproducir).

   -------------------------------------------------------------------------
   CÓMO CAMBIAR LA FOTO O EL COLOR DE UN CUADRO:
   1) Si es una foto tuya nueva: súbela a la carpeta "images/" (igual que
      en products.js), y escribe "images/nombre-del-archivo.jpg" abajo.
   2) Si todavía no tienes foto para ese cuadro, deja "image": "" — se ve
      con el color sólido de "color" y el nombre, sin romper nada.
   3) "color" es el fondo del cuadro cuando NO hay foto (o la capa de
      color detrás de la foto). Usa cualquier color en formato "#RRGGBB".

   CAMPOS:
   - label: el texto que aparece sobre el cuadro
   - image: la ruta de la foto (o "" si no hay)
   - color: color de fondo en formato "#RRGGBB"
   - brand: a qué marca filtra al hacer clic
   - edition: (opcional, solo Jordan) a qué colaboración filtra
   - sb: true (solo para el cuadro de "Nike SB") — agrupa cualquier Dunk
     SB sin importar de qué marca esté registrado
   ========================================================================= */

window.PITSNEAKERS_TILES = [
  { label: "Jordan", image: "images/jordan1-lost-and-found.jpg", color: "#171817", brand: "Jordan" },
  { label: "Nike SB", image: "images/dunk-sb-jarritos.jpg", color: "#32A0AA", sb: true },
  { label: "Travis Scott", image: "images/jordan1-travis-mocha-low.jpg", color: "#544934", brand: "Jordan", edition: "Travis Scott" },
  { label: "Nike", image: "", color: "#B9211A", brand: "Nike" },
  { label: "A Ma Manière", image: "images/jordan3-amamaniere-white.jpg", color: "#BDB3A8", brand: "Jordan", edition: "A Ma Maniere" },
  { label: "J. Balvin", image: "images/jordan3-rio-balvin.jpg", color: "#C5DACC", brand: "Jordan", edition: "J Balvin" },
  { label: "New Balance", image: "", color: "#EBEBEB", brand: "New Balance" },
  { label: "Converse", image: "", color: "#141512", brand: "Converse" },
  { label: "Adidas", image: "", color: "#315B8D", brand: "Adidas" },
  { label: "Asics", image: "", color: "#EFEDE9", brand: "Asics" },
  { label: "Vans", image: "", color: "#E4E4E2", brand: "Vans" },
  { label: "Yeezy", image: "", color: "#A59585", brand: "Yeezy" },
];
window.PITSNEAKERS_TILES_BIG = [
  { label: "Nike", image: "images/dunk-sb-jarritos.jpg", brand: "Nike" },
  { label: "Jordan", image: "images/jordan1-lost-and-found.jpg", brand: "Jordan" },
  { label: "SB", image: "images/jordan4-sb-navy.jpg", sb: true },
];

window.PITSNEAKERS_TILES_SMALL = [
  { label: "Travis Scott", image: "images/jordan1-travis-mocha-low.jpg", brand: "Jordan", edition: "Travis Scott" },
  { label: "Adidas", image: "", brand: "Adidas" },
  { label: "J Balvin", image: "images/jordan3-rio-balvin.jpg", brand: "Jordan", edition: "J Balvin" },
  { label: "Nigel Sylvester", image: "", brand: "Jordan", edition: "Nigel Sylvester" },
];
