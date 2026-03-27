export type AnimatedEmojiOption = {
  id: string;
  label: string;
  emoji: string;
  imageUrl: string;
  group: "developer" | "product" | "infra" | "status";
};

export const animatedEmojiLibrary: AnimatedEmojiOption[] = [
  { id: "technologist", label: "Technologist", emoji: "👨‍💻", imageUrl: "/animated-emoji/technologist.png", group: "developer" },
  { id: "woman-technologist", label: "Woman Dev", emoji: "👩‍💻", imageUrl: "/animated-emoji/woman-technologist.png", group: "developer" },
  { id: "laptop", label: "Laptop", emoji: "💻", imageUrl: "/animated-emoji/laptop.png", group: "developer" },
  { id: "desktop-computer", label: "Desktop", emoji: "🖥️", imageUrl: "/animated-emoji/desktop-computer.png", group: "developer" },
  { id: "keyboard", label: "Keyboard", emoji: "⌨️", imageUrl: "/animated-emoji/keyboard.png", group: "developer" },
  { id: "scientist", label: "Scientist", emoji: "🧑‍🔬", imageUrl: "/animated-emoji/scientist.png", group: "developer" },
  { id: "robot", label: "Robot", emoji: "🤖", imageUrl: "/animated-emoji/robot.svg", group: "developer" },
  { id: "brain", label: "Brain", emoji: "🧠", imageUrl: "/animated-emoji/brain.svg", group: "developer" },
  { id: "chart-increasing", label: "Growth", emoji: "📈", imageUrl: "/animated-emoji/chart-increasing.png", group: "product" },
  { id: "clipboard", label: "Specs", emoji: "📋", imageUrl: "/animated-emoji/clipboard.png", group: "product" },
  { id: "file-folder", label: "Docs", emoji: "📁", imageUrl: "/animated-emoji/file-folder.png", group: "product" },
  { id: "star-struck", label: "Delight", emoji: "🤩", imageUrl: "/animated-emoji/star-struck.png", group: "product" },
  { id: "globe", label: "Global", emoji: "🌍", imageUrl: "/animated-emoji/globe.png", group: "product" },
  { id: "sparkles", label: "Sparkles", emoji: "✨", imageUrl: "/animated-emoji/sparkles.svg", group: "product" },
  { id: "target", label: "Target", emoji: "🎯", imageUrl: "/animated-emoji/target.svg", group: "product" },
  { id: "money-bag", label: "Revenue", emoji: "💰", imageUrl: "/animated-emoji/money-bag.svg", group: "product" },
  { id: "rocket", label: "Deploy", emoji: "🚀", imageUrl: "/animated-emoji/rocket.png", group: "infra" },
  { id: "gear", label: "Config", emoji: "⚙️", imageUrl: "/animated-emoji/gear.png", group: "infra" },
  { id: "toolbox", label: "Tooling", emoji: "🧰", imageUrl: "/animated-emoji/toolbox.png", group: "infra" },
  { id: "link", label: "API", emoji: "🔗", imageUrl: "/animated-emoji/link.png", group: "infra" },
  { id: "satellite-antenna", label: "Infra", emoji: "📡", imageUrl: "/animated-emoji/satellite-antenna.png", group: "infra" },
  { id: "nut-bolt", label: "Build", emoji: "🔩", imageUrl: "/animated-emoji/nut-bolt.png", group: "infra" },
  { id: "printer", label: "Output", emoji: "🖨️", imageUrl: "/animated-emoji/printer.png", group: "infra" },
  { id: "magnet", label: "Magnet", emoji: "🧲", imageUrl: "/animated-emoji/magnet.svg", group: "infra" },
  { id: "search", label: "Search", emoji: "🔎", imageUrl: "/animated-emoji/search.png", group: "status" },
  { id: "warning", label: "Warning", emoji: "⚠️", imageUrl: "/animated-emoji/warning.png", group: "status" },
  { id: "check-mark-button", label: "Success", emoji: "✅", imageUrl: "/animated-emoji/check-mark-button.png", group: "status" },
  { id: "locked", label: "Locked", emoji: "🔒", imageUrl: "/animated-emoji/locked.png", group: "status" },
  { id: "unlocked", label: "Unlocked", emoji: "🔓", imageUrl: "/animated-emoji/unlocked.png", group: "status" },
  { id: "test-tube", label: "Experiment", emoji: "🧪", imageUrl: "/animated-emoji/test-tube.png", group: "status" },
  { id: "shield", label: "Shield", emoji: "🛡️", imageUrl: "/animated-emoji/shield.svg", group: "status" },
  { id: "megaphone", label: "Megaphone", emoji: "📣", imageUrl: "/animated-emoji/megaphone.svg", group: "status" },
];

export const animatedEmojiGroupLabels: Record<AnimatedEmojiOption["group"], string> = {
  developer: "Developer",
  product: "Product",
  infra: "Infra",
  status: "Status",
};

const featureGridDefaultIconIds = [
  "sparkles",
  "robot",
  "brain",
  "shield",
  "target",
  "money-bag",
  "magnet",
  "megaphone",
] as const;

const animatedEmojiById = new Map(animatedEmojiLibrary.map((item) => [item.id, item]));

export function getDefaultAnimatedFeatureIcons(count: number) {
  return Array.from({ length: count }, (_, index) => {
    const iconId = featureGridDefaultIconIds[index % featureGridDefaultIconIds.length];
    return animatedEmojiById.get(iconId) ?? animatedEmojiLibrary[index % animatedEmojiLibrary.length];
  });
}
