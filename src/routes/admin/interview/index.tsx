import { createFileRoute, redirect } from "@tanstack/react-router";

// The interview admin split into two pages (#53): sections and notes each get
// their own route + sidebar entry. The bare /admin/interview URL stays valid
// and lands on the notes list (the primary working surface).
export const Route = createFileRoute("/admin/interview/")({
  beforeLoad: () => {
    throw redirect({ to: "/admin/interview/notes" });
  },
});
