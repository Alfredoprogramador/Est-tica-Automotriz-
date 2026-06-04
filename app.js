const STORAGE_KEY = 'estetica-automotriz-data-v1';
const STATUS_OPTIONS = ['agendado', 'em andamento', 'concluído', 'cancelado'];

const initialState = {
  clients: [],
  vehicles: [],
  schedules: [],
  orders: []
};

let state = loadState();

const elements = {
  clientForm: document.querySelector('#client-form'),
  vehicleForm: document.querySelector('#vehicle-form'),
  scheduleForm: document.querySelector('#schedule-form'),
  orderForm: document.querySelector('#order-form'),
  clientsTable: document.querySelector('#clients-table'),
  vehiclesTable: document.querySelector('#vehicles-table'),
  schedulesTable: document.querySelector('#schedules-table'),
  ordersTable: document.querySelector('#orders-table'),
  notificationsList: document.querySelector('#notifications-list'),
  historyList: document.querySelector('#history-list'),
  dashboardCards: document.querySelector('#dashboard-cards'),
  reportsGrid: document.querySelector('#reports-grid'),
  seedDataButton: document.querySelector('#seed-data'),
  clearDataButton: document.querySelector('#clear-data'),
  vehicleClientSelect: document.querySelector('#vehicle-client'),
  scheduleClientSelect: document.querySelector('#schedule-client'),
  scheduleVehicleSelect: document.querySelector('#schedule-vehicle'),
  orderClientSelect: document.querySelector('#order-client'),
  orderVehicleSelect: document.querySelector('#order-vehicle'),
  orderScheduleSelect: document.querySelector('#order-schedule'),
  emptyTemplate: document.querySelector('#empty-state-template')
};

bootstrap();

function bootstrap() {
  attachEvents();
  render();
}

function attachEvents() {
  elements.clientForm.addEventListener('submit', handleClientSubmit);
  elements.vehicleForm.addEventListener('submit', handleVehicleSubmit);
  elements.scheduleForm.addEventListener('submit', handleScheduleSubmit);
  elements.orderForm.addEventListener('submit', handleOrderSubmit);

  [elements.clientForm, elements.vehicleForm, elements.scheduleForm, elements.orderForm].forEach((form) => {
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
  elements.orderClientSelect.addEventListener('change', syncDependentSelects);
  elements.orderScheduleSelect.addEventListener('change', syncOrderFromSchedule);
}

function handleClientSubmit(event) {
  event.preventDefault();
  const formData = new FormData(event.currentTarget);
  const payload = {
    id: formData.get('id') || crypto.randomUUID(),
    name: formData.get('name').trim(),
    phone: formData.get('phone').trim(),
    email: formData.get('email').trim()
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

function handleScheduleSubmit(event) {
  event.preventDefault();
  const formData = new FormData(event.currentTarget);
  const id = formData.get('id') || crypto.randomUUID();
  const existing = state.schedules.find((item) => item.id === id);
  const payload = {
    id,
    clientId: formData.get('clientId'),
    vehicleId: formData.get('vehicleId'),
    serviceType: formData.get('serviceType').trim(),
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

function render() {
  syncDependentSelects();
  renderDashboard();
  renderClients();
  renderVehicles();
  renderSchedules();
  renderOrders();
  renderNotifications();
  renderHistory();
  renderReports();
}

function renderDashboard() {
  const concludedCount = [...state.schedules, ...state.orders].filter((item) => item.status === 'concluído').length;
  const revenue = getTotalRevenue();
  const cards = [
    { label: 'Clientes cadastrados', value: state.clients.length },
    { label: 'Veículos cadastrados', value: state.vehicles.length },
    { label: 'Atendimentos concluídos', value: concludedCount },
    { label: 'Faturamento total', value: currency(revenue) }
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

  populateSelect(elements.orderVehicleSelect, filterVehicles(elements.orderClientSelect.value), 'Selecione o veículo', (item) => ({
    value: item.id,
    label: `${item.model} • ${item.plate}`
  }));

  populateSelect(elements.orderScheduleSelect, sortByDate(state.schedules), 'Ordem avulsa (sem agendamento)', (item) => ({
    value: item.id,
    label: `${item.serviceType} • ${formatDateTime(item.date, item.time)}`
  }));

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
      persistAndRender();
      break;
    case 'edit-vehicle':
      fillForm(elements.vehicleForm, state.vehicles.find((item) => item.id === id));
      break;
    case 'delete-vehicle':
      state.vehicles = state.vehicles.filter((item) => item.id !== id);
      state.schedules = state.schedules.filter((item) => item.vehicleId !== id);
      state.orders = state.orders.filter((item) => item.vehicleId !== id);
      persistAndRender();
      break;
    case 'edit-schedule':
      fillForm(elements.scheduleForm, state.schedules.find((item) => item.id === id));
      break;
    case 'delete-schedule':
      state.schedules = state.schedules.filter((item) => item.id !== id);
      state.orders = state.orders.filter((item) => item.scheduleId !== id);
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
      persistAndRender();
      break;
    case 'advance-order':
      updateStatus('orders', id);
      break;
    default:
      break;
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

function loadState() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || structuredClone(initialState);
  } catch (error) {
    console.error('Erro ao carregar dados', error);
    return structuredClone(initialState);
  }
}

function persistAndRender() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  render();
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

  const client1 = { id: crypto.randomUUID(), name: 'Carla Souza', phone: '(11) 99999-1111', email: 'carla@email.com' };
  const client2 = { id: crypto.randomUUID(), name: 'Bruno Lima', phone: '(11) 98888-2222', email: 'bruno@email.com' };
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

  state = {
    clients: [client1, client2],
    vehicles: [vehicle1, vehicle2],
    schedules: [schedule1, schedule2],
    orders: [order1]
  };
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

  return [...reminders, ...statusAlerts].slice(0, 8);
}

function getTotalRevenue() {
  return [...state.schedules, ...state.orders]
    .filter((item) => item.status === 'concluído')
    .reduce((total, item) => total + Number(item.price || 0), 0);
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
  const slug = status.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '-').toLowerCase();
  return `<span class="badge ${slug}">${status}</span>`;
}

function currency(value) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
}
