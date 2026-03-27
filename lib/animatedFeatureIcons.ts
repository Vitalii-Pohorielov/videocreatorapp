export type AnimatedFeatureIcon = {
  id: string;
  category: string;
  label: string;
  fallbackEmoji: string;
  imageUrl: string;
};

function buildAnimatedIconUrl(name: string) {
  return `https://firebasestorage.googleapis.com/v0/b/animatedicons-d158d.appspot.com/o/minimalistic%2F${encodeURIComponent(name)}.json?alt=media`;
}

export const animatedFeatureIcons: AnimatedFeatureIcon[] = [
  { id: "open-door", category: "Accessibility", label: "Open Door", fallbackEmoji: "🚪", imageUrl: buildAnimatedIconUrl("Open Door") },
  { id: "register", category: "Account Management", label: "Register", fallbackEmoji: "👤", imageUrl: buildAnimatedIconUrl("Register") },
  { id: "clp", category: "Account Management", label: "CLP", fallbackEmoji: "📋", imageUrl: buildAnimatedIconUrl("CLP") },
  { id: "submitted-1", category: "Actions", label: "Submited", fallbackEmoji: "✅", imageUrl: buildAnimatedIconUrl("Submited") },
  { id: "restart", category: "Actions", label: "Restart", fallbackEmoji: "🔄", imageUrl: buildAnimatedIconUrl("Restart") },
  { id: "activate", category: "Actions", label: "Activate", fallbackEmoji: "⚡", imageUrl: buildAnimatedIconUrl("Activate") },
  { id: "choose", category: "Actions", label: "Choose", fallbackEmoji: "👉", imageUrl: buildAnimatedIconUrl("Choose") },
  { id: "reset", category: "Actions", label: "Reset", fallbackEmoji: "↩️", imageUrl: buildAnimatedIconUrl("Reset") },
  { id: "remove-filter", category: "Actions", label: "Remove Filter", fallbackEmoji: "🧹", imageUrl: buildAnimatedIconUrl("Remove Filter") },
  { id: "submitted-2", category: "Actions", label: "Submitted", fallbackEmoji: "✅", imageUrl: buildAnimatedIconUrl("Submitted") },
  { id: "edit-v2", category: "Actions", label: "Edit V2", fallbackEmoji: "✏️", imageUrl: buildAnimatedIconUrl("Edit V2") },
  { id: "form-deleted", category: "Administration", label: "Form Deleted", fallbackEmoji: "🗑️", imageUrl: buildAnimatedIconUrl("Form Deleted") },
  { id: "setup", category: "Administration", label: "Setup", fallbackEmoji: "⚙️", imageUrl: buildAnimatedIconUrl("Setup") },
  { id: "audience-reach", category: "Advertising", label: "Audience Reach", fallbackEmoji: "📣", imageUrl: buildAnimatedIconUrl("Audience Reach") },
  { id: "grab-attention", category: "Advertising", label: "Grab Attention", fallbackEmoji: "👀", imageUrl: buildAnimatedIconUrl("Grab Attention") },
  { id: "iq", category: "Analytics", label: "Iq", fallbackEmoji: "🧠", imageUrl: buildAnimatedIconUrl("Iq") },
  { id: "report-v2", category: "Analytics", label: "Report V2", fallbackEmoji: "📈", imageUrl: buildAnimatedIconUrl("Report V2") },
  { id: "analytics", category: "Analytics", label: "analytics", fallbackEmoji: "📊", imageUrl: buildAnimatedIconUrl("analytics") },
  { id: "data-usage", category: "Analytics", label: "Data Usage", fallbackEmoji: "📉", imageUrl: buildAnimatedIconUrl("Data Usage") },
  { id: "sas", category: "Analytics", label: "SAS", fallbackEmoji: "🧮", imageUrl: buildAnimatedIconUrl("SAS") },
];

export const animatedFeatureIconGroups = [...new Set(animatedFeatureIcons.map((icon) => icon.category))];

export const animatedFeatureIconGroupLabels = animatedFeatureIconGroups.reduce(
  (acc, group) => {
    acc[group] = group;
    return acc;
  },
  {} as Record<string, string>,
);

export function getFeatureAnimatedIcons(count: number) {
  return Array.from({ length: count }, (_, index) => animatedFeatureIcons[index % animatedFeatureIcons.length]);
}
