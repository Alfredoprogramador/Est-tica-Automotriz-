const STORAGE_KEY = 'estetica-automotriz-data-v1';
const API_STATE_ENDPOINT = '/api/state';
const STATUS_OPTIONS = ['agendado', 'em andamento', 'concluído', 'cancelado'];
const PAYMENT_STATUS_OPTIONS = ['pendente', 'pago', 'estornado'];

const initialState = {
  clients: [],
  vehicles: [],
  services: [],
  schedules: [],
  orders: [],
  payments: []
};

let state = structuredClone(initialState);

const elements = {
  clientForm: document.querySelector('#client-form'),
  vehicleForm: document.querySelector('#vehicle-form'),
  serviceForm: document.querySelector('#service-form'),
  scheduleForm: document.querySelector('#schedule-form'),
  orderForm: document.querySelector('#order-form'),
  paymentForm: document.querySelector('#payment-form'),
  clientsTable: document.querySelector('#clients-table'),
  vehiclesTable: document.querySelector('#vehicles-table'),
  servicesTable: document.querySelector('#services-table'),
  schedulesTable: document.querySelector('#schedules-table'),
  ordersTable: document.querySelector('#orders-table'),
  paymentsTable: document.querySelector('#payments-table'),
  notificationsList: document.querySelector('#notifications-list'),
  historyList: document.querySelector('#history-list'),
  dashboardCards: document.querySelector('#dashboard-cards'),
  reportsGrid: document.querySelector('#reports-grid'),
  seedDataButton: document.querySelector('#seed-data'),
  clearDataButton: document.querySelector('#clear-data'),
  vehicleClientSelect: document.querySelector('#vehicle-client'),
  scheduleClientSelect: document.querySelector('#schedule-client'),
  scheduleVehicleSelect: document.querySelector('#schedule-vehicle'),
  scheduleServiceSelect: document.querySelector('#schedule-service'),
  orderClientSelect: document.querySelector('#order-client'),
  orderVehicleSelect: document.querySelector('#order-vehicle'),
  orderScheduleSelect: document.querySelector('#order-schedule'),
  paymentSourceTypeSelect: document.querySelector('#payment-source-type'),
  paymentSourceSelect: document.querySelector('#payment-source'),
  emptyTemplate: document.querySelector('#empty-state-template')
};

bootstrap();

async function bootstrap() {
  attachEvents();
  await hydrateState();
  render();
}

function attachEvents() {
  elements.clientForm.addEventListener('submit', handleClientSubmit);
  elements.vehicleForm.addEventListener('submit', handleVehicleSubmit);
  elements.serviceForm.addEventListener('submit', handleServiceSubmit);
  elements.scheduleForm.addEventListener('submit', handleScheduleSubmit);
  elements.orderForm.addEventListener('submit', handleOrderSubmit);
  elements.paymentForm.addEventListener('submit', handlePaymentSubmit);

  [elements.clientForm, elements.vehicleForm, elements.serviceForm, elements.scheduleForm, elements.orderForm, elements.paymentForm].forEach((form) => {
    form.addEventListener('reset', () => {
      window.setTimeout(() => {
        form.querySelector('[name="id"]').value = '';
        syncDependentSelects();
      }, 0);
    });
  });

  elements.seedDataButton.addEventListener('click', seedDemoData);
  elements.clearDataButton.addEventListener('click', clearAllData);
  elements.scheduleClientSelect.addEventListener('change', syncDependentSelects);
  elements.scheduleServiceSelect.addEventListener('change', syncSchedulePriceFromService);
  elements.orderClientSelect.addEventListener('change', syncDependentSelects);
  elements.orderScheduleSelect.addEventListener('change', syncOrderFromSchedule);
  elements.paymentSourceTypeSelect.addEventListener('change', syncPaymentReferenceOptions);
  elements.paymentSourceSelect.addEventListener('change', syncPaymentAmountFromReference);
}

function handleClientSubmit(event) {
  event.preventDefault();
  const formData = new FormData(event.currentTarget);
  const payload = {
    id: formData.get('id') || crypto.randomUUID(),
    name: formData.get('name').trim(),
    phone: formData.get('phone').trim(),
    email: formData.get('email').trim(),
    address: formData.get('address').trim()
  };

  state.clients = upsertById(state.clients, payload);
  persistAndRender();
  event.currentTarget.reset();
}

function handleVehicleSubmit(event) {
  event.preventDefault();
  const formData = new FormData(event.currentTarget);
  const payload = {
    id: formData.get('id') || crypto.randomUUID(),
    clientId: formData.get('clientId'),
    model: formData.get('model').trim(),
    plate: formData.get('plate').trim().toUpperCase(),
    color: formData.get('color').trim()
  };

  state.vehicles = upsertById(state.vehicles, payload);
  persistAndRender();
  event.currentTarget.reset();
}

function handleServiceSubmit(event) {
  event.preventDefault();
  const formData = new FormData(event.currentTarget);
  const payload = {
    id: formData.get('id') || crypto.randomUUID(),
    name: formData.get('name').trim(),
    duration: Number(formData.get('duration')),
    basePrice: Number(formData.get('basePrice'))
  };

  state.services = upsertById(state.services, payload);
  persistAndRender();
  event.currentTarget.reset();
}

function handleScheduleSubmit(event) {
  event.preventDefault();
  const formData = new FormData(event.currentTarget);
  const id = formData.get('id') || crypto.randomUUID();
  const existing = state.schedules.find((item) => item.id === id);
  const selectedService = state.services.find((item) => item.id === formData.get('serviceId'));
  const fallbackServiceType = existing?.serviceType || '';
  const payload = {
    id,
    clientId: formData.get('clientId'),
    vehicleId: formData.get('vehicleId'),
    serviceId: formData.get('serviceId'),
    serviceType: selectedService?.name || fallbackServiceType,
    date: formData.get('date'),
    time: formData.get('time'),
    price: Number(formData.get('price')),
    notes: formData.get('notes').trim(),
    status: existing?.status || 'agendado',
    createdAt: existing?.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  state.schedules = upsertById(state.schedules, payload);
  persistAndRender();
  event.currentTarget.reset();
}

function handleOrderSubmit(event) {
  event.preventDefault();
  const formData = new FormData(event.currentTarget);
  const id = formData.get('id') || crypto.randomUUID();
  const existing = state.orders.find((item) => item.id === id);
  const payload = {
    id,
    scheduleId: formData.get('scheduleId'),
    clientId: formData.get('clientId'),
    vehicleId: formData.get('vehicleId'),
    description: formData.get('description').trim(),
    technician: formData.get('technician').trim(),
    price: Number(formData.get('price')),
    status: existing?.status || 'agendado',
    createdAt: existing?.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  state.orders = upsertById(state.orders, payload);
  persistAndRender();
  event.currentTarget.reset();
}

function handlePaymentSubmit(event) {
  event.preventDefault();
  const formData = new FormData(event.currentTarget);
  const id = formData.get('id') || crypto.randomUUID();
  const existing = state.payments.find((item) => item.id === id);
  const payload = {
    id,
    sourceType: formData.get('sourceType'),
    sourceId: formData.get('sourceId'),
    method: formData.get('method'),
    amount: Number(formData.get('amount')),
    paidAt: formData.get('paidAt'),
    status: formData.get('status') || existing?.status || 'pendente',
    createdAt: existing?.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  state.payments = upsertById(state.payments, payload);
  persistAndRender();
  event.currentTarget.reset();
}

function render() {
  syncDependentSelects();
  renderDashboard();
  renderClients();
  renderVehicles();
  renderServices();
  renderSchedules();
  renderOrders();
  renderPayments();
  renderNotifications();
  renderHistory();
  renderReports();
}

function renderDashboard() {
  const concludedCount = [...state.schedules, ...state.orders].filter((item) => item.status === 'concluído').length;
  const revenue = getTotalRevenue();
  const receivedRevenue = getTotalReceivedPayments();
  const cards = [
    { label: 'Clientes cadastrados', value: state.clients.length },
    { label: 'Veículos cadastrados', value: state.vehicles.length },
    { label: 'Atendimentos concluídos', value: concludedCount },
    { label: 'Faturamento total', value: currency(revenue) },
    { label: 'Pagamentos recebidos', value: currency(receivedRevenue) }
  ];

  elements.dashboardCards.innerHTML = cards
    .map(
      (card) => `
        <article class="metric-card">
          <span class="muted">${card.label}</span>
          <strong>${card.value}</strong>
        </article>
      `
    )
    .join('');
}

function renderClients() {
  if (!state.clients.length) {
    elements.clientsTable.innerHTML = '<tr><td colspan="3" class="empty-state">Nenhum cliente cadastrado.</td></tr>';
    return;
  }

  elements.clientsTable.innerHTML = state.clients
    .map(
      (client) => `
        <tr>
          <td>
            <strong>${client.name}</strong>
          </td>
          <td>
            <div>${client.phone}</div>
            <div class="muted">${client.email}</div>
            <div class="muted">${client.address || 'Endereço não informado'}</div>
            ${client.address ? `<a href="${buildMapSearchUrl(client.address)}" target="_blank" rel="noopener noreferrer">Ver no mapa</a>` : ''}
          </td>
          <td>
            <div class="action-group">
              <button class="small ghost" type="button" data-action="edit-client" data-id="${client.id}">Editar</button>
              <button class="small secondary" type="button" data-action="delete-client" data-id="${client.id}">Excluir</button>
            </div>
          </td>
        </tr>
      `
    )
    .join('');
}

function renderVehicles() {
  if (!state.vehicles.length) {
    elements.vehiclesTable.innerHTML = '<tr><td colspan="3" class="empty-state">Nenhum veículo cadastrado.</td></tr>';
    return;
  }

  elements.vehiclesTable.innerHTML = state.vehicles
    .map((vehicle) => {
      const client = getClient(vehicle.clientId);
      return `
        <tr>
          <td>
            <strong>${vehicle.model}</strong>
            <div class="muted">${vehicle.plate} • ${vehicle.color}</div>
          </td>
          <td>${client?.name || 'Cliente removido'}</td>
          <td>
            <div class="action-group">
              <button class="small ghost" type="button" data-action="edit-vehicle" data-id="${vehicle.id}">Editar</button>
              <button class="small secondary" type="button" data-action="delete-vehicle" data-id="${vehicle.id}">Excluir</button>
            </div>
          </td>
        </tr>
      `;
    })
    .join('');
}

function renderServices() {
  if (!state.services.length) {
    elements.servicesTable.innerHTML = '<tr><td colspan="4" class="empty-state">Nenhum serviço cadastrado.</td></tr>';
    return;
  }

  elements.servicesTable.innerHTML = state.services
    .map(
      (service) => `
        <tr>
          <td><strong>${service.name}</strong></td>
          <td>${service.duration} min</td>
          <td>${currency(service.basePrice)}</td>
          <td>
            <div class="action-group">
              <button class="small ghost" type="button" data-action="edit-service" data-id="${service.id}">Editar</button>
              <button class="small secondary" type="button" data-action="delete-service" data-id="${service.id}">Excluir</button>
            </div>
          </td>
        </tr>
      `
    )
    .join('');
}

function renderSchedules() {
  if (!state.schedules.length) {
    elements.schedulesTable.innerHTML = '<tr><td colspan="4" class="empty-state">Nenhum agendamento cadastrado.</td></tr>';
    return;
  }

  elements.schedulesTable.innerHTML = sortByDate(state.schedules)
    .map((schedule) => {
      const client = getClient(schedule.clientId);
      const vehicle = getVehicle(schedule.vehicleId);
      return `
        <tr>
          <td>
            <strong>${schedule.serviceType}</strong>
            <div class="muted">${client?.name || 'Cliente removido'} • ${vehicle?.model || 'Veículo removido'}</div>
          </td>
          <td>${formatDateTime(schedule.date, schedule.time)}</td>
          <td>${statusBadge(schedule.status)}</td>
          <td>
            <div class="action-group">
              <button class="small ghost" type="button" data-action="edit-schedule" data-id="${schedule.id}">Editar</button>
              <button class="small" type="button" data-action="advance-schedule" data-id="${schedule.id}">Avançar status</button>
              <button class="small secondary" type="button" data-action="delete-schedule" data-id="${schedule.id}">Excluir</button>
            </div>
          </td>
        </tr>
      `;
    })
    .join('');
}

function renderOrders() {
  if (!state.orders.length) {
    elements.ordersTable.innerHTML = '<tr><td colspan="4" class="empty-state">Nenhuma ordem de serviço cadastrada.</td></tr>';
    return;
  }

  elements.ordersTable.innerHTML = sortByDate(state.orders)
    .map((order) => {
      const client = getClient(order.clientId);
      const vehicle = getVehicle(order.vehicleId);
      return `
        <tr>
          <td>
            <strong>${client?.name || 'Cliente removido'}</strong>
            <div class="muted">${vehicle?.model || 'Veículo removido'}</div>
            <div>${order.description}</div>
          </td>
          <td>${order.technician}</td>
          <td>${statusBadge(order.status)}</td>
          <td>
            <div class="action-group">
              <button class="small ghost" type="button" data-action="edit-order" data-id="${order.id}">Editar</button>
              <button class="small" type="button" data-action="advance-order" data-id="${order.id}">Avançar status</button>
              <button class="small secondary" type="button" data-action="delete-order" data-id="${order.id}">Excluir</button>
            </div>
          </td>
        </tr>
      `;
    })
    .join('');
}

function renderPayments() {
  if (!state.payments.length) {
    elements.paymentsTable.innerHTML = '<tr><td colspan="6" class="empty-state">Nenhum pagamento cadastrado.</td></tr>';
    return;
  }

  elements.paymentsTable.innerHTML = sortByDate(state.payments)
    .map((payment) => {
      const source = resolvePaymentSource(payment);
      return `
        <tr>
          <td>${getPaymentSourceSummary(payment, source)}</td>
          <td>${payment.method}</td>
          <td>${currency(payment.amount)}</td>
          <td>${statusBadge(payment.status)}</td>
          <td>${formatDate(payment.paidAt)}</td>
          <td>
            <div class="action-group">
              <button class="small ghost" type="button" data-action="edit-payment" data-id="${payment.id}">Editar</button>
              <button class="small" type="button" data-action="advance-payment" data-id="${payment.id}">Avançar status</button>
              <button class="small secondary" type="button" data-action="delete-payment" data-id="${payment.id}">Excluir</button>
            </div>
          </td>
        </tr>
      `;
    })
    .join('');
}

function renderNotifications() {
  const notifications = buildNotifications();
  elements.notificationsList.innerHTML = '';

  if (!notifications.length) {
    elements.notificationsList.appendChild(elements.emptyTemplate.content.cloneNode(true));
    return;
  }

  notifications.forEach((notification) => {
    const item = document.createElement('li');
    item.innerHTML = `<strong>${notification.title}</strong><div class="muted">${notification.detail}</div>`;
    elements.notificationsList.appendChild(item);
  });
}

function renderHistory() {
  const historyEntries = [...state.schedules, ...state.orders]
    .filter((item) => item.status === 'concluído')
    .sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt));

  elements.historyList.innerHTML = '';
  if (!historyEntries.length) {
    elements.historyList.appendChild(elements.emptyTemplate.content.cloneNode(true));
    return;
  }

  historyEntries.slice(0, 8).forEach((entry) => {
    const client = getClient(entry.clientId);
    const vehicle = getVehicle(entry.vehicleId);
    const item = document.createElement('li');
    item.innerHTML = `
      <strong>${client?.name || 'Cliente removido'} • ${vehicle?.model || 'Veículo removido'}</strong>
      <div>${entry.serviceType || entry.description}</div>
      <div class="muted">Concluído em ${formatDate(entry.updatedAt || entry.createdAt)}</div>
    `;
    elements.historyList.appendChild(item);
  });
}

function renderReports() {
  const schedulesByStatus = STATUS_OPTIONS.map((status) => ({
    status,
    count: state.schedules.filter((item) => item.status === status).length
  }));

  const reports = [
    {
      title: 'Faturamento concluído',
      value: currency(getTotalRevenue()),
      helper: 'Soma de agendamentos e ordens concluídos.'
    },
    {
      title: 'Pagamentos recebidos',
      value: currency(getTotalReceivedPayments()),
      helper: 'Soma dos pagamentos com status pago.'
    },
    {
      title: 'Pagamentos pendentes',
      value: currency(getPendingPayments()),
      helper: 'Total aguardando confirmação de recebimento.'
    },
    {
      title: 'Produtividade',
      value: `${state.orders.filter((item) => item.status === 'concluído').length} ordens concluídas`,
      helper: 'Quantidade de ordens finalizadas.'
    },
    {
      title: 'Próximos atendimentos',
      value: `${countUpcomingSchedules()} agendamentos`,
      helper: 'Serviços programados para os próximos 7 dias.'
    },
    {
      title: 'Distribuição por status',
      value: schedulesByStatus.map((item) => `${item.status}: ${item.count}`).join(' • '),
      helper: 'Visão geral do fluxo operacional.'
    }
  ];

  elements.reportsGrid.innerHTML = reports
    .map(
      (report) => `
        <article class="report-card">
          <h3>${report.title}</h3>
          <strong>${report.value}</strong>
          <p class="muted">${report.helper}</p>
        </article>
      `
    )
    .join('');
}

function syncDependentSelects() {
  populateSelect(elements.vehicleClientSelect, state.clients, 'Selecione o cliente', (item) => ({
    value: item.id,
    label: item.name
  }));

  populateSelect(elements.scheduleClientSelect, state.clients, 'Selecione o cliente', (item) => ({
    value: item.id,
    label: item.name
  }));

  populateSelect(elements.orderClientSelect, state.clients, 'Selecione o cliente', (item) => ({
    value: item.id,
    label: item.name
  }));

  populateSelect(elements.scheduleVehicleSelect, filterVehicles(elements.scheduleClientSelect.value), 'Selecione o veículo', (item) => ({
    value: item.id,
    label: `${item.model} • ${item.plate}`
  }));

  populateSelect(elements.scheduleServiceSelect, state.services, 'Selecione o serviço', (item) => ({
    value: item.id,
    label: `${item.name} • ${currency(item.basePrice)}`
  }));

  populateSelect(elements.orderVehicleSelect, filterVehicles(elements.orderClientSelect.value), 'Selecione o veículo', (item) => ({
    value: item.id,
    label: `${item.model} • ${item.plate}`
  }));

  populateSelect(elements.orderScheduleSelect, sortByDate(state.schedules), 'Ordem avulsa (sem agendamento)', (item) => ({
    value: item.id,
    label: `${item.serviceType} • ${formatDateTime(item.date, item.time)}`
  }));

  syncPaymentReferenceOptions();
  syncSchedulePriceFromService();
  bindActionButtons();
}

function bindActionButtons() {
  document.querySelectorAll('[data-action]').forEach((button) => {
    button.onclick = () => handleAction(button.dataset.action, button.dataset.id);
  });
}

function handleAction(action, id) {
  switch (action) {
    case 'edit-client':
      fillForm(elements.clientForm, state.clients.find((item) => item.id === id));
      break;
    case 'delete-client':
      state.clients = state.clients.filter((item) => item.id !== id);
      state.vehicles = state.vehicles.filter((item) => item.clientId !== id);
      state.schedules = state.schedules.filter((item) => item.clientId !== id);
      state.orders = state.orders.filter((item) => item.clientId !== id);
      state.payments = state.payments.filter((item) => {
        const source = resolvePaymentSource(item);
        return source && source.clientId !== id;
      });
      persistAndRender();
      break;
    case 'edit-vehicle':
      fillForm(elements.vehicleForm, state.vehicles.find((item) => item.id === id));
      break;
    case 'delete-vehicle':
      state.vehicles = state.vehicles.filter((item) => item.id !== id);
      state.schedules = state.schedules.filter((item) => item.vehicleId !== id);
      state.orders = state.orders.filter((item) => item.vehicleId !== id);
      state.payments = state.payments.filter((item) => {
        const source = resolvePaymentSource(item);
        return source && source.vehicleId !== id;
      });
      persistAndRender();
      break;
    case 'edit-service':
      fillForm(elements.serviceForm, state.services.find((item) => item.id === id));
      break;
    case 'delete-service':
      state.services = state.services.filter((item) => item.id !== id);
      persistAndRender();
      break;
    case 'edit-schedule':
      fillForm(elements.scheduleForm, state.schedules.find((item) => item.id === id));
      break;
    case 'delete-schedule':
      state.schedules = state.schedules.filter((item) => item.id !== id);
      state.orders = state.orders.filter((item) => item.scheduleId !== id);
      state.payments = state.payments.filter((item) => !(item.sourceType === 'schedule' && item.sourceId === id));
      persistAndRender();
      break;
    case 'advance-schedule':
      updateStatus('schedules', id);
      break;
    case 'edit-order':
      fillForm(elements.orderForm, state.orders.find((item) => item.id === id));
      break;
    case 'delete-order':
      state.orders = state.orders.filter((item) => item.id !== id);
      state.payments = state.payments.filter((item) => !(item.sourceType === 'order' && item.sourceId === id));
      persistAndRender();
      break;
    case 'advance-order':
      updateStatus('orders', id);
      break;
    case 'edit-payment':
      fillForm(elements.paymentForm, state.payments.find((item) => item.id === id));
      break;
    case 'delete-payment':
      state.payments = state.payments.filter((item) => item.id !== id);
      persistAndRender();
      break;
    case 'advance-payment':
      updatePaymentStatus(id);
      break;
    default:
      break;
  }
}

function updatePaymentStatus(id) {
  state.payments = state.payments.map((item) => {
    if (item.id !== id) return item;
    const currentIndex = PAYMENT_STATUS_OPTIONS.indexOf(item.status);
    const nextStatus = PAYMENT_STATUS_OPTIONS[(currentIndex + 1) % PAYMENT_STATUS_OPTIONS.length];
    return { ...item, status: nextStatus, updatedAt: new Date().toISOString() };
  });
  persistAndRender();
}

function syncPaymentReferenceOptions() {
  const sourceType = elements.paymentSourceTypeSelect.value;
  const sourceList = getPaymentSourceList(sourceType);
  const placeholder = sourceType === 'order' ? 'Selecione a ordem' : 'Selecione o agendamento';

  populateSelect(elements.paymentSourceSelect, sourceList, placeholder, (item) => ({
    value: item.id,
    label: sourceType === 'order'
      ? `${getClient(item.clientId)?.name || 'Cliente removido'} • ${item.description.slice(0, 30)}`
      : `${item.serviceType} • ${formatDateTime(item.date, item.time)}`
  }));

  syncPaymentAmountFromReference();
}

function syncPaymentAmountFromReference() {
  const source = resolvePaymentSource({
    sourceType: elements.paymentSourceTypeSelect.value,
    sourceId: elements.paymentSourceSelect.value
  });
  if (!source) return;

  const amountField = elements.paymentForm.elements.namedItem('amount');
  if (!amountField.value || Number(amountField.value) <= 0) {
    amountField.value = source.price || 0;
  }
}

function syncSchedulePriceFromService() {
  const selectedService = state.services.find((item) => item.id === elements.scheduleServiceSelect.value);
  if (!selectedService) return;

  const priceField = elements.scheduleForm.elements.namedItem('price');
  if (!priceField.value || Number(priceField.value) <= 0) {
    priceField.value = selectedService.basePrice;
  }
}

function updateStatus(collectionName, id) {
  state[collectionName] = state[collectionName].map((item) => {
    if (item.id !== id) return item;
    const currentIndex = STATUS_OPTIONS.indexOf(item.status);
    const nextStatus = STATUS_OPTIONS[(currentIndex + 1) % STATUS_OPTIONS.length];
    return { ...item, status: nextStatus, updatedAt: new Date().toISOString() };
  });
  persistAndRender();
}

function syncOrderFromSchedule() {
  const schedule = state.schedules.find((item) => item.id === elements.orderScheduleSelect.value);
  if (!schedule) return;

  fillForm(elements.orderForm, {
    scheduleId: schedule.id,
    clientId: schedule.clientId,
    vehicleId: schedule.vehicleId,
    description: `Executar ${schedule.serviceType}. ${schedule.notes || ''}`.trim(),
    price: schedule.price
  });
}

function populateSelect(select, items, placeholder, formatter) {
  const currentValue = select.value;
  const options = [`<option value="">${placeholder}</option>`]
    .concat(items.map((item) => {
      const option = formatter(item);
      return `<option value="${option.value}">${option.label}</option>`;
    }))
    .join('');

  select.innerHTML = options;
  if (items.some((item) => item.id === currentValue)) {
    select.value = currentValue;
  }
}

function fillForm(form, data = {}) {
  Object.entries(data).forEach(([key, value]) => {
    const field = form.elements.namedItem(key);
    if (field) {
      field.value = value ?? '';
    }
  });
  syncDependentSelects();
}

async function hydrateState() {
  state = loadState();

  try {
    const response = await fetch(API_STATE_ENDPOINT, {
      method: 'GET',
      headers: { Accept: 'application/json' }
    });
    if (!response.ok) return;

    const remoteState = await response.json();
    state = normalizeState(remoteState);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.info('Servidor indisponível, usando dados locais.');
  }
}

function normalizeState(rawState = {}) {
  return {
    ...structuredClone(initialState),
    ...rawState,
    clients: Array.isArray(rawState.clients) ? rawState.clients : [],
    vehicles: Array.isArray(rawState.vehicles) ? rawState.vehicles : [],
    services: Array.isArray(rawState.services) ? rawState.services : [],
    schedules: Array.isArray(rawState.schedules) ? rawState.schedules : [],
    orders: Array.isArray(rawState.orders) ? rawState.orders : [],
    payments: Array.isArray(rawState.payments) ? rawState.payments : []
  };
}

function loadState() {
  try {
    const parsedState = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
    return normalizeState(parsedState);
  } catch (error) {
    console.error('Erro ao carregar dados', error);
    return structuredClone(initialState);
  }
}

function persistAndRender() {
  persistState();
  render();
}

function persistState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  void syncServerState();
}

async function syncServerState() {
  try {
    await fetch(API_STATE_ENDPOINT, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json'
      },
      body: JSON.stringify(state)
    });
  } catch (error) {
    console.info('Não foi possível sincronizar com o servidor.');
  }
}

function clearAllData() {
  if (!window.confirm('Deseja remover todos os dados cadastrados?')) return;
  state = structuredClone(initialState);
  localStorage.removeItem(STORAGE_KEY);
  persistAndRender();
}

function seedDemoData() {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  const threeDays = new Date(today);
  threeDays.setDate(today.getDate() + 3);

  const client1 = {
    id: crypto.randomUUID(),
    name: 'Carla Souza',
    phone: '(11) 99999-1111',
    email: 'carla@email.com',
    address: 'Rua Vergueiro, 1000, Vila Mariana, São Paulo - SP'
  };
  const client2 = {
    id: crypto.randomUUID(),
    name: 'Bruno Lima',
    phone: '(11) 98888-2222',
    email: 'bruno@email.com',
    address: 'Av. Paulista, 1578, Bela Vista, São Paulo - SP'
  };
  const vehicle1 = { id: crypto.randomUUID(), clientId: client1.id, model: 'Jeep Renegade', plate: 'ABC1D23', color: 'Branco' };
  const vehicle2 = { id: crypto.randomUUID(), clientId: client2.id, model: 'Honda Civic', plate: 'XYZ9K87', color: 'Preto' };
  const schedule1 = {
    id: crypto.randomUUID(),
    clientId: client1.id,
    vehicleId: vehicle1.id,
    serviceType: 'Higienização interna completa',
    date: tomorrow.toISOString().slice(0, 10),
    time: '09:00',
    price: 180,
    notes: 'Cliente solicitou atenção aos bancos.',
    status: 'agendado',
    createdAt: today.toISOString(),
    updatedAt: today.toISOString()
  };
  const schedule2 = {
    id: crypto.randomUUID(),
    clientId: client2.id,
    vehicleId: vehicle2.id,
    serviceType: 'Polimento técnico',
    date: threeDays.toISOString().slice(0, 10),
    time: '14:30',
    price: 250,
    notes: 'Remover marcas leves na lataria.',
    status: 'em andamento',
    createdAt: today.toISOString(),
    updatedAt: today.toISOString()
  };
  const order1 = {
    id: crypto.randomUUID(),
    scheduleId: schedule1.id,
    clientId: client1.id,
    vehicleId: vehicle1.id,
    description: 'Aspiração, limpeza de painéis e revitalização dos bancos.',
    technician: 'Equipe A',
    price: 180,
    status: 'concluído',
    createdAt: today.toISOString(),
    updatedAt: today.toISOString()
  };
  const payment1 = {
    id: crypto.randomUUID(),
    sourceType: 'order',
    sourceId: order1.id,
    method: 'pix',
    amount: 180,
    paidAt: today.toISOString(),
    status: 'pago',
    createdAt: today.toISOString(),
    updatedAt: today.toISOString()
  };
  const payment2 = {
    id: crypto.randomUUID(),
    sourceType: 'schedule',
    sourceId: schedule2.id,
    method: 'cartão',
    amount: 250,
    paidAt: threeDays.toISOString(),
    status: 'pendente',
    createdAt: today.toISOString(),
    updatedAt: today.toISOString()
  };

  state = {
    clients: [client1, client2],
    vehicles: [vehicle1, vehicle2],
    services: [
      { id: crypto.randomUUID(), name: 'Higienização interna completa', duration: 120, basePrice: 180 },
      { id: crypto.randomUUID(), name: 'Polimento técnico', duration: 150, basePrice: 250 }
    ],
    schedules: [schedule1, schedule2],
    orders: [order1],
    payments: [payment1, payment2]
  };
  schedule1.serviceId = state.services[0].id;
  schedule2.serviceId = state.services[1].id;
  persistAndRender();
}

function buildNotifications() {
  const now = new Date();
  const next24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  const reminders = state.schedules
    .filter((schedule) => {
      const scheduleDate = new Date(`${schedule.date}T${schedule.time}`);
      return schedule.status === 'agendado' && scheduleDate >= now && scheduleDate <= next24h;
    })
    .map((schedule) => {
      const client = getClient(schedule.clientId);
      return {
        title: `Lembrete para ${client?.name || 'cliente'}`,
        detail: `${schedule.serviceType} agendado para ${formatDateTime(schedule.date, schedule.time)}.`
      };
    });

  const statusAlerts = [...state.schedules, ...state.orders]
    .filter((item) => ['em andamento', 'cancelado', 'concluído'].includes(item.status))
    .sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt))
    .slice(0, 5)
    .map((item) => {
      const client = getClient(item.clientId);
      return {
        title: `Status atualizado: ${item.status}`,
        detail: `${client?.name || 'Cliente'} • ${item.serviceType || item.description}`
      };
    });

  const paymentAlerts = state.payments
    .filter((payment) => payment.status === 'pendente')
    .slice(0, 3)
    .map((payment) => {
      const source = resolvePaymentSource(payment);
      return {
        title: `Pagamento pendente: ${currency(payment.amount)}`,
        detail: getPaymentSourceSummary(payment, source)
      };
    });

  return [...reminders, ...statusAlerts, ...paymentAlerts].slice(0, 8);
}

function getTotalRevenue() {
  return [...state.schedules, ...state.orders]
    .filter((item) => item.status === 'concluído')
    .reduce((total, item) => total + Number(item.price || 0), 0);
}

function getTotalReceivedPayments() {
  return state.payments
    .filter((payment) => payment.status === 'pago')
    .reduce((total, payment) => total + Number(payment.amount || 0), 0);
}

function getPendingPayments() {
  return state.payments
    .filter((payment) => payment.status === 'pendente')
    .reduce((total, payment) => total + Number(payment.amount || 0), 0);
}

function countUpcomingSchedules() {
  const today = new Date();
  const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
  return state.schedules.filter((schedule) => {
    const date = new Date(`${schedule.date}T${schedule.time}`);
    return schedule.status === 'agendado' && date >= today && date <= nextWeek;
  }).length;
}

function getClient(id) {
  return state.clients.find((item) => item.id === id);
}

function getVehicle(id) {
  return state.vehicles.find((item) => item.id === id);
}

function filterVehicles(clientId) {
  return clientId ? state.vehicles.filter((vehicle) => vehicle.clientId === clientId) : [];
}

function getPaymentSourceList(sourceType) {
  return sourceType === 'order' ? state.orders : state.schedules;
}

function resolvePaymentSource(payment) {
  if (!payment?.sourceId || !payment?.sourceType) return null;
  return payment.sourceType === 'order'
    ? state.orders.find((item) => item.id === payment.sourceId)
    : state.schedules.find((item) => item.id === payment.sourceId);
}

function getPaymentSourceSummary(payment, source) {
  if (!source) return 'Referência removida';

  if (payment.sourceType === 'order') {
    const client = getClient(source.clientId);
    return `Ordem • ${client?.name || 'Cliente removido'} • ${source.description.slice(0, 40)}`;
  }

  const client = getClient(source.clientId);
  return `Agendamento • ${client?.name || 'Cliente removido'} • ${source.serviceType}`;
}

function upsertById(collection, item) {
  const exists = collection.some((entry) => entry.id === item.id);
  if (exists) {
    return collection.map((entry) => (entry.id === item.id ? { ...entry, ...item } : entry));
  }
  return [item, ...collection];
}

function sortByDate(items) {
  return [...items].sort((a, b) => {
    const valueA = new Date(`${a.date || a.createdAt}` + (a.time ? `T${a.time}` : ''));
    const valueB = new Date(`${b.date || b.createdAt}` + (b.time ? `T${b.time}` : ''));
    return valueA - valueB;
  });
}

function formatDate(dateString) {
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(dateString));
}

function formatDateTime(date, time) {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short'
  }).format(new Date(`${date}T${time}`));
}

function statusBadge(status) {
  const statusClassName = status.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '-').toLowerCase();
  return `<span class="badge ${statusClassName}">${status}</span>`;
}

function currency(value) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
}

function buildMapSearchUrl(address) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
}
