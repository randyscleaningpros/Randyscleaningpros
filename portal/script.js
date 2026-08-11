const $ = (id) => document.getElementById(id);

const quantityFields = [
  "smallBedrooms", "mediumBedrooms", "largeBedrooms", "halfBathrooms",
  "fullBathrooms", "primaryBathrooms", "livingRooms", "diningRooms",
  "homeOffices", "laundryRooms", "stairs", "basements", "attics", "garages"
];

const timeRules = {
  smallBedrooms: { label: "Small bedrooms", minutes: 15 },
  mediumBedrooms: { label: "Medium bedrooms", minutes: 20 },
  largeBedrooms: { label: "Large bedrooms", minutes: 25 },
  halfBathrooms: { label: "Half bathrooms", minutes: 10 },
  fullBathrooms: { label: "Full bathrooms", minutes: 20 },
  primaryBathrooms: { label: "Large primary bathrooms", minutes: 30 },
  livingRooms: { label: "Living / family rooms", minutes: 25 },
  diningRooms: { label: "Dining rooms", minutes: 15 },
  homeOffices: { label: "Home offices", minutes: 15 },
  laundryRooms: { label: "Laundry rooms", minutes: 10 },
  stairs: { label: "Flights of stairs", minutes: 10 },
  basements: { label: "Basements", minutes: 35 },
  attics: { label: "Attics", minutes: 30 },
  garages: { label: "Garages", minutes: 35 }
};

const conditionNames = {
  "0.85": "Excellent",
  "1": "Good",
  "1.2": "Needs attention",
  "1.45": "Heavy cleaning",
  "1.75": "Move-out / deep clean"
};

function populateQuantitySelects() {
  quantityFields.forEach((id) => {
    const select = $(id);
    for (let i = 0; i <= 8; i += 1) {
      const option = document.createElement("option");
      option.value = i;
      option.textContent = i;
      select.appendChild(option);
    }
  });
}

function getConditionValue() {
  const selected = document.querySelector('input[name="condition"]:checked');
  return Number(selected?.value || 1);
}

function getConditionName() {
  const selected = document.querySelector('input[name="condition"]:checked');
  return conditionNames[selected?.value || "1"];
}

function minutesToText(minutes) {
  const rounded = Math.round(minutes / 15) * 15;
  const hours = Math.floor(rounded / 60);
  const mins = rounded % 60;
  if (hours === 0) return `${mins} minutes`;
  if (mins === 0) return `${hours} ${hours === 1 ? "hour" : "hours"}`;
  return `${hours} ${hours === 1 ? "hour" : "hours"} ${mins} minutes`;
}

function calculateBaseMinutes() {
  let minutes = 0;

  Object.entries(timeRules).forEach(([id, rule]) => {
    minutes += Number($(id).value || 0) * rule.minutes;
  });

  minutes += Number($("kitchenSize").value || 0);
  minutes += Number($("windows").value || 0);
  minutes += Number($("fans").value || 0);

  document.querySelectorAll(".extra:checked").forEach((box) => {
    minutes += Number(box.dataset.minutes || 0);
  });

  return minutes;
}

function roomSummary() {
  const items = [];

  Object.entries(timeRules).forEach(([id, rule]) => {
    const count = Number($(id).value || 0);
    if (count > 0) items.push([rule.label, count]);
  });

  const kitchen = $("kitchenSize");
  if (Number(kitchen.value) > 0) {
    items.push(["Kitchen", kitchen.options[kitchen.selectedIndex].text]);
  }

  return items;
}

function extrasSummary() {
  const items = [];
  document.querySelectorAll(".extra:checked").forEach((box) => items.push(box.dataset.label));

  const windows = $("windows");
  if (Number(windows.value) > 0) items.push(`Interior windows: ${windows.options[windows.selectedIndex].text}`);

  const fans = $("fans");
  if (Number(fans.value) > 0) items.push(`Ceiling fans: ${fans.options[fans.selectedIndex].text}`);

  return items;
}

function formatDate(dateString) {
  if (!dateString) return "Not set";
  const date = new Date(`${dateString}T12:00:00`);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function updatePreview() {
  const addressParts = [
    $("streetAddress").value.trim(),
    [$("city").value.trim(), $("state").value.trim()].filter(Boolean).join(", "),
    $("zip").value.trim()
  ].filter(Boolean);

  $("previewAddress").textContent = addressParts.length ? addressParts.join(" ") : "Address will appear here";
  $("previewCustomer").textContent = $("customerName").value.trim() || "Customer name";
  $("previewDate").textContent = formatDate($("serviceDate").value);
  $("previewEmployee").textContent = $("employeeName").value.trim() || "Not assigned";
  $("previewArrival").textContent = $("arrivalWindow").value.trim() || "Not set";

  const adjustedMinutes = calculateBaseMinutes() * getConditionValue();
  const low = Math.max(0, adjustedMinutes * 0.9);
  const high = adjustedMinutes * 1.1;

  $("previewTime").textContent = minutesToText(adjustedMinutes);
  $("previewRange").textContent = `Estimated range: ${minutesToText(low)}–${minutesToText(high)}`;
  $("previewCondition").textContent = getConditionName();

  const roomItems = roomSummary();
  $("previewRooms").innerHTML = roomItems.length
    ? roomItems.map(([label, value]) => `<div class="detail-row"><span>${label}</span><strong>${value}</strong></div>`).join("")
    : "<p>No rooms entered yet.</p>";

  const extraItems = extrasSummary();
  $("previewExtras").innerHTML = extraItems.length
    ? extraItems.map((item) => `<div class="detail-row"><span>${item}</span><strong>✓</strong></div>`).join("")
    : "<p>No extras selected.</p>";

  $("previewNotes").textContent = $("specialNotes").value.trim() || "No special instructions.";
}

function getFormData() {
  const data = {};
  document.querySelectorAll("input, select, textarea").forEach((field) => {
    if (!field.id && field.type !== "radio" && !field.classList.contains("extra")) return;

    if (field.type === "radio") {
      if (field.checked) data.condition = field.value;
    } else if (field.type === "checkbox") {
      data[field.dataset.label] = field.checked;
    } else {
      data[field.id] = field.value;
    }
  });
  data.savedAt = new Date().toISOString();
  data.estimatedMinutes = calculateBaseMinutes() * getConditionValue();
  return data;
}

function applyFormData(data) {
  Object.entries(data).forEach(([key, value]) => {
    const field = $(key);
    if (field && field.type !== "checkbox") field.value = value;
  });

  if (data.condition) {
    const radio = document.querySelector(`input[name="condition"][value="${data.condition}"]`);
    if (radio) radio.checked = true;
  }

  document.querySelectorAll(".extra").forEach((box) => {
    box.checked = Boolean(data[box.dataset.label]);
  });

  updatePreview();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function savedJobs() {
  try {
    return JSON.parse(localStorage.getItem("rcpEmployeeJobs") || "[]");
  } catch {
    return [];
  }
}

function renderSavedJobs() {
  const jobs = savedJobs();
  const container = $("savedJobs");

  if (!jobs.length) {
    container.innerHTML = "<p>No saved jobs yet.</p>";
    return;
  }

  container.innerHTML = jobs.map((job, index) => {
    const title = job.streetAddress || job.customerName || `Job ${index + 1}`;
    const subtitle = [job.city, job.serviceDate ? formatDate(job.serviceDate) : ""].filter(Boolean).join(" • ");
    return `
      <div class="saved-job">
        <div>
          <strong>${escapeHtml(title)}</strong>
          <p>${escapeHtml(job.customerName || "No customer name")}</p>
          <small>${escapeHtml(subtitle)}</small>
        </div>
        <div class="saved-job-actions">
          <button type="button" data-load="${index}">Load</button>
          <button type="button" data-delete="${index}">Delete</button>
        </div>
      </div>
    `;
  }).join("");

  container.querySelectorAll("[data-load]").forEach((button) => {
    button.addEventListener("click", () => applyFormData(jobs[Number(button.dataset.load)]));
  });

  container.querySelectorAll("[data-delete]").forEach((button) => {
    button.addEventListener("click", () => {
      const next = savedJobs();
      next.splice(Number(button.dataset.delete), 1);
      localStorage.setItem("rcpEmployeeJobs", JSON.stringify(next));
      renderSavedJobs();
    });
  });
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  }[char]));
}

function saveJob() {
  const data = getFormData();
  const jobs = savedJobs();
  jobs.unshift(data);
  localStorage.setItem("rcpEmployeeJobs", JSON.stringify(jobs.slice(0, 25)));
  $("saveMessage").textContent = "Job saved on this device.";
  renderSavedJobs();
  setTimeout(() => $("saveMessage").textContent = "", 2500);
}

function clearForm() {
  document.querySelectorAll("input[type='text'], input[type='tel'], input[type='date'], textarea").forEach((field) => {
    field.value = "";
  });
  $("state").value = "ME";
  quantityFields.forEach((id) => $(id).value = "0");
  $("kitchenSize").value = "35";
  $("windows").value = "0";
  $("fans").value = "0";
  document.querySelectorAll(".extra").forEach((box) => box.checked = false);
  document.querySelector('input[name="condition"][value="1"]').checked = true;
  updatePreview();
}

populateQuantitySelects();
renderSavedJobs();
updatePreview();

document.querySelectorAll("input, select, textarea").forEach((field) => {
  field.addEventListener("input", updatePreview);
  field.addEventListener("change", updatePreview);
});

$("calculateBtn").addEventListener("click", () => {
  updatePreview();
  document.querySelector(".preview").scrollIntoView({ behavior: "smooth", block: "start" });
});

$("saveBtn").addEventListener("click", saveJob);
$("printBtn").addEventListener("click", () => {
  updatePreview();
  window.print();
});
$("newJobBtn").addEventListener("click", clearForm);
$("clearSavedBtn").addEventListener("click", () => {
  if (confirm("Delete all saved jobs from this device?")) {
    localStorage.removeItem("rcpEmployeeJobs");
    renderSavedJobs();
  }
});


// ===== Property Assessment + Smart Quote =====
const assessmentQtyIds = [
  "aBedrooms","aFullBaths","aHalfBaths","aKitchens","aLiving",
  "aDining","aOffice","aLaundry","aBasement","aGarage"
];

assessmentQtyIds.forEach((id) => {
  const select = $(id);
  if (select && !select.options.length) {
    for (let i = 0; i <= 10; i += 1) {
      const opt = document.createElement("option");
      opt.value = i;
      opt.textContent = i;
      select.appendChild(opt);
    }
  }
});
$("aBedrooms").value = "2";
$("aFullBaths").value = "1";
$("aKitchens").value = "1";
$("aLiving").value = "1";
$("aDining").value = "1";

function money(value) {
  return `$${Math.round(Number(value || 0)).toLocaleString("en-US")}`;
}

function checkedValues(selector) {
  return Array.from(document.querySelectorAll(selector + ":checked")).map((x) => x.value);
}

function sumCheckedPrices(selector) {
  return Array.from(document.querySelectorAll(selector + ":checked"))
    .reduce((sum, x) => sum + Number(x.dataset.price || 0), 0);
}

function assessmentData() {
  return {
    customerName: $("aCustomerName").value.trim(),
    customerPhone: $("aCustomerPhone").value.trim(),
    address: $("aAddress").value.trim(),
    sqft: Number($("aSqft").value || 0),
    services: {
      cleaning: $("quoteCleaning").checked,
      organization: $("quoteOrganization").checked
    },
    property: Object.fromEntries(assessmentQtyIds.map((id) => [id, Number($(id).value || 0)])),
    cleaning: {
      type: $("aCleaningType").value,
      frequency: $("aFrequency").value,
      condition: $("aCondition").value,
      clutter: $("aClutter").value,
      petHair: $("aPetHair").value,
      floors: $("aFloors").value,
      surfaces: checkedValues(".aSurface"),
      addons: checkedValues(".aCleaningAddon"),
      notes: $("aCleaningNotes").value.trim()
    },
    organization: {
      areas: checkedValues(".aOrgArea"),
      level: $("aOrgLevel").value,
      containers: $("aContainers").value,
      donationSort: $("aDonationSort").checked,
      haulAway: $("aHaulAway").checked,
      labeling: $("aLabeling").checked,
      drawerLiners: $("aDrawerLiners").checked,
      notes: $("aOrgNotes").value.trim()
    },
    access: {
      occupied: $("aOccupied").value,
      parking: $("aParking").value,
      entry: $("aEntry").value.trim(),
      notes: $("aOtherNotes").value.trim()
    }
  };
}

function calculateSmartQuote(data) {
  const p = data.property;
  let cleaning = 0;
  let organization = 0;

  if (data.services.cleaning) {
    cleaning += p.aBedrooms * 32;
    cleaning += p.aFullBaths * 58;
    cleaning += p.aHalfBaths * 32;
    cleaning += p.aKitchens * 68;
    cleaning += p.aLiving * 38;
    cleaning += p.aDining * 27;
    cleaning += p.aOffice * 30;
    cleaning += p.aLaundry * 28;
    cleaning += p.aBasement * 70;
    cleaning += p.aGarage * 65;
    cleaning += Math.max(0, data.sqft - 1200) * .035;

    const typeM = {
      "Standard": 1,
      "Deep Cleaning": 1.55,
      "Ultra Deep": 2.05,
      "Move In": 1.5,
      "Move Out": 1.6,
      "Post-Construction": 1.85
    }[data.cleaning.type] || 1;

    const conditionM = {
      "Very Clean": .88,
      "Average": 1,
      "Needs Attention": 1.18,
      "Heavy": 1.42,
      "Restoration Level": 1.75
    }[data.cleaning.condition] || 1;

    const clutterM = { "None": .95, "Light": 1, "Moderate": 1.12, "Heavy": 1.3 }[data.cleaning.clutter] || 1;
    const petM = { "None": 1, "Light": 1.05, "Moderate": 1.12, "Heavy": 1.22 }[data.cleaning.petHair] || 1;

    cleaning *= typeM * conditionM * clutterM * petM;
    cleaning += sumCheckedPrices(".aCleaningAddon");

    if (data.cleaning.surfaces.includes("Natural Stone / Marble")) cleaning += 25;
    if (data.cleaning.surfaces.includes("Unfinished Wood")) cleaning += 35;

    const freqM = { "One-Time":1, "Weekly":.86, "Bi-Weekly":.91, "Monthly":.96 }[data.cleaning.frequency] || 1;
    cleaning *= freqM;

    if (data.cleaning.floors === "Two+ floors") cleaning *= 1.05;
    cleaning = Math.max(90, cleaning);
  }

  if (data.services.organization) {
    organization = sumCheckedPrices(".aOrgArea");
    const orgM = { "Light":.85, "Moderate":1, "Heavy":1.3, "Major Reset":1.65 }[data.organization.level] || 1;
    organization *= orgM;
    if (data.organization.donationSort) organization += 45;
    if (data.organization.haulAway) organization += 65;
    if (data.organization.labeling) organization += 30;
    if (data.organization.drawerLiners) organization += 45;
    if (data.organization.containers === "We supply basic containers") organization += 55;
    organization = Math.max(75, organization);
  }

  let subtotal = cleaning + organization;
  if (data.access.parking === "Difficult") subtotal += 20;

  const low = Math.max(90, subtotal * .92);
  const high = subtotal * 1.10;
  const recommended = (low + high) / 2;

  const services = [];
  if (data.services.cleaning) services.push(`${data.cleaning.type} cleaning`);
  if (data.services.organization) services.push("organization");

  const summary = `Randy's Premier Cleaning

Hi ${data.customerName || "there"}! Based on the in-person property assessment, your estimated flat-price quote is ${money(low)}–${money(high)}.

Recommended quote: ${money(recommended)}

Services: ${services.join(" + ")}
${data.services.cleaning ? `Cleaning condition: ${data.cleaning.condition}
Clutter: ${data.cleaning.clutter}
Pet hair: ${data.cleaning.petHair}
Surfaces: ${data.cleaning.surfaces.join(", ") || "Not specified"}
Cleaning add-ons: ${data.cleaning.addons.join(", ") || "None"}` : ""}
${data.services.organization ? `Organization level: ${data.organization.level}
Organization areas: ${data.organization.areas.join(", ") || "None selected"}
Containers: ${data.organization.containers}` : ""}

This quote is based on the areas and condition reviewed during the walk-through. If the scope changes before or during service, we will discuss any price change with you first. No hourly-rate surprises and no milking the job.`;

  return { cleaning, organization, low, high, recommended, summary };
}

let currentQuote = null;

function updateAssessmentPreview(generate = false) {
  const data = assessmentData();
  $("qCustomer").textContent = data.customerName || "Customer name";
  $("qAddress").textContent = data.address || "Property address";

  const propertyRows = [
    ["Square feet", data.sqft || "Not entered"],
    ["Bedrooms", data.property.aBedrooms],
    ["Full bathrooms", data.property.aFullBaths],
    ["Half bathrooms", data.property.aHalfBaths],
    ["Basement areas", data.property.aBasement],
    ["Garage areas", data.property.aGarage]
  ];
  $("qProperty").innerHTML = propertyRows
    .map(([l,v]) => `<div class="detail-row"><span>${escapeHtml(l)}</span><strong>${escapeHtml(v)}</strong></div>`).join("");

  const selectedServices = [];
  if (data.services.cleaning) selectedServices.push("🧹 Cleaning");
  if (data.services.organization) selectedServices.push("🗂️ Organization");
  $("qServices").innerHTML = selectedServices.length
    ? selectedServices.map((s) => `<div class="detail-row"><span>${escapeHtml(s)}</span><strong>✓</strong></div>`).join("")
    : "<p>No service selected.</p>";

  const details = [];
  if (data.services.cleaning) {
    details.push(["Cleaning level", data.cleaning.type]);
    details.push(["Condition", data.cleaning.condition]);
    details.push(["Clutter", data.cleaning.clutter]);
    details.push(["Frequency", data.cleaning.frequency]);
  }
  if (data.services.organization) {
    details.push(["Organization level", data.organization.level]);
    details.push(["Areas", data.organization.areas.join(", ") || "None selected"]);
  }
  $("qDetails").innerHTML = details.length
    ? details.map(([l,v]) => `<div class="detail-row"><span>${escapeHtml(l)}</span><strong>${escapeHtml(v)}</strong></div>`).join("")
    : "<p>Complete the walk-through to build the quote.</p>";

  if (generate) currentQuote = calculateSmartQuote(data);
  if (currentQuote) {
    $("qRecommended").textContent = money(currentQuote.recommended);
    $("qRange").textContent = `Estimated range: ${money(currentQuote.low)}–${money(currentQuote.high)}`;
    $("qCleaning").textContent = money(currentQuote.cleaning);
    $("qOrganization").textContent = money(currentQuote.organization);
    $("qSummary").textContent = currentQuote.summary;
  } else {
    $("qRecommended").textContent = "$0";
    $("qRange").textContent = "Estimated range: $0–$0";
    $("qCleaning").textContent = "$0";
    $("qOrganization").textContent = "$0";
    $("qSummary").textContent = "Generate a quote to create a customer-ready summary.";
  }
}

function savedQuotes() {
  try { return JSON.parse(localStorage.getItem("rpcAssessmentQuotes") || "[]"); }
  catch { return []; }
}

function renderSavedQuotes() {
  const quotes = savedQuotes();
  const box = $("savedQuotes");
  if (!quotes.length) {
    box.innerHTML = "<p>No saved quotes yet.</p>";
    return;
  }
  box.innerHTML = quotes.map((item, index) => `
    <div class="saved-job">
      <div>
        <strong>${escapeHtml(item.data.customerName || item.data.address || `Quote ${index+1}`)}</strong>
        <p>${escapeHtml(item.data.address || "No address")}</p>
        <small>${escapeHtml(money(item.quote.recommended))} recommended • ${new Date(item.savedAt).toLocaleDateString()}</small>
      </div>
      <div class="saved-job-actions">
        <button type="button" data-qload="${index}">Load</button>
        <button type="button" data-qdelete="${index}">Delete</button>
      </div>
    </div>
  `).join("");

  box.querySelectorAll("[data-qdelete]").forEach((btn) => btn.addEventListener("click", () => {
    const next = savedQuotes();
    next.splice(Number(btn.dataset.qdelete), 1);
    localStorage.setItem("rpcAssessmentQuotes", JSON.stringify(next));
    renderSavedQuotes();
  }));

  box.querySelectorAll("[data-qload]").forEach((btn) => btn.addEventListener("click", () => {
    const item = savedQuotes()[Number(btn.dataset.qload)];
    applyAssessment(item.data);
    currentQuote = item.quote;
    updateAssessmentPreview(false);
    window.scrollTo({top:0,behavior:"smooth"});
  }));
}

function applyAssessment(data) {
  $("aCustomerName").value = data.customerName || "";
  $("aCustomerPhone").value = data.customerPhone || "";
  $("aAddress").value = data.address || "";
  $("aSqft").value = data.sqft || "";
  $("quoteCleaning").checked = Boolean(data.services?.cleaning);
  $("quoteOrganization").checked = Boolean(data.services?.organization);
  Object.entries(data.property || {}).forEach(([id,val]) => { if ($(id)) $(id).value = val; });
  $("aCleaningType").value = data.cleaning?.type || "Standard";
  $("aFrequency").value = data.cleaning?.frequency || "One-Time";
  $("aCondition").value = data.cleaning?.condition || "Average";
  $("aClutter").value = data.cleaning?.clutter || "Light";
  $("aPetHair").value = data.cleaning?.petHair || "None";
  $("aFloors").value = data.cleaning?.floors || "One floor";
  document.querySelectorAll(".aSurface").forEach((x)=>x.checked=(data.cleaning?.surfaces||[]).includes(x.value));
  document.querySelectorAll(".aCleaningAddon").forEach((x)=>x.checked=(data.cleaning?.addons||[]).includes(x.value));
  $("aCleaningNotes").value = data.cleaning?.notes || "";
  $("aOrgLevel").value = data.organization?.level || "Moderate";
  $("aContainers").value = data.organization?.containers || "Customer has containers";
  document.querySelectorAll(".aOrgArea").forEach((x)=>x.checked=(data.organization?.areas||[]).includes(x.value));
  $("aDonationSort").checked = Boolean(data.organization?.donationSort);
  $("aHaulAway").checked = Boolean(data.organization?.haulAway);
  $("aLabeling").checked = Boolean(data.organization?.labeling);
  $("aDrawerLiners").checked = Boolean(data.organization?.drawerLiners);
  $("aOrgNotes").value = data.organization?.notes || "";
  $("aOccupied").value = data.access?.occupied || "Occupied";
  $("aParking").value = data.access?.parking || "Easy";
  $("aEntry").value = data.access?.entry || "";
  $("aOtherNotes").value = data.access?.notes || "";
  syncAssessmentSections();
}

function saveAssessmentQuote() {
  const data = assessmentData();
  const quote = currentQuote || calculateSmartQuote(data);
  currentQuote = quote;
  const list = savedQuotes();
  list.unshift({ data, quote, savedAt:new Date().toISOString() });
  localStorage.setItem("rpcAssessmentQuotes", JSON.stringify(list.slice(0,30)));
  $("quoteSaveMessage").textContent = "Quote saved on this device.";
  renderSavedQuotes();
  setTimeout(()=> $("quoteSaveMessage").textContent="", 2500);
}

function resetAssessment() {
  document.querySelectorAll("#assessmentPanel input[type='text'], #assessmentPanel input[type='tel'], #assessmentPanel textarea").forEach((f)=>f.value="");
  $("aSqft").value = "1500";
  assessmentQtyIds.forEach((id)=>$(id).value="0");
  $("aBedrooms").value="2"; $("aFullBaths").value="1"; $("aKitchens").value="1"; $("aLiving").value="1"; $("aDining").value="1";
  document.querySelectorAll("#assessmentPanel input[type='checkbox']").forEach((f)=>f.checked=false);
  $("quoteCleaning").checked=true;
  $("aCleaningType").value="Standard";
  $("aFrequency").value="One-Time";
  $("aCondition").value="Average";
  $("aClutter").value="Light";
  $("aPetHair").value="None";
  $("aOrgLevel").value="Moderate";
  $("aContainers").value="Customer has containers";
  currentQuote=null;
  syncAssessmentSections();
  updateAssessmentPreview(false);
}

function syncAssessmentSections() {
  $("cleaningAssessment").classList.toggle("hidden-section", !$("quoteCleaning").checked);
  $("organizationAssessment").classList.toggle("hidden-section", !$("quoteOrganization").checked);
  if (!$("quoteCleaning").checked && !$("quoteOrganization").checked) {
    $("quoteCleaning").checked = true;
    $("cleaningAssessment").classList.remove("hidden-section");
  }
}

document.querySelectorAll(".mode-btn").forEach((btn) => btn.addEventListener("click", () => {
  document.querySelectorAll(".mode-btn").forEach((b)=>b.classList.remove("active"));
  btn.classList.add("active");
  const mode = btn.dataset.mode;
  document.querySelectorAll(".assessment-mode").forEach((el)=>el.classList.toggle("hidden-mode", mode !== "assessment"));
  document.querySelectorAll(".workorder-mode").forEach((el)=>el.classList.toggle("hidden-mode", mode !== "workorder"));
  window.scrollTo({top:0,behavior:"smooth"});
}));

["quoteCleaning","quoteOrganization"].forEach((id)=>$(id).addEventListener("change",()=>{
  syncAssessmentSections(); currentQuote=null; updateAssessmentPreview(false);
}));

document.querySelectorAll("#assessmentPanel input, #assessmentPanel select, #assessmentPanel textarea").forEach((field)=>{
  field.addEventListener("input", ()=>updateAssessmentPreview(false));
  field.addEventListener("change", ()=>updateAssessmentPreview(false));
});

$("generateQuoteBtn").addEventListener("click", ()=>{
  syncAssessmentSections();
  updateAssessmentPreview(true);
  $("assessmentPreview").scrollIntoView({behavior:"smooth",block:"start"});
});

$("saveQuoteBtn").addEventListener("click", saveAssessmentQuote);
$("newAssessmentBtn").addEventListener("click", resetAssessment);
$("copyQuoteBtn").addEventListener("click", async ()=>{
  if (!currentQuote) updateAssessmentPreview(true);
  try {
    await navigator.clipboard.writeText(currentQuote.summary);
    $("quoteSaveMessage").textContent = "Quote copied.";
  } catch {
    $("quoteSaveMessage").textContent = "Press and hold the quote text to copy.";
  }
});
$("textQuoteBtn").addEventListener("click", ()=>{
  if (!currentQuote) updateAssessmentPreview(true);
  const phone = $("aCustomerPhone").value.replace(/[^\d+]/g,"");
  window.location.href = `sms:${phone}?&body=${encodeURIComponent(currentQuote.summary)}`;
});

$("turnIntoJobBtn").addEventListener("click", ()=>{
  const a = assessmentData();
  $("customerName").value = a.customerName;
  $("customerPhone").value = a.customerPhone;
  // Try to split address simply; preserve full address in special notes regardless.
  $("streetAddress").value = a.address;
  $("specialNotes").value = [
    `Assessment quote: ${currentQuote ? money(currentQuote.recommended) : "Not generated"}`,
    a.services.organization ? `Organization: ${a.organization.areas.join(", ") || "selected"}` : "",
    a.cleaning.notes,
    a.organization.notes,
    a.access.notes
  ].filter(Boolean).join("\n");
  document.querySelector('[data-mode="workorder"]').click();
  updatePreview();
});

$("clearQuotesBtn").addEventListener("click", ()=>{
  if (confirm("Delete all saved quotes from this device?")) {
    localStorage.removeItem("rpcAssessmentQuotes");
    renderSavedQuotes();
  }
});

syncAssessmentSections();
renderSavedQuotes();
updateAssessmentPreview(false);
