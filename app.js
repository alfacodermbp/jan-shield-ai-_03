const $ = (selector, root = document) => root.querySelector(selector);
const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]));
const state = { user: null, complaints: [] };
async function fileToBase64(file) { const bytes = new Uint8Array(await file.arrayBuffer()); let binary = ''; for (let offset = 0; offset < bytes.length; offset += 0x8000) binary += String.fromCharCode(...bytes.subarray(offset, offset + 0x8000)); return btoa(binary); }

const api = async (url, options = {}) => {
  const response = await fetch(url, { headers: { 'content-type': 'application/json', ...(options.headers || {}) }, ...options });
  const text = await response.text();
  let body;
  try { body = text ? JSON.parse(text) : {}; } catch { throw new Error('The server returned an invalid response.'); }
  if (!response.ok || !body.success) throw new Error(body.error?.message || 'Unable to complete request.');
  return body.data;
};

const toast = (message) => {
  const el = document.createElement('div');
  el.className = 'app-toast';
  el.textContent = message;
  document.body.append(el);
  window.setTimeout(() => el.remove(), 2800);
};

const style = () => {
  if ($('#app-style')) return;
  const s = document.createElement('style');
  s.id = 'app-style';
  s.textContent = `.app-backdrop{position:fixed;inset:0;z-index:100;background:rgba(11,18,32,.45);backdrop-filter:blur(5px);display:grid;place-items:center;padding:16px}.app-dialog{position:relative;width:min(680px,100%);max-height:90vh;overflow:auto;background:#fff;border:1px solid #c6c6cc;border-radius:12px;padding:28px;color:#191c1e;box-shadow:0 20px 60px #0b122033}.app-dialog h2{font:600 24px/32px Inter;margin:0 0 20px}.app-close{position:absolute;right:16px;top:12px;border:0;background:none;font-size:28px;color:#45474c;cursor:pointer}.app-form{display:grid;gap:14px}.app-form label{font:600 12px/16px Inter;letter-spacing:.05em;text-transform:uppercase}.app-form input,.app-form textarea,.app-form select{width:100%;margin-top:6px;padding:11px;border:1px solid #c6c6cc;border-radius:4px;font:14px Inter}.app-form textarea{min-height:100px;resize:vertical}.app-actions{display:flex;gap:10px;flex-wrap:wrap}.app-actions button,.app-form button,.app-item button{cursor:pointer;padding:10px 14px;border:1px solid #76777d;border-radius:4px;background:#fff;color:#191c1e;font:600 14px Inter}.app-actions .primary-action,.app-form .primary-action{background:#000;color:#fff;border-color:#000}.app-form button:disabled{opacity:.55;cursor:wait}.app-message{font:14px/20px Inter;color:#ba1a1a}.app-list{display:grid;gap:12px}.app-item{padding:16px;border:1px solid #c6c6cc;border-radius:8px;background:#fff}.app-item small{color:#76777d}.app-demo{font:12px Inter;color:#76777d;margin-top:10px}.app-toast{position:fixed;right:20px;bottom:20px;z-index:120;background:#151b2a;color:#fff;padding:12px 16px;border-radius:6px;font:14px Inter}.app-empty{padding:24px;border:1px dashed #c6c6cc;border-radius:8px;color:#45474c;font:14px/20px Inter}.app-status{font:600 12px Inter;letter-spacing:.04em;text-transform:uppercase;color:#0051d5}`;
  document.head.append(s);
};

const closeModal = () => $('#app-overlay')?.remove();
const modal = (title, body) => {
  closeModal();
  const el = document.createElement('div');
  el.id = 'app-overlay';
  el.innerHTML = `<div class="app-backdrop"><section class="app-dialog" role="dialog" aria-modal="true" aria-label="${esc(title)}"><button class="app-close" type="button" aria-label="Close">×</button><h2>${esc(title)}</h2>${body}</section></div>`;
  document.body.append(el);
  $('.app-close', el).onclick = closeModal;
  $('.app-backdrop', el).onclick = (event) => { if (event.target === $('.app-backdrop', el)) closeModal(); };
  return el;
};

const restricted = (roles) => Boolean(state.user && roles.includes(state.user.role));
const unavailable = (title, message) => modal(title, `<div class="app-empty">${esc(message)}</div>`);

function authDialog() {
  const el = modal('Welcome to JAN-SHIELD AI', `<p style="font:16px/24px Inter;color:#45474c;margin-bottom:18px">From Citizen Voice to Actionable Intelligence.</p><form class="app-form"><label>Email<input name="email" type="email" required value="citizen@jan-shield.local"></label><label>Password<input name="password" type="password" required value="Citizen123!"></label><div class="app-message" hidden></div><div class="app-actions"><button class="primary-action" type="submit">Sign In</button><button type="button" class="register-action">Create Citizen Account</button></div><div class="app-demo">Demo accounts: citizen@jan-shield.local / Citizen123! · authority@jan-shield.local / Authority123!</div></form>`);
  const form = $('form', el);
  form.onsubmit = async (event) => {
    event.preventDefault();
    const message = $('.app-message', form);
    const submit = $('button[type="submit"]', form);
    submit.disabled = true;
    try { state.user = await api('/api/auth/login', { method: 'POST', body: JSON.stringify(Object.fromEntries(new FormData(form))) }); closeModal(); await hydrate(); toast('Signed in successfully.'); }
    catch (error) { message.textContent = error.message; message.hidden = false; submit.disabled = false; }
  };
  $('.register-action', el).onclick = registerDialog;
}

function registerDialog() {
  const el = modal('Create your citizen account', `<form class="app-form"><label>Name<input name="name" required></label><label>Email<input name="email" type="email" required></label><label>Password<input name="password" type="password" minlength="8" required></label><label>Ward or location<input name="address"></label><div class="app-message" hidden></div><div class="app-actions"><button class="primary-action" type="submit">Register</button><button type="button" class="back-auth">Back to sign in</button></div></form>`);
  const form = $('form', el);
  form.onsubmit = async (event) => {
    event.preventDefault();
    const message = $('.app-message', form);
    const submit = $('button[type="submit"]', form);
    submit.disabled = true;
    try { state.user = await api('/api/auth/register', { method: 'POST', body: JSON.stringify(Object.fromEntries(new FormData(form))) }); closeModal(); await hydrate(); toast('Account created.'); }
    catch (error) { message.textContent = error.message; message.hidden = false; submit.disabled = false; }
  };
  $('.back-auth', el).onclick = authDialog;
}

function updateRoleVisibility() {
  const authority = restricted(['AUTHORITY', 'ADMIN']);
  const citizen = restricted(['CITIZEN']);
  document.querySelectorAll('a,button').forEach((element) => {
    const text = element.textContent.trim();
    const authorityOnly = ['Command Center', 'Real-time Map', 'Grievance Feed', 'AI Analytics', 'Public Trust', 'Audit Log', 'Emergency Alert', 'Incidents', 'Resources', 'Reports'].some((item) => text.includes(item));
    if (authorityOnly) element.hidden = !authority;
    if (text.includes('Citizen Portal') || text.includes('Report New Issue')) element.hidden = !citizen;
    if (text.includes('Switch to Citizen View')) element.hidden = true;
  });
  const heading = $('aside h2');
  if (heading) heading.textContent = citizen ? 'Citizen Portal' : 'Authority Command';
  const nav = $('aside nav');
  if (authority && nav) {
    if (!nav.querySelector('[data-nav="departments"]')) { const link = document.createElement('a'); link.dataset.nav = 'departments'; link.href = '#'; link.className = 'flex items-center gap-sm px-md py-sm rounded-xl font-title-md text-on-surface-variant hover:bg-surface-container-high'; link.innerHTML = '<span class="material-symbols-outlined">account_balance</span> Departments'; link.onclick = (event) => { event.preventDefault(); departmentsDialog(); }; nav.append(link); }
    if (!nav.querySelector('[data-nav="systemic"]')) { const link = document.createElement('a'); link.dataset.nav = 'systemic'; link.href = '#'; link.className = 'flex items-center gap-sm px-md py-sm rounded-xl font-title-md text-on-surface-variant hover:bg-surface-container-high'; link.innerHTML = '<span class="material-symbols-outlined">hub</span> Systemic Issues'; link.onclick = (event) => { event.preventDefault(); systemicDialog(); }; nav.append(link); }
  }
  if (!$('#mobile-menu')) { const menu = document.createElement('button'); menu.id = 'mobile-menu'; menu.type = 'button'; menu.textContent = 'Menu'; menu.className = 'md:hidden fixed left-4 top-4 z-[60] px-3 py-2 rounded-lg bg-primary text-on-primary'; menu.onclick = () => { const aside = $('aside'); if (aside) aside.style.display = aside.style.display === 'flex' ? '' : 'flex'; }; document.body.append(menu); }
}

async function hydrate() {
  updateRoleVisibility();
  const complaintCollection = await api('/api/complaints?page=1&pageSize=100&sortBy=updatedAt&sortDir=desc');
  state.complaints = Array.isArray(complaintCollection) ? complaintCollection : complaintCollection.items || [];
  const active = state.complaints.filter((complaint) => !['RESOLVED', 'REJECTED'].includes(complaint.status)).length;
  const resolved = state.complaints.filter((complaint) => complaint.status === 'RESOLVED').length;
  const awaiting = state.complaints.filter((complaint) => complaint.status === 'RESOLUTION_PENDING_VERIFICATION').length;
  const stats = [...document.querySelectorAll('.font-display-lg.text-display-lg')].filter((value) => value.classList.contains('mt-md') && value.closest('.bg-surface-container-lowest'));
  [active, resolved, awaiting].forEach((value, index) => { if (stats[index]) stats[index].textContent = value; });
  const cards = [...document.querySelectorAll('h3.font-title-lg')];
  const cardShells = cards.map((heading) => heading.closest('.bg-surface-container-lowest')).filter(Boolean);
  cardShells.forEach((card) => { card.hidden = false; card.removeAttribute('data-complaint-id'); });
  state.complaints.slice(0, 2).forEach((complaint, index) => {
    const heading = cards[index];
    const card = cardShells[index];
    if (!heading || !card) return;
    heading.textContent = complaint.title;
    card.dataset.complaintId = complaint.id;
    const badge = card.querySelector('.uppercase');
    if (badge) badge.textContent = `${complaint.priority} Priority`;
    const metadata = card.querySelector('.font-body-sm');
    if (metadata) metadata.textContent = `${complaint.category} · ${complaint.status}`;
    card.onclick = () => complaintDetail(complaint.id);
  });
  cardShells.slice(state.complaints.length, 2).forEach((card) => { card.hidden = true; });
  const container = cards[0]?.closest('.flex.flex-col.gap-md');
  if (container && !state.complaints.length && !$('.app-inline-empty', container)) { const empty = document.createElement('div'); empty.className = 'app-empty app-inline-empty'; empty.textContent = 'No complaints found yet.'; container.append(empty); }
  if (restricted(['AUTHORITY', 'ADMIN'])) { try { await renderCommandCenter(); } catch (error) { showCommandError(error); } } else $('#command-center-panels')?.remove();
  refreshNotificationBadge().catch(() => {});
}

async function refreshNotificationBadge() { const result=await api('/api/notifications'); document.querySelectorAll('button').forEach((button)=>{if(button.textContent.trim()==='notifications'){button.dataset.unread=String(result.unreadCount||0);button.setAttribute('aria-label',`Notifications${result.unreadCount?` (${result.unreadCount} unread)`:''}`);}}); }

function ensureCommandMetricCards() {
  const values = [...document.querySelectorAll('.font-display-lg.text-display-lg')].filter((value) => value.classList.contains('mt-md') && value.closest('.bg-surface-container-lowest')); const grid = values[0]?.closest('.grid') || values[0]?.parentElement?.parentElement; if (!grid) return [];
  const labels = ['Total Complaints', 'Active Complaints', 'Critical Complaints'];
  values.slice(0, 3).forEach((value, index) => { const card = value.closest('.bg-surface-container-lowest'); const label = card?.querySelector('.font-title-md'); if (label) label.textContent = labels[index]; if (card) card.dataset.commandMetric = ['total', 'active', 'critical'][index]; });
  if (!grid.querySelector('[data-command-metric="systemic"]')) grid.insertAdjacentHTML('beforeend', '<div class="bg-surface-container-lowest border border-outline-variant rounded-xl p-lg flex flex-col justify-between items-start shadow-sm hover:shadow-md transition-shadow cursor-pointer" data-command-metric="systemic"><div class="flex items-center gap-sm text-secondary"><span class="material-symbols-outlined">hub</span><span class="font-title-md text-title-md">Systemic Issues</span></div><div class="mt-md font-display-lg text-display-lg text-on-surface" data-command-value="systemic">—</div></div>');
  if (!grid.querySelector('[data-command-metric="average"]')) grid.insertAdjacentHTML('beforeend', '<div class="bg-surface-container-lowest border border-outline-variant rounded-xl p-lg flex flex-col justify-between items-start shadow-sm" data-command-metric="average"><div class="flex items-center gap-sm text-on-surface-variant"><span class="material-symbols-outlined">schedule</span><span class="font-title-md text-title-md">Avg Resolution Time</span></div><div class="mt-md font-display-lg text-display-lg text-on-surface" data-command-value="average">—</div></div>');
  return [...grid.querySelectorAll('[data-command-metric]')];
}

const panelList = (items, empty, render) => items?.length ? `<div class="app-list">${items.map(render).join('')}</div>` : `<div class="app-empty">${empty}</div>`;

async function renderCommandCenter() {
  const data = await api('/api/command-center');
  const metrics = ensureCommandMetricCards();
  const values = { total: data.metrics.totalComplaints, active: data.metrics.activeComplaints, critical: data.metrics.criticalComplaints, systemic: data.metrics.systemicIssues, average: data.metrics.averageResolutionHours === null ? 'No resolved data' : `${data.metrics.averageResolutionHours} hrs` };
  metrics.forEach((card) => { const value = card.querySelector('.font-display-lg'); if (value) value.textContent = values[card.dataset.commandMetric] ?? '—'; });
  metrics.forEach((card) => { card.onclick = card.dataset.commandMetric === 'systemic' ? systemicDialog : card.dataset.commandMetric === 'average' ? null : () => complaintQueue(card.dataset.commandMetric === 'critical' ? { priority: 'CRITICAL' } : card.dataset.commandMetric === 'active' ? { active: true } : {}); });
  const panels = $('#command-center-panels') || document.createElement('section'); panels.id = 'command-center-panels'; panels.className = 'space-y-md'; panels.innerHTML = `<div class="flex items-center justify-between border-b border-outline-variant pb-sm"><h2 class="font-headline-md text-headline-md text-on-surface">Command Center Intelligence</h2><button id="refresh-command-center" type="button">Refresh</button></div><div class="grid grid-cols-1 lg:grid-cols-2 gap-md"><div class="bg-surface-container-lowest border border-outline-variant rounded-xl p-lg"><div class="flex items-center justify-between"><h3 class="font-title-lg text-title-lg">Critical Alerts</h3><span class="app-status">${data.criticalAlerts.length} active</span></div>${panelList(data.criticalAlerts,'No active critical alerts.',(item)=>`<button class="app-item text-left" type="button" data-complaint-id="${esc(item.id)}"><b>${esc(item.id)}</b> · ${esc(item.priority)}<br>${esc(item.title)}<br><small>${esc(item.category)} · ${esc(item.ward || 'Location unavailable')} · ${esc(item.status)}</small></button>`)}</div><div class="bg-surface-container-lowest border border-outline-variant rounded-xl p-lg"><div class="flex items-center justify-between"><h3 class="font-title-lg text-title-lg">Systemic Issues</h3><button id="open-systemic-issues" type="button">View all</button></div>${panelList(data.systemicIssues,'No systemic issues detected from current complaint data.',(item)=>`<button class="app-item text-left" type="button" data-systemic-id="${esc(item.id)}"><b>${esc(item.name)}</b><br>${item.complaintCount} complaints · ${esc(item.priority)} · ${Math.round(item.confidence * 100)}% confidence</button>`)}</div><div class="bg-surface-container-lowest border border-outline-variant rounded-xl p-lg"><div class="flex items-center justify-between"><h3 class="font-title-lg text-title-lg">Grievance Map</h3><button id="open-command-map" type="button">Open map</button></div><div class="app-empty">Map markers are loaded from geolocated complaints.</div></div><div class="bg-surface-container-lowest border border-outline-variant rounded-xl p-lg"><h3 class="font-title-lg text-title-lg">Priority Queue</h3>${panelList(data.priorityQueue,'No active complaints in the priority queue.',(item)=>`<button class="app-item text-left" type="button" data-complaint-id="${esc(item.id)}"><b>${esc(item.priority)}</b> · ${esc(item.id)}<br>${esc(item.title)}<br><small>${esc(item.status)} · ${esc(item.category)}</small></button>`)}</div><div class="bg-surface-container-lowest border border-outline-variant rounded-xl p-lg"><h3 class="font-title-lg text-title-lg">Department Performance</h3>${panelList(data.departmentPerformance,'No department data available.',(item)=>`<div class="app-item"><b>${esc(item.name)}</b><br>${item.total} complaints · ${item.resolved} resolved${item.resolutionRate === null ? ' · No resolution data' : ` · ${item.resolutionRate}% resolution rate`}</div>`)}</div><div class="bg-surface-container-lowest border border-outline-variant rounded-xl p-lg"><h3 class="font-title-lg text-title-lg">Recent Activity</h3>${panelList(data.recentActivity,'No recent activity recorded.',(item)=>`<div class="app-item"><b>${esc(item.action)}</b><br>${esc(item.entityType)} ${esc(item.entityId)}<br><small>${esc(item.actor || 'System')} · ${esc(item.createdAt)}</small></div>`)}</div></div>`;
  const stats = document.querySelector('[data-command-metric="total"]')?.closest('.grid'); if (stats && !panels.parentElement) stats.parentElement.append(panels);
  $('#refresh-command-center').onclick = () => { renderCommandCenter().catch((error) => showCommandError(error)); };
  $('#open-command-map').onclick = mapDialog; $('#open-systemic-issues').onclick = systemicDialog;
  document.querySelectorAll('[data-complaint-id]', panels).forEach((item) => { item.onclick = () => complaintDetail(item.dataset.complaintId); });
  document.querySelectorAll('[data-systemic-id]', panels).forEach((item) => { item.onclick = () => systemicDetail(item.dataset.systemicId); });
}

function showCommandError(error) { let panels = $('#command-center-panels'); if (!panels) { panels = document.createElement('section'); panels.id = 'command-center-panels'; panels.className = 'space-y-md'; const stats = document.querySelector('[data-command-metric="total"]')?.closest('.grid') || document.querySelector('.grid.grid-cols-1'); stats?.parentElement.append(panels); } panels.innerHTML = `<div class="app-empty" role="alert">Unable to load Command Center data: ${esc(error.message)} <button id="retry-command-center" type="button">Retry</button></div>`; $('#retry-command-center')?.addEventListener('click', () => renderCommandCenter().catch(showCommandError)); }

const loadLeafletAssets = () => new Promise((resolve, reject) => {
  if (window.L) return resolve();
  if (!document.querySelector('link[data-leaflet]')) { const css = document.createElement('link'); css.rel = 'stylesheet'; css.dataset.leaflet = 'true'; css.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'; document.head.append(css); }
  const existing = document.querySelector('script[data-leaflet]');
  if (existing) { existing.addEventListener('load', resolve, { once: true }); existing.addEventListener('error', reject, { once: true }); return; }
  const script = document.createElement('script'); script.dataset.leaflet = 'true'; script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'; script.onload = resolve; script.onerror = reject; document.head.append(script);
});

async function setupLocationPicker(el, form) {
  const mapElement = $('#complaint-picker', el); const message = $('#location-message', el); const latInput = form.latitude; const lonInput = form.longitude; let map; let marker;
  const updateLocation = (lat, lon, label = 'Location selected') => { lat = Number(lat); lon = Number(lon); if (!Number.isFinite(lat) || !Number.isFinite(lon)) return; latInput.value = lat.toFixed(6); lonInput.value = lon.toFixed(6); message.textContent = `${label}: ${lat.toFixed(5)}, ${lon.toFixed(5)}`; if (!marker) { marker = L.marker([lat, lon], { draggable: true }).addTo(map); marker.on('dragend', () => { const point = marker.getLatLng(); updateLocation(point.lat, point.lng, 'Location moved'); }); } else marker.setLatLng([lat, lon]); map.setView([lat, lon], Math.max(map.getZoom(), 13)); };
  try {
    await loadLeafletAssets();
    map = L.map(mapElement).setView([28.6139, 77.2090], 11);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '© OpenStreetMap contributors' }).addTo(map);
    map.on('click', (event) => updateLocation(event.latlng.lat, event.latlng.lng, 'Location selected'));
    if (latInput.value && lonInput.value) updateLocation(latInput.value, lonInput.value);
    message.textContent = 'Click the map or search for a place to select a location.';
  } catch { mapElement.style.display = 'none'; message.textContent = 'Map tiles are unavailable. Enter latitude and longitude manually.'; }
  const searchForm = $('#location-search', el); const results = $('#location-results', el);
  $('button', searchForm).onclick = async () => { const query = $('input[name="query"]', searchForm).value.trim(); if (!query) return; const button = $('button', searchForm); button.disabled = true; results.textContent = 'Searching OpenStreetMap...'; try { const response = await fetch(`https://nominatim.openstreetmap.org/search?format=jsonv2&limit=5&q=${encodeURIComponent(query)}`, { headers: { 'accept-language': 'en' } }); if (!response.ok) throw new Error('Location search failed.'); const places = await response.json(); results.innerHTML = places.length ? places.map((place, index) => `<button type="button" data-place="${index}">${esc(place.display_name)}</button>`).join('') : 'No locations found.'; places.forEach((place, index) => { $(`[data-place="${index}"]`, results).onclick = () => { updateLocation(place.lat, place.lon, 'Location selected'); results.textContent = esc(place.display_name); }; }); } catch (error) { results.textContent = error.message; } finally { button.disabled = false; } };
  latInput.onchange = () => { if (lonInput.value && map) updateLocation(latInput.value, lonInput.value, 'Location selected'); };
  lonInput.onchange = () => { if (latInput.value && map) updateLocation(latInput.value, lonInput.value, 'Location selected'); };
}

async function complaintDialog() {
  if (!restricted(['CITIZEN'])) return unavailable('Citizen access required', 'Only citizen accounts can submit complaints.');
  const el = modal('Report a new issue', `<form class="app-form"><label>Title<input name="title" required placeholder="What needs attention?"></label><label>Description<textarea name="description" required placeholder="Describe the issue, duration, and impact."></textarea></label><label>Category<select name="category"><option value="">Auto-detect</option><option>Waste Management</option><option>Roads</option><option>Water Supply</option><option>Streetlights</option><option>Drainage</option></select></label><label>Ward<input name="ward" placeholder="Ward 17"></label><label>Location<input name="location" placeholder="Street or area name"></label><label>Landmark<input name="landmark" placeholder="Nearby landmark"></label><label>Optional contact information<input name="contact" placeholder="Phone or email"></label><div class="app-item"><b>Location picker</b><div id="location-search" class="app-actions"><input name="query" placeholder="Search OpenStreetMap"><button type="button">Search</button></div><div id="location-results" class="app-message" role="status"></div><div id="complaint-picker" style="height:280px;border-radius:8px;background:#eceef0;margin-top:10px"></div><p id="location-message" class="app-message" role="status">Loading map...</p><div class="app-actions"><label>Latitude<input name="latitude" type="number" step="any"></label><label>Longitude<input name="longitude" type="number" step="any"></label></div></div><label>Evidence<input name="evidence" type="file" accept=".jpg,.jpeg,.png,.webp,.pdf"></label><div id="evidence-status" class="app-message" role="status">No evidence selected.</div><div id="evidence-preview"></div><div class="app-message" role="alert" hidden></div><button class="primary-action" type="submit">Submit Complaint</button></form>`);
  const form = $('form', el); let stagedFile = null; let submitting = false; const fileInput = form.evidence; const evidenceStatus = $('#evidence-status', el); const preview = $('#evidence-preview', el); const message = $('.app-message[role="alert"]', form); const submit = $('button[type="submit"]', form);
  setupLocationPicker(el, form).catch((error) => { $('#location-message', el).textContent = error.message; });
  fileInput.onchange = () => { const file = fileInput.files[0]; stagedFile = null; preview.replaceChildren(); if (!file) { evidenceStatus.textContent = 'No evidence selected.'; return; } const allowed = new Set(['image/jpeg', 'image/png', 'image/webp', 'application/pdf']); const extension = `.${file.name.split('.').pop().toLowerCase()}`; if (!allowed.has(file.type) || !['.jpg', '.jpeg', '.png', '.webp', '.pdf'].includes(extension) || file.size > 10 * 1024 * 1024) { evidenceStatus.textContent = 'Invalid evidence. Use JPG, PNG, WEBP, or PDF under 10 MB.'; fileInput.value = ''; return; } stagedFile = file; evidenceStatus.textContent = `${file.name} ready to upload.`; if (file.type.startsWith('image/')) { const image = document.createElement('img'); image.src = URL.createObjectURL(file); image.alt = 'Evidence preview'; image.style = 'max-width:100%;max-height:160px;border-radius:6px'; preview.append(image); } else { preview.textContent = `${file.name} (preview unavailable)`; } const remove = document.createElement('button'); remove.type = 'button'; remove.textContent = 'Remove evidence'; remove.onclick = () => { stagedFile = null; fileInput.value = ''; preview.replaceChildren(); evidenceStatus.textContent = 'No evidence selected.'; }; preview.append(remove); };
  form.onsubmit = async (event) => { event.preventDefault(); if (submitting) return; submitting = true; const data = Object.fromEntries(new FormData(form)); delete data.evidence; const file = stagedFile; if (file) data.evidence = { name: file.name, type: file.type, size: file.size }; submit.disabled = true; submit.textContent = 'Submitting...'; message.hidden = true; try { const complaint = await api('/api/complaints', { method: 'POST', body: JSON.stringify(data) }); if (file) { evidenceStatus.textContent = 'Uploading evidence...'; const bytes = new Uint8Array(await file.arrayBuffer()); let binary = ''; for (let offset = 0; offset < bytes.length; offset += 0x8000) binary += String.fromCharCode(...bytes.subarray(offset, offset + 0x8000)); await api('/api/evidence', { method: 'POST', body: JSON.stringify({ complaintId: complaint.id, name: file.name, type: file.type, size: file.size, data: btoa(binary) }) }); evidenceStatus.textContent = 'Evidence uploaded.'; } closeModal(); await hydrate(); toast(`Complaint ${complaint.id} submitted successfully.`); complaintDetail(complaint.id); } catch (error) { message.textContent = error.message; message.hidden = false; submit.disabled = false; submit.textContent = 'Submit Complaint'; submitting = false; } };
}

function bindProfileClose(el) { $('.app-close', el).onclick = () => { closeModal(); if (location.hash === '#profile') history.replaceState(null, '', `${location.pathname}${location.search}`); }; }

function profileView(el, profile, notice = '') {
  const preferences = profile.notificationPreferences || {};
  $('.app-dialog', el).innerHTML = `<button class="app-close" type="button" aria-label="Close">×</button><h2>Profile & preferences</h2>${notice ? `<div class="app-item" role="status">${esc(notice)}</div>` : ''}<div class="app-list"><div class="app-item"><b>Name</b><br>${esc(profile.name || 'Not provided')}</div><div class="app-item"><b>Email</b><br>${esc(profile.email || 'Not provided')}</div><div class="app-item"><b>Phone</b><br>${esc(profile.phone || 'Not provided')}</div><div class="app-item"><b>Location</b><br>${esc(profile.address || 'Not provided')}</div><div class="app-item"><b>Language</b><br>${esc(profile.language || 'English')}</div><div class="app-item"><b>Notification preferences</b><br>Status updates: ${preferences.statusUpdates === false ? 'Off' : 'On'}<br>Critical alerts: ${preferences.criticalAlerts === false ? 'Off' : 'On'}<br>Resolution updates: ${preferences.resolutionUpdates === false ? 'Off' : 'On'}</div></div><div class="app-actions"><button class="primary-action edit-profile" type="button">Edit Profile</button><button class="logout-action" type="button">Sign Out</button></div>`;
  bindProfileClose(el);
  $('.edit-profile', el).onclick = () => profileEdit(el, profile);
  $('.logout-action', el).onclick = logout;
}

function profileEdit(el, profile) {
  const preferences = profile.notificationPreferences || {};
  $('.app-dialog', el).innerHTML = `<button class="app-close" type="button" aria-label="Close">×</button><h2>Edit profile</h2><form class="app-form"><label>Name<input name="name" value="${esc(profile.name)}" required></label><label>Email<input name="email" type="email" value="${esc(profile.email)}" required></label><label>Phone<input name="phone" value="${esc(profile.phone)}"></label><label>Location<input name="address" value="${esc(profile.address)}"></label><label>Language<select name="language"><option ${profile.language === 'English' ? 'selected' : ''}>English</option><option ${profile.language === 'Hindi' ? 'selected' : ''}>Hindi</option><option ${profile.language === 'Hinglish' ? 'selected' : ''}>Hinglish</option></select></label><div class="app-item"><b>Notification preferences</b><label><input type="checkbox" name="statusUpdates" ${preferences.statusUpdates === false ? '' : 'checked'}> Status updates</label><label><input type="checkbox" name="criticalAlerts" ${preferences.criticalAlerts === false ? '' : 'checked'}> Critical alerts</label><label><input type="checkbox" name="resolutionUpdates" ${preferences.resolutionUpdates === false ? '' : 'checked'}> Resolution updates</label></div><div class="app-message" hidden></div><div class="app-actions"><button class="primary-action" type="submit">Save Changes</button><button class="cancel-profile" type="button">Cancel</button></div></form>`;
  bindProfileClose(el);
  const form = $('form', el);
  form.onsubmit = async (event) => {
    event.preventDefault();
    const message = $('.app-message', form); const submit = $('button[type="submit"]', form); const values = Object.fromEntries(new FormData(form));
    submit.disabled = true; submit.textContent = 'Saving...'; message.hidden = true;
    try {
      state.user = await api('/api/profile', { method: 'PATCH', body: JSON.stringify({ name: values.name, email: values.email, phone: values.phone || null, address: values.address || null, language: values.language, notificationPreferences: { statusUpdates: values.statusUpdates === 'on', criticalAlerts: values.criticalAlerts === 'on', resolutionUpdates: values.resolutionUpdates === 'on' } }) });
      profileView(el, state.user, 'Profile saved successfully.');
      await hydrate();
      window.setTimeout(() => { if ($('#app-overlay')) window.location.hash = 'profile'; window.location.reload(); }, 900);
    } catch (error) { message.textContent = error.message; message.hidden = false; submit.disabled = false; submit.textContent = 'Save Changes'; }
  };
  $('.cancel-profile', el).onclick = () => profileView(el, profile);
}

async function profileDialog() {
  const el = modal('Profile & preferences', '<div class="app-empty" role="status">Loading profile...</div>');
  try { const profile = await api('/api/profile'); profileView(el, profile); }
  catch (error) { $('.app-dialog', el).innerHTML = `<button class="app-close" type="button" aria-label="Close">×</button><h2>Profile & preferences</h2><div class="app-message" role="alert">${esc(error.message)}</div><div class="app-actions"><button class="retry-profile" type="button">Retry</button></div>`; bindProfileClose(el); $('.retry-profile', el).onclick = profileDialog; }
}

async function logout() { try { await api('/api/auth/logout', { method: 'POST' }); closeModal(); state.user = null; location.reload(); } catch (error) { toast(error.message); } }

function complaintDetail(id) {
  api(`/api/complaints/${encodeURIComponent(id)}`).then(async (complaint) => {
    const related = complaint.related?.length ? `<div class="app-item"><b>Related complaints</b><br>${complaint.related.map((item) => `${esc(item.id)} · ${esc(item.title)} (${Math.round(item.similarityScore * 100)}%)`).join('<br>')}</div>` : '<div class="app-empty">No stored related complaints.</div>';
    const evidence = complaint.evidence?.length ? `<div class="app-item"><b>Evidence</b><br>${complaint.evidence.map((item) => `<a href="${esc(item.url || `/api/evidence/${encodeURIComponent(item.id)}`)}" target="_blank" rel="noreferrer">${esc(item.fileName)}</a> · ${item.size} bytes`).join('<br>')}</div>` : '<div class="app-empty">No evidence attached.</div>';
    const authority = restricted(['AUTHORITY', 'ADMIN']);
     const citizenVerification = restricted(['CITIZEN']) && complaint.status === 'RESOLUTION_PENDING_VERIFICATION' ? '<form class="app-form" id="verification-form"><label>Comment<textarea name="comment" placeholder="Tell us what happened."></textarea></label><label>Optional evidence<input name="evidence" type="file" accept=".jpg,.jpeg,.png,.webp,.pdf"></label><div class="app-message" role="status"></div><div class="app-actions"><button class="primary-action" name="resolved" value="true" type="submit">Issue Resolved</button><button name="resolved" value="false" type="submit">Still Unresolved</button></div></form>' : '';
    const authorityControls = authority ? `<form class="app-form" id="workflow-form"><label>Department<select name="departmentId" id="department-select"><option value="">Unassigned</option></select></label><label>Status<select name="status"><option>SUBMITTED</option><option>AI_ANALYZED</option><option>ASSIGNED</option><option>ACTION_INITIATED</option><option>IN_PROGRESS</option><option>RESOLUTION_PENDING_VERIFICATION</option><option>RESOLVED</option><option>REOPENED</option><option>REJECTED</option></select></label><button class="primary-action" type="submit">Save Workflow Update</button></form><form class="app-form" id="resolution-form"><label>Resolution note<textarea name="note" required placeholder="Describe the action taken."></textarea></label><label>Resolution evidence<input name="resolutionEvidence" type="file" accept=".jpg,.jpeg,.png,.webp,.pdf"></label><div class="app-message" role="status"></div><button type="submit">Submit Resolution</button></form>` : '';
    const resolutionEvidence = complaint.resolution?.evidenceId ? `<br><a href="/api/evidence/${encodeURIComponent(complaint.resolution.evidenceId)}" target="_blank" rel="noreferrer">View resolution evidence: ${esc(complaint.resolution.evidenceFileName || 'file')}</a>` : '';
    const el = modal(complaint.title, `<div class="app-list"><div class="app-item"><b>${esc(complaint.id)}</b><br>Status: <span class="app-status">${esc(complaint.status)}</span><br>Priority: ${esc(complaint.priority)} (${complaint.priorityScore}/100)<br>Category: ${esc(complaint.category)}<br>Location: ${esc(complaint.location || complaint.ward || 'Not provided')}<br><br>${esc(complaint.description)}</div><div class="app-item"><b>AI analysis</b><br>${esc(complaint.analysis?.summary || 'Analysis pending.')}<br>Confidence: ${complaint.analysis?.confidence ? Math.round(complaint.analysis.confidence * 100) + '%' : '—'}<br>Recommendation: ${esc(complaint.analysis?.recommendation || '—')}</div>${evidence}${related}${complaint.resolution ? `<div class="app-item"><b>Resolution</b><br>${esc(complaint.resolution.note)}<br>Status: ${esc(complaint.resolution.status)}${complaint.resolution.citizenComment ? `<br>Citizen comment: ${esc(complaint.resolution.citizenComment)}` : ''}${resolutionEvidence}</div>` : ''}${citizenVerification}${authorityControls}</div>`);
    const workflow = $('#workflow-form', el);
    if (workflow) {
      $('select[name="status"]', workflow).value = complaint.status;
      try { const departments = await api('/api/departments'); const select = $('#department-select', el); departments.filter((department) => department.active || department.id === complaint.departmentId).forEach((department) => { const option = document.createElement('option'); option.value = department.id; option.textContent = `${department.name}${department.active ? '' : ' (inactive - historical assignment)'}`; option.selected = department.id === complaint.departmentId; select.append(option); }); } catch (error) { toast(error.message); }
      workflow.onsubmit = async (event) => { event.preventDefault(); try { await api(`/api/complaints/${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify(Object.fromEntries(new FormData(workflow))) }); closeModal(); await hydrate(); toast('Workflow updated.'); } catch (error) { toast(error.message); } };
    }
    const resolution = $('#resolution-form', el);
    if (resolution) resolution.onsubmit = async (event) => { event.preventDefault(); const button = $('button[type="submit"]', resolution); const status = $('.app-message', resolution); const file = resolution.resolutionEvidence.files[0]; button.disabled = true; button.textContent = 'Submitting...'; try { const result = await api(`/api/complaints/${encodeURIComponent(id)}/resolve`, { method: 'POST', body: JSON.stringify({ note: resolution.note.value }) }); if (file) { status.textContent = 'Uploading resolution evidence...'; await api(`/api/resolutions/${encodeURIComponent(result.resolutionId)}/evidence`, { method: 'POST', body: JSON.stringify({ name: file.name, type: file.type, size: file.size, data: await fileToBase64(file) }) }); status.textContent = 'Resolution evidence uploaded.'; } closeModal(); await hydrate(); toast('Resolution submitted for citizen verification.'); } catch (error) { status.textContent = error.message; button.disabled = false; button.textContent = 'Submit Resolution'; } };
    const verification = $('#verification-form', el);
     if (verification) verification.onsubmit = async (event) => { event.preventDefault(); const button = event.submitter; const message = $('.app-message', verification); const file = verification.evidence.files[0]; button.disabled = true; message.textContent = 'Saving your verification...'; try { let evidence; if (file) { const allowed = new Set(['image/jpeg','image/png','image/webp','application/pdf']); const extension = `.${file.name.split('.').pop().toLowerCase()}`; if (!allowed.has(file.type) || !['.jpg','.jpeg','.png','.webp','.pdf'].includes(extension) || file.size > 10 * 1024 * 1024) throw new Error('Invalid evidence. Use JPG, PNG, WEBP, or PDF under 10 MB.'); evidence = { name: file.name, type: file.type, size: file.size, data: await fileToBase64(file) }; } await api(`/api/complaints/${encodeURIComponent(id)}/verify`, { method: 'POST', body: JSON.stringify({ resolved: button.value === 'true', comment: new FormData(verification).get('comment'), evidence }) }); closeModal(); await hydrate(); toast('Your verification was recorded.'); } catch (error) { message.textContent = error.message; button.disabled = false; } };
  }).catch((error) => toast(error.message));
}

async function complaintQueue(initial = {}) {
  if (!restricted(['AUTHORITY', 'ADMIN'])) return unavailable('Authority access required', 'Complaint management is restricted to authority users.');
  const el = modal('Complaint management', '<div class="app-empty" role="status">Loading complaint table...</div>');
  let filterOptions;
  try { filterOptions = await api('/api/complaint-filters'); } catch (error) { $('.app-dialog', el).innerHTML = `<button class="app-close" type="button" aria-label="Close">×</button><h2>Complaint management</h2><div class="app-empty" role="alert">Unable to load filters: ${esc(error.message)} <button id="retry-complaints" type="button">Retry</button></div>`; $('.app-close', el).onclick = closeModal; $('#retry-complaints', el).onclick = () => complaintQueue(initial); return; }
  const filters = { page: 1, pageSize: 8, sortBy: 'updatedAt', sortDir: 'desc', ...initial };
  const optionList = (values, selected) => values.map((value) => `<option value="${esc(value)}" ${selected === value ? 'selected' : ''}>${esc(value)}</option>`).join('');
  const departmentOptions = filterOptions.departments.map((department) => `<option value="${esc(department.id)}" ${filters.department === department.id ? 'selected' : ''}>${esc(department.name)}</option>`).join('');
  $('.app-dialog', el).innerHTML = `<button class="app-close" type="button" aria-label="Close">×</button><h2>Complaint management</h2><form id="complaint-filters" class="app-form"><div class="grid grid-cols-1 md:grid-cols-2 gap-md"><label>Search<input name="search" placeholder="ID, title, ward, department"></label><label>Category<select name="category"><option value="">All categories</option>${optionList(filterOptions.categories, filters.category)}</select></label><label>Priority<select name="priority"><option value="">All priorities</option>${optionList(filterOptions.priorities, filters.priority)}</select></label><label>Status<select name="status"><option value="">All statuses</option>${optionList(filterOptions.statuses, filters.status)}</select></label><label>Department<select name="department"><option value="">All departments</option>${departmentOptions}</select></label><label>Ward<select name="ward"><option value="">All wards</option>${optionList(filterOptions.wards, filters.ward)}</select></label><label>Date from<input name="dateFrom" type="date"></label><label>Date to<input name="dateTo" type="date"></label><label>Systemic issue<select name="systemicIssue"><option value="">All complaints</option><option value="yes">Systemic issues</option><option value="no">Non-systemic issues</option></select></label></div><div class="app-actions"><button class="primary-action" type="submit">Apply Filters</button><button id="reset-complaint-filters" type="button">Reset Filters</button></div></form><div id="complaint-table-region" role="region" aria-live="polite"></div>`;
  $('.app-close', el).onclick = closeModal;
  const form = $('#complaint-filters', el); const region = $('#complaint-table-region', el); const load = async () => { region.innerHTML = '<div class="app-empty" role="status">Loading complaints...</div>'; const query = new URLSearchParams({ page: String(filters.page), pageSize: String(filters.pageSize), sortBy: filters.sortBy, sortDir: filters.sortDir }); ['search','category','priority','status','department','ward','dateFrom','dateTo','systemicIssue','active'].forEach((key) => { if (filters[key]) query.set(key, filters[key]); }); try { const result = await api(`/api/complaints?${query}`); renderComplaintTable(region, result, filters, load); } catch (error) { region.innerHTML = `<div class="app-empty" role="alert">Unable to load complaints: ${esc(error.message)} <button id="retry-table" type="button">Retry</button></div>`; $('#retry-table', region).onclick = load; } };
  form.onsubmit = (event) => { event.preventDefault(); Object.assign(filters, Object.fromEntries(new FormData(form))); filters.page = 1; load(); };
  $('#reset-complaint-filters', el).onclick = () => { Object.keys(filters).forEach((key) => { if (!['page','pageSize','sortBy','sortDir'].includes(key)) delete filters[key]; }); form.reset(); filters.page = 1; load(); };
  await load();
}

function renderComplaintTable(region, result, filters, reload) {
  const items = result.items || []; const pagination = result.pagination || { page: 1, pageSize: items.length, total: items.length, totalPages: 1 }; const head = (label, sort) => `<th scope="col"><button type="button" data-sort="${sort}">${label}${filters.sortBy === sort ? ` ${filters.sortDir === 'asc' ? '↑' : '↓'}` : ''}</button></th>`;
  const body = items.length ? items.map((complaint) => `<tr data-complaint-id="${esc(complaint.id)}"><td>${esc(complaint.id)}</td><td>${esc(complaint.title)}</td><td>${esc(complaint.category)}</td><td>${esc(complaint.ward || '—')}</td><td>${esc(complaint.priority)}</td><td>${esc(complaint.status)}</td><td>${esc(complaint.department || 'Unassigned')}</td><td>${esc(new Date(complaint.createdAt).toLocaleDateString())}</td><td><button type="button" data-view-complaint="${esc(complaint.id)}">View</button></td></tr>`).join('') : '<tr><td colspan="9"><div class="app-empty">No complaints match these filters.</div></td></tr>';
  region.innerHTML = `<div class="flex items-center justify-between mb-md"><span>${pagination.total} total records</span><span>Page ${pagination.page} of ${Math.max(pagination.totalPages, 1)}</span></div><div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse;text-align:left"><thead><tr>${head('Complaint ID','id')}${head('Title','title')}${head('Category','category')}${head('Ward','ward')}${head('Priority','priority')}${head('Status','status')}${head('Department','department')}${head('Created Date','createdAt')}<th scope="col">Actions</th></tr></thead><tbody>${body}</tbody></table></div><div class="app-actions" style="margin-top:16px"><button type="button" id="table-previous" ${pagination.page <= 1 ? 'disabled' : ''}>Previous</button><button type="button" id="table-next" ${pagination.page >= pagination.totalPages ? 'disabled' : ''}>Next</button></div>`;
  region.querySelectorAll('[data-sort]').forEach((button) => { button.onclick = () => { const sort = button.dataset.sort; filters.sortDir = filters.sortBy === sort && filters.sortDir === 'asc' ? 'desc' : 'asc'; filters.sortBy = sort; filters.page = 1; reload(); }; });
  region.querySelectorAll('[data-complaint-id]').forEach((row) => { row.onclick = (event) => { if (event.target.closest('button')) return; complaintDetail(row.dataset.complaintId); }; });
  region.querySelectorAll('[data-view-complaint]').forEach((button) => { button.onclick = () => complaintDetail(button.dataset.viewComplaint); });
  $('#table-previous', region).onclick = () => { filters.page -= 1; reload(); }; $('#table-next', region).onclick = () => { filters.page += 1; reload(); };
}

async function notificationDialog() {
  try { const result = await api('/api/notifications'); const notifications=result.items||[]; const body=`<div class="app-actions"><span>${result.unreadCount||0} unread</span><button id="mark-all-notifications" type="button">Mark all read</button></div>${notifications.length ? `<div class="app-list">${notifications.map((notification) => `<button class="app-item text-left ${notification.readAt?'':'border-secondary'}" type="button" data-notification-id="${esc(notification.id)}"><b>${esc(notification.title)}</b><br>${esc(notification.message)}<br><small>${notification.readAt ? 'Read' : 'Unread'}</small></button>`).join('')}</div>` : '<div class="app-empty">No notifications yet.</div>'}`; const el = modal('Notifications', body); $('#mark-all-notifications',el).onclick=async()=>{try{await api('/api/notifications/read-all',{method:'PATCH',body:'{}'});await notificationDialog();await refreshNotificationBadge();}catch(error){toast(error.message);}}; document.querySelectorAll('[data-notification-id]', el).forEach((item) => { item.onclick = async () => { try { const current=notifications.find((notification)=>notification.id===item.dataset.notificationId); await api(`/api/notifications/${encodeURIComponent(item.dataset.notificationId)}`, { method: 'PATCH', body: '{}' }); await refreshNotificationBadge(); if(current?.entityType==='Complaint'&&current.entityId){closeModal();complaintDetail(current.entityId);}else if(current?.entityType==='SystemicIssue'&&current.entityId){closeModal();systemicDetail(current.entityId);}else{item.querySelector('small').textContent='Read';item.classList.remove('border-secondary');} } catch (error) { toast(error.message); } }; }); } catch (error) { toast(error.message); }
}

async function analyticsDialog() {
  if (!restricted(['AUTHORITY', 'ADMIN'])) return unavailable('Authority access required', 'Analytics are restricted to authority users.');
  const el = modal('AI Analytics', '<div class="app-empty" role="status">Loading analytics...</div>');
  try {
    const options = await api('/api/complaint-filters');
    const optionList = (values) => values.map((value) => `<option value="${esc(value)}">${esc(value)}</option>`).join('');
    $('.app-dialog', el).innerHTML = `<button class="app-close" type="button" aria-label="Close">×</button><h2>AI Analytics</h2><form id="analytics-filters" class="app-form"><div class="grid grid-cols-1 md:grid-cols-2 gap-md"><label>Range<select name="range"><option value="7">Last 7 days</option><option value="30" selected>Last 30 days</option><option value="90">Last 90 days</option><option value="all">All time</option></select></label><label>Category<select name="category"><option value="">All categories</option>${optionList(options.categories)}</select></label><label>Priority<select name="priority"><option value="">All priorities</option>${optionList(options.priorities)}</select></label><label>Status<select name="status"><option value="">All statuses</option>${optionList(options.statuses)}</select></label><label>Ward<select name="ward"><option value="">All wards</option>${optionList(options.wards)}</select></label><label>Department<select name="department"><option value="">All departments</option>${options.departments.map((department) => `<option value="${esc(department.id)}">${esc(department.name)}</option>`).join('')}</select></label><label>Date from<input name="dateFrom" type="date"></label><label>Date to<input name="dateTo" type="date"></label></div><div class="app-actions"><button class="primary-action" type="submit">Apply</button><button id="reset-analytics" type="button">Reset</button></div></form><div id="analytics-region" role="region" aria-live="polite"></div>`;
    $('.app-close', el).onclick = closeModal;
    const form = $('#analytics-filters', el); const region = $('#analytics-region', el);
    const bars = (title, rows, key) => { if (!rows.length) return `<div class="app-item"><b>${title}</b><br>No data available.</div>`; const max=Math.max(...rows.map((row)=>row.count),1); return `<div class="app-item"><b>${title}</b><div class="app-list">${rows.map((row)=>`<div><div style="display:flex;justify-content:space-between"><span>${esc(row[key])}</span><span>${row.count}</span></div><div style="height:8px;background:#e6e8ea;border-radius:4px"><div style="height:8px;width:${Math.max(4,row.count/max*100)}%;background:#316bf3;border-radius:4px"></div></div></div>`).join('')}</div></div>`; };
    const timeChart = (rows) => { if (!rows.length) return '<div class="app-item"><b>Complaints over time</b><br>No timestamp data available.</div>'; const width=560,height=180,pad=24,max=Math.max(...rows.map((row)=>row.count),1),points=rows.map((row,index)=>`${pad+(index/(Math.max(rows.length-1,1)))*(width-pad*2)},${height-pad-(row.count/max)*(height-pad*2)}`).join(' '); return `<div class="app-item"><b>Complaints over time</b><svg viewBox="0 0 ${width} ${height}" role="img" aria-label="Complaints over time" style="width:100%;height:auto"><polyline points="${points}" fill="none" stroke="#316bf3" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"></polyline></svg><small>${esc(rows[0].date)} to ${esc(rows[rows.length-1].date)}</small></div>`; };
     const load = async () => { region.innerHTML='<div class="app-empty" role="status">Loading analytics...</div>'; const params=new URLSearchParams(Object.fromEntries(new FormData(form))); try { const analytics=await api(`/api/analytics?${params}`); const metric=(label,value)=>`<div class="app-item"><b>${label}</b><br><span style="font-size:24px;font-weight:700">${value}</span></div>`; region.innerHTML=`<div class="app-item"><b>Data scope</b><br>${analytics.metrics.demoComplaints ? `${analytics.metrics.demoComplaints} synthetic demo records are included and clearly identified.` : 'No synthetic demo records included.'}${analytics.metrics.realComplaints ? `<br>${analytics.metrics.realComplaints} real user-submitted records.` : ''}</div><div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-md">${metric('Total complaints',analytics.metrics.totalComplaints)}${metric('Resolution rate',analytics.metrics.resolutionRate===null?'No resolution data':`${analytics.metrics.resolutionRate}%`)}${metric('Average resolution time',analytics.metrics.averageResolutionHours===null?'No resolution data available yet':`${analytics.metrics.averageResolutionHours} hrs`)}${metric('Systemic issues',analytics.metrics.systemicIssues)}${metric('Critical complaints',analytics.metrics.criticalComplaints)}${metric('Active complaints',analytics.metrics.activeComplaints)}</div><div class="grid grid-cols-1 lg:grid-cols-2 gap-md">${timeChart(analytics.overTime)}${bars('Complaints by category',analytics.byCategory,'category')}${bars('Complaints by priority',analytics.byPriority,'priority')}${bars('Complaints by status',analytics.byStatus,'status')}${bars('Ward distribution',analytics.wardDistribution,'ward')}<div class="app-item"><b>Department performance</b><div class="app-list">${analytics.departmentPerformance.length?analytics.departmentPerformance.map((department)=>`<div><b>${esc(department.name)}</b><br>Assigned: ${department.assigned} · In progress: ${department.inProgress} · Resolved: ${department.resolved} · Pending verification: ${department.pending}<br>Resolution rate: ${department.resolutionRate===null?'No data':`${department.resolutionRate}%`} · Average resolution: ${department.averageResolutionHours===null?'No data':`${Number(department.averageResolutionHours).toFixed(1)} hrs`}</div>`).join(''):'No department data available.'}</div></div></div>`; } catch(error){region.innerHTML=`<div class="app-empty" role="alert">Unable to load analytics: ${esc(error.message)} <button id="retry-analytics" type="button">Retry</button></div>`;$('#retry-analytics',region).onclick=load;} };
    form.onsubmit=(event)=>{event.preventDefault();load();};$('#reset-analytics',el).onclick=()=>{form.reset();load();};await load();
  } catch (error) { $('.app-dialog', el).innerHTML=`<button class="app-close" type="button" aria-label="Close">×</button><h2>AI Analytics</h2><div class="app-empty" role="alert">Unable to load analytics filters: ${esc(error.message)} <button id="retry-analytics-filters" type="button">Retry</button></div>`;$('.app-close',el).onclick=closeModal;$('#retry-analytics-filters',el).onclick=analyticsDialog; }
}

async function mapDialog() {
  if (!restricted(['AUTHORITY', 'ADMIN'])) return unavailable('Authority access required', 'Map intelligence is restricted to authority users.');
  const el = modal('Real-time grievance map', '<div id="app-map" style="height:360px;border-radius:8px;background:#eceef0"></div><p id="map-fallback" style="font:14px/20px Inter;color:#45474c">Loading live complaint locations...</p>');
  let points = [];
  try {
    points = await api('/api/map-data');
    if (!points.length) { $('#map-fallback', el).textContent = 'No geolocated complaints yet.'; return; }
    const loadLeaflet = () => new Promise((resolve, reject) => { if (window.L) return resolve(); const css = document.createElement('link'); css.rel = 'stylesheet'; css.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'; document.head.append(css); const script = document.createElement('script'); script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'; script.onload = resolve; script.onerror = reject; document.head.append(script); });
    await loadLeaflet();
    const map = L.map($('#app-map', el)).setView([points[0].latitude, points[0].longitude], 12);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '© OpenStreetMap contributors' }).addTo(map);
    points.forEach((point) => L.marker([point.latitude, point.longitude]).addTo(map).bindPopup(`<b>${esc(point.id)}</b><br>${esc(point.title)}<br>${esc(point.priority)} · ${esc(point.status)}`));
    $('#map-fallback', el).textContent = `${points.length} locations from the application database.`;
  } catch (error) { $('#app-map', el).style.display = 'none'; $('#map-fallback', el).innerHTML = `Map tiles are unavailable. <b>Location list fallback:</b><br>${points.map((point) => `${esc(point.ward || 'Unknown ward')} — ${esc(point.title)} — ${esc(point.priority)}`).join('<br>')}<br><button id="map-retry" type="button">Retry map</button>`; $('#map-retry', el).onclick = mapDialog; }
}

async function departmentsDialog() {
  if (!restricted(['AUTHORITY', 'ADMIN'])) return unavailable('Authority access required', 'Department data is restricted to authority users.');
  const el = modal('Departments', '<div class="app-empty" role="status">Loading departments...</div>');
  const dialog = $('.app-dialog', el);
  const render = async () => {
    try {
      const departments = await api('/api/departments');
      dialog.innerHTML = `<button class="app-close" type="button" aria-label="Close">×</button><h2>Department management</h2><div class="app-actions"><button id="new-department" class="primary-action" type="button">Create Department</button></div>${departments.length ? `<div class="app-list">${departments.map((department) => `<div class="app-item"><div style="display:flex;justify-content:space-between;gap:12px;align-items:start"><div><b>${esc(department.name)}</b><br>${esc(department.category)}<br><small>${esc(department.description || 'No description')} · ${esc(department.contact || 'No contact')}<br>${department.active ? 'Active' : 'Inactive'} · Created ${new Date(department.createdAt).toLocaleDateString()} · Updated ${new Date(department.updatedAt).toLocaleDateString()}</small></div><div class="app-actions"><button type="button" data-edit-department="${esc(department.id)}">Edit</button><button type="button" data-toggle-department="${esc(department.id)}">${department.active ? 'Deactivate' : 'Activate'}</button></div></div></div>`).join('')}</div>` : '<div class="app-empty">No departments available.</div>'}`;
      $('.app-close', dialog).onclick = closeModal;
      $('#new-department', dialog).onclick = () => editDepartment();
      dialog.querySelectorAll('[data-edit-department]').forEach((button) => { button.onclick = () => editDepartment(departments.find((item) => item.id === button.dataset.editDepartment)); });
      dialog.querySelectorAll('[data-toggle-department]').forEach((button) => { button.onclick = async () => { button.disabled = true; try { const department = departments.find((item) => item.id === button.dataset.toggleDepartment); await api(`/api/departments/${encodeURIComponent(department.id)}`, { method: 'PATCH', body: JSON.stringify({ active: !department.active }) }); toast(`Department ${department.active ? 'deactivated' : 'activated'}.`); await render(); } catch (error) { toast(error.message); button.disabled = false; } }; });
    } catch (error) {
      dialog.innerHTML = `<button class="app-close" type="button" aria-label="Close">×</button><h2>Department management</h2><div class="app-empty" role="alert">Unable to load departments: ${esc(error.message)} <button id="retry-departments" type="button">Retry</button></div>`;
      $('.app-close', dialog).onclick = closeModal;
      $('#retry-departments', dialog).onclick = render;
    }
  };
  const editDepartment = (department = {}) => {
    dialog.innerHTML = `<button class="app-close" type="button" aria-label="Close">×</button><h2>${department.id ? 'Edit department' : 'Create department'}</h2><form class="app-form" id="department-form"><label>Name<input name="name" required maxlength="120" value="${esc(department.name || '')}"></label><label>Category<input name="category" required maxlength="120" value="${esc(department.category || '')}"></label><label>Description<textarea name="description" maxlength="1000">${esc(department.description || '')}</textarea></label><label>Contact<input name="contact" maxlength="180" value="${esc(department.contact || '')}"></label><label><input name="active" type="checkbox" ${department.active === false ? '' : 'checked'}> Active</label><div class="app-message" hidden></div><div class="app-actions"><button class="primary-action" type="submit">Save Department</button><button id="cancel-department" type="button">Cancel</button></div></form>`;
    $('.app-close', dialog).onclick = closeModal;
    $('#cancel-department', dialog).onclick = render;
    const form = $('#department-form', dialog);
    form.onsubmit = async (event) => { event.preventDefault(); const values = Object.fromEntries(new FormData(form)); const message = $('.app-message', form); const button = $('button[type="submit"]', form); button.disabled = true; try { await api(department.id ? `/api/departments/${encodeURIComponent(department.id)}` : '/api/departments', { method: department.id ? 'PATCH' : 'POST', body: JSON.stringify({ name: values.name, category: values.category, description: values.description || null, contact: values.contact || null, active: values.active === 'on' }) }); toast(department.id ? 'Department updated.' : 'Department created.'); await render(); } catch (error) { message.textContent = error.message; message.hidden = false; button.disabled = false; } };
  };
  await render();
}
async function systemicDialog() {
  if (!restricted(['AUTHORITY', 'ADMIN'])) return unavailable('Authority access required', 'Systemic issue intelligence is restricted to authority users.');
  const el = modal('Systemic issues', '<div class="app-empty" role="status">Detecting systemic patterns...</div>');
  const render = async () => { try { const issues = await api('/api/systemic-issues'); const body = `<div class="app-actions"><button id="detect-systemic" class="primary-action" type="button">Detect systemic issues</button></div>${issues.length ? `<div class="app-list">${issues.map((issue) => `<button class="app-item text-left" type="button" data-systemic-id="${esc(issue.id)}"><b>${esc(issue.name)}</b><br>${esc(issue.category)} · ${esc(issue.ward)}<br>${issue.complaintCount} related complaints · ${esc(issue.priority)} · ${Math.round(issue.confidence * 100)}% confidence<br><small>Status: ${esc(issue.status)} · ${esc(issue.department || 'Department pending')}</small></button>`).join('')}</div>` : '<div class="app-empty">No persisted systemic issues meet the evidence threshold. Run detection after related complaints are available.</div>'}`; $('.app-dialog', el).innerHTML = `<button class="app-close" type="button" aria-label="Close">×</button><h2>Systemic issues</h2>${body}`; $('.app-close', el).onclick = closeModal; $('#detect-systemic', el).onclick = async () => { const button=$('#detect-systemic',el);button.disabled=true;button.textContent='Detecting...';try{await api('/api/systemic-issues/detect',{method:'POST',body:'{}'});await render();}catch(error){toast(error.message);button.disabled=false;button.textContent='Detect systemic issues';} }; document.querySelectorAll('[data-systemic-id]', el).forEach((item) => { item.onclick = () => systemicDetail(item.dataset.systemicId); }); } catch (error) { $('.app-dialog', el).innerHTML = `<button class="app-close" type="button" aria-label="Close">×</button><h2>Systemic issues</h2><div class="app-empty" role="alert">Unable to load systemic issues: ${esc(error.message)} <button id="retry-systemic" type="button">Retry</button></div>`; $('.app-close', el).onclick = closeModal; $('#retry-systemic', el).onclick = render; } };
  await render();
}

async function systemicDetail(id) {
  try { const issue = await api(`/api/systemic-issues/${encodeURIComponent(id)}`); const related = issue.relatedComplaints?.length ? `<div class="app-list">${issue.relatedComplaints.map((complaint) => `<button class="app-item text-left" type="button" data-complaint-id="${esc(complaint.id)}"><b>${esc(complaint.id)}</b> · ${esc(complaint.priority)}<br>${esc(complaint.title)}<br><small>${esc(complaint.status)} · ${esc(complaint.ward || '')}</small></button>`).join('')}</div>` : '<div class="app-empty">No related complaints stored.</div>'; const el = modal(issue.name, `<div class="app-list"><div class="app-item"><b>Issue</b><br>${esc(issue.description)}<br><br>Priority: ${esc(issue.priority)}<br>Confidence: ${Math.round(issue.confidence * 100)}%<br>Related complaints: ${issue.complaintCount}<br>Affected ward: ${esc(issue.ward)}<br>Status: ${esc(issue.status)}<br>Created: ${esc(issue.createdAt)}</div><div class="app-item"><b>Recommended department</b><br>${esc(issue.recommendedDepartment || 'Not assigned')}<br><b>Recommended action</b><br>${esc(issue.recommendedAction)}</div><div class="app-item"><b>Related complaints</b>${related}</div><div id="systemic-map" style="height:220px;border-radius:8px;background:#eceef0"></div><form id="systemic-action-form" class="app-form"><label>Action status<select name="status"><option>OPEN</option><option>ACTION_INITIATED</option><option>IN_PROGRESS</option><option>RESOLVED</option></select></label><label>Action note<textarea name="note" placeholder="Record the authority action."></textarea></label><button class="primary-action" type="submit">Save Action</button></form></div>`); $('select[name="status"]', el).value=issue.status; document.querySelectorAll('[data-complaint-id]',el).forEach((item)=>{item.onclick=()=>complaintDetail(item.dataset.complaintId);}); const action=$('#systemic-action-form',el); action.onsubmit=async(event)=>{event.preventDefault();const button=$('button[type="submit"]',action);button.disabled=true;try{await api(`/api/systemic-issues/${encodeURIComponent(id)}/action`,{method:'POST',body:JSON.stringify(Object.fromEntries(new FormData(action)))});closeModal();toast('Systemic issue action saved.');}catch(error){toast(error.message);button.disabled=false;}}; try { await loadLeafletAssets(); const map=L.map($('#systemic-map',el)).setView([issue.latitude||28.6139,issue.longitude||77.209],12);L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{attribution:'© OpenStreetMap contributors'}).addTo(map);if(issue.latitude&&issue.longitude)L.marker([issue.latitude,issue.longitude]).addTo(map).bindPopup(esc(issue.name)).openPopup(); } catch { $('#systemic-map',el).textContent='Map unavailable. Related complaint locations are available above.'; } } catch (error) { toast(error.message); }
}

function commandCenter() { closeModal(); window.scrollTo({ top: 0, behavior: 'smooth' }); hydrate().catch((error) => toast(error.message)); }
function showSupport() { unavailable('Support', 'Support messaging is not configured in this application.'); }
function showPublicTrust() { unavailable('Public Trust', 'Public Trust reporting has no connected API yet.'); }
function showAuditLog() { unavailable('Audit Log', 'Audit records are written by the backend, but a read view is not connected yet.'); }
function showResources() { unavailable('Resources', 'Resources are not configured in this application.'); }
function showReports() { analyticsDialog(); }

function wireNavigation() {
  style();
  document.querySelectorAll('button').forEach((button) => {
    const text = button.textContent.trim();
    if (text.includes('Report New Issue') || text.includes('Citizen Portal')) button.onclick = complaintDialog;
    else if (text.includes('settings')) button.onclick = profileDialog;
    else if (text.includes('notifications')) button.onclick = notificationDialog;
    else if (text.includes('Emergency Alert')) button.onclick = () => unavailable('Emergency Alert', 'Emergency alert operations are not configured in this application.');
    else if (text.includes('Switch to Citizen View')) button.hidden = true;
  });
  document.querySelectorAll('a[href="#"]').forEach((link) => {
    link.onclick = (event) => {
      event.preventDefault();
      const text = link.textContent.trim();
      if (text.includes('Command Center') || text.includes('Dashboard')) commandCenter();
      else if (text.includes('Real-time Map')) mapDialog();
      else if (text.includes('Grievance Feed') || text.includes('Incidents')) complaintQueue();
      else if (text.includes('AI Analytics')) analyticsDialog();
      else if (text.includes('Reports')) showReports();
      else if (text.includes('Departments')) departmentsDialog();
      else if (text.includes('Systemic Issues')) systemicDialog();
      else if (text.includes('Public Trust')) showPublicTrust();
      else if (text.includes('Audit Log')) showAuditLog();
      else if (text.includes('Resources')) showResources();
      else if (text.includes('Support') || text.includes('Contact') || text.includes('Privacy') || text.includes('Terms') || text.includes('Accessibility')) showSupport();
      else if (text.includes('Sign Out')) logout();
      else commandCenter();
    };
  });
}

async function start() {
  wireNavigation();
  try { state.user = await api('/api/auth/session'); if (state.user) { await hydrate(); if (location.hash === '#profile') profileDialog(); } else authDialog(); }
  catch (error) { toast(error.message); authDialog(); }
}

start();
