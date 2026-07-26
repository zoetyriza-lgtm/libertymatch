"use client";

export const INTERESES = [
  "Deporte",
  "Estudio",
  "Comida",
  "Arte",
  "Música",
  "Aire libre",
  "Gaming",
  "Voluntariado",
  "Fiestas",
  "Bienestar",
  "Fotografía",
  "Lectura",
];

export default function InterestPicker({ seleccionados, onChange }) {
  function toggle(interes) {
    if (seleccionados.includes(interes)) {
      onChange(seleccionados.filter((i) => i !== interes));
    } else {
      onChange([...seleccionados, interes]);
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      {INTERESES.map((interes) => {
        const activo = seleccionados.includes(interes);
        return (
          <button
            type="button"
            key={interes}
            onClick={() => toggle(interes)}
            className={`text-xs px-3 py-1.5 rounded-full border transition-all not-italic ${
              activo
                ? "bg-ink text-paper border-ink"
                : "bg-paper text-ink/70 border-ink/20 hover:border-ink/40"
            }`}
          >
            {interes}
          </button>
        );
      })}
    </div>
  );
}
