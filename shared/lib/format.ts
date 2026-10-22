export const formatScore = (n: number) => n.toLocaleString("es-ES");

export const formatRank = (n: number) => String(n).padStart(2, "0");
