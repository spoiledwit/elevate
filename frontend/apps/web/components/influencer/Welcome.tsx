import React from "react";
import Container from "../common/Container";

const Welcome = () => {
  return (
    <Container className="bg-gradient-to-b from-[#F5F3EF] via-[#FFFFFF] to-[#F8F6F3] flex flex-col items-center justify-center gap-4">
      <div className="flex gap-8 text-black justify-center">
        <div className="flex gap-2 items-center">
          <div className="w-1 h-1 rounded-full bg-black"></div>
          <p className="text-sm">DFY Websites</p>
        </div>
        <div className="flex gap-2 items-center">
          <div className="w-1 h-1 rounded-full bg-black"></div>
          <p className="text-sm">AI-Powered Tools</p>
        </div>
        <div className="flex gap-2 items-center">
          <div className="w-1 h-1 rounded-full bg-black"></div>
          <p className="text-sm">Content Ready</p>
        </div>
        <div className="flex gap-2 items-center">
          <div className="w-1 h-1 rounded-full bg-black"></div>
          <p className="text-sm">Automated Posting</p>
        </div>
        <div className="flex gap-2 items-center">
          <div className="w-1 h-1 rounded-full bg-black"></div>
          <p className="text-sm">One Central Hub</p>
        </div>
        <div className="flex gap-2 items-center">
          <div className="w-1 h-1 rounded-full bg-black"></div>
          <p className="text-sm">Duplicatable System</p>
        </div>
        <div className="flex gap-2 items-center">
          <div className="w-1 h-1 rounded-full bg-black"></div>
          <p className="text-sm">Community-Driven</p>
        </div>
      </div>
      <h3 className="text-brand font-semibold mt-10">WELCOME TO</h3>
      <h1 className="text-5xl font-semibold text-center">
        Your Affiliate marketing{" "}
        <span className="text-brand">Business-In-A-Box</span> Solution That{" "}
        <span className="text-brand">Removes Friction</span> & Builds{" "}
        <span className="font-extrabold">Momentum</span>
      </h1>
      <p className="text-center text-lg max-w-lg">
        Because when the path is clear,{" "}
        <span className="font-bold">momentum builds</span> and{" "}
        <span className="font-bold">people succeed</span>
      </p>
      <div className="w-3/5 bg-gray-200 rounded-3xl border-[10px] border-white mt-10 outline outline-[10px] outline-brand shadow-2xl">
        <img
          src="/welcome.jpg"
          alt=""
          className="w-full h-full object-cover rounded-3xl"
        />
      </div>
    </Container>
  );
};

export default Welcome;
