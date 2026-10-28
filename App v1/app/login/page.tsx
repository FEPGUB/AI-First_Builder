import { AuthForm } from "../auth-form";

export const metadata = { title: "Iniciar sesión | Orgenicemos" };

export default function LoginPage() {
  return <AuthForm mode="login" />;
}
