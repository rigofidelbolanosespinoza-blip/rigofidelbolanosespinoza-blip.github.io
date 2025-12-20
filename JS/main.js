// ====================== CONFIG ======================
const DEFAULT_PASSWORD = "nubecita2207"; // contraseña por defecto
const KEY_EMP = "app_empleados_v2";
const KEY_ATT = "app_asistencias_v2";
const KEY_IMG = "app_login_img_v2";
const KEY_PASS = "app_pass_v2";

const SHIFT_START = "07:00";
const SHIFT_END = "15:00"; // 8 horas

// Domingo multiplicador de pago (por defecto 2x)
const SUNDAY_MULTIPLIER = 2;

// default employees (alias -> data)
const DEFAULT_EMPLOYEES = {
  "Neithan": { nombre: "Neithan", inicio: null, weekly: 1500, photo: "" },
  "José":    { nombre: "José",    inicio: null, weekly: 1400, photo: "" },
  "Braulio": { nombre: "Braulio", inicio: null, weekly: 1300, photo: "" },
  "Josué":   { nombre: "Josué",   inicio: null, weekly: 1300, photo: "" }
};

// load storage
let empleados = JSON.parse(localStorage.getItem(KEY_EMP) || "null") || DEFAULT_EMPLOYEES;
let asistencias = JSON.parse(localStorage.getItem(KEY_ATT) || "{}");
let savedImage = localStorage.getItem(KEY_IMG) || "";
let savedPass = localStorage.getItem(KEY_PASS) || DEFAULT_PASSWORD;

// quick persist
function persistAll(){
  localStorage.setItem(KEY_EMP, JSON.stringify(empleados));
  localStorage.setItem(KEY_ATT, JSON.stringify(asistencias));
  localStorage.setItem(KEY_IMG, savedImage);
  localStorage.setItem(KEY_PASS, savedPass);
}

// ====================== UI helpers ======================
function showScreen(name){
  document.querySelectorAll(".screen").forEach(s=>s.classList.remove("active"));
  const el = document.getElementById("screen-" + name);
  if(el) el.classList.add("active");
}

// toast (non-blocking)
function toast(msg, time=1200){
  const t = document.getElementById("toast");
  t.innerText = msg;
  t.classList.remove("hidden");
  setTimeout(()=> t.classList.add("hidden"), time);
}

// modal helpers
function openModal(){ document.getElementById("modal").classList.remove("hidden"); }
function closeModal(){ document.getElementById("modal").classList.add("hidden"); }
function openEditModal(){ document.getElementById("edit-modal").classList.remove("hidden"); }
function closeEditModal(){ document.getElementById("edit-modal").classList.add("hidden"); }

// utility: get current week Monday..Sunday as Date objects
function getDatesOfCurrentWeek(){
  const now = new Date();
  const day = now.getDay();
  const monday = new Date(now);
  const diffToMonday = (day === 0) ? -6 : (1 - day);
  monday.setDate(now.getDate() + diffToMonday);
  const arr=[];
  for(let i=0;i<7;i++){ const d=new Date(monday); d.setDate(monday.getDate()+i); arr.push(d); }
  return arr;
}
function dateToISO(d){ return d.toISOString().slice(0,10); }

// minutes diff helper
function minutesDifference(t1,t2){
  const [h1,m1] = t1.split(":").map(Number);
  const [h2,m2] = t2.split(":").map(Number);
  return (h2*60 + m2) - (h1*60 + m1);
}

// parse hours decimal
function minutesToHours(min){ return min/60; }

// ====================== LOGIN & IMAGE ======================
document.addEventListener("DOMContentLoaded", ()=>{
  // default embedded image (Kessa) if none saved
  const defaultKessaSVG = encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' width='1000' height='400'><rect width='100%' height='100%' fill='%23e6eef8'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' fill='%236b7280' font-family='Arial' font-size='48'>Kessa</text></svg>`);
  const img = document.getElementById("login-image");
  if(savedImage) img.src = savedImage;
  else img.src = "data:image/svg+xml;utf8," + defaultKessaSVG;

  document.getElementById("img-file").addEventListener("change", onImageChange);
  document.getElementById("reset-image").addEventListener("click", ()=>{ savedImage=""; persistAll(); location.reload(); });

  // buttons wiring
  document.getElementById("btn-login").addEventListener("click", onLogin);
  document.getElementById("btn-logout").addEventListener("click", ()=> showScreen("login"));

  document.getElementById("btn-register").addEventListener("click", openRegisterUI);
  document.getElementById("btn-new").addEventListener("click", openNewEmployeeUI);
  document.getElementById("btn-salary").addEventListener("click", openSalaryUI);
  document.getElementById("btn-aguinaldo").addEventListener("click", openAguinaldoUI);

  // back buttons
  document.getElementById("btn-back-menu-1").addEventListener("click", ()=>showScreen("menu"));
  document.getElementById("btn-back-menu-2").addEventListener("click", ()=>showScreen("menu"));
  document.getElementById("btn-back-menu-3").addEventListener("click", ()=>showScreen("menu"));
  document.getElementById("btn-back-menu-4").addEventListener("click", ()=>showScreen("menu"));

  document.getElementById("btn-save-emp").addEventListener("click", onSaveEmployee);

  // modal actions
  document.getElementById("modal-cancel").addEventListener("click", closeModal);
  document.getElementById("modal-save").addEventListener("click", onModalSave);

  document.getElementById("edit-cancel").addEventListener("click", closeEditModal);
  document.getElementById("edit-save").addEventListener("click", onEditSave);

  document.getElementById("btn-change-pass").addEventListener("click", ()=>document.getElementById("pass-modal").classList.remove("hidden"));
  document.getElementById("cancel-pass").addEventListener("click", ()=>document.getElementById("pass-modal").classList.add("hidden"));
  document.getElementById("save-pass").addEventListener("click", saveNewPassword);

  document.getElementById("btn-refresh-salary").addEventListener("click", renderSalaryPeriod);
  document.getElementById("btn-export-week-image").addEventListener("click", exportWeekImage);
  document.getElementById("btn-export-salary-image").addEventListener("click", exportSalaryImage);

  // init period selectors
  populateDayMonthYearSelectors();

  // initial screen
  showScreen("login");
});

// image upload
function onImageChange(e){
  const file = e.target.files[0];
  if(!file) return;
  const reader = new FileReader();
  reader.onload = ()=> {
    savedImage = reader.result;
    persistAll();
    document.getElementById("login-image").src = savedImage;
    toast("Imagen guardada",900);
  };
  reader.readAsDataURL(file);
}

// password save
function saveNewPassword(){
  const val = document.getElementById("new-pass").value.trim();
  if(!val){ alert("Ingresa una contraseña"); return; }
  savedPass = val;
  persistAll();
  document.getElementById("pass-modal").classList.add("hidden");
  toast("Contraseña actualizada",1000);
}

// login
function onLogin(){
  const pass = document.getElementById("input-pass").value || "";
  const msg = document.getElementById("login-msg");
  if(pass === savedPass){
    msg.innerText = "";
    showScreen("menu");
  } else {
    msg.innerText = "Contraseña incorrecta";
    msg.classList.add("error");
  }
}

// ====================== REGISTER UI ======================
let currentEmployee = null;
let currentISO = null;

function openRegisterUI(){
  showScreen("register");
  renderEmployeesList();
  clearDaysArea();
}

function renderEmployeesList(){
  const container = document.getElementById("employees-list");
  container.innerHTML = "";
  for(const alias in empleados){
    const btn = document.createElement("button");
    btn.className = "btn";
    btn.innerHTML = `${alias} (${empleados[alias].nombre || alias})`;
    btn.onclick = ()=> selectEmployeeForRegister(alias);
    container.appendChild(btn);
  }
}

function clearDaysArea(){ document.getElementById("days-area").innerHTML = ""; }

function selectEmployeeForRegister(alias){
  currentEmployee = alias;
  renderWeekDaysForEmployee(alias);
}

function renderWeekDaysForEmployee(alias){
  const area = document.getElementById("days-area");
  area.innerHTML = "";
  const title = document.createElement("p"); title.className="muted";
  title.innerText = `Empleado: ${alias} · Horario: ${SHIFT_START} - ${SHIFT_END}`;
  area.appendChild(title);

  const grid = document.createElement("div"); grid.className = "days-grid";
  const week = getDatesOfCurrentWeek();
  week.forEach(d=>{
    const iso = dateToISO(d);
    const label = `${d.toLocaleDateString(undefined,{weekday:'long'})} — ${iso}`;
    const box = document.createElement("div"); box.className="day-btn";

    const t = document.createElement("div"); t.style.fontWeight="600"; t.innerText = label;
    const info = document.createElement("div"); info.style.marginTop="6px";
    const rec = (asistencias[alias] && asistencias[alias][iso]) ? asistencias[alias][iso] : null;
    if(rec && rec.entry && rec.exit){
      info.innerHTML = `Entrada: ${rec.entry} · Salida: ${rec.exit} · hrs: ${rec.workedH.toFixed(2)}`;
    } else info.innerText = "Sin registro";

    const btn = document.createElement("button"); btn.className="btn"; btn.style.marginTop="8px"; btn.innerText="Registrar / Editar";
    btn.onclick = ()=> openModalFor(alias, iso, d);

    box.appendChild(t); box.appendChild(info); box.appendChild(btn);
    grid.appendChild(box);
  });
  area.appendChild(grid);
}

// ---------------- modal open ----------------
function openModalFor(alias, isoDate, dateObj){
  currentEmployee = alias; currentISO = isoDate;
  document.getElementById("modal-title").innerText = `Empleado: ${alias}`;
  document.getElementById("modal-sub").innerText = `${dateObj.toLocaleDateString()} (Semana actual)`;
  const rec = (asistencias[alias] && asistencias[alias][isoDate]) ? asistencias[alias][isoDate] : null;
  document.getElementById("modal-entry").value = rec ? rec.entry : "";
  document.getElementById("modal-exit").value  = rec ? rec.exit : "";
  const weekly = (empleados[alias] && empleados[alias].weekly) ? empleados[alias].weekly : 0;
  document.getElementById("modal-note").innerText = `Salario semanal: $${(weekly||0).toFixed(2)} · Precio hora aprox: $${(weekly/8||0).toFixed(2)}`;
  document.getElementById("modal").classList.remove("hidden");
}

// modal save - fast, no alert (toast instead)
function onModalSave(){
  const entry = document.getElementById("modal-entry").value;
  const exit  = document.getElementById("modal-exit").value;
  if(!currentEmployee || !currentISO){ toast("Error interno"); return; }
  if(!entry || !exit){ toast("Completa ambas horas"); return; }

  const minWorked = minutesDifference(entry, exit);
  const workedH = Math.max(0, minWorked/60);

  const minLate = Math.max(0, minutesDifference(SHIFT_START, entry));
  const minLeftEarly = Math.max(0, minutesDifference(exit, SHIFT_END));
  const minExtra = Math.max(0, minutesDifference(SHIFT_END, exit));

  if(!asistencias[currentEmployee]) asistencias[currentEmployee] = {};
  asistencias[currentEmployee][currentISO] = {
    entry, exit, workedH, minLate, minLeftEarly, minExtra
  };

  persistAll();
  closeModal();
  renderWeekDaysForEmployee(currentEmployee);
  toast("Guardado");
}

// ====================== NEW / EDIT EMPLOYEE ======================
function openNewEmployeeUI(){
  showScreen("new");
  renderEmployeesTable();
  document.getElementById("new-msg").innerText = "";

  // wire photo input so it doesn't linger
  const photoInput = document.getElementById("new-photo");
  photoInput.value = "";
}

function renderEmployeesTable(){
  const div = document.getElementById("emps-table");
  div.innerHTML = "";
  const table = document.createElement("table");
  table.style.width="100%";
  table.innerHTML = `
    <tr><th>Alias</th><th>Nombre</th><th>Inicio</th><th>Semanal</th><th>Foto</th><th>Acciones</th></tr>
  `;
  for(const alias in empleados){
    const e = empleados[alias];
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${alias}</td>
      <td>${e.nombre || ""}</td>
      <td>${e.inicio || ""}</td>
      <td>$${(e.weekly||0).toFixed(2)}</td>
      <td>${e.photo ? `<img src="${e.photo}" class="emp-thumb">` : ''}</td>
      <td>
        <button class="btn small" onclick="editEmployee('${alias}')">Editar</button>
        <button class="btn small ghost" onclick="deleteEmployee('${alias}')">Eliminar</button>
      </td>
    `;
    table.appendChild(tr);
  }
  div.appendChild(table);
}

function onSaveEmployee(){
  const name = document.getElementById("new-fullname").value.trim();
  const alias = document.getElementById("new-alias").value.trim();
  const start = document.getElementById("new-start").value;
  const weekly = parseFloat(document.getElementById("new-weekly").value) || 0;
  const photoInput = document.getElementById("new-photo");

  if(!name || !alias || !start || !weekly){ document.getElementById("new-msg").innerText="Llena todos los campos"; return; }
  if(empleados[alias]){ document.getElementById("new-msg").innerText="Alias ya existe"; return; }

  // handle photo (async via FileReader)
  if(photoInput.files && photoInput.files[0]){
    const file = photoInput.files[0];
    const reader = new FileReader();
    reader.onload = ()=> {
      empleados[alias] = { nombre: name, inicio: start, weekly, photo: reader.result };
      persistAll();
      document.getElementById("new-msg").innerText="Empleado guardado";
      renderEmployeesTable();
      setTimeout(()=>{ document.getElementById("new-msg").innerText=""; },1200);
    };
    reader.readAsDataURL(file);
  } else {
    empleados[alias] = { nombre: name, inicio: start, weekly, photo: "" };
    persistAll();
    document.getElementById("new-msg").innerText="Empleado guardado";
    renderEmployeesTable();
    setTimeout(()=>{ document.getElementById("new-msg").innerText=""; },1200);
  }
}

function editEmployee(alias){
  const e = empleados[alias];
  if(!e) return;
  const newName = prompt("Nombre completo", e.nombre || "");
  if(newName === null) return;
  const newWeekly = prompt("Salario semanal", e.weekly || 0);
  if(newWeekly === null) return;
  const newStart = prompt("Fecha inicio (YYYY-MM-DD)", e.inicio || "");
  if(newStart === null) return;

  e.nombre = newName.trim();
  e.weekly = parseFloat(newWeekly) || e.weekly;
  e.inicio = newStart || e.inicio;

  // ask to change photo
  if(confirm("¿Deseas cambiar la foto del empleado? (Aceptar = Sí)")){
    // create a temporary file input and click it
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.style.display = "none";
    input.onchange = (ev)=>{
      const f = ev.target.files[0];
      if(!f) { persistAll(); renderEmployeesTable(); toast("Empleado actualizado"); return; }
      const r = new FileReader();
      r.onload = ()=> {
        e.photo = r.result;
        persistAll();
        renderEmployeesTable();
        toast("Empleado y foto actualizados");
      };
      r.readAsDataURL(f);
    };
    document.body.appendChild(input);
    input.click();
    // remove later
    setTimeout(()=> document.body.removeChild(input), 5000);
  } else {
    persistAll();
    renderEmployeesTable();
    toast("Empleado actualizado");
  }
}

function deleteEmployee(alias){
  if(!confirm(`Eliminar ${alias}?`)) return;
  delete empleados[alias];
  delete asistencias[alias];
  persistAll();
  renderEmployeesTable();
  toast("Empleado eliminado");
}

// ====================== SALARY UI ======================
function openSalaryUI(){
  showScreen("salary");

  const period = document.getElementById("periodSelect");
  period.addEventListener("change", onPeriodChange);

  // set defaults
  document.getElementById("periodSelect").value = "week";
  onPeriodChange();

  renderSalaryPeriod();
}

function onPeriodChange(){
  const v = document.getElementById("periodSelect").value;
  const daySel = document.getElementById("daySelect");
  const monthSel = document.getElementById("monthSelect");
  const yearSel = document.getElementById("yearSelect");

  if(v === "day"){
    daySel.style.display = "inline-block";
    monthSel.style.display = "inline-block";
    yearSel.style.display = "inline-block";
  } else if(v === "month"){
    daySel.style.display = "none";
    monthSel.style.display = "inline-block";
    yearSel.style.display = "inline-block";
  } else if(v === "year"){
    daySel.style.display = "none";
    monthSel.style.display = "none";
    yearSel.style.display = "inline-block";
    populateYears(); // from actual records
  } else {
    daySel.style.display = "none";
    monthSel.style.display = "none";
    yearSel.style.display = "none";
  }
}

function populateDayMonthYearSelectors(){
  const daySel = document.getElementById("daySelect");
  const monthSel = document.getElementById("monthSelect");
  const yearSel = document.getElementById("yearSelect");
  daySel.innerHTML = "<option value=''>Día</option>";
  for(let d=1; d<=31; d++) daySel.innerHTML += `<option value="${d}">${d}</option>`;
  monthSel.innerHTML = "<option value=''>Mes</option>";
  for(let m=1; m<=12; m++) monthSel.innerHTML += `<option value="${m.toString().padStart(2,"0")}">${m}</option>`;
  // years: populate a sensible range (current year -5 .. current +1)
  const now = new Date(); const cur = now.getFullYear();
  yearSel.innerHTML = "<option value=''>Año</option>";
  for(let y=cur+1; y>=cur-5; y--) yearSel.innerHTML += `<option value="${y}">${y}</option>`;
}

function populateYears(){
  const set = new Set();
  for(const a in asistencias){
    for(const f in asistencias[a]) set.add(f.slice(0,4));
  }
  const sel = document.getElementById("yearSelect");
  const currentOptions = Array.from(sel.options).map(o=>o.value);
  sel.innerHTML = "<option value=''>Año</option>";
  [...set].sort((a,b)=>b-a).forEach(y=> sel.innerHTML += `<option value="${y}">${y}</option>`);
}

// render salary based on selected period
function renderSalaryPeriod(){
  const period = document.getElementById("periodSelect").value;
  const results = document.getElementById("salary-results");
  results.innerHTML = "";

  // determine date range (isoList)
  let isoList = [];
  if(period==="week"){
    isoList = getDatesOfCurrentWeek().map(d=>dateToISO(d));
  } else if(period==="month"){
    const month = document.getElementById("monthSelect").value; // "MM"
    const year = document.getElementById("yearSelect").value;
    if(!month || !year){ toast("Elige mes y año"); return; }
    const days = new Date(parseInt(year), parseInt(month), 0).getDate();
    for(let d=1; d<=days; d++){ const dt = new Date(parseInt(year), parseInt(month)-1, d); isoList.push(dateToISO(dt)); }
  } else if(period==="year"){
    const year = document.getElementById("yearSelect").value;
    if(!year){ toast("Elige año"); return; }
    for(let mm=0; mm<12; mm++){
      const days = new Date(parseInt(year), mm+1, 0).getDate();
      for(let d=1; d<=days; d++){ const dt = new Date(parseInt(year), mm, d); isoList.push(dateToISO(dt)); }
    }
  } else if(period==="day"){
    const day = document.getElementById("daySelect").value;
    const month = document.getElementById("monthSelect").value;
    const year = document.getElementById("yearSelect").value;
    if(!day || !month || !year){ toast("Elige día, mes y año"); return; }
    const dt = new Date(parseInt(year), parseInt(month)-1, parseInt(day));
    isoList = [dateToISO(dt)];
  }

  // For each employee compute totals
  for(const alias in empleados){
    const emp = empleados[alias];
    const weekPay = emp.weekly || 0;
    const dailyPay = weekPay / 7;
    const hourRate = weekPay / 8;
    const extraRate = hourRate * 2;

    let daysWorked = 0, daysAbsent = 0, totalMinutesLate=0, totalMinutesLeftEarly=0, totalExtraMinutes=0, totalWorkedH=0;
    let salaryFromDays = 0; // accumulate per-day (taking sunday multiplier into account)
    const recs = asistencias[alias] || {};

    isoList.forEach(iso=>{
      const dt = new Date(iso);
      const isSunday = dt.getDay() === 0;
      const r = recs[iso];
      if(r && r.entry && r.exit){
        daysWorked++;
        totalMinutesLate += r.minLate || 0;
        totalMinutesLeftEarly += r.minLeftEarly || 0;
        totalExtraMinutes += r.minExtra || 0;
        totalWorkedH += r.workedH || 0;

        // pay for that day: base daily pay
        let dayPay = dailyPay;
        // if worked on Sunday - pay extra (multiplier)
        if(isSunday){
          dayPay = dayPay * (SUNDAY_MULTIPLIER);
        }
        // also add extra hours (after shift) as overtime double-rate
        const extraHours = (r.minExtra || 0) / 60;
        const payExtra = extraHours * extraRate;

        salaryFromDays += dayPay + payExtra;
      } else {
        // no record
        if(isSunday){
          // Sunday without record: do not count as absence (requested)
        } else {
          daysAbsent++;
        }
      }
    });

    // deductions from lateness / leaving early (minutes -> money)
    const deductionLate = totalMinutesLate * (hourRate / 60);
    const deductionEarly = totalMinutesLeftEarly * (hourRate / 60);

    const totalPay = Math.max(0, salaryFromDays - deductionLate - deductionEarly);

    // card
    const card = document.createElement("div"); card.className="card";
    card.style.marginBottom="10px";
    card.innerHTML = `
      <h3 style="margin-top:0">${alias} — ${emp.nombre || ""}</h3>
      <p>Período: ${period}</p>
      <p>Días trabajados: ${daysWorked} · Días faltados: ${daysAbsent}</p>
      <p>Horas trabajadas: ${totalWorkedH.toFixed(2)} · Minutos tarde: ${totalMinutesLate} · Minutos salida temprana: ${totalMinutesLeftEarly}</p>
      <p>Salario por días (incluye domingos con multiplicador): $${salaryFromDays.toFixed(2)} · Descuentos: $${(deductionLate + deductionEarly).toFixed(2)}</p>
      <h4>Total calculado: $${totalPay.toFixed(2)}</h4>
      <div style="margin-top:8px;">
        <button class="btn small" onclick="showRecordsFor('${alias}')">Ver / Editar registros</button>
      </div>
    `;
    results.appendChild(card);
  }
}

// show record list and allow editing date selection
function showRecordsFor(alias){
  const week = getDatesOfCurrentWeek();
  let listStr = '';
  const recs = asistencias[alias] || {};
  week.forEach(d=>{
    const iso = dateToISO(d);
    const r = recs[iso];
    listStr += `${iso}: ${r && r.entry && r.exit ? (r.entry + ' - ' + r.exit) : 'Sin registro'}\n`;
  });
  const datePrompt = prompt("Registros de la semana:\n\n" + listStr + "\nEscribe la fecha ISO a editar (YYYY-MM-DD) o deja vacío:");
  if(!datePrompt) return;
  const iso = datePrompt.trim();
  if(!asistencias[alias]) asistencias[alias] = {};
  if(!(asistencias[alias] && asistencias[alias][iso])){
    asistencias[alias][iso] = { entry: "", exit: "", workedH:0, minLate:0, minLeftEarly:0, minExtra:0 };
  }
  document.getElementById("edit-sub").innerText = `${alias} — ${iso}`;
  document.getElementById("edit-entry").value = asistencias[alias][iso].entry || "";
  document.getElementById("edit-exit").value = asistencias[alias][iso].exit || "";
  document.getElementById("edit-save").dataset.alias = alias;
  document.getElementById("edit-save").dataset.iso = iso;
  openEditModal();
}

// save from edit modal
function onEditSave(){
  const alias = document.getElementById("edit-save").dataset.alias;
  const iso = document.getElementById("edit-save").dataset.iso;
  const entry = document.getElementById("edit-entry").value;
  const exit = document.getElementById("edit-exit").value;
  if(!alias || !iso){ toast("Error"); return; }
  if(!entry || !exit){ // allow deleting
    if(confirm("¿Eliminar este registro?")){ delete asistencias[alias][iso]; persistAll(); closeEditModal(); toast("Eliminado"); return; } else return;
  }
  const minWorked = minutesDifference(entry, exit);
  const workedH = Math.max(0, minWorked/60);
  const minLate = Math.max(0, minutesDifference(SHIFT_START, entry));
  const minLeftEarly = Math.max(0, minutesDifference(exit, SHIFT_END));
  const minExtra = Math.max(0, minutesDifference(SHIFT_END, exit));
  asistencias[alias][iso] = { entry, exit, workedH, minLate, minLeftEarly, minExtra };
  persistAll();
  closeEditModal();
  toast("Registro actualizado");
}

// ====================== AGUINALDO ======================
function openAguinaldoUI(){
  showScreen("aguinaldo");
  renderAguinaldo();
}

function renderAguinaldo(){
  const div = document.getElementById("aguinaldo-results");
  div.innerHTML = "";
  const year = (new Date()).getFullYear();
  for(const alias in empleados){
    const emp = empleados[alias];
    const recs = asistencias[alias] || {};
    let daysWorkedThisYear = 0;
    for(const iso in recs){
      if(iso.startsWith(String(year)) && recs[iso] && recs[iso].entry && recs[iso].exit) daysWorkedThisYear++;
    }
    // Aguinaldo = (daysWorkedThisYear / 365) * 15 * (weekly/7)
    const aguinaldo = (daysWorkedThisYear / 365) * 15 * ((emp.weekly||0)/7);
    const card = document.createElement("div"); card.className="card"; card.style.marginBottom="10px";
    card.innerHTML = `<h3 style="margin-top:0">${alias} — ${emp.nombre || ""}</h3>
      <p>Días trabajados este año: ${daysWorkedThisYear}</p>
      <p>Aguinaldo estimado: $${aguinaldo.toFixed(2)}</p>`;
    div.appendChild(card);
  }
}

// ====================== EXPORT AS IMAGE (Canvas) ======================
// Export week schedule (simple canvas rendering)
function exportWeekImage(){
  // collect week dates and employees entries for week
  const week = getDatesOfCurrentWeek();
  const dates = week.map(d=>dateToISO(d));
  const rows = [];
  // header row
  const header = ["Empleado", ...dates];
  rows.push(header);
  for(const alias in empleados){
    const row = [];
    row.push(`${alias} (${empleados[alias].nombre || ""})`);
    dates.forEach(iso=>{
      const r = (asistencias[alias] && asistencias[alias][iso]) ? asistencias[alias][iso] : null;
      if(r && r.entry && r.exit) row.push(`${r.entry}-${r.exit}`);
      else row.push("-");
    });
    rows.push(row);
  }

  // canvas sizing
  const colWidth = 140;
  const rowHeight = 28;
  const canvasWidth = Math.max(800, colWidth * (header.length));
  const canvasHeight = rowHeight * (rows.length + 2) + 60;

  const cnv = document.createElement("canvas");
  cnv.width = canvasWidth;
  cnv.height = canvasHeight;
  const ctx = cnv.getContext("2d");

  // background
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0,0,cnv.width,cnv.height);

  // title
  ctx.fillStyle = "#17202a";
  ctx.font = "20px Arial";
  ctx.fillText("Hoja de asistencia - Semana", 12, 28);

  // draw grid and content
  ctx.font = "12px Arial";
  let y = 50;
  rows.forEach((r, ri)=>{
    let x = 12;
    const isHeader = ri === 0;
    r.forEach((cell, ci)=>{
      // cell background
      ctx.fillStyle = isHeader ? "#eaeef6" : "#fff";
      ctx.fillRect(x-4, y-18, colWidth-8, rowHeight);
      // text
      ctx.fillStyle = "#17202a";
      ctx.fillText(cell, x, y-4);
      x += colWidth;
    });
    y += rowHeight;
  });

  // convert to image and download
  const data = cnv.toDataURL("image/png");
  const a = document.createElement("a");
  a.href = data;
  a.download = `asistencia_semana_${dateToISO(new Date())}.png`;
  a.click();
  toast("Imagen generada");
}

// Export salary sheet image (summary)
function exportSalaryImage(){
  // generate rows similar to renderSalaryPeriod for current selection
  const period = document.getElementById("periodSelect").value;
  // reuse renderSalaryPeriod calculations to build rows
  // We will compute for isoList same logic as renderSalaryPeriod
  let isoList = [];
  if(period==="week") isoList = getDatesOfCurrentWeek().map(d=>dateToISO(d));
  else if(period==="month"){
    const month = document.getElementById("monthSelect").value;
    const year = document.getElementById("yearSelect").value;
    if(!month || !year){ toast("Elige mes y año"); return; }
    const days = new Date(parseInt(year), parseInt(month), 0).getDate();
    for(let d=1; d<=days; d++){ const dt = new Date(parseInt(year), parseInt(month)-1, d); isoList.push(dateToISO(dt)); }
  } else if(period==="year"){
    const year = document.getElementById("yearSelect").value;
    if(!year){ toast("Elige año"); return; }
    for(let mm=0; mm<12; mm++){
      const days = new Date(parseInt(year), mm+1, 0).getDate();
      for(let d=1; d<=days; d++){ const dt = new Date(parseInt(year), mm, d); isoList.push(dateToISO(dt)); }
    }
  } else if(period==="day"){
    const day = document.getElementById("daySelect").value;
    const month = document.getElementById("monthSelect").value;
    const year = document.getElementById("yearSelect").value;
    if(!day || !month || !year){ toast("Elige día, mes y año"); return; }
    const dt = new Date(parseInt(year), parseInt(month)-1, parseInt(day));
    isoList = [dateToISO(dt)];
  }

  const rows = [];
  rows.push(["Empleado","Días trabajados","Horas","Pago extra","Descuentos","Total"]);
  for(const alias in empleados){
    const emp = empleados[alias];
    const weekPay = emp.weekly || 0;
    const dailyPay = weekPay / 7;
    const hourRate = weekPay / 8;
    const extraRate = hourRate * 2;

    let daysWorked = 0, daysAbsent = 0, totalMinutesLate=0, totalMinutesLeftEarly=0, totalExtraMinutes=0, totalWorkedH=0;
    let salaryFromDays = 0;
    const recs = asistencias[alias] || {};

    isoList.forEach(iso=>{
      const dt = new Date(iso);
      const isSunday = dt.getDay() === 0;
      const r = recs[iso];
      if(r && r.entry && r.exit){
        daysWorked++;
        totalMinutesLate += r.minLate || 0;
        totalMinutesLeftEarly += r.minLeftEarly || 0;
        totalExtraMinutes += r.minExtra || 0;
        totalWorkedH += r.workedH || 0;
        let dayPay = dailyPay;
        if(isSunday) dayPay *= SUNDAY_MULTIPLIER;
        const extraHours = (r.minExtra || 0) / 60;
        const payExtra = extraHours * extraRate;
        salaryFromDays += dayPay + payExtra;
      } else {
        if(!isSunday) daysAbsent++;
      }
    });

    const deductionLate = totalMinutesLate * (hourRate / 60);
    const deductionEarly = totalMinutesLeftEarly * (hourRate / 60);
    const totalPay = Math.max(0, salaryFromDays - deductionLate - deductionEarly);

    rows.push([`${alias} (${emp.nombre||""})`, String(daysWorked), totalWorkedH.toFixed(2), ( (totalExtraMinutes/60) * extraRate ).toFixed(2), (deductionLate+deductionEarly).toFixed(2), totalPay.toFixed(2)]);
  }

  // draw canvas
  const colWidth = 160;
  const rowHeight = 30;
  const canvasWidth = Math.max(800, colWidth * rows[0].length);
  const canvasHeight = rowHeight * (rows.length + 2) + 60;
  const cnv = document.createElement("canvas");
  cnv.width = canvasWidth;
  cnv.height = canvasHeight;
  const ctx = cnv.getContext("2d");
  ctx.fillStyle = "#fff";
  ctx.fillRect(0,0,cnv.width,cnv.height);
  ctx.fillStyle = "#17202a";
  ctx.font = "18px Arial";
  ctx.fillText("Hoja de salarios", 12, 28);
  ctx.font = "12px Arial";
  let y = 50;
  rows.forEach((r, ri)=>{
    let x = 12;
    const isHeader = ri === 0;
    r.forEach((cell, ci)=>{
      ctx.fillStyle = isHeader ? "#eaeef6" : "#fff";
      ctx.fillRect(x-4, y-22, colWidth-8, rowHeight);
      ctx.fillStyle = "#17202a";
      ctx.fillText(String(cell), x, y-4);
      x += colWidth;
    });
    y += rowHeight;
  });

  const data = cnv.toDataURL("image/png");
  const a = document.createElement("a");
  a.href = data;
  a.download = `hoja_salarios_${dateToISO(new Date())}.png`;
  a.click();
  toast("Hoja de salarios exportada");
}

// expose some functions for inline button usage
window.showScreen = showScreen;
window.openRegisterUI = openRegisterUI;
window.openNewEmployeeUI = openNewEmployeeUI;
window.openSalaryUI = openSalaryUI;
window.openAguinaldoUI = openAguinaldoUI;

// persist periodically
setInterval(persistAll, 2000);
