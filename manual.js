/* manual.js - actualizado: arregla errores, agrega banderas y dorso imagen */

/* ---------- Datos iniciales ---------- */
const ordenGrupos = ["A","B","C","D","E","F","G","H","I","J","K","L"];
const HOSTS = ["México","Canadá","Estados Unidos"];

// grupos: cada grupo es un array con orden B1->B4 (push añade al final)
const grupos = {
  A: ["México"], B: ["Canadá"], C: [], D: ["Estados Unidos"],
  E: [], F: [], G: [], H: [], I: [], J: [], K: [], L: []
};

// Bloques para la regla B1
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

// mapa de banderas (emoji). Podés completarlo o cambiar por URLs si preferís.
const bandera = {
  "México":"🇲🇽","Canadá":"🇨🇦","Estados Unidos":"🇺🇸",
  "España":"🇪🇸","Argentina":"🇦🇷","Francia":"🇫🇷","Inglaterra":"🏴","Brasil":"🇧🇷","Portugal":"🇵🇹","Países Bajos":"🇳🇱","Bélgica":"🇧🇪","Alemania":"🇩🇪",
  "Australia":"🇦🇺","Austria":"🇦🇹","Colombia":"🇨🇴","Corea del Sur":"🇰🇷","Croacia":"🇭🇷","Ecuador":"🇪🇨","Irán":"🇮🇷","Japón":"🇯🇵","Marruecos":"🇲🇦","Senegal":"🇸🇳","Suiza":"🇨🇭","Uruguay":"🇺🇾",
  "Arabia Saudita":"🇸🇦","Argelia":"🇩🇿","Costa de Marfil":"🇨🇮","Egipto":"🇪🇬","Escocia":"🏴","Noruega":"🇳🇴","Panamá":"🇵🇦","Paraguay":"🇵🇾","Qatar":"🇶🇦","Sudáfrica":"🇿🇦","Túnez":"🇹🇳","Uzbekistán":"🇺🇿",
  "Jordania":"🇯🇴","Cabo Verde":"🇨🇻","Ghana":"🇬🇭","Curazao":"🇨🇼","Haití":"🇭🇹","Nueva Zelanda":"🇳🇿",
  "R EUR 1":"🏳️","R EUR 2":"🏳️","R EUR 3":"🏳️","R EUR 4":"🏳️","R INT 1":"🏳️","R INT 2":"🏳️"
};

// desde qué bombo vino cada equipo (0=host, 1..4=bombo)
const ubicadoDesde = {};
["México","Canadá","Estados Unidos"].forEach(h=> ubicadoDesde[h]=0);

/* Estado B1 (España/Argentina) */
let primerEspecial = null;
let grupoPrimerEspecial = null;

/* bombo actual */
let bomboActual = 1;

/* ---------- utilidades ---------- */
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

function getBandera(team) {
  return bandera[team] || "🏳️";
}

/* ---------- validaciones ---------- */

// cuenta confederaciones en un grupo
function cuentaConfPorGrupo(grupoLetter) {
  const map = {};
  let uefa = 0;
  grupos[grupoLetter].forEach(team => {
    const c = confederacion[team];
    if (c === null) continue;
    map[c] = (map[c] || 0) + 1;
    if (c === "UEFA") uefa++;
  });
  return { map, uefa };
}

// devuelve true si grupo ya tiene un equipo proveniente del mismo bombo (evitamos dos del mismo bombo en un grupo)
function grupoTieneBombo(grupoLetter, bomboNumber) {
  if (bomboNumber === 0 || bomboNumber === undefined) return false;
  return grupos[grupoLetter].some(t => (ubicadoDesde[t] === bomboNumber));
}

// verifica si se puede colocar (confederacion + no repetir bombo en el grupo)
function puedeColocarEnGrupoExtendido(team, grupoLetter, bomboNumber) {
  const conf = confederacion[team];
  // si grupo ya tiene un equipo del mismo bombo → no
  if (grupoTieneBombo(grupoLetter, bomboNumber)) return false;
  if (conf === null) return true; // repechajes indefinidos
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

/* primer grupo completamente vacío */
function primerGrupoCompletamenteVacio() {
  return ordenGrupos.find(g => grupos[g].length === 0) || null;
}

/* primer grupo válido considerando bomboNumber */
function primerGrupoValidoPara(team, bomboNumber) {
  for (let g of ordenGrupos) {
    // permitimos hasta 4 equipos por grupo
    if (grupos[g].length >= 4) continue;
    if (puedeColocarEnGrupoExtendido(team, g, bomboNumber)) return g;
  }
  return null;
}

/* buscar primer grupo válido EXCLUYENDO ciertos grupos (lista) — usado para desplazar)
   Si no encuentra retorna null */
function primerGrupoValidoExcluyendo(team, bomboNumber, exclude = []) {
  for (let g of ordenGrupos) {
    if (exclude.includes(g)) continue;
    if (grupos[g].length >= 4) continue;
    if (puedeColocarEnGrupoExtendido(team, g, bomboNumber)) return g;
  }
  return null;
}

/* ---------- reglas B1 (España/Argentina) y asignación ---------- */

function obtenerGrupoOpuestoPara(grupo) {
  const i1 = bloque1.indexOf(grupo);
  if (i1 !== -1) return bloque2[i1];
  const i2 = bloque2.indexOf(grupo);
  if (i2 !== -1) return bloque1[i2];
  return null;
}

/* asigna equipo; devuelve true si ok */
function asignarEquipo(team, bomboNumber, isUltimoDelBombo=false) {
  // BOMBO 1
  if (bomboNumber === 1) {
    if (team === "España" || team === "Argentina") {
      if (!primerEspecial) {
        // primero del par → primer grupo completamente vacío
        const g = primerGrupoCompletamenteVacio();
        if (!g) { actualizarLog(`No hay grupo vacío para ${team}`); return false; }
        grupos[g].push(team);
        ubicadoDesde[team] = 1;
        primerEspecial = team;
        grupoPrimerEspecial = g;
        actualizarLog(`${team} (B1) asignado al Grupo ${g} (primer del par)`);
        return true;
      } else {
        // segundo del par: debe ir al bloque opuesto
        const bloqueOpuesto = obtenerGrupoOpuestoPara(grupoPrimerEspecial);
        if (!bloqueOpuesto) {
          const fallback = primerGrupoValidoPara(team, 1);
          if (fallback) { grupos[fallback].push(team); ubicadoDesde[team]=1; actualizarLog(`${team} (B1 fallback) -> ${fallback}`); return true; }
          return false;
        }

        // 1) buscar grupo vacío dentro del bloque opuesto que acepte al team (valida conf + bombo)
        const bloqueArr = bloque1.includes(grupoPrimerEspecial) ? bloque2 : bloque1;
        let gLibre = null;
        for (let gx of bloqueArr) {
          if (grupos[gx].length === 0 && puedeColocarEnGrupoExtendido(team, gx, 1)) { gLibre = gx; break; }
        }
        if (gLibre) {
          grupos[gLibre].push(team);
          ubicadoDesde[team] = 1;
          actualizarLog(`${team} (B1) asignado al Grupo ${gLibre} (bloque opuesto libre)`);
          return true;
        }

        // 2) si no hay grupo vacío: buscar grupo ocupado con un ocupante desplazable (no-host, no España/Arg)
        let gOcupado = null;
        for (let gx of bloqueArr) {
          if (grupos[gx].length > 0) {
            const ocupante = grupos[gx][0];
            if (!HOSTS.includes(ocupante) && ocupante !== "España" && ocupante !== "Argentina") { gOcupado = gx; break; }
          }
        }
        if (gOcupado) {
          // desplazar ocupante al primer grupo válido (excluyendo gOcupado y grupoPrimerEspecial)
          const ocupante = grupos[gOcupado][0];
          const bomboDelOcupante = ubicadoDesde[ocupante] || 1; // si no registrado asumimos 1
          const destParaOcupante = primerGrupoValidoExcluyendo(ocupante, bomboDelOcupante, [gOcupado]);
          if (destParaOcupante) {
            // ejecutar desplazamiento: quitar ocupante de gOcupado, poner team en gOcupado, y poner ocupante en destParaOcupante
            grupos[gOcupado].splice(0,1);
            grupos[gOcupado].push(team);
            grupos[destParaOcupante].push(ocupante);
            ubicadoDesde[team] = 1;
            // ubicadoDesde[ocupante] ya existe
            actualizarLog(`Desplazamiento B1: ${team} -> Grupo ${gOcupado}; ${ocupante} -> Grupo ${destParaOcupante}`);
            return true;
          } else {
            // No encontramos grupo para desplazar → intentamos intercambio simple (colocar team en gOcupado y mover ocupante al grupoPrimerEspecial)
            // pero tu requerimiento es que ocupante no vaya al grupo del primerEspecial si eso borra; sin grupo válido no hacemos intercambio forzado.
            actualizarLog(`No se encontró ubicación válida para desplazar ${ocupante}. No se aplica intercambio forzado.`);
            return false;
          }
        }

        // 3) fallback global
        const fallback = primerGrupoValidoPara(team, 1);
        if (fallback) { grupos[fallback].push(team); ubicadoDesde[team]=1; actualizarLog(`${team} (B1 fallback2) -> ${fallback}`); return true; }
        return false;
      }
    } else {
      // otros B1: primer grupo completamente vacío
      const g = primerGrupoCompletamenteVacio();
      if (g) { grupos[g].push(team); ubicadoDesde[team]=1; actualizarLog(`${team} (B1) -> Grupo ${g}`); return true; }
      actualizarLog(`No hay grupo completamente vacío para ${team} (B1).`);
      return false;
    }
  } // end bombo1

  // BOMBO 2/3/4 -> buscar primer grupo válido (no repetir bombo en el grupo, respetar conf)
  const gValido = primerGrupoValidoPara(team, bomboNumber);
  if (gValido) {
    grupos[gValido].push(team);
    ubicadoDesde[team] = bomboNumber;
    actualizarLog(`${team} (B${bomboNumber}) -> Grupo ${gValido}`);
    return true;
  }

  // Si es último del bombo y es B4, intentar intercambio exclusivo con equipos del B4
  if (isUltimoDelBombo && bomboNumber === 4) {
    const okSwap = intentarIntercambioSoloBombo4(team);
    if (okSwap) { ubicadoDesde[team] = 4; actualizarLog(`${team} (B4 último) colocado via intercambio B4`); return true; }
  }

  actualizarLog(`${team} (B${bomboNumber}) no pudo asignarse automáticamente.`);
  return false;
}

/* ---------- Intercambio B4 (igual que antes) ---------- */
function intentarIntercambioSoloBombo4(team) {
  const candidatos = [];
  for (let g of ordenGrupos) {
    grupos[g].forEach((miembro, idx) => {
      if (ubicadoDesde[miembro] === 4) candidatos.push({grupo:g, miembro, idx});
    });
  }

  for (let c of candidatos) {
    const grupoA = c.grupo;
    const miembro = c.miembro;
    if (!puedeColocarEnGrupoExtendido(team, grupoA, 4)) continue;
    // simular quitar miembro y poner team
    const tmpA = grupos[grupoA].slice();
    const idx = tmpA.indexOf(miembro);
    if (idx !== -1) tmpA.splice(idx,1);
    tmpA.push(team);
    if (!grupoValidoConLista(tmpA)) continue;
    for (let g2 of ordenGrupos) {
      if (g2 === grupoA) continue;
      if (grupos[g2].length >= 4) continue;
      const tmpB = grupos[g2].slice();
      tmpB.push(miembro);
      if (grupoValidoConLista(tmpB)) {
        // aplicar intercambio real
        const realIdx = grupos[grupoA].indexOf(miembro);
        if (realIdx !== -1) grupos[grupoA].splice(realIdx,1);
        grupos[grupoA].push(team);
        grupos[g2].push(miembro);
        ubicadoDesde[team] = 4;
        ubicadoDesde[miembro] = 4;
        actualizarLog(`Intercambio B4: ${team} -> ${grupoA}, ${miembro} -> ${g2}`);
        return true;
      }
    }
  }
  actualizarLog(`No se pudo intercambiar ${team} con integrantes del B4.`);
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
  // tambien verificar que no haya más de 1 equipo del mismo bombo (si list proviene de mezcla, asumimos ubicadoDesde ya correcto)
  const bomboCount = {};
  for (let m of listaMiembros) {
    const b = ubicadoDesde[m] || 0;
    bomboCount[b] = (bomboCount[b] || 0) + 1;
    if (b !== 0 && bomboCount[b] > 1) return false;
  }
  return true;
}

/* ---------- Interfaz: render y cartas ---------- */

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
    for (let slot = 1; slot <= 4; slot++) {
      const divSlot = document.createElement("div");
      divSlot.className = "slot";
      const equipo = grupos[g][slot-1] || "";
      if (!equipo) {
        divSlot.innerHTML = `<div style="opacity:0.55">Bombo ${slot}: —</div><div class="origin">—</div>`;
      } else {
        const conf = confederacion[equipo];
        const confClass = claseConf(conf);
        const origin = (ubicadoDesde[equipo] === 0) ? "Host" : `B${ubicadoDesde[equipo]}`;
        const flag = getBandera(equipo);
        divSlot.innerHTML = `<div style="display:flex; align-items:center; gap:8px;"><span class="flag">${flag}</span><div>${equipo}</div></div><div class="origin ${confClass}">${origin}</div>`;
        if (HOSTS.includes(equipo)) divSlot.classList.add("host");
      }
      box.appendChild(divSlot);
    }
    cont.appendChild(box);
  });
  document.getElementById("tituloBombo").innerText = `Bombo ${bomboActual}`;
}

/* obtiene el array del bombo actual */
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
  // revelar: mostrar bandera y nombre
  const flag = getBandera(team);
  cardEl.classList.add("revealed");
  cardEl.innerHTML = `<div class="flag">${flag}</div><div class="name">${team}</div>`;

  const arr = arrayBombo(bomboActual);
  const isUltimo = (arr.length === 1);

  setTimeout(() => {
    const ok = asignarEquipo(team, bomboActual, isUltimo);
    if (!ok) actualizarLog(`Atención: ${team} no se asignó automáticamente. Revisa la bitácora.`);
    // remover del bombo
    const idx = arr.indexOf(team);
    if (idx !== -1) arr.splice(idx,1);
    renderGrupos();
    // mostrar botones siguientes
    if (bomboActual === 1 && arr.length === 0) document.getElementById("btnSiguiente").style.display = "inline-block";
    if (bomboActual === 2 && arr.length === 0) document.getElementById("btnSiguiente3").style.display = "inline-block";
    if (bomboActual === 3 && arr.length === 0) document.getElementById("btnSiguiente4").style.display = "inline-block";
    renderCartas();
  }, 600);
}

/* ---------- botones y flow ---------- */
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

  renderGrupos();
  renderCartas();
});

/* ---------- reiniciar ---------- */
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

  /* ========== RENDER DE UI ========== */

function renderGrupos() {
    const cont = document.getElementById("groupsContainer");
    cont.innerHTML = "";

    ordenGrupos.forEach(g => {
        const box = document.createElement("div");
        box.className = "groupBox";
        box.innerHTML = `<h4>Grupo ${g}</h4>`;

        const lista = document.createElement("div");
        lista.className = "groupList";

        grupos[g].forEach(t => {
            const item = document.createElement("div");
            item.className = "groupItem";
            item.innerHTML = `${getBandera(t)} ${t}`;
            lista.appendChild(item);
        });

        box.appendChild(lista);
        cont.appendChild(box);
    });
}

function crearCartasDelBombo() {
    const cardContainer = document.getElementById("cardContainer");
    cardContainer.innerHTML = "";

    let bombo =
        bomboActual === 1 ? bombo1 :
        bomboActual === 2 ? bombo2 :
        bomboActual === 3 ? bombo3 :
        bombo4;

    bombo.forEach(team => {
        const card = document.createElement("div");
        card.className = "card";
        card.innerHTML = `<div class="flag">${getBandera(team)}</div>
                          <div class="name">${team}</div>`;

        card.onclick = () => seleccionarEquipo(team);

        cardContainer.appendChild(card);
    });

    document.getElementById("tituloBombo").innerText = `Bombo ${bomboActual}`;
}

function seleccionarEquipo(team) {
    let bombo =
        bomboActual === 1 ? bombo1 :
        bomboActual === 2 ? bombo2 :
        bomboActual === 3 ? bombo3 :
        bombo4;

    const esUltimo = (bombo.length === 1);

    const ok = asignarEquipo(team, bomboActual, esUltimo);
    if (!ok) {
        actualizarLog(`❌ No se pudo colocar a ${team}`);
        return;
    }

    // Sacarlo del bombo
    const idx = bombo.indexOf(team);
    if (idx !== -1) bombo.splice(idx, 1);

    crearCartasDelBombo();
    renderGrupos();

    // Si el bombo terminó → pasar al siguiente
    if (bombo.length === 0) avanzarBombo();
}

function avanzarBombo() {
    bomboActual++;
    if (bomboActual > 4) {
        actualizarLog("🎉 Sorteo finalizado");
        document.getElementById("tituloBombo").innerText = "Sorteo completado";
        document.getElementById("cardContainer").innerHTML = "";
        return;
    }

    actualizarLog(`➡️ Comienza Bombo ${bomboActual}`);
    crearCartasDelBombo();
}

function reiniciarTodo() {
    location.reload();
}

/* ========== INICIO AUTOMÁTICO DE LA PÁGINA ========== */
window.onload = () => {
    mezclar(bombo1);
    mezclar(bombo2);
    mezclar(bombo3);
    mezclar(bombo4);

    crearCartasDelBombo();
    renderGrupos();

    document.getElementById("reiniciar").onclick = reiniciarTodo;
};

}
