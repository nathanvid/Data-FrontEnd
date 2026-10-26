// Graphe des 8 personnages, dessiné en SVG. Composant SERVEUR : le dessin est calculé
// sur le serveur et arrive dans le navigateur sous forme de HTML, sans JavaScript.
//
// Positions FIXES : tous les étudiants ont la même carte, ce qui facilite le débrief.
// Les flèches ne montrent QUE les recommandations obtenues (fournies par la base, déjà filtrées).
import type {
  EtatPersonnage,
  Personnage,
  Recommandation,
} from "@/lib/types-tableau";
import { ETATS, libelleEtat } from "@/lib/libelles";

const LARGEUR = 160;
const HAUTEUR = 74;

// Coin supérieur gauche de chaque carte, dans un repère de 900 × 500.
// Disposition calculée par recherche automatique : pour les 13 recommandations possibles
// de la carte des accès, aucune flèche ne passe sous une carte ni n'en croise une autre.
const POSITIONS: Record<string, { x: number; y: number }> = {
  thomas: { x: 10, y: 16 },
  karim: { x: 550, y: 16 },
  claire: { x: 730, y: 16 },
  nadia: { x: 190, y: 150 },
  marc: { x: 10, y: 284 },
  sophie: { x: 370, y: 284 },
  patrick: { x: 730, y: 284 },
  julien: { x: 550, y: 418 },
};

const COULEURS: Record<
  EtatPersonnage,
  { fond: string; bord: string; texte: string; pointilles?: string }
> = {
  verrouille: {
    fond: "#f1f5f9",
    bord: "#94a3b8",
    texte: "#64748b",
    pointilles: "6 4",
  },
  accessible: { fond: "#ffffff", bord: "#6366f1", texte: "#1e293b" },
  contacte: { fond: "#fffbeb", bord: "#f59e0b", texte: "#1e293b" },
  a_repondu: { fond: "#ecfdf5", bord: "#059669", texte: "#1e293b" },
  fini: { fond: "#d1fae5", bord: "#047857", texte: "#1e293b" },
};

// Position de repli si un personnage est ajouté en base sans être placé ici
function position(id: string, index: number) {
  return (
    POSITIONS[id] ?? {
      x: 20 + (index % 4) * 220,
      y: 16 + Math.floor(index / 4) * 180,
    }
  );
}

// Point où la droite entre deux centres sort du rectangle (pour que la flèche touche le bord)
function bord(cx: number, cy: number, dx: number, dy: number) {
  const t = Math.min(
    LARGEUR / 2 / Math.abs(dx || 1e-9),
    HAUTEUR / 2 / Math.abs(dy || 1e-9),
  );
  return { x: cx + dx * t, y: cy + dy * t };
}

function raccourcir(texte: string, max: number) {
  return texte.length > max ? texte.slice(0, max - 1) + "…" : texte;
}

export function CarteEnquete({
  personnages,
  recommandations,
}: {
  personnages: Personnage[];
  recommandations: Recommandation[];
}) {
  const centres = new Map(
    personnages.map((p, i) => {
      const { x, y } = position(p.id, i);
      return [p.id, { cx: x + LARGEUR / 2, cy: y + HAUTEUR / 2 }];
    }),
  );

  return (
    <svg
      viewBox="0 0 900 500"
      className="h-auto w-full"
      role="img"
      aria-label="Carte des personnages et des recommandations obtenues"
    >
      <defs>
        <marker
          id="fleche"
          viewBox="0 0 10 10"
          refX="9"
          refY="5"
          markerWidth="7"
          markerHeight="7"
          orient="auto"
        >
          <path d="M0,0 L10,5 L0,10 z" fill="#4f46e5" />
        </marker>
      </defs>

      {/* Flèches d'abord, pour qu'elles passent sous les cartes */}
      {recommandations.map((r) => {
        const a = centres.get(r.de);
        const b = centres.get(r.vers);
        if (!a || !b) return null;
        const dx = b.cx - a.cx;
        const dy = b.cy - a.cy;
        const longueur = Math.hypot(dx, dy) || 1;
        // Léger décalage perpendiculaire : deux recos réciproques ne se superposent pas
        const ox = (-dy / longueur) * 6;
        const oy = (dx / longueur) * 6;
        const depart = bord(a.cx, a.cy, dx, dy);
        const arrivee = bord(b.cx, b.cy, -dx, -dy);
        return (
          <line
            key={`${r.de}-${r.vers}`}
            x1={depart.x + ox}
            y1={depart.y + oy}
            x2={arrivee.x + ox}
            y2={arrivee.y + oy}
            stroke="#4f46e5"
            strokeWidth={2}
            markerEnd="url(#fleche)"
          >
            <title>Recommandation obtenue</title>
          </line>
        );
      })}

      {personnages.map((p, i) => {
        const { x, y } = position(p.id, i);
        const c = COULEURS[p.etat];
        return (
          <g key={p.id}>
            <title>{`${p.prenom} ${p.nom} : ${ETATS[p.etat].aide}`}</title>
            <rect
              x={x}
              y={y}
              width={LARGEUR}
              height={HAUTEUR}
              rx={10}
              fill={c.fond}
              stroke={c.bord}
              strokeWidth={2}
              strokeDasharray={c.pointilles}
            />
            <text
              x={x + 12}
              y={y + 22}
              fontSize={15}
              fontWeight={700}
              fill={c.texte}
            >
              {p.prenom} {p.nom}
            </text>
            <text x={x + 12} y={y + 40} fontSize={11} fill="#64748b">
              {raccourcir(p.role, 25)}
            </text>
            <text
              x={x + 12}
              y={y + 61}
              fontSize={11}
              fontWeight={600}
              fill={c.bord}
            >
              {libelleEtat(p)}
              {/* Une fois la réponse reçue, la mention ne sert plus et ne tiendrait pas */}
              {p.porte_entree && p.etat !== "a_repondu" && p.etat !== "fini"
                ? " · porte d'entrée"
                : ""}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
