import React from "react";
import Container from "../common/Container";
import Link from "next/link";

const Hero = () => {
  const points = [
    {
      value: 1,
      title: "Simple System",
    },
    {
      value: "100%",
      title: "Duplicatable",
    },
    {
      value: "BFY & DFY",
      title: "Everything Ready",
    },
    {
      value: "24/7",
      title: "Community Support",
    },
  ];

  return (
    <Container className="min-h-screen">
      <div className="flex items-center justify-center gap-10">
        <div className="w-1/2 flex flex-col gap-6">
          <p className="bg-brand text-white px-6 py-3 rounded-full font-medium w-fit text-sm uppercase">
            Elevate.Social
          </p>
          <h1 className="text-5xl font-bold text-black leading-[1.2] max-w-md">
            Simple. <br />
            Duplicatable. <br />
            <span className="text-brand">Built for Leaders</span> <br />& Their
            Communities.
          </h1>
          <p className="text-lg max-w-md">
            If you've ever tried to set your affiliates up for success only to
            watch them get stuck, overwhelmed, or give up—this was{" "}
            <span className="font-bold">built for you</span>.
          </p>
          <div className="flex gap-4">
            <Link
              href="/get-started"
              className="bg-brand text-white px-6 py-3 rounded-full font-medium"
            >
              Get Started Today
            </Link>
            <Link
              href="/login"
              className="border border-brand text-brand px-6 py-3 rounded-full font-medium"
            >
              See How It Works
            </Link>
          </div>
          <div className="flex gap-8 text-gray-600">
            <div className="flex gap-2 items-center">
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
              <p className="text-sm">One Central Hub</p>
            </div>
            <div className="flex gap-2 items-center">
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
              <p className="text-sm">Friction-Free Setup</p>
            </div>
            <div className="flex gap-2 items-center">
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
              <p className="text-sm">DFY Everything</p>
            </div>
          </div>
        </div>
        <div className="w-1/2">
          <img src="/hero.png" alt="Hero" />
        </div>
      </div>
      <div className="flex items-center justify-between w-full mt-10">
        {points.map((point, index) => (
          <div
            key={index}
            className="flex flex-col items-center justify-center"
          >
            <h2 className="text-4xl font-bold text-brand">{point.value}</h2>
            <p className="text-sm">{point.title}</p>
          </div>
        ))}
      </div>
    </Container>
  );
};

export default Hero;
