// CSS is loaded via <link> tags in index.html — no imports needed here
// Fixed logo path to use direct public path to avoid Vite asset hashing issues
// Use root-relative paths for all assets to ensure consistency across environments
const STITCH_ROOT = "/src/components/stitch";
const LOGO_PATH = "/src/components/stitch/modern_minimalist_logo_for_an_architecture_and_construction_company_named/logo-wm.png";
const DEFAULT_ROUTE = "login";
const AFTER_LOGIN_ROUTE = "dashboard";

(function () {
  "use strict";

  const routes = [
    { id: "login", label: "Acceso", icon: "login", path: `${STITCH_ROOT}/acceso_al_sistema_constructora_wm_m_s_2/code.html`, group: "Sistema", public: true },
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
    { id: "legacy-login", label: "Acceso v1", icon: "vpn_key", path: `${STITCH_ROOT}/acceso_al_sistema_constructora_wm_m_s_1/code.html`, group: "Sistema", public: true },
    { id: "management", label: "Sistema general", icon: "domain", path: `${STITCH_ROOT}/constructora_wm_m_s_management_system/code.html`, group: "Sistema" }
  ];

  const routeById = new Map(routes.map((route) => [route.id, route]));
  let iframe = null;
  let nav = null;
  let title = null;
  let status = null;
  let supabaseClient = null;
  let currentSession = null;

  function getConfig() {
    return window.CONSTRUCTORA_WM_CONFIG || {};
  }

  function getSupabase() {
    const config = getConfig();
    if (supabaseClient || !window.supabase || !isConfigured()) {
      return supabaseClient;
    }

    supabaseClient = window.supabase.createClient(config.supabaseUrl, config.supabaseAnonKey);
    return supabaseClient;
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
    if (!route.public && client && !currentSession && !isAuthCallback()) {
      setStatus("Inicia sesion para acceder a los modulos");
      navigate("login");
      return;
    }
    
    // Hide sidebar on login
    const shell = document.querySelector(".app-shell");
    if (route.id === "login" || route.id === "legacy-login") {
      shell.classList.add("is-login-screen");
    } else {
      shell.classList.remove("is-login-screen");
    }

    // Collapse sidebar after selecting a module (mobile or general retraction)
    if (!shell.classList.contains("is-collapsed") && route.id !== "login") {
      shell.classList.add("is-collapsed");
    }

    // Show loader
    const loader = document.getElementById("wm-loader-overlay");
    if (loader) loader.classList.add("active");
    iframe.classList.add("loading");

    iframe.src = route.path;
    title.textContent = route.label;

    iframe.onload = () => {
      const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
      if (!iframeDoc) return;

      const styles = document.querySelectorAll('link[rel="stylesheet"], style');
      styles.forEach(style => {
        const clone = style.cloneNode(true);
        if (clone.tagName === 'LINK' && clone.href) {
          const url = new URL(clone.href);
          clone.href = url.href;
        }
        iframeDoc.head.appendChild(clone);
      });

      const cdnScript = iframeDoc.querySelector('script[src*="tailwindcss.com"]');
      if (cdnScript) cdnScript.remove();

      syncDarkModeToIframe();
      if (loader) loader.classList.remove("active");
      iframe.classList.remove("loading");
    };

    Array.from(nav.querySelectorAll("button[data-route]")).forEach((button) => {
      const active = button.dataset.route === route.id;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-current", active ? "page" : "false");
    });

    setStatus(isConfigured() ? "Supabase configurado" : "Modo demo: configura Supabase para autenticacion real");
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

    status = document.createElement("span");
    status.className = "app-status";

    headerRight.append(status, themeBtn);
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

  function normalizeStitchScreen(doc) {
    ensureGlobalStyle(doc);
    normalizeLanguage(doc);
    normalizeCurrency(doc);
    normalizeLogo(doc);
    doc.documentElement.lang = "es";
  }

  function ensureGlobalStyle(doc) {
    if (doc.getElementById("wm-global-style")) return;

    const style = doc.createElement("style");
    style.id = "wm-global-style";
    style.textContent = `
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
      html, body {
        font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif !important;
        letter-spacing: 0 !important;
        transition: background-color 0.3s ease, color 0.3s ease;
      }
      body {
        background: radial-gradient(900px 380px at 30% -10%, rgba(26,43,68,.10), transparent 70%),
                    radial-gradient(700px 300px at 85% 10%, rgba(233,193,118,.12), transparent 65%),
                    var(--wm-surface);
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
      body.dark-mode .text-slate-800, body.dark-mode .text-gray-900 {
        color: #f8fafc !important;
      }
      body.dark-mode .text-slate-500, body.dark-mode .text-gray-500 {
        color: #94a3b8 !important;
      }
      body.dark-mode border-slate-200, body.dark-mode .border-gray-200 {
        border-color: var(--wm-border) !important;
      }
      body {
        color: var(--wm-text);
      }
      h1, h2, h3, h4, h5, h6,
      .font-h1, .font-h2, .font-h3,
      [class*="font-['Inter']"] {
        font-family: Inter, system-ui, sans-serif !important;
        letter-spacing: 0 !important;
      }
      button, a, input, select, textarea {
        border-radius: 6px !important;
      }
      button {
        min-height: 36px;
      }
      button:not([disabled]) {
        cursor: pointer;
      }
      .wm-logo {
        width: auto;
        height: 44px;
        object-fit: contain;
        display: inline-block;
      }
      aside .wm-logo,
      header .wm-logo,
      .app-brand .wm-logo {
        height: 38px;
      }
      .wm-brand-lockup {
        display: flex;
        align-items: center;
        gap: 10px;
      }
      .wm-toast {
        position: fixed;
        right: 16px;
        bottom: 16px;
        z-index: 999999;
        max-width: 360px;
        background: var(--wm-primary);
        color: #fff;
        border: 1px solid rgba(255,255,255,.18);
        border-radius: 8px !important;
        padding: 10px 12px;
        font: 600 13px/1.35 Inter, system-ui, sans-serif;
        box-shadow: 0 12px 32px rgba(15, 23, 42, .24);
      }

      /* Professional cards across Stitch screens */
      .elevated-card,
      .bg-surface-container-lowest,
      .bg-white,
      .bg-surface,
      .bg-surface-container,
      .bg-surface-container-low,
      .bg-surface-container-high,
      .bg-surface-container-highest {
        border-radius: var(--wm-radius) !important;
        box-shadow: var(--wm-shadow-sm);
        border-color: var(--wm-border) !important;
      }
      .elevated-card:hover {
        box-shadow: var(--wm-shadow);
        transform: translateY(-1px);
        transition: box-shadow .2s ease, transform .2s ease;
      }
      table {
        border-radius: var(--wm-radius);
        overflow: hidden;
      }
      thead {
        background: rgba(26,43,68,.06) !important;
      }
      body.dark-mode thead {
        background: rgba(148,163,184,.10) !important;
      }

      /* Charts/graphics: keep them readable and responsive */
      svg, canvas, img {
        max-width: 100%;
        height: auto;
      }
      svg text {
        font-family: Inter, system-ui, sans-serif !important;
        letter-spacing: 0 !important;
      }
      .chart, [data-chart], .recharts-wrapper {
        max-width: 100%;
      }

      /* Mobile synthesis: tighter padding + no horizontal overflow */
      @media (max-width: 820px) {
        body {
          background: var(--wm-surface);
        }
        main, .p-container-padding, .p-section-gap {
          padding-left: 16px !important;
          padding-right: 16px !important;
        }
        table {
          display: block;
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
        }
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

  function patchLogin(doc) {
    const route = currentRouteId();
    if (route !== "login" && route !== "legacy-login") return;

    const form = doc.querySelector("form");
    if (!form) return;

    // Autofill admin email if empty
    const emailInput = doc.querySelector('input[type="email"], input[name="email"]');
    if (emailInput && !emailInput.value) {
      emailInput.value = "salazaroliveros@gmail.com";
    }

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      event.stopPropagation();

      const email = emailInput?.value || "";
      const password = doc.querySelector('input[type="password"], input[name="password"]')?.value || "";
      const client = getSupabase();

      if (!client) {
        showFrameToast(doc, "Supabase no esta configurado con URL y llave publica validas.");
        return;
      }

      if (email && password) {
        const { data, error } = await client.auth.signInWithPassword({ email, password });
        if (error) {
          setStatus(`Error de Supabase: ${error.message}`);
          showFrameToast(doc, `Error: ${error.message}`);
          return;
        }
        currentSession = data?.session || currentSession;
      }

      navigate(AFTER_LOGIN_ROUTE);
    }, true);

    const googleBtn = doc.querySelector("#btn-google-login");
    if (googleBtn) {
      googleBtn.addEventListener("click", async (e) => {
        e.preventDefault();
        e.stopPropagation();
        const client = getSupabase();
        if (!client) {
          showFrameToast(doc, "Supabase no esta configurado con URL y llave publica validas.");
          return;
        }

        // app.js runs in the PARENT window (not the iframe), so window === top window.
        // Use a clean origin (no hash) as redirectTo — Supabase will append its own
        // token hash parameters (e.g., #access_token=...) and our currentRouteId()
        // will detect them and route to the dashboard automatically.
        const cleanRedirectTo = window.location.origin + window.location.pathname;

        try {
          const { data, error } = await client.auth.signInWithOAuth({
            provider: 'google',
            options: {
              redirectTo: cleanRedirectTo,
              skipBrowserRedirect: true,
            }
          });

          if (error) {
            showFrameToast(doc, `Error Google Auth: ${error.message}`);
            return;
          }

          if (data?.url) {
            // Navigate the top-level window (parent) to the Google OAuth URL.
            // This avoids the "Unsafe attempt to load URL from frame" Chrome error.
            window.location.assign(data.url);
          }
        } catch (err) {
          showFrameToast(doc, `Error inesperado: ${err.message}`);
        }
      });
    }
  }

  function patchLinks(doc) {
    const textMap = [
      { test: /dashboard|centro de comando/i, route: "dashboard" },
      { test: /presupuesto|apu/i, route: "apu" },
      { test: /seguimiento|proyectos/i, route: "tracking" },
      { test: /cliente/i, route: "clients" },
      { test: /cronograma|schedule/i, route: "schedule" },
      { test: /alerta|notificacion/i, route: "alerts" },
      { test: /gastos|planilla|control operativo/i, route: "operations" },
      { test: /report|informe/i, route: "apu-report" },
      { test: /cerrar sesion|logout/i, route: "login" }
    ];

    Array.from(doc.querySelectorAll('a[href="#"], button')).forEach((element) => {
      if (element.closest("form")) return;
      const label = (element.textContent || "").replace(/\s+/g, " ").trim();
      const match = textMap.find((entry) => entry.test.test(label));
      if (!match) return;

      element.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        
        if (match.route === "login") {
          const client = getSupabase();
          if (client) client.auth.signOut();
        }
        
        navigate(match.route);
      }, true);
    });
  }

  function patchActions(doc) {
    Array.from(doc.querySelectorAll("button, a")).forEach((element) => {
      const label = (element.textContent || "").replace(/\s+/g, " ").trim().toLowerCase();

      if (/exportar csv|csv/.test(label)) {
        element.addEventListener("click", (event) => {
          event.preventDefault();
          event.stopPropagation();
          downloadCsv();
          showFrameToast(doc, "CSV exportado exitosamente.");
        }, true);
        return;
      }

      if (/pdf|informe formal|imprimir|exportar reporte/.test(label)) {
        element.addEventListener("click", (event) => {
          event.preventDefault();
          event.stopPropagation();
          iframe.contentWindow.print();
          showFrameToast(doc, "Preparando documento PDF...");
        }, true);
        return;
      }

      if (/whatsapp/.test(label)) {
        element.addEventListener("click", (event) => {
          event.preventDefault();
          event.stopPropagation();
          window.open("https://wa.me/?text=Reporte%20CONSTRUCTORA%20WM%2FM%26S%20listo%20para%20revision", "_blank", "noopener");
        }, true);
        return;
      }

      if (/nuevo proyecto|crear proyecto|agregar proyecto/.test(label)) {
        element.addEventListener("click", (event) => {
          event.preventDefault();
          event.stopPropagation();
          navigate("clients");
        }, true);
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
    const client = getSupabase();
    if (!client) return;
    if (!currentSession && route !== "login" && route !== "legacy-login") return;

    prepareKnownForms(doc, route);
    ensureModulePersistActions(doc, route, client);

    if (route === "dashboard") {
      try {
        const [{ count: projectCount }, { count: clientCount }, { data: expenses }] = await Promise.all([
          client.from("projects").select("id", { count: "exact", head: true }),
          client.from("clients").select("id", { count: "exact", head: true }),
          client.from("expenses").select("amount").limit(500)
        ]);

        updateMetricNearLabel(doc, /total de proyectos|proyectos/i, projectCount ?? 0);
        updateMetricNearLabel(doc, /clientes|cartera/i, clientCount ?? 0);

        const totalExpenses = (expenses || []).reduce((sum, item) => sum + parseNumber(item.amount), 0);
        if (totalExpenses > 0) {
          updateMetricNearLabel(doc, /gastos|expenses/i, `Q ${totalExpenses.toLocaleString("es-GT", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
        }
      } catch(e) {
        console.error("Supabase sync error", e);
        setStatus(formatDataError(e));
      }
    }

    Array.from(doc.querySelectorAll("form")).forEach((form) => {
      if (route === "login" || route === "legacy-login") return;

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
    
    // Auth State Listener
    const client = getSupabase();
    if (client) {
      client.auth.onAuthStateChange((event, session) => {
        console.log("Auth event:", event, "Session:", !!session);
        currentSession = session;
        if (session && (currentRouteId() === "login" || isAuthCallback())) {
          navigate(AFTER_LOGIN_ROUTE);
        } else if (!session && currentRouteId() !== "login" && currentRouteId() !== "legacy-login") {
          // Do not redirect to login if we are in the middle of processing an OAuth callback
          if (isAuthCallback()) {
            console.log("OAuth callback detected, skipping login redirect");
            return;
          }
          navigate("login");
        }
      });

      // Initial Session Check
      const { data: { session } } = await client.auth.getSession();
      currentSession = session;
      if (session && (currentRouteId() === "login" || currentRouteId() === "legacy-login")) {
        navigate(AFTER_LOGIN_ROUTE);
        return;
      }
      if (!session && !routeById.get(currentRouteId())?.public && !isAuthCallback()) {
        navigate("login");
        return;
      }

      // If we arrived with tokens in the URL hash, clean it up after Supabase processes it.
      // This avoids repeated parsing and reduces console noise.
      if (session && isAuthCallback()) {
        history.replaceState(null, "", window.location.pathname + "#/dashboard");
      }
      if (!session && isAuthCallback()) {
        setStatus("Auth recibido, pero no se pudo abrir sesion. Verifica la hora/fecha del dispositivo y vuelve a intentar.");
        history.replaceState(null, "", window.location.pathname + "#/login");
      }
    }

    window.addEventListener("hashchange", () => renderRoute(currentRouteId()));
    navigate(currentRouteId());
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
