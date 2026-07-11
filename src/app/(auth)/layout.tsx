import { ModalProvider } from "@/components/Modal";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ModalProvider>{children}</ModalProvider>;
}
