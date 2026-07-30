import { useEffect, useMemo, useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FiCheckCircle, FiSettings } from "react-icons/fi";

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
import {
  DEFAULT_SHOP_INFO,
  getStoredShopInfo,
  saveStoredShopInfo,
} from "../../../utils/shopInfo";

export default function Setting() {
  const outlet   = useOutletContext();
  const isDark   = outlet?.isDark ?? false;
  const navigate = useNavigate();
  const qc       = useQueryClient();

  const { user: authUser } = useAuthStore();
  const theme = useMemo(() => getSettingTheme(isDark), [isDark]);

  const [activeSection, setActiveSection] = useState("profile");
  const [profile, setProfile]             = useState({ name: "", email: "", phone: "" });
  const [shopInfo, setShopInfo]           = useState(DEFAULT_SHOP_INFO);
  const [savedMessage, setSavedMessage]   = useState("");
  const [errorMessage, setErrorMessage]   = useState("");

  const { data: meData, isLoading: isMeLoading } = useQuery({
    queryKey: ["me"],
    queryFn:  meApi,
  });
  const user = meData?.data ?? authUser;

  const { data: rateData, isLoading: isRateLoading } = useQuery({
    queryKey: ["exchange-rate-active"],
    queryFn:  getActiveExchangeRateApi,
  });
  const rate = rateData?.data ?? null;
  const isLoading = isMeLoading || isRateLoading;

  useEffect(() => {
    if (user) {
      setProfile({
        name:  user.name  ?? "",
        email: user.email ?? "",
        phone: user.phone ?? "",
      });
    }
  }, [user]);

  useEffect(() => {
    setShopInfo(getStoredShopInfo());
  }, []);

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

  const handleSaveShopInfo = () => {
    const savedShopInfo = saveStoredShopInfo(shopInfo);
    setShopInfo(savedShopInfo);
    setErrorMessage("");
    setSavedMessage("ព័ត៌មានហាងត្រូវបានរក្សាទុករួចរាល់។");
    setTimeout(() => setSavedMessage(""), 2500);
  };

  return (
    <section className="space-y-4">
      <div className={`min-w-0 overflow-hidden rounded-2xl border shadow-sm lg:grid lg:grid-cols-[300px_minmax(0,1fr)] ${theme.card}`}>
        <SettingsSidebar
          theme={theme}
          sections={settingSections}
          activeSection={activeSection}
          onSectionChange={setActiveSection}
        />

        <div className={`min-w-0 p-3 sm:p-5 lg:p-6 ${theme.content}`}>
          {isLoading ? (
            <Settings3DLoading theme={theme} />
          ) : (
          <div className="mx-auto max-w-7xl">
            {savedMessage && (
              <div className="mb-5 flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                <FiCheckCircle className="shrink-0" />
                {savedMessage}
              </div>
            )}

            {errorMessage && (
              <div className="mb-5 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-500">
                {errorMessage}
              </div>
            )}

            {activeSection === "profile" && (
              <ProfileSettings
                theme={theme}
                profile={profile}
                user={user}
                onChange={(field, value) =>
                  setProfile((prev) => ({ ...prev, [field]: value }))
                }
                onSave={handleSaveProfile}
                isSaving={updateMutation.isPending}
              />
            )}

            {activeSection === "password" && (
              <PasswordSettings
                theme={theme}
                onSave={handleSavePassword}
                isSaving={passwordMutation.isPending}
              />
            )}

            {activeSection === "shop" && (
              <ShopInfoSettings
                theme={theme}
                shopInfo={shopInfo}
                onChange={(field, value) =>
                  setShopInfo((prev) => ({ ...prev, [field]: value }))
                }
                onSave={handleSaveShopInfo}
                onManageExchange={() => navigate("/home/exchange-rate")}
              />
            )}

            {activeSection === "rules" && (
              <div className="space-y-8">
                <SalesRulesSettings theme={theme} />
                <div className={`border-t ${theme.divider}`} />
                <InventoryRulesSettings theme={theme} />
                <div className={`border-t ${theme.divider}`} />
                <PurchaseRulesSettings theme={theme} />
              </div>
            )}

            {activeSection === "system" && (
              <SystemToolsSettings
                theme={theme}
                onGoBackup={() => navigate("/home/backup-data")}
                onGoAudit={() => navigate("/home/audit-log")}
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
          )}
        </div>
      </div>
    </section>
  );
}

function Settings3DLoading({ theme }) {
  return (
    <div
      className="flex min-h-[420px] flex-col items-center justify-center"
      role="status"
      aria-live="polite"
    >
      <div
        className="relative flex h-32 w-32 items-center justify-center"
        style={{ perspective: "700px" }}
      >
        <div className="absolute bottom-1 h-5 w-20 animate-pulse rounded-[50%] bg-red-500/25 blur-md" />

        <div className="absolute inset-2 animate-spin rounded-full border border-dashed border-red-400/50 [animation-duration:3s]" />
        <div className="absolute inset-5 animate-spin rounded-full border-2 border-transparent border-l-rose-400 border-r-red-500 [animation-direction:reverse] [animation-duration:1.8s]" />

        <div
          className="relative flex h-16 w-16 items-center justify-center rounded-[20px] border border-white/40 bg-gradient-to-br from-rose-400 via-red-500 to-red-700 text-white"
          style={{
            transform: "rotateX(12deg) rotateY(-18deg) translateZ(18px)",
            boxShadow:
              "14px 18px 24px rgba(127, 29, 29, 0.28), inset 4px 4px 10px rgba(255,255,255,0.32), inset -5px -7px 12px rgba(127,29,29,0.28)",
          }}
        >
          <div className="absolute inset-1 rounded-[16px] border border-white/20" />
          <FiSettings className="relative animate-spin text-3xl drop-shadow-md [animation-duration:3s]" />
          <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full border-2 border-white bg-emerald-400 shadow-lg shadow-emerald-400/40" />
        </div>
      </div>

      <p className={`mt-3 text-sm font-bold ${theme.pageTitle}`}>
        រង់ចាំបន្តិច...
      </p>
      <p className={`mt-1 text-xs ${theme.muted}`}>
        កំពុងរៀបចំការកំណត់
      </p>
    </div>
  );
}
