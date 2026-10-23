export function integer(
  value: unknown,
  label: string,
  min = 0,
  max = 100000000,
) {
  if (
    !Number.isSafeInteger(value) ||
    Number(value) < min ||
    Number(value) > max
  )
    throw Error("Invalid " + label + ".");
  return Number(value);
}
export function text(
  value: unknown,
  label: string,
  max = 300,
  required = false,
) {
  if (
    typeof value !== "string" ||
    value.length > max ||
    (required && !value.trim())
  )
    throw Error("Invalid " + label + ".");
  return value.trim();
}
export function exportCsv(rows: Record<string, unknown>[]) {
  const keys = Object.keys(rows[0] || {});
  const cell = (v: unknown) => {
    let s = String(v ?? "");
    if (/^[=+@\-\t\r]/.test(s)) s = "'" + s;
    return '"' + s.replaceAll('"', '""') + '"';
  };
  return [
    keys.map(cell).join(","),
    ...rows.map((r) => keys.map((k) => cell(r[k])).join(",")),
  ].join("\r\n");
}
