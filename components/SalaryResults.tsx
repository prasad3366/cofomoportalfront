import { SalaryBreakdown, formatINR } from "@/lib/salaryCalculations";
import { Button } from "@/components/ui/Components";
import { Download, Printer } from "lucide-react";
import jsPDF from "jspdf";
import "jspdf-autotable";

interface Props {
  data: SalaryBreakdown;
}

// Helper to replace ₹ with Rs. for PDF compatibility
const fmt = (amount: number) => formatINR(amount).replace('₹', 'Rs. ');

export default function SalaryResults({ data }: Props) {
  const handlePrint = () => window.print();

  const handleDownloadPDF = () => {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });
    
    const pageWidth = doc.internal.pageSize.width;
    
    // Header with background
    doc.setFillColor(25, 55, 109);
    doc.rect(10, 10, pageWidth - 20, 12, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text('Compensation Sheet', pageWidth / 2, 18, { align: 'center' });

    const tableData = [
      [{ content: 'EARNINGS', colSpan: 3, styles: { fillColor: [243, 244, 246], fontStyle: 'bold', textColor: [0,0,0] } }],
      ['Cost to Company (CTC)', fmt(data.ctc), fmt(Math.round(data.ctc / 12))],
      ['Variable Pay', fmt(data.variablePay), fmt(Math.round(data.variablePay / 12))],
      ['Fixed Gross Salary', fmt(data.fixedGross), fmt(Math.round(data.fixedGross / 12))],
      ['Basic Pay (50%)', fmt(data.basic), fmt(Math.round(data.basic / 12))],
      ['HRA (50% of Basic)', fmt(data.hra), fmt(Math.round(data.hra / 12))],
      ['Special Allowance', fmt(data.specialAllowance), fmt(Math.round(data.specialAllowance / 12))],
      
      [{ content: 'DEDUCTIONS', colSpan: 3, styles: { fillColor: [243, 244, 246], fontStyle: 'bold', textColor: [0,0,0] } }],
      ['EPF – Employee (12%)', fmt(data.epfEmployee), fmt(Math.round(data.epfEmployee / 12))],
      ['Professional Tax (Telangana)', fmt(data.professionalTax), fmt(Math.round(data.professionalTax / 12))],
      ['Income Tax (New Regime)', fmt(data.incomeTax), fmt(Math.round(data.incomeTax / 12))],
      ['Total Deductions', fmt(data.totalDeductions), fmt(Math.round(data.totalDeductions / 12))],
      
      [{ content: 'Net Take-Home Pay', styles: { fillColor: [220, 252, 231], textColor: [22, 101, 52], fontStyle: 'bold' } }, 
       { content: fmt(data.netTakeHome), styles: { fillColor: [220, 252, 231], textColor: [22, 101, 52], fontStyle: 'bold', halign: 'right' } },
       { content: fmt(Math.round(data.netTakeHome / 12)), styles: { fillColor: [220, 252, 231], textColor: [22, 101, 52], fontStyle: 'bold', halign: 'right' } }]
    ];

    (doc as any).autoTable({
      head: [['COMPONENT', 'ANNUAL', 'MONTHLY']],
      body: tableData,
      startY: 26,
      theme: 'grid',
      headStyles: {
        fillColor: [229, 231, 235], // Gray 200
        textColor: [0, 0, 0],
        fontStyle: 'bold',
        lineColor: [156, 163, 175], // Gray 400
        lineWidth: 0.1,
      },
      columnStyles: {
        0: { cellWidth: 'auto' },
        1: { halign: 'right' },
        2: { halign: 'right' },
      },
      bodyStyles: {
        fontSize: 10,
        textColor: [0, 0, 0],
        lineColor: [156, 163, 175],
        lineWidth: 0.1,
      },
      margin: { left: 10, right: 10 },
    });

    doc.save(`compensation_sheet_${data.ctc}.pdf`);
  };

  return (
    <div className="w-full bg-white rounded-lg shadow-md no-print">
      <div className="flex items-center justify-between p-6 border-b">
        <h2 className="text-2xl font-bold text-gray-900">Compensation Sheet</h2>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleDownloadPDF}>
            <Download className="h-4 w-4 mr-1" /> PDF
          </Button>
          <Button variant="outline" size="sm" onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-1" /> Print
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-900 text-white">
              <th className="px-6 py-4 text-left font-bold text-sm uppercase tracking-wider border-b border-gray-900">COMPONENT</th>
              <th className="px-6 py-4 text-right font-bold text-sm uppercase tracking-wider border-b border-gray-900">ANNUAL</th>
              <th className="px-6 py-4 text-right font-bold text-sm uppercase tracking-wider border-b border-gray-900">MONTHLY</th>
            </tr>
          </thead>
          <tbody>
            {/* EARNINGS SECTION */}
            <tr className="border-b border-gray-200 bg-gray-50">
              <td colSpan={3} className="px-6 py-2 text-xs font-bold uppercase text-gray-600">EARNINGS</td>
            </tr>
            <tr className="border-b border-gray-200">
              <td className="px-6 py-3 font-semibold text-gray-900">Cost to Company (CTC)</td>
              <td className="px-6 py-3 text-right font-mono text-gray-900">{formatINR(data.ctc)}</td>
              <td className="px-6 py-3 text-right font-mono text-gray-900">{formatINR(Math.round(data.ctc / 12))}</td>
            </tr>
            <tr className="border-b border-gray-200">
              <td className="px-6 py-3 pl-12 text-gray-700">Variable Pay</td>
              <td className="px-6 py-3 text-right font-mono text-gray-700">{formatINR(data.variablePay)}</td>
              <td className="px-6 py-3 text-right font-mono text-gray-700">{formatINR(Math.round(data.variablePay / 12))}</td>
            </tr>
            <tr className="border-b border-gray-200">
              <td className="px-6 py-3 font-semibold text-gray-900">Fixed Gross Salary</td>
              <td className="px-6 py-3 text-right font-mono text-gray-900">{formatINR(data.fixedGross)}</td>
              <td className="px-6 py-3 text-right font-mono text-gray-900">{formatINR(Math.round(data.fixedGross / 12))}</td>
            </tr>
            <tr className="border-b border-gray-200">
              <td className="px-6 py-3 pl-12 text-gray-700">Basic Pay (50%)</td>
              <td className="px-6 py-3 text-right font-mono text-gray-700">{formatINR(data.basic)}</td>
              <td className="px-6 py-3 text-right font-mono text-gray-700">{formatINR(Math.round(data.basic / 12))}</td>
            </tr>
            <tr className="border-b border-gray-200">
              <td className="px-6 py-3 pl-12 text-gray-700">HRA (50% of Basic)</td>
              <td className="px-6 py-3 text-right font-mono text-gray-700">{formatINR(data.hra)}</td>
              <td className="px-6 py-3 text-right font-mono text-gray-700">{formatINR(Math.round(data.hra / 12))}</td>
            </tr>
            <tr className="border-b border-gray-200">
              <td className="px-6 py-3 pl-12 text-gray-700">Special Allowance</td>
              <td className="px-6 py-3 text-right font-mono text-gray-700">{formatINR(data.specialAllowance)}</td>
              <td className="px-6 py-3 text-right font-mono text-gray-700">{formatINR(Math.round(data.specialAllowance / 12))}</td>
            </tr>

            {/* DEDUCTIONS SECTION */}
            <tr className="border-b border-gray-200 bg-gray-50">
              <td colSpan={3} className="px-6 py-2 text-xs font-bold uppercase text-gray-600">DEDUCTIONS</td>
            </tr>
            <tr className="border-b border-gray-200">
              <td className="px-6 py-3 pl-12 text-gray-700">EPF – Employee (12%)</td>
              <td className="px-6 py-3 text-right font-mono text-gray-700">{formatINR(data.epfEmployee)}</td>
              <td className="px-6 py-3 text-right font-mono text-gray-700">{formatINR(Math.round(data.epfEmployee / 12))}</td>
            </tr>
            <tr className="border-b border-gray-200">
              <td className="px-6 py-3 pl-12 text-gray-700">Professional Tax (Telangana)</td>
              <td className="px-6 py-3 text-right font-mono text-gray-700">{formatINR(data.professionalTax)}</td>
              <td className="px-6 py-3 text-right font-mono text-gray-700">{formatINR(Math.round(data.professionalTax / 12))}</td>
            </tr>
            <tr className="border-b border-gray-200">
              <td className="px-6 py-3 pl-12 text-gray-700">Income Tax (New Regime)</td>
              <td className="px-6 py-3 text-right font-mono text-gray-700">{formatINR(data.incomeTax)}</td>
              <td className="px-6 py-3 text-right font-mono text-gray-700">{formatINR(Math.round(data.incomeTax / 12))}</td>
            </tr>
            <tr className="border-b border-gray-200">
              <td className="px-6 py-3 font-semibold text-gray-900">Total Deductions</td>
              <td className="px-6 py-3 text-right font-mono font-semibold text-gray-900">{formatINR(data.totalDeductions)}</td>
              <td className="px-6 py-3 text-right font-mono font-semibold text-gray-900">{formatINR(Math.round(data.totalDeductions / 12))}</td>
            </tr>

            {/* NET TAKE-HOME */}
            <tr className="bg-green-50 border-b border-green-200">
              <td className="px-6 py-3 font-bold text-green-700 text-lg">Net Take-Home Pay</td>
              <td className="px-6 py-3 text-right font-mono font-bold text-green-700 text-lg">{formatINR(data.netTakeHome)}</td>
              <td className="px-6 py-3 text-right font-mono font-bold text-green-700 text-lg">{formatINR(Math.round(data.netTakeHome / 12))}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="p-6 bg-gray-50 border-t text-xs text-gray-500">
        <p className="no-print">
          * EPF capped at ₹15,000/month basic. Professional Tax as per Telangana slabs. Income Tax computed under New Regime FY 2025-26 with ₹75,000 standard deduction and Section 87A rebate (≤₹12L taxable income).
        </p>
      </div>
    </div>
  );
}