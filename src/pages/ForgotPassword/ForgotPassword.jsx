import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  FiMail,
  FiShield,
  FiTrendingUp,
  FiAlertCircle,
  FiCheckCircle,
  FiPackage,
  FiArrowLeft,
} from "react-icons/fi";

import { forgotPasswordApi } from "../../services/auth.service";
import { getShopInitials, getStoredShopInfo } from "../../utils/shopInfo";

const schema = z.object({
  email: z.string().min(1, "សូមបញ្ចូលអ៊ីមែល").email("អ៊ីមែលមិនត្រឹមត្រូវ"),
});

const ForgotPassword = () => {
  const [shopInfo] = useState(() => getStoredShopInfo());
  const [sent, setSent] = useState(false);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { email: "" },
  });

  const mutation = useMutation({
    mutationFn: forgotPasswordApi,
    onSuccess: () => {
      setSent(true);
    },
    onError: (error) => {
      const message =
        error?.response?.data?.message ||
        "មិនអាចផ្ញើសំណើបានទេ សូមព្យាយាមម្ដងទៀត";

      setError("root", {
        type: "server",
        message,
      });
    },
  });

  const onSubmit = (values) => {
    setSent(false);
    mutation.mutate(values.email);
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-50 font-[Hanuman,sans-serif]">
      {/* Background atmosphere */}
      <div className="absolute inset-0">
        <div className="absolute left-[-120px] top-[-120px] h-96 w-96 rounded-full bg-rose-300/30 blur-[120px]" />
        <div className="absolute bottom-[-140px] right-[-120px] h-[28rem] w-[28rem] rounded-full bg-red-300/30 blur-[130px]" />
        <div className="absolute left-1/2 top-1/3 h-72 w-72 -translate-x-1/2 rounded-full bg-amber-200/20 blur-[120px]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a07_1px,transparent_1px),linear-gradient(to_bottom,#0f172a07_1px,transparent_1px)] bg-[size:38px_38px]" />
      </div>

      <div className="relative flex min-h-screen items-center justify-center px-4 py-3">
        <div className="grid w-full max-w-5xl overflow-hidden rounded-3xl border border-white/70 bg-white/85 shadow-[0_24px_60px_-22px_rgba(190,18,60,0.25)] backdrop-blur-xl lg:grid-cols-[1.02fr_1fr]">
          {/* Left Brand Panel */}
          <div className="relative hidden overflow-hidden bg-gradient-to-br from-rose-600 via-red-600 to-red-700 p-8 text-white lg:flex lg:flex-col lg:justify-between xl:p-9">
            <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full border border-white/15" />
            <div className="pointer-events-none absolute -bottom-24 -left-10 h-72 w-72 rounded-full border border-white/10" />
            <div className="pointer-events-none absolute right-10 bottom-32 h-3 w-3 rounded-full bg-white/40" />

            <div className="relative">
              <div className="inline-flex items-center gap-3 rounded-2xl bg-white/15 px-3.5 py-3 ring-1 ring-white/20 backdrop-blur">
                <div className="login-icon-3d flex h-11 w-11 items-center justify-center rounded-xl bg-white text-red-600">
                  <span className="text-sm font-extrabold">{getShopInitials(shopInfo.name)}</span>
                </div>
                <div className="leading-tight">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/80">
                    {shopInfo.name}
                  </p>
                  <h2 className="text-base font-semibold leading-6">
                    {shopInfo.khmerName || "ប្រព័ន្ធគ្រប់គ្រងស្តុក និងលក់"}
                  </h2>
                </div>
              </div>

              <div className="mt-10 max-w-md">
                <h1 className="text-[2.15rem] font-bold leading-[1.25]">
                  ភ្លេចពាក្យសម្ងាត់?
                  <span className="block text-white/95">មិនអីទេ យើងជួយអ្នក</span>
                </h1>
                <p className="mt-4 text-sm leading-7 text-white/85">
                  បញ្ចូលអ៊ីមែលដែលបានចុះឈ្មោះ ហើយយើងនឹងផ្ញើតំណកំណត់ពាក្យសម្ងាត់ឡើងវិញទៅឱ្យអ្នក។
                </p>
              </div>
            </div>

            <div className="relative mt-7 grid gap-2.5">
              <Feature
                icon={<FiShield className="text-lg" />}
                title="សុវត្ថិភាពខ្ពស់"
                desc="តំណកំណត់ពាក្យសម្ងាត់ផុតកំណត់ក្នុងរយៈពេល ៦០ នាទី។"
              />
              <Feature
                icon={<FiTrendingUp className="text-lg" />}
                title="គ្រប់គ្រងប្រតិបត្តិការប្រចាំថ្ងៃ"
                desc="តាមដានស្តុក ការលក់ និងសកម្មភាពហាងយ៉ាងមានប្រសិទ្ធភាព។"
              />
              <Feature
                icon={<FiPackage className="text-lg" />}
                title="គ្រប់គ្រងទំនិញច្បាស់លាស់"
                desc="ដឹងពីបរិមាណស្តុក និងចលនាទំនិញគ្រប់ពេលវេលា។"
              />
            </div>
          </div>

          {/* Right Form Panel */}
          <div className="flex items-center justify-center p-5 sm:p-7 lg:p-9">
            <div className="w-full max-w-sm">
              <div className="mb-6 flex items-center gap-3 lg:hidden">
                <div className="login-icon-3d flex h-12 w-12 items-center justify-center rounded-xl bg-red-600 text-white">
                  <span className="text-base font-extrabold">{getShopInitials(shopInfo.name)}</span>
                </div>
                <div className="leading-tight">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-red-600">
                    {shopInfo.name}
                  </p>
                  <p className="text-sm font-semibold text-slate-700">
                    {shopInfo.khmerName || "ប្រព័ន្ធគ្រប់គ្រងស្តុក និងលក់"}
                  </p>
                </div>
              </div>

              <div className="mb-6">
                <div className="login-icon-3d mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-red-500 to-rose-600 text-white">
                  <FiMail className="text-xl" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900">ភ្លេចពាក្យសម្ងាត់</h2>
                <p className="mt-1.5 text-sm leading-6 text-slate-500">
                  បញ្ចូលអ៊ីមែលរបស់អ្នក ដើម្បីទទួលតំណកំណត់ពាក្យសម្ងាត់ឡើងវិញ។
                </p>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    អ៊ីមែល
                  </label>
                  <div className="group relative">
                    <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 transition group-focus-within:text-red-500">
                      <FiMail />
                    </span>
                    <input
                      type="email"
                      {...register("email")}
                      placeholder="បញ្ចូលអ៊ីមែលរបស់អ្នក"
                      className={`w-full rounded-xl border bg-white py-3 pl-11 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:ring-4 focus:ring-red-100 ${
                        errors.email
                          ? "border-red-400 focus:border-red-500"
                          : "border-slate-200 focus:border-red-500"
                      }`}
                    />
                  </div>
                  {errors.email && (
                    <p className="mt-2 text-sm text-red-500">
                      {errors.email.message}
                    </p>
                  )}
                </div>

                {sent && (
                  <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                    <FiCheckCircle className="mt-0.5 shrink-0" />
                    <span>
                      ប្រសិនបើអ៊ីមែលនេះមានចុះឈ្មោះ តំណកំណត់ពាក្យសម្ងាត់ឡើងវិញត្រូវបានផ្ញើទៅហើយ។
                      សូមពិនិត្យមើលប្រអប់សំបុត្ររបស់អ្នក។
                    </span>
                  </div>
                )}

                {errors.root && (
                  <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                    <FiAlertCircle className="mt-0.5 shrink-0" />
                    <span>{errors.root.message}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={mutation.isPending}
                  className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-red-400/40 bg-gradient-to-r from-red-500 to-rose-600 px-4 text-sm font-semibold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.3),0_3px_0_#be123c,0_8px_14px_rgba(225,29,72,0.22)] transition hover:-translate-y-0.5 hover:from-red-600 hover:to-rose-700 hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.34),0_4px_0_#9f1239,0_10px_17px_rgba(225,29,72,0.26)] active:translate-y-0.5 active:scale-[0.99] active:shadow-[inset_0_2px_4px_rgba(127,29,29,0.18),0_1px_0_#9f1239,0_3px_7px_rgba(225,29,72,0.2)] disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {mutation.isPending ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                      កំពុងផ្ញើ...
                    </>
                  ) : (
                    "ផ្ញើតំណកំណត់ពាក្យសម្ងាត់"
                  )}
                </button>
              </form>

              <Link
                to="/login"
                className="mt-5 flex items-center justify-center gap-2 text-sm font-semibold text-slate-500 hover:text-red-600"
              >
                <FiArrowLeft />
                ត្រឡប់ទៅចូលប្រើប្រាស់
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const Feature = ({ icon, title, desc }) => (
  <div className="flex items-start gap-3 rounded-xl bg-white/10 p-3 ring-1 ring-white/10 backdrop-blur-sm transition hover:bg-white/15">
    <div className="quick-action-icon-3d mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/15">
      {icon}
    </div>
    <div>
      <h3 className="text-sm font-semibold">{title}</h3>
      <p className="mt-0.5 text-[12px] leading-5 text-white/80">{desc}</p>
    </div>
  </div>
);

export default ForgotPassword;
