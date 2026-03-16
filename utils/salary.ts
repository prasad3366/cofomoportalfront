
import { SalaryConfig, SalaryBreakup } from '../types';

export const calculateSalaryBreakup = (config: SalaryConfig): SalaryBreakup => {
  const annualCTC = config.ctc * 100000;
  
  // --- Constants (2026 Policy Compliant) ---
  const PF_RATE = 0.12; // 12% of Basic
  const GRATUITY_RATE = 0.0481; // 4.81% of Basic
  const HEALTH_INSURANCE_ANNUAL = 7900; // Fixed standard rate
  const CITY_ALLOWANCE_MONTHLY = 200;
  const PROFESSIONAL_TAX_MONTHLY = 200;

  // --- 1. Performance Pay ---
  const performancePayAnnual = annualCTC * (config.variablePercentage / 100);
  const performancePayMonthly = performancePayAnnual / 12;

  // --- 2. Fixed CTC (Base for other calculations) ---
  const fixedCTC = annualCTC - performancePayAnnual;

  // --- 3. Basic Salary ---
  // Typically 35-40% of CTC or 50% of Fixed. Let's use 40% of Annual CTC as standard base.
  const basicAnnual = annualCTC * 0.40;
  const basicMonthly = basicAnnual / 12;

  // --- 4. Retirals ---
  const pfEmployerAnnual = basicAnnual * PF_RATE;
  const pfEmployerMonthly = pfEmployerAnnual / 12;

  const gratuityAnnual = basicAnnual * GRATUITY_RATE;
  const gratuityMonthly = gratuityAnnual / 12;

  const healthInsuranceAnnual = HEALTH_INSURANCE_ANNUAL;
  const healthInsuranceMonthly = 0; // Usually annual deduction or paid by company, not part of monthly cash flow typically

  const cityAllowanceAnnual = CITY_ALLOWANCE_MONTHLY * 12;
  const cityAllowanceMonthly = CITY_ALLOWANCE_MONTHLY;

  // --- 5. Bouquet of Benefits (BoB) ---
  // BoB is the balancing figure: FixedCTC - (Basic + City + Retirals)
  const retiralsTotal = pfEmployerAnnual + gratuityAnnual + healthInsuranceAnnual;
  const fixedAllowancesTotal = basicAnnual + cityAllowanceAnnual;
  
  let bouquetOfBenefitsAnnual = fixedCTC - (fixedAllowancesTotal + retiralsTotal);
  if (bouquetOfBenefitsAnnual < 0) bouquetOfBenefitsAnnual = 0; // Safety check
  const bouquetOfBenefitsMonthly = bouquetOfBenefitsAnnual / 12;

  // --- 6. BoB Breakdown (Table 2) ---
  // Structure: HRA (50% Basic), LTA (Fixed/Small %), Food Card, Balance to Personal/Special
  const hraAnnual = basicAnnual * 0.50; // Metro rate
  const hraMonthly = hraAnnual / 12;

  const ltaAnnual = basicAnnual * 0.10; // 10% of basic
  const ltaMonthly = ltaAnnual / 12;

  const foodCardMonthly = 0; // Optional, can be 500 or 0
  const foodCardAnnual = foodCardMonthly * 12;

  // Personal Allowance takes the rest of BoB
  let personalAllowanceAnnual = bouquetOfBenefitsAnnual - (hraAnnual + ltaAnnual + foodCardAnnual);
  if (personalAllowanceAnnual < 0) {
      // If BoB is too small, reduce HRA/LTA to fit (logic for low CTC)
      personalAllowanceAnnual = 0;
      // Note: Real payroll engines do complex iteration here. We will assume standard proportion.
  }
  const personalAllowanceMonthly = personalAllowanceAnnual / 12;

  // --- 7. Deductions ---
  const pfEmployeeAnnual = pfEmployerAnnual;
  const pfEmployeeMonthly = pfEmployeeAnnual / 12;
  const professionalTaxAnnual = PROFESSIONAL_TAX_MONTHLY * 12;

  // --- 8. Net Take Home ---
  // Monthly Earnings = Basic + BoB + City + Performance (Monthly portion)
  // Note: Performance is often paid quarterly/annually, but for "Monthly Gross" display we usually show the potential.
  // However, "Take Home" usually excludes Retirals and Variable.
  
  const monthlyGrossEarnings = basicMonthly + bouquetOfBenefitsMonthly + cityAllowanceMonthly; 
  // Note: BoB is fully paid out monthly except usually LTA is claim based, but for offer letter cash flow we show it.
  
  const totalDeductions = pfEmployeeMonthly + PROFESSIONAL_TAX_MONTHLY;
  
  // TCS style "Total Gross" usually refers to CTC.
  // We need "Net Take Home" for the user.
  const netTakeHomeMonthly = monthlyGrossEarnings - totalDeductions;

  return {
    basic: basicAnnual,
    hra: hraAnnual,
    conveyance: cityAllowanceAnnual,
    lta: ltaAnnual,
    medical: healthInsuranceAnnual,
    pf: pfEmployerAnnual,
    gratuity: gratuityAnnual,
    total: annualCTC,
    annualCTC,
    monthlyCTC: annualCTC / 12,

    // Fixed
    basicAnnual,
    basicMonthly,
    bouquetOfBenefitsAnnual,
    bouquetOfBenefitsMonthly,

    // Perf
    performancePayAnnual,
    performancePayMonthly,

    // City
    cityAllowanceAnnual,
    cityAllowanceMonthly,

    // Retirals
    pfEmployerAnnual,
    pfEmployerMonthly,
    gratuityAnnual,
    gratuityMonthly,
    healthInsuranceAnnual,
    healthInsuranceMonthly,

    // BoB Components
    hraAnnual,
    hraMonthly,
    ltaAnnual,
    ltaMonthly,
    foodCardAnnual,
    foodCardMonthly,
    personalAllowanceAnnual,
    personalAllowanceMonthly,

    // Deductions
    pfEmployeeMonthly,
    professionalTaxMonthly: PROFESSIONAL_TAX_MONTHLY,
    netTakeHomeMonthly,

    trainingStipend: config.isTraining ? 18000 : undefined
  };
};

export const formatCurrency = (amount: number) => {
  return amount.toLocaleString('en-IN', {
    maximumFractionDigits: 0,
    minimumFractionDigits: 0
  });
};
