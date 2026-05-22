import { MAP_API_URL } from '../types/index';

export interface NearbySearchParams {
  latitude: number;
  longitude: number;
  radius: number;
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
        const data = res.data as {
          status: number;
          data: Array<{ title: string; address: string; distance: number }>;
        };
        if (data.status !== 0) {
          reject(new Error('API status error'));
          return;
        }
        resolve(
          data.data.map((item) => ({
            title: item.title,
            address: item.address,
            distance: item.distance,
          }))
        );
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
