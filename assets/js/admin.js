/* =========================================================
   ADMIN · Gestión del sistema
   ========================================================= */

let SES = null;

document.addEventListener("DOMContentLoaded", async () => {
  SES = await API.obtenerUsuarioActual();
  if (!SES) {
    window.location.href = "../index.html";
    return;
  }
  if (SES.rol !== "admin") {
    document.querySelector(".app-shell").innerHTML = `
      <div class="panel text-center" style="margin-top:60px;">
        <div style="font-size:3rem;color:var(--navy);opacity:.3;"><i class="bi bi-shield-lock"></i></div>
        <h2 class="mt-3">Acceso restringido</h2>
        <p class="muted">Esta sección es solo para administradores.</p>
      </div>`;
    return;
  }
  $("#hdrNombre").textContent = SES.nombre;

  $("#btnLogout").onclick = () => {
    API.sesionCerrar();
    window.location.href = "../index.html";
  };

  $$("#tabsAdmin .nav-link").forEach(btn => {
    btn.onclick = () => {
      $$("#tabsAdmin .nav-link").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      cargarTab(btn.dataset.tab);
    };
  });

  cargarTab("usuarios");
});

function cargarTab(tab) {
  const c = $("#tabContent");
  c.innerHTML = `<div class="text-center py-5"><div class="spinner-border text-primary"></div></div>`;
  if (tab === "usuarios")     return renderUsuarios();
  if (tab === "semanas")      return renderSemanas();
  if (tab === "asignaturas")  return renderAsignaturas();
  if (tab === "evaluaciones") return renderEvaluaciones();
  if (tab === "flujos")       return renderFlujos();
}

async function renderUsuarios() {
  const items = await API.obtenerElementos(LISTAS.usuarios);
  $("#tabContent").innerHTML = `
    <h3 style="color:var(--navy);font-size:1.05rem;font-weight:700;margin-bottom:16px;">Usuarios registrados</h3>

    <form id="fUser" class="row g-2 mb-4" style="background:#FAFBFD;padding:16px;border-radius:10px;border:1px solid var(--border);">
      <div class="col-md-2"><input class="form-control" name="NombreUsuario" placeholder="Usuario" required></div>
      <div class="col-md-3"><input class="form-control" name="NombreCompleto" placeholder="Nombre completo" required></div>
      <div class="col-md-3"><input class="form-control" name="Correo" type="email" placeholder="correo@uees.edu.sv" required></div>
      <div class="col-md-2"><input class="form-control" name="Facultad" placeholder="Facultad"></div>
      <div class="col-md-1">
        <select class="form-select" name="Rol">
          <option value="monitor">Monitor</option>
          <option value="admin">Admin</option>
        </select>
      </div>
      <div class="col-md-1"><button class="btn-brand w-100"><i class="bi bi-plus-lg"></i></button></div>
    </form>

    <div class="table-responsive">
      <table class="table">
        <thead><tr><th>Usuario</th><th>Nombre</th><th>Correo</th><th>Rol</th><th>Facultad</th><th></th></tr></thead>
        <tbody>${items.length ? items.map(u => `
          <tr>
            <td>${u.NombreUsuario}</td>
            <td>${u.NombreCompleto}</td>
            <td>${u.Correo || ""}</td>
            <td><span class="badge ${u.Rol === "admin" ? "text-bg-danger" : "text-bg-primary"}">${u.Rol}</span></td>
            <td>${u.Facultad || "—"}</td>
            <td><button class="btn-danger-soft" onclick="delItem('${LISTAS.usuarios}', ${u.Id}, renderUsuarios)">Eliminar</button></td>
          </tr>`).join("") : `<tr><td colspan="6" class="text-center text-muted py-4">Sin registros</td></tr>`}</tbody>
      </table>
    </div>`;

  $("#fUser").onsubmit = async e => {
    e.preventDefault();
    try {
      const datos = Object.fromEntries(new FormData(e.target));
      // La contraseña por defecto será el mismo usuario
      datos.Contrasena = datos.NombreUsuario;
      await API.crearElemento(LISTAS.usuarios, datos);
      toast("Creado", "Usuario agregado correctamente", "ok");
      renderUsuarios();
    } catch (ex) {
      toast("Error", ex.message, "err");
    }
  };
}

async function renderSemanas() {
  let config;
  try {
    config = await API.leerConfig();
  } catch (ex) {
    toast("Error", "No se pudo leer config.json: " + ex.message, "err");
    config = { ciclo: APP.ciclo, anio: APP.anio, semanas: [] };
  }

  const semanas = config.semanas || [];
  while (semanas.length < 6) semanas.push({ num: semanas.length + 1, rango: "" });

  $("#tabContent").innerHTML = `
    <h3 style="color:var(--navy);font-size:1.05rem;font-weight:700;margin-bottom:6px;">
      Configuración de semanas y ciclo
    </h3>
    <p class="text-muted" style="font-size:.85rem;margin-bottom:20px;">
      Estos valores los verán los monitores. Al cambiar de ciclo, actualiza el ciclo, el año y los 6 rangos.
    </p>

    <div class="row g-3 mb-4" style="background:#FAFBFD;padding:16px;border-radius:10px;border:1px solid var(--border);">
      <div class="col-md-6">
        <label class="form-label">Ciclo académico</label>
        <input class="form-control" id="cfgCiclo" value="${config.ciclo || APP.ciclo}" placeholder="Ej: 02-2026">
      </div>
      <div class="col-md-6">
        <label class="form-label">Año</label>
        <input class="form-control" id="cfgAnio" type="number" value="${config.anio || APP.anio}">
      </div>
    </div>

    <h4 style="color:var(--navy);font-size:.95rem;font-weight:700;margin-bottom:12px;">Rangos de cada semana</h4>

    <div id="listaSemanas">
      ${semanas.map((s, i) => `
        <div class="row g-2 mb-2 align-items-center">
          <div class="col-md-2">
            <div style="background:var(--navy);color:#fff;padding:.55rem;border-radius:8px;text-align:center;font-weight:700;">
              Semana ${i + 1}
            </div>
          </div>
          <div class="col-md-10">
            <input class="form-control inputSemana" data-num="${i + 1}"
                   value="${s.rango || ''}"
                   placeholder="Ej: del 24 al 29 de agosto">
          </div>
        </div>`).join("")}
    </div>

    <button class="btn-brand mt-3" id="btnGuardarSemanas">
      <i class="bi bi-save me-1"></i>Guardar configuración
    </button>

    <div style="background:#FFF8DB;border-left:4px solid var(--gold);padding:12px 16px;border-radius:8px;margin-top:20px;font-size:.85rem;">
      <strong>💡 Tip:</strong> Cuando comience el nuevo ciclo, cambia el ciclo y año, actualiza los 6 rangos y guarda.
    </div>`;

  $("#btnGuardarSemanas").onclick = async () => {
    const ciclo = $("#cfgCiclo").value.trim();
    const anio = parseInt($("#cfgAnio").value);
    const nuevasSemanas = [];
    document.querySelectorAll(".inputSemana").forEach(inp => {
      const rango = inp.value.trim();
      if (rango) nuevasSemanas.push({ num: parseInt(inp.dataset.num), rango });
    });

    if (!ciclo || !anio || !nuevasSemanas.length) {
      return toast("Faltan datos", "Completa el ciclo, el año y al menos una semana.", "err");
    }

    try {
      await API.guardarConfig({ ciclo, anio, semanas: nuevasSemanas });
      APP.ciclo = ciclo;
      APP.anio = anio;
      toast("Guardado", "La configuración del ciclo se actualizó", "ok");
    } catch (ex) {
      toast("Error al guardar", ex.message, "err");
    }
  };
}

async function renderAsignaturas() {
  const items = await API.obtenerElementos(LISTAS.asignaturas);
  $("#tabContent").innerHTML = `
    <h3 style="color:var(--navy);font-size:1.05rem;font-weight:700;margin-bottom:6px;">Asignaturas registradas</h3>
    <p class="text-muted" style="font-size:.85rem;margin-bottom:16px;">
      Total: <strong>${items.length}</strong> asignaturas. Para modificaciones masivas, edita la lista directamente en Microsoft Lists.
    </p>
    <div class="table-responsive">
      <table class="table">
        <thead><tr><th>Facultad</th><th>Carrera</th><th>Asignatura</th><th>Secc.</th><th>Docente</th><th>Correo</th><th>Monitor</th></tr></thead>
        <tbody>${items.length ? items.map(a => `
          <tr>
            <td>${a[COL.facultad] || ""}</td>
            <td>${a[COL.carrera] || ""}</td>
            <td>${a[COL.asignatura] || ""}</td>
            <td>${getSeccion(a) || ""}</td>
            <td>${a[COL.docente] || ""}</td>
            <td>${a[COL.emailDocente] || ""}</td>
            <td>${a[COL.emailMonitor] || ""}</td>
          </tr>`).join("") : `<tr><td colspan="7" class="text-center text-muted py-4">Sin registros</td></tr>`}</tbody>
      </table>
    </div>`;
}

async function renderEvaluaciones() {
  const items = await API.obtenerElementos(
    LISTAS.evaluaciones,
    `Periodo eq '${APP.ciclo}'`,
    "$orderby=Semana desc, Asignatura&$top=200"
  );
  $("#tabContent").innerHTML = `
    <h3 style="color:var(--navy);font-size:1.05rem;font-weight:700;margin-bottom:6px;">Evaluaciones recientes</h3>
    <p class="text-muted" style="font-size:.85rem;margin-bottom:16px;">Últimas 200 evaluaciones del ciclo ${APP.ciclo}.</p>
    <div class="table-responsive">
      <table class="table">
        <thead><tr><th>Monitor</th><th>Asignatura</th><th>Sem.</th><th>Ruta</th><th>Lectura</th><th>Foros</th><th>Eval.</th><th>Motiv.</th><th>Enviada</th></tr></thead>
        <tbody>${items.length ? items.map(e => `
          <tr>
            <td>${e.Monitor || ""}</td>
            <td>${e.Asignatura || ""}</td>
            <td>${e.Semana || ""}</td>
            <td>${badge(e.ruta)}</td>
            <td>${badge(e.lectura)}</td>
            <td>${badge(e.foros)}</td>
            <td>${badge(e.evaluacion)}</td>
            <td>${badge(e.motivacion)}</td>
            <td>${e.Enviada ? '<span style="color:var(--ok);font-weight:700;">✓</span>' : '<span class="text-muted">—</span>'}</td>
          </tr>`).join("") : `<tr><td colspan="9" class="text-center text-muted py-4">Sin evaluaciones registradas</td></tr>`}</tbody>
      </table>
    </div>`;
}

function badge(v) {
  if (v === "SI")  return '<span class="badge text-bg-success">Sí</span>';
  if (v === "NO")  return '<span class="badge text-bg-danger">No</span>';
  if (v === "N/A") return '<span class="badge text-bg-secondary">N/A</span>';
  return '<span class="text-muted">—</span>';
}

async function renderFlujos() {
  const items = await API.obtenerElementos(LISTAS.usuarios, `Rol eq 'monitor'`);
  $("#tabContent").innerHTML = `
    <h3 style="color:var(--navy);font-size:1.05rem;font-weight:700;margin-bottom:6px;">Flujos de correo por monitor</h3>
    <p class="text-muted" style="font-size:.85rem;margin-bottom:16px;">
      Cada monitor crea su propio flujo en Power Automate. Pega aquí la URL para que el sistema la use al enviar informes.
    </p>
    <div class="table-responsive">
      <table class="table">
        <thead><tr><th style="min-width:140px;">Monitor</th><th style="min-width:200px;">Correo</th><th>URL del flujo</th><th></th></tr></thead>
        <tbody>${items.map(u => `
          <tr>
            <td>${u.NombreUsuario}</td>
            <td>${u.Correo || ""}</td>
            <td><input class="form-control form-control-sm" id="url-${u.Id}" value="${u.UrlFlujoCorreo || ""}" placeholder="https://prod-..."></td>
            <td><button class="btn-brand" onclick="guardarUrl(${u.Id})">Guardar</button></td>
          </tr>`).join("")}</tbody>
      </table>
    </div>`;
}

window.guardarUrl = async (id) => {
  const url = $(`#url-${id}`).value.trim();
  try {
    await API.actualizarElemento(LISTAS.usuarios, id, { UrlFlujoCorreo: url });
    toast("Guardado", "URL actualizada correctamente", "ok");
  } catch (ex) {
    toast("Error", ex.message, "err");
  }
};

window.delItem = async (lista, id, cb) => {
  if (!confirm("¿Eliminar este registro?")) return;
  try {
    await API.eliminarElemento(lista, id);
    toast("Eliminado", "Registro borrado correctamente", "ok");
    cb && cb();
  } catch (ex) {
    toast("Error", ex.message, "err");
  }
};