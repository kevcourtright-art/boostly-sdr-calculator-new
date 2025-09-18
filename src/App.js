import React, { useMemo, useState } from "react";

// ===============================
// Boostly SDR Commission Calculator
// Rules encoded from the commission structure document
// ===============================
// Structure:
// - Quota based on QDCs (Qualified Demo Completions)
// - Month multipliers: Month 1 = 0.19, Month 2 = 0.60, Month 3 = 0.86
// - Annual commission potential: $15,000/year ($1,250/month at quota)
// - Multiplier tiers based on quota attainment
// - Formula: % of Quota * Multiplier * Commission at Quota = Commission

export default function SDRCalculatorApp() {
  // ---- Config (editable in the UI) ----
  const [commissionAtQuota, setCommissionAtQuota] = useState(1250);
  
  // Month multipliers
  const [month1Multiplier, setMonth1Multiplier] = useState(0.19);
  const [month2Multiplier, setMonth2Multiplier] = useState(0.60);
  const [month3Multiplier, setMonth3Multiplier] = useState(0.86);
  
  // ---- SDR Inputs ----
  const [selectedMonth, setSelectedMonth] = useState(3);
  const [workingDaysInMonth, setWorkingDaysInMonth] = useState(20);
  const [actualQDCs, setActualQDCs] = useState(0);

  // ---- Helpers ----
  const toNumber = (v) => {
    const n = parseFloat(String(v).replace(/[^0-9.-]/g, ""));
    return Number.isNaN(n) ? 0 : n;
  };
  const fmtMoney = (n) => n.toLocaleString(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 2 });

  // Multiplier tiers
  const getMultiplier = (quotaPercent) => {
    if (quotaPercent >= 1.10) return 1.15;
    if (quotaPercent >= 1.00) return 1.00;
    if (quotaPercent >= 0.50) return 0.75;
    return 0.50;
  };

  // ---- Derived values ----
  const computed = useMemo(() => {
    const monthMultiplier = selectedMonth === 1 ? month1Multiplier : 
                           selectedMonth === 2 ? month2Multiplier : 
                           month3Multiplier;
    
    const workingDays = Math.max(0, toNumber(workingDaysInMonth));
    const actualQDCsNum = Math.max(0, toNumber(actualQDCs));
    const commissionQuota = Math.max(0, toNumber(commissionAtQuota));

    // Calculate quota QDCs: Working Days × Month Multiplier (rounded to whole number)
    const quotaQDCs = Math.round(workingDays * monthMultiplier);
    
    // Calculate quota attainment
    const quotaAttainment = quotaQDCs > 0 ? actualQDCsNum / quotaQDCs : 0;
    
    // Get multiplier based on attainment
    const multiplier = getMultiplier(quotaAttainment);
    
    // Calculate commission: % of Quota * Multiplier * Commission at Quota
    const commission = quotaAttainment * multiplier * commissionQuota;

    return {
      monthMultiplier,
      workingDays,
      quotaQDCs,
      actualQDCs: actualQDCsNum,
      quotaAttainment,
      multiplier,
      commission,
    };
  }, [
    selectedMonth,
    month1Multiplier,
    month2Multiplier,
    month3Multiplier,
    workingDaysInMonth,
    actualQDCs,
    commissionAtQuota,
  ]);

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900 p-6">
      <div className="max-w-5xl mx-auto">
        <header className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-semibold tracking-tight">Boostly • SDR Commission Calculator</h1>
          <div className="text-sm text-neutral-500">QDC = Qualified Demo Completions</div>
        </header>

        {/* Inputs */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
          <section className="col-span-2 bg-white rounded-2xl shadow-sm border border-neutral-200 p-4">
            <h2 className="font-semibold mb-3">SDR Performance Inputs</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1">Quota Calculator</label>
                <select
                  className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-neutral-900"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                >
                  <option value={1}>Ramp Month 1 (0.19 multiplier)</option>
                  <option value={2}>Ramp Month 2 (0.60 multiplier)</option>
                  <option value={3}>Fully Ramped (0.86 multiplier)</option>
                </select>
              </div>

              <LabeledInput
                label="Working Days in Month"
                type="number"
                value={workingDaysInMonth}
                onChange={setWorkingDaysInMonth}
                hint="Excludes PTO days"
              />

              <LabeledInput
                label="Actual QDCs Completed"
                type="number"
                value={actualQDCs}
                onChange={setActualQDCs}
                hint="Total QDCs you actually completed this month"
              />
            </div>
          </section>

          {/* Config panel */}
          <section className="bg-white rounded-2xl shadow-sm border border-neutral-200 p-4">
            <h2 className="font-semibold mb-3">Commission Config</h2>
            <div className="grid grid-cols-1 gap-3">
              <LabeledInput 
                label="Commission at Quota" 
                prefix="$" 
                value={commissionAtQuota} 
                onChange={setCommissionAtQuota} 
                hint="Monthly commission at 100% quota"
              />
            </div>
          </section>
        </div>

        {/* Output */}
        <section className="bg-white rounded-2xl shadow-sm border border-neutral-200 p-4">
          <h2 className="font-semibold mb-4">Commission Summary</h2>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <KPI label="Quota QDCs" value={computed.quotaQDCs.toString()} />
            <KPI label="Actual QDCs" value={computed.actualQDCs.toString()} />
            <KPI label="Quota Attainment" value={`${(computed.quotaAttainment * 100).toFixed(1)}%`} />
            <KPI label="Commission Multiplier" value={`${computed.multiplier}x`} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="border rounded-xl p-3 bg-neutral-50">
              <LineItem label="Quota Calculator" value={`${computed.monthMultiplier} (Month ${selectedMonth})`} />
              <LineItem label="Quota QDCs" value={`${computed.workingDays} × ${computed.monthMultiplier} = ${computed.quotaQDCs}`} />
              <LineItem label="Quota Attainment" value={`${computed.actualQDCs} ÷ ${computed.quotaQDCs} = ${(computed.quotaAttainment * 100).toFixed(1)}%`} />
              <LineItem label="Commission Multiplier" value={`${computed.multiplier}x (based on attainment)`} />
              <div className="my-2 border-t" />
              <LineItem label="Total Commission" value={fmtMoney(computed.commission)} bold large />
            </div>

            <div className="text-sm leading-relaxed text-neutral-700">
              <p className="mb-2 font-medium">How it's calculated</p>
              <ul className="list-disc ml-5 space-y-1">
                <li><span className="font-medium">Attainment:</span> Actual QDCs ÷ Quota QDCs</li>
                <li><span className="font-medium">Multiplier Tiers:</span>
                  <ul className="list-disc ml-5 mt-1">
                    <li>≥110%: 1.15x</li>
                    <li>100-109%: 1.0x</li>
                    <li>50-99%: 0.75x</li>
                    <li>&lt;50%: 0.5x</li>
                  </ul>
                </li>
                <li><span className="font-medium">Commission:</span> Attainment % × Multiplier × Commission at Quota</li>
              </ul>
              <div className="mt-3 p-3 bg-blue-50 text-blue-900 rounded-lg border border-blue-200">
                <div className="font-medium">Example</div>
                At 111% quota: 1.10 × 1.15 × $1,250 = $1,597
              </div>
            </div>
          </div>
        </section>

        <footer className="mt-6 text-xs text-neutral-500">
          © {new Date().getFullYear()} Boostly – Internal tool. Payout on 25th of following month.
        </footer>
      </div>
    </div>
  );
}

function KPI({ label, value }) {
  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-4">
      <div className="text-xs uppercase tracking-wide text-neutral-500">{label}</div>
      <div className="text-xl font-semibold">{value}</div>
    </div>
  );
}

function LineItem({ label, value, bold = false, large = false }) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <div className={`text-neutral-700 ${bold ? "font-semibold" : ""}`}>{label}</div>
      <div className={`${bold ? "font-semibold" : ""} ${large ? "text-lg" : ""}`}>{value}</div>
    </div>
  );
}

function LabeledInput({ label, value, onChange, prefix, suffix, type = "text", step, hint }) {
  return (
    <label className="block">
      <div className="text-sm font-medium mb-1">{label}</div>
      <div className="relative">
        {prefix && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500">{prefix}</span>}
        <input
          className={`w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-neutral-900 ${
            prefix ? "pl-7" : ""
          } ${suffix ? "pr-9" : ""}`}
          type={type}
          step={step}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
        {suffix && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500">{suffix}</span>}
      </div>
      {hint && <div className="text-xs text-neutral-500 mt-1">{hint}</div>}
    </label>
  );
}