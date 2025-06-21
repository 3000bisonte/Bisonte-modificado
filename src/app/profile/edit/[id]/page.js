import UserProfile from "@/components/UserProfile";

const ProfilePage = ({ params }) => {
  console.log(params);
  const { username } = params;
  return <UserProfile params={params} />;
};

export default ProfilePage;
