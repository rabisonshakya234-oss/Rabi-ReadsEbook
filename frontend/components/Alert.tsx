export default function Alert({ error, ok }: { error?: any; ok?: string }) {
  if (!error && !ok) return null;
  if (ok) return <div className="alert alert-success" role="status">{ok}</div>;
  return (
    <div className="alert alert-danger" role="alert">
      {error.message || String(error)}
      {Array.isArray(error.errors) && <ul className="mb-0 mt-1">{error.errors.map((x, i) => <li key={i}>{x.message}</li>)}</ul>}
    </div>
  );
}
