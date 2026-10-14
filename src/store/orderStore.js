import { create } from 'zustand';
import { orderService } from '../services/orderService';

const HISTORY_STATUSES = [13, 22];

const useOrderStore = create((set, get) => ({
  orderList: [],
  activeOrderList: [],
  previousOrderList: [],
  orderDetails: null,
  countData: { total_delivered: 0, total_returned: 0 },
  loaders: { list: false, count: false, details: false, confirm: false },
  listError: null,

  getOrderList: async () => {
    set((s) => ({ loaders: { ...s.loaders, list: true }, listError: null }));
    try {
      const res = await orderService.getOrderList();
      const orders = res.data?.data ?? res.data ?? [];
      const active = orders.filter((o) => !HISTORY_STATUSES.includes(o.status));
      const previous = orders.filter((o) => HISTORY_STATUSES.includes(o.status));
      set({ orderList: orders, activeOrderList: active, previousOrderList: previous });
    } catch (err) {
      set({ listError: err?.response?.data?.message || 'Failed to load orders' });
    } finally {
      set((s) => ({ loaders: { ...s.loaders, list: false } }));
    }
  },

  getOrderCount: async () => {
    set((s) => ({ loaders: { ...s.loaders, count: true } }));
    try {
      const res = await orderService.getOrderCount();
      const data = res.data?.data ?? res.data;
      set({
        countData: {
          total_delivered: data?.total_delivered ?? 0,
          total_returned: data?.total_returned ?? 0,
        },
      });
    } catch (_) {
      // silently keep 0 values
    } finally {
      set((s) => ({ loaders: { ...s.loaders, count: false } }));
    }
  },

  getOrderDetails: async (id) => {
    set((s) => ({ loaders: { ...s.loaders, details: true } }));
    try {
      const res = await orderService.getOrderDetails(id);
      const data = res.data?.data ?? res.data;
      set({ orderDetails: data });
      return data;
    } catch (err) {
      throw err;
    } finally {
      set((s) => ({ loaders: { ...s.loaders, details: false } }));
    }
  },

  changeOrderStatus: async (id, status) => {
    set((s) => ({ loaders: { ...s.loaders, confirm: true } }));
    try {
      const res = await orderService.changeOrderStatus(id, status);
      if (res.status === 200) return true;
      throw new Error(res.data?.message || 'Status change failed');
    } catch (err) {
      throw err;
    } finally {
      set((s) => ({ loaders: { ...s.loaders, confirm: false } }));
    }
  },

  clearOrderDetails: () => set({ orderDetails: null }),
  reset: () =>
    set({
      orderList: [],
      activeOrderList: [],
      previousOrderList: [],
      orderDetails: null,
      countData: { total_delivered: 0, total_returned: 0 },
      loaders: { list: false, count: false, details: false, confirm: false },
      listError: null,
    }),
}));

export default useOrderStore;
