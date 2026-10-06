/* =========================================================
   PERFIL · Datos del usuario y prueba de correo
   ========================================================= */

let SES = null;

document.addEventListener("DOMContentLoaded", async () => {
  SES = await API.obtenerUsuarioActual();
  if (!SES) {
    window.location.href = "../index.html";
    return;
  }

  $("#btnLogout").onclick = () => {
    API.sesionCerrar();
    window.location.href = "../index.html";
  };

  $("#pUsuario").value  = SES.usuario;
  $("#pNombre").value   = SES.nombre;
  $("#pCorreo").value   = SES.correo;
  $("#pFacultad").value = SES.facultad || "—";
  $("#pRol").value      = SES.rol === "admin" ? "Administrador" : "Monitor";

  $("#pUrlCorreo").value = SES.urlCorreo
    ? "Configurado correctamente"
    : "Sin configurar — Contacta al administrador";

  $("#btnProbarCorreo").onclick = async () => {
    if (!SES.urlCorreo) {
      return toast("Sin flujo", "Aún no tienes un flujo de correo configurado.", "err");
    }
    const btn = $("#btnProbarCorreo");
    btn.disabled = true;
    btn.innerHTML = `<span class="spinner-border spinner-border-sm me-1"></span>Enviando...`;
    try {
      await API.enviarCorreo({
        prueba: true,
        tipo: "individual",
        monitor: SES.usuario,
        monitor_nombre: SES.nombre,
        monitor_correo: SES.correo,
        tutor_nombre: SES.nombre,
        tutor_correo: SES.correo,
        asignatura: "Prueba de configuración del sistema",
        seccion: "—",
        carrera: "—",
        facultad: "—",
        ciclo: APP.ciclo,
        observaciones: "Este es un correo de prueba enviado desde el sistema Monitor Virtual UEES.",
        semanas: []
      });
      toast("Enviado", "Revisa tu bandeja de entrada para confirmar", "ok");
    } catch (ex) {
      toast("Error al enviar", ex.message, "err");
    } finally {
      btn.disabled = false;
      btn.innerHTML = `<i class="bi bi-send-check me-1"></i>Enviar correo de prueba`;
    }
  };
});