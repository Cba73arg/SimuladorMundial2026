/* manual.js - CORREGIDO
   Lógica del Bombo 1 (archivos al mismo nivel)
   - Corrige bug que permitía asignar cabeza de serie sobre anfitriones
   - Cartas usan data-team para evitar errores por reindexado
*/

/* -------------------
   Configuración
   ------------------- */
const grupos = {
    A: ["México"],
    B: ["Canadá"],
    C: [],
    D: ["Estados Unidos"],
    E: [],
    F: [],
    G: [],
    H: [],
    I: [],
    J: [],
    K: [],
    L: []
};

const ordenGrupos = ["A","B","C","D","E","F","G","H","I","J","K","L"];

let bombo1 = [
    "España","Argentina","Francia","Inglaterra",
    "Brasil","Portugal","Países Bajos","Bélgica","Alemania"
];

const HOSTS = ["México","Canadá","Estados Unidos"];

// Estado para España/Argentina
let primerEspecial = null;       // "España" o "Argentina"
let grupoPrimerEspecial = null; // letra del grupo donde cayó el primero

// Bloques (definidos por el usuario)
const bloque1 = ["E","I","F","H","D","G"];
const bloque2 = ["C","A","J","L","B","K"];

/* -------------------
   Utilidades
   ------------------- */
function mezclar(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
}

function renderGrupos() {
    const cont = document.getElementById("groupsContainer");
    cont.innerHTML = "";

    ordenGrupos.forEach(g => {
        const div = document.createElement("div");
        div.className = "group";

        div.innerHTML = `<h3>Grupo ${g}</h3>`;

        grupos[g].forEach(team => {
            const t = document.createElement("div");
            t.className = "team";
            t.innerText = team;
            // estilizar anfitrión si corresponde
            if (HOSTS.includes(team)) t.style.background = "#2b7a36";
            div.appendChild(t);
        });

        cont.appendChild(div);
    });
}

/* -------------------
   CORRECCIÓN CRUCIAL:
   siguienteGrupoVacio() SOLO retorna grupos **completamente vacíos**
   (esto evita ocupar los grupos de anfitriones)
   ------------------- */
function siguienteGrupoVacio() {
    for (let g of ordenGrupos) {
        if (grupos[g].length === 0) return g;
    }
    return null;
}

/* Devuelve el grupo 'opuesto' según la posición del grupo en su bloque.
   Si no está en ninguno de los bloque1/bloque2 retorna null. */
function obtenerGrupoOpuesto(grupo) {
    const i1 = bloque1.indexOf(grupo);
    if (i1 !== -1) return bloque2[i1];
    const i2 = bloque2.indexOf(grupo);
    if (i2 !== -1) return bloque1[i2];
    return null;
}

/* -------------------
   Lógica de ubicación
   ------------------- */
function ubicarEquipo(team) {
    // España / Argentina (regla especial)
    if (team === "España" || team === "Argentina") {
        if (!primerEspecial) {
            // primero del par: va al siguiente grupo totalmente vacío
            const g = siguienteGrupoVacio();
            if (g) {
                grupos[g].push(team);
                primerEspecial = team;
                grupoPrimerEspecial = g;
            } else {
                // fallback improbable: si no hay grupos vacíos, colocar en primer grupo con 0/1 con no-host
                const fallback = ordenGrupos.find(x => !HOSTS.includes(grupos[x][0]));
                if (fallback) grupos[fallback].push(team);
            }
            renderGrupos();
            return;
        } else {
            // segundo del par: va forzado al bloque opuesto al que quedó el primero
            const bloqueOpuesto = obtenerGrupoOpuesto(grupoPrimerEspecial);
            if (!bloqueOpuesto) {
                // si no encontramos opuesto (caso extraño) usamos siguiente grupo vacío
                const g = siguienteGrupoVacio();
                if (g) grupos[g].push(team);
                renderGrupos();
                return;
            }

            // Si hay lugar libre en el bloque opuesto (algún grupo vacío dentro del bloque) -> asignar ahí
            const bloquesArr = bloque1.includes(grupoPrimerEspecial) ? bloque2 : bloque1;
            let gLibre = null;
            for (let gx of bloquesArr) {
                if (grupos[gx].length === 0) { gLibre = gx; break; }
            }

            if (gLibre) {
                grupos[gLibre].push(team);
                renderGrupos();
                return;
            }

            // Si no hay grupo vacío en bloque opuesto: intentar intercambio con un grupo ocupado por NO-anfitrión
            // buscamos un grupo del bloque opuesto cuyo primer elemento NO sea anfitrión ni España/Argentina
            let gIntercambio = null;
            for (let gx of bloquesArr) {
                if (grupos[gx].length > 0) {
                    const ocupante = grupos[gx][0];
                    if (!HOSTS.includes(ocupante) && ocupante !== "España" && ocupante !== "Argentina") {
                        gIntercambio = gx;
                        break;
                    }
                }
            }

            if (gIntercambio) {
                // intercambiamos: el ocupante de gIntercambio va al grupoPrimerEspecial
                const ocupante = grupos[gIntercambio][0];
                // colocar team en el grupo opuesto
                grupos[gIntercambio][0] = team;
                // mover ocupante al grupo donde cayó el primero (reemplazar)
                grupos[grupoPrimerEspecial][0] = ocupante;
                renderGrupos();
                return;
            }

            // Si tampoco podemos intercambiar (caso extremo), como fallback buscamos siguiente grupo vacío global
            const gFallback = siguienteGrupoVacio();
            if (gFallback) {
                grupos[gFallback].push(team);
                renderGrupos();
                return;
            }

            // último recurso: colocar en el primer grupo que no sea de anfitrión
            for (let gx of ordenGrupos) {
                if (!HOSTS.includes(grupos[gx][0])) {
                    grupos[gx].push(team);
                    renderGrupos();
                    return;
                }
            }
            // si todo falla (muy improbable), no hacemos nada
            return;
        }
    }

    // Caso general: colocar en primer grupo completamente vacío
    const g = siguienteGrupoVacio();
    if (g) {
        grupos[g].push(team);
    } else {
        // fallback conservador: colocar en primer grupo que no tenga anfitrión como único ocupante
        for (let gx of ordenGrupos) {
            if (grupos[gx].length === 0) { grupos[gx].push(team); break; }
        }
    }
    renderGrupos();
}

/* -------------------
   Interfaz: cartas
   ------------------- */
function renderCartas() {
    const cont = document.getElementById("cardContainer");
    cont.innerHTML = "";

    if (bombo1.length === 0) {
        const msg = document.createElement("div");
        msg.style.color = "#cfeefb";
        msg.style.padding = "12px";
        msg.textContent = "Bombo vacío. Ya se asignaron todas las cabezas de serie del Bombo 1.";
        cont.appendChild(msg);
        return;
    }

    // mezclamos antes de mostrar
    mezclar(bombo1);

    bombo1.forEach(team => {
        const card = document.createElement("div");
        card.className = "card";
        card.setAttribute("data-team", team);
        card.setAttribute("role", "button");
        card.title = "Haz click para revelar";

        card.addEventListener("click", () => {
            // evitar re-click si ya revelada
            if (card.classList.contains("revealed")) return;
            revelarCarta(card);
        });

        cont.appendChild(card);
    });
}

function revelarCarta(cardEl) {
    const team = cardEl.getAttribute("data-team");
    if (!team) return;

    // animación básica: mostrar nombre en carta
    cardEl.classList.add("revealed");
    cardEl.innerText = team;

    // después de breve delay hacemos la asignación y regeneramos cartas
    setTimeout(() => {
        ubicarEquipo(team);

        // quitar del bombo el equipo (buscar por nombre)
        const idx = bombo1.indexOf(team);
        if (idx !== -1) bombo1.splice(idx, 1);

        // volver a renderizar cartas (se mezclarán de nuevo dentro)
        renderCartas();
    }, 700);
}

/* -------------------
   Reiniciar
   ------------------- */
function reiniciar() {
    // restaurar bombo y grupos
    bombo1 = ["España","Argentina","Francia","Inglaterra","Brasil","Portugal","Países Bajos","Bélgica","Alemania"];

    for (let key in grupos) {
        // mantener anfitriones
        if (key === "A") grupos[key] = ["México"];
        else if (key === "B") grupos[key] = ["Canadá"];
        else if (key === "D") grupos[key] = ["Estados Unidos"];
        else grupos[key] = [];
    }

    primerEspecial = null;
    grupoPrimerEspecial = null;

    renderGrupos();
    renderCartas();
}

/* -------------------
   Inicialización
   ------------------- */
document.addEventListener("DOMContentLoaded", () => {
    renderGrupos();
    renderCartas();

    // si tenés un botón de reinicio enlazarlo (si no, no hace nada)
    const btn = document.getElementById("reiniciar");
    if (btn) btn.addEventListener("click", reiniciar);
});
