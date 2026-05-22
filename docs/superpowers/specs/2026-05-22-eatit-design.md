# Design Doc: 你必须得吃这个！

## Product Overview

A WeChat Mini Program that solves "what to eat" indecision with a deadpan, coercive twist. Users add foods or search nearby restaurants, draw one at random, and if they dare ask for a re-draw, the button starts jumping around the screen until they give up and accept their fate.

**Tech**: WeChat native framework + TypeScript. Minimalist, cold visual style.

---

## Architecture

### Page Structure (3 pages)

| Page | Responsibility |
|------|---------------|
| `pages/index/index` | Home: dual-mode tabs, food list management, nearby search config, draw entry |
| `pages/result/result` | Result display, jumping button chaos, terminal state |
| (nearby content lives inside index tab — no separate page needed) |

### Data Flow

```
wx.Storage  ←→  index (add/delete foods)  →  navigateTo  →  result (display + rage interaction)
                                          ↗
Tencent Map POI API (optional, needs key)
```

### Project File Structure

```
eatit/
├── app.ts
├── app.json
├── app.wxss
├── pages/
│   ├── index/
│   │   ├── index.ts
│   │   ├── index.wxml
│   │   └── index.wxss
│   └── result/
│       ├── result.ts
│       ├── result.wxml
│       └── result.wxss
├── utils/
│   ├── storage.ts
│   ├── picker.ts
│   └── map.ts
├── types/
│   └── index.ts
└── project.config.json
```

---

## Data Model

### Local Storage

**Key: `food_list`**
```typescript
type FoodItem = {
  id: string;        // Date.now().toString(36)
  name: string;
  createdAt: number;
};
// Stored as: { foods: FoodItem[] }
```

**Key: `draw_history`** (latest draw only)
```typescript
type DrawRecord = {
  result: string;    // "黄焖鸡米饭" or "肯德基(距300m)"
  source: 'custom' | 'nearby';
  timestamp: number;
};
```

### Draw Logic

- **Mode A (Custom)**: pick random from `foods[]` via `Math.random()`
- **Mode B (Nearby)**: `wx.getLocation` → Tencent POI search with `keyword: "美食"` + `radius` → pick random from results
- Store result in `draw_history` after each draw

---

## UI Design

### Global Style (Minimalist Cold)

- Background: `#FAFAFA` (light), transitioning to `#1A1A1A` (dark) in terminal state
- Primary accent: `#333` (text), `#666` (secondary), `#E0E0E0` (borders)
- Font: system sans-serif, large sizes for key text
- Corners: slight radius (8rpx) on buttons, clean lines

### Page: Index

```
┌─────────────────────────────┐
│   "你必须得吃这个！"  (title)  │
├─────────────────────────────┤
│  [我的菜单]    [附近随便找]    │  ← wx:if toggle
├─────────────────────────────┤
│  Tab A: 我的菜单             │
│  [输入框] [+ 添加]           │
│  [黄焖鸡] [麻辣烫] [沙县]     │  ← flow tags, tap to delete
│                             │
│  Tab B: 附近随便找           │
│  半径: [slider] 1km          │
│  "找到 23 家餐厅"            │
│  (no API key → placeholder) │
├─────────────────────────────┤
│    ┌───────────────────┐    │
│    │   决定命运的时刻    │    │  ← fixed bottom, disabled if <2 foods
│    └───────────────────┘    │
└─────────────────────────────┘
```

**Interactions**:
- Tab switch uses `wx:if`, no swiper needed
- Food tags: tap to delete with confirm modal
- Add food: input + button, trim whitespace, validate non-empty, deduplicate
- Nearby slider: debounce 500ms before API call
- "决定命运" button: draw based on current mode → `wx.navigateTo({ url: '/pages/result/result?source=custom&food=xxx' })` — pass the drawn result as query param

### Page: Result — State 1 (Initial)

```
┌─────────────────────────────┐
│                             │
│        "命运选择了"          │
│                             │
│      ┌─────────────┐        │
│      │  黄焖鸡米饭   │        │  ← scale-up entrance animation
│      └─────────────┘        │
│                             │
│    ┌───────────────────┐    │
│    │      去吃！        │    │  ← primary action
│    └───────────────────┘    │
│    ┌───────────────────┐    │
│    │    再抽一次        │    │  ← small, grey, secondary
│    └───────────────────┘    │
└─────────────────────────────┘
```

### Page: Result — State 2 (Button Chaos)

- Triggered when user taps "再抽一次"
- Button starts jumping to random screen positions via CSS `@keyframes`
- Jump interval: 400–700ms randomized
- Button shrinks 30%
- Keyframes regenerated after each animation iteration to keep positions unpredictable
- Implementation: JS dynamically injects `<style>` with new `@keyframes` each cycle

### Page: Result — State 3 (Terminal)

When user manages to tap the jumping button:

```
┌─────────────────────────────┐
│                             │
│         "点也没用"           │
│                             │
│      "你必须吃这个！"        │
│                             │
│    ┌───────────────────┐    │
│    │                   │    │
│    │    我 吃 ！        │    │  ← only button, full width
│    │                   │    │
│    └───────────────────┘    │
└─────────────────────────────┘
```

- Full dark overlay (`#1A1A1A` background)
- Single dismiss button → `wx.navigateBack()`

---

## Edge Cases & Degradation

| Scenario | Handling |
|----------|----------|
| Food list empty | "决定命运" disabled, placeholder: "先加点吃的吧" |
| Only 1 food | Button enabled, result is fixed, copy: "就一个选项还抽什么？" |
| GPS denied | `wx.showModal` guiding to settings, fallback text: "不给位置我也没法帮你" |
| API key not configured | Mode B shows placeholder: "地图功能暂未配置" |
| POI search returns 0 | "这附近啥也没有，换个半径试试" |
| Network error | Toast: "网络开小差了" + retry |
| Minimum food count | 2 minimum for draw |

---

## Implementation Notes for AI

- **Animations**: use `transform: translate()` + `@keyframes` exclusively. Never manipulate DOM position via JS.
- **Random jump**: inject dynamic `<style>` with randomized keyframes each cycle via `wx.createSelectorQuery`
- **Permission**: declare `requiredPrivateInfos: ["getLocation"]` in `app.json`, also `permission` field for location scope description
- **Map API**: Tencent Map WebService API `https://apis.map.qq.com/ws/place/v1/search`, requires `key` param. Results stored in array, pick locally.
- **Storage**: use synchronous `wx.getStorageSync` / `wx.setStorageSync` for simplicity
- **No vibration**: `wx.vibrateShort`/`wx.vibrateLong` intentionally not used in v1

---

## Version

- **v1 scope**: 2 modes (custom + nearby with API key placeholder), jumping button, terminal state
- **Out of scope**: multi-level grumpy escalation, emoji, vibration, voice input, share, cloud sync
