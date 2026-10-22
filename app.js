/**
 * Lenskart Executive Dashboard - Core Application Logic
 * Implements Phases 1, 2, 3, and 4
 */

// Storage Keys
const STORAGE_KEY = 'lenskart_executive_cx_data_v1';
const SETTINGS_KEY = 'lenskart_executive_cx_settings_v1';

// Default Settings
const defaultSettings = {
  storeName: 'Lenskart Store (Indiranagar)',
  executiveName: 'Aditya (Store CX)',
  defaultCountryCode: '91',
  templates: {
    urgent: "Hi {name}, this is {executive} from {store}. Regarding your urgent eyewear order #{orderId}: your glasses have been prioritized in our precision lab and are actively in expedited transit. We are monitoring your delivery closely. Please feel free to reply if you need any instant updates!",
    midway_single: "Hi {name}, greetings from {store}! \u{1F44B} It has been 7 days since your Single Vision eyewear order #{orderId}. We wanted to check in: how are your lenses and frame fitting? Is your vision crisp and comfortable? If you ever need free adjustments or fitting tune-ups, our optical experts are always here to help!",
    midway_prog: "Hi {name}, greetings from {store}! \u{1F44B} It has been 15 days since your Progressive eyewear order #{orderId}. We are following up to see how your eyes are adapting to the progressive corridors. Progressive lenses usually take a few days to get fully accustomed to. Are you feeling comfortable with reading, intermediate, and distance zones? Feel free to reach out if you need any assistance!",
    nps: "Hi {name}, hope you are enjoying your clear vision with your new Lenskart eyewear! \u{1F453}\u2728 You may receive an official feedback survey via SMS/WhatsApp regarding your store visit. We strive to provide a 10/10 experience! If you loved our service, we'd truly appreciate a top rating of 9 or 10. \u2B50 If there was anything less than perfect, please let us know directly right here so we can make it right immediately. Thank you!"
  }
};

// Global State
let customers = [];
let settings = { ...defaultSettings };
let activeTab = 'today'; // 'today', 'urgent', 'active', 'completed', 'archived'
let searchQuery = '';
let filterOrderType = 'all';
let filterStatus = 'all';
let sortBy = 'due_date_asc';
let editingCustomerId = null;

// Helper: Format Date to YYYY-MM-DD
function formatDateISO(date) {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Helper: Get Today's Date String in YYYY-MM-DD
function getTodayString() {
  return formatDateISO(new Date());
}

// Helper: Format Human Readable Date (e.g., Oct 24, 2026)
function formatDisplayDate(dateStr) {
  if (!dateStr) return 'N/A';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
  return d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' });
}

// Helper: Calculate Timeline based on Billing Date & Order Type (Phase 1)
function calculateTimeline(billingDateStr, orderType) {
  if (!billingDateStr) return { midwayDueDate: '', npsDueDate: '' };
  
  const parts = billingDateStr.split('-');
  const billingDate = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
  
  const isProgressive = orderType === 'progressive';
  const midwayDays = isProgressive ? 15 : 7;
  const npsDays = isProgressive ? 30 : 14;
  
  const midwayDate = new Date(billingDate);
  midwayDate.setDate(midwayDate.getDate() + midwayDays);
  
  const npsDate = new Date(billingDate);
  npsDate.setDate(npsDate.getDate() + npsDays);
  
  return {
    midwayDueDate: formatDateISO(midwayDate),
    npsDueDate: formatDateISO(npsDate)
  };
}

// Helper: Calculate Day Difference from Today
function getDaysDifference(targetDateStr) {
  if (!targetDateStr) return 0;
  const todayStr = getTodayString();
  const [tY, tM, tD] = todayStr.split('-').map(Number);
  const [targetY, targetM, targetD] = targetDateStr.split('-').map(Number);
  
  const today = new Date(tY, tM - 1, tD);
  const target = new Date(targetY, targetM - 1, targetD);
  
  const diffTime = target.getTime() - today.getTime();
  return Math.round(diffTime / (1000 * 60 * 60 * 24));
}

// Helper: Clean phone number for WhatsApp wa.me link
function cleanPhoneNumber(phone) {
  if (!phone) return '';
  let cleaned = phone.replace(/[^\d+]/g, '');
  if (cleaned.startsWith('+')) {
    cleaned = cleaned.substring(1);
  } else if (cleaned.length === 10) {
    cleaned = (settings.defaultCountryCode || '91') + cleaned;
  } else if (cleaned.length === 11 && cleaned.startsWith('0')) {
    cleaned = (settings.defaultCountryCode || '91') + cleaned.substring(1);
  }
  return cleaned;
}

// Load from LocalStorage
function loadData() {
  try {
    const rawData = localStorage.getItem(STORAGE_KEY);
    if (rawData) {
      customers = JSON.parse(rawData);
    } else {
      // First time launch: populate sample demo data so the dashboard is immediately vivid
      loadDemoData(false);
    }
    
    const rawSettings = localStorage.getItem(SETTINGS_KEY);
    if (rawSettings) {
      settings = { ...defaultSettings, ...JSON.parse(rawSettings) };
    }
  } catch (err) {
    console.error('Error loading LocalStorage:', err);
    customers = [];
  }
}

// Save to LocalStorage
function saveData() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(customers));
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    renderStats();
  } catch (err) {
    console.error('Error saving LocalStorage:', err);
    showToast('Failed to save data. Browser storage might be full.', 'error');
  }
}

// Seed Demo Customers
function loadDemoData(notify = true) {
  const today = new Date();
  
  const dMinus7 = new Date();
  dMinus7.setDate(today.getDate() - 7);
  
  const dMinus15 = new Date();
  dMinus15.setDate(today.getDate() - 15);
  
  const dMinus14 = new Date();
  dMinus14.setDate(today.getDate() - 14);
  
  const dMinus30 = new Date();
  dMinus30.setDate(today.getDate() - 30);
  
  const dMinus1 = new Date();
  dMinus1.setDate(today.getDate() - 1);
  
  const dMinus3 = new Date();
  dMinus3.setDate(today.getDate() - 3);

  customers = [
    {
      id: 'cust_101',
      orderId: 'LK-88421',
      name: 'Rahul Sharma',
      phone: '9876543210',
      orderType: 'single',
      billingDate: formatDateISO(dMinus7),
      isUrgent: false,
      notes: 'Matte Blue Vincent Chase; Blue Block 1.6 index',
      midwayDueDate: formatDateISO(today),
      midwayStatus: 'pending',
      midwayCompletedAt: null,
      npsDueDate: formatDateISO(new Date(today.getTime() + 7 * 86400000)),
      npsStatus: 'pending',
      npsCompletedAt: null,
      isArchived: false,
      createdAt: new Date().toISOString()
    },
    {
      id: 'cust_102',
      orderId: 'LK-88439',
      name: 'Priya Patel',
      phone: '9812345678',
      orderType: 'progressive',
      billingDate: formatDateISO(dMinus15),
      isUrgent: true,
      notes: 'Gold Rimless John Jacobs; Varilux Comfort Progressive',
      midwayDueDate: formatDateISO(today),
      midwayStatus: 'pending',
      midwayCompletedAt: null,
      npsDueDate: formatDateISO(new Date(today.getTime() + 15 * 86400000)),
      npsStatus: 'pending',
      npsCompletedAt: null,
      isArchived: false,
      createdAt: new Date().toISOString()
    },
    {
      id: 'cust_103',
      orderId: 'LK-88510',
      name: 'Amit Verma',
      phone: '9988776655',
      orderType: 'single',
      billingDate: formatDateISO(dMinus1),
      isUrgent: true,
      notes: 'Customer travelling abroad on Friday. Needs expedited delivery.',
      midwayDueDate: formatDateISO(new Date(today.getTime() + 6 * 86400000)),
      midwayStatus: 'pending',
      midwayCompletedAt: null,
      npsDueDate: formatDateISO(new Date(today.getTime() + 13 * 86400000)),
      npsStatus: 'pending',
      npsCompletedAt: null,
      isArchived: false,
      createdAt: new Date().toISOString()
    },
    {
      id: 'cust_104',
      orderId: 'LK-88200',
      name: 'Sneha Reddy',
      phone: '9740112233',
      orderType: 'progressive',
      billingDate: formatDateISO(dMinus30),
      isUrgent: false,
      notes: 'First-time progressive user. Adaptation confirmed at Day 15.',
      midwayDueDate: formatDateISO(dMinus15),
      midwayStatus: 'completed',
      midwayCompletedAt: formatDateISO(dMinus15),
      npsDueDate: formatDateISO(today),
      npsStatus: 'pending',
      npsCompletedAt: null,
      isArchived: false,
      createdAt: new Date().toISOString()
    },
    {
      id: 'cust_105',
      orderId: 'LK-88350',
      name: 'Vikramjit Singh',
      phone: '9123456780',
      orderType: 'single',
      billingDate: formatDateISO(dMinus14),
      isUrgent: false,
      notes: 'Clubmaster classic frame. Both check-in & NPS completed.',
      midwayDueDate: formatDateISO(dMinus7),
      midwayStatus: 'completed',
      midwayCompletedAt: formatDateISO(dMinus7),
      npsDueDate: formatDateISO(today),
      npsStatus: 'completed',
      npsCompletedAt: formatDateISO(today),
      isArchived: false,
      createdAt: new Date().toISOString()
    },
    {
      id: 'cust_106',
      orderId: 'LK-88544',
      name: 'Ananya Iyer',
      phone: '9845099887',
      orderType: 'single',
      billingDate: formatDateISO(dMinus3),
      isUrgent: false,
      notes: 'Computer glasses with anti-glare coating.',
      midwayDueDate: formatDateISO(new Date(today.getTime() + 4 * 86400000)),
      midwayStatus: 'pending',
      midwayCompletedAt: null,
      npsDueDate: formatDateISO(new Date(today.getTime() + 11 * 86400000)),
      npsStatus: 'pending',
      npsCompletedAt: null,
      isArchived: false,
      createdAt: new Date().toISOString()
    }
  ];

  saveData();
  renderApp();
  if (notify) {
    showToast('Loaded 6 realistic sample customer orders!', 'success');
  }
}

// Check if customer needs action today or is overdue
function isCustomerDueTodayOrOverdue(c) {
  if (c.isArchived) return false;
  
  const midwayDiff = getDaysDifference(c.midwayDueDate);
  const npsDiff = getDaysDifference(c.npsDueDate);
  
  // Mid-way is due today or overdue and not completed
  const midwayActionNeeded = (midwayDiff <= 0) && (c.midwayStatus !== 'completed');
  // NPS is due today or overdue and not completed
  const npsActionNeeded = (npsDiff <= 0) && (c.npsStatus !== 'completed');
  // Urgent order that hasn't completed midway yet
  const urgentPriority = c.isUrgent && (c.midwayStatus !== 'completed');
  
  return midwayActionNeeded || npsActionNeeded || urgentPriority;
}

// Calculate Metrics for KPI Cards
function calculateMetrics() {
  const activeRecords = customers.filter(c => !c.isArchived);
  const todayActions = activeRecords.filter(isCustomerDueTodayOrOverdue);
  const urgentRecords = activeRecords.filter(c => c.isUrgent);
  
  // NPS Due this week (between 0 and 7 days away, and pending)
  const npsThisWeek = activeRecords.filter(c => {
    if (c.npsStatus === 'completed') return false;
    const diff = getDaysDifference(c.npsDueDate);
    return diff >= 0 && diff <= 7;
  });

  const completedRecords = activeRecords.filter(c => c.npsStatus === 'completed');
  const archivedRecords = customers.filter(c => c.isArchived);

  return {
    totalActive: activeRecords.length,
    todayActionsCount: todayActions.length,
    urgentCount: urgentRecords.length,
    npsThisWeekCount: npsThisWeek.length,
    completedCount: completedRecords.length,
    archivedCount: archivedRecords.length
  };
}

// Render KPI Stat Cards & Badge Counts
function renderStats() {
  const metrics = calculateMetrics();
  
  document.getElementById('statActiveOrders').textContent = metrics.totalActive;
  document.getElementById('statTodayActions').textContent = metrics.todayActionsCount;
  document.getElementById('statUrgentOrders').textContent = metrics.urgentCount;
  document.getElementById('statNpsThisWeek').textContent = metrics.npsThisWeekCount;

  // Tab Badge Counters
  document.getElementById('badgeTabToday').textContent = metrics.todayActionsCount;
  document.getElementById('badgeTabUrgent').textContent = metrics.urgentCount;
  document.getElementById('badgeTabActive').textContent = metrics.totalActive;
  document.getElementById('badgeTabCompleted').textContent = metrics.completedCount;
  document.getElementById('badgeTabArchived').textContent = metrics.archivedCount;

  // Subtle alert badge on header
  const headerTodayAlert = document.getElementById('headerTodayAlert');
  if (metrics.todayActionsCount > 0) {
    headerTodayAlert.classList.remove('hidden');
    document.getElementById('headerTodayCount').textContent = metrics.todayActionsCount;
  } else {
    headerTodayAlert.classList.add('hidden');
  }
}

// Filter and Sort Customers
function getFilteredCustomers() {
  return customers.filter(c => {
    // Tab Filter
    if (activeTab === 'today') {
      if (!isCustomerDueTodayOrOverdue(c)) return false;
    } else if (activeTab === 'urgent') {
      if (c.isArchived || !c.isUrgent) return false;
    } else if (activeTab === 'active') {
      if (c.isArchived) return false;
    } else if (activeTab === 'completed') {
      if (c.isArchived || c.npsStatus !== 'completed') return false;
    } else if (activeTab === 'archived') {
      if (!c.isArchived) return false;
    }

    // Order Type Filter
    if (filterOrderType !== 'all' && c.orderType !== filterOrderType) {
      return false;
    }

    // Status Filter
    if (filterStatus === 'midway_pending' && c.midwayStatus === 'completed') return false;
    if (filterStatus === 'nps_pending' && c.npsStatus === 'completed') return false;
    if (filterStatus === 'urgent_only' && !c.isUrgent) return false;
    if (filterStatus === 'all_done' && (c.midwayStatus !== 'completed' || c.npsStatus !== 'completed')) return false;

    // Search Query (Name, Phone, Order ID, Notes)
    if (searchQuery) {
      const q = searchQuery.toLowerCase().trim();
      const matchName = (c.name || '').toLowerCase().includes(q);
      const matchPhone = (c.phone || '').toLowerCase().includes(q);
      const matchOrderId = (c.orderId || '').toLowerCase().includes(q);
      const matchNotes = (c.notes || '').toLowerCase().includes(q);
      if (!matchName && !matchPhone && !matchOrderId && !matchNotes) {
        return false;
      }
    }

    return true;
  }).sort((a, b) => {
    if (sortBy === 'due_date_asc') {
      const nextDueA = a.midwayStatus !== 'completed' ? a.midwayDueDate : a.npsDueDate;
      const nextDueB = b.midwayStatus !== 'completed' ? b.midwayDueDate : b.npsDueDate;
      return nextDueA.localeCompare(nextDueB);
    } else if (sortBy === 'due_date_desc') {
      const nextDueA = a.midwayStatus !== 'completed' ? a.midwayDueDate : a.npsDueDate;
      const nextDueB = b.midwayStatus !== 'completed' ? b.midwayDueDate : b.npsDueDate;
      return nextDueB.localeCompare(nextDueA);
    } else if (sortBy === 'billing_date_desc') {
      return b.billingDate.localeCompare(a.billingDate);
    } else if (sortBy === 'name_asc') {
      return a.name.localeCompare(b.name);
    }
    return 0;
  });
}

// Render Main Customer Cards List
function renderCustomerList() {
  const container = document.getElementById('customerListContainer');
  const emptyState = document.getElementById('emptyStateContainer');
  const listCount = document.getElementById('listResultsCount');
  
  const filtered = getFilteredCustomers();
  listCount.textContent = `${filtered.length} customer${filtered.length === 1 ? '' : 's'} found`;

  if (filtered.length === 0) {
    container.innerHTML = '';
    emptyState.classList.remove('hidden');
    return;
  }

  emptyState.classList.add('hidden');

  container.innerHTML = filtered.map(c => {
    const midwayDiff = getDaysDifference(c.midwayDueDate);
    const npsDiff = getDaysDifference(c.npsDueDate);

    // Midway Badge Status
    let midwayBadge = '';
    if (c.midwayStatus === 'completed') {
      midwayBadge = `<span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-100 text-emerald-800 border border-emerald-200">
        <svg class="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path></svg>
        Done (${formatDisplayDate(c.midwayCompletedAt || c.midwayDueDate)})
      </span>`;
    } else if (midwayDiff < 0) {
      midwayBadge = `<span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-300 animate-pulse-subtle">
        \u26A0\uFE0F Overdue (${Math.abs(midwayDiff)}d ago)
      </span>`;
    } else if (midwayDiff === 0) {
      midwayBadge = `<span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300 animate-pulse">
        \u{1F525} Due Today!
      </span>`;
    } else {
      midwayBadge = `<span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700">
        In ${midwayDiff} days (${formatDisplayDate(c.midwayDueDate)})
      </span>`;
    }

    // NPS Badge Status
    let npsBadge = '';
    if (c.npsStatus === 'completed') {
      npsBadge = `<span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-100 text-emerald-800 border border-emerald-200">
        <svg class="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path></svg>
        Sent (${formatDisplayDate(c.npsCompletedAt || c.npsDueDate)})
      </span>`;
    } else if (npsDiff < 0) {
      npsBadge = `<span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-300">
        \u26A0\uFE0F Overdue (${Math.abs(npsDiff)}d ago)
      </span>`;
    } else if (npsDiff === 0) {
      npsBadge = `<span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-cyan-100 text-cyan-800 border border-cyan-300 animate-pulse">
        \u2B50 Due Today!
      </span>`;
    } else {
      npsBadge = `<span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700">
        In ${npsDiff} days (${formatDisplayDate(c.npsDueDate)})
      </span>`;
    }

    // Highlight styles
    const isUrgent = c.isUrgent;
    const isDueToday = isCustomerDueTodayOrOverdue(c);
    const borderHighlight = isUrgent ? 'urgent-glow' : (isDueToday ? 'due-today-glow' : 'border-slate-200');

    return `
      <div class="customer-card bg-white rounded-xl border ${borderHighlight} p-5 transition shadow-sm hover:shadow-md relative" id="card-${c.id}">
        <!-- Top Row: Order ID, Type Badge, Urgent Tag, Date -->
        <div class="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100">
          <div class="flex items-center gap-2">
            <span class="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-800">
              ${c.orderId || 'NO-ID'}
            </span>
            <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
              c.orderType === 'progressive' ? 'bg-purple-100 text-purple-800 border border-purple-200' : 'bg-teal-100 text-teal-800 border border-teal-200'
            }">
              ${c.orderType === 'progressive' ? '\u{1F453} Progressive (15d / 30d)' : '\u{1F453} Single Vision (7d / 14d)'}
            </span>
            ${isUrgent ? `
              <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-700 border border-red-300 animate-pulse">
                \u26A1 URGENT DELIVERY
              </span>
            ` : ''}
          </div>
          <div class="flex items-center gap-2 text-xs text-slate-500">
            <span>Billed: <strong class="text-slate-700">${formatDisplayDate(c.billingDate)}</strong></span>
            <button onclick="copyCrmDetails('${c.id}')" title="Copy for Lenskart CRM" class="px-2 py-0.5 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 rounded transition flex items-center gap-1">
              \u{1F4CB} Copy CRM
            </button>
          </div>
        </div>

        <!-- Middle Row: Customer Info & Timeline -->
        <div class="grid grid-cols-1 md:grid-cols-12 gap-4 py-4">
          <!-- Customer Identity -->
          <div class="md:col-span-4">
            <h3 class="text-base font-bold text-slate-900 flex items-center gap-2">
              ${escapeHtml(c.name)}
            </h3>
            <div class="text-sm text-slate-600 mt-1 flex items-center gap-1 font-mono">
              \u{1F4DE} +${cleanPhoneNumber(c.phone)}
            </div>
            ${c.notes ? `
              <p class="text-xs text-slate-500 mt-2 bg-slate-50 p-2 rounded border border-slate-100 italic">
                "${escapeHtml(c.notes)}"
              </p>
            ` : ''}
          </div>

          <!-- Milestones & Progress Tracker -->
          <div class="md:col-span-8 flex flex-col justify-center">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-3 rounded-lg border border-slate-100">
              <!-- Milestone 1: Midway Check-in -->
              <div class="flex flex-col">
                <div class="flex items-center justify-between text-xs font-semibold text-slate-600 mb-1">
                  <span>1. Mid-Way Check-in (${c.orderType === 'progressive' ? 'Day 15' : 'Day 7'})</span>
                  <input type="checkbox" ${c.midwayStatus === 'completed' ? 'checked' : ''} 
                    onchange="toggleMidwayStatus('${c.id}', this.checked)"
                    title="Mark Midway Check-in as Done"
                    class="w-4 h-4 text-teal-600 rounded border-gray-300 focus:ring-teal-500 cursor-pointer">
                </div>
                <div>${midwayBadge}</div>
                <div class="text-[11px] text-slate-400 mt-1">Due: ${formatDisplayDate(c.midwayDueDate)}</div>
              </div>

              <!-- Milestone 2: NPS Rating -->
              <div class="flex flex-col">
                <div class="flex items-center justify-between text-xs font-semibold text-slate-600 mb-1">
                  <span>2. NPS Survey Link (${c.orderType === 'progressive' ? 'Day 30' : 'Day 14'})</span>
                  <input type="checkbox" ${c.npsStatus === 'completed' ? 'checked' : ''} 
                    onchange="toggleNpsStatus('${c.id}', this.checked)"
                    title="Mark NPS Reminder as Sent"
                    class="w-4 h-4 text-teal-600 rounded border-gray-300 focus:ring-teal-500 cursor-pointer">
                </div>
                <div>${npsBadge}</div>
                <div class="text-[11px] text-slate-400 mt-1">Due: ${formatDisplayDate(c.npsDueDate)}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Bottom Action Bar: WhatsApp Action Triggers (Phase 3) & Management Controls -->
        <div class="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
          <!-- WhatsApp Quick Action Buttons -->
          <div class="flex flex-wrap items-center gap-1.5">
            ${isUrgent ? `
              <button onclick="openWhatsAppModal('${c.id}', 'urgent')" class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-red-600 hover:bg-red-700 text-white shadow-sm transition">
                <span>\u26A1 WhatsApp Status</span>
              </button>
            ` : ''}

            <button onclick="openWhatsAppModal('${c.id}', 'midway')" class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-teal-600 hover:bg-teal-700 text-white shadow-sm transition">
              <span>\u{1F4AC} Mid-Way Script</span>
            </button>

            <button onclick="openWhatsAppModal('${c.id}', 'nps')" class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-cyan-700 hover:bg-cyan-800 text-white shadow-sm transition">
              <span>\u2B50 NPS Reminder</span>
            </button>
          </div>

          <!-- Edit & Archive Controls -->
          <div class="flex items-center gap-2">
            <button onclick="editCustomer('${c.id}')" title="Edit Customer Details" class="text-xs text-slate-500 hover:text-slate-800 px-2 py-1 rounded hover:bg-slate-100 transition">
              \u270F\uFE0F Edit
            </button>

            ${c.isArchived ? `
              <button onclick="unarchiveCustomer('${c.id}')" title="Restore to Active" class="text-xs text-emerald-600 hover:text-emerald-800 px-2 py-1 rounded hover:bg-emerald-50 transition">
                \u{1F4C2} Restore
              </button>
              <button onclick="deleteCustomer('${c.id}')" title="Permanently Delete" class="text-xs text-red-500 hover:text-red-700 px-2 py-1 rounded hover:bg-red-50 transition">
                \u{1F5D1}\uFE0F Delete
              </button>
            ` : `
              <button onclick="archiveCustomer('${c.id}')" title="Archive completed order" class="text-xs text-slate-500 hover:text-amber-700 px-2 py-1 rounded hover:bg-amber-50 transition">
                \u{1F5C4}\uFE0F Archive
              </button>
            `}
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// Copy CRM Details in 1 click
function copyCrmDetails(id) {
  const c = customers.find(x => x.id === id);
  if (!c) return;
  const text = `Order: ${c.orderId} | Name: ${c.name} | Phone: ${c.phone} | Type: ${c.orderType} | Billed: ${c.billingDate}`;
  navigator.clipboard.writeText(text).then(() => {
    showToast(`Copied to clipboard: "${c.orderId} - ${c.name}"`, 'success');
  }).catch(() => {
    showToast('Failed to copy. Please check clipboard permissions.', 'error');
  });
}

// Toggle Midway Check-in Status
function toggleMidwayStatus(id, isCompleted) {
  const customer = customers.find(c => c.id === id);
  if (!customer) return;
  customer.midwayStatus = isCompleted ? 'completed' : 'pending';
  customer.midwayCompletedAt = isCompleted ? getTodayString() : null;
  saveData();
  renderApp();
  showToast(`${customer.name}: Mid-Way marked as ${isCompleted ? 'Done \u2705' : 'Pending'}`, 'info');
}

// Toggle NPS Status
function toggleNpsStatus(id, isCompleted) {
  const customer = customers.find(c => c.id === id);
  if (!customer) return;
  customer.npsStatus = isCompleted ? 'completed' : 'pending';
  customer.npsCompletedAt = isCompleted ? getTodayString() : null;
  saveData();
  renderApp();
  showToast(`${customer.name}: NPS marked as ${isCompleted ? 'Sent \u2B50' : 'Pending'}`, 'info');
}

// Archive Customer
function archiveCustomer(id) {
  const customer = customers.find(c => c.id === id);
  if (!customer) return;
  customer.isArchived = true;
  saveData();
  renderApp();
  showToast(`Archived order for ${customer.name}`, 'info');
}

// Restore Customer
function unarchiveCustomer(id) {
  const customer = customers.find(c => c.id === id);
  if (!customer) return;
  customer.isArchived = false;
  saveData();
  renderApp();
  showToast(`Restored ${customer.name} to Active queue`, 'success');
}

// Delete Customer
function deleteCustomer(id) {
  const customer = customers.find(c => c.id === id);
  if (!customer) return;
  if (confirm(`Are you sure you want to permanently delete order ${customer.orderId} (${customer.name})? This cannot be undone.`)) {
    customers = customers.filter(c => c.id !== id);
    saveData();
    renderApp();
    showToast(`Deleted ${customer.name}`, 'info');
  }
}

// Bulk Archive Completed
function bulkArchiveCompleted() {
  const completed = customers.filter(c => !c.isArchived && c.npsStatus === 'completed');
  if (completed.length === 0) {
    showToast('No completed orders ready to archive.', 'info');
    return;
  }
  if (confirm(`Archive all ${completed.length} completed orders where NPS has been sent?`)) {
    completed.forEach(c => c.isArchived = true);
    saveData();
    renderApp();
    showToast(`Archived ${completed.length} completed orders`, 'success');
  }
}

// Toggle Mobile Intake Form
function toggleMobileForm() {
  const form = document.getElementById('customerForm');
  const btn = document.getElementById('mobileToggleFormBtn');
  if (!form || !btn) return;
  const isHidden = form.classList.contains('hidden');
  if (isHidden) {
    form.classList.remove('hidden');
    btn.textContent = '\u2716 Close Form';
    btn.className = 'lg:hidden text-xs bg-rose-50 text-rose-800 font-bold px-3 py-1.5 rounded-lg border border-rose-200 transition';
  } else {
    form.classList.add('hidden');
    btn.textContent = '\u2795 Add Customer';
    btn.className = 'lg:hidden text-xs bg-teal-50 text-teal-800 font-bold px-3 py-1.5 rounded-lg border border-teal-200 transition';
  }
}

// Pre-fill Intake Form with Customer for Editing
function editCustomer(id) {
  const c = customers.find(x => x.id === id);
  if (!c) return;

  // If on mobile, expand form if collapsed
  const form = document.getElementById('customerForm');
  const toggleBtn = document.getElementById('mobileToggleFormBtn');
  if (form && form.classList.contains('hidden')) {
    form.classList.remove('hidden');
    if (toggleBtn) {
      toggleBtn.textContent = '\u2716 Close Form';
      toggleBtn.className = 'lg:hidden text-xs bg-rose-50 text-rose-800 font-bold px-3 py-1.5 rounded-lg border border-rose-200 transition';
    }
  }

  editingCustomerId = id;
  document.getElementById('formTitle').textContent = `Edit Order: ${c.orderId || c.name}`;
  document.getElementById('submitBtnText').textContent = 'Update Customer';
  document.getElementById('cancelEditBtn').classList.remove('hidden');

  document.getElementById('custName').value = c.name || '';
  document.getElementById('custPhone').value = c.phone || '';
  document.getElementById('custOrderId').value = c.orderId || '';
  document.getElementById('custOrderType').value = c.orderType || 'single';
  document.getElementById('custBillingDate').value = c.billingDate || getTodayString();
  document.getElementById('custUrgent').checked = !!c.isUrgent;
  document.getElementById('custNotes').value = c.notes || '';

  // Scroll smoothly to form
  document.getElementById('customerFormCard').scrollIntoView({ behavior: 'smooth' });
}

// Cancel Form Edit Mode
function cancelEdit() {
  editingCustomerId = null;
  document.getElementById('customerForm').reset();
  document.getElementById('formTitle').textContent = 'New Customer Intake';
  document.getElementById('submitBtnText').textContent = 'Add to Tracking Queue';
  document.getElementById('cancelEditBtn').classList.add('hidden');
  document.getElementById('custBillingDate').value = getTodayString();
  updateTimelinePreview();
}

// Live update timeline preview in Intake form
function updateTimelinePreview() {
  const billingDate = document.getElementById('custBillingDate').value || getTodayString();
  const orderType = document.getElementById('custOrderType').value;
  const { midwayDueDate, npsDueDate } = calculateTimeline(billingDate, orderType);

  const midwayPreview = document.getElementById('previewMidwayDate');
  const npsPreview = document.getElementById('previewNpsDate');

  if (midwayPreview && npsPreview) {
    midwayPreview.textContent = formatDisplayDate(midwayDueDate);
    npsPreview.textContent = formatDisplayDate(npsDueDate);
  }
}

// Handle Customer Form Submit (Phase 1)
function handleFormSubmit(e) {
  e.preventDefault();

  const name = document.getElementById('custName').value.trim();
  const phone = document.getElementById('custPhone').value.trim();
  const orderId = document.getElementById('custOrderId').value.trim() || `LK-${Math.floor(10000 + Math.random() * 90000)}`;
  const orderType = document.getElementById('custOrderType').value;
  const billingDate = document.getElementById('custBillingDate').value || getTodayString();
  const isUrgent = document.getElementById('custUrgent').checked;
  const notes = document.getElementById('custNotes').value.trim();

  if (!name || !phone) {
    showToast('Please enter both customer name and phone number.', 'error');
    return;
  }

  const { midwayDueDate, npsDueDate } = calculateTimeline(billingDate, orderType);

  if (editingCustomerId) {
    const index = customers.findIndex(c => c.id === editingCustomerId);
    if (index !== -1) {
      customers[index] = {
        ...customers[index],
        name,
        phone,
        orderId,
        orderType,
        billingDate,
        isUrgent,
        notes,
        midwayDueDate,
        npsDueDate
      };
      showToast(`Updated customer: ${name}`, 'success');
    }
    cancelEdit();
  } else {
    const duplicate = customers.find(c => !c.isArchived && (c.phone === phone || c.orderId === orderId));
    if (duplicate) {
      if (!confirm(`An active order (${duplicate.orderId} - ${duplicate.name}) already exists with phone ${phone}. Add this new order anyway?`)) {
        return;
      }
    }

    const newCustomer = {
      id: 'cust_' + Date.now(),
      orderId,
      name,
      phone,
      orderType,
      billingDate,
      isUrgent,
      notes,
      midwayDueDate,
      midwayStatus: 'pending',
      midwayCompletedAt: null,
      npsDueDate,
      npsStatus: 'pending',
      npsCompletedAt: null,
      isArchived: false,
      createdAt: new Date().toISOString()
    };

    customers.unshift(newCustomer);
    showToast(`Added ${name} to tracking queue!`, 'success');
    document.getElementById('customerForm').reset();
    document.getElementById('custBillingDate').value = getTodayString();
    updateTimelinePreview();
  }

  saveData();
  renderApp();
}

// WhatsApp Integration (Phase 3)
let currentWhatsAppContext = null;

function generateWhatsAppMessage(customer, type) {
  let template = '';
  if (type === 'urgent') {
    template = settings.templates.urgent;
  } else if (type === 'midway') {
    template = customer.orderType === 'progressive' ? settings.templates.midway_prog : settings.templates.midway_single;
  } else if (type === 'nps') {
    template = settings.templates.nps;
  }

  return template
    .replace(/{name}/g, customer.name || 'Valued Customer')
    .replace(/{orderId}/g, customer.orderId || '')
    .replace(/{store}/g, settings.storeName || 'Lenskart')
    .replace(/{executive}/g, settings.executiveName || 'Our Team')
    .replace(/{orderType}/g, customer.orderType === 'progressive' ? 'Progressive' : 'Single Vision');
}

function openWhatsAppModal(id, type) {
  const customer = customers.find(c => c.id === id);
  if (!customer) return;

  const message = generateWhatsAppMessage(customer, type);
  const cleanPhone = cleanPhoneNumber(customer.phone);

  currentWhatsAppContext = {
    customer,
    type,
    cleanPhone
  };

  const titleMap = {
    urgent: '\u26A1 Urgent Order Delivery Status WhatsApp',
    midway: '\u{1F4AC} Mid-Way Comfort Check-in WhatsApp',
    nps: '\u2B50 5-Star / 10-Score NPS Reminder WhatsApp'
  };

  document.getElementById('waModalTitle').textContent = titleMap[type] || 'Send WhatsApp Message';
  document.getElementById('waCustomerName').textContent = `${customer.name} (${customer.orderId})`;
  document.getElementById('waRecipientPhone').textContent = `+${cleanPhone}`;
  document.getElementById('waMessageText').value = message;
  document.getElementById('waAutoMarkCheck').checked = true;

  document.getElementById('whatsappModal').classList.remove('hidden');
}

function closeWhatsAppModal() {
  document.getElementById('whatsappModal').classList.add('hidden');
  currentWhatsAppContext = null;
}

function sendWhatsAppNow() {
  if (!currentWhatsAppContext) return;

  const { customer, type, cleanPhone } = currentWhatsAppContext;
  const message = document.getElementById('waMessageText').value.trim();
  const autoMark = document.getElementById('waAutoMarkCheck').checked;

  if (autoMark) {
    if (type === 'midway') {
      customer.midwayStatus = 'completed';
      customer.midwayCompletedAt = getTodayString();
    } else if (type === 'nps') {
      customer.npsStatus = 'completed';
      customer.npsCompletedAt = getTodayString();
    }
    saveData();
    renderApp();
  }

  const encodedMessage = encodeURIComponent(message);
  const waUrl = `https://wa.me/${cleanPhone}?text=${encodedMessage}`;

  window.open(waUrl, '_blank');
  closeWhatsAppModal();
  showToast(`Launched WhatsApp for ${customer.name}!`, 'success');
}

function copyWhatsAppText() {
  const text = document.getElementById('waMessageText').value;
  navigator.clipboard.writeText(text).then(() => {
    showToast('Message copied to clipboard!', 'success');
  });
}

// Data Management & Backup Controls (Phase 4)
function exportToCsv() {
  if (customers.length === 0) {
    showToast('No customer data to export.', 'info');
    return;
  }

  const headers = [
    'Order ID',
    'Customer Name',
    'Phone',
    'Order Type',
    'Billing Date',
    'Urgent Flag',
    'Mid-Way Due Date',
    'Mid-Way Status',
    'Mid-Way Completed Date',
    'NPS Due Date',
    'NPS Status',
    'NPS Completed Date',
    'Archived',
    'Notes',
    'Record Created At'
  ];

  const rows = customers.map(c => [
    `"${(c.orderId || '').replace(/"/g, '""')}"`,
    `"${(c.name || '').replace(/"/g, '""')}"`,
    `"${(c.phone || '').replace(/"/g, '""')}"`,
    `"${c.orderType}"`,
    `"${c.billingDate}"`,
    `"${c.isUrgent ? 'YES' : 'NO'}"`,
    `"${c.midwayDueDate}"`,
    `"${c.midwayStatus}"`,
    `"${c.midwayCompletedAt || ''}"`,
    `"${c.npsDueDate}"`,
    `"${c.npsStatus}"`,
    `"${c.npsCompletedAt || ''}"`,
    `"${c.isArchived ? 'YES' : 'NO'}"`,
    `"${(c.notes || '').replace(/"/g, '""')}"`,
    `"${c.createdAt || ''}"`
  ]);

  const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `lenskart_cx_export_${getTodayString()}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  showToast('Exported CSV successfully!', 'success');
}

// JSON Backup Download
function exportToJsonBackup() {
  const exportPayload = {
    exportedAt: new Date().toISOString(),
    settings,
    customers
  };
  const blob = new Blob([JSON.stringify(exportPayload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `lenskart_cx_full_backup_${getTodayString()}.json`;
  a.click();
  URL.revokeObjectURL(a);
  showToast('Downloaded full JSON backup!', 'success');
}

// JSON / CSV Import Handler
function handleBackupImport(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const content = e.target.result;
      if (file.name.endsWith('.json')) {
        const parsed = JSON.parse(content);
        if (Array.isArray(parsed.customers)) {
          if (confirm(`Import ${parsed.customers.length} customer records from backup? This will merge with existing records.`)) {
            const existingIds = new Set(customers.map(c => c.id));
            let addedCount = 0;
            parsed.customers.forEach(item => {
              if (!existingIds.has(item.id)) {
                customers.push(item);
                addedCount++;
              }
            });
            if (parsed.settings) {
              settings = { ...settings, ...parsed.settings };
            }
            saveData();
            renderApp();
            showToast(`Merged ${addedCount} records from backup!`, 'success');
          }
        } else {
          showToast('Invalid backup JSON structure.', 'error');
        }
      } else {
        showToast('Please upload a valid .json backup file.', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Error reading import file.', 'error');
    }
  };
  reader.readAsText(file);
  event.target.value = '';
}

// Settings Modal Controls
function openSettingsModal() {
  document.getElementById('settingStoreName').value = settings.storeName || '';
  document.getElementById('settingExecutiveName').value = settings.executiveName || '';
  document.getElementById('settingCountryCode').value = settings.defaultCountryCode || '91';
  document.getElementById('templateUrgent').value = settings.templates.urgent;
  document.getElementById('templateMidwaySingle').value = settings.templates.midway_single;
  document.getElementById('templateMidwayProg').value = settings.templates.midway_prog;
  document.getElementById('templateNps').value = settings.templates.nps;
  document.getElementById('settingsModal').classList.remove('hidden');
}

function closeSettingsModal() {
  document.getElementById('settingsModal').classList.add('hidden');
}

function saveSettingsModal() {
  settings.storeName = document.getElementById('settingStoreName').value.trim() || defaultSettings.storeName;
  settings.executiveName = document.getElementById('settingExecutiveName').value.trim() || defaultSettings.executiveName;
  settings.defaultCountryCode = document.getElementById('settingCountryCode').value.trim() || '91';
  settings.templates.urgent = document.getElementById('templateUrgent').value;
  settings.templates.midway_single = document.getElementById('templateMidwaySingle').value;
  settings.templates.midway_prog = document.getElementById('templateMidwayProg').value;
  settings.templates.nps = document.getElementById('templateNps').value;

  saveData();
  closeSettingsModal();
  showToast('Settings & Templates saved successfully!', 'success');
}

// Toast Notifications
let toastTimeout = null;
function showToast(message, type = 'info') {
  const toast = document.getElementById('toast');
  const toastMsg = document.getElementById('toastMessage');
  const toastIcon = document.getElementById('toastIcon');

  if (toastTimeout) clearTimeout(toastTimeout);

  toastMsg.textContent = message;

  if (type === 'success') {
    toast.className = 'fixed bottom-5 right-5 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-xl text-white bg-emerald-600 transition duration-300 transform translate-y-0';
    toastIcon.innerHTML = '\u2713';
  } else if (type === 'error') {
    toast.className = 'fixed bottom-5 right-5 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-xl text-white bg-rose-600 transition duration-300 transform translate-y-0';
    toastIcon.innerHTML = '\u2715';
  } else {
    toast.className = 'fixed bottom-5 right-5 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-xl text-white bg-slate-800 transition duration-300 transform translate-y-0';
    toastIcon.innerHTML = '\u2139';
  }

  toast.classList.remove('hidden');

  toastTimeout = setTimeout(() => {
    toast.classList.add('hidden');
  }, 3500);
}

// Utility: Escape HTML
function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/[&<>"']/g, function(m) {
    return {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    }[m];
  });
}

// Render entire app UI
function renderApp() {
  renderStats();
  renderCustomerList();
}

// Tab Switching
function switchTab(tab) {
  activeTab = tab;
  document.querySelectorAll('.tab-btn').forEach(btn => {
    if (btn.dataset.tab === tab) {
      btn.classList.add('border-teal-600', 'text-teal-700', 'font-bold');
      btn.classList.remove('border-transparent', 'text-slate-500');
    } else {
      btn.classList.remove('border-teal-600', 'text-teal-700', 'font-bold');
      btn.classList.add('border-transparent', 'text-slate-500');
    }
  });
  renderCustomerList();
}

// Initialize on DOM Ready
document.addEventListener('DOMContentLoaded', () => {
  const billingInput = document.getElementById('custBillingDate');
  if (billingInput) {
    billingInput.value = getTodayString();
  }

  const clockEl = document.getElementById('liveClock');
  if (clockEl) {
    const updateClock = () => {
      const now = new Date();
      clockEl.textContent = now.toLocaleDateString('en-IN', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    };
    updateClock();
    setInterval(updateClock, 30000);
  }

  // Event Listeners for Intake Form
  document.getElementById('customerForm').addEventListener('submit', handleFormSubmit);
  document.getElementById('custBillingDate').addEventListener('change', updateTimelinePreview);
  document.getElementById('custOrderType').addEventListener('change', updateTimelinePreview);
  document.getElementById('cancelEditBtn').addEventListener('click', cancelEdit);

  // Tab Listeners
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
  });

  // Search & Filter Listeners
  document.getElementById('searchInput').addEventListener('input', (e) => {
    searchQuery = e.target.value;
    renderCustomerList();
  });

  document.getElementById('filterOrderTypeSelect').addEventListener('change', (e) => {
    filterOrderType = e.target.value;
    renderCustomerList();
  });

  document.getElementById('filterStatusSelect').addEventListener('change', (e) => {
    filterStatus = e.target.value;
    renderCustomerList();
  });

  document.getElementById('sortSelect').addEventListener('change', (e) => {
    sortBy = e.target.value;
    renderCustomerList();
  });

  // Load Initial Data
  loadData();
  updateTimelinePreview();
  renderApp();
});
