export const palette = ["#F0854C", "#2E8B57", "#2E8B8B", "#7A4FBF", "#C15E2A", "#B8563F"];

export function initials(name) {
  return name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("");
}

export function avatarColor(id) {
  return palette[id % palette.length];
}
