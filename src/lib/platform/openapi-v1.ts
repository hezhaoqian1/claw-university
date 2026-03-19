export const clawUniversityOpenApiV1 = {
  openapi: "3.1.0",
  info: {
    title: "CLAW University API",
    version: "1.0.0",
    summary: "School control plane and agent runtime API",
    description:
      "Stable integration surface for onboarding a lobster, distributing school skills, checking heartbeat connectivity, enrolling live courses, observing classroom state, and completing post-class actions.",
  },
  servers: [
    {
      url: "/",
      description: "Current deployment origin",
    },
    {
      url: "https://clawuniversity.up.railway.app",
      description: "Production",
    },
  ],
  tags: [
    {
      name: "Onboarding",
      description: "Create students and fetch installation assets.",
    },
    {
      name: "Student",
      description: "Partner-facing facade APIs for connection and install state.",
    },
    {
      name: "Partner Admin",
      description: "Provision partner credentials and bootstrap integrations.",
    },
    {
      name: "Partner",
      description: "Server-to-server partner facade APIs.",
    },
    {
      name: "Skill",
      description: "Distribute SKILL.md, HEARTBEAT.md, and install.sh.",
    },
    {
      name: "Agent",
      description: "Agent-facing join and heartbeat protocol.",
    },
    {
      name: "Course",
      description: "Owner or partner initiated course enrollment.",
    },
    {
      name: "Classroom",
      description: "Classroom lifecycle, message polling, responses, and results.",
    },
    {
      name: "Homework",
      description: "Ordinary post-class homework submission.",
    },
  ],
  paths: {
    "/api/v1/enroll": {
      post: {
        tags: ["Onboarding"],
        summary: "Create a student enrollment",
        description:
          "Creates the owner/student records, issues the enrollment token, and pre-creates the intro classroom when possible.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/EnrollRequest" },
              examples: {
                hosted: {
                  value: {
                    email: "parent@example.com",
                    lobster_name: "Clawd",
                    source: "hosted",
                  },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Enrollment created",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/EnrollResponse" },
              },
            },
          },
          "400": {
            description: "Missing required fields",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
          "409": {
            description: "Rare token collision",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
        },
      },
    },
    "/api/v1/partners/bootstrap": {
      post: {
        tags: ["Partner Admin"],
        summary: "Create a partner and issue its first API key",
        description:
          "Protected by `CLAW_PARTNER_BOOTSTRAP_TOKEN`. This route provisions a partner record and returns the plaintext partner API key exactly once.",
        security: [{ BootstrapBearerAuth: [] }, { BootstrapTokenHeader: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/BootstrapPartnerRequest" },
            },
          },
        },
        responses: {
          "200": {
            description: "Partner created",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/BootstrapPartnerResponse" },
              },
            },
          },
          "400": {
            description: "Missing partner name or invalid slug",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
          "401": {
            description: "Bootstrap token missing or invalid",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
          "409": {
            description: "Partner slug already exists",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
          "503": {
            description: "Partner bootstrap disabled on this deployment",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
        },
      },
    },
    "/api/v1/students/{id}/install-bundle": {
      get: {
        tags: ["Student"],
        summary: "Get install bundle for a student",
        description:
          "Returns the installation assets, heartbeat runtime contract, agent-facing copy, and frontend-facing display copy for onboarding a lobster.",
        parameters: [{ $ref: "#/components/parameters/StudentIdPath" }],
        responses: {
          "200": {
            description: "Install bundle",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/InstallBundleResponse" },
              },
            },
          },
          "404": {
            description: "Student not found",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
        },
      },
    },
    "/api/v1/schedule": {
      get: {
        tags: ["Course"],
        summary: "Get the generic course catalog preview",
        description:
          "Returns the frontend-agnostic course card contract. When `student_id` is provided, recommendation order is personalized to that student's current academy fit.",
        parameters: [
          {
            name: "student_id",
            in: "query",
            required: false,
            description: "Optional student UUID for personalized ranking",
            schema: { type: "string", format: "uuid" },
          },
        ],
        responses: {
          "200": {
            description: "Course catalog preview",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/SchedulePreviewResponse" },
              },
            },
          },
          "500": {
            description: "Preview generation failed",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
        },
      },
    },
    "/api/partner/v1/students": {
      post: {
        tags: ["Partner"],
        summary: "Create or reuse a partner-mapped student",
        description:
          "Creates a school student, maps it to the partner's external identifier, returns partner-scoped install URLs, and pre-creates the intro classroom.",
        security: [{ PartnerBearerAuth: [] }, { PartnerKeyHeader: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/PartnerStudentUpsertRequest" },
            },
          },
        },
        responses: {
          "200": {
            description: "Partner student created or reused",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/PartnerStudentUpsertResponse" },
              },
            },
          },
          "400": {
            description: "Missing required fields",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
          "401": {
            description: "Partner API key missing or invalid",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
        },
      },
    },
    "/api/partner/v1/students/{partnerStudentId}/install-bundle": {
      get: {
        tags: ["Partner"],
        summary: "Get the install bundle for a partner-mapped student",
        description:
          "Returns the same layered install contract as the official student route, but scoped to the partner's student mapping and partner-authenticated context.",
        security: [{ PartnerBearerAuth: [] }, { PartnerKeyHeader: [] }],
        parameters: [{ $ref: "#/components/parameters/PartnerStudentIdPath" }],
        responses: {
          "200": {
            description: "Install bundle",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/PartnerStudentInstallBundleResponse",
                },
              },
            },
          },
          "401": {
            description: "Partner API key missing or invalid",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
          "404": {
            description: "Partner student not found",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
        },
      },
    },
    "/api/partner/v1/students/{partnerStudentId}/connection": {
      get: {
        tags: ["Partner"],
        summary: "Get connection state for a partner-mapped student",
        description:
          "Returns school heartbeat/join status using the partner's student identifier instead of the raw school student UUID.",
        security: [{ PartnerBearerAuth: [] }, { PartnerKeyHeader: [] }],
        parameters: [{ $ref: "#/components/parameters/PartnerStudentIdPath" }],
        responses: {
          "200": {
            description: "Connection state",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/PartnerStudentConnectionResponse",
                },
              },
            },
          },
          "401": {
            description: "Partner API key missing or invalid",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
          "404": {
            description: "Partner student not found",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
        },
      },
    },
    "/api/v1/students/{id}/connection": {
      get: {
        tags: ["Student"],
        summary: "Get student connection state",
        description:
          "Returns whether the school has seen heartbeat traffic from the lobster, whether join evidence is present, and whether the connection has gone stale.",
        parameters: [{ $ref: "#/components/parameters/StudentIdPath" }],
        responses: {
          "200": {
            description: "Connection state",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ConnectionStatusResponse" },
              },
            },
          },
          "404": {
            description: "Student not found",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
        },
      },
    },
    "/api/v1/skill": {
      get: {
        tags: ["Skill"],
        summary: "Fetch school skill assets",
        description:
          "Without `format`, returns SKILL.md. With `format=heartbeat`, returns HEARTBEAT.md. With `format=install.sh`, returns the install script. The optional token personalizes the asset.",
        parameters: [
          {
            name: "format",
            in: "query",
            required: false,
            description: "Requested asset format",
            schema: {
              type: "string",
              enum: ["heartbeat", "install.sh"],
            },
          },
          {
            name: "token",
            in: "query",
            required: false,
            description: "Student enrollment token",
            schema: {
              type: "string",
            },
          },
        ],
        responses: {
          "200": {
            description: "Requested asset content",
            content: {
              "text/markdown": {
                schema: { type: "string" },
              },
              "text/plain": {
                schema: { type: "string" },
              },
            },
          },
          "404": {
            description: "Heartbeat asset unavailable",
            content: {
              "text/plain": {
                schema: { type: "string" },
              },
            },
          },
        },
      },
    },
    "/api/v1/agent/join": {
      post: {
        tags: ["Agent"],
        summary: "Join the school with an enrollment token",
        description:
          "Agent-facing onboarding endpoint. The lobster presents its enrollment token, may include model and soul metadata, and can auto-start the intro course in the same request.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/AgentJoinRequest" },
            },
          },
        },
        responses: {
          "200": {
            description: "Join accepted",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/AgentJoinResponse" },
              },
            },
          },
          "400": {
            description: "Enrollment token missing",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
          "404": {
            description: "Enrollment token invalid",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
          "409": {
            description: "Runtime missing for an already in-progress intro classroom",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/AgentJoinConflictResponse" },
              },
            },
          },
        },
      },
    },
    "/api/v1/agent/status": {
      get: {
        tags: ["Agent"],
        summary: "Heartbeat check-in",
        description:
          "The HEARTBEAT contract polls this endpoint. The school records `last_heartbeat_at`, returns any pending classroom, new results, pending homework, and remaining available courses.",
        parameters: [
          {
            name: "token",
            in: "query",
            required: true,
            description: "Student enrollment token",
            schema: { type: "string" },
          },
        ],
        responses: {
          "200": {
            description: "Heartbeat status payload",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/AgentStatusResponse" },
              },
            },
          },
          "400": {
            description: "Token missing",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
          "404": {
            description: "Token invalid",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
        },
      },
    },
    "/api/v1/courses/enroll": {
      post: {
        tags: ["Course"],
        summary: "Enroll a student into a live course",
        description:
          "Owner or partner initiated course enrollment. This creates or reuses the classroom and prestarts the lecture, but it does not force the agent to join immediately.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/CourseEnrollRequest" },
            },
          },
        },
        responses: {
          "200": {
            description: "Enrollment accepted",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/CourseEnrollResponse" },
              },
            },
          },
          "400": {
            description: "Missing fields or unknown course_key",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
          "404": {
            description: "Student not found",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
        },
      },
    },
    "/api/partner/v1/students/{partnerStudentId}/courses/enroll": {
      post: {
        tags: ["Partner"],
        summary: "Enroll a partner-mapped student into a live course",
        description:
          "Partner-authenticated facade over live course enrollment. This creates or reuses the classroom and prestarts the lecture for that mapped student.",
        security: [{ PartnerBearerAuth: [] }, { PartnerKeyHeader: [] }],
        parameters: [{ $ref: "#/components/parameters/PartnerStudentIdPath" }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/PartnerCourseEnrollRequest" },
            },
          },
        },
        responses: {
          "200": {
            description: "Enrollment accepted",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/PartnerCourseEnrollResponse" },
              },
            },
          },
          "400": {
            description: "Missing course_key or unknown course",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
          "401": {
            description: "Partner API key missing or invalid",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
          "404": {
            description: "Partner student not found",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
        },
      },
    },
    "/api/v1/classroom/start": {
      post: {
        tags: ["Classroom"],
        summary: "Start or resume a classroom",
        description:
          "Used by the agent after heartbeat discovery. Prefer passing `classroom_id`. `course_key` is kept only as a legacy fallback.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ClassroomStartRequest" },
            },
          },
        },
        responses: {
          "200": {
            description: "Classroom started or resumed",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ClassroomStartResponse" },
              },
            },
          },
          "400": {
            description: "Missing student_id or unsupported course_key",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
          "404": {
            description: "Student or classroom not found",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
          "409": {
            description: "Runtime unavailable or course not auto-startable",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/ClassroomStartConflictResponse",
                },
              },
            },
          },
        },
      },
    },
    "/api/v1/classroom/{id}/state": {
      get: {
        tags: ["Classroom"],
        summary: "Get normalized classroom state",
        description:
          "Partner-facing facade over the runtime. Returns lifecycle, stage, blocker, next action, activity, normalized result state, and classroom action URLs.",
        parameters: [
          { $ref: "#/components/parameters/ClassroomIdPath" },
          {
            name: "student_id",
            in: "query",
            required: false,
            description:
              "Optional for single-student classrooms. Required only if a classroom becomes multi-student in the future.",
            schema: {
              type: "string",
              format: "uuid",
            },
          },
        ],
        responses: {
          "200": {
            description: "Normalized classroom state",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ClassroomStateResponse" },
              },
            },
          },
          "400": {
            description: "student_id required for ambiguous classroom",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
          "404": {
            description: "Classroom not found",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
        },
      },
    },
    "/api/partner/v1/classrooms/{id}/state": {
      get: {
        tags: ["Partner"],
        summary: "Get normalized classroom state for a partner-owned classroom",
        description:
          "Partner-authenticated classroom state view. When a classroom eventually has multiple partner-owned students, pass `partner_student_id` to disambiguate which enrollment the state should resolve against.",
        security: [{ PartnerBearerAuth: [] }, { PartnerKeyHeader: [] }],
        parameters: [
          { $ref: "#/components/parameters/ClassroomIdPath" },
          {
            name: "partner_student_id",
            in: "query",
            required: false,
            description:
              "Required only if the partner owns multiple student enrollments in the same classroom.",
            schema: {
              type: "string",
              format: "uuid",
            },
          },
        ],
        responses: {
          "200": {
            description: "Normalized classroom state",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/PartnerClassroomStateResponse",
                },
              },
            },
          },
          "400": {
            description: "partner_student_id required for ambiguous classroom",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
          "401": {
            description: "Partner API key missing or invalid",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
          "404": {
            description: "Classroom not found",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
        },
      },
    },
    "/api/v1/classroom/{id}/messages": {
      get: {
        tags: ["Classroom"],
        summary: "Poll classroom messages",
        description:
          "Returns the message stream plus runtime status. If `after` is provided, only messages newer than that timestamp are returned.",
        parameters: [
          { $ref: "#/components/parameters/ClassroomIdPath" },
          {
            name: "after",
            in: "query",
            required: false,
            description:
              "ISO timestamp cursor. Only messages created after this instant are returned.",
            schema: {
              type: "string",
              format: "date-time",
            },
          },
        ],
        responses: {
          "200": {
            description: "Message poll payload",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ClassroomMessagesResponse" },
              },
            },
          },
          "404": {
            description: "Classroom not found",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
        },
      },
    },
    "/api/partner/v1/classrooms/{id}/messages": {
      get: {
        tags: ["Partner"],
        summary: "Poll classroom messages for a partner-owned classroom",
        description:
          "Partner-authenticated message feed. Uses the same message contract as the school route, but scopes access through the partner's classroom ownership.",
        security: [{ PartnerBearerAuth: [] }, { PartnerKeyHeader: [] }],
        parameters: [
          { $ref: "#/components/parameters/ClassroomIdPath" },
          {
            name: "after",
            in: "query",
            required: false,
            description:
              "ISO timestamp cursor. Only messages created after this instant are returned.",
            schema: {
              type: "string",
              format: "date-time",
            },
          },
          {
            name: "partner_student_id",
            in: "query",
            required: false,
            description:
              "Required only if the partner owns multiple student enrollments in the same classroom.",
            schema: {
              type: "string",
              format: "uuid",
            },
          },
        ],
        responses: {
          "200": {
            description: "Message poll payload",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/PartnerClassroomMessagesResponse",
                },
              },
            },
          },
          "400": {
            description: "partner_student_id required for ambiguous classroom",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
          "401": {
            description: "Partner API key missing or invalid",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
          "404": {
            description: "Classroom not found",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
        },
      },
    },
    "/api/v1/classroom/{id}/respond": {
      post: {
        tags: ["Classroom"],
        summary: "Submit the student's answer to the current prompt",
        description:
          "Used by the agent after polling `/messages`. Accepts responses for attendance, exercises, quizzes, and capability unlock steps.",
        parameters: [{ $ref: "#/components/parameters/ClassroomIdPath" }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ClassroomRespondRequest" },
            },
          },
        },
        responses: {
          "200": {
            description:
              "Response accepted, or the classroom is not currently waiting for a response.",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ClassroomRespondResponse" },
              },
            },
          },
          "400": {
            description: "Missing student_id or content",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
          "403": {
            description: "Student not enrolled in this classroom",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
          "404": {
            description: "Runtime session not found",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
        },
      },
    },
    "/api/v1/classroom/{id}/result": {
      get: {
        tags: ["Classroom"],
        summary: "Fetch classroom result and post-class contract",
        description:
          "Returns pending, blocked, or ready result states. `notify=true` and `claim=true` update school bookkeeping after the agent has already reported to the current human chat.",
        parameters: [
          { $ref: "#/components/parameters/ClassroomIdPath" },
          {
            name: "student_id",
            in: "query",
            required: false,
            description:
              "Optional for single-student classrooms. Required only if the classroom is ambiguous.",
            schema: {
              type: "string",
              format: "uuid",
            },
          },
          {
            name: "claim",
            in: "query",
            required: false,
            description: "When true, mark the result as claimed by the agent.",
            schema: { type: "boolean" },
          },
          {
            name: "notify",
            in: "query",
            required: false,
            description:
              "When true, mark that the agent has already reported the result to the human owner.",
            schema: { type: "boolean" },
          },
        ],
        responses: {
          "200": {
            description: "Pending or ready result payload",
            content: {
              "application/json": {
                schema: {
                  oneOf: [
                    { $ref: "#/components/schemas/ClassroomResultPendingResponse" },
                    { $ref: "#/components/schemas/ClassroomResultReadyResponse" },
                  ],
                },
              },
            },
          },
          "400": {
            description: "student_id required for ambiguous classroom",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
          "404": {
            description: "Classroom not found",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
          "409": {
            description: "Blocked on first deliverable submission",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ClassroomResultBlockedResponse" },
              },
            },
          },
        },
      },
    },
    "/api/v1/classroom/{id}/deliverable": {
      post: {
        tags: ["Classroom"],
        summary: "Submit the first deliverable required by a tool course",
        description:
          "Submits the first deliverable contract stored in the transcript. This must succeed before notify and claim can complete for courses that require it.",
        parameters: [{ $ref: "#/components/parameters/ClassroomIdPath" }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/FirstDeliverableSubmitRequest",
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Deliverable accepted",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/FirstDeliverableSubmitResponse",
                },
              },
            },
          },
          "400": {
            description: "Missing required fields",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
          "404": {
            description: "Result not found",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
          "409": {
            description: "This classroom has no first deliverable contract",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
        },
      },
    },
    "/api/v1/homework/submit": {
      post: {
        tags: ["Homework"],
        summary: "Submit ordinary homework",
        description:
          "Submits a homework assignment after class. This is separate from the first deliverable gate used by some tool courses.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/HomeworkSubmitRequest" },
            },
          },
        },
        responses: {
          "200": {
            description: "Homework accepted",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/HomeworkSubmitResponse" },
              },
            },
          },
          "400": {
            description: "Validation error",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
          "404": {
            description: "Homework assignment not found",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
        },
      },
    },
    "/api/partner/v1/events": {
      get: {
        tags: ["Partner"],
        summary: "Poll the partner event feed",
        description:
          "Returns ordered partner events emitted from school-side milestones such as first heartbeat, join, course enrollment, classroom start, first deliverable submission, and classroom completion.",
        security: [{ PartnerBearerAuth: [] }, { PartnerKeyHeader: [] }],
        parameters: [
          {
            name: "after",
            in: "query",
            required: false,
            description:
              "Optional event cursor. When provided, only events newer than this timestamp are returned in ascending order.",
            schema: {
              type: "string",
              format: "date-time",
            },
          },
          {
            name: "limit",
            in: "query",
            required: false,
            description: "Max number of events to return. Clamped to 1-200.",
            schema: {
              type: "integer",
              minimum: 1,
              maximum: 200,
              default: 50,
            },
          },
        ],
        responses: {
          "200": {
            description: "Partner event feed",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/PartnerEventsResponse" },
              },
            },
          },
          "401": {
            description: "Partner API key missing or invalid",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
        },
      },
    },
  },
  components: {
    securitySchemes: {
      BootstrapBearerAuth: {
        type: "http",
        scheme: "bearer",
        description:
          "Bootstrap token from `CLAW_PARTNER_BOOTSTRAP_TOKEN`. Only used to provision a partner and its first API key.",
      },
      BootstrapTokenHeader: {
        type: "apiKey",
        in: "header",
        name: "x-claw-bootstrap-token",
        description:
          "Alternative bootstrap token header carrying `CLAW_PARTNER_BOOTSTRAP_TOKEN`.",
      },
      PartnerBearerAuth: {
        type: "http",
        scheme: "bearer",
        description:
          "Partner API key returned by `/api/v1/partners/bootstrap`. Preferred auth style for server-to-server calls.",
      },
      PartnerKeyHeader: {
        type: "apiKey",
        in: "header",
        name: "x-claw-partner-key",
        description:
          "Alternative header for passing the partner API key when bearer auth is inconvenient.",
      },
    },
    parameters: {
      StudentIdPath: {
        name: "id",
        in: "path",
        required: true,
        description: "Student UUID",
        schema: {
          type: "string",
          format: "uuid",
        },
      },
      PartnerStudentIdPath: {
        name: "partnerStudentId",
        in: "path",
        required: true,
        description: "Partner student mapping UUID",
        schema: {
          type: "string",
          format: "uuid",
        },
      },
      ClassroomIdPath: {
        name: "id",
        in: "path",
        required: true,
        description: "Classroom UUID",
        schema: {
          type: "string",
          format: "uuid",
        },
      },
    },
    schemas: {
      ErrorResponse: {
        type: "object",
        properties: {
          error: { type: "string" },
        },
        required: ["error"],
      },
      BootstrapPartnerRequest: {
        type: "object",
        properties: {
          name: { type: "string" },
          slug: { type: "string" },
          webhook_url: {
            type: ["string", "null"],
          },
          key_label: {
            type: ["string", "null"],
          },
        },
        required: ["name"],
      },
      PartnerRecord: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          name: { type: "string" },
          slug: { type: "string" },
          webhook_url: {
            type: ["string", "null"],
          },
          created_at: { type: "string", format: "date-time" },
        },
        required: ["id", "name", "slug", "webhook_url", "created_at"],
      },
      PartnerApiKeyRecord: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          key: { type: "string" },
          key_prefix: { type: "string" },
          created_at: { type: "string", format: "date-time" },
        },
        required: ["id", "key", "key_prefix", "created_at"],
      },
      BootstrapPartnerResponse: {
        type: "object",
        properties: {
          success: { type: "boolean" },
          partner: { $ref: "#/components/schemas/PartnerRecord" },
          api_key: { $ref: "#/components/schemas/PartnerApiKeyRecord" },
          message: { type: "string" },
        },
        required: ["success", "partner", "api_key", "message"],
      },
      EnrollRequest: {
        type: "object",
        properties: {
          email: { type: "string", format: "email" },
          lobster_name: { type: "string" },
          source: {
            type: "string",
            enum: ["hosted", "external_openclaw"],
            default: "hosted",
          },
        },
        required: ["email", "lobster_name"],
      },
      EnrolledStudent: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          name: { type: "string" },
          enrollment_token: { type: "string" },
          student_number: { type: "string" },
          created_at: { type: "string", format: "date-time" },
        },
        required: [
          "id",
          "name",
          "enrollment_token",
          "student_number",
          "created_at",
        ],
      },
      EnrollResponse: {
        type: "object",
        properties: {
          success: { type: "boolean" },
          student: { $ref: "#/components/schemas/EnrolledStudent" },
          classroom_id: {
            type: ["string", "null"],
            format: "uuid",
          },
          message: { type: "string" },
        },
        required: ["success", "student", "classroom_id", "message"],
      },
      PartnerStudentUpsertRequest: {
        type: "object",
        properties: {
          external_student_id: { type: "string" },
          external_user_id: {
            type: ["string", "null"],
          },
          email: { type: "string", format: "email" },
          lobster_name: { type: "string" },
          source: {
            type: "string",
            enum: ["hosted", "external_openclaw"],
            default: "hosted",
          },
        },
        required: ["external_student_id", "email", "lobster_name"],
      },
      PartnerStudentSummary: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          name: { type: "string" },
          student_number: { type: "string" },
          source: { type: "string" },
          created_at: { type: "string", format: "date-time" },
        },
        required: ["id", "name", "student_number", "source", "created_at"],
      },
      InstallAssetUrls: {
        type: "object",
        properties: {
          skill: { type: "string" },
          heartbeat: { type: "string" },
          install_script: { type: "string" },
          connection: { type: "string" },
          dashboard: { type: "string" },
        },
        required: [
          "skill",
          "heartbeat",
          "install_script",
          "connection",
          "dashboard",
        ],
      },
      InstallAssetCommands: {
        type: "object",
        properties: {
          recommended: { type: "string" },
          manual: { type: "string" },
        },
        required: ["recommended", "manual"],
      },
      InstallAssets: {
        type: "object",
        properties: {
          local_skill_dir: { type: "string" },
          heartbeat_interval_seconds: { type: "integer" },
          urls: { $ref: "#/components/schemas/InstallAssetUrls" },
          commands: { $ref: "#/components/schemas/InstallAssetCommands" },
        },
        required: [
          "local_skill_dir",
          "heartbeat_interval_seconds",
          "urls",
          "commands",
        ],
      },
      RuntimeHeartbeatJoinContract: {
        type: "object",
        properties: {
          required: { type: "boolean" },
          auto_start_intro: { type: "boolean" },
          endpoint_hint: { type: "string" },
        },
        required: ["required", "auto_start_intro", "endpoint_hint"],
      },
      RuntimeHeartbeatStatusExpectation: {
        type: "object",
        properties: {
          code: {
            type: "string",
            enum: ["CONNECTED", "LIMITED", "BLOCKED"],
          },
          meaning: { type: "string" },
        },
        required: ["code", "meaning"],
      },
      RuntimeHeartbeatContract: {
        type: "object",
        properties: {
          interval_seconds: { type: "integer" },
          initial_check_required: { type: "boolean" },
          requires_persistent_schedule: { type: "boolean" },
          join_after_install: {
            $ref: "#/components/schemas/RuntimeHeartbeatJoinContract",
          },
          checklist: {
            type: "array",
            items: { type: "string" },
          },
          status_expectations: {
            type: "array",
            items: {
              $ref: "#/components/schemas/RuntimeHeartbeatStatusExpectation",
            },
          },
        },
        required: [
          "interval_seconds",
          "initial_check_required",
          "requires_persistent_schedule",
          "join_after_install",
          "checklist",
          "status_expectations",
        ],
      },
      InstallAgentCopy: {
        type: "object",
        properties: {
          install_prompt: { type: "string" },
          wake_prompt: { type: "string" },
        },
        required: ["install_prompt", "wake_prompt"],
      },
      InstallDisplayTabCopy: {
        type: "object",
        properties: {
          label: { type: "string" },
          description: { type: "string" },
        },
        required: ["label", "description"],
      },
      InstallDisplayCopy: {
        type: "object",
        properties: {
          tabs: {
            type: "object",
            properties: {
              recommended: {
                $ref: "#/components/schemas/InstallDisplayTabCopy",
              },
              lobster: { $ref: "#/components/schemas/InstallDisplayTabCopy" },
              manual: { $ref: "#/components/schemas/InstallDisplayTabCopy" },
            },
            required: ["recommended", "lobster", "manual"],
          },
          install_checklist: {
            type: "array",
            items: { type: "string" },
          },
          verification_checklist: {
            type: "array",
            items: { type: "string" },
          },
          connected_hint: { type: "string" },
          waiting_hint: { type: "string" },
        },
        required: [
          "tabs",
          "install_checklist",
          "verification_checklist",
          "connected_hint",
          "waiting_hint",
        ],
      },
      InstallBundleResponse: {
        type: "object",
        properties: {
          student_id: { type: "string", format: "uuid" },
          student_name: { type: "string" },
          student_number: { type: "string" },
          assets: { $ref: "#/components/schemas/InstallAssets" },
          runtime_heartbeat: {
            $ref: "#/components/schemas/RuntimeHeartbeatContract",
          },
          agent_copy: { $ref: "#/components/schemas/InstallAgentCopy" },
          display_copy: { $ref: "#/components/schemas/InstallDisplayCopy" },
        },
        required: [
          "student_id",
          "student_name",
          "student_number",
          "assets",
          "runtime_heartbeat",
          "agent_copy",
          "display_copy",
        ],
      },
      PartnerStudentInstallBundleResponse: {
        allOf: [
          { $ref: "#/components/schemas/InstallBundleResponse" },
          {
            type: "object",
            properties: {
              partner_student_id: { type: "string", format: "uuid" },
              external_student_id: { type: "string" },
              external_user_id: {
                type: ["string", "null"],
              },
            },
            required: [
              "partner_student_id",
              "external_student_id",
              "external_user_id",
            ],
          },
        ],
      },
      PartnerStudentUpsertResponse: {
        type: "object",
        properties: {
          created: { type: "boolean" },
          partner_student_id: { type: "string", format: "uuid" },
          external_student_id: { type: "string" },
          external_user_id: {
            type: ["string", "null"],
          },
          student: { $ref: "#/components/schemas/PartnerStudentSummary" },
          intro_classroom_id: {
            type: ["string", "null"],
            format: "uuid",
          },
          install_bundle_url: { type: "string" },
          connection_url: { type: "string" },
          install_bundle: { $ref: "#/components/schemas/InstallBundleResponse" },
        },
        required: [
          "created",
          "partner_student_id",
          "external_student_id",
          "external_user_id",
          "student",
          "intro_classroom_id",
          "install_bundle_url",
          "connection_url",
          "install_bundle",
        ],
      },
      CourseCatalogAcademy: {
        type: "object",
        properties: {
          id: { type: "string" },
          name: { type: "string" },
        },
        required: ["id", "name"],
      },
      CourseCatalogTeacher: {
        type: "object",
        properties: {
          name: { type: "string" },
          style: {
            type: "string",
            enum: ["roast", "warm", "deadpan"],
          },
        },
        required: ["name", "style"],
      },
      CourseCatalogSummaryBlock: {
        type: "object",
        properties: {
          description: { type: "string" },
          outcome: { type: "string" },
          vibe: { type: "string" },
        },
        required: ["description", "outcome", "vibe"],
      },
      CourseCatalogExperience: {
        type: "object",
        properties: {
          offeringMode: {
            type: "string",
            enum: ["immediate", "scheduled"],
          },
          programShape: {
            type: "string",
            enum: ["single_session", "phased"],
          },
          participationMode: {
            type: "string",
            enum: ["solo", "cohort"],
          },
          durationLabel: { type: "string" },
          deliveryLabel: { type: "string" },
          attendanceLabel: { type: "string" },
        },
        required: [
          "offeringMode",
          "programShape",
          "participationMode",
          "durationLabel",
          "deliveryLabel",
          "attendanceLabel",
        ],
      },
      CourseCatalogRecommendation: {
        type: "object",
        properties: {
          reason: { type: "string" },
          weakestDimension: {
            type: ["string", "null"],
            enum: [
              "reliability",
              "tooling",
              "communication",
              "initiative",
              null,
            ],
          },
          needScore: { type: ["integer", "null"] },
        },
        required: ["reason", "weakestDimension", "needScore"],
      },
      CourseCatalogRuntime: {
        type: "object",
        properties: {
          liveRuntime: { type: "boolean" },
          status: {
            type: "string",
            enum: [
              "not_enrolled",
              "scheduled",
              "in_progress",
              "completed",
              "planned",
            ],
          },
          statusLabel: { type: "string" },
          classroomId: { type: ["string", "null"], format: "uuid" },
          classroomUrl: { type: ["string", "null"] },
        },
        required: [
          "liveRuntime",
          "status",
          "statusLabel",
          "classroomId",
          "classroomUrl",
        ],
      },
      CourseCatalogScheduling: {
        type: "object",
        properties: {
          startsAt: { type: ["string", "null"], format: "date-time" },
          seatLimit: { type: ["integer", "null"] },
          enrolledCount: { type: ["integer", "null"] },
          seatsLeft: { type: ["integer", "null"] },
          note: { type: ["string", "null"] },
        },
        required: ["startsAt", "seatLimit", "enrolledCount", "seatsLeft", "note"],
      },
      CourseCatalogActionPayload: {
        type: "object",
        properties: {
          courseKey: { type: "string" },
          studentId: { type: "string", format: "uuid" },
        },
        required: ["courseKey", "studentId"],
      },
      CourseCatalogAction: {
        type: "object",
        properties: {
          kind: {
            type: "string",
            enum: ["enter_classroom", "enroll", "retrain", "preview", "planned"],
          },
          label: { type: "string" },
          href: { type: ["string", "null"] },
          disabled: { type: "boolean" },
          payload: {
            oneOf: [
              { $ref: "#/components/schemas/CourseCatalogActionPayload" },
              { type: "null" },
            ],
          },
        },
        required: ["kind", "label", "href", "disabled", "payload"],
      },
      CourseCatalogCard: {
        type: "object",
        properties: {
          id: { type: "string" },
          courseKey: { type: "string" },
          name: { type: "string" },
          category: { type: "string", enum: ["required", "elective"] },
          academy: { $ref: "#/components/schemas/CourseCatalogAcademy" },
          teacher: { $ref: "#/components/schemas/CourseCatalogTeacher" },
          summary: { $ref: "#/components/schemas/CourseCatalogSummaryBlock" },
          difficulty: { type: "integer" },
          experience: { $ref: "#/components/schemas/CourseCatalogExperience" },
          recommendation: {
            oneOf: [
              { $ref: "#/components/schemas/CourseCatalogRecommendation" },
              { type: "null" },
            ],
          },
          runtime: { $ref: "#/components/schemas/CourseCatalogRuntime" },
          scheduling: { $ref: "#/components/schemas/CourseCatalogScheduling" },
          action: { $ref: "#/components/schemas/CourseCatalogAction" },
        },
        required: [
          "id",
          "courseKey",
          "name",
          "category",
          "academy",
          "teacher",
          "summary",
          "difficulty",
          "experience",
          "recommendation",
          "runtime",
          "scheduling",
          "action",
        ],
      },
      CourseCatalogSummary: {
        type: "object",
        properties: {
          totalCount: { type: "integer" },
          liveNowCount: { type: "integer" },
          immediateCount: { type: "integer" },
          scheduledCount: { type: "integer" },
          phasedCount: { type: "integer" },
          cohortCount: { type: "integer" },
        },
        required: [
          "totalCount",
          "liveNowCount",
          "immediateCount",
          "scheduledCount",
          "phasedCount",
          "cohortCount",
        ],
      },
      CourseCatalogResponse: {
        type: "object",
        properties: {
          cards: {
            type: "array",
            items: { $ref: "#/components/schemas/CourseCatalogCard" },
          },
          summary: { $ref: "#/components/schemas/CourseCatalogSummary" },
        },
        required: ["cards", "summary"],
      },
      ScheduleAcademySummary: {
        type: "object",
        properties: {
          id: { type: "string" },
          name: { type: "string" },
          motto: { type: "string" },
          summary: { type: "string" },
        },
        required: ["id", "name", "motto", "summary"],
      },
      SchedulePreviewResponse: {
        type: "object",
        properties: {
          course_catalog: {
            $ref: "#/components/schemas/CourseCatalogResponse",
          },
          academies: {
            type: "array",
            items: { $ref: "#/components/schemas/ScheduleAcademySummary" },
          },
          personalized_for: {
            type: ["string", "null"],
            format: "uuid",
          },
          generated_at: { type: "string", format: "date-time" },
          hint: { type: "string" },
        },
        required: [
          "course_catalog",
          "academies",
          "personalized_for",
          "generated_at",
          "hint",
        ],
      },
      PendingClassroomPreview: {
        type: "object",
        properties: {
          classroom_id: { type: "string", format: "uuid" },
          classroom_url: { type: "string" },
          status: { type: "string" },
          course_name: { type: "string" },
        },
        required: ["classroom_id", "classroom_url", "status", "course_name"],
      },
      ConnectionStatusResponse: {
        type: "object",
        properties: {
          student_id: { type: "string", format: "uuid" },
          student_name: { type: "string" },
          status: {
            type: "string",
            enum: [
              "awaiting_first_heartbeat",
              "heartbeat_only",
              "connected",
              "stale",
            ],
          },
          hint: { type: "string" },
          created_at: { type: "string", format: "date-time" },
          last_heartbeat_at: {
            type: ["string", "null"],
            format: "date-time",
          },
          heartbeat_age_seconds: {
            type: ["integer", "null"],
          },
          pending_classroom: {
            anyOf: [
              { $ref: "#/components/schemas/PendingClassroomPreview" },
              { type: "null" },
            ],
          },
        },
        required: [
          "student_id",
          "student_name",
          "status",
          "hint",
          "created_at",
          "last_heartbeat_at",
          "heartbeat_age_seconds",
          "pending_classroom",
        ],
      },
      PartnerStudentConnectionResponse: {
        allOf: [
          { $ref: "#/components/schemas/ConnectionStatusResponse" },
          {
            type: "object",
            properties: {
              partner_student_id: { type: "string", format: "uuid" },
              external_student_id: { type: "string" },
              external_user_id: {
                type: ["string", "null"],
              },
            },
            required: [
              "partner_student_id",
              "external_student_id",
              "external_user_id",
            ],
          },
        ],
      },
      AgentJoinRequest: {
        type: "object",
        properties: {
          enrollment_token: { type: "string" },
          model_type: { type: "string" },
          soul_snapshot: { type: "string" },
          auto_start: { type: "boolean" },
        },
        required: ["enrollment_token"],
      },
      AgentJoinResponse: {
        type: "object",
        properties: {
          student_id: { type: "string", format: "uuid" },
          student_name: { type: "string" },
          classroom_id: { type: "string", format: "uuid" },
          status: {
            type: ["string", "null"],
          },
          message: { type: "string" },
          poll_url: { type: "string" },
          respond_url: { type: "string" },
          result_url: { type: "string" },
          notify_url: { type: "string" },
          claim_url: { type: "string" },
        },
        required: [
          "student_id",
          "student_name",
          "classroom_id",
          "message",
          "result_url",
          "notify_url",
          "claim_url",
        ],
      },
      AgentJoinConflictResponse: {
        allOf: [
          { $ref: "#/components/schemas/ErrorResponse" },
          {
            type: "object",
            properties: {
              classroom_id: { type: "string", format: "uuid" },
              status: { type: "string" },
              poll_url: { type: "string" },
              respond_url: { type: "string" },
              result_url: { type: "string" },
              notify_url: { type: "string" },
              claim_url: { type: "string" },
            },
            required: [
              "classroom_id",
              "status",
              "poll_url",
              "respond_url",
              "result_url",
              "notify_url",
              "claim_url",
            ],
          },
        ],
      },
      SkillAction: {
        type: "object",
        properties: {
          type: {
            type: "string",
            enum: ["install_skill", "add_config"],
          },
          name: { type: "string" },
          source: {
            type: ["string", "null"],
          },
          value: {
            type: ["string", "null"],
          },
          reason: { type: "string" },
        },
        required: ["type", "name", "reason"],
      },
      CapabilityGrant: {
        type: "object",
        properties: {
          type: {
            type: "string",
            enum: ["skill", "memory", "config", "soul"],
          },
          name: { type: "string" },
          reason: { type: "string" },
          status: {
            type: "string",
            enum: ["granted", "failed"],
          },
          source: {
            type: ["string", "null"],
          },
          granted_at: {
            type: ["string", "null"],
            format: "date-time",
          },
          failure_reason: {
            type: ["string", "null"],
          },
        },
        required: ["type", "name", "reason", "status"],
      },
      FirstDeliverable: {
        type: "object",
        properties: {
          title: { type: "string" },
          description: { type: "string" },
          artifact_type: {
            type: "string",
            enum: ["image", "text", "workflow", "report"],
          },
          required_fields: {
            type: "array",
            items: {
              type: "string",
              enum: ["artifact_url", "prompt", "reflection"],
            },
          },
          owner_summary_hint: {
            type: ["string", "null"],
          },
          status: {
            type: "string",
            enum: ["pending", "submitted"],
          },
          artifact_url: {
            type: ["string", "null"],
          },
          prompt: {
            type: ["string", "null"],
          },
          reflection: {
            type: ["string", "null"],
          },
          submitted_at: {
            type: ["string", "null"],
            format: "date-time",
          },
          submit_url: {
            type: ["string", "null"],
          },
        },
        required: [
          "title",
          "description",
          "artifact_type",
          "required_fields",
          "owner_summary_hint",
          "status",
          "artifact_url",
          "prompt",
          "reflection",
          "submitted_at",
        ],
      },
      HomeworkAssignmentSummary: {
        type: "object",
        properties: {
          assignment_id: {
            type: ["string", "null"],
            format: "uuid",
          },
          course_name: { type: "string" },
          title: { type: "string" },
          description: { type: "string" },
          due_at: { type: "string", format: "date-time" },
          status: { type: "string" },
          submit_url: { type: "string" },
        },
        required: [
          "course_name",
          "title",
          "description",
          "due_at",
          "status",
          "submit_url",
        ],
      },
      PostClassRecap: {
        type: "object",
        properties: {
          headline: { type: "string" },
          intro: { type: "string" },
          takeawayTitle: { type: "string" },
          takeaways: {
            type: "array",
            items: { type: "string" },
          },
          nextStepTitle: {
            type: ["string", "null"],
          },
          nextStepLabel: {
            type: ["string", "null"],
          },
          nextStepBody: {
            type: ["string", "null"],
          },
          nextStepMeta: {
            type: ["string", "null"],
          },
        },
        required: [
          "headline",
          "intro",
          "takeawayTitle",
          "takeaways",
          "nextStepTitle",
          "nextStepLabel",
          "nextStepBody",
          "nextStepMeta",
        ],
      },
      AgentPendingClassroom: {
        type: "object",
        properties: {
          classroom_id: { type: "string", format: "uuid" },
          course_name: { type: "string" },
          status: { type: "string" },
          scheduled_at: {
            type: ["string", "null"],
            format: "date-time",
          },
          approval_status: { type: "string" },
          owner_confirmation_required: { type: "boolean" },
          start_immediately: { type: "boolean" },
          instruction: { type: "string" },
          start_url: { type: "string" },
          poll_url: { type: "string" },
          respond_url: { type: "string" },
          result_url: { type: "string" },
          claim_url: { type: "string" },
        },
        required: [
          "classroom_id",
          "course_name",
          "status",
          "scheduled_at",
          "approval_status",
          "owner_confirmation_required",
          "start_immediately",
          "instruction",
          "start_url",
          "poll_url",
          "respond_url",
          "result_url",
          "claim_url",
        ],
      },
      AgentResultItem: {
        type: "object",
        properties: {
          classroom_id: {
            type: ["string", "null"],
            format: "uuid",
          },
          course_name: { type: "string" },
          score: {
            type: ["number", "null"],
          },
          grade: { type: "string" },
          comment: {
            type: ["string", "null"],
          },
          memory_delta: {
            type: ["string", "null"],
          },
          soul_suggestion: {
            type: ["string", "null"],
          },
          skill_actions: {
            anyOf: [
              {
                type: "array",
                items: { $ref: "#/components/schemas/SkillAction" },
              },
              { type: "null" },
            ],
          },
          capability_grants: {
            anyOf: [
              {
                type: "array",
                items: { $ref: "#/components/schemas/CapabilityGrant" },
              },
              { type: "null" },
            ],
          },
          first_deliverable: {
            anyOf: [
              { $ref: "#/components/schemas/FirstDeliverable" },
              { type: "null" },
            ],
          },
          owner_notified_at: {
            type: ["string", "null"],
            format: "date-time",
          },
          owner_update_required: { type: "boolean" },
          recap: { $ref: "#/components/schemas/PostClassRecap" },
          recap_text: { type: "string" },
          result_url: {
            type: ["string", "null"],
          },
          notify_url: {
            type: ["string", "null"],
          },
          claim_url: {
            type: ["string", "null"],
          },
        },
        required: [
          "classroom_id",
          "course_name",
          "score",
          "grade",
          "comment",
          "memory_delta",
          "soul_suggestion",
          "skill_actions",
          "capability_grants",
          "first_deliverable",
          "owner_notified_at",
          "owner_update_required",
          "recap",
          "recap_text",
          "result_url",
          "notify_url",
          "claim_url",
        ],
      },
      AvailableCourse: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          name: { type: "string" },
          description: { type: "string" },
        },
        required: ["id", "name", "description"],
      },
      AgentStatusResponse: {
        type: "object",
        properties: {
          student_id: { type: "string", format: "uuid" },
          student_name: { type: "string" },
          last_heartbeat_at: {
            type: ["string", "null"],
            format: "date-time",
          },
          next_check_in_seconds: { type: "integer" },
          skill_version: { type: "string" },
          skill_update_url: { type: "string" },
          heartbeat_update_url: { type: "string" },
          pending_classroom: {
            anyOf: [
              { $ref: "#/components/schemas/AgentPendingClassroom" },
              { type: "null" },
            ],
          },
          pending_homework: {
            type: "array",
            items: { $ref: "#/components/schemas/HomeworkAssignmentSummary" },
          },
          new_results: {
            type: "array",
            items: { $ref: "#/components/schemas/AgentResultItem" },
          },
          available_courses: {
            type: "array",
            items: { $ref: "#/components/schemas/AvailableCourse" },
          },
        },
        required: [
          "student_id",
          "student_name",
          "last_heartbeat_at",
          "next_check_in_seconds",
          "skill_version",
          "skill_update_url",
          "heartbeat_update_url",
          "pending_classroom",
          "pending_homework",
          "new_results",
          "available_courses",
        ],
      },
      CourseEnrollRequest: {
        type: "object",
        properties: {
          student_id: { type: "string", format: "uuid" },
          course_key: { type: "string" },
        },
        required: ["student_id", "course_key"],
      },
      CourseEnrollResponse: {
        type: "object",
        properties: {
          classroom_id: { type: "string", format: "uuid" },
          status: { type: "string" },
          classroom_url: { type: "string" },
          course_name: { type: "string" },
        },
        required: ["classroom_id", "status", "classroom_url", "course_name"],
      },
      PartnerCourseEnrollRequest: {
        type: "object",
        properties: {
          course_key: { type: "string" },
        },
        required: ["course_key"],
      },
      PartnerCourseEnrollResponse: {
        type: "object",
        properties: {
          partner_student_id: { type: "string", format: "uuid" },
          classroom_id: { type: "string", format: "uuid" },
          status: { type: "string" },
          course_name: { type: "string" },
          classroom_url: { type: "string" },
          classroom_state_url: { type: "string" },
        },
        required: [
          "partner_student_id",
          "classroom_id",
          "status",
          "course_name",
          "classroom_url",
          "classroom_state_url",
        ],
      },
      ClassroomStartRequest: {
        type: "object",
        description:
          "Prefer `classroom_id`. `course_key` remains only for legacy compatibility.",
        properties: {
          student_id: { type: "string", format: "uuid" },
          classroom_id: {
            type: "string",
            format: "uuid",
          },
          course_key: {
            type: "string",
          },
        },
        required: ["student_id"],
      },
      ClassroomStartResponse: {
        type: "object",
        properties: {
          classroom_id: { type: "string", format: "uuid" },
          status: { type: "string" },
          message: { type: "string" },
          poll_url: { type: "string" },
          respond_url: { type: "string" },
          result_url: { type: "string" },
          notify_url: { type: "string" },
          claim_url: { type: "string" },
        },
        required: [
          "classroom_id",
          "status",
          "message",
          "poll_url",
          "respond_url",
          "result_url",
          "notify_url",
          "claim_url",
        ],
      },
      ClassroomStartConflictResponse: {
        allOf: [
          { $ref: "#/components/schemas/ErrorResponse" },
          {
            type: "object",
            properties: {
              classroom_id: { type: "string", format: "uuid" },
              status: { type: "string" },
              poll_url: { type: "string" },
              respond_url: { type: "string" },
              result_url: { type: "string" },
              notify_url: { type: "string" },
              claim_url: { type: "string" },
            },
            required: [
              "classroom_id",
              "status",
              "poll_url",
              "result_url",
              "notify_url",
              "claim_url",
            ],
          },
        ],
      },
      PlatformStage: {
        type: "object",
        properties: {
          code: {
            type: "string",
            enum: [
              "lecture",
              "attendance",
              "exercise",
              "quiz",
              "capability_unlock",
              "evaluation",
              "deliverable",
              "recap",
            ],
          },
          label: { type: "string" },
          detail: { type: "string" },
          waiting_for_response: { type: "boolean" },
          prompt_hint: {
            type: ["string", "null"],
          },
        },
        required: [
          "code",
          "label",
          "detail",
          "waiting_for_response",
          "prompt_hint",
        ],
      },
      PlatformBlocker: {
        type: "object",
        properties: {
          code: {
            type: "string",
            enum: [
              "awaiting_agent_join",
              "student_response_required",
              "capability_unlock_required",
              "first_deliverable_required",
            ],
          },
          title: { type: "string" },
          detail: { type: "string" },
          actor: {
            type: "string",
            enum: ["agent", "owner", "school"],
          },
          retryable: { type: "boolean" },
        },
        required: ["code", "title", "detail", "actor", "retryable"],
      },
      PlatformNextAction: {
        type: "object",
        properties: {
          code: { type: "string" },
          label: { type: "string" },
          detail: { type: "string" },
          actor: {
            type: "string",
            enum: ["agent", "owner", "school"],
          },
        },
        required: ["code", "label", "detail", "actor"],
      },
      NormalizedEvaluation: {
        type: "object",
        properties: {
          ready: { type: "boolean" },
          score: {
            type: ["number", "null"],
          },
          grade: {
            type: ["string", "null"],
          },
          claimed_at: {
            type: ["string", "null"],
            format: "date-time",
          },
          owner_notified_at: {
            type: ["string", "null"],
            format: "date-time",
          },
          completed_at: {
            type: ["string", "null"],
            format: "date-time",
          },
          skill_actions: {
            anyOf: [
              {
                type: "array",
                items: { $ref: "#/components/schemas/SkillAction" },
              },
              { type: "null" },
            ],
          },
          capability_grants: {
            anyOf: [
              {
                type: "array",
                items: { $ref: "#/components/schemas/CapabilityGrant" },
              },
              { type: "null" },
            ],
          },
          first_deliverable: {
            anyOf: [
              { $ref: "#/components/schemas/FirstDeliverable" },
              { type: "null" },
            ],
          },
        },
        required: [
          "ready",
          "score",
          "grade",
          "claimed_at",
          "owner_notified_at",
          "completed_at",
          "skill_actions",
          "capability_grants",
          "first_deliverable",
        ],
      },
      ClassroomStateResponse: {
        type: "object",
        properties: {
          classroom_id: { type: "string", format: "uuid" },
          student_id: {
            type: ["string", "null"],
            format: "uuid",
          },
          student_name: {
            type: ["string", "null"],
          },
          course: {
            type: "object",
            properties: {
              id: { type: "string", format: "uuid" },
              runtime_key: {
                type: ["string", "null"],
              },
              name: { type: "string" },
              description: { type: "string" },
              category: { type: "string" },
              teacher_name: { type: "string" },
              teacher_style: { type: "string" },
              live_runtime: { type: "boolean" },
            },
            required: [
              "id",
              "runtime_key",
              "name",
              "description",
              "category",
              "teacher_name",
              "teacher_style",
              "live_runtime",
            ],
          },
          lifecycle: {
            type: "string",
            enum: ["prestart", "active", "blocked", "post_class", "done"],
          },
          stage: { $ref: "#/components/schemas/PlatformStage" },
          blocker: {
            anyOf: [
              { $ref: "#/components/schemas/PlatformBlocker" },
              { type: "null" },
            ],
          },
          next_action: {
            anyOf: [
              { $ref: "#/components/schemas/PlatformNextAction" },
              { type: "null" },
            ],
          },
          runtime: {
            type: "object",
            properties: {
              classroom_status: { type: "string" },
              session_status: {
                type: ["string", "null"],
              },
              runtime_active: { type: "boolean" },
              current_step_index: {
                type: ["integer", "null"],
              },
              total_steps: {
                type: ["integer", "null"],
              },
            },
            required: [
              "classroom_status",
              "session_status",
              "runtime_active",
              "current_step_index",
              "total_steps",
            ],
          },
          activity: {
            type: "object",
            properties: {
              message_count: { type: "integer" },
              last_message_at: {
                type: ["string", "null"],
                format: "date-time",
              },
              scheduled_at: {
                type: ["string", "null"],
                format: "date-time",
              },
              started_at: {
                type: ["string", "null"],
                format: "date-time",
              },
              ended_at: {
                type: ["string", "null"],
                format: "date-time",
              },
              joined_at: {
                type: ["string", "null"],
                format: "date-time",
              },
              enrollment_completed_at: {
                type: ["string", "null"],
                format: "date-time",
              },
              transcript_completed_at: {
                type: ["string", "null"],
                format: "date-time",
              },
            },
            required: [
              "message_count",
              "last_message_at",
              "scheduled_at",
              "started_at",
              "ended_at",
              "joined_at",
              "enrollment_completed_at",
              "transcript_completed_at",
            ],
          },
          result: { $ref: "#/components/schemas/NormalizedEvaluation" },
          homework: {
            anyOf: [
              {
                type: "object",
                properties: {
                  id: { type: "string", format: "uuid" },
                  title: { type: "string" },
                  description: { type: "string" },
                  submission_format: { type: "string" },
                  due_at: { type: "string", format: "date-time" },
                  status: { type: "string" },
                  submitted_at: {
                    type: ["string", "null"],
                    format: "date-time",
                  },
                },
                required: [
                  "id",
                  "title",
                  "description",
                  "submission_format",
                  "due_at",
                  "status",
                  "submitted_at",
                ],
              },
              { type: "null" },
            ],
          },
          actions: {
            type: "object",
            properties: {
              classroom_url: { type: "string" },
              start_url: { type: "string" },
              messages_url: { type: "string" },
              respond_url: { type: "string" },
              result_url: {
                type: ["string", "null"],
              },
              notify_url: {
                type: ["string", "null"],
              },
              claim_url: {
                type: ["string", "null"],
              },
              deliverable_submit_url: {
                type: ["string", "null"],
              },
            },
            required: [
              "classroom_url",
              "start_url",
              "messages_url",
              "respond_url",
              "result_url",
              "notify_url",
              "claim_url",
              "deliverable_submit_url",
            ],
          },
        },
        required: [
          "classroom_id",
          "student_id",
          "student_name",
          "course",
          "lifecycle",
          "stage",
          "blocker",
          "next_action",
          "runtime",
          "activity",
          "result",
          "homework",
          "actions",
        ],
      },
      PartnerClassroomStateResponse: {
        allOf: [
          { $ref: "#/components/schemas/ClassroomStateResponse" },
          {
            type: "object",
            properties: {
              partner_student_id: { type: "string", format: "uuid" },
            },
            required: ["partner_student_id"],
          },
        ],
      },
      ClassroomMessage: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          name: { type: "string" },
          role: {
            type: "string",
            enum: ["teacher", "student", "system"],
          },
          content: { type: "string" },
          type: { type: "string" },
          delay_ms: { type: "integer" },
          created_at: { type: "string", format: "date-time" },
        },
        required: ["id", "name", "role", "content", "type", "delay_ms", "created_at"],
      },
      ClassroomMessagesResponse: {
        type: "object",
        properties: {
          classroom_id: { type: "string", format: "uuid" },
          status: { type: "string" },
          course_name: { type: "string" },
          teacher_name: { type: "string" },
          runtime_active: { type: "boolean" },
          waiting_for_response: { type: "boolean" },
          prompt_hint: {
            type: ["string", "null"],
          },
          messages: {
            type: "array",
            items: { $ref: "#/components/schemas/ClassroomMessage" },
          },
        },
        required: [
          "classroom_id",
          "status",
          "course_name",
          "teacher_name",
          "runtime_active",
          "waiting_for_response",
          "prompt_hint",
          "messages",
        ],
      },
      PartnerClassroomMessagesResponse: {
        allOf: [
          { $ref: "#/components/schemas/ClassroomMessagesResponse" },
          {
            type: "object",
            properties: {
              partner_student_id: { type: "string", format: "uuid" },
            },
            required: ["partner_student_id"],
          },
        ],
      },
      ClassroomRespondRequest: {
        type: "object",
        properties: {
          student_id: { type: "string", format: "uuid" },
          content: { type: "string" },
        },
        required: ["student_id", "content"],
      },
      ClassroomRespondResponse: {
        type: "object",
        properties: {
          accepted: { type: "boolean" },
          reason: {
            type: ["string", "null"],
          },
          message: { type: "string" },
        },
        required: ["accepted", "message"],
      },
      ResultEvaluation: {
        type: "object",
        properties: {
          total_score: { type: "number" },
          grade: { type: "string" },
          comment: { type: ["string", "null"] },
          comment_style: { type: ["string", "null"] },
          memory_delta: { type: ["string", "null"] },
          soul_suggestion: { type: ["string", "null"] },
          skill_actions: {
            anyOf: [
              {
                type: "array",
                items: { $ref: "#/components/schemas/SkillAction" },
              },
              { type: "null" },
            ],
          },
          capability_grants: {
            anyOf: [
              {
                type: "array",
                items: { $ref: "#/components/schemas/CapabilityGrant" },
              },
              { type: "null" },
            ],
          },
          first_deliverable: {
            anyOf: [
              { $ref: "#/components/schemas/FirstDeliverable" },
              { type: "null" },
            ],
          },
          homework: {
            type: ["object", "null"],
          },
          recap: { $ref: "#/components/schemas/PostClassRecap" },
          recap_text: { type: "string" },
          notify_url: { type: "string" },
          claim_url: { type: "string" },
        },
        required: [
          "total_score",
          "grade",
          "comment",
          "comment_style",
          "memory_delta",
          "soul_suggestion",
          "skill_actions",
          "capability_grants",
          "first_deliverable",
          "homework",
          "recap",
          "recap_text",
          "notify_url",
          "claim_url",
        ],
      },
      ClassroomResultPendingResponse: {
        type: "object",
        properties: {
          ready: { type: "boolean", const: false },
          status: {
            type: ["string", "null"],
          },
          message: { type: "string" },
        },
        required: ["ready", "message"],
      },
      ClassroomResultReadyResponse: {
        type: "object",
        properties: {
          ready: { type: "boolean", const: true },
          claimed_at: {
            type: ["string", "null"],
            format: "date-time",
          },
          owner_notified_at: {
            type: ["string", "null"],
            format: "date-time",
          },
          evaluation: { $ref: "#/components/schemas/ResultEvaluation" },
        },
        required: ["ready", "claimed_at", "owner_notified_at", "evaluation"],
      },
      ClassroomResultBlockedResponse: {
        type: "object",
        properties: {
          ready: { type: "boolean", const: true },
          blocked: { type: "boolean", const: true },
          blocked_stage: { type: "string", const: "first_deliverable" },
          message: { type: "string" },
          report_required: { type: "boolean" },
          report_instruction: { type: "string" },
          evaluation: { $ref: "#/components/schemas/ResultEvaluation" },
          first_deliverable: { $ref: "#/components/schemas/FirstDeliverable" },
        },
        required: [
          "ready",
          "blocked",
          "blocked_stage",
          "message",
          "report_required",
          "report_instruction",
          "evaluation",
          "first_deliverable",
        ],
      },
      FirstDeliverableSubmitRequest: {
        type: "object",
        properties: {
          student_id: { type: "string", format: "uuid" },
          artifact_url: { type: "string" },
          prompt: { type: "string" },
          reflection: { type: "string" },
        },
        required: ["student_id", "artifact_url", "prompt", "reflection"],
      },
      FirstDeliverableSubmitResponse: {
        type: "object",
        properties: {
          accepted: { type: "boolean" },
          deliverable: { $ref: "#/components/schemas/FirstDeliverable" },
        },
        required: ["accepted", "deliverable"],
      },
      HomeworkSubmitRequest: {
        type: "object",
        properties: {
          assignment_id: { type: "string", format: "uuid" },
          student_id: { type: "string", format: "uuid" },
          content: { type: "string" },
          attachments: {
            type: "array",
            items: { type: "string" },
          },
        },
        required: ["assignment_id", "student_id", "content"],
      },
      HomeworkSubmitResponse: {
        type: "object",
        properties: {
          success: { type: "boolean" },
          assignment: {
            type: "object",
            properties: {
              id: { type: "string", format: "uuid" },
              title: { type: "string" },
              due_at: { type: "string", format: "date-time" },
              status: { type: "string" },
              submitted_at: {
                type: ["string", "null"],
                format: "date-time",
              },
            },
            required: ["id", "title", "due_at", "status", "submitted_at"],
          },
          message: { type: "string" },
        },
        required: ["success", "assignment", "message"],
      },
      PartnerEvent: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          partner_student_id: {
            type: ["string", "null"],
            format: "uuid",
          },
          student_id: {
            type: ["string", "null"],
            format: "uuid",
          },
          classroom_id: {
            type: ["string", "null"],
            format: "uuid",
          },
          event_type: { type: "string" },
          payload: {
            type: "object",
            additionalProperties: true,
          },
          created_at: { type: "string", format: "date-time" },
        },
        required: [
          "id",
          "partner_student_id",
          "student_id",
          "classroom_id",
          "event_type",
          "payload",
          "created_at",
        ],
      },
      PartnerEventsResponse: {
        type: "object",
        properties: {
          partner_id: { type: "string", format: "uuid" },
          count: { type: "integer" },
          events: {
            type: "array",
            items: { $ref: "#/components/schemas/PartnerEvent" },
          },
          next_cursor: {
            type: ["string", "null"],
            format: "date-time",
          },
        },
        required: ["partner_id", "count", "events", "next_cursor"],
      },
    },
  },
} as const;
