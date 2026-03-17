import React from 'react';
import { OfferData, CandidateDetails, SalaryConfig } from '../types';
import { Input, Select, Toggle } from './ui/FormElements';
import { Card } from './ui/Common';
import { User, Briefcase, DollarSign, Building } from 'lucide-react';
import ctLogo from './assets/CT_LOGO.png';

interface OfferFormProps {
  data: OfferData;
  onChange: (data: OfferData) => void;
}

const OfferForm: React.FC<OfferFormProps> = ({ data, onChange }) => {
  const updateCandidate = (field: keyof CandidateDetails, value: any) => {
    onChange({
      ...data,
      candidate: { ...data.candidate, [field]: value }
    });
  };

  const updateSalary = (field: keyof SalaryConfig, value: any) => {
    onChange({
      ...data,
      salary: { ...data.salary, [field]: value }
    });
  };

  const updateTerms = (field: keyof typeof data.terms, value: any) => {
    onChange({
      ...data,
      terms: { ...data.terms, [field]: value }
    });
  };

  const updateCandidateId = (value: string) => {
    onChange({
      ...data,
      candidateId: value,
    });
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center text-gray-800 dark:text-white">
          <User className="w-5 h-5 mr-2 text-corporate-500" />
          Candidate Details
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input 
            label="Application ID" 
            value={data.applicationId || ''} 
            onChange={(e) => onChange({ ...data, applicationId: e.target.value })}
            placeholder="Application ID"
          />
          <Input 
            label="Candidate ID" 
            value={data.candidateId || ''} 
            readOnly
            placeholder="Candidate ID"
          />
          <Input 
            label="Full Name" 
            value={data.candidate.fullName} 
            onChange={(e) => updateCandidate('fullName', e.target.value)} 
            placeholder="Full Name"
          />
          <Input 
            label="Email Address" 
            type="email"
            value={data.candidate.email} 
            onChange={(e) => updateCandidate('email', e.target.value)}
            placeholder="Email Address" 
          />
          <Input 
            label="Mobile Number" 
            value={data.candidate.mobile} 
            onChange={(e) => updateCandidate('mobile', e.target.value)}
            placeholder="Mobile Number" 
          />
           <Input 
            label="Current Location" 
            value={data.candidate.location} 
            onChange={(e) => updateCandidate('location', e.target.value)} 
            placeholder="Current Location"
          />
          <Input 
            label="Address Line 1" 
            value={data.candidate.addressLine1} 
            onChange={(e) => updateCandidate('addressLine1', e.target.value)} 
            placeholder="Address Line 1"
          />
          <Input 
            label="City" 
            value={data.candidate.city} 
            onChange={(e) => updateCandidate('city', e.target.value)} 
            placeholder="City"
          />
          <Input 
            label="Pincode" 
            value={data.candidate.pincode} 
            onChange={(e) => updateCandidate('pincode', e.target.value)} 
            placeholder="Pincode"
          />
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center text-gray-800 dark:text-white">
          <Briefcase className="w-5 h-5 mr-2 text-corporate-500" />
          Employment Details
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input 
            label="Designation" 
            value={data.candidate.designation} 
            onChange={(e) => updateCandidate('designation', e.target.value)} 
            placeholder="Designation"
          />
          <Input 
            label="Department" 
            value={data.candidate.department} 
            onChange={(e) => updateCandidate('department', e.target.value)} 
            placeholder="Department"
          />
          <Input 
            label="Reporting Manager" 
            value={data.candidate.reportingManager} 
            onChange={(e) => updateCandidate('reportingManager', e.target.value)} 
            placeholder="Reporting Manager"
          />
          <Input 
            label="Joining Date" 
            type="date"
            value={data.candidate.joiningDate} 
            onChange={(e) => updateCandidate('joiningDate', e.target.value)} 
            placeholder="Joining Date"
          />
          <Select 
            label="Employment Type"
            options={[
              { label: 'Full-time', value: 'Full-time' },
              { label: 'Internship', value: 'Internship' },
              { label: 'Contract', value: 'Contract' },
            ]}
            value={data.candidate.employmentType}
            onChange={(e) => updateCandidate('employmentType', e.target.value)}
          />
           <Select 
            label="Experience Level"
            options={[
              { label: 'Fresher', value: 'Fresher' },
              { label: 'Experienced', value: 'Experienced' },
            ]}
            value={data.candidate.experienceLevel}
            onChange={(e) => updateCandidate('experienceLevel', e.target.value)}
          />
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center text-gray-800 dark:text-white">
          <DollarSign className="w-5 h-5 mr-2 text-corporate-500" />
          Compensation Structure
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <Input 
            label="CTC (LPA) — includes variable pay" 
            type="number"
            min="0"
            step="0.1"
            value={data.salary.ctc || ''} 
            onChange={(e) => updateSalary('ctc', e.target.value === '' ? 0 : parseFloat(e.target.value))} 
            placeholder="CTC (incl. variable)"
          />
          <Input 
            label="Variable Pay (%)" 
            type="number"
             min="0"
            max="100"
            value={data.salary.variablePercentage || ''} 
            onChange={(e) => updateSalary('variablePercentage', e.target.value === '' ? 0 : parseInt(e.target.value))} 
            placeholder="Variable Pay (%)"
          />
          <Input 
            label="Probation (Months)" 
            type="number"
            value={data.salary.probationPeriod} 
            onChange={(e) => updateSalary('probationPeriod', e.target.value === '' ? '' : parseInt(e.target.value))} 
            placeholder="Probation (Months)"
          />
        </div>
        <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
          <Toggle 
            label="Enable Training Mode (50% Stipend Clause)" 
            checked={data.salary.isTraining} 
            onChange={(checked) => updateSalary('isTraining', checked)} 
          />
        </div>
      </Card>

       <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center text-gray-800 dark:text-white">
          <Building className="w-5 h-5 mr-2 text-corporate-500" />
          Company & Terms
        </h3>
        <div className="grid grid-cols-1 gap-4">
           <Input 
            label="Notice Period" 
            value={data.terms.noticePeriod} 
            onChange={(e) => updateTerms('noticePeriod', e.target.value)} 
            placeholder="Notice Period"
          />
          
          <div className="flex flex-col space-y-3 mt-2">
            <Toggle 
              label="Include Company Logo in PDF" 
              checked={data.includeLogo} 
              onChange={(c) => onChange({ 
                ...data, 
                includeLogo: c,
                companyLogo: c ? ctLogo : ''
              })} 
            />
             <Toggle 
              label="Require Background Verification" 
              checked={data.terms.backgroundCheck} 
              onChange={(c) => updateTerms('backgroundCheck', c)} 
            />
          </div>
        </div>
      </Card>
    </div>
  );
};

export default OfferForm;