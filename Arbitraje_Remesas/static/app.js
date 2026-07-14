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
    calcResultsPreview: document.getElementById('calc-results-preview'),
    
    // History Tab
    ciclosTableBody: document.getElementById('ciclos-table-body'),
    totalGananciaCiclos: document.getElementById('total-ganancia-ciclos'),
    comprasTableBody: document.getElementById('compras-table-body'),
    capitalHistoryTableBody: document.getElementById('capital-history-table-body'),
    
    // Remesas Elements
    remesaForm: document.getElementById('remesa-form'),
    remesaCliente: document.getElementById('remesa-cliente'),
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

async function handleCapitalSubmit(e) {
    e.preventDefault();
    const updates = [];
    
    // Extract inputs
    const usdInputs = els.capitalTableBody.querySelectorAll('.input-saldo-usd');
    usdInputs.forEach(input => {
        const id = parseInt(input.getAttribute('data-id'));
        const saldo_usd = parseFloat(input.value) || 0.0;
        
        // Find corresponding VES input if exists
        const vesInput = els.capitalTableBody.querySelector(`.input-saldo-ves[data-id="${id}"]`);
        const saldo_ves = vesInput ? (parseFloat(vesInput.value) || 0.0) : 0.0;
        
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
        const suggestedUSD = Math.floor(bsRecibidos / state.bcvRate);
        
        els.calcDivisasCompradas.value = suggestedUSD;
        els.calcDivisasProcesadas.value = suggestedUSD;
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
    
    els.calcResultsPreview.innerHTML = `
        <div class="results-display-list">
            <div class="result-item" data-tooltip="Bolívares recibidos en tu banco tras vender USDT en P2P (neto de la comisión de Binance 0.25%).">
                <span class="label">Bolívares Recibidos (Venta USDT):</span>
                <span class="value">${formatVES(bolivaresRecibidos)}</span>
            </div>
            <div class="result-item" data-tooltip="El costo en Bolívares de las divisas oficiales compradas en el banco, calculado a la tasa oficial del BCV (Divisas Compradas * Tasa BCV).">
                <span class="label">Costo Base Divisas (Tasa BCV ${state.bcvRate}):</span>
                <span class="value">${formatVES(costoBaseVES)}</span>
            </div>
            <div class="result-item" data-tooltip="Comisión bancaria de compra (0.5% del costo base). Exenta si el titular es de la Tercera Edad.">
                <span class="label">Comisión Compra VES (${isTerceraEdad ? 'Tercera Edad Exenta' : '0.5%'}):</span>
                <span class="value">${formatVES(comisionCompraVES)}</span>
            </div>
            <div class="result-item" data-tooltip="Comisiones por transferencias bancarias o Pago Móvil (0.3% si está activo).">
                <span class="label">Transferencias VES:</span>
                <span class="value">${formatVES(transferenciasVes)}</span>
            </div>
            <div class="result-item" data-tooltip="Monto total de Bolívares que gastaste en la operación (Costo Base + Comisión de Compra + Comisiones de Transferencia).">
                <span class="label">Bolívares Gastados Totales:</span>
                <span class="value">${formatVES(bolivaresGastadosTotales)}</span>
            </div>
            <div class="result-item highlight-alt" data-tooltip="Costo equivalente en USDT de los Bolívares gastados en la operación, calculado como: Bolívares Gastados Totales / Tasa de Venta P2P.">
                <span class="label">USDT Gastados (Costo Operación):</span>
                <span class="value text-danger">${ustdCostOfOperation.toFixed(2)} USDT</span>
            </div>
            <div class="result-item" data-tooltip="Los Bolívares que te quedaron en tu cuenta bancaria tras pagar la compra de divisas (Bolívares Recibidos - Bolívares Gastados Totales).">
                <span class="label">Bolívares Restantes en Banco:</span>
                <span class="value ${bolivaresRestantes >= 0 ? 'text-success' : 'text-danger'}">${formatVES(bolivaresRestantes)}</span>
            </div>
            <div class="result-item" data-tooltip="Los dólares netos que efectivamente llegaron a tu billetera de Binance tras descontar la comisión de la tarjeta del banco y la comisión de depósito de Binance (4.1%).">
                <span class="label">USD Netos Recibidos en Binance:</span>
                <span class="value text-success">${formatUSD(usdNetosRecibidosBinance)}</span>
            </div>
            <div class="result-item highlight" data-tooltip="Tu ganancia neta del ciclo en dólares, calculada como: USD Netos Recibidos en Binance - Costo de Operación en USDT.">
                <span class="label">Ganancia Estimada USD:</span>
                <span class="value ${profitClass}">${formatUSD(gananciaUsd)}</span>
            </div>
            <div class="result-item" data-tooltip="El rendimiento porcentual de la operación con respecto al capital invertido, calculado como: (Ganancia en USD / Costo de Operación en USDT) * 100.">
                <span class="label">Porcentaje de Rendimiento:</span>
                <span class="value ${profitClass}">${gananciaPorcentaje.toFixed(2)}%</span>
            </div>
        </div>
    `;
    
    els.btnGuardarCiclo.classList.remove('hidden');
}

async function handleGuardarCiclo() {
    if (!state.currentCalculatedCiclo) return;
    try {
        await apiCall('/ciclos', 'POST', state.currentCalculatedCiclo);
        alert("Ciclo registrado en el historial con éxito.");
        
        // Reset form
        els.calcForm.reset();
        els.btnGuardarCiclo.classList.add('hidden');
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
            
            tr.innerHTML = `
                <td>${c.fecha}</td>
                <td>${c.usdt_vendidos.toFixed(2)}</td>
                <td>${c.tasa_venta.toFixed(2)}</td>
                <td>${c.banco_venta}</td>
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
        els.capitalHistoryTableBody.innerHTML = '';
        
        snaps.forEach(s => {
            const tr = document.createElement('tr');
            
            // Build simple details string
            const detailStr = s.detalle.map(d => `${d.plataforma}: $${d.usd_equivalente.toFixed(0)}`).join(' | ');
            
            tr.innerHTML = `
                <td>${s.fecha}</td>
                <td><strong>$${s.total_usd.toLocaleString('es-VE', {minimumFractionDigits: 2})}</strong></td>
                <td><span class="text-secondary" style="font-size:0.8rem;">${detailStr}</span></td>
            `;
            els.capitalHistoryTableBody.appendChild(tr);
        });
    } catch (err) {
        console.error("Error loading snapshots:", err);
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
    
    // Navigation Tabs
    els.tabLinks.forEach(link => link.addEventListener('click', handleTabSwitch));
    els.subTabLinks.forEach(link => link.addEventListener('click', handleSubTabSwitch));
    
    // Capital
    els.capitalForm.addEventListener('submit', handleCapitalSubmit);
    els.btnSnapshotCapital.addEventListener('click', handleSnapshotCapital);
    
    // Calculator
    els.btnCalcularCiclo.addEventListener('click', handleCalcularCiclo);
    els.btnGuardarCiclo.addEventListener('click', handleGuardarCiclo);
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
    els.calcDivisasCompradas.addEventListener('input', () => {
        state.divisasCompradasManuallyEdited = true;
    });
    els.calcForm.addEventListener('reset', () => {
        state.divisasCompradasManuallyEdited = false;
    });
    
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
        comision_binance: comisionBinPct
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

// DOM Content Loaded entry point
document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    setupEventListeners();
    checkAuth();
});
