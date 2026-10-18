import client from '../api/client';

export const orderService = {
  getOrderList: () =>
    client.get('/api/frontend/delivery-boy-order'),

  getDriverOrders: (params) =>
    client.get('/api/v1/driver/orders', { params }),

  getOrderDetails: (id) =>
    client.get(`/api/frontend/delivery-boy-order/show/${id}`),

  getOrderCount: () =>
    client.get('/api/frontend/delivery-boy-order/count'),

  changeOrderStatus: (id, status) =>
    client.post(`/api/frontend/delivery-boy-order/change-status/${id}`, { status }),
};
