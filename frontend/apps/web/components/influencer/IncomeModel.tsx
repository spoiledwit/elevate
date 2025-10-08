import React from "react";
import Container from "../common/Container";

const IncomeModel = () => {
  return (
    <div className="bg-gradient-to-b from-brand to-white">
      <Container>
        <h1 className="text-white text-2xl sm:text-3xl lg:text-4xl font-bold max-w-xl">
          Earn While You Learn — Simple, Transparent, Real
        </h1>
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-10 mt-10">
          <div className="w-full lg:w-1/2 rounded-lg bg-white shadow-lg p-5 flex flex-col gap-4">
            <h2 className="text-lg font-bold text-brand">
              Simple Commission Model
            </h2>
            <div className="flex gap-2 items-center">
              <h3 className="text-2xl font-semibold">$30</h3>{" "}
              <p className="text-sm text-gray-500">per affiliate signup</p>
            </div>
            <p className="text-sm text-gray-500">
              No tiers, no confusion. Just $30 for every affiliate who joins
              your community.
            </p>
          </div>
          <div className="w-full lg:w-1/2 rounded-lg bg-white shadow-lg p-5 flex flex-col gap-4">
            <h2 className="text-lg font-bold text-brand">
              Community Leaders Earn Big
            </h2>
            <div className="flex gap-2 items-center">
              <h3 className="text-2xl font-semibold ">$3,000/mo</h3>
              <p className="text-sm text-gray-500">with 100 affiliates</p>
            </div>
            <div className="flex gap-2 items-center">
              <h3 className="text-2xl font-semibold ">$9,000/mo</h3>
              <p className="text-sm text-gray-500">with 300 affiliates</p>
            </div>
            <div className="flex gap-2 items-center">
              <h3 className="text-2xl font-semibold ">$15,000/mo</h3>
              <p className="text-sm text-gray-500">with 500 affiliates</p>
            </div>
            <p className="text-sm text-gray-500">
              Stack monthly commissions as your community grows.
            </p>
            <p className="bg-brand text-white px-6 py-3 rounded-full font-medium w-fit text-sm uppercase">
              See payout chart
            </p>
          </div>
        </div>
      </Container>
    </div>
  );
};

export default IncomeModel;
