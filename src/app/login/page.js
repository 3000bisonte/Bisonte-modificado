import LoginForm from "@/components/LoginForm";

export const dynamic = "force-dynamic";

export default function LoginPage({ searchParams }) {
  const callbackUrl = typeof searchParams?.callbackUrl === "string" ? searchParams.callbackUrl : undefined;
  return <LoginForm callbackUrl={callbackUrl} />;
}
