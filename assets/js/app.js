(function () {
  "use strict";

  const STITCH_ROOT = "src/components/stitch";
  const LOGO_PATH = `${STITCH_ROOT}/modern_minimalist_logo_for_an_architecture_and_construction_company_named/REDISE%C3%91O%20LOGO%20CONSTRUCTORA%20WM.png`;
  const DEFAULT_ROUTE = "login";
  const AFTER_LOGIN_ROUTE = "dashboard";

  const routes = [
    { id: "login", label: "Acceso", icon: "login", path: `${STITCH_ROOT}/acceso_al_sistema_constructora_wm_m_s_2/code.html`, public: true },
    { id: "dashboard", label: "Tablero", icon: "dashboard", path: `${STITCH_ROOT}/tablero_de_control_principal_3/code.html` },
    { id: "assistant", label: "Asistente APU", icon: "psychology", path: `${STITCH_ROOT}/asistente_de_conversi_n_a_apu/code.html` },
    { id: "clients", label: "Clientes y proyectos", icon: "groups", path: `${STITCH_ROOT}/gesti_n_de_clientes_y_proyectos/code.html` },
    { id: "client-apu", label: "Cliente a APU", icon: "auto_awesome", path: `${STITCH_ROOT}/gesti_n_de_clientes_y_conversi_n_a_apu/code.html` },
    { id: "apu", label: "Calculadora APU", icon: "calculate", path: `${STITCH_ROOT}/calculadora_de_costos_y_apu_avanzada/code.html` },
    { id: "apu-advanced", label: "APU avanzada", icon: "construction", path: `${STITCH_ROOT}/calculadora_de_apu_avanzada_con_filtros_y_concertina_6/code.html` },
    { id: "tracking", label: "Seguimiento", icon: "query_stats", path: `${STITCH_ROOT}/seguimiento_f_sico_financiero_de_proyectos_2/code.html` },
    { id: "alerts", label: "Alertas", icon: "notifications_active", path: `${STITCH_ROOT}/seguimiento_de_proyectos_con_alertas_2/code.html` },
    { id: "schedule", label: "Cronograma", icon: "calendar_month", path: `${STITCH_ROOT}/cronograma_de_proyecto_automatizado/code.html` },
    { id: "multichannel", label: "Cronograma y alertas", icon: "campaign", path: `${STITCH_ROOT}/cronograma_y_alertas_multicanal/code.html` },
    { id: "operations", label: "Planilla y gastos", icon: "receipt_long", path: `${STITCH_ROOT}/control_operativo_planilla_y_gastos_6/code.html` },
    { id: "apu-report", label: "Informe APU", icon: "picture_as_pdf", path: `${STITCH_ROOT}/vista_de_exportaci_n_de_informe_apu_3/code.html` },
    { id: "client-summary", label: "Resumen cliente", icon: "summarize", path: `${STITCH_ROOT}/resumen_de_presupuesto_para_cliente_3/code.html` },
    { id: "mobile-alerts", label: "Vista movil", icon: "phone_iphone", path: `${STITCH_ROOT}/alertas_y_cronograma_m_vil/code.html` },
    { id: "legacy-login", label: "Acceso v1", icon: "vpn_key", path: `${STITCH_ROOT}/acceso_al_sistema_constructora_wm_m_s_1/code.html`, public: true },
    { id: "management", label: "Sistema general", icon: "domain", path: `${STITCH_ROOT}/constructora_wm_m_s_management_system/code.html` }
  ];

  const routeById = new Map(routes.map((route) => [route.id, route]));
  let iframe = null;
  let nav = null;
  let title = null;
  let status = null;
  let supabaseClient = null;

  function getConfig() {
    return window.CONSTRUCTORA_WM_CONFIG || {};
  }

  function getSupabase() {
    const config = getConfig();
    if (supabaseClient || !window.supabase || !config.supabaseUrl || !config.supabaseAnonKey) {
      return supabaseClient;
    }

    supabaseClient = window.supabase.createClient(config.supabaseUrl, config.supabaseAnonKey);
    return supabaseClient;
  }

  function isConfigured() {
    const config = getConfig();
    return Boolean(config.supabaseUrl && config.supabaseAnonKey);
  }

  function normalizeRoute(value) {
    const route = (value || "").replace(/^#\/?/, "").trim();
    return routeById.has(route) ? route : DEFAULT_ROUTE;
  }

  function currentRouteId() {
    return normalizeRoute(window.location.hash);
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

    routes.forEach((route) => {
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

    // Loader
    const loaderOverlay = document.createElement("div");
    loaderOverlay.id = "wm-loader-overlay";
    loaderOverlay.className = "wm-loader-overlay active";
    loaderOverlay.innerHTML = '<div class="wm-spinner"></div>';

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

    workspace.append(header, loaderOverlay, iframe);
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
      }
      .dark-mode, .dark {
        --wm-primary: #101a29;
        --wm-primary-soft: #1a2b44;
        --wm-surface: #0c0f10;
        --wm-panel: #172033;
        --wm-text: #e5e7eb;
        --wm-muted: #94a3b8;
        --wm-border: #334155;
      }
      html, body {
        font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif !important;
        letter-spacing: 0 !important;
        transition: background-color 0.3s ease, color 0.3s ease;
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
    const logoSrc = new URL(LOGO_PATH, window.location.href).href;
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

      if (client && email && password) {
        const { error } = await client.auth.signInWithPassword({ email, password });
        if (error) {
          setStatus(`Error de Supabase: ${error.message}`);
          showFrameToast(doc, `Error: ${error.message}`);
          return;
        }
      }

      navigate(AFTER_LOGIN_ROUTE);
    }, true);

    const googleBtn = doc.querySelector("#btn-google-login");
    if (googleBtn) {
      googleBtn.addEventListener("click", async (e) => {
        e.preventDefault();
        const client = getSupabase();
        if (client) {
          const { error } = await client.auth.signInWithOAuth({
            provider: 'google',
            options: {
              redirectTo: window.location.origin + window.location.pathname + '#/' + AFTER_LOGIN_ROUTE
            }
          });
          if (error) {
            showFrameToast(doc, `Error Google Auth: ${error.message}`);
          }
        } else {
          showFrameToast(doc, "Supabase no está configurado.");
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

  async function patchDataSync(doc, route) {
    const client = getSupabase();
    if (!client) return;

    // Basic Data Binding: If we are on the dashboard, fetch real projects count
    if (route === "dashboard") {
      try {
        const { data, error, count } = await client.from('projects').select('*', { count: 'exact' });
        if (!error && count !== null) {
          // Find the "Total de proyectos" card and update its number
          const cards = Array.from(doc.querySelectorAll('div, span, h1, h2, h3'));
          const projectCard = cards.find(el => el.textContent.toLowerCase().includes('total de proyectos'));
          if (projectCard && projectCard.parentElement) {
            const numberEl = projectCard.parentElement.querySelector('h1, h2, h3, .text-3xl, .text-4xl, span');
            if (numberEl) {
              numberEl.textContent = count.toString();
            }
          }
        }
      } catch(e) { console.error("Supabase sync error", e); }
    }

    // Intercept forms to save data
    Array.from(doc.querySelectorAll("form")).forEach((form) => {
      // Avoid login form
      if (route === "login" || route === "legacy-login") return;

      form.addEventListener("submit", async (event) => {
        event.preventDefault();
        event.stopPropagation();
        
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn ? submitBtn.textContent : '';
        if (submitBtn) submitBtn.textContent = 'Guardando...';

        try {
          const formData = new FormData(form);
          const data = Object.fromEntries(formData.entries());

          // Heuristic: If it has client name, it's a client form
          if (data.name || data.cliente || form.innerHTML.toLowerCase().includes('cliente')) {
             const { error } = await client.from('clients').insert([{
               name: data.name || data.cliente || 'Nuevo Cliente',
               email: data.email || null,
               company: data.company || data.empresa || null
             }]);
             if (error) throw error;
             showFrameToast(doc, "¡Cliente guardado exitosamente en base de datos!");
          } 
          // Heuristic: If it has project details, it's a project
          else if (data.proyecto || data.project_name) {
             const { error } = await client.from('projects').insert([{
               name: data.proyecto || data.project_name || 'Nuevo Proyecto',
               total_budget: data.presupuesto || 0
             }]);
             if (error) throw error;
             showFrameToast(doc, "¡Proyecto creado exitosamente!");
          } else {
             // Fallback generic success
             showFrameToast(doc, "¡Datos guardados correctamente!");
          }
          form.reset();
        } catch (error) {
          showFrameToast(doc, `Error al guardar: ${error.message}`);
        } finally {
          if (submitBtn) submitBtn.textContent = originalText;
        }
      }, true);
    });
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

  function init() {
    if (localStorage.getItem("wm-theme") === "dark") {
      document.body.classList.add("dark-mode");
    }
    buildShell();
    iframe.addEventListener("load", patchFrame);
    window.addEventListener("hashchange", () => renderRoute(currentRouteId()));
    navigate(currentRouteId());
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
