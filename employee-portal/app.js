/* ============================================================
   Randy's Cleaning Pros — Team Portal
   Local-first app. Optional Supabase sync via config.js.
   ============================================================ */

const cfg = window.PORTAL_CONFIG || {};
const online = !!(cfg.SUPABASE_URL && cfg.SUPABASE_ANON_KEY);
const db = online ? supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY) : null;
const $ = id => document.getElementById(id);
const uid = () => (crypto.randomUUID ? crypto.randomUUID() : String(Date.now() + Math.random()));

let customers = [], jobs = [], employees = [], mileage = [];
let settings = { rate: 45, minPrice: 60, adminPin: "1234", commercialMult: 1.15, airbnbMult: 1.1, recurringDiscount: 10 };
let session = null; // {role:'admin'|'employee', employeeId}
let activeJobId = null;
let timerInterval = null;
let sigDrawing = false, sigCtx = null;

/* ---------- room / pricing rules ---------- */
const timeRules = {
  smallBedrooms: ["Small bedrooms", 15], mediumBedrooms: ["Medium bedrooms", 20],
  largeBedrooms: ["Large bedrooms", 25], halfBathrooms: ["Half bathrooms", 10],
  fullBathrooms: ["Full bathrooms", 20], primaryBathrooms: ["Large primary bathrooms", 30],
  livingRooms: ["Living / family rooms", 25], diningRooms: ["Dining rooms", 15],
  homeOffices: ["Home offices", 15], laundryRooms: ["Laundry rooms", 10],
  stairs: ["Flights of stairs", 10], basements: ["Basements", 35],
  attics: ["Attics", 30], garages: ["Garages", 35]
};
const roomKeys = Object.keys(timeRules);
const conditionNames = { "0.85": "Excellent", "1": "Good", "1.2": "Needs attention", "1.45": "Heavy cleaning", "1.75": "Move-out / deep clean" };
const checklistItems = ["Kitchen completed", "Bathrooms completed", "Floors inspected", "Trash removed", "Final walkthrough completed"];

/* ---------- helpers ---------- */
function toast(msg) { const t = $("toast"); t.textContent = msg; t.classList.add("show"); setTimeout(() => t.classList.remove("show"), 2200); }
function esc(v) { return String(v ?? "").replace(/[&<>"']/g, s => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[s])); }
function money(n) { return "$" + (Math.round((n || 0) * 100) / 100).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 }); }
function minsText(m) { m = Math.round(m / 5) * 5; const h = Math.floor(m / 60), x = m % 60; return h ? `${h} ${h === 1 ? "hour" : "hours"}${x ? ` ${x} min` : ""}` : `${x} minutes`; }
function todayStr() { return new Date().toISOString().slice(0, 10); }
function isToday(d) { return d === todayStr(); }

/* ---------- storage ---------- */
function storeAll() {
  localStorage.setItem("rcp_customers", JSON.stringify(customers));
  localStorage.setItem("rcp_jobs", JSON.stringify(jobs));
  localStorage.setItem("rcp_employees", JSON.stringify(employees));
  localStorage.setItem("rcp_mileage", JSON.stringify(mileage));
  localStorage.setItem("rcp_settings", JSON.stringify(settings));
}
function loadLocal() {
  customers = JSON.parse(localStorage.getItem("rcp_customers") || "[]");
  jobs = JSON.parse(localStorage.getItem("rcp_jobs") || "[]");
  employees = JSON.parse(localStorage.getItem("rcp_employees") || "[]");
  mileage = JSON.parse(localStorage.getItem("rcp_mileage") || "[]");
  settings = Object.assign(settings, JSON.parse(localStorage.getItem("rcp_settings") || "{}"));
}
async function loadData() {
  if (!online) { loadLocal(); setConnBadge(false); renderAll(); return; }
  try {
    const [c, j, e, m] = await Promise.all([
      db.from("customers").select("*").order("created_at", { ascending: false }),
      db.from("jobs").select("*").order("service_date"),
      db.from("employees").select("*"),
      db.from("mileage").select("*").order("trip_date", { ascending: false })
    ]);
    if (c.error || j.error || e.error || m.error) throw new Error("query failed");
    customers = c.data || []; jobs = j.data || []; employees = e.data || []; mileage = m.data || [];
    setConnBadge(true); renderAll();
  } catch (err) {
    loadLocal(); toast("Could not reach database — using local mode."); renderAll();
  }
}
function setConnBadge(isOnline) {
  [$("connectionBadge"), $("connectionBadgeAdmin")].forEach(b => {
    if (!b) return;
    b.textContent = isOnline ? "Online database" : "Local mode";
    b.className = "status " + (isOnline ? "online" : "offline");
  });
}

/* ============================================================
   SESSION / GATE NAVIGATION
   ============================================================ */
function showGate(id) {
  document.querySelectorAll(".gate").forEach(g => g.classList.toggle("active", g.id === id));
  document.querySelectorAll(".app").forEach(a => a.classList.remove("active"));
}
document.querySelectorAll("[data-back]").forEach(b => b.onclick = () => showGate(b.dataset.back));

$("gateAdminBtn").onclick = () => showGate("adminLoginScreen");
$("gateEmployeeBtn").onclick = () => { populateEmployeeLoginSelect(); showGate("employeeLoginScreen"); };

function populateEmployeeLoginSelect() {
  const opts = employees.filter(e => e.active !== false)
    .map(e => `<option value="${e.id}">${esc(e.name)}</option>`).join("");
  $("employeeLoginSelect").innerHTML = opts || `<option value="">No employees yet — ask admin</option>`;
}

$("adminLoginForm").onsubmit = e => {
  e.preventDefault();
  if ($("adminPin").value === (settings.adminPin || "1234")) {
    session = { role: "admin" }; localStorage.setItem("rcp_session", JSON.stringify(session));
    $("adminPin").value = ""; enterAdmin();
  } else toast("Incorrect PIN");
};
$("employeeLoginForm").onsubmit = e => {
  e.preventDefault();
  const empId = $("employeeLoginSelect").value;
  const emp = employees.find(x => x.id === empId);
  if (emp && $("employeePin").value === String(emp.pin)) {
    session = { role: "employee", employeeId: emp.id };
    localStorage.setItem("rcp_session", JSON.stringify(session));
    $("employeePin").value = ""; enterEmployee();
  } else toast("Incorrect name or PIN");
};
$("adminLogoutBtn").onclick = () => logout();
$("empLogoutBtn").onclick = () => logout();
function logout() { session = null; localStorage.removeItem("rcp_session"); document.querySelectorAll(".app").forEach(a => a.classList.remove("active")); showGate("roleScreen"); }

function enterAdmin() {
  document.querySelectorAll(".gate").forEach(g => g.classList.remove("active"));
  $("adminApp").classList.add("active");
  renderAll();
}
function enterEmployee() {
  document.querySelectorAll(".gate").forEach(g => g.classList.remove("active"));
  $("employeeApp").classList.add("active");
  const emp = employees.find(x => x.id === session.employeeId);
  $("empGreeting").textContent = "Hi " + (emp ? emp.name.split(" ")[0] : "there") + "! 👋";
  $("empDateLabel").textContent = new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });
  eNav("empToday");
  renderEmployeeToday();
  renderEmployeeMileage();
}

/* ============================================================
   ADMIN NAV
   ============================================================ */
function nav(id) {
  document.querySelectorAll(".view").forEach(v => v.classList.toggle("active", v.id === id));
  document.querySelectorAll(".menu-item").forEach(b => b.classList.toggle("active", b.dataset.view === id));
  closeAdminMenu();
  window.scrollTo(0, 0);
  if (id === "reports") renderReports();
  if (id === "payroll") renderPayroll();
}
document.querySelectorAll(".menu-item").forEach(b => b.onclick = () => nav(b.dataset.view));
document.querySelectorAll("[data-view-link]").forEach(b => b.onclick = () => nav(b.dataset.viewLink));

function openAdminMenu() {
  $("adminMenu").classList.add("open");
  $("adminMenuBackdrop").classList.add("show");
  $("adminMenuBtn").setAttribute("aria-expanded", "true");
}
function closeAdminMenu() {
  $("adminMenu").classList.remove("open");
  $("adminMenuBackdrop").classList.remove("show");
  $("adminMenuBtn").setAttribute("aria-expanded", "false");
}
$("adminMenuBtn").onclick = () => {
  $("adminMenu").classList.contains("open") ? closeAdminMenu() : openAdminMenu();
};
$("adminMenuBackdrop").onclick = closeAdminMenu;

/* ============================================================
   EMPLOYEE APP NAV
   ============================================================ */
function eNav(id) {
  document.querySelectorAll(".eview").forEach(v => v.classList.toggle("active", v.id === id));
  document.querySelectorAll(".bn-btn").forEach(b => b.classList.toggle("active", b.dataset.eview === id));
  window.scrollTo(0, 0);
}
document.querySelectorAll(".bn-btn").forEach(b => b.onclick = () => eNav(b.dataset.eview));
document.querySelectorAll("[data-eback]").forEach(b => b.onclick = () => eNav(b.dataset.eback));

/* ============================================================
   DIALOGS
   ============================================================ */
document.querySelectorAll("[data-close-dialog]").forEach(b => b.onclick = () => b.closest("dialog").close());

/* ============================================================
   RENDER ALL
   ============================================================ */
function renderAll() {
  renderSelects();
  renderCustomers();
  renderEmployeesList();
  renderJobs();
  renderMileage();
  renderDashboard();
  $("setRate").value = settings.rate;
  $("setMinPrice").value = settings.minPrice;
  $("setCommercialMult").value = settings.commercialMult ?? 1.15;
  $("setAirbnbMult").value = settings.airbnbMult ?? 1.1;
  $("setRecurringDiscount").value = settings.recurringDiscount ?? 10;
}
function renderSelects() {
  const custOpts = '<option value="">Select customer</option>' +
    customers.map(c => `<option value="${c.id}">${esc(c.name)} — ${esc(c.street)}</option>`).join("");
  $("jobCustomer").innerHTML = custOpts;
  const empOpts = '<option value="">Unassigned</option>' +
    employees.filter(e => e.active !== false).map(e => `<option value="${e.id}">${esc(e.name)}</option>`).join("");
  $("jobEmployee").innerHTML = empOpts;
  $("tripJob").innerHTML = '<option value="">No related job</option>' +
    jobs.map(j => `<option value="${j.id}">${esc(customerName(j.customer_id))} — ${j.service_date}</option>`).join("");
  roomKeys.forEach(id => { const el = $(id); if (el && !el.options.length) for (let i = 0; i <= 8; i++) el.add(new Option(i, i)); });
}

/* ============================================================
   CUSTOMERS
   ============================================================ */
function customerObj(id) { return customers.find(c => c.id === id) || {}; }
function customerName(id) { return customerObj(id).name || "Unknown customer"; }

function openCustomer(c = {}) {
  $("customerForm").reset();
  $("customerId").value = c.id || "";
  $("customerName").value = c.name || "";
  $("customerPhone").value = c.phone || "";
  $("customerEmail").value = c.email || "";
  $("customerStreet").value = c.street || "";
  $("customerCity").value = c.city || "";
  $("customerState").value = c.state || "ME";
  $("customerZip").value = c.zip || "";
  $("customerGateCode").value = c.gate_code || "";
  $("customerAlarmCode").value = c.alarm_code || "";
  $("customerParking").value = c.parking || "";
  $("customerKeyLocation").value = c.key_location || "";
  $("customerEntryInstructions").value = c.entry_instructions || "";
  $("customerPets").value = c.pets || "";
  $("customerBirthday").value = c.birthday || "";
  $("customerReferral").value = c.referral || "";
  $("customerRecurring").value = c.recurring || "";
  $("customerProperties").value = (c.properties || []).join("\n");
  $("customerVip").checked = !!c.vip;
  $("customerDoNotBook").checked = !!c.do_not_book;
  $("customerNotes").value = c.notes || "";
  $("customerFavoriteEmployee").innerHTML = '<option value="">No preference</option>' +
    employees.map(e => `<option value="${e.id}" ${c.favorite_employee_id === e.id ? "selected" : ""}>${esc(e.name)}</option>`).join("");
  $("customerDialog").showModal();
}
$("addCustomerBtn").onclick = () => openCustomer();
window.editCustomer = id => openCustomer(customers.find(c => c.id === id));

$("customerForm").onsubmit = async e => {
  e.preventDefault();
  const row = {
    name: $("customerName").value, phone: $("customerPhone").value, email: $("customerEmail").value,
    street: $("customerStreet").value, city: $("customerCity").value, state: $("customerState").value,
    zip: $("customerZip").value, gate_code: $("customerGateCode").value, alarm_code: $("customerAlarmCode").value,
    parking: $("customerParking").value, key_location: $("customerKeyLocation").value,
    entry_instructions: $("customerEntryInstructions").value, pets: $("customerPets").value,
    birthday: $("customerBirthday").value || null, referral: $("customerReferral").value,
    recurring: $("customerRecurring").value || null,
    properties: $("customerProperties").value.split("\n").map(s => s.trim()).filter(Boolean),
    favorite_employee_id: $("customerFavoriteEmployee").value || null,
    vip: $("customerVip").checked, do_not_book: $("customerDoNotBook").checked,
    notes: $("customerNotes").value
  };
  const id = $("customerId").value;
  if (online) {
    const r = id ? await db.from("customers").update(row).eq("id", id).select().single()
                 : await db.from("customers").insert(row).select().single();
    if (r.error) return toast("Could not save customer");
    if (id) customers = customers.map(c => c.id === id ? r.data : c); else customers.unshift(r.data);
  } else {
    row.id = id || uid(); row.created_at = new Date().toISOString();
    if (id) customers = customers.map(c => c.id === id ? row : c); else customers.unshift(row);
    storeAll();
  }
  $("customerDialog").close(); renderAll(); toast("Customer saved");
};
window.deleteCustomer = async id => {
  if (!confirm("Delete this customer and their jobs?")) return;
  if (online) await db.from("customers").delete().eq("id", id);
  customers = customers.filter(c => c.id !== id);
  jobs = jobs.filter(j => j.customer_id !== id);
  storeAll(); renderAll();
};
function customerSatisfaction(id) {
  const rated = jobs.filter(j => j.customer_id === id && j.satisfaction_rating);
  if (!rated.length) return null;
  return rated.reduce((a, j) => a + j.satisfaction_rating, 0) / rated.length;
}
function renderCustomers() {
  const q = ($("customerSearch").value || "").toLowerCase();
  const rows = customers.filter(c => `${c.name} ${c.street} ${c.city}`.toLowerCase().includes(q));
  $("customersList").innerHTML = rows.map(c => {
    const sat = customerSatisfaction(c.id);
    const daysUntilBday = birthdayCountdown(c.birthday);
    return `
    <article class="record-card">
      <div onclick="editCustomer('${c.id}')" style="cursor:pointer;flex:1">
        <strong>${esc(c.name)}${c.vip ? " ⭐" : ""}${c.do_not_book ? " 🚫" : ""}</strong>
        <p>${esc(c.street)}, ${esc(c.city)}, ${esc(c.state)} ${esc(c.zip || "")}</p>
        <span class="small">${esc(c.phone || "")}${c.email ? " • " + esc(c.email) : ""}${c.gate_code ? " • gate: " + esc(c.gate_code) : ""}</span><br>
        <span class="small">
          ${c.recurring ? "🔁 " + esc(c.recurring) + " • " : ""}
          ${c.favorite_employee_id ? "Favorite: " + esc(employeeName(c.favorite_employee_id)) + " • " : ""}
          ${sat ? "★".repeat(Math.round(sat)) + "☆".repeat(5 - Math.round(sat)) + " • " : ""}
          ${(c.properties || []).length ? c.properties.length + " other propert" + (c.properties.length === 1 ? "y" : "ies") + " • " : ""}
          ${daysUntilBday != null ? "🎂 in " + daysUntilBday + "d" : ""}
        </span>
      </div>
      <div class="record-actions">
        <button onclick="editCustomer('${c.id}')">Edit</button>
        <button onclick="rebookCustomer('${c.id}')">Rebook</button>
        <button onclick="viewCustomerGallery('${c.id}')">Photos</button>
        <button onclick="deleteCustomer('${c.id}')">Delete</button>
      </div>
    </article>`;
  }).join("") || '<div class="card empty-state">No customers found. Add your first one.</div>';
  $("customerSearch").oninput = renderCustomers;
}
function birthdayCountdown(bday) {
  if (!bday) return null;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const [, m, d] = bday.split("-").map(Number);
  let next = new Date(today.getFullYear(), m - 1, d);
  if (next < today) next = new Date(today.getFullYear() + 1, m - 1, d);
  const days = Math.round((next - today) / 86400000);
  return days <= 30 ? days : null;
}
window.viewCustomerGallery = id => {
  const c = customerObj(id);
  const photos = jobs.filter(j => j.customer_id === id).flatMap(j => [...(j.before_photos || []), ...(j.after_photos || [])]);
  if (!photos.length) { toast("No photos on file for this customer yet"); return; }
  const win = window.open("", "_blank");
  win.document.write(`<title>${c.name} — Photos</title><body style="font-family:sans-serif;padding:20px;background:#16202b">
    <h2 style="color:#fff">${c.name} — Photo gallery</h2>
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:10px">
      ${photos.map(p => `<img src="${p}" style="width:100%;border-radius:8px">`).join("")}
    </div></body>`);
};

/* ============================================================
   EMPLOYEES
   ============================================================ */
function openEmployee(e = {}) {
  $("employeeForm").reset();
  $("employeeId").value = e.id || "";
  $("employeeName").value = e.name || "";
  $("employeePhone").value = e.phone || "";
  $("employeePinSet").value = e.pin || "";
  $("employeeRate").value = e.rate || "";
  $("employeeActive").checked = e.active !== false;
  $("employeeDialog").showModal();
}
$("addEmployeeBtn").onclick = () => openEmployee();
window.editEmployee = id => openEmployee(employees.find(e => e.id === id));
$("employeeForm").onsubmit = async e => {
  e.preventDefault();
  const row = {
    name: $("employeeName").value, phone: $("employeePhone").value,
    pin: $("employeePinSet").value, rate: +$("employeeRate").value || 0,
    active: $("employeeActive").checked
  };
  const id = $("employeeId").value;
  if (online) {
    const r = id ? await db.from("employees").update(row).eq("id", id).select().single()
                 : await db.from("employees").insert(row).select().single();
    if (r.error) return toast("Could not save employee");
    if (id) employees = employees.map(x => x.id === id ? r.data : x); else employees.unshift(r.data);
  } else {
    row.id = id || uid();
    if (id) employees = employees.map(x => x.id === id ? row : x); else employees.unshift(row);
    storeAll();
  }
  $("employeeDialog").close(); renderAll(); toast("Employee saved");
};
window.deleteEmployee = async id => {
  if (!confirm("Remove this employee? Their past jobs stay on record.")) return;
  if (online) await db.from("employees").delete().eq("id", id);
  employees = employees.filter(e => e.id !== id);
  storeAll(); renderAll();
};
function renderEmployeesList() {
  $("employeesList").innerHTML = employees.map(e => `
    <article class="record-card">
      <div>
        <strong>${esc(e.name)}</strong>
        <p>${esc(e.phone || "No phone on file")}${e.rate ? " • $" + e.rate + "/hr" : ""}</p>
        <span class="small">${e.active !== false ? "Active" : "Inactive"} • PIN set</span>
      </div>
      <div class="record-actions">
        <button onclick="editEmployee('${e.id}')">Edit</button>
        <button onclick="deleteEmployee('${e.id}')">Remove</button>
      </div>
    </article>`).join("") || '<div class="card empty-state">No employees yet. Add your crew to enable employee sign-in.</div>';
}

/* ============================================================
   JOBS — estimate, pricing, CRUD
   ============================================================ */
function calcEstimate() {
  let m = +($("kitchenSize").value || 0);
  roomKeys.forEach(id => m += +$(id).value * timeRules[id][1]);
  document.querySelectorAll(".extra:checked").forEach(x => m += +x.dataset.minutes);
  const c = +document.querySelector('input[name="condition"]:checked').value;
  m *= c;
  $("jobEstimate").textContent = minsText(m);

  let rate = settings.rate || 0;
  const serviceType = $("jobServiceType").value;
  if (serviceType === "commercial") rate *= (settings.commercialMult || 1);
  if (serviceType === "airbnb") rate *= (settings.airbnbMult || 1);

  let price = Math.max(settings.minPrice || 0, Math.round((m / 60) * rate));
  const custId = $("jobCustomer").value;
  const cust = custId ? customerObj(custId) : null;
  if (cust && cust.recurring) price = Math.round(price * (1 - (settings.recurringDiscount || 0) / 100));

  $("jobPrice").textContent = money(price);
  return { minutes: Math.round(m), price };
}
document.querySelectorAll("#jobForm input,#jobForm select,#jobForm textarea").forEach(x => x.addEventListener("change", calcEstimate));
$("jobIsQuote").addEventListener("change", () => {
  $("jobQuoteExpiryWrap").style.display = $("jobIsQuote").checked ? "" : "none";
});
$("jobCustomer").addEventListener("change", () => {
  const c = customerObj($("jobCustomer").value);
  $("jobProperty").innerHTML = `<option value="">${esc(c.street || "Primary address")}</option>` +
    (c.properties || []).map(p => `<option value="${esc(p)}">${esc(p)}</option>`).join("");
  if (c.do_not_book) toast("⚠️ This customer is flagged do-not-book");
  calcEstimate();
});

function openJob(existing = null) {
  $("jobForm").reset();
  roomKeys.forEach(id => $(id).value = 0);
  $("kitchenSize").value = 35;
  $("jobDate").value = todayStr();
  $("jobId").value = "";
  $("jobDialogTitle").textContent = "Create job";
  $("jobSaveBtn").textContent = "Save job";
  $("jobQuoteExpiryWrap").style.display = "none";
  renderSelects();

  if (existing) {
    $("jobId").value = existing.id;
    $("jobDialogTitle").textContent = "Edit job";
    $("jobSaveBtn").textContent = "Save changes";
    $("jobCustomer").value = existing.customer_id;
    $("jobCustomer").dispatchEvent(new Event("change"));
    $("jobProperty").value = existing.property || "";
    $("jobEmployee").value = existing.employee_id || "";
    $("jobDate").value = existing.service_date;
    $("jobArrival").value = existing.arrival_window || "";
    $("jobServiceType").value = existing.service_type || "residential";
    $("jobIsQuote").checked = existing.status === "quote";
    $("jobQuoteExpiryWrap").style.display = $("jobIsQuote").checked ? "" : "none";
    $("jobQuoteExpiry").value = existing.quote_expiry || "";
    const rd = existing.room_data || {};
    roomKeys.forEach(id => $(id).value = rd[id] || 0);
    $("kitchenSize").value = rd.kitchenSize || 35;
    document.querySelectorAll(".extra").forEach(x => x.checked = (existing.extras || []).includes(x.dataset.label));
    const condEntry = Object.entries(conditionNames).find(([, name]) => name === existing.condition_name);
    if (condEntry) document.querySelector(`input[name="condition"][value="${condEntry[0]}"]`).checked = true;
    $("jobNotes").value = existing.notes || "";
  }
  calcEstimate();
  $("jobDialog").showModal();
}
document.querySelectorAll("[data-open-job]").forEach(b => b.onclick = () => openJob());
window.editJob = id => openJob(jobs.find(j => j.id === id));

$("jobForm").onsubmit = async e => {
  e.preventDefault();
  const rooms = {}; roomKeys.forEach(id => rooms[id] = +$(id).value);
  rooms.kitchenSize = +$("kitchenSize").value;
  const extras = [...document.querySelectorAll(".extra:checked")].map(x => x.dataset.label);
  const cv = document.querySelector('input[name="condition"]:checked').value;
  const est = calcEstimate();
  const editingId = $("jobId").value;
  const empId = $("jobEmployee").value || null;
  const date = $("jobDate").value;

  const conflict = jobs.find(j => j.id !== editingId && j.employee_id === empId && j.service_date === date && j.status !== "completed");
  if (empId && conflict && !confirm(`${employeeName(empId)} already has a job on ${date}. Schedule anyway?`)) return;

  const isQuote = $("jobIsQuote").checked;
  const row = {
    customer_id: $("jobCustomer").value, property: $("jobProperty").value || null, employee_id: empId,
    service_date: date, arrival_window: $("jobArrival").value, service_type: $("jobServiceType").value,
    status: isQuote ? "quote" : (editingId ? undefined : "scheduled"),
    quote_expiry: isQuote ? ($("jobQuoteExpiry").value || null) : null,
    estimated_minutes: est.minutes, price: est.price,
    condition_name: conditionNames[cv], room_data: rooms, extras, notes: $("jobNotes").value
  };
  if (row.status === undefined) delete row.status;

  if (editingId) {
    const j = jobs.find(x => x.id === editingId);
    Object.assign(j, row);
    if (online) await db.from("jobs").update(row).eq("id", editingId);
    storeAll();
  } else {
    Object.assign(row, {
      actual_minutes: null, before_photos: [], after_photos: [], signature: null, checklist: {},
      payment_status: "unpaid", payment_method: null, amount_paid: 0
    });
    if (online) {
      const r = await db.from("jobs").insert(row).select().single();
      if (r.error) return toast("Could not save job");
      jobs.push(r.data);
    } else { row.id = uid(); jobs.push(row); storeAll(); }
  }
  $("jobDialog").close(); renderAll(); toast(editingId ? "Job updated" : "Job saved");
};
window.approveQuote = async id => {
  const j = jobs.find(x => x.id === id);
  j.status = "scheduled";
  if (online) await db.from("jobs").update({ status: "scheduled" }).eq("id", id);
  storeAll(); renderAll(); toast("Quote approved — now on the schedule");
};
window.toggleComplete = async id => {
  const j = jobs.find(x => x.id === id);
  const status = j.status === "completed" ? "scheduled" : "completed";
  if (online) await db.from("jobs").update({ status }).eq("id", id);
  j.status = status; storeAll(); renderAll();
};
window.deleteJob = async id => {
  if (!confirm("Delete this job?")) return;
  if (online) await db.from("jobs").delete().eq("id", id);
  jobs = jobs.filter(j => j.id !== id);
  storeAll(); renderAll();
};
window.recordPayment = async id => {
  const j = jobs.find(x => x.id === id);
  const method = prompt("Payment method (Cash, Card, Check, Other):", j.payment_method || "Card");
  if (method === null) return;
  const amountStr = prompt("Amount received:", j.amount_paid || j.price || 0);
  if (amountStr === null) return;
  const amount = +amountStr || 0;
  const row = { payment_method: method, amount_paid: amount, payment_status: amount > 0 ? "paid" : "unpaid" };
  if (online) await db.from("jobs").update(row).eq("id", id);
  Object.assign(j, row);
  storeAll(); renderAll(); toast("Payment recorded");
};
window.rebookCustomer = id => {
  openJob();
  $("jobCustomer").value = id;
  $("jobCustomer").dispatchEvent(new Event("change"));
  toast("Job pre-filled for this customer — adjust and save");
};
window.rateJob = async id => {
  const j = jobs.find(x => x.id === id);
  const val = prompt("Customer satisfaction, 1-5 stars:", j.satisfaction_rating || 5);
  if (val === null) return;
  const rating = Math.max(1, Math.min(5, +val || 5));
  if (online) await db.from("jobs").update({ satisfaction_rating: rating }).eq("id", id);
  j.satisfaction_rating = rating; storeAll(); renderAll(); toast("Rating saved");
};
function renderJobs() {
  const q = ($("jobSearch").value || "").toLowerCase(), f = $("jobFilter").value;
  const rows = jobs.filter(j => (f === "all" || j.status === f) &&
    `${customerName(j.customer_id)} ${customerObj(j.customer_id).street || ""} ${employeeName(j.employee_id)}`.toLowerCase().includes(q))
    .sort((a, b) => a.service_date < b.service_date ? 1 : -1);
  $("jobsList").innerHTML = rows.map(j => {
    const progress = { quote: 10, scheduled: 35, in_progress: 70, completed: 100 }[j.status] || 0;
    return `
    <article class="record-card" style="flex-direction:column;align-items:stretch">
      <div style="display:flex;justify-content:space-between;align-items:center;gap:14px;flex-wrap:wrap">
        <div onclick="editJob('${j.id}')" style="cursor:pointer;flex:1;min-width:180px">
          <strong>${esc(customerName(j.customer_id))}${j.reclean_requested ? " 🔁" : ""}</strong>
          <p>${esc(j.property || customerObj(j.customer_id).street || "")} • ${j.service_date}${j.arrival_window ? " • " + esc(j.arrival_window) : ""}</p>
          <span class="small">${minsText(j.estimated_minutes)} • ${money(j.price)} • ${esc(employeeName(j.employee_id))} • ${esc(j.service_type || "residential")}</span>
        </div>
        <span class="badge ${j.status}">${j.status.replace("_", " ")}</span>
        <span class="badge ${j.payment_status === "paid" ? "completed" : "scheduled"}">${j.payment_status === "paid" ? "Paid" : "Unpaid"}</span>
      </div>
      <div style="height:6px;background:var(--line);border-radius:4px;margin:10px 0;overflow:hidden">
        <div style="height:100%;width:${progress}%;background:var(--teal)"></div>
      </div>
      <div class="record-actions">
        ${j.status === "quote" ? `<button onclick="approveQuote('${j.id}')">Approve quote</button>` : ""}
        <button onclick="editJob('${j.id}')">Edit</button>
        <button onclick="printJob('${j.id}')">Print</button>
        <button onclick="printInvoice('${j.id}')">Invoice</button>
        <button onclick="recordPayment('${j.id}')">${j.payment_status === "paid" ? "Edit payment" : "Record payment"}</button>
        <button onclick="rebookCustomer('${j.customer_id}')">Rebook</button>
        ${j.status === "completed" ? `<button onclick="rateJob('${j.id}')">${j.satisfaction_rating ? "★".repeat(j.satisfaction_rating) : "Rate"}</button>` : ""}
        <button onclick="toggleComplete('${j.id}')">${j.status === "completed" ? "Reopen" : "Mark done"}</button>
        <button onclick="deleteJob('${j.id}')">Delete</button>
      </div>
    </article>`;
  }).join("") || '<div class="card empty-state">No jobs found.</div>';
  $("jobSearch").oninput = renderJobs; $("jobFilter").onchange = renderJobs;
}
function employeeName(id) { const e = employees.find(x => x.id === id); return e ? e.name : "Unassigned"; }

/* ============================================================
   MILEAGE
   ============================================================ */
function openTrip() {
  $("tripForm").reset(); $("tripDate").value = todayStr(); renderSelects();
  $("tripDialog").showModal();
}
$("addTripBtn").onclick = openTrip;
$("empAddTripBtn").onclick = openTrip;
$("odoStart").oninput = $("odoEnd").oninput = () => {
  const a = +$("odoStart").value, b = +$("odoEnd").value;
  if (b >= a && a > 0) $("tripMiles").value = (b - a).toFixed(1);
};
$("tripForm").onsubmit = async e => {
  e.preventDefault();
  const row = {
    trip_date: $("tripDate").value, job_id: $("tripJob").value || null, purpose: $("tripPurpose").value,
    start_location: $("tripStart").value, end_location: $("tripEnd").value,
    odometer_start: +$("odoStart").value || null, odometer_end: +$("odoEnd").value || null,
    miles: +$("tripMiles").value, vehicle: $("tripVehicle").value, notes: $("tripNotes").value,
    employee_id: session && session.role === "employee" ? session.employeeId : null
  };
  if (online) {
    const r = await db.from("mileage").insert(row).select().single();
    if (r.error) return toast("Could not save trip");
    mileage.unshift(r.data);
  } else { row.id = uid(); mileage.unshift(row); storeAll(); }
  $("tripDialog").close(); renderAll(); renderEmployeeMileage(); toast("Mileage saved");
};
window.deleteTrip = async id => {
  if (!confirm("Delete this trip?")) return;
  if (online) await db.from("mileage").delete().eq("id", id);
  mileage = mileage.filter(t => t.id !== id);
  storeAll(); renderAll(); renderEmployeeMileage();
};
function renderMileage() {
  const total = mileage.reduce((a, b) => a + (+b.miles || 0), 0);
  const now = new Date();
  const month = mileage.filter(t => { const d = new Date(t.trip_date + "T12:00"); return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear(); })
    .reduce((a, b) => a + (+b.miles || 0), 0);
  $("mileTotal").textContent = total.toFixed(1);
  $("tripCount").textContent = mileage.length;
  $("monthMiles").textContent = month.toFixed(1);
  $("mileageList").innerHTML = mileage.length ? `<table><thead><tr><th>Date</th><th>Purpose</th><th>From</th><th>To</th><th>Miles</th><th>Vehicle</th><th>Driver</th><th></th></tr></thead><tbody>${
    mileage.map(t => `<tr><td>${t.trip_date}</td><td>${esc(t.purpose)}</td><td>${esc(t.start_location || "")}</td><td>${esc(t.end_location || "")}</td><td>${(+t.miles).toFixed(1)}</td><td>${esc(t.vehicle || "")}</td><td>${esc(employeeName(t.employee_id))}</td><td><button onclick="deleteTrip('${t.id}')">Delete</button></td></tr>`).join("")
  }</tbody></table>` : '<div class="empty-state">No mileage logged yet.</div>';
}
function renderEmployeeMileage() {
  if (!session || session.role !== "employee") return;
  const mine = mileage.filter(t => t.employee_id === session.employeeId);
  $("empMileageList").innerHTML = mine.length ? `<table><thead><tr><th>Date</th><th>Purpose</th><th>Miles</th><th></th></tr></thead><tbody>${
    mine.map(t => `<tr><td>${t.trip_date}</td><td>${esc(t.purpose)}</td><td>${(+t.miles).toFixed(1)}</td><td><button onclick="deleteTrip('${t.id}')">Delete</button></td></tr>`).join("")
  }</tbody></table>` : '<div class="empty-state">No trips logged yet. Log every business drive for your tax records.</div>';
}

/* ============================================================
   DASHBOARD
   ============================================================ */
function renderDashboard() {
  const todays = jobs.filter(j => isToday(j.service_date));
  $("statJobsToday").textContent = todays.length;
  $("statEmpToday").textContent = new Set(todays.filter(j => j.employee_id).map(j => j.employee_id)).size;
  $("statRevToday").textContent = money(todays.reduce((a, j) => a + (+j.price || 0), 0));
  $("statDoneToday").textContent = todays.filter(j => j.status === "completed").length;

  $("dashboardJobs").innerHTML = todays.slice(0, 6).map(j => `
    <div class="list-item">
      <div><strong>${esc(customerName(j.customer_id))}</strong><p>${esc(customerObj(j.customer_id).street || "")}</p>
      <span class="small">${esc(j.arrival_window || "")} • ${esc(employeeName(j.employee_id))}</span></div>
      <span class="badge ${j.status}">${j.status.replace("_", " ")}</span>
    </div>`).join("") || "No jobs scheduled today.";

  const crew = employees.filter(e => todays.some(j => j.employee_id === e.id));
  $("dashboardCrew").innerHTML = crew.map(e => {
    const eJobs = todays.filter(j => j.employee_id === e.id);
    return `<div class="list-item"><div><strong>${esc(e.name)}</strong><p>${eJobs.length} job${eJobs.length === 1 ? "" : "s"} today</p></div>
      <span class="badge ${eJobs.every(j => j.status === "completed") ? "completed" : "in_progress"}">${eJobs.every(j => j.status === "completed") ? "done" : "on shift"}</span></div>`;
  }).join("") || "No one scheduled today.";

  $("dashboardMiles").innerHTML = mileage.slice(0, 5).map(t => `
    <div class="list-item"><div><strong>${esc(t.purpose)}</strong><p>${esc(t.start_location || "")} → ${esc(t.end_location || "")}</p></div>
    <strong>${(+t.miles).toFixed(1)} mi</strong></div>`).join("") || "No mileage logged yet.";

  const upcoming = customers.map(c => ({ c, days: birthdayCountdown(c.birthday) })).filter(x => x.days != null).sort((a, b) => a.days - b.days);
  $("dashboardBirthdays").innerHTML = upcoming.map(({ c, days }) => `
    <div class="list-item"><div><strong>${esc(c.name)}</strong><p>${days === 0 ? "Today!" : "In " + days + " day" + (days === 1 ? "" : "s")}</p></div></div>
  `).join("") || "No birthdays in the next 30 days.";
}

/* ============================================================
   REPORTS
   ============================================================ */
function renderReports() {
  const rows = employees.map(e => {
    const eJobs = jobs.filter(j => j.employee_id === e.id && j.status === "completed");
    const avgEst = eJobs.length ? eJobs.reduce((a, j) => a + (j.estimated_minutes || 0), 0) / eJobs.length : 0;
    const withActual = eJobs.filter(j => j.actual_minutes);
    const avgActual = withActual.length ? withActual.reduce((a, j) => a + j.actual_minutes, 0) / withActual.length : null;
    return { name: e.name, count: eJobs.length, avgEst, avgActual };
  }).sort((a, b) => b.count - a.count);
  $("reportsPerf").innerHTML = rows.length ? `<table><thead><tr><th>#</th><th>Employee</th><th>Jobs done</th><th>Avg. estimate</th><th>Avg. actual</th></tr></thead><tbody>${
    rows.map((r, i) => `<tr><td>${i + 1}</td><td style="font-family:inherit">${esc(r.name)}</td><td>${r.count}</td><td>${minsText(r.avgEst)}</td><td>${r.avgActual != null ? minsText(r.avgActual) : "—"}</td></tr>`).join("")
  }</tbody></table>` : '<p class="muted">No completed jobs yet.</p>';

  const withBoth = jobs.filter(j => j.status === "completed" && j.actual_minutes);
  const diffs = withBoth.map(j => Math.abs(j.actual_minutes - j.estimated_minutes));
  const avgDiff = diffs.length ? diffs.reduce((a, b) => a + b, 0) / diffs.length : null;
  $("reportsAccuracy").innerHTML = avgDiff != null
    ? `<div class="list-item"><div><strong>${withBoth.length} completed jobs with timer data</strong><p>Average estimate was off by ${minsText(avgDiff)}</p></div></div>`
    : `<div class="list-item"><div><strong>No timer data yet</strong><p>Estimates sharpen automatically as employees use start/finish timers on jobs.</p></div></div>`;

  const done = jobs.filter(j => j.status === "completed");
  const now = new Date();
  const sumSince = days => { const cutoff = new Date(now); cutoff.setDate(cutoff.getDate() - days);
    return done.filter(j => new Date(j.service_date + "T12:00") >= cutoff).reduce((a, j) => a + (+j.price || 0), 0); };
  $("reportsIncome").innerHTML = `
    <article class="stat"><span>Today</span><strong>${money(done.filter(j => isToday(j.service_date)).reduce((a, j) => a + (+j.price || 0), 0))}</strong></article>
    <article class="stat"><span>Last 7 days</span><strong>${money(sumSince(7))}</strong></article>
    <article class="stat"><span>Last 30 days</span><strong>${money(sumSince(30))}</strong></article>`;

  const profitRows = done.slice(0, 25).map(j => {
    const emp = employees.find(e => e.id === j.employee_id);
    const laborCost = emp && j.actual_minutes ? (j.actual_minutes / 60) * (emp.rate || 0) : 0;
    return { name: customerName(j.customer_id), date: j.service_date, price: j.price || 0, cost: laborCost, profit: (j.price || 0) - laborCost };
  });
  $("reportsProfit").innerHTML = profitRows.length ? `<table><thead><tr><th>Customer</th><th>Date</th><th>Price</th><th>Labor cost</th><th>Profit</th></tr></thead><tbody>${
    profitRows.map(r => `<tr><td style="font-family:inherit">${esc(r.name)}</td><td>${r.date}</td><td>${money(r.price)}</td><td>${money(r.cost)}</td><td>${money(r.profit)}</td></tr>`).join("")
  }</tbody></table>` : '<p class="muted">No completed jobs yet.</p>';
}

/* ============================================================
   PAYROLL
   ============================================================ */
function renderPayroll() {
  if (!$("payrollFrom").value) { const d = new Date(); d.setDate(d.getDate() - 7); $("payrollFrom").value = d.toISOString().slice(0, 10); }
  if (!$("payrollTo").value) $("payrollTo").value = todayStr();
  $("payrollFrom").onchange = $("payrollTo").onchange = renderPayroll;
  const from = $("payrollFrom").value, to = $("payrollTo").value;
  const inRange = jobs.filter(j => j.service_date >= from && j.service_date <= to && j.actual_minutes);
  const rows = employees.map(e => {
    const eJobs = inRange.filter(j => j.employee_id === e.id);
    const mins = eJobs.reduce((a, j) => a + j.actual_minutes, 0);
    const hours = mins / 60;
    const pay = hours * (e.rate || 0);
    return { name: e.name, jobs: eJobs.length, hours, pay };
  }).filter(r => r.jobs > 0);
  $("payrollList").innerHTML = rows.length ? `<table><thead><tr><th>Employee</th><th>Jobs</th><th>Hours</th><th>Pay</th></tr></thead><tbody>${
    rows.map(r => `<tr><td style="font-family:inherit">${esc(r.name)}</td><td>${r.jobs}</td><td>${r.hours.toFixed(1)}</td><td>${money(r.pay)}</td></tr>`).join("")
  }</tbody></table>` : '<p class="muted">No completed, timed jobs in this range yet.</p>';
}
$("exportPayrollBtn").onclick = () => {
  const from = $("payrollFrom").value, to = $("payrollTo").value;
  const inRange = jobs.filter(j => j.service_date >= from && j.service_date <= to && j.actual_minutes);
  const rows = employees.map(e => {
    const eJobs = inRange.filter(j => j.employee_id === e.id);
    const hours = eJobs.reduce((a, j) => a + j.actual_minutes, 0) / 60;
    return { employee: e.name, jobs_completed: eJobs.length, hours: hours.toFixed(2), pay: (hours * (e.rate || 0)).toFixed(2) };
  }).filter(r => r.jobs_completed > 0);
  csv("randys-payroll.csv", rows);
};

/* ============================================================
   SETTINGS
   ============================================================ */
$("settingsForm").onsubmit = e => {
  e.preventDefault();
  settings.rate = +$("setRate").value || 0;
  settings.minPrice = +$("setMinPrice").value || 0;
  settings.commercialMult = +$("setCommercialMult").value || 1;
  settings.airbnbMult = +$("setAirbnbMult").value || 1;
  settings.recurringDiscount = +$("setRecurringDiscount").value || 0;
  storeAll(); toast("Pricing saved");
};
$("pinForm").onsubmit = e => {
  e.preventDefault();
  const v = $("setAdminPin").value.trim();
  if (v.length < 4) return toast("PIN must be at least 4 digits");
  settings.adminPin = v; storeAll(); $("setAdminPin").value = ""; toast("Admin PIN updated");
};

/* ============================================================
   CSV EXPORT
   ============================================================ */
function csv(name, rows) {
  if (!rows.length) return toast("Nothing to export");
  const headers = Object.keys(rows[0]);
  const body = [headers.join(","), ...rows.map(r => headers.map(h => `"${String(r[h] ?? "").replaceAll('"', '""')}"`).join(","))].join("\n");
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([body], { type: "text/csv" }));
  a.download = name; a.click();
}
$("exportMileageBtn").onclick = () => csv("randys-mileage-log.csv", mileage);
$("exportJobsBtn").onclick = () => csv("randys-jobs.csv", jobs.map(j => ({
  ...j, customer_name: customerName(j.customer_id), employee_name: employeeName(j.employee_id),
  address: customerObj(j.customer_id).street || "", room_data: JSON.stringify(j.room_data), extras: JSON.stringify(j.extras)
})));
$("exportCustomersBtn") && ($("exportCustomersBtn").onclick = () => csv("randys-customers.csv", customers));

/* ============================================================
   PRINT WORK ORDER
   ============================================================ */
window.printJob = id => {
  const j = jobs.find(x => x.id === id), c = customerObj(j.customer_id);
  const rooms = Object.entries(j.room_data || {}).filter(([k, v]) => v && k !== "kitchenSize")
    .map(([k, v]) => `<li>${esc(timeRules[k]?.[0] || k)}: ${v}</li>`).join("") +
    ((j.room_data || {}).kitchenSize ? `<li>Kitchen: included</li>` : "");
  $("printSheet").innerHTML = `
    <div class="print-header"><div><strong>Randy's Cleaning Pros</strong><br>Work Order</div><div>${j.service_date}</div></div>
    <div class="print-body">
      <h1>${esc(c.name || "Customer")}</h1>
      <p>${esc(c.street || "")}, ${esc(c.city || "")}, ${esc(c.state || "")} ${esc(c.zip || "")}</p>
      ${c.gate_code ? `<p>Gate/entry code: ${esc(c.gate_code)}</p>` : ""}
      ${c.parking ? `<p>Parking: ${esc(c.parking)}</p>` : ""}
      ${c.pets ? `<p>Pets: ${esc(c.pets)}</p>` : ""}
      <div class="print-time"><strong>${minsText(j.estimated_minutes)}</strong><br>Estimated labor time</div>
      <div class="print-grid">
        <div class="print-box"><h3>Job details</h3><p>Employee: ${esc(employeeName(j.employee_id))}</p><p>Arrival: ${esc(j.arrival_window || "Not set")}</p><p>Condition: ${esc(j.condition_name || "Good")}</p></div>
        <div class="print-box"><h3>Rooms and areas</h3><ul>${rooms}</ul></div>
        <div class="print-box"><h3>Included</h3><ul><li>Standard surface cleaning</li><li>Bathrooms and kitchen</li><li>Vacuuming and mopping</li><li><strong>Baseboards included</strong></li></ul></div>
        <div class="print-box"><h3>Extras</h3><p>${(j.extras || []).map(esc).join(", ") || "None"}</p></div>
        <div class="print-box full"><h3>Special instructions</h3><p>${esc(j.notes || "None")}</p></div>
        <div class="print-box full"><h3>Completion checklist</h3><p>${checklistItems.map(c => "☐ " + esc(c)).join(" &nbsp; ")}</p>
          <div class="signature-line">Employee signature</div><div class="signature-line">Customer signature / completion time</div></div>
      </div>
    </div>`;
  window.print();
};
$("printCurrentBtn") && ($("printCurrentBtn").onclick = () => activeJobId ? printJob(activeJobId) : toast("Open a job first"));

window.printInvoice = id => {
  const j = jobs.find(x => x.id === id), c = customerObj(j.customer_id);
  const invoiceNum = "INV-" + j.id.slice(0, 8).toUpperCase();
  const balance = (j.price || 0) - (j.amount_paid || 0);
  $("printSheet").innerHTML = `
    <div class="print-header"><div><strong>Randy's Cleaning Pros</strong><br>Invoice ${invoiceNum}</div><div>${j.service_date}</div></div>
    <div class="print-body">
      <h1>${esc(c.name || "Customer")}</h1>
      <p>${esc(c.street || "")}, ${esc(c.city || "")}, ${esc(c.state || "")} ${esc(c.zip || "")}</p>
      ${c.phone ? `<p>${esc(c.phone)}</p>` : ""}
      <div class="print-grid" style="margin-top:18px">
        <div class="print-box full">
          <h3>Service</h3>
          <table style="width:100%;border-collapse:collapse">
            <tr><td style="padding:6px 0">Cleaning service — ${esc(j.condition_name || "Standard")} (${minsText(j.estimated_minutes)})</td><td style="text-align:right">${money(j.price)}</td></tr>
            ${(j.extras || []).map(x => `<tr><td style="padding:6px 0;color:#5B6B7A">+ ${esc(x)}</td><td></td></tr>`).join("")}
          </table>
        </div>
        <div class="print-box"><h3>Total</h3><p style="font-size:1.3rem;font-weight:700">${money(j.price)}</p></div>
        <div class="print-box"><h3>Payment status</h3>
          <p>${j.payment_status === "paid" ? "Paid" : "Unpaid"}${j.payment_method ? " via " + esc(j.payment_method) : ""}</p>
          <p>Amount received: ${money(j.amount_paid || 0)}</p>
          <p><strong>Balance due: ${money(Math.max(0, balance))}</strong></p>
        </div>
        <div class="print-box full"><p class="muted">Thank you for choosing Randy's Cleaning Pros. Questions about this invoice? Call 1-877-207-3123.</p></div>
      </div>
    </div>`;
  window.print();
};

/* ============================================================
   EMPLOYEE PORTAL — today's jobs, timer, photos, checklist, signature
   ============================================================ */
function renderEmployeeToday() {
  const mine = jobs.filter(j => j.employee_id === session.employeeId && isToday(j.service_date))
    .sort((a, b) => (a.arrival_window || "").localeCompare(b.arrival_window || ""));
  $("empJobsList").innerHTML = mine.map(j => {
    const c = customerObj(j.customer_id);
    const initial = (c.name || "?").trim().charAt(0).toUpperCase();
    const statusWord = { scheduled: "Not started", in_progress: "In progress", completed: "Done! ✅", quote: "Quote" }[j.status] || j.status;
    return `
    <div class="big-job-card status-${j.status}" onclick="openEmployeeJob('${j.id}')">
      <div class="avatar">${esc(initial)}</div>
      <div class="info">
        <strong>${esc(c.name || "Customer")}</strong>
        <p>🕐 ${esc(j.arrival_window || "Anytime")} • ${statusWord}</p>
      </div>
      <div class="go-arrow">➡️</div>
    </div>`;
  }).join("") || '<div class="card empty-state">🎉 No jobs today. Enjoy your day off!</div>';
}

window.openEmployeeJob = id => {
  activeJobId = id;
  renderEmployeeJobDetail();
  eNav("empJobDetail");
};

function renderEmployeeJobDetail() {
  const j = jobs.find(x => x.id === activeJobId);
  if (!j) return;
  const c = customerObj(j.customer_id);
  const address = j.property || `${c.street || ""}, ${c.city || ""}, ${c.state || ""} ${c.zip || ""}`;
  const gpsUrl = "https://www.google.com/maps/dir/?api=1&destination=" + encodeURIComponent(address);
  const checklist = j.checklist || {};
  const done = checklistComplete(j);

  $("empJobDetailBody").innerHTML = `
    <div class="step-card">
      <div class="step-label"><span class="step-num">i</span> ${esc(c.name || "Customer")}</div>
      ${c.vip ? `<div class="info-line"><span class="ic">⭐</span> VIP customer — extra care!</div>` : ""}
      ${c.do_not_book ? `<div class="info-line"><span class="ic">🚫</span> Flagged — check with your boss</div>` : ""}
      <div class="info-line"><span class="ic">📍</span> ${esc(address)}</div>
      ${c.gate_code ? `<div class="info-line"><span class="ic">🔑</span> Gate code: <strong>${esc(c.gate_code)}</strong></div>` : ""}
      ${c.alarm_code ? `<div class="info-line"><span class="ic">🔔</span> Alarm code: <strong>${esc(c.alarm_code)}</strong></div>` : ""}
      ${c.key_location ? `<div class="info-line"><span class="ic">🗝️</span> Key: ${esc(c.key_location)}</div>` : ""}
      ${c.entry_instructions ? `<div class="info-line"><span class="ic">🚪</span> ${esc(c.entry_instructions)}</div>` : ""}
      ${c.parking ? `<div class="info-line"><span class="ic">🚗</span> Parking: ${esc(c.parking)}</div>` : ""}
      ${c.pets ? `<div class="info-line"><span class="ic">🐾</span> Pets: ${esc(c.pets)}</div>` : ""}
      ${j.notes ? `<div class="info-line"><span class="ic">📝</span> ${esc(j.notes)}</div>` : ""}
    </div>

    <div class="step-card">
      <div class="step-label"><span class="step-num">1</span> Get there</div>
      <a class="btn primary big-tap" href="${gpsUrl}" target="_blank" rel="noopener">🚗 Drive there now</a>
    </div>

    <div class="step-card">
      <div class="step-label"><span class="step-num">2</span> Track your time</div>
      <div class="big-timer" id="timerDisplay">${timerText(j)}</div>
      ${!j.started_at ? `<button class="btn primary big-tap" onclick="startTimer('${j.id}')">▶️ I'm starting now</button>` : ""}
      ${j.started_at && !j.finished_at ? `<button class="btn primary big-tap" onclick="finishTimer('${j.id}')" ${done ? "" : "disabled"}>🏁 I'm all done</button>` : ""}
      ${j.finished_at ? `<div class="big-tap" style="background:var(--green-bg);color:var(--green)">✅ Finished in ${minsText(j.actual_minutes)}</div>` : ""}
      ${j.started_at && !j.finished_at && !done ? `<p class="muted" style="text-align:center">👇 Finish the checklist below first</p>` : ""}
    </div>

    <div class="step-card">
      <div class="step-label"><span class="step-num">3</span> Take photos</div>
      <p class="muted" style="margin-bottom:8px">📸 Before</p>
      <div class="photo-grid" id="beforePhotoGrid"></div>
      <label class="photo-add" style="width:70px;margin-top:8px;display:inline-flex">＋<input type="file" accept="image/*" capture="environment" style="display:none" onchange="addPhoto('${j.id}','before_photos',this)"></label>
      <p class="muted" style="margin:14px 0 8px">✨ After</p>
      <div class="photo-grid" id="afterPhotoGrid"></div>
      <label class="photo-add" style="width:70px;margin-top:8px;display:inline-flex">＋<input type="file" accept="image/*" capture="environment" style="display:none" onchange="addPhoto('${j.id}','after_photos',this)"></label>
    </div>

    <div class="step-card">
      <div class="step-label"><span class="step-num">4</span> Gold Standard checklist</div>
      <div class="big-checklist">
        ${checklistItems.map(item => `
          <label>
            <input type="checkbox" ${checklist[item] ? "checked" : ""} onchange="toggleChecklist('${j.id}','${item.replace(/'/g, "\\'")}',this.checked)">
            ✅ ${esc(item)}
          </label>`).join("")}
      </div>
    </div>

    <div class="step-card">
      <div class="step-label"><span class="step-num">5</span> Get a signature</div>
      ${j.signature ? `<img src="${j.signature}" style="max-width:100%;border:1px solid var(--line);border-radius:8px;margin-bottom:10px">` : `<p class="muted" style="margin-bottom:10px">Not signed yet.</p>`}
      <button class="btn primary big-tap" onclick="openSignature('${j.id}')">✍️ ${j.signature ? "Sign again" : "Get signature"}</button>
    </div>

    <div class="step-card">
      <div class="step-label"><span class="step-num">6</span> If anything happened</div>
      <textarea class="stack-form" style="width:100%;min-height:70px;padding:10px 12px;border:1px solid var(--line);border-radius:9px" placeholder="Anything broken, spilled, or unusual?" onchange="saveDamageReport('${j.id}',this.value)">${esc(j.damage_report || "")}</textarea>
      <label class="checklist-item" style="margin-top:8px">
        <input type="checkbox" ${j.reclean_requested ? "checked" : ""} onchange="toggleReclean('${j.id}',this.checked)">
        🔁 This job needs a reclean
      </label>
    </div>

    <button class="btn ghost big-tap" onclick="printJob('${j.id}')">🖨️ Print work order</button>`;

  renderPhotoGrid("beforePhotoGrid", j.before_photos || [], j.id, "before_photos");
  renderPhotoGrid("afterPhotoGrid", j.after_photos || [], j.id, "after_photos");
}

function timerText(j) {
  if (j.finished_at) return minsText(j.actual_minutes);
  if (j.started_at) return "Running…";
  return "Not started";
}
window.startTimer = id => {
  const j = jobs.find(x => x.id === id);
  j.started_at = new Date().toISOString(); j.status = "in_progress";
  storeAll(); renderEmployeeJobDetail(); renderEmployeeToday(); toast("Timer started");
};
window.finishTimer = id => {
  const j = jobs.find(x => x.id === id);
  if (!checklistComplete(j)) { toast("Complete the Gold Standard checklist first"); return; }
  j.finished_at = new Date().toISOString();
  j.actual_minutes = Math.max(1, Math.round((new Date(j.finished_at) - new Date(j.started_at)) / 60000));
  j.status = "completed";
  storeAll(); renderEmployeeJobDetail(); renderEmployeeToday();
  toast("Nice work — job marked complete");
};

function renderPhotoGrid(gridId, photos, jobId, field) {
  const el = $(gridId); if (!el) return;
  el.innerHTML = photos.map((p, i) => `<img src="${p}" onclick="removePhoto('${jobId}','${field}',${i})">`).join("");
}
window.addPhoto = (jobId, field, input) => {
  const file = input.files[0]; if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const maxW = 640, scale = Math.min(1, maxW / img.width);
      canvas.width = img.width * scale; canvas.height = img.height * scale;
      canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL("image/jpeg", 0.7);
      const j = jobs.find(x => x.id === jobId);
      j[field] = j[field] || []; j[field].push(dataUrl);
      storeAll(); renderEmployeeJobDetail(); toast("Photo added");
    };
    img.src = reader.result;
  };
  reader.readAsDataURL(file);
  input.value = "";
};
window.removePhoto = (jobId, field, i) => {
  const j = jobs.find(x => x.id === jobId);
  j[field].splice(i, 1); storeAll(); renderEmployeeJobDetail();
};
window.toggleChecklist = (jobId, item, checked) => {
  const j = jobs.find(x => x.id === jobId);
  j.checklist = j.checklist || {}; j.checklist[item] = checked;
  storeAll(); renderEmployeeJobDetail();
};
function checklistComplete(j) {
  const c = j.checklist || {};
  return checklistItems.every(item => c[item]);
}
window.saveDamageReport = (jobId, text) => {
  const j = jobs.find(x => x.id === jobId);
  j.damage_report = text; storeAll();
  if (online) db.from("jobs").update({ damage_report: text }).eq("id", jobId);
};
window.toggleReclean = (jobId, checked) => {
  const j = jobs.find(x => x.id === jobId);
  j.reclean_requested = checked; storeAll(); renderAll();
  if (online) db.from("jobs").update({ reclean_requested: checked }).eq("id", jobId);
  toast(checked ? "Reclean requested — admin notified on the Jobs list" : "Reclean request cleared");
};

/* ---------- signature pad ---------- */
window.openSignature = jobId => {
  activeJobId = jobId;
  $("signatureDialog").showModal();
  const canvas = $("sigCanvas");
  sigCtx = canvas.getContext("2d");
  sigCtx.clearRect(0, 0, canvas.width, canvas.height);
  sigCtx.lineWidth = 2.2; sigCtx.lineCap = "round"; sigCtx.strokeStyle = "#0B2545";
};
function sigPos(e, canvas) {
  const r = canvas.getBoundingClientRect();
  const p = e.touches ? e.touches[0] : e;
  return { x: (p.clientX - r.left) * (canvas.width / r.width), y: (p.clientY - r.top) * (canvas.height / r.height) };
}
const sigCanvasEl = $("sigCanvas");
["mousedown", "touchstart"].forEach(evt => sigCanvasEl.addEventListener(evt, e => {
  e.preventDefault(); sigDrawing = true; const p = sigPos(e, sigCanvasEl); sigCtx.beginPath(); sigCtx.moveTo(p.x, p.y);
}));
["mousemove", "touchmove"].forEach(evt => sigCanvasEl.addEventListener(evt, e => {
  if (!sigDrawing) return; e.preventDefault(); const p = sigPos(e, sigCanvasEl); sigCtx.lineTo(p.x, p.y); sigCtx.stroke();
}));
["mouseup", "touchend", "mouseleave"].forEach(evt => sigCanvasEl.addEventListener(evt, () => sigDrawing = false));
$("sigClearBtn").onclick = () => sigCtx.clearRect(0, 0, sigCanvasEl.width, sigCanvasEl.height);
$("sigSaveBtn").onclick = () => {
  const j = jobs.find(x => x.id === activeJobId);
  j.signature = sigCanvasEl.toDataURL("image/png");
  storeAll(); $("signatureDialog").close(); renderEmployeeJobDetail(); toast("Signature saved");
};

/* ============================================================
   INIT
   ============================================================ */
async function init() {
  await loadData();
  const saved = JSON.parse(localStorage.getItem("rcp_session") || "null");
  if (saved && saved.role === "admin") { session = saved; enterAdmin(); }
  else if (saved && saved.role === "employee" && employees.some(e => e.id === saved.employeeId)) { session = saved; enterEmployee(); }
  else showGate("roleScreen");
}
init();
