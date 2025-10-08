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
    <Container>
      <div className="flex flex-col lg:flex-row items-center justify-center gap-10">
        <div className="w-full lg:w-1/2 flex flex-col gap-6 mt-10 lg:mt-0">
          <p className="bg-brand text-white px-6 py-3 rounded-full font-medium w-fit text-sm uppercase">
            Elevate.Social
          </p>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-black leading-[1.2] max-w-md">
            Simple. <br />
            Duplicatable. <br />
            <span className="text-brand">Built for Leaders</span> <br />& Their
            Communities.
          </h1>
          <p className="text-base lg:text-lg max-w-md">
            If you've ever tried to set your affiliates up for success only to
            watch them get stuck, overwhelmed, or give up—this was{" "}
            <span className="font-bold">built for you</span>.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link
              href="/get-started"
              className="bg-brand text-white px-6 py-3 rounded-full font-medium text-center"
            >
              Get Started Today
            </Link>
            <Link
              href="/login"
              className="border border-brand text-brand px-6 py-3 rounded-full font-medium text-center"
            >
              See How It Works
            </Link>
          </div>
          <div className="flex flex-wrap gap-4 lg:gap-8 text-gray-600">
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
        <div className="w-full lg:w-1/2">
          <img src="/hero.png" alt="Hero" className="w-full h-auto" />
        </div>
      </div>
      <div className="grid grid-cols-2 lg:flex lg:items-center lg:justify-between w-full mt-10 gap-4">
        {points.map((point, index) => (
          <div
            key={index}
            className="flex flex-col items-center justify-center"
          >
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-brand">
              {point.value}
            </h2>
            <p className="text-xs sm:text-sm text-center">{point.title}</p>
          </div>
        ))}
      </div>
    </Container>
  );
};

export default Hero;
