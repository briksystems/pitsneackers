/* =========================================================================
   TILES DE NAVEGACIÓN (las fotos grandes/chicas de la página de inicio)
   =========================================================================

   Aquí controlas qué foto sale en cada tile (Nike, Jordan, SB, Travis
   Scott, Adidas, J Balvin, A Ma Maniere, Nigel Sylvester) sin tocar
   ningún otro archivo.

   -------------------------------------------------------------------------
   REGLA DE ORO PARA LAS FOTOS (para evitar problemas de derechos):
   ✅ SÍ: una foto tuya de un par físico real (como las que ya subiste a
      la carpeta "images/" para el catálogo).
   ❌ NO: logos oficiales de las marcas, ni fotos de estudio/publicidad
      encontradas en internet (aunque no tengan marca de agua) — esas
      son propiedad de quien las tomó/publicó, casi siempre la marca.

   -------------------------------------------------------------------------
   CÓMO CAMBIAR LA FOTO DE UN TILE:
   1) Si es una foto tuya nueva: súbela a la carpeta "images/" (igual que
      en products.js), y escribe "images/nombre-del-archivo.jpg" abajo.
   2) Si prefieres usar un link externo (ej. una foto tuya que subiste a
      Imgur u otro sitio): pega la URL completa, algo como
      "https://i.imgur.com/xxxxxxx.jpg" — tiene que ser el link DIRECTO
      a la imagen (termina en .jpg/.png), no el link de la página.
   3) Si todavía no tienes foto para ese tile, deja "image": "" y se ve
      con un color sólido y el nombre — no se rompe nada.

   CAMPOS:
   - label: el texto que aparece sobre la foto
   - image: la ruta o el link de la foto (o "" si no hay)
   - brand: a qué marca filtra al hacer clic ("Jordan", "Nike" o "Adidas")
   - edition: (opcional, solo Jordan) a qué colaboración filtra, ej.
              "Travis Scott", "J Balvin", "A Ma Maniere", "Nigel Sylvester"
   - sb: true (solo para el tile de "SB") — agrupa Nike Dunk SB y
         Jordan x SB juntos, sin importar la marca
   ========================================================================= */

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
