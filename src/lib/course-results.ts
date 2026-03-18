import type {
  CapabilityGrant,
  FirstDeliverable,
  FirstDeliverableTemplate,
  SkillAction,
} from "@/types";

const VALID_CAPABILITY_TYPES = new Set<CapabilityGrant["type"]>([
  "skill",
  "memory",
  "config",
  "soul",
]);

const VALID_CAPABILITY_STATUSES = new Set<CapabilityGrant["status"]>([
  "granted",
  "failed",
]);

const VALID_DELIVERABLE_STATUSES = new Set<FirstDeliverable["status"]>([
  "pending",
  "submitted",
]);

const VALID_ARTIFACT_TYPES = new Set<FirstDeliverable["artifact_type"]>([
  "image",
  "text",
  "workflow",
  "report",
]);

function safeParseJson(value: string) {
  try {
    return JSON.parse(value) as unknown;
  } catch {
    return null;
  }
}

function isCapabilityGrant(value: unknown): value is CapabilityGrant {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<CapabilityGrant>;

  return (
    typeof candidate.type === "string" &&
    VALID_CAPABILITY_TYPES.has(candidate.type as CapabilityGrant["type"]) &&
    typeof candidate.name === "string" &&
    typeof candidate.reason === "string" &&
    typeof candidate.status === "string" &&
    VALID_CAPABILITY_STATUSES.has(candidate.status as CapabilityGrant["status"])
  );
}

function isFirstDeliverable(value: unknown): value is FirstDeliverable {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<FirstDeliverable>;

  return (
    typeof candidate.title === "string" &&
    typeof candidate.description === "string" &&
    typeof candidate.artifact_type === "string" &&
    VALID_ARTIFACT_TYPES.has(candidate.artifact_type as FirstDeliverable["artifact_type"]) &&
    typeof candidate.status === "string" &&
    VALID_DELIVERABLE_STATUSES.has(candidate.status as FirstDeliverable["status"]) &&
    Array.isArray(candidate.required_fields)
  );
}

export function normalizeCapabilityGrants(value: unknown): CapabilityGrant[] | null {
  if (value == null) {
    return null;
  }

  if (Array.isArray(value)) {
    const normalized = value.filter(isCapabilityGrant);
    return normalized.length > 0 ? normalized : null;
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed || trimmed === "null") {
      return null;
    }

    return normalizeCapabilityGrants(safeParseJson(trimmed));
  }

  return null;
}

export function normalizeFirstDeliverable(value: unknown): FirstDeliverable | null {
  if (value == null) {
    return null;
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed || trimmed === "null") {
      return null;
    }

    return normalizeFirstDeliverable(safeParseJson(trimmed));
  }

  if (!isFirstDeliverable(value)) {
    return null;
  }

  return {
    ...value,
    owner_summary_hint: value.owner_summary_hint || null,
    artifact_url: value.artifact_url || null,
    prompt: value.prompt || null,
    reflection: value.reflection || null,
    submitted_at: value.submitted_at || null,
  };
}

export function buildPendingFirstDeliverable(
  template: FirstDeliverableTemplate
): FirstDeliverable {
  return {
    title: template.title,
    description: template.description,
    artifact_type: template.artifact_type,
    required_fields: template.required_fields,
    owner_summary_hint: template.owner_summary_hint || null,
    status: "pending",
    artifact_url: null,
    prompt: null,
    reflection: null,
    submitted_at: null,
  };
}

export function submitFirstDeliverable(
  current: FirstDeliverable,
  submission: {
    artifact_url: string;
    prompt: string;
    reflection: string;
  }
): FirstDeliverable {
  return {
    ...current,
    status: "submitted",
    artifact_url: submission.artifact_url,
    prompt: submission.prompt,
    reflection: submission.reflection,
    submitted_at: new Date().toISOString(),
  };
}

export function skillActionsToCapabilityGrants(
  actions: SkillAction[],
  options: { status?: CapabilityGrant["status"]; failureReason?: string | null } = {}
): CapabilityGrant[] {
  const status = options.status || "granted";

  return actions.map((action) => ({
    type: action.type === "install_skill" ? "skill" : "config",
    name: action.name,
    reason: action.reason,
    source: action.source,
    status,
    granted_at: status === "granted" ? new Date().toISOString() : null,
    failure_reason: status === "failed" ? options.failureReason || "未说明失败原因" : null,
  }));
}
