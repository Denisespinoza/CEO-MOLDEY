import {
  MoldeyTask,
  MoldeyLaunch,
  MoldeyCampaign,
  MoldeyCustomOrder,
  MoldeyFreeProduct,
  EMPTY_CHECKLIST,
} from './agendaMoldeyTypes';

const genId = () =>
  typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

const now = () => new Date().toISOString();

// ─── Tasks ───────────────────────────────────────────────────────────────────

const TASKS_KEY = 'moldey_tasks';

function readTasks(): MoldeyTask[] {
  try {
    return JSON.parse(localStorage.getItem(TASKS_KEY) || '[]');
  } catch {
    return [];
  }
}

function writeTasks(tasks: MoldeyTask[]) {
  localStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
}

export async function getTasks(): Promise<MoldeyTask[]> {
  return readTasks();
}

export async function createTask(
  task: Omit<MoldeyTask, 'id' | 'created_at' | 'updated_at'>
): Promise<MoldeyTask> {
  const tasks = readTasks();
  const newTask: MoldeyTask = {
    ...task,
    checklist: task.checklist ?? { ...EMPTY_CHECKLIST },
    id: genId(),
    created_at: now(),
    updated_at: now(),
  };
  tasks.push(newTask);
  writeTasks(tasks);
  return newTask;
}

export async function updateTask(
  id: string,
  updates: Partial<MoldeyTask>
): Promise<MoldeyTask> {
  const tasks = readTasks();
  const idx = tasks.findIndex((t) => t.id === id);
  if (idx === -1) throw new Error('Tarea no encontrada');
  tasks[idx] = { ...tasks[idx], ...updates, updated_at: now() };
  writeTasks(tasks);
  return tasks[idx];
}

export async function deleteTask(id: string): Promise<void> {
  writeTasks(readTasks().filter((t) => t.id !== id));
}

// ─── Launches ────────────────────────────────────────────────────────────────

const LAUNCHES_KEY = 'moldey_launches';

function readLaunches(): MoldeyLaunch[] {
  try {
    return JSON.parse(localStorage.getItem(LAUNCHES_KEY) || '[]');
  } catch {
    return [];
  }
}
function writeLaunches(items: MoldeyLaunch[]) {
  localStorage.setItem(LAUNCHES_KEY, JSON.stringify(items));
}

export async function getLaunches(): Promise<MoldeyLaunch[]> {
  return readLaunches();
}

export async function createLaunch(
  launch: Omit<MoldeyLaunch, 'id' | 'created_at'>
): Promise<MoldeyLaunch> {
  const items = readLaunches();
  const item: MoldeyLaunch = { ...launch, id: genId(), created_at: now() };
  items.push(item);
  writeLaunches(items);
  return item;
}

export async function updateLaunch(
  id: string,
  updates: Partial<MoldeyLaunch>
): Promise<MoldeyLaunch> {
  const items = readLaunches();
  const idx = items.findIndex((x) => x.id === id);
  if (idx === -1) throw new Error('Lanzamiento no encontrado');
  items[idx] = { ...items[idx], ...updates };
  writeLaunches(items);
  return items[idx];
}

export async function deleteLaunch(id: string): Promise<void> {
  writeLaunches(readLaunches().filter((x) => x.id !== id));
}

// ─── Campaigns ───────────────────────────────────────────────────────────────

const CAMPAIGNS_KEY = 'moldey_campaigns';

function readCampaigns(): MoldeyCampaign[] {
  try {
    return JSON.parse(localStorage.getItem(CAMPAIGNS_KEY) || '[]');
  } catch {
    return [];
  }
}
function writeCampaigns(items: MoldeyCampaign[]) {
  localStorage.setItem(CAMPAIGNS_KEY, JSON.stringify(items));
}

export async function getCampaigns(): Promise<MoldeyCampaign[]> {
  return readCampaigns();
}

export async function createCampaign(
  c: Omit<MoldeyCampaign, 'id' | 'created_at'>
): Promise<MoldeyCampaign> {
  const items = readCampaigns();
  const item: MoldeyCampaign = { ...c, id: genId(), created_at: now() };
  items.push(item);
  writeCampaigns(items);
  return item;
}

export async function updateCampaign(
  id: string,
  updates: Partial<MoldeyCampaign>
): Promise<MoldeyCampaign> {
  const items = readCampaigns();
  const idx = items.findIndex((x) => x.id === id);
  if (idx === -1) throw new Error('Campaña no encontrada');
  items[idx] = { ...items[idx], ...updates };
  writeCampaigns(items);
  return items[idx];
}

export async function deleteCampaign(id: string): Promise<void> {
  writeCampaigns(readCampaigns().filter((x) => x.id !== id));
}

// ─── Custom Orders ────────────────────────────────────────────────────────────

const CUSTOM_ORDERS_KEY = 'moldey_custom_orders';

function readCustomOrders(): MoldeyCustomOrder[] {
  try {
    return JSON.parse(localStorage.getItem(CUSTOM_ORDERS_KEY) || '[]');
  } catch {
    return [];
  }
}
function writeCustomOrders(items: MoldeyCustomOrder[]) {
  localStorage.setItem(CUSTOM_ORDERS_KEY, JSON.stringify(items));
}

export async function getCustomOrders(): Promise<MoldeyCustomOrder[]> {
  return readCustomOrders();
}

export async function createCustomOrder(
  o: Omit<MoldeyCustomOrder, 'id' | 'created_at'>
): Promise<MoldeyCustomOrder> {
  const items = readCustomOrders();
  const item: MoldeyCustomOrder = { ...o, id: genId(), created_at: now() };
  items.push(item);
  writeCustomOrders(items);
  return item;
}

export async function updateCustomOrder(
  id: string,
  updates: Partial<MoldeyCustomOrder>
): Promise<MoldeyCustomOrder> {
  const items = readCustomOrders();
  const idx = items.findIndex((x) => x.id === id);
  if (idx === -1) throw new Error('Pedido no encontrado');
  items[idx] = { ...items[idx], ...updates };
  writeCustomOrders(items);
  return items[idx];
}

export async function deleteCustomOrder(id: string): Promise<void> {
  writeCustomOrders(readCustomOrders().filter((x) => x.id !== id));
}

// ─── Free Products ────────────────────────────────────────────────────────────

const FREE_PRODUCTS_KEY = 'moldey_free_products';

function readFreeProducts(): MoldeyFreeProduct[] {
  try {
    return JSON.parse(localStorage.getItem(FREE_PRODUCTS_KEY) || '[]');
  } catch {
    return [];
  }
}
function writeFreeProducts(items: MoldeyFreeProduct[]) {
  localStorage.setItem(FREE_PRODUCTS_KEY, JSON.stringify(items));
}

export async function getFreeProducts(): Promise<MoldeyFreeProduct[]> {
  return readFreeProducts();
}

export async function createFreeProduct(
  p: Omit<MoldeyFreeProduct, 'id' | 'created_at'>
): Promise<MoldeyFreeProduct> {
  const items = readFreeProducts();
  const item: MoldeyFreeProduct = { ...p, id: genId(), created_at: now() };
  items.push(item);
  writeFreeProducts(items);
  return item;
}

export async function updateFreeProduct(
  id: string,
  updates: Partial<MoldeyFreeProduct>
): Promise<MoldeyFreeProduct> {
  const items = readFreeProducts();
  const idx = items.findIndex((x) => x.id === id);
  if (idx === -1) throw new Error('Producto no encontrado');
  items[idx] = { ...items[idx], ...updates };
  writeFreeProducts(items);
  return items[idx];
}

export async function deleteFreeProduct(id: string): Promise<void> {
  writeFreeProducts(readFreeProducts().filter((x) => x.id !== id));
}
