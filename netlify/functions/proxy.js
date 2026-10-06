/* =========================================================
   PROXY · Reenvía peticiones del frontend a Power Automate
   Evita el bloqueo CORS del navegador
   ========================================================= */

const FLUJOS = {
  datos:   process.env.PA_DATOS_URL,
  semanas: process.env.PA_SEMANAS_URL
};

exports.handler = async (event) => {
  // Preflight CORS
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type"
      },
      body: "OK"
    };
  }

  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: "Method Not Allowed"
    };
  }

  try {
    const body = JSON.parse(event.body || "{}");
    const destino = body.destino;

    let urlFlujo;

    if (destino === "datos") {
      urlFlujo = FLUJOS.datos;
    } else if (destino === "semanas") {
      urlFlujo = FLUJOS.semanas;
    } else if (destino === "correo") {
      // El frontend envía la URL del flujo personal del monitor
      urlFlujo = body.urlCorreo;
      delete body.urlCorreo;
    } else {
      return {
        statusCode: 400,
        headers: { "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify({ error: `Destino desconocido: ${destino}` })
      };
    }

    if (!urlFlujo) {
      return {
        statusCode: 500,
        headers: { "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify({ error: `URL no configurada para destino: ${destino}` })
      };
    }

    const r = await fetch(urlFlujo, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });

    const texto = await r.text();

    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "application/json"
      },
      body: texto
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ error: err.message })
    };
  }
};