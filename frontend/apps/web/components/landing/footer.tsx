import Link from "next/link";
import logo from "@/assets/logo.png";
import Container from "../common/Container";

export function Footer() {
  return (
    <div className="bg-gradient-to-b from-brand to-[#A18BFF]">
      <Container className="py-20 w-full text-white flex flex-col items-center justify-center gap-4">
        <h1 className="text-4xl font-bold text-center">
          Built together. Built to last.
        </h1>
        <p className="text-lg max-w-2xl text-center">
          Make business easy, simple, and fun—with a system that pays you to
          grow. Join the movement and elevate your income, impact, and
          confidence.
        </p>
        <Link
          href="/get-started"
          className="bg-white text-brand px-6 py-3 rounded-full font-medium"
        >
          JOIN ELEVATE TODAY
        </Link>
      </Container>
    </div>
  );
}
