import UserProfile from "@/components/UserProfile";

const ProfilePage = ({ params }) => {
  console.log(params);
  return <UserProfile params={params} />;
};

export default ProfilePage;
