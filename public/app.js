/* ============================================================
   Ganancia Academy Platform — app.js
   Vanilla JS SPA: state, data, routing, views, charts, tree.
   ============================================================ */

/* ---------------- Simulated data ---------------- */
let DB = window.__INITIAL_DB__ || {
  usuarios: [], solicitudes: [], retiros: [], utilidades: [], historial: [], notificaciones: [], escuela: [],
  arbol: { nombre: "Sin red", id: "", cupos: 0, hijos: [] },
  festivos: ["2026-01-01 · Año Nuevo", "2026-01-06 · Reyes Magos", "2026-03-23 · San José", "2026-05-01 · Día del Trabajo"],
  config: { gananciaPct: 2, moodle: "https://escuela.plataformainversion.co", wompi: "activo", moneda: "COP", retiroMin: 50000, retiroMax: 2000000 },
};

/* ---------------- App state ---------------- */
const state = {
  role: "admin",
  view: "dashboard",
  user: { nombre: "Admin General", inicial: "A", rol: "Administrador" },
  gananciaFilter: "todas",
  retiroFilter: "todos",
  userFilter: "",
  userStatusFilter: "todos",
  charts: {},
};

/* ---------------- Navigation config ---------------- */
const NAV = {
  admin: [
    { group: "General" },
    { id: "dashboard", icon: "bi-grid-1x2", label: "Dashboard" },
    { id: "usuarios", icon: "bi-people", label: "Usuarios" },
    { group: "Operación" },
    { id: "solicitudes", icon: "bi-file-earmark-check", label: "Ganancias", badge: 2 },
    { id: "utilidades", icon: "bi-graph-up-arrow", label: "Utilidades" },
    { id: "retiros", icon: "bi-cash-stack", label: "Retiros", badge: 2 },
    { id: "referidos", icon: "bi-diagram-3", label: "Referidos" },
    { group: "Académico" },
    { id: "escuela", icon: "bi-mortarboard", label: "Diplomado / Escuela" },
    { id: "reportes", icon: "bi-bar-chart-line", label: "Reportes" },
    { id: "settings", icon: "bi-gear", label: "Configuración" },
  ],
  user: [
    { group: "Mi cuenta" },
    { id: "dashboard", icon: "bi-grid-1x2", label: "Mi Dashboard" },
    { id: "profile", icon: "bi-person", label: "Mi Perfil" },
    { group: "Ganancia y finanzas" },
    { id: "retorno", icon: "bi-graph-up-arrow", label: "Mi Retorno" },
    { id: "retirar", icon: "bi-cash-coin", label: "Retirar" },
    { group: "Red y formación" },
    { id: "equipo", icon: "bi-diagram-3", label: "Mi Equipo" },
    { id: "escuela", icon: "bi-mortarboard", label: "Escuela" },
    { id: "historial", icon: "bi-clock-history", label: "Historial" },
    { id: "soporte", icon: "bi-life-preserver", label: "Soporte" },
  ],
};

const VIEW_TITLES = {
  dashboard: state => state.role === "admin" ? ["Dashboard", "Resumen operativo de la plataforma"] : ["Mi Dashboard", "Resumen de tu actividad"],
  usuarios: () => ["Usuarios", "Gestión y control de cuentas registradas"],
  solicitudes: () => ["Ganancias", "Revisión manual de ganancias"],
  utilidades: () => ["Utilidades", "Carga de utilidad por días hábiles"],
  retiros: () => ["Retiros", "Procesamiento de retiros solicitados"],
  referidos: () => ["Referidos", "Estructura de la red de referidos"],
  escuela: state => state.role === "admin" ? ["Diplomado / Escuela", "Control de accesos académicos"] : ["Escuela", "Tu formación académica"],
  reportes: () => ["Reportes", "Indicadores generales de la plataforma"],
  settings: () => ["Configuración", "Parámetros de la plataforma"],
  profile: () => ["Mi Perfil", "Datos personales y bancarios"],
  retorno: () => ["Mi Retorno", "Seguimiento de tu retorno acumulado"],
  retirar: () => ["Retirar", "Solicitud de retiro de fondos disponibles"],
  equipo: () => ["Mi Equipo", "Tu red de referidos"],
  historial: () => ["Historial", "Movimientos y registros"],
  soporte: () => ["Soporte", "Centro de ayuda"],
};

/* ---------------- Helpers ---------------- */
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

function cop(n) {
  if (n === 0) return "$0";
  const sign = n < 0 ? "-" : "";
  return sign + "$" + Math.abs(Math.round(n)).toLocaleString("es-CO");
}
function escapeHtml(s) { return String(s).replace(/[&<>"']/g, c => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[c])); }
function initials(name) { return name.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase(); }

const BADGE_MAP = {
  activo: "b-active", pendiente: "b-pending", revision: "b-review", bloqueado: "b-blocked",
  pagado: "b-paid", proceso: "b-processing", rechazado: "b-rejected",
  aprobada: "b-active", rechazada: "b-rejected", suspendido: "b-blocked",
};
const BADGE_LABEL = {
  activo: "Activo", pendiente: "Pendiente", revision: "En revisión", bloqueado: "Bloqueado",
  pagado: "Pagado", proceso: "En proceso", rechazado: "Rechazado",
  aprobada: "Aprobada", rechazada: "Rechazada", suspendido: "Suspendido",
};
function badge(estado) {
  return `<span class="badge ${BADGE_MAP[estado] || "b-pending"}">${BADGE_LABEL[estado] || estado}</span>`;
}

/* Animated counter */
function animateCounters(ctx = document) {
  $$("[data-count]", ctx).forEach(el => {
    const target = parseFloat(el.dataset.count);
    const isCop = el.dataset.format === "cop";
    const isPct = el.dataset.format === "pct";
    const dur = 900;
    const start = performance.now();
    function step(now) {
      const p = Math.min((now - start) / dur, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      const val = target * eased;
      el.textContent = isCop ? cop(val) : isPct ? val.toFixed(0) + "%" : Math.round(val).toLocaleString("es-CO");
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  });
}

/* ---------------- Toasts ---------------- */
function toast(title, sub = "", type = "success") {
  const icons = { success: "bi-check-lg", error: "bi-x-lg", info: "bi-info-lg" };
  const el = document.createElement("div");
  el.className = `toast ${type}`;
  el.innerHTML = `<div class="t-icon"><i class="bi ${icons[type]}"></i></div>
    <div><p>${escapeHtml(title)}</p>${sub ? `<small>${escapeHtml(sub)}</small>` : ""}</div>`;
  $("#toastRoot").appendChild(el);
  setTimeout(() => { el.classList.add("out"); setTimeout(() => el.remove(), 320); }, 3600);
}

/* ---------------- Modal ---------------- */
function openModal(html, size = "") {
  const root = $("#modalRoot");
  root.innerHTML = `<div class="modal-overlay" id="modalOverlay"><div class="modal ${size}">${html}</div></div>`;
  $("#modalOverlay").addEventListener("click", e => { if (e.target.id === "modalOverlay") closeModal(); });
  document.addEventListener("keydown", escClose);
}
function closeModal() { $("#modalRoot").innerHTML = ""; document.removeEventListener("keydown", escClose); }
function escClose(e) { if (e.key === "Escape") closeModal(); }

/* ---------------- Theme ---------------- */
function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  const icon = $("#themeToggle i");
  if (icon) icon.className = theme === "dark" ? "bi bi-sun" : "bi bi-moon-stars";
  // re-render charts to pick up colors
  if (!$("#appShell").classList.contains("hidden")) rerenderCharts();
}
function toggleTheme() {
  const cur = document.documentElement.getAttribute("data-theme");
  applyTheme(cur === "dark" ? "light" : "dark");
}

/* ---------------- Login ---------------- */
function setupLogin() {
  $$(".role-btn").forEach(btn => btn.addEventListener("click", () => {
    $$(".role-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    state.role = btn.dataset.role;
    $("#loginEmail").value = state.role === "admin" ? "admin@plataformainversion.co" : "laura.r@correo.co";
  }));
  
  const loginForm = $("#loginForm");
  if (loginForm) {
    loginForm.addEventListener("submit", e => {
      e.preventDefault();
      enterApp();
    });
  }
  
  const regForm = $("#registerForm");
  if (regForm) {
    regForm.addEventListener("submit", e => {
      e.preventDefault();
      toast("Cuenta creada exitosamente", "Bienvenido a la plataforma", "success");
      enterApp();
    });
  }

  const showRegBtn = $("#showRegisterBtn");
  if (showRegBtn) {
    showRegBtn.addEventListener("click", (e) => {
      e.preventDefault();
      $("#loginForm").classList.add("hidden");
      $("#registerForm").classList.remove("hidden");
    });
  }

  const showLoginBtn = $("#showLoginBtn");
  if (showLoginBtn) {
    showLoginBtn.addEventListener("click", (e) => {
      e.preventDefault();
      $("#registerForm").classList.add("hidden");
      $("#loginForm").classList.remove("hidden");
    });
  }

  const params = new URLSearchParams(window.location.search);
  const refCode = params.get("ref");
  if (refCode) {
    const userBtn = Array.from($$(".role-btn")).find(b => b.dataset.role === "user");
    if (userBtn) userBtn.click();
    
    $("#loginForm").classList.add("hidden");
    $("#registerForm").classList.remove("hidden");
    $("#regRef").value = refCode;
    toast("Código de referido detectado", refCode, "info");
  }

  const standaloneRegForm = $("#standaloneRegisterForm");
  if (standaloneRegForm) {
    standaloneRegForm.addEventListener("submit", e => {
      e.preventDefault();
      const code = $("#regCode").value.trim();
      if (!code) {
        toast("Error", "El código de registro es obligatorio", "error");
        return;
      }
      toast("Cuenta creada exitosamente", "Serás redirigido para iniciar sesión...", "success");
      setTimeout(() => {
        window.location.href = "/";
      }, 2000);
    });
  }
}

function enterApp() {
  if (state.role === "admin") {
    state.user = { nombre: "Admin General", inicial: "A", rol: "Administrador" };
  } else {
    state.user = { nombre: "Laura Restrepo", inicial: "LR", rol: "Usuario activo" };
  }
  state.view = "dashboard";
  $("#loginScreen").classList.add("hidden");
  $("#appShell").classList.remove("hidden");
  $("#topAvatar").textContent = state.user.inicial;
  $("#topName").textContent = state.user.nombre.split(" ")[0];
  $("#topRole").textContent = state.user.rol;
  
  const settingsLink = $("#profileMenuSettings");
  if (settingsLink) {
    settingsLink.style.display = state.role === "admin" ? "flex" : "none";
  }

  renderNav();
  renderNotifications();
  navigate("dashboard");
}

function logout() {
  closeAllDropdowns();
  $("#appShell").classList.add("hidden");
  $("#loginScreen").classList.remove("hidden");
}

/* ---------------- Navigation ---------------- */
function renderNav() {
  const nav = $("#sidebarNav");
  nav.innerHTML = NAV[state.role].map(item => {
    if (item.group) return `<div class="nav-label">${item.group}</div>`;
    return `<button class="nav-item ${item.id === state.view ? "active" : ""}" data-nav="${item.id}">
      <i class="bi ${item.icon}"></i><span>${item.label}</span>
      ${item.badge ? `<span class="badge-dot">${item.badge}</span>` : ""}
    </button>`;
  }).join("");
  $$("[data-nav]", nav).forEach(b => b.addEventListener("click", () => navigate(b.dataset.nav)));
}

function navigate(view) {
  state.view = view;
  // destroy charts
  Object.values(state.charts).forEach(c => { try { c.destroy(); } catch (e) {} });
  state.charts = {};

  $$(".nav-item").forEach(b => b.classList.toggle("active", b.dataset.nav === view));
  closeAllDropdowns();
  $("#appShell").classList.remove("mobile-open");

  const titleFn = VIEW_TITLES[view];
  const [title, sub] = titleFn ? titleFn(state) : [view, ""];
  const fnName = (state.role === "admin" ? "admin_" : "user_") + view;
  const render = VIEWS[fnName] || VIEWS[view] || (() => `<div class="card">Vista no disponible</div>`);

  const root = $("#view");
  root.scrollTop = 0;
  root.innerHTML = `
    <div class="breadcrumb"><i class="bi bi-house"></i> ${state.role === "admin" ? "Administración" : "Mi cuenta"} <i class="bi bi-chevron-right"></i> <span style="color:var(--text)">${title}</span></div>
    <div class="page-head">
      <div><h1 class="page-title">${title}</h1><p class="page-sub">${sub}</p></div>
      <div id="pageActions"></div>
    </div>
    <div id="viewBody">${render()}</div>`;

  if (typeof window["after_" + fnName] === "function") window["after_" + fnName]();
  animateCounters(root);
  document.querySelector(".main").scrollTo({ top: 0 });
}

/* ---------------- Notifications ---------------- */
function renderNotifications() {
  const panel = $("#notifPanel");
  if (!panel) return;
  panel.innerHTML = `<div class="dropdown-head">Notificaciones <small>${DB.notificaciones.length} nuevas</small></div>
    ${DB.notificaciones.map(n => `
      <div class="notif-item">
        <div class="ni-icon ${n.acc}"><i class="bi ${n.icon}"></i></div>
        <div><p>${n.titulo}</p><small>${n.texto} · ${n.t}</small></div>
      </div>`).join("")}
    <a class="menu-link" style="justify-content:center;color:var(--petrol)">Ver todas</a>`;
}

/* ---------------- Dropdowns ---------------- */
function closeAllDropdowns() {
  const notifPanel = $("#notifPanel");
  if (notifPanel) notifPanel.classList.add("hidden");
  const profilePanel = $("#profilePanel");
  if (profilePanel) profilePanel.classList.add("hidden");
}
function setupTopbar() {
  $("#themeToggle").addEventListener("click", toggleTheme);
  $("#collapseToggle").addEventListener("click", () => $("#appShell").classList.toggle("collapsed"));
  $("#mobileToggle").addEventListener("click", () => $("#appShell").classList.toggle("mobile-open"));
  
  const notifBtn = $("#notifBtn");
  if (notifBtn) {
    notifBtn.addEventListener("click", e => { e.stopPropagation(); $("#profilePanel").classList.add("hidden"); $("#notifPanel").classList.toggle("hidden"); });
  }
  
  $("#profileBtn").addEventListener("click", e => { e.stopPropagation(); if($("#notifPanel")) $("#notifPanel").classList.add("hidden"); $("#profilePanel").classList.toggle("hidden"); });
  document.addEventListener("click", () => closeAllDropdowns());
  
  const notifPanel = $("#notifPanel");
  if (notifPanel) notifPanel.addEventListener("click", e => e.stopPropagation());
  
  $("#profilePanel").addEventListener("click", e => e.stopPropagation());
  $$("[data-nav]", $("#profilePanel")).forEach(b => b.addEventListener("click", () => navigate(b.dataset.nav)));
  $("#logoutBtn").addEventListener("click", logout);
  $("#switchRoleBtn").addEventListener("click", () => { logout(); });
  
  const langSelect = $("#langSelect");
  if (langSelect) langSelect.addEventListener("change", e => toast("Idioma actualizado", "Interfaz simulada en " + e.target.value.toUpperCase(), "info"));
  
  $("#searchTrigger").addEventListener("click", openCmdk);
}

/* ---------------- Command palette ---------------- */
const CMDK_ITEMS = {
  admin: [
    { id: "usuarios", icon: "bi-people", label: "Usuarios" },
    { id: "solicitudes", icon: "bi-file-earmark-check", label: "Ganancias" },
    { id: "retiros", icon: "bi-cash-stack", label: "Retiros" },
    { id: "utilidades", icon: "bi-graph-up-arrow", label: "Utilidades" },
    { id: "referidos", icon: "bi-diagram-3", label: "Referidos" },
    { id: "escuela", icon: "bi-mortarboard", label: "Escuela" },
    { id: "reportes", icon: "bi-bar-chart-line", label: "Reportes" },
    { id: "settings", icon: "bi-gear", label: "Configuración" },
  ],
  user: [
    { id: "retorno", icon: "bi-graph-up-arrow", label: "Mi Retorno" },
    { id: "retirar", icon: "bi-cash-coin", label: "Retirar" },
    { id: "equipo", icon: "bi-diagram-3", label: "Mi Equipo" },
    { id: "escuela", icon: "bi-mortarboard", label: "Escuela" },
    { id: "historial", icon: "bi-clock-history", label: "Historial" },
  ],
};
let cmdkSel = 0;
function openCmdk() {
  const items = CMDK_ITEMS[state.role];
  cmdkSel = 0;
  $("#cmdkRoot").innerHTML = `<div class="cmdk-overlay" id="cmdkOverlay">
    <div class="cmdk" role="dialog" aria-label="Buscador rápido">
      <div class="cmdk-input"><i class="bi bi-search"></i><input id="cmdkInput" placeholder="Saltar a..." autocomplete="off" /></div>
      <div class="cmdk-list" id="cmdkList"></div>
    </div></div>`;
  renderCmdkList(items, "");
  const input = $("#cmdkInput");
  input.focus();
  input.addEventListener("input", () => { cmdkSel = 0; renderCmdkList(items, input.value); });
  $("#cmdkOverlay").addEventListener("click", e => { if (e.target.id === "cmdkOverlay") closeCmdk(); });
  document.addEventListener("keydown", cmdkKeys);
}
function renderCmdkList(items, q) {
  const filtered = items.filter(i => i.label.toLowerCase().includes(q.toLowerCase()));
  const list = $("#cmdkList");
  if (!filtered.length) { list.innerHTML = `<div class="cmdk-item">Sin resultados</div>`; return; }
  list.innerHTML = filtered.map((i, idx) => `<div class="cmdk-item ${idx === cmdkSel ? "sel" : ""}" data-go="${i.id}">
    <i class="bi ${i.icon}"></i> ${i.label} <span class="cmd-meta">Ir</span></div>`).join("");
  $$(".cmdk-item[data-go]").forEach(el => el.addEventListener("click", () => { navigate(el.dataset.go); closeCmdk(); }));
  list._items = filtered;
}
function cmdkKeys(e) {
  const list = $("#cmdkList");
  if (!list || !list._items) return;
  const items = list._items;
  if (e.key === "Escape") return closeCmdk();
  if (e.key === "ArrowDown") { e.preventDefault(); cmdkSel = (cmdkSel + 1) % items.length; refreshCmdkSel(); }
  if (e.key === "ArrowUp") { e.preventDefault(); cmdkSel = (cmdkSel - 1 + items.length) % items.length; refreshCmdkSel(); }
  if (e.key === "Enter") { e.preventDefault(); if (items[cmdkSel]) { navigate(items[cmdkSel].id); closeCmdk(); } }
}
function refreshCmdkSel() { $$(".cmdk-item").forEach((el, i) => el.classList.toggle("sel", i === cmdkSel)); }
function closeCmdk() { $("#cmdkRoot").innerHTML = ""; document.removeEventListener("keydown", cmdkKeys); }

document.addEventListener("keydown", e => {
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
    e.preventDefault();
    if ($("#appShell").classList.contains("hidden")) return;
    if ($("#cmdkRoot").innerHTML) closeCmdk(); else openCmdk();
  }
});

/* ---------------- Charts ---------------- */
function chartColors() {
  const dark = document.documentElement.getAttribute("data-theme") === "dark";
  return {
    grid: dark ? "rgba(255,255,255,0.07)" : "rgba(17,24,39,0.07)",
    text: dark ? "#9ca3af" : "#6b7280",
    petrol: "#0F4C5C", green: "#22C55E", gold: "#D6A84F", carbon: dark ? "#cbd5e1" : "#111827",
  };
}
function baseOpts(extra = {}) {
  const c = chartColors();
  const opts = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { labels: { color: c.text, font: { family: "Plus Jakarta Sans", weight: 600 }, usePointStyle: true, boxWidth: 8 } } },
    scales: {
      x: { 
        grid: { display: false }, 
        ticks: { color: c.text, font: { family: "Plus Jakarta Sans" } },
        title: { display: !!extra.xTitle, text: extra.xTitle || "", color: c.text, font: { family: "Plus Jakarta Sans", weight: 600 } }
      },
      y: { 
        grid: { color: c.grid }, 
        ticks: { color: c.text, font: { family: "Plus Jakarta Sans" } }, border: { display: false },
        title: { display: !!extra.yTitle, text: extra.yTitle || "", color: c.text, font: { family: "Plus Jakarta Sans", weight: 600 } }
      },
    },
  };
  delete extra.xTitle;
  delete extra.yTitle;
  return Object.assign(opts, extra);
}
function makeChart(id, config) {
  const el = document.getElementById(id);
  if (!el) return;
  state.charts[id] = new Chart(el, config);
}
let lastCharts = [];
function registerChartBuild(fn) { lastCharts = fn; fn(); }
function rerenderCharts() {
  // simplest: re-navigate to current view to rebuild charts with theme colors
  navigate(state.view);
}

/* gradient helper */
function vGrad(ctx, color) {
  const g = ctx.createLinearGradient(0, 0, 0, 240);
  g.addColorStop(0, color + "55");
  g.addColorStop(1, color + "05");
  return g;
}

/* ---------------- VIEWS object (populated below) ---------------- */
const VIEWS = {};

/* ============================================================
   SHARED: referral tree renderer
   ============================================================ */
function renderTreeNode(node, level = 0) {
  const max = 10, filled = node.cupos || 0, slots = Array.from({ length: max }, (_, i) =>
    `<span class="slot ${i < filled ? "filled" : ""}"></span>`).join("");
  const isRoot = level === 0;
  const hasChildren = node.hijos && node.hijos.length;
  let origenTag = "";
  if (!isRoot) {
    if (node.tipo === "cedido") {
      origenTag = `<span class="assigned-tag" style="background:var(--petrol);color:#fff">Recibido como ${node.cesion} referido de ${node.de}</span>`;
    } else {
      origenTag = `<span class="assigned-tag">Referido directo</span>`;
    }
  }
  return `
    <div class="tree-node" style="animation-delay:${level * 0.06}s">
      <div class="node-card ${isRoot ? "root" : ""}">
        <div class="node-av">${initials(node.nombre)}</div>
        <div class="node-info">
          <strong>${node.nombre}</strong>
          <small>${node.id} · Cupos ${filled}/10</small>
        </div>
        <div class="node-slots" title="Cupos de invitación (Máx 10)">${slots}</div>
        ${origenTag}
        ${hasChildren ? `<button class="node-toggle" onclick="toggleBranch(this)" aria-label="Expandir"><i class="bi bi-dash"></i></button>` : ""}
      </div>
      ${hasChildren ? `<div class="tree-children">${node.hijos.map(h => renderTreeNode(h, level + 1)).join("")}</div>` : ""}
    </div>`;
}
function toggleBranch(btn) {
  const children = btn.closest(".tree-node").querySelector(".tree-children");
  if (!children) return;
  children.classList.toggle("collapsed");
  btn.querySelector("i").className = children.classList.contains("collapsed") ? "bi bi-plus" : "bi bi-dash";
}
function countTree(node) {
  let n = node.hijos ? node.hijos.length : 0;
  (node.hijos || []).forEach(h => n += countTree(h));
  return n;
}

/* ============================================================
   ADMIN VIEWS
   ============================================================ */
VIEWS.admin_dashboard = () => {
  const stats = [
    { icon: "bi-people", acc: "acc-petrol", label: "Usuarios registrados", val: 248, fmt: "", trend: "+12 esta semana", up: true },
    { icon: "bi-person-check", acc: "acc-green", label: "Usuarios activos", val: 191, fmt: "", trend: "77% del total", up: true },

    { icon: "bi-cash-stack", acc: "acc-red", label: "Retiros pendientes", val: 3, fmt: "", trend: "En cola de proceso", up: false },
    { icon: "bi-graph-up-arrow", acc: "acc-petrol", label: "Utilidad semanal cargada", val: 2376700, fmt: "cop", trend: "5 días hábiles", up: true },
    { icon: "bi-wallet2", acc: "acc-green", label: "Total retornos asignados", val: 24850000, fmt: "cop", trend: "+8.4% mensual", up: true },
  ];
  const acts = [
    { t: "Usuario registrado", u: "Daniel Castaño", time: "hace 20 min", icon: "bi-person-plus", acc: "acc-petrol", st: "pendiente" },
    { t: "Ganancia enviada", u: "Marcela Díaz", time: "hace 1 h", icon: "bi-file-earmark-check", acc: "acc-gold", st: "revision" },
    { t: "Retiro solicitado", u: "Laura Restrepo", time: "hace 2 h", icon: "bi-cash-coin", acc: "acc-red", st: "pendiente" },
    { t: "Utilidad cargada", u: "Admin General", time: "hace 3 h", icon: "bi-graph-up-arrow", acc: "acc-green", st: "activo" },
    { t: "Usuario aprobado", u: "Sofía Naranjo", time: "ayer", icon: "bi-patch-check", acc: "acc-green", st: "activo" },
    { t: "Pago diplomado confirmado", u: "Andrés Gómez", time: "ayer", icon: "bi-mortarboard", acc: "acc-petrol", st: "pagado" },
  ];
  return `
  <div class="stat-grid cols-5">
    ${stats.map((s, i) => `
      <div class="stat-card rise rise-${(i % 6) + 1}">
        <div class="stat-top">
          <div class="stat-icon ${s.acc}"><i class="bi ${s.icon}"></i></div>
          <span class="badge ${s.up ? "b-active" : "b-pending"}" style="border:none">${s.up ? "▲" : "•"}</span>
        </div>
        <div class="stat-label">${s.label}</div>
        <div class="stat-value" data-count="${s.val}" data-format="${s.fmt}">0</div>
        <div class="stat-foot ${s.up ? "trend-up" : "cell-muted"}"><i class="bi bi-activity"></i> ${s.trend}</div>
      </div>`).join("")}
  </div>

  <div class="grid cols-3" style="margin-top:18px">
    <div class="card span-2 chart-appear">
      <div class="card-head"><div class="card-title"><i class="bi bi-graph-up"></i> Resumen operativo</div>
        <span class="badge b-review" style="border:none">Semana actual</span></div>
      <div class="chart-box h-md"><canvas id="opChart"></canvas></div>
    </div>
    <div class="card chart-appear">
      <div class="card-head"><div class="card-title"><i class="bi bi-exclamation-triangle"></i> Alertas del sistema</div></div>

      <div class="alert-item"><span class="a-dot" style="background:var(--st-blocked)"></span><p>3 retiros pendientes</p></div>
      <div class="alert-item"><span class="a-dot" style="background:var(--petrol)"></span><p>1 utilidad semanal sin cerrar</p></div>
      <div class="alert-item"><span class="a-dot" style="background:var(--green)"></span><p>12 usuarios nuevos esta semana</p></div>
      <div style="margin-top:14px">
        <small class="cell-muted" style="font-weight:600">Procesando cierre semanal</small>
        <div class="progress-line" style="margin-top:8px"></div>
      </div>
    </div>
  </div>

  <div class="card" style="margin-top:18px">
    <div class="card-head"><div class="card-title"><i class="bi bi-clock-history"></i> Actividad reciente</div>
      <button class="btn btn-ghost btn-sm">Ver todo</button></div>
    <div class="table-wrap"><table class="data">
      <thead><tr><th>Evento</th><th>Responsable</th><th>Estado</th><th>Cuándo</th></tr></thead>
      <tbody>${acts.map(a => `<tr>
        <td><div class="user-cell"><span class="av ${a.acc}" style="background:transparent;border:1.5px solid var(--border-soft)"><i class="bi ${a.icon}"></i></span><span class="cell-strong">${a.t}</span></div></td>
        <td class="cell-muted">${a.u}</td><td>${badge(a.st)}</td><td class="cell-muted">${a.time}</td></tr>`).join("")}
      </tbody></table></div>
  </div>`;
};
window.after_admin_dashboard = () => {
  const c = chartColors();
  makeChart("opChart", {
    type: "line",
    data: {
      labels: ["Lun", "Mar", "Mié", "Jue", "Vie"],
      datasets: [
        { label: "Utilidad cargada", data: [456000, 448500, 500000, 472000, 500200], borderColor: c.petrol, backgroundColor: ctx => vGrad(ctx.chart.ctx, "#0F4C5C"), fill: true, tension: 0.4, borderWidth: 3, pointRadius: 4, pointBackgroundColor: c.petrol },
        { label: "Retorno distribuido", data: [410000, 405000, 460000, 430000, 470000], borderColor: c.green, backgroundColor: "transparent", tension: 0.4, borderWidth: 3, pointRadius: 4, pointBackgroundColor: c.green },
        { label: "Retiros procesados", data: [120000, 90000, 200000, 150000, 300000], borderColor: c.gold, backgroundColor: "transparent", tension: 0.4, borderWidth: 3, borderDash: [5, 4], pointRadius: 3 },
      ],
    },
    options: baseOpts(),
  });
};

/* ---------- Usuarios ---------- */
VIEWS.admin_usuarios = () => {
  const list = DB.usuarios.filter(u => {
    const q = state.userFilter.toLowerCase();
    const okQ = !q || u.nombre.toLowerCase().includes(q) || u.correo.toLowerCase().includes(q) || u.id.toLowerCase().includes(q);
    const okS = state.userStatusFilter === "todos" || u.estado === state.userStatusFilter
      || (state.userStatusFilter === "conicc" && u.ganancia > 0) || (state.userStatusFilter === "sinicc" && u.ganancia === 0);
    return okQ && okS;
  });
  return `
  <div class="card">
    <div class="filters">
      <div class="field" style="flex:1;min-width:200px"><input type="text" id="uSearch" placeholder="Buscar por nombre, correo o ID..." value="${escapeHtml(state.userFilter)}" /></div>
      <select id="uStatus" class="lang-select">
        <option value="todos">Todos los estados</option>
        <option value="activo">Activo</option><option value="pendiente">Pendiente</option>
        <option value="revision">En revisión</option><option value="bloqueado">Bloqueado</option>
        <option value="conicc">Con Ganancia</option><option value="sinicc">Sin Ganancia</option>
      </select>
    </div>
    <div class="table-wrap"><table class="data">
      <thead><tr><th>ID</th><th>Usuario</th><th>Documento</th><th>Estado</th><th>Ganancia</th><th>Retorno</th><th>Referidos</th><th>Registro</th><th>Acciones</th></tr></thead>
      <tbody>${list.map(u => `<tr>
        <td class="cell-id">${u.id}</td>
        <td><div class="user-cell"><span class="av">${initials(u.nombre)}</span><div><div class="cell-strong">${u.nombre}</div><small class="cell-muted">${u.correo}</small></div></div></td>
        <td class="cell-muted">${u.doc}</td>
        <td>${badge(u.estado)}</td>
        <td class="cell-strong">${cop(u.ganancia)}</td>
        <td>${cop(u.retorno)}</td>
        <td><span class="badge b-review" style="border:none">${u.ref}/10</span></td>
        <td class="cell-muted">${u.fecha}</td>
        <td><div class="action-row">
          <button class="tbtn view" title="Ver" onclick="openUserModal('${u.id}')"><i class="bi bi-eye"></i></button>
          <button class="tbtn ok" title="Aprobar" onclick="adminApproveUser('${u.id}')"><i class="bi bi-check-lg"></i></button>
          <button class="tbtn bad" title="Bloquear" onclick="adminBlockUser('${u.id}')"><i class="bi bi-slash-circle"></i></button>
        </div></td></tr>`).join("") || `<tr><td colspan="9" class="cell-muted" style="text-align:center;padding:30px">Sin resultados</td></tr>`}
      </tbody></table></div>
  </div>`;
};
window.after_admin_usuarios = () => {
  $("#uSearch")?.addEventListener("input", e => { state.userFilter = e.target.value; $("#viewBody").innerHTML = VIEWS.admin_usuarios(); window.after_admin_usuarios(); $("#uStatus").value = state.userStatusFilter; $("#uSearch").focus(); $("#uSearch").setSelectionRange(99,99); });
  $("#uStatus")?.addEventListener("change", e => { state.userStatusFilter = e.target.value; $("#viewBody").innerHTML = VIEWS.admin_usuarios(); window.after_admin_usuarios(); });
};
function openUserModal(id) {
  const u = DB.usuarios.find(x => x.id === id);
  if (!u) return;
  openModal(`
    <div class="modal-head"><h3>Detalle de usuario</h3><button class="icon-btn" onclick="closeModal()"><i class="bi bi-x-lg"></i></button></div>
    <div class="modal-body">
      <div style="display:flex;gap:14px;align-items:center;margin-bottom:18px">
        <span class="av" style="width:54px;height:54px;border-radius:12px;font-size:1.1rem">${initials(u.nombre)}</span>
        <div><h3 style="font-size:1.2rem">${u.nombre}</h3><div style="margin-top:4px">${badge(u.estado)} <span class="cell-muted" style="font-size:0.82rem">${u.id}</span></div></div>
      </div>
      <div class="detail-grid">
        <div><div class="dl">Correo</div><div class="dv">${u.correo}</div></div>
        <div><div class="dl">Documento / RUT</div><div class="dv">${u.doc}</div></div>
        <div><div class="dl">Estado de Ganancia</div><div class="dv">${u.ganancia > 0 ? "Asignado · " + cop(u.ganancia) : "Sin Ganancia"}</div></div>
        <div><div class="dl">Retorno acumulado</div><div class="dv">${cop(u.retorno)}</div></div>
        <div><div class="dl">Estado académico</div><div class="dv">${BADGE_LABEL[u.diplomado] || u.diplomado}</div></div>
        <div><div class="dl">Referidos directos</div><div class="dv">${u.ref}/10</div></div>
        <div><div class="dl">Datos bancarios</div><div class="dv">${u.banco} ${u.cuenta}</div></div>
        <div><div class="dl">Fecha de registro</div><div class="dv">${u.fecha}</div></div>
      </div>
      <div class="section-divider"></div>
      <div class="dl" style="margin-bottom:8px">Historial de solicitudes</div>
      <div class="legal-note"><i class="bi bi-clock-history"></i> Última actividad: solicitud Ganancia y movimientos asociados sujetos a revisión manual.</div>
    </div>
    <div class="modal-foot">
      <button class="btn btn-ghost" onclick="closeModal()">Cerrar</button>
      <button class="btn btn-danger" onclick="adminBlockUser('${u.id}');closeModal()"><i class="bi bi-slash-circle"></i> Bloquear</button>
      <button class="btn btn-green" onclick="adminApproveUser('${u.id}');closeModal()"><i class="bi bi-check-lg"></i> Aprobar</button>
    </div>`, "lg");
}
function adminApproveUser(id) {
  fetch('/api/actions', { method: 'POST', body: JSON.stringify({ action: 'approveUser', payload: { id } }) });
  const u = DB.usuarios.find(x => x.id === id); if (!u) return;
  u.estado = "activo";
  if ($("#viewBody") && state.view === "usuarios") { $("#viewBody").innerHTML = VIEWS.admin_usuarios(); window.after_admin_usuarios(); }
  toast("Usuario aprobado", u.nombre + " ahora está activo");
}
function adminBlockUser(id) {
  fetch('/api/actions', { method: 'POST', body: JSON.stringify({ action: 'blockUser', payload: { id } }) });
  const u = DB.usuarios.find(x => x.id === id); if (!u) return;
  u.estado = "bloqueado";
  if ($("#viewBody") && state.view === "usuarios") { $("#viewBody").innerHTML = VIEWS.admin_usuarios(); window.after_admin_usuarios(); }
  toast("Usuario bloqueado", u.nombre + " fue bloqueado", "error");
}

/* ---------- Ganancias ---------- */
VIEWS.admin_solicitudes = () => {
  const counts = { pendiente: 0, aprobada: 0, rechazada: 0, revision: 0 };
  DB.solicitudes.forEach(s => counts[s.estado] !== undefined && counts[s.estado]++);
  const list = state.gananciaFilter === "todas" ? DB.solicitudes : DB.solicitudes.filter(s => s.estado === state.gananciaFilter);
  const cards = [
    { k: "pendiente", l: "Pendientes", c: "acc-gold" }, { k: "aprobada", l: "Aprobadas", c: "acc-green" },
    { k: "rechazada", l: "Rechazadas", c: "acc-red" }, { k: "revision", l: "En corrección", c: "acc-petrol" },
  ];
  return `
  <div class="stat-grid" style="margin-bottom:18px">
    ${cards.map((c, i) => `<div class="stat-card rise rise-${i+1}" style="cursor:pointer" onclick="filterGanancia('${c.k}')">
      <div class="stat-top"><div class="stat-icon ${c.c}"><i class="bi bi-file-earmark"></i></div></div>
      <div class="stat-value" data-count="${counts[c.k]}">0</div><div class="stat-label">${c.l}</div></div>`).join("")}
  </div>
  <div class="card">
    <div class="card-head"><div class="card-title"><i class="bi bi-file-earmark-check"></i> Ganancias</div>
      <div class="seg" id="gananciaSeg">
        ${["todas","pendiente","aprobada","rechazada"].map(f => `<button class="${state.gananciaFilter===f?"active":""}" onclick="filterGanancia('${f}')">${f==="todas"?"Todas":BADGE_LABEL[f]}</button>`).join("")}
      </div></div>
    <div class="table-wrap"><table class="data">
      <thead><tr><th>ID</th><th>Usuario</th><th>Documento</th><th>RUT</th><th>Cuenta bancaria</th><th>Fecha</th><th>Estado</th><th>Acciones</th></tr></thead>
      <tbody>${list.map(s => `<tr>
        <td class="cell-id">${s.id}</td>
        <td><div class="user-cell"><span class="av">${initials(s.usuario)}</span><span class="cell-strong">${s.usuario}</span></div></td>
        <td class="cell-muted">${s.doc}</td><td class="cell-muted">${s.rut}</td><td class="cell-muted">${s.cuenta}</td>
        <td class="cell-muted">${s.fecha}</td><td>${badge(s.estado)}</td>
        <td><div class="action-row">
          <button class="tbtn ok" title="Aprobar" onclick="gananciaApprove('${s.id}')"><i class="bi bi-check-lg"></i></button>
          <button class="tbtn bad" title="Rechazar" onclick="gananciaReject('${s.id}')"><i class="bi bi-x-lg"></i></button>
          <button class="tbtn view" title="Pedir corrección" onclick="gananciaCorrect('${s.id}')"><i class="bi bi-pencil"></i></button>
        </div></td></tr>`).join("") || `<tr><td colspan="8" class="cell-muted" style="text-align:center;padding:30px">Sin ganancias</td></tr>`}
      </tbody></table></div>
  </div>`;
};
function refreshICC() { if (state.view === "solicitudes") { $("#viewBody").innerHTML = VIEWS.admin_solicitudes(); animateCounters($("#viewBody")); } }
function filterGanancia(f) { state.gananciaFilter = f; refreshICC(); }
function gananciaApprove(id) { const s = DB.solicitudes.find(x => x.id === id); if (!s) return; s.estado = "aprobada"; refreshICC(); toast("Ganancia aprobada correctamente", s.id + " · " + s.usuario); }
function gananciaCorrect(id) { const s = DB.solicitudes.find(x => x.id === id); if (!s) return; s.estado = "revision"; refreshICC(); toast("Ganancia enviada a corrección", s.id, "info"); }
function gananciaReject(id) {
  const s = DB.solicitudes.find(x => x.id === id); if (!s) return;
  openModal(`
    <div class="modal-head"><h3>Rechazar solicitud ${s.id}</h3><button class="icon-btn" onclick="closeModal()"><i class="bi bi-x-lg"></i></button></div>
    <div class="modal-body"><div class="field"><label>Motivo del rechazo</label><textarea id="rejectReason" placeholder="Describe el motivo para informar al usuario..."></textarea></div></div>
    <div class="modal-foot"><button class="btn btn-ghost" onclick="closeModal()">Cancelar</button>
      <button class="btn btn-danger" onclick="confirmReject('${s.id}')"><i class="bi bi-x-lg"></i> Rechazar solicitud</button></div>`);
}
function confirmReject(id) { const s = DB.solicitudes.find(x => x.id === id); if (!s) return; s.estado = "rechazada"; closeModal(); refreshICC(); toast("Ganancia rechazada", s.id + " · motivo registrado", "error"); }

/* ---------- Utilidades ---------- */
VIEWS.admin_utilidades = () => {
  const totalSemana = DB.utilidades.reduce((a, b) => a + b.distribuido, 0);
  const habiles = DB.utilidades.filter(u => u.habil).length;
  return `
  <div class="grid cols-3">
    <div class="card span-2 rise rise-1">
      <div class="card-head"><div class="card-title"><i class="bi bi-plus-circle"></i> Cargar utilidad</div></div>
      <form class="form-grid cols-2" id="utilForm" style="grid-template-columns:1fr 1fr">
        <div class="field"><label>Fecha</label><input type="date" id="utilFecha" value="2026-02-16" /></div>
        <div class="field"><label>Tipo</label><select id="utilTipo"><option value="diaria">Diaria</option><option value="semanal">Semanal</option></select></div>
        <div class="field"><label>Valor de utilidad (%)</label><input type="number" id="utilValor" step="0.1" value="2.4" /></div>
        <div class="field"><label>Usuarios activos</label><input type="number" id="utilActivos" value="41" /></div>
        <div class="field" style="grid-column:span 2"><label>Observación</label><input type="text" id="utilObs" placeholder="Notas del cierre..." /></div>
        <div class="checkrow" style="grid-column:span 2"><input type="checkbox" id="utilExcl" checked /><label for="utilExcl">Excluir sábados, domingos y festivos</label></div>
        <button class="btn btn-petrol" type="submit" style="grid-column:span 2"><i class="bi bi-upload"></i> Cargar utilidad</button>
      </form>
    </div>
    <div class="card rise rise-2">
      <div class="card-head"><div class="card-title"><i class="bi bi-calculator"></i> Resumen</div></div>
      <div class="detail-grid" style="grid-template-columns:1fr">
        <div><div class="dl">Ganancia base (ejemplo)</div><div class="dv" style="font-size:1.1rem">$500.000</div></div>
        <div><div class="dl">Retorno (ejemplo)</div><div class="dv" style="font-size:1.1rem">$320.000</div></div>
        <div><div class="dl">Porcentaje de Ganancia actual</div><div class="dv">${DB.config.gananciaPct}%</div></div>
        <div><div class="dl">Días hábiles calculados</div><div class="dv">${habiles} días</div></div>
        <div><div class="dl">Total semanal distribuido</div><div class="dv" style="color:var(--green);font-size:1.2rem">${cop(totalSemana)}</div></div>
      </div>
      <div class="legal-note" style="margin-top:14px"><i class="bi bi-info-circle"></i> Las utilidades se calculan únicamente en días hábiles y excluyen sábados, domingos y festivos.</div>
    </div>
  </div>

  <div class="card chart-appear" style="margin-top:18px">
    <div class="card-head"><div class="card-title"><i class="bi bi-graph-up-arrow"></i> Ganancia diaria y acumulado semanal</div></div>
    <div class="chart-box h-md"><canvas id="utilChart"></canvas></div>
  </div>

  <div class="card" style="margin-top:18px">
    <div class="card-head"><div class="card-title"><i class="bi bi-table"></i> Detalle semanal</div></div>
    <div class="table-wrap"><table class="data" id="utilTable">
      <thead><tr><th>Día</th><th>Fecha</th><th>Estado</th><th>Utilidad</th><th>Usuarios activos</th><th>Valor distribuido</th><th>Observación</th></tr></thead>
      <tbody>${DB.utilidades.map(u => `<tr>
        <td class="cell-strong">${u.dia}</td><td class="cell-muted">${u.fecha}</td>
        <td>${u.habil ? `<span class="badge b-active">Hábil</span>` : `<span class="badge b-blocked">No hábil</span>`}</td>
        <td>${u.habil ? cop(u.valor) : "—"}</td><td>${u.activos || "—"}</td>
        <td class="cell-strong">${u.habil ? cop(u.distribuido) : "—"}</td><td class="cell-muted">${u.obs}</td></tr>`).join("")}
      </tbody></table></div>
  </div>`;
};
window.after_admin_utilidades = () => {
  const c = chartColors();
  makeChart("utilChart", {
    type: "bar",
    data: { labels: DB.utilidades.map(u => u.dia.slice(0,3)),
      datasets: [
        { type: "bar", label: "Ganancia diaria", data: DB.utilidades.map(u => u.distribuido), backgroundColor: c.petrol, borderRadius: 8, maxBarThickness: 38 },
        { type: "line", label: "Acumulado semanal", data: DB.utilidades.reduce((a, u, i) => { a.push((a[i-1]||0) + u.distribuido); return a; }, []), borderColor: c.gold, backgroundColor: "transparent", tension: 0.4, borderWidth: 3, pointRadius: 3, yAxisID: "y" },
      ] },
    options: baseOpts(),
  });
  $("#utilForm")?.addEventListener("submit", e => {
    e.preventDefault();
    const excl = $("#utilExcl").checked;
    const fecha = $("#utilFecha").value || "2026-02-16";
    const dow = new Date(fecha + "T00:00").getDay();
    const habil = !(excl && (dow === 0 || dow === 6));
    const activos = +$("#utilActivos").value || 41;
    const pct = +$("#utilValor").value || 2;
    const distribuido = habil ? Math.round(500000 * (pct/100) * activos) : 0;
    DB.utilidades.push({ dia: ["Domingo","Lunes","Martes","Miércoles","Jueves","Viernes","Sábado"][dow], fecha, habil, valor: habil?Math.round(500000*(pct/100)):0, activos: habil?activos:0, distribuido, obs: $("#utilObs").value || (habil?"Cierre normal":"No hábil") });
    $("#viewBody").innerHTML = VIEWS.admin_utilidades(); window.after_admin_utilidades(); animateCounters($("#viewBody"));
    toast(habil ? "Utilidad cargada correctamente" : "Día no hábil registrado", habil ? cop(distribuido) + " distribuidos" : "No se distribuye en días no hábiles", habil ? "success" : "info");
  });
};

/* ---------- Retiros ---------- */
VIEWS.admin_retiros = () => {
  const list = state.retiroFilter === "todos" ? DB.retiros : DB.retiros.filter(r => r.estado === state.retiroFilter);
  return `
  <div class="card">
    <div class="card-head"><div class="card-title"><i class="bi bi-cash-stack"></i> Solicitudes de retiro</div>
      <div class="seg">${["todos","pendiente","proceso","pagado","rechazado"].map(f => `<button class="${state.retiroFilter===f?"active":""}" onclick="filterRet('${f}')">${f==="todos"?"Todos":BADGE_LABEL[f]}</button>`).join("")}</div></div>
    <div class="table-wrap"><table class="data">
      <thead><tr><th>ID</th><th>Usuario</th><th>Monto</th><th>Banco</th><th>Cuenta</th><th>Fecha</th><th>Estado</th><th>Acciones</th></tr></thead>
      <tbody>${list.map(r => `<tr>
        <td class="cell-id">${r.id}</td>
        <td><div class="user-cell"><span class="av">${initials(r.usuario)}</span><span class="cell-strong">${r.usuario}</span></div></td>
        <td class="cell-strong">${cop(r.monto)}</td><td class="cell-muted">${r.banco}</td><td class="cell-muted">${r.cuenta}</td>
        <td class="cell-muted">${r.fecha}</td><td>${badge(r.estado)}</td>
        <td><div class="action-row">
          <button class="tbtn view" title="Procesar" onclick="retProcess('${r.id}')"><i class="bi bi-arrow-repeat"></i></button>
          <button class="tbtn ok" title="Marcar pagado" onclick="retPay('${r.id}')"><i class="bi bi-check-lg"></i></button>
          <button class="tbtn bad" title="Rechazar" onclick="retReject('${r.id}')"><i class="bi bi-x-lg"></i></button>
        </div></td></tr>`).join("") || `<tr><td colspan="8" class="cell-muted" style="text-align:center;padding:30px">Sin retiros</td></tr>`}
      </tbody></table></div>
  </div>`;
};
function refreshRet() { if (state.view === "retiros") $("#viewBody").innerHTML = VIEWS.admin_retiros(); }
function filterRet(f) { state.retiroFilter = f; refreshRet(); }
function retProcess(id) { const r = DB.retiros.find(x => x.id === id); if (!r) return; r.estado = "proceso"; refreshRet(); toast("Retiro en proceso", r.id, "info"); }
function retReject(id) { const r = DB.retiros.find(x => x.id === id); if (!r) return; r.estado = "rechazado"; refreshRet(); toast("Retiro rechazado", r.id, "error"); }
function retPay(id) {
  const r = DB.retiros.find(x => x.id === id); if (!r) return;
  openModal(`
    <div class="modal-head"><h3>Confirmar pago</h3><button class="icon-btn" onclick="closeModal()"><i class="bi bi-x-lg"></i></button></div>
    <div class="modal-body">
      <p style="margin-bottom:14px">¿Confirmas que el retiro <strong>${r.id}</strong> fue pagado?</p>
      <div class="detail-grid">
        <div><div class="dl">Usuario</div><div class="dv">${r.usuario}</div></div>
        <div><div class="dl">Monto</div><div class="dv">${cop(r.monto)}</div></div>
        <div><div class="dl">Banco</div><div class="dv">${r.banco} ${r.cuenta}</div></div>
        <div><div class="dl">Fecha solicitud</div><div class="dv">${r.fecha}</div></div>
      </div>
    </div>
    <div class="modal-foot"><button class="btn btn-ghost" onclick="closeModal()">Cancelar</button>
      <button class="btn btn-green" onclick="confirmPay('${r.id}')"><i class="bi bi-check-lg"></i> Marcar como pagado</button></div>`);
}
function confirmPay(id) { const r = DB.retiros.find(x => x.id === id); if (!r) return; r.estado = "pagado"; closeModal(); refreshRet(); toast("Retiro marcado como pagado", r.id + " · " + cop(r.monto)); }

/* ---------- Referidos (admin) ---------- */
VIEWS.admin_referidos = () => {
  const total = countTree(DB.arbol);
  return `
  <div class="stat-grid" style="margin-bottom:18px">
    <div class="stat-card rise rise-1"><div class="stat-icon acc-carbon"><i class="bi bi-person-circle"></i></div><div class="stat-value">1</div><div class="stat-label">Nodo principal</div></div>
    <div class="stat-card rise rise-2"><div class="stat-icon acc-petrol"><i class="bi bi-people"></i></div><div class="stat-value" data-count="${DB.arbol.hijos.length}">0</div><div class="stat-label">Referidos directos</div></div>
    <div class="stat-card rise rise-3"><div class="stat-icon acc-green"><i class="bi bi-diagram-3"></i></div><div class="stat-value" data-count="${total - DB.arbol.hijos.length}">0</div><div class="stat-label">Referidos indirectos</div></div>
    <div class="stat-card rise rise-4"><div class="stat-icon acc-gold"><i class="bi bi-collection"></i></div><div class="stat-value" data-count="${total}">0</div><div class="stat-label">Equipo total</div></div>
  </div>
  <div class="card">
    <div class="card-head"><div class="card-title"><i class="bi bi-diagram-3"></i> Estructura de red</div>
      <div style="display:flex;gap:8px;align-items:center">
        <div style="position:relative">
          <input type="text" id="refAdminSearch" list="refAdminList" placeholder="Escribe o selecciona usuario..." onchange="filterAdminTree(this.value)" style="padding:6px 12px;font-size:0.85rem;border-radius:var(--radius-sm);border:1px solid var(--border-soft);background:var(--bg);color:var(--text);outline:none;width:240px" />
          <datalist id="refAdminList">
            ${(() => { const arr = []; const g = n => { arr.push(n); n.hijos.forEach(g); }; g(DB.arbol); return arr.map(u => `<option value="${u.id}">${u.nombre}</option>`).join(""); })()}
          </datalist>
        </div>
        <span class="badge b-review" style="border:none">Máx. 10 invitaciones por usuario</span>
        <button class="btn btn-ghost btn-sm" onclick="collapseAllBranches()"><i class="bi bi-arrows-collapse"></i> Contraer</button>
      </div>
      </div></div>
    <div class="legal-note" style="margin-bottom:16px"><i class="bi bi-info-circle"></i> Cada usuario puede invitar máximo 10 personas. La 3ra, 6ta y 9na invitación se ceden automáticamente al patrocinador superior. Los referidos continúan invitando bajo la misma regla.</div>
    <div class="tree" id="treeRoot">${renderTreeNode(DB.arbol)}</div>
  </div>`;
};
function collapseAllBranches() { $$(".tree-children", $("#treeRoot")).forEach((c, i) => { if (i > 0) { c.classList.add("collapsed"); } }); $$(".node-toggle i").forEach((ic, i) => { if (i > 0) ic.className = "bi bi-plus"; }); }

function filterAdminTree(q) {
  q = q.toLowerCase().trim();
  const root = $("#treeRoot");
  if (!root) return;
  if (!q) {
    root.innerHTML = renderTreeNode(DB.arbol);
    return;
  }
  function findN(node) {
    if (node.nombre.toLowerCase().includes(q) || node.id.toLowerCase().includes(q)) return node;
    for (let h of node.hijos) {
      const f = findN(h);
      if (f) return f;
    }
    return null;
  }
  const found = findN(DB.arbol);
  if (found) {
    root.innerHTML = renderTreeNode(found);
  } else {
    root.innerHTML = `<div style="padding:32px;text-align:center;color:var(--text-soft)">No se encontró ningún usuario con ese nombre o ID en la red.</div>`;
  }
}

/* ---------- Escuela (admin) ---------- */
VIEWS.admin_escuela = () => {
  const activos = DB.escuela.filter(e => e.acceso === "activo").length;
  const pend = DB.escuela.filter(e => e.pago === "pendiente").length;
  return `
  <div class="stat-grid" style="margin-bottom:18px">
    <div class="stat-card rise rise-1"><div class="stat-icon acc-green"><i class="bi bi-mortarboard"></i></div><div class="stat-value" data-count="${activos}">0</div><div class="stat-label">Accesos activos</div></div>
    <div class="stat-card rise rise-2"><div class="stat-icon acc-gold"><i class="bi bi-hourglass-split"></i></div><div class="stat-value" data-count="${pend}">0</div><div class="stat-label">Pendientes de pago</div></div>
    <div class="stat-card rise rise-3"><div class="stat-icon acc-petrol"><i class="bi bi-credit-card"></i></div><div class="stat-value">Wompi</div><div class="stat-label">Pasarela ${DB.config.wompi}</div></div>
  </div>
  <div class="card">
    <div class="card-head"><div class="card-title"><i class="bi bi-mortarboard"></i> Control de diplomados</div>
      <span class="badge b-review" style="border:none">Moodle conectado</span></div>
    <div class="table-wrap"><table class="data">
      <thead><tr><th>Usuario</th><th>Diplomado</th><th>Estado de pago</th><th>Fecha compra</th><th>Acceso escuela</th><th>Acciones</th></tr></thead>
      <tbody>${DB.escuela.map((e, i) => `<tr>
        <td><div class="user-cell"><span class="av">${initials(e.usuario)}</span><span class="cell-strong">${e.usuario}</span></div></td>
        <td class="cell-muted">${e.diplomado}</td><td>${badge(e.pago)}</td><td class="cell-muted">${e.fecha}</td>
        <td>${badge(e.acceso)}</td>
        <td><div class="action-row">
          <button class="tbtn ok" title="Activar" onclick="schoolAct(${i},'activar')"><i class="bi bi-unlock"></i></button>
          <button class="tbtn bad" title="Suspender" onclick="schoolAct(${i},'suspender')"><i class="bi bi-pause-circle"></i></button>
          <button class="tbtn view" title="Reenviar enlace" onclick="schoolAct(${i},'reenviar')"><i class="bi bi-send"></i></button>
        </div></td></tr>`).join("")}
      </tbody></table></div>
  </div>`;
};
function schoolAct(i, act) {
  const e = DB.escuela[i]; if (!e) return;
  if (act === "activar") { e.acceso = "activo"; toast("Acceso activado", e.usuario); }
  if (act === "suspender") { e.acceso = "suspendido"; toast("Acceso suspendido", e.usuario, "error"); }
  if (act === "reenviar") { toast("Enlace reenviado", e.usuario + " · " + DB.config.moodle, "info"); }
  if (state.view === "escuela") $("#viewBody").innerHTML = VIEWS.admin_escuela();
}

/* ---------- Reportes ---------- */
VIEWS.admin_reportes = () => `
  <div class="grid cols-2">
    <div class="card chart-appear"><div class="card-head"><div class="card-title"><i class="bi bi-pie-chart"></i> Usuarios por estado</div></div><div class="chart-box h-sm"><canvas id="repEstado"></canvas></div></div>
    <div class="card chart-appear"><div class="card-head"><div class="card-title"><i class="bi bi-bar-chart"></i> Ganancias por mes</div></div><div class="chart-box h-sm"><canvas id="repGanancia"></canvas></div></div>
    <div class="card chart-appear"><div class="card-head"><div class="card-title"><i class="bi bi-cash-stack"></i> Retiros procesados</div></div><div class="chart-box h-sm"><canvas id="repRet"></canvas></div></div>
    <div class="card chart-appear"><div class="card-head"><div class="card-title"><i class="bi bi-graph-up-arrow"></i> Utilidades cargadas</div></div><div class="chart-box h-sm"><canvas id="repUtil"></canvas></div></div>
    <div class="card chart-appear"><div class="card-head"><div class="card-title"><i class="bi bi-diagram-3"></i> Crecimiento de red</div></div><div class="chart-box h-sm"><canvas id="repRed"></canvas></div></div>
    <div class="card chart-appear"><div class="card-head"><div class="card-title"><i class="bi bi-mortarboard"></i> Pagos de diplomado</div></div><div class="chart-box h-sm"><canvas id="repDip"></canvas></div></div>
  </div>`;
window.after_admin_reportes = () => {
  const c = chartColors();
  makeChart("repEstado", { type: "doughnut", data: { labels: ["Activos","Pendientes","En revisión","Bloqueados"], datasets: [{ data: [191, 28, 21, 8], backgroundColor: [c.green, c.gold, c.petrol, "#dc2626"], borderWidth: 0 }] }, options: { responsive: true, maintainAspectRatio: false, cutout: "62%", plugins: { legend: { position: "right", labels: { color: c.text, usePointStyle: true, boxWidth: 8 } } } } });
  makeChart("repGanancia", { type: "bar", data: { labels: ["Oct","Nov","Dic","Ene","Feb"], datasets: [{ data: [12,18,22,31,27], backgroundColor: c.petrol, borderRadius: 6, maxBarThickness: 32 }] }, options: baseOpts({ xTitle: "Meses", yTitle: "Millones de COP (M)", plugins: { legend: { display: false } } }) });
  makeChart("repRet", { type: "line", data: { labels: ["Oct","Nov","Dic","Ene","Feb"], datasets: [{ data: [8,11,14,19,16], borderColor: c.gold, backgroundColor: ctx => vGrad(ctx.chart.ctx, "#D6A84F"), fill: true, tension: 0.4, borderWidth: 3 }] }, options: baseOpts({ xTitle: "Meses", yTitle: "Millones de COP (M)", plugins: { legend: { display: false } } }) });
  makeChart("repUtil", { type: "bar", data: { labels: ["Sem 1","Sem 2","Sem 3","Sem 4"], datasets: [{ data: [2100000,2280000,2310000,2376700], backgroundColor: c.green, borderRadius: 6, maxBarThickness: 36 }] }, options: baseOpts({ xTitle: "Semanas", yTitle: "Millones de COP (M)", plugins: { legend: { display: false } } }) });
  makeChart("repRed", { type: "line", data: { labels: ["Oct","Nov","Dic","Ene","Feb"], datasets: [{ data: [40,82,140,198,248], borderColor: c.petrol, backgroundColor: ctx => vGrad(ctx.chart.ctx, "#0F4C5C"), fill: true, tension: 0.4, borderWidth: 3 }] }, options: baseOpts({ xTitle: "Meses", yTitle: "Usuarios activos", plugins: { legend: { display: false } } }) });
  makeChart("repDip", { type: "doughnut", data: { labels: ["Pagados","Pendientes"], datasets: [{ data: [118, 24], backgroundColor: [c.green, c.gold], borderWidth: 0 }] }, options: { responsive: true, maintainAspectRatio: false, cutout: "62%", plugins: { legend: { position: "right", labels: { color: c.text, usePointStyle: true, boxWidth: 8 } } } } });
};

/* ---------- Configuración ---------- */
VIEWS.admin_settings = () => `
  <div class="grid cols-2">
    <div class="card rise rise-1">
      <div class="card-head"><div class="card-title"><i class="bi bi-percent"></i> Parámetros Ganancia</div></div>
      <div class="form-grid">
        <div class="field"><label>Porcentaje de Ganancia actual</label><input type="number" value="${DB.config.gananciaPct}" step="0.1" /></div>
        <div class="field"><label>Moneda</label><select><option>COP</option></select></div>
        <div class="field"><label>Retiro mínimo</label><input type="text" value="${cop(DB.config.retiroMin)}" /></div>
        <div class="field"><label>Retiro máximo</label><input type="text" value="${cop(DB.config.retiroMax)}" /></div>
        <button class="btn btn-petrol" onclick="toast('Configuración guardada','Parámetros Ganancia actualizados')"><i class="bi bi-save"></i> Guardar</button>
      </div>
    </div>
    <div class="card rise rise-2">
      <div class="card-head"><div class="card-title"><i class="bi bi-calendar-x"></i> Días no hábiles y festivos</div></div>
      <div class="field"><label>Agregar festivo manual</label><input type="date" /></div>
      <div style="margin-top:12px;display:grid;gap:8px">
        ${DB.festivos.map(f => `<div class="alert-item" style="padding:8px 0"><span class="a-dot" style="background:var(--gold)"></span><p>${f}</p></div>`).join("")}
      </div>
    </div>
    <div class="card rise rise-3">
      <div class="card-head"><div class="card-title"><i class="bi bi-plug"></i> Integraciones</div></div>
      <div class="form-grid">
        <div class="field"><label>Estado pasarela Wompi</label><select><option ${DB.config.wompi==="activo"?"selected":""}>Activo</option><option>Inactivo</option></select></div>
        <div class="field"><label>URL Moodle</label><input type="text" value="${DB.config.moodle}" /></div>
        <button class="btn btn-petrol" onclick="toast('Integraciones actualizadas','Wompi y Moodle')"><i class="bi bi-save"></i> Guardar</button>
      </div>
    </div>
    <div class="card rise rise-4">
      <div class="card-head"><div class="card-title"><i class="bi bi-file-text"></i> Texto legal visible</div></div>
      <div class="field"><textarea rows="5">La información mostrada corresponde a estados internos de proceso y registros administrativos. Las solicitudes y retiros están sujetos a revisión manual.</textarea></div>
      <button class="btn btn-petrol" style="margin-top:12px" onclick="toast('Texto legal guardado')"><i class="bi bi-save"></i> Guardar</button>
    </div>
  </div>`;



/* ============================================================
   Plataforma de Inversión — app.js
   ============================================================ */
const ME = { nombre: "Laura Restrepo", doc: "1.018.552.901", rut: "RUT-1018552901", correo: "laura.r@correo.co", tel: "+57 300 552 1190", banco: "Bancolombia", tipoCuenta: "Ahorros", cuenta: "•••• 4821", fecha: "2026-01-12", ganancia: 500000, retorno: 320000, disponible: 120000, retirado: 200000, ref: 2, diasUtilidad: 5, diasRetorno: 25 };

const userDias = [
  { dia: "Lunes", fecha: "2026-02-09", gan: 9120, acum: 296120, estado: "activo" },
  { dia: "Martes", fecha: "2026-02-10", gan: 9000, acum: 305120, estado: "activo" },
  { dia: "Miércoles", fecha: "2026-02-11", gan: 9500, acum: 314620, estado: "activo" },
  { dia: "Jueves", fecha: "2026-02-12", gan: 2380, acum: 317000, estado: "activo" },
  { dia: "Viernes", fecha: "2026-02-13", gan: 3000, acum: 320000, estado: "activo" },
];

function legalNote() {
  return `<div class="legal-note" style="margin-top:18px"><i class="bi bi-info-circle"></i> La información mostrada corresponde a estados internos de proceso y registros administrativos. Las solicitudes y retiros están sujetos a revisión manual.</div>`;
}

VIEWS.user_dashboard = () => `
  <div class="card rise rise-1" style="margin-bottom:18px;display:flex;align-items:center;gap:16px;background:var(--carbon);color:#fff;border-color:var(--carbon)">
    <span class="av" style="width:52px;height:52px;border-radius:13px;background:var(--gold);color:#2b1d05;font-size:1.1rem">LR</span>
    <div><h2 style="font-size:1.3rem">Hola, Laura.</h2><p style="color:#cbd5e1">Este es tu resumen de actividad.</p></div>
    <span class="badge b-active" style="margin-left:auto">Cuenta activa</span>
  </div>

  <div class="grid cols-2" style="margin-bottom:18px">
    <div class="card rise rise-2">
      <div class="card-head"><div class="card-title"><i class="bi bi-arrow-up-circle"></i> Utilidad (Día 1 al 30)</div></div>
      <div style="font-size:2rem;font-weight:700;color:var(--green)">Día ${ME.diasUtilidad} <span style="font-size:1rem;color:var(--text-soft)">/ 30</span></div>
      <div class="progress-line" style="margin-top:12px;background:var(--card-alt)"><div style="width:${(ME.diasUtilidad/30)*100}%;background:var(--green);height:100%;border-radius:4px"></div></div>
      <div style="margin-top:8px;font-size:0.85rem" class="cell-muted">Generando ganancias activamente. ${ME.diasUtilidad >= 30 ? '<span style="color:var(--st-blocked)">Ciclo completado. No se generan más ganancias.</span>' : ''}</div>
    </div>
    <div class="card rise rise-3">
      <div class="card-head"><div class="card-title"><i class="bi bi-arrow-down-circle"></i> Retorno (Día 30 al 1)</div></div>
      <div style="font-size:2rem;font-weight:700;color:var(--petrol)">${ME.diasRetorno} <span style="font-size:1rem;color:var(--text-soft)">días restantes</span></div>
      <div class="progress-line" style="margin-top:12px;background:var(--card-alt)"><div style="width:${(ME.diasRetorno/30)*100}%;background:var(--petrol);height:100%;border-radius:4px"></div></div>
      <div style="margin-top:8px;font-size:0.85rem" class="cell-muted">Días faltantes para finalizar el ciclo de retorno.</div>
    </div>
  </div>

  <div class="stat-grid">
    <div class="stat-card rise rise-1"><div class="stat-icon acc-green"><i class="bi bi-shield-check"></i></div><div class="stat-label">Estado de cuenta</div><div class="stat-value" style="font-size:1.3rem">Activo</div><div class="stat-foot trend-up"><i class="bi bi-check-circle"></i> Ganancia asignada</div></div>
    <div class="stat-card rise rise-2"><div class="stat-icon acc-petrol"><i class="bi bi-patch-check"></i></div><div class="stat-label">Ganancia asignada</div><div class="stat-value" data-count="${ME.ganancia}" data-format="cop">0</div></div>
    <div class="stat-card rise rise-3"><div class="stat-icon acc-gold"><i class="bi bi-graph-up-arrow"></i></div><div class="stat-label">Retorno acumulado</div><div class="stat-value" data-count="${ME.retorno}" data-format="cop">0</div></div>
    <div class="stat-card rise rise-4"><div class="stat-icon acc-green"><i class="bi bi-wallet2"></i></div><div class="stat-label">Disponible para retiro</div><div class="stat-value" data-count="${ME.disponible}" data-format="cop">0</div></div>
  </div>
  <div class="card chart-appear" style="margin-top:18px">
    <div class="card-head"><div class="card-title"><i class="bi bi-graph-up"></i> Evolución del retorno acumulado</div><span class="badge b-review" style="border:none">Días hábiles</span></div>
    <div class="chart-box h-md"><canvas id="uEvol"></canvas></div>
  </div>
  <div class="card" style="margin-top:18px">
    <div class="card-head"><div class="card-title"><i class="bi bi-table"></i> Detalle por día hábil</div></div>
    <div class="table-wrap"><table class="data">
      <thead><tr><th>Día</th><th>Fecha</th><th>Ganancia del día</th><th>Acumulado</th><th>Estado</th></tr></thead>
      <tbody>${userDias.map(d => `<tr><td class="cell-strong">${d.dia}</td><td class="cell-muted">${d.fecha}</td><td style="color:var(--green);font-weight:700">+${cop(d.gan)}</td><td class="cell-strong">${cop(d.acum)}</td><td>${badge(d.estado)}</td></tr>`).join("")}</tbody>
    </table></div>
  </div>
  ${legalNote()}`;
window.after_user_dashboard = () => {
  const c = chartColors();
  makeChart("uEvol", { type: "line", data: { labels: userDias.map(d => d.dia.slice(0,3)),
    datasets: [
      { label: "Acumulado", data: userDias.map(d => d.acum), borderColor: c.petrol, backgroundColor: ctx => vGrad(ctx.chart.ctx, "#0F4C5C"), fill: true, tension: 0.4, borderWidth: 3, pointRadius: 4, pointBackgroundColor: c.petrol },
      { label: "Utilidad diaria", data: userDias.map(d => d.gan), borderColor: c.green, backgroundColor: "transparent", tension: 0.4, borderWidth: 2, pointRadius: 3, yAxisID: "y1" },
    ] },
    options: baseOpts({ scales: Object.assign(baseOpts().scales, { y1: { position: "right", grid: { display: false }, ticks: { color: c.text } } }) }) });
};

/* ---------- Mi Perfil ---------- */
VIEWS.user_profile = () => `
  <div class="card" style="max-width:840px">
    <div class="card-head"><div class="card-title"><i class="bi bi-person-gear"></i> Datos personales y bancarios</div><span class="badge b-active">Activo</span></div>
    <form class="form-grid cols-2" style="grid-template-columns:1fr 1fr" onsubmit="event.preventDefault();toast('Perfil actualizado','Tus datos fueron guardados')">
      <div class="field"><label>Nombre completo</label><input value="${ME.nombre}" /></div>
      <div class="field"><label>Documento</label><input value="${ME.doc}" /></div>
      <div class="field"><label>RUT</label><input value="${ME.rut}" /></div>
      <div class="field"><label>Correo</label><input type="email" value="${ME.correo}" /></div>
      <div class="field"><label>Teléfono</label><input value="${ME.tel}" /></div>
      <div class="field"><label>Fecha de entrada</label><input type="date" value="2026-01-12" /></div>
      <div class="field"><label>Banco</label><select><option ${ME.banco === 'Bancolombia' ? 'selected' : ''}>Bancolombia</option><option ${ME.banco === 'Nequi' ? 'selected' : ''}>Nequi</option><option ${ME.banco === 'Bre-B' ? 'selected' : ''}>Bre-B</option></select></div>
      <div class="field"><label>Tipo de cuenta</label><select><option>Ahorros</option><option>Corriente</option></select></div>
      <div class="field"><label>Número de cuenta</label><input value="${ME.cuenta}" /></div>
      <div class="field"><label>Estado del usuario</label><input value="Activo" disabled /></div>
      <button class="btn btn-petrol" type="submit" style="grid-column:span 2"><i class="bi bi-save"></i> Guardar cambios</button>
    </form>
  </div>${legalNote()}`;

/* ---------- Mi Retorno ---------- */
VIEWS.user_retorno = () => `
  <div class="alert-item" style="margin-bottom:18px;background:var(--card-alt);border:1px solid var(--border-soft)"><span class="a-dot" style="background:var(--petrol)"></span><div><p style="font-weight:600">Ciclo de Ganancia (30 días)</p><small class="cell-muted">La utilidad va del día 1 al 30 y el retorno del día 30 al 1. Después de 30 días no se generan más ganancias.</small></div></div>
  <div class="stat-grid" style="margin-bottom:18px">
    <div class="stat-card rise rise-1"><div class="stat-icon acc-petrol"><i class="bi bi-calendar-arrow-up"></i></div><div class="stat-label">Día de Utilidad</div><div class="stat-value">${ME.diasUtilidad} <span style="font-size:1rem;color:var(--text-soft)">/ 30</span></div></div>
    <div class="stat-card rise rise-2"><div class="stat-icon acc-gold"><i class="bi bi-calendar-arrow-down"></i></div><div class="stat-label">Días de Retorno</div><div class="stat-value">${ME.diasRetorno} <span style="font-size:1rem;color:var(--text-soft)">/ 1</span></div></div>
    <div class="stat-card rise rise-3"><div class="stat-icon acc-green"><i class="bi bi-percent"></i></div><div class="stat-label">Porcentaje actual</div><div class="stat-value" data-count="${DB.config.gananciaPct}" data-format="pct">0</div></div>
    <div class="stat-card rise rise-4"><div class="stat-icon acc-petrol"><i class="bi bi-graph-up-arrow"></i></div><div class="stat-label">Retorno acumulado</div><div class="stat-value" data-count="${ME.retorno}" data-format="cop">0</div></div>
  </div>
  <div class="grid cols-3">
    <div class="card span-2 chart-appear"><div class="card-head"><div class="card-title"><i class="bi bi-graph-up"></i> Retorno acumulado y por día hábil</div></div><div class="chart-box h-md"><canvas id="uRetChart"></canvas></div></div>
    <div class="card chart-appear"><div class="card-head"><div class="card-title"><i class="bi bi-pie-chart"></i> Estado del retorno</div></div><div class="chart-box h-sm"><canvas id="uDonut"></canvas></div>
      <div style="margin-top:10px;font-size:0.84rem" class="cell-muted">Acumulado, retirado y disponible.</div></div>
  </div>
  <div class="card" style="margin-top:18px">
    <div class="card-head"><div class="card-title"><i class="bi bi-table"></i> Detalle de retorno</div></div>
    <div class="table-wrap"><table class="data">
      <thead><tr><th>Fecha</th><th>Día</th><th>Utilidad aplicada</th><th>Retorno generado</th><th>Acumulado</th><th>Observación</th></tr></thead>
      <tbody>${userDias.map(d => `<tr><td class="cell-muted">${d.fecha}</td><td class="cell-strong">${d.dia}</td><td>${DB.config.gananciaPct}%</td><td style="color:var(--green);font-weight:700">+${cop(d.gan)}</td><td class="cell-strong">${cop(d.acum)}</td><td class="cell-muted">Día hábil</td></tr>`).join("")}</tbody>
    </table></div>
  </div>${legalNote()}`;
window.after_user_retorno = () => {
  const c = chartColors();
  makeChart("uRetChart", { type: "bar", data: { labels: userDias.map(d => d.dia.slice(0,3)),
    datasets: [
      { type: "bar", label: "Retorno por día hábil", data: userDias.map(d => d.gan), backgroundColor: c.green, borderRadius: 8, maxBarThickness: 34 },
      { type: "line", label: "Acumulado", data: userDias.map(d => d.acum), borderColor: c.petrol, backgroundColor: "transparent", tension: 0.4, borderWidth: 3, pointRadius: 3, yAxisID: "y1" },
    ] },
    options: baseOpts({ scales: Object.assign(baseOpts().scales, { y1: { position: "right", grid: { display: false }, ticks: { color: c.text } } }) }) });
  makeChart("uDonut", { type: "doughnut", data: { labels: ["Acumulado","Retirado","Disponible"], datasets: [{ data: [ME.retorno - ME.disponible - ME.retirado < 0 ? ME.retorno : ME.retorno, ME.retirado, ME.disponible], backgroundColor: [c.petrol, c.gold, c.green], borderWidth: 0 }] }, options: { responsive: true, maintainAspectRatio: false, cutout: "62%", plugins: { legend: { position: "bottom", labels: { color: c.text, usePointStyle: true, boxWidth: 8 } } } } });
};

/* ---------- Retirar ---------- */
VIEWS.user_retirar = () => `
  <div class="grid cols-3">
    <div class="card span-2 rise rise-1">
      <div class="card-head"><div class="card-title"><i class="bi bi-cash-coin"></i> Solicitar retiro</div></div>
      <div class="card flat" style="background:var(--card-alt);margin-bottom:18px"><div class="stat-label">Disponible para retiro</div><div class="stat-value" style="color:var(--green)" data-count="${ME.disponible}" data-format="cop">0</div></div>
      <form id="retForm" class="form-grid cols-2" style="grid-template-columns:1fr 1fr">
        <div class="field"><label>Monto a retirar (100%)</label><input type="text" id="retMonto" value="${cop(ME.disponible)}" disabled style="color:var(--green);font-weight:600" /></div>
        <div class="field"><label>Banco</label><select disabled><option ${ME.banco === 'Bancolombia' ? 'selected' : ''}>Bancolombia</option><option ${ME.banco === 'Nequi' ? 'selected' : ''}>Nequi</option><option ${ME.banco === 'Bre-B' ? 'selected' : ''}>Bre-B</option></select></div>
        <div class="field"><label>Tipo de cuenta</label><select disabled><option ${ME.tipoCuenta === 'Ahorros' ? 'selected' : ''}>Ahorros</option><option ${ME.tipoCuenta === 'Corriente' ? 'selected' : ''}>Corriente</option></select></div>
        <div class="field"><label>Número de cuenta</label><input value="${ME.cuenta}" disabled /></div>
        <div style="grid-column:span 2; font-size: 0.85rem;" class="cell-muted"><i class="bi bi-shield-lock"></i> Por seguridad, los datos bancarios no se pueden modificar aquí. Puedes actualizarlos desde <a style="cursor:pointer;color:var(--petrol);font-weight:600" onclick="navigate('profile')">Mi Perfil</a>.</div>
        <div class="checkrow" style="grid-column:span 2"><input type="checkbox" id="retConfirm" /><label for="retConfirm">Confirmo que los datos bancarios son correctos.</label></div>
        <button class="btn btn-green" type="submit" style="grid-column:span 2"><i class="bi bi-send"></i> Solicitar retiro</button>
      </form>
      <div class="legal-note" style="margin-top:16px"><i class="bi bi-info-circle"></i> Los retiros son revisados y procesados manualmente por administración.</div>
    </div>
    <div class="card rise rise-2">
      <div class="card-head"><div class="card-title"><i class="bi bi-clock-history"></i> Estado de solicitudes</div></div>
      <div style="display:grid;gap:10px">
        <div class="alert-item"><span class="a-dot" style="background:var(--gold)"></span><div><p>RET-7001 · ${cop(120000)}</p><small class="cell-muted">${badge("pendiente")}</small></div></div>
        <div class="alert-item"><span class="a-dot" style="background:var(--st-processing)"></span><div><p>RET-6990 · ${cop(80000)}</p><small class="cell-muted">${badge("proceso")}</small></div></div>
        <div class="alert-item"><span class="a-dot" style="background:var(--green)"></span><div><p>RET-6980 · ${cop(200000)}</p><small class="cell-muted">${badge("pagado")}</small></div></div>
      </div>
    </div>
  </div>`;
window.after_user_retirar = () => {
  $("#retForm")?.addEventListener("submit", e => {
    e.preventDefault();
    const monto = +$("#retMonto").value;
    if (!$("#retConfirm").checked) return toast("Confirma tus datos", "Marca la casilla de confirmación", "error");
    if (!monto || monto <= 0) return toast("Monto inválido", "Ingresa un valor mayor a cero", "error");
    if (monto > ME.disponible) return toast("Monto superior al disponible", "Disponible: " + cop(ME.disponible), "error");
    toast("Retiro solicitado", cop(monto) + " · en revisión manual", "info");
    $("#retForm").reset();
  });
};

/* ---------- Mi Equipo ---------- */
VIEWS.user_equipo = () => {
  const total = countTree(DB.arbol);
  const directos = DB.arbol.hijos.length;
  return `
  <div class="stat-grid" style="margin-bottom:18px">
    <div class="stat-card rise rise-1"><div class="stat-icon acc-petrol"><i class="bi bi-person-plus"></i></div><div class="stat-value">${DB.arbol.cupos}/10</div><div class="stat-label">Cupos de referidos usados</div></div>
    <div class="stat-card rise rise-2"><div class="stat-icon acc-gold"><i class="bi bi-collection"></i></div><div class="stat-value" data-count="${total}">0</div><div class="stat-label">Equipo total</div></div>
    <div class="stat-card rise rise-3"><div class="stat-icon acc-green"><i class="bi bi-1-circle"></i></div><div class="stat-value">${directos}</div><div class="stat-label">En tu Nivel 1</div></div>
    <div class="stat-card rise rise-4"><div class="stat-icon acc-petrol"><i class="bi bi-2-circle"></i></div><div class="stat-value">${total - directos}</div><div class="stat-label">Niveles inferiores</div></div>
  </div>
  <div class="card">
    <div class="card-head"><div class="card-title"><i class="bi bi-diagram-3"></i> Mi red de referidos</div>
      <div style="display:flex;gap:12px;align-items:center">
        <span style="font-weight:600;font-size:0.95rem;color:var(--text-soft)">Cód: LR-1042</span>
        <button class="btn btn-gold btn-sm" onclick="copyInvite('LR-1042')"><i class="bi bi-link-45deg"></i> Copiar enlace</button>
      </div></div>
    <div class="legal-note" style="margin-bottom:16px"><i class="bi bi-info-circle"></i> Puedes invitar máximo 10 personas. Tus referidos #3, #6 y #9 pasarán a ser referidos directos de tu patrocinador. Del mismo modo, recibirás los referidos #3, #6 y #9 de los miembros directos de tu red.</div>
    <div class="tree" id="treeRoot">${renderTreeNode(DB.arbol)}</div>
  </div>`;
};
function copyInvite(code = "LR-1042") {
  const url = new URL(window.location.href);
  url.searchParams.set("ref", code);
  const link = url.href;
  if (navigator.clipboard) navigator.clipboard.writeText(link).catch(() => {});
  toast("Enlace de invitación copiado.", link, "success");
}

/* ---------- Escuela (user) ---------- */
VIEWS.user_escuela = () => `
  <div class="grid cols-3">
    <div class="card span-2 rise rise-1">
      <div class="card-head"><div class="card-title"><i class="bi bi-mortarboard"></i> Diplomado en Gestión Financiera</div><span class="badge b-active">Activo</span></div>
      <div class="detail-grid" style="margin-bottom:16px">
        <div><div class="dl">Estado de pago</div><div class="dv">${badge("pagado")}</div></div>
        <div><div class="dl">Acceso plataforma</div><div class="dv">Habilitado (Moodle)</div></div>
      </div>
      <div class="dl" style="margin-bottom:10px">Progreso académico</div>
      <div class="bar"><span style="width:55%"></span></div>
      <div style="display:flex;justify-content:space-between;margin-top:6px"><small class="cell-muted">2 de 4 módulos</small><small class="cell-strong">55%</small></div>
      <a class="btn btn-petrol" href="${DB.config.moodle}" target="_blank" rel="noopener" style="margin-top:18px"><i class="bi bi-box-arrow-up-right"></i> Ir a la escuela</a>
    </div>
    <div class="card rise rise-2">
      <div class="card-head"><div class="card-title"><i class="bi bi-list-task"></i> Módulos</div></div>
      <div style="display:grid;gap:12px">
        <div class="module-card"><div class="m-icon acc-green"><i class="bi bi-check-circle"></i></div><div><strong>Módulo 1</strong><br><small class="cell-muted">Completado</small></div></div>
        <div class="module-card"><div class="m-icon acc-petrol"><i class="bi bi-play-circle"></i></div><div><strong>Módulo 2</strong><br><small class="cell-muted">En curso</small></div></div>
        <div class="module-card"><div class="m-icon acc-gold"><i class="bi bi-pencil-square"></i></div><div><strong>Evaluación</strong><br><small class="cell-muted">Pendiente</small></div></div>
        <div class="module-card"><div class="m-icon acc-carbon"><i class="bi bi-award"></i></div><div><strong>Certificado</strong><br><small class="cell-muted">No disponible aún</small></div></div>
      </div>
    </div>
  </div>`;

/* ---------- Historial ---------- */
VIEWS.user_historial = () => `
  <div class="card">
    <div class="card-head"><div class="card-title"><i class="bi bi-clock-history"></i> Movimientos y registros</div></div>
    <div class="table-wrap"><table class="data">
      <thead><tr><th>Fecha</th><th>Tipo</th><th>Descripción</th><th>Estado</th><th>Monto</th><th>Comprobante</th></tr></thead>
      <tbody>${DB.historial.map(h => `<tr>
        <td class="cell-muted">${h.fecha}</td><td><span class="badge b-review" style="border:none">${h.tipo}</span></td>
        <td>${h.desc}</td><td>${badge(h.estado)}</td>
        <td class="cell-strong" style="color:${h.monto < 0 ? "var(--st-blocked)" : h.monto > 0 ? "var(--green)" : "var(--text-soft)"}">${h.monto === 0 ? "—" : cop(h.monto)}</td>
        <td><button class="tbtn view" onclick="toast('Comprobante','Documento simulado','info')"><i class="bi bi-file-earmark-text"></i></button></td></tr>`).join("")}
      </tbody></table></div>
  </div>${legalNote()}`;

/* ---------- Soporte ---------- */
VIEWS.user_soporte = () => `
  <div class="card" style="max-width:680px">
    <div class="card-head"><div class="card-title"><i class="bi bi-life-preserver"></i> Centro de soporte</div></div>
    <form class="form-grid" onsubmit="event.preventDefault();toast('Solicitud enviada','Nuestro equipo te responderá pronto')">
      <div class="field"><label>Asunto</label><input placeholder="Resumen de tu solicitud" required /></div>
      <div class="field"><label>Tipo de solicitud</label><select><option>Consulta general</option><option>Ganancia</option><option>Retiro</option><option>Acceso académico</option><option>Referidos</option></select></div>
      <div class="field"><label>Mensaje</label><textarea rows="5" placeholder="Describe tu solicitud..." required></textarea></div>
      <div class="file-drop"><i class="bi bi-paperclip"></i> Adjuntar archivo (simulado)</div>
      <button class="btn btn-petrol" type="submit"><i class="bi bi-send"></i> Enviar reporte</button>
    </form>
  </div>`;



/* ---------------- Boot ---------------- */
applyTheme("light");
setupLogin();
setupTopbar();
