import React, { useEffect, useState } from 'react';
import { OfferData } from '../types';
import { calculateSalary, formatINR, SalaryBreakdown } from '../lib';
import QRCode from 'qrcode';

interface LivePreviewProps {
  data: OfferData;
  id?: string;
}

const A4Page: React.FC<{ children: React.ReactNode; className?: string; data: OfferData }> = ({ children, className = '', data }) => (
  <div
    className={`a4-page bg-white text-black shadow-2xl mb-8 mx-auto relative flex flex-col ${className}`}
    style={{
      width: "210mm",
      minHeight: "297mm",
      padding: "20mm"
    }}
  >
    
    {/* Watermark */}
    {data.includeLogo && data.companyLogo && (
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0 overflow-hidden">
        <img 
          src={data.companyLogo} 
          alt="Company Logo" 
          className="w-[60%] opacity-[0.04] object-contain grayscale"
        />
      </div>
    )}

    {/* Header */}
    <div className="relative z-10 mb-6">
       <div className="flex items-center gap-3 mb-4">
         {data.includeLogo && data.companyLogo && (
            <img
              src={data.companyLogo}
              alt="Company Logo"
              style={{ height: "48px", width: "48px", objectFit: "contain" }}
            />
         )}
         {/* Gradient Text */}
         <svg width="420" height="60" viewBox="0 0 420 60">
           <defs>
             <linearGradient id="cofomoGradient" x1="0%" y1="0%" x2="100%" y2="0%">
               <stop offset="0%" stopColor="#1d4ed8" />
               <stop offset="50%" stopColor="#1e40af" />
               <stop offset="100%" stopColor="#312e81" />
             </linearGradient>
           </defs>
           <text
             x="0"
             y="42"
             fontFamily="Cinzel, serif"
             fontWeight="900"
             fontSize="36"
             fill="url(#cofomoGradient)"
           >
             COFOMO TECH
           </text>
         </svg>
       </div>
       <div className="h-[0.5px] bg-black w-full opacity-50"></div>
    </div>

    {/* Content */}
    <div className="flex-1 relative z-10 flex flex-col text-[11px] leading-relaxed font-sans text-justify">
      {children}
    </div>

    {/* Footer */}
    <div className="relative z-10 mt-auto pt-4">
        <div className="w-full text-center text-[9px] font-sans leading-tight text-gray-600">
            <div className="border-t border-blue-400 w-full mb-2 mx-auto"></div>
            <p className="font-bold text-black uppercase tracking-wide">COFOMO TECH PVT LTD</p>
            <p className="mt-0.5">LR.Towers,100ft Road, Madhapur, Hyderabad-500081</p>
            <p className="mt-0.5">Contactus@cofomotech.com</p>
            <p className="text-blue-600 font-medium mt-0.5 underline decoration-blue-200">www.cofomotech.com</p>
        </div>
    </div>
  </div>
);

const LivePreview: React.FC<LivePreviewProps> = ({ data, id }) => {
  const salary: SalaryBreakdown = calculateSalary({
    ctc: data.salary.ctc * 100000,
    variablePayPercent: data.salary.variablePercentage,
  });
  const today = new Date().toLocaleDateString('en-GB');
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');

  useEffect(() => {
    const generateQR = async () => {
      try {
        const summaryData = `OFFER VERIFICATION\nID: ${data.applicationId}\nCandidate: ${data.candidate.fullName}\nRole: ${data.candidate.designation}\nCTC: ${formatINR(salary.ctc)}\nDate: ${today}`;
        const url = await QRCode.toDataURL(summaryData, { width: 100, margin: 1 });
        setQrCodeUrl(url);
      } catch (err) {
        console.error("QR Generation failed", err);
      }
    };
    generateQR();
  }, [data, salary.ctc, today]);

  const styles = {
    h2: "font-bold text-sm uppercase underline mb-4 mt-2",
    h3: "font-bold text-[11px] uppercase mb-2 mt-4",
    p: "mb-3",
    li: "mb-1 pl-1",
    ul: "list-disc pl-5 mb-3",
    bold: "font-bold"
  };

  return (
    <div id={id} className="transform scale-[0.65] lg:scale-[0.8] origin-top font-sans text-black">
      
      {/* --- PAGE 1: Offer Summary --- */}
      <A4Page data={data}>
        <div className="font-bold mb-4 space-y-1">
            <p>Date: {today}</p>
            <p>Application ID: {data.applicationId}</p>
            <p>Candidate ID: {data.candidateId}</p>
            <p>Name : {data.candidate.fullName}</p>
            <p>Address {data.candidate.addressLine1}</p>
            {data.candidate.addressLine2 && <p>{data.candidate.addressLine2},</p>}
            <p>{data.candidate.city} - {data.candidate.pincode}</p>
            <p>Mobile: {data.candidate.mobile ? (data.candidate.mobile.startsWith('+91') ? data.candidate.mobile : `+91 ${data.candidate.mobile}`) : ''}</p>
            {qrCodeUrl && (
              <div className="mt-2">
                <img src={qrCodeUrl} alt="Offer QR" className="w-16 h-16" />
              </div>
            )}
        </div>

        <h1 className="text-center text-lg font-bold mb-6">Offer Letter</h1>


        <p className={styles.p}>Thank you for your Interest in <span className="font-bold">COFOMO TECH</span>,</p>

        <p className={styles.p}>
            We are pleased to extend to you an offer of employment with <span className="font-bold">COFOMO TECH</span> for the position of <span className="font-bold">{data.candidate.designation}</span> within our software development team. Following a thorough review of your skills, we believe you will be a significant asset to our organization. This document outlines the terms and conditions of your employment and provides important information about your role, compensation, and the expectations we hold.
        </p>

        <p className={styles.p}>
            At COFOMO TECH, we are committed to fostering innovation, teamwork, and professional growth. We look forward to your contributions as we continue to build cutting-edge software solutions
        </p>

        <h3 className={styles.h3}>Summary of Offer</h3>
        <p className={styles.p}>This offer includes the following key Details:</p>

        <ul className="list-disc pl-5 mb-3">
            <li className="mb-1">Position: {data.candidate.designation}</li>
            <li className="mb-1">Start Date: {new Date(data.candidate.joiningDate).toLocaleDateString('en-GB')}</li>
            <li className="mb-1">Reporting To: {data.candidate.reportingManager || 'Manager'}</li>
            <li className="mb-1">Compensation: A competitive salary of Rs. {formatINR(salary.ctc)}/- per annum payable in accordance with company policies.</li>
            <li className="mb-1">Benefits: Health insurance, retirement plans, performance incentives, and other employee benefits as detailed in the subsequent sections.</li>
            <li className="mb-1">Work Location: {data.candidate.location}</li>
            <li className="mb-1">Employment Type: {data.candidate.employmentType}</li>
        </ul>

        {data.salary.isTraining && (
            <p className={styles.p}>
                NOTE: During the initial training period of three (3) months, employees will receive 50% of their offered salary. The duration of the training may be reduced based on individual performance and assessment by the management team.
            </p>
        )}

        <p className="mt-4">We look forward to you joining our organization at the earliest.</p>
        <p>With warm regards,</p>
        <p className="font-bold">Cofomo Tech Pvt Ltd.</p>
        {data.hrSignature && (
          <div
  style={{
    marginTop: "45px",   // moves signature DOWN
    transform: "translateX(-10px)"  // moves signature LEFT
  }}
>
  <img
    src={data.hrSignature}
    alt="Signature"
    style={{
      height: "40px",
      width: "160px",
      objectFit: "contain",
      display: "block"
    }}
  />
</div>
        )}
        <p className="font-bold mt-2">Dinesh Reddy</p>
        <p className="text-[10px]">HR Manager</p>
      </A4Page>

      {/* --- PAGE 2: Compensation & Benefits Text --- */}
      <A4Page data={data}>
        <h2 className="text-xl font-bold uppercase tracking-wider mb-6">COMPENSATION AND BENEFITS</h2>
        
        
        
        <h3 className={styles.h3}>BOUQUET OF BENEFITS (BoB)</h3>
        <p className={styles.p}>BoB lets you customize part of your compensation package within company guidelines, with adjustments allowed twice per financial year.</p>
        <p className={styles.p}>All selected components are paid monthly.</p>
        <p className={styles.p}>Pre-defined component amounts can be redistributed as per your tax planning after joining Cofomo Tech.</p>
        <p className={styles.p}>To set up your BoB, access the "Employee Self Service" link on the internal Cofomo Tech HR portal.</p>
        <p className={styles.p}>Tax deductions will follow Income Tax rules and be handled by Cofomo Tech as per government guidelines.</p>

        <h3 className={styles.h3}>1. House Rent Allowance (HRA)</h3>
        <p className={styles.p}>Your HRA will be {formatINR(Math.round(salary.hra / 12))} per month. While restructuring your BoB amount to various components, it is mandatory that at least 5% of monthly basic pay be allocated towards HRA.</p>

        <h3 className={styles.h3}>2. Leave Travel Allowance</h3>
        <p className={styles.p}>You will be eligible for annual Leave Travel Allowance which is equivalent to one month's basic salary or a pro-rata amount in case you join during the financial year. This will be disbursed on a monthly basis along with the monthly salary. To avail income tax benefits, you need to apply for a minimum of three days of leave and submit supporting travel documents.</p>

        <h3 className={styles.h3}>RETIRALS</h3>
        <p className="font-bold text-[11px] mb-1">Provident Fund</p>
        <p className={styles.p}>You will be enrolled as a member of the Provident Fund in accordance with the provisions of the Employees’ Provident Fund and Miscellaneous Provisions Act, 1952, and the rules framed thereunder, as amended from time to time. As per the applicable provisions of the Act, COFOMOTECH will contribute an amount equivalent to 12% of your basic salary every month towards</p>

        <p className="font-bold text-[11px] mb-1">Gratuity</p>
        <p className={styles.p}>You will be entitled to gratuity in accordance with the provisions of the Payment of Gratuity Act, 1972, and any amendments made thereto from time to time. Gratuity shall become payable to you upon completion of the minimum continuous service period prescribed under the Act, currently five years, with the Company. The gratuity amount will be calculated based on your last drawn salary and the total number of years of continuous service rendered with the Company, subject to the limits and conditions specified under the applicable law and the Company’s policies in force at the time of separation.</p>
      </A4Page>

      {/* --- PAGE 3: Terms and Conditions --- */}
      <A4Page data={data}>
        <h2 className="text-xl font-bold uppercase tracking-wider mb-6">TERMS AND CONDITIONS</h2>

        <p className={styles.p}>Your appointment will be subject to your scoring minimum aggregate (aggregate of all subjects in all semesters) marks of 60% or above (or equivalent CGPA as per the conversion formula prescribed by the Board / University) in the first attempt in each of your Standard Xth, Standard XIIth, Diploma (if applicable) and highest qualification (Graduation/ Post Graduation as applicable) which includes successful completion of your final semester/year without any pending arrears/backlogs. As per the COFOMO TECH eligibility criteria, marks/CGPA obtained during the normal duration of the course only will be considered to decide on the eligibility.</p>
        <p className={styles.p}>As communicated to you through various forums during the recruitment process, your appointment is subject to completion of your course within the stipulated time as specified by your University/Institute and as per COFOMO TECH selection guidelines. It is mandatory to declare the gaps/arrears/backlogs, if any, during your academics and work experience. The management reserves the right to withdraw/revoke the offer/appointment at any time at its sole discretion in case any discrepancy or false information is found in the details submitted by you.</p>

        <h3 className={styles.h3}>2. Prerequisites for Joining</h3>
        <p className={styles.p}>To enable your readiness to work on assignments upon joining, we have put together a comprehensive learning program named COFOMO TECH Xplore which is made available to you digitally. This foundation program will include Online learning content, Webinars, practice sessions & proctored assessments. Further to accepting this Offer letter, you are recommended to enroll for the COFOMO TECH Xplore Program and start your learning journey with COFOMO TECH. COFOMO TECH will make the Xplore program available for you upon your offer acceptance.</p>

        <h3 className={styles.h3}>3. Training Period</h3>
        <p className={styles.p}>You will be required to undergo class room and on the job training in the first twelve months (including the COFOMO TECH Xperience Programme as set out herein below), during which period you will be appraised for satisfactory performance during/after which COFOMO TECH would normally confirm you.</p>
        <p className={styles.p}>This confirmation will be communicated to you in writing. If your performance is found unsatisfactory during the training period, the company may afford you opportunities to assist you and enable you to improve your performance. If your performance is still found unsatisfactory, COFOMO TECH may terminate your traineeship forthwith.</p>
        <p className={styles.p}>However, COFOMO TECH may even otherwise at its sole discretion terminate the traineeship any time if your performance is not found satisfactory. The terms and conditions of the training will be governed by COFOMO TECH's training policy.</p>
        <p className={styles.p}>COFOMO TECH reserves the right to modify or amend the training policy. If you remain unauthorizedly absent for a consecutive period of 3 days during the training programme, you shall be deemed to have abandoned your traineeship and your name will automatically stand discontinued from the list of COFOMO TECH Xperience trainees without any further intimation/separate communication to you.</p>
      </A4Page>

      {/* --- PAGE 4: Terms and Conditions (Continued) --- */}
      <A4Page data={data}>

        <h3 className={styles.h3}>4. Working Hours</h3>
        <p className={styles.p}>Your working hours are governed by applicable law. You may be required to work in shifts and/or over time depending upon the business exigencies as permitted by law</p>

        <h3 className={styles.h3}>5. Mobility</h3>
        <p className={styles.p}>COFOMO TECH reserves the right to transfer you at any of its offices, work sites, or associated or affiliated companies in India or outside India, on the terms and conditions as applicable to you at the time of transfer.</p>

        <h3 className={styles.h3}>6. Compensation Structure / Salary components</h3>
        <p className={styles.p}>The compensation structure/salary components are subject to change as per COFOMO TECH 's compensation policy from time to time at its sole discretion.</p>

        <h3 className={styles.h3}>7. Increments and Promotions</h3>
        <p className={styles.p}>Your performance and contribution to COFOMO TECH will be an important consideration for salary increments and promotions. Salary increments and promotions will be based on COFOMO TECH 's Compensation and Promotion policy.</p>

        <h3 className={styles.h3}>8. Alternative Occupation / Employment</h3>
        <p className={styles.p}>Either during the period of your traineeship or during the period of your employment as a confirmed employee of COFOMO TECH , you are not permitted to undertake any other employment, business, assume any public or private office, honorary or remunerative, without the prior written permission of COFOMO TECH</p>

        <h3 className={styles.h3}>9. Confidentiality Agreement</h3>
        <p className={styles.p}>As part of your acceptance of this appointment as an employee with COFOMO TECH you are required to maintain strict confidentiality of the intellectual property rights protected information and other business information of COFOMO TECH and its clients which may be revealed to you by COFOMO TECH or which may in the course of your engagement with COFOMO TECH come your possession or knowledge unless specifically authorized to do so in writing by COFOMO TECH . This Confidentiality Clause shall survive the termination or earlier determination of this Appointment. The detailed Confidentiality related terms and conditions are set out in Annexure 3.</p>

        <h3 className={styles.h3}>10. Service Agreement</h3>
        <p className={styles.p}>As COFOMO TECH will be incurring considerable expenditure on your training, you will be required to execute an agreement, to serve COFOMO TECH for a minimum period of 1 year after joining, failing which, you (and your surety) will be liable to pay COFOMO TECH Rs. 50,000/- towards the training expenditure. Service agreement duration of one year refers to continuous service of 12 months from date of joining COFOMO TECH and excludes the duration of Leave without pay (LWP) and/or unauthorized absence, if any.</p>
      </A4Page>

      {/* --- PAGE 5: Terms and Conditions (Continued 2) --- */}
      <A4Page data={data}>
        <h3 className={styles.h3}>11. Overseas International Assignment Agreement</h3>
        <p className={styles.p}>If you are on an international assignment, you will be covered by the COFOMO TECH India Policy-International Assignments (from India to other Countries) from the date of placement for an international assignment. Accordingly, you will be required to sign the Overseas International Assignment Agreement/s and any other applicable related documents pertaining to the international assignment for which you are being placed In case of every international assignment that exceeds 30 days, you will be required to serve COFOMO TECH as per the Notice Period clause mentioned below.</p>
        <p className={styles.p}>This is to ensure that the knowledge and information gained by you during your assignment is shared and available to COFOMO TECH and its associates. This transfer of knowledge and information is essential for COFOMO TECH to continue to serve its clients and customers better. If you are deputed internationally for training, you will be required to sign an agreement to serve COFOMO TECH for a minimum period of 6 months on completion of training.</p>

        <h3 className={styles.h3}>12. Terms and Conditions</h3>
        <p className={styles.p}>The above terms and conditions are specific to India and there can be changes to the said terms and conditions in case of deputation on international assignments.</p>

        <h3 className={styles.h3}>13. Notice Period</h3>
        <p className={styles.p}>During your tenure with COFOMO TECH , either you or COFOMO TECH may terminate your traineeship / employment under this Agreement by providing 90 days written notice. The company reserves the right to ask you to complete the notice period or adjust the earned vacation in lieu of an entire or partial notice period. If your services, behaviour and/ or performance are not found satisfactory, COFOMO TECH may terminate your services by giving notice as mentioned herein above. No notice or payment in lieu thereof shall be applicable if your services are discontinued/terminated on account of any misconduct either during your traineeship period or upon completion of the traineeship period.</p>
        <p className={styles.p}>You will be liable to pay COFOMO TECH Rs. 50,000/- in case you fail to serve COFOMO TECH for a minimum period of 1 year after joining in accordance with the Service Agreement clause.</p>
        <p className={styles.p}>If you are covered under the International Assignment Agreement, either you or COFOMO TECH can terminate the traineeship/appointment by giving 90 calendar days written notice as set out in the Separation Policy of COFOMO TECH . COFOMO TECH reserves the right if it is in the interest of the business and current assignment, to ask you to complete your notice period.</p>

        <h3 className={styles.h3}>14. Background Check</h3>
        <p className={styles.p}>Your association with COFOMO TECH will be subject to a background check in line with COFOMO TECH 's background check policy. A specially appointed agency will conduct internal and external background checks. Normally, such checks are completed within one month of joining.If the background check reveals unfavourable results, you will be liable to disciplinary action including termination of traineeship/service without notice.</p>
      </A4Page>

      {/* --- PAGE 6: Terms and Conditions (Continued 3) --- */}
      <A4Page data={data}>
        <h3 className={styles.h3}>15. Submission of Documents</h3>
        <p className={styles.p}>Please note that you should initiate and complete the upload of mandatory documents on the nextstep portal as soon as the offer letter is accepted (subject to availability of the documents)</p>
        <p className={styles.p}>Please carry the below listed Original Documents for verification on your joining day.</p>
        
        <ul className="list-disc pl-5 mb-3">
            <li className="mb-1">Pan card</li>
            <li className="mb-1">Aadhar card</li>
            <li className="mb-1">Standard X and XII/Diploma mark sheets & Certificate</li>
            <li className="mb-1">Degree certificate/Provisional Degree Certificate and mark sheets for all semesters of Graduation</li>
            <li className="mb-1">4 passport sized photographs</li>
            <li className="mb-1">Medical Certificate</li>
        </ul>

        <p className={styles.p}>If you were employed, a formal Relieving letter & Experience letter from your previous employer</p>
        <p className={styles.p}>The original documents will be returned to you after verification. In addition to the above original documents,</p>
        <p className={styles.p}>Please carry Xerox copies of the below documents</p>

        <ul className="list-disc pl-5 mb-3">
            <li className="mb-1">PAN Card (Permanent Account Number)</li>
            <li className="mb-1">Aadhaar Card (Not applicable for Nepal & Bhutan Citizenship)</li>
            <li className="mb-1">Passport</li>
        </ul>

        <h3 className={styles.h3}>16. Rules and Regulations of the Company</h3>
        <p className={styles.p}>Your appointment will be governed by the policies, rules, regulations, practices, processes and procedures of COFOMO TECH as applicable to you and the changes therein from time to time.The changes in the Policies will automatically be binding on you and no separate individual communication or notice will be served to this effect. However, the same shall be communicated on the internal portal/Ultimatix.</p>

        <h3 className={styles.h3}>Withdrawal of Offer</h3>
        <p className={styles.p}>If you fail to accept the offer from COFOMO TECH within 7 days, it will be construed that you are not interested in this employment and this offer will be automatically withdrawn.</p>
        <p className={styles.p}>Post acceptance of COFOMO TECH Offer letter if you fail to join on the date provided in the COFOMO TECH Joining letter, the offer will stand automatically terminated at the discretion of COFOMO TECH .</p>

        <p className="mt-4">We look forward to having you in our global team</p>
        <p className="mt-4">Yours Sincerely,</p>
        <p className="font-bold">COFOMOTECH PVT.LTD</p>
      </A4Page>

      {/* --- PAGE 8: Compensation Sheet --- */}
      <A4Page data={data}>
        <div className="flex flex-col items-center mb-8">
           <h2 className="text-xl font-bold uppercase tracking-wider">Compensation Sheet</h2>
        </div>

        <div className="mb-6 font-bold text-sm">
            <div className="grid grid-cols-[150px_1fr] gap-y-2">
                <div>Applicant I'd.</div>
                <div>: {data.applicationId}</div>
                <div>Name.</div>
                <div className="uppercase">: {data.candidate.fullName}</div>
                <div>Designation.</div>
                <div className="uppercase">: {data.candidate.designation}</div>
            </div>
        </div>

        <div className="mb-8">
            <p className="font-bold text-sm mb-2">Compensation Details (All Components in INR)</p>
            <table
                style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    tableLayout: "fixed"
                }}
                className="text-[10px] font-sans"
            >
                <colgroup>
                    <col style={{ width: "60%" }} />
                    <col style={{ width: "20%" }} />
                    <col style={{ width: "20%" }} />
                </colgroup>
                <thead>
                    <tr style={{ height: "20px" }} className="bg-gray-200 dark:bg-gray-700">
                        <th style={{ border: "1px solid #333", padding: "4px 6px", verticalAlign: "middle", textAlign: "left" }} className="font-bold text-black dark:text-white">COMPONENT</th>
                        <th style={{ border: "1px solid #333", padding: "4px 6px", verticalAlign: "middle", textAlign: "right" }} className="font-bold text-black dark:text-white">ANNUAL</th>
                        <th style={{ border: "1px solid #333", padding: "4px 6px", verticalAlign: "middle", textAlign: "right" }} className="font-bold text-black dark:text-white">MONTHLY</th>
                    </tr>
                </thead>
                <tbody>
                    {/* EARNINGS SECTION */}
                    <tr style={{ height: "20px" }} className="bg-gray-100 dark:bg-gray-800">
                        <td colSpan={3} style={{ border: "1px solid #333", padding: "4px 6px", verticalAlign: "middle" }} className="font-bold">EARNINGS</td>
                    </tr>
                    <tr style={{ height: "20px" }} className="bg-white">
                        <td style={{ border: "1px solid #333", padding: "4px 6px", verticalAlign: "middle" }} className="font-semibold">Cost to Company (CTC)</td>
                        <td style={{ border: "1px solid #333", padding: "4px 6px", verticalAlign: "middle", textAlign: "right" }}>{formatINR(salary.ctc)}</td>
                        <td style={{ border: "1px solid #333", padding: "4px 6px", verticalAlign: "middle", textAlign: "right" }}>{formatINR(Math.round(salary.ctc / 12))}</td>
                    </tr>
                    <tr style={{ height: "20px" }} className="bg-white">
                        <td style={{ border: "1px solid #333", padding: "4px 6px", verticalAlign: "middle", paddingLeft: "16px" }}>Variable Pay</td>
                        <td style={{ border: "1px solid #333", padding: "4px 6px", verticalAlign: "middle", textAlign: "right" }}>{formatINR(salary.variablePay)}</td>
                        <td style={{ border: "1px solid #333", padding: "4px 6px", verticalAlign: "middle", textAlign: "right" }}>{formatINR(Math.round(salary.variablePay / 12))}</td>
                    </tr>
                    <tr style={{ height: "20px" }} className="bg-white">
                        <td style={{ border: "1px solid #333", padding: "4px 6px", verticalAlign: "middle" }} className="font-semibold">Fixed Gross Salary</td>
                        <td style={{ border: "1px solid #333", padding: "4px 6px", verticalAlign: "middle", textAlign: "right" }}>{formatINR(salary.fixedGross)}</td>
                        <td style={{ border: "1px solid #333", padding: "4px 6px", verticalAlign: "middle", textAlign: "right" }}>{formatINR(Math.round(salary.fixedGross / 12))}</td>
                    </tr>
                    <tr style={{ height: "20px" }} className="bg-white">
                        <td style={{ border: "1px solid #333", padding: "4px 6px", verticalAlign: "middle", paddingLeft: "16px" }}>Basic Pay (50%)</td>
                        <td style={{ border: "1px solid #333", padding: "4px 6px", verticalAlign: "middle", textAlign: "right" }}>{formatINR(salary.basic)}</td>
                        <td style={{ border: "1px solid #333", padding: "4px 6px", verticalAlign: "middle", textAlign: "right" }}>{formatINR(Math.round(salary.basic / 12))}</td>
                    </tr>
                    <tr style={{ height: "20px" }} className="bg-white">
                        <td style={{ border: "1px solid #333", padding: "4px 6px", verticalAlign: "middle", paddingLeft: "16px" }}>HRA (50% of Basic)</td>
                        <td style={{ border: "1px solid #333", padding: "4px 6px", verticalAlign: "middle", textAlign: "right" }}>{formatINR(salary.hra)}</td>
                        <td style={{ border: "1px solid #333", padding: "4px 6px", verticalAlign: "middle", textAlign: "right" }}>{formatINR(Math.round(salary.hra / 12))}</td>
                    </tr>
                    <tr style={{ height: "20px" }} className="bg-white">
                        <td style={{ border: "1px solid #333", padding: "4px 6px", verticalAlign: "middle", paddingLeft: "16px" }}>Special Allowance</td>
                        <td style={{ border: "1px solid #333", padding: "4px 6px", verticalAlign: "middle", textAlign: "right" }}>{formatINR(salary.specialAllowance)}</td>
                        <td style={{ border: "1px solid #333", padding: "4px 6px", verticalAlign: "middle", textAlign: "right" }}>{formatINR(Math.round(salary.specialAllowance / 12))}</td>
                    </tr>

                    {/* DEDUCTIONS SECTION */}
                    <tr style={{ height: "20px" }} className="bg-gray-100 dark:bg-gray-800">
                        <td colSpan={3} style={{ border: "1px solid #333", padding: "4px 6px", verticalAlign: "middle" }} className="font-bold">DEDUCTIONS</td>
                    </tr>
                    <tr style={{ height: "20px" }} className="bg-white">
                        <td style={{ border: "1px solid #333", padding: "4px 6px", verticalAlign: "middle", paddingLeft: "16px" }}>EPF – Employee (12%)</td>
                        <td style={{ border: "1px solid #333", padding: "4px 6px", verticalAlign: "middle", textAlign: "right" }}>{formatINR(salary.epfEmployee)}</td>
                        <td style={{ border: "1px solid #333", padding: "4px 6px", verticalAlign: "middle", textAlign: "right" }}>{formatINR(Math.round(salary.epfEmployee / 12))}</td>
                    </tr>
                    <tr style={{ height: "20px" }} className="bg-white">
                        <td style={{ border: "1px solid #333", padding: "4px 6px", verticalAlign: "middle", paddingLeft: "16px" }}>Professional Tax (Telangana)</td>
                        <td style={{ border: "1px solid #333", padding: "4px 6px", verticalAlign: "middle", textAlign: "right" }}>{formatINR(salary.professionalTax)}</td>
                        <td style={{ border: "1px solid #333", padding: "4px 6px", verticalAlign: "middle", textAlign: "right" }}>{formatINR(Math.round(salary.professionalTax / 12))}</td>
                    </tr>
                    <tr style={{ height: "20px" }} className="bg-white">
                        <td style={{ border: "1px solid #333", padding: "4px 6px", verticalAlign: "middle", paddingLeft: "16px" }}>Income Tax (New Regime)</td>
                        <td style={{ border: "1px solid #333", padding: "4px 6px", verticalAlign: "middle", textAlign: "right" }}>{formatINR(salary.incomeTax)}</td>
                        <td style={{ border: "1px solid #333", padding: "4px 6px", verticalAlign: "middle", textAlign: "right" }}>{formatINR(Math.round(salary.incomeTax / 12))}</td>
                    </tr>
                    <tr style={{ height: "20px" }} className="bg-white">
                        <td style={{ border: "1px solid #333", padding: "4px 6px", verticalAlign: "middle" }} className="font-semibold">Total Deductions</td>
                        <td style={{ border: "1px solid #333", padding: "4px 6px", verticalAlign: "middle", textAlign: "right" }}>{formatINR(salary.totalDeductions)}</td>
                        <td style={{ border: "1px solid #333", padding: "4px 6px", verticalAlign: "middle", textAlign: "right" }}>{formatINR(Math.round(salary.totalDeductions / 12))}</td>
                    </tr>

                    {/* NET TAKE-HOME */}
                    <tr style={{ height: "20px" }} className="bg-green-100 dark:bg-green-900/20">
                        <td style={{ border: "1px solid #333", padding: "4px 6px", verticalAlign: "middle" }} className="font-bold text-green-800 dark:text-green-400">Net Take-Home Pay</td>
                        <td style={{ border: "1px solid #333", padding: "4px 6px", verticalAlign: "middle", textAlign: "right" }} className="font-bold text-green-800 dark:text-green-400">{formatINR(salary.netTakeHome)}</td>
                        <td style={{ border: "1px solid #333", padding: "4px 6px", verticalAlign: "middle", textAlign: "right" }} className="font-bold text-green-800 dark:text-green-400">{formatINR(Math.round(salary.netTakeHome / 12))}</td>
                    </tr>
                </tbody>
            </table>
        </div>

        <div className="space-y-2 text-[11px] text-gray-500 border-l-4 border-blue-500 pl-4 py-2 bg-blue-50/50 rounded-r-md">
            <p>EPF capped at ₹15,000/month basic. Professional Tax as per Telangana slabs. Income Tax computed under New Regime FY 2025-26 with ₹75,000 standard deduction and Section 87A rebate (≤₹12L taxable income).</p>
            <p>Take home is subjected to all applicable statutory deductions like Professional Tax, Labour Welfare Fund, Income Tax etc</p>
            <p>Salary structure will be Changed from March As per new Govt rules</p>
            {data.salary.isTraining && (
                <p>Note: For freshers in the training period, 18,000 salary will be credited for Three Months.</p>
            )}
        </div>

        <p className="mt-4 text-[11px] font-bold">
            NOTE: The salary structure mentioned in this offer is the final and complete remuneration for the employment period of one year. No revisions or changes to the salary will be made during this period.
        </p>

        <div className="mt-12 space-y-6 font-bold text-sm">
            <p>Date:</p>
            <p>Name:</p>
            <p>Signature of the employee:</p>
        </div>
      </A4Page>

      {/* --- PAGE 9: Confidentiality and Intellectual Property Terms and Conditions (Moved to Last) --- */}
      <A4Page data={data}>
        <h2 className="text-xl font-bold uppercase tracking-wider mb-6">Confidentiality and Intellectual Property Terms and Conditions</h2>

        <h3 className={styles.h3}>Confidential Information:</h3>
        <p className={styles.p}>All technical, financial, operational, and business-related information, including but not limited to source code, algorithms, designs, documentation, product roadmaps, and client databases, shared or developed during employment or engagement, shall be treated as confidential. The employee or contractor shall not, without prior written consent, disclose or use such information for any purpose other than official company work.</p>

        <h3 className={styles.h3}>Ownership of Intellectual Property:</h3>
        <p className={styles.p}>All intellectual property, code, concepts, designs, patents, trademarks, copyrights, or inventions developed by an employee, contractor, or partner in the course of their association with the company shall be the sole and exclusive property of the company. The creator hereby assigns all rights, titles, and interests in such IP to the company.</p>

        <h3 className={styles.h3}>Moral Rights Waiver:</h3>
        <p className={styles.p}>The creator waives all moral rights, including the right to be identified as the author or to object to modifications, ensuring full ownership and control of all deliverables belonging to the company.</p>

        <h3 className={styles.h3}>Non-Disclosure Obligations:</h3>
        <p className={styles.p}>Employees and associates shall not disclose, reproduce, or share any confidential information with third parties, either during or after their tenure. Any unauthorized disclosure shall result in disciplinary and legal action, including termination or damages as deemed necessary.</p>

        <h3 className={styles.h3}>Return of Materials:</h3>
        <p className={styles.p}>Upon termination of employment or engagement, all documents, devices, codes, or materials containing confidential information must be immediately returned to the company. Any retention or duplication of such materials shall be considered a breach of this agreement.</p>

        <h3 className={styles.h3}>Duration of Obligation:</h3>
        <p className={styles.p}>The obligations of confidentiality shall survive for a period of five (2) years after the termination of employment or business relationship, or indefinitely for trade secrets.</p>
      </A4Page>

    </div>
  );
};

export default LivePreview;