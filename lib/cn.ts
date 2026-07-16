// Join conditional class names — the tiny clsx we don't add a dep for.
export const cn = (...c: (string | false | null | undefined)[]) =>
  c.filter(Boolean).join(" ");
