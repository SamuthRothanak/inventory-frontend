import { useEffect, useMemo, useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FiCheckCircle, FiDatabase, FiDollarSign, FiSave, FiShield, FiUser } from "react-icons/fi";

import SettingSummaryCard from "./components/SettingSummaryCard";
import SettingsSidebar from "./components/SettingsSidebar";
import {
  ExchangeRateInfo,
  InventoryRulesSettings,
  PasswordSettings,
  ProfileSettings,
  PurchaseRulesSettings,
  SalesRulesSettings,
  ShopInfoSettings,
  SystemToolsSettings,
} from "./components/SettingFields";
import { profileSchema } from "./schemas/setting.schema";
import { settingSections } from "./utils/settingSections";
import { getSettingTheme } from "./utils/settingTheme";
import { useAuthStore } from "../../../store/authStore";
import { meApi } from "../../../services/auth.service";
import { resetUserPasswordApi, updateUserApi } from "../../../services/user.service";
import { getActiveExchangeRateApi } from "../../../services/exchangeRate.service";

export default function Setting() {
  const outlet   = useOutletContext();
  const isDark   = outlet?.isDark ?? false;
  const navigate = useNavigate();
  const qc       = useQueryClient();

  const { user: authUser } = useAuthStore();
  const theme = useMemo(() => getSettingTheme(isDark), [isDark]);

  const [activeSection, setActiveSection] = useState("profile");
  const [profile, setProfile]             = useState({ name: "", email: "", phone: "" });
  const [savedMessage, setSavedMessage]   = useState("");
  const [errorMessage, setErrorMessage]   = useState("");

  const { data: meData } = useQuery({
    queryKey: ["me"],
    queryFn:  meApi,
  });
  const user = meData?.data ?? authUser;

  const { data: rateData } = useQuery({
    queryKey: ["exchange-rate-active"],
    queryFn:  getActiveExchangeRateApi,
  });
  const rate = rateData?.data ?? null;

  useEffect(() => {
    if (user) {
      setProfile({
        name:  user.name  ?? "",
        email: user.email ?? "",
        phone: user.phone ?? "",
      });
    }
  }, [user]);

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }) => updateUserApi({ id, payload }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["me"] });
      setErrorMessage("");
      setSavedMessage("ព័ត៌មានគណនីត្រូវបានរក្សាទុករួចរាល់។");
      setTimeout(() => setSavedMessage(""), 2500);
    },
    onError: (err) => {
      setErrorMessage(err?.response?.data?.message ?? "កំហុស! សូមព្យាយាមម្ដងទៀត។");
    },
  });

  const passwordMutation = useMutation({
    mutationFn: (password) => resetUserPasswordApi({ id: user?.id, password }),
    onSuccess: () => {
      setErrorMessage("");
      setSavedMessage("ពាក្យសម្ងាត់ត្រូវបានផ្លាស់ប្ដូររួចរាល់។");
      setTimeout(() => setSavedMessage(""), 2500);
    },
    onError: (err) => {
      setErrorMessage(err?.response?.data?.message ?? "កំហុស! សូមព្យាយាមម្ដងទៀត។");
    },
  });

  const handleSaveProfile = () => {
    const result = profileSchema.safeParse(profile);
    if (!result.success) {
      setErrorMessage(result.error.issues[0]?.message ?? "ទិន្នន័យមិនត្រឹមត្រូវ។");
      return;
    }
    if (!user?.id) return;
    setErrorMessage("");
    updateMutation.mutate({ id: user.id, payload: result.data });
  };

  const handleSavePassword = (password, resetForm) => {
    passwordMutation.mutate(password, { onSuccess: resetForm });
  };

  const activeSectionInfo =
    settingSections.find((s) => s.id === activeSection) ?? settingSections[0];
  const ActiveIcon = activeSectionInfo.icon;

  const userRole = (authUser?.roles ?? user?.roles ?? [])[0] ?? "—";

  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-center justify-end gap-3">
        {savedMessage && (
          <span className="inline-flex h-11 items-center gap-2 rounded-xl bg-emerald-500/10 px-4 text-sm font-semibold text-emerald-600 dark:text-emerald-400">
            <FiCheckCircle />
            {savedMessage}
          </span>
        )}

        {errorMessage && (
          <span className="inline-flex h-11 items-center rounded-xl bg-red-500/10 px-4 text-sm font-semibold text-red-500">
            {errorMessage}
          </span>
        )}

        {activeSection === "profile" && (
          <button
            type="button"
            onClick={handleSaveProfile}
            disabled={updateMutation.isPending}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-red-500 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-red-600 disabled:opacity-60"
          >
            <FiSave />
            {updateMutation.isPending ? "កំពុងរក្សាទុក..." : "រក្សាទុក"}
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SettingSummaryCard
          theme={theme}
          title="គណនី"
          value={user?.name ?? "—"}
          subtitle={user?.email ?? "—"}
          icon={<FiUser className="text-[32px] text-red-500" />}
          iconBg="bg-red-500/10"
        />
        <SettingSummaryCard
          theme={theme}
          title="តួនាទី"
          value={userRole}
          subtitle="សិទ្ធិប្រើប្រាស់ប្រព័ន្ធ"
          icon={<FiShield className="text-[32px] text-purple-500" />}
          iconBg="bg-purple-500/10"
        />
        <SettingSummaryCard
          theme={theme}
          title="អត្រាប្ដូររូបិយប័ណ្ណ"
          value={rate ? `1 USD = ${Number(rate.usd_to_khr_rate).toLocaleString()} ៛` : "—"}
          subtitle={rate ? rate.rate_date : "មិនទាន់មានអត្រា"}
          icon={<FiDollarSign className="text-[32px] text-emerald-500" />}
          iconBg="bg-emerald-500/10"
        />
        <SettingSummaryCard
          theme={theme}
          title="សុវត្ថិភាពទិន្នន័យ"
          value="Backup / Audit"
          subtitle="ប្រើ module ដែលមានស្រាប់"
          icon={<FiDatabase className="text-[32px] text-blue-500" />}
          iconBg="bg-blue-500/10"
        />
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[280px_1fr]">
        <SettingsSidebar
          theme={theme}
          sections={settingSections}
          activeSection={activeSection}
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
            {activeSection === "profile" && (
              <ProfileSettings
                theme={theme}
                profile={profile}
                onChange={(field, value) =>
                  setProfile((prev) => ({ ...prev, [field]: value }))
                }
              />
            )}

            {activeSection === "shop" && (
              <ShopInfoSettings
                theme={theme}
                user={user}
                onManageExchange={() => navigate("/home/exchange-rate")}
              />
            )}

            {activeSection === "password" && (
              <PasswordSettings
                theme={theme}
                onSave={handleSavePassword}
                isSaving={passwordMutation.isPending}
              />
            )}

            {activeSection === "sales" && (
              <SalesRulesSettings theme={theme} />
            )}

            {activeSection === "inventory" && (
              <InventoryRulesSettings theme={theme} />
            )}

            {activeSection === "purchase" && (
              <PurchaseRulesSettings theme={theme} />
            )}

            {activeSection === "system" && (
              <SystemToolsSettings
                theme={theme}
                onGoBackup={() => navigate("/home/backup-data")}
                onGoAudit={() => navigate("/home/audit-log")}
                onGoExchange={() => navigate("/home/exchange-rate")}
              />
            )}

            {activeSection === "exchange" && (
              <ExchangeRateInfo
                theme={theme}
                rate={rate}
                onManage={() => navigate("/home/exchange-rate")}
              />
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
