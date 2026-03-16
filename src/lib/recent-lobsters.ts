export interface RememberedLobster {
  id: string;
  name: string;
  studentNumber: string;
  classroomId: string | null;
  lastSeenAt: string;
}

interface LegacyStoredEnrollment {
  student?: {
    id?: string;
    name?: string;
    student_number?: string;
  };
  classroomId?: string | null;
  savedAt?: string;
}

export const REMEMBERED_LOBSTERS_KEY = "claw-university:remembered-lobsters";
export const LEGACY_LAST_ENROLLMENT_KEY = "claw-university:last-enrollment";
const REMEMBERED_LOBSTERS_EVENT = "claw-university:remembered-lobsters:change";

const MAX_REMEMBERED_LOBSTERS = 8;

let _cachedSnapshot: RememberedLobster[] | null = null;
let _cachedRaw: string | null | undefined = undefined;

function isBrowser() {
  return typeof window !== "undefined";
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function normalizeRememberedLobster(value: unknown): RememberedLobster | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const candidate = value as Partial<RememberedLobster>;
  if (
    !isNonEmptyString(candidate.id) ||
    !isNonEmptyString(candidate.name) ||
    !isNonEmptyString(candidate.studentNumber)
  ) {
    return null;
  }

  return {
    id: candidate.id,
    name: candidate.name,
    studentNumber: candidate.studentNumber,
    classroomId: isNonEmptyString(candidate.classroomId) ? candidate.classroomId : null,
    lastSeenAt: isNonEmptyString(candidate.lastSeenAt)
      ? candidate.lastSeenAt
      : new Date().toISOString(),
  };
}

function normalizeLegacyEnrollment(value: unknown): RememberedLobster | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const candidate = value as LegacyStoredEnrollment;
  if (
    !isNonEmptyString(candidate.student?.id) ||
    !isNonEmptyString(candidate.student?.name) ||
    !isNonEmptyString(candidate.student?.student_number)
  ) {
    return null;
  }

  return {
    id: candidate.student.id,
    name: candidate.student.name,
    studentNumber: candidate.student.student_number,
    classroomId: isNonEmptyString(candidate.classroomId) ? candidate.classroomId : null,
    lastSeenAt: isNonEmptyString(candidate.savedAt)
      ? candidate.savedAt
      : new Date().toISOString(),
  };
}

function mergeRememberedLobsters(entries: RememberedLobster[]) {
  const rememberedById = new Map<string, RememberedLobster>();

  for (const entry of entries) {
    const existing = rememberedById.get(entry.id);

    if (!existing) {
      rememberedById.set(entry.id, entry);
      continue;
    }

    const existingTime = Date.parse(existing.lastSeenAt) || 0;
    const entryTime = Date.parse(entry.lastSeenAt) || 0;

    rememberedById.set(entry.id, {
      ...existing,
      ...entry,
      classroomId: entry.classroomId ?? existing.classroomId,
      lastSeenAt: entryTime >= existingTime ? entry.lastSeenAt : existing.lastSeenAt,
    });
  }

  return Array.from(rememberedById.values())
    .sort((left, right) => {
      const leftTime = Date.parse(left.lastSeenAt) || 0;
      const rightTime = Date.parse(right.lastSeenAt) || 0;
      return rightTime - leftTime;
    })
    .slice(0, MAX_REMEMBERED_LOBSTERS);
}

function persistRememberedLobsters(entries: RememberedLobster[]) {
  if (!isBrowser()) {
    return entries;
  }

  const json = JSON.stringify(entries);
  window.localStorage.setItem(REMEMBERED_LOBSTERS_KEY, json);
  _cachedRaw = json;
  _cachedSnapshot = entries;
  window.dispatchEvent(new Event(REMEMBERED_LOBSTERS_EVENT));
  return entries;
}

export function subscribeToRememberedLobsters(onStoreChange: () => void) {
  if (!isBrowser()) {
    return () => {};
  }

  const handleChange = () => {
    onStoreChange();
  };

  window.addEventListener("storage", handleChange);
  window.addEventListener("focus", handleChange);
  window.addEventListener(REMEMBERED_LOBSTERS_EVENT, handleChange);

  return () => {
    window.removeEventListener("storage", handleChange);
    window.removeEventListener("focus", handleChange);
    window.removeEventListener(REMEMBERED_LOBSTERS_EVENT, handleChange);
  };
}

const EMPTY_SNAPSHOT: RememberedLobster[] = [];

export function getRememberedLobsters(): RememberedLobster[] {
  if (!isBrowser()) {
    return EMPTY_SNAPSHOT;
  }

  const rawRemembered = window.localStorage.getItem(REMEMBERED_LOBSTERS_KEY);
  const rawLegacy = window.localStorage.getItem(LEGACY_LAST_ENROLLMENT_KEY);

  if (rawRemembered === _cachedRaw && !rawLegacy && _cachedSnapshot) {
    return _cachedSnapshot;
  }

  let needsPersistence = false;
  let remembered: RememberedLobster[] = [];

  if (rawRemembered) {
    try {
      const parsed = JSON.parse(rawRemembered) as unknown;
      if (Array.isArray(parsed)) {
        remembered = parsed
          .map((entry) => normalizeRememberedLobster(entry))
          .filter((entry): entry is RememberedLobster => entry !== null);
      } else {
        needsPersistence = true;
      }
    } catch {
      needsPersistence = true;
    }
  }

  if (rawLegacy) {
    try {
      const parsed = JSON.parse(rawLegacy) as unknown;
      const migrated = normalizeLegacyEnrollment(parsed);
      if (migrated) {
        remembered = mergeRememberedLobsters([migrated, ...remembered]);
        needsPersistence = true;
      }
    } catch {
      needsPersistence = true;
    }

    window.localStorage.removeItem(LEGACY_LAST_ENROLLMENT_KEY);
  }

  const normalized = mergeRememberedLobsters(remembered);
  if (needsPersistence || normalized.length !== remembered.length) {
    return persistRememberedLobsters(normalized);
  }

  _cachedRaw = rawRemembered;
  _cachedSnapshot = normalized;
  return normalized;
}

export function rememberLobster(
  entry: Omit<RememberedLobster, "lastSeenAt"> & { lastSeenAt?: string }
) {
  if (!isBrowser()) {
    return [] as RememberedLobster[];
  }

  const nextEntry = normalizeRememberedLobster({
    ...entry,
    lastSeenAt: entry.lastSeenAt ?? new Date().toISOString(),
  });

  if (!nextEntry) {
    return getRememberedLobsters();
  }

  return persistRememberedLobsters(
    mergeRememberedLobsters([nextEntry, ...getRememberedLobsters()])
  );
}

export function getLatestRememberedLobster() {
  return getRememberedLobsters()[0] ?? null;
}
