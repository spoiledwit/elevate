import React from "react";
import Container from "../common/Container";
import { CircleX } from "lucide-react";

const ProblemSol = () => {
  return (
    <Container>
      <div className="grid lg:grid-cols-2 gap-12 items-center">
        {/* Left Side - Visual */}
        <div className="relative">
          <div className="bg-brand rounded-3xl p-4 inline-block">
            <h3 className="text-white text-3xl font-semibold">
              The Old Way Looked Like This:
            </h3>
          </div>
          <img
            src="/problem.jpg"
            alt=""
            className="mt-6 ml-12 rounded-3xl h-96 shadow-xl"
          />
        </div>

        {/* Right Side - Content */}
        <div className="space-y-8">
          <h2 className="text-4xl font-bold text-gray-900">
            The result? Friction.
          </h2>

          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <CircleX className="shrink-0 mt-1" />
              <p className="text-xl text-gray-700">
                Assets scattered across multiple platforms
              </p>
            </div>

            <div className="flex items-start gap-3">
              <CircleX className="shrink-0 mt-1" />
              <p className="text-xl text-gray-700">
                Affiliates unsure which software to use (and giving up before
                they started)
              </p>
            </div>

            <div className="flex items-start gap-3">
              <CircleX className="shrink-0 mt-1" />
              <p className="text-xl text-gray-700">
                Landing pages, storefronts, and emails duct-taped together
              </p>
            </div>

            <div className="flex items-start gap-3">
              <CircleX className="shrink-0 mt-1" />
              <p className="text-xl text-gray-700">
                Support inbox full of confused teammates asking about tools you
                didn't even recommend
              </p>
            </div>
          </div>

          <div className="pt-6">
            <div className="flex items-start gap-2 mb-4">
              <span className="text-2xl">👉</span>
              <p className="text-lg text-blue-600 font-semibold">
                And when friction builds, people quit
              </p>
            </div>
            <p className="text-gray-700 text-lg pl-8">
              —not because they aren't capable, but because the path wasn't
              clear.
            </p>
          </div>

          <button className="bg-gray-900 hover:bg-gray-800 text-white font-bold text-lg px-8 py-4 rounded-lg transition-colors duration-200">
            SEE THE NEW WAY
          </button>
        </div>
      </div>
    </Container>
  );
};

export default ProblemSol;
