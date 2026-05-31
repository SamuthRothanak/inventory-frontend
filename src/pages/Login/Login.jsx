import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  FiUser,
  FiLock,
  FiEye,
  FiEyeOff,
  FiShield,
  FiBox,
  FiTrendingUp,
  FiAlertCircle,
  FiPackage,
  FiUsers,
} from "react-icons/fi";

import { loginApi } from "../../services/auth.service";
import { useAuthStore } from "../../store/authStore";

const schema = z.object({
  login: z.string().min(1, "សូមបញ្ចូលឈ្មោះអ្នកប្រើ ឬអ៊ីមែល"),
  password: z.string().min(6, "ពាក្យសម្ងាត់ត្រូវមានយ៉ាងតិច ៦ តួអក្សរ"),
});

const getNames = (items) => {
  if (!Array.isArray(items)) return [];
  return items
    .map((item) => {
      if (typeof item === "string") return item;
      if (item && typeof item === "object") return item.name;
      return null;
    })
    .filter(Boolean);
};

const Login = () => {
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);
  const token = useAuthStore((state) => state.token);
  const roles = useAuthStore((state) => state.roles);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      login: "",
      password: "",
    },
  });

  const redirectByRole = (roleList = []) => {
    if (roleList.includes("admin")) {
      navigate("/home", { replace: true });
      return;
    }

    if (roleList.includes("cashier")) {
      navigate("/pos", { replace: true });
      return;
    }

    navigate("/login", { replace: true });
  };

  useEffect(() => {
    if (token) {
      redirectByRole(roles);
    }
  }, [token, roles]);

  const mutation = useMutation({
    mutationFn: loginApi,
    onSuccess: (response) => {
      const payload = response?.data ?? response;
      const user = payload?.user ?? null;

      const userRoles = getNames(user?.roles ?? payload?.roles ?? []);
      const userPermissions = getNames(
        user?.permissions ?? payload?.permissions ?? []
      );

      setAuth({
        token: payload?.token,
        tokenType: payload?.token_type || "Bearer",
        user,
        roles: userRoles,
        permissions: userPermissions,
      });

      redirectByRole(userRoles);
    },
    onError: (error) => {
      const message =
        error?.response?.data?.errors?.login?.[0] ||
        error?.response?.data?.message ||
        "ការចូលប្រើបានបរាជ័យ សូមពិនិត្យព័ត៌មានរបស់អ្នកម្ដងទៀត";

      setError("root", {
        type: "server",
        message,
      });
    },
  });

  const onSubmit = (values) => {
    mutation.mutate(values);
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

      <div className="relative flex min-h-screen items-center justify-center px-4 py-8">
        <div className="grid w-full max-w-6xl overflow-hidden rounded-[28px] border border-white/70 bg-white/85 shadow-[0_30px_80px_-20px_rgba(190,18,60,0.25)] backdrop-blur-xl lg:grid-cols-[1.05fr_1fr]">
          {/* Left Brand Panel */}
          <div className="relative hidden overflow-hidden bg-gradient-to-br from-rose-600 via-red-600 to-red-700 p-10 text-white lg:flex lg:flex-col lg:justify-between xl:p-12">
            {/* decorative rings */}
            <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full border border-white/15" />
            <div className="pointer-events-none absolute -bottom-24 -left-10 h-72 w-72 rounded-full border border-white/10" />
            <div className="pointer-events-none absolute right-10 bottom-32 h-3 w-3 rounded-full bg-white/40" />

            <div className="relative">
              <div className="inline-flex items-center gap-3 rounded-2xl bg-white/15 px-4 py-3 ring-1 ring-white/20 backdrop-blur">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white text-red-600 shadow-lg">
                  <FiBox className="text-2xl" />
                </div>
                <div className="leading-tight">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-white/80">
                    HAKLEY MART
                  </p>
                  <h2 className="text-base font-semibold">
                    ប្រព័ន្ធគ្រប់គ្រងស្តុក និងលក់
                  </h2>
                </div>
              </div>

              <div className="mt-14 max-w-md">
                <h1 className="text-[2.6rem] font-bold leading-[1.25]">
                  គ្រប់គ្រងស្តុក និងការលក់
                  <span className="block text-white/95">ងាយស្រួលក្នុងកន្លែងតែមួយ</span>
                </h1>
                <p className="mt-6 text-[15px] leading-8 text-white/85">
                  គ្រប់គ្រងទំនិញ ស្តុក អ្នកផ្គត់ផ្គង់ អតិថិជន
                  និងការលក់ប្រចាំថ្ងៃ ប្រកបដោយសុវត្ថិភាព និងភាពរលូន។
                </p>
              </div>
            </div>

            <div className="relative mt-10 grid gap-3">
              <Feature
                icon={<FiShield className="text-lg" />}
                title="សុវត្ថិភាពខ្ពស់"
                desc="ការចូលប្រើតាមតួនាទី សម្រាប់បុគ្គលិកដែលមានសិទ្ធិ។"
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
          <div className="flex items-center justify-center p-6 sm:p-10 lg:p-12">
            <div className="w-full max-w-md">
              {/* Mobile brand */}
              <div className="mb-8 flex items-center gap-3 lg:hidden">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-600 text-white shadow-lg">
                  <FiBox className="text-2xl" />
                </div>
                <div className="leading-tight">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-red-600">
                    HAKLEY MART
                  </p>
                  <p className="text-sm font-semibold text-slate-700">
                    ប្រព័ន្ធគ្រប់គ្រងស្តុក និងលក់
                  </p>
                </div>
              </div>

              <div className="mb-8">
                <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-red-500 to-rose-600 text-white shadow-lg shadow-red-200">
                  <FiShield className="text-2xl" />
                </div>
                <h2 className="text-3xl font-bold text-slate-900">ចូលប្រើប្រាស់</h2>
                <p className="mt-2 text-sm leading-7 text-slate-500">
                  សូមបញ្ចូលព័ត៌មានគណនីរបស់អ្នក ដើម្បីចូលប្រើប្រព័ន្ធ Hakley Mart។
                </p>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                {/* Username */}
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    ឈ្មោះអ្នកប្រើ ឬអ៊ីមែល
                  </label>
                  <div className="group relative">
                    <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 transition group-focus-within:text-red-500">
                      <FiUser />
                    </span>
                    <input
                      type="text"
                      {...register("login")}
                      placeholder="បញ្ចូលឈ្មោះអ្នកប្រើ ឬអ៊ីមែល"
                      className={`w-full rounded-xl border bg-white py-3.5 pl-11 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:ring-4 focus:ring-red-100 ${
                        errors.login
                          ? "border-red-400 focus:border-red-500"
                          : "border-slate-200 focus:border-red-500"
                      }`}
                    />
                  </div>
                  {errors.login && (
                    <p className="mt-2 text-sm text-red-500">
                      {errors.login.message}
                    </p>
                  )}
                </div>

                {/* Password */}
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    ពាក្យសម្ងាត់
                  </label>
                  <div className="group relative">
                    <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 transition group-focus-within:text-red-500">
                      <FiLock />
                    </span>
                    <input
                      type={showPassword ? "text" : "password"}
                      {...register("password")}
                      placeholder="បញ្ចូលពាក្យសម្ងាត់"
                      className={`w-full rounded-xl border bg-white py-3.5 pl-11 pr-12 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:ring-4 focus:ring-red-100 ${
                        errors.password
                          ? "border-red-400 focus:border-red-500"
                          : "border-slate-200 focus:border-red-500"
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-red-500"
                      aria-label={showPassword ? "លាក់ពាក្យសម្ងាត់" : "បង្ហាញពាក្យសម្ងាត់"}
                    >
                      {showPassword ? <FiEyeOff /> : <FiEye />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="mt-2 text-sm text-red-500">
                      {errors.password.message}
                    </p>
                  )}
                </div>

                {/* Server error */}
                {errors.root && (
                  <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                    <FiAlertCircle className="mt-0.5 shrink-0" />
                    <span>{errors.root.message}</span>
                  </div>
                )}

                {/* Submit */}
                <button
                  type="submit"
                  disabled={mutation.isPending}
                  className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-red-500 to-rose-600 px-4 text-sm font-semibold text-white shadow-lg shadow-red-200 transition hover:from-red-600 hover:to-rose-700 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {mutation.isPending ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                      កំពុងចូលប្រើ...
                    </>
                  ) : (
                    "ចូលប្រើប្រាស់"
                  )}
                </button>
              </form>

              <div className="mt-6 flex items-start gap-2.5 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs leading-6 text-slate-500">
                <FiUsers className="mt-0.5 shrink-0 text-slate-400" />
                <span>
                  សម្រាប់បុគ្គលិកដែលមានសិទ្ធិតែប៉ុណ្ណោះ។
                  ការចូលប្រើត្រូវបានផ្ដល់ឲ្យតាមតួនាទីដែលបានកំណត់។
                </span>
              </div>

              <p className="mt-6 text-center text-xs text-slate-400">
                © {new Date().getFullYear()} Hakley Mart · រក្សាសិទ្ធិគ្រប់យ៉ាង
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const Feature = ({ icon, title, desc }) => (
  <div className="flex items-start gap-4 rounded-xl bg-white/10 p-4 ring-1 ring-white/10 backdrop-blur-sm transition hover:bg-white/15">
    <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/15">
      {icon}
    </div>
    <div>
      <h3 className="text-sm font-semibold">{title}</h3>
      <p className="mt-1 text-[13px] leading-6 text-white/80">{desc}</p>
    </div>
  </div>
);

export default Login;