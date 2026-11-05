export const gradients = [
  ["#FF8A5B", "#E04E22"],
  ["#34C08A", "#1F8F5E"],
  ["#2BB3A6", "#0B6D63"],
  ["#9B7BEA", "#6A47C7"],
  ["#F6B347", "#D9822B"],
  ["#5B8DEF", "#3360C9"],
  ["#F27BA8", "#C93F7C"],
  ["#4A5163", "#14171F"],
];

export function initials(name) {
  return name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("");
}

export function avatarGradient(id) {
  const [a, b] = gradients[Number(id) % gradients.length];
  return `linear-gradient(140deg, ${a}, ${b})`;
}
