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
    divisasCompradasManuallyEdited: false,
    clientes: []
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
    if (state.token) {
        headers['Authorization'] = `Bearer ${state.token}`;
    }
    
    const config = { method, headers };
    if (data) {
        config.body = JSON.stringify(data);
    }
    
    try {
        const response = await fetch(`/api${endpoint}`, config);
        if (response.status === 401) {
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
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    els.loginError.classList.add('hidden');
    
    try {
        const data = await apiCall('/login', 'POST', { username, password });
        state.token = data.token;
        state.username = data.username;
        localStorage.setItem('token', data.token);
        localStorage.setItem('username', data.username);
        checkAuth();
    } catch (err) {
        els.loginError.textContent = err.message || "Usuario o contraseña inválidos";
        els.loginError.classList.remove('hidden');
    }
}

function logout() {
    state.token = null;
    state.username = null;
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
            loadClientes(),
            loadAndRenderCharts()
        ]);
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
        if (state.bcvRate && els.simBcvTasa && !els.simBcvTasa.value) {
            els.simBcvTasa.value = state.bcvRate;
        }
        recalculateSimulation();
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
                <td><strong>${item.plataforma}</strong></td>
                <td>
                    ${item.convertir_ves ? `<input type="number" step="any" class="input-saldo-ves" data-id="${item.id}" value="${item.saldo_ves}">` : '<span class="text-muted">-</span>'}
                </td>
                <td>
                    <input type="number" step="any" class="input-saldo-usd" data-id="${item.id}" value="${item.saldo_usd}">
                </td>
                <td>$${item.usd_equivalente.toLocaleString('es-VE', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                <td>$${item.usd_simulado.toLocaleString('es-VE', {minimumFractionDigits: 2, maximumFractionDigits: 2})} <span class="text-muted" style="font-size:0.75rem;">(-${comPct}%)</span></td>
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
        
        // Render cards
        els.cardsContainer.innerHTML = '';
        titulares.forEach(tit => {
            tit.tarjetas.forEach(card => {
                // Populate options
                const cardName = `${tit.nombre} - ${card.banco} (${card.tipo_tarjeta})`;
                const opt = document.createElement('option');
                opt.value = card.id;
                opt.textContent = cardName;
                opt.setAttribute('data-comision', card.comision_porcentaje);
                opt.setAttribute('data-banco', card.banco);
                opt.setAttribute('data-tercera-edad', tit.tercera_edad);
                
                els.calcTarjetaCompra.appendChild(opt.cloneNode(true));
                selectCompra.appendChild(opt);
                
                // Render progress bars
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
                cardDiv.style.background = 'rgba(255, 255, 255, 0.02)';
                cardDiv.style.border = '1px solid var(--border-color)';
                cardDiv.style.borderRadius = '12px';
                cardDiv.style.padding = '1rem';
                cardDiv.style.display = 'flex';
                cardDiv.style.flexDirection = 'column';
                cardDiv.style.gap = '0.75rem';
                
                const isNearLimit = percentDiario > 85 || percentMensual > 85;
                const warningBadge = isNearLimit ? '<span class="senior-badge" style="font-size: 0.65rem; background: rgba(239,68,68,0.15); color: #ef4444; border: 1px solid rgba(239,68,68,0.3); padding: 2px 6px; border-radius: 4px; font-weight: 500;">⚠️ Límite Cercano</span>' : '';
                
                cardDiv.innerHTML = `
                    <div class="card-item-header" style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0;">
                        <div>
                            <span class="card-title" style="font-weight: 600; color: var(--text-primary); font-size: 0.92rem; display: block;">${card.banco} - ${card.tipo_tarjeta}</span>
                            <span class="card-owner" style="font-size: 0.75rem; color: var(--text-secondary);">de ${tit.nombre}</span>
                        </div>
                        <div style="display: flex; gap: 4px; flex-wrap: wrap;">
                            ${tit.tercera_edad ? '<span class="senior-badge" style="font-size: 0.65rem; background: rgba(16,185,129,0.15); color: #10b981; border: 1px solid rgba(16,185,129,0.3); padding: 2px 6px; border-radius: 4px; font-weight: 500;">Tercera Edad</span>' : ''}
                            ${warningBadge}
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
                `;
                els.cardsContainer.appendChild(cardDiv);
            });
        });
        
    } catch (err) {
        console.error("Error loading cards:", err);
    }
}

function updateSuggestedDivisas() {
    if (state.divisasCompradasManuallyEdited) return;
    
    const usdt = parseFloat(els.calcUsdtVendidos.value);
    const tasa = parseFloat(els.calcTasaVenta.value);
    if (!isNaN(usdt) && !isNaN(tasa) && state.bcvRate > 0) {
        const binanceFeePct = 0.0025; // 0.25%
        const usdtNetos = usdt * (1 - binanceFeePct);
        const bsRecibidos = usdtNetos * tasa;
        
        // Get card properties (Tercera Edad exenta del 0.5%)
        let isTerceraEdad = false;
        if (els.calcTarjetaCompra && els.calcTarjetaCompra.selectedIndex >= 0) {
            const selectedOption = els.calcTarjetaCompra.options[els.calcTarjetaCompra.selectedIndex];
            if (selectedOption) {
                isTerceraEdad = selectedOption.getAttribute('data-tercera-edad') === 'true';
            }
        }
        
        const compraComisionPct = isTerceraEdad ? 0.0 : 0.005; // 0.5%
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
    
    // 1. USDT Ventas
    const binanceFeePct = 0.0025; // 0.25%
    const usdtNetosRecibidos = usdtVendidos * (1 - binanceFeePct);
    const bolivaresRecibidos = usdtNetosRecibidos * tasaVenta;
    
    // 2. Compra Divisas Oficiales
    const compraComisionPct = isTerceraEdad ? 0.0 : 0.005; // 0.5%
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
        
        const costoBase = usd * tasa;
        const comisionCompra = applyTercera ? 0.0 : (costoBase * 0.005);
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
    
    // Check card limit warnings
    if (selectedTarjetaData) {
        const dailyRemaining = selectedTarjetaData.limite_diario - selectedTarjetaData.consumo_diario;
        const monthlyRemaining = selectedTarjetaData.limite_mensual - selectedTarjetaData.consumo_mensual;
        
        if (usd > dailyRemaining || usd > monthlyRemaining) {
            const warningMsg = `⚠️ ADVERTENCIA DE LÍMITES:\n` +
                               `Esta compra de $${usd.toFixed(2)} supera el límite disponible de la tarjeta.\n` +
                               `- Cupo Diario Disponible: $${Math.max(0, dailyRemaining).toFixed(2)}\n` +
                               `- Cupo Mensual Disponible: $${Math.max(0, monthlyRemaining).toFixed(2)}\n\n` +
                               `¿Deseas proceder con el registro de todas formas?`;
            if (!confirm(warningMsg)) {
                return;
            }
        }
    }
    
    const applyTerceraEdad = (els.compraParcialTerceraEdad && els.compraParcialTerceraEdad.checked) || isTerceraEdad;
    const compraComisionPct = applyTerceraEdad ? 0.0 : 0.005; // 0.5%
    const costoBaseVES = usd * tasa;
    const comisionCompraVES = costoBaseVES * compraComisionPct;
    const transferenciasVes = applyPm ? (costoBaseVES * 0.003) : 0.0;
    
    const binanceDepositFeePct = 0.041; // 4.1%
    const usdNetosRecibidosBinance = usd * (1 - cardComisionPct) * (1 - binanceDepositFeePct);
    
    const payload = {
        usd_comprados: usd,
        usd_procesados: usd,
        tasa_bcv: tasa,
        comision_compra_ves: comisionCompraVES,
        transferencias_ves: transferenciasVes,
        usd_recibidos_binance: usdNetosRecibidosBinance,
        banco: bancoText,
        tarjeta_id: tarjetaIdVal
    };
    
    try {
        const res = await apiCall(`/ciclos/${cicloId}/compras`, 'POST', payload);
        alert(res.message);
        closeModal(els.modalCompraParcial);
        await initDashboard();
    } catch (err) {
        alert(err.message);
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
                            🏦 ${cp.banco || 'Banco'}
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
        const compras = await apiCall('/compras');
        els.comprasTableBody.innerHTML = '';
        
        compras.forEach(c => {
            const tr = document.createElement('tr');
            const montoVes = c.monto_usd * c.tasa_bcv;
            
            tr.innerHTML = `
                <td>${c.fecha}</td>
                <td><strong>${c.titular}</strong></td>
                <td>${c.banco}</td>
                <td>${c.tipo_tarjeta}</td>
                <td>$${c.monto_usd.toFixed(2)}</td>
                <td>${c.tasa_bcv.toFixed(2)}</td>
                <td>${montoVes.toLocaleString('es-VE', {minimumFractionDigits: 2})} VES</td>
                <td>${c.comision_ves.toLocaleString('es-VE', {minimumFractionDigits: 2})} VES</td>
            `;
            els.comprasTableBody.appendChild(tr);
        });
    } catch (err) {
        console.error("Error loading compras:", err);
    }
}

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
            await registrarMovimientoZelle(tipo, monto, titular, detalle, fecha);
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
    
    els.btnAddCard.addEventListener('click', () => openModal(els.modalTarjeta));
    els.btnCloseModalTarjeta.addEventListener('click', () => closeModal(els.modalTarjeta));
    els.tarjetaForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const titular_id = parseInt(document.getElementById('tarjeta-titular-select').value);
        const banco = document.getElementById('tarjeta-banco').value;
        const tipo_tarjeta = document.getElementById('tarjeta-tipo').value;
        const limite_diario = parseFloat(document.getElementById('tarjeta-limite-diario').value) || 0.0;
        const limite_mensual = parseFloat(document.getElementById('tarjeta-limite-mensual').value) || 0.0;
        const comision_porcentaje = parseFloat(document.getElementById('tarjeta-comision').value) / 100.0 || 0.0;
        
        try {
            await apiCall('/tarjetas', 'POST', { titular_id, banco, tipo_tarjeta, limite_diario, limite_mensual, comision_porcentaje });
            alert("Tarjeta guardada.");
            els.tarjetaForm.reset();
            closeModal(els.modalTarjeta);
            await loadTitularesAndCards();
        } catch (err) {
            alert(err.message);
        }
    });
    
    // Register divisa purchase modal
    els.btnRegistrarCompraManual.addEventListener('click', () => {
        document.getElementById('compra-tasa-bcv').value = state.bcvRate;
        openModal(els.modalCompra);
    });
    els.btnCloseModalCompra.addEventListener('click', () => closeModal(els.modalCompra));
    els.compraDivisaForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const tarjeta_id = parseInt(document.getElementById('compra-tarjeta-select').value);
        const monto_usd = parseFloat(document.getElementById('compra-monto-usd').value);
        const tasa_bcv = parseFloat(document.getElementById('compra-tasa-bcv').value);
        
        try {
            await apiCall('/compras', 'POST', { tarjeta_id, monto_usd, tasa_bcv });
            alert("Compra registrada.");
            els.compraDivisaForm.reset();
            closeModal(els.modalCompra);
            await initDashboard();
        } catch (err) {
            alert(err.message);
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
            input.addEventListener('input', () => calculateRemesa('margin'));
            input.addEventListener('change', () => calculateRemesa('margin'));
        }
    });

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
            const montoVes = montoUsd * tasaCliente;
            let pmFeePct = 0;
            if (bancoReceptor === 'Pago Móvil') {
                pmFeePct = 0.003;
            }
            const vesGastadosTotales = montoVes * (1 + pmFeePct);
            const usdtGastados = vesGastadosTotales / tasaP2p;
            const fCosto = (1 + costoAdqPct) / (1 - comisionBinPct);
            const costoRealUsdt = usdtGastados * fCosto;
            const gananciaUsd = montoUsd - costoRealUsdt;
            
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

async function handleConsultarP2P() {
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
        els.btnConsultarP2p.textContent = "⏳ Buscando...";
        els.btnConsultarP2p.disabled = true;
        
        const reqData = {
            fiat: "VES",
            asset: "USDT",
            trade_type: trade_type,
            pay_types: pay_types,
            amount: estimatedVes > 0 ? estimatedVes : null
        };
        
        const res = await apiCall('/p2p-rate', 'POST', reqData);
        els.btnConsultarP2p.textContent = "⚡ Consultar Binance P2P";
        els.btnConsultarP2p.disabled = false;
        
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
            alert("No se encontraron tasas activas para este método en Binance P2P.");
        }
    } catch (err) {
        els.btnConsultarP2p.textContent = "⚡ Consultar Binance P2P";
        els.btnConsultarP2p.disabled = false;
        alert("Error al conectar con Binance P2P. Por favor ingresa la tasa manualmente.");
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
            els.calcTasaVenta.value = avgRate.toFixed(2);
            
            updateSuggestedDivisas();
            handleCalcularCiclo();
        } else {
            alert("No se encontraron tasas en Binance P2P.");
        }
    } catch (err) {
        els.btnCalcConsultarP2p.textContent = "⚡ P2P";
        els.btnCalcConsultarP2p.disabled = false;
        alert("Error al conectar con Binance P2P. Por favor ingresa la tasa manualmente.");
    }
}

function calculateRemesa(source = 'margin') {
    const montoUsd = parseFloat(els.remesaMontoUsd.value) || 0;
    const p2pRate = parseFloat(els.remesaP2pRef.value) || 0;
    const costoAdqPct = (parseFloat(els.remesaCostoAdq.value) || 0) / 100;
    const comisionBinPct = (parseFloat(els.remesaComisionBin.value) || 0) / 100;
    const pagoMovilAuto = els.remesaPagoMovilAuto.checked;
    
    // Factor de costo real del USDT
    const fCosto = 1 + costoAdqPct + comisionBinPct;
    
    // Pago Móvil percentage
    const pmFeePct = pagoMovilAuto ? 0.003 : 0.0;
    
    let margenPct = 0;
    let tasaCliente = 0;
    
    if (source === 'tasa') {
        tasaCliente = parseFloat(els.remesaTasaCliente.value) || 0;
        if (p2pRate > 0 && tasaCliente > 0) {
            margenPct = 1 - (tasaCliente * fCosto) / (p2pRate * (1 - pmFeePct));
            els.remesaMargen.value = (margenPct * 100).toFixed(2);
        }
    } else {
        margenPct = (parseFloat(els.remesaMargen.value) || 0) / 100;
        if (p2pRate > 0) {
            tasaCliente = p2pRate * ((1 - margenPct) / fCosto) * (1 - pmFeePct);
            els.remesaTasaCliente.value = tasaCliente.toFixed(2);
        }
    }
    
    if (montoUsd <= 0 || p2pRate <= 0 || tasaCliente <= 0) {
        els.remesaResultsDisplay.innerHTML = `
            <div class="empty-state">
                <span class="large-icon">💸</span>
                <p>Ingresa el Monto USD, la Tasa P2P y la Tasa o Margen para calcular la cotización.</p>
            </div>
        `;
        els.whatsappBoxContainer.classList.add('hidden');
        state.currentCalculatedRemesa = null;
        return;
    }
    
    // Total VES beneficiary receives
    const vesARecibir = montoUsd * tasaCliente;
    
    // Total VES spent by operator (including transaction fee)
    const vesGastadosTotales = vesARecibir * (1 + pmFeePct);
    
    // USDT needed to sell on P2P to fund the vesGastadosTotales
    const usdtGastados = vesGastadosTotales / p2pRate;
    
    // Real acquisition cost of that USDT in USD
    const costoRealUsdt = usdtGastados * fCosto;
    
    // Net profit in USD
    const gananciaUsd = montoUsd - costoRealUsdt;
    
    const remesaFechaVal = document.getElementById('remesa-fecha') ? document.getElementById('remesa-fecha').value : null;
    
    state.currentCalculatedRemesa = {
        cliente_nombre: els.remesaCliente.value || "Cliente",
        monto_usd: montoUsd,
        tasa_p2p: p2pRate,
        tasa_cliente: tasaCliente,
        monto_ves: vesARecibir,
        ganancia_usd: gananciaUsd,
        metodo_pago: els.remesaMetodoPago.value,
        banco_receptor: els.remesaBancoReceptor.value,
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
    const clientName = els.remesaCliente.value || "Cliente";
    const paymentMethod = els.remesaMetodoPago.value;
    const recvBank = els.remesaBancoReceptor.value;
    
    const waMessage = `*Cotización de Remesa* 💸\n\n` +
                      `👤 *Cliente:* ${clientName}\n` +
                      `💵 *Envías:* ${formatUSD(montoUsd)} (Vía ${paymentMethod})\n` +
                      `🇻🇪 *Tasa del día:* ${tasaCliente.toFixed(2)} VES/$\n` +
                      `🏦 *Recibe en Venezuela:* ${formatVES(vesARecibir)}\n\n` +
                      `_Escríbenos para confirmar tu pago y realizar la transferencia de acuerdo a nuestros tiempos operativos._ 🤝`;
                      
    els.remesaWhatsappText.value = waMessage;
    els.whatsappBoxContainer.classList.remove('hidden');
}

function copyRemesaText() {
    els.remesaWhatsappText.select();
    els.remesaWhatsappText.setSelectionRange(0, 99999); // Mobile support
    navigator.clipboard.writeText(els.remesaWhatsappText.value);
    alert("Mensaje de WhatsApp copiado al portapapeles.");
}

async function registrarRemesa() {
    if (!state.currentCalculatedRemesa) return;
    try {
        const remesaFechaVal = document.getElementById('remesa-fecha') ? document.getElementById('remesa-fecha').value : null;
        if (remesaFechaVal) {
            state.currentCalculatedRemesa.fecha = remesaFechaVal;
        }
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
        
        // Populate table body
        els.zelleTableBody.innerHTML = '';
        if (data.items.length === 0) {
            els.zelleTableBody.innerHTML = '<tr><td colspan="6" class="text-center text-muted">No hay movimientos registrados en Zelle</td></tr>';
            return;
        }
        
        data.items.forEach(item => {
            const tr = document.createElement('tr');
            const isIngreso = item.tipo === 'ingreso';
            
            tr.innerHTML = `
                <td>${item.fecha}</td>
                <td>
                    <span class="badge ${isIngreso ? 'badge-success' : 'badge-danger'}">
                        ${isIngreso ? '🟢 Ingreso' : '🔴 Egreso'}
                    </span>
                </td>
                <td><strong>${item.titular}</strong></td>
                <td>${item.detalle}</td>
                <td>
                    <strong class="${isIngreso ? 'text-success' : 'text-danger'}">
                        ${isIngreso ? '+' : '-'}$${item.monto.toLocaleString('es-VE', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                    </strong>
                </td>
                <td>
                    <button class="btn btn-danger btn-sm" onclick="eliminarMovimientoZelle(${item.id})">Eliminar</button>
                </td>
            `;
            els.zelleTableBody.appendChild(tr);
        });
    } catch (err) {
        console.error("Error loading Zelle movements:", err);
    }
}

async function registrarMovimientoZelle(tipo, monto, titular, detalle, fecha) {
    try {
        const payload = {
            tipo,
            monto: parseFloat(monto),
            titular: titular || null,
            detalle: detalle || null,
            fecha: fecha || null
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
    
    if (banco === 'Venezuela' && isTerceraEdad) {
        els.simBcvComision.value = '0';
        els.simBcvComision.disabled = true;
    } else {
        els.simBcvComision.disabled = false;
        if (banco === 'Venezuela') {
            els.simBcvComision.value = '0.5';
        } else if (banco === 'Personalizado') {
            // Keep current value or let user input
        } else {
            els.simBcvComision.value = '0.5';
        }
    }
    recalculateSimulation();
}

function recalculateSimulation() {
    if (!els.simBcvMonto || !els.simBcvMonto.value) {
        // Clear outputs
        if (els.simResPrincipalValue) {
            els.simResPrincipalValue.textContent = "$0.00";
            els.simResEquivMonto.textContent = "$0.00";
            els.simResComisionVes.textContent = "0.00 VES";
            els.simResTotalVes.textContent = "0.00 VES";
            els.simResCuentasValue.textContent = "0 cuentas";
            els.simResCuentasDesc.textContent = "Introduce un monto para calcular.";
        }
        return;
    }
    
    const monto = parseFloat(els.simBcvMonto.value) || 0;
    const tasa = parseFloat(els.simBcvTasa.value) || state.bcvRate || 0;
    const comisionPct = (parseFloat(els.simBcvComision.value) || 0) / 100;
    const limiteCuenta = parseFloat(els.simBcvLimite.value) || 500;
    const modo = els.simBcvModo.value;
    
    if (tasa <= 0) return;
    
    let principalUSD = 0;
    let principalVES = 0;
    let comisionVES = 0;
    let totalVES = 0;
    
    if (modo === 'ves') {
        els.simBcvMontoLabel.textContent = "Monto de Bolívares Disponibles (VES)";
        els.simBcvMonto.placeholder = "Ej. 1000000";
        els.simResPrincipalLabel.textContent = "Dólares Adquiridos (Neto)";
        els.simResEquivLabel.textContent = "Monto Principal Equivalente:";
        
        principalUSD = monto / (tasa * (1 + comisionPct));
        principalVES = principalUSD * tasa;
        comisionVES = principalVES * comisionPct;
        totalVES = monto;
        
        els.simResPrincipalValue.textContent = `$${principalUSD.toLocaleString('es-VE', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
        els.simResEquivMonto.textContent = `$${principalUSD.toLocaleString('es-VE', {minimumFractionDigits: 2, maximumFractionDigits: 2})} USD (${principalVES.toLocaleString('es-VE', {minimumFractionDigits: 2, maximumFractionDigits: 2})} VES)`;
    } else {
        els.simBcvMontoLabel.textContent = "Monto de Dólares a Comprar ($)";
        els.simBcvMonto.placeholder = "Ej. 500";
        els.simResPrincipalLabel.textContent = "Bolívares Necesarios (Total)";
        els.simResEquivLabel.textContent = "Costo Neto Divisas (VES):";
        
        principalUSD = monto;
        principalVES = principalUSD * tasa;
        comisionVES = principalVES * comisionPct;
        totalVES = principalVES + comisionVES;
        
        els.simResPrincipalValue.textContent = `${totalVES.toLocaleString('es-VE', {minimumFractionDigits: 2, maximumFractionDigits: 2})} VES`;
        els.simResEquivMonto.textContent = `${principalVES.toLocaleString('es-VE', {minimumFractionDigits: 2, maximumFractionDigits: 2})} VES ($${principalUSD.toLocaleString('es-VE', {minimumFractionDigits: 2, maximumFractionDigits: 2})} USD)`;
    }
    
    els.simResComisionVes.textContent = `${comisionVES.toLocaleString('es-VE', {minimumFractionDigits: 2, maximumFractionDigits: 2})} VES`;
    els.simResTotalVes.textContent = `${totalVES.toLocaleString('es-VE', {minimumFractionDigits: 2, maximumFractionDigits: 2})} VES`;
    
    if (limiteCuenta > 0) {
        const cuentasExactas = principalUSD / limiteCuenta;
        const cuentasRedondeadas = Math.ceil(cuentasExactas);
        
        if (cuentasRedondeadas === 0) {
            els.simResCuentasValue.textContent = "0 cuentas";
            els.simResCuentasDesc.textContent = "Introduce un monto para calcular.";
        } else {
            els.simResCuentasValue.textContent = `${cuentasRedondeadas} ${cuentasRedondeadas === 1 ? 'cuenta' : 'cuentas'}`;
            
            let remainingUSD = principalUSD;
            const parts = [];
            for (let i = 0; i < cuentasRedondeadas; i++) {
                const partAmt = Math.min(remainingUSD, limiteCuenta);
                const partVes = partAmt * tasa * (1 + comisionPct);
                parts.push(`Cuenta ${i+1}: $${partAmt.toLocaleString('es-VE', {minimumFractionDigits: 2, maximumFractionDigits: 2})} (${partVes.toLocaleString('es-VE', {minimumFractionDigits: 2, maximumFractionDigits: 2})} VES)`);
                remainingUSD -= partAmt;
            }
            els.simResCuentasDesc.innerHTML = parts.join('<br>');
        }
    } else {
        els.simResCuentasValue.textContent = "Límite no definido";
        els.simResCuentasDesc.textContent = "Especifica un límite de cuenta válido.";
    }
}

// Bind to window
window.eliminarRemesa = eliminarRemesa;
window.iniciarEditarRemesa = iniciarEditarRemesa;
window.cerrarModalEditarRemesa = cerrarModalEditarRemesa;
window.eliminarMovimientoZelle = eliminarMovimientoZelle;

let semanalChartRef = null;
let mensualChartRef = null;
let remesasTraficoDiasChartRef = null;
let remesasMejoresClientesChartRef = null;
let remesasMetodosChartRef = null;
let remesasBancosDestinoChartRef = null;

async function loadAndRenderCharts() {
    try {
        const period = els.statsPeriodoSelect ? els.statsPeriodoSelect.value : 'semana';
        const stats = await apiCall(`/stats/dashboard?period=${period}`);
        
        // 0. Update summary KPI cards
        if (stats.summary) {
            // Consolidated KPIs
            document.getElementById('stats-ganancia-historica').textContent = `$${stats.summary.ganancia_historica_consolidada.toLocaleString('es-VE', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
            document.getElementById('stats-ganancia-semanal').textContent = `$${stats.summary.ganancia_semanal_consolidada.toLocaleString('es-VE', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
            document.getElementById('stats-ganancia-mensual').textContent = `$${stats.summary.ganancia_mensual_consolidada.toLocaleString('es-VE', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
            
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

        // Render Weekly Chart
        const ctxSemanal = document.getElementById('chart-semanal');
        if (ctxSemanal) {
            const labels = stats.weekly.map(item => `${item.label} (${item.date})`);
            const volRemesas = stats.weekly.map(item => item.volumen_remesas);
            const volCiclos = stats.weekly.map(item => item.volumen_ciclos);
            const ganTotal = stats.weekly.map(item => item.ganancia_remesas + item.ganancia_ciclos);
            
            if (semanalChartRef) {
                semanalChartRef.destroy();
            }
            
            semanalChartRef = new Chart(ctxSemanal, {
                type: 'bar',
                data: {
                    labels: labels,
                    datasets: [
                        {
                            label: 'Volumen Remesas ($)',
                            data: volRemesas,
                            backgroundColor: 'rgba(0, 112, 243, 0.4)',
                            borderColor: '#0070F3',
                            borderWidth: 1,
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
    let d = new Date(dateStr);
    if (!isNaN(d.getTime())) return d;
    
    try {
        const parts = dateStr.trim().split(/\s+/);
        const dateParts = parts[0].split('/');
        if (dateParts.length === 3) {
            const day = parseInt(dateParts[0]);
            const month = parseInt(dateParts[1]) - 1;
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
        const startOfWeek = new Date(now);
        const day = startOfWeek.getDay();
        const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
        startOfWeek.setDate(diff);
        startOfWeek.setHours(0, 0, 0, 0);
        
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 7);
        
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

// DOM Content Loaded entry point
document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    setupEventListeners();
    checkAuth();
});
