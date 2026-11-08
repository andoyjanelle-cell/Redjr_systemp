/* =====================================================================
   RedJr Builders & Construction Supply — POS, Orders & Inventory
   Sections:
     1. Helpers & constants
     2. Product catalog (with photos)
     3. Sample data & app state
     4. Saving / loading
     5. UI basics (toast, modal, navigation, login)
     6. Dashboard & charts
     7. Products page & delivery/pickup orders
     8. Orders
     9. Inventory
    10. Reports & history
    11. Point of Sale (cart, hold, payment, receipts)
    12. Event wiring
   ===================================================================== */

/* ---------- 1. Helpers & constants ---------- */
const money = n => '₱' + Number(n || 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const dateShort = d => new Date(d).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' });
const dateTime = d => new Date(d).toLocaleString('en-PH', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
const uid = prefix => prefix + '-' + Math.random().toString(36).slice(2, 7).toUpperCase();
const round2 = n => Math.round((Number(n) || 0) * 100) / 100;
const $ = id => document.getElementById(id);
const clone = v => JSON.parse(JSON.stringify(v));

function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
function fmtK(v) {
  return v >= 1e6 ? '₱' + (v / 1e6).toFixed(1).replace(/\.0$/, '') + 'M'
    : v >= 1e3 ? '₱' + (v / 1e3).toFixed(1).replace(/\.0$/, '') + 'k'
    : '₱' + Math.round(v);
}
function niceMax(v) {
  if (v <= 0) return 4;
  const raw = v / 4, p = Math.pow(10, Math.floor(Math.log10(raw))), f = raw / p;
  return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10) * p * 4;
}

// One single list of categories, units, statuses and payment methods (used everywhere).
const CATEGORIES = ['Cement', 'Masonry', 'Aggregates', 'Steel & Wire', 'Lumber', 'Hardware', 'Tools', 'Power Tools', 'Plumbing', 'Electrical', 'Painting', 'Roofing', 'Safety'];
const UNITS = ['piece', 'bag', 'kg', 'box', 'length', 'roll', 'sheet', 'can', 'pair', 'cu.m'];
const ORDER_STATUSES = ['Pending', 'Confirmed', 'Ready for pickup', 'Out for delivery', 'Completed', 'Cancelled'];
const PAY_METHODS = ['Cash', 'GCash', 'Maya', 'Credit/Debit card', 'Bank transfer'];
const catIndex = c => { const i = CATEGORIES.indexOf(c); return i < 0 ? 999 : i; };
const byCategoryThenName = (a, b) => catIndex(a.category) - catIndex(b.category) || a.name.localeCompare(b.name);

/* ---------- 2. Product catalog (each product has its own photo) ---------- */
// Photos come from Wikimedia Commons. If one cannot load (offline), a bundled picture in /images is shown instead.
const wiki = file => 'https://commons.wikimedia.org/wiki/Special:FilePath/' + encodeURIComponent(file) + '?width=640';

const defaultProducts = [
  // Cement
  { id: 'P001', name: 'Portland Cement',            category: 'Cement',       sku: 'CEM-001', price: 265,  stock: 48,  reorder: 15,  unit: 'bag',    photo: 'Portland_Cement_Bags.jpg' },
  // Masonry
  { id: 'P002', name: 'Hollow Block 4-inch',        category: 'Masonry',      sku: 'MAS-004', price: 18,   stock: 320, reorder: 80,  unit: 'piece',  photo: 'Concrete_block.jpg' },
  { id: 'P003', name: 'Hollow Block 6-inch',        category: 'Masonry',      sku: 'MAS-006', price: 22,   stock: 24,  reorder: 60,  unit: 'piece',  photo: 'Concrete_Masonry_blocks.jpg' },
  { id: 'P013', name: 'Red Clay Brick',             category: 'Masonry',      sku: 'MAS-010', price: 12,   stock: 500, reorder: 100, unit: 'piece',  photo: 'Brick_texture_red_brick.jpg' },
  // Aggregates
  { id: 'P014', name: 'Washed Sand',                category: 'Aggregates',   sku: 'AGG-001', price: 1350, stock: 12,  reorder: 4,   unit: 'cu.m',   photo: 'Sand_Pile.jpg' },
  { id: 'P015', name: 'Gravel 3/4-inch',            category: 'Aggregates',   sku: 'AGG-002', price: 1500, stock: 9,   reorder: 4,   unit: 'cu.m',   photo: '20mm-aggregate.jpg' },
  // Steel & Wire
  { id: 'P016', name: 'Deformed Rebar 10mm x 6m',   category: 'Steel & Wire', sku: 'STL-010', price: 185,  stock: 200, reorder: 50,  unit: 'piece',  photo: 'A_bunch_of_rebar_up_close.jpg' },
  { id: 'P017', name: 'Barbed Wire',                category: 'Steel & Wire', sku: 'STL-020', price: 1450, stock: 14,  reorder: 5,   unit: 'roll',   photo: 'Barbed_wire_(blue_background).jpg' },
  // Lumber
  { id: 'P018', name: 'Plywood 1/2-inch (4x8)',     category: 'Lumber',       sku: 'LBR-001', price: 620,  stock: 40,  reorder: 12,  unit: 'sheet',  photo: 'Birch_plywood.jpg' },
  { id: 'P019', name: 'Coco Lumber 2x2x10',         category: 'Lumber',       sku: 'LBR-002', price: 95,   stock: 150, reorder: 40,  unit: 'piece',  photo: 'Lumber_stack_in_Picture_Rocks.jpg' },
  // Hardware
  { id: 'P004', name: 'Steel Nail 2-inch',          category: 'Hardware',     sku: 'HRD-002', price: 95,   stock: 30,  reorder: 12,  unit: 'kg',     photo: 'Steel_nails.jpg' },
  { id: 'P005', name: 'Steel Nail 3-inch',          category: 'Hardware',     sku: 'HRD-003', price: 110,  stock: 0,   reorder: 12,  unit: 'kg',     photo: 'Nails.jpg' },
  { id: 'P010', name: 'Roofing Screw',              category: 'Hardware',     sku: 'HRD-009', price: 160,  stock: 7,   reorder: 10,  unit: 'box',    photo: 'Screws.jpg' },
  { id: 'P020', name: 'Bolt, Nut & Washer Set',     category: 'Hardware',     sku: 'HRD-012', price: 150,  stock: 36,  reorder: 10,  unit: 'box',    photo: 'Bolt,_Plain_washer_and_Spring_lock_washer.jpg' },
  { id: 'P021', name: 'Padlock 60mm',               category: 'Hardware',     sku: 'HRD-020', price: 195,  stock: 25,  reorder: 8,   unit: 'piece',  photo: 'Padlock.jpg' },
  // Tools
  { id: 'P006', name: 'Combination Pliers',         category: 'Tools',        sku: 'TLS-001', price: 185,  stock: 17,  reorder: 5,   unit: 'piece',  photo: 'Adjustable_pliers_kwb_387710.JPG' },
  { id: 'P007', name: 'Adjustable Wrench',          category: 'Tools',        sku: 'TLS-002', price: 240,  stock: 9,   reorder: 5,   unit: 'piece',  photo: 'Adjustable_wrench_2.jpg' },
  { id: 'P022', name: 'Claw Hammer',                category: 'Tools',        sku: 'TLS-003', price: 220,  stock: 22,  reorder: 6,   unit: 'piece',  photo: 'Claw-hammer.jpg' },
  { id: 'P023', name: 'Hand Saw 22-inch',           category: 'Tools',        sku: 'TLS-004', price: 260,  stock: 14,  reorder: 5,   unit: 'piece',  photo: 'Hand_saw.jpg' },
  { id: 'P024', name: 'Tape Measure 5m',            category: 'Tools',        sku: 'TLS-005', price: 95,   stock: 40,  reorder: 10,  unit: 'piece',  photo: 'Tape_measure.JPG' },
  { id: 'P025', name: 'Phillips Screwdriver',       category: 'Tools',        sku: 'TLS-006', price: 85,   stock: 35,  reorder: 10,  unit: 'piece',  photo: 'Phillips_screwdriver.jpg' },
  { id: 'P026', name: 'Round Point Shovel',         category: 'Tools',        sku: 'TLS-007', price: 350,  stock: 12,  reorder: 4,   unit: 'piece',  photo: 'Shovel_black.jpg' },
  { id: 'P027', name: 'Wheelbarrow',                category: 'Tools',        sku: 'TLS-008', price: 1850, stock: 4,   reorder: 5,   unit: 'piece',  photo: 'Loaded_wheelbarrow.jpg' },
  { id: 'P028', name: 'Masonry Trowel',             category: 'Tools',        sku: 'TLS-009', price: 130,  stock: 28,  reorder: 8,   unit: 'piece',  photo: 'Masons_trowel.jpg' },
  { id: 'P029', name: 'Spirit Level 24-inch',       category: 'Tools',        sku: 'TLS-010', price: 285,  stock: 11,  reorder: 4,   unit: 'piece',  photo: 'Tool-level.jpg' },
  { id: 'P030', name: 'Wood Chisel 1-inch',         category: 'Tools',        sku: 'TLS-011', price: 120,  stock: 20,  reorder: 6,   unit: 'piece',  photo: 'Wood_chisel.JPG' },
  // Power Tools
  { id: 'P031', name: 'Cordless Drill 12V',         category: 'Power Tools',  sku: 'PWR-001', price: 2450, stock: 6,   reorder: 3,   unit: 'piece',  photo: 'CordlessDrill.jpg' },
  { id: 'P032', name: 'Angle Grinder 4-inch',       category: 'Power Tools',  sku: 'PWR-002', price: 1850, stock: 8,   reorder: 3,   unit: 'piece',  photo: 'Makita_GA9050_Angle_Grinder.jpg' },
  // Plumbing
  { id: 'P008', name: 'PVC Pipe 1/2-inch',          category: 'Plumbing',     sku: 'PLB-001', price: 88,   stock: 65,  reorder: 20,  unit: 'length', photo: 'PVC_pipe.JPG' },
  { id: 'P033', name: 'Brass Faucet 1/2-inch',      category: 'Plumbing',     sku: 'PLB-002', price: 320,  stock: 30,  reorder: 8,   unit: 'piece',  photo: 'Brass_water_tap.jpg' },
  { id: 'P034', name: 'PPR Pipe & Fittings',        category: 'Plumbing',     sku: 'PLB-003', price: 140,  stock: 45,  reorder: 15,  unit: 'length', photo: 'PPR_pipe_and_Fitting.jpg' },
  // Electrical
  { id: 'P009', name: 'Electrical Tape',            category: 'Electrical',   sku: 'ELC-001', price: 28,   stock: 110, reorder: 25,  unit: 'roll',   photo: 'Electrical-tape_black.jpg' },
  { id: 'P035', name: 'Electrical Wire 2.0mm (150m)', category: 'Electrical', sku: 'ELC-002', price: 2650, stock: 10,  reorder: 4,   unit: 'roll',   photo: 'ElectricWireOnReel.JPG' },
  { id: 'P036', name: 'LED Bulb 9W',                category: 'Electrical',   sku: 'ELC-003', price: 85,   stock: 90,  reorder: 25,  unit: 'piece',  photo: 'Led_light_bulb.jpg' },
  { id: 'P037', name: 'Circuit Breaker 30A',        category: 'Electrical',   sku: 'ELC-004', price: 325,  stock: 18,  reorder: 6,   unit: 'piece',  photo: 'Circuit_breaker_BA63_EKF.jpg' },
  { id: 'P038', name: 'Extension Cord 5m',          category: 'Electrical',   sku: 'ELC-005', price: 380,  stock: 16,  reorder: 5,   unit: 'piece',  photo: 'NEMA-1_extension_cord.jpg' },
  { id: 'P039', name: 'Wall Switch',                category: 'Electrical',   sku: 'ELC-006', price: 65,   stock: 60,  reorder: 15,  unit: 'piece',  photo: 'Rocker_light_switch_1.jpg' },
  // Painting
  { id: 'P011', name: 'Paint Brush 3-inch',         category: 'Painting',     sku: 'PNT-003', price: 75,   stock: 42,  reorder: 10,  unit: 'piece',  photo: 'Paintbrush.JPG' },
  { id: 'P040', name: 'Paint Roller 9-inch',        category: 'Painting',     sku: 'PNT-004', price: 145,  stock: 26,  reorder: 8,   unit: 'piece',  photo: 'Paint_roller_4.jpg' },
  { id: 'P041', name: 'Latex Paint White 4L',       category: 'Painting',     sku: 'PNT-005', price: 780,  stock: 3,   reorder: 10,  unit: 'can',    photo: 'White_primer_bucket.jpg' },
  { id: 'P042', name: 'Sandpaper #120',             category: 'Painting',     sku: 'PNT-006', price: 12,   stock: 150, reorder: 40,  unit: 'sheet',  photo: 'Sandpaper_closeup.jpg' },
  // Roofing
  { id: 'P012', name: 'GI Sheet 0.4mm',             category: 'Roofing',      sku: 'ROF-004', price: 395,  stock: 16,  reorder: 8,   unit: 'sheet',  photo: 'Corrugated_iron_(AM_2016.25.1-8).jpg' },
  // Safety
  { id: 'P043', name: 'Safety Hard Hat',            category: 'Safety',       sku: 'SAF-001', price: 185,  stock: 30,  reorder: 8,   unit: 'piece',  photo: 'Hard_hat_20111111.jpg' },
  { id: 'P044', name: 'Safety Goggles',             category: 'Safety',       sku: 'SAF-002', price: 95,   stock: 45,  reorder: 10,  unit: 'piece',  photo: 'Safety_Goggles.jpg' },
  { id: 'P045', name: 'Work Gloves',                category: 'Safety',       sku: 'SAF-003', price: 65,   stock: 70,  reorder: 20,  unit: 'pair',   photo: 'Work_Gloves.svg' }
].map(p => ({ ...p, image: wiki(p.photo) }));

// Bundled backup pictures (in /images). Used only if the online photo cannot load.
const imgFallback = { P001: 'cement', P002: 'hollow-block-4', P003: 'hollow-block-6', P004: 'steel-nails-2', P005: 'steel-nails-3', P006: 'pliers', P007: 'wrench', P008: 'pvc-pipe', P009: 'electrical-tape', P010: 'roofing-screw', P011: 'paint-brush', P012: 'gi-sheet' };
const catFallback = { Cement: 'cement', Masonry: 'hollow-block-4', Hardware: 'steel-nails-2', Tools: 'wrench', 'Power Tools': 'wrench', Plumbing: 'pvc-pipe', Electrical: 'electrical-tape', Painting: 'paint-brush', Roofing: 'gi-sheet' };
const localImg = p => 'images/' + (imgFallback[p.id] || catFallback[p.category] || 'product-placeholder') + '.svg';
function imgTag(p, cls) {
  const src = p.image || localImg(p);
  return `<img class="${cls}" src="${esc(src)}" data-fb="${localImg(p)}" alt="${esc(p.name)}" loading="lazy" referrerpolicy="no-referrer" onerror="if(this.dataset.fb&&this.getAttribute('src')!==this.dataset.fb){this.src=this.dataset.fb}else{this.style.display='none'}">`;
}

/* ---------- 3. Sample data & app state ---------- */
const ago = ms => new Date(Date.now() - ms).toISOString();
const MIN = 60000, HR = 3600000;
const sampleOrders = [
  { id: 'ORD-1028', customer: 'Maria Santos', contact: '0917 234 5678', type: 'Pickup', address: '', items: [{ productId: 'P001', name: 'Portland Cement', price: 265, qty: 10 }, { productId: 'P004', name: 'Steel Nail 2-inch', price: 95, qty: 2 }], total: 2840, status: 'Pending', created: ago(35 * MIN) },
  { id: 'ORD-1027', customer: 'Ramon Dela Cruz', contact: '0928 111 0202', type: 'Delivery', address: 'Bagtas, Tanza, Cavite', items: [{ productId: 'P002', name: 'Hollow Block 4-inch', price: 18, qty: 100 }], total: 1800, status: 'Confirmed', created: ago(4 * HR) },
  { id: 'ORD-1026', customer: 'Ana Reyes', contact: '0998 700 2221', type: 'Pickup', address: '', items: [{ productId: 'P008', name: 'PVC Pipe 1/2-inch', price: 88, qty: 8 }, { productId: 'P009', name: 'Electrical Tape', price: 28, qty: 5 }], total: 844, status: 'Completed', created: ago(26 * HR) },
  { id: 'ORD-1025', customer: 'BuildRight Contractors', contact: '0915 222 9800', type: 'Delivery', address: 'Tanza, Cavite', items: [{ productId: 'P012', name: 'GI Sheet 0.4mm', price: 395, qty: 12 }], total: 4740, status: 'Out for delivery', created: ago(40 * HR) },
  { id: 'ORD-1024', customer: 'Joel Mendoza', contact: '0906 333 8888', type: 'Pickup', address: '', items: [{ productId: 'P006', name: 'Combination Pliers', price: 185, qty: 2 }], total: 370, status: 'Cancelled', created: ago(72 * HR) }
];
const sampleHistory = () => [
  { time: ago(18 * MIN), action: 'Inventory reviewed', detail: 'Admin opened the inventory page', type: 'Inventory' },
  { time: ago(55 * MIN), action: 'Order status updated', detail: 'ORD-1027 marked Confirmed', type: 'Order' },
  { time: ago(120 * MIN), action: 'Signed in', detail: 'Admin entered the store workspace', type: 'Account' }
];

let products = clone(defaultProducts);
let orders = clone(sampleOrders);
let history = sampleHistory();
let held = [];
let counters = { ord: 1029, pos: 1 };
let cart = {};                                   // delivery / pickup order cart
let posCart = {}, posCat = 'All', posDisc = { type: 'none', value: 0 };
let activePage = 'dashboard', activeCategory = 'All';

// 11 months of demo sales so the graphs have something to show.
function demoHistory() {
  let seed = 20260;
  const rnd = () => { seed = (seed * 1664525 + 1013904223) % 4294967296; return seed / 4294967296; };
  const names = ['Maria Santos', 'Ramon Dela Cruz', 'Ana Reyes', 'BuildRight Contractors', 'Joel Mendoza', 'Lopez Hardware', 'Cavite Homes Corp.', 'Elena Garcia', 'Mang Tonyo', 'Santos Builders', 'Walk-in customer'];
  const out = []; let n = 1; const now = new Date();
  for (let m = 11; m >= 1; m--) {
    const count = 7 + Math.floor(rnd() * 7) + Math.round((11 - m) * .5);
    for (let k = 0; k < count; k++) {
      const d = new Date(now.getFullYear(), now.getMonth() - m, 1 + Math.floor(rnd() * 27), 8 + Math.floor(rnd() * 9), Math.floor(rnd() * 60));
      const lines = 1 + Math.floor(rnd() * 3), items = [], used = new Set();
      for (let l = 0; l < lines; l++) {
        const p = defaultProducts[Math.floor(rnd() * defaultProducts.length)];
        if (used.has(p.id)) continue; used.add(p.id);
        const qty = p.price < 50 ? 20 + Math.floor(rnd() * 80) : p.price < 500 ? 2 + Math.floor(rnd() * 14) : 1 + Math.floor(rnd() * 4);
        items.push({ productId: p.id, name: p.name, price: p.price, qty });
      }
      const total = items.reduce((a, i) => a + i.price * i.qty, 0), walk = rnd() < .6, delivery = !walk && rnd() < .5;
      out.push({
        id: 'ORD-H' + String(n++).padStart(3, '0'), customer: names[Math.floor(rnd() * names.length)], contact: '',
        type: walk ? 'Walk-in' : delivery ? 'Delivery' : 'Pickup', address: delivery ? 'Cavite' : '', items,
        subtotal: total, discount: { label: '', amount: 0 }, total, status: 'Completed', created: d.toISOString(),
        payment: { method: rnd() < .75 ? 'Cash' : 'GCash', tendered: total, change: 0, ref: '' }, cashier: 'Admin', source: 'Demo'
      });
    }
  }
  return out;
}

/* ---------- 4. Saving / loading (browser localStorage) ---------- */
const STORE_KEY = 'redjr_pos_v3';   // bumped so the new product list shows up instead of old saved data
function saveState() { try { localStorage.setItem(STORE_KEY, JSON.stringify({ products, orders, history, held, counters })); } catch (e) { } }
function loadState() {
  try {
    const s = JSON.parse(localStorage.getItem(STORE_KEY) || 'null');
    if (s && Array.isArray(s.products) && Array.isArray(s.orders)) {
      products = s.products; orders = s.orders; history = s.history || []; held = s.held || []; counters = s.counters || counters;
      return true;
    }
  } catch (e) { }
  return false;
}
if (!loadState()) { orders = orders.concat(demoHistory()); saveState(); }

function logAction(action, detail, type = 'System') { history.unshift({ time: new Date().toISOString(), action, detail, type }); saveState(); }

function resetDemo() {
  showModal('Reset demo data?', `<p>This restores the sample products, orders and 11 months of demo sales. Anything you added or sold will be removed.</p>`, [
    { label: 'Cancel', class: 'secondary', action: closeModal },
    { label: 'Reset demo data', class: 'danger', action: () => {
      products = clone(defaultProducts); orders = clone(sampleOrders).concat(demoHistory()); history = sampleHistory(); held = []; counters = { ord: 1029, pos: 1 };
      logAction('Data reset', 'Demo data restored', 'System'); closeModal(); resetPosSale(); renderAll(); navigate(activePage); toast('Demo data restored.');
    } }]);
}
function startFresh() {
  showModal('Start fresh (go live)?', `<p>This deletes <strong>all orders, sales, held sales and activity history</strong> but keeps your product list and stock. Use this before you start recording real sales.</p><div class="notice">This cannot be undone. Consider exporting the CSV files first.</div>`, [
    { label: 'Cancel', class: 'secondary', action: closeModal },
    { label: 'Delete sales records', class: 'danger', action: () => {
      orders = []; history = []; held = []; counters = { ord: 1001, pos: 1 };
      logAction('Sales cleared', 'Store started fresh; products kept', 'System'); closeModal(); resetPosSale(); renderAll(); navigate(activePage); toast('Sales records cleared. Ready for real sales.');
    } }]);
}

/* ---------- 5. UI basics: toast, modal, navigation, login ---------- */
function toast(message, type = 'success') {
  const el = document.createElement('div'); el.className = 'toast ' + type; el.textContent = message;
  $('toastRegion').appendChild(el); setTimeout(() => el.remove(), 3400);
}
function showModal(title, body, buttons = []) {
  const root = $('modalRoot');
  root.innerHTML = `<div class="modal-backdrop" role="presentation" onclick="if(event.target===this)closeModal()"><section class="modal" role="dialog" aria-modal="true" aria-labelledby="modalTitle"><div class="modal-head"><h3 id="modalTitle">${title}</h3><button class="close-btn" aria-label="Close dialog" onclick="closeModal()">✕</button></div><div class="modal-body">${body}</div><div class="modal-foot" id="modalFoot"></div></section></div>`;
  const foot = $('modalFoot');
  buttons.forEach(b => { const btn = document.createElement('button'); btn.className = b.class || 'secondary'; btn.textContent = b.label; btn.addEventListener('click', b.action); foot.appendChild(btn); });
  const first = root.querySelector('input,select,button'); if (first) first.focus();
}
function closeModal() { $('modalRoot').innerHTML = ''; }

function statusClass(s) {
  return s === 'Completed' || s === 'Confirmed' || s === 'Ready for pickup' ? 'b-green'
    : s === 'Pending' ? 'b-amber'
    : s === 'Cancelled' || s === 'Out of Stock' ? 'b-red'
    : s === 'Out for delivery' ? 'b-blue' : 'b-gray';
}
const statusBadge = s => `<span class="badge ${statusClass(s)}">${esc(s)}</span>`;
const stockStatus = p => p.stock <= 0 ? 'Out of Stock' : p.stock <= p.reorder ? 'Low Stock' : 'In Stock';
function statCard(label, value, note, icon, tint) {
  return `<article class="stat" style="--tint:${tint}"><div class="stat-top"><span>${label}</span><span class="stat-icon">${icon}</span></div><div class="stat-value">${value}</div><div class="stat-note">${note}</div></article>`;
}
function tableHTML(headers, rows, empty = 'No records found.') {
  if (!rows.length) return `<div class="empty"><strong>${empty}</strong>Try changing your search or filters.</div>`;
  return `<table><thead><tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr></thead><tbody>${rows.map(r => `<tr>${r.map(c => `<td>${c}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
}
function categoryChips(elId, current, attr, onPick) {
  const present = new Set(products.map(p => p.category));
  const cats = ['All', ...CATEGORIES.filter(c => present.has(c)), ...[...present].filter(c => !CATEGORIES.includes(c)).sort()];
  const el = $(elId);
  el.innerHTML = cats.map(c => `<button class="chip ${current === c ? 'active' : ''}" data-${attr}="${esc(c)}">${esc(c)}</button>`).join('');
  el.querySelectorAll('[data-' + attr + ']').forEach(b => b.addEventListener('click', () => onPick(b.dataset[attr])));
}
function navCount() { const n = orders.filter(o => o.status === 'Pending').length, e = $('navOrderCount'); e.textContent = n; e.classList.toggle('hidden', !n); }

const PAGE_TITLES = { dashboard: 'Dashboard', pos: 'Point of Sale', products: 'Products', orders: 'Orders', inventory: 'Inventory', reports: 'Reports', history: 'History' };
function navigate(page) {
  activePage = page;
  document.querySelectorAll('.page').forEach(p => p.classList.add('hidden'));
  $('page-' + page).classList.remove('hidden');
  document.querySelectorAll('.nav button').forEach(b => b.classList.toggle('active', b.dataset.page === page));
  $('topTitle').textContent = PAGE_TITLES[page]; $('crumb').textContent = PAGE_TITLES[page];
  $('sidebar').classList.remove('open');
  renderAll();
  if (page === 'products') renderProducts();
  if (page === 'orders') renderOrders();
  if (page === 'inventory') renderInventory();
  if (page === 'history') renderHistory();
  if (page === 'pos') { renderPOS(); $('posSearch').focus(); }
}
function renderAll() { renderDashboard(); renderOrderStats(); renderInventoryStats(); renderReportStats(); renderReportCharts(); navCount(); updateHeldBadge(); saveState(); }
function login() {
  $('loginScreen').classList.add('hidden'); $('app').classList.remove('hidden');
  $('todayLabel').textContent = new Date().toLocaleDateString('en-PH', { weekday: 'short', month: 'short', day: 'numeric' });
  navigate('dashboard');
}

/* ---------- 6. Dashboard & charts ---------- */
const orderCalc = o => { const subtotal = o.subtotal ?? o.items.reduce((n, i) => n + i.price * i.qty, 0), total = o.total, vatable = total / 1.12; return { subtotal, discount: o.discount?.amount || 0, total, vatable, vat: total - vatable }; };
const todaySales = () => { const t = new Date().toDateString(); return orders.filter(o => o.status === 'Completed' && new Date(o.created).toDateString() === t); };

function renderDashboard() {
  const hr = new Date().getHours();
  $('greeting').textContent = (hr < 12 ? 'Good morning' : hr < 18 ? 'Good afternoon' : 'Good evening') + ', Admin';
  const pending = orders.filter(o => o.status === 'Pending').length, completed = orders.filter(o => o.status === 'Completed');
  const sales = completed.reduce((a, o) => a + o.total, 0), today = todaySales(), todayTotal = today.reduce((a, o) => a + o.total, 0);
  const month = monthlyData(1)[0], low = products.filter(p => p.stock <= p.reorder);
  $('dashboardStats').innerHTML =
    statCard('Today’s sales', money(todayTotal), 'Completed sales today', '₱', '#e8f5ed') +
    statCard('Transactions today', today.length, 'Completed today', '▣', '#e8f0fc') +
    statCard('This month', money(month.sales), month.count + ' completed order' + (month.count === 1 ? '' : 's'), '↗', '#fff2dc') +
    statCard('All completed sales', money(sales), 'All-time total', '₱', '#f9e9e9') +
    statCard('Total orders', orders.length, 'All order statuses', '▣', '#e8f0fc') +
    statCard('Pending orders', pending, 'Awaiting review', '◷', '#fff2dc') +
    statCard('Products listed', products.length, 'Catalog items', '▤', '#f9e9e9') +
    statCard('Needs restock', low.length, 'Low or out of stock', '!', '#ffebeb');
  $('dashMonthly').innerHTML = monthlyChart(6, 'sales');
  const recent = orders.slice().sort((a, b) => new Date(b.created) - new Date(a.created)).slice(0, 5);
  $('recentOrders').innerHTML = tableHTML(['Order ID', 'Customer', 'Date', 'Total', 'Status'], recent.map(o => [`<strong>${esc(o.id)}</strong>`, `<div class="item-name">${esc(o.customer)}</div><div class="subline">${esc(o.type)}</div>`, dateShort(o.created), money(o.total), statusBadge(o.status)]), 'No orders yet.');
  const watch = low.slice().sort((a, b) => a.stock - b.stock).slice(0, 5);
  $('inventoryWatch').innerHTML = watch.length ? watch.map(p => `<div class="quick-row"><div class="quick-icon">${imgTag(p, 'mini-product-photo')}</div><div class="quick-copy"><strong>${esc(p.name)}</strong><small>${p.stock} ${esc(p.unit)} remaining · Reorder at ${p.reorder}</small><div class="progress"><span style="width:${Math.min(100, p.stock / Math.max(p.reorder, 1) * 100)}%;background:${p.stock === 0 ? '#c9343d' : '#d99a32'}"></span></div></div>${statusBadge(stockStatus(p))}</div>`).join('') : '<div class="empty">All products are above their reorder levels.</div>';
}

function monthlyData(n) {
  const now = new Date(), arr = [];
  for (let i = n - 1; i >= 0; i--) { const d = new Date(now.getFullYear(), now.getMonth() - i, 1); arr.push({ key: d.getFullYear() + '-' + d.getMonth(), label: d.toLocaleDateString('en-PH', { month: 'short' }), year: d.getFullYear(), sales: 0, count: 0 }); }
  orders.filter(o => o.status === 'Completed').forEach(o => { const d = new Date(o.created), m = arr.find(x => x.key === d.getFullYear() + '-' + d.getMonth()); if (m) { m.sales += o.total; m.count++; } });
  return arr;
}
function monthlyChart(n, metric) {
  const data = monthlyData(n), isSales = metric !== 'count', vals = data.map(d => isSales ? d.sales : d.count), peak = Math.max(...vals);
  if (peak <= 0) return '<div class="empty"><strong>No completed sales yet</strong>Complete a sale to see monthly totals here.</div>';
  const max = niceMax(peak), W = 820, H = 290, L = 58, R = 14, T = 26, B = 48, cw = W - L - R, ch = H - T - B, step = cw / n, bw = Math.min(52, step * .62);
  let grid = '';
  for (let i = 0; i <= 4; i++) { const v = max * i / 4, y = T + ch - ch * i / 4; grid += `<line class="chart-grid" x1="${L}" x2="${W - R}" y1="${y}" y2="${y}"/><text x="${L - 8}" y="${y + 4}" text-anchor="end">${isSales ? fmtK(v) : Math.round(v)}</text>`; }
  const bars = data.map((d, i) => {
    const v = vals[i], h = ch * v / max, x = L + step * i + (step - bw) / 2, y = T + ch - h, cur = i === n - 1, cx = x + bw / 2;
    return `<g><rect class="bar${cur ? ' current' : ''}" x="${x}" y="${y}" width="${bw}" height="${v > 0 ? Math.max(h, 2) : 0}" rx="4"><title>${d.label} ${d.year}: ${isSales ? money(v) : v + ' completed order' + (v === 1 ? '' : 's')}</title></rect>${v > 0 ? `<text class="bar-val" x="${cx}" y="${y - 6}" text-anchor="middle">${isSales ? fmtK(v) : v}</text>` : ''}<text x="${cx}" y="${H - B + 18}" text-anchor="middle">${d.label}</text>${(i === 0 || d.label === 'Jan') ? `<text class="yr" x="${cx}" y="${H - B + 33}" text-anchor="middle">${d.year}</text>` : ''}</g>`;
  }).join('');
  return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Monthly ${isSales ? 'sales' : 'completed orders'} bar graph">${grid}${bars}</svg>`;
}
function renderReportCharts() {
  const el = $('repMonthly'); if (!el) return;
  const n = Number($('repMonths').value) || 12, metric = $('repMetric').value, data = monthlyData(n), isSales = metric !== 'count';
  el.innerHTML = monthlyChart(n, metric);
  const total = data.reduce((a, d) => a + (isSales ? d.sales : d.count), 0), best = data.slice().sort((a, b) => (isSales ? b.sales - a.sales : b.count - a.count))[0], fmt = v => isSales ? money(v) : v;
  $('repMonthlySummary').innerHTML = total > 0 ? `<span>Total (${n} months): <strong>${fmt(total)}</strong></span><span>Monthly average: <strong>${fmt(isSales ? round2(total / n) : Math.round(total / n * 10) / 10)}</strong></span><span>Best month: <strong>${best.label} ${best.year}</strong> (${fmt(isSales ? best.sales : best.count)})</span>` : '';
}
function inventoryChart(list, mode) {
  if (!list.length) return '<div class="empty"><strong>No products to chart</strong>Try changing the search or stock filter.</div>';
  const pct = mode === 'pct', val = p => pct ? p.stock / Math.max(p.reorder, 1) * 100 : p.stock, mark = p => pct ? 100 : p.reorder;
  const max = Math.max(...list.map(p => Math.max(val(p), mark(p))), 1) * 1.08;
  return `<div class="chart-legend"><span><i class="dot" style="background:#2f9a6d"></i>In stock</span><span><i class="dot" style="background:#e0a030"></i>Low stock</span><span><i class="dot" style="background:#c9343d"></i>Out of stock</span><span><i class="dot mark"></i>Reorder level</span></div><div class="ibar-list">${list.map(p => {
    const st = stockStatus(p), cls = st === 'Out of Stock' ? 'out' : st === 'Low Stock' ? 'low' : 'ok';
    return `<div class="ibar-row"><div class="ibar-name"><strong>${esc(p.name)}</strong><small>${esc(p.sku)} · reorder at ${p.reorder}</small></div><div class="ibar-track" title="${esc(p.name)}: ${p.stock} ${esc(p.unit)} (reorder level ${p.reorder})"><div class="ibar-fill ${cls}" style="width:${val(p) / max * 100}%"></div><div class="ibar-mark" style="left:${mark(p) / max * 100}%"></div></div><div class="ibar-val">${pct ? Math.round(val(p)) + '%' : p.stock + ' ' + esc(p.unit)}</div></div>`;
  }).join('')}</div>`;
}

/* ---------- 7. Products page & delivery / pickup orders ---------- */
function renderProducts() {
  categoryChips('categoryChips', activeCategory, 'cat', c => { activeCategory = c; renderProducts(); });
  const q = ($('productSearch')?.value || '').toLowerCase(), sort = $('productSort')?.value || 'category';
  const list = products.filter(p => (activeCategory === 'All' || p.category === activeCategory) && (p.name + ' ' + p.sku + ' ' + p.category).toLowerCase().includes(q));
  list.sort((a, b) => sort === 'price-low' ? a.price - b.price : sort === 'price-high' ? b.price - a.price : sort === 'stock' ? a.stock - b.stock : sort === 'name' ? a.name.localeCompare(b.name) : byCategoryThenName(a, b));
  $('productGrid').innerHTML = list.length ? list.map(p => `<article class="product-card"><div class="product-art">${imgTag(p, 'product-photo')}<span class="stock-tag">${statusBadge(stockStatus(p))}</span></div><div class="product-info"><h3>${esc(p.name)}</h3><div class="sku">${esc(p.sku)} · ${esc(p.category)}</div><div class="product-price">${money(p.price)}<span class="muted tiny"> / ${esc(p.unit)}</span></div><div class="product-stock">${p.stock} ${esc(p.unit)} available</div><button class="${p.stock ? 'primary' : 'secondary'}" ${p.stock ? '' : 'disabled'} onclick="addToCart('${p.id}')">${p.stock ? '＋ Add to order' : 'Out of stock'}</button></div></article>`).join('')
    : '<div class="empty" style="grid-column:1/-1"><strong>No matching products</strong>Try another search or category.</div>';
  renderCart();
}
function addToCart(id) {
  const p = products.find(p => p.id === id);
  if (!p || p.stock <= 0) return toast('This item is currently out of stock.', 'error');
  if ((cart[id] || 0) >= p.stock) return toast('Quantity cannot exceed available stock.', 'error');
  cart[id] = (cart[id] || 0) + 1; renderCart(); toast(p.name + ' added to the current order.');
}
function updateQty(id, delta) {
  const p = products.find(p => p.id === id), next = (cart[id] || 0) + delta;
  if (next <= 0) delete cart[id]; else if (next > p.stock) return toast('Quantity exceeds available stock.', 'error'); else cart[id] = next;
  renderCart();
}
function removeCartItem(id) { delete cart[id]; renderCart(); toast('Item removed from order.'); }
function renderCart() {
  const entries = Object.entries(cart).filter(([id, q]) => q > 0 && products.some(p => p.id === id));
  const count = entries.reduce((n, [, q]) => n + q, 0), subtotal = entries.reduce((n, [id, q]) => n + products.find(p => p.id === id).price * q, 0);
  $('cartCount').textContent = count + ' item' + (count === 1 ? '' : 's');
  $('cartLines').innerHTML = entries.length ? entries.map(([id, q]) => {
    const p = products.find(p => p.id === id);
    return `<div class="cart-line"><div><strong>${esc(p.name)}</strong><small>${money(p.price)} × ${q} = ${money(p.price * q)}</small><div class="qty-controls"><button aria-label="Decrease ${esc(p.name)} quantity" onclick="updateQty('${id}',-1)">−</button><span>${q}</span><button aria-label="Increase ${esc(p.name)} quantity" onclick="updateQty('${id}',1)">+</button></div></div><button class="danger small" aria-label="Remove ${esc(p.name)}" onclick="removeCartItem('${id}')">×</button></div>`;
  }).join('') : '<div class="empty"><strong>Your order is empty</strong>Add products from the catalog to begin.</div>';
  $('cartSummary').innerHTML = `<div class="cart-total"><span>Subtotal</span><strong>${money(subtotal)}</strong></div><div class="cart-total"><span>Delivery fee</span><strong>${money(0)}</strong></div><div class="cart-total final"><span>Total</span><span>${money(subtotal)}</span></div>`;
  $('checkoutBtn').disabled = !entries.length; $('checkoutBtn').style.opacity = entries.length ? 1 : .55;
}
function reviewOrder() {
  const entries = Object.entries(cart).filter(([, q]) => q > 0);
  const customer = $('customerName').value.trim(), type = $('orderType').value, address = $('deliveryAddress').value.trim(), contact = $('customerContact').value.trim();
  if (!entries.length) return toast('Add at least one product before placing an order.', 'error');
  if (!customer) { $('customerName').focus(); return toast('Enter the customer name to continue.', 'error'); }
  if (type === 'Delivery' && !address) { $('deliveryAddress').focus(); return toast('Enter a delivery address to continue.', 'error'); }
  for (const [id, q] of entries) { const p = products.find(p => p.id === id); if (!p || q > p.stock) return toast('Stock changed for an item. Review the quantities.', 'error'); }
  const items = entries.map(([id, q]) => { const p = products.find(p => p.id === id); return { productId: id, name: p.name, price: p.price, qty: q }; });
  const total = items.reduce((n, i) => n + i.price * i.qty, 0);
  showModal('Review your order', `<div class="notice">Please check the details before confirming. You can cancel and edit the order if anything is incorrect.</div><div class="receipt"><div class="receipt-brand"><span class="logo">RJ</span><div><strong>RedJr Builders</strong><div class="muted tiny">Order summary</div></div></div><div class="receipt-row"><span>Customer</span><strong>${esc(customer)}</strong></div><div class="receipt-row"><span>Contact</span><strong>${esc(contact || 'Not provided')}</strong></div><div class="receipt-row"><span>Fulfillment</span><strong>${esc(type)}</strong></div>${type === 'Delivery' ? `<div class="receipt-row"><span>Address</span><strong>${esc(address)}</strong></div>` : ''}<div style="margin:15px 0 7px;font-weight:750">Items</div>${items.map(i => `<div class="receipt-row"><span>${esc(i.name)} × ${i.qty}</span><strong>${money(i.price * i.qty)}</strong></div>`).join('')}<div class="receipt-row total"><span>Total</span><span>${money(total)}</span></div></div>`,
    [{ label: 'Back to edit', class: 'secondary', action: closeModal }, { label: 'Confirm order', class: 'primary', action: () => placeOrder({ customer, contact, type, address, items, total }) }]);
}
function placeOrder(data) {
  data.items.forEach(i => { const p = products.find(p => p.id === i.productId); if (p) p.stock -= i.qty; });
  const order = { ...data, id: 'ORD-' + (counters.ord++), status: 'Pending', created: new Date().toISOString() };
  orders.unshift(order);
  logAction('Order created', `${order.id} for ${order.customer} · ${money(order.total)}`, 'Order');
  cart = {};
  ['customerName', 'customerContact', 'deliveryAddress'].forEach(id => $(id).value = '');
  $('orderType').value = 'Pickup'; $('addressField').classList.add('hidden');
  closeModal(); renderAll(); navigate('orders');
  showModal('Order placed successfully', `<div style="text-align:center;padding:8px 0 18px"><div style="font-size:42px">✓</div><h2 style="margin:8px 0">Order received</h2><p class="muted">The order has been saved and its stock quantities have been updated.</p><div class="receipt"><div class="receipt-row"><span>Order number</span><strong>${esc(order.id)}</strong></div><div class="receipt-row"><span>Customer</span><strong>${esc(order.customer)}</strong></div><div class="receipt-row total"><span>Total</span><span>${money(order.total)}</span></div><div style="margin-top:12px">${statusBadge(order.status)}</div></div></div>`,
    [{ label: 'Done', class: 'secondary', action: closeModal }, { label: 'View order', class: 'primary', action: () => { closeModal(); navigate('orders'); } }]);
  toast('Order ' + order.id + ' created successfully.');
}

function openAddProduct() {
  const catOptions = [...CATEGORIES, 'Other'].map(c => `<option>${c}</option>`).join('');
  showModal('Add a product', `<form id="addProductForm"><div class="form-grid">
    <div class="full"><label for="newName">Product name *</label><input id="newName" required placeholder="e.g. Masonry trowel"></div>
    <div><label for="newSku">SKU *</label><input id="newSku" required placeholder="e.g. TLS-012"></div>
    <div><label for="newCategory">Category *</label><select id="newCategory">${catOptions}</select></div>
    <div><label for="newPrice">Unit price (₱) *</label><input id="newPrice" type="number" min="0.01" step="0.01" required placeholder="0.00"></div>
    <div><label for="newStock">Initial stock *</label><input id="newStock" type="number" min="0" step="1" required value="0"></div>
    <div><label for="newReorder">Reorder level *</label><input id="newReorder" type="number" min="0" step="1" required value="10"></div>
    <div><label for="newUnit">Unit</label><select id="newUnit">${UNITS.map(u => `<option>${u}</option>`).join('')}</select></div>
    <div class="full"><label for="newImage">Photo link (optional)</label><input id="newImage" type="url" placeholder="https://… link of the product picture"></div>
  </div><div class="field-help">Required fields are marked with an asterisk. SKU should be unique. Leave the photo link empty to use a default picture.</div></form>`,
    [{ label: 'Cancel', class: 'secondary', action: closeModal }, { label: 'Add product', class: 'primary', action: () => {
      const name = $('newName').value.trim(), sku = $('newSku').value.trim(), category = $('newCategory').value, price = Number($('newPrice').value),
        stock = Number($('newStock').value), reorder = Number($('newReorder').value), unit = $('newUnit').value, image = $('newImage').value.trim();
      if (!name || !sku || !Number.isFinite(price) || price <= 0 || !Number.isInteger(stock) || stock < 0 || !Number.isInteger(reorder) || reorder < 0) return toast('Complete all fields with valid values.', 'error');
      if (products.some(p => p.sku.toLowerCase() === sku.toLowerCase())) return toast('That SKU already exists. Enter a unique SKU.', 'error');
      if (products.some(p => p.name.toLowerCase() === name.toLowerCase())) return toast('A product with that name already exists.', 'error');
      const p = { id: uid('P'), name, sku, category, price, stock, reorder, unit, image: /^https?:\/\//i.test(image) ? image : '' };
      products.push(p); logAction('Product added', `${p.name} (${p.sku}) added to catalog`, 'Inventory');
      closeModal(); renderAll(); renderProducts(); renderInventory(); toast('Product added to catalog.');
    } }]);
}

/* ---------- 8. Orders ---------- */
function renderOrderStats() {
  const pending = orders.filter(o => o.status === 'Pending').length, active = orders.filter(o => ['Confirmed', 'Ready for pickup', 'Out for delivery'].includes(o.status)).length, completed = orders.filter(o => o.status === 'Completed').length;
  $('orderStats').innerHTML = statCard('All orders', orders.length, 'Across all statuses', '▣', '#e8f0fc') + statCard('Pending', pending, 'Needs review', '◷', '#fff2dc') + statCard('In progress', active, 'Confirmed or being fulfilled', '↗', '#e8f0fc') + statCard('Completed', completed, 'Successfully fulfilled', '✓', '#e8f5ed');
}
function renderOrders() {
  if (!$('ordersTable')) return;
  const q = ($('orderSearch')?.value || '').toLowerCase(), status = $('orderStatusFilter')?.value || 'All';
  const list = orders.filter(o => (status === 'All' || o.status === status) && (o.id + ' ' + o.customer).toLowerCase().includes(q)).sort((a, b) => new Date(b.created) - new Date(a.created));
  $('ordersTable').innerHTML = tableHTML(['Order ID', 'Customer', 'Fulfillment', 'Date', 'Total', 'Status', 'Actions'], list.map(o => [`<strong>${esc(o.id)}</strong>`, `<div class="item-name">${esc(o.customer)}</div><div class="subline">${esc(o.contact || 'No contact')}</div>`, esc(o.type), dateShort(o.created), money(o.total), statusBadge(o.status), `<button class="outline small" onclick="viewOrder('${o.id}')">View</button> <button class="outline small" onclick="changeStatus('${o.id}')">Update</button>`]), 'No orders match this filter.');
  renderOrderStats();
}
function viewOrder(id) {
  const o = orders.find(o => o.id === id); if (!o) return;
  const c = orderCalc(o), row = (a, b) => `<div class="receipt-row"><span>${a}</span><strong>${b}</strong></div>`;
  showModal('Order details', `<div class="receipt">${row('Order ID', esc(o.id))}${row('Created', dateTime(o.created))}${row('Customer', esc(o.customer))}${row('Contact', esc(o.contact || 'Not provided'))}${row('Fulfillment', esc(o.type))}${o.address ? row('Address', esc(o.address)) : ''}<div class="receipt-row"><span>Status</span>${statusBadge(o.status)}</div>${o.payment ? row('Payment', esc(o.payment.method) + (o.payment.ref ? ' · ' + esc(o.payment.ref) : '')) : ''}<h4>Order items</h4>${o.items.map(i => `<div class="receipt-row"><span>${esc(i.name)} × ${i.qty}</span><strong>${money(i.price * i.qty)}</strong></div>`).join('')}${c.discount > 0 ? row(esc(o.discount.label || 'Discount'), '−' + money(c.discount)) : ''}<div class="receipt-row total"><span>Total</span><span>${money(o.total)}</span></div></div>`,
    [{ label: 'Close', class: 'secondary', action: closeModal }, { label: 'Print receipt', class: 'outline', action: () => printReceipt(id) }, { label: 'Update status', class: 'primary', action: () => { closeModal(); changeStatus(id); } }]);
}
function changeStatus(id) {
  const o = orders.find(o => o.id === id); if (!o) return;
  showModal('Update order status', `<p class="muted">Choose the current status for <strong>${esc(o.id)}</strong>.</p><label for="newStatus">Order status</label><select id="newStatus">${ORDER_STATUSES.map(s => `<option ${s === o.status ? 'selected' : ''}>${s}</option>`).join('')}</select><div class="notice" style="margin-top:14px">Cancelling an order returns its items to inventory. Re-opening a cancelled order deducts them again.</div>`,
    [{ label: 'Cancel', class: 'secondary', action: closeModal }, { label: 'Save status', class: 'primary', action: () => {
      const s = $('newStatus').value, old = o.status;
      if (s === old) { closeModal(); return; }
      if (s === 'Cancelled') {
        o.items.forEach(i => { const p = products.find(p => p.id === i.productId); if (p) p.stock += i.qty; });
      } else if (old === 'Cancelled') {
        const short = o.items.find(i => { const p = products.find(p => p.id === i.productId); return !p || p.stock < i.qty; });
        if (short) return toast('Not enough stock of ' + short.name + ' to re-open this order.', 'error');
        o.items.forEach(i => { const p = products.find(p => p.id === i.productId); p.stock -= i.qty; });
      }
      o.status = s; logAction('Order status updated', `${o.id}: ${old} → ${s}`, 'Order'); closeModal(); renderAll(); renderOrders(); toast('Order status updated to ' + s + '.');
    } }]);
}

/* ---------- 9. Inventory ---------- */
function renderInventoryStats() {
  const low = products.filter(p => p.stock > 0 && p.stock <= p.reorder).length, out = products.filter(p => p.stock === 0).length, units = products.reduce((n, p) => n + p.stock, 0);
  $('inventoryStats').innerHTML = statCard('Product types', products.length, 'Items in catalog', '▤', '#e8f0fc') + statCard('Total units', units, 'Across all listed products', '▦', '#e8f5ed') + statCard('Low stock', low, 'At or below reorder level', '◷', '#fff2dc') + statCard('Out of stock', out, 'Items unavailable', '!', '#f9e9e9');
}
function renderInventory() {
  if (!$('inventoryTable')) return;
  const q = ($('inventorySearch')?.value || '').toLowerCase(), filter = $('stockFilter')?.value || 'All';
  const list = products.filter(p => (p.name + ' ' + p.sku + ' ' + p.category).toLowerCase().includes(q) && (filter === 'All' || stockStatus(p) === filter)).sort((a, b) => a.stock - b.stock);
  $('inventoryTable').innerHTML = tableHTML(['Product / SKU', 'Category', 'Available stock', 'Reorder level', 'Status', 'Actions'], list.map(p => [`<div class="inv-product"><span class="inv-thumb">${imgTag(p, 'mini-product-photo')}</span><div><div class="item-name">${esc(p.name)}</div><div class="subline">${esc(p.sku)}</div></div></div>`, esc(p.category), `${p.stock} ${esc(p.unit)}`, p.reorder, statusBadge(stockStatus(p)), `<button class="outline small" onclick="adjustStock('${p.id}')">Update stock</button>`]), 'No inventory items match this filter.');
  renderInventoryStats(); renderInventoryChart(list);
}
function renderInventoryChart(list) { const el = $('invChart'); if (el) el.innerHTML = inventoryChart(list, $('invChartMode')?.value || 'qty'); }
function adjustStock(id) {
  const p = products.find(p => p.id === id);
  showModal('Update inventory', `<p class="muted">Update the available quantity for <strong>${esc(p.name)}</strong>.</p><div class="notice">Current stock: ${p.stock} ${esc(p.unit)}. Use a whole number zero or greater.</div><label for="stockInput">New available quantity (${esc(p.unit)})</label><input id="stockInput" type="number" min="0" step="1" value="${p.stock}" required><label for="stockReason">Reason for adjustment</label><select id="stockReason"><option>Stock count correction</option><option>New stock received</option><option>Damaged or missing items</option><option>Other</option></select>`,
    [{ label: 'Cancel', class: 'secondary', action: closeModal }, { label: 'Save quantity', class: 'primary', action: () => {
      const v = Number($('stockInput').value); if (!Number.isInteger(v) || v < 0) return toast('Enter a whole number of zero or greater.', 'error');
      const old = p.stock; p.stock = v; logAction('Inventory updated', `${p.name}: ${old} → ${v} (${$('stockReason').value})`, 'Inventory'); closeModal(); renderAll(); renderInventory(); toast('Stock quantity updated.');
    } }]);
}

/* ---------- 10. Reports & history ---------- */
function renderReportStats() {
  const completed = orders.filter(o => o.status === 'Completed'), sales = completed.reduce((n, o) => n + o.total, 0), avg = completed.length ? sales / completed.length : 0;
  $('reportStats').innerHTML = statCard('Completed sales', money(sales), 'Completed orders only', '₱', '#e8f5ed') + statCard('Orders', orders.length, 'All recorded orders', '▣', '#e8f0fc') + statCard('Average completed order', money(avg), 'Sales divided by completed orders', '↗', '#fff2dc') + statCard('Inventory value', money(products.reduce((n, p) => n + p.stock * p.price, 0)), 'Stock × listed unit price', '▨', '#f9e9e9');
  $('statusBars').innerHTML = ORDER_STATUSES.map(s => {
    const n = orders.filter(o => o.status === s).length;
    return `<div style="margin-bottom:16px"><div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:6px"><span>${s}</span><strong>${n}</strong></div><div class="progress"><span style="width:${orders.length ? n / orders.length * 100 : 0}%;background:${s === 'Cancelled' ? '#c9343d' : s === 'Completed' ? '#24865b' : '#3578c8'}"></span></div></div>`;
  }).join('');
  const counts = {}; orders.filter(o => o.status !== 'Cancelled').forEach(o => o.items.forEach(i => counts[i.name] = (counts[i.name] || 0) + i.qty));
  const top = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 6);
  $('topProducts').innerHTML = top.length ? top.map(([name, n], i) => `<div class="quick-row" style="margin-bottom:14px"><div class="quick-icon">${i + 1}</div><div class="quick-copy"><strong>${esc(name)}</strong><small>${n} units across orders</small><div class="progress"><span style="width:${n / top[0][1] * 100}%"></span></div></div></div>`).join('') : '<div class="empty">No order items to report.</div>';
}
function renderHistory() {
  if (!$('historyTable')) return;
  const q = ($('historySearch')?.value || '').toLowerCase();
  const list = history.filter(h => (h.action + ' ' + h.detail + ' ' + h.type).toLowerCase().includes(q));
  $('historyTable').innerHTML = tableHTML(['Date & time', 'Activity', 'Details', 'Type'], list.map(h => [dateTime(h.time), `<strong>${esc(h.action)}</strong>`, esc(h.detail), statusBadge(h.type)]), 'No matching activity.');
}
function clearHistory() {
  showModal('Clear activity history?', `<p>This removes the visible activity entries. It will not change products or orders.</p>`, [
    { label: 'Keep history', class: 'secondary', action: closeModal },
    { label: 'Clear history', class: 'danger', action: () => { history = []; saveState(); closeModal(); renderHistory(); toast('Activity history cleared.'); } }]);
}
function exportCSV(kind) {
  let rows;
  if (kind === 'inventory') rows = [['SKU', 'Product', 'Category', 'Price', 'Stock', 'Unit', 'Reorder level', 'Status'], ...products.map(p => [p.sku, p.name, p.category, p.price, p.stock, p.unit, p.reorder, stockStatus(p)])];
  else if (kind === 'history') rows = [['Time', 'Action', 'Details', 'Type'], ...history.map(h => [h.time, h.action, h.detail, h.type])];
  else rows = [['Order ID', 'Customer', 'Contact', 'Fulfillment', 'Address', 'Date', 'Status', 'Subtotal', 'Discount', 'Total', 'Payment method', 'Items'], ...orders.map(o => [o.id, o.customer, o.contact, o.type, o.address, o.created, o.status, o.subtotal ?? o.total, o.discount?.amount || 0, o.total, o.payment?.method || '', o.items.map(i => `${i.name} x${i.qty}`).join('; ')])];
  const csv = rows.map(r => r.map(v => '"' + String(v ?? '').replace(/"/g, '""') + '"').join(',')).join('\r\n');
  const url = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })), a = document.createElement('a');
  a.href = url; a.download = 'redjr-' + kind + '-' + new Date().toISOString().slice(0, 10) + '.csv'; a.click(); URL.revokeObjectURL(url); toast('CSV export prepared.');
}

/* ---------- 11. Point of Sale ---------- */
function posFiltered() {
  const q = ($('posSearch')?.value || '').trim().toLowerCase();
  return products.filter(p => (posCat === 'All' || p.category === posCat) && (!q || (p.name + ' ' + p.sku + ' ' + p.category).toLowerCase().includes(q))).sort(byCategoryThenName);
}
const posEntries = () => Object.entries(posCart).filter(([id, q]) => q > 0 && products.some(p => p.id === id)).map(([id, q]) => ({ p: products.find(p => p.id === id), q }));
function posCalc() {
  const es = posEntries(), subtotal = round2(es.reduce((n, e) => n + e.p.price * e.q, 0)), t = posDisc.type, v = Number(posDisc.value) || 0;
  let disc = 0, label = '';
  if (t === 'senior') { disc = subtotal * .2; label = 'Senior citizen 20%'; }
  else if (t === 'pwd') { disc = subtotal * .2; label = 'PWD 20%'; }
  else if (t === 'pct') { disc = subtotal * Math.min(Math.max(v, 0), 100) / 100; label = 'Discount ' + v + '%'; }
  else if (t === 'amt') { disc = Math.max(v, 0); label = 'Discount'; }
  disc = Math.min(round2(disc), subtotal);
  return { es, subtotal, disc, label, total: round2(subtotal - disc), count: es.reduce((n, e) => n + e.q, 0) };
}
function renderPOS() {
  if (!$('posGrid')) return;
  categoryChips('posCategoryChips', posCat, 'pcat', c => { posCat = c; renderPOS(); });
  const list = posFiltered();
  $('posGrid').innerHTML = list.length ? list.map(p => {
    const st = stockStatus(p), inCart = posCart[p.id] || 0;
    return `<button class="pos-tile" ${p.stock > 0 ? '' : 'disabled'} onclick="posAdd('${p.id}')" aria-label="Add ${esc(p.name)}"><span class="pos-img">${imgTag(p, 'pos-photo')}</span>${st !== 'In Stock' ? statusBadge(st) : ''}${inCart ? `<span class="in-cart">${inCart}</span>` : ''}<strong>${esc(p.name)}</strong><span class="pos-price">${money(p.price)}</span><small>${p.stock} ${esc(p.unit)} · ${esc(p.sku)}</small></button>`;
  }).join('') : '<div class="empty" style="grid-column:1/-1"><strong>No matching products</strong>Try another search or category.</div>';
  renderPosCart(); updateHeldBadge();
}
function renderPosCart() {
  const c = posCalc();
  $('posCount').textContent = c.count + ' item' + (c.count === 1 ? '' : 's');
  $('posLines').innerHTML = c.es.length ? c.es.map(({ p, q }) => `<div class="cart-line"><div><strong>${esc(p.name)}</strong><small>${money(p.price)} × ${q} = ${money(p.price * q)}</small><div class="qty-controls"><button aria-label="Decrease ${esc(p.name)}" onclick="posQty('${p.id}',-1)">−</button><input class="qty-input" type="number" min="1" max="${p.stock}" value="${q}" aria-label="Quantity of ${esc(p.name)}" onchange="posSetQty('${p.id}',this.value)"><button aria-label="Increase ${esc(p.name)}" onclick="posQty('${p.id}',1)">+</button></div></div><button class="danger small" aria-label="Remove ${esc(p.name)}" onclick="posRemove('${p.id}')">×</button></div>`).join('')
    : '<div class="empty"><strong>No items yet</strong>Tap a product or scan a barcode / SKU.</div>';
  renderPosSummary();
}
function renderPosSummary() {
  const c = posCalc(), vat = c.total - c.total / 1.12;
  $('posSummary').innerHTML = `<div class="cart-total"><span>Subtotal</span><strong>${money(c.subtotal)}</strong></div>${c.disc > 0 ? `<div class="cart-total"><span>${esc(c.label)}</span><strong>−${money(c.disc)}</strong></div>` : ''}<div class="cart-total"><span class="muted">VAT (12%) included</span><span class="muted">${money(vat)}</span></div><div class="cart-total final"><span>Total</span><span>${money(c.total)}</span></div>`;
  const b = $('posChargeBtn'); b.textContent = c.es.length ? 'Charge ' + money(c.total) + '  (F9)' : 'Charge'; b.disabled = !c.es.length; b.style.opacity = c.es.length ? 1 : .55;
  $('posHoldBtn').disabled = !c.es.length;
  const mb = $('posMobileBar'); mb.classList.toggle('hidden', !c.es.length); mb.textContent = 'View sale · ' + c.count + ' item' + (c.count === 1 ? '' : 's') + ' · ' + money(c.total);
}
function posAdd(id) {
  const p = products.find(p => p.id === id);
  if (!p || p.stock <= 0) return toast('This item is out of stock.', 'error');
  if ((posCart[id] || 0) >= p.stock) return toast('Only ' + p.stock + ' ' + p.unit + ' available.', 'error');
  posCart[id] = (posCart[id] || 0) + 1; renderPOS();
}
function posQty(id, d) {
  const p = products.find(p => p.id === id), n = (posCart[id] || 0) + d;
  if (n <= 0) delete posCart[id]; else if (n > p.stock) return toast('Only ' + p.stock + ' ' + p.unit + ' available.', 'error'); else posCart[id] = n;
  renderPOS();
}
function posSetQty(id, v) {
  const p = products.find(p => p.id === id), n = Math.floor(Number(v));
  if (!n || n <= 0) delete posCart[id]; else if (n > p.stock) { posCart[id] = p.stock; toast('Only ' + p.stock + ' ' + p.unit + ' available.', 'error'); } else posCart[id] = n;
  renderPOS();
}
function posRemove(id) { delete posCart[id]; renderPOS(); }
function resetPosSale() { posCart = {}; posDisc = { type: 'none', value: 0 }; syncDiscUI(); const c = $('posCustomer'); if (c) c.value = ''; }
function syncDiscUI() {
  const t = $('posDiscType'); if (!t) return;
  t.value = posDisc.type; const show = posDisc.type === 'pct' || posDisc.type === 'amt';
  $('posDiscValWrap').classList.toggle('hidden', !show); $('posDiscLabel').textContent = posDisc.type === 'pct' ? 'Percent (%)' : 'Amount (₱)'; $('posDiscVal').value = show && posDisc.value ? posDisc.value : '';
}
function confirmClearSale() {
  if (!posEntries().length) return;
  showModal('Clear this sale?', `<p>All items in the current sale will be removed.</p>`, [
    { label: 'Keep sale', class: 'secondary', action: closeModal },
    { label: 'Clear sale', class: 'danger', action: () => { resetPosSale(); closeModal(); renderPOS(); } }]);
}

/* Hold / resume */
function updateHeldBadge() { const b = $('heldCount'); if (b) { b.textContent = held.length; b.className = 'badge ' + (held.length ? 'b-amber' : 'b-gray'); } }
function holdSale() {
  const c = posCalc(); if (!c.es.length) return toast('Nothing to hold. Add items first.', 'error');
  held.unshift({ id: 'HOLD-' + String(Date.now()).slice(-5), time: new Date().toISOString(), cart: { ...posCart }, customer: $('posCustomer').value.trim(), disc: { ...posDisc } });
  logAction('Sale held', c.count + ' item(s) · ' + money(c.total), 'Sale'); resetPosSale(); saveState(); renderPOS(); toast('Sale put on hold.');
}
function openHeld() {
  const rows = held.map(h => {
    const items = Object.entries(h.cart).filter(([id]) => products.some(p => p.id === id)), count = items.reduce((n, [, q]) => n + q, 0), sub = items.reduce((n, [id, q]) => n + products.find(p => p.id === id).price * q, 0);
    return [`<strong>${esc(h.id)}</strong><div class="subline">${esc(h.customer || 'Walk-in customer')}</div>`, dateTime(h.time), count + ' item(s)', money(sub), `<button class="primary small" onclick="resumeHeld('${h.id}')">Resume</button> <button class="danger small" onclick="deleteHeld('${h.id}')">Delete</button>`];
  });
  showModal('Held sales', tableHTML(['Hold ID', 'Time', 'Items', 'Subtotal', ''], rows, 'No held sales.'), [{ label: 'Close', class: 'secondary', action: closeModal }]);
}
function resumeHeld(id) {
  const h = held.find(x => x.id === id); if (!h) return;
  if (Object.keys(posCart).length) return toast('Hold or clear the current sale first.', 'error');
  posCart = { ...h.cart }; posDisc = { ...h.disc }; held = held.filter(x => x.id !== id); saveState();
  $('posCustomer').value = h.customer || ''; syncDiscUI(); closeModal(); renderPOS(); toast('Sale resumed.');
}
function deleteHeld(id) { held = held.filter(x => x.id !== id); saveState(); updateHeldBadge(); openHeld(); }

/* Payment */
function openPayment() {
  const c = posCalc(); if (!c.es.length) return toast('Add items to the sale first.', 'error');
  for (const e of c.es) if (e.q > e.p.stock) return toast('Only ' + e.p.stock + ' ' + e.p.unit + ' of ' + e.p.name + ' left. Adjust the quantity.', 'error');
  const quick = [...new Set([c.total, Math.ceil(c.total / 50) * 50, Math.ceil(c.total / 100) * 100, Math.ceil(c.total / 500) * 500, Math.ceil(c.total / 1000) * 1000])].filter(v => v >= c.total).slice(0, 5);
  showModal('Take payment', `<div class="pay-due"><span>Amount due</span><strong>${money(c.total)}</strong></div><label for="payMethod">Payment method</label><select id="payMethod">${PAY_METHODS.map(m => `<option>${m}</option>`).join('')}</select><div id="cashBox"><label for="payTendered">Cash received (₱)</label><input id="payTendered" type="number" min="0" step="0.01" inputmode="decimal" placeholder="0.00"><div class="quick-cash">${quick.map((v, i) => `<button type="button" class="outline small" data-q="${v}">${i === 0 ? 'Exact' : money(v)}</button>`).join('')}</div></div><div id="refBox" class="hidden"><label for="payRef">Reference no. (optional)</label><input id="payRef" placeholder="Transaction / reference number"></div><div class="change-box"><span id="changeLabel">Change</span><strong id="payChange">${money(0)}</strong></div>`,
    [{ label: 'Cancel', class: 'secondary', action: closeModal }, { label: 'Complete sale', class: 'primary', action: submitPayment }]);
  const method = $('payMethod'), tendered = $('payTendered');
  const update = () => {
    const cash = method.value === 'Cash'; $('cashBox').classList.toggle('hidden', !cash); $('refBox').classList.toggle('hidden', cash);
    const diff = round2((Number(tendered.value) || 0) - c.total);
    $('changeLabel').textContent = cash && diff < 0 ? 'Still needed' : 'Change';
    $('payChange').textContent = cash ? money(Math.abs(diff)) : money(0); $('payChange').style.color = cash && diff < 0 ? '#b12b32' : '';
  };
  method.addEventListener('change', update); tendered.addEventListener('input', update);
  tendered.addEventListener('keydown', e => { if (e.key === 'Enter') submitPayment(); });
  document.querySelectorAll('[data-q]').forEach(b => b.addEventListener('click', () => { tendered.value = b.dataset.q; update(); }));
  tendered.focus();
}
function submitPayment() {
  const c = posCalc(), method = $('payMethod').value; let tendered = c.total, change = 0, ref = '';
  if (method === 'Cash') {
    tendered = round2(Number($('payTendered').value));
    if (!(tendered >= c.total)) return toast('Cash received is less than the amount due.', 'error');
    change = round2(tendered - c.total);
  } else ref = $('payRef').value.trim();
  finishSale(method, tendered, change, ref);
}
function finishSale(method, tendered, change, ref) {
  const c = posCalc();
  for (const e of c.es) if (e.q > e.p.stock) { closeModal(); return toast('Stock changed for ' + e.p.name + '. Review the sale.', 'error'); }
  c.es.forEach(e => e.p.stock -= e.q);
  const id = 'POS-' + String(counters.pos++).padStart(6, '0'), customer = $('posCustomer').value.trim() || 'Walk-in customer';
  const o = { id, customer, contact: '', type: 'Walk-in', address: '', items: c.es.map(e => ({ productId: e.p.id, name: e.p.name, price: e.p.price, qty: e.q })), subtotal: c.subtotal, discount: { label: c.label, amount: c.disc }, total: c.total, status: 'Completed', created: new Date().toISOString(), payment: { method, tendered, change, ref }, cashier: 'Admin', source: 'POS' };
  orders.unshift(o); logAction('Sale completed', `${id} · ${customer} · ${money(o.total)} (${method})`, 'Sale');
  resetPosSale(); closeModal(); renderAll(); renderPOS(); showSaleDone(o);
}
function showSaleDone(o) {
  showModal('Sale complete', `<div style="text-align:center;padding:4px 0 14px"><div style="font-size:40px;color:#24865b">✓</div><h2 style="margin:6px 0 2px">${money(o.total)}</h2><div class="muted">${esc(o.id)} · ${esc(o.payment.method)}</div></div><div class="receipt"><div class="receipt-row"><span>Amount received</span><strong>${money(o.payment.tendered)}</strong></div><div class="receipt-row total"><span>Change</span><span>${money(o.payment.change)}</span></div></div>`,
    [{ label: 'Print receipt', class: 'outline', action: () => printReceipt(o.id) }, { label: 'New sale', class: 'primary', action: () => { closeModal(); const s = $('posSearch'); if (s) s.focus(); } }]);
}

/* Receipts & printing */
function printDoc(html) {
  const f = document.createElement('iframe'); f.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0'; document.body.appendChild(f);
  const d = f.contentWindow.document; d.open(); d.write(html); d.close();
  setTimeout(() => { try { f.contentWindow.focus(); f.contentWindow.print(); } catch (e) { toast('Could not open the print dialog.', 'error'); } setTimeout(() => f.remove(), 2000); }, 300);
}
const printCSS = `<style>@page{margin:6mm}body{font:12px/1.4 'Courier New',monospace;width:72mm;margin:0 auto;color:#000}h1{font-size:15px;text-align:center;margin:0}.c{text-align:center}.r{display:flex;justify-content:space-between;gap:8px}.b{font-weight:bold;font-size:14px}hr{border:0;border-top:1px dashed #000;margin:7px 0}.it{margin-bottom:3px}.s{padding-left:8px}</style>`;
const printRow = (a, b, cls = '') => `<div class="r ${cls}"><span>${a}</span><span>${b}</span></div>`;
function receiptDoc(o) {
  const c = orderCalc(o), r = printRow;
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Receipt ${esc(o.id)}</title>${printCSS}</head><body><h1>RedJr Builders</h1><div class="c">&amp; Construction Supply</div><hr>${r('Receipt', esc(o.id))}${r('Date', dateTime(o.created))}${r('Customer', esc(o.customer))}${r('Cashier', esc(o.cashier || 'Admin'))}${o.type && o.type !== 'Walk-in' ? r('Type', esc(o.type)) : ''}<hr>${o.items.map(i => `<div class="it"><div>${esc(i.name)}</div>${r('<span class="s">' + i.qty + ' × ' + money(i.price) + '</span>', money(i.price * i.qty))}</div>`).join('')}<hr>${r('Subtotal', money(c.subtotal))}${c.discount > 0 ? r(esc(o.discount.label || 'Discount'), '−' + money(c.discount)) : ''}${r('TOTAL', money(c.total), 'b')}${r('VATable sales', money(c.vatable))}${r('VAT (12%)', money(c.vat))}<hr>${o.payment ? r(esc(o.payment.method), money(o.payment.tendered)) + (o.payment.method === 'Cash' ? r('Change', money(o.payment.change)) : '') + (o.payment.ref ? r('Ref', esc(o.payment.ref)) : '') : r('Payment', 'Not recorded')}<hr><div class="c">Thank you for shopping with us!</div><div class="c" style="font-size:10px;margin-top:4px">Sales receipt · not an official BIR receipt</div></body></html>`;
}
function printReceipt(id) { const o = orders.find(x => x.id === id); if (o) printDoc(receiptDoc(o)); }

/* Today's summary (end-of-day report) */
function daySummary() {
  const list = todaySales(), by = {};
  list.forEach(o => { const m = o.payment?.method || 'Not recorded'; by[m] = (by[m] || 0) + o.total; });
  const gross = list.reduce((n, o) => n + orderCalc(o).subtotal, 0), disc = list.reduce((n, o) => n + (o.discount?.amount || 0), 0), total = list.reduce((n, o) => n + o.total, 0);
  return { list, by, gross, disc, total, vat: total - total / 1.12 };
}
function openDaySummary() {
  const s = daySummary(), r = printRow;
  showModal('Today’s sales summary', `<div class="notice">${new Date().toLocaleDateString('en-PH', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</div><div class="receipt"><div class="receipt-row"><span>Transactions</span><strong>${s.list.length}</strong></div><div class="receipt-row"><span>Gross sales</span><strong>${money(s.gross)}</strong></div><div class="receipt-row"><span>Discounts</span><strong>−${money(s.disc)}</strong></div><div class="receipt-row"><span>VAT included (12%)</span><strong>${money(s.vat)}</strong></div><div class="receipt-row total"><span>Net sales</span><span>${money(s.total)}</span></div></div><h4 style="margin:16px 0 4px">By payment method</h4>${Object.keys(s.by).length ? Object.entries(s.by).map(([m, v]) => `<div class="receipt-row"><span>${esc(m)}</span><strong>${money(v)}</strong></div>`).join('') : '<div class="muted">No sales yet today.</div>'}<div class="field-help">Cash in drawer should equal your opening cash plus the Cash line above.</div>`,
    [{ label: 'Close', class: 'secondary', action: closeModal }, { label: 'Print summary', class: 'primary', action: () => printDoc(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>Daily summary</title>${printCSS}</head><body><h1>RedJr Builders</h1><div class="c">Daily sales summary</div><div class="c">${dateTime(new Date())}</div><hr>${r('Transactions', s.list.length)}${r('Gross sales', money(s.gross))}${r('Discounts', '−' + money(s.disc))}${r('VAT included', money(s.vat))}${r('NET SALES', money(s.total), 'b')}<hr>${Object.entries(s.by).map(([m, v]) => r(esc(m), money(v))).join('')}</body></html>`) }]);
}

/* ---------- 12. Event wiring ---------- */
$('loginForm').addEventListener('submit', e => { e.preventDefault(); logAction('Signed in', 'Admin entered the store workspace', 'Account'); login(); toast('Welcome to RedJr Builders. You are signed in.'); });
document.querySelectorAll('.nav button').forEach(b => b.addEventListener('click', () => navigate(b.dataset.page)));
$('mobileMenu').addEventListener('click', () => $('sidebar').classList.toggle('open'));
$('profileButton').addEventListener('click', () => $('profilePop').classList.toggle('hidden'));
const closeProfile = () => $('profilePop').classList.add('hidden');
$('logoutButton').addEventListener('click', () => { closeProfile(); $('app').classList.add('hidden'); $('loginScreen').classList.remove('hidden'); toast('You have signed out.'); });
$('profileDetails').addEventListener('click', () => { closeProfile(); showModal('Account details', `<div class="receipt"><strong>Store administrator</strong><p class="muted">RedJr Builders and Construction Supply</p><div class="receipt-row"><span>Email</span><strong>admin@redjr.test</strong></div><div class="receipt-row"><span>Access</span><strong>Demo administrator</strong></div><div class="receipt-row"><span>Environment</span><strong>Browser-only prototype</strong></div></div>`, [{ label: 'Close', class: 'primary', action: closeModal }]); });
$('exportData').addEventListener('click', () => { closeProfile(); exportCSV('orders'); });
$('resetDemo').addEventListener('click', () => { closeProfile(); resetDemo(); });
$('startFresh').addEventListener('click', () => { closeProfile(); startFresh(); });

$('orderType').addEventListener('change', e => $('addressField').classList.toggle('hidden', e.target.value !== 'Delivery'));
$('productSearch').addEventListener('input', renderProducts); $('productSort').addEventListener('change', renderProducts);
$('checkoutBtn').addEventListener('click', reviewOrder);
$('clearCartBtn').addEventListener('click', () => { cart = {}; renderProducts(); toast('Current order cleared.'); });
$('orderSearch').addEventListener('input', renderOrders); $('orderStatusFilter').addEventListener('change', renderOrders);
$('inventorySearch').addEventListener('input', renderInventory); $('stockFilter').addEventListener('change', renderInventory); $('invChartMode').addEventListener('change', renderInventory);
$('historySearch').addEventListener('input', renderHistory);
$('repMonths').addEventListener('change', renderReportCharts); $('repMetric').addEventListener('change', renderReportCharts);

$('posSearch').addEventListener('input', renderPOS);
$('posSearch').addEventListener('keydown', e => {
  if (e.key !== 'Enter') return;
  const q = e.target.value.trim().toLowerCase(); if (!q) return;
  let m = products.find(p => p.sku.toLowerCase() === q);
  if (!m) { const f = posFiltered(); if (f.length === 1) m = f[0]; }
  if (m) { e.target.value = ''; posAdd(m.id); } else toast('No single match. Narrow the search or tap a product.', 'error');
});
$('posChargeBtn').addEventListener('click', openPayment);
$('posMobileBar').addEventListener('click', () => $('posCartPanel').scrollIntoView({ behavior: 'smooth', block: 'start' }));
$('posHoldBtn').addEventListener('click', holdSale); $('posClearBtn').addEventListener('click', confirmClearSale); $('posHeldBtn').addEventListener('click', openHeld);
$('posDiscType').addEventListener('change', e => { posDisc.type = e.target.value; posDisc.value = 0; syncDiscUI(); renderPosSummary(); });
$('posDiscVal').addEventListener('input', e => { posDisc.value = Number(e.target.value) || 0; renderPosSummary(); });

window.addEventListener('keydown', e => {
  if (e.key === 'Escape') { closeModal(); closeProfile(); $('sidebar').classList.remove('open'); }
  if (activePage !== 'pos' || $('app').classList.contains('hidden')) return;
  if (e.key === 'F2') { e.preventDefault(); $('posSearch').focus(); }
  if (e.key === 'F9' && !document.querySelector('.modal-backdrop')) { e.preventDefault(); openPayment(); }
});

renderAll();
