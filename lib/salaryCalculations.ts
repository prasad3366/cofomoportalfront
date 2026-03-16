export interface SalaryInput {
  ctc: number;
  variablePayPercent: number;
}

export interface SalaryBreakdown {
  ctc: number;
  variablePay: number;
  fixedGross: number;
  basic: number;
  hra: number;
  specialAllowance: number;
  epfEmployee: number;
  epfEmployer: number;
  professionalTax: number;
  incomeTax: number;
  totalDeductions: number;
  netTakeHome: number;
}

export function calculateSalary(input: SalaryInput): SalaryBreakdown {
  const { ctc, variablePayPercent } = input;

  const variablePay = Math.round(ctc * variablePayPercent / 100);
  const fixedGross = ctc - variablePay;
  const basic = Math.round(fixedGross * 0.5);
  const hra = Math.round(basic * 0.5);
  const specialAllowance = fixedGross - basic - hra;

  // EPF: 12% of basic, capped at basic of ₹15,000/month
  const monthlyBasic = basic / 12;
  const epfBase = Math.min(monthlyBasic, 15000);
  const epfEmployee = Math.round(epfBase * 0.12) * 12;
  const epfEmployer = Math.round(epfBase * 0.12) * 12; // employer contribution (info only)

  // Telangana Professional Tax (monthly slabs)
  const monthlyPT = calculateMonthlyPT(fixedGross / 12);
  const professionalTax = monthlyPT * 12;

  // New Tax Regime FY 2025-26
  const incomeTax = calculateNewRegimeTax(fixedGross);

  const totalDeductions = epfEmployee + professionalTax + incomeTax;
  const netTakeHome = fixedGross - totalDeductions;

  return {
    ctc, variablePay, fixedGross, basic, hra, specialAllowance,
    epfEmployee, epfEmployer, professionalTax, incomeTax,
    totalDeductions, netTakeHome,
  };
}

function calculateMonthlyPT(monthlyGross: number): number {
  if (monthlyGross <= 15000) return 0;
  if (monthlyGross <= 20000) return 150;
  return 200;
}

function calculateNewRegimeTax(grossIncome: number): number {
  const stdDeduction = 75000;
  let taxableIncome = grossIncome - stdDeduction;
  if (taxableIncome <= 0) return 0;

  // Rebate u/s 87A: if taxable income ≤ 12,00,000, full rebate
  if (taxableIncome <= 1200000) return 0;

  // New regime slabs FY 2025-26
  const slabs = [
    { limit: 400000, rate: 0 },
    { limit: 800000, rate: 0.05 },
    { limit: 1200000, rate: 0.10 },
    { limit: 1600000, rate: 0.15 },
    { limit: 2000000, rate: 0.20 },
    { limit: 2400000, rate: 0.25 },
    { limit: Infinity, rate: 0.30 },
  ];

  let tax = 0;
  let prev = 0;
  for (const slab of slabs) {
    if (taxableIncome <= prev) break;
    const taxable = Math.min(taxableIncome, slab.limit) - prev;
    tax += taxable * slab.rate;
    prev = slab.limit;
  }

  // 4% Health & Education Cess
  tax = Math.round(tax * 1.04);
  return tax;
}

export function formatINR(amount: number): string {
  return '₹' + Math.round(amount).toLocaleString('en-IN');
}