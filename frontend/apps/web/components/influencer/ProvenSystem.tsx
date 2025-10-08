import React from "react";
import Container from "../common/Container";
import Image from "next/image";

const ProvenSystem = () => {
  return (
    <Container>
      <div className="grid lg:grid-cols-2 gap-20 items-center">
        {/* Left Side - Image/Visual */}
        <img
          src="/new.jpg"
          alt=""
          className="w-full h-full object-cover rounded-3xl shadow-2xl"
        />

        {/* Right Side - Content */}
        <div className="space-y-8">
          {/* Header */}
          <div>
            <p className="text-sm font-semibold mb-3">
              The New Way <span className="text-brand">Elevate.Social</span>
            </p>
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Instead of fragments and overwhelm,{" "}
              <span className="text-green-500">one simple,</span>
              <br />
              <span className="text-green-500">duplicatable system.</span>
            </h2>
            <p className="text-gray-700 text-base leading-relaxed">
              Affiliates go from sign-up to set-up in{" "}
              <span className="text-brand font-semibold">
                minutes—not months.
              </span>
            </p>
          </div>

          {/* CTA Button */}
          <button className="bg-gray-900 hover:bg-gray-800 text-white font-bold text-sm px-8 py-4 rounded-lg transition-colors duration-200">
            SHOW ME ELEVATE.SOCIAL
          </button>
        </div>
      </div>
    </Container>
  );
};

export default ProvenSystem;
