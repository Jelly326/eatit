# Eatit Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a WeChat Mini Program that randomly picks a food and uses a jumping-button mechanic to force acceptance.

**Architecture:** 2 pages (index + result), local storage for food list, Tencent Map POI for nearby mode. CSS `@keyframes`-only animations, no JS DOM manipulation.

**Tech Stack:** WeChat native framework, TypeScript, wx.Storage sync API, Tencent Map WebService API

---

### Task 1: Project Scaffold & Gitignore

**Files:**
- Create: `.gitignore`
- Create: `project.config.json`
- Create: `app.json`
- Create: `app.ts`
- Create: `app.wxss`

- [ ] **Step 1: Write .gitignore**

```
node_modules/
miniprogram_npm/
.DS_Store
*.log
project.private.config.json
dist/
```

- [ ] **Step 2: Write project.config.json**

```json
{
  "description": "你必须得吃这个！",
  "packOptions": { "ignore": [], "include": [] },
  "setting": {
    "bundle": false,
    "userConfirmedBundleSwitch": false,
    "urlCheck": true,
    "scopeDataCheck": false,
    "coverView": true,
    "es6": true,
    "postcss": true,
    "compileHotReLoad": false,
    "lazyloadPlaceholderEnable": false,
    "preloadBackgroundData": false,
    "minified": true,
    "autoAudits": false,
    "newFeature": false,
    "uglifyFileName": false,
    "uploadWithSourceMap": true,
    "useIsolateContext": true,
    "nodeModules": false,
    "enhance": true,
    "useMultiFrameRuntime": true,
    "useApiHook": true,
    "useApiHostProcess": true,
    "showShadowRootInWxmlPanel": true,
    "packNpmManually": false,
    "enableEngp": false,
    "packNpmRelationList": [],
    "minifyWXSS": true,
    "showES6CompileOption": false,
    "minifyWXML": true,
    "babelSetting": { "ignore": [], "disablePlugins": [], "outputPath": "" },
    "compileWorklet": false,
    "localPlugins": false,
    "disableUseSt": false,
    "condition": false,
    "swc": false,
    "disableSWC": true
  },
  "compileType": "miniprogram",
  "libVersion": "3.7.0",
  "appid": "",
  "projectname": "eatit",
  "condition": {},
  "editorSetting": { "tabIndent": "insertSpaces", "tabSize": 2 }
}
```

- [ ] **Step 3: Write app.json**

```json
{
  "pages": [
    "pages/index/index",
    "pages/result/result"
  ],
  "window": {
    "navigationBarTitleText": "你必须得吃这个！",
    "navigationBarBackgroundColor": "#FAFAFA",
    "navigationBarTextStyle": "black",
    "backgroundColor": "#FAFAFA"
  },
  "requiredPrivateInfos": ["getLocation"],
  "permission": {
    "scope.userLocation": {
      "desc": "需要获取你的位置来搜索附近餐厅"
    }
  },
  "sitemapLocation": "sitemap.json"
}
```

- [ ] **Step 4: Write app.ts**

```typescript
App<IAppOption>({
  globalData: {
    mapKey: '', // 腾讯地图 API Key，部署前填入
  },
});
```

- [ ] **Step 5: Write app.wxss**

```css
page {
  --bg: #FAFAFA;
  --bg-dark: #1A1A1A;
  --text: #333333;
  --text-secondary: #666666;
  --border: #E0E0E0;
  --radius: 8rpx;
  background-color: var(--bg);
  font-family: -apple-system, BlinkMacSystemFont, "Helvetica Neue", sans-serif;
  color: var(--text);
  font-size: 28rpx;
  line-height: 1.6;
}

.container {
  padding: 32rpx;
  min-height: 100vh;
  box-sizing: border-box;
  padding-bottom: 160rpx;
}

.btn-primary {
  width: 100%;
  height: 96rpx;
  line-height: 96rpx;
  background: var(--text);
  color: #fff;
  border-radius: var(--radius);
  font-size: 32rpx;
  font-weight: 600;
  border: none;
}

.btn-primary[disabled] {
  background: var(--border);
  color: #999;
}

.btn-secondary {
  width: 100%;
  height: 72rpx;
  line-height: 72rpx;
  background: transparent;
  color: var(--text-secondary);
  font-size: 26rpx;
  border: none;
}

.btn-ghost {
  width: 100%;
  height: 72rpx;
  line-height: 72rpx;
  background: transparent;
  color: var(--text-secondary);
  font-size: 24rpx;
  border: 1px solid var(--border);
  border-radius: var(--radius);
}
```

- [ ] **Step 6: Write sitemap.json**

```json
{
  "rules": [{ "action": "allow", "page": "*" }]
}
```

- [ ] **Step 7: Commit**

```bash
git add .gitignore project.config.json app.json app.ts app.wxss sitemap.json
git commit -m "feat: project scaffold with app config"
```

---

### Task 2: Type Definitions & Storage Utils

**Files:**
- Create: `types/index.ts`
- Create: `utils/storage.ts`

- [ ] **Step 1: Write types/index.ts**

```typescript
export interface FoodItem {
  id: string;
  name: string;
  createdAt: number;
}

export interface FoodStorage {
  foods: FoodItem[];
}

export interface DrawRecord {
  result: string;
  source: 'custom' | 'nearby';
  timestamp: number;
}

export type TabMode = 'custom' | 'nearby';

export const STORAGE_KEY_FOODS = 'food_list';
export const STORAGE_KEY_HISTORY = 'draw_history';

export const MAP_API_URL = 'https://apis.map.qq.com/ws/place/v1/search';
```

- [ ] **Step 2: Write utils/storage.ts**

```typescript
import type { FoodItem, FoodStorage, DrawRecord } from '../types/index';
import { STORAGE_KEY_FOODS, STORAGE_KEY_HISTORY } from '../types/index';

export function getFoods(): FoodItem[] {
  try {
    const data = wx.getStorageSync(STORAGE_KEY_FOODS) as FoodStorage | '';
    if (data && data.foods) return data.foods;
  } catch (_) { /* ignore */ }
  return [];
}

export function saveFoods(foods: FoodItem[]): void {
  const data: FoodStorage = { foods };
  wx.setStorageSync(STORAGE_KEY_FOODS, data);
}

export function addFood(name: string): FoodItem[] {
  const foods = getFoods();
  const trimmed = name.trim();
  if (!trimmed) return foods;
  if (foods.some(f => f.name === trimmed)) return foods;
  const item: FoodItem = {
    id: Date.now().toString(36),
    name: trimmed,
    createdAt: Date.now(),
  };
  foods.push(item);
  saveFoods(foods);
  return foods;
}

export function removeFood(id: string): FoodItem[] {
  const foods = getFoods().filter(f => f.id !== id);
  saveFoods(foods);
  return foods;
}

export function getDrawHistory(): DrawRecord | null {
  try {
    return wx.getStorageSync(STORAGE_KEY_HISTORY) as DrawRecord | null;
  } catch (_) { return null; }
}

export function saveDrawHistory(record: DrawRecord): void {
  wx.setStorageSync(STORAGE_KEY_HISTORY, record);
}
```

- [ ] **Step 3: Commit**

```bash
git add types/index.ts utils/storage.ts
git commit -m "feat: add type definitions and storage utils"
```

---

### Task 3: Picker & Map Utils

**Files:**
- Create: `utils/picker.ts`
- Create: `utils/map.ts`

- [ ] **Step 1: Write utils/picker.ts**

```typescript
import type { FoodItem } from '../types/index';

export function pickFromCustom(foods: FoodItem[]): string {
  const idx = Math.floor(Math.random() * foods.length);
  return foods[idx].name;
}

export function pickFromList(list: string[]): string {
  const idx = Math.floor(Math.random() * list.length);
  return list[idx];
}
```

- [ ] **Step 2: Write utils/map.ts**

```typescript
import { MAP_API_URL } from '../types/index';

export interface NearbySearchParams {
  latitude: number;
  longitude: number;
  radius: number; // meters
  key: string;
}

export interface NearbySearchResult {
  title: string;
  address: string;
  distance: number;
}

export function searchNearbyFood(params: NearbySearchParams): Promise<NearbySearchResult[]> {
  return new Promise((resolve, reject) => {
    wx.request({
      url: MAP_API_URL,
      data: {
        keyword: '美食',
        boundary: `nearby(${params.latitude},${params.longitude},${params.radius})`,
        key: params.key,
        page_size: 20,
        page_index: 1,
      },
      success(res) {
        if (res.statusCode !== 200) {
          reject(new Error(`API returned ${res.statusCode}`));
          return;
        }
        const data = res.data as { status: number; data: Array<{ title: string; address: string; distance: number }> };
        if (data.status !== 0) {
          reject(new Error('API status error'));
          return;
        }
        resolve(data.data.map(item => ({
          title: item.title,
          address: item.address,
          distance: item.distance,
        })));
      },
      fail(err) {
        reject(err);
      },
    });
  });
}

export function getLocation(): Promise<WechatMiniprogram.GetLocationSuccessCallbackResult> {
  return new Promise((resolve, reject) => {
    wx.getLocation({
      type: 'gcj02',
      success: resolve,
      fail: reject,
    });
  });
}
```

- [ ] **Step 3: Commit**

```bash
git add utils/picker.ts utils/map.ts
git commit -m "feat: add picker and map utilities"
```

---

### Task 4: Index Page — Logic Layer

**Files:**
- Create: `pages/index/index.ts`

- [ ] **Step 1: Write pages/index/index.ts**

```typescript
import type { FoodItem, TabMode } from '../../types/index';
import { getFoods, addFood, removeFood, saveDrawHistory } from '../../utils/storage';
import { pickFromCustom } from '../../utils/picker';
import { searchNearbyFood, getLocation } from '../../utils/map';

const app = getApp<IAppOption>();

Page({
  data: {
    foods: [] as FoodItem[],
    inputValue: '',
    activeTab: 'custom' as TabMode,
    radius: 1000,
    nearbyCount: 0,
    nearbyResults: [] as string[],
    btnDisabled: true,
    nearbyLoading: false,
    mapKeyConfigured: !!app.globalData.mapKey,
  },

  onShow() {
    this.refreshFoods();
  },

  refreshFoods() {
    const foods = getFoods();
    this.setData({
      foods,
      btnDisabled: foods.length < 2,
    });
  },

  onTabTap(e: WechatMiniprogram.TouchEvent) {
    const tab = e.currentTarget.dataset.tab as TabMode;
    this.setData({ activeTab: tab });
    if (tab === 'nearby' && app.globalData.mapKey) {
      this.doNearbySearch();
    }
  },

  onInput(e: WechatMiniprogram.Input) {
    this.setData({ inputValue: e.detail.value });
  },

  onAddFood() {
    const name = this.data.inputValue;
    if (!name.trim()) {
      wx.showToast({ title: '输入点东西吧', icon: 'none' });
      return;
    }
    const updated = addFood(name);
    this.setData({
      foods: updated,
      inputValue: '',
      btnDisabled: updated.length < 2,
    });
  },

  onDeleteFood(e: WechatMiniprogram.TouchEvent) {
    const id = e.currentTarget.dataset.id as string;
    wx.showModal({
      title: '删除',
      content: '确定删除这个食物？',
      success: (res) => {
        if (res.confirm) {
          const updated = removeFood(id);
          this.setData({
            foods: updated,
            btnDisabled: updated.length < 2,
          });
        }
      },
    });
  },

  onRadiusChange(e: WechatMiniprogram.SliderChange) {
    const radius = Math.round(e.detail.value);
    this.setData({ radius });
    if (app.globalData.mapKey) {
      this.doNearbySearchDebounced();
    }
  },

  _nearbyTimer: 0 as number,
  doNearbySearchDebounced() {
    if (this._nearbyTimer) clearTimeout(this._nearbyTimer);
    this._nearbyTimer = setTimeout(() => this.doNearbySearch(), 500) as unknown as number;
  },

  async doNearbySearch() {
    this.setData({ nearbyLoading: true });
    try {
      const loc = await getLocation();
      const results = await searchNearbyFood({
        latitude: loc.latitude,
        longitude: loc.longitude,
        radius: this.data.radius,
        key: app.globalData.mapKey,
      });
      const names = results.map(r => r.title);
      this.setData({ nearbyCount: names.length, nearbyResults: names });
    } catch (e) {
      console.error('Nearby search failed:', e);
      wx.showToast({ title: '搜索失败了', icon: 'none' });
    } finally {
      this.setData({ nearbyLoading: false });
    }
  },

  onDraw() {
    if (this.data.btnDisabled) return;

    const activeTab = this.data.activeTab;
    let result: string;

    if (activeTab === 'custom') {
      result = pickFromCustom(this.data.foods);
      const foods = getFoods();
      if (foods.length === 1) {
        wx.showToast({ title: '就一个选项还抽什么？', icon: 'none' });
      }
    } else {
      if (this.data.nearbyResults.length === 0) {
        wx.showToast({ title: '这附近啥也没有', icon: 'none' });
        return;
      }
      const idx = Math.floor(Math.random() * this.data.nearbyResults.length);
      result = this.data.nearbyResults[idx];
    }

    saveDrawHistory({
      result,
      source: activeTab as 'custom' | 'nearby',
      timestamp: Date.now(),
    });

    wx.navigateTo({
      url: `/pages/result/result?food=${encodeURIComponent(result)}`,
    });
  },
});
```

- [ ] **Step 2: Commit**

```bash
git add pages/index/index.ts
git commit -m "feat: add index page logic"
```

---

### Task 5: Index Page — Template & Style

**Files:**
- Create: `pages/index/index.wxml`
- Create: `pages/index/index.wxss`

- [ ] **Step 1: Write pages/index/index.wxml**

```xml
<view class="container">
  <view class="title">你必须得吃这个！</view>

  <view class="tabs">
    <view
      class="tab {{activeTab === 'custom' ? 'tab--active' : ''}}"
      data-tab="custom"
      bindtap="onTabTap"
    >我的菜单</view>
    <view
      class="tab {{activeTab === 'nearby' ? 'tab--active' : ''}}"
      data-tab="nearby"
      bindtap="onTabTap"
    >附近随便找</view>
  </view>

  <!-- 模式 A: 自定义菜单 -->
  <view wx:if="{{activeTab === 'custom'}}" class="tab-content">
    <view class="input-row">
      <input
        class="food-input"
        placeholder="输入食物名称..."
        value="{{inputValue}}"
        bindinput="onInput"
        confirm-type="done"
        bindconfirm="onAddFood"
      />
      <button class="add-btn" bindtap="onAddFood">+</button>
    </view>
    <view class="tags">
      <view
        class="tag"
        wx:for="{{foods}}"
        wx:key="id"
        data-id="{{item.id}}"
        bindtap="onDeleteFood"
      >{{item.name}}</view>
      <view wx:if="{{foods.length === 0}}" class="empty-hint">先加点吃的吧</view>
    </view>
  </view>

  <!-- 模式 B: 附近随便找 -->
  <view wx:if="{{activeTab === 'nearby'}}" class="tab-content">
    <view wx:if="{{!mapKeyConfigured}}" class="placeholder-box">
      <text>地图功能暂未配置</text>
      <text class="placeholder-sub">请在 app.ts 中填入腾讯地图 API Key</text>
    </view>
    <block wx:else>
      <view class="radius-row">
        <text class="radius-label">搜索半径</text>
        <text class="radius-value">{{radius}}m</text>
      </view>
      <slider
        class="radius-slider"
        min="500"
        max="3000"
        step="100"
        value="{{radius}}"
        show-value
        bindchange="onRadiusChange"
      />
      <view class="nearby-info">
        <text wx:if="{{nearbyLoading}}">搜索中...</text>
        <text wx:elif="{{nearbyCount > 0}}">找到 {{nearbyCount}} 家餐厅</text>
        <text wx:else>这附近啥也没有，换个半径试试</text>
      </view>
    </block>
  </view>

  <!-- 底部抽取按钮 -->
  <view class="bottom-bar">
    <button
      class="btn-primary"
      disabled="{{btnDisabled}}"
      bindtap="onDraw"
    >决定命运的时刻</button>
  </view>
</view>
```

- [ ] **Step 2: Write pages/index/index.wxss**

```css
.title {
  font-size: 40rpx;
  font-weight: 700;
  text-align: center;
  padding: 48rpx 0 32rpx;
  letter-spacing: 4rpx;
}

.tabs {
  display: flex;
  justify-content: center;
  gap: 0;
  border-bottom: 1px solid var(--border);
  margin-bottom: 32rpx;
}

.tab {
  flex: 1;
  text-align: center;
  padding: 20rpx 0;
  font-size: 28rpx;
  color: var(--text-secondary);
  border-bottom: 4rpx solid transparent;
  transition: all 0.2s;
}

.tab--active {
  color: var(--text);
  border-bottom-color: var(--text);
  font-weight: 600;
}

.tab-content {
  min-height: 400rpx;
}

.input-row {
  display: flex;
  gap: 16rpx;
  margin-bottom: 24rpx;
}

.food-input {
  flex: 1;
  height: 80rpx;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 0 24rpx;
  font-size: 28rpx;
  background: #fff;
}

.add-btn {
  width: 80rpx;
  height: 80rpx;
  background: var(--text);
  color: #fff;
  font-size: 36rpx;
  border-radius: var(--radius);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: none;
}

.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
}

.tag {
  padding: 12rpx 28rpx;
  background: #fff;
  border: 1px solid var(--border);
  border-radius: 40rpx;
  font-size: 26rpx;
  color: var(--text);
}

.tag:active {
  background: #eee;
}

.empty-hint {
  width: 100%;
  text-align: center;
  color: var(--text-secondary);
  font-size: 26rpx;
  padding: 80rpx 0;
}

.placeholder-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 120rpx 0;
  color: var(--text-secondary);
  font-size: 28rpx;
  gap: 12rpx;
}

.placeholder-sub {
  font-size: 24rpx;
  opacity: 0.6;
}

.radius-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 16rpx;
}

.radius-label {
  font-size: 26rpx;
  color: var(--text-secondary);
}

.radius-value {
  font-size: 28rpx;
  font-weight: 600;
}

.radius-slider {
  margin-bottom: 24rpx;
}

.nearby-info {
  text-align: center;
  color: var(--text-secondary);
  font-size: 26rpx;
  padding: 40rpx 0;
}

.bottom-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 24rpx 32rpx;
  padding-bottom: calc(24rpx + env(safe-area-inset-bottom));
  background: var(--bg);
}
```

- [ ] **Step 3: Commit**

```bash
git add pages/index/index.wxml pages/index/index.wxss
git commit -m "feat: add index page template and styles"
```

---

### Task 6: Result Page — Logic Layer

**Files:**
- Create: `pages/result/result.ts`

- [ ] **Step 1: Write pages/result/result.ts**

```typescript
Page({
  data: {
    food: '',
    state: 'normal' as 'normal' | 'chaos' | 'terminal',
    chaosStyle: '',
  },

  _chaosTimer: 0 as number,
  _keyframeId: 0,

  onLoad(options: Record<string, string | undefined>) {
    if (options.food) {
      this.setData({ food: decodeURIComponent(options.food) });
    }
  },

  onUnload() {
    this.stopChaos();
  },

  onAccept() {
    wx.navigateBack();
  },

  onRetry() {
    this.startChaos();
  },

  startChaos() {
    this.setData({ state: 'chaos' });
    this.scheduleJump();
  },

  stopChaos() {
    if (this._chaosTimer) {
      clearTimeout(this._chaosTimer);
      this._chaosTimer = 0;
    }
  },

  scheduleJump() {
    const delay = 400 + Math.random() * 300; // 400-700ms
    this._chaosTimer = setTimeout(() => {
      this.generateJumpKeyframes();
      this.scheduleJump();
    }, delay) as unknown as number;
  },

  generateJumpKeyframes() {
    // 生成随机目标位置，避开顶部和底部
    const x = (Math.random() - 0.5) * 200; // -100 to 100 px
    const y = (Math.random() - 0.5) * 300; // -150 to 150 px
    const rotate = (Math.random() - 0.5) * 30; // slight rotation

    this._keyframeId++;
    const name = `jump${this._keyframeId}`;

    // 注入动态 keyframes 到页面
    const styleId = `jump-style-${this._keyframeId}`;

    // Remove previous style
    const prevId = `jump-style-${this._keyframeId - 1}`;
    const prevEl = document.getElementById(prevId);
    if (prevEl) prevEl.remove();

    const styleEl = document.createElement('style');
    styleEl.id = styleId;
    styleEl.textContent = `@keyframes ${name} {
      from { transform: translate(0, 0) rotate(0deg); }
      to { transform: translate(${x}px, ${y}px) rotate(${rotate}deg); }
    }`;
    document.head.appendChild(styleEl);

    this.setData({
      chaosStyle: `animation: ${name} 0.5s ease-in-out forwards`,
    });
  },

  onCatchJumpBtn() {
    // 用户在混乱中抓到了按钮
    this.stopChaos();
    this.setData({ state: 'terminal' });
  },
});
```

Wait — WeChat Mini Program does not support `document.getElementById` or `document.createElement`. The correct approach for dynamic keyframes in a mini program is different.

Let me rewrite this correctly.

- [ ] **Step 1: Write pages/result/result.ts (corrected for WeChat)**

```typescript
Page({
  data: {
    food: '',
    state: 'normal' as 'normal' | 'chaos' | 'terminal',
    jumpX: 0,
    jumpY: 0,
    jumpRotate: 0,
    jumpDuration: 0.5,
  },

  _chaosTimer: 0 as number,

  onLoad(options: Record<string, string | undefined>) {
    if (options.food) {
      this.setData({ food: decodeURIComponent(options.food) });
    }
  },

  onUnload() {
    this.stopChaos();
  },

  onAccept() {
    wx.navigateBack();
  },

  onRetry() {
    this.startChaos();
  },

  startChaos() {
    this.setData({ state: 'chaos' });
    this.scheduleJump();
  },

  stopChaos() {
    if (this._chaosTimer) {
      clearTimeout(this._chaosTimer);
      this._chaosTimer = 0;
    }
  },

  scheduleJump() {
    const delay = 400 + Math.random() * 300;
    this._chaosTimer = setTimeout(() => {
      const x = Math.round((Math.random() - 0.5) * 200);
      const y = Math.round((Math.random() - 0.5) * 300);
      const rotate = Math.round((Math.random() - 0.5) * 30);
      this.setData({ jumpX: x, jumpY: y, jumpRotate: rotate });
      this.scheduleJump();
    }, delay) as unknown as number;
  },

  onCatchJumpBtn() {
    this.stopChaos();
    this.setData({ state: 'terminal' });
  },
});
```

- [ ] **Step 2: Commit**

```bash
git add pages/result/result.ts
git commit -m "feat: add result page logic with chaos mechanic"
```

---

### Task 7: Result Page — Template & Style

**Files:**
- Create: `pages/result/result.wxml`
- Create: `pages/result/result.wxss`

- [ ] **Step 1: Write pages/result/result.wxml**

```xml
<!-- 状态 1 & 2: 正常 + 混乱 -->
<view wx:if="{{state !== 'terminal'}}" class="result-page">
  <view class="result-label">命运选择了</view>
  <view class="result-food scale-in">{{food}}</view>

  <view class="result-actions">
    <button class="btn-primary" bindtap="onAccept">去吃！</button>
    <button
      wx:if="{{state === 'normal'}}"
      class="btn-ghost retry-btn"
      bindtap="onRetry"
    >再抽一次</button>
  </view>

  <!-- 混乱模式下的跳跃按钮 -->
  <view
    wx:if="{{state === 'chaos'}}"
    class="chaos-btn"
    style="transform: translate({{jumpX}}px, {{jumpY}}px) rotate({{jumpRotate}}deg); transition: transform 0.3s ease-in-out;"
    bindtap="onCatchJumpBtn"
  >
    再抽一次
  </view>
</view>

<!-- 状态 3: 终结 -->
<view wx:else class="terminal-page">
  <view class="terminal-text">点也没用</view>
  <view class="terminal-sub">你必须吃这个！</view>
  <button class="btn-terminal" bindtap="onAccept">我 吃 ！</button>
</view>
```

- [ ] **Step 2: Write pages/result/result.wxss**

```css
.result-page {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 64rpx 32rpx;
  box-sizing: border-box;
  background: var(--bg);
}

.result-label {
  font-size: 28rpx;
  color: var(--text-secondary);
  margin-bottom: 32rpx;
}

.result-food {
  font-size: 56rpx;
  font-weight: 700;
  color: var(--text);
  margin-bottom: 80rpx;
  text-align: center;
  word-break: break-all;
}

.scale-in {
  animation: scaleIn 0.4s ease-out;
}

@keyframes scaleIn {
  from { transform: scale(0.5); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}

.result-actions {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 16rpx;
  padding: 0 32rpx;
  box-sizing: border-box;
}

.retry-btn {
  margin-top: 8rpx;
}

/* 混乱跳跃按钮 */
.chaos-btn {
  position: fixed;
  top: 50%;
  left: 50%;
  margin-left: -100rpx;
  margin-top: -32rpx;
  width: 200rpx;
  height: 64rpx;
  line-height: 64rpx;
  text-align: center;
  background: var(--border);
  color: var(--text-secondary);
  border-radius: var(--radius);
  font-size: 24rpx;
  z-index: 100;
}

/* 终结页 */
.terminal-page {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: var(--bg-dark);
  padding: 64rpx 32rpx;
  box-sizing: border-box;
}

.terminal-text {
  font-size: 36rpx;
  color: #666;
  margin-bottom: 16rpx;
}

.terminal-sub {
  font-size: 48rpx;
  font-weight: 700;
  color: #fff;
  margin-bottom: 80rpx;
}

.btn-terminal {
  width: 100%;
  height: 96rpx;
  line-height: 96rpx;
  background: #fff;
  color: var(--bg-dark);
  border-radius: var(--radius);
  font-size: 34rpx;
  font-weight: 700;
  border: none;
}
```

- [ ] **Step 3: Commit**

```bash
git add pages/result/result.wxml pages/result/result.wxss
git commit -m "feat: add result page template and styles"
```

---

### Task 8: Final Integration & Verification

**Files:**
- Create: None (verify existing)

- [ ] **Step 1: Verify all files exist**

Run: `ls -R pages/ utils/ types/ app.*`

Expected: All files from the file structure present.

- [ ] **Step 2: Check that no temp/download artifacts are tracked**

Run: `git status`

Expected: Only the project source files appear. No `/tmp/gh_*`, no `node_modules/`.

- [ ] **Step 3: Commit final state**

```bash
git add -A
git commit -m "chore: finalize v1 implementation"
git push
```
