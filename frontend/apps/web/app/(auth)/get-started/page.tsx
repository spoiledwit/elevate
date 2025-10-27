import { redirect } from "next/navigation";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Get Started - Elevate Social",
};

export default function GetStarted() {
  redirect("/login");
}
