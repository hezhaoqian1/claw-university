import { createHash, randomBytes } from "crypto";
import type { NextRequest } from "next/server";
import sql from "@/lib/db";
import { ensureClassroomDataModel } from "@/lib/classroom/ownership";

let partnerSchemaReady: Promise<void> | null = null;

export interface AuthenticatedPartner {
  partnerId: string;
  partnerName: string;
  partnerSlug: string;
  apiKeyId: string;
}

export async function ensurePartnerDataModel(): Promise<void> {
  if (!partnerSchemaReady) {
    partnerSchemaReady = (async () => {
      await ensureClassroomDataModel();

      await sql`
        CREATE TABLE IF NOT EXISTS partners (
          id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
          name text NOT NULL,
          slug text NOT NULL UNIQUE,
          status text NOT NULL DEFAULT 'active',
          webhook_url text,
          created_at timestamptz DEFAULT now() NOT NULL,
          CHECK (status IN ('active', 'disabled'))
        )
      `;

      await sql`
        CREATE TABLE IF NOT EXISTS partner_api_keys (
          id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
          partner_id uuid REFERENCES partners(id) NOT NULL,
          key_prefix text NOT NULL,
          key_hash text NOT NULL UNIQUE,
          label text,
          status text NOT NULL DEFAULT 'active',
          last_used_at timestamptz,
          created_at timestamptz DEFAULT now() NOT NULL,
          CHECK (status IN ('active', 'revoked'))
        )
      `;

      await sql`
        CREATE INDEX IF NOT EXISTS idx_partner_api_keys_partner
        ON partner_api_keys(partner_id, created_at DESC)
      `;

      await sql`
        CREATE TABLE IF NOT EXISTS partner_students (
          id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
          partner_id uuid REFERENCES partners(id) NOT NULL,
          student_id uuid REFERENCES students(id) NOT NULL,
          external_student_id text NOT NULL,
          external_user_id text,
          created_at timestamptz DEFAULT now() NOT NULL,
          UNIQUE (partner_id, external_student_id),
          UNIQUE (partner_id, student_id)
        )
      `;

      await sql`
        CREATE INDEX IF NOT EXISTS idx_partner_students_partner
        ON partner_students(partner_id, created_at DESC)
      `;

      await sql`
        CREATE INDEX IF NOT EXISTS idx_partner_students_student
        ON partner_students(student_id, created_at DESC)
      `;

      await sql`
        CREATE TABLE IF NOT EXISTS partner_events (
          id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
          partner_id uuid REFERENCES partners(id) NOT NULL,
          partner_student_id uuid REFERENCES partner_students(id),
          student_id uuid REFERENCES students(id),
          classroom_id uuid REFERENCES classrooms(id),
          event_type text NOT NULL,
          payload jsonb NOT NULL DEFAULT '{}'::jsonb,
          created_at timestamptz DEFAULT now() NOT NULL
        )
      `;

      await sql`
        CREATE INDEX IF NOT EXISTS idx_partner_events_partner_time
        ON partner_events(partner_id, created_at DESC)
      `;

      await sql`
        CREATE INDEX IF NOT EXISTS idx_partner_events_student_time
        ON partner_events(student_id, created_at DESC)
      `;
    })().catch((error) => {
      partnerSchemaReady = null;
      throw error;
    });
  }

  await partnerSchemaReady;
}

function normalizePartnerSlug(input: string) {
  const slug = input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  if (!slug) {
    throw new Error("Invalid partner slug");
  }

  return slug;
}

function hashPartnerApiKey(apiKey: string) {
  return createHash("sha256").update(apiKey).digest("hex");
}

function generatePartnerApiKey() {
  const secret = randomBytes(24).toString("hex");
  return `cu_partner_${secret}`;
}

export async function createPartnerWithApiKey(params: {
  name: string;
  slug?: string;
  webhookUrl?: string | null;
  keyLabel?: string | null;
}) {
  await ensurePartnerDataModel();

  const slug = normalizePartnerSlug(params.slug || params.name);
  const existing = await sql`
    SELECT id
    FROM partners
    WHERE slug = ${slug}
    LIMIT 1
  `;

  if (existing.length > 0) {
    throw new Error("Partner slug already exists");
  }

  const [partner] = await sql`
    INSERT INTO partners (name, slug, webhook_url)
    VALUES (${params.name}, ${slug}, ${params.webhookUrl || null})
    RETURNING id, name, slug, webhook_url, created_at
  `;

  const apiKey = generatePartnerApiKey();
  const keyHash = hashPartnerApiKey(apiKey);
  const keyPrefix = apiKey.slice(0, 18);

  const [key] = await sql`
    INSERT INTO partner_api_keys (
      partner_id,
      key_prefix,
      key_hash,
      label
    )
    VALUES (
      ${partner.id},
      ${keyPrefix},
      ${keyHash},
      ${params.keyLabel || "bootstrap"}
    )
    RETURNING id, key_prefix, created_at
  `;

  return {
    partner: {
      id: partner.id as string,
      name: partner.name as string,
      slug: partner.slug as string,
      webhook_url: (partner.webhook_url as string | null) || null,
      created_at: partner.created_at as string,
    },
    apiKey: {
      id: key.id as string,
      key: apiKey,
      key_prefix: key.key_prefix as string,
      created_at: key.created_at as string,
    },
  };
}

export async function authenticatePartnerRequest(
  req: NextRequest
): Promise<AuthenticatedPartner | null> {
  await ensurePartnerDataModel();

  const authorization = req.headers.get("authorization");
  const bearerToken =
    authorization && authorization.startsWith("Bearer ")
      ? authorization.slice("Bearer ".length).trim()
      : null;
  const apiKey = bearerToken || req.headers.get("x-claw-partner-key");

  if (!apiKey) {
    return null;
  }

  const keyHash = hashPartnerApiKey(apiKey);
  const rows = await sql`
    SELECT
      p.id AS partner_id,
      p.name AS partner_name,
      p.slug AS partner_slug,
      pak.id AS api_key_id
    FROM partner_api_keys pak
    JOIN partners p ON p.id = pak.partner_id
    WHERE pak.key_hash = ${keyHash}
      AND pak.status = 'active'
      AND p.status = 'active'
    LIMIT 1
  `;

  if (rows.length === 0) {
    return null;
  }

  const row = rows[0];
  await sql`
    UPDATE partner_api_keys
    SET last_used_at = now()
    WHERE id = ${row.api_key_id}
  `;

  return {
    partnerId: row.partner_id as string,
    partnerName: row.partner_name as string,
    partnerSlug: row.partner_slug as string,
    apiKeyId: row.api_key_id as string,
  };
}

export async function findPartnerStudentById(partnerId: string, partnerStudentId: string) {
  await ensurePartnerDataModel();

  const rows = await sql`
    SELECT
      ps.id,
      ps.partner_id,
      ps.student_id,
      ps.external_student_id,
      ps.external_user_id,
      ps.created_at,
      s.name AS student_name,
      s.student_number,
      s.enrollment_token,
      s.source,
      s.created_at AS student_created_at
    FROM partner_students ps
    JOIN students s ON s.id = ps.student_id
    WHERE ps.partner_id = ${partnerId}
      AND ps.id = ${partnerStudentId}
    LIMIT 1
  `;

  return rows[0] || null;
}

export async function findPartnerStudentByExternalId(
  partnerId: string,
  externalStudentId: string
) {
  await ensurePartnerDataModel();

  const rows = await sql`
    SELECT
      ps.id,
      ps.partner_id,
      ps.student_id,
      ps.external_student_id,
      ps.external_user_id,
      ps.created_at,
      s.name AS student_name,
      s.student_number,
      s.enrollment_token,
      s.source,
      s.created_at AS student_created_at
    FROM partner_students ps
    JOIN students s ON s.id = ps.student_id
    WHERE ps.partner_id = ${partnerId}
      AND ps.external_student_id = ${externalStudentId}
    LIMIT 1
  `;

  return rows[0] || null;
}

export async function createPartnerStudentMapping(params: {
  partnerId: string;
  studentId: string;
  externalStudentId: string;
  externalUserId?: string | null;
}) {
  await ensurePartnerDataModel();

  const [mapping] = await sql`
    INSERT INTO partner_students (
      partner_id,
      student_id,
      external_student_id,
      external_user_id
    )
    VALUES (
      ${params.partnerId},
      ${params.studentId},
      ${params.externalStudentId},
      ${params.externalUserId || null}
    )
    RETURNING id, created_at
  `;

  return {
    id: mapping.id as string,
    created_at: mapping.created_at as string,
  };
}

export async function appendPartnerEvent(params: {
  partnerId: string;
  partnerStudentId?: string | null;
  studentId?: string | null;
  classroomId?: string | null;
  eventType: string;
  payload?: Record<string, unknown>;
}) {
  await ensurePartnerDataModel();

  await sql`
    INSERT INTO partner_events (
      partner_id,
      partner_student_id,
      student_id,
      classroom_id,
      event_type,
      payload
    )
    VALUES (
      ${params.partnerId},
      ${params.partnerStudentId || null},
      ${params.studentId || null},
      ${params.classroomId || null},
      ${params.eventType},
      ${JSON.stringify(params.payload || {})}::jsonb
    )
  `;
}

export async function appendPartnerEventsForStudent(params: {
  studentId: string;
  classroomId?: string | null;
  eventType: string;
  payload?: Record<string, unknown>;
}) {
  await ensurePartnerDataModel();

  const mappings = await sql`
    SELECT id, partner_id
    FROM partner_students
    WHERE student_id = ${params.studentId}
  `;

  for (const mapping of mappings) {
    await appendPartnerEvent({
      partnerId: mapping.partner_id as string,
      partnerStudentId: mapping.id as string,
      studentId: params.studentId,
      classroomId: params.classroomId || null,
      eventType: params.eventType,
      payload: params.payload,
    });
  }
}

export async function resolvePartnerClassroomAccess(params: {
  partnerId: string;
  classroomId: string;
  partnerStudentId?: string | null;
}): Promise<
  | {
      partnerStudentId: string;
      studentId: string;
      ambiguous: false;
    }
  | {
      ambiguous: true;
    }
  | null
> {
  await ensurePartnerDataModel();

  const rows =
    params.partnerStudentId
      ? await sql`
          SELECT ps.id AS partner_student_id, ps.student_id
          FROM partner_students ps
          JOIN classroom_enrollments ce ON ce.student_id = ps.student_id
          WHERE ps.partner_id = ${params.partnerId}
            AND ps.id = ${params.partnerStudentId}
            AND ce.classroom_id = ${params.classroomId}
          LIMIT 1
        `
      : await sql`
          SELECT ps.id AS partner_student_id, ps.student_id
          FROM partner_students ps
          JOIN classroom_enrollments ce ON ce.student_id = ps.student_id
          WHERE ps.partner_id = ${params.partnerId}
            AND ce.classroom_id = ${params.classroomId}
          LIMIT 2
        `;

  if (rows.length === 0) {
    return null;
  }

  if (!params.partnerStudentId && rows.length > 1) {
    return { ambiguous: true };
  }

  return {
    partnerStudentId: rows[0].partner_student_id as string,
    studentId: rows[0].student_id as string,
    ambiguous: false,
  };
}
