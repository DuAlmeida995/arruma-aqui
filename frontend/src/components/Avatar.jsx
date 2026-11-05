import { initials, avatarGradient } from "./avatar.js";

export default function Avatar({ id, name, size = 56, radius = 18, className = "", ring = false }) {
  return (
    <div
      className={`flex-none flex items-center justify-center font-display font-bold text-white ${
        ring ? "ring-4 ring-white" : ""
      } ${className}`}
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        background: avatarGradient(id),
        fontSize: Math.round(size * 0.36),
      }}
    >
      {initials(name)}
    </div>
  );
}
