/* =========================================================================
   PRODUCTOS DE PITSNEAKERS
   =========================================================================

   ESTE es el archivo que editas para agregar o quitar pares. No necesitas
   tocar ningún otro archivo (index.html y app.js no se tocan).

   -------------------------------------------------------------------------
   PARA AGREGAR UN PAR NUEVO:
   1) Copia uno de los bloques de abajo completo (desde la { hasta la } con
      la coma), pégalo al final de la lista (justo antes del ]; final).
   2) Cambia los datos (marca, modelo, talla, precio, etc.).
   3) Si tienes foto: sube el archivo de imagen a la carpeta "images/" de
      este mismo proyecto, y escribe el nombre EXACTO del archivo en el
      campo "imagen" (ej: "images/mi-foto.jpg"). Usa fotos .jpg o .png.
      Si no tienes foto todavía, deja "imagen": "" (vacío) y se muestra
      un ícono de zapato en su lugar.

   PARA QUITAR UN PAR:
   Borra su bloque completo (desde la { hasta la } con la coma).

   CAMPOS DISPONIBLES:
   - marca:    "Jordan", "Nike" o "Adidas" (son las únicas 3 que aparecen
               en la navegación de la página)
   - modelo:   para Jordan usa "Jordan 1" a "Jordan 15". Para las demás
               marcas escribe el nombre libremente (ej: "Air Force 1",
               "Samba OG"...)
   - corte:    SOLO aplica a Jordan → "Standard", "Low", "Mid" o "High"
   - edicion:  SOLO aplica a Jordan → "Retro", "Travis Scott", "J Balvin",
               "Off-White", "Trophy Room", "Fragment x Union",
               "A Ma Maniere", "Nigel Sylvester", o cualquier colaboración
               nueva que escribas
   - color:    el nombre del colorway (ej: "Reimagined", "Bred", "Jarritos")
   - talla:    la talla en formato US (ej: 9.5)
   - precio:   el precio en pesos colombianos, solo números (sin puntos)
   - condicion:"Nuevo" o "Usado"
   - nota:     texto libre opcional para detalles extra (ej: "Caja dañada
               (la tapa)"). Se muestra junto a la condición. Si no aplica,
               no escribas este campo (o déjalo como "").
   - vendedor: nombre de quien consignó el par (para saber a quién pagarle)
   - contactoVendedor: su número de WhatsApp o contacto
   - imagen:   ruta de la foto dentro de "images/", o "" si no hay foto
               todavía
   - verificado: true o false (SIN comillas).
               true  = el par YA tiene el trade/comisión incluido → se ve
                       el sello naranja "PITS" y no se cobra nada extra.
               false = el par TODAVÍA NO se ha verificado → NO se ve el
                       sello, y en la página se avisa que cuesta
                       $20.000 adicionales verificarlo.
               Si no escribes este campo, se asume true.

   El código de autenticación (serial) se genera solo — no lo escribas tú.
   ========================================================================= */

window.PITSNEAKERS_PRODUCTS = [
  {
    marca: "Jordan", modelo: "Jordan 3", corte: "Standard", edicion: "Retro",
    color: "Reimagined", talla: 11, precio: 1600000, condicion: "Nuevo",
    vendedor: "Por asignar", contactoVendedor: "Por asignar",
    imagen: "images/jordan3-reimagined.jpg",
    verificado: true
  },
  {
    marca: "Nike", modelo: "Dunk SB", corte: "", edicion: "",
    color: "Jarritos", talla: 9, precio: 3000000, condicion: "Nuevo",
    vendedor: "Por asignar", contactoVendedor: "Por asignar",
    imagen: "images/dunk-sb-jarritos.jpg",
    verificado: true
  },
  {
    marca: "Jordan", modelo: "Jordan 1", corte: "Standard", edicion: "Retro",
    color: "Lost and Found", talla: 10.5, precio: 1500000, condicion: "Nuevo",
    vendedor: "Por asignar", contactoVendedor: "Por asignar",
    imagen: "images/jordan1-lost-and-found.jpg",
    verificado: true
  },
  {
    marca: "Jordan", modelo: "Jordan 1", corte: "Standard", edicion: "Retro",
    color: "Lost and Found", talla: 10, precio: 1300000, condicion: "Nuevo",
    vendedor: "Por asignar", contactoVendedor: "Por asignar",
    imagen: "images/jordan1-lost-and-found.jpg",
    verificado: true
  },
  {
    marca: "Jordan", modelo: "Jordan 1", corte: "Low", edicion: "Travis Scott",
    color: "Mocha", talla: 8.5, precio: 6100000, condicion: "Nuevo",
    vendedor: "Por asignar", contactoVendedor: "Por asignar",
    imagen: "images/jordan1-travis-mocha-low.jpg",
    verificado: true
  },
  {
    marca: "Jordan", modelo: "Jordan 1", corte: "Standard", edicion: "Trophy Room",
    color: "", talla: 10.5, precio: 1300000, condicion: "Nuevo",
    vendedor: "Por asignar", contactoVendedor: "Por asignar",
    imagen: "images/jordan1-trophy-room.jpg",
    verificado: true
  },
  {
    marca: "Jordan", modelo: "Jordan 1", corte: "Low", edicion: "Travis Scott",
    color: "Reverse Mocha", talla: 9.5, precio: 6100000, condicion: "Nuevo",
    vendedor: "Por asignar", contactoVendedor: "Por asignar",
    imagen: "images/jordan1-travis-reverse-mocha.jpg",
    verificado: true
  },
  {
    marca: "Jordan", modelo: "Jordan 1", corte: "Standard", edicion: "Fragment x Union",
    color: "", talla: 11, precio: 1200000, condicion: "Nuevo",
    vendedor: "Por asignar", contactoVendedor: "Por asignar",
    imagen: "images/jordan1-fragment-union.jpg",
    verificado: true
  },
  {
    marca: "Jordan", modelo: "Jordan 5", corte: "Standard", edicion: "Retro",
    color: "Reimagined", talla: 9.5, precio: 1550000, condicion: "Nuevo",
    vendedor: "Por asignar", contactoVendedor: "Por asignar",
    imagen: "images/jordan5-reimagined.jpg",
    verificado: true
  },
  {
    marca: "Jordan", modelo: "Jordan 3", corte: "Standard", edicion: "A Ma Maniere",
    color: "White Navy", talla: 9.5, precio: 900000, condicion: "Nuevo",
    vendedor: "Por asignar", contactoVendedor: "Por asignar",
    imagen: "images/jordan3-amamaniere-white.jpg",
    verificado: true
  },
  {
    marca: "Jordan", modelo: "Jordan 3", corte: "Standard", edicion: "A Ma Maniere",
    color: "Black Mauve", talla: 9.5, precio: 900000, condicion: "Nuevo",
    vendedor: "Por asignar", contactoVendedor: "Por asignar",
    imagen: "images/jordan3-amamaniere-black.jpg",
    verificado: true
  },
  {
    marca: "Jordan", modelo: "Jordan 4", corte: "Standard", edicion: "Retro",
    color: "Denim", talla: 9.5, precio: 900000, condicion: "Nuevo",
    vendedor: "Por asignar", contactoVendedor: "Por asignar",
    imagen: "images/jordan4-denim.jpg",
    verificado: true
  },
  {
    marca: "Jordan", modelo: "Jordan 4", corte: "Standard", edicion: "Retro",
    color: "Craft", talla: 9.5, precio: 980000, condicion: "Nuevo",
    vendedor: "Por asignar", contactoVendedor: "Por asignar",
    imagen: "images/jordan4-craft.jpg",
    verificado: true
  },
  {
    marca: "Jordan", modelo: "Jordan 4", corte: "Standard", edicion: "Retro",
    color: "Yellow Thunder", talla: 10, precio: 1400000, condicion: "Nuevo",
    vendedor: "Por asignar", contactoVendedor: "Por asignar",
    imagen: "images/jordan4-yellow-thunder.jpg",
    verificado: true
  },
  {
    marca: "Jordan", modelo: "Jordan 4", corte: "Standard", edicion: "Retro",
    color: "Yellow Thunder", talla: 10, precio: 1400000, condicion: "Nuevo",
    vendedor: "Por asignar", contactoVendedor: "Por asignar",
    imagen: "images/jordan4-yellow-thunder.jpg",
    verificado: true
  },

  // --- agregados el 4 de julio ---
  {
    marca: "Jordan", modelo: "Jordan 4", corte: "Standard", edicion: "SB",
    color: "Navy", talla: 9, precio: 1200000, condicion: "Nuevo",
    nota: "Caja dañada (la tapa)",
    vendedor: "Por asignar", contactoVendedor: "Por asignar",
    imagen: "images/jordan4-sb-navy.jpg",
    verificado: true
  },
  {
    // ⚠️ sin foto todavía: la que mandaron tenía marca de agua de otra página (sneakermarket.ro),
    // así que la dejé en "" hasta que llegue una foto real de este par.
    marca: "Jordan", modelo: "Jordan 1", corte: "Low", edicion: "Travis Scott",
    color: "Tropical Pink", talla: 8.5, precio: 1800000, condicion: "Nuevo",
    vendedor: "Por asignar", contactoVendedor: "Por asignar",
    imagen: "",
    verificado: true
  },
  {
    marca: "Jordan", modelo: "Jordan 3", corte: "Standard", edicion: "J Balvin",
    color: "Rio", talla: 8, precio: 950000, condicion: "Usado",
    vendedor: "Por asignar", contactoVendedor: "Por asignar",
    imagen: "images/jordan3-rio-balvin.jpg",
    verificado: true
  },
];
