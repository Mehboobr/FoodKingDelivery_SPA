import useOrderStore from '../store/orderStore';

export const useOrders = () => {
  const orderList = useOrderStore((s) => s.orderList);
  const activeOrderList = useOrderStore((s) => s.activeOrderList);
  const previousOrderList = useOrderStore((s) => s.previousOrderList);
  const orderDetails = useOrderStore((s) => s.orderDetails);
  const countData = useOrderStore((s) => s.countData);
  const loaders = useOrderStore((s) => s.loaders);
  const listError = useOrderStore((s) => s.listError);

  const getOrderList = useOrderStore((s) => s.getOrderList);
  const getOrderCount = useOrderStore((s) => s.getOrderCount);
  const getOrderDetails = useOrderStore((s) => s.getOrderDetails);
  const changeOrderStatus = useOrderStore((s) => s.changeOrderStatus);
  const clearOrderDetails = useOrderStore((s) => s.clearOrderDetails);

  return {
    orderList,
    activeOrderList,
    previousOrderList,
    orderDetails,
    countData,
    loaders,
    listError,
    getOrderList,
    getOrderCount,
    getOrderDetails,
    changeOrderStatus,
    clearOrderDetails,
  };
};

export default useOrders;
