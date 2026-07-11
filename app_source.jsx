import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  ShoppingBag, Search, X, Plus, Check, Download, Lock,
  MessageCircle, Package, TrendingUp, Trash2, Clock, ArrowLeft, Repeat, Filter, Tag as TagIcon
} from 'lucide-react';
import * as XLSX from 'xlsx';

/* =========================================================================
   PITSNEAKERS — prototipo de catálogo + backoffice de stock
   Paleta: blanco y negro, con naranja SOLO en detalles/acentos.
   Los datos viven en window.storage cuando corre dentro de Claude
   (compartido entre quien vea este artefacto). Si se exporta y se aloja
   afuera (Netlify, GitHub Pages, etc.) cae a localStorage del navegador.
   ========================================================================= */

const MASCOT_SRC = 'images/mascot.png';

const WHATSAPP_NUMBER = '573116824142';
const COMMISSION = 50000;

const BRANDS = ['Jordan', 'Nike', 'Adidas', 'New Balance', 'Converse', 'Asics', 'Vans', 'Yeezy'];

const JORDAN_MODELS = Array.from({ length: 15 }, (_, i) => `Jordan ${i + 1}`);
const JORDAN_VARIANTS = ['Standard', 'Low', 'Mid', 'High'];
/* Sugerencias para el campo de edición (es texto libre, así que cualquier
   colaboración nueva que no esté aquí igual funciona y genera su propio código). */
const JORDAN_EDITIONS = ['Retro', 'Travis Scott', 'J Balvin', 'Off-White', 'Trophy Room', 'Fragment x Union', 'A Ma Maniere', 'Nigel Sylvester', 'SB'];
const KNOWN_EDITION_CODES = {
  Retro: '', 'Travis Scott': 'TRV', 'J Balvin': 'BLV', 'Off-White': 'OW',
  'Trophy Room': 'TR', 'Fragment x Union': 'FXU', 'A Ma Maniere': 'AMM', 'Nigel Sylvester': 'NS', SB: 'SB',
};

const NIKE_MODELS = ['Air Force 1', 'Air Max', 'Dunk', 'Dunk SB', 'Nike Mind 001', 'Nike Mind 002', 'Otro'];
const CONDITIONS = ['Nuevo', 'Usado'];

const SIZE_OPTIONS = [4, 4.5, 5, 5.5, 6, 6.5, 7, 7.5, 8, 8.5, 9, 9.5, 10, 10.5, 11, 11.5, 12, 13];

/* Paleta: blanco y negro en todo, naranja SOLO como acento de marca. */
const ORANGE = '#C53C27';
const BLACK = '#0A0A0A';
const WHITE = '#FFFFFF';
const GREY_LINE = '#DADADA';
const GREY_TEXT = '#6B6B6B';
const TEAL = '#6CA0A5';
const CREAM = '#F7E9DE';

const DROPS = [
  { id: 1, title: "Travis Scott x Jordan 1 Low 'Shy Pink'", date: '2026-07-07' },
  { id: 2, title: "J Balvin x Jordan 6 'Golden Era'", date: '2026-07-15' },
  { id: 3, title: "Off-White x Jordan 4 'Sail'", date: '2026-07-22' },
];

const PAYMENT_METHODS = [
  'Zelle',
  'Bancolombia (transferencia)',
  'Davivienda (transferencia)',
  'Nequi',
  'Link de pago Bold (+5% del valor)',
  'Tarjeta de crédito o débito (+5% del valor)',
  'Pago a dos cuotas (más info con el administrador)',
];

const PROCESS_STEPS = {
  comprar: [
    { t: 'Elige tu par y reserva', d: 'Filtra por marca, talla y precio, y dale a "Reservar por WhatsApp": el equipo recibe el código exacto del par que quieres.' },
    { t: 'Confirman disponibilidad', d: 'Un administrador verifica que el par siga disponible.' },
    { t: 'Pagas y envías el comprobante', d: 'Eliges el medio de pago, pagas el valor del par y le mandas el comprobante al administrador.' },
    { t: 'Verificación de autenticidad', d: 'El equipo PITS revisa personalmente que el par sea 100% original.' },
    { t: 'Te notifican', d: 'Si todo está en orden, coordinan el envío. Si hay algún problema, te devuelven el 100% de tu dinero.' },
    { t: 'Recibes tu par', d: 'Llega a la puerta de tu casa en cualquier parte del país. El envío se paga contraentrega (aprox. $20.000 COP).' },
  ],
  vender: [
    { t: 'Contacta a un administrador', d: 'Cuéntale sobre el par que quieres vender, en el formato que te pidan.' },
    { t: 'Se publica en el catálogo', d: 'Tu par queda visible para toda la comunidad de Pitsneakers.' },
    { t: 'Cuando se venda, avisas', d: 'Le comunicas al administrador y envías el par a nuestro punto de verificación — el envío corre por tu cuenta.' },
    { t: 'Verificación + pin de autenticidad', d: 'El equipo revisa el par y le coloca el pin de PITS.' },
    { t: 'Recibes tu pago', d: 'Una vez verificado, te pagan lo acordado menos la comisión del servicio (actualmente $50.000 COP por par).' },
  ],
  intercambiar: [
    { t: 'Contacta a un administrador', d: 'Cuéntale qué par ofreces y cuál buscas — puedes mandar foto.' },
    { t: 'Ambos aceptan y pagan la comisión', d: 'Si las dos personas están de acuerdo, cada una paga la comisión de intercambio por adelantado.' },
    { t: 'Envían los pares al punto de verificación', d: 'Cada quien asume el costo de su propio envío.' },
    { t: 'Verificación', d: 'El equipo revisa que ambos pares sean auténticos.' },
    { t: 'Se hace el intercambio', d: 'Se despachan los pares — el envío final corre por cuenta de cada usuario.' },
  ],
};

const fmtCOP = (n) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n || 0);

const shortCode = (text) => {
  if (!text) return '';
  return text
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w[0].toUpperCase())
    .join('')
    .slice(0, 4);
};

function computeSerial(draft, existingItems) {
  let base = '';
  const colorCode = shortCode(draft.colorway);

  if (draft.brand === 'Jordan') {
    const num = draft.model.replace('Jordan', '').trim();
    const variantCode = { Low: 'L', Mid: 'M', High: 'H', Standard: '' }[draft.variant] || '';
    const editionCode = draft.edition in KNOWN_EDITION_CODES
      ? KNOWN_EDITION_CODES[draft.edition]
      : (draft.edition && draft.edition !== 'Retro' ? shortCode(draft.edition) : '');
    base = `J${num}${variantCode}${editionCode}`;
  } else if (draft.brand === 'Nike') {
    const modelMap = {
      'Air Force 1': 'AF1', 'Air Max': 'AM', Dunk: 'DK', 'Dunk SB': 'DKSB',
      'Nike Mind 001': 'MND1', 'Nike Mind 002': 'MND2',
    };
    base = `N${modelMap[draft.model] || shortCode(draft.model)}`;
  } else if (draft.brand === 'Adidas') {
    base = `AD${shortCode(draft.model)}`;
  } else {
    // cualquier otra marca (New Balance, Converse, Asics, Vans, Yeezy...):
    // 2 letras de la marca + código corto del modelo
    const brandCode = draft.brand.includes(' ')
      ? shortCode(draft.brand)
      : draft.brand.replace(/[^A-Za-z]/g, '').slice(0, 2).toUpperCase();
    base = `${brandCode}${shortCode(draft.model)}`;
  }

  const baseKey = `${base}${colorCode}`;
  const count = existingItems.filter((it) => it.serial && it.serial.startsWith(baseKey)).length;
  return `${baseKey}${count + 1}`;
}

/* clave que agrupa variantes (tallas/precios distintos) de la MISMA referencia */
function refKey(it) {
  return [it.brand, it.model, it.variant || '', it.edition || '', it.colorway || ''].join('|');
}

function dropStatus(dateStr) {
  const target = new Date(`${dateStr}T00:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const days = Math.round((target - today) / 86400000);
  if (days > 1) return { text: `Faltan ${days} días`, urgent: false, past: false };
  if (days === 1) return { text: 'Mañana', urgent: true, past: false };
  if (days === 0) return { text: '¡HOY SALE!', urgent: true, past: false };
  return { text: 'Ya disponible', urgent: false, past: true };
}

/* ---------------------------- storage helpers --------------------------- */

const hasCloudStorage = typeof window !== 'undefined' && !!window.storage;

async function loadKey(key) {
  try {
    if (hasCloudStorage) {
      const res = await window.storage.get(key, true);
      return res ? JSON.parse(res.value) : null;
    }
    const raw = localStorage.getItem(`pitsneakers_${key}`);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

async function saveKey(key, value) {
  try {
    if (hasCloudStorage) {
      await window.storage.set(key, JSON.stringify(value), true);
    } else {
      localStorage.setItem(`pitsneakers_${key}`, JSON.stringify(value));
    }
  } catch (e) {
    console.error('No se pudo guardar', key, e);
  }
}

/* ------------------------------ seed data -------------------------------- */

function buildSeed() {
  const raw = (typeof window !== 'undefined' && window.PITSNEAKERS_PRODUCTS) || [];
  const items = [];
  const push = (draft) => {
    const serial = computeSerial(draft, items);
    items.push({ id: `seed-${items.length + 1}`, status: 'disponible', dateAdded: '2026-07-04', serial, ...draft });
  };

  raw.forEach((p) => {
    push({
      brand: p.marca,
      model: p.modelo,
      variant: p.corte || 'Standard',
      edition: p.edicion || 'Retro',
      colorway: p.color || '',
      size: p.talla,
      price: Number(p.precio) || 0,
      condition: p.condicion || 'Nuevo',
      sellerName: p.vendedor || 'Por asignar',
      sellerContact: p.contactoVendedor || 'Por asignar',
      imageKey: p.imagen || '',
      nota: p.nota || '',
      // si no se especifica, asumimos que SÍ trae el trade/comisión incluida (ya verificado)
      verified: p.verificado !== undefined ? !!p.verificado : true,
    });
  });

  return { items, sales: [] };
}

/* ------------------------------ subcomponents ---------------------------- */

function Chip({ active, onClick, children, accent = BLACK }) {
  return (
    <button
      onClick={onClick}
      className="px-3 py-1.5 rounded-full text-sm font-bold border transition-colors"
      style={
        active
          ? { background: accent, color: WHITE, borderColor: accent }
          : { background: WHITE, color: BLACK, borderColor: GREY_LINE }
      }
    >
      {children}
    </button>
  );
}

/* chip circular para los números de Jordan: J1, J4, J11... */
function JordanCircle({ active, onClick, num }) {
  return (
    <button
      onClick={onClick}
      className="w-11 h-11 rounded-full flex items-center justify-center text-sm font-extrabold border-2 shrink-0 transition-colors"
      style={
        active
          ? { background: TEAL, color: WHITE, borderColor: TEAL }
          : { background: WHITE, color: BLACK, borderColor: BLACK }
      }
      title={`Jordan ${num}`}
    >
      J{num}
    </button>
  );
}

/* Tiles de "Explora por marca" (inspirados en el ejemplo que mandaste).
   Vienen de tiles.js — así los editas sin tocar este archivo. Si tiles.js
   no cargó por algún motivo, usamos estos valores por defecto para que
   la página no se rompa. */
const DEFAULT_TILES = [
  { label: 'Jordan', image: 'images/jordan1-lost-and-found.jpg', color: '#111111', brand: 'Jordan' },
  { label: 'Nike SB', image: 'images/dunk-sb-jarritos.jpg', color: '#2F7A78', sb: true },
  { label: 'Travis Scott', image: 'images/jordan1-travis-mocha-low.jpg', color: '#5C4B34', brand: 'Jordan', edition: 'Travis Scott' },
  { label: 'Nike', image: '', color: '#C53C27', brand: 'Nike' },
  { label: 'A Ma Manière', image: 'images/jordan3-amamaniere-white.jpg', color: '#C9BBA4', brand: 'Jordan', edition: 'A Ma Maniere' },
  { label: 'J. Balvin', image: 'images/jordan3-rio-balvin.jpg', color: '#AFCFBE', brand: 'Jordan', edition: 'J Balvin' },
  { label: 'New Balance', image: '', color: '#DCDCDC', brand: 'New Balance' },
  { label: 'Converse', image: '', color: '#111111', brand: 'Converse' },
  { label: 'Adidas', image: '', color: '#1F4E8C', brand: 'Adidas' },
  { label: 'Asics', image: '', color: '#F2F2F2', brand: 'Asics' },
  { label: 'Vans', image: '', color: '#FFFFFF', brand: 'Vans' },
  { label: 'Yeezy', image: '', color: '#B9A78C', brand: 'Yeezy' },
];
const CATEGORY_TILES = (typeof window !== 'undefined' && window.PITSNEAKERS_TILES) || DEFAULT_TILES;

function CategoryTile({ tile, onClick }) {
  const isLight = ['#FFFFFF', '#F2F2F2', '#DCDCDC', '#AFCFBE', '#C9BBA4'].includes((tile.color || '').toUpperCase());
  const labelColor = tile.image ? WHITE : (isLight ? BLACK : WHITE);
  return (
    <button
      onClick={onClick}
      className="relative overflow-hidden rounded-md text-left w-full h-40 md:h-48"
      style={{ background: tile.color || BLACK, border: isLight && !tile.image ? `1px solid ${GREY_LINE}` : 'none' }}
    >
      {tile.image && (
        <img src={tile.image} alt="" className="absolute inset-0 w-full h-full object-cover opacity-90" />
      )}
      {tile.image && (
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.55), rgba(0,0,0,0.05))' }} />
      )}
      <span
        className="absolute inset-0 flex items-center justify-center text-center px-2 font-extrabold text-lg md:text-xl"
        style={{ color: labelColor, fontFamily: "'Titan One', sans-serif" }}
      >
        {tile.label}
      </span>
      <span className="absolute bottom-2 right-2 w-7 h-7 rounded-full flex items-center justify-center" style={{ background: tile.image ? 'rgba(255,255,255,0.9)' : (isLight ? BLACK : WHITE) }}>
        <ArrowIcon color={tile.image ? BLACK : (isLight ? WHITE : BLACK)} />
      </span>
    </button>
  );
}

function ArrowIcon({ color }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14" /><path d="m12 5 7 7-7 7" />
    </svg>
  );
}

function ShoePlaceholder({ size = 56 }) {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center gap-1" style={{ background: '#F4F4F4' }}>
      <span style={{ fontSize: size, lineHeight: 1 }}>👟</span>
      <span className="text-[10px] font-semibold" style={{ color: GREY_TEXT }}>Foto próximamente</span>
    </div>
  );
}

function ProductPhoto({ imageKey, placeholderSize = 56 }) {
  const src = imageKey; // ruta relativa, ej. "images/foo.jpg"
  if (!src) return <ShoePlaceholder size={placeholderSize} />;
  return <img src={src} alt="" className="w-full h-full object-cover" />;
}

function ProductCard({ group, onOpen }) {
  const prices = group.variants.map((v) => v.price);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const samePrice = minPrice === maxPrice;
  const sizes = group.variants.map((v) => v.size).join(' · ');
  const condition = group.variants[0]?.condition || 'Nuevo';
  const nota = group.variants[0]?.nota;
  const imageKey = group.variants[0]?.imageKey;
  const verified = group.variants[0]?.verified !== false;

  return (
    <div
      className="rounded-md overflow-hidden flex flex-col cursor-pointer transition-transform hover:-translate-y-0.5"
      style={{ background: WHITE, border: `1px solid ${GREY_LINE}` }}
      onClick={() => onOpen(group)}
    >
      <div className="h-40 relative">
        <ProductPhoto imageKey={imageKey} />
        <span
          className="absolute top-2 left-2 text-[10px] font-bold px-2 py-1 rounded-full"
          style={{ background: WHITE, color: BLACK, border: `1px solid ${GREY_LINE}` }}
        >
          {condition} con caja{nota ? ` · ${nota}` : ''}
        </span>
        {verified ? (
          <span
            className="absolute top-2 right-2 text-[10px] font-extrabold px-2 py-1 rounded-full flex items-center gap-1"
            style={{ background: TEAL, color: WHITE }}
          >
            <Check size={10} /> PITS
          </span>
        ) : (
          <span
            className="absolute top-2 right-2 text-[10px] font-extrabold px-2 py-1 rounded-full"
            style={{ background: BLACK, color: WHITE }}
          >
            Por verificar
          </span>
        )}
      </div>
      <div className="p-4 flex flex-col gap-1 flex-1">
        <p className="text-[11px] tracking-widest uppercase font-extrabold" style={{ color: BLACK }}>
          {group.brand}
        </p>
        <h3 className="text-lg leading-tight font-extrabold" style={{ color: BLACK, fontFamily: "'Baloo 2', sans-serif" }}>
          {group.model}{group.variant && group.variant !== 'Standard' ? ` ${group.variant}` : ''}
        </h3>
        {group.edition && group.edition !== 'Retro' && (
          <p className="text-xs font-bold" style={{ color: TEAL }}>x {group.edition}</p>
        )}
        {group.colorway && <p className="text-sm" style={{ color: GREY_TEXT }}>{group.colorway}</p>}

        <p className="text-xs mt-1" style={{ color: GREY_TEXT }}>Tallas: {sizes}</p>

        <p className="text-xl font-extrabold mt-1" style={{ color: BLACK, fontFamily: "'Baloo 2', sans-serif" }}>
          {samePrice ? fmtCOP(minPrice) : `Desde ${fmtCOP(minPrice)}`}
        </p>
        {!verified && (
          <p className="text-[11px] font-semibold" style={{ color: '#B8860B' }}>+ $20.000 por verificación</p>
        )}

        <button
          onClick={(e) => { e.stopPropagation(); onOpen(group); }}
          className="mt-2 w-full flex items-center justify-center gap-2 py-2.5 rounded-md font-bold text-sm"
          style={{ background: BLACK, color: WHITE }}
        >
          Ver tallas y precios
        </button>
      </div>
    </div>
  );
}

function ProductDetailModal({ group, onClose, onOrder }) {
  const sorted = [...group.variants].sort((a, b) => Number(a.size) - Number(b.size) || 0);
  const [selectedId, setSelectedId] = useState(sorted[0]?.id);
  const [fav, setFav] = useState(false);
  const selected = sorted.find((v) => v.id === selectedId) || sorted[0];

  const verified = selected.verified !== false;
  const nota = selected.nota;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" style={{ background: 'rgba(10,10,10,0.75)' }}>
      <div className="w-full sm:max-w-lg max-h-[90vh] overflow-y-auto rounded-t-2xl sm:rounded-md" style={{ background: WHITE }}>
        <div className="relative h-64">
          <ProductPhoto imageKey={group.variants[0]?.imageKey} placeholderSize={72} />
          <button onClick={onClose} className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center" style={{ background: BLACK }}>
            <X size={16} color={WHITE} />
          </button>
          <button
            onClick={() => setFav((f) => !f)}
            className="absolute top-3 right-14 w-8 h-8 rounded-full flex items-center justify-center"
            style={{ background: WHITE, border: `1px solid ${GREY_LINE}` }}
            title="Favorito"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill={fav ? ORANGE : 'none'} stroke={fav ? ORANGE : BLACK} strokeWidth="2">
              <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.8 1-1a5.5 5.5 0 0 0 0-7.8Z" />
            </svg>
          </button>
          {verified ? (
            <span className="absolute top-3 left-3 text-[11px] font-extrabold px-2.5 py-1 rounded-full flex items-center gap-1" style={{ background: TEAL, color: WHITE }}>
              <Check size={11} /> Verificado PITS
            </span>
          ) : (
            <span className="absolute top-3 left-3 text-[11px] font-extrabold px-2.5 py-1 rounded-full" style={{ background: BLACK, color: WHITE }}>
              Aún sin verificar
            </span>
          )}
        </div>

        <div className="p-5">
          <p className="text-[11px] tracking-widest uppercase font-extrabold" style={{ color: BLACK }}>{group.brand}</p>
          <h2 className="text-2xl font-extrabold leading-tight" style={{ color: BLACK, fontFamily: "'Baloo 2', sans-serif" }}>
            {group.model}{group.variant && group.variant !== 'Standard' ? ` ${group.variant}` : ''}
          </h2>
          {group.edition && group.edition !== 'Retro' && <p className="text-sm font-bold mb-1" style={{ color: TEAL }}>x {group.edition}</p>}
          {group.colorway && <p className="text-sm mb-1" style={{ color: GREY_TEXT }}>{group.colorway}</p>}
          <p className="text-xs font-semibold mb-1" style={{ color: GREY_TEXT }}>{selected.condition || 'Nuevo'} · con caja{nota ? ` · ${nota}` : ''}</p>
          <p className="text-xs font-bold mb-3 flex items-center gap-1.5" style={{ color: '#1E8E3E' }}>
            <span className="w-2 h-2 rounded-full inline-block" style={{ background: '#1E8E3E' }} /> En stock
          </p>

          <p className="text-xs font-bold uppercase mb-2" style={{ color: BLACK }}>Elige tu talla</p>
          <div className="flex flex-wrap gap-2 mb-4">
            {sorted.map((v) => (
              <button
                key={v.id}
                onClick={() => setSelectedId(v.id)}
                className="px-3 py-2 rounded-md text-sm font-bold border-2"
                style={v.id === selectedId ? { background: TEAL, color: WHITE, borderColor: TEAL } : { background: WHITE, color: BLACK, borderColor: GREY_LINE }}
              >
                {v.size}
              </button>
            ))}
          </div>

          <p className="text-xs" style={{ color: GREY_TEXT }}>Código de autenticación</p>
          <p className="font-mono text-sm mb-3 flex items-center gap-1" style={{ color: BLACK }}><TagIcon size={12} /> {selected.serial}</p>

          <p className="text-3xl font-extrabold mb-1" style={{ color: BLACK, fontFamily: "'Baloo 2', sans-serif" }}>
            {fmtCOP(selected.price)}
          </p>
          {!verified && (
            <p className="text-xs font-semibold mb-4" style={{ color: '#B8860B' }}>
              + $20.000 por verificación (este par aún no tiene el trade incluido)
            </p>
          )}
          {verified && <div className="mb-4" />}

          <button
            onClick={() => onOrder(selected, group)}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-md font-bold text-sm"
            style={{ background: BLACK, color: WHITE }}
          >
            <MessageCircle size={16} /> Reservar por WhatsApp
          </button>
        </div>
      </div>
    </div>
  );
}

function Stat({ icon: Icon, label, value, accent }) {
  return (
    <div className="flex items-center gap-3 p-4 rounded-md" style={{ background: '#161616', border: `1px solid #2A2A2A` }}>
      <div className="p-2 rounded" style={{ background: accent + '30' }}>
        <Icon size={18} color={accent} />
      </div>
      <div>
        <p className="text-2xl font-extrabold" style={{ color: WHITE, fontFamily: "'Baloo 2', sans-serif" }}>{value}</p>
        <p className="text-xs" style={{ color: '#B0B0B0' }}>{label}</p>
      </div>
    </div>
  );
}

/* --------------------------------- app ----------------------------------- */

export default function App() {
  const [ready, setReady] = useState(false);
  const [inventory, setInventory] = useState([]);
  const [sales, setSales] = useState([]);
  const [view, setView] = useState('tienda');
  const [adminUnlocked, setAdminUnlocked] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);

  const [brandFilter, setBrandFilter] = useState('Todas');
  const [subFilter, setSubFilter] = useState(null);
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [sizeFilter, setSizeFilter] = useState([]);
  const [search, setSearch] = useState('');
  const [openGroup, setOpenGroup] = useState(null);
  const [catalogOpen, setCatalogOpen] = useState(false);

  const emptyDraft = {
    brand: 'Jordan', model: 'Jordan 1', variant: 'Standard', edition: 'Retro',
    colorway: '', size: '', price: '', sellerName: '', sellerContact: '', condition: 'Nuevo', verified: true,
  };
  const [draft, setDraft] = useState(emptyDraft);
  const [sellModalItem, setSellModalItem] = useState(null);
  const [sellPrice, setSellPrice] = useState('');
  const [buyerContact, setBuyerContact] = useState('');

  useEffect(() => {
    (async () => {
      const inv = await loadKey('inventario');
      const sal = await loadKey('ventas');
      if (inv && sal) {
        setInventory(inv);
        setSales(sal);
      } else {
        const seed = buildSeed();
        setInventory(seed.items);
        setSales(seed.sales);
        saveKey('inventario', seed.items);
        saveKey('ventas', seed.sales);
      }
      setReady(true);
    })();
  }, []);

  const persistInventory = useCallback((next) => {
    setInventory(next);
    saveKey('inventario', next);
  }, []);

  const persistSales = useCallback((next) => {
    setSales(next);
    saveKey('ventas', next);
  }, []);

  const available = useMemo(() => inventory.filter((it) => it.status === 'disponible'), [inventory]);

  const filtered = useMemo(() => {
    return available.filter((it) => {
      if (subFilter?.type === 'sb') {
        const isSB = (it.brand === 'Nike' && it.model && it.model.toUpperCase().includes('SB')) || it.edition === 'SB';
        if (!isSB) return false;
      } else {
        if (brandFilter !== 'Todas' && it.brand !== brandFilter) return false;
        if (brandFilter === 'Jordan' && subFilter) {
          if (subFilter.type === 'model' && it.model !== subFilter.value) return false;
          if (subFilter.type === 'edition' && it.edition !== subFilter.value) return false;
        }
      }
      if (minPrice && it.price < Number(minPrice)) return false;
      if (maxPrice && it.price > Number(maxPrice)) return false;
      if (sizeFilter.length > 0 && !sizeFilter.includes(Number(it.size))) return false;
      if (search) {
        const hay = `${it.brand} ${it.model} ${it.edition || ''} ${it.colorway || ''}`.toLowerCase();
        if (!hay.includes(search.toLowerCase())) return false;
      }
      return true;
    });
  }, [available, brandFilter, subFilter, minPrice, maxPrice, sizeFilter, search]);

  // ediciones de Jordan que realmente hay en stock ahora mismo (además de "Retro")
  const availableJordanEditions = useMemo(() => {
    const set = new Set();
    available.forEach((it) => { if (it.brand === 'Jordan' && it.edition && it.edition !== 'Retro') set.add(it.edition); });
    return Array.from(set);
  }, [available]);

  // agrupamos por referencia: misma referencia = una sola tarjeta con varias tallas/precios
  const groupedProducts = useMemo(() => {
    const map = new Map();
    filtered.forEach((it) => {
      const key = refKey(it);
      if (!map.has(key)) {
        map.set(key, { key, brand: it.brand, model: it.model, variant: it.variant, edition: it.edition, colorway: it.colorway, variants: [] });
      }
      map.get(key).variants.push(it);
    });
    return Array.from(map.values());
  }, [filtered]);

  const handleOrder = (variant, group) => {
    const msg =
      `Hola! Quiero este par 👟\n\n` +
      `${group.brand} ${group.model}${group.variant && group.variant !== 'Standard' ? ' ' + group.variant : ''}${group.edition && group.edition !== 'Retro' ? ' x ' + group.edition : ''}\n` +
      `${group.colorway ? 'Color: ' + group.colorway + '\n' : ''}` +
      `Talla: ${variant.size}\n` +
      `Precio: ${fmtCOP(variant.price)}${variant.verified === false ? ' + $20.000 verificación (no trae trade incluido)' : ''}\n` +
      `Código: ${variant.serial}\n\n¿Sigue disponible?`;
    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
  };

  const handleGenericContact = (mensaje) => {
    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(mensaje)}`;
    window.open(url, '_blank');
  };

  const submitDraft = (e) => {
    e.preventDefault();
    if (!draft.size || !draft.price || !draft.sellerName || !draft.sellerContact) return;
    const serial = computeSerial(draft, inventory);
    const newItem = {
      id: `it-${Date.now()}`,
      status: 'disponible',
      dateAdded: new Date().toISOString().slice(0, 10),
      serial,
      ...draft,
      price: Number(draft.price),
    };
    persistInventory([newItem, ...inventory]);
    setDraft({ ...emptyDraft });
  };

  const openSellModal = (item) => {
    setSellModalItem(item);
    setSellPrice(String(item.price));
    setBuyerContact('');
  };

  const confirmSale = () => {
    if (!buyerContact || !sellPrice) return;
    const item = sellModalItem;
    const finalPrice = Number(sellPrice);
    const sale = {
      id: `sale-${Date.now()}`,
      serial: item.serial,
      resumen: `${item.brand} ${item.model} ${item.colorway ? '· ' + item.colorway : ''} · Talla ${item.size}`,
      buyerContact,
      sellerName: item.sellerName,
      sellerContact: item.sellerContact,
      salePrice: finalPrice,
      commission: COMMISSION,
      sellerPayout: finalPrice - COMMISSION,
      date: new Date().toISOString().slice(0, 10),
    };
    persistSales([sale, ...sales]);
    persistInventory(inventory.map((it) => (it.id === item.id ? { ...it, status: 'vendido' } : it)));
    setSellModalItem(null);
  };

  const removeItem = (id) => {
    persistInventory(inventory.filter((it) => it.id !== id));
  };

  const exportExcel = (rows, filename, sheetName) => {
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    XLSX.writeFile(wb, filename);
  };

  const totalComision = sales.reduce((acc, s) => acc + s.commission, 0);

  if (!ready) {
    return (
      <div className="min-h-[400px] flex items-center justify-center" style={{ background: BLACK, color: WHITE }}>
        Cargando catálogo…
      </div>
    );
  }

  return (
    <div style={{ fontFamily: "'Inter', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Baloo+2:wght@500;600;700;800&family=Titan+One&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@500&display=swap');
      `}</style>

      {view === 'tienda' ? (
        <Storefront
          drops={DROPS}
          brandFilter={brandFilter} setBrandFilter={setBrandFilter}
          subFilter={subFilter} setSubFilter={setSubFilter}
          minPrice={minPrice} setMinPrice={setMinPrice}
          maxPrice={maxPrice} setMaxPrice={setMaxPrice}
          sizeFilter={sizeFilter} setSizeFilter={setSizeFilter}
          search={search} setSearch={setSearch}
          groupedProducts={groupedProducts}
          availableJordanEditions={availableJordanEditions}
          onOpenGroup={setOpenGroup}
          onGenericContact={handleGenericContact}
          goAdmin={() => setView('admin')}
          catalogOpen={catalogOpen}
          openCatalog={() => setCatalogOpen(true)}
          closeCatalog={() => setCatalogOpen(false)}
        />
      ) : (
        <AdminPanel
          adminUnlocked={adminUnlocked}
          pinInput={pinInput} setPinInput={setPinInput}
          pinError={pinError}
          onUnlock={() => {
            if (pinInput === '2026') { setAdminUnlocked(true); setPinError(false); }
            else setPinError(true);
          }}
          onExit={() => setView('tienda')}
          inventory={inventory}
          sales={sales}
          draft={draft} setDraft={setDraft}
          submitDraft={submitDraft}
          openSellModal={openSellModal}
          removeItem={removeItem}
          exportExcel={exportExcel}
          totalComision={totalComision}
          reloadFromFile={() => {
            if (window.confirm('Esto reemplaza el inventario actual por lo que esté en products.js ahora mismo. Las ventas ya registradas no se borran. ¿Continuar?')) {
              const seed = buildSeed();
              persistInventory(seed.items);
            }
          }}
        />
      )}

      {openGroup && (
        <ProductDetailModal group={openGroup} onClose={() => setOpenGroup(null)} onOrder={handleOrder} />
      )}

      {sellModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(10,10,10,0.75)' }}>
          <div className="w-full max-w-sm rounded-md p-5" style={{ background: WHITE }}>
            <h3 className="text-lg font-extrabold mb-1" style={{ color: BLACK, fontFamily: "'Baloo 2', sans-serif" }}>
              Marcar como vendido
            </h3>
            <p className="text-sm mb-4" style={{ color: GREY_TEXT }}>
              {sellModalItem.brand} {sellModalItem.model} · {sellModalItem.serial}
            </p>
            <label className="block text-xs font-semibold mb-1" style={{ color: GREY_TEXT }}>Precio final de venta (COP)</label>
            <input
              type="number" value={sellPrice} onChange={(e) => setSellPrice(e.target.value)}
              className="w-full mb-3 px-3 py-2 rounded-md text-sm" style={{ border: `1px solid ${GREY_LINE}` }}
            />
            <label className="block text-xs font-semibold mb-1" style={{ color: GREY_TEXT }}>Contacto del comprador</label>
            <input
              type="text" value={buyerContact} onChange={(e) => setBuyerContact(e.target.value)}
              placeholder="Nombre o número de WhatsApp"
              className="w-full mb-4 px-3 py-2 rounded-md text-sm" style={{ border: `1px solid ${GREY_LINE}` }}
            />
            <div className="flex gap-2">
              <button onClick={() => setSellModalItem(null)} className="flex-1 py-2 rounded-md text-sm font-bold" style={{ border: `1px solid ${GREY_LINE}`, color: BLACK }}>
                Cancelar
              </button>
              <button onClick={confirmSale} className="flex-1 py-2 rounded-md text-sm font-bold flex items-center justify-center gap-1" style={{ background: TEAL, color: WHITE }}>
                <Check size={16} /> Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* -------------------------------- Storefront ------------------------------ */

function ComoFunciona({ onGenericContact }) {
  const [tab, setTab] = useState('comprar');
  const tabs = [
    { key: 'comprar', label: 'Comprar' },
    { key: 'vender', label: 'Vender' },
    { key: 'intercambiar', label: 'Intercambiar' },
  ];
  return (
    <div className="px-5 py-12" style={{ background: BLACK }}>
      <div className="max-w-4xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-extrabold mb-1" style={{ color: WHITE, fontFamily: "'Titan One', sans-serif" }}>
          ¿Cómo funciona?
        </h2>
        <p className="text-sm mb-6" style={{ color: '#B0B0B0' }}>La comunidad que está cambiando el sneaker game en Colombia.</p>

        <div className="flex gap-2 mb-6">
          {tabs.map((tb) => (
            <button
              key={tb.key}
              onClick={() => setTab(tb.key)}
              className="px-4 py-2 rounded-full text-sm font-bold"
              style={tab === tb.key ? { background: TEAL, color: WHITE } : { background: '#1E1E1E', color: WHITE }}
            >
              {tb.label}
            </button>
          ))}
        </div>

        <ol className="space-y-4 mb-8">
          {PROCESS_STEPS[tab].map((step, i) => (
            <li key={i} className="flex gap-3 text-sm md:text-base" style={{ color: WHITE }}>
              <span className="font-mono text-xs px-1.5 h-fit py-0.5 rounded" style={{ background: '#1E1E1E', color: TEAL }}>{String(i + 1).padStart(2, '0')}</span>
              <span><strong>{step.t}.</strong> {step.d}</span>
            </li>
          ))}
        </ol>

        {tab === 'intercambiar' && (
          <button
            onClick={() => onGenericContact('Hola! Quiero hacer un trade / intercambio de sneakers 🔁')}
            className="mb-8 flex items-center gap-2 px-4 py-2.5 rounded-md font-bold text-sm"
            style={{ background: TEAL, color: WHITE }}
          >
            <Repeat size={16} /> Proponer un trade por WhatsApp
          </button>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <div className="p-4 rounded-md" style={{ background: '#161616', border: '1px solid #2A2A2A' }}>
            <h3 className="font-extrabold mb-1" style={{ color: TEAL, fontFamily: "'Baloo 2', sans-serif" }}>¿Qué es la comisión o trade?</h3>
            <p className="text-sm" style={{ color: '#D5D5D5' }}>
              Es el valor del servicio de PITS: verificamos tu par personalmente, ponemos nuestro pin de autenticidad, y nos encargamos de que llegue a tu domicilio en cualquier parte del país. "Trade" también se usa como referencia de intercambio con otros pares.
            </p>
          </div>
          <div className="p-4 rounded-md" style={{ background: '#161616', border: '1px solid #2A2A2A' }}>
            <h3 className="font-extrabold mb-1" style={{ color: TEAL, fontFamily: "'Baloo 2', sans-serif" }}>¿Qué significa el pin de PITS?</h3>
            <p className="text-sm" style={{ color: '#D5D5D5' }}>
              Es el símbolo de que tu par fue verificado por el equipo. Te da la garantía de que es 100% auténtico — en el catálogo, ese mismo pin es el código que ves en cada tarjeta.
            </p>
          </div>
        </div>

        <div className="p-4 rounded-md" style={{ background: '#1E1E1E' }}>
          <h3 className="font-extrabold mb-3 text-sm uppercase tracking-wide" style={{ color: WHITE, fontFamily: "'Baloo 2', sans-serif" }}>Medios de pago</h3>
          <div className="flex flex-wrap gap-2">
            {PAYMENT_METHODS.map((m) => (
              <span key={m} className="text-xs font-semibold px-3 py-1.5 rounded-full" style={{ background: BLACK, color: '#D5D5D5' }}>{m}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function Storefront(props) {
  const {
    drops, brandFilter, setBrandFilter, subFilter, setSubFilter,
    minPrice, setMinPrice, maxPrice, setMaxPrice, sizeFilter, setSizeFilter,
    search, setSearch, groupedProducts, availableJordanEditions, onOpenGroup, onGenericContact, goAdmin,
    catalogOpen, openCatalog, closeCatalog,
  } = props;

  const openTile = (t) => {
    if (t.sb) { setBrandFilter('Todas'); setSubFilter({ type: 'sb' }); }
    else { setBrandFilter(t.brand); setSubFilter(t.edition ? { type: 'edition', value: t.edition } : null); }
    openCatalog();
  };

  const openAll = () => { setBrandFilter('Todas'); setSubFilter(null); openCatalog(); };

  return (
    <div style={{ background: WHITE, minHeight: '100%' }}>
      {/* Banner de envíos */}
      <div className="py-2 text-center text-[11px] font-bold tracking-wide" style={{ background: BLACK, color: WHITE }}>
        🚚 ENVÍOS A TODO COLOMBIA
      </div>

      {/* Ticker de lanzamientos */}
      <div className="py-2 overflow-hidden" style={{ background: ORANGE }}>
        <div className="flex gap-8 px-4 flex-wrap justify-center">
          {drops.map((d) => {
            const s = dropStatus(d.date);
            if (s.past) return null;
            return (
              <div key={d.id} className="flex items-center gap-2 text-xs whitespace-nowrap">
                <Clock size={12} color={WHITE} />
                <span style={{ color: WHITE }}>{d.title}</span>
                <span className="font-extrabold" style={{ color: BLACK }}>{s.text}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Header */}
      <div className="border-b" style={{ borderColor: GREY_LINE }}>
        <div className="max-w-6xl mx-auto px-5 py-3 flex items-center justify-between gap-4">
          <div className="hidden md:flex items-center gap-5 text-xs font-bold tracking-wide" style={{ color: BLACK }}>
            <span className="cursor-default">HOMBRE</span>
            <span className="cursor-default">MUJER</span>
            <span className="cursor-default">NIÑOS</span>
            <button onClick={openAll} className="cursor-pointer">NUEVOS LANZAMIENTOS</button>
          </div>
          <button onClick={openAll} className="flex items-center gap-2 shrink-0">
            <div className="rounded-full overflow-hidden flex items-center justify-center" style={{ width: 40, height: 40, background: ORANGE }}>
              <img src={MASCOT_SRC} alt="Pitsneakers" className="w-[90%] h-[90%] object-contain" />
            </div>
            <span className="text-lg font-extrabold tracking-tight" style={{ color: BLACK, fontFamily: "'Titan One', sans-serif" }}>PITSNEAKERS</span>
          </button>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full" style={{ border: `1px solid ${GREY_LINE}` }}>
              <Search size={14} color={GREY_TEXT} />
              <input
                value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar sneakers..." className="text-sm outline-none w-32"
              />
            </div>
            <button onClick={goAdmin} title="Panel interno" className="w-9 h-9 rounded-full flex items-center justify-center" style={{ border: `1px solid ${GREY_LINE}` }}>
              <Lock size={15} color={BLACK} />
            </button>
          </div>
        </div>
      </div>

      {/* Hero */}
      <div className="max-w-6xl mx-auto px-5 py-10 md:py-16 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
        <div>
          <h1 className="text-4xl md:text-6xl font-extrabold leading-[1.05] mb-4" style={{ color: BLACK, fontFamily: "'Titan One', sans-serif" }}>
            TU ESTILO.<br />TUS SNEAKERS.
          </h1>
          <p className="text-sm md:text-base mb-6" style={{ color: GREY_TEXT }}>
            Las mejores marcas. Los mejores modelos. Compra, vende e intercambia pares 100% verificados con el pin de autenticidad de PITS.
          </p>
          <div className="flex flex-wrap gap-3">
            <button onClick={openAll} className="px-6 py-3 rounded-md font-extrabold text-sm flex items-center gap-2" style={{ background: BLACK, color: WHITE }}>
              VER TODOS LOS SNEAKERS <ArrowIcon color={WHITE} />
            </button>
            <button onClick={openAll} className="px-6 py-3 rounded-md font-extrabold text-sm" style={{ border: `1.5px solid ${BLACK}`, color: BLACK }}>
              NUEVOS LANZAMIENTOS
            </button>
          </div>
        </div>
        <div className="rounded-md overflow-hidden h-64 md:h-80" style={{ background: '#F4F4F4' }}>
          <ProductPhoto imageKey="images/jordan1-lost-and-found.jpg" placeholderSize={80} />
        </div>
      </div>

      {/* Explora por marca */}
      <div className="max-w-6xl mx-auto px-5 pb-10">
        <h2 className="text-2xl font-extrabold mb-4" style={{ color: BLACK, fontFamily: "'Titan One', sans-serif" }}>EXPLORA POR MARCA</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-6">
          {CATEGORY_TILES.map((t) => (
            <CategoryTile key={t.label} tile={t} onClick={() => openTile(t)} />
          ))}
        </div>
        <button
          onClick={openAll}
          className="w-full sm:w-auto px-6 py-3.5 rounded-md font-extrabold text-sm"
          style={{ background: ORANGE, color: WHITE }}
        >
          Ver catálogo completo
        </button>
      </div>

      {/* Confianza */}
      <div className="border-t" style={{ borderColor: GREY_LINE }}>
        <div className="max-w-6xl mx-auto px-5 py-8 grid grid-cols-2 md:grid-cols-4 gap-6 text-center md:text-left">
          {[
            ['100% Originales', 'Todos nuestros productos son verificados por PITS.'],
            ['Envíos Rápidos', 'Recibe tus sneakers en tiempo récord.'],
            ['Compra Segura', 'Varios medios de pago protegidos.'],
            ['Atención 24/7', 'Estamos para ayudarte por WhatsApp.'],
          ].map(([t, d]) => (
            <div key={t}>
              <p className="font-extrabold text-sm mb-1" style={{ color: BLACK }}>{t}</p>
              <p className="text-xs" style={{ color: GREY_TEXT }}>{d}</p>
            </div>
          ))}
        </div>
      </div>

      <ComoFunciona onGenericContact={onGenericContact} />

      {/* Footer */}
      <div className="border-t" style={{ borderColor: GREY_LINE, background: '#FAFAFA' }}>
        <div className="max-w-6xl mx-auto px-5 py-10 grid grid-cols-2 md:grid-cols-4 gap-8 text-sm">
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-2">
              <div className="rounded-full overflow-hidden flex items-center justify-center" style={{ width: 32, height: 32, background: ORANGE }}>
                <img src={MASCOT_SRC} alt="Pitsneakers" className="w-[90%] h-[90%] object-contain" />
              </div>
              <span className="font-extrabold" style={{ color: BLACK, fontFamily: "'Titan One', sans-serif" }}>PITSNEAKERS</span>
            </div>
            <p className="text-xs" style={{ color: GREY_TEXT }}>Tu tienda de sneakers de confianza. Las mejores marcas, los mejores modelos y 100% verificados.</p>
          </div>
          <div>
            <p className="font-extrabold mb-2 text-xs uppercase tracking-wide" style={{ color: BLACK }}>Tienda</p>
            <ul className="space-y-1 text-xs" style={{ color: GREY_TEXT }}>
              <li>Hombre</li><li>Mujer</li><li>Niños</li><li onClick={openAll} className="cursor-pointer">Nuevos Lanzamientos</li>
            </ul>
          </div>
          <div>
            <p className="font-extrabold mb-2 text-xs uppercase tracking-wide" style={{ color: BLACK }}>Ayuda</p>
            <ul className="space-y-1 text-xs" style={{ color: GREY_TEXT }}>
              <li>Preguntas Frecuentes</li><li>Envíos</li><li>Cambios y Devoluciones</li>
              <li onClick={() => onGenericContact('Hola! Tengo una pregunta 🙋')} className="cursor-pointer">Contacto</li>
            </ul>
          </div>
          <div>
            <p className="font-extrabold mb-2 text-xs uppercase tracking-wide" style={{ color: BLACK }}>Síguenos</p>
            <button onClick={() => onGenericContact('Hola! Quiero más información 👋')} className="text-xs font-bold px-3 py-2 rounded-md" style={{ background: BLACK, color: WHITE }}>
              Escríbenos por WhatsApp
            </button>
          </div>
        </div>
        <div className="text-center py-4 text-[11px] border-t" style={{ color: GREY_TEXT, borderColor: GREY_LINE }}>
          Desarrollado por Brick Systems.
        </div>
      </div>

      {catalogOpen && (
        <CatalogModal
          onClose={closeCatalog}
          brandFilter={brandFilter} setBrandFilter={setBrandFilter}
          subFilter={subFilter} setSubFilter={setSubFilter}
          minPrice={minPrice} setMinPrice={setMinPrice}
          maxPrice={maxPrice} setMaxPrice={setMaxPrice}
          sizeFilter={sizeFilter} setSizeFilter={setSizeFilter}
          search={search} setSearch={setSearch}
          availableJordanEditions={availableJordanEditions}
          groupedProducts={groupedProducts}
          onOpenGroup={onOpenGroup}
        />
      )}
    </div>
  );
}

function CatalogModal(props) {
  const {
    onClose, brandFilter, setBrandFilter, subFilter, setSubFilter,
    minPrice, setMinPrice, maxPrice, setMaxPrice, sizeFilter, setSizeFilter,
    search, setSearch, availableJordanEditions, groupedProducts, onOpenGroup,
  } = props;
  const [filtersOpen, setFiltersOpen] = useState(false);
  const activeFiltersCount = (minPrice ? 1 : 0) + (maxPrice ? 1 : 0) + sizeFilter.length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-6" style={{ background: 'rgba(10,10,10,0.8)' }}>
      <div className="w-full max-w-5xl h-[92vh] rounded-md flex flex-col overflow-hidden" style={{ background: WHITE }}>
        <div className="flex items-center justify-between px-5 py-4 shrink-0" style={{ borderBottom: `1px solid ${GREY_LINE}` }}>
          <h2 className="text-xl font-extrabold" style={{ color: BLACK, fontFamily: "'Titan One', sans-serif" }}>Catálogo</h2>
          <button onClick={onClose} className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ background: BLACK }}>
            <X size={18} color={WHITE} />
          </button>
        </div>

        <div className="px-5 py-4 overflow-y-auto flex-1">
          <div className="flex flex-wrap gap-2 mb-3">
            <Chip accent={TEAL} active={brandFilter === 'Todas'} onClick={() => { setBrandFilter('Todas'); setSubFilter(null); }}>Todas</Chip>
            {BRANDS.map((b) => (
              <Chip accent={TEAL} key={b} active={brandFilter === b} onClick={() => { setBrandFilter(b); setSubFilter(null); }}>{b}</Chip>
            ))}
          </div>

          {brandFilter === 'Jordan' && (
            <div className="flex flex-wrap gap-2 items-center mb-3">
              {JORDAN_MODELS.map((m, i) => (
                <JordanCircle
                  key={m} num={i + 1}
                  active={subFilter?.type === 'model' && subFilter.value === m}
                  onClick={() => setSubFilter(subFilter?.value === m ? null : { type: 'model', value: m })}
                />
              ))}
              {availableJordanEditions.map((e) => (
                <Chip key={e} active={subFilter?.type === 'edition' && subFilter.value === e} onClick={() => setSubFilter(subFilter?.value === e ? null : { type: 'edition', value: e })}>
                  x {e}
                </Chip>
              ))}
            </div>
          )}

          <div className="flex flex-wrap gap-3 items-center mb-3">
            <div className="relative">
              <Search size={14} className="absolute left-2 top-1/2 -translate-y-1/2" color={GREY_TEXT} />
              <input
                value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar modelo o color…"
                className="pl-7 pr-3 py-1.5 rounded-full text-sm" style={{ border: `1px solid ${GREY_LINE}` }}
              />
            </div>
            <button
              onClick={() => setFiltersOpen((o) => !o)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold"
              style={filtersOpen || activeFiltersCount > 0 ? { background: BLACK, color: WHITE } : { background: WHITE, color: BLACK, border: `1px solid ${GREY_LINE}` }}
            >
              <Filter size={14} /> Filtros{activeFiltersCount > 0 ? ` (${activeFiltersCount})` : ''}
            </button>
          </div>

          {filtersOpen && (
            <div className="flex flex-wrap gap-3 items-center mb-4 p-3 rounded-md" style={{ background: '#F5F5F5' }}>
              <input
                type="number" placeholder="Precio mín." value={minPrice} onChange={(e) => setMinPrice(e.target.value)}
                className="w-28 px-3 py-1.5 rounded-full text-sm" style={{ border: `1px solid ${GREY_LINE}`, background: WHITE }}
              />
              <input
                type="number" placeholder="Precio máx." value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)}
                className="w-28 px-3 py-1.5 rounded-full text-sm" style={{ border: `1px solid ${GREY_LINE}`, background: WHITE }}
              />
              <div className="flex flex-wrap gap-1">
                {SIZE_OPTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => setSizeFilter(sizeFilter.includes(s) ? sizeFilter.filter((x) => x !== s) : [...sizeFilter, s])}
                    className="px-2 py-1 rounded text-xs font-bold"
                    style={sizeFilter.includes(s) ? { background: BLACK, color: WHITE } : { background: WHITE, color: BLACK, border: `1px solid ${GREY_LINE}` }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {groupedProducts.length === 0 ? (
            <p className="text-center py-16 text-sm" style={{ color: GREY_TEXT }}>No hay pares que cumplan con esos filtros por ahora.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {groupedProducts.map((g) => <ProductCard key={g.key} group={g} onOpen={onOpenGroup} />)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* --------------------------------- Admin ---------------------------------- */

function AdminPanel(props) {
  const {
    adminUnlocked, pinInput, setPinInput, pinError, onUnlock, onExit,
    inventory, sales, draft, setDraft, submitDraft, openSellModal, removeItem,
    exportExcel, totalComision, reloadFromFile,
  } = props;

  if (!adminUnlocked) {
    return (
      <div className="min-h-[500px] flex items-center justify-center p-6" style={{ background: BLACK }}>
        <div className="w-full max-w-xs">
          <button onClick={onExit} className="text-xs flex items-center gap-1 mb-6" style={{ color: '#B0B0B0' }}>
            <ArrowLeft size={14} /> Volver a la tienda
          </button>
          <h2 className="text-2xl font-extrabold mb-1" style={{ color: WHITE, fontFamily: "'Titan One', sans-serif" }}>Panel interno</h2>
          <p className="text-xs mb-4" style={{ color: '#B0B0B0' }}>Solo para el equipo PITS. Este PIN es un filtro simple, no seguridad real.</p>
          <input
            type="password" value={pinInput} onChange={(e) => setPinInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && onUnlock()}
            placeholder="PIN"
            className="w-full px-3 py-2 rounded-md text-sm mb-2" style={{ border: '1px solid #2A2A2A', background: '#161616', color: WHITE }}
          />
          {pinError && <p className="text-xs mb-2" style={{ color: '#FF8A80' }}>PIN incorrecto.</p>}
          <button onClick={onUnlock} className="w-full py-2 rounded-md text-sm font-bold" style={{ background: TEAL, color: WHITE }}>
            Entrar
          </button>
        </div>
      </div>
    );
  }

  const disponibles = inventory.filter((i) => i.status === 'disponible');

  const modelOptions = () => {
    if (draft.brand === 'Jordan') return JORDAN_MODELS;
    if (draft.brand === 'Nike') return NIKE_MODELS;
    return null;
  };

  return (
    <div style={{ background: BLACK, minHeight: '100%' }}>
      <div className="flex items-center justify-between px-5 py-4 max-w-6xl mx-auto">
        <div>
          <h2 className="text-2xl font-extrabold" style={{ color: WHITE, fontFamily: "'Titan One', sans-serif" }}>Panel interno</h2>
          <p className="text-xs" style={{ color: '#B0B0B0' }}>Stock, seriales y ventas — PITS</p>
        </div>
        <div className="flex gap-2">
          <button onClick={reloadFromFile} className="text-xs font-bold flex items-center gap-1 px-3 py-2 rounded-md" style={{ border: `1px solid ${TEAL}`, color: TEAL }}>
            <Repeat size={14} /> Recargar desde products.js
          </button>
          <button onClick={onExit} className="text-xs font-bold flex items-center gap-1 px-3 py-2 rounded-md" style={{ border: '1px solid #2A2A2A', color: WHITE }}>
            <ArrowLeft size={14} /> Volver a la tienda
          </button>
        </div>
      </div>

      <div className="px-5 max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
        <Stat icon={Package} label="Pares disponibles" value={disponibles.length} accent={TEAL} />
        <Stat icon={ShoppingBag} label="Pares vendidos (histórico)" value={sales.length} accent="#E8846B" />
        <Stat icon={TrendingUp} label="Comisión acumulada" value={fmtCOP(totalComision)} accent="#C9A227" />
      </div>

      {/* Formulario agregar par */}
      <div className="px-5 max-w-6xl mx-auto mb-10">
        <h3 className="text-lg font-extrabold mb-3" style={{ color: WHITE, fontFamily: "'Baloo 2', sans-serif" }}>Agregar par al stock</h3>
        <form onSubmit={submitDraft} className="grid grid-cols-1 md:grid-cols-3 gap-3 p-4 rounded-md" style={{ background: '#161616', border: '1px solid #2A2A2A' }}>
          <div>
            <label className="block text-xs mb-1" style={{ color: '#B0B0B0' }}>Marca</label>
            <select
              value={draft.brand}
              onChange={(e) => {
                const brand = e.target.value;
                const base = { ...draft, brand, colorway: '', size: '' };
                if (brand === 'Jordan') { base.model = 'Jordan 1'; base.variant = 'Standard'; base.edition = 'Retro'; }
                else if (brand === 'Nike') base.model = 'Air Force 1';
                else base.model = '';
                setDraft(base);
              }}
              className="w-full px-2 py-2 rounded-md text-sm" style={{ background: BLACK, color: WHITE, border: '1px solid #2A2A2A' }}
            >
              {BRANDS.map((b) => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs mb-1" style={{ color: '#B0B0B0' }}>Modelo</label>
            {modelOptions() ? (
              <select
                value={draft.model}
                onChange={(e) => setDraft({ ...draft, model: e.target.value })}
                className="w-full px-2 py-2 rounded-md text-sm" style={{ background: BLACK, color: WHITE, border: '1px solid #2A2A2A' }}
              >
                {modelOptions().map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            ) : (
              <input
                value={draft.model} onChange={(e) => setDraft({ ...draft, model: e.target.value })}
                placeholder="Ej. Samba OG"
                className="w-full px-2 py-2 rounded-md text-sm" style={{ background: BLACK, color: WHITE, border: '1px solid #2A2A2A' }}
              />
            )}
          </div>

          {draft.brand === 'Jordan' && (
            <>
              <div>
                <label className="block text-xs mb-1" style={{ color: '#B0B0B0' }}>Corte</label>
                <select value={draft.variant} onChange={(e) => setDraft({ ...draft, variant: e.target.value })} className="w-full px-2 py-2 rounded-md text-sm" style={{ background: BLACK, color: WHITE, border: '1px solid #2A2A2A' }}>
                  {JORDAN_VARIANTS.map((v) => <option key={v} value={v}>{v}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs mb-1" style={{ color: '#B0B0B0' }}>Edición (o escribe una nueva)</label>
                <input
                  list="jordan-edition-options"
                  value={draft.edition} onChange={(e) => setDraft({ ...draft, edition: e.target.value })}
                  placeholder="Retro, Travis Scott, Trophy Room..."
                  className="w-full px-2 py-2 rounded-md text-sm" style={{ background: BLACK, color: WHITE, border: '1px solid #2A2A2A' }}
                />
                <datalist id="jordan-edition-options">
                  {JORDAN_EDITIONS.map((v) => <option key={v} value={v} />)}
                </datalist>
              </div>
            </>
          )}

          <div>
            <label className="block text-xs mb-1" style={{ color: '#B0B0B0' }}>Condición</label>
            <select value={draft.condition} onChange={(e) => setDraft({ ...draft, condition: e.target.value })} className="w-full px-2 py-2 rounded-md text-sm" style={{ background: BLACK, color: WHITE, border: '1px solid #2A2A2A' }}>
              {CONDITIONS.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs mb-1" style={{ color: '#B0B0B0' }}>¿Trae trade incluido?</label>
            <select value={draft.verified ? 'si' : 'no'} onChange={(e) => setDraft({ ...draft, verified: e.target.value === 'si' })} className="w-full px-2 py-2 rounded-md text-sm" style={{ background: BLACK, color: WHITE, border: '1px solid #2A2A2A' }}>
              <option value="si">Sí — ya está verificado</option>
              <option value="no">No — falta verificar (+$20.000)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs mb-1" style={{ color: '#B0B0B0' }}>Color / detalle</label>
            <input value={draft.colorway} onChange={(e) => setDraft({ ...draft, colorway: e.target.value })} placeholder="Ej. Shy Pink" className="w-full px-2 py-2 rounded-md text-sm" style={{ background: BLACK, color: WHITE, border: '1px solid #2A2A2A' }} />
          </div>

          <div>
            <label className="block text-xs mb-1" style={{ color: '#B0B0B0' }}>Talla</label>
            <input value={draft.size} onChange={(e) => setDraft({ ...draft, size: e.target.value })} placeholder="9.5 o M / Única" className="w-full px-2 py-2 rounded-md text-sm" style={{ background: BLACK, color: WHITE, border: '1px solid #2A2A2A' }} />
          </div>

          <div>
            <label className="block text-xs mb-1" style={{ color: '#B0B0B0' }}>Precio (COP)</label>
            <input type="number" value={draft.price} onChange={(e) => setDraft({ ...draft, price: e.target.value })} className="w-full px-2 py-2 rounded-md text-sm" style={{ background: BLACK, color: WHITE, border: '1px solid #2A2A2A' }} />
          </div>

          <div>
            <label className="block text-xs mb-1" style={{ color: '#B0B0B0' }}>Nombre del vendedor</label>
            <input value={draft.sellerName} onChange={(e) => setDraft({ ...draft, sellerName: e.target.value })} className="w-full px-2 py-2 rounded-md text-sm" style={{ background: BLACK, color: WHITE, border: '1px solid #2A2A2A' }} />
          </div>

          <div>
            <label className="block text-xs mb-1" style={{ color: '#B0B0B0' }}>Contacto del vendedor</label>
            <input value={draft.sellerContact} onChange={(e) => setDraft({ ...draft, sellerContact: e.target.value })} className="w-full px-2 py-2 rounded-md text-sm" style={{ background: BLACK, color: WHITE, border: '1px solid #2A2A2A' }} />
          </div>

          <div className="flex items-end">
            <button type="submit" className="w-full py-2 rounded-md text-sm font-bold flex items-center justify-center gap-1" style={{ background: TEAL, color: WHITE }}>
              <Plus size={16} /> Agregar
            </button>
          </div>
        </form>
      </div>

      {/* Inventario */}
      <div className="px-5 max-w-6xl mx-auto mb-10">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-extrabold" style={{ color: WHITE, fontFamily: "'Baloo 2', sans-serif" }}>Inventario ({inventory.length})</h3>
          <button onClick={() => exportExcel(inventory, 'inventario.xlsx', 'Inventario')} className="text-xs font-bold flex items-center gap-1 px-3 py-1.5 rounded-md" style={{ border: '1px solid #2A2A2A', color: WHITE }}>
            <Download size={12} /> Exportar Excel
          </button>
        </div>
        <div className="overflow-x-auto rounded-md" style={{ border: '1px solid #2A2A2A' }}>
          <table className="w-full text-xs" style={{ color: '#D5D5D5' }}>
            <thead>
              <tr style={{ background: '#161616' }}>
                {['Código', 'Marca / modelo', 'Talla', 'Cond.', 'Precio', 'Vendedor', 'Estado', ''].map((h) => (
                  <th key={h} className="text-left px-3 py-2 font-bold" style={{ color: '#B0B0B0' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {inventory.map((it) => (
                <tr key={it.id} style={{ borderTop: '1px solid #2A2A2A' }}>
                  <td className="px-3 py-2 font-mono" style={{ color: TEAL }}>{it.serial}</td>
                  <td className="px-3 py-2">{it.brand} {it.model} {it.colorway ? `· ${it.colorway}` : ''}</td>
                  <td className="px-3 py-2">{it.size}</td>
                  <td className="px-3 py-2">{it.condition || 'Nuevo'}</td>
                  <td className="px-3 py-2">{fmtCOP(it.price)}</td>
                  <td className="px-3 py-2" style={it.sellerName === 'Por asignar' ? { color: TEAL, fontWeight: 700 } : undefined}>{it.sellerName}</td>
                  <td className="px-3 py-2">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold" style={it.status === 'disponible' ? { background: TEAL + '30', color: TEAL } : { background: '#66666650', color: '#B0B0B0' }}>
                      {it.status}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex gap-2">
                      {it.status === 'disponible' && (
                        <button onClick={() => openSellModal(it)} className="text-[10px] font-bold px-2 py-1 rounded" style={{ background: TEAL, color: WHITE }}>
                          Vender
                        </button>
                      )}
                      <button onClick={() => removeItem(it.id)} title="Eliminar">
                        <Trash2 size={14} color="#B0B0B0" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Ventas */}
      <div className="px-5 max-w-6xl mx-auto pb-14">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-extrabold" style={{ color: WHITE, fontFamily: "'Baloo 2', sans-serif" }}>Historial de ventas ({sales.length})</h3>
          <button onClick={() => exportExcel(sales, 'ventas.xlsx', 'Ventas')} className="text-xs font-bold flex items-center gap-1 px-3 py-1.5 rounded-md" style={{ border: '1px solid #2A2A2A', color: WHITE }}>
            <Download size={12} /> Exportar Excel
          </button>
        </div>
        <div className="overflow-x-auto rounded-md" style={{ border: '1px solid #2A2A2A' }}>
          <table className="w-full text-xs" style={{ color: '#D5D5D5' }}>
            <thead>
              <tr style={{ background: '#161616' }}>
                {['Código', 'Producto', 'Comprador', 'Vendedor a pagar', 'Precio venta', 'Comisión', 'Le corresponde', 'Fecha'].map((h) => (
                  <th key={h} className="text-left px-3 py-2 font-bold" style={{ color: '#B0B0B0' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sales.map((s) => (
                <tr key={s.id} style={{ borderTop: '1px solid #2A2A2A' }}>
                  <td className="px-3 py-2 font-mono" style={{ color: TEAL }}>{s.serial}</td>
                  <td className="px-3 py-2">{s.resumen}</td>
                  <td className="px-3 py-2">{s.buyerContact}</td>
                  <td className="px-3 py-2">{s.sellerName} ({s.sellerContact})</td>
                  <td className="px-3 py-2">{fmtCOP(s.salePrice)}</td>
                  <td className="px-3 py-2">{fmtCOP(s.commission)}</td>
                  <td className="px-3 py-2 font-bold">{fmtCOP(s.sellerPayout)}</td>
                  <td className="px-3 py-2">{s.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* Paleta: blanco y negro en todo, naranja SOLO como acento de marca. */
const ORANGE = '#C53C27';
const BLACK = '#0A0A0A';
const WHITE = '#FFFFFF';
const GREY_LINE = '#DADADA';
const GREY_TEXT = '#6B6B6B';
const TEAL = '#6CA0A5';
const CREAM = '#F7E9DE';

const DROPS = [
  { id: 1, title: "Travis Scott x Jordan 1 Low 'Shy Pink'", date: '2026-07-07' },
  { id: 2, title: "J Balvin x Jordan 6 'Golden Era'", date: '2026-07-15' },
  { id: 3, title: "Off-White x Jordan 4 'Sail'", date: '2026-07-22' },
];

const PAYMENT_METHODS = [
  'Zelle',
  'Bancolombia (transferencia)',
  'Davivienda (transferencia)',
  'Nequi',
  'Link de pago Bold (+5% del valor)',
  'Tarjeta de crédito o débito (+5% del valor)',
  'Pago a dos cuotas (más info con el administrador)',
];

const PROCESS_STEPS = {
  comprar: [
    { t: 'Elige tu par y reserva', d: 'Filtra por marca, talla y precio, y dale a "Reservar por WhatsApp": el equipo recibe el código exacto del par que quieres.' },
    { t: 'Confirman disponibilidad', d: 'Un administrador verifica que el par siga disponible.' },
    { t: 'Pagas y envías el comprobante', d: 'Eliges el medio de pago, pagas el valor del par y le mandas el comprobante al administrador.' },
    { t: 'Verificación de autenticidad', d: 'El equipo PITS revisa personalmente que el par sea 100% original.' },
    { t: 'Te notifican', d: 'Si todo está en orden, coordinan el envío. Si hay algún problema, te devuelven el 100% de tu dinero.' },
    { t: 'Recibes tu par', d: 'Llega a la puerta de tu casa en cualquier parte del país. El envío se paga contraentrega (aprox. $20.000 COP).' },
  ],
  vender: [
    { t: 'Contacta a un administrador', d: 'Cuéntale sobre el par que quieres vender, en el formato que te pidan.' },
    { t: 'Se publica en el catálogo', d: 'Tu par queda visible para toda la comunidad de Pitsneakers.' },
    { t: 'Cuando se venda, avisas', d: 'Le comunicas al administrador y envías el par a nuestro punto de verificación — el envío corre por tu cuenta.' },
    { t: 'Verificación + pin de autenticidad', d: 'El equipo revisa el par y le coloca el pin de PITS.' },
    { t: 'Recibes tu pago', d: 'Una vez verificado, te pagan lo acordado menos la comisión del servicio (actualmente $50.000 COP por par).' },
  ],
  intercambiar: [
    { t: 'Contacta a un administrador', d: 'Cuéntale qué par ofreces y cuál buscas — puedes mandar foto.' },
    { t: 'Ambos aceptan y pagan la comisión', d: 'Si las dos personas están de acuerdo, cada una paga la comisión de intercambio por adelantado.' },
    { t: 'Envían los pares al punto de verificación', d: 'Cada quien asume el costo de su propio envío.' },
    { t: 'Verificación', d: 'El equipo revisa que ambos pares sean auténticos.' },
    { t: 'Se hace el intercambio', d: 'Se despachan los pares — el envío final corre por cuenta de cada usuario.' },
  ],
};

const fmtCOP = (n) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n || 0);

const shortCode = (text) => {
  if (!text) return '';
  return text
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w[0].toUpperCase())
    .join('')
    .slice(0, 4);
};

function computeSerial(draft, existingItems) {
  let base = '';
  const colorCode = shortCode(draft.colorway);

  if (draft.brand === 'Jordan') {
    const num = draft.model.replace('Jordan', '').trim();
    const variantCode = { Low: 'L', Mid: 'M', High: 'H', Standard: '' }[draft.variant] || '';
    const editionCode = draft.edition in KNOWN_EDITION_CODES
      ? KNOWN_EDITION_CODES[draft.edition]
      : (draft.edition && draft.edition !== 'Retro' ? shortCode(draft.edition) : '');
    base = `J${num}${variantCode}${editionCode}`;
  } else if (draft.brand === 'Nike') {
    const modelMap = {
      'Air Force 1': 'AF1', 'Air Max': 'AM', Dunk: 'DK', 'Dunk SB': 'DKSB',
      'Nike Mind 001': 'MND1', 'Nike Mind 002': 'MND2',
    };
    base = `N${modelMap[draft.model] || shortCode(draft.model)}`;
  } else if (draft.brand === 'Adidas') {
    base = `AD${shortCode(draft.model)}`;
  }

  const baseKey = `${base}${colorCode}`;
  const count = existingItems.filter((it) => it.serial && it.serial.startsWith(baseKey)).length;
  return `${baseKey}${count + 1}`;
}

/* clave que agrupa variantes (tallas/precios distintos) de la MISMA referencia */
function refKey(it) {
  return [it.brand, it.model, it.variant || '', it.edition || '', it.colorway || ''].join('|');
}

function dropStatus(dateStr) {
  const target = new Date(`${dateStr}T00:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const days = Math.round((target - today) / 86400000);
  if (days > 1) return { text: `Faltan ${days} días`, urgent: false, past: false };
  if (days === 1) return { text: 'Mañana', urgent: true, past: false };
  if (days === 0) return { text: '¡HOY SALE!', urgent: true, past: false };
  return { text: 'Ya disponible', urgent: false, past: true };
}

/* ---------------------------- storage helpers --------------------------- */

const hasCloudStorage = typeof window !== 'undefined' && !!window.storage;

async function loadKey(key) {
  try {
    if (hasCloudStorage) {
      const res = await window.storage.get(key, true);
      return res ? JSON.parse(res.value) : null;
    }
    const raw = localStorage.getItem(`pitsneakers_${key}`);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

async function saveKey(key, value) {
  try {
    if (hasCloudStorage) {
      await window.storage.set(key, JSON.stringify(value), true);
    } else {
      localStorage.setItem(`pitsneakers_${key}`, JSON.stringify(value));
    }
  } catch (e) {
    console.error('No se pudo guardar', key, e);
  }
}

/* ------------------------------ seed data -------------------------------- */

function buildSeed() {
  const raw = (typeof window !== 'undefined' && window.PITSNEAKERS_PRODUCTS) || [];
  const items = [];
  const push = (draft) => {
    const serial = computeSerial(draft, items);
    items.push({ id: `seed-${items.length + 1}`, status: 'disponible', dateAdded: '2026-07-04', serial, ...draft });
  };

  raw.forEach((p) => {
    push({
      brand: p.marca,
      model: p.modelo,
      variant: p.corte || 'Standard',
      edition: p.edicion || 'Retro',
      colorway: p.color || '',
      size: p.talla,
      price: Number(p.precio) || 0,
      condition: p.condicion || 'Nuevo',
      sellerName: p.vendedor || 'Por asignar',
      sellerContact: p.contactoVendedor || 'Por asignar',
      imageKey: p.imagen || '',
      nota: p.nota || '',
      // si no se especifica, asumimos que SÍ trae el trade/comisión incluida (ya verificado)
      verified: p.verificado !== undefined ? !!p.verificado : true,
    });
  });

  return { items, sales: [] };
}

/* ------------------------------ subcomponents ---------------------------- */

function Chip({ active, onClick, children, accent = BLACK }) {
  return (
    <button
      onClick={onClick}
      className="px-3 py-1.5 rounded-full text-sm font-bold border transition-colors"
      style={
        active
          ? { background: accent, color: WHITE, borderColor: accent }
          : { background: WHITE, color: BLACK, borderColor: GREY_LINE }
      }
    >
      {children}
    </button>
  );
}

/* chip circular para los números de Jordan: J1, J4, J11... */
function JordanCircle({ active, onClick, num }) {
  return (
    <button
      onClick={onClick}
      className="w-11 h-11 rounded-full flex items-center justify-center text-sm font-extrabold border-2 shrink-0 transition-colors"
      style={
        active
          ? { background: TEAL, color: WHITE, borderColor: TEAL }
          : { background: WHITE, color: BLACK, borderColor: BLACK }
      }
      title={`Jordan ${num}`}
    >
      J{num}
    </button>
  );
}

/* Tiles grandes y chicos de navegación (inspirados en el grid de Thursday
   Boot Co que mandaste). Vienen de tiles.js — así los editas sin tocar
   este archivo. Si tiles.js no cargó por algún motivo, usamos estos
   valores por defecto para que la página no se rompa. */
const DEFAULT_TILES_BIG = [
  { label: 'Nike', image: 'images/dunk-sb-jarritos.jpg', brand: 'Nike' },
  { label: 'Jordan', image: 'images/jordan1-lost-and-found.jpg', brand: 'Jordan' },
  { label: 'SB', image: 'images/jordan4-sb-navy.jpg', sb: true },
];
const DEFAULT_TILES_SMALL = [
  { label: 'Travis Scott', image: 'images/jordan1-travis-mocha-low.jpg', brand: 'Jordan', edition: 'Travis Scott' },
  { label: 'Adidas', image: '', brand: 'Adidas' },
  { label: 'J Balvin', image: 'images/jordan3-rio-balvin.jpg', brand: 'Jordan', edition: 'J Balvin' },
  { label: 'Nigel Sylvester', image: '', brand: 'Jordan', edition: 'Nigel Sylvester' },
];
const CATEGORY_TILES_BIG = (typeof window !== 'undefined' && window.PITSNEAKERS_TILES_BIG) || DEFAULT_TILES_BIG;
const CATEGORY_TILES_SMALL = (typeof window !== 'undefined' && window.PITSNEAKERS_TILES_SMALL) || DEFAULT_TILES_SMALL;

function CategoryTile({ tile, big, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`relative overflow-hidden rounded-md text-left w-full ${big ? 'h-64 md:h-80' : 'h-32 md:h-40'}`}
      style={{ background: tile.image ? BLACK : TEAL }}
    >
      {tile.image && (
        <img src={tile.image} alt="" className="absolute inset-0 w-full h-full object-cover opacity-80" />
      )}
      <div className="absolute inset-0" style={{ background: tile.image ? 'linear-gradient(to top, rgba(0,0,0,0.6), rgba(0,0,0,0.05))' : 'transparent' }} />
      <span
        className={`absolute inset-0 flex items-center justify-center text-center px-2 font-extrabold text-white ${big ? 'text-3xl md:text-5xl' : 'text-base md:text-lg'}`}
        style={{ fontFamily: "'Titan One', sans-serif" }}
      >
        {tile.label}
      </span>
    </button>
  );
}

function ShoePlaceholder({ size = 56 }) {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center gap-1" style={{ background: '#F4F4F4' }}>
      <span style={{ fontSize: size, lineHeight: 1 }}>👟</span>
      <span className="text-[10px] font-semibold" style={{ color: GREY_TEXT }}>Foto próximamente</span>
    </div>
  );
}

function ProductPhoto({ imageKey, placeholderSize = 56 }) {
  const src = imageKey; // ruta relativa, ej. "images/foo.jpg"
  if (!src) return <ShoePlaceholder size={placeholderSize} />;
  return <img src={src} alt="" className="w-full h-full object-cover" />;
}

function ProductCard({ group, onOpen }) {
  const prices = group.variants.map((v) => v.price);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const samePrice = minPrice === maxPrice;
  const sizes = group.variants.map((v) => v.size).join(' · ');
  const condition = group.variants[0]?.condition || 'Nuevo';
  const nota = group.variants[0]?.nota;
  const imageKey = group.variants[0]?.imageKey;
  const verified = group.variants[0]?.verified !== false;

  return (
    <div
      className="rounded-md overflow-hidden flex flex-col cursor-pointer transition-transform hover:-translate-y-0.5"
      style={{ background: WHITE, border: `1px solid ${GREY_LINE}` }}
      onClick={() => onOpen(group)}
    >
      <div className="h-40 relative">
        <ProductPhoto imageKey={imageKey} />
        <span
          className="absolute top-2 left-2 text-[10px] font-bold px-2 py-1 rounded-full"
          style={{ background: WHITE, color: BLACK, border: `1px solid ${GREY_LINE}` }}
        >
          {condition} con caja{nota ? ` · ${nota}` : ''}
        </span>
        {verified ? (
          <span
            className="absolute top-2 right-2 text-[10px] font-extrabold px-2 py-1 rounded-full flex items-center gap-1"
            style={{ background: TEAL, color: WHITE }}
          >
            <Check size={10} /> PITS
          </span>
        ) : (
          <span
            className="absolute top-2 right-2 text-[10px] font-extrabold px-2 py-1 rounded-full"
            style={{ background: BLACK, color: WHITE }}
          >
            Por verificar
          </span>
        )}
      </div>
      <div className="p-4 flex flex-col gap-1 flex-1">
        <p className="text-[11px] tracking-widest uppercase font-extrabold" style={{ color: BLACK }}>
          {group.brand}
        </p>
        <h3 className="text-lg leading-tight font-extrabold" style={{ color: BLACK, fontFamily: "'Baloo 2', sans-serif" }}>
          {group.model}{group.variant && group.variant !== 'Standard' ? ` ${group.variant}` : ''}
        </h3>
        {group.edition && group.edition !== 'Retro' && (
          <p className="text-xs font-bold" style={{ color: TEAL }}>x {group.edition}</p>
        )}
        {group.colorway && <p className="text-sm" style={{ color: GREY_TEXT }}>{group.colorway}</p>}

        <p className="text-xs mt-1" style={{ color: GREY_TEXT }}>Tallas: {sizes}</p>

        <p className="text-xl font-extrabold mt-1" style={{ color: BLACK, fontFamily: "'Baloo 2', sans-serif" }}>
          {samePrice ? fmtCOP(minPrice) : `Desde ${fmtCOP(minPrice)}`}
        </p>
        {!verified && (
          <p className="text-[11px] font-semibold" style={{ color: '#B8860B' }}>+ $20.000 por verificación</p>
        )}

        <button
          onClick={(e) => { e.stopPropagation(); onOpen(group); }}
          className="mt-2 w-full flex items-center justify-center gap-2 py-2.5 rounded-md font-bold text-sm"
          style={{ background: BLACK, color: WHITE }}
        >
          Ver tallas y precios
        </button>
      </div>
    </div>
  );
}

function ProductDetailModal({ group, onClose, onOrder }) {
  const sorted = [...group.variants].sort((a, b) => Number(a.size) - Number(b.size) || 0);
  const [selectedId, setSelectedId] = useState(sorted[0]?.id);
  const selected = sorted.find((v) => v.id === selectedId) || sorted[0];

  const verified = selected.verified !== false;
  const nota = selected.nota;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" style={{ background: 'rgba(10,10,10,0.75)' }}>
      <div className="w-full sm:max-w-lg max-h-[90vh] overflow-y-auto rounded-t-2xl sm:rounded-md" style={{ background: WHITE }}>
        <div className="relative h-64">
          <ProductPhoto imageKey={group.variants[0]?.imageKey} placeholderSize={72} />
          <button onClick={onClose} className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center" style={{ background: BLACK }}>
            <X size={16} color={WHITE} />
          </button>
          {verified ? (
            <span className="absolute top-3 left-3 text-[11px] font-extrabold px-2.5 py-1 rounded-full flex items-center gap-1" style={{ background: TEAL, color: WHITE }}>
              <Check size={11} /> Verificado PITS
            </span>
          ) : (
            <span className="absolute top-3 left-3 text-[11px] font-extrabold px-2.5 py-1 rounded-full" style={{ background: BLACK, color: WHITE }}>
              Aún sin verificar
            </span>
          )}
        </div>

        <div className="p-5">
          <p className="text-[11px] tracking-widest uppercase font-extrabold" style={{ color: BLACK }}>{group.brand}</p>
          <h2 className="text-2xl font-extrabold leading-tight" style={{ color: BLACK, fontFamily: "'Baloo 2', sans-serif" }}>
            {group.model}{group.variant && group.variant !== 'Standard' ? ` ${group.variant}` : ''}
          </h2>
          {group.edition && group.edition !== 'Retro' && <p className="text-sm font-bold mb-1" style={{ color: TEAL }}>x {group.edition}</p>}
          {group.colorway && <p className="text-sm mb-1" style={{ color: GREY_TEXT }}>{group.colorway}</p>}
          <p className="text-xs font-semibold mb-3" style={{ color: GREY_TEXT }}>{selected.condition || 'Nuevo'} · con caja{nota ? ` · ${nota}` : ''}</p>

          <p className="text-xs font-bold uppercase mb-2" style={{ color: BLACK }}>Elige tu talla</p>
          <div className="flex flex-wrap gap-2 mb-4">
            {sorted.map((v) => (
              <button
                key={v.id}
                onClick={() => setSelectedId(v.id)}
                className="px-3 py-2 rounded-md text-sm font-bold border-2"
                style={v.id === selectedId ? { background: TEAL, color: WHITE, borderColor: TEAL } : { background: WHITE, color: BLACK, borderColor: GREY_LINE }}
              >
                {v.size}
              </button>
            ))}
          </div>

          <p className="text-xs" style={{ color: GREY_TEXT }}>Código de autenticación</p>
          <p className="font-mono text-sm mb-3 flex items-center gap-1" style={{ color: BLACK }}><TagIcon size={12} /> {selected.serial}</p>

          <p className="text-3xl font-extrabold mb-1" style={{ color: BLACK, fontFamily: "'Baloo 2', sans-serif" }}>
            {fmtCOP(selected.price)}
          </p>
          {!verified && (
            <p className="text-xs font-semibold mb-4" style={{ color: '#B8860B' }}>
              + $20.000 por verificación (este par aún no tiene el trade incluido)
            </p>
          )}
          {verified && <div className="mb-4" />}

          <button
            onClick={() => onOrder(selected, group)}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-md font-bold text-sm"
            style={{ background: BLACK, color: WHITE }}
          >
            <MessageCircle size={16} /> Reservar por WhatsApp
          </button>
        </div>
      </div>
    </div>
  );
}

function Stat({ icon: Icon, label, value, accent }) {
  return (
    <div className="flex items-center gap-3 p-4 rounded-md" style={{ background: '#161616', border: `1px solid #2A2A2A` }}>
      <div className="p-2 rounded" style={{ background: accent + '30' }}>
        <Icon size={18} color={accent} />
      </div>
      <div>
        <p className="text-2xl font-extrabold" style={{ color: WHITE, fontFamily: "'Baloo 2', sans-serif" }}>{value}</p>
        <p className="text-xs" style={{ color: '#B0B0B0' }}>{label}</p>
      </div>
    </div>
  );
}

/* --------------------------------- app ----------------------------------- */

export default function App() {
  const [ready, setReady] = useState(false);
  const [inventory, setInventory] = useState([]);
  const [sales, setSales] = useState([]);
  const [view, setView] = useState('tienda');
  const [adminUnlocked, setAdminUnlocked] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);

  const [brandFilter, setBrandFilter] = useState('Todas');
  const [subFilter, setSubFilter] = useState(null);
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [sizeFilter, setSizeFilter] = useState([]);
  const [search, setSearch] = useState('');
  const [openGroup, setOpenGroup] = useState(null);
  const [catalogOpen, setCatalogOpen] = useState(false);

  const emptyDraft = {
    brand: 'Jordan', model: 'Jordan 1', variant: 'Standard', edition: 'Retro',
    colorway: '', size: '', price: '', sellerName: '', sellerContact: '', condition: 'Nuevo', verified: true,
  };
  const [draft, setDraft] = useState(emptyDraft);
  const [sellModalItem, setSellModalItem] = useState(null);
  const [sellPrice, setSellPrice] = useState('');
  const [buyerContact, setBuyerContact] = useState('');

  useEffect(() => {
    (async () => {
      const inv = await loadKey('inventario');
      const sal = await loadKey('ventas');
      if (inv && sal) {
        setInventory(inv);
        setSales(sal);
      } else {
        const seed = buildSeed();
        setInventory(seed.items);
        setSales(seed.sales);
        saveKey('inventario', seed.items);
        saveKey('ventas', seed.sales);
      }
      setReady(true);
    })();
  }, []);

  const persistInventory = useCallback((next) => {
    setInventory(next);
    saveKey('inventario', next);
  }, []);

  const persistSales = useCallback((next) => {
    setSales(next);
    saveKey('ventas', next);
  }, []);

  const available = useMemo(() => inventory.filter((it) => it.status === 'disponible'), [inventory]);

  const filtered = useMemo(() => {
    return available.filter((it) => {
      if (subFilter?.type === 'sb') {
        const isSB = (it.brand === 'Nike' && it.model && it.model.toUpperCase().includes('SB')) || it.edition === 'SB';
        if (!isSB) return false;
      } else {
        if (brandFilter !== 'Todas' && it.brand !== brandFilter) return false;
        if (brandFilter === 'Jordan' && subFilter) {
          if (subFilter.type === 'model' && it.model !== subFilter.value) return false;
          if (subFilter.type === 'edition' && it.edition !== subFilter.value) return false;
        }
      }
      if (minPrice && it.price < Number(minPrice)) return false;
      if (maxPrice && it.price > Number(maxPrice)) return false;
      if (sizeFilter.length > 0 && !sizeFilter.includes(Number(it.size))) return false;
      if (search) {
        const hay = `${it.brand} ${it.model} ${it.edition || ''} ${it.colorway || ''}`.toLowerCase();
        if (!hay.includes(search.toLowerCase())) return false;
      }
      return true;
    });
  }, [available, brandFilter, subFilter, minPrice, maxPrice, sizeFilter, search]);

  // ediciones de Jordan que realmente hay en stock ahora mismo (además de "Retro")
  const availableJordanEditions = useMemo(() => {
    const set = new Set();
    available.forEach((it) => { if (it.brand === 'Jordan' && it.edition && it.edition !== 'Retro') set.add(it.edition); });
    return Array.from(set);
  }, [available]);

  // agrupamos por referencia: misma referencia = una sola tarjeta con varias tallas/precios
  const groupedProducts = useMemo(() => {
    const map = new Map();
    filtered.forEach((it) => {
      const key = refKey(it);
      if (!map.has(key)) {
        map.set(key, { key, brand: it.brand, model: it.model, variant: it.variant, edition: it.edition, colorway: it.colorway, variants: [] });
      }
      map.get(key).variants.push(it);
    });
    return Array.from(map.values());
  }, [filtered]);

  const handleOrder = (variant, group) => {
    const msg =
      `Hola! Quiero este par 👟\n\n` +
      `${group.brand} ${group.model}${group.variant && group.variant !== 'Standard' ? ' ' + group.variant : ''}${group.edition && group.edition !== 'Retro' ? ' x ' + group.edition : ''}\n` +
      `${group.colorway ? 'Color: ' + group.colorway + '\n' : ''}` +
      `Talla: ${variant.size}\n` +
      `Precio: ${fmtCOP(variant.price)}${variant.verified === false ? ' + $20.000 verificación (no trae trade incluido)' : ''}\n` +
      `Código: ${variant.serial}\n\n¿Sigue disponible?`;
    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
  };

  const handleGenericContact = (mensaje) => {
    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(mensaje)}`;
    window.open(url, '_blank');
  };

  const submitDraft = (e) => {
    e.preventDefault();
    if (!draft.size || !draft.price || !draft.sellerName || !draft.sellerContact) return;
    const serial = computeSerial(draft, inventory);
    const newItem = {
      id: `it-${Date.now()}`,
      status: 'disponible',
      dateAdded: new Date().toISOString().slice(0, 10),
      serial,
      ...draft,
      price: Number(draft.price),
    };
    persistInventory([newItem, ...inventory]);
    setDraft({ ...emptyDraft });
  };

  const openSellModal = (item) => {
    setSellModalItem(item);
    setSellPrice(String(item.price));
    setBuyerContact('');
  };

  const confirmSale = () => {
    if (!buyerContact || !sellPrice) return;
    const item = sellModalItem;
    const finalPrice = Number(sellPrice);
    const sale = {
      id: `sale-${Date.now()}`,
      serial: item.serial,
      resumen: `${item.brand} ${item.model} ${item.colorway ? '· ' + item.colorway : ''} · Talla ${item.size}`,
      buyerContact,
      sellerName: item.sellerName,
      sellerContact: item.sellerContact,
      salePrice: finalPrice,
      commission: COMMISSION,
      sellerPayout: finalPrice - COMMISSION,
      date: new Date().toISOString().slice(0, 10),
    };
    persistSales([sale, ...sales]);
    persistInventory(inventory.map((it) => (it.id === item.id ? { ...it, status: 'vendido' } : it)));
    setSellModalItem(null);
  };

  const removeItem = (id) => {
    persistInventory(inventory.filter((it) => it.id !== id));
  };

  const exportExcel = (rows, filename, sheetName) => {
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    XLSX.writeFile(wb, filename);
  };

  const totalComision = sales.reduce((acc, s) => acc + s.commission, 0);

  if (!ready) {
    return (
      <div className="min-h-[400px] flex items-center justify-center" style={{ background: BLACK, color: WHITE }}>
        Cargando catálogo…
      </div>
    );
  }

  return (
    <div style={{ fontFamily: "'Inter', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Baloo+2:wght@500;600;700;800&family=Titan+One&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@500&display=swap');
      `}</style>

      {view === 'tienda' ? (
        <Storefront
          drops={DROPS}
          brandFilter={brandFilter} setBrandFilter={setBrandFilter}
          subFilter={subFilter} setSubFilter={setSubFilter}
          minPrice={minPrice} setMinPrice={setMinPrice}
          maxPrice={maxPrice} setMaxPrice={setMaxPrice}
          sizeFilter={sizeFilter} setSizeFilter={setSizeFilter}
          search={search} setSearch={setSearch}
          groupedProducts={groupedProducts}
          availableJordanEditions={availableJordanEditions}
          onOpenGroup={setOpenGroup}
          onGenericContact={handleGenericContact}
          goAdmin={() => setView('admin')}
          catalogOpen={catalogOpen}
          openCatalog={() => setCatalogOpen(true)}
          closeCatalog={() => setCatalogOpen(false)}
        />
      ) : (
        <AdminPanel
          adminUnlocked={adminUnlocked}
          pinInput={pinInput} setPinInput={setPinInput}
          pinError={pinError}
          onUnlock={() => {
            if (pinInput === '2026') { setAdminUnlocked(true); setPinError(false); }
            else setPinError(true);
          }}
          onExit={() => setView('tienda')}
          inventory={inventory}
          sales={sales}
          draft={draft} setDraft={setDraft}
          submitDraft={submitDraft}
          openSellModal={openSellModal}
          removeItem={removeItem}
          exportExcel={exportExcel}
          totalComision={totalComision}
          reloadFromFile={() => {
            if (window.confirm('Esto reemplaza el inventario actual por lo que esté en products.js ahora mismo. Las ventas ya registradas no se borran. ¿Continuar?')) {
              const seed = buildSeed();
              persistInventory(seed.items);
            }
          }}
        />
      )}

      {openGroup && (
        <ProductDetailModal group={openGroup} onClose={() => setOpenGroup(null)} onOrder={handleOrder} />
      )}

      {sellModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(10,10,10,0.75)' }}>
          <div className="w-full max-w-sm rounded-md p-5" style={{ background: WHITE }}>
            <h3 className="text-lg font-extrabold mb-1" style={{ color: BLACK, fontFamily: "'Baloo 2', sans-serif" }}>
              Marcar como vendido
            </h3>
            <p className="text-sm mb-4" style={{ color: GREY_TEXT }}>
              {sellModalItem.brand} {sellModalItem.model} · {sellModalItem.serial}
            </p>
            <label className="block text-xs font-semibold mb-1" style={{ color: GREY_TEXT }}>Precio final de venta (COP)</label>
            <input
              type="number" value={sellPrice} onChange={(e) => setSellPrice(e.target.value)}
              className="w-full mb-3 px-3 py-2 rounded-md text-sm" style={{ border: `1px solid ${GREY_LINE}` }}
            />
            <label className="block text-xs font-semibold mb-1" style={{ color: GREY_TEXT }}>Contacto del comprador</label>
            <input
              type="text" value={buyerContact} onChange={(e) => setBuyerContact(e.target.value)}
              placeholder="Nombre o número de WhatsApp"
              className="w-full mb-4 px-3 py-2 rounded-md text-sm" style={{ border: `1px solid ${GREY_LINE}` }}
            />
            <div className="flex gap-2">
              <button onClick={() => setSellModalItem(null)} className="flex-1 py-2 rounded-md text-sm font-bold" style={{ border: `1px solid ${GREY_LINE}`, color: BLACK }}>
                Cancelar
              </button>
              <button onClick={confirmSale} className="flex-1 py-2 rounded-md text-sm font-bold flex items-center justify-center gap-1" style={{ background: TEAL, color: WHITE }}>
                <Check size={16} /> Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* -------------------------------- Storefront ------------------------------ */

function ComoFunciona({ onGenericContact }) {
  const [tab, setTab] = useState('comprar');
  const tabs = [
    { key: 'comprar', label: 'Comprar' },
    { key: 'vender', label: 'Vender' },
    { key: 'intercambiar', label: 'Intercambiar' },
  ];
  return (
    <div className="px-5 py-12" style={{ background: BLACK }}>
      <div className="max-w-4xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-extrabold mb-1" style={{ color: WHITE, fontFamily: "'Titan One', sans-serif" }}>
          ¿Cómo funciona?
        </h2>
        <p className="text-sm mb-6" style={{ color: '#B0B0B0' }}>La comunidad que está cambiando el sneaker game en Colombia.</p>

        <div className="flex gap-2 mb-6">
          {tabs.map((tb) => (
            <button
              key={tb.key}
              onClick={() => setTab(tb.key)}
              className="px-4 py-2 rounded-full text-sm font-bold"
              style={tab === tb.key ? { background: TEAL, color: WHITE } : { background: '#1E1E1E', color: WHITE }}
            >
              {tb.label}
            </button>
          ))}
        </div>

        <ol className="space-y-4 mb-8">
          {PROCESS_STEPS[tab].map((step, i) => (
            <li key={i} className="flex gap-3 text-sm md:text-base" style={{ color: WHITE }}>
              <span className="font-mono text-xs px-1.5 h-fit py-0.5 rounded" style={{ background: '#1E1E1E', color: TEAL }}>{String(i + 1).padStart(2, '0')}</span>
              <span><strong>{step.t}.</strong> {step.d}</span>
            </li>
          ))}
        </ol>

        {tab === 'intercambiar' && (
          <button
            onClick={() => onGenericContact('Hola! Quiero hacer un trade / intercambio de sneakers 🔁')}
            className="mb-8 flex items-center gap-2 px-4 py-2.5 rounded-md font-bold text-sm"
            style={{ background: TEAL, color: WHITE }}
          >
            <Repeat size={16} /> Proponer un trade por WhatsApp
          </button>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <div className="p-4 rounded-md" style={{ background: '#161616', border: '1px solid #2A2A2A' }}>
            <h3 className="font-extrabold mb-1" style={{ color: TEAL, fontFamily: "'Baloo 2', sans-serif" }}>¿Qué es la comisión o trade?</h3>
            <p className="text-sm" style={{ color: '#D5D5D5' }}>
              Es el valor del servicio de PITS: verificamos tu par personalmente, ponemos nuestro pin de autenticidad, y nos encargamos de que llegue a tu domicilio en cualquier parte del país. "Trade" también se usa como referencia de intercambio con otros pares.
            </p>
          </div>
          <div className="p-4 rounded-md" style={{ background: '#161616', border: '1px solid #2A2A2A' }}>
            <h3 className="font-extrabold mb-1" style={{ color: TEAL, fontFamily: "'Baloo 2', sans-serif" }}>¿Qué significa el pin de PITS?</h3>
            <p className="text-sm" style={{ color: '#D5D5D5' }}>
              Es el símbolo de que tu par fue verificado por el equipo. Te da la garantía de que es 100% auténtico — en el catálogo, ese mismo pin es el código que ves en cada tarjeta.
            </p>
          </div>
        </div>

        <div className="p-4 rounded-md" style={{ background: '#1E1E1E' }}>
          <h3 className="font-extrabold mb-3 text-sm uppercase tracking-wide" style={{ color: WHITE, fontFamily: "'Baloo 2', sans-serif" }}>Medios de pago</h3>
          <div className="flex flex-wrap gap-2">
            {PAYMENT_METHODS.map((m) => (
              <span key={m} className="text-xs font-semibold px-3 py-1.5 rounded-full" style={{ background: BLACK, color: '#D5D5D5' }}>{m}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function Storefront(props) {
  const {
    drops, brandFilter, setBrandFilter, subFilter, setSubFilter,
    minPrice, setMinPrice, maxPrice, setMaxPrice, sizeFilter, setSizeFilter,
    search, setSearch, groupedProducts, availableJordanEditions, onOpenGroup, onGenericContact, goAdmin,
    catalogOpen, openCatalog, closeCatalog,
  } = props;

  const openTile = (t) => {
    if (t.sb) { setBrandFilter('Todas'); setSubFilter({ type: 'sb' }); }
    else { setBrandFilter(t.brand); setSubFilter(t.edition ? { type: 'edition', value: t.edition } : null); }
    openCatalog();
  };

  return (
    <div style={{ background: ORANGE, minHeight: '100%' }}>
      {/* Ticker de lanzamientos */}
      <div className="py-2 overflow-hidden" style={{ background: BLACK }}>
        <div className="flex gap-8 px-4 flex-wrap justify-center">
          {drops.map((d) => {
            const s = dropStatus(d.date);
            if (s.past) return null;
            return (
              <div key={d.id} className="flex items-center gap-2 text-xs whitespace-nowrap">
                <Clock size={12} color={s.urgent ? TEAL : WHITE} />
                <span style={{ color: WHITE }}>{d.title}</span>
                <span className="font-extrabold" style={{ color: TEAL }}>{s.text}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Encabezado partido en diagonal: naranja con el logo / negro con el mensaje */}
      <div className="relative overflow-hidden" style={{ minHeight: 380 }}>
        <div className="absolute inset-0" style={{ background: ORANGE, clipPath: 'polygon(0 0, 60% 0, 38% 100%, 0 100%)' }} />
        <div className="absolute inset-0" style={{ background: BLACK, clipPath: 'polygon(60% 0, 100% 0, 100% 100%, 38% 100%)' }} />
        <div className="relative flex flex-col md:flex-row items-center gap-6 px-5 max-w-6xl mx-auto py-10 md:py-14">
          <div className="flex-1 flex flex-col items-center gap-4">
            <div className="rounded-full flex items-center justify-center overflow-hidden shrink-0" style={{ width: 150, height: 150, background: WHITE }}>
              <img src={MASCOT_SRC} alt="Mascota Pitsneakers" className="w-[90%] h-[90%] object-contain" />
            </div>
            <h1 className="text-3xl md:text-5xl tracking-tight text-center" style={{ color: WHITE, fontFamily: "'Titan One', sans-serif" }}>PITSNEAKERS</h1>
          </div>
          <div className="flex-1 flex flex-col gap-3 items-center md:items-start text-center md:text-left">
            <p className="text-xl md:text-3xl leading-tight font-extrabold" style={{ color: ORANGE, fontFamily: "'Titan One', sans-serif" }}>
              La comunidad que está cambiando el sneaker game en Colombia.
            </p>
            <p className="text-sm md:text-base" style={{ color: ORANGE }}>
              Compra, vende e intercambia pares 100% verificados. Cada par lleva el pin de autenticidad de PITS.
            </p>
            <button onClick={goAdmin} className="text-xs font-bold flex items-center gap-1 px-3 py-2 rounded-md mt-1" style={{ border: `1.5px solid ${ORANGE}`, color: ORANGE }}>
              <Lock size={12} /> Panel interno
            </button>
          </div>
        </div>
      </div>

      {/* Navegación por categorías (tiles grandes + chicos) */}
      <div className="px-5 max-w-6xl mx-auto py-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
          {CATEGORY_TILES_BIG.map((t) => (
            <CategoryTile key={t.label} tile={t} big onClick={() => openTile(t)} />
          ))}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-5">
          {CATEGORY_TILES_SMALL.map((t) => (
            <CategoryTile key={t.label} tile={t} onClick={() => openTile(t)} />
          ))}
        </div>
        <button
          onClick={() => { setBrandFilter('Todas'); setSubFilter(null); openCatalog(); }}
          className="w-full sm:w-auto px-6 py-3.5 rounded-md font-extrabold text-sm"
          style={{ background: BLACK, color: WHITE }}
        >
          Ver catálogo completo
        </button>
      </div>

      <ComoFunciona onGenericContact={onGenericContact} />

      <div className="text-center py-4 text-[11px]" style={{ color: CREAM }}>
        Desarrollado por Brick Systems.
      </div>

      {catalogOpen && (
        <CatalogModal
          onClose={closeCatalog}
          brandFilter={brandFilter}
          subFilter={subFilter} setSubFilter={setSubFilter}
          minPrice={minPrice} setMinPrice={setMinPrice}
          maxPrice={maxPrice} setMaxPrice={setMaxPrice}
          sizeFilter={sizeFilter} setSizeFilter={setSizeFilter}
          search={search} setSearch={setSearch}
          availableJordanEditions={availableJordanEditions}
          groupedProducts={groupedProducts}
          onOpenGroup={onOpenGroup}
        />
      )}
    </div>
  );
}

function CatalogModal(props) {
  const {
    onClose, brandFilter, subFilter, setSubFilter,
    minPrice, setMinPrice, maxPrice, setMaxPrice, sizeFilter, setSizeFilter,
    search, setSearch, availableJordanEditions, groupedProducts, onOpenGroup,
  } = props;
  const [filtersOpen, setFiltersOpen] = useState(false);
  const activeFiltersCount = (minPrice ? 1 : 0) + (maxPrice ? 1 : 0) + sizeFilter.length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-6" style={{ background: 'rgba(10,10,10,0.8)' }}>
      <div className="w-full max-w-5xl h-[92vh] rounded-md flex flex-col overflow-hidden" style={{ background: WHITE }}>
        <div className="flex items-center justify-between px-5 py-4 shrink-0" style={{ borderBottom: `1px solid ${GREY_LINE}` }}>
          <h2 className="text-xl font-extrabold" style={{ color: BLACK, fontFamily: "'Titan One', sans-serif" }}>Catálogo</h2>
          <button onClick={onClose} className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ background: BLACK }}>
            <X size={18} color={WHITE} />
          </button>
        </div>

        <div className="px-5 py-4 overflow-y-auto flex-1">
          {brandFilter === 'Jordan' && (
            <div className="flex flex-wrap gap-2 items-center mb-3">
              {JORDAN_MODELS.map((m, i) => (
                <JordanCircle
                  key={m} num={i + 1}
                  active={subFilter?.type === 'model' && subFilter.value === m}
                  onClick={() => setSubFilter(subFilter?.value === m ? null : { type: 'model', value: m })}
                />
              ))}
              {availableJordanEditions.map((e) => (
                <Chip key={e} active={subFilter?.type === 'edition' && subFilter.value === e} onClick={() => setSubFilter(subFilter?.value === e ? null : { type: 'edition', value: e })}>
                  x {e}
                </Chip>
              ))}
            </div>
          )}

          <div className="flex flex-wrap gap-3 items-center mb-3">
            <div className="relative">
              <Search size={14} className="absolute left-2 top-1/2 -translate-y-1/2" color={GREY_TEXT} />
              <input
                value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar modelo o color…"
                className="pl-7 pr-3 py-1.5 rounded-full text-sm" style={{ border: `1px solid ${GREY_LINE}` }}
              />
            </div>
            <button
              onClick={() => setFiltersOpen((o) => !o)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold"
              style={filtersOpen || activeFiltersCount > 0 ? { background: BLACK, color: WHITE } : { background: WHITE, color: BLACK, border: `1px solid ${GREY_LINE}` }}
            >
              <Filter size={14} /> Filtros{activeFiltersCount > 0 ? ` (${activeFiltersCount})` : ''}
            </button>
          </div>

          {filtersOpen && (
            <div className="flex flex-wrap gap-3 items-center mb-4 p-3 rounded-md" style={{ background: '#F5F5F5' }}>
              <input
                type="number" placeholder="Precio mín." value={minPrice} onChange={(e) => setMinPrice(e.target.value)}
                className="w-28 px-3 py-1.5 rounded-full text-sm" style={{ border: `1px solid ${GREY_LINE}`, background: WHITE }}
              />
              <input
                type="number" placeholder="Precio máx." value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)}
                className="w-28 px-3 py-1.5 rounded-full text-sm" style={{ border: `1px solid ${GREY_LINE}`, background: WHITE }}
              />
              <div className="flex flex-wrap gap-1">
                {SIZE_OPTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => setSizeFilter(sizeFilter.includes(s) ? sizeFilter.filter((x) => x !== s) : [...sizeFilter, s])}
                    className="px-2 py-1 rounded text-xs font-bold"
                    style={sizeFilter.includes(s) ? { background: BLACK, color: WHITE } : { background: WHITE, color: BLACK, border: `1px solid ${GREY_LINE}` }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {groupedProducts.length === 0 ? (
            <p className="text-center py-16 text-sm" style={{ color: GREY_TEXT }}>No hay pares que cumplan con esos filtros por ahora.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {groupedProducts.map((g) => <ProductCard key={g.key} group={g} onOpen={onOpenGroup} />)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* --------------------------------- Admin ---------------------------------- */

function AdminPanel(props) {
  const {
    adminUnlocked, pinInput, setPinInput, pinError, onUnlock, onExit,
    inventory, sales, draft, setDraft, submitDraft, openSellModal, removeItem,
    exportExcel, totalComision, reloadFromFile,
  } = props;

  if (!adminUnlocked) {
    return (
      <div className="min-h-[500px] flex items-center justify-center p-6" style={{ background: BLACK }}>
        <div className="w-full max-w-xs">
          <button onClick={onExit} className="text-xs flex items-center gap-1 mb-6" style={{ color: '#B0B0B0' }}>
            <ArrowLeft size={14} /> Volver a la tienda
          </button>
          <h2 className="text-2xl font-extrabold mb-1" style={{ color: WHITE, fontFamily: "'Titan One', sans-serif" }}>Panel interno</h2>
          <p className="text-xs mb-4" style={{ color: '#B0B0B0' }}>Solo para el equipo PITS. Este PIN es un filtro simple, no seguridad real.</p>
          <input
            type="password" value={pinInput} onChange={(e) => setPinInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && onUnlock()}
            placeholder="PIN"
            className="w-full px-3 py-2 rounded-md text-sm mb-2" style={{ border: '1px solid #2A2A2A', background: '#161616', color: WHITE }}
          />
          {pinError && <p className="text-xs mb-2" style={{ color: '#FF8A80' }}>PIN incorrecto.</p>}
          <button onClick={onUnlock} className="w-full py-2 rounded-md text-sm font-bold" style={{ background: TEAL, color: WHITE }}>
            Entrar
          </button>
        </div>
      </div>
    );
  }

  const disponibles = inventory.filter((i) => i.status === 'disponible');

  const modelOptions = () => {
    if (draft.brand === 'Jordan') return JORDAN_MODELS;
    if (draft.brand === 'Nike') return NIKE_MODELS;
    return null;
  };

  return (
    <div style={{ background: BLACK, minHeight: '100%' }}>
      <div className="flex items-center justify-between px-5 py-4 max-w-6xl mx-auto">
        <div>
          <h2 className="text-2xl font-extrabold" style={{ color: WHITE, fontFamily: "'Titan One', sans-serif" }}>Panel interno</h2>
          <p className="text-xs" style={{ color: '#B0B0B0' }}>Stock, seriales y ventas — PITS</p>
        </div>
        <div className="flex gap-2">
          <button onClick={reloadFromFile} className="text-xs font-bold flex items-center gap-1 px-3 py-2 rounded-md" style={{ border: `1px solid ${TEAL}`, color: TEAL }}>
            <Repeat size={14} /> Recargar desde products.js
          </button>
          <button onClick={onExit} className="text-xs font-bold flex items-center gap-1 px-3 py-2 rounded-md" style={{ border: '1px solid #2A2A2A', color: WHITE }}>
            <ArrowLeft size={14} /> Volver a la tienda
          </button>
        </div>
      </div>

      <div className="px-5 max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
        <Stat icon={Package} label="Pares disponibles" value={disponibles.length} accent={TEAL} />
        <Stat icon={ShoppingBag} label="Pares vendidos (histórico)" value={sales.length} accent="#E8846B" />
        <Stat icon={TrendingUp} label="Comisión acumulada" value={fmtCOP(totalComision)} accent="#C9A227" />
      </div>

      {/* Formulario agregar par */}
      <div className="px-5 max-w-6xl mx-auto mb-10">
        <h3 className="text-lg font-extrabold mb-3" style={{ color: WHITE, fontFamily: "'Baloo 2', sans-serif" }}>Agregar par al stock</h3>
        <form onSubmit={submitDraft} className="grid grid-cols-1 md:grid-cols-3 gap-3 p-4 rounded-md" style={{ background: '#161616', border: '1px solid #2A2A2A' }}>
          <div>
            <label className="block text-xs mb-1" style={{ color: '#B0B0B0' }}>Marca</label>
            <select
              value={draft.brand}
              onChange={(e) => {
                const brand = e.target.value;
                const base = { ...draft, brand, colorway: '', size: '' };
                if (brand === 'Jordan') { base.model = 'Jordan 1'; base.variant = 'Standard'; base.edition = 'Retro'; }
                else if (brand === 'Nike') base.model = 'Air Force 1';
                else base.model = '';
                setDraft(base);
              }}
              className="w-full px-2 py-2 rounded-md text-sm" style={{ background: BLACK, color: WHITE, border: '1px solid #2A2A2A' }}
            >
              {BRANDS.map((b) => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs mb-1" style={{ color: '#B0B0B0' }}>Modelo</label>
            {modelOptions() ? (
              <select
                value={draft.model}
                onChange={(e) => setDraft({ ...draft, model: e.target.value })}
                className="w-full px-2 py-2 rounded-md text-sm" style={{ background: BLACK, color: WHITE, border: '1px solid #2A2A2A' }}
              >
                {modelOptions().map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            ) : (
              <input
                value={draft.model} onChange={(e) => setDraft({ ...draft, model: e.target.value })}
                placeholder="Ej. Samba OG"
                className="w-full px-2 py-2 rounded-md text-sm" style={{ background: BLACK, color: WHITE, border: '1px solid #2A2A2A' }}
              />
            )}
          </div>

          {draft.brand === 'Jordan' && (
            <>
              <div>
                <label className="block text-xs mb-1" style={{ color: '#B0B0B0' }}>Corte</label>
                <select value={draft.variant} onChange={(e) => setDraft({ ...draft, variant: e.target.value })} className="w-full px-2 py-2 rounded-md text-sm" style={{ background: BLACK, color: WHITE, border: '1px solid #2A2A2A' }}>
                  {JORDAN_VARIANTS.map((v) => <option key={v} value={v}>{v}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs mb-1" style={{ color: '#B0B0B0' }}>Edición (o escribe una nueva)</label>
                <input
                  list="jordan-edition-options"
                  value={draft.edition} onChange={(e) => setDraft({ ...draft, edition: e.target.value })}
                  placeholder="Retro, Travis Scott, Trophy Room..."
                  className="w-full px-2 py-2 rounded-md text-sm" style={{ background: BLACK, color: WHITE, border: '1px solid #2A2A2A' }}
                />
                <datalist id="jordan-edition-options">
                  {JORDAN_EDITIONS.map((v) => <option key={v} value={v} />)}
                </datalist>
              </div>
            </>
          )}

          <div>
            <label className="block text-xs mb-1" style={{ color: '#B0B0B0' }}>Condición</label>
            <select value={draft.condition} onChange={(e) => setDraft({ ...draft, condition: e.target.value })} className="w-full px-2 py-2 rounded-md text-sm" style={{ background: BLACK, color: WHITE, border: '1px solid #2A2A2A' }}>
              {CONDITIONS.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs mb-1" style={{ color: '#B0B0B0' }}>¿Trae trade incluido?</label>
            <select value={draft.verified ? 'si' : 'no'} onChange={(e) => setDraft({ ...draft, verified: e.target.value === 'si' })} className="w-full px-2 py-2 rounded-md text-sm" style={{ background: BLACK, color: WHITE, border: '1px solid #2A2A2A' }}>
              <option value="si">Sí — ya está verificado</option>
              <option value="no">No — falta verificar (+$20.000)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs mb-1" style={{ color: '#B0B0B0' }}>Color / detalle</label>
            <input value={draft.colorway} onChange={(e) => setDraft({ ...draft, colorway: e.target.value })} placeholder="Ej. Shy Pink" className="w-full px-2 py-2 rounded-md text-sm" style={{ background: BLACK, color: WHITE, border: '1px solid #2A2A2A' }} />
          </div>

          <div>
            <label className="block text-xs mb-1" style={{ color: '#B0B0B0' }}>Talla</label>
            <input value={draft.size} onChange={(e) => setDraft({ ...draft, size: e.target.value })} placeholder="9.5 o M / Única" className="w-full px-2 py-2 rounded-md text-sm" style={{ background: BLACK, color: WHITE, border: '1px solid #2A2A2A' }} />
          </div>

          <div>
            <label className="block text-xs mb-1" style={{ color: '#B0B0B0' }}>Precio (COP)</label>
            <input type="number" value={draft.price} onChange={(e) => setDraft({ ...draft, price: e.target.value })} className="w-full px-2 py-2 rounded-md text-sm" style={{ background: BLACK, color: WHITE, border: '1px solid #2A2A2A' }} />
          </div>

          <div>
            <label className="block text-xs mb-1" style={{ color: '#B0B0B0' }}>Nombre del vendedor</label>
            <input value={draft.sellerName} onChange={(e) => setDraft({ ...draft, sellerName: e.target.value })} className="w-full px-2 py-2 rounded-md text-sm" style={{ background: BLACK, color: WHITE, border: '1px solid #2A2A2A' }} />
          </div>

          <div>
            <label className="block text-xs mb-1" style={{ color: '#B0B0B0' }}>Contacto del vendedor</label>
            <input value={draft.sellerContact} onChange={(e) => setDraft({ ...draft, sellerContact: e.target.value })} className="w-full px-2 py-2 rounded-md text-sm" style={{ background: BLACK, color: WHITE, border: '1px solid #2A2A2A' }} />
          </div>

          <div className="flex items-end">
            <button type="submit" className="w-full py-2 rounded-md text-sm font-bold flex items-center justify-center gap-1" style={{ background: TEAL, color: WHITE }}>
              <Plus size={16} /> Agregar
            </button>
          </div>
        </form>
      </div>

      {/* Inventario */}
      <div className="px-5 max-w-6xl mx-auto mb-10">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-extrabold" style={{ color: WHITE, fontFamily: "'Baloo 2', sans-serif" }}>Inventario ({inventory.length})</h3>
          <button onClick={() => exportExcel(inventory, 'inventario.xlsx', 'Inventario')} className="text-xs font-bold flex items-center gap-1 px-3 py-1.5 rounded-md" style={{ border: '1px solid #2A2A2A', color: WHITE }}>
            <Download size={12} /> Exportar Excel
          </button>
        </div>
        <div className="overflow-x-auto rounded-md" style={{ border: '1px solid #2A2A2A' }}>
          <table className="w-full text-xs" style={{ color: '#D5D5D5' }}>
            <thead>
              <tr style={{ background: '#161616' }}>
                {['Código', 'Marca / modelo', 'Talla', 'Cond.', 'Precio', 'Vendedor', 'Estado', ''].map((h) => (
                  <th key={h} className="text-left px-3 py-2 font-bold" style={{ color: '#B0B0B0' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {inventory.map((it) => (
                <tr key={it.id} style={{ borderTop: '1px solid #2A2A2A' }}>
                  <td className="px-3 py-2 font-mono" style={{ color: TEAL }}>{it.serial}</td>
                  <td className="px-3 py-2">{it.brand} {it.model} {it.colorway ? `· ${it.colorway}` : ''}</td>
                  <td className="px-3 py-2">{it.size}</td>
                  <td className="px-3 py-2">{it.condition || 'Nuevo'}</td>
                  <td className="px-3 py-2">{fmtCOP(it.price)}</td>
                  <td className="px-3 py-2" style={it.sellerName === 'Por asignar' ? { color: TEAL, fontWeight: 700 } : undefined}>{it.sellerName}</td>
                  <td className="px-3 py-2">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold" style={it.status === 'disponible' ? { background: TEAL + '30', color: TEAL } : { background: '#66666650', color: '#B0B0B0' }}>
                      {it.status}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex gap-2">
                      {it.status === 'disponible' && (
                        <button onClick={() => openSellModal(it)} className="text-[10px] font-bold px-2 py-1 rounded" style={{ background: TEAL, color: WHITE }}>
                          Vender
                        </button>
                      )}
                      <button onClick={() => removeItem(it.id)} title="Eliminar">
                        <Trash2 size={14} color="#B0B0B0" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Ventas */}
      <div className="px-5 max-w-6xl mx-auto pb-14">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-extrabold" style={{ color: WHITE, fontFamily: "'Baloo 2', sans-serif" }}>Historial de ventas ({sales.length})</h3>
          <button onClick={() => exportExcel(sales, 'ventas.xlsx', 'Ventas')} className="text-xs font-bold flex items-center gap-1 px-3 py-1.5 rounded-md" style={{ border: '1px solid #2A2A2A', color: WHITE }}>
            <Download size={12} /> Exportar Excel
          </button>
        </div>
        <div className="overflow-x-auto rounded-md" style={{ border: '1px solid #2A2A2A' }}>
          <table className="w-full text-xs" style={{ color: '#D5D5D5' }}>
            <thead>
              <tr style={{ background: '#161616' }}>
                {['Código', 'Producto', 'Comprador', 'Vendedor a pagar', 'Precio venta', 'Comisión', 'Le corresponde', 'Fecha'].map((h) => (
                  <th key={h} className="text-left px-3 py-2 font-bold" style={{ color: '#B0B0B0' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sales.map((s) => (
                <tr key={s.id} style={{ borderTop: '1px solid #2A2A2A' }}>
                  <td className="px-3 py-2 font-mono" style={{ color: TEAL }}>{s.serial}</td>
                  <td className="px-3 py-2">{s.resumen}</td>
                  <td className="px-3 py-2">{s.buyerContact}</td>
                  <td className="px-3 py-2">{s.sellerName} ({s.sellerContact})</td>
                  <td className="px-3 py-2">{fmtCOP(s.salePrice)}</td>
                  <td className="px-3 py-2">{fmtCOP(s.commission)}</td>
                  <td className="px-3 py-2 font-bold">{fmtCOP(s.sellerPayout)}</td>
                  <td className="px-3 py-2">{s.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
