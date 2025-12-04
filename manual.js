/* manual.js - versión final corregida y extendida
   Cambios principales:
   - Regla TOP4: España, Argentina, Francia, Inglaterra (bloques y subbloques)
   - Intercambio 1 a 1 entre equipos del mismo bombo si no se puede asignar
   - Resortear el bombo (2/3/4) si no hay intercambio posible
   - Evitar que desplazados ocupen grupos con cabeza de serie cuando sea posible
   - Exportar imagen con fondo verde claro temporal
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
  "México":"CONCACAF","Canadá":"CONCACAF","Estados Unidos":"CONCACAF","España":"UEFA","Argentina":"CONMEBOL","Francia":"UEFA","Inglaterra":"UEFA","Brasil":"CONMEBOL","Portugal":"UEFA","Países Bajos":"UEFA","Bélgica":"UEFA","Alemania":"UEFA",
  "Australia":"AFC","Austria":"UEFA","Colombia":"CONMEBOL","Corea del Sur":"AFC","Croacia":"UEFA","Ecuador":"CONMEBOL","Irán":"AFC","Japón":"AFC","Marruecos":"CAF","Senegal":"CAF","Suiza":"UEFA","Uruguay":"CONMEBOL",
  "Arabia Saudita":"AFC","Argelia":"CAF","Costa de Marfil":"CAF","Egipto":"CAF","Escocia":"UEFA","Noruega":"UEFA","Panamá":"CONCACAF","Paraguay":"CONMEBOL","Qatar":"AFC","Sudáfrica":"CAF","Túnez":"CAF","Uzbekistán":"AFC",
  "Jordania":"AFC","Cabo Verde":"CAF","Ghana":"CAF","Curazao":"CONCACAF","Haití":"CONCACAF","Nueva Zelanda":"OFC",
  "R EUR 1":"UEFA","R EUR 2":"UEFA","R EUR 3":"UEFA","R EUR 4":"UEFA",
  "R INT 1": null, "R INT 2": null
};

/* Ubicación inicial de equipos (origen bombo) */
const ubicadoDesde = {};
["México","Canadá","Estados Unidos"].forEach(h=> ubicadoDesde[h]=0);

/* Estado TOP4 (España, Argentina, Francia, Inglaterra) */
const TOP4 = ["España","Argentina","Francia","Inglaterra"];
let top4Order = []; // registros en orden de salida: {team, group, block, sub}

/* bombo actual */
let bomboActual = 1;

/* Flag para indicar que se resorteó un bombo (para no eliminar la carta actual en revelarCarta) */
let resortOccurred = false;
let resortBomboNumber = null;

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

/* Devuelve HTML de la imagen de la bandera (archivo: "<CountryName>.png" en el mismo nivel). */
function getFlagImgHtml(team, size = 22) {
  const filename = encodeURIComponent(team) + ".png";
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

/* Verifica si un grupo tiene "cabeza de serie" (host o equipo de bombo1) */
function tieneCabezaDeSerie(grupoLetter) {
  return grupos[grupoLetter].some(t => HOSTS.includes(t) || ubicadoDesde[t] === 1);
}

/* Retorna true si se puede colocar 'team' en 'grupoLetter' respetando confederaciones y bombo */
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

/* primerGrupoValidoPara: busca primer grupo que acepte al equipo según confederaciones y bombo.
   nuevo parámetro avoidGroupsWithHead (default false). Si true, evita grupos que ya tengan cabeza de serie
   (host o bombo1), útil para ubicar desplazados de manera que rellenen grupos sin cabeza. */
function primerGrupoValidoPara(team, bomboNumber, avoidGroupsWithHead = false) {
  for (let g of ordenGrupos) {
    if (grupos[g].length >= 4) continue;
    if (avoidGroupsWithHead && tieneCabezaDeSerie(g)) continue;
    if (puedeColocarEnGrupoExtendido(team, g, bomboNumber)) return g;
  }
  return null;
}

/* primerGrupoValidoExcluyendo: igual que anterior pero excluye lista 'exclude' y permite evitar cabezas */
function primerGrupoValidoExcluyendo(team, bomboNumber, exclude = [], avoidGroupsWithHead = false) {
  for (let g of ordenGrupos) {
    if (exclude.includes(g) || grupos[g].length >= 4) continue;
    if (avoidGroupsWithHead && tieneCabezaDeSerie(g)) continue;
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

/* ---------- Nuevas utilidades para BLOQUES / SUBBLOQUES (TOP4) ---------- */
/* Subbloques:
   BLOQUE 1: SUBA: E,I,F   SUBB: H,G
   BLOQUE 2: SUBA: C,L     SUBB: J,K
*/
const SUBS = {
  "1A": ["E","I","F"],
  "1B": ["H","G"],
  "2A": ["C","L"],
  "2B": ["J","K"]
};

function grupoABloqueSub(grupo) {
  if (SUBS["1A"].includes(grupo)) return {block:1, sub:"A"};
  if (SUBS["1B"].includes(grupo)) return {block:1, sub:"B"};
  if (SUBS["2A"].includes(grupo)) return {block:2, sub:"A"};
  if (SUBS["2B"].includes(grupo)) return {block:2, sub:"B"};
  return null;
}
function bloqueOpuesto(block) { return block === 1 ? 2 : 1; }
function subOpuesto(sub) { return sub === "A" ? "B" : "A"; }
function subKey(block, sub) { return `${block}${sub}`; }

function puedeColocar(team, g, bomboNumber) { return puedeColocarEnGrupoExtendido(team, g, bomboNumber); }

/* ---------- comprobador de lista de grupo ---------- */
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

/* ---------- Asignar TOP4 (reglas con prioridad al mover desplazados a grupos sin cabeza) ---------- */
function asignarTop4(team, bomboNumber) {
  const n = top4Order.length;
  if (n === 0) {
    const g = primerGrupoCompletamenteVacio();
    if (!g) { actualizarLog(`No hay grupo vacío para ${team} (TOP4 primer).`); return false; }
    grupos[g].push(team); ubicadoDesde[team] = bomboNumber;
    const bs = grupoABloqueSub(g);
    top4Order.push({team, group:g, block: bs.block, sub:bs.sub});
    actualizarLog(`${team} (TOP4) asignado como primer del TOP4 en Grupo ${g} (Bloque ${bs.block} Sub ${bs.sub})`);
    return true;
  }

  if (n === 1) {
    const first = top4Order[0];
    const targetBlock = bloqueOpuesto(first.block);
    const targetSub = first.sub;
    const candidates = SUBS[subKey(targetBlock, targetSub)];
    // 1) buscar grupo válido en block-sub
    for (let g of candidates) {
      if (grupos[g].length < 4 && puedeColocar(team, g, bomboNumber)) {
        grupos[g].push(team); ubicadoDesde[team] = bomboNumber;
        top4Order.push({team, group:g, block:targetBlock, sub:targetSub});
        actualizarLog(`${team} (TOP4) asignado al Grupo ${g} (Bloque ${targetBlock} Sub ${targetSub})`);
        return true;
      }
    }
    // 2) intentar desplazar ocupante del block-sub pero buscando un DEST que NO tenga cabeza de serie
    for (let g of candidates) {
      if (grupos[g].length > 0) {
        const ocupante = grupos[g][0];
        if (!HOSTS.includes(ocupante) && !TOP4.includes(ocupante)) {
          const bomboDelOcupante = ubicadoDesde[ocupante] || bomboNumber;
          const dest = primerGrupoValidoExcluyendo(ocupante, bomboDelOcupante, [g], true);
          if (dest) {
            grupos[g].splice(0,1);
            grupos[g].push(team);
            grupos[dest].push(ocupante);
            ubicadoDesde[team]=bomboNumber;
            top4Order.push({team, group:g, block:targetBlock, sub:targetSub});
            actualizarLog(`Desplazamiento TOP4: ${team} -> Grupo ${g}; ${ocupante} -> Grupo ${dest}`);
            return true;
          }
        }
      }
    }
    // 3) fallback global pero priorizando sin cabeza
    const fallbackNoHead = primerGrupoValidoPara(team, bomboNumber, true);
    if (fallbackNoHead) { grupos[fallbackNoHead].push(team); ubicadoDesde[team]=bomboNumber; top4Order.push({team, group:fallbackNoHead, block: grupoABloqueSub(fallbackNoHead)?.block, sub: grupoABloqueSub(fallbackNoHead)?.sub}); actualizarLog(`${team} (TOP4 fallback no-head) -> ${fallbackNoHead}`); return true; }
    const fallback = primerGrupoValidoPara(team, bomboNumber);
    if (fallback) { grupos[fallback].push(team); ubicadoDesde[team] = bomboNumber; top4Order.push({team, group:fallback, block: grupoABloqueSub(fallback)?.block, sub: grupoABloqueSub(fallback)?.sub}); actualizarLog(`${team} (TOP4 fallback) -> Grupo ${fallback}`); return true; }
    actualizarLog(`${team} (TOP4) no pudo ser ubicado en bloque opuesto (second).`);
    return false;
  }

  if (n === 2) {
    const first = top4Order[0];
    const targetBlock = first.block;
    const targetSub = subOpuesto(first.sub);
    const candidates = SUBS[subKey(targetBlock, targetSub)];
    for (let g of candidates) {
      if (grupos[g].length < 4 && puedeColocar(team, g, bomboNumber)) {
        grupos[g].push(team); ubicadoDesde[team]=bomboNumber;
        top4Order.push({team, group:g, block:targetBlock, sub:targetSub});
        actualizarLog(`${team} (TOP4) asignado al Grupo ${g} (Bloque ${targetBlock} Sub ${targetSub})`);
        return true;
      }
    }
    for (let g of candidates) {
      if (grupos[g].length > 0) {
        const ocupante = grupos[g][0];
        if (!HOSTS.includes(ocupante) && !TOP4.includes(ocupante)) {
          const bomboDelOcupante = ubicadoDesde[ocupante] || bomboNumber;
          const dest = primerGrupoValidoExcluyendo(ocupante, bomboDelOcupante, [g], true);
          if (dest) {
            grupos[g].splice(0,1);
            grupos[g].push(team);
            grupos[dest].push(ocupante);
            ubicadoDesde[team]=bomboNumber;
            top4Order.push({team, group:g, block:targetBlock, sub:targetSub});
            actualizarLog(`Desplazamiento TOP4: ${team} -> Grupo ${g}; ${ocupante} -> Grupo ${dest}`);
            return true;
          }
        }
      }
    }
    const fallbackNoHead = primerGrupoValidoPara(team, bomboNumber, true);
    if (fallbackNoHead) { grupos[fallbackNoHead].push(team); ubicadoDesde[team]=bomboNumber; top4Order.push({team, group:fallbackNoHead, block: grupoABloqueSub(fallbackNoHead)?.block, sub: grupoABloqueSub(fallbackNoHead)?.sub}); actualizarLog(`${team} (TOP4 fallback no-head) -> ${fallbackNoHead}`); return true; }
    const fallback = primerGrupoValidoPara(team, bomboNumber);
    if (fallback) { grupos[fallback].push(team); ubicadoDesde[team]=bomboNumber; top4Order.push({team, group:fallback, block: grupoABloqueSub(fallback)?.block, sub: grupoABloqueSub(fallback)?.sub}); actualizarLog(`${team} (TOP4 fallback) -> Grupo ${fallback}`); return true; }
    actualizarLog(`${team} (TOP4) no pudo ser ubicado (third).`);
    return false;
  }

  if (n === 3) {
    const third = top4Order[2];
    const targetBlock = bloqueOpuesto(third.block);
    const targetSub = third.sub;
    const candidates = SUBS[subKey(targetBlock, targetSub)];
    for (let g of candidates) {
      if (grupos[g].length < 4 && puedeColocar(team, g, bomboNumber)) {
        grupos[g].push(team); ubicadoDesde[team]=bomboNumber;
        top4Order.push({team, group:g, block:targetBlock, sub:targetSub});
        actualizarLog(`${team} (TOP4) asignado al Grupo ${g} (Bloque ${targetBlock} Sub ${targetSub})`);
        return true;
      }
    }
    for (let g of candidates) {
      if (grupos[g].length > 0) {
        const ocupante = grupos[g][0];
        if (!HOSTS.includes(ocupante) && !TOP4.includes(ocupante)) {
          const bomboDelOcupante = ubicadoDesde[ocupante] || bomboNumber;
          const dest = primerGrupoValidoExcluyendo(ocupante, bomboDelOcupante, [g], true);
          if (dest) {
            grupos[g].splice(0,1);
            grupos[g].push(team);
            grupos[dest].push(ocupante);
            ubicadoDesde[team]=bomboNumber;
            top4Order.push({team, group:g, block:targetBlock, sub:targetSub});
            actualizarLog(`Desplazamiento TOP4: ${team} -> Grupo ${g}; ${ocupante} -> Grupo ${dest}`);
            return true;
          }
        }
      }
    }
    const fallbackNoHead = primerGrupoValidoPara(team, bomboNumber, true);
    if (fallbackNoHead) { grupos[fallbackNoHead].push(team); ubicadoDesde[team]=bomboNumber; top4Order.push({team, group:fallbackNoHead, block: grupoABloqueSub(fallbackNoHead)?.block, sub: grupoABloqueSub(fallbackNoHead)?.sub}); actualizarLog(`${team} (TOP4 fallback no-head) -> ${fallbackNoHead}`); return true; }
    const fallback = primerGrupoValidoPara(team, bomboNumber);
    if (fallback) { grupos[fallback].push(team); ubicadoDesde[team]=bomboNumber; top4Order.push({team, group:fallback, block: grupoABloqueSub(fallback)?.block, sub: grupoABloqueSub(fallback)?.sub}); actualizarLog(`${team} (TOP4 fallback) -> Grupo ${fallback}`); return true; }
    actualizarLog(`${team} (TOP4) no pudo ser ubicado (fourth).`);
    return false;
  }

  // si es >3, fallback simple
  const g = primerGrupoValidoPara(team, bomboNumber);
  if (g) { grupos[g].push(team); ubicadoDesde[team]=bomboNumber; return true; }
  return false;
}

/* ---------- Intercambio exclusivo bombo4 (existente) ---------- */
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

/* ---------- Intercambio mismo bombo (prioriza mover desplazados a grupos sin cabeza) ---------- */
function intentarIntercambioMismoBombo(team, bomboNumber) {
  for (let g of ordenGrupos) {
    for (let idx = 0; idx < grupos[g].length; idx++) {
      const miembro = grupos[g][idx];
      if (ubicadoDesde[miembro] === bomboNumber) {
        if (!puedeColocarEnGrupoExtendido(team, g, bomboNumber)) continue;
        // buscamos dest para 'miembro' en otro grupo que no tenga cabeza de serie
        const dest = primerGrupoValidoExcluyendo(miembro, bomboNumber, [g], true);
        if (dest) {
          grupos[g].splice(idx,1);
          grupos[g].push(team);
          grupos[dest].push(miembro);
          ubicadoDesde[team] = bomboNumber;
          actualizarLog(`Intercambio mismo bombo: ${team} -> Grupo ${g}; ${miembro} -> Grupo ${dest}`);
          return true;
        }
      }
    }
  }
  return false;
}

/* ---------- Intercambio 1-a-1 simple entre equipos del mismo bombo (solución solicitada) ----------
   Busca un miembro ya asignado en el mismo bombo que pueda intercambiarse 1 a 1 con 'team'.
   Reglas:
   - 'team' irá al grupo donde está 'miembro' si esa colocación respeta restricciones
   - 'miembro' irá a otro grupo (candidato) que respete sus restricciones
   - Se realiza el primer intercambio válido encontrado
*/
function intercambioUnoAUno(team, bomboNumber) {
  // recorrer todos los grupos y miembros que pertenezcan al mismo bombo
  for (let gA of ordenGrupos) {
    for (let idx = 0; idx < grupos[gA].length; idx++) {
      const miembro = grupos[gA][idx];
      if (ubicadoDesde[miembro] !== bomboNumber) continue;
      if (HOSTS.includes(miembro) || TOP4.includes(miembro)) continue; // no desplazamos cabezas ni TOP4
      // puede 'team' ir en gA?
      if (!puedeColocarEnGrupoExtendido(team, gA, bomboNumber)) continue;
      // busco un grupo destino gB distinto donde 'miembro' pueda entrar (y que tras el swap ambos grupos sean válidos)
      for (let gB of ordenGrupos) {
        if (gB === gA) continue;
        if (grupos[gB].length >= 4) continue;
        // simular listas
        const listaA = grupos[gA].slice();
        listaA.splice(listaA.indexOf(miembro),1);
        listaA.push(team);
        const listaB = grupos[gB].slice();
        listaB.push(miembro);
        // validar confederaciones y bombo para ambas listas
        // pero debemos comprobar bombo-uniqueness: miembro ya tiene su bombo y team también
        // ubicadosDesde no cambiará hasta finalizar intercambio ; usamos grupoValidoConLista para validar
        // pero grupoValidoConLista usa ubicadoDesde. Para "team" aún no tiene ubicadoDesde (o tendrá bomboNumber).
        // Para simular correctamente, temporalmente asignamos ubicadoDesde simulados:
        const prevTeamUb = ubicadoDesde[team];
        const prevMiembroUb = ubicadoDesde[miembro];
        ubicadoDesde[team] = bomboNumber; // simular
        // miembro ya tiene ubicadoDesde[miembro] == bomboNumber
        const validA = grupoValidoConLista(listaA);
        const validB = grupoValidoConLista(listaB);
        // revertir la simulación
        if (prevTeamUb === undefined) delete ubicadoDesde[team]; else ubicadoDesde[team] = prevTeamUb;
        // Si ambas listas válidas -> ejecutar intercambio real
        if (validA && validB && puedeColocarEnGrupoExtendido(miembro, gB, bomboNumber)) {
          // realizar intercambio: remover miembro de gA y poner team; poner miembro en gB
          grupos[gA].splice(grupos[gA].indexOf(miembro),1);
          grupos[gA].push(team);
          grupos[gB].push(miembro);
          ubicadoDesde[team] = bomboNumber;
          // ubicadoDesde[miembro] ya era bomboNumber
          actualizarLog(`Intercambio 1-a-1: ${team} -> Grupo ${gA}; ${miembro} -> Grupo ${gB}`);
          return true;
        }
      }
    }
  }
  return false;
}

/* ---------- Resortear bombo: remezclar el bombo y re-renderizar las cartas ----------
   Esto se activa si no se puede ubicar ni por intercambio. Solo efectivo para bombos 2/3/4.
*/
function resortearBombo(bomboNumber) {
  const arr = arrayBombo(bomboNumber);
  if (!arr || arr.length === 0) return;
  mezclar(arr);
  resortOccurred = true;
  resortBomboNumber = bomboNumber;
  actualizarLog(`🔁 No se encontró intercambio válido. Se resortea el bombo ${bomboNumber}.`);
  // re-render cartas para el bombo actual si estamos en ese bombo
  if (bomboActual === bomboNumber) {
    renderCartas();
  }
}

/* ---------- Asignación general (usa intercambioUnoAUno + resortear) ---------- */
function asignarEquipo(team, bomboNumber, isUltimoDelBombo=false) {
  // Si es TOP4 y viene del bombo 1 -> ruteamos a asignarTop4
  if (bomboNumber === 1 && TOP4.includes(team)) {
    const ok = asignarTop4(team, bomboNumber);
    if (!ok) {
      const gFallback = primerGrupoValidoPara(team, bomboNumber);
      if (gFallback) { grupos[gFallback].push(team); ubicadoDesde[team]=bomboNumber; actualizarLog(`${team} (B1 TOP4 fallback global) -> ${gFallback}`); return true; }
      actualizarLog(`${team} (TOP4) no pudo asignarse ni con fallback.`);
      return false;
    }
    return true;
  }

  // BOMBO 1 (no TOP4) - original: primer grupo vacío
  if (bomboNumber === 1) {
    if (!TOP4.includes(team)) {
      const g = primerGrupoCompletamenteVacio();
      if (g) { grupos[g].push(team); ubicadoDesde[team]=1; actualizarLog(`${team} (B1) -> Grupo ${g}`); return true; }
      actualizarLog(`No hay grupo completamente vacío para ${team} (B1).`);
      const swapped = intentarIntercambioMismoBombo(team, 1);
      if (swapped) return true;
      return false;
    }
  }

  // BOMBO 2/3/4: regla general confederación + 1 por bombo
  const gValido = primerGrupoValidoPara(team, bomboNumber);
  if (gValido) {
    grupos[gValido].push(team);
    ubicadoDesde[team] = bomboNumber;
    actualizarLog(`${team} (B${bomboNumber}) -> Grupo ${gValido}`);
    return true;
  }

  // Si no se pudo asignar automáticamente:
  // 1) Intentar intercambio 1-a-1 con equipos ya asignados del mismo bombo (solución solicitada)
  if (bomboNumber >= 2) {
    const intercambio = intercambioUnoAUno(team, bomboNumber);
    if (intercambio) {
      return true;
    }
    // 2) Intentar intercambio más relajado (intentarIntercambioMismoBombo) que prioriza grupos sin cabeza
    const swapped = intentarIntercambioMismoBombo(team, bomboNumber);
    if (swapped) return true;
    // 3) Si no hay intercambio válido, resortear el bombo (solo para bombo >=2)
    resortearBombo(bomboNumber);
    // IMPORTANTE: no removemos la carta actual; señalamos que se remezcló para que revelarCarta no la elimine
    return false;
  }

  // BOMBO 4 extra specific swap if last
  const intercambioFallback = intentarIntercambioMismoBombo(team, bomboNumber);
  if (intercambioFallback) return true;

  if (isUltimoDelBombo && bomboNumber === 4) {
    const okSwap = intentarIntercambioSoloBombo4(team);
    if (okSwap) { ubicadoDesde[team] = 4; actualizarLog(`${team} (B4 último) colocado via intercambio B4`); return true; }
  }

  actualizarLog(`${team} (B${bomboNumber}) no pudo asignarse automáticamente.`);
  return false;
}

/* ---------- Interfaz (render) ---------- */
function claseConf(conf) {
  if (!conf) return "";
  return `conf-${conf}`;
}

function renderGrupos() {
  const cont = document.getElementById("groupsContainer");
  if (!cont) return;
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

/* ---------- Cartas / Render ---------- */
function arrayBombo(n) {
  if(n===1) return bombo1;
  if(n===2) return bombo2;
  if(n===3) return bombo3;
  return bombo4;
}

function renderCartas() {
  const cont = document.getElementById("cardContainer");
  if (!cont) return;
  cont.innerHTML = "";
  const arr = arrayBombo(bomboActual);
  if(!arr || arr.length===0) return;
  mezclar(arr);
  arr.forEach(team=>{
    const card = document.createElement("div");
    card.className="card";
    card.setAttribute("data-team",team);
    card.title="Haz click para revelar";
    card.innerHTML = ""; // dorso por CSS
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
    // reset resort flag if it was a previous bombo
    if (resortOccurred && resortBomboNumber !== bomboActual) {
      resortOccurred = false;
      resortBomboNumber = null;
    }
    const ok = asignarEquipo(team,bomboActual,isUltimo);
    if(!ok) {
      actualizarLog(`Atención: ${team} no pudo asignarse automáticamente y quedó pendiente.`);
    }
    // Si se resorteó el bombo, NO eliminamos la carta actual del array (queda para re-sortear)
    if (resortOccurred && resortBomboNumber === bomboActual) {
      // dejamos la carta en el bombo para reordenarla; limpiamos flags para la próxima operación
      actualizarLog(`El bombo ${bomboActual} fue remezclado; la carta de ${team} permanecerá para re-sorteo.`);
      // limpiar bandera para no afectar próximos
      resortOccurred = false;
      resortBomboNumber = null;
    } else {
      const idx = arr.indexOf(team);
      if(idx!==-1) arr.splice(idx,1);
    }
    renderGrupos();
    if(arr.length===0) avanzarBombo();
    renderCartas();
  },600);
}

/* ---------- Flujo y finalizar con opción compartir ---------- */
function avanzarBombo(){
  bomboActual++;
  if(bomboActual>4){
    actualizarLog("🎉 Sorteo finalizado");
    const titulo = document.getElementById("tituloBombo");
    if (titulo) titulo.innerText="Sorteo completado";
    const cont = document.getElementById("cardContainer");
    if (cont) cont.innerHTML="";
    mostrarBotonCompartir();
    return;
  }
  actualizarLog(`➡️ Comienza Bombo ${bomboActual}`);
  renderCartas();
}

/* ---------- Botón compartir: genera captura con html2canvas (si está) y usa navigator.share si disponible ---------- */
function mostrarBotonCompartir(){
  let wrap = document.getElementById("compartirWrap");
  if (!wrap) {
    wrap = document.createElement("div");
    wrap.id = "compartirWrap";
    wrap.style.padding = "12px";
    wrap.style.textAlign = "center";
    const btnImg = document.createElement("button");
    btnImg.innerText = "Compartir sorteo (imagen)";
    btnImg.style.marginRight = "8px";
    btnImg.onclick = generarYCompartirImagen;
    const btnJson = document.createElement("button");
    btnJson.innerText = "Exportar JSON";
    btnJson.onclick = descargarJSON;
    wrap.appendChild(btnImg);
    wrap.appendChild(btnJson);
    const left = document.querySelector(".left") || document.body;
    left.appendChild(wrap);
  }
}

function descargarJSON(){
  const resultado = {};
  for (let g of ordenGrupos) resultado[g] = grupos[g].slice();
  const data = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(resultado, null, 2));
  const a = document.createElement("a");
  a.href = data;
  a.download = "sorteo_mundial_2026.json";
  a.click();
}

function cargarHtml2CanvasYthen(cb){
  if (window.html2canvas) return cb();
  const s = document.createElement("script");
  s.src = "https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js";
  s.onload = () => cb();
  s.onerror = () => {
    actualizarLog("No se pudo cargar html2canvas desde CDN. Compartir por imagen no disponible.");
  };
  document.head.appendChild(s);
}

/* ---------- Exportar imagen: aplicamos fondo verde claro temporalmente ---------- */
function generarYCompartirImagen(){
  const container = document.getElementById("groupsContainer");
  if (!container) return;
  cargarHtml2CanvasYthen(() => {
    if (!window.html2canvas) {
      actualizarLog("html2canvas no disponible.");
      return;
    }

    // Guardamos estilo previo para restaurar
    const prevBg = container.style.background;
    const prevPadding = container.style.padding;
    // Aplicar fondo verde claro y algo de padding para la captura
    container.style.background = "#daf3d9"; // verde claro
    container.style.padding = container.style.padding || "12px";

    html2canvas(container, {backgroundColor: null, scale: 1}).then(canvas=>{
      // Restaurar estilos
      container.style.background = prevBg;
      container.style.padding = prevPadding;

      canvas.toBlob(blob=>{
        if (navigator.canShare && navigator.canShare({files:[new File([blob],"sorteo.png",{type:"image/png"})]})) {
          const file = new File([blob],"sorteo.png",{type:"image/png"});
          navigator.share({files:[file], title:"Sorteo Mundial 2026", text:"Mi sorteo del Mundial 2026"}).then(()=> actualizarLog("Compartido correctamente"))
            .catch(err => actualizarLog("Compartir cancelado o falló: " + (err.message||err)));
        } else {
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = "sorteo_mundial_2026.png";
          a.click();
          URL.revokeObjectURL(url);
          actualizarLog("Imagen generada y descargada. Usá la imagen para compartir en redes.");
        }
      }, "image/png");
    }).catch(e => {
      // Restaurar si fallo
      container.style.background = prevBg;
      container.style.padding = prevPadding;
      actualizarLog("Error generando imagen: " + e.message);
    });
  });
}

/* ---------- Reinicio ---------- */
function reiniciarTodo(){
  bomboActual = 1;
  top4Order = [];
  resortOccurred = false;
  resortBomboNumber = null;

  for (let g of ordenGrupos) grupos[g] = [];
  grupos["A"].push("México");
  grupos["B"].push("Canadá");
  grupos["D"].push("Estados Unidos");

  for (let k in ubicadoDesde) delete ubicadoDesde[k];
  ubicadoDesde["México"] = 0;
  ubicadoDesde["Canadá"] = 0;
  ubicadoDesde["Estados Unidos"] = 0;

  bombo1 = ["España","Argentina","Francia","Inglaterra","Brasil","Portugal","Países Bajos","Bélgica","Alemania"];
  bombo2 = ["Australia","Austria","Colombia","Corea del Sur","Croacia","Ecuador","Irán","Japón","Marruecos","Senegal","Suiza","Uruguay"];
  bombo3 = ["Arabia Saudita","Argelia","Costa de Marfil","Egipto","Escocia","Noruega","Panamá","Paraguay","Qatar","Sudáfrica","Túnez","Uzbekistán"];
  bombo4 = ["Jordania","Cabo Verde","Ghana","Curazao","Haití","Nueva Zelanda","R EUR 1","R EUR 2","R EUR 3","R EUR 4","R INT 1","R INT 2"];

  const cw = document.getElementById("compartirWrap");
  if (cw) cw.remove();

  renderGrupos();
  renderCartas();
  actualizarLog("🔄 Reinicio completo");
}

/* ---------- Init ---------- */
document.addEventListener("DOMContentLoaded",()=>{
  reiniciarTodo();
  const btn = document.getElementById("reiniciar");
  if (btn) btn.addEventListener("click", reiniciarTodo);
});
