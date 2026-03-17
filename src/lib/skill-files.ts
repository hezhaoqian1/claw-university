import { existsSync, readFileSync } from "fs";
import { join } from "path";

const SKILL_PATH = join(process.cwd(), "skill", "SKILL.md");
const HEARTBEAT_PATH = join(process.cwd(), "skill", "HEARTBEAT.md");
const GENERIC_ENROLLMENT_TOKEN = "YOUR_CLAW_UNI_TOKEN";

function readRequiredFile(path: string) {
  return readFileSync(path, "utf-8");
}

function extractFrontmatterValue(content: string, key: string) {
  const match = content.match(
    new RegExp(`^${key}:\\s*["']?([^"'\n]+)["']?\\s*$`, "m")
  );
  return match?.[1]?.trim() ?? null;
}

export const SKILL_CONTENT = readRequiredFile(SKILL_PATH);
export const HEARTBEAT_CONTENT = existsSync(HEARTBEAT_PATH)
  ? readRequiredFile(HEARTBEAT_PATH)
  : null;
export const SKILL_VERSION = extractFrontmatterValue(SKILL_CONTENT, "version") ?? "0.0.0";
export const DEFAULT_ENROLLMENT_TOKEN = GENERIC_ENROLLMENT_TOKEN;
