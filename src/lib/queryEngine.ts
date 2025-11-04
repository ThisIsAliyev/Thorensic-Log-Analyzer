export type Row = Record<string, any>;

// Mini language: status:404  verb:POST  path:/login  latency_ms:>500  a:b AND c:d  ... supports OR
export function runQuery(rows: Row[], expr: string): Row[] {
  if (!expr?.trim()) return rows;

  const parts = expr.split(/\s+(AND|OR)\s+/i);
  const evalTok = (r: Row, tok: string) => {
    const m = tok.match(/^([\w.@]+)\s*:\s*(.+)$/);
    if (!m) return true;
    const [, field, raw] = m;
    const val = field.split(".").reduce((a: any, k) => a?.[k], r);
    const gt = raw.match(/^>(\d+)$/);
    const lt = raw.match(/^<(\d+)$/);
    if (gt) return Number(val) > +gt[1];
    if (lt) return Number(val) < +lt[1];
    return String(val ?? "").toLowerCase().includes(raw.toLowerCase());
  };

  return rows.filter((r) => {
    let ok = evalTok(r, parts[0]);
    for (let i = 1; i < parts.length; i += 2) {
      const op = parts[i].toUpperCase();
      const tok = parts[i + 1];
      const res = evalTok(r, tok);
      ok = op === "AND" ? ok && res : ok || res;
    }
    return ok;
  });
}

