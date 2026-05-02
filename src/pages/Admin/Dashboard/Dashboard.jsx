import React from "react";
import { useOutletContext } from "react-router-dom";
import {
  FiDollarSign,
  FiShoppingBag,
  FiUsers,
  FiBox,
} from "react-icons/fi";

const cards = [
  { label: "Today Sales", value: "$1,240", icon: FiDollarSign },
  { label: "Orders", value: "86", icon: FiShoppingBag },
  { label: "Customers", value: "148", icon: FiUsers },
  { label: "Products", value: "1,240", icon: FiBox },
];

export default function Dashboard() {
  const { isDark } = useOutletContext();

  const cardStyle = isDark
    ? "bg-zinc-900 border-zinc-800 text-white"
    : "bg-white border-zinc-200 text-zinc-900";

  const muted = isDark ? "text-zinc-400" : "text-zinc-500";

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {cards.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.label} className={`rounded-3xl border p-5 ${cardStyle}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm ${muted}`}>{item.label}</p>
                  <h3 className="mt-2 text-3xl font-bold">{item.value}</h3>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-500 text-white">
                  <Icon className="text-[20px]" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className={`rounded-3xl border p-6 ${cardStyle}`}>
        <h2 className="text-xl font-bold">Welcome back</h2>
        <p className={`mt-2 text-sm ${muted}`}>
          This is your admin dashboard UI. You can keep building products, sales,
          inventory, reports and user management from here.
        </p>
      </div>
    </div>
  );
}