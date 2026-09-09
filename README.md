# 跃动七周年创作活动 · 战力排行榜（恶搞）

一个**非官方、纯玩梗、全程剧透**的同人统计页面：把 38 篇征文的角色抽出来，按「战力等级」排个座次，
顺手统计了结局、击杀与死亡人数。

> ⚠️ 本页与活动主办方及任何作者无关；不评价作品与作者，只对角色、设定和统计口径开玩笑。
> 页面包含结局与死亡信息，请先读完原作再往下看。

## 在线访问

<https://renko6662.github.io/c156-power-ranking/>

## 技术栈

- **Vue 3**（`<script setup>` 单文件组件）+ **Vite 6**
- 数据以静态 JSON 形式随站点一起部署，页面运行时 `fetch` 加载，无需后端
- 由 GitHub Actions 自动构建并发布到 GitHub Pages

## 目录结构

```
.
├── index.html
├── vite.config.js            # base: './'，产物可挂在任意子路径
├── src/
│   ├── main.js
│   ├── App.vue               # 页面骨架：标签页、搜索、统计口径说明
│   ├── style.css             # 深色主题
│   ├── lib/format.js         # 等级/结局/击杀的展示格式化
│   └── components/
│       ├── DataTable.vue     # 通用可排序表格
│       └── AwardsPanel.vue   # 恶搞奖项 + 跨作品角色对照
├── public/data/ranking.json  # 站点数据（派生统计，不含原文与作者昵称）
└── scripts/export_public_data.py  # 从上游统计结果生成 ranking.json
```

## 本地开发

```bash
npm install
npm run dev      # 开发服务器
npm run build    # 产物输出到 dist/
npm run preview  # 预览构建产物
```

### 冒烟测试（无浏览器环境）

CI/服务器上没有浏览器时，可以用 jsdom 真实执行页面并断言渲染结果：

```bash
npm install --no-save jsdom
npx vite build --config vite.config.smoke.js
sed -i 's|<script type="module" crossorigin src=|<script src=|' dist-smoke/index.html
npx http-server dist-smoke -p 8933 &   # 或 python3 -m http.server 8933
node scripts/smoke_test.mjs http://127.0.0.1:8933/
```

断言内容：Vue 挂载、表格行数、标签页数量、统计卡片、首行角色、免责声明、零 JS 错误。
（jsdom 不支持 `<script type="module">`，所以测试用的是 IIFE 产物。）

## 部署

当前走 `gh-pages` 分支（`gh` 的 OAuth token 没有 `workflow` scope，无法推送 Actions 工作流）：

```bash
bash scripts/deploy_gh_pages.sh
```

若之后执行过 `gh auth refresh -s workflow`，可把 `docs/deploy-workflow.yml.example`
移回 `.github/workflows/deploy.yml`，改用 Actions 自动构建。

## 数据说明

页面数据只包含**派生统计**：

- 角色名、角色定位、战力等级与分值、结局、击杀计数（L1 亲手 / L2 间接 / L3 范围量级）、
  以及我们自己的吐槽
- 作品名、分类、每篇的死亡量级与人数统计

**不包含**：作品原文、原文引文、作者昵称。

### 统计口径

| 概念 | 含义 |
| --- | --- |
| **L1 直接击杀** | 正文当场、指名、由该角色亲手造成的死亡 |
| **L2 间接击杀** | 下令、批准、设局、放任，或自己的造物/武器代劳 |
| **L3 范围杀伤** | 群体死亡，无法归到具体人头，**只给量级标签，不编数字** |
| **T0–T7** | 论外·元叙事 → 创世·灭世 → 神级·不死 → 超凡·屠城 → 高手 → 凡人 → 炮灰 → 非战斗单位 |
| **`-∞`** | 死于自己之手（自杀/自我牺牲）；自愿被他人杀死不算，另记 `consented` |

无战斗作品也参与总排名：T7 非战斗单位按「概念杀伤潜力」0–19 分计，
所以「时间」这种概念可能排在某个持枪士兵前面。

## 数据来源与免责

数据由本地脚本从征文文本中抽取并逐条校验（引文可回溯、分值区间校验），
页面只发布聚合结果。若权利人认为本页有不妥之处，可通过仓库 issue 联系删除。
