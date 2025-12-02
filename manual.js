// ==========================
// Grupos A–L iniciales
// ==========================
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

// Grupos ordenados
const ordenGrupos = ["A","B","C","D","E","F","G","H","I","J","K","L"];

// Bombo 1 sin anfitriones
let bombo1 = [
    "España",
    "Argentina",
    "Francia",
    "Inglaterra",
    "Brasil",
    "Portugal",
    "Países Bajos",
    "Bélgica",
    "Alemania"
];

// Estado bloques para España/Argentina
let primerEspecial = null; // "España" o "Argentina"
let grupoPrimerEspecial = null;

// Bloques definidos por el usuario
const bloque1 = ["E","I","F","H","D","G"];
const bloque2 = ["C","A","J","L","B","K"];

// ==========================
// Render inicial de grupos
// ==========================
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
            div.appendChild(t);
        });

        cont.appendChild(div);
    });
}

// ==========================
// Generar las cartas del bombo
// ==========================
function renderCartas() {
    const cont = document.getElementById("cardContainer");
    cont.innerHTML = "";

    bombo1.forEach((team, index) => {
        const card = document.createElement("div");
        card.className = "card";
        card.dataset.index = index;

        card.onclick = () => revelarCarta(index);

        cont.appendChild(card);
    });
}

// ==========================
// Al revelar carta
// ==========================
function revelarCarta(i) {
    const team = bombo1[i];
    if (!team) return;

    const cards = document.getElementsByClassName("card");
    const card = cards[i];

    card.classList.add("revealed");
    card.innerText = team;

    setTimeout(() => {
        ubicarEquipo(team);
        bombo1.splice(i, 1);

        mezclar(bombo1);
        renderCartas();
    }, 1000);
}

// ==========================
// Ubicar equipo con reglas especiales
// ==========================
function ubicarEquipo(team) {
    // Caso especial España/Argentina
    if (team === "España" || team === "Argentina") {
        if (!primerEspecial) {
            // Primero de los dos que sale
            primerEspecial = team;
            let g = siguienteGrupoVacio();
            grupoPrimerEspecial = g;
            grupos[g].push(team);
        } else {
            // Segundo de España/Argentina
            let grupoOpuesto = obtenerGrupoOpuesto(grupoPrimerEspecial);

            // Si está ocupado → intercambio
            if (grupos[grupoOpuesto].length > 0) {
                const ocupado = grupos[grupoOpuesto][0];

                // Intercambia
                grupos[grupoOpuesto][0] = team;

                // El equipo reemplazado va al primerEspecial
                grupos[grupoPrimerEspecial][0] = ocupado;

            } else {
                grupos[grupoOpuesto].push(team);
            }
        }

        renderGrupos();
        return;
    }

    // Resto de selecciones
    const g = siguienteGrupoVacio();
    grupos[g].push(team);
    renderGrupos();
}

// ==========================
// Buscar siguiente grupo libre
// ==========================
function siguienteGrupoVacio() {
    for (let g of ordenGrupos) {
        if (grupos[g].length === 0 || grupos[g].length === 1) {
            if (grupos[g].length === 0 || (grupos[g].length === 1 && ["México","Canadá","Estados Unidos"].includes(grupos[g][0]))) {
                return g;
            }
        }
    }
}

// ==========================
// Obtener grupo opuesto
// ==========================
function obtenerGrupoOpuesto(grupo) {
    let index1 = bloque1.indexOf(grupo);
    if (index1 !== -1) return bloque2[index1];

    let index2 = bloque2.indexOf(grupo);
    if (index2 !== -1) return bloque1[index2];

    return null;
}

// ==========================
// Mezclar array
// ==========================
function mezclar(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
}

// ==========================
// Inicializar
// ==========================
renderGrupos();
mezclar(bombo1);
renderCartas();
