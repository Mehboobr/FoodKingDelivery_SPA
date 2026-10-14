import useProfileStore from '../store/profileStore';

export const useProfile = () => {
  const profileData = useProfileStore((s) => s.profileData);
  const pageDataList = useProfileStore((s) => s.pageDataList);
  const branchDataList = useProfileStore((s) => s.branchDataList);
  const loaders = useProfileStore((s) => s.loaders);

  const getProfile = useProfileStore((s) => s.getProfile);
  const updateProfile = useProfileStore((s) => s.updateProfile);
  const changePassword = useProfileStore((s) => s.changePassword);
  const updateProfileImage = useProfileStore((s) => s.updateProfileImage);
  const getPages = useProfileStore((s) => s.getPages);
  const getBranches = useProfileStore((s) => s.getBranches);
  const reset = useProfileStore((s) => s.reset);

  return {
    profileData,
    pageDataList,
    branchDataList,
    loaders,
    getProfile,
    updateProfile,
    changePassword,
    updateProfileImage,
    getPages,
    getBranches,
    reset,
  };
};

export default useProfile;
