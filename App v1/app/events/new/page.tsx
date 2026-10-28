import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/current-user";
import { EventForm } from "./event-form";

export const metadata = { title: "Nuevo evento | Orgenicemos" };

export default async function NewEventPage() {
  if (!(await getCurrentUser())) redirect("/login");
  return <EventForm />;
}
