/* manual.js - Bombos 1..4 integrados con botones para avanzar
   Archivos al mismo nivel: sorteo-manual.html, manual.css, manual.js
*/

/* -----------------------
   Datos iniciales
   ----------------------- */
const ordenGrupos = ["A","B","C","D","E","F","G","H","I","J","K","L"];
const HOSTS = ["México","Canadá","Estados Unidos"];

// grupos: cada grupo almacena una lista de equipos (orden B1, B2, B3, B4)
const grupos = {
  A: ["México"], B: ["Canadá"], C: [], D: ["Estados Unidos"],
  E: [], F: [], G: [], H: [], I: [], J: [], K: [], L: []
};

// Bloques (solo para regla B1 España/Argentina)
const bloque1 = ["E","I","F","H","D","G"];
const bloque2 = ["C","A","J","L","B","K"];

/* Bombos */
let bombo1 = ["España","Argentina","Francia","Inglaterra","Brasil","Portugal","Países Bajos","Bélgica","Alemania"];
let bombo2 = ["Australia","Austria","Colombia","Corea del Sur","Croacia","Ecuador","Irán","Japón","Marruecos","Senegal","Suiza","Uruguay"];
let bombo3 = ["Arabia Saudita","Argelia","Costa de Marfil","Egipto","Escocia","Noruega","Panamá","Paraguay","Qatar","Sudáfrica","Túnez","Uzbekistán"];
let bombo4 = ["Jordania","Cabo Verde","Ghana","Curazao","Haití","Nueva Zelanda","R EUR 1","R EUR 2","R EUR 3","R EUR 4","R INT 1","R INT 2"];

/* Confederaciones */
const confederacion = {
  "España":"UEFA","Argentina":"CONMEBOL","Francia":"UEFA","Inglaterra":"UEFA","Brasil":"CONMEBOL","Portugal":"UEFA","Países Bajos":"UEFA","Bélgica":"UEFA","Alemania":"UEFA",
  "Australia":"AFC","Austria":"UEFA","Colombia":"CONMEBOL","Corea del Sur":"AFC","Croacia":"UEFA","Ecuador":"CONMEBOL","Irán":"AFC","Japón":"AFC","Marruecos":"CAF","Senegal":"CAF","Suiza":"UEFA","Uruguay":"CONMEBOL",
  "Arabia Saudita":"AFC","Argelia":"CAF","Costa de Marfil":"CAF","Egipto":"CAF","Escocia":"UEFA","Noruega":"UEFA","Panamá":"CONCACAF","Paraguay":"CONMEBOL","Qatar":"AFC","Sudáfrica":"CAF","Túnez":"CAF","Uzbekistán":"AFC",
  "Jordania":"AFC","Cabo Verde":"CAF","Ghana":"CAF","Curazao":"CONCACAF","Haití":"CONCACAF","Nueva Zelanda":"OFC",
  "R EUR 1":"UEFA","R EUR 2":"UEFA","R EUR 3":"UEFA","R EUR 4":"UEFA",
  "R INT 1": null, "R INT 2": null
};

// seguimiento origen bombo de cada equipo ubicado (0=host, 1..4 = bombo)
const ubicadoDesde = {};
["México","Canadá","Estados Unidos"].forEach(h=> ubicadoDesde[h]=0);

// Estado especial España/Argentina (B1)
let primerEspecial = null;
let grupoPrimerEspecial = null;

// Estado bombo actual
let bomboActual = 1;

/* -----------------------
   Utilidades básicas
   ----------------------- */
function mezclar(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random()*(i+1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

function actualizarLog(msg) {
  const l = document.getElementById("log");
  const ts = new Date().toLocaleTimeString();
  l.innerHTML = `<div>[${ts}] ${msg}</div>` + l.innerHTML;
}

/* -----------------------
   Renderizado de grupos (4 slots visuales)
   ----------------------- */
function claseConf(conf) {
  if (!conf) return "";
  if (conf === "UEFA") return "conf-UEFA";
  if (conf === "CONMEBOL") return "conf-CONMEBOL";
  if (conf === "AFC") return "conf-AFC";
  if (conf === "CAF") return "conf-CAF";
  if (conf === "CONCACAF") return "conf-CONCACAF";
  if (conf === "OFC") return "conf-OFC";
  return "";
}

function renderGrupos() {
  const cont = document.getElementById("groupsContainer");
  cont.innerHTML = "";
  ordenGrupos.forEach(g => {
    const box = document.createElement("div");
    box.className = "group";
    box.id = `grupo_${g}`;
    box.innerHTML = `<h4>Grupo ${g}</h4>`;

    // Mostrar hasta 4 slots (B1..B4). Si no hay equipo, mostrar slot vacío.
    for (let slot = 1; slot <= 4; slot++) {
      const divSlot = document.createElement("div");
      divSlot.className = "slot";
      // determinar qué equipo mostrar en este slot (orden de push representa B1->B4)
      const equipo = grupos[g][slot-1] || "";
      if (!equipo) {
        divSlot.innerHTML = `<div style="opacity:0.55">Bombo ${slot}: —</div><div class="origin">—</div>`;
      } else {
        const conf = confederacion[equipo];
        const confClass = claseConf(conf);
        const origin = (ubicadoDesde[equipo] === 0) ? "Host" : `B${ubicadoDesde[equipo]}`;
        divSlot.innerHTML = `<div>${equipo}</div><div class="origin ${confClass}">${origin}</div>`;
        if (HOSTS.includes(equipo)) divSlot.classList.add("host");
      }
      box.appendChild(divSlot);
    }

    cont.appendChild(box);
  });
  document.getElementById("tituloBombo").innerText = `Bombo ${bomboActual}`;
}

/* -----------------------
   Validación de confederaciones por grupo
   ----------------------- */
function cuentaConfPorGrupo(grupoLetter) {
  const map = {};
  let uefa = 0;
  grupos[grupoLetter].forEach(team => {
    const c = confederacion[team];
    if (c === null) return;
    map[c] = (map[c] || 0) + 1;
    if (c === "UEFA") uefa++;
  });
  return { map, uefa };
}

function puedeColocarEnGrupo(team, grupoLetter) {
  const conf = confederacion[team];
  if (conf === null) return true; // repechaje indefinido puede ir en cualquier grupo

  const cnt = cuentaConfPorGrupo(grupoLetter);
  const existe = cnt.map[conf] || 0;

  if (conf === "UEFA") {
    if (cnt.uefa >= 2) return false;
    return true;
  } else {
    if (existe >= 1) return false;
    return true;
  }
}

/* -----------------------
   Reglas B1 (España/Argentina) y asignación general
   ----------------------- */
function obtenerGrupoOpuestoPara(grupo) {
  const i1 = bloque1.indexOf(grupo);
  if (i1 !== -1) return bloque2[i1];
  const i2 = bloque2.indexOf(grupo);
  if (i2 !== -1) return bloque1[i2];
  return null;
}

// devuelve primer grupo completamente vacío (sin hosts ni equipos)
function primerGrupoCompletamenteVacio() {
  return ordenGrupos.find(g => grupos[g].length === 0) || null;
}

// primer grupo válido (A..L) segun confederación
function primerGrupoValidoPara(team) {
  for (let g of ordenGrupos) {
    if (puedeColocarEnGrupo(team, g) && grupos[g].length < 4) {
      // Podemos agregar debajo de la cabeza (no sobreescribir)
      return g;
    }
  }
  return null;
}

/* intenta asignar equipo; devuelve true si asignado */
function asignarEquipo(team, bomboNumber, isUltimoDelBombo=false) {
  // BOMBO 1 (cabezas)
  if (bomboNumber === 1) {
    if (team === "España" || team === "Argentina") {
      if (!primerEspecial) {
        const g = primerGrupoCompletamenteVacio();
        if (!g) { actualizarLog(`No hay grupo completamente vacío para ${team}`); return false; }
        grupos[g].push(team);
        ubicadoDesde[team] = 1;
        primerEspecial = team;
        grupoPrimerEspecial = g;
        actualizarLog(`${team} (B1) asignado al Grupo ${g} (primer del par)`);
        return true;
      } else {
        // segundo del par: ir forzado al bloque opuesto
        const bloqueOpuesto = obtenerGrupoOpuestoPara(grupoPrimerEspecial);
        if (!bloqueOpuesto) {
          const fallback = primerGrupoValidoPara(team);
          if (fallback) { grupos[fallback].push(team); ubicadoDesde[team]=1; actualizarLog(`${team} (B1 fallback) -> ${fallback}`); return true; }
          return false;
        }
        // buscar grupo vacío en bloque opuesto
        const bloqueArr = bloque1.includes(grupoPrimerEspecial) ? bloque2 : bloque1;
        let gLibre = bloqueArr.find(x => grupos[x].length === 0);
        if (gLibre) {
          grupos[gLibre].push(team);
          ubicadoDesde[team] = 1;
          actualizarLog(`${team} (B1) asignado al Grupo ${gLibre} (bloque opuesto)`);
          return true;
        }
        // intentar intercambio con no-host dentro del bloque opuesto
        let gIntercambio = null;
        for (let gx of bloqueArr) {
          if (grupos[gx].length > 0) {
            const ocup = grupos[gx][0];
            if (!HOSTS.includes(ocup) && ocup !== "España" && ocup !== "Argentina") { gIntercambio = gx; break; }
          }
        }
        if (gIntercambio) {
          const ocup = grupos[gIntercambio][0];
          grupos[gIntercambio][0] = team;
          grupos[grupoPrimerEspecial][0] = ocup;
          ubicadoDesde[team] = 1;
          ubicadoDesde[ocup] = ubicadoDesde[ocup] || 1;
          actualizarLog(`Intercambio B1: ${team} -> Grupo ${gIntercambio}, ${ocup} -> Grupo ${grupoPrimerEspecial}`);
          return true;
        }
        // fallback global
        const fallback = primerGrupoValidoPara(team);
        if (fallback) { grupos[fallback].push(team); ubicadoDesde[team]=1; actualizarLog(`${team} (B1 fallback2) -> ${fallback}`); return true; }
        return false;
      }
    } else {
      // otros del bombo1: primer grupo completamente vacío
      const g = primerGrupoCompletamenteVacio();
      if (g) { grupos[g].push(team); ubicadoDesde[team]=1; actualizarLog(`${team} (B1) -> Grupo ${g}`); return true; }
      actualizarLog(`No hay grupo completamente vacío para ${team} (B1).`);
      return false;
    }
  }

  // BOMBO 2 / 3 / 4: regla general confederación
  const gValido = primerGrupoValidoPara(team);
  if (gValido) {
    grupos[gValido].push(team);
    ubicadoDesde[team] = bomboNumber;
    actualizarLog(`${team} (B${bomboNumber}) -> Grupo ${gValido}`);
    return true;
  }

  // Si es el último del bombo y es B4, intentar intercambio sólo con equipos del B4
  if (isUltimoDelBombo && bomboNumber === 4) {
    const okSwap = intentarIntercambioSoloBombo4(team);
    if (okSwap) { ubicadoDesde[team] = 4; actualizarLog(`${team} (B4 último) colocado vía intercambio B4`); return true; }
  }

  // no pudo asignarse
  actualizarLog(`${team} (B${bomboNumber}) no pudo asignarse automáticamente.`);
  return false;
}

/* -----------------------
   Intercambio específico B4 (último)
   ----------------------- */
function intentarIntercambioSoloBombo4(team) {
  // buscar candidatos (miembros ya ubicados que vinieron del B4)
  const candidatos = [];
  for (let g of ordenGrupos) {
    grupos[g].forEach((miembro, idx) => {
      if (ubicadoDesde[miembro] === 4) candidatos.push({grupo:g, miembro, idx});
    });
  }

  // probar cada candidato: si poniendo team en su grupo y moviendo al candidato a otro grupo válido mantiene restricciones
  for (let c of candidatos) {
    const grupoA = c.grupo;
    const miembro = c.miembro;

    // primero: team debe caber en grupoA
    if (!puedeColocarEnGrupo(team, grupoA)) continue;

    // simular quitar miembro de grupoA e insertar team allí
    const tmpA = grupos[grupoA].slice();
    const idx = tmpA.indexOf(miembro);
    if (idx !== -1) tmpA.splice(idx,1);
    tmpA.push(team);

    if (!grupoValidoConLista(tmpA)) continue;

    // buscar grupoB distinto de grupoA donde podamos poner 'miembro'
    for (let g2 of ordenGrupos) {
      if (g2 === grupoA) continue;
      if (grupos[g2].length >= 4) continue;
      // simular agregar miembro a g2
      const tmpB = grupos[g2].slice();
      tmpB.push(miembro);
      if (grupoValidoConLista(tmpB)) {
        // aplicar intercambio real
        const realIdx = grupos[grupoA].indexOf(miembro);
        if (realIdx !== -1) grupos[grupoA].splice(realIdx,1);
        grupos[grupoA].push(team);
        grupos[g2].push(miembro);
        // mantener registrado ubicadoDesde
        ubicadoDesde[team] = 4;
        ubicadoDesde[miembro] = 4;
        actualizarLog(`Intercambio B4: ${team} -> Grupo ${grupoA}, ${miembro} -> Grupo ${g2}`);
        return true;
      }
    }
  }

  return false;
}

function grupoValidoConLista(listaMiembros) {
  let uefa = 0;
  const cnt = {};
  for (let m of listaMiembros) {
    const c = confederacion[m];
    if (c === null) continue;
    cnt[c] = (cnt[c]||0) + 1;
    if (c === "UEFA") uefa++;
    if (c !== "UEFA" && cnt[c] > 1) return false;
    if (c === "UEFA" && uefa > 2) return false;
  }
  return true;
}

/* -----------------------
   Interfaz cartas / flujo bombos
   ----------------------- */
function arrayBombo(n) {
  if (n === 1) return bombo1;
  if (n === 2) return bombo2;
  if (n === 3) return bombo3;
  return bombo4;
}

function renderCartas() {
  const cont = document.getElementById("cardContainer");
  cont.innerHTML = "";
  const arr = arrayBombo(bomboActual);

  if (!arr || arr.length === 0) {
    cont.innerHTML = `<div style="color:#cfeefb; padding:12px;">Bombo ${bomboActual} vacío.</div>`;
    // mostrar botón siguiente según corresponda
    if (bomboActual === 1) document.getElementById("btnSiguiente").style.display = "inline-block";
    if (bomboActual === 2) document.getElementById("btnSiguiente3").style.display = "inline-block";
    if (bomboActual === 3) document.getElementById("btnSiguiente4").style.display = "inline-block";
    return;
  }

  mezclar(arr);
  arr.forEach(team => {
    const card = document.createElement("div");
    card.className = "card";
    card.setAttribute("data-team", team);
    card.title = "Haz click para revelar";
    card.addEventListener("click", () => {
      if (card.classList.contains("revealed")) return;
      revelarCarta(card);
    });
    cont.appendChild(card);
  });
}

function revelarCarta(cardEl) {
  const team = cardEl.getAttribute("data-team");
  if (!team) return;
  cardEl.classList.add("revealed");
  cardEl.innerText = team;

  const arr = arrayBombo(bomboActual);
  const isUltimo = (arr.length === 1);

  setTimeout(() => {
    const ok = asignarEquipo(team, bomboActual, isUltimo);
    if (!ok) actualizarLog(`Atención: ${team} no se asignó automáticamente. Revisa la bitácora.`);
    // quitar del bombo real
    const idx = arr.indexOf(team);
    if (idx !== -1) arr.splice(idx,1);
    renderGrupos();

    // si terminamos B1 mostrar boton empezar B2
    if (bomboActual === 1 && arr.length === 0) {
      document.getElementById("btnSiguiente").style.display = "inline-block";
    }
    // si terminamos B2 -> mostrar boton B3
    if (bomboActual === 2 && arr.length === 0) {
      document.getElementById("btnSiguiente3").style.display = "inline-block";
    }
    // si terminamos B3 -> mostrar boton B4
    if (bomboActual === 3 && arr.length === 0) {
      document.getElementById("btnSiguiente4").style.display = "inline-block";
    }

    renderCartas();
  }, 600);
}

/* -----------------------
   Botones de avance / reinicio
   ----------------------- */
document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("reiniciar").addEventListener("click", reiniciarTodo);

  document.getElementById("btnSiguiente").addEventListener("click", () => {
    bomboActual = 2;
    document.getElementById("tituloBombo").innerText = "Bombo 2";
    document.getElementById("btnSiguiente").style.display = "none";
    renderCartas();
  });
  document.getElementById("btnSiguiente3").addEventListener("click", () => {
    bomboActual = 3;
    document.getElementById("tituloBombo").innerText = "Bombo 3";
    document.getElementById("btnSiguiente3").style.display = "none";
    renderCartas();
  });
  document.getElementById("btnSiguiente4").addEventListener("click", () => {
    bomboActual = 4;
    document.getElementById("tituloBombo").innerText = "Bombo 4";
    document.getElementById("btnSiguiente4").style.display = "none";
    renderCartas();
  });

  // inicializar visual
  renderGrupos();
  renderCartas();
});

/* -----------------------
   Reiniciar todo
   ----------------------- */
function reiniciarTodo() {
  bombo1 = ["España","Argentina","Francia","Inglaterra","Brasil","Portugal","Países Bajos","Bélgica","Alemania"];
  bombo2 = ["Australia","Austria","Colombia","Corea del Sur","Croacia","Ecuador","Irán","Japón","Marruecos","Senegal","Suiza","Uruguay"];
  bombo3 = ["Arabia Saudita","Argelia","Costa de Marfil","Egipto","Escocia","Noruega","Panamá","Paraguay","Qatar","Sudáfrica","Túnez","Uzbekistán"];
  bombo4 = ["Jordania","Cabo Verde","Ghana","Curazao","Haití","Nueva Zelanda","R EUR 1","R EUR 2","R EUR 3","R EUR 4","R INT 1","R INT 2"];

  for (let g of ordenGrupos) {
    if (g === "A") grupos[g] = ["México"];
    else if (g === "B") grupos[g] = ["Canadá"];
    else if (g === "D") grupos[g] = ["Estados Unidos"];
    else grupos[g] = [];
  }

  // reset ubicados
  for (let k in ubicadoDesde) delete ubicadoDesde[k];
  ["México","Canadá","Estados Unidos"].forEach(h=> ubicadoDesde[h]=0);

  primerEspecial = null;
  grupoPrimerEspecial = null;
  bomboActual = 1;
  document.getElementById("tituloBombo").innerText = "Bombo 1";
  document.getElementById("btnSiguiente").style.display = "none";
  document.getElementById("btnSiguiente3").style.display = "none";
  document.getElementById("btnSiguiente4").style.display = "none";
  document.getElementById("log").innerHTML = "";
  actualizarLog("Reiniciado.");
  renderGrupos();
  renderCartas();
}
