const BRAND_COLOR_VARS = ["--accent", "--brand-orange", "--brand-maroon", "--success"];
const PARTICLE_COUNT = 46;
const BURST_MS = 1100;

// A short, one-off confetti burst in the app's brand colors, used to
// celebrate marking a task done. Pulls its palette from the live CSS
// custom properties so it automatically matches the current theme.
export function fireConfetti(originX?: number, originY?: number) {
  if (typeof window === "undefined") return;

  const x = originX ?? window.innerWidth / 2;
  const y = originY ?? window.innerHeight / 3;

  const rootStyle = getComputedStyle(document.documentElement);
  const colors = BRAND_COLOR_VARS.map((v) => rootStyle.getPropertyValue(v).trim()).filter(Boolean);
  if (colors.length === 0) colors.push("#2563eb");

  const container = document.createElement("div");
  container.setAttribute("aria-hidden", "true");
  container.style.cssText = "position:fixed;inset:0;pointer-events:none;z-index:200;overflow:hidden;";
  document.body.appendChild(container);

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const angle = Math.random() * Math.PI * 2;
    const distance = 70 + Math.random() * 150;
    const dx = Math.cos(angle) * distance;
    const dy = Math.sin(angle) * distance - 70;
    const rotate = Math.random() * 360;
    const width = 5 + Math.random() * 5;
    const height = width * 0.4;
    const color = colors[i % colors.length];
    const delay = Math.random() * 90;

    const particle = document.createElement("span");
    particle.style.cssText = [
      "position:absolute",
      `left:${x}px`,
      `top:${y}px`,
      `width:${width}px`,
      `height:${height}px`,
      `background:${color}`,
      "border-radius:2px",
      "opacity:1",
      "transform:translate(-50%,-50%)",
      `animation: confetti-burst ${BURST_MS}ms ease-out ${delay}ms forwards`,
      `--confetti-dx:${dx}px`,
      `--confetti-dy:${dy}px`,
      `--confetti-rot:${rotate}deg`,
    ].join(";");
    container.appendChild(particle);
  }

  window.setTimeout(() => container.remove(), BURST_MS + 200);
}
