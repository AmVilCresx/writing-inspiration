//  统一配色方案——所有标签、药丸颜色取自此一处

export const TAG_COLORS = [
  { bg: "rgba(220,235,250,0.6)", fg: "#3a6fa0" },
  { bg: "rgba(250,225,220,0.6)", fg: "#a05a3a" },
  { bg: "rgba(230,245,225,0.6)", fg: "#4a8a3a" },
  { bg: "rgba(245,230,250,0.6)", fg: "#8a4a9a" },
  { bg: "rgba(250,240,210,0.6)", fg: "#9a7a2a" },
  { bg: "rgba(220,245,240,0.6)", fg: "#3a8a7a" },
  { bg: "rgba(250,220,240,0.6)", fg: "#a03a8a" },
  { bg: "rgba(235,230,250,0.6)", fg: "#6a4aaa" },
];

export function getTagColor(tagId: number) {
  return TAG_COLORS[tagId % TAG_COLORS.length];
}
