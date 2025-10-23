import { redirect } from "next/navigation";
import { headers } from "next/headers";

export default async function Home() {
  // Check hostname and redirect accordingly
  const headersList = await headers();
  const host = headersList.get("host") || "";

  // Redirect twc subdomain to login
  if (host.includes("twc.elevate.social")) {
    redirect("/login");
  }

  // Redirect main elevate.social to start page
  if (host.includes("elevate.social")) {
    redirect("https://start.elevate.social");
  }

  // For local development or other domains, redirect to login
  redirect("/login");
}
