/**
 * iapService — 訂閱付費服務（In-App Purchase）
 *
 * Phase 3 架構：
 * - 免費版：幼苗級前 3 課
 * - 高級版（月費 / 年費）：解鎖全部課程 + 未來新關卡
 * - 平台：App Store / Google Play
 *
 * 目前為 stub 實作；整合 expo-in-app-purchases 後替換 TODO 區塊
 *
 * 安裝：
 *   npx expo install expo-in-app-purchases
 */

export const IAP_PRODUCTS = {
  MONTHLY: 'cantokids.premium.monthly',   // HK$18/月
  ANNUAL: 'cantokids.premium.annual',     // HK$128/年
} as const;

export type IAPProductId = (typeof IAP_PRODUCTS)[keyof typeof IAP_PRODUCTS];

export interface IAPProduct {
  productId: IAPProductId;
  title: string;
  description: string;
  price: string;
}

/**
 * 免費版可使用的課程數量上限
 * 整個幼苗級（10 字）免費，其餘 5 個級別需升級
 */
export const FREE_LESSON_LIMIT = 10;

/**
 * 初始化 IAP（App 啟動時呼叫）
 * TODO: 替換為真實 expo-in-app-purchases 呼叫
 */
export async function initIAP(): Promise<void> {
  // TODO: await connectAsync();
  if (__DEV__) console.log('[iapService] IAP 初始化（模擬）');
}

/**
 * 取得訂閱方案列表
 * TODO: 替換為真實產品查詢
 */
export async function fetchProducts(): Promise<IAPProduct[]> {
  // TODO: const { responseCode, results } = await getProductsAsync(Object.values(IAP_PRODUCTS));
  if (__DEV__) console.log('[iapService] 取得產品列表（模擬）');
  return [
    {
      productId: IAP_PRODUCTS.MONTHLY,
      title: '月費方案',
      description: '每月 HK$18，解鎖所有課程',
      price: 'HK$18',
    },
    {
      productId: IAP_PRODUCTS.ANNUAL,
      title: '年費方案',
      description: '每年 HK$128，省 40%，解鎖所有課程',
      price: 'HK$128',
    },
  ];
}

/**
 * 購買訂閱
 * TODO: 替換為真實購買流程
 */
export async function purchasePremium(productId: IAPProductId): Promise<boolean> {
  try {
    // TODO: await purchaseItemAsync(productId);
    if (__DEV__) console.log('[iapService] 模擬購買:', productId);
    return true; // 模擬購買成功
  } catch (err) {
    if (__DEV__) console.warn('[iapService] 購買失敗:', err);
    return false;
  }
}

/**
 * 恢復已購買項目
 * TODO: 替換為真實恢復流程
 */
export async function restorePurchases(): Promise<boolean> {
  try {
    // TODO: await getPurchaseHistoryAsync();
    if (__DEV__) console.log('[iapService] 模擬恢復購買');
    return false; // 模擬：無過往購買
  } catch (err) {
    if (__DEV__) console.warn('[iapService] 恢復失敗:', err);
    return false;
  }
}

/**
 * 檢查是否有效訂閱（App 啟動 / 進入高級內容時呼叫）
 * TODO: 替換為收據驗證
 */
export async function checkSubscriptionStatus(): Promise<boolean> {
  // TODO: 向後端驗證收據或用 expo-in-app-purchases 查詢
  if (__DEV__) console.log('[iapService] 檢查訂閱狀態（模擬）');
  return false;
}
