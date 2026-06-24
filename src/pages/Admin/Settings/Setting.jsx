import React, { useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import {
  FiBox,
  FiCheckCircle,
  FiRefreshCcw,
  FiSave,
  FiShoppingCart,
  FiTruck,
  FiUser,
} from "react-icons/fi";

import SettingSummaryCard from "./components/SettingSummaryCard";
import SettingsSidebar from "./components/SettingsSidebar";
import {
  InventorySettings,
  PurchaseSettings,
  SalesSettings,
  ShopSettings,
} from "./components/SettingFields";
import { settingDefaults, settingSchema } from "./schemas/setting.schema";
import { settingSections } from "./utils/settingSections";
import { getSettingTheme } from "./utils/settingTheme";

export default function Setting() {
  const outlet = useOutletContext();
  const isDark = outlet?.isDark ?? false;

  const [activeSection, setActiveSection] = useState("shop");
  const [searchTerm, setSearchTerm] = useState("");
  const [settings, setSettings] = useState(settingDefaults);
  const [savedMessage, setSavedMessage] = useState("");

  const theme = useMemo(() => getSettingTheme(isDark), [isDark]);

  const filteredSections = useMemo(() => {
    const keyword = searchTerm.toLowerCase().trim();

    if (!keyword) return settingSections;

    return settingSections.filter(
      (section) =>
        section.title.toLowerCase().includes(keyword) ||
        section.description.toLowerCase().includes(keyword)
    );
  }, [searchTerm]);

  const activeSectionInfo =
    settingSections.find((section) => section.id === activeSection) ||
    settingSections[0];

  const ActiveIcon = activeSectionInfo.icon;

  const updateSetting = (group, field, value) => {
    setSettings((previous) => ({
      ...previous,
      [group]: {
        ...previous[group],
        [field]: value,
      },
    }));

    setSavedMessage("");
  };

  const handleSave = () => {
    const parsed = settingSchema.safeParse(settings);

    if (!parsed.success) {
      setSavedMessage(parsed.error.issues[0]?.message || "Invalid settings.");
      return;
    }

    setSavedMessage("Settings saved successfully.");

    setTimeout(() => {
      setSavedMessage("");
    }, 2500);
  };

  const handleReset = () => {
    setSettings(settingDefaults);
    setSavedMessage("Settings reset to default.");
  };

  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-center justify-end gap-3">
        {savedMessage && (
          <span className="inline-flex h-11 items-center gap-2 rounded-xl bg-emerald-500/10 px-4 text-sm font-semibold text-emerald-600 dark:text-emerald-400">
            <FiCheckCircle />
            {savedMessage}
          </span>
        )}

        <button
          type="button"
          onClick={handleReset}
          className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-zinc-300 bg-white px-5 text-sm font-semibold text-zinc-700 shadow-sm transition hover:bg-zinc-100 hover:text-zinc-950 dark:border-white/10 dark:bg-white/5 dark:text-zinc-200 dark:hover:bg-white/10 dark:hover:text-white"
        >
          <FiRefreshCcw />
          Reset
        </button>

        <button
          type="button"
          onClick={handleSave}
          className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-red-500 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-red-600"
        >
          <FiSave />
          Save Settings
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SettingSummaryCard
          theme={theme}
          title="Shop"
          value={settings.shop.shopName}
          subtitle={settings.shop.phone}
          icon={<FiUser className="text-[32px] text-red-500" />}
          iconBg="bg-red-500/10"
        />

        <SettingSummaryCard
          theme={theme}
          title="Sales Return"
          value={settings.sales.allowSalesReturn ? "Enabled" : "Disabled"}
          subtitle="Refund / exchange flow"
          icon={<FiShoppingCart className="text-[32px] text-emerald-500" />}
          iconBg="bg-emerald-500/10"
        />

        <SettingSummaryCard
          theme={theme}
          title="Stock-In"
          value={
            settings.purchases.requireStockInConfirm ? "Confirm First" : "Auto"
          }
          subtitle="Purchase stock control"
          icon={<FiTruck className="text-[32px] text-blue-500" />}
          iconBg="bg-blue-500/10"
        />

        <SettingSummaryCard
          theme={theme}
          title="Inventory"
          value={settings.inventory.allowNegativeStock ? "Flexible" : "Strict"}
          subtitle={
            settings.inventory.allowNegativeStock
              ? "Negative stock allowed"
              : "No negative stock"
          }
          icon={<FiBox className="text-[32px] text-purple-500" />}
          iconBg="bg-purple-500/10"
        />
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[300px_1fr]">
        <SettingsSidebar
          theme={theme}
          sections={filteredSections}
          activeSection={activeSection}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          onSectionChange={setActiveSection}
        />

        <div className={`overflow-hidden rounded-2xl border shadow-sm ${theme.card}`}>
          <div className="border-b border-zinc-200 px-5 py-4 dark:border-white/10">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-red-500/10 text-red-500">
                <ActiveIcon size={22} />
              </div>

              <div>
                <h2 className={`text-lg font-bold ${theme.pageTitle}`}>
                  {activeSectionInfo.title}
                </h2>

                <p className={`mt-1 text-sm ${theme.muted}`}>
                  {activeSectionInfo.description}
                </p>
              </div>
            </div>
          </div>

          <div className="p-5">
            {activeSection === "shop" && (
              <ShopSettings
                theme={theme}
                settings={settings.shop}
                onChange={(field, value) => updateSetting("shop", field, value)}
              />
            )}

            {activeSection === "sales" && (
              <SalesSettings
                theme={theme}
                settings={settings.sales}
                onChange={(field, value) => updateSetting("sales", field, value)}
              />
            )}

            {activeSection === "purchases" && (
              <PurchaseSettings
                theme={theme}
                settings={settings.purchases}
                onChange={(field, value) =>
                  updateSetting("purchases", field, value)
                }
              />
            )}

            {activeSection === "inventory" && (
              <InventorySettings
                theme={theme}
                settings={settings.inventory}
                onChange={(field, value) =>
                  updateSetting("inventory", field, value)
                }
              />
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
