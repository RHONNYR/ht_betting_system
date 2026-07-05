// Application State
const state = {
    token: localStorage.getItem('token') || null,
    username: localStorage.getItem('username') || null,
    bcvRate: 0.0,
    bcvSource: 'Oficial',
    capitalItems: [],
    titulares: [],
    currentCalculatedCiclo: null
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
    btnCalcularCiclo: document.getElementById('btn-calcular-ciclo'),
    btnGuardarCiclo: document.getElementById('btn-guardar-ciclo'),
    calcResultsPreview: document.getElementById('calc-results-preview'),
    
    // History Tab
    ciclosTableBody: document.getElementById('ciclos-table-body'),
    totalGananciaCiclos: document.getElementById('total-ganancia-ciclos'),
    comprasTableBody: document.getElementById('compras-table-body'),
    capitalHistoryTableBody: document.getElementById('capital-history-table-body'),
    
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
            const comPct = (item.comision_simulacion * 100).toFixed(1);
            
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
        alert("Distribución de Capital actualizada con éxito.");
        await loadCapital();
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
            <div class="result-item">
                <span class="label">Bolívares Recibidos (Venta USDT):</span>
                <span class="value">${formatVES(bolivaresRecibidos)}</span>
            </div>
            <div class="result-item">
                <span class="label">Costo Base Divisas (Tasa BCV ${state.bcvRate}):</span>
                <span class="value">${formatVES(costoBaseVES)}</span>
            </div>
            <div class="result-item">
                <span class="label">Comisión Compra VES (${isTerceraEdad ? 'Tercera Edad Exenta' : '0.5%'}):</span>
                <span class="value">${formatVES(comisionCompraVES)}</span>
            </div>
            <div class="result-item">
                <span class="label">Transferencias VES:</span>
                <span class="value">${formatVES(transferenciasVes)}</span>
            </div>
            <div class="result-item">
                <span class="label">Bolívares Gastados Totales:</span>
                <span class="value">${formatVES(bolivaresGastadosTotales)}</span>
            </div>
            <div class="result-item">
                <span class="label">Bolívares Restantes en Banco:</span>
                <span class="value ${bolivaresRestantes >= 0 ? 'text-success' : 'text-danger'}">${formatVES(bolivaresRestantes)}</span>
            </div>
            <div class="result-item">
                <span class="label">USD Netos Recibidos en Binance:</span>
                <span class="value text-success">${formatUSD(usdNetosRecibidosBinance)}</span>
            </div>
            <div class="result-item highlight">
                <span class="label">Ganancia Estimada USD:</span>
                <span class="value ${profitClass}">${formatUSD(gananciaUsd)}</span>
            </div>
            <div class="result-item">
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
}

// DOM Content Loaded entry point
document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
    checkAuth();
});
