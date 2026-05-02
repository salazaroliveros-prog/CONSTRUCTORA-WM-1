// CSS is loaded via <link> tags in index.html — no imports needed here
// Fixed logo path to use direct public path to avoid Vite asset hashing issues
// Use root-relative paths for all assets to ensure consistency across environments
const STITCH_ROOT = "/src/components/stitch";
const LOGO_PATH = "/src/components/stitch/modern_minimalist_logo_for_an_architecture_and_construction_company_named/logo-wm.png";
const DEFAULT_ROUTE = "dashboard";
const AFTER_LOGIN_ROUTE = "dashboard";

(function () {
  "use strict";

  // Rutas visibles en el sidebar — solo pantallas principales
  const routes = [
    { id: "dashboard",      label: "Tablero",             icon: "dashboard",          path: `${STITCH_ROOT}/tablero_de_control_principal_3/code.html`,                          group: "Inicio" },
    { id: "clients",        label: "Proyectos y clientes", icon: "groups",             path: `${STITCH_ROOT}/gesti_n_de_clientes_y_proyectos/code.html`,                         group: "Comercial" },
    { id: "apu",            label: "Presupuestos APU",     icon: "calculate",          path: `${STITCH_ROOT}/calculadora_de_costos_y_apu_avanzada/code.html`,                    group: "Presupuestos" },
    { id: "apu-advanced",   label: "Desglose APU",         icon: "construction",       path: `${STITCH_ROOT}/calculadora_de_apu_avanzada_con_filtros_y_concertina_6/code.html`,  group: "Presupuestos" },
    { id: "tracking",       label: "Seguimiento",          icon: "query_stats",        path: `${STITCH_ROOT}/seguimiento_f_sico_financiero_de_proyectos_2/code.html`,            group: "Seguimiento" },
    { id: "alerts",         label: "Alertas",              icon: "notifications_active", path: `${STITCH_ROOT}/seguimiento_de_proyectos_con_alertas_2/code.html`,               group: "Seguimiento" },
    { id: "schedule",       label: "Cronograma",           icon: "calendar_month",     path: `${STITCH_ROOT}/cronograma_de_proyecto_automatizado/code.html`,                     group: "Seguimiento" },
    { id: "operations",     label: "Finanzas y gastos",    icon: "receipt_long",       path: `${STITCH_ROOT}/control_operativo_planilla_y_gastos_6/code.html`,                   group: "Finanzas" },
    { id: "apu-report",     label: "Informe APU",          icon: "picture_as_pdf",     path: `${STITCH_ROOT}/vista_de_exportaci_n_de_informe_apu_3/code.html`,                   group: "Reportes" },
    { id: "client-summary", label: "Resumen cliente",      icon: "summarize",          path: `${STITCH_ROOT}/resumen_de_presupuesto_para_cliente_3/code.html`,                   group: "Reportes" },
  ];

  // Rutas internas — accesibles via botones de acción, no aparecen en el sidebar
  const internalRoutes = [
    { id: "client-apu",    label: "Cliente a APU",       icon: "auto_awesome",  path: `${STITCH_ROOT}/gesti_n_de_clientes_y_conversi_n_a_apu/code.html` },
    { id: "assistant",     label: "Asistente APU",       icon: "psychology",    path: `${STITCH_ROOT}/asistente_de_conversi_n_a_apu/code.html` },
    { id: "mobile-alerts", label: "Vista móvil alertas",  icon: "phone_iphone",  path: `${STITCH_ROOT}/alertas_y_cronograma_m_vil/code.html` },
    { id: "multichannel",  label: "Cronograma y alertas", icon: "campaign",      path: `${STITCH_ROOT}/cronograma_y_alertas_multicanal/code.html` },
    { id: "management",    label: "Sistema general",     icon: "domain",        path: `${STITCH_ROOT}/constructora_wm_m_s_management_system/code.html` },
  ];

  const allRoutes = [...routes, ...internalRoutes];

  const routeById = new Map(allRoutes.map((route) => [route.id, route]));
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
    if (!shell.classList.contains("is-collapsed")) {
      shell.classList.add("is-collapsed");
    }

    const loader = document.getElementById("wm-loader-overlay");

    // Si el módulo está en cache, cargarlo instantáneamente
    if (moduleCache.has(route.id)) {
      if (loader) loader.classList.remove("active");
      iframe.classList.remove("loading");
      const cached = moduleCache.get(route.id);
      iframe.srcdoc = cached;
      title.textContent = route.label;
    } else {
      if (loader) loader.classList.add("active");
      iframe.classList.add("loading");
      iframe.src = route.path;
      title.textContent = route.label;

      iframe.onload = () => {
        const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
        if (!iframeDoc) return;
        // Suprimir Tailwind CDN warning
        const twScript = iframeDoc.querySelector('script[src*="cdn.tailwindcss.com"]');
        if (twScript) twScript.removeAttribute("src");
        // Guardar en cache el HTML procesado
        try { moduleCache.set(route.id, iframeDoc.documentElement.outerHTML); } catch(e) {}
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

    // Precargar los 2 módulos más probables en background
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
    brand.innerHTML = [
      `<img src="${LOGO_PATH}" alt="Logotipo CONSTRUCTORA WM/M&S">`,
      "<strong>CONSTRUCTORA WM/M&amp;S</strong>",
      "<span>Edificando el Futuro</span>"
    ].join("");

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

    // Suppress Tailwind CDN production warning before any script runs
    try {
      const suppressScript = doc.createElement("script");
      suppressScript.textContent = `
        (function(){
          var _warn = console.warn.bind(console);
          console.warn = function() {
            var msg = Array.prototype.join.call(arguments, ' ');
            if (msg.indexOf('cdn.tailwindcss.com') !== -1) return;
            _warn.apply(console, arguments);
          };
        })();
      `;
      doc.head.insertBefore(suppressScript, doc.head.firstChild);
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

  // ── Barra de flujo contextual ────────────────────────────────
  function injectFlowNav(doc, route) {
    if (route === "dashboard" || doc.getElementById("wm-flow-nav")) return;
    const flowMap = {
      "clients":       { prev:"dashboard", next:"apu",          prevLabel:"Tablero",        nextLabel:"Presupuestos APU" },
      "client-apu":    { prev:"clients",   next:"apu",          prevLabel:"Clientes",        nextLabel:"Presupuestos APU" },
      "apu":           { prev:"clients",   next:"apu-advanced", prevLabel:"Clientes",        nextLabel:"Desglose APU" },
      "apu-advanced":  { prev:"apu",       next:"tracking",     prevLabel:"Presupuesto APU", nextLabel:"Seguimiento" },
      "tracking":      { prev:"apu",       next:"operations",   prevLabel:"Presupuesto APU", nextLabel:"Finanzas y gastos" },
      "alerts":        { prev:"tracking",  next:"operations",   prevLabel:"Seguimiento",     nextLabel:"Finanzas y gastos" },
      "schedule":      { prev:"tracking",  next:"operations",   prevLabel:"Seguimiento",     nextLabel:"Finanzas y gastos" },
      "multichannel":  { prev:"schedule",  next:"operations",   prevLabel:"Cronograma",      nextLabel:"Finanzas y gastos" },
      "operations":    { prev:"tracking",  next:"dashboard",    prevLabel:"Seguimiento",     nextLabel:"Tablero" },
      "apu-report":    { prev:"apu",       next:"client-summary", prevLabel:"APU",           nextLabel:"Resumen cliente" },
      "client-summary":{ prev:"apu-report",next:"dashboard",    prevLabel:"Informe APU",     nextLabel:"Tablero" },
      "assistant":     { prev:"apu",       next:"apu-advanced", prevLabel:"Presupuesto APU", nextLabel:"Desglose APU" },
      "mobile-alerts": { prev:"alerts",    next:"dashboard",    prevLabel:"Alertas",         nextLabel:"Tablero" },
      "management":    { prev:"dashboard", next:"dashboard",    prevLabel:"Tablero",         nextLabel:"Tablero" },
    };
    const flow = flowMap[route];
    if (!flow) return;
    const style = doc.createElement("style");
    style.textContent = "#wm-flow-nav{position:fixed;bottom:0;left:0;right:0;z-index:9000;display:flex;justify-content:space-between;align-items:center;padding:8px 16px;background:rgba(26,43,68,.96);backdrop-filter:blur(8px);border-top:1px solid rgba(255,255,255,.1);gap:8px}.wm-flow-btn{display:inline-flex;align-items:center;gap:6px;background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.2);color:#e5e7eb;border-radius:6px!important;padding:6px 12px;font:600 12px/1 Inter,sans-serif;cursor:pointer;transition:background .15s}.wm-flow-btn:hover{background:rgba(255,255,255,.2)}.wm-flow-btn.primary{background:#e9c176;border-color:#e9c176;color:#1a2b44}.wm-flow-btn.primary:hover{background:#f0d090}.wm-flow-center{font:500 11px/1 Inter,sans-serif;color:rgba(255,255,255,.5);text-align:center;flex:1}body{padding-bottom:52px!important}";
    doc.head.appendChild(style);
    const bar = doc.createElement("div");
    bar.id = "wm-flow-nav";
    const prev = doc.createElement("button");
    prev.className = "wm-flow-btn";
    prev.textContent = "<- " + flow.prevLabel;
    prev.addEventListener("click", () => navigate(flow.prev));
    const center = doc.createElement("span");
    center.className = "wm-flow-center";
    center.textContent = "CONSTRUCTORA WM/M&S";
    const next = doc.createElement("button");
    next.className = "wm-flow-btn primary";
    next.textContent = flow.nextLabel + " ->";
    next.addEventListener("click", () => navigate(flow.next));
    bar.append(prev, center, next);
    doc.body.appendChild(bar);
  }

  // ── Formulario rapido de ingresos/gastos en el dashboard ─────
  function injectDashboardQuickEntry(doc) {
    if (doc.getElementById("wm-quick-entry")) return;
    const style = doc.createElement("style");
    style.textContent = "#wm-quick-entry{position:fixed;bottom:0;left:0;right:0;z-index:8500;background:rgba(26,43,68,.97);backdrop-filter:blur(12px);border-top:2px solid #e9c176;padding:12px 16px;display:none;flex-direction:column;gap:10px}#wm-quick-entry.open{display:flex}#wm-qe-toggle{position:fixed;bottom:16px;right:72px;z-index:8600;background:#e9c176;color:#1a2b44;border:none;border-radius:50%;width:48px;height:48px;cursor:pointer;box-shadow:0 4px 16px rgba(0,0,0,.3);display:flex;align-items:center;justify-content:center}.wm-qe-row{display:grid;grid-template-columns:1fr 1fr 1fr 1fr 1fr 1fr auto;gap:8px;align-items:end}.wm-qe-row label{font:600 10px/1 Inter,sans-serif;color:rgba(255,255,255,.6);text-transform:uppercase;letter-spacing:.05em;display:block;margin-bottom:3px}.wm-qe-row input,.wm-qe-row select{width:100%;padding:7px 9px;border:1px solid rgba(255,255,255,.2);border-radius:6px;background:rgba(255,255,255,.08);color:#fff;font:400 13px/1 Inter,sans-serif}.wm-qe-row input::placeholder{color:rgba(255,255,255,.35)}.wm-qe-row select option{background:#1a2b44;color:#fff}#wm-qe-save{background:#e9c176;color:#1a2b44;border:none;border-radius:6px;padding:8px 16px;font:700 13px/1 Inter,sans-serif;cursor:pointer;white-space:nowrap;height:36px}#wm-qe-type-row{display:flex;gap:8px;align-items:center}.wm-qe-type-btn{padding:5px 14px;border-radius:20px;border:1px solid rgba(255,255,255,.25);background:transparent;color:rgba(255,255,255,.6);font:600 11px/1 Inter,sans-serif;cursor:pointer;transition:all .15s}.wm-qe-type-btn.active-ingreso{background:#22c55e;border-color:#22c55e;color:#fff}.wm-qe-type-btn.active-gasto{background:#ef4444;border-color:#ef4444;color:#fff}#wm-qe-proj-select{padding:5px 10px;border-radius:6px;border:1px solid rgba(255,255,255,.2);background:rgba(255,255,255,.08);color:#fff;font:400 12px/1 Inter,sans-serif}#wm-qe-proj-select option{background:#1a2b44}";
    doc.head.appendChild(style);
    const toggle = doc.createElement("button");
    toggle.id = "wm-qe-toggle";
    toggle.title = "Registro rapido (Ctrl+E)";
    toggle.innerHTML = '<span class="material-symbols-outlined" style="font-size:22px">add_circle</span>';
    doc.body.appendChild(toggle);
    const cats = ["Materiales","Mano de Obra","Herramienta","Sub-contrato","Administrativo","Personal","Transporte","Fijos","Hogar","Aporte","Trabajos Extra"].map(c => '<option value="' + c + '">' + c + '</option>').join("");
    const panel = doc.createElement("div");
    panel.id = "wm-quick-entry";
    panel.innerHTML = '<div id="wm-qe-type-row"><span style="font:700 12px/1 Inter,sans-serif;color:rgba(255,255,255,.7);text-transform:uppercase;letter-spacing:.05em">Registro rapido:</span><button class="wm-qe-type-btn active-ingreso" id="wm-qe-ingreso">Ingreso</button><button class="wm-qe-type-btn" id="wm-qe-gasto">Gasto</button><select id="wm-qe-proj-select"><option value="">Proyecto...</option></select><span style="margin-left:auto;font:400 11px/1 Inter,sans-serif;color:rgba(255,255,255,.4)">Ctrl+E</span></div><div class="wm-qe-row"><div><label>Descripcion</label><input id="wm-qe-desc" placeholder="Cemento, planilla..." type="text"/></div><div><label>Cantidad</label><input id="wm-qe-qty" placeholder="1" type="number" min="0" step="any" value="1"/></div><div><label>Costo unit. (Q)</label><input id="wm-qe-unit" placeholder="0.00" type="number" min="0" step="any"/></div><div><label>Costo total (Q)</label><input id="wm-qe-total" placeholder="0.00" type="number" min="0" step="any" readonly/></div><div><label>Categoria</label><select id="wm-qe-cat">' + cats + '</select></div><div><label>Fecha</label><input id="wm-qe-date" type="date"/></div><button id="wm-qe-save">Guardar</button></div>';
    doc.body.appendChild(panel);
    panel.querySelector("#wm-qe-date").value = new Date().toISOString().slice(0,10);
    let entryType = "ingreso";
    panel.querySelector("#wm-qe-ingreso").addEventListener("click", () => { entryType="ingreso"; panel.querySelector("#wm-qe-ingreso").className="wm-qe-type-btn active-ingreso"; panel.querySelector("#wm-qe-gasto").className="wm-qe-type-btn"; });
    panel.querySelector("#wm-qe-gasto").addEventListener("click", () => { entryType="gasto"; panel.querySelector("#wm-qe-gasto").className="wm-qe-type-btn active-gasto"; panel.querySelector("#wm-qe-ingreso").className="wm-qe-type-btn"; });
    const qtyEl=panel.querySelector("#wm-qe-qty"), ucEl=panel.querySelector("#wm-qe-unit"), totEl=panel.querySelector("#wm-qe-total");
    const calc=()=>{ totEl.value=(parseFloat(qtyEl.value||0)*parseFloat(ucEl.value||0)).toFixed(2); };
    qtyEl.addEventListener("input",calc); ucEl.addEventListener("input",calc);
    toggle.addEventListener("click", () => panel.classList.toggle("open"));
    doc.addEventListener("keydown", e => { if ((e.ctrlKey||e.metaKey) && e.key.toLowerCase()==="e") { e.preventDefault(); panel.classList.toggle("open"); } });
    (async () => {
      const client = await getAuthedClient();
      if (!client) return;
      const { data } = await client.from("projects").select("id,name").limit(50).catch(() => ({ data:[] }));
      const sel = panel.querySelector("#wm-qe-proj-select");
      (data||[]).forEach(p => { const o=doc.createElement("option"); o.value=p.id; o.textContent=p.name; sel.appendChild(o); });
    })();
    panel.querySelector("#wm-qe-save").addEventListener("click", async () => {
      const desc=panel.querySelector("#wm-qe-desc").value.trim();
      const qty=parseFloat(qtyEl.value||1), uc=parseFloat(ucEl.value||0);
      const total=parseFloat(totEl.value||0)||qty*uc;
      const cat=panel.querySelector("#wm-qe-cat").value;
      const date=panel.querySelector("#wm-qe-date").value;
      const projId=panel.querySelector("#wm-qe-proj-select").value||null;
      if (!desc) { showFrameToast(doc,"Ingresa una descripcion."); return; }
      const client=await getAuthedClient();
      if (client) {
        if (entryType==="gasto") {
          const {error}=await client.from("expenses").insert([{description:desc,amount:total,date,category:normalizeExpenseCategory(cat)}]);
          if (error) { showFrameToast(doc,formatDataError(error)); return; }
        } else {
          const {error}=await client.from("project_tracking").insert([{project_id:projId,income:total,expenses_total:0,physical_pct:0,financial_pct:0,snapshot_date:date,notes:desc}]);
          if (error) { showFrameToast(doc,formatDataError(error)); return; }
        }
      }
      showFrameToast(doc,(entryType==="ingreso"?"Ingreso":"Gasto")+" registrado: Q "+total.toFixed(2));
      panel.querySelector("#wm-qe-desc").value=""; qtyEl.value="1"; ucEl.value=""; totEl.value="";
      panel.classList.remove("open");
      setTimeout(()=>patchDataSync(doc,"dashboard"),600);
    });
  }

  // ── Calendario interactivo del dashboard ─────────────────────
  function injectInteractiveCalendar(doc) {
    if (doc.getElementById("wm-cal-style")) return;
    const style=doc.createElement("style"); style.id="wm-cal-style";
    style.textContent=".wm-cal-day{cursor:pointer;position:relative;transition:background .15s;border-radius:4px}.wm-cal-day:hover{background:rgba(26,43,68,.12)!important}.wm-cal-day.has-event::after{content:'';position:absolute;bottom:2px;left:50%;transform:translateX(-50%);width:5px;height:5px;background:#e9c176;border-radius:50%}#wm-cal-modal{position:fixed;top:0;left:0;right:0;bottom:0;z-index:8500;background:rgba(0,0,0,.5);backdrop-filter:blur(4px);display:none;align-items:center;justify-content:center}#wm-cal-modal.open{display:flex}#wm-cal-inner{background:#fff;border-radius:12px;padding:24px;width:100%;max-width:360px;box-shadow:0 24px 64px rgba(15,23,42,.24)}#wm-cal-inner h3{font:700 15px/1 Inter,sans-serif;color:#1a2b44;margin-bottom:14px}#wm-cal-inner input,#wm-cal-inner select{width:100%;padding:8px 10px;border:1px solid #cbd5e1;border-radius:6px;font:400 13px/1 Inter,sans-serif;margin-bottom:10px;background:#f8fafc;color:#172033}#wm-cal-save{width:100%;padding:10px;background:#1a2b44;color:#fff;border:none;border-radius:6px;font:700 13px/1 Inter,sans-serif;cursor:pointer}#wm-cal-cancel{background:transparent;border:none;color:#64748b;font:600 12px/1 Inter,sans-serif;cursor:pointer;margin-top:8px;width:100%}";
    doc.head.appendChild(style);
    const modal=doc.createElement("div"); modal.id="wm-cal-modal";
    modal.innerHTML='<div id="wm-cal-inner"><h3 id="wm-cal-title">Nueva Actividad</h3><input id="wm-cal-name" placeholder="Nombre de la actividad" type="text"/><input id="wm-cal-date" type="date"/><select id="wm-cal-type"><option value="site_visit">Visita de Obra</option><option value="deadline">Fecha Limite</option><option value="meeting">Reunion</option><option value="payment">Pago</option></select><button id="wm-cal-save">Guardar Actividad</button><button id="wm-cal-cancel">Cancelar</button></div>';
    doc.body.appendChild(modal);
    modal.querySelector("#wm-cal-cancel").addEventListener("click",()=>modal.classList.remove("open"));
    modal.addEventListener("click",e=>{if(e.target===modal)modal.classList.remove("open");});
    modal.querySelector("#wm-cal-save").addEventListener("click",async()=>{
      const name=modal.querySelector("#wm-cal-name").value.trim();
      const date=modal.querySelector("#wm-cal-date").value;
      if(!name||!date){showFrameToast(doc,"Completa nombre y fecha.");return;}
      const client=await getAuthedClient();
      if(client) await client.from("milestones").insert([{name,due_date:date,status:"Pending"}]).catch(()=>{});
      const day=date.split("-")[2]?.replace(/^0/,"");
      doc.querySelectorAll(".wm-cal-day").forEach(d=>{if((d.textContent||"").trim()===day)d.classList.add("has-event");});
      showFrameToast(doc,'Actividad "'+name+'" programada.');
      modal.classList.remove("open"); modal.querySelector("#wm-cal-name").value="";
    });
    doc.querySelectorAll(".grid.grid-cols-7 > div").forEach(dayEl=>{
      const txt=(dayEl.textContent||"").trim();
      if(!/^\d+$/.test(txt)||parseInt(txt)>31)return;
      dayEl.classList.add("wm-cal-day");
      dayEl.addEventListener("click",()=>{
        const today=new Date(), d=txt.padStart(2,"0"), m=String(today.getMonth()+1).padStart(2,"0");
        modal.querySelector("#wm-cal-date").value=today.getFullYear()+"-"+m+"-"+d;
        modal.querySelector("#wm-cal-title").textContent="Nueva Actividad - "+d+"/"+m+"/"+today.getFullYear();
        modal.classList.add("open");
      });
    });
  }

  // ── Boton Salir en el dashboard ───────────────────────────────
  function injectDashboardLogout(doc) {
    if (doc.getElementById("wm-dash-logout")) return;
    const btn=doc.createElement("button"); btn.id="wm-dash-logout";
    btn.style.cssText="position:fixed;top:12px;right:16px;z-index:7000;background:rgba(186,26,26,.9);color:#fff;border:none;border-radius:6px;padding:7px 14px;font:700 12px/1 Inter,sans-serif;cursor:pointer;display:flex;align-items:center;gap:6px;backdrop-filter:blur(4px)";
    btn.innerHTML='<span class="material-symbols-outlined" style="font-size:16px">logout</span>Salir';
    btn.addEventListener("click",async()=>{const client=getSupabase();if(client)await client.auth.signOut();currentSession=null;showLoginScreen();});
    doc.body.appendChild(btn);
  }

  // ── Live clock injected into every module that shows a time element ──
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
    // Eliminar Tailwind CDN completamente (ya tenemos estilos inyectados)
    doc.querySelectorAll('script[src*="cdn.tailwindcss.com"]').forEach(s => s.remove());
    // Eliminar scripts no necesarios
    doc.querySelectorAll('script:not(#tailwind-config):not([type="module"])').forEach(s => {
      if (s.src && !s.src.includes('tailwind')) s.remove();
    });
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

    // ── Dashboard: KPIs reales ──
    if (route === "dashboard") {
      try {
        const [{count:projCount},{count:clientCount},{data:expenses},{data:tracking},{data:projects}] = await Promise.all([
          client.from("projects").select("id",{count:"exact",head:true}),
          client.from("clients").select("id",{count:"exact",head:true}),
          client.from("expenses").select("amount,date").order("date",{ascending:false}).limit(500),
          client.from("project_tracking").select("physical_pct,financial_pct,income,expenses_total,snapshot_date").order("snapshot_date",{ascending:false}).limit(20),
          client.from("projects").select("name,status,total_budget,financial_deployed").limit(10)
        ]);
        // KPI 1: Total proyectos
        const kpi1 = doc.querySelector(".font-h1.text-h1.text-primary");
        if (kpi1) kpi1.textContent = String(projCount ?? 0);
        // KPI 2: Presupuesto activo
        const totalBudget = (projects||[]).reduce((s,p)=>s+parseNumber(p.total_budget),0);
        const kpi2 = doc.querySelector(".font-h1.text-h1.text-on-tertiary-fixed");
        if (kpi2) kpi2.textContent = totalBudget>=1000000 ? "Q"+(totalBudget/1000000).toFixed(1)+"M" : "Q"+totalBudget.toLocaleString("es-GT",{minimumFractionDigits:0});
        // KPI 3: Progreso promedio
        const avgPhys = tracking&&tracking.length>0 ? Math.round(tracking.reduce((s,r)=>s+parseNumber(r.physical_pct),0)/tracking.length) : 0;
        const allKpi = Array.from(doc.querySelectorAll(".col-span-3"));
        const progKpi = allKpi.find(el=>/progreso promedio/i.test(el.textContent||""));
        if (progKpi) { const v=progKpi.querySelector(".font-h1"); if(v)v.textContent=avgPhys+"%"; const b=progKpi.querySelector(".bg-primary.h-full.rounded-full"); if(b)b.style.width=avgPhys+"%"; }
        // Grafica Ingresos vs Gastos
        if (tracking&&tracking.length>0) {
          const byMonth={};
          tracking.forEach(t=>{const m=(t.snapshot_date||"").slice(0,7);if(!byMonth[m])byMonth[m]={income:0,expenses:0};byMonth[m].income+=parseNumber(t.income);byMonth[m].expenses+=parseNumber(t.expenses_total);});
          const months=Object.keys(byMonth).sort().slice(-4);
          const maxV=Math.max(...months.map(m=>Math.max(byMonth[m].income,byMonth[m].expenses)),1);
          const chartContainer=Array.from(doc.querySelectorAll(".flex-1.flex.items-end")).find(el=>el.querySelectorAll(".w-8").length>=2);
          const groups=chartContainer?Array.from(chartContainer.querySelectorAll(".flex-1.flex.justify-center.items-end")):Array.from(doc.querySelectorAll(".flex-1.flex.justify-center.items-end.gap-1"));
          const monthNames=["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
          months.forEach((m,i)=>{const g=groups[i];if(!g)return;const bars=g.querySelectorAll(".w-8");const ip=Math.round((byMonth[m].income/maxV)*85)+10;const ep=Math.round((byMonth[m].expenses/maxV)*85)+10;if(bars[0])bars[0].style.height=ip+"%";if(bars[1])bars[1].style.height=ep+"%";});
          const xLabels=doc.querySelectorAll(".flex.justify-between.mt-3 span");
          months.forEach((m,i)=>{if(xLabels[i])xLabels[i].textContent=monthNames[parseInt(m.slice(5,7))-1];});
        }
        // Grafica Salud
        if (tracking&&tracking.length>0) {
          const lt=tracking[0], physP=parseNumber(lt.physical_pct), finP=parseNumber(lt.financial_pct), varP=Math.abs(physP-finP);
          const hRows=Array.from(doc.querySelectorAll(".w-full.bg-surface-variant.rounded-full.overflow-hidden"));
          const pcts=[physP,varP,finP], bClasses=["bg-primary","bg-tertiary-container","bg-surface-tint"];
          hRows.slice(0,3).forEach((row,i)=>{const b=row.querySelector("."+bClasses[i])||row.querySelector("div");if(b)b.style.width=pcts[i]+"%";});
          const hVals=Array.from(doc.querySelectorAll(".font-semibold")).filter(el=>/^\d+%$/.test((el.textContent||"").trim()));
          if(hVals[0])hVals[0].textContent=physP+"%"; if(hVals[1])hVals[1].textContent=varP+"%"; if(hVals[2])hVals[2].textContent=finP+"%";
        }
        // KPI 4: Proximo hito
        try {
          const {data:milestones}=await client.from("milestones").select("name,due_date").gte("due_date",new Date().toISOString().slice(0,10)).order("due_date",{ascending:true}).limit(1);
          if(milestones&&milestones[0]){const m=milestones[0];const kpi4=doc.querySelector(".font-h3.text-\\[20px\\]");if(kpi4)kpi4.textContent=m.name;const dL=Math.ceil((new Date(m.due_date)-new Date())/86400000);const kpi4s=doc.querySelector(".text-error.mt-2 .font-caption");if(kpi4s)kpi4s.textContent=dL<=0?"Vencido":"Vence en "+dL+" dia"+(dL!==1?"s":"");}
        } catch(e){}
      } catch(e){console.error("Dashboard sync",e);setStatus(formatDataError(e));}
    }

    // ── Seguimiento: tabla y graficas reales ──
    if (route === "tracking") {
      try {
        const {data:trackingData}=await client.from("project_tracking").select("project_id,physical_pct,financial_pct,income,expenses_total,snapshot_date").order("snapshot_date",{ascending:false}).limit(50);
        const {data:projectsData}=await client.from("projects").select("id,name,status,total_budget,financial_deployed").limit(20);
        if(!trackingData||trackingData.length===0)return;
        const latestByProj={};
        trackingData.forEach(t=>{if(!latestByProj[t.project_id])latestByProj[t.project_id]=t;});
        const totalDeployed=Object.values(latestByProj).reduce((s,t)=>s+parseNumber(t.income),0);
        const kpiD=doc.querySelector(".font-h2.text-h2.text-primary-container");
        if(kpiD)kpiD.textContent="Q "+totalDeployed.toLocaleString("es-GT",{minimumFractionDigits:2});
        const chartGroups=Array.from(doc.querySelectorAll(".flex.flex-col.items-center.gap-2.flex-1"));
        Object.values(latestByProj).slice(0,4).forEach((t,i)=>{
          if(!chartGroups[i])return;
          const bars=chartGroups[i].querySelectorAll(".w-1\\/3");
          const ph=Math.max(5,Math.round(parseNumber(t.physical_pct))), fh=Math.max(5,Math.round(parseNumber(t.financial_pct)));
          if(bars[0])bars[0].style.height=ph+"%"; if(bars[1])bars[1].style.height=fh+"%";
          const lbl=chartGroups[i].querySelector(".font-caption.text-secondary");
          const proj=projectsData?.find(p=>p.id===t.project_id);
          if(lbl&&proj)lbl.textContent=proj.name.slice(0,10);
        });
        const tbody=doc.querySelector("tbody");
        if(tbody&&projectsData&&projectsData.length>0){
          tbody.innerHTML="";
          projectsData.slice(0,5).forEach(proj=>{
            const t=latestByProj[proj.id]||{physical_pct:0,financial_pct:0,income:0,expenses_total:0};
            const ph=Math.round(parseNumber(t.physical_pct)), fh=Math.round(parseNumber(t.financial_pct));
            const inc=parseNumber(t.income), exp=parseNumber(t.expenses_total), pend=inc-exp;
            const sc=proj.status==="Active"?"bg-secondary-container text-on-secondary-container":proj.status==="Delayed"?"bg-error-container text-on-error-container":"bg-tertiary-fixed text-on-tertiary-fixed";
            const tr=doc.createElement("tr"); tr.className="hover:bg-surface-container-low transition-colors";
            tr.innerHTML='<td class="p-4 font-semibold">'+proj.name+'</td><td class="p-4"><span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium '+sc+'">'+proj.status+'</span></td><td class="p-4"><div class="flex items-center gap-2"><div class="w-full bg-surface-variant rounded-full h-2 overflow-hidden"><div class="bg-primary-container h-2 rounded-full" style="width:'+ph+'%"></div></div><span class="font-data-label text-primary-container">'+ph+'%</span></div></td><td class="p-4"><div class="flex items-center gap-2"><div class="w-full bg-surface-variant rounded-full h-2 overflow-hidden"><div class="bg-[#e28743] h-2 rounded-full" style="width:'+fh+'%"></div></div><span class="font-data-label text-[#e28743]">'+fh+'%</span></div></td><td class="p-4 text-right font-data-label">Q '+inc.toLocaleString("es-GT",{minimumFractionDigits:2})+'</td><td class="p-4 text-right font-data-label">Q '+exp.toLocaleString("es-GT",{minimumFractionDigits:2})+'</td><td class="p-4 text-right font-data-label'+(pend<0?" text-error":"")+'">Q '+pend.toLocaleString("es-GT",{minimumFractionDigits:2})+'</td>';
            tbody.appendChild(tr);
          });
        }
      } catch(e){console.error("Tracking sync",e);}
    }

    // ── Alertas: cargar alertas reales ──
    if (route === "alerts") {
      try {
        const {data:alertsData}=await client.from("alerts").select("id,title,message,type,is_read,created_at").order("created_at",{ascending:false}).limit(20);
        if(!alertsData||alertsData.length===0)return;
        const tbody=doc.querySelector("tbody")||doc.querySelector(".divide-y");
        if(!tbody)return;
        tbody.innerHTML="";
        alertsData.forEach(alert=>{
          const isCrit=alert.type==="Critical", isWarn=alert.type==="Warning";
          const cc=isCrit?"bg-error-container text-on-error-container":isWarn?"bg-tertiary-fixed-dim text-on-tertiary-fixed-variant":"bg-secondary-container text-on-secondary-container";
          const icon=isCrit?"error":isWarn?"warning":"info";
          const date=alert.created_at?new Date(alert.created_at).toLocaleDateString("es-GT"):"";
          const tr=doc.createElement("tr"); tr.className="hover:bg-surface-container-low transition-colors"+(alert.is_read?"":" font-semibold");
          tr.innerHTML='<td class="p-4"><span class="material-symbols-outlined text-'+(isCrit?"error":isWarn?"tertiary":"secondary")+'">'+icon+'</span></td><td class="p-4">'+alert.title+'</td><td class="p-4 text-on-surface-variant">'+(alert.message||"")+'</td><td class="p-4"><span class="px-2 py-1 rounded-full text-xs font-medium '+cc+'">'+(alert.type||"Info")+'</span></td><td class="p-4 text-secondary font-caption">'+date+'</td><td class="p-4"><button class="text-secondary hover:text-primary wm-mark-read" data-id="'+alert.id+'" title="'+(alert.is_read?"Leida":"Marcar leida")+'"><span class="material-symbols-outlined text-sm">'+(alert.is_read?"mark_email_read":"mark_email_unread")+'</span></button></td>';
          tbody.appendChild(tr);
        });
        tbody.addEventListener("click",async e=>{
          const btn=e.target.closest(".wm-mark-read"); if(!btn)return;
          await client.from("alerts").update({is_read:true}).eq("id",btn.dataset.id).catch(()=>{});
          btn.querySelector(".material-symbols-outlined").textContent="mark_email_read";
          btn.closest("tr").classList.remove("font-semibold");
          showFrameToast(doc,"Alerta marcada como leida.");
        });
        const critCount=alertsData.filter(a=>a.type==="Critical"&&!a.is_read).length;
        const kpiEl=Array.from(doc.querySelectorAll(".font-h1,.font-h2")).find(el=>/^\d+$/.test((el.textContent||"").trim()));
        if(kpiEl)kpiEl.textContent=String(critCount);
      } catch(e){console.error("Alerts sync",e);}
    }

    // ── Cronograma: milestones reales ──
    if (route === "schedule") {
      try {
        const {data:milestones}=await client.from("milestones").select("id,name,due_date,status,project_id").order("due_date",{ascending:true}).limit(30);
        const {data:projects}=await client.from("projects").select("id,name").limit(20);
        if(!milestones||milestones.length===0)return;
        const projMap=Object.fromEntries((projects||[]).map(p=>[p.id,p.name]));
        const tbody=doc.querySelector("tbody"); if(!tbody)return;
        tbody.innerHTML="";
        milestones.forEach(m=>{
          const due=m.due_date?new Date(m.due_date):null;
          const dL=due?Math.ceil((due-new Date())/86400000):null;
          const isLate=dL!==null&&dL<0;
          const sc=m.status==="Completed"?"bg-secondary-container text-on-secondary-container":isLate?"bg-error-container text-on-error-container":"bg-tertiary-fixed-dim text-on-tertiary-fixed-variant";
          const tr=doc.createElement("tr"); tr.className="hover:bg-surface-container-low transition-colors";
          tr.innerHTML='<td class="p-4 font-semibold text-primary">'+m.name+'</td><td class="p-4 text-secondary">'+(projMap[m.project_id]||"—")+'</td><td class="p-4">'+(due?due.toLocaleDateString("es-GT"):"—")+'</td><td class="p-4">'+(dL!==null?(isLate?'<span class="text-error font-semibold">'+Math.abs(dL)+'d retraso</span>':dL+"d restantes"):"—")+'</td><td class="p-4"><span class="px-2 py-1 rounded-full text-xs font-medium '+sc+'">'+(m.status||"Pendiente")+'</span></td>';
          tbody.appendChild(tr);
        });
      } catch(e){console.error("Schedule sync",e);}
    }

    // ── Operaciones: gastos reales ──
    if (route === "operations") {
      try {
        const {data:expData}=await client.from("expenses").select("id,description,amount,date,category").order("date",{ascending:false}).limit(30);
        if(!expData||expData.length===0)return;
        const tbody=doc.querySelector("tbody");
        if(tbody){
          tbody.innerHTML="";
          expData.forEach(exp=>{
            const cc=exp.category==="Mano de Obra"?"bg-secondary-container text-on-secondary-container":exp.category==="Materiales"?"bg-tertiary-fixed-dim text-on-tertiary-fixed-variant":"bg-surface-variant text-on-surface-variant";
            const tr=doc.createElement("tr"); tr.className="hover:bg-surface-container-low transition-colors";
            tr.innerHTML='<td class="p-4">'+(exp.date?new Date(exp.date).toLocaleDateString("es-GT"):"—")+'</td><td class="p-4 font-medium">'+(exp.description||"—")+'</td><td class="p-4"><span class="px-2 py-1 rounded-full text-xs font-medium '+cc+'">'+(exp.category||"Otro")+'</span></td><td class="p-4 text-right font-data-label">Q '+parseNumber(exp.amount).toLocaleString("es-GT",{minimumFractionDigits:2})+'</td>';
            tbody.appendChild(tr);
          });
        }
        const total=expData.reduce((s,e)=>s+parseNumber(e.amount),0);
        const kpiEl=doc.querySelector(".font-h2.text-h2,.font-h1.text-h1");
        if(kpiEl&&/Q|^\d/.test(kpiEl.textContent||""))kpiEl.textContent="Q "+total.toLocaleString("es-GT",{minimumFractionDigits:2});
      } catch(e){console.error("Operations sync",e);}
    }

    // ── Informe APU: APU mas reciente ──
    if (route === "apu-report") {
      try {
        const {data:apus}=await client.from("apus").select("id,description,phase,total_price,created_at").order("created_at",{ascending:false}).limit(1);
        if(!apus||!apus[0])return;
        const latest=apus[0];
        const titleEl=doc.querySelector("h1,h2,.font-h2");
        if(titleEl&&latest.description)titleEl.textContent=latest.description;
        const totalEl=doc.querySelector(".font-h1,.font-h2.text-on-tertiary-fixed-variant,.bg-tertiary-fixed-dim .font-h2");
        if(totalEl)totalEl.textContent="Q "+parseNumber(latest.total_price).toLocaleString("es-GT",{minimumFractionDigits:2});
      } catch(e){console.error("APU-report sync",e);}
    }

    // ── Resumen cliente: cliente y proyecto mas reciente ──
    if (route === "client-summary") {
      try {
        const {data:clients}=await client.from("clients").select("id,name,email,phone").order("created_at",{ascending:false}).limit(1);
        const {data:projects}=await client.from("projects").select("name,total_budget,status,typology").order("created_at",{ascending:false}).limit(1);
        if(clients&&clients[0]){
          const c=clients[0];
          const nameEls=Array.from(doc.querySelectorAll(".font-h2,.font-h3")).filter(el=>/cliente|nombre/i.test(el.previousElementSibling?.textContent||el.closest("div")?.querySelector("label,span")?.textContent||""));
          if(nameEls[0])nameEls[0].textContent=c.name;
        }
        if(projects&&projects[0]){
          const p=projects[0];
          const budgetEl=doc.querySelector(".font-h1,.font-h2.text-on-tertiary-fixed-variant");
          if(budgetEl)budgetEl.textContent="Q "+parseNumber(p.total_budget).toLocaleString("es-GT",{minimumFractionDigits:2});
        }
      } catch(e){console.error("Client-summary sync",e);}
    }

    // ── APU Avanzado: precargar 40 renglones ──
    if (route === "apu-advanced") patchApuRows(doc);

    // ── Formularios: submit handler ──
    Array.from(doc.querySelectorAll("form")).forEach(form=>{
      form.addEventListener("submit",async event=>{
        event.preventDefault(); event.stopPropagation();
        const submitBtn=form.querySelector('button[type="submit"]');
        const origText=submitBtn?submitBtn.textContent:"";
        if(submitBtn)submitBtn.textContent="Guardando...";
        try {
          const message=route==="operations"?await saveExpenseForm(form,client):await saveClientForm(doc,form,client);
          showFrameToast(doc,message); form.reset();
        } catch(error){
          showFrameToast(doc,"Error al guardar: "+formatDataError(error));
        } finally {
          if(submitBtn)submitBtn.textContent=origText;
        }
      },true);
    });
  }

  // ── 40 renglones APU por tipologia (precios Guatemala 2024) ──
  const APU_ROWS = {
    Residencial:[["Limpieza y chapeo","m2",0.05,18],["Trazo y estaqueado","m2",0.08,12],["Excavacion manual","m3",0.80,95],["Relleno compactado","m3",0.70,85],["Cimiento corrido","ml",1.20,320],["Solera de humedad","ml",1.10,280],["Levantado block 15cm","m2",1.00,185],["Levantado block 20cm","m2",1.00,210],["Solera intermedia","ml",1.10,265],["Solera corona","ml",1.10,270],["Columna C-1 15x15","ml",1.00,420],["Columna C-2 20x20","ml",1.00,580],["Viga V-1 15x20","ml",1.00,480],["Losa tradicional e=10cm","m2",1.05,650],["Losa prefabricada","m2",1.00,520],["Repello + cernido","m2",0.90,95],["Piso ceramico 30x30","m2",1.05,220],["Piso ceramico 60x60","m2",1.05,280],["Azulejo bano","m2",1.05,195],["Puerta madera solida","u",1.00,1850],["Puerta metalica","u",1.00,2200],["Ventana aluminio/vidrio","m2",1.00,680],["Instalacion electrica punto","pto",1.00,185],["Tablero electrico 8 circuitos","u",1.00,1450],["Instalacion hidraulica punto","pto",1.00,220],["Instalacion sanitaria punto","pto",1.00,280],["Fosa septica 1000L","u",1.00,8500],["Pozo de absorcion","u",1.00,4200],["Pintura interior 2 manos","m2",0.95,48],["Pintura exterior","m2",0.95,55],["Cielo falso tabla yeso","m2",1.00,185],["Cielo falso PVC","m2",1.00,145],["Cubierta lamina galvanizada","m2",1.05,185],["Cubierta teja","m2",1.05,320],["Fascia + sofito","ml",1.00,185],["Gradas concreto","ml",1.00,680],["Muro de contencion","m2",1.10,420],["Acera perimetral","m2",1.00,185],["Jardinizacion basica","m2",1.00,45],["Limpieza final de obra","global",1.00,2500]],
    Comercial:[["Demolicion y desalojo","m3",1.00,185],["Trazo y nivelacion","m2",0.08,15],["Excavacion mecanica","m3",0.40,65],["Zapata aislada Z-1","u",1.00,3200],["Zapata combinada Z-2","u",1.00,5800],["Pedestal P-1 30x30","ml",1.00,680],["Columna metalica HEB","kg",1.00,28],["Viga metalica IPE","kg",1.00,26],["Losa postensada e=12cm","m2",1.05,850],["Muro cortina vidrio","m2",1.00,1850],["Fachada ACM","m2",1.00,1200],["Piso porcelanato 60x60","m2",1.05,380],["Piso epoxido","m2",1.00,285],["Cielo falso Armstrong","m2",1.00,220],["Tabique drywall","m2",1.00,185],["Puerta vidrio templado","u",1.00,4500],["Sistema contra incendios punto","pto",1.00,850],["Aire acondicionado ton","ton",1.00,8500],["Instalacion electrica industrial","pto",1.00,320],["Tablero electrico 24 circuitos","u",1.00,4200],["Red hidraulica comercial","pto",1.00,380],["Trampa de grasa","u",1.00,3500],["Elevador hidraulico","u",1.00,185000],["Rampa acceso vehicular","m2",1.00,480],["Senalizacion horizontal","m2",1.00,85],["Senalizacion vertical","u",1.00,320],["Pintura epoxica","m2",1.00,95],["Impermeabilizacion losa","m2",1.00,185],["Jardineria ornamental","m2",1.00,120],["Iluminacion exterior LED","pto",1.00,680],["CCTV camara","u",1.00,1850],["Control de acceso","u",1.00,3200],["Parqueo adoquin","m2",1.00,285],["Cuneta y bordillo","ml",1.00,185],["Cisterna 5000L","u",1.00,18500],["Bomba hidroneumatica","u",1.00,8500],["Generador electrico","u",1.00,45000],["UPS central","u",1.00,12000],["Rotulacion exterior","m2",1.00,850],["Limpieza y entrega","global",1.00,5000]],
    Industrial:[["Limpieza terreno mecanica","m2",0.03,8],["Compactacion subrasante","m2",0.05,12],["Base granular e=15cm","m2",0.08,45],["Losa industrial e=15cm","m2",1.05,480],["Losa industrial e=20cm","m2",1.05,620],["Columna metalica W","kg",1.00,32],["Viga de acero W","kg",1.00,30],["Cercha metalica","kg",1.00,35],["Cubierta lamina troquelada","m2",1.05,185],["Cubierta panel sandwich","m2",1.05,380],["Muro prefabricado","m2",1.00,520],["Muro block industrial","m2",1.00,220],["Puerta industrial seccional","m2",1.00,1850],["Porton metalico corredizo","m2",1.00,1200],["Rampa de carga","u",1.00,28000],["Fosa de inspeccion","u",1.00,12000],["Instalacion electrica trifasica","pto",1.00,480],["Tablero trifasico 480V","u",1.00,8500],["Subestacion electrica","u",1.00,185000],["Iluminacion industrial LED","u",1.00,1850],["Red contra incendios","pto",1.00,1200],["Hidrante industrial","u",1.00,8500],["Trampa de aceite","u",1.00,5500],["Planta de tratamiento","u",1.00,85000],["Compresor de aire","u",1.00,28000],["Red de aire comprimido","pto",1.00,680],["Puente grua 5 ton","u",1.00,285000],["Monorriel","ml",1.00,1850],["Piso epoxido industrial","m2",1.00,320],["Senalizacion industrial","u",1.00,185],["Oficinas modulares","m2",1.00,1850],["Servicios sanitarios industriales","u",1.00,18500],["Cisterna industrial 20000L","u",1.00,45000],["Bomba contra incendios","u",1.00,28000],["Cerca perimetral malla","ml",1.00,285],["Garita de seguridad","u",1.00,28000],["Bascula vehicular","u",1.00,185000],["Pavimento asfalto","m2",1.00,185],["Drenaje pluvial industrial","ml",1.00,380],["Limpieza y entrega","global",1.00,8500]],
    Civil:[["Topografia y replanteo","km",1.00,8500],["Limpieza derecho de via","km",1.00,12000],["Corte de material","m3",0.35,55],["Relleno material selecto","m3",0.60,75],["Subbase granular e=20cm","m2",0.10,65],["Base granular e=15cm","m2",0.08,55],["Carpeta asfaltica e=5cm","m2",0.12,185],["Carpeta asfaltica e=7.5cm","m2",0.15,245],["Concreto hidraulico e=15cm","m2",1.05,380],["Bordillo de concreto","ml",1.00,185],["Cuneta de concreto","ml",1.00,220],["Alcantarilla 36 pulgadas","ml",1.00,1850],["Alcantarilla 48 pulgadas","ml",1.00,2800],["Cabezal de alcantarilla","u",1.00,8500],["Puente viga-losa L=10m","u",1.00,850000],["Muro contencion gavion","m2",1.00,680],["Muro contencion concreto","m2",1.10,850],["Senalizacion horizontal","m2",1.00,85],["Senalizacion vertical","u",1.00,1200],["Guardavias metalico","ml",1.00,480],["Iluminacion vial LED","u",1.00,8500],["Semaforo vehicular","u",1.00,28000],["Acera peatonal","m2",1.00,185],["Rampa accesibilidad","u",1.00,3500],["Drenaje sanitario PVC 6 pulgadas","ml",1.00,285],["Drenaje pluvial PVC 12 pulgadas","ml",1.00,480],["Pozo de visita","u",1.00,8500],["Caja de registro","u",1.00,1850],["Tuberia agua potable 4 pulgadas","ml",1.00,185],["Valvula de compuerta 4 pulgadas","u",1.00,1850],["Hidrante publico","u",1.00,12000],["Paso de rio vado","u",1.00,185000],["Estabilizacion de talud","m2",1.00,320],["Revegetacion talud","m2",1.00,45],["Barrera New Jersey","ml",1.00,680],["Reductor de velocidad","u",1.00,3500],["Estacion de autobus","u",1.00,85000],["Parqueo publico","m2",1.00,285],["Plazuela peatonal","m2",1.00,380],["Limpieza y entrega","global",1.00,12000]],
    Publica:[["Demolicion edificio existente","m3",1.00,220],["Trazo y nivelacion","m2",0.08,15],["Excavacion y desalojo","m3",0.80,95],["Cimentacion profunda pilotes","u",1.00,28000],["Estructura concreto reforzado","m3",1.05,3200],["Losa nervada e=25cm","m2",1.05,850],["Fachada ventilada","m2",1.00,1850],["Muro cortina","m2",1.00,2200],["Cubierta especial","m2",1.05,680],["Impermeabilizacion total","m2",1.00,220],["Piso granito pulido","m2",1.05,480],["Piso marmol","m2",1.05,850],["Cielo falso especial","m2",1.00,380],["Tabique vidrio templado","m2",1.00,1850],["Instalacion electrica especial","pto",1.00,480],["UPS y generador","u",1.00,85000],["Sistema BMS","global",1.00,185000],["Red de datos Cat6A","pto",1.00,380],["Sistema audiovisual","global",1.00,85000],["CCTV institucional","u",1.00,2800],["Control acceso biometrico","u",1.00,8500],["Aire acondicionado central","ton",1.00,12000],["Elevadores","u",1.00,285000],["Escaleras electricas","u",1.00,185000],["Sistema contra incendios NFPA","pto",1.00,1850],["Planta de tratamiento","u",1.00,185000],["Cisterna + hidroneumatico","u",1.00,85000],["Paneles solares","kWp",1.00,8500],["Jardines institucionales","m2",1.00,185],["Mobiliario urbano","u",1.00,3500],["Senalizacion institucional","u",1.00,850],["Auditorio sala de reuniones","m2",1.00,3500],["Cafeteria institucional","m2",1.00,2800],["Estacionamiento techado","m2",1.00,850],["Cancha deportiva","m2",1.00,380],["Area verde recreativa","m2",1.00,120],["Barda perimetral","ml",1.00,680],["Caseta de vigilancia","u",1.00,45000],["Rotulacion institucional","m2",1.00,1200],["Limpieza y entrega","global",1.00,15000]]
  };

  function patchApuRows(doc) {
    if (doc.getElementById("wm-apu-rows-injected")) return;
    const marker=doc.createElement("meta"); marker.id="wm-apu-rows-injected"; doc.head.appendChild(marker);
    function getActiveTip(){
      const active=Array.from(doc.querySelectorAll("button")).find(b=>b.classList.contains("bg-white")||b.classList.contains("font-semibold")||b.classList.contains("shadow-sm"));
      const lbl=(active?.textContent||"Residencial").trim();
      if(/comercial/i.test(lbl))return"Comercial"; if(/industrial/i.test(lbl))return"Industrial";
      if(/civil/i.test(lbl))return"Civil"; if(/p.blica|publica/i.test(lbl))return"Publica";
      return"Residencial";
    }
    function renderRows(tip){
      const rows=APU_ROWS[tip]||APU_ROWS["Residencial"];
      const tables=Array.from(doc.querySelectorAll("table"));
      const apuTable=tables.find(t=>t.querySelector("th")&&/recurso|descripci|item/i.test(t.querySelector("th")?.textContent||""));
      if(!apuTable)return;
      const tbody=apuTable.querySelector("tbody"); if(!tbody)return;
      tbody.innerHTML="";
      rows.forEach(([desc,unit,rend,price])=>{
        const sub=(rend*price).toFixed(2);
        const type=/cuadrilla|mano|labor|oficial|ayudante/i.test(desc)?"Mano de Obra":/herramienta|equipo|maquinaria/i.test(desc)?"Herramienta":"Material";
        const tr=doc.createElement("tr"); tr.className="border-b border-surface-variant hover:bg-surface-container-lowest transition-colors";
        tr.innerHTML='<td class="py-data-tight text-primary-container">'+desc+'</td><td class="py-data-tight text-secondary">'+type+'</td><td class="py-data-tight text-right text-secondary">'+rend+'</td><td class="py-data-tight text-right"><input class="w-20 text-right text-[13px] py-1 px-2 border border-outline-variant rounded focus:border-primary-container bg-surface-container-lowest" type="text" value="'+price.toFixed(2)+'"/></td><td class="py-data-tight text-right font-medium text-primary-container">Q '+sub+'</td>';
        tbody.appendChild(tr);
      });
      tbody.querySelectorAll("input").forEach(input=>{
        input.addEventListener("input",()=>{
          const row=input.closest("tr"); const cells=row.querySelectorAll("td");
          const rendVal=parseFloat((cells[2]?.textContent||"0").replace(/,/g,""))||0;
          const priceVal=parseFloat(input.value.replace(/,/g,""))||0;
          if(cells[4])cells[4].textContent="Q "+(rendVal*priceVal).toFixed(2);
          recalculateTotals(doc);
        });
      });
      recalculateTotals(doc);
    }
    renderRows(getActiveTip());
    Array.from(doc.querySelectorAll("button")).forEach(btn=>{
      const lbl=(btn.textContent||"").trim();
      if(/^(Residencial|Comercial|Industrial|Civil|P.blica|Publica)$/i.test(lbl)){
        btn.addEventListener("click",()=>setTimeout(()=>renderRows(getActiveTip()),50));
      }
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
    ].join("\\n");
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
  function patchApuRows(doc) {
    if (doc.getElementById("wm-apu-rows-injected")) return;
    const marker = doc.createElement("meta");
    marker.id = "wm-apu-rows-injected";
    doc.head.appendChild(marker);

    // Detectar tipologia activa por el boton seleccionado
    function getActiveTip() {
      const tipBtns = Array.from(doc.querySelectorAll("button")).filter(b =>
        /^(Residencial|Comercial|Industrial|Civil|P.blica|Publica)$/i.test((b.textContent||"").trim())
      );
      const active = tipBtns.find(b =>
        b.classList.contains("bg-white") || b.classList.contains("font-semibold") ||
        b.classList.contains("shadow-sm") || b.classList.contains("text-primary-container")
      ) || tipBtns[0];
      const lbl = (active?.textContent||"Residencial").trim();
      if (/comercial/i.test(lbl)) return "Comercial";
      if (/industrial/i.test(lbl)) return "Industrial";
      if (/civil/i.test(lbl)) return "Civil";
      if (/p.blica|publica/i.test(lbl)) return "Publica";
      return "Residencial";
    }

    // Encontrar la tabla APU de forma robusta
    function findApuTable() {
      const tables = Array.from(doc.querySelectorAll("table"));
      // Buscar por encabezados conocidos
      return tables.find(t => {
        const headers = Array.from(t.querySelectorAll("th")).map(th => (th.textContent||"").toLowerCase());
        return headers.some(h => /recurso|descripci|item|rend|precio|subtotal/.test(h));
      }) || tables.find(t => t.querySelector("input[type='text']")) || tables[0];
    }

    // Crear fila APU editable
    function makeRow(doc, desc, unit, rend, price, isNew) {
      const sub = (rend * price).toFixed(2);
      const type = /cuadrilla|mano|labor|oficial|ayudante/i.test(desc) ? "Mano de Obra"
                 : /herramienta|equipo|maquinaria/i.test(desc) ? "Herramienta" : "Material";
      const tr = doc.createElement("tr");
      tr.className = "border-b border-surface-variant hover:bg-surface-container-lowest transition-colors" + (isNew ? " wm-new-row" : "");
      tr.innerHTML =
        '<td class="py-1 px-2"><input class="w-full text-[13px] py-1 px-2 border border-outline-variant rounded bg-surface-container-lowest wm-desc" type="text" value="' + desc + '" placeholder="Descripcion..."/></td>' +
        '<td class="py-1 px-2 text-secondary text-[12px]">' + type + '</td>' +
        '<td class="py-1 px-2 text-right"><input class="w-16 text-right text-[13px] py-1 px-1 border border-outline-variant rounded bg-surface-container-lowest wm-rend" type="text" value="' + rend + '"/></td>' +
        '<td class="py-1 px-2 text-right"><input class="w-20 text-right text-[13px] py-1 px-2 border border-outline-variant rounded bg-surface-container-lowest wm-price" type="text" value="' + price.toFixed(2) + '"/></td>' +
        '<td class="py-1 px-2 text-right font-medium text-primary-container wm-sub">Q ' + sub + '</td>' +
        '<td class="py-1 px-2 text-center"><button class="wm-del-row text-error hover:text-error" title="Eliminar renglon" style="background:none;border:none;cursor:pointer;min-height:0;padding:2px"><span class="material-symbols-outlined" style="font-size:16px">delete</span></button></td>';
      return tr;
    }

    function attachRowListeners(tr, doc) {
      const rendEl  = tr.querySelector(".wm-rend");
      const priceEl = tr.querySelector(".wm-price");
      const subEl   = tr.querySelector(".wm-sub");
      const recalc  = () => {
        const r = parseFloat((rendEl.value||"0").replace(/,/g,"")) || 0;
        const p = parseFloat((priceEl.value||"0").replace(/,/g,"")) || 0;
        subEl.textContent = "Q " + (r * p).toFixed(2);
        recalculateTotals(doc);
      };
      rendEl.addEventListener("input", recalc);
      priceEl.addEventListener("input", recalc);
      tr.querySelector(".wm-del-row").addEventListener("click", () => {
        tr.remove();
        recalculateTotals(doc);
      });
    }

    function renderRows(tip) {
      const rows = APU_ROWS[tip] || APU_ROWS["Residencial"];
      const apuTable = findApuTable();
      if (!apuTable) return;

      // Asegurar que la tabla tenga los encabezados correctos
      let thead = apuTable.querySelector("thead");
      if (!thead) { thead = doc.createElement("thead"); apuTable.prepend(thead); }
      thead.innerHTML = '<tr class="border-b-2 border-outline-variant font-data-label text-caption text-secondary uppercase"><th class="py-2 px-2 font-normal text-left">Descripcion / Recurso</th><th class="py-2 px-2 font-normal text-left">Tipo</th><th class="py-2 px-2 font-normal text-right">Rend.</th><th class="py-2 px-2 font-normal text-right">Precio Unit. (Q)</th><th class="py-2 px-2 font-normal text-right">Subtotal</th><th class="py-2 px-2 font-normal text-center">Acc.</th></tr>';

      let tbody = apuTable.querySelector("tbody");
      if (!tbody) { tbody = doc.createElement("tbody"); apuTable.appendChild(tbody); }
      tbody.innerHTML = "";

      // Renderizar los 40 renglones en orden cronologico (orden del array)
      rows.forEach(([desc, unit, rend, price]) => {
        const tr = makeRow(doc, desc, unit, rend, price, false);
        tbody.appendChild(tr);
        attachRowListeners(tr, doc);
      });

      recalculateTotals(doc);
      ensureAddRowButton(doc, apuTable, tbody, tip);
    }

    function ensureAddRowButton(doc, apuTable, tbody, tip) {
      // Eliminar boton anterior si existe
      const existing = doc.getElementById("wm-add-row-btn");
      if (existing) existing.remove();

      const style = doc.getElementById("wm-add-row-style");
      if (!style) {
        const s = doc.createElement("style");
        s.id = "wm-add-row-style";
        s.textContent = "#wm-add-row-btn{display:flex;align-items:center;gap:8px;margin:10px 0;padding:8px 16px;background:#e9c176;color:#1a2b44;border:none;border-radius:6px;font:700 13px/1 Inter,sans-serif;cursor:pointer;transition:background .15s}#wm-add-row-btn:hover{background:#f0d090}";
        doc.head.appendChild(s);
      }

      const btn = doc.createElement("button");
      btn.id = "wm-add-row-btn";
      btn.type = "button";
      btn.innerHTML = '<span class="material-symbols-outlined" style="font-size:18px">add_circle</span> Agregar Renglon';
      btn.addEventListener("click", () => {
        const tr = makeRow(doc, "", "u", 1, 0, true);
        tbody.appendChild(tr);
        attachRowListeners(tr, doc);
        // Enfocar el campo de descripcion del nuevo renglon
        const descInput = tr.querySelector(".wm-desc");
        if (descInput) setTimeout(() => descInput.focus(), 50);
        recalculateTotals(doc);
      });

      // Insertar el boton despues de la tabla
      apuTable.parentNode.insertBefore(btn, apuTable.nextSibling);
    }

    // Render inicial
    renderRows(getActiveTip());

    // Re-render al cambiar tipologia
    Array.from(doc.querySelectorAll("button")).forEach(btn => {
      const lbl = (btn.textContent||"").trim();
      if (/^(Residencial|Comercial|Industrial|Civil|P.blica|Publica)$/i.test(lbl)) {
        btn.addEventListener("click", () => setTimeout(() => renderRows(getActiveTip()), 80));
      }
    });
  }
})();
