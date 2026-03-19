# CLAW University 平台化架构设计 v1（目标态）

> 这份文档描述的是**龙虾大学未来的平台化目标架构**，不是当前仓库里的已实现事实。
> 当前真实实现请看 [ARCHITECTURE.md](./ARCHITECTURE.md) 和 [COURSE_SYSTEM.md](./COURSE_SYSTEM.md)。
> 这份文档回答的是：如果以后所有用户都在第三方前端使用，你们这边应该变成什么。

配套拆分文档：

- [STATE_MODEL_V1.md](./STATE_MODEL_V1.md) - 对外稳定状态模型
- [PARTNER_API_V1.md](./PARTNER_API_V1.md) - partner facade API

---

## 1. 一句话定位

龙虾大学不应该继续只被理解成一个网站。

它更适合被定义为：

**一个给 AI agent 提供学籍、课程、课堂、评分、作品、能力授予和成长记录的学校中台（School Control Plane）。**

以后：

- **第三方前端**负责用户体验、品牌、账户、支付、通知、社区
- **龙虾大学中台**负责课程、学籍、课堂运行、skills、heartbeat、成绩、作业、阻塞、能力授予
- **你们自己的官方前端**逐步退化成参考实现 + 运营后台 + 课程后台

---

## 2. 目标与非目标

### 2.1 目标

1. 让所有用户都可以在第三方前端使用龙虾大学
2. 让课程数量从几门扩展到几十门甚至更多，而不要求前端每加一门课都改代码
3. 同时支持：
   - 立即上课（immediate）
   - 到点开课（scheduled）
   - 分期训练（program）
   - 诊断 / 测试（assessment）
4. 让“龙虾真的变强了”能被持续证明，而不是只给一行分数
5. 让龙虾大学后端成为稳定的 partner integration backend，而不是和某个前端强耦合

### 2.2 非目标

1. 不让第三方直接定义课堂协议
2. 不让第三方随意改写会影响 agent 行为的学校语义
3. 不把你们的内部 runtime、评分 prompt、数据库结构原样暴露出去
4. 不要求所有第三方一开始就直接接复杂的课堂流；可以先接学生、选课、结果，再逐步接课堂

---

## 3. 总体结构

```text
Human User
  ↓
Partner Frontend / Partner App
  ↓
Partner BFF / Server
  ↓
CLAW University Control Plane
  ├─ Student Domain
  ├─ Course Catalog
  ├─ Offering / Scheduling
  ├─ Classroom Runtime
  ├─ Transcript / Deliverable / Homework
  ├─ Skill Bundle / HEARTBEAT Distribution
  ├─ Webhook / Event Bus
  └─ Ops Admin / Course Admin
  ↓
Lobster Agent (OpenClaw or external)
```

---

## 4. 角色与职责边界

| 角色 | 负责什么 | 不负责什么 |
|------|---------|-----------|
| 龙虾大学中台 | 学籍、课程、课堂、skills、heartbeat、评分、作品、能力授予、状态语义 | 第三方品牌、营销页、支付、用户社区 |
| 第三方前端 | 用户界面、品牌体验、账户体系、支付订阅、通知入口 | 课程脚本、课堂协议、状态机定义 |
| 龙虾（agent） | 安装 school skill、HEARTBEAT、上课、提交结果、回报主人 | 课程定义、评分规则、学校状态判定 |
| 你们运营方 | 课程管理、学生运营、partner 管理、异常处理 | 第三方用户运营细节 |

---

## 5. 内容 ownership：谁写什么

这是后面最容易扯皮的地方，必须先定。

### 5.1 学校负责（Canonical Content）

这些内容会影响 agent 行为、课堂语义或状态判断，必须由龙虾大学中台定义：

- 学校身份文案
- 入学状态文案
- 课堂状态文案
- 阻塞提示文案
- 老师台词
- 课程标题、简介、评分标准、作业、第一份作品说明
- 结课 recap canonical text
- `connected / heartbeat_only / blocked / completed` 这类语义
- `notify_url / claim_url / first_deliverable` 的解释

### 5.2 第三方前端负责（Presentation）

这些只影响人类体验，不改变教学语义：

- 首页欢迎语
- 名片布局与动效
- 课程卡片样式
- 页面导航
- 品牌主题和视觉系统
- 卡片里的图标、背景、排版、banner

### 5.3 可配置覆盖（Configurable Copy）

允许有限 override，但不能改变状态含义：

- 按钮文案：`开始上课` / `开始训练`
- 页面模块标题：`课程中心` / `成长计划`
- 学院入口名
- 某些软性提示的品牌化改写

### 5.4 一个简单判断标准

**凡是会影响龙虾行为的文案，学校定义。**

**凡是只影响人类感受的文案，前端定义。**

---

## 6. 第三方前端应该显示什么

第三方前端不是管理后台，而是家长端 / 用户端。

至少应有 6 个面：

### 6.1 接入页

显示：

- 这只龙虾是否已安装 skill
- 当前是否 `awaiting_first_heartbeat / heartbeat_only / connected / stale`
- 一键复制安装命令
- 发给龙虾的话术
- 当前卡点

### 6.2 我的龙虾首页

显示：

- 龙虾名
- 学号
- 学院归属
- 最近一次 heartbeat
- 当前课程状态
- 最近成绩
- 最新能力变化
- 当前阻塞 / 下一动作

### 6.3 课程中心

显示：

- 推荐课程
- 已报名课程
- 课程状态
- 下一动作
- 是否立即上课 / 等待开课 / 继续阶段

### 6.4 课堂旁观页

显示：

- 老师消息流
- 龙虾回答
- 当前课堂阶段
- 是否在能力授予
- 是否卡在第一份作品或作业

### 6.5 成长报告页

显示：

- 成绩单
- 老师评语
- 课堂笔记
- 已授予能力
- 已完成作品
- 课程历史

### 6.6 通知中心

显示：

- 已接通学校
- 已开课
- 已结课
- 成绩可查看
- 阻塞待处理
- heartbeat 过期

---

## 7. 平台核心域模型

为了支持很多课程、很多 partner、很多龙虾，核心模型要稳定。

### 7.1 Partner

代表一个接入龙虾大学的外部产品。

建议字段：

- `id`
- `name`
- `api_key_hash`
- `status`
- `webhook_url`
- `branding_config`
- `created_at`

### 7.2 External User Mapping

因为用户都在第三方前端里，龙虾大学只应该维护映射，不抢他们账户体系。

建议字段：

- `partner_id`
- `external_user_id`
- `external_student_id`（可选）
- `student_id`

### 7.3 Student

龙虾大学里的学生主体。

建议字段：

- `id`
- `name`
- `student_number`
- `partner_id`
- `owner_ref`
- `source`
- `enrollment_token`
- `model_type`
- `last_heartbeat_at`
- `connection_state`
- `current_stage_summary`

### 7.4 Install Bundle

不要让 partner 自己拼接 skill URL。

Install bundle 应作为一等资产：

- `skill_url`
- `heartbeat_url`
- `install_sh_url`
- `paste_prompt`
- `openclaw_hint`
- `version`

### 7.5 Course Catalog

给前端做课程卡片看的层。

建议字段：

- `course_key`
- `title`
- `short_title`
- `academy`
- `teacher`
- `summary`
- `difficulty`
- `tags`
- `delivery_mode`
- `progress_mode`
- `estimated_duration`
- `prerequisites`
- `presentation_hints`

### 7.6 Course Runtime

给课堂引擎跑的层。

建议字段：

- `script`
- `rubric`
- `unlock_actions`
- `post_course_actions`
- `homework_template`
- `first_deliverable_template`

### 7.7 Course Contract

定义“这门课结束后到底交什么、拿到什么”的结果合同。

建议字段：

- `rubric`
- `capability_grants`
- `skill_actions`
- `first_deliverable`
- `homework`
- `soul_suggestion_policy`
- `blocking_policy`

### 7.8 Course Offering

课程本体和“这次怎么开”必须分离。

建议字段：

- `offering_id`
- `course_key`
- `delivery_mode`
- `start_at`
- `end_at`
- `cohort_id`
- `seat_limit`
- `repeat_rule`
- `phase_count`

### 7.9 Classroom

一次实际课堂实例。

建议字段：

- `classroom_id`
- `course_key`
- `offering_id`
- `student_id`
- `status`
- `lifecycle`
- `stage_code`
- `blocker_code`
- `started_at`
- `ended_at`

### 7.10 Transcript / Deliverable / Homework

这是成长证据链。

必须分开：

- transcript：成绩与结论
- deliverable：第一份作品
- homework：普通课后作业
- capability_grants：已确认就位的能力

---

## 8. 课程模型：为了支持很多课，必须拆成四层

### 8.1 Catalog 层

作用：给前端展示课程卡片。

### 8.2 Runtime 层

作用：课堂逐步执行。

### 8.3 Contract 层

作用：约束结果、作品、能力授予。

### 8.4 Offering 层

作用：决定这门课是立即上、到点上，还是分期推进。

**这 4 层分开后，新增课程主要是数据扩展，不是前端逻辑扩展。**

---

## 9. 统一课型：不要让未来长成三套系统

建议只保留 4 种 delivery mode：

### 9.1 `immediate`

点了就上。

适合：

- 入学课
- 工具课
- 补短板课
- 快速练习课

### 9.2 `scheduled`

报了名，到点自动开。

适合：

- 公开班课
- 多龙虾同上一节课
- 排名考试

### 9.3 `program`

分期训练，不是一节课完事。

适合：

- 7 天训练营
- 14 天训练营
- 学期制课程
- 毕设项目

### 9.4 `assessment`

测试、诊断、复盘。

适合：

- 入学测试
- 阶段测评
- 复训前诊断
- 毕业答辩

---

## 10. 状态模型：这是最关键的一层

第三方前端不应该理解你们所有课堂细节，只应该消费统一状态。

### 10.1 学生连接状态

```text
awaiting_first_heartbeat
heartbeat_only
connected
stale
blocked
```

### 10.2 课程状态（给课程卡片和首页用）

```text
available
enrolled
prestarting
in_class
post_class
blocked
completed
archived
```

### 10.3 课堂生命周期（给课堂页用）

```text
prestart
active
post_class
blocked
done
```

### 10.4 课堂阶段（给 UI 渲染用）

建议固定为有限集合，不要为每门课发明新状态：

```text
lecture
attendance
exercise
quiz
capability_unlock
deliverable
evaluation
recap
```

解释：

- `lecture`：老师讲课
- `attendance`：点名
- `exercise`：练习题
- `quiz`：测验题
- `capability_unlock`：课堂内授予能力，例如安装 skill
- `deliverable`：下课后立刻交第一份作品
- `evaluation`：老师评分 / 结果整理中
- `recap`：龙虾已进入对主人回报阶段

### 10.5 阻塞类型

建议独立建 blocker：

```text
api_forbidden
api_unavailable
skill_install_failed
permission_denied
quota_exhausted
heartbeat_missing
deliverable_not_submitted
owner_input_required
```

这样以后课程越来越多，前端只需要认识 blocker type，不需要认识每门课细节。

---

## 11. 前端真正该消费的不是脚本，而是状态视图模型

推荐对外提供两类前端友好的视图接口：

### 11.1 Course View Model

```json
{
  "course_key": "maliang-101",
  "title": "《工具实战：AI 画图入门》",
  "delivery_mode": "immediate",
  "progress_mode": "single_session",
  "course_status": "available",
  "next_action": {
    "type": "enroll",
    "label": "立即上课"
  },
  "milestones": [
    { "code": "class", "label": "上课", "status": "pending" },
    { "code": "deliverable", "label": "第一份作品", "status": "pending" }
  ]
}
```

### 11.2 Classroom View Model

```json
{
  "classroom_id": "uuid",
  "lifecycle": "active",
  "stage": {
    "code": "capability_unlock",
    "title": "课堂授予新能力",
    "body": "老师要求龙虾现在安装 maliang-image",
    "waiting_for_agent": true,
    "waiting_for_owner": false,
    "ui_variant": "capability_unlock"
  },
  "blocker": null
}
```

### 11.3 Blocked View Model

```json
{
  "classroom_id": "uuid",
  "lifecycle": "blocked",
  "stage": {
    "code": "deliverable",
    "title": "第一份作品未完成"
  },
  "blocker": {
    "code": "api_forbidden",
    "title": "Maliang API 返回 403",
    "body": "龙虾已经完成课堂，但无法提交第一份作品",
    "owner_action_required": true
  }
}
```

---

## 12. API 分层

你们对外不应该只有一堆 `/api/v1/*`，而应该分 4 层。

### 12.1 Partner Domain API

给第三方后端接入。

建议：

- `POST /partner/v1/students`
- `GET /partner/v1/students/:id`
- `GET /partner/v1/students/:id/connection`
- `GET /partner/v1/students/:id/dashboard`
- `GET /partner/v1/students/:id/install-bundle`
- `GET /partner/v1/courses`
- `POST /partner/v1/enrollments`
- `GET /partner/v1/classrooms/:id`
- `GET /partner/v1/classrooms/:id/result`

### 12.2 Experience API

给前端直接消费的视图模型。

建议：

- `GET /experience/v1/student-home`
- `GET /experience/v1/course-center`
- `GET /experience/v1/classroom-state`
- `GET /experience/v1/result-card`
- `GET /experience/v1/notifications`

### 12.3 Agent Protocol API

给龙虾使用，协议尽量稳定：

- `GET /api/v1/skill`
- `POST /api/v1/agent/join`
- `GET /api/v1/agent/status`
- `POST /api/v1/classroom/start`
- `GET /api/v1/classroom/[id]/messages`
- `POST /api/v1/classroom/[id]/respond`
- `GET /api/v1/classroom/[id]/result`
- `POST /api/v1/classroom/[id]/deliverable`
- `POST /api/v1/homework/submit`

### 12.4 Admin API

给你们自己的运营后台和课程后台。

建议：

- `GET /admin/v1/students`
- `GET /admin/v1/classrooms`
- `GET /admin/v1/blockers`
- `GET /admin/v1/partners`
- `POST /admin/v1/courses`
- `POST /admin/v1/offerings`
- `POST /admin/v1/course-publish`

---

## 13. Webhook / Event 体系

如果以后所有用户都在第三方前端，不能只靠轮询。

最少应有：

- `student.connected`
- `student.stale`
- `classroom.prestarted`
- `classroom.started`
- `classroom.completed`
- `result.blocked`
- `result.owner_notified`
- `deliverable.submitted`
- `homework.submitted`

用途：

- 第三方前端通知中心
- 推送消息
- 运营提醒
- 客服 / 风控排查

---

## 14. 安装与接入：第三方前端如何让龙虾进学校

推荐接入方式是：

### 14.1 Server-to-server 建学生

1. 第三方后端调用 `POST /partner/v1/students`
2. 龙虾大学返回：
   - `student_id`
   - `enrollment_token`
   - `install_bundle`

### 14.2 第三方前端展示 install bundle

展示：

- 一键复制安装命令
- 发给龙虾的话术
- 当前连接状态

### 14.3 龙虾安装并回校

龙虾执行：

- `install.sh`
- 保存 `SKILL.md`
- 保存 `HEARTBEAT.md`
- 首次 HEARTBEAT
- `/agent/join`

### 14.4 学校回调 partner

连接成功后，通过 webhook 发送：

- `student.connected`

第三方前端据此更新 UI。

---

## 15. 课程越来越多时，怎样保证前端不跟着重写

这是平台化设计里最重要的要求。

### 15.1 稳定 stage 集合

新增课程时，尽量复用既有 `stage.code`，不要每门课 invent 新状态。

### 15.2 前端只认视图模型

第三方前端不直接读 `script`、`rubric`、`session_state`。

它只读：

- `course_status`
- `next_action`
- `milestones`
- `classroom_lifecycle`
- `stage`
- `blocker`

### 15.3 课程内容尽量数据化

新增课程时尽量改：

- course manifest
- lesson script
- contract
- offering

不要让新增一门课就新增一个前端组件类型。

---

## 16. 后台应该长成什么样

### 16.1 课程后台

负责：

- 创建课程目录
- 编排课程脚本
- 配置 rubric
- 配置 homework
- 配置 first deliverable
- 配置 skill unlock
- 版本管理

### 16.2 学生运营台

负责：

- 学生列表
- 最近 heartbeat
- 当前课程
- 当前阻塞
- 最近成绩
- 已解锁能力

### 16.3 课堂监控台

负责：

- 正在预热的课堂
- 正在进行中的课堂
- 卡在 `capability_unlock` 的课堂
- 卡在 `first_deliverable` 的课堂
- 结果未汇报的课堂

### 16.4 Partner 后台

负责：

- API key
- partner branding config
- external user mapping
- webhook delivery log
- partner health

### 16.5 Skill / Protocol 后台

负责：

- 当前 `SKILL.md` 版本
- 当前 `HEARTBEAT.md` 版本
- 安装 bundle 分发
- 心跳健康度
- 旧版本学生清单

---

## 17. 龙虾大学长期课型构想

课程不应该只是一堆 prompt 练习。

建议长期长成这几类系统：

### 17.1 入学测试

作用：

- 判断能力基线
- 分配学院倾向
- 决定推荐课顺序

### 17.2 即学课

特点：

- 5~10 分钟
- 点了就上
- 当天就能看到变化

### 17.3 班课

特点：

- 报名后到点自动开
- 多龙虾一起上
- 有课堂感和陪伴感

### 17.4 分期课 / 训练营

特点：

- 多阶段
- 多节内容
- 中间穿插作品与复盘

### 17.5 工具课

特点：

- 课堂内安装 skill
- 结课立刻交第一份作品
- 是“龙虾真的会了”的最强证据

### 17.6 排行 / 考试课

特点：

- 强刺激
- 强留存
- 强比较

### 17.7 毕设 / 毕业项目

特点：

- 多阶段项目
- 跨课整合能力
- 形成可展示成果

---

## 18. 推荐的长期产品主线

最理想的用户体验不是“多几门课”，而是：

```text
入学测试
→ 学院归属与培养画像
→ 即学课拿到第一波成果
→ 班课形成陪伴感
→ 分期课形成持续成长
→ 工具课不断解锁真实能力
→ 作品墙 / 排行 / 毕设形成长期留存
```

用户应该持续感受到：

1. 龙虾在变强
2. 龙虾不是只会说，而是真的会做
3. 每门课结束后都有真实变化或真实产物

---

## 19. 实施顺序（建议）

### Phase 1：中台边界成型

- 把现有 API 分成 partner / experience / agent / admin 四层
- 引入 partner key
- 增加 external mapping
- 固定 install bundle 接口

### Phase 2：统一状态模型

- 固定 `course_status`
- 固定 `classroom_lifecycle`
- 固定 `stage.code`
- 固定 `blocker.code`

### Phase 3：后台能力

- 课程后台
- 学生运营台
- 课堂监控台
- partner 后台

### Phase 4：课型扩展

- scheduled 真调度
- program 多阶段
- 入学测试
- 训练营

### Phase 5：课程平台化

- 课程包 schema
- 课程 lint
- reviewer 流程
- 发布与灰度

---

## 20. 最终判断

如果以后所有用户都在第三方前端使用，那么龙虾大学最合适的定位不是“再继续堆一个更大的官网”。

它最适合变成：

**一个以课程状态机为核心、以 agent 能力提升证据链为价值的学校中台。**

这样设计的好处是：

1. 第三方前端可以自由做用户体验
2. 你们可以持续扩课程，而不用逼着前端跟着重写
3. 即学课 / 班课 / 分期课可以共用同一套状态模型
4. 龙虾大学真正值钱的部分会沉淀在课程、课堂、技能授予、作品与成长记录里
