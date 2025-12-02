/* manual.js - versión final corregida:
   - banderas como imágenes (archivo: "<CountryName>.png" en el mismo nivel)
   - reinicio arreglado (hosts en A,B,D)
   - mantiene reglas B1/B4 y restricciones por confederaciones
*/

/* ---------- Datos iniciales ---------- */
const ordenGrupos = ["A","B","C","D","E","F","G","H","I","J","K","L"];
const HOSTS = ["México","Canadá","Estados Unidos"];

const grupos = {
  A: ["México"], B: ["Canadá"], C: [], D: ["Estados Unidos"],
  E: [], F: [], G: [], H: [], I: [], J: [], K: [], L: []
};

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

/* Ubicación inicial de equipos (origen bombo) */
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
  if (!l) return;
  const ts = new Date().toLocaleTimeString();
  l.innerHTML = `<div>[${ts}] ${msg}</div>` + l.innerHTML;
}

/* Devuelve HTML de la imagen de la bandera (archivo: "<CountryName>.png" en mismo nivel).
   Usamos encodeURIComponent para permitir espacios y acentos en nombres de archivo. */
function getFlagImgHtml(team, size = 22) {
  // Nombre del archivo = team + ".png", codificado
  const filename = encodeURIComponent(team) + ".png";
  // Si no existe la imagen en el servidor se verá como imagen rota; asume que subiste los PNG con esos nombres.
  return `<img src="./${filename}" alt="${team}" class="flag-img" style="width:${size}px;height:auto;object-fit:cover;border-radius:2px;">`;
}

/* ---------- validaciones ---------- */
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

function grupoTieneBombo(grupoLetter, bomboNumber) {
  if (!bomboNumber || bomboNumber === 0) return false;
  return grupos[grupoLetter].some(t => ubicadoDesde[t] === bomboNumber);
}

function puedeColocarEnGrupoExtendido(team, grupoLetter, bomboNumber) {
  const conf = confederacion[team];
  if (grupoTieneBombo(grupoLetter, bomboNumber)) return false;
  if (!conf) return true; // repechajes indefinidos
  const cnt = cuentaConfPorGrupo(grupoLetter);
  const existe = cnt.map[conf] || 0;
  if (conf === "UEFA") return cnt.uefa < 2;
  return existe < 1;
}

function primerGrupoCompletamenteVacio() {
  return ordenGrupos.find(g => grupos[g].length === 0) || null;
}

function primerGrupoValidoPara(team, bomboNumber) {
  for (let g of ordenGrupos) {
    if (grupos[g].length >= 4) continue;
    if (puedeColocarEnGrupoExtendido(team, g, bomboNumber)) return g;
  }
  return null;
}

function primerGrupoValidoExcluyendo(team, bomboNumber, exclude = []) {
  for (let g of ordenGrupos) {
    if (exclude.includes(g) || grupos[g].length >= 4) continue;
    if (puedeColocarEnGrupoExtendido(team, g, bomboNumber)) return g;
  }
  return null;
}

function obtenerGrupoOpuestoPara(grupo) {
  const i1 = bloque1.indexOf(grupo);
  if (i1 !== -1) return bloque2[i1];
  const i2 = bloque2.indexOf(grupo);
  if (i2 !== -1) return bloque1[i2];
  return null;
}

/* ---------- asignar equipo ---------- */
function asignarEquipo(team, bomboNumber, isUltimoDelBombo=false) {
  // BOMBO 1 - regla España/Argentina
  if (bomboNumber === 1) {
    if (team === "España" || team === "Argentina") {
      if (!primerEspecial) {
        const g = primerGrupoCompletamenteVacio();
        if (!g) { actualizarLog(`No hay grupo vacío para ${team}`); return false; }
        grupos[g].push(team);
        ubicadoDesde[team] = 1;
        primerEspecial = team;
        grupoPrimerEspecial = g;
        actualizarLog(`${team} (B1) asignado al Grupo ${g} (primer del par)`);
        return true;
      } else {
        const bloqueOpuesto = obtenerGrupoOpuestoPara(grupoPrimerEspecial);
        if (!bloqueOpuesto) {
          const fallback = primerGrupoValidoPara(team, 1);
          if (fallback) { grupos[fallback].push(team); ubicadoDesde[team]=1; actualizarLog(`${team} (B1 fallback) -> ${fallback}`); return true; }
          return false;
        }
        const bloqueArr = bloque1.includes(grupoPrimerEspecial) ? bloque2 : bloque1;
        // buscar grupo vacío en bloque opuesto
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
        // desplazar ocupante (no host, no España/Argentina)
        let gOcupado = null;
        for (let gx of bloqueArr) {
          if (grupos[gx].length > 0) {
            const ocupante = grupos[gx][0];
            if (!HOSTS.includes(ocupante) && ocupante !== "España" && ocupante !== "Argentina") { gOcupado = gx; break; }
          }
        }
        if (gOcupado) {
          const ocupante = grupos[gOcupado][0];
          const bomboDelOcupante = ubicadoDesde[ocupante] || 1;
          const destParaOcupante = primerGrupoValidoExcluyendo(ocupante, bomboDelOcupante, [gOcupado]);
          if (destParaOcupante) {
            grupos[gOcupado].splice(0,1);
            grupos[gOcupado].push(team);
            grupos[destParaOcupante].push(ocupante);
            ubicadoDesde[team] = 1;
            actualizarLog(`Desplazamiento B1: ${team} -> Grupo ${gOcupado}; ${ocupante} -> Grupo ${destParaOcupante}`);
            return true;
          } else {
            actualizarLog(`No se encontró ubicación válida para desplazar ${ocupante}.`);
            return false;
          }
        }
        const fallback = primerGrupoValidoPara(team, 1);
        if (fallback) { grupos[fallback].push(team); ubicadoDesde[team]=1; actualizarLog(`${team} (B1 fallback2) -> ${fallback}`); return true; }
        return false;
      }
    } else {
      // resto B1: primer grupo completamente vacío
      const g = primerGrupoCompletamenteVacio();
      if (g) { grupos[g].push(team); ubicadoDesde[team]=1; actualizarLog(`${team} (B1) -> Grupo ${g}`); return true; }
      actualizarLog(`No hay grupo vacío para ${team} (B1).`);
      return false;
    }
  }

  // BOMBO 2/3/4
  const gValido = primerGrupoValidoPara(team, bomboNumber);
  if (gValido) {
    grupos[gValido].push(team);
    ubicadoDesde[team] = bomboNumber;
    actualizarLog(`${team} (B${bomboNumber}) -> Grupo ${gValido}`);
    return true;
  }

  // último del bombo 4: intentar intercambio dentro B4
  if (isUltimoDelBombo && bomboNumber === 4) {
    const okSwap = intentarIntercambioSoloBombo4(team);
    if (okSwap) { ubicadoDesde[team] = 4; actualizarLog(`${team} (B4 último) colocado via intercambio B4`); return true; }
  }

  actualizarLog(`${team} (B${bomboNumber}) no pudo asignarse automáticamente.`);
  return false;
}

/* ---------- Intercambio B4 ---------- */
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

    const tmpA = grupos[grupoA].slice();
    const idx = tmpA.indexOf(miembro);
    if (idx !== -1) tmpA.splice(idx,1);
    tmpA.push(team);
    if (!grupoValidoConLista(tmpA)) continue;

    for (let g2 of ordenGrupos) {
      if (g2 === grupoA || grupos[g2].length >= 4) continue;
      const tmpB = grupos[g2].slice();
      tmpB.push(miembro);
      if (grupoValidoConLista(tmpB)) {
        grupos[grupoA].splice(grupos[grupoA].indexOf(miembro),1);
        grupos[grupoA].push(team);
        grupos[g2].push(miembro);
        return true;
      }
    }
  }
  return false;
}

function grupoValidoConLista(listaMiembros) {
  let uefa = 0;
  const cnt = {};
  const bomboCount = {};
  for (let m of listaMiembros) {
    const c = confederacion[m];
    if (c) {
      cnt[c] = (cnt[c]||0)+1;
      if (c==="UEFA") uefa++;
      if (c!=="UEFA" && cnt[c]>1) return false;
      if (c==="UEFA" && uefa>2) return false;
    }
    const b = ubicadoDesde[m] || 0;
    bomboCount[b] = (bomboCount[b]||0)+1;
    if (b!==0 && bomboCount[b]>1) return false;
  }
  return true;
}

/* ---------- Interfaz ---------- */
function claseConf(conf) {
  if (!conf) return "";
  return `conf-${conf}`;
}

function renderGrupos() {
  const cont = document.getElementById("groupsContainer");
  cont.innerHTML = "";
  ordenGrupos.forEach(g => {
    const box = document.createElement("div");
    box.className = "group";
    box.id = `grupo_${g}`;
    box.innerHTML = `<h4>Grupo ${g}</h4>`;
    for (let i=0;i<4;i++){
      const divSlot = document.createElement("div");
      divSlot.className = "slot";
      const equipo = grupos[g][i];
      if (!equipo){
        divSlot.innerHTML = `<div style="opacity:0.55">—</div><div class="origin">—</div>`;
      } else {
        const flagHtml = getFlagImgHtml(equipo, 22);
        const origin = (ubicadoDesde[equipo]===0)?"Host":`B${ubicadoDesde[equipo]}`;
        divSlot.innerHTML = `<div style="display:flex;align-items:center;gap:8px;">${flagHtml}<div>${equipo}</div></div><div class="origin ${claseConf(confederacion[equipo])}">${origin}</div>`;
        if (HOSTS.includes(equipo)) divSlot.classList.add("host");
      }
      box.appendChild(divSlot);
    }
    cont.appendChild(box);
  });
  const titulo = document.getElementById("tituloBombo");
  if (titulo) titulo.innerText = `Bombo ${bomboActual}`;
}

function arrayBombo(n) {
  if(n===1) return bombo1;
  if(n===2) return bombo2;
  if(n===3) return bombo3;
  return bombo4;
}

function renderCartas() {
  const cont = document.getElementById("cardContainer");
  cont.innerHTML = "";
  const arr = arrayBombo(bomboActual);
  if(!arr || arr.length===0) return;
  mezclar(arr);
  arr.forEach(team=>{
    const card = document.createElement("div");
    card.className="card";
    card.setAttribute("data-team",team);
    card.title="Haz click para revelar";
    // al principio la carta muestra el dorso (imagen en CSS: --card-back-url)
    card.innerHTML = ""; // dorso queda por CSS
    card.addEventListener("click",()=>{if(!card.classList.contains("revealed")) revelarCarta(card)});
    cont.appendChild(card);
  });
}

function revelarCarta(cardEl){
  const team = cardEl.getAttribute("data-team");
  if (!team) return;
  const flagHtml = getFlagImgHtml(team, 28);
  cardEl.classList.add("revealed");
  cardEl.innerHTML = `<div class="flag">${flagHtml}</div><div class="name">${team}</div>`;
  const arr = arrayBombo(bomboActual);
  const isUltimo = arr.length===1;
  setTimeout(()=>{
    asignarEquipo(team,bomboActual,isUltimo);
    const idx = arr.indexOf(team);
    if(idx!==-1) arr.splice(idx,1);
    renderGrupos();
    if(arr.length===0) avanzarBombo();
    renderCartas();
  },600);
}

/* ---------- Flujo ---------- */
function avanzarBombo(){
  bomboActual++;
  if(bomboActual>4){
    actualizarLog("🎉 Sorteo finalizado");
    const titulo = document.getElementById("tituloBombo");
    if (titulo) titulo.innerText="Sorteo completado";
    const cont = document.getElementById("cardContainer");
    if (cont) cont.innerHTML="";
    return;
  }
  actualizarLog(`➡️ Comienza Bombo ${bomboActual}`);
  renderCartas();
}

/* ---------- Reinicio ---------- */
function reiniciarTodo(){
  // reset estado
  bomboActual = 1;
  primerEspecial = null;
  grupoPrimerEspecial = null;

  // vaciar grupos
  for (let g of ordenGrupos) grupos[g] = [];

  // colocar hosts en sus grupos fijas: A: México, B: Canadá, D: Estados Unidos
  grupos["A"].push("México");
  grupos["B"].push("Canadá");
  grupos["D"].push("Estados Unidos");

  // reset ubicadoDesde completamente
  for (let k in ubicadoDesde) delete ubicadoDesde[k];
  ubicadoDesde["México"] = 0;
  ubicadoDesde["Canadá"] = 0;
  ubicadoDesde["Estados Unidos"] = 0;

  // restaurar bombos
  bombo1 = ["España","Argentina","Francia","Inglaterra","Brasil","Portugal","Países Bajos","Bélgica","Alemania"];
  bombo2 = ["Australia","Austria","Colombia","Corea del Sur","Croacia","Ecuador","Irán","Japón","Marruecos","Senegal","Suiza","Uruguay"];
  bombo3 = ["Arabia Saudita","Argelia","Costa de Marfil","Egipto","Escocia","Noruega","Panamá","Paraguay","Qatar","Sudáfrica","Túnez","Uzbekistán"];
  bombo4 = ["Jordania","Cabo Verde","Ghana","Curazao","Haití","Nueva Zelanda","R EUR 1","R EUR 2","R EUR 3","R EUR 4","R INT 1","R INT 2"];

  // render inicial
  renderGrupos();
  renderCartas();
  actualizarLog("🔄 Reinicio completo");
}

/* ---------- Init ---------- */
document.addEventListener("DOMContentLoaded",()=>{
  // iniciar
  reiniciarTodo();
  // listener reinicio (usa id="reiniciar" como tu HTML)
  const btn = document.getElementById("reiniciar");
  if (btn) btn.addEventListener("click", reiniciarTodo);
});
