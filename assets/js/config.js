/* =========================================================
   CONFIGURACIÓN GENERAL DEL SISTEMA
   Monitor Virtual UEES · Versión Netlify
   ========================================================= */

const APP = {
  nombre: "Monitor Virtual UEES",
  ciclo: "02-2026",
  anio: 2026
};

/* Nombres EXACTOS de las listas en SharePoint */
const LISTAS = {
  usuarios:     "Usuarios",
  asignaturas:  "ASIGNATURAS VIRTUALES",
  evaluaciones: "Evaluaciones"
};

/* Nombres EXACTOS de las columnas de ASIGNATURAS VIRTUALES */
const COL = {
  facultad:      "FACULTAD",
  carrera:       "CARRERA",
  asignatura:    "ASIGNATURA",
  seccion:       "SECCIÓN",
  docente:       "DOCENTE",
  emailDocente:  "EMAIL_DOCENTE",
  emailMonitor:  "EMAIL_MONITOR",
  coordinador:   "COORDINADOR_EMAIL"
};

function getSeccion(item) {
  return item[COL.seccion] || item["SECCION"] || item["SECCI_x00f3_n"] || item["Sección"] || item["Seccion"] || "";
}

/* Correos de referencia (los reales vienen de la lista Usuarios) */
const MONITORES = {
  "oscar.santos":   "oscar.santos@uees.edu.sv",
  "monitor.fccss":  "monitor.fccss@uees.edu.sv",
  "monitor.fccee":  "monitor.fccee@uees.edu.sv",
  "monitor.fiuees": "monitor.fiuees@uees.edu.sv",
  "monitor.fccjj":  "monitor.fccjj@uees.edu.sv",
  "monitor.fouees": "monitor.fouees@uees.edu.sv"
};

/* Criterios fijos del modelo educativo */
const CRITERIOS = [
  { key:"ruta",       label:"Cumplimiento de la Ruta de Aprendizaje",                      icon:"bi-list-task",       dia:"lunes"   },
  { key:"lectura",    label:"Incluye lectura principal (mediador pedagógico H5P)",         icon:"bi-file-text",       dia:"lunes"   },
  { key:"foros",      label:"Realiza foros de consulta e interacción",                      icon:"bi-chat-left-text",  dia:"lunes"   },
  { key:"evaluacion", label:"Evaluación semanal formativa o sumativa",                      icon:"bi-clipboard-check", dia:"lunes"   },
  { key:"motivacion", label:"Motiva la interacción y participación activa del estudiante",  icon:"bi-people",          dia:"viernes" }
];

const CRITERIOS_VIERNES = ["motivacion"];