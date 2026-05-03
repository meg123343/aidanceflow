# AIDanceFlow

AIDanceFlow 是一款面向普通 KOC 的热点手势舞开拍 Agent。它把“刷到热门内容”之后最难的几步串成一个闭环：AI 选题、动作拆解、领拍参考生成、手机化练习录制、成片回放和发布建议，帮助创作者低成本追上社媒热点。


## 当前 Demo 能力

- 热点趋势首页：展示 3 条适合跟拍的手势舞趋势，包含热度增长、适合拍评分、难度和标签。
- 卡片预览与开拍：卡片可预览原作品，点击后进入“解析中”流程，再确认进入拍摄页。
- 趋势拆解：输出爆点、光线、镜头、发布时间、评论互动建议和分段动作说明。
- 链接导入：支持粘贴参考作品链接或选择本地参考视频，进入动作识别和领拍生成流程。
- AI 生成编舞：输入想要的风格、参考视频说明和 BGM 说明，生成或兜底展示一版可跟拍动作。
- 手机化练习页：模拟竖屏短视频相机，支持领拍小窗、练习倍速、镜像、节拍/骨架引导、录制、回放和保存 WebM。
- 发布建议：成片后给出标题方向、发布时间和评论互动钩子，让作品不只“拍完”，还知道怎么发。

为保证录屏演示能看清流程，开拍/导入/生成后的“解析中”状态会至少停留约 3 秒；如果线上生成更慢，则继续等待真实结果或兜底方案。

## 用户价值

普通 KOC 面对热点内容时常见三类障碍：

- 不知道今天拍什么，也不知道哪个热点适合自己。
- 热门动作节奏快，无法快速拆成可练习的步骤。
- 拍完不知道标题、标签、发布时间和评论区话术怎么设计。

AIDanceFlow 的产品思路是把“选题判断”和“内容生产”放在同一条路径里。用户不需要理解复杂投放或运营指标，只需要完成：选一条趋势、看懂怎么拍、跟着领拍练习、拿到发布建议。

## 技术栈

- React 19 + TypeScript
- Vite
- Tailwind CSS
- motion
- lucide-react
- MediaPipe Pose
- MediaRecorder API
- Express 本地代理 / Vercel Serverless API
- GitHub Pages 静态网页发布

## AI 能力设计

当前 Demo 已经预留真实 AI 管线：

- 趋势分析：大模型分析热点、标题、标签、发布时间和互动话术。
- 视频理解：识别人物动作、节奏、手部细节和镜头特点。
- 姿态估计：MediaPipe Pose 用于练习过程中的骨架匹配和反馈。
- AIGC 领拍：通过可灵 image2video / omni-video / motion-control 生成竖屏动作参考。
- 发布策略生成：围绕平台、时间段、评论钩子生成可执行运营建议。

演示时如果线上 API 排队、失败或耗时较长，系统会回落到本地示例动作，保证流程完整。


## 本地运行

安装依赖：

```bash
npm install
```

启动前端：

```bash
npm run dev
```

访问：

```text
http://localhost:3000
```

Windows 如果遇到 PowerShell 执行策略拦截，可以使用：

```bash
npm.cmd install
npm.cmd run dev
```

##  API 接入

复制 `.env.example` 为 `.env`，填写服务端密钥：

```bash
KLING_BASE_URL="https://api-beijing.klingai.com"
KLING_ACCESS_KEY="YOUR_KLING_ACCESS_KEY"
KLING_SECRET_KEY="YOUR_KLING_SECRET_KEY"
KLING_PROXY_PORT="8787"
KLING_PROXY_TARGET="http://localhost:8787"
```

本地同时启动代理和前端：

```bash
npm.cmd run dev:all
```

也可以分开启动：

```bash
npm.cmd run dev:api
npm.cmd run dev
```

