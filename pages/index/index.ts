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
      const names = results.map((r) => r.title);
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

    let result: string;

    if (this.data.activeTab === 'custom') {
      result = pickFromCustom(this.data.foods);
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
      source: this.data.activeTab as 'custom' | 'nearby',
      timestamp: Date.now(),
    });

    wx.navigateTo({
      url: `/pages/result/result?food=${encodeURIComponent(result)}`,
    });
  },
});
