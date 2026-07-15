// Small coloured pill used for category / priority / status.

export function Badge({ kind, value }: { kind: string; value: string }) {
  return <span className={`badge badge-${kind}-${value}`}>{value.replace(/_/g, " ")}</span>;
}
