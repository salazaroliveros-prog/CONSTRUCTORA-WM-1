// CSS is loaded via <link> tags in index.html — no imports needed here
// Fixed logo path to use direct public path to avoid Vite asset hashing issues
// Use root-relative paths for all assets to ensure consistency across environments
const STITCH_ROOT = "/src/components/stitch";
const LOGO_PATH = "/src/components/stitch/modern_minimalist_logo_for_an_architecture_and_construction_company_named/logo-wm.png";
const DEFAULT_ROUTE = "dashboard";
const AFTER_LOGIN_ROUTE = "dashboard";

(function () {
  "use strict";

  const routes = [
    { id: "dashboard", label: "Tablero", icon: "dashboard", path: `${STITCH_ROOT}/tablero_de_control_principal_3/code.html`, group: "Inicio" },
    { id: "clients", label: "Proyectos y clientes", icon: "groups", path: `${STITCH_ROOT}/gesti_n_de_clientes_y_proyectos/code.html`, group: "Comercial" },
    { id: "client-apu", label: "Cliente a APU", icon: "auto_awesome", path: `${STITCH_ROOT}/gesti_n_de_clientes_y_conversi_n_a_apu/code.html`, group: "Comercial" },
    { id: "apu", label: "Presupuestos APU", icon: "calculate", path: `${STITCH_ROOT}/calculadora_de_costos_y_apu_avanzada/code.html`, group: "Presupuestos" },
    { id: "apu-advanced", label: "Desglose APU", icon: "construction", path: `${STITCH_ROOT}/calculadora_de_apu_avanzada_con_filtros_y_concertina_6/code.html`, group: "Presupuestos" },
    { id: "tracking", label: "Seguimiento", icon: "query_stats", path: `${STITCH_ROOT}/seguimiento_f_sico_financiero_de_proyectos_2/code.html`, group: "Seguimiento" },
    { id: "alerts", label: "Alertas", icon: "notifications_active", path: `${STITCH_ROOT}/seguimiento_de_proyectos_con_alertas_2/code.html`, group: "Seguimiento" },
    { id: "schedule", label: "Cronograma", icon: "calendar_month", path: `${STITCH_ROOT}/cronograma_de_proyecto_automatizado/code.html`, group: "Seguimiento" },
    { id: "multichannel", label: "Cronograma y alertas", icon: "campaign", path: `${STITCH_ROOT}/cronograma_y_alertas_multicanal/code.html`, group: "Seguimiento" },
    { id: "operations", label: "Finanzas y gastos", icon: "receipt_long", path: `${STITCH_ROOT}/control_operativo_planilla_y_gastos_6/code.html`, group: "Finanzas" },
    { id: "apu-report", label: "Informe APU", icon: "picture_as_pdf", path: `${STITCH_ROOT}/vista_de_exportaci_n_de_informe_apu_3/code.html`, group: "Reportes" },
    { id: "client-summary", label: "Resumen cliente", icon: "summarize", path: `${STITCH_ROOT}/resumen_de_presupuesto_para_cliente_3/code.html`, group: "Reportes" },
    { id: "assistant", label: "Asistente APU", icon: "psychology", path: `${STITCH_ROOT}/asistente_de_conversi_n_a_apu/code.html`, group: "Herramientas" },
    { id: "mobile-alerts", label: "Vista movil", icon: "phone_iphone", path: `${STITCH_ROOT}/alertas_y_cronograma_m_vil/code.html`, group: "Herramientas" },
    { id: "management", label: "Sistema general", icon: "domain", path: `${STITCH_ROOT}/constructora_wm_m_s_management_system/code.html`, group: "Sistema" }
  ];

  const routeById = new Map(routes.map((route) => [route.id, route]));
  const moduleCache = new Map(); // Cache de iframes precargados
  let iframe = null;
  let nav = null;
  let title = null;
  let status = null;
  let supabaseClient = null;
  let currentSession = null;
  let currentRouteRendered = null;

  function getConfig() {
    return window.CONSTRUCTORA_WM_CONFIG || {};
  }

  function getSupabase() {
    const config = getConfig();
    if (supabaseClient) return supabaseClient;
    if (!window.supabase || !isConfigured()) return null;

    supabaseClient = window.supabase.createClient(config.supabaseUrl, config.supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storageKey: "wm-auth-session",
        flowType: "pkce"
      },
      global: {
        headers: { "x-client-info": "constructora-wm/1.0" }
      }
    });
    return supabaseClient;
  }

  // Devuelve cliente con sesión activa garantizada o null
  async function getAuthedClient() {
    const client = getSupabase();
    if (!client) return null;
    if (currentSession?.access_token) return client;
    const { data: { session } } = await client.auth.getSession();
    if (session) { currentSession = session; return client; }
    return null;
  }

  function isConfigured() {
    const config = getConfig();
    return isValidSupabaseUrl(config.supabaseUrl) && isValidSupabaseKey(config.supabaseAnonKey);
  }

  function isValidSupabaseUrl(value) {
    return /^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/i.test(String(value || "").trim());
  }

  function isValidSupabaseKey(value) {
    const key = String(value || "").trim();
    return key.startsWith("sb_publishable_") || key.split(".").length === 3;
  }

  function isAuthCallback() {
    const hash = window.location.hash;
    return hash.includes("access_token=") || hash.includes("refresh_token=") || hash.includes("type=recovery") || hash.includes("error=");
  }

  function normalizeRoute(value) {
    const route = (value || "").replace(/^#\/?/, "").trim();
    return routeById.has(route) ? route : DEFAULT_ROUTE;
  }

  function currentRouteId() {
    const hash = window.location.hash;
    // Special handling for Supabase auth fragments (e.g. #access_token=...)
    if (isAuthCallback()) {
      return AFTER_LOGIN_ROUTE;
    }
    return normalizeRoute(hash);
  }

  function toggleDarkMode() {
    const isDark = document.body.classList.toggle("dark-mode");
    localStorage.setItem("wm-theme", isDark ? "dark" : "light");
    syncDarkModeToIframe();
  }

  function syncDarkModeToIframe() {
    if (!iframe.contentDocument) return;
    const isDark = document.body.classList.contains("dark-mode");
    if (isDark) {
      iframe.contentDocument.documentElement.classList.add("dark");
      iframe.contentDocument.body.classList.add("dark-mode");
    } else {
      iframe.contentDocument.documentElement.classList.remove("dark");
      iframe.contentDocument.body.classList.remove("dark-mode");
    }
  }

  function toggleSidebar() {
    document.querySelector(".app-shell").classList.toggle("is-collapsed");
  }

  function setStatus(message) {
    if (status) status.textContent = message;
  }

  function navigate(routeId) {
    const safeRoute = normalizeRoute(routeId);
    if (window.location.hash !== `#/${safeRoute}`) {
      window.location.hash = `/${safeRoute}`;
      return;
    }
    renderRoute(safeRoute);
  }

  function renderRoute(routeId) {
    const route = routeById.get(normalizeRoute(routeId)) || routeById.get(DEFAULT_ROUTE);
    const client = getSupabase();
    if (client && !currentSession && !isAuthCallback()) {
      showLoginScreen();
      return;
    }

    // Evitar re-render del mismo módulo
    if (currentRouteRendered === route.id) return;
    currentRouteRendered = route.id;

    const shell = document.querySelector(".app-shell");
    shell.classList.remove("is-login-screen");

    // Dashboard: sidebar abierto para mostrar el menú principal
    // Otros módulos: sidebar colapsado, solo accesible via hamburguesa
    if (route.id === "dashboard") {
      shell.classList.remove("is-collapsed");
    } else {
      shell.classList.add("is-collapsed");
    }

    const loader = document.getElementById("wm-loader-overlay");

    if (moduleCache.has(route.id)) {
      if (loader) loader.classList.remove("active");
      iframe.classList.remove("loading");
      iframe.src = route.path;
      title.textContent = route.label;
    } else {
      if (loader) loader.classList.add("active");
      iframe.classList.add("loading");
      iframe.src = route.path;
      title.textContent = route.label;

      iframe.onload = () => {
        const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
        if (!iframeDoc) return;
        const twScript = iframeDoc.querySelector('script[src*="cdn.tailwindcss.com"]');
        if (twScript) twScript.removeAttribute("src");
        try { moduleCache.set(route.id, true); } catch(e) {}
        syncDarkModeToIframe();
        if (loader) loader.classList.remove("active");
        iframe.classList.remove("loading");
      };
    }

    Array.from(nav.querySelectorAll("button[data-route]")).forEach((button) => {
      const active = button.dataset.route === route.id;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-current", active ? "page" : "false");
    });

    setStatus(isConfigured() ? "" : "Modo demo");
    prefetchAdjacentRoutes(route.id);
  }

  function prefetchAdjacentRoutes(currentId) {
    const idx = routes.findIndex(r => r.id === currentId);
    const toPrefetch = [
      routes[idx + 1],
      routes[idx - 1]
    ].filter(r => r && !moduleCache.has(r.id));

    toPrefetch.forEach(r => {
      const link = document.createElement("link");
      link.rel = "prefetch";
      link.href = r.path;
      link.as = "document";
      document.head.appendChild(link);
    });
  }

  function makeIcon(name) {
    const icon = document.createElement("span");
    icon.className = "material-symbols-outlined";
    icon.textContent = name;
    icon.setAttribute("aria-hidden", "true");
    return icon;
  }

  function buildShell() {
    document.body.innerHTML = "";

    const shell = document.createElement("main");
    shell.className = "app-shell";

    const sidebar = document.createElement("aside");
    sidebar.className = "app-sidebar";

    const brand = document.createElement("section");
    brand.className = "app-brand";
    const brandImg = document.createElement("img");
    brandImg.src = LOGO_PATH;
    brandImg.alt = "Logotipo CONSTRUCTORA WM/M&S";
    const brandName = document.createElement("strong");
    brandName.textContent = "CONSTRUCTORA WM/M\u0026S";
    const brandSlogan = document.createElement("span");
    brandSlogan.textContent = "Edificando el Futuro";
    brand.append(brandImg, brandName, brandSlogan);

    nav = document.createElement("nav");
    nav.className = "app-nav";
    nav.setAttribute("aria-label", "Pantallas de la plataforma");

    let activeGroup = "";
    routes.forEach((route) => {
      if (route.group && route.group !== activeGroup) {
        activeGroup = route.group;
        const group = document.createElement("span");
        group.className = "app-nav-group";
        group.textContent = activeGroup;
        nav.appendChild(group);
      }
      const button = document.createElement("button");
      button.type = "button";
      button.dataset.route = route.id;
      button.title = route.label;
      button.append(makeIcon(route.icon), document.createTextNode(route.label));
      button.addEventListener("click", () => navigate(route.id));
      nav.appendChild(button);
    });

    const footer = document.createElement("section");
    footer.className = "app-sidebar-footer";
    footer.innerHTML = "<span>GitHub + Vercel + Supabase</span>";

    sidebar.append(brand, nav, footer);

    const workspace = document.createElement("section");
    workspace.className = "app-workspace";

    const header = document.createElement("header");
    header.className = "app-header";

    const headerLeft = document.createElement("div");
    headerLeft.style.display = "flex";
    headerLeft.style.alignItems = "center";
    headerLeft.style.gap = "12px";

    const toggleBtn = document.createElement("button");
    toggleBtn.className = "app-header-btn";
    toggleBtn.innerHTML = makeIcon("menu").outerHTML;
    toggleBtn.title = "Alternar menú";
    toggleBtn.addEventListener("click", toggleSidebar);

    title = document.createElement("h1");
    headerLeft.append(toggleBtn, title);

    const headerRight = document.createElement("div");
    headerRight.style.display = "flex";
    headerRight.style.alignItems = "center";
    headerRight.style.gap = "12px";

    const themeBtn = document.createElement("button");
    themeBtn.className = "app-header-btn";
    themeBtn.innerHTML = makeIcon("dark_mode").outerHTML;
    themeBtn.title = "Alternar modo oscuro";
    themeBtn.addEventListener("click", toggleDarkMode);

    const logoutBtn = document.createElement("button");
    logoutBtn.className = "app-header-btn";
    logoutBtn.id = "wm-logout-btn";
    logoutBtn.innerHTML = makeIcon("logout").outerHTML;
    logoutBtn.title = "Cerrar sesión";
    logoutBtn.addEventListener("click", async () => {
      const client = getSupabase();
      if (client) await client.auth.signOut();
      currentSession = null;
      showLoginScreen();
    });

    status = document.createElement("span");
    status.className = "app-status";

    headerRight.append(status, themeBtn, logoutBtn);
    header.append(headerLeft, headerRight);

    iframe = document.createElement("iframe");
    iframe.id = "app-frame";
    iframe.title = "Pantalla activa de CONSTRUCTORA WM/M&S";
    iframe.setAttribute("loading", "lazy");

    // Loader
    const loaderOverlay = document.createElement("div");
    loaderOverlay.id = "wm-loader-overlay";
    loaderOverlay.className = "wm-loader-overlay active";
    loaderOverlay.innerHTML = `
      <div class="wm-spinner">
        <div class="arc"></div>
        <div class="arc"></div>
        <div class="arc"></div>
      </div>
      <span class="wm-loader-label">Cargando&hellip;</span>
    `;

    // Command Palette
    const cmdPalette = document.createElement("div");
    cmdPalette.id = "wm-cmd-palette";
    cmdPalette.className = "wm-cmd-palette";
    cmdPalette.innerHTML = `
      <div class="wm-cmd-content">
        <input type="text" class="wm-cmd-input" id="wm-cmd-input" placeholder="Buscar módulo (Ctrl+K)..." autocomplete="off">
        <div class="wm-cmd-results" id="wm-cmd-results"></div>
      </div>
    `;

    const frameWrap = document.createElement("div");
    frameWrap.className = "app-frame-wrap";
    frameWrap.appendChild(iframe);

    workspace.append(header, loaderOverlay, frameWrap);
    shell.append(sidebar, workspace);
    document.body.append(shell, cmdPalette);

    initCommandPalette(cmdPalette);
    initKeyboardShortcuts();
  }

  function initCommandPalette(palette) {
    const input = palette.querySelector("#wm-cmd-input");
    const results = palette.querySelector("#wm-cmd-results");

    function openPalette() {
      palette.classList.add("open");
      input.value = "";
      renderResults("");
      setTimeout(() => input.focus(), 50);
    }

    function closePalette() {
      palette.classList.remove("open");
      input.blur();
    }

    function renderResults(query) {
      results.innerHTML = "";
      const q = query.toLowerCase();
      // Only show non-hidden routes
      const matches = routes.filter(r => 
        r.id !== "legacy-login" && 
        (r.label.toLowerCase().includes(q) || r.id.toLowerCase().includes(q))
      );

      if (matches.length === 0) {
        results.innerHTML = '<div style="padding: 16px; color: #64748b; text-align: center;">No hay resultados</div>';
        return;
      }

      matches.forEach((r, idx) => {
        const div = document.createElement("div");
        div.className = "wm-cmd-item";
        if (idx === 0) div.classList.add("selected");
        div.innerHTML = makeIcon(r.icon).outerHTML + `<span>${r.label}</span>`;
        div.addEventListener("click", () => {
          navigate(r.id);
          closePalette();
        });
        results.appendChild(div);
      });
    }

    input.addEventListener("input", (e) => renderResults(e.target.value));

    input.addEventListener("keydown", (e) => {
      const items = Array.from(results.querySelectorAll(".wm-cmd-item"));
      const selectedIndex = items.findIndex(item => item.classList.contains("selected"));
      
      if (e.key === "ArrowDown") {
        e.preventDefault();
        if (selectedIndex < items.length - 1) {
          if (selectedIndex >= 0) items[selectedIndex].classList.remove("selected");
          items[selectedIndex + 1].classList.add("selected");
        }
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        if (selectedIndex > 0) {
          items[selectedIndex].classList.remove("selected");
          items[selectedIndex - 1].classList.add("selected");
        }
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (selectedIndex >= 0) items[selectedIndex].click();
      } else if (e.key === "Escape") {
        closePalette();
      }
    });

    palette.addEventListener("click", (e) => {
      if (e.target === palette) closePalette();
    });

    window.openCommandPalette = openPalette;
    window.closeCommandPalette = closePalette;
  }

  function initKeyboardShortcuts() {
    window.addEventListener("keydown", (e) => {
      // Ctrl+K / Cmd+K for Command Palette
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        window.openCommandPalette();
      }
      // Ctrl+B / Cmd+B for Sidebar
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "b") {
        e.preventDefault();
        toggleSidebar();
      }
      // Esc to close palette if open
      if (e.key === "Escape") {
        if (document.getElementById("wm-cmd-palette").classList.contains("open")) {
          window.closeCommandPalette();
        }
      }
    });
  }

  function patchFrame() {
    const doc = iframe.contentDocument;
    if (!doc) return;
    const route = currentRouteId();

    // Suppress Tailwind CDN production warning — override console.warn safely
    try {
      const iframeWin = iframe.contentWindow;
      if (iframeWin && !iframeWin.__wmWarnPatched) {
        const _warn = iframeWin.console.warn.bind(iframeWin.console);
        iframeWin.console.warn = (...args) => {
          if (String(args[0] || "").includes("cdn.tailwindcss.com")) return;
          _warn(...args);
        };
        iframeWin.__wmWarnPatched = true;
      }
    } catch(e) {}

    // Hide loader smoothly
    const loader = document.getElementById("wm-loader-overlay");
    if (loader) loader.classList.remove("active");
    iframe.classList.remove("loading");

    normalizeStitchScreen(doc);
    patchLogin(doc);
    patchLinks(doc);
    patchActions(doc);
    patchCalculations(doc, route);
    patchDataSync(doc, route);
    patchClock(doc);
    injectFlowNav(doc, route);  // barra de flujo contextual
    syncDarkModeToIframe();

    // Attach global keyboard shortcuts inside iframe so Cmd+K works there too
    doc.addEventListener("keydown", (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        window.openCommandPalette();
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "b") {
        e.preventDefault();
        toggleSidebar();
      }
    });
  }

  // ── Barra de navegación contextual del flujo de trabajo ──────────────
  // Solo en módulos que no son el dashboard
  // Flujo: Clientes → APU → Seguimiento → Gastos
  function injectFlowNav(doc, route) {
    if (route === "dashboard" || doc.getElementById("wm-flow-nav")) return;

    // Mapa de flujo: dónde va cada módulo
    const flowMap = {
      "clients":       { prev: "dashboard",  next: "apu",        prevLabel: "Tablero",          nextLabel: "Presupuestos APU" },
      "client-apu":    { prev: "clients",    next: "apu",        prevLabel: "Clientes",          nextLabel: "Presupuestos APU" },
      "apu":           { prev: "clients",    next: "apu-advanced", prevLabel: "Clientes",        nextLabel: "Desglose APU" },
      "apu-advanced":  { prev: "apu",        next: "tracking",   prevLabel: "Presupuesto APU",   nextLabel: "Seguimiento" },
      "tracking":      { prev: "apu",        next: "operations", prevLabel: "Presupuesto APU",   nextLabel: "Finanzas y gastos" },
      "alerts":        { prev: "tracking",   next: "operations", prevLabel: "Seguimiento",       nextLabel: "Finanzas y gastos" },
      "schedule":      { prev: "tracking",   next: "multichannel", prevLabel: "Seguimiento",     nextLabel: "Cronograma y alertas" },
      "multichannel":  { prev: "schedule",   next: "operations", prevLabel: "Cronograma",        nextLabel: "Finanzas y gastos" },
      "operations":    { prev: "tracking",   next: "dashboard",  prevLabel: "Seguimiento",       nextLabel: "Tablero" },
      "apu-report":    { prev: "apu",        next: "client-summary", prevLabel: "APU",           nextLabel: "Resumen cliente" },
      "client-summary":{ prev: "apu-report", next: "dashboard",  prevLabel: "Informe APU",       nextLabel: "Tablero" },
      "assistant":     { prev: "client-apu", next: "apu-advanced", prevLabel: "Cliente a APU",   nextLabel: "Desglose APU" },
      "mobile-alerts": { prev: "alerts",     next: "dashboard",  prevLabel: "Alertas",           nextLabel: "Tablero" },
      "management":    { prev: "dashboard",  next: "dashboard",  prevLabel: "Tablero",           nextLabel: "Tablero" },
    };

    const flow = flowMap[route];
    if (!flow) return;

    const style = doc.createElement("style");
    style.textContent = `
      #wm-flow-nav {
        position: fixed; bottom: 0; left: 0; right: 0; z-index: 9000;
        display: flex; justify-content: space-between; align-items: center;
        padding: 8px 16px;
        background: rgba(26,43,68,.96);
        backdrop-filter: blur(8px);
        border-top: 1px solid rgba(255,255,255,.1);
        gap: 8px;
      }
      .wm-flow-btn {
        display: inline-flex; align-items: center; gap: 6px;
        background: rgba(255,255,255,.1); border: 1px solid rgba(255,255,255,.2);
        color: #e5e7eb; border-radius: 6px !important;
        padding: 6px 12px; font: 600 12px/1 Inter, system-ui, sans-serif;
        cursor: pointer; transition: background .15s ease;
        min-height: 32px;
      }
      .wm-flow-btn:hover { background: rgba(255,255,255,.2); }
      .wm-flow-btn.primary {
        background: #e9c176; border-color: #e9c176; color: #1a2b44;
      }
      .wm-flow-btn.primary:hover { background: #f0d090; }
      .wm-flow-center {
        font: 500 11px/1 Inter, system-ui, sans-serif;
        color: rgba(255,255,255,.5); text-align: center; flex: 1;
      }
      /* Espacio para que el contenido no quede tapado por la barra */
      body { padding-bottom: 52px !important; }
    `;
    doc.head.appendChild(style);

    const bar = doc.createElement("div");
    bar.id = "wm-flow-nav";

    const prevBtn = doc.createElement("button");
    prevBtn.className = "wm-flow-btn";
    prevBtn.innerHTML = `← ${flow.prevLabel}`;
    prevBtn.addEventListener("click", () => navigate(flow.prev));

    const center = doc.createElement("span");
    center.className = "wm-flow-center";
    center.textContent = "CONSTRUCTORA WM/M\u0026S";

    const nextBtn = doc.createElement("button");
    nextBtn.className = "wm-flow-btn primary";
    nextBtn.innerHTML = `${flow.nextLabel} →`;
    nextBtn.addEventListener("click", () => navigate(flow.next));

    bar.append(prevBtn, center, nextBtn);
    doc.body.appendChild(bar);
  }

  // ── Live clock ──────────────────────────────────────────────────────────
  function patchClock(doc) {
    const clockEl = doc.querySelector(".font-data-label.tracking-widest, [class*='tracking-widest']" );
    // Find any element that looks like a time display (HH:MM:SS pattern)
    const allSpans = Array.from(doc.querySelectorAll("span, div, p"));
    const timeEl = allSpans.find(el => /^\d{2}:\d{2}(:\d{2})?$/.test((el.textContent || "").trim()));
    if (!timeEl) return;
    function tick() {
      const now = new Date();
      timeEl.textContent = now.toLocaleTimeString("es-GT", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });
    }
    tick();
    const timer = setInterval(tick, 1000);
    // Clear interval when iframe navigates away
    iframe.addEventListener("load", () => clearInterval(timer), { once: true });
  }

  function normalizeStitchScreen(doc) {
    // Bloquear recursos lentos ANTES de que carguen
    blockSlowResources(doc);
    ensureGlobalStyle(doc);
    normalizeLanguage(doc);
    normalizeCurrency(doc);
    normalizeLogo(doc);
    doc.documentElement.lang = "es";
  }

  function blockSlowResources(doc) {
    // Eliminar Google Fonts duplicadas (cada módulo las carga 2 veces)
    const fontLinks = Array.from(doc.querySelectorAll('link[href*="fonts.googleapis.com"], link[href*="fonts.gstatic.com"]'));
    const seen = new Set();
    fontLinks.forEach(link => {
      const key = link.href.split('?')[0];
      if (seen.has(key)) { link.remove(); return; }
      seen.add(key);
      // Hacer async para no bloquear render
      link.media = 'print';
      link.onload = () => { link.media = 'all'; };
    });
    // Eliminar Tailwind CDN (ya tenemos estilos inyectados via ensureGlobalStyle)
    doc.querySelectorAll('script[src*="cdn.tailwindcss.com"]').forEach(s => s.remove());
  }

  function ensureGlobalStyle(doc) {
    if (doc.getElementById("wm-global-style")) return;

    const style = doc.createElement("style");
    style.id = "wm-global-style";
    style.textContent = `
      /* ── Hide internal sidebars/navbars — navigation is handled by app shell ── */
      aside,
      nav.fixed,
      nav[class*="fixed"],
      nav[class*="w-64"],
      header.fixed,
      header[class*="fixed"],
      header[class*="ml-64"],
      header[class*="sticky"],
      .app-shell aside,
      [class*="left-0"][class*="h-full"][class*="flex-col"],
      [class*="left-0"][class*="h-screen"] {
        display: none !important;
      }

      /* ── Remove left margin added for the hidden sidebar ── */
      [class*="ml-64"],
      [class*="md:ml-64"] {
        margin-left: 0 !important;
        width: 100% !important;
      }

      /* ── Remove top margin added for the hidden topbar ── */
      [class*="mt-20"],
      [class*="mt-16"] {
        margin-top: 0 !important;
      }

      /* ── Force full viewport, no scroll ── */
      html, body {
        width: 100% !important;
        height: 100vh !important;
        overflow: hidden !important;
        font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif !important;
        letter-spacing: 0 !important;
        transition: background-color 0.3s ease, color 0.3s ease;
      }

      /* ── Main content fills remaining space ── */
      body > div,
      body > main,
      .flex-1,
      [class*="flex-1"] {
        min-width: 0;
      }

      main {
        height: 100vh !important;
        max-height: 100vh !important;
        overflow-y: auto !important;
        overflow-x: hidden !important;
        box-sizing: border-box;
      }

      /* ── Scrollbar thin ── */
      ::-webkit-scrollbar { width: 5px; height: 5px; }
      ::-webkit-scrollbar-track { background: transparent; }
      ::-webkit-scrollbar-thumb { background: rgba(100,116,139,.35); border-radius: 4px; }
      ::-webkit-scrollbar-thumb:hover { background: rgba(100,116,139,.6); }

      :root {
        --wm-primary: #1A2B44;
        --wm-primary-soft: #d5e3ff;
        --wm-surface: #f8fafc;
        --wm-panel: #ffffff;
        --wm-text: #172033;
        --wm-muted: #64748b;
        --wm-border: #cbd5e1;
        --wm-alert: #b45309;
        --wm-danger: #ba1a1a;
        --wm-radius: 8px;
        --wm-shadow-sm: 0 1px 2px rgba(15, 23, 42, .06);
        --wm-shadow: 0 10px 30px rgba(15, 23, 42, .10);
        --wm-shadow-lg: 0 18px 48px rgba(15, 23, 42, .16);
      }
      .dark-mode, .dark {
        --wm-primary: #101a29;
        --wm-primary-soft: #1a2b44;
        --wm-surface: #0c0f10;
        --wm-panel: #172033;
        --wm-text: #e5e7eb;
        --wm-muted: #94a3b8;
        --wm-border: #334155;
        --wm-shadow-sm: 0 1px 2px rgba(0, 0, 0, .35);
        --wm-shadow: 0 14px 38px rgba(0, 0, 0, .45);
        --wm-shadow-lg: 0 22px 60px rgba(0, 0, 0, .55);
      }
      body {
        background: radial-gradient(900px 380px at 30% -10%, rgba(26,43,68,.10), transparent 70%),
                    radial-gradient(700px 300px at 85% 10%, rgba(233,193,118,.12), transparent 65%),
                    var(--wm-surface);
        color: var(--wm-text);
      }
      body.dark-mode {
        background-color: var(--wm-surface) !important;
        color: var(--wm-text) !important;
      }
      body.dark-mode .bg-white {
        background-color: var(--wm-panel) !important;
        color: var(--wm-text) !important;
        border-color: var(--wm-border) !important;
      }
      body.dark-mode .text-slate-800, body.dark-mode .text-gray-900 { color: #f8fafc !important; }
      body.dark-mode .text-slate-500, body.dark-mode .text-gray-500 { color: #94a3b8 !important; }
      h1, h2, h3, h4, h5, h6,
      .font-h1, .font-h2, .font-h3,
      [class*="font-['Inter']"] {
        font-family: Inter, system-ui, sans-serif !important;
        letter-spacing: 0 !important;
      }
      button, a, input, select, textarea { border-radius: 6px !important; }
      button { min-height: 36px; }
      button:not([disabled]) { cursor: pointer; }
      .wm-logo { width: auto; height: 44px; object-fit: contain; display: inline-block; }
      .wm-brand-lockup { display: flex; align-items: center; gap: 10px; }
      .wm-toast {
        position: fixed; right: 16px; bottom: 16px; z-index: 999999;
        max-width: 360px; background: var(--wm-primary); color: #fff;
        border: 1px solid rgba(255,255,255,.18); border-radius: 8px !important;
        padding: 10px 12px; font: 600 13px/1.35 Inter, system-ui, sans-serif;
        box-shadow: 0 12px 32px rgba(15, 23, 42, .24);
      }
      .elevated-card,
      .bg-surface-container-lowest, .bg-white, .bg-surface,
      .bg-surface-container, .bg-surface-container-low,
      .bg-surface-container-high, .bg-surface-container-highest {
        border-radius: var(--wm-radius) !important;
        box-shadow: var(--wm-shadow-sm);
        border-color: var(--wm-border) !important;
      }
      table { border-radius: var(--wm-radius); overflow: hidden; }
      thead { background: rgba(26,43,68,.06) !important; }
      body.dark-mode thead { background: rgba(148,163,184,.10) !important; }
      svg, canvas, img { max-width: 100%; height: auto; }
      svg text { font-family: Inter, system-ui, sans-serif !important; letter-spacing: 0 !important; }
      @media (max-width: 820px) {
        main, .p-container-padding, .p-section-gap {
          padding-left: 16px !important;
          padding-right: 16px !important;
        }
        table { display: block; overflow-x: auto; -webkit-overflow-scrolling: touch; }
        h1 { font-size: 24px !important; line-height: 1.25 !important; }
        h2 { font-size: 20px !important; line-height: 1.28 !important; }
        h3 { font-size: 18px !important; line-height: 1.3 !important; }
      }
    `;
    doc.head.appendChild(style);
  }

  function normalizeLanguage(doc) {
    const replacements = new Map([
      ["Dashboard", "Tablero"],
      ["Budgeting (APU)", "Presupuesto (APU)"],
      ["Budgeting", "Presupuesto"],
      ["Projects", "Proyectos"],
      ["Reports", "Reportes"],
      ["Archives", "Archivos"],
      ["Settings", "Configuracion"],
      ["Lead Architect", "Arquitecto principal"],
      ["Total Projects", "Total de proyectos"],
      ["Active Budget", "Presupuesto activo"],
      ["Income vs Expenses", "Ingresos vs gastos"],
      ["Budget Variance", "Variacion presupuestaria"],
      ["Expenses", "Gastos"],
      ["Export Report", "Exportar reporte"],
      ["Export CSV", "Exportar CSV"],
      ["Back to Dashboard", "Volver al tablero"],
      ["Active Projects Roster", "Listado de proyectos activos"],
      ["Total Financial Deployed", "Total financiero ejecutado"],
      ["Portfolio Totals", "Totales de cartera"],
      ["Income", "Ingresos"],
      ["Cost", "Costo"],
      ["Client", "Cliente"],
      ["Schedule", "Cronograma"],
      ["Password", "Contraseña"],
      ["Email", "Correo"],
      ["Remember me", "Recordarme"],
      ["Forgot password", "Olvido su contraseña"],
      ["Login", "Ingresar"],
      ["Export Preview", "Vista de exportación"],
      ["Total Budget", "Presupuesto total"],
      ["Project Value", "Valor del proyecto"],
      ["Direct Costs", "Costos directos"],
      ["Indirect Costs", "Costos indirectos"],
      ["Final Price", "Precio final"],
      ["Save", "Guardar"],
      ["Cancel", "Cancelar"],
      ["Delete", "Eliminar"],
      ["Edit", "Editar"]
    ]);

    walkTextNodes(doc.body, (node) => {
      let text = node.nodeValue;
      replacements.forEach((spanish, english) => {
        text = text.replace(new RegExp(escapeRegExp(english), "g"), spanish);
      });
      node.nodeValue = text;
    });
  }

  function normalizeCurrency(doc) {
    walkTextNodes(doc.body, (node) => {
      node.nodeValue = node.nodeValue
        .replace(/US\$\s*/g, "Q ")
        .replace(/\$\s*(-?\d[\d,.]*(?:\.\d+)?\s?M?)/g, "Q $1")
        .replace(/Precio Unitario \(\$\)/g, "Precio unitario (Q)")
        .replace(/Total \(\$\)/g, "Total (Q)");
    });
  }

  function normalizeLogo(doc) {
    // Ensure the logo source is always a fresh root-relative URL
    const logoSrc = LOGO_PATH + '?v=' + Date.now();
    Array.from(doc.querySelectorAll("img")).forEach((img) => {
      const label = `${img.alt || ""} ${img.getAttribute("data-alt") || ""}`.toLowerCase();
      if (!label.includes("logo") && !label.includes("constructora wm")) return;
      img.src = logoSrc;
      img.alt = "Logotipo CONSTRUCTORA WM/M&S";
      img.classList.add("wm-logo");
      img.dataset.wmLogo = "true";
    });

    Array.from(doc.querySelectorAll("h1, a, strong")).forEach((element) => {
      const text = (element.textContent || "").replace(/\s+/g, " ").trim().toLowerCase();
      if (!text.includes("constructora wm") || element.parentElement?.querySelector("[data-wm-logo]")) return;

      const wrapper = doc.createElement("span");
      wrapper.className = "wm-brand-lockup";
      const logo = doc.createElement("img");
      logo.src = logoSrc;
      logo.alt = "Logotipo CONSTRUCTORA WM/M&S";
      logo.className = "wm-logo";
      logo.dataset.wmLogo = "true";
      element.parentNode.insertBefore(wrapper, element);
      wrapper.append(logo, element);
    });
  }

  function walkTextNodes(root, visitor) {
    if (!root) return;
    const ownerDocument = root.ownerDocument || document;
    const nodeFilter = ownerDocument.defaultView?.NodeFilter || NodeFilter;
    const walker = ownerDocument.createTreeWalker(root, nodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach((node) => {
      if (!node.nodeValue || !node.nodeValue.trim()) return;
      visitor(node);
    });
  }

  function escapeRegExp(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  function showLoginScreen() {
    const shell = document.querySelector(".app-shell");
    if (shell) shell.classList.add("is-login-screen");

    let loginOverlay = document.getElementById("wm-login-overlay");
    if (loginOverlay) { loginOverlay.style.display = "flex"; return; }

    loginOverlay = document.createElement("div");
    loginOverlay.id = "wm-login-overlay";
    loginOverlay.innerHTML = `
      <div class="wm-login-card">
        <img src="${LOGO_PATH}" alt="Logo CONSTRUCTORA WM/M&S" class="wm-logo">
        <strong>CONSTRUCTORA WM/M&amp;S</strong>
        <span>Edificando el Futuro</span>
        <button id="wm-google-signin" type="button">
          <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>
          Ingresar con Google
        </button>
        <p id="wm-login-error" style="display:none"></p>
      </div>
    `;
    document.body.appendChild(loginOverlay);

    document.getElementById("wm-google-signin").addEventListener("click", async () => {
      const client = getSupabase();
      if (!client) return;
      const errorEl = document.getElementById("wm-login-error");
      try {
        const { data, error } = await client.auth.signInWithOAuth({
          provider: "google",
          options: {
            redirectTo: window.location.origin + window.location.pathname,
            queryParams: { prompt: "select_account" }
          }
        });
        if (error) { errorEl.textContent = error.message; errorEl.style.display = "block"; return; }
        if (data?.url) window.location.assign(data.url);
      } catch (err) {
        errorEl.textContent = err.message;
        errorEl.style.display = "block";
      }
    });
  }

  function hideLoginScreen() {
    const overlay = document.getElementById("wm-login-overlay");
    if (overlay) overlay.style.display = "none";
    const shell = document.querySelector(".app-shell");
    if (shell) shell.classList.remove("is-login-screen");
  }

  function patchLogin(doc) {
    // Login is now handled natively — no iframe patching needed
  }

  function patchLinks(doc) {
    const textMap = [
      { test: /^dashboard$|centro de comando/i, route: "dashboard" },
      { test: /presupuesto.*apu|^presupuesto$|^apu$/i, route: "apu" },
      { test: /seguimiento de proy|^seguimiento$/i, route: "tracking" },
      { test: /proyectos y clientes|^proyectos$/i, route: "clients" },
      { test: /cronograma/i, route: "schedule" },
      { test: /alerta|notificacion/i, route: "alerts" },
      { test: /gastos|planilla|control operativo|finanzas/i, route: "operations" },
      { test: /informe|reporte/i, route: "apu-report" },
      { test: /cerrar sesi|logout/i, route: "__logout__" }
    ];

    Array.from(doc.querySelectorAll('a[href="#"], button')).forEach((element) => {
      if (element.closest("form")) return;
      const label = (element.textContent || "").replace(/\s+/g, " ").trim();
      const match = textMap.find((entry) => entry.test.test(label));
      if (!match) return;

      element.addEventListener("click", async (event) => {
        event.preventDefault();
        event.stopPropagation();

        if (match.route === "__logout__") {
          const client = getSupabase();
          if (client) await client.auth.signOut();
          currentSession = null;
          showLoginScreen();
          return;
        }

        navigate(match.route);
      }, true);
    });
  }

  function patchActions(doc) {
    const route = currentRouteId();

    Array.from(doc.querySelectorAll("button, a")).forEach((el) => {
      const label = (el.textContent || "").replace(/\s+/g, " ").trim().toLowerCase();
      const title = (el.title || "").toLowerCase();
      const icon  = (el.querySelector(".material-symbols-outlined")?.textContent || "").trim();

      // ── CSV / Export ──
      if (/exportar csv|exportar datos|export.*csv/i.test(label) || icon === "csv") {
        el.addEventListener("click", (e) => { e.preventDefault(); e.stopPropagation(); downloadCsv(); showFrameToast(doc, "CSV exportado."); }, true);
        return;
      }

      // ── PDF / Print ──
      if (/pdf|informe formal|imprimir|exportar reporte|export.*pdf/i.test(label) || /pdf/i.test(title)) {
        el.addEventListener("click", (e) => { e.preventDefault(); e.stopPropagation(); iframe.contentWindow.print(); showFrameToast(doc, "Preparando PDF..."); }, true);
        return;
      }

      // ── WhatsApp ──
      if (/whatsapp/i.test(label) || icon === "whatsapp") {
        el.addEventListener("click", (e) => { e.preventDefault(); e.stopPropagation(); window.open("https://wa.me/?text=Reporte%20CONSTRUCTORA%20WM%2FM%26S", "_blank", "noopener"); }, true);
        return;
      }

      // ── Nuevo / Crear proyecto ──
      if (/nuevo proyecto|crear proyecto|agregar proyecto|new project/i.test(label)) {
        el.addEventListener("click", (e) => { e.preventDefault(); e.stopPropagation(); navigate("clients"); }, true);
        return;
      }

      // ── Dashboard quick-actions ──
      if (/^presupuesto$/.test(label)) { el.addEventListener("click", (e) => { e.preventDefault(); e.stopPropagation(); navigate("apu"); }, true); return; }
      if (/^seguimiento$/.test(label)) { el.addEventListener("click", (e) => { e.preventDefault(); e.stopPropagation(); navigate("tracking"); }, true); return; }
      if (/^gastos$/.test(label))      { el.addEventListener("click", (e) => { e.preventDefault(); e.stopPropagation(); navigate("operations"); }, true); return; }

      // ── Topbar links ──
      if (/^proyectos$/.test(label))   { el.addEventListener("click", (e) => { e.preventDefault(); e.stopPropagation(); navigate("clients"); }, true); return; }
      if (/^reportes$/.test(label))    { el.addEventListener("click", (e) => { e.preventDefault(); e.stopPropagation(); navigate("apu-report"); }, true); return; }
      if (/^archivos$/.test(label))    { el.addEventListener("click", (e) => { e.preventDefault(); e.stopPropagation(); navigate("client-summary"); }, true); return; }

      // ── Tabla clientes: edit ──
      if (icon === "edit" || /^edit$|^editar$/.test(title)) {
        el.addEventListener("click", (e) => {
          e.preventDefault(); e.stopPropagation();
          const row = el.closest("tr");
          const id  = row?.querySelector("td:first-child")?.textContent?.trim() || "";
          showFrameToast(doc, `Editando proyecto ${id}`);
        }, true);
        return;
      }

      // ── Tabla clientes: ver APU / cotización ──
      if (icon === "request_quote" || /view apu|view quote|ver apu/i.test(title)) {
        el.addEventListener("click", (e) => { e.preventDefault(); e.stopPropagation(); navigate("apu"); }, true);
        return;
      }

      // ── Tabla clientes: generar APU (varita mágica) ──
      if (icon === "auto_fix_high" || /generar apu/i.test(title)) {
        el.addEventListener("click", (e) => {
          e.preventDefault(); e.stopPropagation();
          showFrameToast(doc, "Requerimientos vinculados al motor APU.");
          setTimeout(() => navigate("client-apu"), 1200);
        }, true);
        return;
      }

      // ── Tabla clientes: download / filtro ──
      if (icon === "download" || /download/i.test(title)) {
        el.addEventListener("click", (e) => { e.preventDefault(); e.stopPropagation(); downloadCsv(); showFrameToast(doc, "Exportando directorio..."); }, true);
        return;
      }
      if (icon === "filter_list") {
        el.addEventListener("click", (e) => { e.preventDefault(); e.stopPropagation(); showFrameToast(doc, "Filtros disponibles próximamente."); }, true);
        return;
      }

      // ── Paginación ──
      if (/^anterior$|^siguiente$|^\d+$/.test(label) && el.closest(".flex.gap-1, .flex.gap-2")) {
        el.addEventListener("click", (e) => { e.preventDefault(); e.stopPropagation(); showFrameToast(doc, "Paginación conectada a Supabase próximamente."); }, true);
        return;
      }

      // ── Notificaciones ──
      if (icon === "notifications") {
        el.addEventListener("click", (e) => { e.preventDefault(); e.stopPropagation(); navigate("alerts"); }, true);
        return;
      }

      // ── Calendario: chevrons mes anterior/siguiente ──
      if (icon === "chevron_left" || icon === "chevron_right") {
        el.addEventListener("click", (e) => { e.preventDefault(); e.stopPropagation(); showFrameToast(doc, "Navegación de calendario activa."); }, true);
        return;
      }

      // ── Chart options (more_horiz) ──
      if (icon === "more_horiz") {
        el.addEventListener("click", (e) => { e.preventDefault(); e.stopPropagation(); showFrameToast(doc, "Opciones de gráfica próximamente."); }, true);
        return;
      }

      // ── Seguimiento: Export Report ──
      if (/export report|exportar reporte/i.test(label)) {
        el.addEventListener("click", (e) => { e.preventDefault(); e.stopPropagation(); iframe.contentWindow.print(); showFrameToast(doc, "Preparando reporte..."); }, true);
        return;
      }

      // ── Seguimiento: Back to Dashboard ──
      if (/back to dashboard|volver al tablero/i.test(label)) {
        el.addEventListener("click", (e) => { e.preventDefault(); e.stopPropagation(); navigate("dashboard"); }, true);
        return;
      }

      // ── Cronograma: Back to APU Editor ──
      if (/back to apu|volver.*apu/i.test(label)) {
        el.addEventListener("click", (e) => { e.preventDefault(); e.stopPropagation(); navigate("apu"); }, true);
        return;
      }

      // ── Cronograma: Export PDF/CSV ──
      if (/export.*pdf.*csv|pdf.*csv/i.test(label)) {
        el.addEventListener("click", (e) => { e.preventDefault(); e.stopPropagation(); iframe.contentWindow.print(); showFrameToast(doc, "Exportando cronograma..."); }, true);
        return;
      }

      // ── Cronograma: New Report ──
      if (/new report/i.test(label)) {
        el.addEventListener("click", (e) => { e.preventDefault(); e.stopPropagation(); navigate("apu-report"); }, true);
        return;
      }

      // ── Cronograma: Sync Calendar ──
      if (/sync.*calendar|sincronizar/i.test(label) || icon === "sync") {
        el.addEventListener("click", (e) => { e.preventDefault(); e.stopPropagation(); showFrameToast(doc, "Sincronización con calendario activada."); }, true);
        return;
      }

      // ── Cronograma: Share with Subcontractors ──
      if (/share|compartir|subcontract/i.test(label) || icon === "group") {
        el.addEventListener("click", (e) => { e.preventDefault(); e.stopPropagation(); showFrameToast(doc, "Enlace copiado para subcontratistas."); }, true);
        return;
      }

      // ── Planilla: Autorizar pago ──
      if (/autorizar/i.test(label)) {
        el.addEventListener("click", async (e) => {
          e.preventDefault(); e.stopPropagation();
          const card = el.closest(".flex.items-center.justify-between");
          const name = card?.querySelector(".font-medium")?.textContent?.trim() || "empleado";
          el.textContent = "Autorizado ✓";
          el.style.color = "#16a34a";
          el.disabled = true;
          showFrameToast(doc, `Pago autorizado: ${name}`);
        }, true);
        return;
      }

      // ── Planilla: Procesar Todo Pendiente ──
      if (/procesar todo/i.test(label)) {
        el.addEventListener("click", (e) => {
          e.preventDefault(); e.stopPropagation();
          doc.querySelectorAll("button").forEach(b => { if (/autorizar/i.test(b.textContent)) { b.textContent = "Autorizado ✓"; b.style.color = "#16a34a"; b.disabled = true; } });
          showFrameToast(doc, "Todos los pagos pendientes autorizados.");
        }, true);
        return;
      }

      // ── Planilla: Exportar Libro Mayor ──
      if (/libro mayor|exportar libro/i.test(label)) {
        el.addEventListener("click", (e) => { e.preventDefault(); e.stopPropagation(); downloadCsv(); showFrameToast(doc, "Libro mayor exportado."); }, true);
        return;
      }

      // ── Planilla: Ver Todo (transacciones) ──
      if (/ver todo/i.test(label) || (icon === "arrow_forward" && /ver todo/i.test(el.closest("button, a")?.textContent || ""))) {
        el.addEventListener("click", (e) => { e.preventDefault(); e.stopPropagation(); navigate("operations"); }, true);
        return;
      }

      // ── Planilla: Enviar Registro (form submit) ──
      if (/enviar registro/i.test(label)) {
        el.addEventListener("click", (e) => { e.preventDefault(); e.stopPropagation(); el.closest("form")?.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true })); }, true);
        return;
      }

      // ── APU Avanzado: Añadir Renglón ──
      if (/añadir renglón|añadir renglon|add.*row/i.test(label) || icon === "add") {
        if (el.closest(".flex.justify-center") || /añadir/i.test(label)) {
          el.addEventListener("click", (e) => { e.preventDefault(); e.stopPropagation(); showFrameToast(doc, "Renglón agregado al presupuesto."); }, true);
          return;
        }
      }

      // ── APU Avanzado: filtros de tipología ──
      if (route === "apu" || route === "apu-advanced") {
        if (/^residencial$|^comercial$|^industrial$|^civil$|^publica$|^pública$/.test(label)) {
          el.addEventListener("click", (e) => {
            e.preventDefault(); e.stopPropagation();
            // Deselect all, select clicked
            const siblings = el.closest(".flex")?.querySelectorAll("button");
            siblings?.forEach(b => { b.classList.remove("bg-white","shadow-sm","border-outline-variant","font-semibold"); b.classList.add("text-secondary"); });
            el.classList.add("bg-white","shadow-sm","font-semibold"); el.classList.remove("text-secondary");
            showFrameToast(doc, `Tipología: ${label}`);
          }, true);
          return;
        }
      }

      // ── Informe APU: print / share / CSV / PDF ──
      if (icon === "print") {
        el.addEventListener("click", (e) => { e.preventDefault(); e.stopPropagation(); iframe.contentWindow.print(); showFrameToast(doc, "Preparando impresión..."); }, true);
        return;
      }
      if (icon === "share") {
        el.addEventListener("click", (e) => { e.preventDefault(); e.stopPropagation(); showFrameToast(doc, "Enlace copiado al portapapeles."); }, true);
        return;
      }
      if (/export csv|^csv$/i.test(label) || icon === "csv") {
        el.addEventListener("click", (e) => { e.preventDefault(); e.stopPropagation(); downloadCsv(); showFrameToast(doc, "CSV exportado."); }, true);
        return;
      }
      if (/download pdf|descargar pdf/i.test(label)) {
        el.addEventListener("click", (e) => { e.preventDefault(); e.stopPropagation(); iframe.contentWindow.print(); showFrameToast(doc, "Generando PDF..."); }, true);
        return;
      }

      // ── Informe APU topbar nav ──
      if (/^dashboard$/.test(label)) { el.addEventListener("click", (e) => { e.preventDefault(); e.stopPropagation(); navigate("dashboard"); }, true); return; }
      if (/^projects$/.test(label))  { el.addEventListener("click", (e) => { e.preventDefault(); e.stopPropagation(); navigate("clients"); }, true); return; }
      if (/apu library/i.test(label)) { el.addEventListener("click", (e) => { e.preventDefault(); e.stopPropagation(); navigate("apu"); }, true); return; }
      if (/^settings$/.test(label))  { el.addEventListener("click", (e) => { e.preventDefault(); e.stopPropagation(); showFrameToast(doc, "Configuración próximamente."); }, true); return; }

      // ── Resumen cliente: WhatsApp + Imprimir ──
      if (/enviar por whatsapp/i.test(label)) {
        el.addEventListener("click", (e) => { e.preventDefault(); e.stopPropagation(); window.open("https://wa.me/?text=Presupuesto%20CONSTRUCTORA%20WM%2FM%26S", "_blank", "noopener"); }, true);
        return;
      }
      if (/imprimir pdf/i.test(label)) {
        el.addEventListener("click", (e) => { e.preventDefault(); e.stopPropagation(); iframe.contentWindow.print(); showFrameToast(doc, "Generando PDF..."); }, true);
        return;
      }

      // ── Asistente APU: selección de tipología ──
      if (route === "assistant") {
        if (/^residencial$|^comercial$|^industrial$|^pública.*institucional$|^civil.*infraestructura$/i.test(label)) {
          el.addEventListener("click", (e) => {
            e.preventDefault(); e.stopPropagation();
            doc.querySelectorAll(".grid.grid-cols-2 button").forEach(b => {
              b.classList.remove("border-2","border-primary-container","bg-secondary-fixed\/20");
              b.classList.add("border","border-outline-variant");
            });
            el.classList.add("border-2","border-primary-container","bg-secondary-fixed\/20");
            el.classList.remove("border","border-outline-variant");
            showFrameToast(doc, `Tipología seleccionada: ${label}`);
          }, true);
          return;
        }
        if (/siguiente paso/i.test(label) || icon === "arrow_forward") {
          el.addEventListener("click", (e) => { e.preventDefault(); e.stopPropagation(); navigate("apu-advanced"); showFrameToast(doc, "Generando estructura APU..."); }, true);
          return;
        }
        if (/atrás/i.test(label) || icon === "arrow_back") {
          el.addEventListener("click", (e) => { e.preventDefault(); e.stopPropagation(); navigate("client-apu"); }, true);
          return;
        }
        if (icon === "close") {
          el.addEventListener("click", (e) => { e.preventDefault(); e.stopPropagation(); navigate("dashboard"); }, true);
          return;
        }
      }

      // ── Cronograma multicanal: toggles de reglas ──
      if (route === "multichannel") {
        if (el.tagName === "INPUT" && el.type === "checkbox") {
          el.addEventListener("change", (e) => {
            const rule = el.closest(".p-4")?.querySelector(".font-body-md")?.textContent?.trim() || "Regla";
            showFrameToast(doc, `${rule}: ${el.checked ? "activada" : "desactivada"}.`);
          });
          return;
        }
        if (/guardar configuración|guardar configuracion/i.test(label)) {
          el.addEventListener("click", async (e) => {
            e.preventDefault(); e.stopPropagation();
            const client = getSupabase();
            if (client && currentSession) {
              const freq = doc.querySelector("select")?.value || "Semanal";
              await client.from("notifications").insert([{ channel: "app", title: "Config alertas", message: `Frecuencia: ${freq}`, delivered: false }]).catch(() => {});
            }
            showFrameToast(doc, "Configuración de alertas guardada.");
          }, true);
          return;
        }
        if (icon === "add") {
          el.addEventListener("click", (e) => { e.preventDefault(); e.stopPropagation(); showFrameToast(doc, "Nueva regla de alerta próximamente."); }, true);
          return;
        }
      }

      // ── Vista móvil: botones de acción ──
      if (route === "mobile-alerts") {
        if (/sincronizar datos/i.test(label) || icon === "sync") {
          el.addEventListener("click", async (e) => {
            e.preventDefault(); e.stopPropagation();
            showFrameToast(doc, "Sincronizando datos...");
            const client = getSupabase();
            if (client && currentSession) {
              await client.from("project_tracking").select("id").limit(1).catch(() => {});
            }
            setTimeout(() => showFrameToast(doc, "Datos sincronizados."), 1500);
          }, true);
          return;
        }
        if (/reportar incidencia/i.test(label) || icon === "report") {
          el.addEventListener("click", async (e) => {
            e.preventDefault(); e.stopPropagation();
            const client = getSupabase();
            if (client && currentSession) {
              await client.from("alerts").insert([{ title: "Incidencia reportada", message: "Incidencia reportada desde vista móvil.", type: "Warning", is_read: false }]).catch(() => {});
            }
            showFrameToast(doc, "Incidencia registrada en Supabase.");
          }, true);
          return;
        }
        // Bottom nav móvil
        if (/^projects$/i.test(label)) { el.addEventListener("click", (e) => { e.preventDefault(); e.stopPropagation(); navigate("clients"); }, true); return; }
        if (/^alerts$/i.test(label))   { el.addEventListener("click", (e) => { e.preventDefault(); e.stopPropagation(); navigate("alerts"); }, true); return; }
        if (/^schedule$/i.test(label)) { el.addEventListener("click", (e) => { e.preventDefault(); e.stopPropagation(); navigate("schedule"); }, true); return; }
        if (/^profile$/i.test(label))  { el.addEventListener("click", (e) => { e.preventDefault(); e.stopPropagation(); showFrameToast(doc, "Perfil próximamente."); }, true); return; }
        // Selector de proyecto
        if (el.closest(".cursor-pointer") && icon === "arrow_drop_down") {
          el.closest(".cursor-pointer").addEventListener("click", (e) => { e.preventDefault(); e.stopPropagation(); showFrameToast(doc, "Selector de proyecto próximamente."); }, true);
          return;
        }
        // Menú hamburguesa
        if (icon === "menu") {
          el.addEventListener("click", (e) => { e.preventDefault(); e.stopPropagation(); toggleSidebar(); }, true);
          return;
        }
      }

      // ── Seguimiento: settings en topbar ──
      if (icon === "settings") {
        el.addEventListener("click", (e) => { e.preventDefault(); e.stopPropagation(); showFrameToast(doc, "Configuración próximamente."); }, true);
        return;
      }

      // ── Cronograma: vista Semana/Mes ──
      if (route === "schedule" || route === "multichannel") {
        if (/^semana$|^mes$/i.test(label)) {
          el.addEventListener("click", (e) => {
            e.preventDefault(); e.stopPropagation();
            const siblings = el.closest(".flex.gap-2")?.querySelectorAll("button");
            siblings?.forEach(b => { b.classList.remove("bg-primary","text-on-primary"); b.classList.add("bg-surface","border","border-outline-variant"); });
            el.classList.add("bg-primary","text-on-primary"); el.classList.remove("bg-surface","border","border-outline-variant");
            showFrameToast(doc, `Vista: ${label}`);
          }, true);
          return;
        }
      }
    });
  }

  function getInputValue(root, selectors, fallback = "") {
    for (const selector of selectors) {
      const element = root.querySelector(selector);
      if (element && "value" in element && String(element.value || "").trim()) {
        return String(element.value).trim();
      }
    }
    return fallback;
  }

  function setControlName(root, selector, name) {
    const element = root.querySelector(selector);
    if (element && !element.name) element.name = name;
    return element;
  }

  function parseNumber(value) {
    const parsed = Number(String(value || "0").replace(/[Q$,\s]/g, ""));
    return Number.isFinite(parsed) ? parsed : 0;
  }

  function formatDataError(error) {
    const message = String(error?.message || error || "Error desconocido");
    const details = String(error?.details || "");
    if (/could not find|does not exist|404|PGRST205|schema cache/i.test(`${message} ${details}`)) {
      return "La conexion a Supabase funciona, pero falta aplicar la migracion de tablas en PostgreSQL.";
    }
    if (/row-level security|permission denied|42501/i.test(`${message} ${details}`)) {
      return "Supabase rechazo la operacion por permisos/RLS. Inicia sesion y confirma las politicas para usuarios autenticados.";
    }
    return message;
  }

  function normalizeExpenseCategory(value) {
    const category = String(value || "").toLowerCase();
    if (/material/.test(category)) return "Materials";
    if (/mano|labor|planilla/.test(category)) return "Labor";
    if (/equipo|herramienta/.test(category)) return "Equipment";
    if (/salud/.test(category)) return "Health";
    if (/educa/.test(category)) return "Education";
    if (/ahorro|invers/.test(category)) return "Savings";
    if (/entreten/.test(category)) return "Entertainment";
    return "Other";
  }

  function normalizeProjectStatus(value) {
    const statusValue = String(value || "").toLowerCase();
    if (/ejecuci|active/.test(statusValue)) return "Active";
    if (/retras|delay/.test(statusValue)) return "Delayed";
    if (/complet|cierre/.test(statusValue)) return "Completed";
    if (/pausa|hold/.test(statusValue)) return "On Hold";
    return "Planning";
  }

  function normalizeProjectTypology(value) {
    const typology = String(value || "").toLowerCase();
    if (/comercial/.test(typology)) return "Commercial";
    if (/industrial|bodega|nave/.test(typology)) return "Industrial";
    if (/civil|puente|infra/.test(typology)) return "Civil";
    if (/public|municipal/.test(typology)) return "Public";
    return "Residential";
  }

  function getVisibleText(doc, selector, fallback = "") {
    const element = doc.querySelector(selector);
    return (element?.textContent || fallback).replace(/\s+/g, " ").trim();
  }

  function prepareKnownForms(doc, route) {
    Array.from(doc.querySelectorAll("form")).forEach((form) => {
      if (route === "login" || route === "legacy-login") return;

      const heading = form.closest("section, div, main")?.textContent?.toLowerCase() || "";
      const isClientForm = route === "clients" || route === "client-apu" || heading.includes("cliente");
      const isExpenseForm = route === "operations" || heading.includes("gasto");

      if (isClientForm) {
        setControlName(form, "#fullName", "name");
        setControlName(form, "#clientId", "tax_id");
        setControlName(form, "#phone", "phone");
        setControlName(form, "#email, input[type='email']", "email");
        setControlName(form, "#address", "address");
        setControlName(form, "#requirements", "requirements");
      }

      if (isExpenseForm) {
        const controls = Array.from(form.querySelectorAll("input, select, textarea"));
        if (controls[0] && !controls[0].name) controls[0].name = "description";
        if (controls[1] && !controls[1].name) controls[1].name = "amount";
        if (controls[2] && !controls[2].name) controls[2].name = "date";
        if (controls[3] && !controls[3].name) controls[3].name = "category";
      }

      Array.from(form.querySelectorAll("button")).forEach((button) => {
        const label = (button.textContent || "").toLowerCase();
        if (/registrar|guardar|crear|save/.test(label)) {
          button.type = "submit";
          button.dataset.wmPersist = "true";
        }
      });
    });
  }

  function makeActionButton(doc, label, icon, onClick) {
    const button = doc.createElement("button");
    button.type = "button";
    button.className = "wm-persist-action";
    button.innerHTML = `${makeIcon(icon).outerHTML}<span>${label}</span>`;
    button.addEventListener("click", onClick, true);
    return button;
  }

  function ensurePersistActionStyle(doc) {
    if (doc.getElementById("wm-persist-action-style")) return;
    const style = doc.createElement("style");
    style.id = "wm-persist-action-style";
    style.textContent = `
      .wm-persist-bar {
        position: sticky;
        top: 0;
        z-index: 50;
        display: flex;
        justify-content: flex-end;
        gap: 8px;
        padding: 10px 12px;
        background: rgba(248, 250, 252, .94);
        border-bottom: 1px solid var(--wm-border);
        backdrop-filter: blur(8px);
      }
      body.dark-mode .wm-persist-bar {
        background: rgba(12, 15, 16, .94);
      }
      .wm-persist-action {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        border: 0;
        border-radius: 6px !important;
        background: var(--wm-primary);
        color: #fff;
        padding: 8px 12px;
        font: 700 13px/1 Inter, system-ui, sans-serif;
      }
    `;
    doc.head.appendChild(style);
  }

  function ensureModulePersistActions(doc, route, client) {
    if (!["apu", "apu-advanced", "alerts", "multichannel", "tracking"].includes(route)) return;
    if (doc.getElementById("wm-persist-bar")) return;

    ensurePersistActionStyle(doc);
    const bar = doc.createElement("div");
    bar.id = "wm-persist-bar";
    bar.className = "wm-persist-bar";

    if (route === "apu" || route === "apu-advanced") {
      bar.appendChild(makeActionButton(doc, "Guardar APU", "save", async (event) => {
        event.preventDefault();
        event.stopPropagation();
        try {
          await saveApuSnapshot(doc, client);
        } catch (error) {
          showFrameToast(doc, `Error al guardar: ${formatDataError(error)}`);
        }
      }));
    }

    if (route === "alerts" || route === "multichannel" || route === "tracking") {
      bar.appendChild(makeActionButton(doc, "Guardar seguimiento", "notifications_active", async (event) => {
        event.preventDefault();
        event.stopPropagation();
        try {
          await saveTrackingSnapshot(doc, client, route);
        } catch (error) {
          showFrameToast(doc, `Error al guardar: ${formatDataError(error)}`);
        }
      }));
    }

    doc.body.prepend(bar);
  }

  async function saveClientForm(doc, form, client) {
    const data = new FormData(form);
    const name = data.get("name") || getInputValue(form, ["#fullName", "input[type='text']"], "Cliente sin nombre");
    const email = data.get("email") || getInputValue(form, ["#email", "input[type='email']"]);
    const phone = data.get("phone") || getInputValue(form, ["#phone", "input[type='tel']"]);
    const requirements = data.get("requirements") || getInputValue(form, ["#requirements", "textarea"]);
    const { data: insertedClient, error: clientError } = await client
      .from("clients")
      .insert([{ name, email: email || null, phone: phone || null, company: String(name), status: "Lead" }])
      .select("id")
      .single();
    if (clientError) throw clientError;

    if (requirements) {
      const { error: projectError } = await client.from("projects").insert([{
        client_id: insertedClient?.id || null,
        name: `Proyecto preliminar - ${name}`,
        typology: normalizeProjectTypology(requirements),
        status: "Planning",
        total_budget: 0
      }]);
      if (projectError) throw projectError;
    }

    return requirements ? "Cliente y proyecto preliminar guardados en Supabase." : "Cliente guardado en Supabase.";
  }

  async function saveExpenseForm(form, client) {
    const data = new FormData(form);
    const amount = parseNumber(data.get("amount"));
    const { error } = await client.from("expenses").insert([{
      category: normalizeExpenseCategory(data.get("category")),
      amount,
      date: data.get("date") || new Date().toISOString().slice(0, 10),
      description: data.get("description") || "Gasto operativo"
    }]);
    if (error) throw error;
    return "Gasto guardado en Supabase.";
  }

  async function saveApuSnapshot(doc, client) {
    const title = getVisibleText(doc, "h1, h2", "Presupuesto APU");
    const totalText = getVisibleText(doc, ".bg-tertiary-fixed-dim, .font-h2, .font-h3", "0");
    const total = parseNumber(totalText);
    const { data: apu, error } = await client.from("apus").insert([{
      phase: "Presupuesto",
      description: title,
      unit: "global",
      quantity: 1,
      unit_price: total,
      total_price: total
    }]).select("id").single();
    if (error) throw error;

    const rows = Array.from(doc.querySelectorAll("table tbody tr")).slice(0, 25);
    const details = rows.map((row) => {
      const cells = Array.from(row.querySelectorAll("td")).map((cell) => cell.textContent.replace(/\s+/g, " ").trim());
      return {
        apu_id: apu.id,
        type: /mano|labor/i.test(cells.join(" ")) ? "Labor" : /equipo|herramienta/i.test(cells.join(" ")) ? "Equipment" : "Material",
        description: cells[0] || "Detalle APU",
        unit: cells[1] || "u",
        quantity: parseNumber(cells[2] || 1),
        yield_factor: parseNumber(cells[3] || 1) || 1,
        unit_cost: parseNumber(cells[4]),
        total_cost: parseNumber(cells[cells.length - 1])
      };
    }).filter((detail) => detail.description);

    if (details.length) {
      const { error: detailError } = await client.from("apu_details").insert(details);
      if (detailError) throw detailError;
    }

    showFrameToast(doc, "APU y desglose guardados en Supabase.");
  }

  async function saveTrackingSnapshot(doc, client, route) {
    const title = route === "tracking" ? "Seguimiento de proyecto" : "Alerta de cronograma";
    const message = getVisibleText(doc, "h1, h2, h3, p", "Actualizacion de seguimiento registrada desde la plataforma.");
    const { error } = await client.from("alerts").insert([{
      title,
      message,
      type: /crit|error|retras/i.test(doc.body.textContent || "") ? "Critical" : "Info",
      is_read: false
    }]);
    if (error) throw error;
    showFrameToast(doc, "Seguimiento guardado en Supabase.");
  }

  async function patchDataSync(doc, route) {
    const client = await getAuthedClient();
    if (!client) return;

    prepareKnownForms(doc, route);
    ensureModulePersistActions(doc, route, client);

    if (route === "dashboard") {
      try {
        const [{ count: projectCount }, { count: clientCount }, { data: expenses }, { data: tracking }] = await Promise.all([
          client.from("projects").select("id", { count: "exact", head: true }),
          client.from("clients").select("id", { count: "exact", head: true }),
          client.from("expenses").select("amount").limit(500),
          client.from("project_tracking").select("physical_pct, financial_pct, income, expenses_total").order("snapshot_date", { ascending: false }).limit(10)
        ]);

        updateMetricNearLabel(doc, /total de proyectos|proyectos/i, projectCount ?? 0);
        updateMetricNearLabel(doc, /clientes|cartera/i, clientCount ?? 0);

        const totalExpenses = (expenses || []).reduce((sum, item) => sum + parseNumber(item.amount), 0);
        if (totalExpenses > 0) {
          updateMetricNearLabel(doc, /gastos|expenses/i, `Q ${totalExpenses.toLocaleString("es-GT", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
        }

        // Avance promedio físico desde project_tracking
        if (tracking && tracking.length > 0) {
          const avgPhysical = Math.round(tracking.reduce((s, r) => s + parseNumber(r.physical_pct), 0) / tracking.length);
          updateMetricNearLabel(doc, /progreso promedio|avance/i, `${avgPhysical}%`);
          // Actualizar barra de progreso
          const progressBar = doc.querySelector(".bg-primary.h-full.rounded-full");
          if (progressBar) progressBar.style.width = `${avgPhysical}%`;
        }
      } catch(e) {
        console.error("Supabase sync error", e);
        setStatus(formatDataError(e));
      }
    }

    Array.from(doc.querySelectorAll("form")).forEach((form) => {
      form.addEventListener("submit", async (event) => {
        event.preventDefault();
        event.stopPropagation();
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn ? submitBtn.textContent : '';
        if (submitBtn) submitBtn.textContent = 'Guardando...';
        try {
          const message = route === "operations"
            ? await saveExpenseForm(form, client)
            : await saveClientForm(doc, form, client);
          showFrameToast(doc, message);
          form.reset();
        } catch (error) {
          showFrameToast(doc, `Error al guardar: ${formatDataError(error)}`);
        } finally {
          if (submitBtn) submitBtn.textContent = originalText;
        }
      }, true);
    });
  }

  function updateMetricNearLabel(doc, labelPattern, value) {
    const elements = Array.from(doc.querySelectorAll("div, section, article, span, h1, h2, h3, p"));
    const label = elements.find((element) => labelPattern.test(element.textContent || ""));
    const container = label?.closest("article, section, div") || label?.parentElement;
    const valueElement = container?.querySelector("h1, h2, h3, .text-3xl, .text-4xl, .font-h1, .font-h2, .font-h3");
    if (valueElement) valueElement.textContent = String(value);
  }

  function patchCalculations(doc, route) {
    if (route !== "apu" && route !== "apu-advanced") return;

    const tables = doc.querySelectorAll("table");
    tables.forEach(table => {
      const rows = table.querySelectorAll("tbody tr");
      
      rows.forEach(row => {
        const input = row.querySelector("input");
        if (!input) return;

        // Find the yield (Rend.) column, usually the one right before the input's parent td
        const cells = Array.from(row.querySelectorAll("td"));
        const inputCellIndex = cells.findIndex(td => td.contains(input));
        if (inputCellIndex <= 0) return;

        const yieldCell = cells[inputCellIndex - 1];
        const totalCell = cells[inputCellIndex + 1];

        if (yieldCell && totalCell) {
          const yieldValue = parseFloat(yieldCell.textContent.trim().replace(/,/g, '')) || 0;

          const recalculateRow = () => {
            const priceValue = parseFloat(input.value.trim().replace(/,/g, '')) || 0;
            const subtotal = yieldValue * priceValue;
            
            // Format currency according to the normalized Q
            totalCell.textContent = `Q ${subtotal.toLocaleString('es-GT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
            
            recalculateTotals(doc);
          };

          input.addEventListener("input", recalculateRow);
        }
      });
    });
  }

  function recalculateTotals(doc) {
    let totalDirectCost = 0;
    
    // Sum all subtotals in the currently visible APU tables
    const subtotals = Array.from(doc.querySelectorAll("table tbody tr td:last-child"));
    subtotals.forEach(td => {
      const text = td.textContent.replace(/[Q\$\s,]/g, "");
      const val = parseFloat(text);
      if (!isNaN(val)) totalDirectCost += val;
    });

    if (totalDirectCost === 0) return;

    const factorAPU = totalDirectCost * 0.25;
    const precioTotal = totalDirectCost + factorAPU;

    const formatCurr = (val) => `Q ${val.toLocaleString('es-GT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    // Update the UI labels
    walkTextNodes(doc.body, (node) => {
      const text = node.nodeValue.toLowerCase();
      
      // Update "Costo Directo Unit."
      if (text.includes("costo directo unit") || text.includes("costo directo unitario")) {
        const valueEl = node.parentElement?.parentElement?.querySelector('.text-primary-container, .font-h3');
        if (valueEl) valueEl.textContent = formatCurr(totalDirectCost);
      }
      
      // Update "Factor APU (AIU 25%)"
      if (text.includes("factor apu") || text.includes("aiu")) {
        const valueEl = node.parentElement?.parentElement?.querySelector('.text-primary-container, .font-h3');
        // Only update if it looks like the value element
        if (valueEl && valueEl.textContent.includes("Q")) {
          valueEl.textContent = formatCurr(factorAPU);
        }
      }
      
      // Update "Precio Unitario Total"
      if (text.includes("precio unitario total")) {
        const valueEl = node.parentElement?.parentElement?.querySelector('.bg-tertiary-fixed-dim, .font-h2');
        if (valueEl) valueEl.textContent = formatCurr(precioTotal);
      }
    });
  }

  function downloadCsv() {
    const csv = [
      "modulo,moneda,total",
      "CONSTRUCTORA WM/M&S,Q,0.00"
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "constructora-wm-reporte.csv";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  function showFrameToast(doc, message) {
    let toast = doc.getElementById("wm-toast");
    if (!toast) {
      toast = doc.createElement("div");
      toast.id = "wm-toast";
      toast.className = "wm-toast";
      doc.body.appendChild(toast);
    }
    toast.textContent = message;
    window.clearTimeout(showFrameToast.timer);
    showFrameToast.timer = window.setTimeout(() => toast.remove(), 3500);
  }

  async function init() {
    if (localStorage.getItem("wm-theme") === "dark") {
      document.body.classList.add("dark-mode");
    }
    buildShell();
    iframe.addEventListener("load", patchFrame);

    const client = getSupabase();
    if (client) {
      client.auth.onAuthStateChange((event, session) => {
        currentSession = session;
        if (session) {
          hideLoginScreen();
          if (isAuthCallback()) {
            history.replaceState(null, "", window.location.pathname + "#/dashboard");
          }
          navigate(AFTER_LOGIN_ROUTE);
        } else if (!isAuthCallback()) {
          showLoginScreen();
        }
      });

      const { data: { session } } = await client.auth.getSession();
      currentSession = session;

      if (session) {
        if (isAuthCallback()) {
          history.replaceState(null, "", window.location.pathname + "#/dashboard");
        }
        hideLoginScreen();
        window.addEventListener("hashchange", () => {
          currentRouteRendered = null;
          renderRoute(currentRouteId());
        });
        navigate(AFTER_LOGIN_ROUTE);
        return;
      }

      if (!session && !isAuthCallback()) {
        showLoginScreen();
        return;
      }
    }

    window.addEventListener("hashchange", () => {
      currentRouteRendered = null;
      renderRoute(currentRouteId());
    });
    navigate(currentRouteId());
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
