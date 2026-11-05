type LoadStateProps = { message?: string; onRetry?: () => void };

export function LoadError({ message, onRetry }: LoadStateProps) {
  return <div role="alert" className="mx-5 my-4 rounded-[16px] bg-danger-soft text-danger px-4 py-3 text-[13px] font-semibold">
    <p>{message || "Não foi possível carregar os dados."}</p>
    {onRetry && <button type="button" onClick={onRetry} className="mt-2 underline underline-offset-2 font-extrabold">Tentar novamente</button>}
  </div>;
}

export function LoadingMessage({ message = "Carregando…" }: LoadStateProps) {
  return <p role="status" className="mx-5 py-5 text-center text-[13px] text-inksoft font-semibold">{message}</p>;
}

export function EmptyMessage({ message }: LoadStateProps) {
  return <p role="status" className="rounded-[16px] bg-white px-4 py-5 text-center text-[13px] text-inksoft font-semibold">{message}</p>;
}
