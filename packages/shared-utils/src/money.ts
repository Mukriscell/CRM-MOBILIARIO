/** Formato de moneda chilena para la UI (CLP y UF). */
export function formatCLP(amount: number): string {
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatUF(amount: number): string {
  return `${new Intl.NumberFormat("es-CL", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 2,
  }).format(amount)} UF`;
}

export function formatMoney(amount: number, currency: "UF" | "CLP"): string {
  return currency === "UF" ? formatUF(amount) : formatCLP(amount);
}
