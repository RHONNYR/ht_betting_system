// Application State
const state = {
    token: localStorage.getItem('token') || null,
    username: localStorage.getItem('username') || null,
    bcvRate: 0.0,
    bcvSource: 'Oficial',
    capitalItems: [],
    titulares: [],
    currentCalculatedCiclo: null,
    currentCalculatedRemesa: null,
    lastRemesaSource: 'margin',
    divisasCompradasManuallyEdited: false,
    clientes: [],
    personalUnlocked: false,
    currentPinEntered: ""
};

// DOM Elements
const els = {
    loginScreen: document.getElementById('login-screen'),
    appContainer: document.getElementById('app-container'),
    loginForm: document.getElementById('login-form'),
    loginError: document.getElementById('login-error'),
    btnLogout: document.getElementById('btn-logout'),
    
    // BCV elements
    bcvRateDisplay: document.getElementById('bcv-rate-display'),
    bcvSource: document.getElementById('bcv-source'),
    btnEditBcv: document.getElementById('btn-edit-bcv'),
    modalBcv: document.getElementById('modal-bcv'),
    modalBcvInput: document.getElementById('modal-bcv-input'),
    btnSaveModalBcv: document.getElementById('btn-save-modal-bcv'),
    btnCloseModalBcv: document.getElementById('btn-close-modal-bcv'),
    
    // Tabs
    tabLinks: document.querySelectorAll('.tab-link'),
    tabPanes: document.querySelectorAll('.tab-pane'),
    subTabLinks: document.querySelectorAll('.sub-tab-link'),
    subTabPanes: document.querySelectorAll('.sub-tab-pane'),
    
    // Capital Tab
    capitalTableBody: document.getElementById('capital-table-body'),
    totalCapitalUsd: document.getElementById('total-capital-usd'),
    totalCapitalSimulado: document.getElementById('total-capital-simulado'),
    capitalForm: document.getElementById('capital-form'),
    btnSnapshotCapital: document.getElementById('btn-snapshot-capital'),
    btnResetCapitalInputs: document.getElementById('btn-reset-capital-inputs'),
    
    // Cards Container
    cardsContainer: document.getElementById('cards-container'),
    
    // Calculator Form
    calcForm: document.getElementById('ciclo-calculator-form'),
    calcUsdtVendidos: document.getElementById('calc-usdt-vendidos'),
    calcTasaVenta: document.getElementById('calc-tasa-venta'),
    calcBancoVenta: document.getElementById('calc-banco-venta'),
    
    // BCV Simulator Form & Results
    simBcvBanco: document.getElementById('sim-bcv-banco'),
    simBcvTerceraEdad: document.getElementById('sim-bcv-tercera-edad'),
    simBcvComision: document.getElementById('sim-bcv-comision'),
    simBcvTasa: document.getElementById('sim-bcv-tasa'),
    simBcvLimite: document.getElementById('sim-bcv-limite'),
    simBcvModo: document.getElementById('sim-bcv-modo'),
    simBcvMonto: document.getElementById('sim-bcv-monto'),
    simBcvMontoLabel: document.getElementById('sim-bcv-monto-label'),
    simResPrincipalLabel: document.getElementById('sim-res-principal-label'),
    simResPrincipalValue: document.getElementById('sim-res-principal-value'),
    simResEquivLabel: document.getElementById('sim-res-equiv-label'),
    simResEquivMonto: document.getElementById('sim-res-equiv-monto'),
    simResComisionVes: document.getElementById('sim-res-comision-ves'),
    simResTotalVes: document.getElementById('sim-res-total-ves'),
    simResCuentasValue: document.getElementById('sim-res-cuentas-value'),
    simResCuentasDesc: document.getElementById('sim-res-cuentas-desc'),
    calcTarjetaCompra: document.getElementById('calc-tarjeta-compra'),
    calcDivisasCompradas: document.getElementById('calc-divisas-compradas'),
    calcDivisasProcesadas: document.getElementById('calc-divisas-procesadas'),
    calcTransferenciasVes: document.getElementById('calc-transferencias-ves'),
    calcPagoMovilAuto: document.getElementById('calc-pago-movil-auto'),
    calcTerceraEdad: document.getElementById('calc-tercera-edad'),
    calcRolP2p: document.getElementById('calc-rol-p2p'),
    btnCalcConsultarP2p: document.getElementById('btn-calc-consultar-p2p'),
    btnCalcularCiclo: document.getElementById('btn-calcular-ciclo'),
    btnGuardarCiclo: document.getElementById('btn-guardar-ciclo'),
    btnAbrirSobreCiclo: document.getElementById('btn-abrir-sobre-ciclo'),
    activeEnvelopesCard: document.getElementById('active-envelopes-card'),
    activeEnvelopesList: document.getElementById('active-envelopes-list'),
    calcResultsPreview: document.getElementById('calc-results-preview'),
    
    // Envelopes Modals
    modalCompraParcial: document.getElementById('modal-compra-parcial'),
    compraParcialForm: document.getElementById('compra-parcial-form'),
    compraParcialTerceraEdad: document.getElementById('compra-parcial-tercera-edad'),
    btnCloseModalCompraParcial: document.getElementById('btn-close-modal-compra-parcial'),
    modalPivotVes: document.getElementById('modal-pivot-ves'),
    pivotVesForm: document.getElementById('pivot-ves-form'),
    btnCloseModalPivotVes: document.getElementById('btn-close-modal-pivot-ves'),
    
    modalEditarSnapshot: document.getElementById('modal-editar-snapshot'),
    editarSnapshotForm: document.getElementById('editar-snapshot-form'),
    btnCloseModalEditarSnapshot: document.getElementById('btn-close-modal-editar-snapshot'),
    
    
    modalEditarCiclo: document.getElementById('modal-editar-ciclo'),
    editarCicloForm: document.getElementById('editar-ciclo-form'),
    btnCloseModalEditarCiclo: document.getElementById('btn-close-modal-editar-ciclo'),
    
    // Stats Tab
    statsPeriodoSelect: document.getElementById('stats-periodo-select'),

    // History Tab
    ciclosTableBody: document.getElementById('ciclos-table-body'),
    totalGananciaCiclos: document.getElementById('total-ganancia-ciclos'),
    comprasTableBody: document.getElementById('compras-table-body'),
    capitalHistoryTableBody: document.getElementById('capital-history-table-body'),
    
    // Zelle elements
    zelleTableBody: document.getElementById('zelle-table-body'),
    zelleSaldoCalculado: document.getElementById('zelle-saldo-calculado'),
    zelleIngresosSemanales: document.getElementById('zelle-ingresos-semanales'),
    zelleEgresosSemanales: document.getElementById('zelle-egresos-semanales'),
    btnRegistrarZelleIngreso: document.getElementById('btn-registrar-zelle-ingreso'),
    btnRegistrarZelleEgreso: document.getElementById('btn-registrar-zelle-egreso'),
    modalZelleMovimiento: document.getElementById('modal-zelle-movimiento'),
    modalZelleTitle: document.getElementById('modal-zelle-title'),
    formZelleMovimiento: document.getElementById('form-zelle-movimiento'),
    modalZelleTipo: document.getElementById('modal-zelle-tipo'),
    modalZelleMonto: document.getElementById('modal-zelle-monto'),
    modalZelleTitular: document.getElementById('modal-zelle-titular'),
    modalZelleDetalle: document.getElementById('modal-zelle-detalle'),
    modalZelleFecha: document.getElementById('modal-zelle-fecha'),
    btnCloseModalZelle: document.getElementById('btn-close-modal-zelle'),
    
    // Remesas Elements
    remesaForm: document.getElementById('remesa-form'),
    remesaCliente: document.getElementById('remesa-cliente'),
    remesaClienteGenero: document.getElementById('remesa-cliente-genero'),
    autocompleteClientesList: document.getElementById('autocomplete-clientes-list'),
    btnAbrirAgenda: document.getElementById('btn-abrir-agenda'),
    modalAgenda: document.getElementById('modal-agenda'),
    btnCloseModalAgenda: document.getElementById('btn-close-modal-agenda'),
    modalEditarCliente: document.getElementById('modal-editar-cliente'),
    btnCloseModalEditarCliente: document.getElementById('btn-close-modal-editar-cliente'),
    btnCancelarModalEditarCliente: document.getElementById('btn-cancelar-modal-editar-cliente'),
    agendaEditForm: document.getElementById('agenda-edit-form'),
    agendaEditId: document.getElementById('agenda-edit-id'),
    agendaEditNombre: document.getElementById('agenda-edit-nombre'),
    agendaEditTelefono: document.getElementById('agenda-edit-telefono'),
    agendaEditGenero: document.getElementById('agenda-edit-genero'),
    agendaQuickAddForm: document.getElementById('agenda-quick-add-form'),
    agendaNuevoNombre: document.getElementById('agenda-nuevo-nombre'),
    agendaNuevoTelefono: document.getElementById('agenda-nuevo-telefono'),
    agendaNuevoGenero: document.getElementById('agenda-nuevo-genero'),
    agendaBuscar: document.getElementById('agenda-buscar'),
    agendaContactsList: document.getElementById('agenda-contacts-list'),
    remesaMontoUsd: document.getElementById('remesa-monto-usd'),
    remesaMargen: document.getElementById('remesa-margen'),
    remesaTasaCliente: document.getElementById('remesa-tasa-cliente'),
    remesaMetodoPago: document.getElementById('remesa-metodo-pago'),
    remesaBancoReceptor: document.getElementById('remesa-banco-receptor'),
    remesaCostoAdq: document.getElementById('remesa-costo-adq'),
    remesaComisionBin: document.getElementById('remesa-comision-bin'),
    remesaPagoMovilAuto: document.getElementById('remesa-pago-movil-auto'),
    remesaRolP2p: document.getElementById('remesa-rol-p2p'),
    remesaP2pRef: document.getElementById('remesa-p2p-ref'),
    btnConsultarP2p: document.getElementById('btn-consultar-p2p'),
    p2pRatesPanel: document.getElementById('p2p-rates-panel'),
    p2pRatesTableBody: document.getElementById('p2p-rates-table-body'),
    p2pAvgRateDisplay: document.getElementById('p2p-avg-rate-display'),
    btnUsarTasaP2pAvg: document.getElementById('btn-usar-tasa-p2p-avg'),
    remesaResultsDisplay: document.getElementById('remesa-results-display'),
    whatsappBoxContainer: document.getElementById('whatsapp-box-container'),
    remesaWhatsappText: document.getElementById('remesa-whatsapp-text'),
    btnCopiarRemesaText: document.getElementById('btn-copiar-remesa-text'),
    btnRegistrarRemesa: document.getElementById('btn-registrar-remesa'),
    remesasTableBody: document.getElementById('remesas-table-body'),
    totalVolumenRemesas: document.getElementById('total-volumen-remesas'),
    totalGananciaRemesas: document.getElementById('total-ganancia-remesas'),
    
    // Modals buttons and elements
    btnAddTitular: document.getElementById('btn-add-titular'),
    btnAddCard: document.getElementById('btn-add-card'),
    btnRegistrarCompraManual: document.getElementById('btn-registrar-compra-manual'),
    btnChangePasswordModal: document.getElementById('btn-change-password-modal'),
    
    modalTitular: document.getElementById('modal-titular'),
    modalTarjeta: document.getElementById('modal-tarjeta'),
    modalCompra: document.getElementById('modal-compra'),
    modalPassword: document.getElementById('modal-password'),
    
    titularForm: document.getElementById('titular-form'),
    tarjetaForm: document.getElementById('tarjeta-form'),
    compraDivisaForm: document.getElementById('compra-divisa-form'),
    passwordForm: document.getElementById('password-form'),
    passwordError: document.getElementById('password-error'),
    passwordSuccess: document.getElementById('password-success'),
    
    btnCloseModalTitular: document.getElementById('btn-close-modal-titular'),
    btnCloseModalTarjeta: document.getElementById('btn-close-modal-tarjeta'),
    btnCloseModalCompra: document.getElementById('btn-close-modal-compra'),
    btnCloseModalPassword: document.getElementById('btn-close-modal-password')
};

// API Fetch Helper
async function apiCall(endpoint, method = 'GET', data = null) {
    const headers = {
        'Content-Type': 'application/json'
    };
    if (state.token && endpoint !== '/login') {
        headers['Authorization'] = `Bearer ${state.token}`;
    }
    
    const config = { method, headers };
    if (data) {
        config.body = JSON.stringify(data);
    }
    
    try {
        const response = await fetch(`/api${endpoint}`, config);
        if (response.status === 401 && endpoint !== '/login') {
            // Unauthenticated
            logout();
            throw new Error("Sesión expirada");
        }
        
        const resData = await response.json();
        if (!response.ok) {
            throw new Error(resData.detail || "Error en la petición");
        }
        return resData;
    } catch (error) {
        console.error(`API Error on ${endpoint}:`, error);
        throw error;
    }
}

window.showToast = function(message, type = 'success') {
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        container.style.position = 'fixed';
        container.style.bottom = '24px';
        container.style.right = '24px';
        container.style.zIndex = '9999';
        container.style.display = 'flex';
        container.style.flexDirection = 'column';
        container.style.gap = '8px';
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.style.background = type === 'error' ? 'rgba(239, 68, 68, 0.95)' : 'rgba(16, 185, 129, 0.95)';
    toast.style.color = '#ffffff';
    toast.style.padding = '12px 20px';
    toast.style.borderRadius = '8px';
    toast.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -2px rgba(0, 0, 0, 0.1)';
    toast.style.fontSize = '0.9rem';
    toast.style.fontWeight = '500';
    toast.style.minWidth = '250px';
    toast.style.transition = 'all 0.3s ease';
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(20px)';
    toast.style.backdropFilter = 'blur(8px)';
    toast.style.border = '1px solid rgba(255, 255, 255, 0.1)';
    
    const icon = type === 'error' ? '❌' : '✅';
    toast.innerHTML = `<span style="margin-right: 8px;">${icon}</span> ${message}`;

    container.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '1';
        toast.style.transform = 'translateY(0)';
    }, 10);

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(-20px)';
        setTimeout(() => {
            toast.remove();
        }, 300);
    }, 3500);
};

// Authentication handlers
function checkAuth() {
    if (state.token) {
        els.loginScreen.classList.add('hidden');
        els.appContainer.classList.remove('hidden');
        initDashboard();
    } else {
        els.loginScreen.classList.remove('hidden');
        els.appContainer.classList.add('hidden');
    }
}

async function handleLogin(e) {
    e.preventDefault();
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const username = usernameInput ? usernameInput.value.trim() : '';
    const password = passwordInput ? passwordInput.value.trim() : '';
    
    els.loginError.classList.add('hidden');
    
    try {
        const data = await apiCall('/login', 'POST', { username, password });
        state.token = data.token;
        state.username = data.username;
        localStorage.setItem('token', data.token);
        localStorage.setItem('username', data.username);
        checkAuth();
    } catch (err) {
        els.loginError.textContent = err.message || "Usuario o contraseña incorrectos";
        els.loginError.classList.remove('hidden');
    }
}

function logout() {
    state.token = null;
    state.username = null;
    state.personalUnlocked = false;
    state.currentPinEntered = "";
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    checkAuth();
}

// Initialization
async function initDashboard() {
    try {
        await Promise.all([
            fetchBCV(),
            loadCapital(),
            loadTitularesAndCards(),
            loadCiclos(),
            loadActiveEnvelopes(),
            loadCompras(),
            loadCapitalSnapshots(),
            loadRemesas(),
            loadClientes()
        ]);
        
        await loadAndRenderCharts();
        
        if (els.remesaP2pRef && (!els.remesaP2pRef.value || parseFloat(els.remesaP2pRef.value) <= 0)) {
            handleConsultarP2P();
        }
    } catch (err) {
        console.error("Error loading dashboard concurrently:", err);
    }
}

// BCV Handlers
async function fetchBCV() {
    try {
        const data = await apiCall('/bcv');
        state.bcvRate = data.rate;
        state.bcvSource = data.source;
        
        els.bcvRateDisplay.textContent = `${state.bcvRate.toFixed(2)} Bs`;
        els.bcvSource.textContent = state.bcvSource;
        if (state.bcvSource === 'Manual') {
            els.bcvSource.className = 'badge text-glow text-danger';
        } else {
            els.bcvSource.className = 'badge text-glow text-success';
        }
        
        // Handle Toggles for Today/Tomorrow rate
        const bcvToggles = document.getElementById('bcv-toggles');
        const btnBcvToday = document.getElementById('btn-bcv-today');
        const btnBcvTomorrow = document.getElementById('btn-bcv-tomorrow');
        
        if (bcvToggles && btnBcvToday && btnBcvTomorrow) {
            if (data.has_tomorrow && state.bcvSource !== 'Manual') {
                bcvToggles.classList.remove('hidden');
                
                // Style Today button
                if (data.active_mode === 'today') {
                    btnBcvToday.style.background = 'var(--primary-color)';
                    btnBcvToday.style.color = '#ffffff';
                    btnBcvTomorrow.style.background = 'var(--bg-hover)';
                    btnBcvTomorrow.style.color = 'var(--text-secondary)';
                } else {
                    btnBcvToday.style.background = 'var(--bg-hover)';
                    btnBcvToday.style.color = 'var(--text-secondary)';
                    btnBcvTomorrow.style.background = 'var(--primary-color)';
                    btnBcvTomorrow.style.color = '#ffffff';
                }
                
                // Set titles to show rates on hover
                btnBcvToday.title = `Usar tasa de hoy: ${data.today_rate.toFixed(2)} Bs`;
                btnBcvTomorrow.title = `Usar tasa de mañana: ${data.tomorrow_rate.toFixed(2)} Bs`;
            } else {
                bcvToggles.classList.add('hidden');
            }
        }
        
        updateSuggestedDivisas();
    } catch (err) {
        console.error("Error fetching BCV:", err);
    }
}

// Tab Switching
function handleTabSwitch(e) {
    const targetTab = e.target.getAttribute('data-tab');
    els.tabLinks.forEach(link => link.classList.remove('active'));
    els.tabPanes.forEach(pane => pane.classList.remove('active'));
    
    e.target.classList.add('active');
    document.getElementById(targetTab).classList.add('active');
    
    if (targetTab === 'tab-remesas') {
        if (els.remesaP2pRef && (!els.remesaP2pRef.value || parseFloat(els.remesaP2pRef.value) <= 0)) {
            handleConsultarP2P();
        }
    }
    if (targetTab === 'tab-personal') {
        if (!state.personalUnlocked) {
            clearPin();
        } else {
            loadPersonalFinanceData();
        }
    }
}

function handleSubTabSwitch(e) {
    const targetSubTab = e.target.getAttribute('data-subtab');
    els.subTabLinks.forEach(link => link.classList.remove('active'));
    els.subTabPanes.forEach(pane => pane.classList.remove('active'));
    e.target.classList.add('active');
    document.getElementById(targetSubTab).classList.add('active');
    
    if (targetSubTab === 'subtab-historial-zelle') {
        loadZelleMovimientos();
    }
    if (targetSubTab === 'subtab-simulador-bcv') {
        initBCVSimulator();
    }
}

// Load Capital Distribution
async function loadCapital() {
    try {
        const data = await apiCall('/capital');
        state.capitalItems = data.items;

        els.totalCapitalUsd.textContent = `$${data.totales.total_usd_equivalente.toLocaleString('es-VE', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
        els.totalCapitalSimulado.textContent = `$${data.totales.total_usd_simulado.toLocaleString('es-VE', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;

        // Define category groups
        function getGroupInfo(plataforma) {
            const name = plataforma.toLowerCase();
            if (name.includes('(usd)') && (name.includes('venezuela') || name.includes('provincial') || name.includes('mercantil') || name.includes('bancamiga'))) {
                return { id: 1, label: "🏦 Bancos Venezolanos en Dólares" };
            }
            if (name.includes('(ves)') && (name.includes('venezuela') || name.includes('provincial') || name.includes('mercantil') || name.includes('bancamiga'))) {
                return { id: 2, label: "🇻🇪 Bancos Venezolanos en Bolívares" };
            }
            if (name.includes('zelle') || name.includes('zinli') || name.includes('efectivo') || name.includes('panamá') || name.includes('panama') || name.includes('airtm') || name.includes('wally') || name.includes('paypal')) {
                return { id: 3, label: "💳 Monederos Digitales & Efectivo" };
            }
            if (name.includes('binance')) {
                return { id: 4, label: "🤖 Binance (USDT)" };
            }
            return { id: 5, label: "📦 Otras Cuentas" };
        }

        // Sort items by category group order, then alphabetically by platform name
        const sortedItems = [...state.capitalItems].sort((a, b) => {
            const grpA = getGroupInfo(a.plataforma);
            const grpB = getGroupInfo(b.plataforma);
            if (grpA.id !== grpB.id) {
                return grpA.id - grpB.id;
            }
            return a.plataforma.localeCompare(b.plataforma);
        });

        // Build table rows
        els.capitalTableBody.innerHTML = '';
        let currentGroupId = null;

        sortedItems.forEach(item => {
            const grp = getGroupInfo(item.plataforma);
            if (grp.id !== currentGroupId) {
                currentGroupId = grp.id;
                
                // Add category separator row
                const headerTr = document.createElement('tr');
                headerTr.className = 'table-group-header';
                headerTr.innerHTML = `
                    <td colspan="5">
                        ${grp.label}
                    </td>
                `;
                els.capitalTableBody.appendChild(headerTr);
            }

            const tr = document.createElement('tr');

            // Format simulation commission as percentage
            const comPct = parseFloat((item.comision_simulacion * 100).toFixed(2));

            // Columns ordered: Plataforma, Monto VES, Monto USD, Equiv. USD, Simulado USD
            tr.innerHTML = `
                <td><strong class="val-plat">${item.plataforma}</strong></td>
                <td>
                    ${item.convertir_ves ? `<input type="number" step="any" class="input-saldo-ves" data-id="${item.id}" value="${item.saldo_ves}">` : '<span class="text-muted">-</span>'}
                </td>
                <td>
                    <input type="number" step="any" class="input-saldo-usd" data-id="${item.id}" value="${item.saldo_usd}">
                </td>
                <td><span class="val-equiv">$${item.usd_equivalente.toLocaleString('es-VE', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span></td>
                <td><span class="val-sim">$${item.usd_simulado.toLocaleString('es-VE', {minimumFractionDigits: 2, maximumFractionDigits: 2})} <span class="text-muted" style="font-size:0.75rem;">(-${comPct}%)</span></span></td>
            `;
            els.capitalTableBody.appendChild(tr);
        });
    } catch (err) {
        console.error("Error loading capital:", err);
    }
}

function recalculateCapitalLive() {
    let totalUsdEquiv = 0.0;
    let totalUsdSimulado = 0.0;
    
    const rows = els.capitalTableBody.querySelectorAll('tr');
    rows.forEach(tr => {
        const usdInput = tr.querySelector('.input-saldo-usd');
        if (!usdInput) return;
        
        const id = parseInt(usdInput.getAttribute('data-id'));
        const item = state.capitalItems.find(c => c.id === id);
        if (!item) return;
        
        const usdVal = parseFloat(usdInput.value);
        const saldoUsd = isNaN(usdVal) ? 0.0 : usdVal;
        
        const vesInput = tr.querySelector('.input-saldo-ves');
        const vesVal = vesInput ? parseFloat(vesInput.value) : 0.0;
        const saldoVes = isNaN(vesVal) ? 0.0 : vesVal;
        
        let usdEquiv = saldoUsd;
        if (item.convertir_ves && state.bcvRate > 0) {
            usdEquiv += saldoVes / state.bcvRate;
        }
        
        const usdSimulado = usdEquiv * (1 - item.comision_simulacion);
        
        totalUsdEquiv += usdEquiv;
        totalUsdSimulado += usdSimulado;
        
        const cells = tr.querySelectorAll('td');
        if (cells.length >= 5) {
            cells[3].textContent = `$${usdEquiv.toLocaleString('es-VE', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
            
            const comPct = parseFloat((item.comision_simulacion * 100).toFixed(2));
            cells[4].innerHTML = `$${usdSimulado.toLocaleString('es-VE', {minimumFractionDigits: 2, maximumFractionDigits: 2})} <span class="text-muted" style="font-size:0.75rem;">(-${comPct}%)</span>`;
        }
    });
    
    els.totalCapitalUsd.textContent = `$${totalUsdEquiv.toLocaleString('es-VE', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
    els.totalCapitalSimulado.textContent = `$${totalUsdSimulado.toLocaleString('es-VE', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
}

async function handleCapitalSubmit(e) {
    e.preventDefault();
    const updates = [];
    
    const usdInputs = els.capitalTableBody.querySelectorAll('.input-saldo-usd');
    usdInputs.forEach(input => {
        const id = parseInt(input.getAttribute('data-id'));
        const usdVal = parseFloat(input.value);
        const saldo_usd = isNaN(usdVal) ? 0.0 : usdVal;
        
        const vesInput = els.capitalTableBody.querySelector(`.input-saldo-ves[data-id="${id}"]`);
        const vesVal = vesInput ? parseFloat(vesInput.value) : 0.0;
        const saldo_ves = isNaN(vesVal) ? 0.0 : vesVal;
        
        updates.push({ plataforma_id: id, saldo_usd, saldo_ves });
    });
    
    try {
        await apiCall('/capital', 'PUT', updates);
        const snap = await apiCall('/capital/snapshot', 'POST');
        alert(`Distribución de Capital y Foto Histórica guardadas con éxito. Total USD: $${snap.total_usd.toLocaleString('es-VE', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`);
        await loadCapital();
        await loadCapitalSnapshots();
    } catch (err) {
        alert("Error al actualizar capital: " + err.message);
    }
}

async function handleSnapshotCapital() {
    try {
        const data = await apiCall('/capital/snapshot', 'POST');
        alert(`Foto de Capital guardada con éxito. Total USD: $${data.total_usd.toFixed(2)}`);
        await loadCapitalSnapshots();
    } catch (err) {
        alert("Error al guardar foto: " + err.message);
    }
}

// Load Cards and Titulares
async function loadTitularesAndCards() {
    try {
        const titulares = await apiCall('/titulares');
        state.titulares = titulares;
        
        // Populate select cards in calculator and purchase manual modal
        els.calcTarjetaCompra.innerHTML = '';
        const selectCompra = document.getElementById('compra-tarjeta-select');
        selectCompra.innerHTML = '';
        
        const tarjetaFormSelect = document.getElementById('tarjeta-titular-select');
        tarjetaFormSelect.innerHTML = '';
        
        // Populate titular modal select
        titulares.forEach(tit => {
            const opt = document.createElement('option');
            opt.value = tit.id;
            opt.textContent = tit.nombre + (tit.tercera_edad ? ' (Tercera Edad)' : '');
            tarjetaFormSelect.appendChild(opt);
        });
        
        // Render cards grouped by Bank
        els.cardsContainer.innerHTML = '';
        const cardsByBank = {};

        titulares.forEach(tit => {
            if (tit.tarjetas && tit.tarjetas.length > 0) {
                tit.tarjetas.forEach(card => {
                    const bName = card.banco || 'Otros Bancos';
                    if (!cardsByBank[bName]) {
                        cardsByBank[bName] = [];
                    }
                    cardsByBank[bName].push({ card, titular: tit });

                    // Populate options in selects
                    const cardName = `${tit.nombre} - ${card.banco} (${card.tipo_tarjeta})`;
                    const opt = document.createElement('option');
                    opt.value = card.id;
                    opt.textContent = cardName;
                    opt.setAttribute('data-comision', card.comision_porcentaje);
                    opt.setAttribute('data-banco', card.banco);
                    opt.setAttribute('data-tercera-edad', tit.tercera_edad);

                    els.calcTarjetaCompra.appendChild(opt.cloneNode(true));
                    selectCompra.appendChild(opt);
                });
            }
        });

        const bankOrder = ['BDV', 'Provincial', 'Mercantil', 'Zinli'];
        const sortedBankKeys = Object.keys(cardsByBank).sort((a, b) => {
            let ia = bankOrder.indexOf(a);
            let ib = bankOrder.indexOf(b);
            if (ia === -1) ia = 99;
            if (ib === -1) ib = 99;
            return ia - ib;
        });

        if (sortedBankKeys.length === 0) {
            els.cardsContainer.innerHTML = '<div style="color: var(--text-muted); font-size: 0.85rem; padding: 1rem;">No hay tarjetas registradas aún. Haz clic en "➕ Agregar Tarjeta" para registrar tus cuentas.</div>';
        }

        sortedBankKeys.forEach(bankName => {
            const items = cardsByBank[bankName];
            if (!items || items.length === 0) return;

            const bankGroupDiv = document.createElement('div');
            bankGroupDiv.className = 'bank-group-container mb-4';
            bankGroupDiv.style.background = 'rgba(15, 23, 42, 0.25)';
            bankGroupDiv.style.border = '1px solid var(--border-color)';
            bankGroupDiv.style.borderRadius = '14px';
            bankGroupDiv.style.padding = '1.25rem';
            bankGroupDiv.style.display = 'flex';
            bankGroupDiv.style.flexDirection = 'column';
            bankGroupDiv.style.gap = '1rem';

            const bankHeaderHtml = `
                <div class="flex-row-align" style="justify-content: space-between; border-bottom: 1px solid rgba(255,255,255,0.06); padding-bottom: 0.6rem;">
                    <div class="flex-row-align" style="gap: 0.5rem;">
                        <span style="font-size: 1.1rem;">🏦</span>
                        <h3 style="margin: 0; font-size: 1rem; font-weight: 600; color: var(--primary-color);">${bankName}</h3>
                        <span class="badge" style="font-size: 0.72rem; background: rgba(59,130,246,0.12); color: #93c5fd; border: 1px solid rgba(59,130,246,0.25); padding: 2px 8px; border-radius: 12px;">
                            ${items.length} ${items.length === 1 ? 'cuenta' : 'cuentas'}
                        </span>
                    </div>
                </div>
            `;

            const cardsGridDiv = document.createElement('div');
            cardsGridDiv.style.display = 'grid';
            cardsGridDiv.style.gridTemplateColumns = 'repeat(auto-fill, minmax(260px, 1fr))';
            cardsGridDiv.style.gap = '1rem';

            items.forEach(({ card, titular: tit }) => {
                const monthlyConsumed = card.consumo_mensual || 0.0;
                const limit = card.limite_mensual || 0.0;
                const percentMensual = limit > 0 ? Math.min((monthlyConsumed / limit) * 100, 100) : 0;

                const dailyConsumed = card.consumo_diario || 0.0;
                const limitDiario = card.limite_diario || 0.0;
                const percentDiario = limitDiario > 0 ? Math.min((dailyConsumed / limitDiario) * 100, 100) : 0;

                let progressClassMensual = 'progress-normal';
                if (percentMensual > 90) progressClassMensual = 'progress-danger';
                else if (percentMensual > 70) progressClassMensual = 'progress-warning';

                let progressClassDiario = 'progress-normal';
                if (percentDiario > 90) progressClassDiario = 'progress-danger';
                else if (percentDiario > 70) progressClassDiario = 'progress-warning';

                const cardDiv = document.createElement('div');
                cardDiv.className = 'card-item-row';
                cardDiv.style.background = 'rgba(255, 255, 255, 0.03)';
                cardDiv.style.border = '1px solid rgba(255, 255, 255, 0.08)';
                cardDiv.style.borderRadius = '12px';
                cardDiv.style.padding = '1rem';
                cardDiv.style.display = 'flex';
                cardDiv.style.flexDirection = 'column';
                cardDiv.style.gap = '0.75rem';

                const isNearLimit = percentDiario > 85 || percentMensual > 85;
                const warningBadge = isNearLimit ? '<span class="senior-badge" style="font-size: 0.65rem; background: rgba(239,68,68,0.15); color: #ef4444; border: 1px solid rgba(239,68,68,0.3); padding: 2px 6px; border-radius: 4px; font-weight: 500;">⚠️ Límite Cercano</span>' : '';

                const commPctText = (card.comision_porcentaje * 100).toFixed(1);
                const commBadge = `<span style="font-size: 0.68rem; color: var(--text-muted); opacity: 0.8;">Comisión: ${commPctText}%</span>`;

                cardDiv.innerHTML = `
                    <div class="card-item-header" style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0;">
                        <div>
                            <span class="card-title" style="font-weight: 600; color: var(--text-primary); font-size: 0.95rem; display: block;">👤 ${tit.nombre}</span>
                            <span class="card-owner" style="font-size: 0.76rem; color: var(--primary-color); font-weight: 500;">${card.tipo_tarjeta}</span>
                        </div>
                        <div style="display: flex; gap: 4px; flex-wrap: wrap; align-items: center;">
                            ${tit.tercera_edad ? '<span class="senior-badge" style="font-size: 0.65rem; background: rgba(16,185,129,0.15); color: #10b981; border: 1px solid rgba(16,185,129,0.3); padding: 2px 6px; border-radius: 4px; font-weight: 500;">3ra Edad</span>' : ''}
                            ${warningBadge}
                            <button class="btn btn-sm" onclick="resetTitularLimitesDirect(${tit.id}, '${tit.nombre}')" style="padding: 2px 6px; font-size: 0.7rem; background: rgba(245,158,11,0.1); color: #f59e0b; border: 1px solid rgba(245,158,11,0.25);" title="Resetear consumos y límites de este titular a $0">🧹</button>
                            <button class="btn btn-sm" onclick="deleteCardDirect(${card.id})" style="padding: 2px 6px; font-size: 0.7rem; background: rgba(239,68,68,0.1); color: var(--text-danger); border: 1px solid rgba(239,68,68,0.15);" title="Eliminar esta tarjeta">🗑️</button>
                        </div>
                    </div>
                    
                    <!-- Límite Diario -->
                    <div style="display: flex; flex-direction: column; gap: 4px;">
                        <div style="display: flex; justify-content: space-between; font-size: 0.72rem; color: var(--text-secondary);">
                            <span>Límite Diario</span>
                            <span>$${dailyConsumed.toFixed(0)} / $${limitDiario.toFixed(0)}</span>
                        </div>
                        <div class="card-progress-bar-container" style="margin: 0; height: 6px; background: rgba(255,255,255,0.05); border-radius: 3px; overflow: hidden; width: 100%;">
                            <div class="card-progress-fill ${progressClassDiario}" style="width: ${percentDiario}%; height: 100%; border-radius: 3px; transition: width 0.3s ease;"></div>
                        </div>
                    </div>

                    <!-- Límite Mensual -->
                    <div style="display: flex; flex-direction: column; gap: 4px;">
                        <div style="display: flex; justify-content: space-between; font-size: 0.72rem; color: var(--text-secondary);">
                            <span>Límite Mensual</span>
                            <span>$${monthlyConsumed.toFixed(0)} / $${limit.toFixed(0)}</span>
                        </div>
                        <div class="card-progress-bar-container" style="margin: 0; height: 6px; background: rgba(255,255,255,0.05); border-radius: 3px; overflow: hidden; width: 100%;">
                            <div class="card-progress-fill ${progressClassMensual}" style="width: ${percentMensual}%; height: 100%; border-radius: 3px; transition: width 0.3s ease;"></div>
                        </div>
                    </div>
                    <div style="display: flex; justify-content: flex-end; margin-top: -2px;">
                        ${commBadge}
                    </div>
                `;
                cardsGridDiv.appendChild(cardDiv);
            });

            bankGroupDiv.innerHTML = bankHeaderHtml;
            bankGroupDiv.appendChild(cardsGridDiv);
            els.cardsContainer.appendChild(bankGroupDiv);
        });
        renderComprasLimits();
    } catch (err) {
        console.error("Error loading cards:", err);
    }
}

window.deleteCardDirect = async function(cardId) {
    if (!confirm("¿Estás seguro de que deseas eliminar esta tarjeta de tu lista?")) return;
    try {
        await apiCall(`/tarjetas/${cardId}`, 'DELETE');
        alert("Tarjeta eliminada con éxito.");
        await initDashboard();
    } catch (err) {
        alert(err.message || "Error al eliminar la tarjeta");
    }
};

window.resetTitularLimitesDirect = async function(titularId, titularNombre) {
    if (!confirm(`¿Estás seguro de que deseas resetear a $0.00 los consumos de tarjeta y límites de banco del titular ${titularNombre}? Podrás volver a vaciar tu data limpia.`)) return;
    try {
        const res = await apiCall(`/titulares/${titularId}/reset-limites`, 'POST');
        alert(res.message);
        await initDashboard();
    } catch (err) {
        alert(err.message || "Error al resetear límites del titular");
    }
};

function updateSuggestedDivisas() {
    if (state.divisasCompradasManuallyEdited) return;
    
    const usdt = parseFloat(els.calcUsdtVendidos.value);
    const tasa = parseFloat(els.calcTasaVenta.value);
    if (!isNaN(usdt) && !isNaN(tasa) && state.bcvRate > 0) {
        const binanceFeePct = 0.0025; // 0.25%
        const usdtNetos = usdt * (1 - binanceFeePct);
        const bsRecibidos = usdtNetos * tasa;
        
        // Get card properties (Tercera Edad exenta del 0.5% solo en Banco de Venezuela)
        let isTerceraEdad = false;
        let isBdv = false;
        if (els.calcTarjetaCompra && els.calcTarjetaCompra.selectedIndex >= 0) {
            const selectedOption = els.calcTarjetaCompra.options[els.calcTarjetaCompra.selectedIndex];
            if (selectedOption) {
                isTerceraEdad = selectedOption.getAttribute('data-tercera-edad') === 'true';
                const bank = (selectedOption.getAttribute('data-banco') || '').toLowerCase();
                isBdv = bank.includes('venezuela') || bank.includes('bdv');
            }
        }
        
        const compraComisionPct = (isTerceraEdad && isBdv) ? 0.0 : 0.005; // 0.5%
        const pmFeePct = (els.calcPagoMovilAuto && els.calcPagoMovilAuto.checked) ? 0.003 : 0.0; // 0.3%
        
        // Exact VES multiplier: Tasa BCV * (1 + compraComisionPct + pmFeePct)
        const costFactor = state.bcvRate * (1 + compraComisionPct + pmFeePct);
        const suggestedUSD = Math.floor(bsRecibidos / costFactor);
        
        els.calcDivisasCompradas.value = suggestedUSD > 0 ? suggestedUSD : '';
        els.calcDivisasProcesadas.value = suggestedUSD > 0 ? suggestedUSD : '';
    }
}

// Calculadora de Ciclos
function handleCalcularCiclo() {
    const usdtVendidos = parseFloat(els.calcUsdtVendidos.value);
    const tasaVenta = parseFloat(els.calcTasaVenta.value);
    const divisasCompradas = parseFloat(els.calcDivisasCompradas.value);
    const divisasProcesadas = parseFloat(els.calcDivisasProcesadas.value);
    let transferenciasVes = parseFloat(els.calcTransferenciasVes.value) || 0.0;
    
    if (isNaN(usdtVendidos) || isNaN(tasaVenta) || isNaN(divisasCompradas) || isNaN(divisasProcesadas)) {
        alert("Por favor, llena todos los campos numéricos obligatorios.");
        return;
    }
    
    // Get card properties
    const selectedOption = els.calcTarjetaCompra.options[els.calcTarjetaCompra.selectedIndex];
    if (!selectedOption) {
        alert("Por favor, selecciona una tarjeta de compra.");
        return;
    }
    
    const cardComisionPct = parseFloat(selectedOption.getAttribute('data-comision'));
    const isTerceraEdad = (els.calcTerceraEdad && els.calcTerceraEdad.checked) || (selectedOption.getAttribute('data-tercera-edad') === 'true');
    const bank = (selectedOption.getAttribute('data-banco') || '').toLowerCase();
    const isBdv = bank.includes('venezuela') || bank.includes('bdv');
    
    // 1. USDT Ventas
    const binanceFeePct = 0.0025; // 0.25%
    const usdtNetosRecibidos = usdtVendidos * (1 - binanceFeePct);
    const bolivaresRecibidos = usdtNetosRecibidos * tasaVenta;
    
    // 2. Compra Divisas Oficiales
    const compraComisionPct = (isTerceraEdad && isBdv) ? 0.0 : 0.005; // 0.5%
    const costoBaseVES = divisasCompradas * state.bcvRate;
    const comisionCompraVES = costoBaseVES * compraComisionPct;
    
    if (els.calcPagoMovilAuto.checked) {
        transferenciasVes = costoBaseVES * 0.003; // 0.3%
        els.calcTransferenciasVes.value = transferenciasVes.toFixed(2);
    }
    
    const bolivaresGastadosTotales = costoBaseVES + comisionCompraVES + transferenciasVes;
    
    // 3. Binance recarga
    const binanceDepositFeePct = 0.041; // 4.1%
    
    let montoDeduccionTarjeta = 0.0;
    let usdNetosDespuesTarjeta = divisasProcesadas;
    if (divisasProcesadas >= divisasCompradas && cardComisionPct > 0) {
        montoDeduccionTarjeta = divisasCompradas * cardComisionPct;
        usdNetosDespuesTarjeta = divisasCompradas - montoDeduccionTarjeta;
    } else if (divisasCompradas > divisasProcesadas) {
        montoDeduccionTarjeta = divisasCompradas - divisasProcesadas;
        usdNetosDespuesTarjeta = divisasProcesadas;
    }
    
    const comisionBinanceUsd = usdNetosDespuesTarjeta * binanceDepositFeePct;
    const usdNetosRecibidosBinance = usdNetosDespuesTarjeta - comisionBinanceUsd;
    
    // 4. Ciclo Resumen
    const ustdCostOfOperation = bolivaresGastadosTotales / tasaVenta;
    const gananciaUsd = usdNetosRecibidosBinance - ustdCostOfOperation;
    const gananciaPorcentaje = ustdCostOfOperation > 0 ? ((usdNetosRecibidosBinance / ustdCostOfOperation) - 1) * 100 : 0;
    const bolivaresRestantes = bolivaresRecibidos - bolivaresGastadosTotales;
    
    state.currentCalculatedCiclo = {
        usdt_vendidos: usdtVendidos,
        tasa_venta: tasaVenta,
        banco_venta: els.calcBancoVenta.value,
        divisas_compradas: divisasCompradas,
        tasa_bcv: state.bcvRate,
        comision_compra_ves: comisionCompraVES,
        transferencias_ves: transferenciasVes,
        usd_procesados_binance: divisasProcesadas,
        usd_recibidos_binance: usdNetosRecibidosBinance,
        ganancia_usd: gananciaUsd,
        ganancia_porcentaje: gananciaPorcentaje,
        bolivares_restantes: bolivaresRestantes
    };
    
    // Render preview
    const formatVES = (v) => `${v.toLocaleString('es-VE', {minimumFractionDigits: 2, maximumFractionDigits: 2})} VES`;
    const formatUSD = (u) => `$${u.toLocaleString('es-VE', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
    
    const profitClass = gananciaUsd >= 0 ? 'text-success' : 'text-danger';
    const brechaPct = ((tasaVenta / state.bcvRate) - 1) * 100;
    
    els.calcResultsPreview.innerHTML = `
        <div class="cycle-flow-container">
            <!-- Gap indicator -->
            <div class="gap-indicator-bar" style="display: flex; justify-content: space-between; align-items: center; background: var(--bg-hover); padding: 0.6rem 1rem; border-radius: 8px; margin-bottom: 1.25rem; border: 1px solid var(--border-color);">
                <span style="font-weight: 500; font-size: 0.85rem; color: var(--text-secondary);">Brecha Cambiaria (P2P vs BCV):</span>
                <span class="badge ${brechaPct >= 0 ? 'text-success' : 'text-danger'}" style="font-weight: 700; font-size: 0.9rem; padding: 4px 8px; border-radius: 6px; background: rgba(0,0,0,0.2);">
                    ${brechaPct >= 0 ? '+' : ''}${brechaPct.toFixed(2)}%
                </span>
            </div>

            <!-- Step 1: Venta P2P -->
            <div class="flow-step" style="background: rgba(255,255,255,0.015); border: 1px solid var(--border-color); border-radius: 10px; padding: 1rem; margin-bottom: 0.5rem;">
                <div class="flow-step-header" style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.75rem;">
                    <span class="flow-step-number" style="display: flex; align-items: center; justify-content: center; width: 24px; height: 24px; border-radius: 50%; background: var(--primary-color); color: #fff; font-size: 0.8rem; font-weight: 700;">1</span>
                    <h3 style="font-size: 0.95rem; margin: 0; font-weight: 600; color: var(--text-primary);">Fase 1: Venta en Binance P2P</h3>
                </div>
                <div class="flow-step-body" style="display: flex; flex-direction: column; gap: 0.4rem;">
                    <div class="flow-data-row" style="display: flex; justify-content: space-between; font-size: 0.85rem;">
                        <span style="color: var(--text-secondary);">Monto Vendido:</span>
                        <strong style="color: var(--text-primary);">${usdtVendidos.toFixed(2)} USDT</strong>
                    </div>
                    <div class="flow-data-row" style="display: flex; justify-content: space-between; font-size: 0.85rem;">
                        <span style="color: var(--text-secondary);">Tasa de Venta:</span>
                        <strong style="color: var(--text-primary);">${tasaVenta.toFixed(2)} Bs</strong>
                    </div>
                    <div class="flow-data-row" style="display: flex; justify-content: space-between; font-size: 0.85rem;">
                        <span style="color: var(--text-secondary);">Comisión Binance (0.25%):</span>
                        <span class="text-danger">-${(usdtVendidos * 0.0025).toFixed(2)} USDT</span>
                    </div>
                    <div class="flow-data-row highlight-row" style="display: flex; justify-content: space-between; font-size: 0.88rem; border-top: 1px dashed var(--border-color); padding-top: 0.4rem; margin-top: 0.2rem;">
                        <span style="font-weight: 500; color: var(--text-primary);">Bolívares Recibidos (Neto):</span>
                        <strong class="text-success">${formatVES(bolivaresRecibidos)}</strong>
                    </div>
                </div>
            </div>

            <div class="flow-connector" style="text-align: center; color: var(--text-secondary); font-size: 1rem; margin: 0.25rem 0;">⬇️</div>

            <!-- Step 2: Compra BCV -->
            <div class="flow-step" style="background: rgba(255,255,255,0.015); border: 1px solid var(--border-color); border-radius: 10px; padding: 1rem; margin-bottom: 0.5rem;">
                <div class="flow-step-header" style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.75rem;">
                    <span class="flow-step-number" style="display: flex; align-items: center; justify-content: center; width: 24px; height: 24px; border-radius: 50%; background: var(--primary-color); color: #fff; font-size: 0.8rem; font-weight: 700;">2</span>
                    <h3 style="font-size: 0.95rem; margin: 0; font-weight: 600; color: var(--text-primary);">Fase 2: Compra en Banco (Tasa BCV ${state.bcvRate.toFixed(4)})</h3>
                </div>
                <div class="flow-step-body" style="display: flex; flex-direction: column; gap: 0.4rem;">
                    <div class="flow-data-row" style="display: flex; justify-content: space-between; font-size: 0.85rem;">
                        <span style="color: var(--text-secondary);">Tarjeta / Titular:</span>
                        <strong style="color: var(--text-primary); text-overflow: ellipsis; overflow: hidden; white-space: nowrap; max-width: 200px;" title="${selectedOption.text}">${selectedOption.text}</strong>
                    </div>
                    <div class="flow-data-row" style="display: flex; justify-content: space-between; font-size: 0.85rem;">
                        <span style="color: var(--text-secondary);">Dólares Comprados:</span>
                        <strong style="color: var(--text-primary);">${formatUSD(divisasCompradas)}</strong>
                    </div>
                    <div class="flow-data-row" style="display: flex; justify-content: space-between; font-size: 0.85rem;">
                        <span style="color: var(--text-secondary);">Comisión Compra (${isTerceraEdad ? 'Exento' : '0.5%'}):</span>
                        <span style="color: var(--text-primary);">${formatVES(comisionCompraVES)}</span>
                    </div>
                    <div class="flow-data-row" style="display: flex; justify-content: space-between; font-size: 0.85rem;">
                        <span style="color: var(--text-secondary);">Gastos Transferencia / PM:</span>
                        <span style="color: var(--text-primary);">${formatVES(transferenciasVes)}</span>
                    </div>
                    <div class="flow-data-row highlight-row" style="display: flex; justify-content: space-between; font-size: 0.88rem; border-top: 1px dashed var(--border-color); padding-top: 0.4rem; margin-top: 0.2rem;">
                        <span style="font-weight: 500; color: var(--text-primary);">Bolívares Gastados Totales:</span>
                        <strong class="text-danger">${formatVES(bolivaresGastadosTotales)}</strong>
                    </div>
                    <div class="flow-data-row" style="display: flex; justify-content: space-between; font-size: 0.85rem; margin-top: 0.2rem;">
                        <span style="color: var(--text-secondary);">Saldo Restante en Banco:</span>
                        <span class="${bolivaresRestantes >= 0 ? 'text-success' : 'text-danger'}" style="font-weight: 600;">
                            ${formatVES(bolivaresRestantes)}
                        </span>
                    </div>
                </div>
            </div>

            <div class="flow-connector" style="text-align: center; color: var(--text-secondary); font-size: 1rem; margin: 0.25rem 0;">⬇️</div>

            <!-- Step 3: Binance fondeo -->
            <div class="flow-step" style="background: rgba(255,255,255,0.015); border: 1px solid var(--border-color); border-radius: 10px; padding: 1rem; margin-bottom: 1.25rem;">
                <div class="flow-step-header" style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.75rem;">
                    <span class="flow-step-number" style="display: flex; align-items: center; justify-content: center; width: 24px; height: 24px; border-radius: 50%; background: var(--primary-color); color: #fff; font-size: 0.8rem; font-weight: 700;">3</span>
                    <h3 style="font-size: 0.95rem; margin: 0; font-weight: 600; color: var(--text-primary);">Fase 3: Retorno a Binance</h3>
                </div>
                <div class="flow-step-body" style="display: flex; flex-direction: column; gap: 0.4rem;">
                    <div class="flow-data-row" style="display: flex; justify-content: space-between; font-size: 0.85rem;">
                        <span style="color: var(--text-secondary);">Dólares Procesados en Tarjeta:</span>
                        <strong style="color: var(--text-primary);">${formatUSD(divisasProcesadas)}</strong>
                    </div>
                    <div class="flow-data-row" style="display: flex; justify-content: space-between; font-size: 0.85rem;">
                        <span style="color: var(--text-secondary);">Deducción Tarjeta Banco (${(cardComisionPct * 100).toFixed(1)}%):</span>
                        <span class="text-danger">-${formatUSD(divisasProcesadas * cardComisionPct)}</span>
                    </div>
                    <div class="flow-data-row" style="display: flex; justify-content: space-between; font-size: 0.85rem;">
                        <span style="color: var(--text-secondary);">Neto Fondeado a Binance:</span>
                        <strong style="color: var(--text-primary);">${formatUSD(usdNetosDespuesTarjeta)}</strong>
                    </div>
                    <div class="flow-data-row" style="display: flex; justify-content: space-between; font-size: 0.85rem;">
                        <span style="color: var(--text-secondary);">Comisión Fondeo Binance (4.1% sobre $${usdNetosDespuesTarjeta.toFixed(2)}):</span>
                        <span class="text-danger">-${formatUSD(comisionBinanceUsd)}</span>
                    </div>
                    <div class="flow-data-row highlight-row" style="display: flex; justify-content: space-between; font-size: 0.88rem; border-top: 1px dashed var(--border-color); padding-top: 0.4rem; margin-top: 0.2rem;">
                        <span style="font-weight: 500; color: var(--text-primary);">USDT Netos Recibidos:</span>
                        <strong class="text-success">${usdNetosRecibidosBinance.toFixed(2)} USDT</strong>
                    </div>
                </div>
            </div>

            <!-- Step 4: ROI / Profit Summary -->
            <div class="flow-result-card" style="background: ${gananciaUsd >= 0 ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(5, 150, 105, 0.03))' : 'linear-gradient(135deg, rgba(239, 68, 68, 0.1), rgba(220, 38, 38, 0.03))'}; border: 1px solid ${gananciaUsd >= 0 ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}; border-radius: 12px; padding: 1.25rem;">
                <div class="result-title" style="font-size: 0.75rem; text-transform: uppercase; font-weight: 700; color: var(--text-secondary); letter-spacing: 0.05em; margin-bottom: 0.75rem; text-align: center;">RESULTADO FINAL DEL CICLO</div>
                <div class="result-values-grid" style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.75rem; text-align: center;">
                    <div class="result-val-box" style="background: rgba(0,0,0,0.15); padding: 0.5rem; border-radius: 8px;">
                        <span class="val-label" style="display: block; font-size: 0.7rem; color: var(--text-secondary); margin-bottom: 2px;">Costo Inversión:</span>
                        <strong style="color: var(--text-primary); font-size: 0.95rem;">${ustdCostOfOperation.toFixed(2)} USDT</strong>
                    </div>
                    <div class="result-val-box" style="background: rgba(0,0,0,0.15); padding: 0.5rem; border-radius: 8px;">
                        <span class="val-label" style="display: block; font-size: 0.7rem; color: var(--text-secondary); margin-bottom: 2px;">Retorno Final:</span>
                        <strong style="color: var(--text-primary); font-size: 0.95rem;">${usdNetosRecibidosBinance.toFixed(2)} USDT</strong>
                    </div>
                    <div class="result-val-box main-box" style="background: rgba(0,0,0,0.15); padding: 0.75rem 0.5rem; border-radius: 8px; grid-column: span 1; border: 1px solid ${gananciaUsd >= 0 ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'};">
                        <span class="val-label" style="display: block; font-size: 0.7rem; color: var(--text-secondary); margin-bottom: 2px;">Ganancia Neta:</span>
                        <strong class="${profitClass}" style="font-size: 1.25rem; font-weight: 700; display: block; filter: drop-shadow(0 0 8px ${gananciaUsd >= 0 ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'});">${formatUSD(gananciaUsd)}</strong>
                    </div>
                    <div class="result-val-box main-box" style="background: rgba(0,0,0,0.15); padding: 0.75rem 0.5rem; border-radius: 8px; grid-column: span 1; border: 1px solid ${gananciaUsd >= 0 ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'};">
                        <span class="val-label" style="display: block; font-size: 0.7rem; color: var(--text-secondary); margin-bottom: 2px;">Rendimiento (ROI):</span>
                        <strong class="${profitClass}" style="font-size: 1.25rem; font-weight: 700; display: block; filter: drop-shadow(0 0 8px ${gananciaUsd >= 0 ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'});">${gananciaPorcentaje.toFixed(2)}%</strong>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    els.btnGuardarCiclo.classList.remove('hidden');
    if (els.btnAbrirSobreCiclo) {
        els.btnAbrirSobreCiclo.classList.remove('hidden');
    }
}

async function handleGuardarCiclo() {
    if (!state.currentCalculatedCiclo) return;
    try {
        await apiCall('/ciclos', 'POST', state.currentCalculatedCiclo);
        alert("Ciclo registrado en el historial con éxito.");
        
        // Reset form
        els.calcForm.reset();
        els.btnGuardarCiclo.classList.add('hidden');
        if (els.btnAbrirSobreCiclo) els.btnAbrirSobreCiclo.classList.add('hidden');
        els.calcResultsPreview.innerHTML = `
            <div class="empty-state">
                <span class="large-icon">📊</span>
                <p>Introduce los datos y presiona "Calcular Ciclo" para ver los resultados.</p>
            </div>
        `;
        
        state.currentCalculatedCiclo = null;
        
        // Reload all data
        await initDashboard();
    } catch (err) {
        alert("Error al registrar ciclo: " + err.message);
    }
}

async function handleAbrirSobreCiclo() {
    if (!state.currentCalculatedCiclo) return;
    
    // Set status to "abierto" while preserving calculated initial purchase and remaining bolivars
    const openCicloData = {
        ...state.currentCalculatedCiclo,
        status: "abierto",
        bolivares_sobre_restantes: state.currentCalculatedCiclo.bolivares_restantes
    };
    
    // Link selected card
    if (els.calcTarjetaCompra && els.calcTarjetaCompra.selectedIndex >= 0) {
        const selectedOption = els.calcTarjetaCompra.options[els.calcTarjetaCompra.selectedIndex];
        if (selectedOption) {
            openCicloData.tarjeta_id = parseInt(selectedOption.value);
        }
    }
    
    try {
        await apiCall('/ciclos', 'POST', openCicloData);
        alert("Ciclo fraccionado iniciado. El sobre de bolívares se encuentra activo.");
        
        // Reset form
        els.calcForm.reset();
        els.btnGuardarCiclo.classList.add('hidden');
        if (els.btnAbrirSobreCiclo) els.btnAbrirSobreCiclo.classList.add('hidden');
        els.calcResultsPreview.innerHTML = `
            <div class="empty-state">
                <span class="large-icon">📊</span>
                <p>Introduce los datos y presiona "Calcular Ciclo" para ver los resultados.</p>
            </div>
        `;
        
        state.currentCalculatedCiclo = null;
        
        // Reload all data
        await initDashboard();
    } catch (err) {
        alert("Error al iniciar ciclo: " + err.message);
    }
}

async function loadActiveEnvelopes() {
    try {
        const activos = await apiCall('/ciclos/activos');
        if (activos.length > 0) {
            els.activeEnvelopesCard.classList.remove('hidden');
            els.activeEnvelopesList.innerHTML = '';
            
            activos.forEach(c => {
                const div = document.createElement('div');
                div.className = 'envelope-item-row';
                div.style.background = 'rgba(255, 255, 255, 0.02)';
                div.style.border = '1px solid var(--border-color)';
                div.style.borderRadius = '10px';
                div.style.padding = '1rem';
                div.style.display = 'flex';
                div.style.flexDirection = 'column';
                div.style.gap = '0.75rem';
                
                const initialVES = c.usdt_vendidos * 0.9975 * c.tasa_venta;
                const progressPct = initialVES > 0 ? ((initialVES - c.bolivares_sobre_restantes) / initialVES) * 100 : 0;
                
                let bankBadgesHtml = '';
                if (c.compras_parciales && c.compras_parciales.length > 0) {
                    const bankSummary = {};
                    c.compras_parciales.forEach(cp => {
                        const b = cp.banco ? cp.banco : 'BCV';
                        if (!bankSummary[b]) bankSummary[b] = 0;
                        bankSummary[b] += cp.usd_comprados;
                    });
                    const badges = Object.entries(bankSummary).map(([bName, usdVal]) => {
                        return `<span style="background: rgba(0, 112, 243, 0.12); color: #60a5fa; border: 1px solid rgba(0, 112, 243, 0.25); padding: 2px 6px; border-radius: 4px; font-size: 0.72rem; font-weight: 500;">🏦 ${bName}: $${usdVal.toFixed(2)}</span>`;
                    });
                    bankBadgesHtml = `<div style="display: flex; flex-wrap: wrap; gap: 4px; margin-top: 4px;">${badges.join('')}</div>`;
                }
                
                div.innerHTML = `
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <span style="font-weight: 600; font-size: 0.9rem; color: var(--text-primary);">📁 Sobre #${c.id} (${c.banco_venta})</span>
                        <span style="font-size: 0.72rem; color: var(--text-secondary);">Tasa venta P2P: ${c.tasa_venta.toFixed(2)} Bs</span>
                    </div>
                    
                    <div style="font-size: 0.82rem; color: var(--text-secondary); display: flex; flex-direction: column; gap: 0.25rem;">
                        <div style="display: flex; justify-content: space-between;">
                            <span>Bolívares Remanentes:</span>
                            <strong style="color: var(--text-primary);">${c.bolivares_sobre_restantes.toLocaleString('es-VE', {minimumFractionDigits: 2, maximumFractionDigits: 2})} VES</strong>
                        </div>
                        <div style="display: flex; justify-content: space-between;">
                            <span>Dólares acumulados:</span>
                            <strong style="color: var(--text-success);">$${c.divisas_compradas.toFixed(2)} USD</strong>
                        </div>
                        ${bankBadgesHtml}
                    </div>
                    
                    <!-- Progress Bar -->
                    <div style="width: 100%; height: 6px; background: rgba(255,255,255,0.05); border-radius: 3px; overflow: hidden;">
                        <div style="width: ${progressPct.toFixed(1)}%; height: 100%; background: var(--primary-color);"></div>
                    </div>

                    <!-- Collapsible Purchases List -->
                    ${c.compras_parciales && c.compras_parciales.length > 0 ? `
                    <div style="border-top: 1px solid var(--border-color); padding-top: 0.5rem; margin-top: 0.25rem; width: 100%;">
                        <details style="width: 100%;" open>
                            <summary style="font-size: 0.78rem; color: var(--primary-color); cursor: pointer; user-select: none; font-weight: 500; outline: none;">
                                📋 Compras registradas por Banco (${c.compras_parciales.length})
                            </summary>
                            <div style="display: flex; flex-direction: column; gap: 0.35rem; margin-top: 0.4rem; max-height: 140px; overflow-y: auto; padding-right: 0.25rem;">
                                ${c.compras_parciales.map(cp => `
                                    <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.75rem; color: var(--text-secondary); background: rgba(0,0,0,0.15); padding: 4px 8px; border-radius: 6px; border: 1px solid var(--border-color);">
                                        <span>🏦 <strong>${cp.banco || 'BCV'}</strong>: $${cp.usd_comprados.toFixed(2)} @ ${cp.tasa_bcv.toFixed(2)} Bs</span>
                                        <button onclick="deletePartialBuy(${cp.id})" style="background: none; border: none; color: var(--text-danger); cursor: pointer; padding: 2px 4px; font-size: 0.75rem; display: flex; align-items: center; justify-content: center;" title="Eliminar compra de ${cp.banco || 'banco'}">🗑️</button>
                                    </div>
                                `).join('')}
                            </div>
                        </details>
                    </div>
                    ` : ''}
                    
                    <!-- Actions -->
                    <div style="display: flex; gap: 0.5rem; justify-content: flex-end; margin-top: 0.25rem; width: 100%;">
                        <button class="btn btn-secondary" onclick="openPartialBuy(${c.id})" style="padding: 4px 10px; font-size: 0.75rem; font-weight: 500;">➕ Compra</button>
                        <button class="btn btn-secondary" onclick="openPivotVES(${c.id}, ${c.bolivares_sobre_restantes})" style="padding: 4px 10px; font-size: 0.75rem; font-weight: 500;">🔄 Pivotar</button>
                        <button class="btn btn-danger" onclick="closeEnvelopeManual(${c.id})" style="padding: 4px 10px; font-size: 0.75rem; font-weight: 500; background: rgba(239, 68, 68, 0.1); border-color: rgba(239, 68, 68, 0.2); color: var(--text-danger);">🔒 Cerrar</button>
                    </div>
                `;
                els.activeEnvelopesList.appendChild(div);
            });
        } else {
            els.activeEnvelopesCard.classList.add('hidden');
        }
    } catch (err) {
        console.error("Error loading active envelopes:", err);
    }
}

function updatePartialBuyPreview() {
    const previewContainer = document.getElementById('compra-parcial-preview');
    if (!previewContainer) return;
    
    const usd = parseFloat(document.getElementById('compra-parcial-usd').value) || 0;
    const tasa = parseFloat(document.getElementById('compra-parcial-tasa').value) || 0;
    const targetSelect = document.getElementById('compra-parcial-tarjeta');
    const applyPm = document.getElementById('compra-parcial-pago-movil') ? document.getElementById('compra-parcial-pago-movil').checked : false;
    const applyTercera = els.compraParcialTerceraEdad ? els.compraParcialTerceraEdad.checked : false;
    
    if (usd > 0 && tasa > 0 && targetSelect && targetSelect.selectedIndex >= 0) {
        const selectedOption = targetSelect.options[targetSelect.selectedIndex];
        const bancoText = selectedOption ? (selectedOption.getAttribute('data-banco') || 'Banco') : 'Banco';
        const isBdv = bancoText.toLowerCase().includes('venezuela') || bancoText.toLowerCase().includes('bdv');
        
        const costoBase = usd * tasa;
        const comisionCompra = (applyTercera && isBdv) ? 0.0 : (costoBase * 0.005);
        const comisionPm = applyPm ? (costoBase * 0.003) : 0.0;
        const totalVes = costoBase + comisionCompra + comisionPm;
        
        previewContainer.style.display = 'block';
        previewContainer.innerHTML = `
            <div style="display: flex; justify-content: space-between; font-weight: 500;">
                <span>🏦 Banco a registrar:</span>
                <strong style="color: var(--primary-color);">${bancoText}</strong>
            </div>
            <div style="display: flex; justify-content: space-between; margin-top: 2px;">
                <span>Deducción estimada del sobre:</span>
                <strong style="color: var(--text-danger);">${totalVes.toLocaleString('es-VE', {minimumFractionDigits: 2, maximumFractionDigits: 2})} VES</strong>
            </div>
            <div style="font-size: 0.72rem; color: var(--text-secondary); margin-top: 2px;">
                Costo Base: ${costoBase.toLocaleString('es-VE', {minimumFractionDigits: 2})} VES | Comision BDV: ${comisionCompra.toLocaleString('es-VE', {minimumFractionDigits: 2})} VES | PM: ${comisionPm.toLocaleString('es-VE', {minimumFractionDigits: 2})} VES
            </div>
        `;
    } else {
        previewContainer.style.display = 'none';
    }
}

window.openPartialBuy = function(cicloId) {
    document.getElementById('compra-parcial-ciclo-id').value = cicloId;
    document.getElementById('compra-parcial-usd').value = '';
    document.getElementById('compra-parcial-tasa').value = state.bcvRate;
    
    // Populate cards/banks dropdown
    const targetSelect = document.getElementById('compra-parcial-tarjeta');
    if (targetSelect && els.calcTarjetaCompra) {
        targetSelect.innerHTML = els.calcTarjetaCompra.innerHTML;
        if (targetSelect.selectedIndex >= 0) {
            const opt = targetSelect.options[targetSelect.selectedIndex];
            if (els.compraParcialTerceraEdad && opt) {
                els.compraParcialTerceraEdad.checked = (opt.getAttribute('data-tercera-edad') === 'true');
            }
        }
    }
    
    updatePartialBuyPreview();
    openModal(els.modalCompraParcial);
};

window.openPivotVES = function(cicloId, maxMonto) {
    document.getElementById('pivot-ves-ciclo-id').value = cicloId;
    document.getElementById('pivot-ves-monto').value = '';
    document.getElementById('pivot-ves-monto').max = maxMonto;
    
    // Populate cards
    const targetSelect = document.getElementById('pivot-ves-tarjeta-destino');
    if (targetSelect && els.calcTarjetaCompra) {
        targetSelect.innerHTML = els.calcTarjetaCompra.innerHTML;
    }
    
    openModal(els.modalPivotVes);
};

window.closeEnvelopeManual = async function(cicloId) {
    if (!confirm("¿Deseas cerrar este sobre? Si quedaron bolívares remanentes gastados fuera de arbitraje, la ganancia se fijará de forma real sobre los bolívares efectivamente invertidos en divisas.")) return;
    try {
        await apiCall(`/ciclos/${cicloId}/close`, 'POST');
        showToast("Sobre cerrado manteniendo la ganancia real.");
        await initDashboard();
    } catch (err) {
        alert(err.message);
    }
};

window.reabrirCiclo = async function(cicloId) {
    if (!confirm("¿Deseas reabrir este sobre para continuar registrando compras o ajustar su saldo?")) return;
    try {
        await apiCall(`/ciclos/${cicloId}/reopen`, 'POST');
        showToast("Sobre reabierto con éxito.");
        await initDashboard();
    } catch (err) {
        alert(err.message);
    }
};

window.cerrarCiclo = window.closeEnvelopeManual;

window.deletePartialBuy = async function(compraId) {
    if (!confirm("¿Estás seguro de que deseas eliminar esta compra parcial? Se restarán los dólares acumulados y se restaurarán los bolívares al sobre.")) return;
    try {
        await apiCall(`/ciclos/compras/${compraId}`, 'DELETE');
        alert("Compra parcial eliminada. Saldo restaurado con éxito.");
        await initDashboard();
    } catch (err) {
        alert(err.message);
    }
};

async function handleCompraParcialSubmit(e) {
    e.preventDefault();
    const cicloId = parseInt(document.getElementById('compra-parcial-ciclo-id').value);
    const usd = parseFloat(document.getElementById('compra-parcial-usd').value);
    const tasa = parseFloat(document.getElementById('compra-parcial-tasa').value);
    const applyPm = document.getElementById('compra-parcial-pago-movil').checked;
    
    if (isNaN(usd) || isNaN(tasa) || usd <= 0 || tasa <= 0) {
        alert("Por favor introduce montos válidos.");
        return;
    }
    
    const selectTarjeta = document.getElementById('compra-parcial-tarjeta');
    const selectedOption = selectTarjeta ? selectTarjeta.options[selectTarjeta.selectedIndex] : null;
    
    let cardComisionPct = 0.0;
    let isTerceraEdad = false;
    let bancoText = "BCV";
    let tarjetaIdVal = null;
    let selectedTarjetaData = null;
    
    if (selectedOption) {
        tarjetaIdVal = parseInt(selectedOption.value);
        cardComisionPct = parseFloat(selectedOption.getAttribute('data-comision')) || 0.0;
        isTerceraEdad = selectedOption.getAttribute('data-tercera-edad') === 'true';
        bancoText = selectedOption.getAttribute('data-banco') || "Banco";
        
        // Find card limits data in local state
        if (state.titulares) {
            for (const t of state.titulares) {
                const foundCard = t.tarjetas.find(c => c.id === tarjetaIdVal);
                if (foundCard) {
                    selectedTarjetaData = foundCard;
                    break;
                }
            }
        }
    }
    
    const usdProcesadosCard = usd * (1 - cardComisionPct);

    // Check card limit warnings
    if (selectedTarjetaData) {
        const dailyRemaining = selectedTarjetaData.limite_diario - selectedTarjetaData.consumo_diario;
        const monthlyRemaining = selectedTarjetaData.limite_mensual - selectedTarjetaData.consumo_mensual;
        
        if (usdProcesadosCard > dailyRemaining || usdProcesadosCard > monthlyRemaining) {
            const warningMsg = `⚠️ ADVERTENCIA DE LÍMITES DE TARJETA:\n` +
                               `Esta compra procesará $${usdProcesadosCard.toFixed(2)} en la tarjeta (comprado al banco: $${usd.toFixed(2)}).\n` +
                               `Supera el cupo disponible de la tarjeta:\n` +
                               `- Cupo Diario Disponible: $${Math.max(0, dailyRemaining).toFixed(2)}\n` +
                               `- Cupo Mensual Disponible: $${Math.max(0, monthlyRemaining).toFixed(2)}\n\n` +
                               `¿Deseas proceder con el registro de todas formas?`;
            if (!confirm(warningMsg)) {
                return;
            }
        }
    }
    
    const applyTerceraEdad = (els.compraParcialTerceraEdad && els.compraParcialTerceraEdad.checked) || isTerceraEdad;
    const isBdv = (bancoText || '').toLowerCase().includes('venezuela') || (bancoText || '').toLowerCase().includes('bdv');
    const compraComisionPct = (applyTerceraEdad && isBdv) ? 0.0 : 0.005; // 0.5%
    const costoBaseVES = usd * tasa;
    const comisionCompraVES = costoBaseVES * compraComisionPct;
    const transferenciasVes = applyPm ? (costoBaseVES * 0.003) : 0.0;
    
    const binanceDepositFeePct = 0.041; // 4.1%
    const usdNetosRecibidosBinance = usdProcesadosCard * (1 - binanceDepositFeePct);
    
    const payload = {
        usd_comprados: usd,
        usd_procesados: usdProcesadosCard,
        tasa_bcv: tasa,
        comision_compra_ves: comisionCompraVES,
        transferencias_ves: transferenciasVes,
        usd_recibidos_binance: usdNetosRecibidosBinance,
        banco: bancoText,
        tarjeta_id: tarjetaIdVal
    };
    
    try {
        const res = await apiCall(`/ciclos/${cicloId}/compras`, 'POST', payload);
        showToast(res.message);
        closeModal(els.modalCompraParcial);
        await initDashboard();
    } catch (err) {
        showToast(err.message, "danger");
    }
}

async function handlePivotVESSubmit(e) {
    e.preventDefault();
    const cicloId = parseInt(document.getElementById('pivot-ves-ciclo-id').value);
    const monto = parseFloat(document.getElementById('pivot-ves-monto').value);
    const cardDestinoId = parseInt(document.getElementById('pivot-ves-tarjeta-destino').value);
    
    if (isNaN(monto) || monto <= 0 || isNaN(cardDestinoId)) {
        alert("Por favor ingresa montos y tarjeta de destino válidos.");
        return;
    }
    
    const transferFeeVES = monto * 0.003;
    
    try {
        await apiCall(`/ciclos/${cicloId}/pivot`, 'POST', {
            tarjeta_destino_id: cardDestinoId,
            monto_ves_transferido: monto,
            comision_transferencia_ves: transferFeeVES
        });
        alert("Transferencia interbancaria registrada y vinculada a la nueva tarjeta con éxito.");
        closeModal(els.modalPivotVes);
        await initDashboard();
    } catch (err) {
        alert(err.message);
    }
}

// Historial tabs loads
async function loadCiclos() {
    try {
        const ciclos = await apiCall('/ciclos');
        state.ciclos = ciclos || [];
        renderCiclosTable();
    } catch (err) {
        console.error("Error loading ciclos:", err);
    }
}

function renderCiclosTable() {
    if (!els.ciclosTableBody) return;
    els.ciclosTableBody.innerHTML = '';
    
    const filterSelect = document.getElementById('filter-periodo-ciclos');
    const period = filterSelect ? filterSelect.value : 'historico';
    
    let totalGain = 0.0;
    
    const data = state.ciclos || [];
    data.forEach(c => {
        if (!isDateInPeriod(c.fecha, period)) return;
        
        totalGain += c.ganancia_usd;
        const tr = document.createElement('tr');
        tr.className = 'main-row-ciclo';
        if (c.status === 'abierto') {
            tr.classList.add('ciclo-abierto');
        } else {
            tr.classList.add('ciclo-completado');
        }
        const profitClass = c.ganancia_usd >= 0 ? 'text-success' : 'text-danger';
        
        const statusBadge = c.status === 'abierto'
            ? ` <span class="badge" style="font-size: 0.7rem; background: rgba(245,158,11,0.15); color: #f59e0b; padding: 2px 6px; border-radius: 4px; border: 1px solid rgba(245,158,11,0.3);">Abierto</span>`
            : '';
            
        let tasaBcvCell = '';
        let avgRate = c.tasa_bcv;
        if (c.compras_parciales && c.compras_parciales.length > 0) {
            const totalUsd = c.divisas_compradas || 0.0;
            let weightedSum = 0;
            c.compras_parciales.forEach(cp => {
                weightedSum += cp.usd_comprados * cp.tasa_bcv;
            });
            avgRate = totalUsd > 0 ? (weightedSum / totalUsd) : c.tasa_bcv;
            tasaBcvCell = `<strong>${avgRate.toFixed(2)}</strong>`;
        } else {
            tasaBcvCell = `<strong>${c.tasa_bcv.toFixed(2)}</strong>`;
        }
        
        const actionToggle = c.status === 'abierto'
            ? `<button class="btn btn-warning" onclick="cerrarCiclo(${c.id})" style="padding: 4px 8px; font-size: 0.75rem; background: rgba(245,158,11,0.15); border-color: rgba(245,158,11,0.3); color: #f59e0b;" title="Cerrar sobre y fijar ganancia real sobre fondos invertidos">🔒 Cerrar</button>`
            : `<button class="btn btn-success" onclick="reabrirCiclo(${c.id})" style="padding: 4px 8px; font-size: 0.75rem; background: rgba(16,185,129,0.15); border-color: rgba(16,185,129,0.3); color: #10b981;" title="Reabrir sobre para continuar compras o ajustar">🔓 Reabrir</button>`;

        tr.innerHTML = `
            <td><strong>${c.fecha}</strong></td>
            <td>${c.usdt_vendidos.toFixed(2)}</td>
            <td>${c.tasa_venta.toFixed(2)}</td>
            <td><span style="font-weight:600; color: var(--primary-color);">🏦 Venta: ${c.banco_venta}</span>${statusBadge}</td>
            <td><strong style="color: var(--text-primary); font-size: 0.9rem;">$${c.divisas_compradas.toFixed(2)}</strong></td>
            <td>${tasaBcvCell}</td>
            <td><strong style="color: var(--text-primary); font-size: 0.9rem;">$${c.usd_recibidos_binance.toFixed(2)}</strong></td>
            <td class="${profitClass}"><strong>$${c.ganancia_usd.toFixed(2)}</strong></td>
            <td class="${profitClass}"><strong>${c.ganancia_porcentaje.toFixed(2)}%</strong></td>
            <td>${c.bolivares_restantes.toLocaleString('es-VE', {maximumFractionDigits: 2})}</td>
            <td>
                <div class="flex-row-align" style="gap: 0.4rem; justify-content: center;">
                    ${actionToggle}
                    <button class="btn btn-secondary" onclick="openEditCiclo(${c.id})" style="padding: 4px 8px; font-size: 0.75rem;">✏️ Editar</button>
                    <button class="btn btn-danger" onclick="deleteCiclo(${c.id})" style="padding: 4px 8px; font-size: 0.75rem; background: rgba(239, 68, 68, 0.1); border-color: rgba(239, 68, 68, 0.2); color: var(--text-danger);">🗑️ Eliminar</button>
                </div>
            </td>
        `;
        els.ciclosTableBody.appendChild(tr);
        
        if (c.compras_parciales && c.compras_parciales.length > 0) {
            c.compras_parciales.forEach(cp => {
                const subTr = document.createElement('tr');
                subTr.className = 'sub-row-compra';
                
                const costoVesCp = (cp.usd_comprados * cp.tasa_bcv) + (cp.comision_compra_ves || 0) + (cp.transferencias_ves || 0);
                const costoUsdtCp = c.tasa_venta > 0 ? (costoVesCp / c.tasa_venta) : 0;
                const gananciaCpUsd = cp.usd_recibidos_binance - costoUsdtCp;
                const marginCp = costoUsdtCp > 0 ? ((cp.usd_recibidos_binance / costoUsdtCp) - 1) * 100 : 0;
                
                const subProfitClass = gananciaCpUsd >= 0 ? 'text-success' : 'text-danger';
                
                subTr.innerHTML = `
                    <td style="padding-left: 20px; font-size: 0.76rem; color: var(--text-secondary);">
                        <span style="opacity: 0.6; margin-right: 4px;">↳</span> ${cp.fecha}
                    </td>
                    <td style="color: var(--text-muted); opacity: 0.5;">—</td>
                    <td style="color: var(--text-muted); opacity: 0.5;">—</td>
                    <td>
                        <span class="badge-banco-compra" style="font-size: 0.74rem; background: rgba(59,130,246,0.1); color: #93c5fd; border: 1px solid rgba(59,130,246,0.2); padding: 1px 4px; border-radius: 4px; font-weight: 500;">
                            🏦 ${cp.banco || 'Banco'}${cp.titular ? ' (' + cp.titular + ')' : ''}
                        </span>
                    </td>
                    <td style="font-weight: 500; font-size: 0.82rem; color: var(--text-primary);">$${cp.usd_comprados.toFixed(2)}</td>
                    <td style="font-size: 0.82rem; color: var(--text-secondary);">${cp.tasa_bcv.toFixed(2)}</td>
                    <td style="font-size: 0.82rem; color: var(--text-secondary);">$${cp.usd_recibidos_binance.toFixed(2)}</td>
                    <td class="${subProfitClass}" style="font-size: 0.82rem; font-weight: 600;">
                        ${gananciaCpUsd >= 0 ? '+' : ''}$${gananciaCpUsd.toFixed(2)}
                    </td>
                    <td class="${subProfitClass}" style="font-size: 0.78rem;">
                        ${marginCp.toFixed(2)}%
                    </td>
                    <td style="color: var(--text-muted); opacity: 0.5;">—</td>
                    <td>
                        <button class="btn btn-sm" onclick="deleteCompraParcialDirect(${cp.id}, ${c.id})" style="padding: 2px 6px; font-size: 0.7rem; background: rgba(239,68,68,0.1); color: var(--text-danger); border: 1px solid rgba(239,68,68,0.15);" title="Eliminar esta compra parcial de este sobre">🗑️ Compra</button>
                    </td>
                `;
                els.ciclosTableBody.appendChild(subTr);
            });
        }
    });
    
    if (els.totalGananciaCiclos) {
        els.totalGananciaCiclos.textContent = `$${totalGain.toLocaleString('es-VE', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
    }
}

window.openEditCiclo = function(cicloId) {
    const ciclo = state.ciclos.find(c => c.id === cicloId);
    if (!ciclo) return;
    
    document.getElementById('edit-ciclo-id').value = ciclo.id;
    document.getElementById('edit-ciclo-fecha').value = ciclo.fecha;
    document.getElementById('edit-ciclo-usdt-vendidos').value = ciclo.usdt_vendidos;
    document.getElementById('edit-ciclo-tasa-venta').value = ciclo.tasa_venta;
    document.getElementById('edit-ciclo-tasa-bcv').value = ciclo.tasa_bcv || state.bcvRate;
    document.getElementById('edit-ciclo-usd-recibidos').value = ciclo.usd_recibidos_binance;
    
    const selectTarjeta = document.getElementById('edit-ciclo-tarjeta');
    if (selectTarjeta && els.calcTarjetaCompra) {
        selectTarjeta.innerHTML = els.calcTarjetaCompra.innerHTML;
        if (ciclo.tarjeta_id) {
            selectTarjeta.value = ciclo.tarjeta_id;
        }
    }
    
    openModal(els.modalEditarCiclo);
};

window.deleteCiclo = async function(cicloId) {
    if (!confirm("¿Estás seguro de que deseas eliminar permanentemente este ciclo de arbitraje? Se borrarán también todas las compras parciales asociadas.")) return;
    try {
        await apiCall(`/ciclos/${cicloId}`, 'DELETE');
        alert("Ciclo de arbitraje eliminado con éxito.");
        await initDashboard();
    } catch (err) {
        alert(err.message);
    }
};

async function handleEditarCicloSubmit(e) {
    e.preventDefault();
    const cicloId = parseInt(document.getElementById('edit-ciclo-id').value);
    const fecha = document.getElementById('edit-ciclo-fecha').value;
    const usdt_vendidos = parseFloat(document.getElementById('edit-ciclo-usdt-vendidos').value);
    const tasa_venta = parseFloat(document.getElementById('edit-ciclo-tasa-venta').value);
    const tasa_bcv = parseFloat(document.getElementById('edit-ciclo-tasa-bcv').value);
    const tarjeta_id = parseInt(document.getElementById('edit-ciclo-tarjeta').value);
    const usd_recibidos_binance = parseFloat(document.getElementById('edit-ciclo-usd-recibidos').value);
    
    if (isNaN(usdt_vendidos) || isNaN(tasa_venta) || isNaN(tasa_bcv) || isNaN(tarjeta_id) || isNaN(usd_recibidos_binance)) {
        alert("Por favor introduce montos válidos.");
        return;
    }
    
    try {
        await apiCall(`/ciclos/${cicloId}`, 'PUT', {
            fecha,
            usdt_vendidos,
            tasa_venta,
            tasa_bcv,
            tarjeta_id,
            usd_recibidos_binance
        });
        showToast("Ciclo de arbitraje actualizado con éxito.");
        closeModal(els.modalEditarCiclo);
        await initDashboard();
    } catch (err) {
        alert(err.message);
    }
}

async function loadCompras() {
    try {
        const [compras, titulares] = await Promise.all([
            apiCall('/compras'),
            apiCall('/titulares')
        ]);
        state.compras = compras || [];
        if (titulares) state.titulares = titulares;

        // Populate Titular Filter Dropdown
        const filterTitularSelect = document.getElementById('filter-compra-titular');
        if (filterTitularSelect && state.titulares) {
            const currentVal = filterTitularSelect.value;
            filterTitularSelect.innerHTML = '<option value="todos">👥 Todos los Titulares</option>';
            state.titulares.forEach(t => {
                const opt = document.createElement('option');
                opt.value = t.nombre;
                opt.textContent = t.nombre;
                filterTitularSelect.appendChild(opt);
            });
            if (currentVal) filterTitularSelect.value = currentVal;
        }
        
        renderComprasTable();
        renderComprasLimits();
    } catch (err) {
        console.error("Error loading compras:", err);
    }
}

function renderComprasTable() {
    if (!els.comprasTableBody) return;
    els.comprasTableBody.innerHTML = '';
    
    const filterTitularEl = document.getElementById('filter-compra-titular');
    const filterBancoEl = document.getElementById('filter-compra-banco');
    
    const filterTitular = filterTitularEl ? filterTitularEl.value : 'todos';
    const filterBanco = filterBancoEl ? filterBancoEl.value : 'todos';
    
    let filtered = state.compras || [];
    if (filterTitular !== 'todos') {
        filtered = filtered.filter(c => c.titular && c.titular.toLowerCase() === filterTitular.toLowerCase());
    }
    if (filterBanco !== 'todos') {
        filtered = filtered.filter(c => c.banco && c.banco.toLowerCase().includes(filterBanco.toLowerCase()));
    }
    
    if (filtered.length === 0) {
        els.comprasTableBody.innerHTML = '<tr><td colspan="10" style="text-align: center; color: var(--text-muted); padding: 1.5rem;">No hay registros de compras que coincidan con los filtros seleccionados.</td></tr>';
        return;
    }
    
    filtered.forEach(c => {
        const tr = document.createElement('tr');
        const montoVes = c.monto_usd * c.tasa_bcv;
        
        // Define badge style based on origin tipo
        const isDirecta = c.tipo === "Directa";
        const tipoBadge = isDirecta
            ? `<span class="badge" style="background: rgba(16, 185, 129, 0.15); color: #10b981; border: 1px solid rgba(16, 185, 129, 0.3); font-size: 0.72rem;">🟢 Directa</span>`
            : `<span class="badge" style="background: rgba(59, 130, 246, 0.15); color: #60a5fa; border: 1px solid rgba(59, 130, 246, 0.3); font-size: 0.72rem;">🔄 ${c.tipo}</span>`;

        // Only allow editing/deleting direct purchases from this tab to prevent unlinking cycle sub-purchases
        const actionButtons = isDirecta
            ? `
                <div class="flex-row-align" style="gap: 0.4rem; justify-content: center; flex-direction: row !important;">
                    <button class="btn btn-secondary btn-sm" onclick="openEditCompra('${c.id}')" style="padding: 4px 8px; font-size: 0.75rem;" title="Editar compra directa">✏️</button>
                    <button class="btn btn-danger btn-sm" onclick="deleteCompra('${c.id}')" style="padding: 4px 8px; font-size: 0.75rem; background: rgba(239, 68, 68, 0.1); border-color: rgba(239, 68, 68, 0.2); color: var(--text-danger);" title="Eliminar compra directa">🗑️</button>
                </div>
              `
            : `<span style="font-size: 0.72rem; color: var(--text-muted); font-style: italic;">Editar en sobre de Ciclo</span>`;

        tr.innerHTML = `
            <td>${c.fecha}</td>
            <td>${tipoBadge}</td>
            <td><strong>${c.titular}</strong></td>
            <td>${c.banco}</td>
            <td>${c.tipo_tarjeta}</td>
            <td>$${c.monto_usd.toFixed(2)}</td>
            <td>${c.tasa_bcv.toFixed(2)}</td>
            <td>${montoVes.toLocaleString('es-VE', {minimumFractionDigits: 2})} VES</td>
            <td>${c.comision_ves.toLocaleString('es-VE', {minimumFractionDigits: 2})} VES</td>
            <td>${actionButtons}</td>
        `;
        els.comprasTableBody.appendChild(tr);
    });
}

function exportComprasToCSV() {
    if (!state.compras || state.compras.length === 0) {
        showToast("No hay registros de compras para exportar.", "warning");
        return;
    }
    
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "ID,Origen,Fecha,Titular,Banco,Tipo Tarjeta,Monto USD,Tasa BCV,Monto VES,Comision VES\n";
    
    state.compras.forEach(c => {
        const montoVes = c.monto_usd * c.tasa_bcv;
        const row = [
            c.id,
            `"${c.tipo || 'Directa'}"`,
            `"${c.fecha}"`,
            `"${c.titular}"`,
            `"${c.banco}"`,
            `"${c.tipo_tarjeta}"`,
            c.monto_usd,
            c.tasa_bcv,
            montoVes.toFixed(2),
            c.comision_ves.toFixed(2)
        ].join(",");
        csvContent += row + "\n";
    });
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `bitacora_compras_divisas_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function updateCompraLiveBreakdown() {
    const montoInput = document.getElementById('compra-monto-usd');
    const tasaInput = document.getElementById('compra-tasa-bcv');
    const tarjetaSelect = document.getElementById('compra-tarjeta-select');
    
    const comisionBcvEl = document.getElementById('live-compra-comision-bcv');
    const comisionCardEl = document.getElementById('live-compra-comision-card');
    const netoBinanceEl = document.getElementById('live-compra-neto-binance');
    const cupoRestanteEl = document.getElementById('live-compra-cupo-restante');
    
    if (!montoInput || !tasaInput || !tarjetaSelect || !comisionBcvEl) return;
    
    const montoUsd = parseFloat(montoInput.value) || 0.0;
    const tasaBcv = parseFloat(tasaInput.value) || (state.bcvRate || 0.0);
    
    const selectedOpt = tarjetaSelect.options[tarjetaSelect.selectedIndex];
    let isTerceraEdad = false;
    let cardCommPct = 0.015;
    let isBdv = false;
    
    if (selectedOpt) {
        isTerceraEdad = selectedOpt.getAttribute('data-tercera-edad') === 'true';
        const rawComm = selectedOpt.getAttribute('data-comision');
        cardCommPct = (rawComm !== null && rawComm !== undefined && !isNaN(parseFloat(rawComm))) ? parseFloat(rawComm) : 0.0;
        const bankName = (selectedOpt.getAttribute('data-banco') || '').toLowerCase();
        isBdv = bankName.includes('venezuela') || bankName.includes('bdv');
    }
    
    const bcvCommPct = (isTerceraEdad && isBdv) ? 0.0 : 0.005; // 0.5%
    const montoVes = montoUsd * tasaBcv;
    const comisionVes = montoVes * bcvCommPct;
    
    const cardFeeUsd = montoUsd * cardCommPct;
    const netoBinanceUsd = montoUsd * (1 - cardCommPct);
    
    comisionBcvEl.textContent = `${comisionVes.toLocaleString('es-VE', {minimumFractionDigits: 2, maximumFractionDigits: 2})} VES (${(isTerceraEdad && isBdv) ? '0% Exento 3ra Edad' : '0.5%'})`;
    comisionCardEl.textContent = `$${cardFeeUsd.toFixed(2)} USD (${(cardCommPct * 100).toFixed(1)}%)`;
    netoBinanceEl.textContent = `$${netoBinanceUsd.toFixed(2)} USDT`;
    
    // Find bank annual limit remaining for selected holder
    let remainingBankAnnual = 12000.0;
    if (selectedOpt && state.titulares) {
        const cardId = parseInt(selectedOpt.value);
        for (const tit of state.titulares) {
            const cardObj = tit.tarjetas ? tit.tarjetas.find(c => c.id === cardId) : null;
            if (cardObj) {
                const bl = tit.bancos_limites ? tit.bancos_limites.find(b => b.banco === cardObj.banco) : null;
                if (bl) {
                    remainingBankAnnual = Math.max(0, bl.limite_anual - bl.consumo_anual - montoUsd);
                }
                break;
            }
        }
    }
    cupoRestanteEl.textContent = `$${remainingBankAnnual.toLocaleString('es-VE', {minimumFractionDigits: 2, maximumFractionDigits: 2})} USD`;
}

function renderComprasLimits() {
    const container = document.getElementById('compras-limits-container');
    if (!container) return;
    container.innerHTML = '';

    if (!state.titulares) return;

    state.titulares.forEach(tit => {
        // Render Bank Accounts Limits for this titular
        if (tit.bancos_limites && tit.bancos_limites.length > 0) {
            tit.bancos_limites.forEach(bl => {
                const pctAnual = bl.limite_anual > 0 ? Math.min((bl.consumo_anual / bl.limite_anual) * 100, 100) : 0;
                let classAnual = 'progress-normal';
                let badgeSemáforo = '<span class="senior-badge" style="font-size: 0.65rem; background: rgba(16,185,129,0.15); color: #10b981; border: 1px solid rgba(16,185,129,0.3); padding: 2px 6px; border-radius: 4px;">🟢 Cupo Amplio</span>';
                
                if (pctAnual > 90) {
                    classAnual = 'progress-danger';
                    badgeSemáforo = '<span class="senior-badge" style="font-size: 0.65rem; background: rgba(239,68,68,0.15); color: #ef4444; border: 1px solid rgba(239,68,68,0.3); padding: 2px 6px; border-radius: 4px;">🔴 Alerta Límite Anual (>90%)</span>';
                } else if (pctAnual > 70) {
                    classAnual = 'progress-warning';
                    badgeSemáforo = '<span class="senior-badge" style="font-size: 0.65rem; background: rgba(245,158,11,0.15); color: #f59e0b; border: 1px solid rgba(245,158,11,0.3); padding: 2px 6px; border-radius: 4px;">🟡 Cupo Medio</span>';
                }

                let monthlyHtml = '';
                if (bl.limite_mensual < 900000) {
                    const pctMensual = Math.min((bl.consumo_mensual / bl.limite_mensual) * 100, 100);
                    let classMensual = 'progress-normal';
                    if (pctMensual > 90) classMensual = 'progress-danger';
                    else if (pctMensual > 70) classMensual = 'progress-warning';

                    monthlyHtml = `
                        <div style="display: flex; flex-direction: column; gap: 4px; margin-top: 8px;">
                            <div style="display: flex; justify-content: space-between; font-size: 0.72rem; color: var(--text-secondary);">
                                <span>Mensual (Límite: $${bl.limite_mensual.toFixed(0)})</span>
                                <span>$${bl.consumo_mensual.toFixed(2)} (${pctMensual.toFixed(0)}%)</span>
                            </div>
                            <div class="card-progress-bar-container" style="margin: 0; height: 6px; background: rgba(255,255,255,0.05); border-radius: 3px; overflow: hidden; width: 100%;">
                                <div class="card-progress-fill ${classMensual}" style="width: ${pctMensual}%; height: 100%; border-radius: 3px;"></div>
                            </div>
                        </div>
                    `;
                }

                const cardEl = document.createElement('div');
                cardEl.className = 'card-item-row';
                cardEl.style.background = 'rgba(255, 255, 255, 0.02)';
                cardEl.style.border = '1px solid var(--border-color)';
                cardEl.style.borderRadius = '12px';
                cardEl.style.padding = '1rem';
                cardEl.style.display = 'flex';
                cardEl.style.flexDirection = 'column';
                cardEl.style.gap = '0.75rem';

                cardEl.innerHTML = `
                    <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                        <div>
                            <span style="font-weight: 600; color: var(--text-primary); font-size: 0.92rem; display: block;">🏦 Límite Banco: ${bl.banco}</span>
                            <span style="font-size: 0.75rem; color: var(--text-secondary);">de ${tit.nombre}</span>
                        </div>
                        ${badgeSemáforo}
                    </div>
                    
                    <div style="display: flex; flex-direction: column; gap: 4px;">
                        <div style="display: flex; justify-content: space-between; font-size: 0.72rem; color: var(--text-secondary);">
                            <span>Cupo Anual (Límite: $${bl.limite_anual.toFixed(0)})</span>
                            <span>$${bl.consumo_anual.toFixed(2)} (${pctAnual.toFixed(0)}%)</span>
                        </div>
                        <div class="card-progress-bar-container" style="margin: 0; height: 6px; background: rgba(255,255,255,0.05); border-radius: 3px; overflow: hidden; width: 100%;">
                            <div class="card-progress-fill ${classAnual}" style="width: ${pctAnual}%; height: 100%; border-radius: 3px;"></div>
                        </div>
                    </div>
                    ${monthlyHtml}
                `;
                container.appendChild(cardEl);
            });
        }

        // Render Card Limits for this titular
        if (tit.tarjetas && tit.tarjetas.length > 0) {
            tit.tarjetas.forEach(card => {
                const pctDiario = card.limite_diario > 0 ? Math.min((card.consumo_diario / card.limite_diario) * 100, 100) : 0;
                let classDiario = 'progress-normal';
                if (pctDiario > 90) classDiario = 'progress-danger';
                else if (pctDiario > 70) classDiario = 'progress-warning';

                const pctMensual = card.limite_mensual > 0 ? Math.min((card.consumo_mensual / card.limite_mensual) * 100, 100) : 0;
                let classMensual = 'progress-normal';
                if (pctMensual > 90) classMensual = 'progress-danger';
                else if (pctMensual > 70) classMensual = 'progress-warning';

                const cardEl = document.createElement('div');
                cardEl.className = 'card-item-row';
                cardEl.style.background = 'rgba(255, 255, 255, 0.02)';
                cardEl.style.border = '1px solid var(--border-color)';
                cardEl.style.borderRadius = '12px';
                cardEl.style.padding = '1rem';
                cardEl.style.display = 'flex';
                cardEl.style.flexDirection = 'column';
                cardEl.style.gap = '0.75rem';

                cardEl.innerHTML = `
                    <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                        <div>
                            <span style="font-weight: 600; color: var(--text-primary); font-size: 0.92rem; display: block;">💳 Tarjeta: ${card.banco} (${card.tipo_tarjeta})</span>
                            <span style="font-size: 0.75rem; color: var(--text-secondary);">de ${tit.nombre}</span>
                        </div>
                        ${(pctDiario >= 100 || pctMensual >= 100) ? '<span class="senior-badge" style="font-size: 0.65rem; background: rgba(239,68,68,0.15); color: #ef4444; border: 1px solid rgba(239,68,68,0.3); padding: 2px 6px; border-radius: 4px;">⚠️ Límite Excedido</span>' : '<span class="senior-badge" style="font-size: 0.65rem; background: rgba(16,185,129,0.15); color: #10b981; border: 1px solid rgba(16,185,129,0.3); padding: 2px 6px; border-radius: 4px;">🟢 Activa</span>'}
                    </div>
                    
                    <div style="display: flex; flex-direction: column; gap: 4px;">
                        <div style="display: flex; justify-content: space-between; font-size: 0.72rem; color: var(--text-secondary);">
                            <span>Diario (Límite: $${card.limite_diario.toFixed(0)})</span>
                            <span>$${card.consumo_diario.toFixed(2)} (${pctDiario.toFixed(0)}%)</span>
                        </div>
                        <div class="card-progress-bar-container" style="margin: 0; height: 6px; background: rgba(255,255,255,0.05); border-radius: 3px; overflow: hidden; width: 100%;">
                            <div class="card-progress-fill ${classDiario}" style="width: ${pctDiario}%; height: 100%; border-radius: 3px;"></div>
                        </div>
                    </div>
                    
                    <div style="display: flex; flex-direction: column; gap: 4px;">
                        <div style="display: flex; justify-content: space-between; font-size: 0.72rem; color: var(--text-secondary);">
                            <span>Mensual (Límite: $${card.limite_mensual.toFixed(0)})</span>
                            <span>$${card.consumo_mensual.toFixed(2)} (${pctMensual.toFixed(0)}%)</span>
                        </div>
                        <div class="card-progress-bar-container" style="margin: 0; height: 6px; background: rgba(255,255,255,0.05); border-radius: 3px; overflow: hidden; width: 100%;">
                            <div class="card-progress-fill ${classMensual}" style="width: ${pctMensual}%; height: 100%; border-radius: 3px;"></div>
                        </div>
                    </div>
                `;
                container.appendChild(cardEl);
            });
        }
    });
}

function formatDateToLocalInput(date) {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    const hh = String(date.getHours()).padStart(2, '0');
    const min = String(date.getMinutes()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
}

window.openEditCompra = function(compraId) {
    const compra = state.compras.find(c => c.id === compraId);
    if (!compra) return;

    document.getElementById('compra-id').value = compra.id;
    document.getElementById('compra-modal-title').textContent = "Editar Compra de Divisas";
    document.getElementById('btn-submit-compra').textContent = "Guardar Cambios";

    // Parse purchase custom date
    const d = parseSpanishDate(compra.fecha);
    document.getElementById('compra-fecha-manual').value = formatDateToLocalInput(d);

    document.getElementById('compra-tarjeta-select').value = compra.tarjeta_id;
    document.getElementById('compra-monto-usd').value = compra.monto_usd;
    document.getElementById('compra-tasa-bcv').value = compra.tasa_bcv;

    updateCompraLiveBreakdown();
    openModal(els.modalCompra);
};

window.deleteCompra = async function(compraId) {
    if (!confirm("¿Estás seguro de que deseas eliminar esta compra de divisas de la bitácora? Esto recalculará los límites de consumo.")) return;
    try {
        await apiCall(`/compras/${compraId}`, 'DELETE');
        showToast("Compra eliminada con éxito.");
        await initDashboard();
        await loadCompras();
    } catch (err) {
        showToast("Error al eliminar compra: " + err.message, "danger");
    }
};

async function loadCapitalSnapshots() {
    try {
        const snaps = await apiCall('/capital/snapshots');
        state.snapshots = snaps;
        els.capitalHistoryTableBody.innerHTML = '';
        
        snaps.forEach(s => {
            const tr = document.createElement('tr');
            
            const detailStr = s.detalle.map(d => `${d.plataforma}: $${d.usd_equivalente.toFixed(0)}`).join(' | ');
            
            tr.innerHTML = `
                <td>${s.fecha}</td>
                <td><strong>$${s.total_usd.toLocaleString('es-VE', {minimumFractionDigits: 2})}</strong></td>
                <td><span class="text-secondary" style="font-size:0.8rem;">${detailStr}</span></td>
                <td>
                    <div class="flex-row-align" style="gap: 0.5rem; justify-content: center;">
                        <button class="btn btn-secondary" onclick="openEditSnapshot(${s.id})" style="padding: 4px 8px; font-size: 0.75rem;">✏️ Editar</button>
                        <button class="btn btn-danger" onclick="deleteSnapshot(${s.id})" style="padding: 4px 8px; font-size: 0.75rem; background: rgba(239, 68, 68, 0.1); border-color: rgba(239, 68, 68, 0.2); color: var(--text-danger);">🗑️ Eliminar</button>
                    </div>
                </td>
            `;
            els.capitalHistoryTableBody.appendChild(tr);
        });
    } catch (err) {
        console.error("Error loading snapshots:", err);
    }
}

window.openEditSnapshot = function(snapId) {
    const snap = state.snapshots.find(s => s.id === snapId);
    if (!snap) return;
    
    document.getElementById('edit-snap-id').value = snap.id;
    document.getElementById('edit-snap-fecha').value = snap.fecha;
    
    const container = document.getElementById('edit-snap-platforms-container');
    container.innerHTML = '';
    
    snap.detalle.forEach((d, idx) => {
        const div = document.createElement('div');
        div.style.display = 'flex';
        div.style.flexDirection = 'column';
        div.style.gap = '0.25rem';
        div.style.background = 'rgba(255,255,255,0.01)';
        div.style.padding = '0.5rem';
        div.style.borderRadius = '6px';
        div.style.border = '1px solid var(--border-color)';
        
        div.innerHTML = `
            <strong style="font-size: 0.85rem; color: var(--text-primary);">${d.plataforma}</strong>
            <input type="hidden" name="plat-name-${idx}" value="${d.plataforma}">
            <div style="display: flex; gap: 0.5rem;">
                <div style="flex: 1;">
                    <label style="font-size: 0.7rem; color: var(--text-secondary);">Saldo USD</label>
                    <input type="number" step="any" name="plat-usd-${idx}" value="${d.saldo_usd}" style="padding: 0.4rem; font-size: 0.8rem; width: 100%;">
                </div>
                <div style="flex: 1;">
                    <label style="font-size: 0.7rem; color: var(--text-secondary);">Saldo VES</label>
                    <input type="number" step="any" name="plat-ves-${idx}" value="${d.saldo_ves}" style="padding: 0.4rem; font-size: 0.8rem; width: 100%;">
                </div>
                <div style="flex: 1;">
                    <label style="font-size: 0.7rem; color: var(--text-secondary);">Equiv. USD</label>
                    <input type="number" step="any" name="plat-equiv-${idx}" value="${d.usd_equivalente}" style="padding: 0.4rem; font-size: 0.8rem; width: 100%;">
                </div>
            </div>
        `;
        container.appendChild(div);
    });
    
    openModal(els.modalEditarSnapshot);
};

window.deleteSnapshot = async function(snapId) {
    if (!confirm("¿Estás seguro de que deseas eliminar permanentemente esta foto de capital histórica?")) return;
    try {
        await apiCall(`/capital/snapshots/${snapId}`, 'DELETE');
        alert("Snapshot eliminado con éxito.");
        await loadCapitalSnapshots();
    } catch (err) {
        alert(err.message);
    }
};

async function handleEditarSnapshotSubmit(e) {
    e.preventDefault();
    const snapId = parseInt(document.getElementById('edit-snap-id').value);
    const fecha = document.getElementById('edit-snap-fecha').value;
    
    const snap = state.snapshots.find(s => s.id === snapId);
    if (!snap) return;
    
    const container = document.getElementById('edit-snap-platforms-container');
    const newDetalle = [];
    
    snap.detalle.forEach((d, idx) => {
        const pName = container.querySelector(`[name="plat-name-${idx}"]`).value;
        const pUsd = parseFloat(container.querySelector(`[name="plat-usd-${idx}"]`).value) || 0.0;
        const pVes = parseFloat(container.querySelector(`[name="plat-ves-${idx}"]`).value) || 0.0;
        const pEquiv = parseFloat(container.querySelector(`[name="plat-equiv-${idx}"]`).value) || 0.0;
        
        newDetalle.push({
            plataforma: pName,
            saldo_usd: pUsd,
            saldo_ves: pVes,
            usd_equivalente: pEquiv
        });
    });
    
    try {
        await apiCall(`/capital/snapshots/${snapId}`, 'PUT', {
            fecha: fecha,
            detalle: newDetalle
        });
        alert("Snapshot actualizado con éxito.");
        closeModal(els.modalEditarSnapshot);
        await loadCapitalSnapshots();
    } catch (err) {
        alert(err.message);
    }
}

function updateCardPresetDefaults() {
    const bancoEl = document.getElementById('tarjeta-banco');
    const tipoEl = document.getElementById('tarjeta-tipo');
    if (!bancoEl || !tipoEl) return;
    
    const banco = bancoEl.value;
    const tipo = tipoEl.value;
    
    let diario = 1000;
    let mensual = 5000;
    let comision = 0.0;
    
    if (banco === 'BDV') {
        if (tipo === 'Internacional $') {
            diario = 2000;
            mensual = 10000;
            comision = 2.5; // 2.5%
        } else if (tipo === 'Master Debit') {
            diario = 1000;
            mensual = 5000;
            comision = 1.5; // 1.5%
        } else {
            diario = 1000;
            mensual = 5000;
            comision = 0.0;
        }
    } else if (banco === 'Provincial') {
        diario = 2000;
        mensual = 20000;
        comision = 0.0;
    } else if (banco === 'Mercantil' || banco === 'Zinli') {
        diario = 1000;
        mensual = 1000;
        comision = 0.0;
    } else {
        diario = 1000;
        mensual = 5000;
        comision = 0.0;
    }
    
    const diarioEl = document.getElementById('tarjeta-limite-diario');
    const mensualEl = document.getElementById('tarjeta-limite-mensual');
    const comisionEl = document.getElementById('tarjeta-comision');
    
    if (diarioEl) diarioEl.value = diario;
    if (mensualEl) mensualEl.value = mensual;
    if (comisionEl) comisionEl.value = comision;
}

// Modal handlers
function openModal(modal) {
    modal.classList.remove('hidden');
}

function closeModal(modal) {
    modal.classList.add('hidden');
}

// Event Listeners
function setupEventListeners() {
    // Auth
    els.loginForm.addEventListener('submit', handleLogin);
    els.btnLogout.addEventListener('click', logout);
    
    // BCV Simulator Events
    if (els.simBcvBanco) els.simBcvBanco.addEventListener('change', updateSimulatorCommissions);
    if (els.simBcvTerceraEdad) els.simBcvTerceraEdad.addEventListener('change', updateSimulatorCommissions);
    if (els.simBcvComision) els.simBcvComision.addEventListener('input', recalculateSimulation);
    if (els.simBcvTasa) els.simBcvTasa.addEventListener('input', recalculateSimulation);
    if (els.simBcvLimite) els.simBcvLimite.addEventListener('input', recalculateSimulation);
    if (els.simBcvModo) {
        els.simBcvModo.addEventListener('change', () => {
            if (els.simBcvMonto) els.simBcvMonto.value = '';
            recalculateSimulation();
        });
    }
    if (els.simBcvMonto) els.simBcvMonto.addEventListener('input', recalculateSimulation);
    
    // Stats Period Filter
    if (els.statsPeriodoSelect) {
        els.statsPeriodoSelect.addEventListener('change', loadAndRenderCharts);
    }

    // Historial Period Filters
    const filterPeriodoRemesas = document.getElementById('filter-periodo-remesas');
    if (filterPeriodoRemesas) {
        filterPeriodoRemesas.addEventListener('change', renderRemesasTable);
    }
    const filterPeriodoCiclos = document.getElementById('filter-periodo-ciclos');
    if (filterPeriodoCiclos) {
        filterPeriodoCiclos.addEventListener('change', renderCiclosTable);
    }
    
    // Zelle Modals & Actions
    if (els.btnRegistrarZelleIngreso) els.btnRegistrarZelleIngreso.addEventListener('click', () => openModalZelle('ingreso'));
    if (els.btnRegistrarZelleEgreso) els.btnRegistrarZelleEgreso.addEventListener('click', () => openModalZelle('egreso'));
    if (els.btnCloseModalZelle) els.btnCloseModalZelle.addEventListener('click', closeModalZelle);
    if (els.formZelleMovimiento) {
        els.formZelleMovimiento.addEventListener('submit', async (e) => {
            e.preventDefault();
            const tipo = els.modalZelleTipo.value;
            const monto = els.modalZelleMonto.value;
            const titular = els.modalZelleTitular.value;
            const detalle = els.modalZelleDetalle.value;
            const fecha = els.modalZelleFecha.value;
            const estadoEl = document.getElementById('modal-zelle-estado');
            const estado = estadoEl ? estadoEl.value : 'completado';
            await registrarMovimientoZelle(tipo, monto, titular, detalle, fecha, estado);
        });
    }
    
    // BCV Modals
    els.btnEditBcv.addEventListener('click', () => {
        els.modalBcvInput.value = state.bcvSource === 'Manual' ? state.bcvRate : '';
        openModal(els.modalBcv);
    });
    els.btnCloseModalBcv.addEventListener('click', () => closeModal(els.modalBcv));
    els.btnSaveModalBcv.addEventListener('click', async () => {
        const val = els.modalBcvInput.value ? parseFloat(els.modalBcvInput.value) : null;
        try {
            await apiCall('/bcv', 'POST', { rate: val });
            closeModal(els.modalBcv);
            await fetchBCV();
            await loadCapital();
        } catch (err) {
            alert(err.message);
        }
    });
    
    // BCV Toggles click handlers
    const btnBcvToday = document.getElementById('btn-bcv-today');
    const btnBcvTomorrow = document.getElementById('btn-bcv-tomorrow');
    if (btnBcvToday) {
        btnBcvToday.addEventListener('click', async () => {
            try {
                await apiCall('/bcv/mode', 'POST', { mode: 'today' });
                await initDashboard();
            } catch (err) {
                alert(err.message);
            }
        });
    }
    if (btnBcvTomorrow) {
        btnBcvTomorrow.addEventListener('click', async () => {
            try {
                await apiCall('/bcv/mode', 'POST', { mode: 'tomorrow' });
                await initDashboard();
            } catch (err) {
                alert(err.message);
            }
        });
    }
    
    // Navigation Tabs
    els.tabLinks.forEach(link => link.addEventListener('click', handleTabSwitch));
    els.subTabLinks.forEach(link => link.addEventListener('click', handleSubTabSwitch));
    
    // Capital
    els.capitalForm.addEventListener('submit', handleCapitalSubmit);
    els.btnSnapshotCapital.addEventListener('click', handleSnapshotCapital);
    
    if (els.btnResetCapitalInputs) {
        els.btnResetCapitalInputs.addEventListener('click', () => {
            if (!confirm("¿Estás seguro de que deseas poner en cero todos los campos de saldo en pantalla? Para guardar este estado deberás presionar 'Guardar Cambios de Capital'.")) return;
            const usdInputs = els.capitalTableBody.querySelectorAll('.input-saldo-usd');
            usdInputs.forEach(input => {
                input.value = 0;
            });
            const vesInputs = els.capitalTableBody.querySelectorAll('.input-saldo-ves');
            vesInputs.forEach(input => {
                input.value = 0;
            });
            recalculateCapitalLive();
        });
    }
    
    els.capitalTableBody.addEventListener('input', (e) => {
        if (e.target.classList.contains('input-saldo-usd') || e.target.classList.contains('input-saldo-ves')) {
            recalculateCapitalLive();
        }
    });
    
    // Calculator
    els.btnCalcularCiclo.addEventListener('click', handleCalcularCiclo);
    els.btnGuardarCiclo.addEventListener('click', handleGuardarCiclo);
    if (els.btnAbrirSobreCiclo) {
        els.btnAbrirSobreCiclo.addEventListener('click', handleAbrirSobreCiclo);
    }
    if (els.btnCalcConsultarP2p) {
        els.btnCalcConsultarP2p.addEventListener('click', handleCalcConsultarP2P);
    }
    if (els.calcPagoMovilAuto) {
        els.calcPagoMovilAuto.addEventListener('change', () => {
            if (!els.calcPagoMovilAuto.checked) {
                els.calcTransferenciasVes.value = "0";
            }
            if (!els.btnGuardarCiclo.classList.contains('hidden')) handleCalcularCiclo();
        });
    }
    if (els.calcTerceraEdad) {
        els.calcTerceraEdad.addEventListener('change', () => {
            updateSuggestedDivisas();
            if (!els.btnGuardarCiclo.classList.contains('hidden')) handleCalcularCiclo();
        });
    }
    
    els.calcUsdtVendidos.addEventListener('input', updateSuggestedDivisas);
    els.calcTasaVenta.addEventListener('input', updateSuggestedDivisas);
    if (els.calcTarjetaCompra) {
        els.calcTarjetaCompra.addEventListener('change', () => {
            if (els.calcTarjetaCompra.selectedIndex >= 0) {
                const selectedOption = els.calcTarjetaCompra.options[els.calcTarjetaCompra.selectedIndex];
                if (els.calcTerceraEdad && selectedOption) {
                    els.calcTerceraEdad.checked = (selectedOption.getAttribute('data-tercera-edad') === 'true');
                }
            }
            updateSuggestedDivisas();
            if (!els.btnGuardarCiclo.classList.contains('hidden')) handleCalcularCiclo();
        });
    }
    els.calcDivisasCompradas.addEventListener('input', () => {
        state.divisasCompradasManuallyEdited = true;
    });
    els.calcForm.addEventListener('reset', () => {
        state.divisasCompradasManuallyEdited = false;
        els.btnGuardarCiclo.classList.add('hidden');
        if (els.btnAbrirSobreCiclo) els.btnAbrirSobreCiclo.classList.add('hidden');
    });
    
    // Envelopes Modals Event Listeners
    if (els.compraParcialForm) {
        els.compraParcialForm.addEventListener('submit', handleCompraParcialSubmit);
    }
    if (els.btnCloseModalCompraParcial) {
        els.btnCloseModalCompraParcial.addEventListener('click', () => closeModal(els.modalCompraParcial));
    }
    
    const cpUsd = document.getElementById('compra-parcial-usd');
    const cpTasa = document.getElementById('compra-parcial-tasa');
    const cpTarjeta = document.getElementById('compra-parcial-tarjeta');
    const cpPm = document.getElementById('compra-parcial-pago-movil');
    
    if (cpUsd) cpUsd.addEventListener('input', updatePartialBuyPreview);
    if (cpTasa) cpTasa.addEventListener('input', updatePartialBuyPreview);
    if (cpTarjeta) {
        cpTarjeta.addEventListener('change', () => {
            if (cpTarjeta.selectedIndex >= 0) {
                const opt = cpTarjeta.options[cpTarjeta.selectedIndex];
                if (els.compraParcialTerceraEdad && opt) {
                    els.compraParcialTerceraEdad.checked = (opt.getAttribute('data-tercera-edad') === 'true');
                }
            }
            updatePartialBuyPreview();
        });
    }
    if (cpPm) cpPm.addEventListener('change', updatePartialBuyPreview);
    if (els.compraParcialTerceraEdad) els.compraParcialTerceraEdad.addEventListener('change', updatePartialBuyPreview);
    if (els.pivotVesForm) {
        els.pivotVesForm.addEventListener('submit', handlePivotVESSubmit);
    }
    if (els.btnCloseModalPivotVes) {
        els.btnCloseModalPivotVes.addEventListener('click', () => closeModal(els.modalPivotVes));
    }
    
    // Add Titular / Card modals triggers
    els.btnAddTitular.addEventListener('click', () => openModal(els.modalTitular));
    els.btnCloseModalTitular.addEventListener('click', () => closeModal(els.modalTitular));
    els.titularForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const nombre = document.getElementById('titular-nombre').value;
        const tercera_edad = document.getElementById('titular-tercera-edad').checked;
        
        try {
            await apiCall('/titulares', 'POST', { nombre, tercera_edad });
            alert("Titular creado.");
            els.titularForm.reset();
            closeModal(els.modalTitular);
            await loadTitularesAndCards();
        } catch (err) {
            alert(err.message);
        }
    });
    
    const tarjetaBancoEl = document.getElementById('tarjeta-banco');
    const tarjetaTipoEl = document.getElementById('tarjeta-tipo');
    if (tarjetaBancoEl) tarjetaBancoEl.addEventListener('change', updateCardPresetDefaults);
    if (tarjetaTipoEl) tarjetaTipoEl.addEventListener('change', updateCardPresetDefaults);

    els.btnAddCard.addEventListener('click', () => {
        els.tarjetaForm.reset();
        const titSel = document.getElementById('tarjeta-titular-select');
        if (titSel) titSel.value = '';
        updateCardPresetDefaults();
        openModal(els.modalTarjeta);
    });
    els.btnCloseModalTarjeta.addEventListener('click', () => closeModal(els.modalTarjeta));
    els.tarjetaForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const titVal = document.getElementById('tarjeta-titular-select').value;
        if (!titVal) {
            showToast("Por favor selecciona un titular para la tarjeta.", "warning");
            return;
        }
        const titular_id = parseInt(titVal);
        const banco = document.getElementById('tarjeta-banco').value;
        const tipo_tarjeta = document.getElementById('tarjeta-tipo').value;
        const limite_diario = parseFloat(document.getElementById('tarjeta-limite-diario').value) || 0.0;
        const limite_mensual = parseFloat(document.getElementById('tarjeta-limite-mensual').value) || 0.0;
        const comision_porcentaje = parseFloat(document.getElementById('tarjeta-comision').value) / 100.0 || 0.0;
        
        try {
            await apiCall('/tarjetas', 'POST', { titular_id, banco, tipo_tarjeta, limite_diario, limite_mensual, comision_porcentaje });
            showToast("Tarjeta guardada con éxito.");
            els.tarjetaForm.reset();
            closeModal(els.modalTarjeta);
            await initDashboard();
        } catch (err) {
            showToast(err.message, "danger");
        }
    });
    
    // Register divisa purchase modal
    els.btnRegistrarCompraManual.addEventListener('click', () => {
        document.getElementById('compra-id').value = '';
        document.getElementById('compra-modal-title').textContent = "Registrar Compra de Divisas (BCV)";
        document.getElementById('btn-submit-compra').textContent = "Registrar Compra";
        
        const now = new Date();
        const offset = now.getTimezoneOffset() * 60000;
        const localISOTime = (new Date(now - offset)).toISOString().slice(0, 16);
        document.getElementById('compra-fecha-manual').value = localISOTime;

        document.getElementById('compra-monto-usd').value = '';
        document.getElementById('compra-tasa-bcv').value = state.bcvRate;
        updateCompraLiveBreakdown();
        openModal(els.modalCompra);
    });

    const inputMontoUsd = document.getElementById('compra-monto-usd');
    const inputTasaBcv = document.getElementById('compra-tasa-bcv');
    const selectTarjetaCompra = document.getElementById('compra-tarjeta-select');
    const filterTitularEl = document.getElementById('filter-compra-titular');
    const filterBancoEl = document.getElementById('filter-compra-banco');
    const btnExportComprasEl = document.getElementById('btn-export-compras');

    if (inputMontoUsd) inputMontoUsd.addEventListener('input', updateCompraLiveBreakdown);
    if (inputTasaBcv) inputTasaBcv.addEventListener('input', updateCompraLiveBreakdown);
    if (selectTarjetaCompra) selectTarjetaCompra.addEventListener('change', updateCompraLiveBreakdown);

    if (filterTitularEl) filterTitularEl.addEventListener('change', renderComprasTable);
    if (filterBancoEl) filterBancoEl.addEventListener('change', renderComprasTable);
    if (btnExportComprasEl) btnExportComprasEl.addEventListener('click', exportComprasToCSV);

    const btnFiltrarCustomStats = document.getElementById('btn-filtrar-custom-stats');
    const btnExportStatsPdf = document.getElementById('btn-export-stats-pdf');
    if (btnFiltrarCustomStats) btnFiltrarCustomStats.addEventListener('click', loadAndRenderCharts);
    if (btnExportStatsPdf) btnExportStatsPdf.addEventListener('click', () => {
        alert('Exportación PDF no disponible. Usa la opción CSV del historial.');
    });

    els.btnCloseModalCompra.addEventListener('click', () => closeModal(els.modalCompra));
    els.compraDivisaForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('compra-id').value;
        const tarjeta_id = parseInt(document.getElementById('compra-tarjeta-select').value);
        const monto_usd = parseFloat(document.getElementById('compra-monto-usd').value);
        const tasa_bcv = parseFloat(document.getElementById('compra-tasa-bcv').value);
        const fechaManual = document.getElementById('compra-fecha-manual').value;
        
        let fechaStr = null;
        if (fechaManual) {
            const dt = new Date(fechaManual);
            if (!isNaN(dt.getTime())) {
                const day = String(dt.getDate()).padStart(2, '0');
                const month = String(dt.getMonth() + 1).padStart(2, '0');
                const year = dt.getFullYear();
                const hours = String(dt.getHours()).padStart(2, '0');
                const minutes = String(dt.getMinutes()).padStart(2, '0');
                fechaStr = `${day}/${month}/${year} ${hours}:${minutes}`;
            }
        }

        try {
            const payload = { tarjeta_id, monto_usd, tasa_bcv, fecha: fechaStr };
            if (id) {
                await apiCall(`/compras/${id}`, 'PUT', payload);
                showToast("Compra actualizada con éxito.");
            } else {
                await apiCall('/compras', 'POST', payload);
                showToast("Compra registrada con éxito.");
            }
            els.compraDivisaForm.reset();
            closeModal(els.modalCompra);
            await initDashboard();
            await loadCompras();
        } catch (err) {
            showToast(err.message, "danger");
        }
    });
    
    // Change password modal
    els.btnChangePasswordModal.addEventListener('click', () => {
        els.passwordError.classList.add('hidden');
        els.passwordSuccess.classList.add('hidden');
        openModal(els.modalPassword);
    });
    els.btnCloseModalPassword.addEventListener('click', () => closeModal(els.modalPassword));
    els.passwordForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const old_password = document.getElementById('password-old').value;
        const new_password = document.getElementById('password-new').value;
        
        els.passwordError.classList.add('hidden');
        els.passwordSuccess.classList.add('hidden');
        
        try {
            await apiCall('/change-password', 'POST', { old_password, new_password });
            els.passwordSuccess.textContent = "Contraseña cambiada exitosamente.";
            els.passwordSuccess.classList.remove('hidden');
            els.passwordForm.reset();
            setTimeout(() => closeModal(els.modalPassword), 1500);
        } catch (err) {
            els.passwordError.textContent = err.message || "Error al cambiar contraseña";
            els.passwordError.classList.remove('hidden');
        }
    });

    // Remesas Event Listeners
    if (els.btnConsultarP2p) els.btnConsultarP2p.addEventListener('click', handleConsultarP2P);
    
    if (els.btnUsarTasaP2pAvg) {
        els.btnUsarTasaP2pAvg.addEventListener('click', () => {
            if (state.tempAvgP2pRate) {
                els.remesaP2pRef.value = state.tempAvgP2pRate.toFixed(2);
                calculateRemesa('margin');
            }
        });
    }
    
    if (els.btnCopiarRemesaText) els.btnCopiarRemesaText.addEventListener('click', copyRemesaText);
    if (els.btnRegistrarRemesa) els.btnRegistrarRemesa.addEventListener('click', registrarRemesa);
    
    // Customer Database Agenda Event Listeners
    if (els.remesaCliente) {
        els.remesaCliente.addEventListener('input', (e) => {
            showAutocompleteDropdown(e.target.value);
            const guessedGender = getGenderEmoji(e.target.value) === '👩' ? 'Femenino' : 'Masculino';
            if (els.remesaClienteGenero) els.remesaClienteGenero.value = guessedGender;
        });
        
        // Hide autocomplete when clicking outside
        document.addEventListener('click', (e) => {
            if (els.autocompleteClientesList && !els.remesaCliente.contains(e.target) && !els.autocompleteClientesList.contains(e.target)) {
                els.autocompleteClientesList.classList.add('hidden');
            }
        });
    }

    if (els.btnAbrirAgenda) {
        els.btnAbrirAgenda.addEventListener('click', async () => {
            await loadClientes();
            if (els.agendaBuscar) els.agendaBuscar.value = '';
            renderAgenda();
            openModal(els.modalAgenda);
        });
    }

    if (els.btnCloseModalAgenda) {
        els.btnCloseModalAgenda.addEventListener('click', () => {
            closeModal(els.modalAgenda);
        });
    }

    if (els.agendaBuscar) {
        els.agendaBuscar.addEventListener('input', (e) => {
            renderAgenda(e.target.value);
        });
    }

    if (els.agendaQuickAddForm) {
        els.agendaQuickAddForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const nombre = els.agendaNuevoNombre.value.trim();
            const telefono = els.agendaNuevoTelefono.value.trim();
            const genero = els.agendaNuevoGenero.value;
            
            try {
                await apiCall('/clientes', 'POST', { nombre, telefono: telefono || null, genero });
                els.agendaQuickAddForm.reset();
                await loadClientes();
                renderAgenda(els.agendaBuscar.value);
            } catch (err) {
                alert(err.message || "Error al agregar contacto");
            }
        });
    }

    if (els.btnCloseModalEditarCliente) {
        els.btnCloseModalEditarCliente.addEventListener('click', () => {
            closeModal(els.modalEditarCliente);
        });
    }

    if (els.btnCancelarModalEditarCliente) {
        els.btnCancelarModalEditarCliente.addEventListener('click', () => {
            closeModal(els.modalEditarCliente);
        });
    }

    if (els.agendaEditForm) {
        els.agendaEditForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const clienteId = els.agendaEditId.value;
            const nombre = els.agendaEditNombre.value.trim();
            const telefono = els.agendaEditTelefono.value.trim();
            const genero = els.agendaEditGenero.value;
            
            try {
                await apiCall(`/clientes/${clienteId}`, 'PUT', { nombre, telefono: telefono || null, genero });
                closeModal(els.modalEditarCliente);
                await loadClientes();
                renderAgenda(els.agendaBuscar.value);
            } catch (err) {
                alert(err.message || "Error al actualizar contacto");
            }
        });
    }
    
    const remesaInputs = [
        els.remesaCliente,
        els.remesaClienteGenero,
        els.remesaMontoUsd,
        els.remesaMargen,
        els.remesaMetodoPago,
        els.remesaBancoReceptor,
        els.remesaCostoAdq,
        els.remesaComisionBin,
        els.remesaPagoMovilAuto,
        els.remesaRolP2p,
        els.remesaP2pRef
    ];
    
    remesaInputs.forEach(input => {
        if (input) {
            input.addEventListener('input', (e) => {
                const src = e.target.id === 'remesa-margen' ? 'margin' : null;
                calculateRemesa(src);
            });
            input.addEventListener('change', (e) => {
                const src = e.target.id === 'remesa-margen' ? 'margin' : null;
                calculateRemesa(src);
            });
        }
    });

    let p2pQueryTimeout = null;
    function triggerAutoP2PQuery() {
        if (p2pQueryTimeout) clearTimeout(p2pQueryTimeout);
        p2pQueryTimeout = setTimeout(() => {
            const remesasTab = document.getElementById('tab-remesas');
            if (remesasTab && remesasTab.classList.contains('active')) {
                handleConsultarP2P(true); // silent auto-query
            }
        }, 500);
    }

    if (els.remesaBancoReceptor) els.remesaBancoReceptor.addEventListener('change', triggerAutoP2PQuery);
    if (els.remesaRolP2p) els.remesaRolP2p.addEventListener('change', triggerAutoP2PQuery);
    if (els.remesaMontoUsd) els.remesaMontoUsd.addEventListener('input', triggerAutoP2PQuery);

    if (els.remesaTasaCliente) {
        els.remesaTasaCliente.addEventListener('input', () => calculateRemesa('tasa'));
        els.remesaTasaCliente.addEventListener('change', () => calculateRemesa('tasa'));
    }

    // Edit Remesa Modal Event Listeners
    const btnCloseModalEditarRemesa = document.getElementById('btn-close-modal-editar-remesa');
    const btnCancelarModalEditarRemesa = document.getElementById('btn-cancelar-modal-editar-remesa');
    const remesaEditForm = document.getElementById('remesa-edit-form');

    if (btnCloseModalEditarRemesa) {
        btnCloseModalEditarRemesa.addEventListener('click', () => {
            document.getElementById('modal-editar-remesa').classList.add('hidden');
        });
    }
    if (btnCancelarModalEditarRemesa) {
        btnCancelarModalEditarRemesa.addEventListener('click', () => {
            document.getElementById('modal-editar-remesa').classList.add('hidden');
        });
    }
    if (remesaEditForm) {
        remesaEditForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const id = document.getElementById('edit-remesa-id').value;
            const cliente = document.getElementById('edit-remesa-cliente').value.trim();
            const montoUsd = parseFloat(document.getElementById('edit-remesa-monto-usd').value);
            const tasaP2p = parseFloat(document.getElementById('edit-remesa-tasa-p2p').value);
            const tasaCliente = parseFloat(document.getElementById('edit-remesa-tasa-cliente').value);
            const metodoPago = document.getElementById('edit-remesa-metodo-pago').value;
            const bancoReceptor = document.getElementById('edit-remesa-banco-receptor').value;
            const costoAdqPct = parseFloat(document.getElementById('edit-remesa-costo-adquisicion').value) / 100;
            const comisionBinPct = parseFloat(document.getElementById('edit-remesa-comision-binance').value) / 100;
            
            // Recalculate Ves and Profit
            const roundedTasaCliente = Math.round(tasaCliente * 100) / 100;
            const roundedTasaP2p = Math.round(tasaP2p * 100) / 100;
            const montoVes = Math.round((montoUsd * roundedTasaCliente) * 100) / 100;
            let pmFeePct = 0;
            if (bancoReceptor === 'Pago Móvil') {
                pmFeePct = 0.003;
            }
            const vesGastadosTotales = Math.round((montoVes * (1 + pmFeePct)) * 100) / 100;
            const usdtGastados = Math.round((vesGastadosTotales / roundedTasaP2p) * 100) / 100;
            const fCosto = 1 + costoAdqPct + comisionBinPct;
            const costoRealUsdt = Math.round((usdtGastados * fCosto) * 100) / 100;
            const gananciaUsd = Math.round((montoUsd - costoRealUsdt) * 100) / 100;
            
            // Gender default for clients auto-save
            const guessedGender = getGenderEmoji(cliente) === '👩' ? 'Femenino' : 'Masculino';
            
            const editFechaInput = document.getElementById('edit-remesa-fecha');
            const editFechaVal = editFechaInput ? editFechaInput.value : null;
            
            try {
                await apiCall(`/remesas/${id}`, 'PUT', {
                    cliente_nombre: cliente,
                    monto_usd: montoUsd,
                    tasa_p2p: tasaP2p,
                    tasa_cliente: tasaCliente,
                    monto_ves: montoVes,
                    ganancia_usd: gananciaUsd,
                    metodo_pago: metodoPago,
                    banco_receptor: bancoReceptor,
                    costo_adquisicion_usdt: costoAdqPct,
                    comision_binance: comisionBinPct,
                    cliente_genero: guessedGender,
                    fecha: editFechaVal || null
                });
                document.getElementById('modal-editar-remesa').classList.add('hidden');
                alert("Remesa actualizada correctamente.");
                await initDashboard();
            } catch (err) {
                alert("Error al actualizar remesa: " + err.message);
            }
        });
    }
    
    // Edit Snapshot Event Listeners
    if (els.editarSnapshotForm) {
        els.editarSnapshotForm.addEventListener('submit', handleEditarSnapshotSubmit);
    }
    if (els.btnCloseModalEditarSnapshot) {
        els.btnCloseModalEditarSnapshot.addEventListener('click', () => {
            closeModal(els.modalEditarSnapshot);
        });
    }
    
    // Edit Ciclo Event Listeners
    if (els.editarCicloForm) {
        els.editarCicloForm.addEventListener('submit', handleEditarCicloSubmit);
    }
    if (els.btnCloseModalEditarCiclo) {
        els.btnCloseModalEditarCiclo.addEventListener('click', () => {
            closeModal(els.modalEditarCiclo);
        });
    }
    
    // Export buttons Event Listeners
    const btnExportRemesas = document.getElementById('btn-export-remesas');
    if (btnExportRemesas) {
        btnExportRemesas.addEventListener('click', exportRemesasToCSV);
    }
    const btnExportCiclos = document.getElementById('btn-export-ciclos');
    if (btnExportCiclos) {
        btnExportCiclos.addEventListener('click', exportCiclosToCSV);
    }
}

// Theme Selector logic
function initTheme() {
    const savedTheme = localStorage.getItem('theme') || 'blue';
    setTheme(savedTheme);
    
    document.querySelectorAll('.theme-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const theme = btn.getAttribute('data-theme');
            setTheme(theme);
        });
    });
}

function setTheme(theme) {
    document.body.classList.remove('theme-blue', 'theme-orange', 'theme-green', 'theme-purple');
    document.body.classList.add(`theme-${theme}`);
    localStorage.setItem('theme', theme);
}

// Remesas Module Handlers
async function loadRemesas() {
    try {
        const remesas = await apiCall('/remesas');
        state.rawRemesas = remesas || [];
        renderRemesasTable();
    } catch (err) {
        console.error("Error loading remesas:", err);
    }
}

function renderRemesasTable() {
    if (!els.remesasTableBody) return;
    els.remesasTableBody.innerHTML = '';
    
    const filterSelect = document.getElementById('filter-periodo-remesas');
    const period = filterSelect ? filterSelect.value : 'historico';
    
    let totalGain = 0;
    let totalVolume = 0;
    
    const data = state.rawRemesas || [];
    data.forEach(r => {
        if (!isDateInPeriod(r.fecha, period)) return;
        
        totalGain += r.ganancia_usd;
        totalVolume += r.monto_usd;
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${r.fecha}</td>
            <td><strong>${r.cliente_nombre}</strong></td>
            <td>$${r.monto_usd.toLocaleString('es-VE', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
            <td>${r.tasa_p2p.toFixed(2)} Bs</td>
            <td>${r.tasa_cliente.toFixed(2)} Bs</td>
            <td>${r.monto_ves.toLocaleString('es-VE', {minimumFractionDigits: 2, maximumFractionDigits: 2})} VES</td>
            <td>${(r.costo_adquisicion_usdt * 100).toFixed(1)}%</td>
            <td>${(r.comision_binance * 100).toFixed(2)}%</td>
            <td class="text-success">+$${r.ganancia_usd.toLocaleString('es-VE', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
            <td>
                <div style="display: flex; gap: 0.5rem; justify-content: center; align-items: center;">
                    <button type="button" class="btn-icon-only text-primary" onclick="iniciarEditarRemesa(${r.id})" title="Editar Remesa" style="background: transparent; border: none; cursor: pointer; padding: 4px; font-size: 1.1rem;">✏️</button>
                    <button type="button" class="btn-icon-only text-danger" onclick="eliminarRemesa(${r.id})" title="Eliminar Remesa" style="background: transparent; border: none; cursor: pointer; padding: 4px; font-size: 1.1rem;">🗑️</button>
                </div>
            </td>
        `;
        els.remesasTableBody.appendChild(tr);
    });
    
    if (els.totalVolumenRemesas) {
        els.totalVolumenRemesas.textContent = `$${totalVolume.toLocaleString('es-VE', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
    }
    if (els.totalGananciaRemesas) {
        els.totalGananciaRemesas.textContent = `$${totalGain.toLocaleString('es-VE', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
    }
}

function getGenderEmoji(name) {
    if (!name) return '🧑';
    const nameLower = name.trim().toLowerCase();
    const parts = nameLower.split(/\s+/);
    const firstName = parts[0];
    
    // Common Spanish female names & suffixes
    const femaleNames = [
        'maria', 'maría', 'ana', 'carmen', 'isabel', 'sol', 'solanda', 
        'beatriz', 'ruth', 'ines', 'inés', 'elena', 'irene', 'abril', 
        'belen', 'belén', 'raquel', 'esther', 'ester', 'pilar', 'luz', 
        'concepcion', 'concepción', 'mercedes', 'rosario', 'dolores', 
        'rocio', 'rocío', 'judith', 'miriam', 'míriam', 'elizabeth', 
        'genesis', 'génesis', 'anaisabel', 'solangie', 'solangel', 'solanda',
        'anais', 'anaís', 'sandra', 'valeria', 'patricia', 'camila', 'alejandra',
        'marian', 'mariana', 'gabriela', 'daniela', 'paola', 'sol', 'monica', 'mónica'
    ];
    
    const maleEndsInA = [
        'josua', 'joshua', 'luca', 'lucas', 'andrea'
    ];
    
    if (femaleNames.includes(firstName)) return '👩';
    
    // Check if ends in 'a' (excluding common male ones like Luca or Joshua)
    if (firstName.endsWith('a') && !maleEndsInA.includes(firstName)) {
        return '👩';
    }
    
    return '👨'; // Default to man
}

async function loadClientes() {
    try {
        const data = await apiCall('/clientes');
        state.clientes = data || [];
    } catch (err) {
        console.error("Error loading clientes:", err);
    }
}

function renderAgenda(filterText = '') {
    if (!els.agendaContactsList) return;
    els.agendaContactsList.innerHTML = '';
    
    const filtered = state.clientes.filter(c => 
        c.nombre.toLowerCase().includes(filterText.toLowerCase()) ||
        (c.telefono && c.telefono.includes(filterText))
    );
    
    if (filtered.length === 0) {
        els.agendaContactsList.innerHTML = `
            <div class="empty-state" style="padding: 1.5rem 0;">
                <p>No se encontraron contactos.</p>
            </div>
        `;
        return;
    }
    
    filtered.forEach(c => {
        const row = document.createElement('div');
        row.className = 'contact-row';
        
        const genderEmoji = c.genero === 'Femenino' ? '👩' : '👨';
        const avatarBg = genderEmoji === '👩' 
            ? 'linear-gradient(135deg, #ec4899, #a855f7)' // Pink-purple
            : 'linear-gradient(135deg, #3b82f6, #06b6d4)'; // Blue-cyan
            
        row.innerHTML = `
            <div class="contact-main">
                <div class="contact-avatar" style="background: ${avatarBg}; font-size: 1.15rem; display: flex; align-items: center; justify-content: center; min-width: 32px;">${genderEmoji}</div>
                <div class="contact-details">
                    <span class="contact-name">${c.nombre}</span>
                    <span class="contact-phone">${c.telefono || 'Sin teléfono'}</span>
                </div>
            </div>
            <button type="button" class="btn-edit-contact" data-id="${c.id}" title="Editar contacto" style="background:transparent; border:none; color:var(--text-secondary); cursor:pointer; padding:0.4rem; border-radius:4px; transition:all 0.2s ease; margin-left:auto; margin-right:0.25rem; z-index:10;">✏️</button>
            <button type="button" class="btn-delete-contact" data-id="${c.id}" title="Eliminar contacto">🗑️</button>
        `;
        
        // Clicking the row (except delete/edit buttons) selects the contact
        row.addEventListener('click', (e) => {
            if (e.target.classList.contains('btn-delete-contact') || e.target.closest('.btn-delete-contact') ||
                e.target.classList.contains('btn-edit-contact') || e.target.closest('.btn-edit-contact')) {
                return;
            }
            els.remesaCliente.value = c.nombre;
            if (els.remesaClienteGenero) els.remesaClienteGenero.value = c.genero || 'Masculino';
            closeModal(els.modalAgenda);
            calculateRemesa();
        });
        
        // Clicking edit button
        const btnEdit = row.querySelector('.btn-edit-contact');
        btnEdit.addEventListener('click', (e) => {
            e.stopPropagation();
            els.agendaEditId.value = c.id;
            els.agendaEditNombre.value = c.nombre;
            els.agendaEditTelefono.value = c.telefono || '';
            els.agendaEditGenero.value = c.genero || 'Masculino';
            openModal(els.modalEditarCliente);
        });
        
        // Clicking delete button
        const btnDelete = row.querySelector('.btn-delete-contact');
        btnDelete.addEventListener('click', async (e) => {
            e.stopPropagation();
            if (confirm(`¿Estás seguro de que deseas eliminar a ${c.nombre} de tu agenda?`)) {
                try {
                    await apiCall(`/clientes/${c.id}`, 'DELETE');
                    await loadClientes();
                    renderAgenda(els.agendaBuscar.value);
                } catch (err) {
                    alert(err.message || "Error al eliminar contacto");
                }
            }
        });
        
        els.agendaContactsList.appendChild(row);
    });
}

function showAutocompleteDropdown(filterText) {
    if (!els.autocompleteClientesList) return;
    els.autocompleteClientesList.innerHTML = '';
    
    if (!filterText.trim()) {
        els.autocompleteClientesList.classList.add('hidden');
        return;
    }
    
    const filtered = state.clientes.filter(c => 
        c.nombre.toLowerCase().includes(filterText.toLowerCase())
    ).slice(0, 5); // Limit to top 5 matches
    
    if (filtered.length === 0) {
        els.autocompleteClientesList.classList.add('hidden');
        return;
    }
    
    filtered.forEach(c => {
        const item = document.createElement('div');
        item.className = 'autocomplete-item';
        const genderEmoji = c.genero === 'Femenino' ? '👩' : '👨';
        item.innerHTML = `
            <div class="contact-info">
                <span>${genderEmoji}</span>
                <strong>${c.nombre}</strong>
            </div>
            <span class="contact-phone">${c.telefono || ''}</span>
        `;
        
        item.addEventListener('click', () => {
            els.remesaCliente.value = c.nombre;
            if (els.remesaClienteGenero) els.remesaClienteGenero.value = c.genero || 'Masculino';
            els.autocompleteClientesList.classList.add('hidden');
            calculateRemesa();
        });
        
        els.autocompleteClientesList.appendChild(item);
    });
    
    els.autocompleteClientesList.classList.remove('hidden');
}

async function handleConsultarP2P(isSilent = false) {
    const amount = parseFloat(els.remesaMontoUsd.value) || 0;
    const banco = els.remesaBancoReceptor.value;
    const p2pRol = els.remesaRolP2p ? els.remesaRolP2p.value : 'maker';
    
    // Map payTypes
    const payTypeMap = {
        "Pago Móvil": ["Pago_Movil"],
        "Banesco": ["Banesco"],
        "Mercantil": ["Mercantil"],
        "Provincial": ["Provincial"],
        "Bancamiga": ["Bancamiga"],
        "Venezuela": ["BancoDeVenezuela"],
        "Otros Bancos": []
    };
    
    const pay_types = payTypeMap[banco] || [];
    
    // Determine tradeType and search amount threshold
    let trade_type = 'BUY'; // Default Maker competes on user "Comprar" tab
    let queryUsd = 100.0;
    
    if (p2pRol === 'maker') {
        trade_type = 'BUY';
        queryUsd = Math.max(amount, 100.0);
    } else {
        trade_type = 'SELL'; // Taker sells directly on user "Vender" tab
        queryUsd = Math.max(amount, 10.0); // minimum $10 P2P threshold
    }
    
    const estimatedVes = queryUsd * (state.bcvRate || 700.0);
    
    try {
        if (!isSilent) {
            els.btnConsultarP2p.textContent = "⏳ Buscando...";
            els.btnConsultarP2p.disabled = true;
        }
        
        const reqData = {
            fiat: "VES",
            asset: "USDT",
            trade_type: trade_type,
            pay_types: pay_types,
            amount: estimatedVes > 0 ? estimatedVes : null
        };
        
        const res = await apiCall('/p2p-rate', 'POST', reqData);
        
        if (!isSilent) {
            els.btnConsultarP2p.textContent = "⚡ Consultar Binance P2P";
            els.btnConsultarP2p.disabled = false;
        }
        
        if (res.success && res.rates && res.rates.length > 0) {
            els.p2pRatesPanel.classList.remove('hidden');
            els.p2pRatesTableBody.innerHTML = '';
            
            let sumTop3 = 0;
            let countTop3 = 0;
            
            res.rates.forEach((rate, index) => {
                if (index < 3) {
                    sumTop3 += rate.price;
                    countTop3++;
                }
                
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td><strong>${rate.advertiser}</strong></td>
                    <td class="text-success">${rate.price.toFixed(2)} VES</td>
                    <td>${rate.min_amount.toLocaleString('es-VE')} - ${rate.max_amount.toLocaleString('es-VE')} VES</td>
                    <td style="font-size:0.75rem; color:var(--text-secondary);">${rate.methods.join(', ')}</td>
                `;
                els.p2pRatesTableBody.appendChild(tr);
            });
            
            const avgRate = sumTop3 / countTop3;
            state.tempAvgP2pRate = avgRate;
            els.p2pAvgRateDisplay.textContent = `${avgRate.toFixed(2)} VES`;
            
            // Auto fill reference rate
            els.remesaP2pRef.value = avgRate.toFixed(2);
            calculateRemesa();
        } else {
            if (!isSilent) {
                alert("No se encontraron tasas activas para este método en Binance P2P.");
            }
        }
    } catch (err) {
        console.error("Error in handleConsultarP2P:", err);
        if (!isSilent) {
            els.btnConsultarP2p.textContent = "⚡ Consultar Binance P2P";
            els.btnConsultarP2p.disabled = false;
            alert("Error al conectar con Binance P2P. Por favor ingresa la tasa manualmente.");
        }
    }
}

async function handleCalcConsultarP2P() {
    const amount = parseFloat(els.calcUsdtVendidos.value) || 0;
    const banco = els.calcBancoVenta.value;
    const p2pRol = els.calcRolP2p ? els.calcRolP2p.value : 'maker';
    
    // Map payTypes
    const payTypeMap = {
        "Venezuela": ["BancoDeVenezuela"],
        "Provincial": ["Provincial"],
        "Bancamiga": ["Bancamiga"],
        "Banesco": ["Banesco"],
        "Mercantil": ["Mercantil"]
    };
    
    const pay_types = payTypeMap[banco] || [];
    
    let trade_type = 'BUY'; // Maker competes on "Comprar" tab
    let queryUsd = 100.0;
    
    if (p2pRol === 'maker') {
        trade_type = 'BUY';
        queryUsd = Math.max(amount, 100.0);
    } else {
        trade_type = 'SELL'; // Taker sells directly on "Vender" tab
        queryUsd = Math.max(amount, 10.0);
    }
    
    const estimatedVes = queryUsd * (state.bcvRate || 700.0);
    
    try {
        els.btnCalcConsultarP2p.textContent = "⏳...";
        els.btnCalcConsultarP2p.disabled = true;
        
        const reqData = {
            fiat: "VES",
            asset: "USDT",
            trade_type: trade_type,
            pay_types: pay_types,
            amount: estimatedVes > 0 ? estimatedVes : null
        };
        
        const res = await apiCall('/p2p-rate', 'POST', reqData);
        els.btnCalcConsultarP2p.textContent = "⚡ P2P";
        els.btnCalcConsultarP2p.disabled = false;
        
        if (res.success && res.rates && res.rates.length > 0) {
            let sumTop3 = 0;
            let countTop3 = 0;
            
            res.rates.forEach((rate, index) => {
                if (index < 3) {
                    sumTop3 += rate.price;
                    countTop3++;
                }
            });
            
            const avgRate = sumTop3 / countTop3;
            if (els.calcTasaVenta) els.calcTasaVenta.value = avgRate.toFixed(2);
            updateSuggestedDivisas();
            handleCalcularCiclo();
        } else {
            alert("No se encontraron tasas activas en Binance P2P.");
        }
    } catch (err) {
        els.btnCalcConsultarP2p.textContent = "⚡ P2P";
        els.btnCalcConsultarP2p.disabled = false;
        alert("Error al conectar con Binance P2P. Por favor ingresa la tasa manualmente.");
    }
}

function calculateRemesa(source = null) {
    try {
        if (!source) {
            source = state.lastRemesaSource || 'margin';
        } else {
            state.lastRemesaSource = source;
        }

        const parseLocaleFloat = (val) => {
            if (!val) return 0;
            const clean = val.toString().replace(/,/g, '.').trim();
            return parseFloat(clean) || 0;
        };

        let montoUsd = parseLocaleFloat(els.remesaMontoUsd ? els.remesaMontoUsd.value : 0);
        let p2pRate = parseLocaleFloat(els.remesaP2pRef ? els.remesaP2pRef.value : 0);
        let margenPct = parseLocaleFloat(els.remesaMargen ? els.remesaMargen.value : 0) / 100;
        let tasaCliente = parseLocaleFloat(els.remesaTasaCliente ? els.remesaTasaCliente.value : 0);
        
        const costoAdqPct = parseLocaleFloat(els.remesaCostoAdq ? els.remesaCostoAdq.value : 0) / 100;
        const comisionBinPct = parseLocaleFloat(els.remesaComisionBin ? els.remesaComisionBin.value : 0) / 100;
        const pagoMovilAuto = els.remesaPagoMovilAuto ? els.remesaPagoMovilAuto.checked : true;
        
        // Factor de costo real del USDT
        const fCosto = 1 + costoAdqPct + comisionBinPct;
        
        // Pago Móvil percentage
        const pmFeePct = pagoMovilAuto ? 0.003 : 0.0;
        
        // Handle source specific updates first
        if (source === 'tasa') {
            tasaCliente = parseLocaleFloat(els.remesaTasaCliente.value);
            tasaCliente = Math.round(tasaCliente * 100) / 100;
            if (p2pRate > 0 && tasaCliente > 0) {
                margenPct = 1 - (tasaCliente * fCosto) / (p2pRate * (1 - pmFeePct));
                if (els.remesaMargen) els.remesaMargen.value = (margenPct * 100).toFixed(2);
            }
        } else if (source === 'p2p') {
            p2pRate = parseLocaleFloat(els.remesaP2pRef.value);
            if (p2pRate > 0) {
                if (tasaCliente > 0) {
                    if (state.lastRemesaSource === 'tasa') {
                        margenPct = 1 - (tasaCliente * fCosto) / (p2pRate * (1 - pmFeePct));
                        if (els.remesaMargen) els.remesaMargen.value = (margenPct * 100).toFixed(2);
                    } else {
                        tasaCliente = p2pRate * ((1 - margenPct) / fCosto) * (1 - pmFeePct);
                        tasaCliente = Math.round(tasaCliente * 100) / 100;
                        if (els.remesaTasaCliente) els.remesaTasaCliente.value = tasaCliente.toFixed(2);
                    }
                } else if (margenPct > 0) {
                    tasaCliente = p2pRate * ((1 - margenPct) / fCosto) * (1 - pmFeePct);
                    tasaCliente = Math.round(tasaCliente * 100) / 100;
                    if (els.remesaTasaCliente) els.remesaTasaCliente.value = tasaCliente.toFixed(2);
                }
            }
        } else if (source === 'margin') {
            margenPct = parseLocaleFloat(els.remesaMargen.value) / 100;
            if (p2pRate > 0 && margenPct > 0) {
                tasaCliente = p2pRate * ((1 - margenPct) / fCosto) * (1 - pmFeePct);
                tasaCliente = Math.round(tasaCliente * 100) / 100;
                if (els.remesaTasaCliente) els.remesaTasaCliente.value = tasaCliente.toFixed(2);
            }
        }

        // --- BULLETPROOF FALLBACK RESOLVERS ---
        if (p2pRate <= 0) {
            if (tasaCliente > 0 && margenPct > 0) {
                p2pRate = (tasaCliente * fCosto) / ((1 - margenPct) * (1 - pmFeePct));
                p2pRate = Math.round(p2pRate * 100) / 100;
            } else if (state.tempAvgP2pRate > 0) {
                p2pRate = state.tempAvgP2pRate;
            } else if (state.bcvRate > 0) {
                p2pRate = state.bcvRate;
            }
            if (p2pRate > 0 && els.remesaP2pRef) {
                els.remesaP2pRef.value = p2pRate.toFixed(2);
            }
        }

        if (tasaCliente <= 0) {
            if (p2pRate > 0) {
                if (margenPct <= 0) {
                    margenPct = 0.03;
                    if (els.remesaMargen) els.remesaMargen.value = "3.00";
                }
                tasaCliente = p2pRate * ((1 - margenPct) / fCosto) * (1 - pmFeePct);
                tasaCliente = Math.round(tasaCliente * 100) / 100;
                if (els.remesaTasaCliente) els.remesaTasaCliente.value = tasaCliente.toFixed(2);
            }
        }

        if (margenPct <= 0 && p2pRate > 0 && tasaCliente > 0) {
            margenPct = 1 - (tasaCliente * fCosto) / (p2pRate * (1 - pmFeePct));
            if (els.remesaMargen) els.remesaMargen.value = (margenPct * 100).toFixed(2);
        }

        if (montoUsd <= 0) {
            els.remesaResultsDisplay.innerHTML = `
                <div class="empty-state">
                    <span class="large-icon">💸</span>
                    <p>Ingresa el Monto en USD a enviar para ver la cotización calculada en tiempo real.</p>
                </div>
            `;
            els.whatsappBoxContainer.classList.add('hidden');
            state.currentCalculatedRemesa = null;
            return;
        }

        if (p2pRate <= 0 || tasaCliente <= 0) {
            return;
        }
        
        tasaCliente = Math.round(tasaCliente * 100) / 100;
        p2pRate = Math.round(p2pRate * 100) / 100;
        
        // Total VES beneficiary receives
        const vesARecibir = Math.round((montoUsd * tasaCliente) * 100) / 100;
        
        // Total VES spent by operator (including transaction fee)
        const vesGastadosTotales = Math.round((vesARecibir * (1 + pmFeePct)) * 100) / 100;
        
        // USDT needed to sell on P2P to fund the vesGastadosTotales
        const usdtGastados = Math.round((vesGastadosTotales / p2pRate) * 100) / 100;
        
        // Real acquisition cost of that USDT in USD
        const costoRealUsdt = Math.round((usdtGastados * fCosto) * 100) / 100;
        
        // Net profit in USD
        const gananciaUsd = Math.round((montoUsd - costoRealUsdt) * 100) / 100;
        
        const remesaFechaVal = document.getElementById('remesa-fecha') ? document.getElementById('remesa-fecha').value : null;
        
        state.currentCalculatedRemesa = {
            cliente_nombre: els.remesaCliente ? (els.remesaCliente.value || "Cliente") : "Cliente",
            monto_usd: montoUsd,
            tasa_p2p: p2pRate,
            tasa_cliente: tasaCliente,
            monto_ves: vesARecibir,
            ganancia_usd: gananciaUsd,
            metodo_pago: els.remesaMetodoPago ? els.remesaMetodoPago.value : "Zelle",
            banco_receptor: els.remesaBancoReceptor ? els.remesaBancoReceptor.value : "Provincial",
            costo_adquisicion_usdt: costoAdqPct,
            comision_binance: comisionBinPct,
            cliente_genero: els.remesaClienteGenero ? els.remesaClienteGenero.value : "Masculino",
            fecha: remesaFechaVal || null
        };
        
        // Render results
        const formatVES = (v) => `${v.toLocaleString('es-VE', {minimumFractionDigits: 2, maximumFractionDigits: 2})} VES`;
        const formatUSD = (u) => `$${u.toLocaleString('es-VE', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
        
        els.remesaResultsDisplay.innerHTML = `
            <div class="results-display-list">
                <div class="result-item" data-tooltip="La tasa de cambio en vivo actual de Binance P2P.">
                    <span class="label">Tasa P2P Referencial:</span>
                    <span class="value">${p2pRate.toFixed(2)} VES</span>
                </div>
                <div class="result-item" data-tooltip="Costo de comprar 1 USDT (Zelle Premium + Binance Exchange Fee).">
                    <span class="label">Costo Real Adquisición USDT:</span>
                    <span class="value">${(fCosto * 100 - 100).toFixed(2)}% ($${fCosto.toFixed(4)} por USDT)</span>
                </div>
                <div class="result-item highlight" data-tooltip="La tasa final ofrecida al cliente, ajustada por tu margen de ganancia y comisiones.">
                    <span class="label">Tasa Cotizada al Cliente:</span>
                    <span class="value text-success">${tasaCliente.toFixed(2)} VES</span>
                </div>
                <div class="result-item highlight-margin" data-tooltip="Margen de ganancia neto de la operación tras descontar todos los costos y comisiones.">
                    <span class="label">Margen de Ganancia Neto:</span>
                    <span class="value-badge">${(margenPct * 100).toFixed(2)}%</span>
                </div>
                <div class="result-item">
                    <span class="label">Monto Recibido del Cliente (USD):</span>
                    <span class="value">${formatUSD(montoUsd)}</span>
                </div>
                <div class="result-item highlight">
                    <span class="label">Monto Payout Beneficiario (VES):</span>
                    <span class="value text-success">${formatVES(vesARecibir)}</span>
                </div>
                <div class="result-item highlight-alt" data-tooltip="Monto en USDT que debes vender en P2P (incluyendo comisiones interbancarias).">
                    <span class="label">USDT a Consumir P2P:</span>
                    <span class="value text-danger">${usdtGastados.toFixed(2)} USDT</span>
                </div>
                <div class="result-item" data-tooltip="Costo equivalente en USD reales para reponer los USDT gastados.">
                    <span class="label">Reposición de USDT (Costo Real):</span>
                    <span class="value">${formatUSD(costoRealUsdt)}</span>
                </div>
                <div class="result-item highlight" data-tooltip="Tu beneficio neto en dólares de esta remesa, tras deducir todas las comisiones.">
                    <span class="label">Ganancia Neta Remesa:</span>
                    <span class="value text-success">${formatUSD(gananciaUsd)}</span>
                </div>
            </div>
        `;
        
        // Generate WhatsApp Text
        const clientName = els.remesaCliente ? (els.remesaCliente.value || "Cliente") : "Cliente";
        const paymentMethod = els.remesaMetodoPago ? els.remesaMetodoPago.value : "Zelle";
        
        const waMessage = `*Cotización de Remesa* 💸\n\n` +
                          `👤 *Cliente:* ${clientName}\n` +
                          `💵 *Envías:* ${formatUSD(montoUsd)} (Vía ${paymentMethod})\n` +
                          `🇻🇪 *Tasa del día:* ${tasaCliente.toFixed(2)} VES/$\n` +
                          `🏦 *Recibe en Venezuela:* ${formatVES(vesARecibir)}\n\n` +
                          `_Escríbenos para confirmar tu pago y realizar la transferencia de acuerdo a nuestros tiempos operativos._ 🤝`;
                          
        els.remesaWhatsappText.value = waMessage;
        els.whatsappBoxContainer.classList.remove('hidden');
    } catch (err) {
        console.error("Error in calculateRemesa:", err);
    }
}

function copyRemesaText() {
    els.remesaWhatsappText.select();
    els.remesaWhatsappText.setSelectionRange(0, 99999); // Mobile support
    navigator.clipboard.writeText(els.remesaWhatsappText.value);
    alert("Mensaje de WhatsApp copiado al portapapeles.");
}

async function registrarRemesa() {
    // Force calculation to capture latest values
    calculateRemesa();
    
    if (!state.currentCalculatedRemesa) {
        alert("Por favor, ingresa el Monto USD, la Tasa P2P y la Tasa/Margen para calcular la remesa antes de registrarla.");
        return;
    }
    
    const clientName = els.remesaCliente.value.trim();
    if (!clientName) {
        alert("Por favor, ingresa el nombre del cliente.");
        return;
    }
    
    // Ensure the payload has the latest client name and gender
    state.currentCalculatedRemesa.cliente_nombre = clientName;
    if (els.remesaClienteGenero) {
        state.currentCalculatedRemesa.cliente_genero = els.remesaClienteGenero.value;
    }
    
    try {
        const remesaFechaVal = document.getElementById('remesa-fecha') ? document.getElementById('remesa-fecha').value : null;
        if (remesaFechaVal) {
            state.currentCalculatedRemesa.fecha = remesaFechaVal;
        }
        
        // Prevent double click on mobile/desktop
        els.btnRegistrarRemesa.disabled = true;
        els.btnRegistrarRemesa.textContent = "⏳ Registrando...";
        
        await apiCall('/remesas', 'POST', state.currentCalculatedRemesa);
        alert("Remesa registrada en el historial con éxito.");
        
        // Reset form
        els.remesaForm.reset();
        els.p2pRatesPanel.classList.add('hidden');
        els.whatsappBoxContainer.classList.add('hidden');
        els.remesaResultsDisplay.innerHTML = `
            <div class="empty-state">
                <span class="large-icon">💸</span>
                <p>Completa el formulario y presiona 'Consultar Binance P2P' o ingresa una tasa para calcular la cotización.</p>
            </div>
        `;
        state.currentCalculatedRemesa = null;
        
        // Reload all data
        await initDashboard();
    } catch (err) {
        alert("Error al registrar remesa: " + err.message);
    } finally {
        if (els.btnRegistrarRemesa) {
            els.btnRegistrarRemesa.disabled = false;
            els.btnRegistrarRemesa.textContent = "💾 Registrar Remesa en Historial";
        }
    }
}

// Remesa Edit and Delete functions
async function eliminarRemesa(id) {
    if (!confirm("¿Estás seguro de que deseas eliminar esta remesa del historial? Esta acción no se puede deshacer.")) return;
    try {
        await apiCall(`/remesas/${id}`, 'DELETE');
        alert("Remesa eliminada correctamente.");
        await initDashboard();
    } catch (err) {
        alert("Error al eliminar remesa: " + err.message);
    }
}

function formatFechaForDatetimeLocal(fechaStr) {
    if (!fechaStr) return '';
    try {
        const parts = fechaStr.trim().split(' ');
        if (parts.length >= 2 && parts[0].includes('/')) {
            const [d, m, y] = parts[0].split('/');
            let timeStr = parts[1];
            let [hh, mm] = timeStr.split(':');
            let hours = parseInt(hh, 10);
            if (parts.length >= 3) {
                const ampm = parts[2].toUpperCase();
                if (ampm === 'PM' && hours < 12) hours += 12;
                if (ampm === 'AM' && hours === 12) hours = 0;
            }
            const paddedH = String(hours).padStart(2, '0');
            const paddedM = String(mm).padStart(2, '0');
            const paddedD = String(d).padStart(2, '0');
            const paddedMonth = String(m).padStart(2, '0');
            return `${y}-${paddedMonth}-${paddedD}T${paddedH}:${paddedM}`;
        }
        if (fechaStr.includes('-')) {
            return fechaStr.replace(' ', 'T').substring(0, 16);
        }
    } catch (e) {
        console.error("Error formatting date for input:", e);
    }
    return '';
}

function iniciarEditarRemesa(id) {
    const r = (state.rawRemesas || []).find(rem => rem.id === id);
    if (!r) return;
    
    document.getElementById('edit-remesa-id').value = r.id;
    document.getElementById('edit-remesa-cliente').value = r.cliente_nombre;
    const inputFecha = document.getElementById('edit-remesa-fecha');
    if (inputFecha && r.fecha) {
        inputFecha.value = formatFechaForDatetimeLocal(r.fecha);
    }
    document.getElementById('edit-remesa-monto-usd').value = r.monto_usd;
    document.getElementById('edit-remesa-tasa-p2p').value = r.tasa_p2p;
    document.getElementById('edit-remesa-tasa-cliente').value = r.tasa_cliente;
    document.getElementById('edit-remesa-metodo-pago').value = r.metodo_pago;
    document.getElementById('edit-remesa-banco-receptor').value = r.banco_receptor;
    document.getElementById('edit-remesa-costo-adquisicion').value = r.costo_adquisicion_usdt * 100;
    document.getElementById('edit-remesa-comision-binance').value = r.comision_binance * 100;
    
    document.getElementById('modal-editar-remesa').classList.remove('hidden');
}

function cerrarModalEditarRemesa() {
    document.getElementById('modal-editar-remesa').classList.add('hidden');
}

// Zelle Movements Logic
async function loadZelleMovimientos() {
    try {
        const data = await apiCall('/zelle/movimientos');
        
        // Update summary cards
        els.zelleSaldoCalculado.textContent = `$${data.summary.saldo_actual.toLocaleString('es-VE', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
        els.zelleIngresosSemanales.textContent = `$${data.summary.weekly_ingresos.toLocaleString('es-VE', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
        els.zelleEgresosSemanales.textContent = `$${data.summary.weekly_egresos.toLocaleString('es-VE', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
        
        // Update pending header indicator if element exists
        const zellePendientesEl = document.getElementById('zelle-pendientes-remesar');
        if (zellePendientesEl) {
            zellePendientesEl.textContent = `$${(data.summary.pendientes_remesar_usd || 0.0).toFixed(2)}`;
        }

        // Populate table body
        els.zelleTableBody.innerHTML = '';
        if (data.items.length === 0) {
            els.zelleTableBody.innerHTML = '<tr><td colspan="7" class="text-center text-muted">No hay movimientos registrados en Zelle</td></tr>';
            return;
        }
        
        data.items.forEach(item => {
            const tr = document.createElement('tr');
            const isIngreso = item.tipo === 'ingreso';
            const estadoStr = item.estado || 'completado';
            
            let estadoBadge = '<span class="badge" style="background: rgba(16,185,129,0.15); color: #10b981; border: 1px solid rgba(16,185,129,0.3); font-size: 0.72rem;">✅ Completado</span>';
            if (estadoStr === 'pendiente') {
                estadoBadge = '<span class="badge" style="background: rgba(245,158,11,0.15); color: #f59e0b; border: 1px solid rgba(245,158,11,0.3); font-size: 0.72rem;">⏳ Pendiente de Remesar</span>';
            } else if (estadoStr === 'remesado') {
                estadoBadge = '<span class="badge" style="background: rgba(59,130,246,0.15); color: #60a5fa; border: 1px solid rgba(59,130,246,0.3); font-size: 0.72rem;">✅ Remesado</span>';
            }
            
            const btnToggleEstado = estadoStr === 'pendiente' 
                ? `<button class="btn btn-sm" onclick="toggleEstadoZelle(${item.id}, 'pendiente')" style="padding: 2px 6px; font-size: 0.7rem; background: rgba(59,130,246,0.1); color: #60a5fa; border: 1px solid rgba(59,130,246,0.2);" title="Marcar como remesado">🚀 Remesado</button>`
                : `<button class="btn btn-sm" onclick="toggleEstadoZelle(${item.id}, '${estadoStr}')" style="padding: 2px 6px; font-size: 0.7rem; background: rgba(245,158,11,0.1); color: #f59e0b; border: 1px solid rgba(245,158,11,0.2);" title="Marcar como pendiente">⏳ Pendiente</button>`;
            
            tr.innerHTML = `
                <td>${item.fecha}</td>
                <td>
                    <span class="badge ${isIngreso ? 'badge-success' : 'badge-danger'}">
                        ${isIngreso ? '🟢 Ingreso' : '🔴 Egreso'}
                    </span>
                </td>
                <td><strong>${item.titular}</strong></td>
                <td>${item.detalle}</td>
                <td>${estadoBadge}</td>
                <td>
                    <strong class="${isIngreso ? 'text-success' : 'text-danger'}">
                        ${isIngreso ? '+' : '-'}$${item.monto.toLocaleString('es-VE', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                    </strong>
                </td>
                <td>
                    <div class="flex-row-align" style="gap: 4px;">
                        ${isIngreso ? btnToggleEstado : ''}
                        <button class="btn btn-danger btn-sm" onclick="eliminarMovimientoZelle(${item.id})" style="padding: 2px 6px; font-size: 0.7rem;">Eliminar</button>
                    </div>
                </td>
            `;
            els.zelleTableBody.appendChild(tr);
        });
    } catch (err) {
        console.error("Error loading Zelle movements:", err);
    }
}

window.toggleEstadoZelle = async function(id, currentEstado) {
    const nuevoEstado = currentEstado === 'pendiente' ? 'remesado' : 'pendiente';
    try {
        await apiCall(`/zelle/movimientos/${id}/estado`, 'PUT', { estado: nuevoEstado });
        showToast(`Estado Zelle actualizado a '${nuevoEstado === 'pendiente' ? '⏳ Pendiente' : '✅ Remesado'}'.`);
        loadZelleMovimientos();
    } catch (err) {
        showToast("Error al actualizar estado: " + err.message, "danger");
    }
};

async function registrarMovimientoZelle(tipo, monto, titular, detalle, fecha, estado) {
    try {
        const payload = {
            tipo,
            monto: parseFloat(monto),
            titular: titular || null,
            detalle: detalle || null,
            fecha: fecha || null,
            estado: estado || "completado"
        };
        
        await apiCall('/zelle/movimientos', 'POST', payload);
        showToast(`Movimiento de Zelle registrado con éxito.`);
        closeModalZelle();
        loadZelleMovimientos();
        loadCapital();
    } catch (err) {
        console.error("Error creating Zelle movement:", err);
        showToast("Error al registrar el movimiento de Zelle.", "error");
    }
}

async function eliminarMovimientoZelle(id) {
    if (!confirm("¿Estás seguro de que deseas eliminar este movimiento de Zelle? Se revertirá su impacto en el saldo de capital.")) {
        return;
    }
    try {
        await apiCall(`/zelle/movimientos/${id}`, 'DELETE');
        showToast("Movimiento de Zelle eliminado con éxito.");
        loadZelleMovimientos();
        loadCapital();
    } catch (err) {
        console.error("Error deleting Zelle movement:", err);
        showToast("Error al eliminar el movimiento de Zelle.", "error");
    }
}

function openModalZelle(tipo) {
    els.modalZelleTipo.value = tipo;
    els.modalZelleTitle.textContent = tipo === 'ingreso' ? '➕ Registrar Ingreso Zelle' : '➖ Registrar Egreso Zelle';
    els.modalZelleMonto.value = '';
    els.modalZelleTitular.value = '';
    els.modalZelleDetalle.value = '';
    els.modalZelleFecha.value = '';
    els.modalZelleMovimiento.classList.remove('hidden');
}

function closeModalZelle() {
    els.modalZelleMovimiento.classList.add('hidden');
}

// BCV Purchase Simulator Logic
function updateSimulatorCommissions() {
    if (!els.simBcvBanco) return;
    const banco = els.simBcvBanco.value;
    const isTerceraEdad = els.simBcvTerceraEdad.checked;

    // Tercera Edad exención only applies to BDV (Banco de Venezuela)
    if (banco === 'Venezuela' && isTerceraEdad) {
        els.simBcvComision.value = '0';
        els.simBcvComision.disabled = true;
    } else {
        els.simBcvComision.disabled = false;
        // Only auto-set commission if the user hasn't chosen Personalizado
        if (banco !== 'Personalizado') {
            // Comisión estándar BCV: 0.5% para todos los bancos excepto exención
            els.simBcvComision.value = '0.5';
        }
        // For Personalizado, leave current value so user can set their own
    }

    // Hide Tercera Edad checkbox visually if bank is not BDV
    const terceraEdadContainer = els.simBcvTerceraEdad ? els.simBcvTerceraEdad.closest('.input-group') : null;
    if (terceraEdadContainer) {
        terceraEdadContainer.style.opacity = banco === 'Venezuela' ? '1' : '0.4';
        terceraEdadContainer.style.pointerEvents = banco === 'Venezuela' ? 'auto' : 'none';
        if (banco !== 'Venezuela') els.simBcvTerceraEdad.checked = false;
    }

    recalculateSimulation();
}

// Initialize BCV Simulator with current BCV rate
function initBCVSimulator() {
    if (!els.simBcvTasa) return;
    // Pre-fill BCV rate from live state
    if (state.bcvRate && state.bcvRate > 0) {
        els.simBcvTasa.value = state.bcvRate.toFixed(4);
    }
    updateSimulatorCommissions();
}

function recalculateSimulation() {
    // Helper: format number with Venezuelan locale (period=thousands, comma=decimal)
    const fmt = (n, dec = 2) => n.toLocaleString('es-VE', { minimumFractionDigits: dec, maximumFractionDigits: dec });

    const clearOutputs = () => {
        if (els.simResPrincipalValue)  els.simResPrincipalValue.textContent  = '—';
        if (els.simResEquivMonto)      els.simResEquivMonto.textContent      = '—';
        if (els.simResComisionVes)     els.simResComisionVes.textContent     = '0,00 VES';
        if (els.simResTotalVes)        els.simResTotalVes.textContent        = '0,00 VES';
        if (els.simResCuentasValue)    els.simResCuentasValue.textContent    = '0 cuentas';
        if (els.simResCuentasDesc)     els.simResCuentasDesc.innerHTML       = '<span style="color:var(--text-muted);">Introduce un monto para calcular.</span>';
    };

    if (!els.simBcvMonto || !els.simBcvMonto.value || parseFloat(els.simBcvMonto.value) <= 0) {
        clearOutputs();
        return;
    }

    const monto        = parseFloat(els.simBcvMonto.value) || 0;
    const tasa         = parseFloat(els.simBcvTasa.value) || state.bcvRate || 0;
    const comisionPct  = (parseFloat(els.simBcvComision.value) || 0) / 100;
    const limiteCuenta = parseFloat(els.simBcvLimite.value) || 500;
    const modo         = els.simBcvModo.value;

    if (tasa <= 0) {
        clearOutputs();
        return;
    }

    // VES cost per USD (tasa + commission)
    const vesPerUsdTotal = tasa * (1 + comisionPct);

    let principalUSD = 0;
    let principalVES = 0;
    let comisionVES  = 0;
    let totalVES     = 0;

    if (modo === 'ves') {
        // ── Modo: Tengo VES, ¿cuántos USD compro? ──────────────────────────
        els.simBcvMontoLabel.textContent    = 'Monto de Bolívares Disponibles (VES)';
        els.simBcvMonto.placeholder         = 'Ej. 371.000';
        els.simResPrincipalLabel.textContent = 'Dólares Adquiridos (Neto)';
        els.simResEquivLabel.textContent    = 'Equivalente sin comisión:';

        // total_VES = principalUSD * tasa * (1 + comision)
        principalUSD = monto / vesPerUsdTotal;
        principalVES = principalUSD * tasa;
        comisionVES  = principalVES * comisionPct;
        totalVES     = monto;   // = principalVES + comisionVES

        els.simResPrincipalValue.textContent = `$${fmt(principalUSD)} USD`;
        els.simResEquivMonto.textContent     = `${fmt(principalVES)} VES neto`;

    } else {
        // ── Modo: Quiero comprar X USD ──────────────────────────────────────
        els.simBcvMontoLabel.textContent    = 'Monto de Dólares a Comprar ($)';
        els.simBcvMonto.placeholder         = 'Ej. 500';
        els.simResPrincipalLabel.textContent = 'Total VES Requeridos';
        els.simResEquivLabel.textContent    = 'VES solo divisas (sin comisión):';

        principalUSD = monto;
        principalVES = principalUSD * tasa;
        comisionVES  = principalVES * comisionPct;
        totalVES     = principalVES + comisionVES;

        els.simResPrincipalValue.textContent = `${fmt(totalVES)} VES`;
        els.simResEquivMonto.textContent     = `${fmt(principalVES)} VES`;
    }

    els.simResComisionVes.textContent = comisionPct > 0
        ? `${fmt(comisionVES)} VES (${fmt(comisionPct * 100, 2)}%)`
        : '0,00 VES (Exento)';
    els.simResTotalVes.textContent    = `${fmt(totalVES)} VES`;

    // ── Distribución por cuenta ─────────────────────────────────────────────
    if (limiteCuenta <= 0 || principalUSD <= 0) {
        els.simResCuentasValue.textContent = '—';
        els.simResCuentasDesc.innerHTML    = '<span style="color:var(--text-muted);">Define un límite por cuenta.</span>';
        return;
    }

    const cuentasNecesarias = Math.ceil(principalUSD / limiteCuenta);
    els.simResCuentasValue.textContent = `${cuentasNecesarias} ${cuentasNecesarias === 1 ? 'cuenta' : 'cuentas'}`;

    // Build detailed per-account table
    let remainingUSD = principalUSD;
    let rowsHtml = `
        <div style="margin-top:8px; border:1px solid rgba(168,85,247,0.2); border-radius:8px; overflow:hidden;">
            <div style="display:grid; grid-template-columns:auto 1fr 1fr; gap:0; font-size:0.72rem; font-weight:700; color:var(--text-secondary); padding:5px 10px; background:rgba(168,85,247,0.08); text-transform:uppercase; letter-spacing:0.04em;">
                <span style="padding-right:10px;">#</span>
                <span>USD</span>
                <span style="text-align:right;">VES a depositar</span>
            </div>`;

    for (let i = 0; i < cuentasNecesarias; i++) {
        const usdCuenta  = Math.min(remainingUSD, limiteCuenta);
        const vesCuenta  = usdCuenta * vesPerUsdTotal;
        const isLast     = i === cuentasNecesarias - 1;
        const rowBg      = isLast && cuentasNecesarias > 1
            ? 'background:rgba(245,158,11,0.06);'
            : (i % 2 === 0 ? 'background:rgba(255,255,255,0.02);' : '');

        rowsHtml += `
            <div style="display:grid; grid-template-columns:auto 1fr 1fr; gap:0; font-size:0.82rem; padding:6px 10px; border-top:1px solid rgba(255,255,255,0.05); align-items:center; ${rowBg}">
                <span style="color:var(--text-muted); padding-right:10px; font-size:0.72rem;">${i + 1}</span>
                <span style="font-weight:600; color:var(--secondary);">$${fmt(usdCuenta)} USD</span>
                <span style="text-align:right; color:var(--text-primary); font-weight:500;">${fmt(vesCuenta)} Bs</span>
            </div>`;
        remainingUSD -= usdCuenta;
    }

    // Totals footer
    rowsHtml += `
            <div style="display:grid; grid-template-columns:auto 1fr 1fr; gap:0; font-size:0.82rem; padding:6px 10px; border-top:1px solid rgba(255,255,255,0.12); background:rgba(255,255,255,0.04); align-items:center;">
                <span style="padding-right:10px; font-size:0.72rem; color:var(--text-muted);">∑</span>
                <span style="font-weight:700; color:var(--primary);">$${fmt(principalUSD)} USD</span>
                <span style="text-align:right; font-weight:700; color:var(--accent);">${fmt(totalVES)} Bs</span>
            </div>
        </div>`;

    if (comisionPct > 0) {
        rowsHtml += `<p style="font-size:0.7rem; color:var(--text-muted); margin-top:5px; line-height:1.3;">
            * Cada cuenta incluye ${fmt(comisionPct * 100, 2)}% de comisión bancaria en los VES.
        </p>`;
    } else {
        rowsHtml += `<p style="font-size:0.7rem; color:#10b981; margin-top:5px; line-height:1.3;">
            ✓ Sin comisión bancaria aplicada (Tercera Edad / Exento).
        </p>`;
    }

    els.simResCuentasDesc.innerHTML = rowsHtml;
}
let semanalChartRef = null;
let mensualChartRef = null;
let remesasTraficoDiasChartRef = null;
let remesasMejoresClientesChartRef = null;
let remesasMetodosChartRef = null;
let remesasBancosDestinoChartRef = null;
let comprasTitularesChartRef = null;
let tendenciaTasasChartRef = null;

async function loadAndRenderCharts() {
    try {
        const periodSelect = els.statsPeriodoSelect ? els.statsPeriodoSelect.value : 'semana';
        const customRangeContainer = document.getElementById('stats-custom-range-container');
        const fechaDesdeVal = document.getElementById('stats-fecha-desde') ? document.getElementById('stats-fecha-desde').value : '';
        const fechaHastaVal = document.getElementById('stats-fecha-hasta') ? document.getElementById('stats-fecha-hasta').value : '';
        
        let apiPeriod = periodSelect;
        let url = `/stats/dashboard?period=${apiPeriod}`;
        if (periodSelect === 'personalizado') {
            if (customRangeContainer) customRangeContainer.classList.remove('hidden');
            apiPeriod = 'historico';
            url = `/stats/dashboard?period=historico&start_date=${fechaDesdeVal}&end_date=${fechaHastaVal}`;
        } else {
            if (customRangeContainer) customRangeContainer.classList.add('hidden');
        }

        const stats = await apiCall(url);
        
        // 0. Update summary KPI cards
        if (stats.summary) {
            const labelHist = document.getElementById('stats-label-historica');
            const labelSem = document.getElementById('stats-label-semanal');
            const labelMen = document.getElementById('stats-label-mensual');
            
            if (periodSelect === 'personalizado') {
                if (labelHist) labelHist.textContent = "Ganancia Período Filtrado";
                if (labelSem) labelSem.textContent = "Ganancia Remesas (Período)";
                if (labelMen) labelMen.textContent = "Ganancia Arbitraje (Período)";
                
                document.getElementById('stats-ganancia-historica').textContent = `$${stats.summary.ganancia_rango_consolidada.toLocaleString('es-VE', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
                document.getElementById('stats-ganancia-semanal').textContent = `$${stats.summary.total_ganancia_remesas.toLocaleString('es-VE', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
                document.getElementById('stats-ganancia-mensual').textContent = `$${stats.summary.total_ganancia_arbitraje.toLocaleString('es-VE', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
            } else {
                if (labelHist) labelHist.textContent = "Ganancia Combinada Total";
                if (labelSem) labelSem.textContent = "Ganancia Semanal";
                if (labelMen) labelMen.textContent = "Ganancia Mensual";
                
                document.getElementById('stats-ganancia-historica').textContent = `$${stats.summary.ganancia_historica_consolidada.toLocaleString('es-VE', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
                document.getElementById('stats-ganancia-semanal').textContent = `$${stats.summary.ganancia_semanal_consolidada.toLocaleString('es-VE', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
                document.getElementById('stats-ganancia-mensual').textContent = `$${stats.summary.ganancia_mensual_consolidada.toLocaleString('es-VE', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
            }
            
            const pctRem = stats.summary.pct_remesas.toFixed(0);
            const pctArb = stats.summary.pct_arbitraje.toFixed(0);
            document.getElementById('stats-mix-negocio').textContent = `💸 ${pctRem}% / 🔄 ${pctArb}%`;

            // Remesas KPIs
            document.getElementById('stats-total-remitido').textContent = `$${stats.summary.total_remitido.toLocaleString('es-VE', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
            document.getElementById('stats-ganancia-remesas').textContent = `$${stats.summary.total_ganancia_remesas.toLocaleString('es-VE', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
            document.getElementById('stats-margen-promedio').textContent = `${stats.summary.margen_promedio.toFixed(2)}%`;
            document.getElementById('stats-total-operaciones').textContent = stats.summary.total_operaciones;
            
            // Arbitraje KPIs
            document.getElementById('stats-total-arbitrado').textContent = `$${stats.summary.total_arbitrado.toLocaleString('es-VE', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
            document.getElementById('stats-ganancia-arbitraje').textContent = `$${stats.summary.total_ganancia_arbitraje.toLocaleString('es-VE', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
            document.getElementById('stats-rentabilidad-promedio').textContent = `${stats.summary.rentabilidad_promedio.toFixed(2)}%`;
            document.getElementById('stats-total-ciclos').textContent = stats.summary.total_ciclos;
        }

        // Reuse state data to avoid redundant slow API queries
        const compras = state.compras || [];
        const titulares = state.titulares || [];
        const ciclos = state.ciclos || [];

        if (compras.length > 0) {
            let filteredCompras = compras;

            if (periodSelect === 'personalizado' && fechaDesdeVal && fechaHastaVal) {
                const dDesde = new Date(fechaDesdeVal);
                const dHasta = new Date(fechaHastaVal);
                dHasta.setHours(23, 59, 59);

                filteredCompras = compras.filter(c => {
                    const dComp = parseSpanishDate(c.fecha);
                    return dComp >= dDesde && dComp <= dHasta;
                });
            } else {
                filteredCompras = compras.filter(c => isDateInPeriod(c.fecha, periodSelect));
            }

            const totalUsdBought = filteredCompras.reduce((sum, c) => sum + (c.monto_usd || 0), 0);
            const totalVesSpent = filteredCompras.reduce((sum, c) => sum + ((c.monto_usd || 0) * (c.tasa_bcv || 0)), 0);
            const avgBcvRate = totalUsdBought > 0 ? (totalVesSpent / totalUsdBought) : (state.bcvRate || 0);
            const totalCommVes = filteredCompras.reduce((sum, c) => sum + (c.comision_ves || 0), 0);

            if (document.getElementById('stats-compras-total-usd')) {
                document.getElementById('stats-compras-total-usd').textContent = `$${totalUsdBought.toLocaleString('es-VE', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
                document.getElementById('stats-compras-total-ves').textContent = `${totalVesSpent.toLocaleString('es-VE', {minimumFractionDigits: 2, maximumFractionDigits: 2})} VES`;
                document.getElementById('stats-compras-tasa-promedio').textContent = `${avgBcvRate.toLocaleString('es-VE', {minimumFractionDigits: 2, maximumFractionDigits: 2})} Bs`;
                document.getElementById('stats-compras-comision-ves').textContent = `${totalCommVes.toLocaleString('es-VE', {minimumFractionDigits: 2, maximumFractionDigits: 2})} VES`;
            }
        }

        // Render Weekly Chart
        const ctxSemanal = document.getElementById('chart-semanal');
        if (ctxSemanal) {
            const labels = stats.weekly.map(item => `${item.label} (${item.date})`);
            const volRemesas = stats.weekly.map(item => item.volumen_remesas);
            const volCiclos = stats.weekly.map(item => item.volumen_ciclos);
            const ganTotal = stats.weekly.map(item => item.ganancia_remesas + item.ganancia_ciclos);
            
            if (semanalChartRef) semanalChartRef.destroy();
            
            semanalChartRef = new Chart(ctxSemanal, {
                type: 'bar',
                data: {
                    labels: labels,
                    datasets: [
                        {
                            label: 'Ganancia Combinada ($)',
                            data: ganTotal,
                            type: 'line',
                            borderColor: '#10B981',
                            backgroundColor: 'rgba(16, 185, 129, 0.1)',
                            borderWidth: 3,
                            fill: true,
                            tension: 0.3,
                            yAxisID: 'y1'
                        },
                        {
                            label: 'Volumen Remesas ($)',
                            data: volRemesas,
                            yAxisID: 'y'
                        },
                        {
                            label: 'Volumen Arbitraje ($)',
                            data: volCiclos,
                            backgroundColor: 'rgba(88, 86, 214, 0.4)',
                            borderColor: '#5856D6',
                            borderWidth: 1,
                            yAxisID: 'y'
                        },
                        {
                            label: 'Ganancia Total ($)',
                            data: ganTotal,
                            type: 'line',
                            borderColor: '#10B981',
                            backgroundColor: 'rgba(16, 185, 129, 0.1)',
                            fill: true,
                            tension: 0.3,
                            yAxisID: 'y1'
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: {
                            type: 'linear',
                            display: true,
                            position: 'left',
                            title: {
                                display: true,
                                text: 'Volumen Total ($)',
                                color: '#9CA3AF'
                            },
                            grid: {
                                color: 'rgba(255, 255, 255, 0.05)'
                            },
                            ticks: { color: '#9CA3AF' }
                        },
                        y1: {
                            type: 'linear',
                            display: true,
                            position: 'right',
                            title: {
                                display: true,
                                text: 'Ganancia ($)',
                                color: '#9CA3AF'
                            },
                            grid: {
                                drawOnChartArea: false
                            },
                            ticks: { color: '#9CA3AF' }
                        },
                        x: {
                            grid: {
                                color: 'rgba(255, 255, 255, 0.05)'
                            },
                            ticks: { color: '#9CA3AF' }
                        }
                    },
                    plugins: {
                        legend: {
                            labels: { color: '#F3F4F6' }
                        }
                    }
                }
            });
        }
        
        // Render Monthly Chart
        const ctxMensual = document.getElementById('chart-mensual');
        if (ctxMensual) {
            const labels = stats.monthly.map(item => item.label);
            const volTotal = stats.monthly.map(item => item.volumen_remesas + item.volumen_ciclos);
            const ganTotal = stats.monthly.map(item => item.ganancia_remesas + item.ganancia_ciclos);
            
            if (mensualChartRef) {
                mensualChartRef.destroy();
            }
            
            mensualChartRef = new Chart(ctxMensual, {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [
                        {
                            label: 'Volumen Movilizado ($)',
                            data: volTotal,
                            borderColor: 'rgba(0, 112, 243, 0.8)',
                            backgroundColor: 'rgba(0, 112, 243, 0.05)',
                            fill: true,
                            tension: 0.3,
                            yAxisID: 'y'
                        },
                        {
                            label: 'Ganancia Consolidada ($)',
                            data: ganTotal,
                            borderColor: '#10B981',
                            backgroundColor: 'rgba(16, 185, 129, 0.1)',
                            fill: true,
                            tension: 0.3,
                            yAxisID: 'y1'
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: {
                            type: 'linear',
                            display: true,
                            position: 'left',
                            title: {
                                display: true,
                                text: 'Volumen ($)',
                                color: '#9CA3AF'
                            },
                            grid: {
                                color: 'rgba(255, 255, 255, 0.05)'
                            },
                            ticks: { color: '#9CA3AF' }
                        },
                        y1: {
                            type: 'linear',
                            display: true,
                            position: 'right',
                            title: {
                                display: true,
                                text: 'Ganancia ($)',
                                color: '#9CA3AF'
                            },
                            grid: {
                                drawOnChartArea: false
                            },
                            ticks: { color: '#9CA3AF' }
                        },
                        x: {
                            grid: {
                                color: 'rgba(255, 255, 255, 0.05)'
                            },
                            ticks: { color: '#9CA3AF' }
                        }
                    },
                    plugins: {
                        legend: {
                            labels: { color: '#F3F4F6' }
                        }
                    }
                }
            });
        }

        // Render Remesas Traffic by Day of the Week Chart
        const ctxTraficoDias = document.getElementById('chart-remesas-trafico-dias');
        if (ctxTraficoDias && stats.traffic_days) {
            const labels = stats.traffic_days.map(item => item.label);
            const volData = stats.traffic_days.map(item => item.volumen);
            const countData = stats.traffic_days.map(item => item.count);

            if (remesasTraficoDiasChartRef) {
                remesasTraficoDiasChartRef.destroy();
            }

            remesasTraficoDiasChartRef = new Chart(ctxTraficoDias, {
                type: 'bar',
                data: {
                    labels: labels,
                    datasets: [
                        {
                            label: 'Volumen Enviado ($)',
                            data: volData,
                            backgroundColor: 'rgba(0, 112, 243, 0.4)',
                            borderColor: '#0070F3',
                            borderWidth: 1,
                            yAxisID: 'y'
                        },
                        {
                            label: 'Número de Envíos',
                            data: countData,
                            type: 'line',
                            borderColor: '#A855F7',
                            backgroundColor: 'transparent',
                            borderWidth: 2,
                            tension: 0.3,
                            yAxisID: 'y1'
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: {
                            type: 'linear',
                            position: 'left',
                            title: { display: true, text: 'Volumen ($)', color: '#9CA3AF' },
                            grid: { color: 'rgba(255, 255, 255, 0.05)' },
                            ticks: { color: '#9CA3AF' }
                        },
                        y1: {
                            type: 'linear',
                            position: 'right',
                            title: { display: true, text: 'Operaciones', color: '#9CA3AF' },
                            grid: { drawOnChartArea: false },
                            ticks: { color: '#9CA3AF', stepSize: 1 }
                        },
                        x: {
                            grid: { color: 'rgba(255, 255, 255, 0.05)' },
                            ticks: { color: '#9CA3AF' }
                        }
                    },
                    plugins: {
                        legend: { labels: { color: '#F3F4F6' } }
                    }
                }
            });
        }

        // Render Top Clients Chart
        const ctxMejoresClientes = document.getElementById('chart-remesas-mejores-clientes');
        if (ctxMejoresClientes && stats.top_clients) {
            const labels = stats.top_clients.map(item => item.name);
            const volData = stats.top_clients.map(item => item.volumen);
            const countData = stats.top_clients.map(item => item.count);

            if (remesasMejoresClientesChartRef) {
                remesasMejoresClientesChartRef.destroy();
            }

            remesasMejoresClientesChartRef = new Chart(ctxMejoresClientes, {
                type: 'bar',
                data: {
                    labels: labels,
                    datasets: [
                        {
                            label: 'Volumen Total ($)',
                            data: volData,
                            backgroundColor: 'rgba(16, 185, 129, 0.4)',
                            borderColor: '#10B981',
                            borderWidth: 1
                        }
                    ]
                },
                options: {
                    indexAxis: 'y',
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        x: {
                            grid: { color: 'rgba(255, 255, 255, 0.05)' },
                            ticks: { color: '#9CA3AF' }
                        },
                        y: {
                            grid: { color: 'rgba(255, 255, 255, 0.05)' },
                            ticks: { color: '#9CA3AF' }
                        }
                    },
                    plugins: {
                        legend: { labels: { color: '#F3F4F6' } },
                        tooltip: {
                            callbacks: {
                                footer: (tooltipItems) => {
                                    const index = tooltipItems[0].dataIndex;
                                    const count = countData[index];
                                    return `Transacciones: ${count}`;
                                }
                            }
                        }
                    }
                }
            });
        }

        // Render Payment Methods Chart
        const ctxMetodos = document.getElementById('chart-remesas-metodos');
        if (ctxMetodos && stats.payment_methods) {
            const labels = stats.payment_methods.map(item => item.metodo);
            const data = stats.payment_methods.map(item => item.volumen);

            if (remesasMetodosChartRef) {
                remesasMetodosChartRef.destroy();
            }

            const colors = [
                'rgba(59, 130, 246, 0.6)',
                'rgba(249, 115, 22, 0.6)',
                'rgba(16, 185, 129, 0.6)',
                'rgba(139, 92, 246, 0.6)',
                'rgba(236, 72, 153, 0.6)',
                'rgba(234, 179, 8, 0.6)'
            ];

            remesasMetodosChartRef = new Chart(ctxMetodos, {
                type: 'doughnut',
                data: {
                    labels: labels,
                    datasets: [
                        {
                            data: data,
                            backgroundColor: colors.slice(0, labels.length),
                            borderColor: '#111827',
                            borderWidth: 2
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'right',
                            labels: { color: '#F3F4F6', boxWidth: 15 }
                        }
                    }
                }
            });
        }

        // Render Destination Banks Chart
        const ctxBancosDestino = document.getElementById('chart-remesas-bancos-destino');
        if (ctxBancosDestino && stats.banks_destination) {
            const labels = stats.banks_destination.map(item => item.banco);
            const data = stats.banks_destination.map(item => item.volumen);

            if (remesasBancosDestinoChartRef) {
                remesasBancosDestinoChartRef.destroy();
            }

            const colors = [
                'rgba(139, 92, 246, 0.6)',
                'rgba(236, 72, 153, 0.6)',
                'rgba(59, 130, 246, 0.6)',
                'rgba(249, 115, 22, 0.6)',
                'rgba(16, 185, 129, 0.6)',
                'rgba(234, 179, 8, 0.6)'
            ];

            remesasBancosDestinoChartRef = new Chart(ctxBancosDestino, {
                type: 'doughnut',
                data: {
                    labels: labels,
                    datasets: [
                        {
                            data: data,
                            backgroundColor: colors.slice(0, labels.length),
                            borderColor: '#111827',
                            borderWidth: 2
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'right',
                            labels: { color: '#F3F4F6', boxWidth: 15 }
                        }
                    }
                }
            });
        }

        // Render Purchases by Titular Chart
        const ctxComprasTitulares = document.getElementById('chart-compras-titulares');
        const allCompras = state.compras || [];
        if (ctxComprasTitulares && allCompras.length > 0) {
            const cardToTitularMap = {};
            titulares.forEach(tit => {
                if (tit.tarjetas) {
                    tit.tarjetas.forEach(card => {
                        cardToTitularMap[card.id] = tit.nombre;
                    });
                }
            });
            
            const comprasPorTitular = {};
            allCompras.forEach(c => {
                const titName = cardToTitularMap[c.tarjeta_id] || "Titular Desconocido";
                comprasPorTitular[titName] = (comprasPorTitular[titName] || 0) + (c.monto_usd || 0);
            });
            
            const labels = Object.keys(comprasPorTitular);
            const dataValues = Object.values(comprasPorTitular);
            
            if (comprasTitularesChartRef) {
                comprasTitularesChartRef.destroy();
            }
            
            comprasTitularesChartRef = new Chart(ctxComprasTitulares, {
                type: 'bar',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'Dólares Comprados ($)',
                        data: dataValues,
                        backgroundColor: 'rgba(59, 130, 246, 0.6)',
                        borderColor: '#3B82F6',
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: {
                            grid: { color: 'rgba(255, 255, 255, 0.05)' },
                            ticks: { color: '#9CA3AF' }
                        },
                        x: {
                            grid: { color: 'rgba(255, 255, 255, 0.05)' },
                            ticks: { color: '#9CA3AF' }
                        }
                    },
                    plugins: {
                        legend: { labels: { color: '#F3F4F6' } }
                    }
                }
            });
        }
        
        // Render Trend of P2P vs BCV Rates Chart
        const ctxTendenciaTasas = document.getElementById('chart-tendencia-tasas');
        if (ctxTendenciaTasas) {
            const sortedCiclos = [...ciclos].filter(c => c.tasa_bcv > 0 && c.tasa_venta > 0);
            let periodCiclos = sortedCiclos;
            if (periodSelect === 'personalizado' && fechaDesdeVal && fechaHastaVal) {
                const dDesde = new Date(fechaDesdeVal);
                const dHasta = new Date(fechaHastaVal);
                dHasta.setHours(23, 59, 59);
                periodCiclos = sortedCiclos.filter(c => {
                    const dComp = parseSpanishDate(c.fecha);
                    return dComp >= dDesde && dComp <= dHasta;
                });
            } else {
                periodCiclos = sortedCiclos.filter(c => isDateInPeriod(c.fecha, periodSelect));
            }
            
            // Sort chronologically
            periodCiclos.sort((a, b) => parseSpanishDate(a.fecha) - parseSpanishDate(b.fecha));
            
            const labels = periodCiclos.map(c => {
                const d = parseSpanishDate(c.fecha);
                return d.toLocaleDateString('es-VE', { day: '2-digit', month: '2-digit' });
            });
            const dataVenta = periodCiclos.map(c => c.tasa_venta);
            const dataBcv = periodCiclos.map(c => {
                let avgRate = c.tasa_bcv;
                if (c.compras_parciales && c.compras_parciales.length > 0) {
                    const totalUsd = c.divisas_compradas || 0.0;
                    let weightedSum = 0;
                    c.compras_parciales.forEach(cp => {
                        weightedSum += cp.usd_comprados * cp.tasa_bcv;
                    });
                    avgRate = totalUsd > 0 ? (weightedSum / totalUsd) : c.tasa_bcv;
                }
                return avgRate;
            });
            
            if (tendenciaTasasChartRef) {
                tendenciaTasasChartRef.destroy();
            }
            
            tendenciaTasasChartRef = new Chart(ctxTendenciaTasas, {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [
                        {
                            label: 'Tasa Venta P2P (VES/$)',
                            data: dataVenta,
                            borderColor: '#F59E0B',
                            backgroundColor: 'rgba(245, 158, 11, 0.1)',
                            fill: false,
                            tension: 0.2
                        },
                        {
                            label: 'Tasa Compra BCV (VES/$)',
                            data: dataBcv,
                            borderColor: '#10B981',
                            backgroundColor: 'rgba(16, 185, 129, 0.1)',
                            fill: false,
                            tension: 0.2
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: {
                            grid: { color: 'rgba(255, 255, 255, 0.05)' },
                            ticks: { color: '#9CA3AF' }
                        },
                        x: {
                            grid: { color: 'rgba(255, 255, 255, 0.05)' },
                            ticks: { color: '#9CA3AF' }
                        }
                    },
                    plugins: {
                        legend: { labels: { color: '#F3F4F6' } }
                    }
                }
            });
        }

    } catch (err) {
        console.error("Error loading stats for charts:", err);
    }
}

function exportRemesasToCSV() {
    apiCall('/remesas').then(remesas => {
        if (!remesas || remesas.length === 0) {
            alert("No hay remesas registradas para exportar.");
            return;
        }
        
        let csvContent = "\uFEFF"; // UTF-8 BOM to support accents in Excel
        csvContent += "ID;Fecha;Cliente;Monto USD;Tasa P2P;Tasa Cliente;Monto VES;Adq. USDT %;Comision Binance %;Ganancia USD\n";
        
        remesas.forEach(r => {
            const adqPct = (r.costo_adquisicion_usdt * 100).toFixed(2) + "%";
            const comBinPct = (r.comision_binance * 100).toFixed(2) + "%";
            const row = [
                r.id,
                r.fecha,
                `"${r.cliente_nombre.replace(/"/g, '""')}"`,
                r.monto_usd.toFixed(2),
                r.tasa_p2p.toFixed(2),
                r.tasa_cliente.toFixed(2),
                r.monto_ves.toFixed(2),
                adqPct,
                comBinPct,
                r.ganancia_usd.toFixed(2)
            ].join(";");
            csvContent += row + "\n";
        });
        
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `Reporte_Remesas_${new Date().toISOString().slice(0,10)}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }).catch(err => {
        alert("Error al exportar remesas: " + err.message);
    });
}

function parseSpanishDate(dateStr) {
    if (!dateStr) return new Date();
    
    // IMPORTANT: Never use new Date() directly on DD/MM/YYYY strings.
    // JavaScript parses them as MM/DD/YYYY (American format), so
    // "01/08/2026" becomes January 8 instead of August 1 — a silent wrong parse.
    // We detect the DD/MM/YYYY pattern and always use the manual parser.
    const isDDMMYYYY = /^\d{1,2}\/\d{1,2}\/\d{4}/.test(dateStr.trim());
    
    if (!isDDMMYYYY) {
        // For ISO or other unambiguous formats, let the browser parse
        let d = new Date(dateStr);
        if (!isNaN(d.getTime())) return d;
    }
    
    try {
        const parts = dateStr.trim().split(/\s+/);
        const dateParts = parts[0].split('/');
        if (dateParts.length === 3) {
            const day = parseInt(dateParts[0]);
            const month = parseInt(dateParts[1]) - 1; // JS months are 0-indexed
            const year = parseInt(dateParts[2]);
            
            let hours = 0;
            let minutes = 0;
            if (parts.length >= 2) {
                const timeParts = parts[1].split(':');
                hours = parseInt(timeParts[0]);
                minutes = parseInt(timeParts[1]);
                
                if (parts.length >= 3) {
                    const ampm = parts[2].toUpperCase();
                    if (ampm === 'PM' && hours < 12) hours += 12;
                    if (ampm === 'AM' && hours === 12) hours = 0;
                }
            }
            return new Date(year, month, day, hours, minutes);
        }
    } catch (e) {
        console.error("Error parsing Spanish date:", dateStr, e);
    }
    return new Date();
}

function isDateInPeriod(dateStr, period) {
    if (period === 'historico') return true;
    
    const d = parseSpanishDate(dateStr);
    if (isNaN(d.getTime())) return true;
    
    const now = new Date();
    
    if (period === 'mes') {
        return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
    }
    
    if (period === 'semana') {
        // Calculate start of current week (Monday)
        // getDay(): 0=Sunday, 1=Monday, ..., 6=Saturday
        // We want Monday as first day:
        //   - If today is Sunday (0): go back 6 days to Monday
        //   - Otherwise: go back (getDay() - 1) days
        const startOfWeek = new Date(now);
        const dayOfWeek = startOfWeek.getDay(); // 0=Sun
        const daysFromMonday = (dayOfWeek === 0) ? 6 : dayOfWeek - 1;
        startOfWeek.setDate(startOfWeek.getDate() - daysFromMonday);
        startOfWeek.setHours(0, 0, 0, 0);
        
        // End of week = Sunday 23:59:59
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 7);
        endOfWeek.setHours(0, 0, 0, 0);
        
        return d >= startOfWeek && d < endOfWeek;
    }
    
    return true;
}

window.deleteCompraParcialDirect = async function(compraId, cicloId) {
    if (!confirm("¿Deseas eliminar esta compra parcial de este sobre? Se devolverán los bolívares al sobre y se recalculará la ganancia.")) return;
    try {
        await apiCall(`/ciclos/compras/${compraId}`, 'DELETE');
        showToast("Compra parcial eliminada.");
        await initDashboard();
    } catch (err) {
        alert(err.message);
    }
};

function exportCiclosToCSV() {
    apiCall('/ciclos').then(ciclos => {
        if (!ciclos || ciclos.length === 0) {
            alert("No hay ciclos registrados para exportar.");
            return;
        }
        
        let csvContent = "\uFEFF"; // UTF-8 BOM
        csvContent += "ID;Fecha;USDT Vendidos;Tasa Venta;Banco Venta;Divisas Compradas;Tasa BCV Promedio;USD Recibidos Binance;Ganancia USD;Rentabilidad %;VES Restantes;Estatus\n";
        
        ciclos.forEach(c => {
            let avgRate = c.tasa_bcv;
            if (c.compras_parciales && c.compras_parciales.length > 0) {
                const totalUsd = c.divisas_compradas || 0.0;
                let weightedSum = 0;
                c.compras_parciales.forEach(cp => {
                    weightedSum += cp.usd_comprados * cp.tasa_bcv;
                });
                avgRate = totalUsd > 0 ? (weightedSum / totalUsd) : c.tasa_bcv;
            }
            
            const row = [
                c.id,
                c.fecha,
                c.usdt_vendidos.toFixed(2),
                c.tasa_venta.toFixed(2),
                `"${c.banco_venta.replace(/"/g, '""')}"`,
                c.divisas_compradas.toFixed(2),
                avgRate.toFixed(2),
                c.usd_recibidos_binance.toFixed(2),
                c.ganancia_usd.toFixed(2),
                c.ganancia_porcentaje.toFixed(2) + "%",
                c.bolivares_restantes.toFixed(2),
                c.status
            ].join(";");
            csvContent += row + "\n";
        });
        
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `Reporte_Ciclos_${new Date().toISOString().slice(0,10)}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }).catch(err => {
        alert("Error al exportar ciclos: " + err.message);
    });
}

// =====================================================
// FUNCIONES DE CONTROL DE PIN (FINANZAS PERSONALES)
// =====================================================
window.pressPinNum = function(num) {
    if (state.personalUnlocked) return;
    if (state.currentPinEntered.length < 4) {
        state.currentPinEntered += num;
        updatePinDisplay();
        document.getElementById('pin-error-msg').style.display = 'none';
        
        // Auto submit if 4 digits are reached
        if (state.currentPinEntered.length === 4) {
            setTimeout(submitPin, 200);
        }
    }
};

window.clearPin = function() {
    state.currentPinEntered = "";
    updatePinDisplay();
    document.getElementById('pin-error-msg').style.display = 'none';
};

function updatePinDisplay() {
    const dots = document.querySelectorAll('.pin-dot');
    dots.forEach((dot, index) => {
        if (index < state.currentPinEntered.length) {
            dot.classList.add('filled');
        } else {
            dot.classList.remove('filled');
        }
    });
}

window.submitPin = async function() {
    if (state.personalUnlocked) return;
    try {
        const res = await apiCall('/personal/verify-pin', 'POST', { pin: state.currentPinEntered });
        if (res.success) {
            state.personalUnlocked = true;
            document.getElementById('personal-lock-screen').style.display = 'none';
            document.getElementById('personal-main-panel').style.display = 'block';
            showToast("🔓 Acceso personal autorizado");
            loadPersonalFinanceData();
        }
    } catch (err) {
        clearPin();
        document.getElementById('pin-error-msg').style.display = 'block';
    }
};

let personalCategoryChart = null;
let personalIncomeChart = null;

// Inicialización de Listeners y Formularios de Finanzas Personales
function setupPersonalFinanceListeners() {
    // 1. Alternancia de Sub-pestañas en Finanzas Personales
    const subTabLinks = document.querySelectorAll('#tab-personal .sub-tab-link');
    const subTabPanes = document.querySelectorAll('#tab-personal .sub-tab-pane');
    
    subTabLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            subTabLinks.forEach(l => l.classList.remove('active'));
            subTabPanes.forEach(p => p.classList.remove('active'));
            
            link.classList.add('active');
            const target = link.getAttribute('data-subtab');
            document.getElementById(target).classList.add('active');
        });
    });



    // 2. Visibilidad condicional por Moneda (Gasto)
    const gastoMoneda = document.getElementById('p-gasto-moneda');
    const gastoTasaCont = document.getElementById('p-gasto-tasa-container');
    const gastoTasa = document.getElementById('p-gasto-tasa');
    
    gastoMoneda.addEventListener('change', () => {
        if (gastoMoneda.value === 'VES') {
            gastoTasaCont.style.display = 'block';
            gastoTasa.value = state.bcvRate || '';
            gastoTasa.required = true;
        } else {
            gastoTasaCont.style.display = 'none';
            gastoTasa.value = '';
            gastoTasa.required = false;
        }
    });

    // 3. Visibilidad condicional por Moneda (Ingreso)
    const ingresoMoneda = document.getElementById('p-ingreso-moneda');
    const ingresoTasaCont = document.getElementById('p-ingreso-tasa-container');
    const ingresoTasa = document.getElementById('p-ingreso-tasa');
    
    ingresoMoneda.addEventListener('change', () => {
        if (ingresoMoneda.value === 'VES') {
            ingresoTasaCont.style.display = 'block';
            ingresoTasa.value = state.bcvRate || '';
            ingresoTasa.required = true;
        } else {
            ingresoTasaCont.style.display = 'none';
            ingresoTasa.value = '';
            ingresoTasa.required = false;
        }
    });

    // 4. Campos condicionales inteligentes según Categoría seleccionada (Gasto)
    const gastoCategoria = document.getElementById('p-gasto-categoria');
    const condRecarga = document.getElementById('p-gasto-cond-recarga');
    const condServicio = document.getElementById('p-gasto-cond-servicio');
    const condInternet = document.getElementById('p-gasto-cond-internet');
    const condDeuda = document.getElementById('p-gasto-vincular-deuda');
    
    gastoCategoria.addEventListener('change', () => {
        const selectedOpt = gastoCategoria.options[gastoCategoria.selectedIndex];
        const catName = selectedOpt ? selectedOpt.textContent.replace(/^[^\s]+\s+/, '') : ''; // Quita el emoji
        
        condRecarga.style.display = (catName === 'Recargas Celular') ? 'flex' : 'none';
        condServicio.style.display = (catName === 'Servicios & Suscripciones') ? 'flex' : 'none';
        condInternet.style.display = (catName === 'Internet') ? 'flex' : 'none';
        condDeuda.style.display = (catName === 'Pago de Deuda') ? 'block' : 'none';
    });

    // 5. Mostrar campo "Otro" en Recarga Celular
    const recargaTitular = document.getElementById('p-recarga-titular');
    const recargaTitularOtroCont = document.getElementById('p-recarga-titular-otro-container');
    recargaTitular.addEventListener('change', () => {
        recargaTitularOtroCont.style.display = (recargaTitular.value === 'Otro') ? 'block' : 'none';
    });

    // 6. Mostrar campo "Otro" en Servicios
    const servicioNombre = document.getElementById('p-servicio-nombre');
    const servicioNombreOtroCont = document.getElementById('p-servicio-nombre-otro-container');
    servicioNombre.addEventListener('change', () => {
        servicioNombreOtroCont.style.display = (servicioNombre.value === 'Otro') ? 'block' : 'none';
    });

    // 7. Modales
    const btnOpenCat = document.getElementById('btn-open-category-config');
    const modalCat = document.getElementById('modal-personal-categoria');
    const btnCloseCat = document.getElementById('btn-close-modal-personal-categoria');
    
    btnOpenCat.addEventListener('click', () => openModal(modalCat));
    btnCloseCat.addEventListener('click', () => closeModal(modalCat));
    
    const modalPago = document.getElementById('modal-pago-deuda');
    const btnClosePago = document.getElementById('btn-close-modal-pago-deuda');
    btnClosePago.addEventListener('click', () => closeModal(modalPago));
    
    // Modal PIN
    const btnOpenPin = document.getElementById('btn-open-pin-config');
    const modalPin = document.getElementById('modal-personal-pin');
    const btnClosePin = document.getElementById('btn-close-modal-personal-pin');
    
    btnOpenPin.addEventListener('click', () => openModal(modalPin));
    btnClosePin.addEventListener('click', () => closeModal(modalPin));
    
    // Modal Edit Deuda
    const modalDeudaEdit = document.getElementById('modal-personal-deuda-edit');
    const btnCloseDeudaEdit = document.getElementById('btn-close-modal-deuda-edit');
    btnCloseDeudaEdit.addEventListener('click', () => closeModal(modalDeudaEdit));
    
    const pagoMoneda = document.getElementById('modal-pago-moneda');
    const pagoTasa  = document.getElementById('modal-pago-tasa');
    const pagoEquiv = document.getElementById('modal-pago-equiv');
    const pagoEquivLabel = document.getElementById('modal-pago-equiv-label');
    const pagoMontoLabel = document.getElementById('modal-pago-monto-label');

    function recalcPagoEquiv() {
        const moneda = pagoMoneda.value;
        const monto  = parseFloat(document.getElementById('modal-pago-monto').value) || 0;
        const tasa   = parseFloat(pagoTasa.value) || 0;

        if (moneda === 'VES') {
            pagoMontoLabel.textContent = 'Monto a Pagar (Bs)';
            pagoEquivLabel.textContent = 'Equivalente en USD';
            if (tasa > 0 && monto > 0) {
                pagoEquiv.value = '$' + (monto / tasa).toFixed(2) + ' USD';
            } else {
                pagoEquiv.value = '';
            }
        } else {
            pagoMontoLabel.textContent = 'Monto a Pagar (USD)';
            pagoEquivLabel.textContent = 'Equivalente en Bs';
            if (tasa > 0 && monto > 0) {
                pagoEquiv.value = 'Bs ' + (monto * tasa).toLocaleString('es-VE', {minimumFractionDigits:2, maximumFractionDigits:2});
            } else {
                pagoEquiv.value = '';
            }
        }
    }

    pagoMoneda.addEventListener('change', () => {
        // Pre-fill BCV rate from state when available
        if (!pagoTasa.value && state.bcvRate) pagoTasa.value = state.bcvRate;
        recalcPagoEquiv();
    });
    pagoTasa.addEventListener('input', recalcPagoEquiv);
    document.getElementById('modal-pago-monto').addEventListener('input', recalcPagoEquiv);

    // --- Nueva Deuda: auto-calc equivalent ---
    const deudaMoneda = document.getElementById('p-deuda-moneda');
    const deudaMontoPrincipal = document.getElementById('p-deuda-monto-principal');
    const deudaTasaBcv = document.getElementById('p-deuda-tasa-bcv');
    const deudaEquiv = document.getElementById('p-deuda-equiv');
    const deudaMontoLabel = document.getElementById('p-deuda-monto-label');
    const deudaEquivLabel = document.getElementById('p-deuda-equiv-label');

    function recalcDeudaEquiv() {
        const moneda = deudaMoneda.value;
        const monto  = parseFloat(deudaMontoPrincipal.value) || 0;
        const tasa   = parseFloat(deudaTasaBcv.value) || 0;

        if (moneda === 'VES') {
            deudaMontoLabel.textContent = 'Monto de la Deuda (Bs)';
            deudaEquivLabel.textContent = 'Equivalente en USD (calculado)';
            deudaMontoPrincipal.placeholder = '0.00 Bs';
            if (tasa > 0 && monto > 0) {
                deudaEquiv.value = (monto / tasa).toFixed(2);
            } else {
                deudaEquiv.value = '';
            }
        } else {
            deudaMontoLabel.textContent = 'Monto de la Deuda ($ USD)';
            deudaEquivLabel.textContent = 'Equivalente en Bs (calculado)';
            deudaMontoPrincipal.placeholder = '0.00';
            if (tasa > 0 && monto > 0) {
                deudaEquiv.value = (monto * tasa).toLocaleString('es-VE', {minimumFractionDigits:2, maximumFractionDigits:2});
            } else {
                deudaEquiv.value = '';
            }
        }
    }

    deudaMoneda.addEventListener('change', recalcDeudaEquiv);
    deudaMontoPrincipal.addEventListener('input', recalcDeudaEquiv);
    deudaTasaBcv.addEventListener('input', recalcDeudaEquiv);

    // 8. Formularios Submit
    document.getElementById('form-personal-gasto').addEventListener('submit', handleGastoSubmit);
    document.getElementById('form-personal-ingreso').addEventListener('submit', handleIngresoSubmit);
    document.getElementById('form-personal-deuda').addEventListener('submit', handleDeudaSubmit);
    document.getElementById('form-modal-personal-categoria').addEventListener('submit', handleCategoryModalSubmit);
    document.getElementById('form-modal-pago-deuda').addEventListener('submit', handlePagoDeudaModalSubmit);
    document.getElementById('form-modal-personal-pin').addEventListener('submit', handlePinModalSubmit);
    document.getElementById('form-modal-deuda-edit').addEventListener('submit', handleEditDeudaSubmit);

    // Cerrar modal de detalle de deuda
    document.getElementById('btn-close-modal-deuda-detalle').addEventListener('click', () => {
        closeModal(document.getElementById('modal-deuda-detalle'));
    });
}

// Carga principal de datos
async function loadPersonalFinanceData() {
    if (!state.personalUnlocked) return;
    
    try {
        // Cargar Categorías
        const cats = await apiCall('/personal/categorias');
        populatePersonalCategories(cats);
        initAnalisisDetalle(cats);  // Inicializar filtros con las categorías disponibles

        // Cargar Dashboard / Asesor
        const dash = await apiCall('/personal/dashboard');
        renderPersonalDashboard(dash);

        // Cargar Deudas
        const deudas = await apiCall('/personal/deudas');
        renderPersonalDeudasTable(deudas);

        // Cargar Historial
        const movimientos = await apiCall('/personal/movimientos');
        renderPersonalHistoryTable(movimientos);

    } catch (err) {
        console.error("Error al cargar finanzas personales:", err);
    }
}

// Poblar dropdowns de categorías
function populatePersonalCategories(cats) {
    const selectGasto = document.getElementById('p-gasto-categoria');
    const selectIngreso = document.getElementById('p-ingreso-categoria');
    
    const defaultGasto = selectGasto.value;
    const defaultIngreso = selectIngreso.value;
    
    selectGasto.innerHTML = '';
    selectIngreso.innerHTML = '';
    
    cats.forEach(c => {
        const opt = document.createElement('option');
        opt.value = c.id;
        opt.textContent = `${c.icono} ${c.nombre}`;
        
        if (c.tipo === 'gasto') {
            selectGasto.appendChild(opt);
        } else if (c.tipo === 'ingreso') {
            selectIngreso.appendChild(opt);
        }
    });
    
    if (defaultGasto) selectGasto.value = defaultGasto;
    if (defaultIngreso) selectIngreso.value = defaultIngreso;
    
    // Disparar evento para ajustar campos condicionales inicialmente
    const event = new Event('change');
    selectGasto.dispatchEvent(event);
}

// Renderizar Dashboard del Asesor Financiero Pro
function renderPersonalDashboard(dash) {
    // Cajetines
    document.getElementById('personal-ingresos-mes').textContent = `$${dash.total_ingresos_mes.toLocaleString('es-VE', {minimumFractionDigits:2, maximumFractionDigits:2})}`;
    document.getElementById('personal-gastos-mes').textContent = `$${dash.total_gastos_mes.toLocaleString('es-VE', {minimumFractionDigits:2, maximumFractionDigits:2})}`;
    document.getElementById('personal-flujo-neto').textContent = `$${dash.crecimiento_neto.toLocaleString('es-VE', {minimumFractionDigits:2, maximumFractionDigits:2})}`;
    document.getElementById('personal-deudas-pendientes').textContent = `$${dash.total_deudas.toLocaleString('es-VE', {minimumFractionDigits:2, maximumFractionDigits:2})}`;
    
    // Asesor
    document.getElementById('advisor-sueldo-sugerido').textContent = `$${dash.sueldo_sugerido.toLocaleString('es-VE', {minimumFractionDigits:2, maximumFractionDigits:2})} USD`;
    document.getElementById('advisor-ganancia-negocio').textContent = `$${dash.ganancia_negocio.toLocaleString('es-VE', {minimumFractionDigits:2, maximumFractionDigits:2})} USD`;
    
    const alertContainer = document.getElementById('advisor-alerts-container');
    alertContainer.innerHTML = '';
    
    dash.alertas.forEach(a => {
        const badge = document.createElement('div');
        badge.className = 'advisor-badge';
        
        let borderCol = 'rgba(255,255,255,0.06)';
        let bgCol = 'rgba(255,255,255,0.02)';
        let textCol = 'var(--text-primary)';
        
        if (a.tipo === 'rojo') {
            borderCol = 'rgba(239, 68, 68, 0.25)';
            bgCol = 'rgba(239, 68, 68, 0.05)';
            textCol = '#fca5a5';
        } else if (a.tipo === 'amarillo') {
            borderCol = 'rgba(245, 158, 11, 0.25)';
            bgCol = 'rgba(245, 158, 11, 0.05)';
            textCol = '#fde047';
        } else if (a.tipo === 'verde') {
            borderCol = 'rgba(16, 185, 129, 0.25)';
            bgCol = 'rgba(16, 185, 129, 0.05)';
            textCol = '#a7f3d0';
        }
        
        badge.style.border = `1px solid ${borderCol}`;
        badge.style.background = bgCol;
        badge.style.color = textCol;
        badge.style.padding = '0.55rem 0.75rem';
        badge.style.borderRadius = '8px';
        badge.style.fontSize = '0.78rem';
        badge.style.lineHeight = '1.35';
        badge.textContent = a.mensaje;
        
        alertContainer.appendChild(badge);
    });
    
    // Gráficos de Categorías
    renderCategoryChart(dash.gastos_por_categoria);
    renderIncomeChart(dash.ingresos_por_categoria || {});
}

// Renderizar gráfico de torta de Chart.js para gastos
function renderCategoryChart(data) {
    const ctx = document.getElementById('chart-personal-categorias');
    if (!ctx) return;

    if (personalCategoryChart) personalCategoryChart.destroy();

    const labels = Object.keys(data);
    const values = Object.values(data);
    const total = values.reduce((a, b) => a + b, 0);

    if (labels.length === 0) { labels.push("Sin gastos"); values.push(0.1); }

    personalCategoryChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: values,
                backgroundColor: [
                    '#3b82f6','#10b981','#ef4444','#f59e0b','#8b5cf6',
                    '#ec4899','#14b8a6','#f43f5e','#a855f7','#06b6d4'
                ],
                borderWidth: 1,
                borderColor: 'rgba(255,255,255,0.08)'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    padding: 12,
                    boxPadding: 6,
                    titleFont: { size: 12, weight: 'bold' },
                    bodyFont: { size: 12 },
                    callbacks: {
                        title: (items) => items[0].label,
                        label: (context) => {
                            if (context.label === 'Sin gastos') return ' Sin gastos este mes';
                            const val = context.raw || 0;
                            const pct = total > 0 ? (val / total * 100).toFixed(1) : 0;
                            return [
                                ` Monto: $${val.toLocaleString('es-VE', {minimumFractionDigits:2, maximumFractionDigits:2})} USD`,
                                ` Del total: ${pct}%`
                            ];
                        }
                    }
                }
            },
            cutout: '65%'
        }
    });
}


// Renderizar gráfico de torta de Chart.js para ingresos
function renderIncomeChart(data) {
    const ctx = document.getElementById('chart-personal-ingresos');
    if (!ctx) return;

    if (personalIncomeChart) personalIncomeChart.destroy();

    const labels = Object.keys(data);
    const values = Object.values(data);
    const total = values.reduce((a, b) => a + b, 0);

    if (labels.length === 0) { labels.push("Sin ingresos"); values.push(0.1); }

    personalIncomeChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: values,
                backgroundColor: [
                    '#10b981','#14b8a6','#3b82f6','#06b6d4','#8b5cf6',
                    '#22c55e','#059669','#2563eb','#0d9488','#4f46e5'
                ],
                borderWidth: 1,
                borderColor: 'rgba(255,255,255,0.08)'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    padding: 12,
                    boxPadding: 6,
                    titleFont: { size: 12, weight: 'bold' },
                    bodyFont: { size: 12 },
                    callbacks: {
                        title: (items) => items[0].label,
                        label: (context) => {
                            if (context.label === 'Sin ingresos') return ' Sin ingresos este mes';
                            const val = context.raw || 0;
                            const pct = total > 0 ? (val / total * 100).toFixed(1) : 0;
                            return [
                                ` Monto: $${val.toLocaleString('es-VE', {minimumFractionDigits:2, maximumFractionDigits:2})} USD`,
                                ` Del total: ${pct}%`
                            ];
                        }
                    }
                }
            },
            cutout: '65%'
        }
    });
}



// ============================================================
// BLOQUE 2: ANÁLISIS DETALLADO DE MOVIMIENTOS CON FILTROS
// ============================================================
function initAnalisisDetalle(cats) {
    // Poblar dropdown de categorías con las del sistema
    const selCat = document.getElementById('filtro-categoria');
    selCat.innerHTML = '<option value="">Todas</option>';
    if (cats) {
        cats.forEach(c => {
            const opt = document.createElement('option');
            opt.value = c.id;
            opt.textContent = `${c.icono} ${c.nombre}`;
            selCat.appendChild(opt);
        });
    }

    // Toggle panel
    const toggleBtn = document.getElementById('btn-toggle-analisis');
    const panel = document.getElementById('analisis-detalle-panel');
    toggleBtn.addEventListener('click', () => {
        const open = panel.style.display !== 'none';
        panel.style.display = open ? 'none' : 'block';
        toggleBtn.textContent = open ? 'Mostrar ▼' : 'Ocultar ▲';
        if (!open) loadAnalisisDetalle();
    });

    document.getElementById('btn-aplicar-filtro').addEventListener('click', loadAnalisisDetalle);
}

async function loadAnalisisDetalle() {
    const tipo = document.getElementById('filtro-tipo').value;
    const catId = document.getElementById('filtro-categoria').value;
    const fi = document.getElementById('filtro-fecha-inicio').value;
    const ff = document.getElementById('filtro-fecha-fin').value;

    let url = '/personal/movimientos/detalle?limit=300';
    if (tipo) url += `&tipo=${tipo}`;
    if (catId) url += `&categoria_id=${catId}`;
    if (fi) url += `&fecha_inicio=${fi}`;
    if (ff) url += `&fecha_fin=${ff}`;

    try {
        const data = await apiCall(url);
        renderAnalisisDetalle(data);
    } catch(err) {
        console.error('Error cargando análisis detalle:', err);
    }
}

function renderAnalisisDetalle(data) {
    // Resumen por categoría (badges)
    const summaryDiv = document.getElementById('analisis-categorias-summary');
    summaryDiv.innerHTML = '';
    const colores = { gasto: 'rgba(239,68,68,0.15)', ingreso: 'rgba(16,185,129,0.15)' };
    const textColores = { gasto: '#f87171', ingreso: '#10b981' };

    data.totales_por_categoria.forEach(cat => {
        const badge = document.createElement('div');
        badge.style.cssText = `
            background:${colores[cat.tipo] || 'rgba(255,255,255,0.05)'};
            border:1px solid ${textColores[cat.tipo] || 'rgba(255,255,255,0.1)'}33;
            border-radius:8px; padding:0.4rem 0.6rem;
            display:flex; flex-direction:column; min-width:130px;
        `;
        badge.innerHTML = `
            <span style="font-size:0.7rem; color:var(--text-secondary); white-space:nowrap;">${cat.categoria}</span>
            <span style="font-size:0.88rem; font-weight:700; color:${textColores[cat.tipo] || 'var(--text-primary)'}">
                $${cat.total_usd.toLocaleString('es-VE',{minimumFractionDigits:2,maximumFractionDigits:2})}
            </span>
            <span style="font-size:0.65rem; color:var(--text-secondary);">${cat.porcentaje}% &bull; ${cat.count} op.</span>
        `;
        summaryDiv.appendChild(badge);
    });

    if (data.totales_por_categoria.length === 0) {
        summaryDiv.innerHTML = '<span style="font-size:0.75rem; color:var(--text-secondary);">No hay registros para los filtros aplicados.</span>';
    }

    // Contador total
    document.getElementById('analisis-total-label').textContent =
        `Total: $${data.total_general_usd.toLocaleString('es-VE',{minimumFractionDigits:2,maximumFractionDigits:2})} USD — ${data.total_registros} registros`;

    // Tabla detalle
    const tbody = document.getElementById('analisis-movimientos-tbody');
    tbody.innerHTML = '';

    if (data.movimientos.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center text-secondary">Sin registros para los filtros aplicados.</td></tr>';
        return;
    }

    data.movimientos.forEach(m => {
        const tr = document.createElement('tr');
        const esGasto = m.tipo === 'gasto';
        const color = esGasto ? '#f87171' : '#10b981';
        const signo = esGasto ? '-' : '+';

        let montoStr = '';
        if (m.moneda === 'VES') {
            montoStr = `${m.monto.toLocaleString('es-VE',{minimumFractionDigits:2})} Bs<br><small style="color:var(--text-secondary);">(≈ $${(m.monto_usd||0).toFixed(2)} USD)</small>`;
        } else {
            montoStr = `$${(m.monto_usd||0).toLocaleString('es-VE',{minimumFractionDigits:2,maximumFractionDigits:2})} USD`;
        }

        tr.innerHTML = `
            <td style="white-space:nowrap;">${m.fecha}</td>
            <td><span style="font-size:0.65rem; padding:2px 6px; border-radius:6px; background:${color}22; color:${color}; font-weight:600;">
                ${esGasto ? 'EGRESO' : 'INGRESO'}
            </span></td>
            <td>${m.icono} ${m.categoria}${m.subcategoria ? `<br><small class="text-secondary">${m.subcategoria}</small>` : ''}</td>
            <td style="color:${color}; font-weight:600;">${signo}${montoStr}</td>
            <td style="color:var(--text-secondary);">${m.tasa_bcv > 0 ? m.tasa_bcv.toFixed(2) + ' Bs' : '—'}</td>
            <td>${m.plataforma_pago || '—'}</td>
            <td style="color:var(--text-secondary); font-size:0.72rem;">${m.detalles || '—'}</td>
        `;
        tbody.appendChild(tr);
    });
}

// ============================================================
// BLOQUE 3: MODAL DETALLE Y ABONOS POR DEUDA
// ============================================================
window.openDeudaDetalleModal = async function(deudaId) {
    try {
        const data = await apiCall(`/personal/deudas/${deudaId}/abonos`);
        const d = data.deuda;

        document.getElementById('modal-deuda-det-titulo').textContent = `📋 ${d.acreedor} — ${d.categoria_compra || 'Deuda Personal'}`;
        document.getElementById('modal-deuda-det-original').textContent = `$${d.monto_original_usd.toFixed(2)} USD`;
        document.getElementById('modal-deuda-det-pagado').textContent = `$${data.total_pagado_usd.toFixed(2)} USD`;
        document.getElementById('modal-deuda-det-pendiente').textContent = `$${d.saldo_pendiente_usd.toFixed(2)} USD`;
        document.getElementById('modal-deuda-det-pct').textContent = `${data.porcentaje_pagado}%`;
        document.getElementById('modal-deuda-det-progress').style.width = `${Math.min(data.porcentaje_pagado, 100)}%`;
        document.getElementById('modal-deuda-det-count').textContent = data.total_abonos;
        document.getElementById('modal-deuda-det-total-pagado').textContent = `$${data.total_pagado_usd.toFixed(2)} USD`;

        // Fila BCV
        const bcvRow = document.getElementById('modal-deuda-det-bcv-row');
        if (d.tasa_bcv_registro || d.monto_bs_registro) {
            bcvRow.style.display = 'block';
            document.getElementById('modal-deuda-det-fecha').textContent = d.fecha_creacion || '—';
            document.getElementById('modal-deuda-det-tasa').textContent = d.tasa_bcv_registro ? d.tasa_bcv_registro.toFixed(2) : '—';
            document.getElementById('modal-deuda-det-bs').textContent = d.monto_bs_registro
                ? d.monto_bs_registro.toLocaleString('es-VE', {minimumFractionDigits:2, maximumFractionDigits:2})
                : '—';
        } else {
            bcvRow.style.display = 'none';
        }

        // Tabla de abonos
        const tbody = document.getElementById('modal-deuda-det-abonos-tbody');
        tbody.innerHTML = '';

        if (data.abonos.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center text-secondary">Aún no hay abonos registrados para esta deuda.</td></tr>';
        } else {
            data.abonos.forEach(a => {
                const tr = document.createElement('tr');
                let montoStr = '';
                if (a.moneda === 'VES') {
                    montoStr = `${(a.monto||0).toLocaleString('es-VE',{minimumFractionDigits:2})} Bs<br><small style="color:var(--text-secondary);">(≈ $${(a.monto_usd||0).toFixed(2)} USD)</small>`;
                } else {
                    montoStr = `$${(a.monto_usd||0).toLocaleString('es-VE',{minimumFractionDigits:2,maximumFractionDigits:2})} USD`;
                }
                tr.innerHTML = `
                    <td style="white-space:nowrap;">${a.fecha || '—'}</td>
                    <td style="color:#10b981; font-weight:600;">${montoStr}</td>
                    <td>${a.moneda}</td>
                    <td style="color:var(--text-secondary);">${a.tasa_bcv > 0 ? a.tasa_bcv.toFixed(2) + ' Bs' : '—'}</td>
                    <td>${a.plataforma_pago || '—'}</td>
                    <td style="font-size:0.72rem; color:var(--text-secondary);">${a.detalles || '—'}</td>
                `;
                tbody.appendChild(tr);
            });
        }

        openModal(document.getElementById('modal-deuda-detalle'));
    } catch(err) {
        alert('Error al cargar el detalle de la deuda: ' + err.message);
    }
};

// Renderizar tabla de deudas
function renderPersonalDeudasTable(deudas) {
    const tbody = document.getElementById('personal-deudas-table-body');
    const selectGastoDeudas = document.getElementById('p-gasto-deuda-id');
    
    tbody.innerHTML = '';
    selectGastoDeudas.innerHTML = '<option value="">-- No vincular a deuda --</option>';
    
    if (deudas.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center text-secondary">No tienes deudas registradas.</td></tr>';
        return;
    }
    
    deudas.forEach(d => {
        const tr = document.createElement('tr');
        
        let abonoBtn = '';
        if (d.estado === 'activa') {
            abonoBtn = `<button class="btn btn-secondary btn-sm" type="button" onclick="openAbonoDeudaModal(${d.id}, '${d.acreedor}')" style="padding: 0.2rem 0.5rem; font-size: 0.72rem;">💸 Abonar</button>`;

            // Populate gasto dropdown
            const opt = document.createElement('option');
            opt.value = d.id;
            opt.textContent = `Abono a ${d.acreedor} (Saldo: $${d.saldo_pendiente_usd.toFixed(2)})`;
            selectGastoDeudas.appendChild(opt);
        } else {
            abonoBtn = `<span class="badge" style="background: rgba(16, 185, 129, 0.1); color: #10b981; border: 1px solid rgba(16, 185, 129, 0.2); font-size: 0.7rem; padding: 0.25rem 0.4rem;">Pagada</span>`;
        }
        
        const acreedorEscaped = d.acreedor.replace(/'/g, "\\'");
        const conceptoEscaped = (d.categoria_compra || '').replace(/'/g, "\\'");
        const detallesEscaped = (d.detalles || '').replace(/'/g, "\\'");
        
        tr.innerHTML = `
            <td>
                <strong>${d.acreedor}</strong>
                ${d.tasa_bcv_registro ? `<br><small class="text-secondary" style="font-size: 0.7rem;">Tasa BCV: ${d.tasa_bcv_registro.toFixed(2)} Bs/$</small>` : ''}
            </td>
            <td class="text-secondary">${d.categoria_compra || 'General'}</td>
            <td>
                $${d.monto_original_usd.toFixed(2)}
                ${d.monto_bs_registro ? `<br><small class="text-secondary" style="font-size: 0.7rem;">Bs ${d.monto_bs_registro.toLocaleString('es-VE', {minimumFractionDigits:2, maximumFractionDigits:2})}</small>` : ''}
            </td>
            <td style="color: ${d.estado === 'activa' ? '#f59e0b' : '#10b981'}; font-weight: 600;">$${d.saldo_pendiente_usd.toFixed(2)}</td>
            <td class="text-center">${abonoBtn}</td>
            <td class="text-center" style="white-space: nowrap;">
                <button class="btn btn-sm" type="button" onclick="openDeudaDetalleModal(${d.id})" style="padding: 0.2rem 0.4rem; background: rgba(139,92,246,0.12); border-color: rgba(139,92,246,0.2); color: #a78bfa; margin-right:2px;" title="Ver historial de abonos">🔍</button>
                <button class="btn btn-primary btn-sm" type="button" onclick="openEditDeudaModal(${d.id}, '${acreedorEscaped}', ${d.monto_original_usd}, '${conceptoEscaped}', '${detallesEscaped}')" style="padding: 0.2rem 0.4rem; background: rgba(59, 130, 246, 0.1); border-color: rgba(59, 130, 246, 0.15); color: #60a5fa; margin-right: 4px;">✏️</button>
                <button class="btn btn-danger btn-sm" type="button" onclick="handleDeleteDeuda(${d.id})" style="padding: 0.2rem 0.4rem; background: rgba(239, 68, 68, 0.1); border-color: rgba(239, 68, 68, 0.15); color: #f87171;">🗑️</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// Abrir modal de abono
window.openAbonoDeudaModal = function(deudaId, acreedor) {
    document.getElementById('modal-pago-deuda-id').value = deudaId;
    document.getElementById('modal-pago-deuda-acreedor').textContent = acreedor;
    document.getElementById('modal-pago-monto').value = '';
    document.getElementById('modal-pago-moneda').value = 'USD';
    document.getElementById('modal-pago-tasa').value = state.bcvRate || '';
    document.getElementById('modal-pago-equiv').value = '';
    document.getElementById('modal-pago-detalles').value = '';
    document.getElementById('modal-pago-fecha').value = '';

    openModal(document.getElementById('modal-pago-deuda'));
};

// Renderizar tabla de historial
function renderPersonalHistoryTable(movimientos) {
    const tbody = document.getElementById('personal-history-table-body');
    tbody.innerHTML = '';
    
    if (movimientos.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center text-secondary">No hay movimientos registrados aún.</td></tr>';
        return;
    }
    
    movimientos.forEach(g => {
        const tr = document.createElement('tr');
        
        let displayMonto = "";
        let displayEquiv = "";
        if (g.moneda === 'VES') {
            displayMonto = `${g.monto.toLocaleString('es-VE', {minimumFractionDigits: 2, maximumFractionDigits: 2})} Bs`;
            const usdVal = g.monto_usd || (g.tasa_bcv > 0 ? g.monto / g.tasa_bcv : 0);
            const rateVal = g.tasa_bcv || 0;
            displayEquiv = `<br><small class="text-secondary" style="font-size: 0.72rem; display: block; margin-top: 2px;">(≈ $${usdVal.toFixed(2)} USD @ ${rateVal.toFixed(2)} Bs)</small>`;
        } else {
            displayMonto = `$${g.monto.toFixed(2)} USD`;
        }
            
        const esIngreso = g.tipo === 'ingreso';
        const color = esIngreso ? '#10b981' : '#ef4444';
        const signo = esIngreso ? '+' : '-';
        
        tr.innerHTML = `
            <td class="text-secondary">${g.fecha.split(' ')[0]}</td>
            <td>
                <strong>${g.icono} ${g.categoria}</strong>
                ${g.subcategoria ? `<br><small class="text-secondary" style="font-size: 0.7rem;">${g.subcategoria}</small>` : ''}
                ${g.detalles ? `<br><small style="color: #60a5fa; font-size: 0.72rem; font-style: italic; display: block; margin-top: 2px;">📝 ${g.detalles}</small>` : ''}
            </td>
            <td style="color: ${color}; font-weight: 500; line-height: 1.25;">${signo}${displayMonto}${displayEquiv}</td>
            <td class="text-secondary">${g.plataforma_pago}</td>
            <td class="text-center">
                <button class="btn btn-danger btn-sm" type="button" onclick="handleDeleteMovimiento(${g.id}, '${g.tipo}')" style="padding: 0.2rem 0.4rem; background: rgba(239, 68, 68, 0.1); border-color: rgba(239, 68, 68, 0.15); color: #f87171;">🗑️</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// Manejo de registros submit
async function handleGastoSubmit(e) {
    e.preventDefault();
    
    const catSelect = document.getElementById('p-gasto-categoria');
    const selectedOpt = catSelect.options[catSelect.selectedIndex];
    const catName = selectedOpt ? selectedOpt.textContent.replace(/^[^\s]+\s+/, '') : '';
    
    let subcategory = null;
    if (catName === 'Recargas Celular') {
        const operadora = document.getElementById('p-recarga-operadora').value;
        let titular = document.getElementById('p-recarga-titular').value;
        if (titular === 'Otro') {
            titular = document.getElementById('p-recarga-titular-otro').value.trim();
        }
        subcategory = `${operadora} - ${titular}`;
    } else if (catName === 'Servicios & Suscripciones') {
        let servicio = document.getElementById('p-servicio-nombre').value;
        if (servicio === 'Otro') {
            servicio = document.getElementById('p-servicio-nombre-otro').value.trim();
        }
        subcategory = servicio;
    } else if (catName === 'Internet') {
        subcategory = document.getElementById('p-internet-proveedor').value;
    }

    const payload = {
        monto: parseFloat(document.getElementById('p-gasto-monto').value),
        moneda: document.getElementById('p-gasto-moneda').value,
        tasa_bcv: parseFloat(document.getElementById('p-gasto-tasa').value) || 0.0,
        categoria_id: parseInt(document.getElementById('p-gasto-categoria').value),
        subcategoria: subcategory,
        detalles: document.getElementById('p-gasto-detalles').value.trim() || null,
        plataforma_pago: document.getElementById('p-gasto-plataforma').value,
        deuda_id: document.getElementById('p-gasto-deuda-id').value ? parseInt(document.getElementById('p-gasto-deuda-id').value) : null,
        fecha: document.getElementById('p-gasto-fecha').value || null
    };
    
    try {
        await apiCall('/personal/gastos', 'POST', payload);
        showToast("✅ Gasto registrado");
        
        // Reset form
        document.getElementById('p-gasto-monto').value = '';
        document.getElementById('p-gasto-detalles').value = '';
        document.getElementById('p-gasto-deuda-id').value = '';
        
        await loadPersonalFinanceData();
        await loadCapital(); // reload business capital
    } catch (err) {
        alert(err.message);
    }
}

async function handleIngresoSubmit(e) {
    e.preventDefault();
    
    const payload = {
        monto: parseFloat(document.getElementById('p-ingreso-monto').value),
        moneda: document.getElementById('p-ingreso-moneda').value,
        tasa_bcv: parseFloat(document.getElementById('p-ingreso-tasa').value) || 0.0,
        categoria_id: parseInt(document.getElementById('p-ingreso-categoria').value),
        plataforma_pago: document.getElementById('p-ingreso-plataforma').value || null,
        detalles: document.getElementById('p-ingreso-detalles').value.trim() || null,
        fecha: document.getElementById('p-ingreso-fecha').value || null
    };
    
    try {
        await apiCall('/personal/ingresos', 'POST', payload);
        showToast("✅ Ingreso registrado");
        
        document.getElementById('p-ingreso-monto').value = '';
        document.getElementById('p-ingreso-detalles').value = '';
        document.getElementById('p-ingreso-plataforma').value = '';
        
        await loadPersonalFinanceData();
        await loadCapital();
    } catch (err) {
        alert(err.message);
    }
}

async function handleDeudaSubmit(e) {
    e.preventDefault();

    const moneda = document.getElementById('p-deuda-moneda').value;
    const montoPrincipal = parseFloat(document.getElementById('p-deuda-monto-principal').value);
    const tasaBcv = parseFloat(document.getElementById('p-deuda-tasa-bcv').value) || null;

    // monto_original_usd: si el usuario ingresó en VES, mandamos el monto en Bs
    // y el backend calculará el USD. Si ingresó en USD, mandamos el USD directo.
    const payload = {
        acreedor: document.getElementById('p-deuda-acreedor').value.trim(),
        moneda: moneda,
        monto_original_usd: montoPrincipal,   // El backend sabe si es VES o USD por el campo 'moneda'
        tasa_bcv_registro: tasaBcv,
        monto_bs_registro: (() => {
            if (moneda === 'USD' && tasaBcv) return Math.round(montoPrincipal * tasaBcv * 100) / 100;
            if (moneda === 'VES') return montoPrincipal;  // El monto ya ES en Bs
            return null;
        })(),
        categoria_compra: document.getElementById('p-deuda-concepto').value.trim() || null,
        detalles: document.getElementById('p-deuda-detalles').value.trim() || null,
        fecha_creacion: document.getElementById('p-deuda-fecha').value || null
    };

    try {
        await apiCall('/personal/deudas', 'POST', payload);
        showToast("💳 Deuda creada con éxito");

        // Reset form
        document.getElementById('p-deuda-acreedor').value = '';
        document.getElementById('p-deuda-monto-principal').value = '';
        document.getElementById('p-deuda-tasa-bcv').value = '';
        document.getElementById('p-deuda-equiv').value = '';
        document.getElementById('p-deuda-concepto').value = '';
        document.getElementById('p-deuda-detalles').value = '';
        document.getElementById('p-deuda-fecha').value = '';

        await loadPersonalFinanceData();
    } catch (err) {
        alert(err.message);
    }
}

async function handleCategoryModalSubmit(e) {
    e.preventDefault();
    
    const payload = {
        nombre: document.getElementById('modal-cat-nombre').value.trim(),
        tipo: document.getElementById('modal-cat-tipo').value,
        icono: document.getElementById('modal-cat-icono').value
    };
    
    try {
        await apiCall('/personal/categorias', 'POST', payload);
        showToast("✅ Nueva categoría creada");
        closeModal(document.getElementById('modal-personal-categoria'));
        document.getElementById('modal-cat-nombre').value = '';
        await loadPersonalFinanceData();
    } catch (err) {
        alert(err.message);
    }
}

async function handlePagoDeudaModalSubmit(e) {
    e.preventDefault();

    const deudaId = parseInt(document.getElementById('modal-pago-deuda-id').value);
    const payload = {
        monto: parseFloat(document.getElementById('modal-pago-monto').value),
        moneda: document.getElementById('modal-pago-moneda').value,
        tasa_bcv: parseFloat(document.getElementById('modal-pago-tasa').value) || 0.0,
        plataforma_pago: document.getElementById('modal-pago-plataforma').value,
        detalles: document.getElementById('modal-pago-detalles').value.trim() || null,
        fecha: document.getElementById('modal-pago-fecha').value || null
    };

    try {
        await apiCall(`/personal/deudas/${deudaId}/pagar`, 'POST', payload);
        showToast("💸 Abono registrado con éxito");
        closeModal(document.getElementById('modal-pago-deuda'));

        await loadPersonalFinanceData();
        await loadCapital();
    } catch (err) {
        alert(err.message);
    }
}

window.handleDeleteMovimiento = async function(id, tipo) {
    const act = tipo === 'ingreso' ? 'ingreso' : 'gasto';
    if (!confirm(`¿Deseas eliminar este ${act}? El capital se recalculará de forma automática.`)) return;
    
    try {
        const url = tipo === 'ingreso' ? `/personal/ingresos/${id}` : `/personal/gastos/${id}`;
        await apiCall(url, 'DELETE');
        showToast(`🗑️ ${act.charAt(0).toUpperCase() + act.slice(1)} eliminado`);
        await loadPersonalFinanceData();
        await loadCapital();
    } catch (err) {
        alert(err.message);
    }
};

window.openEditDeudaModal = function(id, acreedor, monto, concepto, detalles) {
    document.getElementById('modal-edit-deuda-id').value = id;
    document.getElementById('modal-edit-deuda-acreedor').value = acreedor;
    document.getElementById('modal-edit-deuda-monto').value = monto;
    document.getElementById('modal-edit-deuda-concepto').value = concepto;
    document.getElementById('modal-edit-deuda-detalles').value = detalles;
    
    openModal(document.getElementById('modal-personal-deuda-edit'));
};

window.handleDeleteDeuda = async function(id) {
    if (!confirm("¿Deseas eliminar esta cuenta por pagar? Los abonos ya realizados se mantendrán como gastos independientes.")) return;
    
    try {
        await apiCall(`/personal/deudas/${id}`, 'DELETE');
        showToast("🗑️ Cuenta por pagar eliminada");
        await loadPersonalFinanceData();
    } catch (err) {
        alert(err.message);
    }
};

async function handleEditDeudaSubmit(e) {
    e.preventDefault();
    
    const id = parseInt(document.getElementById('modal-edit-deuda-id').value);
    const payload = {
        acreedor: document.getElementById('modal-edit-deuda-acreedor').value.trim(),
        monto_original_usd: parseFloat(document.getElementById('modal-edit-deuda-monto').value),
        categoria_compra: document.getElementById('modal-edit-deuda-concepto').value.trim() || null,
        detalles: document.getElementById('modal-edit-deuda-detalles').value.trim() || null
    };
    
    try {
        await apiCall(`/personal/deudas/${id}`, 'PUT', payload);
        showToast("✏️ Cuenta por pagar modificada");
        closeModal(document.getElementById('modal-personal-deuda-edit'));
        await loadPersonalFinanceData();
    } catch (err) {
        alert(err.message);
    }
}

async function handlePinModalSubmit(e) {
    e.preventDefault();
    
    const oldPin = document.getElementById('modal-pin-old').value;
    const newPin = document.getElementById('modal-pin-new').value;
    
    if (newPin.length !== 4 || isNaN(newPin)) {
        alert("El nuevo PIN debe ser de 4 dígitos numéricos.");
        return;
    }
    
    try {
        await apiCall('/personal/change-pin', 'POST', {
            old_pin: oldPin,
            new_pin: newPin
        });
        showToast("🔑 PIN cambiado exitosamente");
        closeModal(document.getElementById('modal-personal-pin'));
        
        // Reset inputs
        document.getElementById('modal-pin-old').value = '';
        document.getElementById('modal-pin-new').value = '';
    } catch (err) {
        alert("Error: " + err.message);
    }
}


// DOM Content Loaded entry point
document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    setupEventListeners();
    setupPersonalFinanceListeners();
    checkAuth();
});
