import React from "react";
import Container from "../common/Container";

const Welcome = () => {
  return (
    <div className="bg-gradient-to-b from-[#F5F3EF] via-[#FFFFFF] to-[#F8F6F3]">
      <Container className="flex flex-col items-center justify-center gap-4">
        <div className="flex flex-wrap gap-4 lg:gap-8 text-black justify-center">
          <div className="flex gap-2 items-center">
            <div className="w-1 h-1 rounded-full bg-black"></div>
            <p className="text-xs lg:text-sm">DFY Websites</p>
          </div>
          <div className="flex gap-2 items-center">
            <div className="w-1 h-1 rounded-full bg-black"></div>
            <p className="text-xs lg:text-sm">AI-Powered Tools</p>
          </div>
          <div className="flex gap-2 items-center">
            <div className="w-1 h-1 rounded-full bg-black"></div>
            <p className="text-xs lg:text-sm">Content Ready</p>
          </div>
          <div className="flex gap-2 items-center">
            <div className="w-1 h-1 rounded-full bg-black"></div>
            <p className="text-xs lg:text-sm">Automated Posting</p>
          </div>
          <div className="flex gap-2 items-center">
            <div className="w-1 h-1 rounded-full bg-black"></div>
            <p className="text-xs lg:text-sm">One Central Hub</p>
          </div>
          <div className="flex gap-2 items-center">
            <div className="w-1 h-1 rounded-full bg-black"></div>
            <p className="text-xs lg:text-sm">Duplicatable System</p>
          </div>
          <div className="flex gap-2 items-center">
            <div className="w-1 h-1 rounded-full bg-black"></div>
            <p className="text-xs lg:text-sm">Community-Driven</p>
          </div>
        </div>
        <h3 className="text-brand font-semibold mt-10 text-sm lg:text-base">
          WELCOME TO
        </h3>
        <h1 className="text-2xl sm:text-3xl lg:text-5xl font-semibold text-center px-4">
          Your Affiliate marketing{" "}
          <span className="text-brand">Business-In-A-Box</span> Solution That{" "}
          <span className="text-brand">Removes Friction</span> & Builds{" "}
          <span className="font-extrabold">Momentum</span>
        </h1>
        <p className="text-center text-sm sm:text-base lg:text-lg max-w-lg px-4">
          Because when the path is clear,{" "}
          <span className="font-bold">momentum builds</span> and{" "}
          <span className="font-bold">people succeed</span>
        </p>
        <div className="w-full sm:w-4/5 lg:w-3/5 bg-gray-200 rounded-3xl border-[10px] border-white mt-10 outline outline-[10px] outline-brand shadow-2xl">
          <img
            src="/welcome.jpg"
            alt=""
            className="w-full h-full object-cover rounded-3xl"
          />
        </div>
      </Container>
    </div>
  );
};

export default Welcome;
