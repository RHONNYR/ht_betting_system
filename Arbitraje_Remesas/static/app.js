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
    calcTarjetaCompra: document.getElementById('calc-tarjeta-compra'),
    calcDivisasCompradas: document.getElementById('calc-divisas-compradas'),
    calcDivisasProcesadas: document.getElementById('calc-divisas-procesadas'),
    calcTransferenciasVes: document.getElementById('calc-transferencias-ves'),
    calcPagoMovilAuto: document.getElementById('calc-pago-movil-auto'),
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
    btnCloseModalCompraParcial: document.getElementById('btn-close-modal-compra-parcial'),
    modalPivotVes: document.getElementById('modal-pivot-ves'),
    pivotVesForm: document.getElementById('pivot-ves-form'),
    btnCloseModalPivotVes: document.getElementById('btn-close-modal-pivot-ves'),
    
    modalEditarSnapshot: document.getElementById('modal-editar-snapshot'),
    editarSnapshotForm: document.getElementById('editar-snapshot-form'),
    btnCloseModalEditarSnapshot: document.getElementById('btn-close-modal-editar-snapshot'),
    
    // History Tab
    ciclosTableBody: document.getElementById('ciclos-table-body'),
    totalGananciaCiclos: document.getElementById('total-ganancia-ciclos'),
    comprasTableBody: document.getElementById('compras-table-body'),
    capitalHistoryTableBody: document.getElementById('capital-history-table-body'),
    
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
    await fetchBCV();
    await loadCapital();
    await loadTitularesAndCards();
    await loadCiclos();
    await loadActiveEnvelopes();
    await loadCompras();
    await loadCapitalSnapshots();
    await loadRemesas();
    await loadClientes();
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
}

// Load Capital Distribution
async function loadCapital() {
    try {
        const data = await apiCall('/capital');
        state.capitalItems = data.items;
        
        els.totalCapitalUsd.textContent = `$${data.totales.total_usd_equivalente.toLocaleString('es-VE', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
        els.totalCapitalSimulado.textContent = `$${data.totales.total_usd_simulado.toLocaleString('es-VE', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
        
        // Build table rows
        els.capitalTableBody.innerHTML = '';
        state.capitalItems.forEach(item => {
            const tr = document.createElement('tr');
            
            // Format simulation commission as percentage
            const comPct = parseFloat((item.comision_simulacion * 100).toFixed(2));
            
            tr.innerHTML = `
                <td><strong>${item.plataforma}</strong></td>
                <td>
                    <input type="number" step="any" class="input-saldo-usd" data-id="${item.id}" value="${item.saldo_usd}">
                </td>
                <td>
                    ${item.convertir_ves ? `<input type="number" step="any" class="input-saldo-ves" data-id="${item.id}" value="${item.saldo_ves}">` : '-'}
                </td>
                <td>$${item.usd_equivalente.toFixed(2)}</td>
                <td>$${item.usd_simulado.toFixed(2)} <span class="text-muted" style="font-size:0.75rem;">(-${comPct}%)</span></td>
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
                
                // Render progress bar
                const monthlyConsumed = card.consumo_mensual;
                const limit = card.limite_mensual;
                const percent = limit > 0 ? Math.min((monthlyConsumed / limit) * 100, 100) : 0;
                
                let progressClass = 'progress-normal';
                if (percent > 90) progressClass = 'progress-danger';
                else if (percent > 70) progressClass = 'progress-warning';
                
                const cardDiv = document.createElement('div');
                cardDiv.className = 'card-item-row';
                cardDiv.innerHTML = `
                    <div class="card-item-header">
                        <div>
                            <span class="card-title">${card.banco} - ${card.tipo_tarjeta}</span>
                            <span class="card-owner">de ${tit.nombre}</span>
                        </div>
                        ${tit.tercera_edad ? '<span class="senior-badge">Tercera Edad</span>' : ''}
                    </div>
                    <div class="card-progress-bar-container">
                        <div class="card-progress-fill ${progressClass}" style="width: ${percent}%"></div>
                    </div>
                    <div class="card-limit-labels">
                        <span>Consumido: $${monthlyConsumed.toFixed(0)}</span>
                        <span>Límite: $${limit.toFixed(0)}</span>
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
    const isTerceraEdad = selectedOption.getAttribute('data-tercera-edad') === 'true';
    
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
    const usdNetosRecibidosBinance = divisasProcesadas * (1 - cardComisionPct) * (1 - binanceDepositFeePct);
    
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
                        <span style="color: var(--text-secondary);">Dólares Depositados:</span>
                        <strong style="color: var(--text-primary);">${formatUSD(divisasProcesadas)}</strong>
                    </div>
                    <div class="flow-data-row" style="display: flex; justify-content: space-between; font-size: 0.85rem;">
                        <span style="color: var(--text-secondary);">Deducción Tarjeta (${(cardComisionPct * 100).toFixed(1)}%):</span>
                        <span class="text-danger">-${formatUSD(divisasProcesadas * cardComisionPct)}</span>
                    </div>
                    <div class="flow-data-row" style="display: flex; justify-content: space-between; font-size: 0.85rem;">
                        <span style="color: var(--text-secondary);">Comisión Fondeo Binance (4.1%):</span>
                        <span class="text-danger">-${formatUSD(divisasProcesadas * (1 - cardComisionPct) * 0.041)}</span>
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
    
    // Set status to "abierto"
    const openCicloData = {
        ...state.currentCalculatedCiclo,
        status: "abierto",
        bolivares_sobre_restantes: state.currentCalculatedCiclo.usdt_vendidos * 0.9975 * state.currentCalculatedCiclo.tasa_venta,
        divisas_compradas: 0.0,
        usd_procesados_binance: 0.0,
        usd_recibidos_binance: 0.0,
        comision_compra_ves: 0.0,
        transferencias_ves: 0.0,
        ganancia_usd: 0.0,
        ganancia_porcentaje: 0.0,
        bolivares_restantes: state.currentCalculatedCiclo.usdt_vendidos * 0.9975 * state.currentCalculatedCiclo.tasa_venta
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
                    </div>
                    
                    <!-- Progress Bar -->
                    <div style="width: 100%; height: 6px; background: rgba(255,255,255,0.05); border-radius: 3px; overflow: hidden;">
                        <div style="width: ${progressPct.toFixed(1)}%; height: 100%; background: var(--primary-color);"></div>
                    </div>

                    <!-- Collapsible Purchases List -->
                    ${c.compras_parciales && c.compras_parciales.length > 0 ? `
                    <div style="border-top: 1px solid var(--border-color); padding-top: 0.5rem; margin-top: 0.25rem; width: 100%;">
                        <details style="width: 100%;">
                            <summary style="font-size: 0.78rem; color: var(--primary-color); cursor: pointer; user-select: none; font-weight: 500; outline: none;">
                                📋 Compras registradas (${c.compras_parciales.length})
                            </summary>
                            <div style="display: flex; flex-direction: column; gap: 0.35rem; margin-top: 0.4rem; max-height: 110px; overflow-y: auto; padding-right: 0.25rem;">
                                ${c.compras_parciales.map(cp => `
                                    <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.75rem; color: var(--text-secondary); background: rgba(0,0,0,0.15); padding: 4px 8px; border-radius: 6px; border: 1px solid var(--border-color);">
                                        <span>$${cp.usd_comprados.toFixed(2)} a ${cp.tasa_bcv.toFixed(2)} Bs</span>
                                        <button onclick="deletePartialBuy(${cp.id})" style="background: none; border: none; color: var(--text-danger); cursor: pointer; padding: 2px 4px; font-size: 0.75rem; display: flex; align-items: center; justify-content: center;" title="Eliminar compra">🗑️</button>
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

window.openPartialBuy = function(cicloId) {
    document.getElementById('compra-parcial-ciclo-id').value = cicloId;
    document.getElementById('compra-parcial-usd').value = '';
    document.getElementById('compra-parcial-tasa').value = state.bcvRate;
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
    if (!confirm("¿Estás seguro de que deseas cerrar este sobre manualmente? Los bolívares remanentes se registrarán en cero y se consolidará la ganancia final del ciclo.")) return;
    try {
        await apiCall(`/ciclos/${cicloId}/close`, 'POST');
        alert("Ciclo cerrado exitosamente.");
        await initDashboard();
    } catch (err) {
        alert(err.message);
    }
};

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
    
    let cardComisionPct = 0.0;
    let isTerceraEdad = false;
    
    try {
        const activos = await apiCall('/ciclos/activos');
        const c = activos.find(item => item.id === cicloId);
        if (c && c.tarjeta_id) {
            const option = els.calcTarjetaCompra.querySelector(`option[value="${c.tarjeta_id}"]`);
            if (option) {
                cardComisionPct = parseFloat(option.getAttribute('data-comision')) || 0.0;
                isTerceraEdad = option.getAttribute('data-tercera-edad') === 'true';
            }
        }
    } catch (err) {
        console.error("Error retrieving active card details:", err);
    }
    
    const compraComisionPct = isTerceraEdad ? 0.0 : 0.005; // 0.5%
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
        usd_recibidos_binance: usdNetosRecibidosBinance
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
        els.ciclosTableBody.innerHTML = '';
        let totalGain = 0.0;
        
        ciclos.forEach(c => {
            totalGain += c.ganancia_usd;
            const tr = document.createElement('tr');
            const profitClass = c.ganancia_usd >= 0 ? 'text-success' : 'text-danger';
            
            const statusBadge = c.status === 'abierto' 
                ? ` <span class="badge" style="font-size: 0.7rem; background: rgba(245,158,11,0.15); color: #f59e0b; padding: 2px 6px; border-radius: 4px; border: 1px solid rgba(245,158,11,0.3);">Abierto</span>`
                : '';
            
            tr.innerHTML = `
                <td>${c.fecha}</td>
                <td>${c.usdt_vendidos.toFixed(2)}</td>
                <td>${c.tasa_venta.toFixed(2)}</td>
                <td>${c.banco_venta}${statusBadge}</td>
                <td>$${c.divisas_compradas.toFixed(2)}</td>
                <td>${c.tasa_bcv.toFixed(2)}</td>
                <td>$${c.usd_recibidos_binance.toFixed(2)}</td>
                <td class="${profitClass}"><strong>$${c.ganancia_usd.toFixed(2)}</strong></td>
                <td class="${profitClass}">${c.ganancia_porcentaje.toFixed(2)}%</td>
                <td>${c.bolivares_restantes.toLocaleString('es-VE', {maximumFractionDigits: 2})}</td>
            `;
            els.ciclosTableBody.appendChild(tr);
        });
        
        els.totalGananciaCiclos.textContent = `$${totalGain.toLocaleString('es-VE', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
    } catch (err) {
        console.error("Error loading ciclos:", err);
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
            handleCalcularCiclo();
        });
    }
    
    els.calcUsdtVendidos.addEventListener('input', updateSuggestedDivisas);
    els.calcTasaVenta.addEventListener('input', updateSuggestedDivisas);
    if (els.calcTarjetaCompra) {
        els.calcTarjetaCompra.addEventListener('change', updateSuggestedDivisas);
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
                    cliente_genero: guessedGender
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
        els.remesasTableBody.innerHTML = '';
        
        let totalGain = 0;
        remesas.forEach(r => {
            totalGain += r.ganancia_usd;
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
        
        els.totalGananciaRemesas.textContent = `$${totalGain.toLocaleString('es-VE', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
    } catch (err) {
        console.error("Error loading remesas:", err);
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
        cliente_genero: els.remesaClienteGenero ? els.remesaClienteGenero.value : "Masculino"
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

function iniciarEditarRemesa(id) {
    const r = (state.rawRemesas || []).find(rem => rem.id === id);
    if (!r) return;
    
    document.getElementById('edit-remesa-id').value = r.id;
    document.getElementById('edit-remesa-cliente').value = r.cliente_nombre;
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

// Bind to window
window.eliminarRemesa = eliminarRemesa;
window.iniciarEditarRemesa = iniciarEditarRemesa;
window.cerrarModalEditarRemesa = cerrarModalEditarRemesa;

// DOM Content Loaded entry point
document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    setupEventListeners();
    checkAuth();
});
