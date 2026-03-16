import { PDFDocument, StandardFonts, rgb, PDFFont, PDFPage } from 'pdf-lib';
import { OfferData, SalaryBreakup } from '../types';
import { calculateSalaryBreakup, formatCurrency } from './salary';
import QRCode from 'qrcode';

// --- Colors ---
const COLOR_BLACK = rgb(0, 0, 0);
const COLOR_GRAY_HEADER = rgb(0.85, 0.85, 0.85); 
const COLOR_GRAY_LIGHT = rgb(0.95, 0.95, 0.95);
const COLOR_FOOTER_LINE = rgb(0.2, 0.6, 1);
// Updated to a deep indigo to match the preview gradient feel (approx #1e1b52)
const COLOR_BRAND_PRIMARY = rgb(0.12, 0.11, 0.32); 

// --- Constants ---
const PAGE_MARGIN = 50; 
const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;
const CONTENT_WIDTH = PAGE_WIDTH - (PAGE_MARGIN * 2);

// --- Helpers ---
const cleanText = (text: string) => text ? text.replace(/[^\x00-\x7F]+/g, ' ') : '';
const formatCurrencyForPDF = (amount: number | undefined) => (amount || 0).toLocaleString('en-IN', { maximumFractionDigits: 0, minimumFractionDigits: 0 });

const wrapText = (text: string, font: PDFFont, size: number, maxWidth: number): string[] => {
  if (!text) return [];
  const words = cleanText(text).split(' ');
  const lines: string[] = [];
  let currentLine = words[0];

  for (let i = 1; i < words.length; i++) {
    const word = words[i];
    const width = font.widthOfTextAtSize(`${currentLine} ${word}`, size);
    if (width < maxWidth) {
      currentLine += ` ${word}`;
    } else {
      lines.push(currentLine);
      currentLine = word;
    }
  }
  lines.push(currentLine);
  return lines;
};

export const generateOfferPDF = async (data: OfferData) => {
  const pdfDoc = await PDFDocument.create();
  
  // Embed fonts
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  // Use Times Roman Bold for the "COFOMOTECH" header to match the Serif style of Cinzel
  const fontHeader = await pdfDoc.embedFont(StandardFonts.TimesRomanBold); 
  
  const salary: SalaryBreakup = calculateSalaryBreakup(data.salary);
  const today = new Date().toLocaleDateString('en-GB');

  let page: PDFPage;
  let yPosition: number;

  // --- Assets ---
  let logoImage: any = null;
  if (data.includeLogo && data.companyLogo) {
      try {
        const logoBytes = await fetch(data.companyLogo).then(res => res.arrayBuffer());
        if (data.companyLogo.startsWith('data:image/jpeg') || data.companyLogo.startsWith('data:image/jpg')) logoImage = await pdfDoc.embedJpg(logoBytes);
        else logoImage = await pdfDoc.embedPng(logoBytes);
      } catch (e) { console.warn("Logo embed failed", e); }
  }
  let signatureImage: any = null;
  if (data.hrSignature) {
      try {
        const sigBytes = await fetch(data.hrSignature).then(res => res.arrayBuffer());
        if (data.hrSignature.startsWith('data:image/jpeg') || data.hrSignature.startsWith('data:image/jpg')) signatureImage = await pdfDoc.embedJpg(sigBytes);
        else signatureImage = await pdfDoc.embedPng(sigBytes);
      } catch (e) { console.warn("Signature embed failed", e); }
  }

  // --- Drawing Helpers ---
  const drawFooter = () => {
    const footerY = 30;
    const centerX = PAGE_WIDTH / 2;
    page.drawLine({ start: { x: PAGE_MARGIN, y: footerY + 20 }, end: { x: PAGE_WIDTH - PAGE_MARGIN, y: footerY + 20 }, thickness: 0.5, color: COLOR_FOOTER_LINE });
    const line1 = `${data.companyName} Private Limited`;
    const w1 = fontBold.widthOfTextAtSize(line1, 8);
    page.drawText(line1, { x: centerX - (w1/2), y: footerY + 10, size: 8, font: fontBold, color: COLOR_BLACK });
    const line3 = `Regd. Office: ${data.companyAddress}`;
    const w3 = fontRegular.widthOfTextAtSize(line3, 7);
    page.drawText(line3, { x: centerX - (w3/2), y: footerY, size: 7, font: fontRegular, color: COLOR_BLACK });
  };

  const drawHeaderLogo = () => {
      // Moved header higher up to PAGE_HEIGHT - 50 to give more room below
      const headerBaseY = PAGE_HEIGHT - 50; 
      let textX = PAGE_MARGIN;
      
      if (logoImage) {
        const logoDims = logoImage.scale(0.5); 
        const targetHeight = 55;
        const scaleFactor = targetHeight / logoDims.height;
        const width = logoDims.width * scaleFactor;
        // Adjusted logo Y position
        page.drawImage(logoImage, { x: PAGE_MARGIN, y: headerBaseY - 15, width: width, height: targetHeight });
        textX += width + 10; 
      }
      
      const text = 'COFOMO TECH';
      // Used fontHeader (Times Roman Bold) and COLOR_BRAND_PRIMARY
      page.drawText(text, { x: textX, y: headerBaseY, size: 24, font: fontHeader, color: COLOR_BRAND_PRIMARY });
      
      // Horizontal line with more gap below the text (y - 25)
      const lineY = headerBaseY - 25;
      page.drawLine({ start: { x: PAGE_MARGIN, y: lineY }, end: { x: PAGE_WIDTH - PAGE_MARGIN, y: lineY }, thickness: 0.25, opacity: 0.5, color: COLOR_BLACK });
  };

  const addPage = () => {
    page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    drawHeaderLogo();
    drawFooter();
    // Start content significantly lower to prevent merging with header line
    // headerBaseY is ~791. Line is ~766. Starting at ~730 gives safe buffer.
    yPosition = PAGE_HEIGHT - 120; 
  };

  const writeLine = (text: string, options: any = {}) => {
    const f = options.font || fontRegular;
    const s = options.size || 10;
    let x = options.x || PAGE_MARGIN;
    if (options.alignRight) x = PAGE_WIDTH - PAGE_MARGIN - f.widthOfTextAtSize(cleanText(text), s);
    page.drawText(cleanText(text), { x, y: yPosition, font: f, size: s, color: options.color || COLOR_BLACK });
    yPosition -= (s + 4);
  };

  // --- Dynamic Flow Logic ---
  const checkSpace = (neededHeight: number) => {
      // Increased bottom buffer to 60 to ensure footer doesn't get crowded
      if (yPosition - neededHeight < PAGE_MARGIN + 60) { 
          addPage();
          return true; // Added new page
      }
      return false; // Stayed on same page
  };

  const writeParagraph = (text: string, options: any = {}) => {
    const s = options.size || 10;
    const f = options.font || fontRegular;
    const lines = wrapText(text, f, s, CONTENT_WIDTH);
    const lineHeight = s + 4;
    const blockHeight = lines.length * lineHeight + 6; // +6 padding

    // Check if whole block fits, if not, add page
    checkSpace(blockHeight);

    lines.forEach(line => {
        page.drawText(line, { x: options.x || PAGE_MARGIN, y: yPosition, font: f, size: s, color: COLOR_BLACK });
        yPosition -= lineHeight;
    });
    yPosition -= 6;
  };

  const writeHeading = (text: string) => {
      const h = 20; // Approx height
      checkSpace(h);
      writeLine(text, { font: fontBold, size: 10 });
      yPosition -= 2; // Extra gap
  };

  // --- Page 1: Offer Summary (Fixed Page) ---
  addPage();
  writeLine(`Date: ${today}`, { font: fontBold });
  writeLine(`Application ID: ${data.applicationId}`, { font: fontBold });
  writeLine(`Candidate ID: ${data.candidateId}`, { font: fontBold });
  writeLine(`Name : ${data.candidate.fullName}`, { font: fontBold });
  writeLine(`Address ${data.candidate.addressLine1}`, { font: fontBold });
  if (data.candidate.addressLine2) {
    writeLine(`${data.candidate.addressLine2},`, { font: fontBold });
  }
  writeLine(`${data.candidate.city} - ${data.candidate.pincode}`, { font: fontBold });
  const mobile = data.candidate.mobile ? (data.candidate.mobile.startsWith('+91') ? data.candidate.mobile : `+91 ${data.candidate.mobile}`) : '';
  writeLine(`Mobile: ${mobile}`, { font: fontBold });
  
  // --- QR Code Inserted Here (Under Mobile) ---
  try {
      const qrData = `OFFER VERIFICATION\nID: ${data.applicationId}\nCandidate: ${data.candidate.fullName}\nRole: ${data.candidate.designation}\nCTC: ${formatCurrencyForPDF(salary.annualCTC)}\nDate: ${today}`;
      const qrCodeDataUrl = await QRCode.toDataURL(qrData, { width: 100, margin: 1 });
      const qrImage = await pdfDoc.embedPng(qrCodeDataUrl);
      
      const qrSize = 50;
      // Draw under Mobile. Current yPosition has been decremented by last writeLine.
      // So yPosition acts as the baseline for the *next* line.
      // We draw the image such that its bottom-left is at (PAGE_MARGIN, yPosition - qrSize).
      
      page.drawImage(qrImage, {
          x: PAGE_MARGIN, 
          y: yPosition - qrSize - 5,
          width: qrSize,
          height: qrSize
      });
      
      // Update yPosition to move past the image
      yPosition -= (qrSize + 15);
  } catch (e) {
      console.warn("PDF QR Generation Failed", e);
  }

  
  yPosition -= 20;

  const title = "Offer Letter";
  const titleW = fontBold.widthOfTextAtSize(title, 14);
  page.drawText(title, { x: (PAGE_WIDTH - titleW)/2, y: yPosition, size: 14, font: fontBold });
  yPosition -= 30;

  writeLine(`Dear ${data.candidate.fullName}`, { font: fontBold });
  yPosition -= 10;
  
  writeParagraph("Thank you for your Interest in COFOMO TECH,");
  writeParagraph(`We are pleased to extend to you an offer of employment with COFOMO TECH for the position of ${data.candidate.designation} within our software development team. Following a thorough review of your skills, we believe you will be a significant asset to our organization. This document outlines the terms and conditions of your employment and provides important information about your role, compensation, and the expectations we hold.`);

  writeParagraph("At COFOMO TECH, we are committed to fostering innovation, teamwork, and professional growth. We look forward to your contributions as we continue to build cutting-edge software solutions");

  writeHeading("Summary of Offer");
  writeParagraph("This offer includes the following key Details:");

  const offerDetails = [
      `Position: ${data.candidate.designation}`,
      `Start Date: ${new Date(data.candidate.joiningDate).toLocaleDateString('en-GB')}`,
      `Reporting To: ${data.candidate.reportingManager || 'Manager'}`,
      `Compensation: A competitive salary of Rs. ${formatCurrencyForPDF(salary.annualCTC)}/- per annum payable in accordance with company policies.`,
      `Benefits: Health insurance, retirement plans, performance incentives, and other employee benefits as detailed in the subsequent sections.`,
      `Work Location: ${data.candidate.location}`,
      `Employment Type: ${data.candidate.employmentType}`
  ];
  offerDetails.forEach(d => writeLine(d, { x: PAGE_MARGIN + 10 }));
  yPosition -= 10;

  if (data.salary.isTraining) {
      writeParagraph("NOTE: During the initial training period of three (3) months, employees will receive 50% of their offered salary. The duration of the training may be reduced based on individual performance and assessment by the management team.");
  }

  yPosition -= 10;
  writeLine("We look forward to you joining our organization at the earliest.");
  writeLine("With warm regards,");
  writeLine("Cofomo Tech Pvt Ltd.", { font: fontBold });

  // Adjust for signature space (marginTop: 45px in preview)
  yPosition -= 45;

  if (signatureImage) {
      const sigDims = signatureImage.scale(0.5);
      const targetHeight = 40;
      const scaleFactor = targetHeight / sigDims.height;
      // Move left by 10px to match preview's translateX(-10px)
      page.drawImage(signatureImage, { x: PAGE_MARGIN - 10, y: yPosition - targetHeight, width: sigDims.width * scaleFactor, height: targetHeight });
  }
  yPosition -= 50; // Space for signature height + padding
  writeLine("Dinesh Reddy", { font: fontBold });
  writeLine("HR Manager", { size: 10 });

  // --- Page 2: Compensation & Benefits Text ---
  addPage();
  writeLine("COMPENSATION AND BENEFITS", { font: fontBold, size: 14, align: 'center' });
  yPosition -= 20;

  writeLine("BASIC SALARY", { font: fontBold });
  writeParagraph(`You will be eligible for a basic salary of ${formatCurrencyForPDF(salary.basicMonthly)} per month.`);
  
  writeLine("BOUQUET OF BENEFITS (BoB)", { font: fontBold });
  writeParagraph("BoB lets you customize part of your compensation package within company guidelines, with adjustments allowed twice per financial year.");
  writeParagraph("All selected components are paid monthly.");
  writeParagraph("Pre-defined component amounts can be redistributed as per your tax planning after joining Cofomo Tech.");
  writeParagraph("To set up your BoB, access the \"Employee Self Service\" link on the internal Cofomo Tech HR portal.");
  writeParagraph("Tax deductions will follow Income Tax rules and be handled by Cofomo Tech as per government guidelines.");

  writeLine("1. House Rent Allowance (HRA)", { font: fontBold });
  writeParagraph(`Your HRA will be ${formatCurrencyForPDF(salary.hraMonthly)} per month. While restructuring your BoB amount to various components, it is mandatory that at least 5% of monthly basic pay be allocated towards HRA.`);

  writeLine("2. Leave Travel Allowance", { font: fontBold });
  writeParagraph("You will be eligible for annual Leave Travel Allowance which is equivalent to one month's basic salary or a pro-rata amount in case you join during the financial year. This will be disbursed on a monthly basis along with the monthly salary. To avail income tax benefits, you need to apply for a minimum of three days of leave and submit supporting travel documents.");

  writeLine("RETIRALS", { font: fontBold });
  writeLine("Provident Fund", { font: fontBold });
  writeParagraph("You will be a member of the Provident Fund as per the provisions of \"The Employees Provident Fund and Miscellaneous Provisions Act, 1952\", and COFOMOTECH will contribute 12% of your basic salary every month as per the provisions of the said Act.");

  writeLine("Gratuity", { font: fontBold });
  writeParagraph("You will be entitled to gratuity as per the provisions of the Gratuity Act, 1972.");

  // --- Page 3: Terms and Conditions ---
  addPage();
  writeLine("TERMS AND CONDITIONS", { font: fontBold, size: 14, align: 'center' });
  yPosition -= 20;

  writeLine("1. Aggregate Percentage Requirements", { font: fontBold });
  writeParagraph("Your appointment will be subject to your scoring minimum aggregate (aggregate of all subjects in all semesters) marks of 60% or above (or equivalent CGPA as per the conversion formula prescribed by the Board / University) in the first attempt in each of your Standard Xth, Standard XIIth, Diploma (if applicable) and highest qualification (Graduation/ Post Graduation as applicable) which includes successful completion of your final semester/year without any pending arrears/backlogs. As per the COFOMO TECH eligibility criteria, marks/CGPA obtained during the normal duration of the course only will be considered to decide on the eligibility.");
  writeParagraph("As communicated to you through various forums during the recruitment process, your appointment is subject to completion of your course within the stipulated time as specified by your University/Institute and as per COFOMO TECH selection guidelines. It is mandatory to declare the gaps/arrears/backlogs, if any, during your academics and work experience. The management reserves the right to withdraw/revoke the offer/appointment at any time at its sole discretion in case any discrepancy or false information is found in the details submitted by you.");

  writeLine("2. Prerequisites for Joining", { font: fontBold });
  writeParagraph("To enable your readiness to work on assignments upon joining, we have put together a comprehensive learning program named COFOMO TECH Xplore which is made available to you digitally. This foundation program will include Online learning content, Webinars, practice sessions & proctored assessments. Further to accepting this Offer letter, you are recommended to enroll for the COFOMO TECH Xplore Program and start your learning journey with COFOMO TECH. COFOMO TECH will make the Xplore program available for you upon your offer acceptance.");

  writeLine("3. Training Period", { font: fontBold });
  writeParagraph("You will be required to undergo class room and on the job training in the first twelve months (including the COFOMO TECH Xperience Programme as set out herein below), during which period you will be appraised for satisfactory performance during/after which COFOMO TECH would normally confirm you.");
  writeParagraph("This confirmation will be communicated to you in writing. If your performance is found unsatisfactory during the training period, the company may afford you opportunities to assist you and enable you to improve your performance. If your performance is still found unsatisfactory, COFOMO TECH may terminate your traineeship forthwith.");
  writeParagraph("However, COFOMO TECH may even otherwise at its sole discretion terminate the traineeship any time if your performance is not found satisfactory. The terms and conditions of the training will be governed by COFOMO TECH's training policy.");
  writeParagraph("COFOMO TECH reserves the right to modify or amend the training policy. If you remain unauthorizedly absent for a consecutive period of 3 days during the training programme, you shall be deemed to have abandoned your traineeship and your name will automatically stand discontinued from the list of COFOMO TECH Xperience trainees without any further intimation/separate communication to you.");

  // --- Page 4: Terms and Conditions (Continued) ---
  addPage();

  writeLine("4. Working Hours", { font: fontBold });
  writeParagraph("Your working hours are governed by applicable law. You may be required to work in shifts and/or over time depending upon the business exigencies as permitted by law");

  writeLine("5. Mobility", { font: fontBold });
  writeParagraph("COFOMO TECH reserves the right to transfer you at any of its offices, work sites, or associated or affiliated companies in India or outside India, on the terms and conditions as applicable to you at the time of transfer.");

  writeLine("6. Compensation Structure / Salary components", { font: fontBold });
  writeParagraph("The compensation structure/salary components are subject to change as per COFOMO TECH 's compensation policy from time to time at its sole discretion.");

  writeLine("7. Increments and Promotions", { font: fontBold });
  writeParagraph("Your performance and contribution to COFOMO TECH will be an important consideration for salary increments and promotions. Salary increments and promotions will be based on COFOMO TECH 's Compensation and Promotion policy.");

  writeLine("8. Alternative Occupation / Employment", { font: fontBold });
  writeParagraph("Either during the period of your traineeship or during the period of your employment as a confirmed employee of COFOMO TECH , you are not permitted to undertake any other employment, business, assume any public or private office, honorary or remunerative, without the prior written permission of COFOMO TECH");

  writeLine("9. Confidentiality Agreement", { font: fontBold });
  writeParagraph("As part of your acceptance of this appointment as an employee with COFOMO TECH you are required to maintain strict confidentiality of the intellectual property rights protected information and other business information of COFOMO TECH and its clients which may be revealed to you by COFOMO TECH or which may in the course of your engagement with COFOMO TECH come your possession or knowledge unless specifically authorized to do so in writing by COFOMO TECH . This Confidentiality Clause shall survive the termination or earlier determination of this Appointment. The detailed Confidentiality related terms and conditions are set out in Annexure 3.");

  writeLine("10. Service Agreement", { font: fontBold });
  writeParagraph("As COFOMO TECH will be incurring considerable expenditure on your training, you will be required to execute an agreement, to serve COFOMO TECH for a minimum period of 1 year after joining, failing which, you (and your surety) will be liable to pay COFOMO TECH Rs. 50,000/- towards the training expenditure. Service agreement duration of one year refers to continuous service of 12 months from date of joining COFOMO TECH and excludes the duration of Leave without pay (LWP) and/or unauthorized absence, if any.");

  // --- Page 5: Terms and Conditions (Continued 2) ---
  addPage();

  writeLine("11. Overseas International Assignment Agreement", { font: fontBold });
  writeParagraph("If you are on an international assignment, you will be covered by the COFOMO TECH India Policy-International Assignments (from India to other Countries) from the date of placement for an international assignment. Accordingly, you will be required to sign the Overseas International Assignment Agreement/s and any other applicable related documents pertaining to the international assignment for which you are being placed In case of every international assignment that exceeds 30 days, you will be required to serve COFOMO TECH as per the Notice Period clause mentioned below.");
  writeParagraph("This is to ensure that the knowledge and information gained by you during your assignment is shared and available to COFOMO TECH and its associates. This transfer of knowledge and information is essential for COFOMO TECH to continue to serve its clients and customers better. If you are deputed internationally for training, you will be required to sign an agreement to serve COFOMO TECH for a minimum period of 6 months on completion of training.");

  writeLine("12. Terms and Conditions", { font: fontBold });
  writeParagraph("The above terms and conditions are specific to India and there can be changes to the said terms and conditions in case of deputation on international assignments.");

  writeLine("13. Notice Period", { font: fontBold });
  writeParagraph("During your tenure with COFOMO TECH , either you or COFOMO TECH may terminate your traineeship / employment under this Agreement by providing 90 days written notice. The company reserves the right to ask you to complete the notice period or adjust the earned vacation in lieu of an entire or partial notice period. If your services, behaviour and/ or performance are not found satisfactory, COFOMO TECH may terminate your services by giving notice as mentioned herein above. No notice or payment in lieu thereof shall be applicable if your services are discontinued/terminated on account of any misconduct either during your traineeship period or upon completion of the traineeship period.");
  writeParagraph("You will be liable to pay COFOMO TECH Rs. 50,000/- in case you fail to serve COFOMO TECH for a minimum period of 1 year after joining in accordance with the Service Agreement clause.");
  writeParagraph("If you are covered under the International Assignment Agreement, either you or COFOMO TECH can terminate the traineeship/appointment by giving 90 calendar days written notice as set out in the Separation Policy of COFOMO TECH . COFOMO TECH reserves the right if it is in the interest of the business and current assignment, to ask you to complete your notice period.");

  writeLine("14. Background Check", { font: fontBold });
  writeParagraph("Your association with COFOMO TECH will be subject to a background check in line with COFOMO TECH 's background check policy. A specially appointed agency will conduct internal and external background checks. Normally, such checks are completed within one month of joining.If the background check reveals unfavourable results, you will be liable to disciplinary action including termination of traineeship/service without notice.");

  // --- Page 6: Terms and Conditions (Continued 3) ---
  addPage();

  writeLine("15. Submission of Documents", { font: fontBold });
  writeParagraph("Please note that you should initiate and complete the upload of mandatory documents on the nextstep portal as soon as the offer letter is accepted (subject to availability of the documents)");
  writeParagraph("Please carry the below listed Original Documents for verification on your joining day.");
  
  const docList1 = [
      "Pan card",
      "Aadhar card",
      "Standard X and XII/Diploma mark sheets & Certificate",
      "Degree certificate/Provisional Degree Certificate and mark sheets for all semesters of Graduation",
      "4 passport sized photographs",
      "Medical Certificate"
  ];
  docList1.forEach(d => writeLine(d, { x: PAGE_MARGIN + 10 }));

  writeParagraph("If you were employed, a formal Relieving letter & Experience letter from your previous employer");
  writeParagraph("The original documents will be returned to you after verification. In addition to the above original documents,");
  writeParagraph("Please carry Xerox copies of the below documents");

  const docList2 = [
      "*PAN Card (Permanent Account Number)",
      "*Aadhaar Card (Not applicable for Nepal & Bhutan Citizenship)",
      "*Passport"
  ];
  docList2.forEach(d => writeLine(d, { x: PAGE_MARGIN + 10 }));

  writeLine("16. Rules and Regulations of the Company", { font: fontBold });
  writeParagraph("Your appointment will be governed by the policies, rules, regulations, practices, processes and procedures of COFOMO TECH as applicable to you and the changes therein from time to time.The changes in the Policies will automatically be binding on you and no separate individual communication or notice will be served to this effect. However, the same shall be communicated on the internal portal/Ultimatix.");

  writeLine("Withdrawal of Offer", { font: fontBold });
  writeParagraph("If you fail to accept the offer from COFOMO TECH within 7 days, it will be construed that you are not interested in this employment and this offer will be automatically withdrawn.");
  writeParagraph("Post acceptance of COFOMO TECH Offer letter if you fail to join on the date provided in the COFOMO TECH Joining letter, the offer will stand automatically terminated at the discretion of COFOMO TECH .");

  writeLine("We look forward to having you in our global team");
  yPosition -= 20;
  writeLine("Yours Sincerely,");
  writeLine("COFOMOTECH PVT.LTD", { font: fontBold });

  // --- Page 8: Compensation Sheet ---
  addPage();
  writeLine("COMPENSATION SHEET", { font: fontBold, size: 14, align: 'center' });
  yPosition -= 20;

  writeLine(`Applicant I'd. : ${data.applicationId}`);
  writeLine(`Name. : ${data.candidate.fullName}`);
  writeLine(`Designation. : ${data.candidate.designation}`);
  yPosition -= 20;

  // Table
  const drawRow = (label: string, value: string, bold = false) => {
      const h = 20;
      checkSpace(h);
      const f = bold ? fontBold : fontRegular;
      page.drawText(label, { x: PAGE_MARGIN, y: yPosition, font: f, size: 10 });
      page.drawText(value, { x: PAGE_WIDTH - PAGE_MARGIN - 100, y: yPosition, font: f, size: 10 });
      yPosition -= h;
  };

  drawRow("COMPENSATION", "Rs. Per month", true);
  page.drawLine({ start: { x: PAGE_MARGIN, y: yPosition + 15 }, end: { x: PAGE_WIDTH - PAGE_MARGIN, y: yPosition + 15 }, thickness: 1 });
  
  drawRow("Basic salary", formatCurrencyForPDF(salary.basicMonthly));
  drawRow("House rent allowance", formatCurrencyForPDF(salary.hraMonthly));
  drawRow("Other allowance", formatCurrencyForPDF(salary.personalAllowanceMonthly));
  drawRow("Professional tax", formatCurrencyForPDF(salary.professionalTaxMonthly));
  drawRow("Provident fund", formatCurrencyForPDF(salary.pfEmployeeMonthly));
  
  page.drawLine({ start: { x: PAGE_MARGIN, y: yPosition + 15 }, end: { x: PAGE_WIDTH - PAGE_MARGIN, y: yPosition + 15 }, thickness: 1 });
  drawRow("Take home", formatCurrencyForPDF(salary.netTakeHomeMonthly), true);
  
  yPosition -= 20;
  writeLine(`Annual CTC: Rs ${formatCurrencyForPDF(salary.annualCTC)}/-`, { font: fontBold, size: 12 });
  yPosition -= 20;

  writeParagraph("Note: \"Take home is subjected to all applicable statutory deductions like Professional Tax, Labour Welfare Fund, Income Tax etc\"");
  writeParagraph("Note :- Salary structure will be Changed from March As per new Govt rules");
  if (data.salary.isTraining) {
      writeParagraph("Note: For freshers in the training period, 18,000 salary will be credited for Three Months.");
  }

  yPosition -= 15;
  writeParagraph("NOTE: The salary structure mentioned in this offer is the final and complete remuneration for the employment period of one year. No revisions or changes to the salary will be made during this period.");

  yPosition -= 30;
  writeLine("Date:", { font: fontBold });
  yPosition -= 25;
  writeLine("Name:", { font: fontBold });
  yPosition -= 25;
  writeLine("Signature of the employee:", { font: fontBold });

  // --- Page 9: Confidentiality and Intellectual Property Terms and Conditions (Moved to Last) ---
  addPage();
  writeLine("Confidentiality and Intellectual Property Terms and Conditions", { font: fontBold, size: 14, align: 'center' });
  yPosition -= 20;

  writeLine("Confidential Information:", { font: fontBold });
  writeParagraph("All technical, financial, operational, and business-related information, including but not limited to source code, algorithms, designs, documentation, product roadmaps, and client databases, shared or developed during employment or engagement, shall be treated as confidential. The employee or contractor shall not, without prior written consent, disclose or use such information for any purpose other than official company work.");

  writeLine("Ownership of Intellectual Property:", { font: fontBold });
  writeParagraph("All intellectual property, code, concepts, designs, patents, trademarks, copyrights, or inventions developed by an employee, contractor, or partner in the course of their association with the company shall be the sole and exclusive property of the company. The creator hereby assigns all rights, titles, and interests in such IP to the company.");

  writeLine("Moral Rights Waiver:", { font: fontBold });
  writeParagraph("The creator waives all moral rights, including the right to be identified as the author or to object to modifications, ensuring full ownership and control of all deliverables belonging to the company.");

  writeLine("Non-Disclosure Obligations:", { font: fontBold });
  writeParagraph("Employees and associates shall not disclose, reproduce, or share any confidential information with third parties, either during or after their tenure. Any unauthorized disclosure shall result in disciplinary and legal action, including termination or damages as deemed necessary.");

  writeLine("Return of Materials:", { font: fontBold });
  writeParagraph("Upon termination of employment or engagement, all documents, devices, codes, or materials containing confidential information must be immediately returned to the company. Any retention or duplication of such materials shall be considered a breach of this agreement.");

  writeLine("Duration of Obligation:", { font: fontBold });
  writeParagraph("The obligations of confidentiality shall survive for a period of five (2) years after the termination of employment or business relationship, or indefinitely for trade secrets.");

  const pdfBytes = await pdfDoc.save();
  return pdfBytes;
};

export const downloadPDF = (bytes: Uint8Array, filename: string) => {
  const blob = new Blob([bytes as any], { type: 'application/pdf' });
  const link = document.createElement('a');
  link.href = window.URL.createObjectURL(blob);
  link.download = filename;
  link.click();
};