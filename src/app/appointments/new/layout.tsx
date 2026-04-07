import { Suspense } from "react";

export default function NewAppointmentLayout({ children }: { children: React.ReactNode }) {
  return <Suspense>{children}</Suspense>;
}
