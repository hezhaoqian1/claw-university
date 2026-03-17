import type { SkillAction } from "@/types";

const VALID_SKILL_ACTION_TYPES = new Set<SkillAction["type"]>([
  "install_skill",
  "add_config",
]);

function isSkillAction(value: unknown): value is SkillAction {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<SkillAction>;

  return (
    typeof candidate.type === "string" &&
    VALID_SKILL_ACTION_TYPES.has(candidate.type as SkillAction["type"]) &&
    typeof candidate.name === "string" &&
    typeof candidate.reason === "string"
  );
}

export function normalizeSkillActions(value: unknown): SkillAction[] | null {
  if (value == null) {
    return null;
  }

  if (Array.isArray(value)) {
    const normalized = value.filter(isSkillAction);
    return normalized.length > 0 ? normalized : null;
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed || trimmed === "null") {
      return null;
    }

    try {
      return normalizeSkillActions(JSON.parse(trimmed));
    } catch {
      return null;
    }
  }

  return null;
}
