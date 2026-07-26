import Link from "next/link";

const ESTADO_COLOR = {
  abierto: "bg-moss",
  lleno: "bg-mustard",
  cancelado: "bg-clay",
};

const ESTADO_LABEL = {
  abierto: "Abierto",
  lleno: "Cupo lleno",
  cancelado: "Cancelado",
};

function formatearFecha(fechaISO) {
  const fecha = new Date(fechaISO);
  return fecha.toLocaleString("es-MX", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function PlanCard({ plan, inscritosCount }) {
  const cupos = Array.from({ length: plan.cupo_maximo }, (_, i) => i < inscritosCount);

  return (
    <Link href={`/planes/${plan.id}`}>
      <div className="pin-card rounded-xl shadow-pin mb-4 overflow-hidden">
        <div className="p-5 relative">
          <div className="pin-dot" />
          {plan.foto_url && (
            <img
              src={plan.foto_url}
              alt={plan.actividad}
              className="w-full h-36 object-cover rounded-lg mb-3 -mt-1"
            />
          )}
          <div className="flex items-start justify-between gap-3">
            <h3 className="font-display text-xl leading-tight">{plan.actividad}</h3>
            <span
              className={`shrink-0 text-xs font-semibold text-paper px-2 py-0.5 rounded-full not-italic ${ESTADO_COLOR[plan.estado] || "bg-ink/20"}`}
            >
              {ESTADO_LABEL[plan.estado] || plan.estado}
            </span>
          </div>
          <p className="text-sm text-ink/70 mt-1 not-italic">
            {formatearFecha(plan.fecha)} · {plan.lugar}
            {plan.serie_id && (
              <span className="ml-2 text-xs bg-board px-2 py-0.5 rounded-full text-ink/60">🔁 Recurrente</span>
            )}
          </p>
          {plan.descripcion && <p className="text-sm text-ink/80 mt-2 not-italic">{plan.descripcion}</p>}
          <div className="mt-3 flex items-center gap-1">
            {cupos.map((ocupado, i) => (
              <span
                key={i}
                className={`cupo-dot ${ocupado ? "bg-clay" : "bg-ink/15"}`}
              />
            ))}
            <span className="text-xs text-ink/50 ml-2 not-italic">
              {inscritosCount}/{plan.cupo_maximo} cupos
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
