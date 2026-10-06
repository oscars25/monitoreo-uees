/* =========================================================
   API · Vía proxy Netlify → Power Automate
   ========================================================= */

const $  = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => [...c.querySelectorAll(s)];

const API = {

  /* =========================================================
     LOGIN
     ========================================================= */
  async login(usuario, password) {
    try {
      const r = await this._llamar("datos", {
        accion: "login",
        usuario,
        password
      });
      if (r && r.ok && r.usuario) {
        this.sesionGuardar(r.usuario);
        return r.usuario;
      }
      return null;
    } catch (ex) {
      console.error("Error en login:", ex);
      return null;
    }
  },

  async obtenerUsuarioActual() {
    const sesion = this.sesionObtener();
    if (!sesion || !sesion.correo) return null;
    return sesion;
  },

  sesionGuardar(usuario) {
    localStorage.setItem("mv_sesion", JSON.stringify(usuario));
  },

  sesionObtener() {
    try {
      return JSON.parse(localStorage.getItem("mv_sesion") || "null");
    } catch { return null; }
  },

  sesionCerrar() {
    localStorage.removeItem("mv_sesion");
  },

  /* =========================================================
     LISTAS
     ========================================================= */
  async obtenerElementos(nombreLista, filtro = "", extras = "") {
    const r = await this._llamar("datos", {
      accion: "listar",
      lista: nombreLista,
      filtro,
      extras
    });
    return r.items || [];
  },

  async crearElemento(nombreLista, datos) {
    return this._llamar("datos", {
      accion: "crear",
      lista: nombreLista,
      datos
    });
  },

  async actualizarElemento(nombreLista, id, datos) {
    return this._llamar("datos", {
      accion: "actualizar",
      lista: nombreLista,
      id,
      datos
    });
  },

  async eliminarElemento(nombreLista, id) {
    return this._llamar("datos", {
      accion: "eliminar",
      lista: nombreLista,
      id
    });
  },

  /* =========================================================
     CONFIG.JSON (semanas)
     ========================================================= */
  async leerConfig() {
    try {
      const r = await this._llamar("semanas", { accion: "leer" });
      if (r && r.config) return r.config;
      throw new Error("Sin config");
    } catch (ex) {
      console.warn("Config por defecto:", ex.message);
      return {
        ciclo: APP.ciclo,
        anio: APP.anio,
        semanas: [
          { num:1, rango:"Semana 1" }, { num:2, rango:"Semana 2" },
          { num:3, rango:"Semana 3" }, { num:4, rango:"Semana 4" },
          { num:5, rango:"Semana 5" }, { num:6, rango:"Semana 6" }
        ]
      };
    }
  },

  async guardarConfig(config) {
    return this._llamar("semanas", { accion: "guardar", config });
  },

  /* =========================================================
     ENVÍO DE CORREO
     El frontend manda la URL del flujo del monitor logueado
     ========================================================= */
  async enviarCorreo(datos) {
    const sesion = this.sesionObtener();
    if (!sesion || !sesion.urlCorreo) {
      throw new Error("No tienes un flujo de correo configurado");
    }
    return this._llamar("correo", {
      urlCorreo: sesion.urlCorreo,
      ...datos
    });
  },

  /* =========================================================
     LLAMADA AL PROXY
     ========================================================= */
  async _llamar(destino, payload) {
    const r = await fetch("/api/" + destino, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ destino, ...payload })
    });

    if (!r.ok) {
      const err = await r.text();
      throw new Error(`HTTP ${r.status}: ${err.substring(0, 200)}`);
    }

    return r.json();
  }
};

/* =========================================================
   HELPERS
   ========================================================= */

function toast(title, msg, kind = "info") {
  const cont = $("#toasts");
  if (!cont) return;
  const el = document.createElement("div");
  el.className = `toast-card ${kind === "ok" ? "ok" : kind === "err" ? "err" : ""}`;
  el.innerHTML = `<h6>${title}</h6><p>${msg}</p>`;
  cont.appendChild(el);
  setTimeout(() => {
    el.style.opacity = "0";
    el.style.transition = ".3s";
    setTimeout(() => el.remove(), 300);
  }, 3800);
}

function debounce(fn, wait) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), wait);
  };
}

function diaActual() {
  const d = new Date().getDay();
  if (d === 1) return "lunes";
  if (d === 5) return "viernes";
  return "otro";
}