export default function Estrellas({ promedio, total, size = "text-sm" }) {
  if (!total) {
    return <span className={`text-ink/40 not-italic ${size}`}>Sin calificaciones aún</span>;
  }

  const llenas = Math.round(promedio);

  return (
    <span className={`not-italic ${size}`}>
      <span className="text-mustard">{"★".repeat(llenas)}</span>
      <span className="text-ink/20">{"★".repeat(5 - llenas)}</span>
      <span className="text-ink/50 ml-1">
        {promedio.toFixed(1)} ({total})
      </span>
    </span>
  );
}
