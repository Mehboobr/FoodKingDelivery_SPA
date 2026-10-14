import useAuthStore from '../store/authStore';

export const useAuth = () => {
  const token = useAuthStore((s) => s.token);
  const justToken = useAuthStore((s) => s.justToken);
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn);
  const branchId = useAuthStore((s) => s.branchId);
  const user = useAuthStore((s) => s.user);

  const login = useAuthStore((s) => s.login);
  const logout = useAuthStore((s) => s.logout);
  const refreshToken = useAuthStore((s) => s.refreshToken);
  const loadFromStorage = useAuthStore((s) => s.loadFromStorage);

  return {
    token,
    justToken,
    isLoggedIn,
    branchId,
    user,
    login,
    logout,
    refreshToken,
    loadFromStorage,
  };
};

export default useAuth;
