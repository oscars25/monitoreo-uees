/* =========================================================
   DASHBOARD · Evaluación semanal
   ========================================================= */

let STATE = {
  usuario: null,
  semanas: [],
  carreras: [],
  asignaturas: [],
  carrera: null,
  asignatura: null,
  evaluacion: null,
  semana: 1
};

document.addEventListener("DOMContentLoaded", async () => {
  // Verificar sesión
  STATE.usuario = await API.obtenerUsuarioActual();
  if (!STATE.usuario) {
    window.location.href = "../index.html";
    return;
  }

  // Cargar semanas
  const config = await API.leerConfig();
  STATE.semanas = config.semanas || [];
  APP.ciclo = config.ciclo || APP.ciclo;
  APP.anio  = config.anio  || APP.anio;

  $("#hdrUsuario").textContent = STATE.usuario.nombre;
  $("#hdrCiclo").textContent = APP.ciclo;

  // Selector de semanas
  const sel = $("#selSemana");
  sel.innerHTML = "";
  STATE.semanas.forEach(s => {
    const o = document.createElement("option");
    o.value = s.num;
    o.textContent = `Semana ${s.num} — ${s.rango}`;
    sel.appendChild(o);
  });
  sel.value = STATE.semanas[0]?.num || 1;
  STATE.semana = +sel.value;

  sel.onchange = () => {
    STATE.semana = +sel.value;
    actualizarInfoDia();
    if (STATE.asignatura && !$("#step3").classList.contains("hidden")) {
      cargarEvaluacionYRenderizar();
    }
  };

  $("#btnLogout").onclick = () => {
    API.sesionCerrar();
    window.location.href = "../index.html";
  };

  actualizarInfoDia();
  await cargarAsignaturas();
  configurarBotones();
  configurarRTEToolbar();
  goToStep(1);
});

function actualizarInfoDia() {
  const d = diaActual();
  const info = $("#infoDia");
  if (d === "lunes") {
    info.innerHTML = `<strong>Hoy es lunes.</strong> Completa los criterios iniciales y las observaciones. El criterio de <em>motivación</em> se completará el viernes.`;
  } else if (d === "viernes") {
    info.innerHTML = `<strong>Hoy es viernes.</strong> Completa el criterio de <em>motivación</em> y ajusta lo necesario.`;
  } else {
    info.innerHTML = `Puedes completar o editar la evaluación de la semana seleccionada.`;
  }
}

async function cargarAsignaturas() {
  try {
    const facultad = obtenerFacultadUsuario();
    if (!facultad) {
      throw new Error("El usuario no tiene una facultad asignada.");
    }

    // La facultad del monitor define el universo de asignaturas disponibles.
    const filtro = `${COL.facultad} eq '${escaparFiltroOData(facultad)}'`;
    const items = await API.obtenerElementos(LISTAS.asignaturas, filtro);
    STATE.asignaturas = items
      .map(normalizarAsignatura)
      .filter(a => normalizarTexto(a[COL.facultad]) === normalizarTexto(facultad));

    const mapa = {};
    STATE.asignaturas.forEach(a => {
      const nombre = a[COL.carrera] || "Sin carrera asignada";
      if (!mapa[nombre]) mapa[nombre] = { nombre };
    });
    STATE.carreras = Object.values(mapa);
    renderCarreras();
  } catch (ex) {
    console.error(ex);
    $("#carrerasList").innerHTML = `
      <div class="col-12">
        <div class="empty-state">
          <i class="bi bi-exclamation-triangle"></i>
          <p class="mb-0">No se pudieron cargar las asignaturas</p>
          <small class="text-muted">${ex.message}</small>
        </div>
      </div>`;
  }
}

function obtenerFacultadUsuario() {
  return STATE.usuario.facultad ||
    STATE.usuario.FACULTAD ||
    STATE.usuario.faculty ||
    "";
}

function escaparFiltroOData(valor) {
  return String(valor).replace(/'/g, "''");
}

function normalizarTexto(valor) {
  return String(valor || "").trim().toLocaleLowerCase();
}

function normalizarAsignatura(item) {
  const valor = (...nombres) => {
    for (const nombre of nombres) {
      if (item[nombre] !== undefined && item[nombre] !== null) return item[nombre];
    }
    return "";
  };

  return {
    ...item,
    [COL.facultad]: valor(COL.facultad, "facultad"),
    [COL.carrera]: valor(COL.carrera, "carrera"),
    [COL.asignatura]: valor(COL.asignatura, "asignatura"),
    [COL.seccion]: valor(COL.seccion, "seccion", "SECCION", "Sección"),
    [COL.docente]: valor(COL.docente, "docente"),
    [COL.emailDocente]: valor(COL.emailDocente, "emailDocente", "correo"),
    [COL.emailMonitor]: valor(COL.emailMonitor, "emailMonitor")
  };
}

function goToStep(n) {
  [1, 2, 3, 4].forEach(i => $(`#step${i}`).classList.add("hidden"));
  const sec = $(`#step${n}`);
  sec.classList.remove("hidden");
  sec.classList.remove("fade-in"); void sec.offsetWidth; sec.classList.add("fade-in");

  $$(".step-item").forEach(el => {
    const s = +el.dataset.step;
    el.classList.toggle("active", s === n);
    el.classList.toggle("done", s < n);
  });

  if (n === 4) renderResumen();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function renderCarreras() {
  const cont = $("#carrerasList");
  cont.innerHTML = "";
  if (!STATE.carreras.length) {
    cont.innerHTML = `
      <div class="col-12">
        <div class="empty-state">
          <i class="bi bi-inbox"></i>
          <p>No tienes carreras asignadas.</p>
        </div>
      </div>`;
    return;
  }
  STATE.carreras.forEach(c => {
    const col = document.createElement("div");
    col.className = "col-12 col-md-6";
    col.innerHTML = `
      <div class="select-card">
        <div class="icon"><i class="bi bi-bookmark"></i></div>
        <div>
          <h6>${c.nombre}</h6>
          <small>Seleccionar esta carrera</small>
        </div>
      </div>`;
    col.querySelector(".select-card").onclick = () => {
      STATE.carrera = c;
      STATE.asignatura = null;
      renderAsignaturas();
      goToStep(2);
    };
    cont.appendChild(col);
  });
}

function renderAsignaturas() {
  $("#asignaturaSubtitle").textContent = STATE.carrera.nombre;
  const cont = $("#asignaturasList");
  cont.innerHTML = "";

  const filtradas = STATE.asignaturas.filter(
    a => (a[COL.carrera] || "Sin carrera asignada") === STATE.carrera.nombre
  );

  if (!filtradas.length) {
    cont.innerHTML = `
      <div class="empty-state">
        <i class="bi bi-inbox"></i>
        <p>No hay asignaturas para esta carrera.</p>
      </div>`;
    $("#btnComenzar").disabled = true;
    return;
  }

  filtradas.forEach(a => {
    const row = document.createElement("div");
    row.className = "assign-row";
    row.innerHTML = `
      <span class="status-dot"></span>
      <div class="flex-grow-1">
        <div class="fw-bold">${a[COL.asignatura] || "(sin nombre)"}</div>
        <small class="text-muted">
          <i class="bi bi-person me-1"></i>${a[COL.docente] || "—"}
          &nbsp;·&nbsp; Sección ${getSeccion(a) || "—"}
          &nbsp;·&nbsp; <i class="bi bi-envelope me-1"></i>${a[COL.emailDocente] || "—"}
        </small>
      </div>`;
    row.onclick = () => {
      STATE.asignatura = a;
      $$("#asignaturasList .assign-row").forEach(r => r.classList.remove("selected"));
      row.classList.add("selected");
      $("#btnComenzar").disabled = false;
    };
    cont.appendChild(row);
  });

  $("#btnComenzar").disabled = !STATE.asignatura;
}

async function cargarEvaluacionYRenderizar() {
  await cargarEvaluacionExistente();
  renderCriterios();
  goToStep(3);
}

async function cargarEvaluacionExistente() {
  STATE.evaluacion = null;
  try {
    const filtro =
      `Monitor eq '${STATE.usuario.usuario}' and ` +
      `AsignaturaId eq ${STATE.asignatura.Id} and ` +
      `Semana eq ${STATE.semana} and ` +
      `Anio eq ${APP.anio}`;
    const items = await API.obtenerElementos(LISTAS.evaluaciones, filtro);
    if (items.length) STATE.evaluacion = items[0];
  } catch (ex) {
    console.warn("Sin evaluación previa:", ex.message);
  }
}

function renderCriterios() {
  const a = STATE.asignatura;
  const ev = STATE.evaluacion || {};
  const d = diaActual();

  $("#evalTitle").innerHTML = `<i class="bi bi-clipboard2-check me-2"></i>${a[COL.asignatura]}`;
  $("#evalSubtitle").textContent = `${a[COL.docente]} · Sección ${getSeccion(a)} · Semana ${STATE.semana}`;

  $("#docenteCard").innerHTML = `
    <div class="dc-icon"><i class="bi bi-person-badge"></i></div>
    <div class="flex-grow-1">
      <div class="dc-label">Docente titular</div>
      <div class="dc-value">${a[COL.docente] || "—"}</div>
      <div class="dc-value correo">${a[COL.emailDocente] || "—"}</div>
    </div>
    <div class="text-end">
      <div class="dc-label">Sección</div>
      <div class="dc-value">${getSeccion(a) || "—"}</div>
    </div>`;

  const cont = $("#criteriosForm");
  cont.innerHTML = "";

  CRITERIOS.forEach(c => {
    const esViernes = CRITERIOS_VIERNES.includes(c.key);
    const bloquearPorDia = d === "lunes" && esViernes;
    const v = ev[c.key] || "";

    const div = document.createElement("div");
    div.className = "criterio" + (bloquearPorDia ? " bloqueado" : "");
    div.innerHTML = `
      <label class="q">
        <i class="bi ${c.icon}"></i>
        ${c.label}
        ${bloquearPorDia ? '<span class="badge text-bg-light border ms-auto" style="font-size:.7rem;">Se completa el viernes</span>' : ''}
      </label>
      <div class="seg">
        <input type="radio" name="c-${c.key}" id="${c.key}-si" value="SI"
          ${v === "SI" ? "checked" : ""} ${bloquearPorDia ? "disabled" : ""}>
        <label for="${c.key}-si" class="opt-si">Sí</label>
        <input type="radio" name="c-${c.key}" id="${c.key}-no" value="NO"
          ${v === "NO" ? "checked" : ""} ${bloquearPorDia ? "disabled" : ""}>
        <label for="${c.key}-no" class="opt-no">No</label>
        <input type="radio" name="c-${c.key}" id="${c.key}-na" value="N/A"
          ${v === "N/A" ? "checked" : ""} ${bloquearPorDia ? "disabled" : ""}>
        <label for="${c.key}-na" class="opt-na">N/A</label>
      </div>`;
    cont.appendChild(div);
  });

  $("#obsSemana").value = ev.Observaciones || "";
  $("#rteMensaje").innerHTML = ev.MensajeCorreo || "";

  actualizarContadorObs();

  const autoGuardar = debounce(() => guardarEvaluacion(true), 900);
  $$("#criteriosForm input[type=radio]").forEach(r => r.onchange = autoGuardar);
  $("#obsSemana").oninput = () => { actualizarContadorObs(); autoGuardar(); };
  $("#rteMensaje").oninput = autoGuardar;

  actualizarProgreso();
}

function actualizarContadorObs() {
  const n = ($("#obsSemana").value || "").trim().length;
  const el = $("#obsCounter");
  el.textContent = `${n} caracteres`;
  el.style.color = n < 20 ? "var(--bad)" : "var(--ok)";
}

function recopilarDatos() {
  const a = STATE.asignatura;
  const datos = {
    Monitor: STATE.usuario.usuario,
    MonitorNombre: STATE.usuario.nombre,
    MonitorCorreo: STATE.usuario.correo,
    Facultad: a[COL.facultad] || "",
    Carrera: a[COL.carrera] || "",
    AsignaturaId: a.Id,
    Asignatura: a[COL.asignatura] || "",
    Seccion: String(getSeccion(a) || ""),
    Docente: a[COL.docente] || "",
    Correo: a[COL.emailDocente] || "",
    CoordinadorCorreo: a[COL.coordinador] || "",
    Semana: STATE.semana,
    Anio: APP.anio,
    Periodo: APP.ciclo,
    Observaciones: $("#obsSemana").value || "",
    MensajeCorreo: $("#rteMensaje").innerHTML || ""
  };
  CRITERIOS.forEach(c => {
    const checked = document.querySelector(`input[name="c-${c.key}"]:checked`);
    datos[c.key] = checked ? checked.value : "";
  });
  return datos;
}

async function guardarEvaluacion(silencioso = false) {
  const datos = recopilarDatos();
  try {
    if (STATE.evaluacion && STATE.evaluacion.Id) {
      await API.actualizarElemento(LISTAS.evaluaciones, STATE.evaluacion.Id, datos);
    } else {
      const r = await API.crearElemento(LISTAS.evaluaciones, datos);
      STATE.evaluacion = { ...datos, Id: r.Id || r.item?.Id };
    }
    if (!silencioso) toast("Guardado", "Evaluación guardada correctamente", "ok");
    actualizarProgreso();
  } catch (ex) {
    console.error(ex);
    if (!silencioso) toast("Error al guardar", ex.message, "err");
  }
}

function actualizarProgreso() {
  const datos = recopilarDatos();
  const completos = CRITERIOS.filter(c => ["SI", "NO", "N/A"].includes(datos[c.key])).length;
  const pct = (completos / CRITERIOS.length) * 100;
  $("#evalProgressBar").style.width = pct + "%";
  $("#evalProgressBadge").textContent = `${completos} / ${CRITERIOS.length} criterios`;

  const obsOk = (datos.Observaciones || "").trim().length >= 20;
  $("#btnFinalizar").disabled = !(completos === CRITERIOS.length && obsOk);
}

function renderResumen() {
  const a = STATE.asignatura;
  $("#resumenSubtitle").textContent = `${a[COL.asignatura]} · ${a[COL.docente]} · Semana ${STATE.semana}`;

  const datos = recopilarDatos();
  let si = 0, no = 0, na = 0;
  CRITERIOS.forEach(c => {
    if (datos[c.key] === "SI") si++;
    else if (datos[c.key] === "NO") no++;
    else if (datos[c.key] === "N/A") na++;
  });
  $("#statCompletos").textContent = si + no + na;
  $("#statSI").textContent = si;
  $("#statNO").textContent = no;
  $("#statNA").textContent = na;

  const cont = $("#resumenCriterios");
  cont.innerHTML = CRITERIOS.map(c => {
    const v = datos[c.key] || "—";
    const cls = v === "SI" ? "si" : v === "NO" ? "no" : v === "N/A" ? "na" : "";
    return `<div class="resumen-item">
      <i class="bi ${c.icon}" style="color:var(--navy-light);"></i>
      <span class="ri-label">${c.label}</span>
      <span class="ri-value ${cls}">${v}</span>
    </div>`;
  }).join("");
}

function configurarBotones() {
  $$("[data-step]").forEach(b => b.onclick = () => goToStep(+b.dataset.step));

  $("#btnComenzar").onclick = () => {
    if (!STATE.asignatura) return;
    cargarEvaluacionYRenderizar();
  };

  $("#btnGuardar").onclick = () => guardarEvaluacion(false);

  $("#btnFinalizar").onclick = async () => {
    await guardarEvaluacion(true);
    goToStep(4);
  };

  $("#btnEnviar").onclick = async () => {
    const btn = $("#btnEnviar");
    btn.disabled = true;
    btn.innerHTML = `<span class="spinner-border spinner-border-sm me-1"></span>Enviando...`;

    try {
      const datos = recopilarDatos();
      await API.enviarCorreo({
        tipo: "individual",
        ...datos,
        tutor_nombre: datos.Docente,
        tutor_correo: datos.Correo,
        ciclo: APP.ciclo
      });

      if (STATE.evaluacion?.Id) {
        await API.actualizarElemento(LISTAS.evaluaciones, STATE.evaluacion.Id, {
          Enviada: true,
          EnviadaEn: new Date().toISOString()
        });
      }

      toast("Enviado", `Informe enviado a ${datos.Docente}`, "ok");
    } catch (ex) {
      toast("Error al enviar", ex.message, "err");
    } finally {
      btn.disabled = false;
      btn.innerHTML = `<i class="bi bi-envelope-fill me-1"></i>Enviar al docente`;
    }
  };

  $("#btnConsolidado").onclick = async () => {
    if (!STATE.carrera) return;

    const asignaturasCarrera = STATE.asignaturas.filter(
      a => (a[COL.carrera] || "") === STATE.carrera.nombre
    );
    const coordinadorCorreo = asignaturasCarrera[0]?.[COL.coordinador] || "";

    if (!coordinadorCorreo) {
      toast("Sin coordinador", "No hay correo de coordinador registrado para esta carrera.", "err");
      return;
    }

    if (!confirm(`¿Enviar el consolidado de "${STATE.carrera.nombre}" al coordinador <${coordinadorCorreo}>?`)) return;

    const btn = $("#btnConsolidado");
    btn.disabled = true;
    btn.innerHTML = `<span class="spinner-border spinner-border-sm me-1"></span>Generando...`;

    try {
      const filtro =
        `Monitor eq '${STATE.usuario.usuario}' and ` +
        `Carrera eq '${STATE.carrera.nombre}' and ` +
        `Periodo eq '${APP.ciclo}'`;
      const evals = await API.obtenerElementos(
        LISTAS.evaluaciones,
        filtro,
        "$orderby=Asignatura, Semana&$top=500"
      );

      if (!evals.length) {
        toast("Sin evaluaciones", "No hay evaluaciones registradas para esta carrera.", "err");
        return;
      }

      await API.enviarCorreo({
        tipo: "consolidado",
        monitor: STATE.usuario.usuario,
        monitor_nombre: STATE.usuario.nombre,
        monitor_correo: STATE.usuario.correo,
        facultad: STATE.usuario.facultad,
        carrera: STATE.carrera.nombre,
        ciclo: APP.ciclo,
        destinatario: coordinadorCorreo,
        coordinador_nombre: "Coordinador de carrera",
        total_evaluaciones: evals.length,
        evaluaciones: evals
      });

      toast("Enviado", `Consolidado enviado a ${coordinadorCorreo}`, "ok");
    } catch (ex) {
      toast("Error al enviar consolidado", ex.message, "err");
    } finally {
      btn.disabled = false;
      btn.innerHTML = `<i class="bi bi-file-earmark-pdf me-1"></i>Enviar consolidado`;
    }
  };
}

function configurarRTEToolbar() {
  $$(".rte-toolbar button").forEach(btn => {
    btn.addEventListener("click", e => {
      e.preventDefault();
      document.execCommand(btn.dataset.cmd, false, null);
      $("#rteMensaje").focus();
    });
  });
}