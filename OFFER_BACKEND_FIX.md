# Backend Fix - Offer Salary Calculation and Template Variables

## Issue
The frontend is not fetching salary details properly because:
1. The `calculate_salary` function has duplicate keys ("HRA" and "HR Allowance")
2. Template variable names don't match what the Word template expects

## Solution

### Update `services/offer_service.py`

Replace the `calculate_salary` function with this corrected version:

```python
def calculate_salary(gross):

    basic = gross * 0.50
    hra = basic * 0.40
    pf_employee = basic * 0.12
    pf_employer = basic * 0.12
    professional_tax = 200

    special_allowance = gross - (basic + hra)

    annual_ctc = gross * 12

    return {
        "Basic pay": round(basic, 2),
        "HRA": round(hra, 2),  # Changed from "HR Allowance" to match database
        "Special Allowance": round(special_allowance, 2),
        "Professional tax": professional_tax,
        "Provident fund Employee": round(pf_employee, 2),
        "Provident fund Employer": round(pf_employer, 2),
        "Gross Earnings": round(gross, 2),
        "Annual CTC": round(annual_ctc, 2)
    }
```

**Key Changes:**
- ✅ Removed duplicate "HR Allowance" key
- ✅ Keep only "HRA" for consistency
- ✅ All keys now match the Word template variable names

### Update `offer_bp.route("/release/<int:resume_id>")`

Ensure the context dict is correctly populated. The current code should work, but verify it matches:

```python
context = {
    "Date": data["offer_date"],
    "Application ID": f"APP-{resume_id}",
    "Name": data["name"],
    "Address line 1": data["address_line1"],
    "street": data["street"],
    "City": data["city"],
    "Pincode": data["pincode"],
    "Mobile": data["mobile"],
    "Job Title": data["job_title"],
    "Start Date": data["start_date"],
    "Reporting manager": data["reporting_manager"],
    "Job Mode": data["job_mode"],
    "Employment Type": data["employment_type"],
    **salary  # This spreads all the salary keys into context
}
```

## Frontend Verification

The frontend `/my-offer` endpoint returns salary_details correctly. Verify in your `MyOfferView.tsx` component that you're displaying:

```javascript
{
  "basic_pay": float,
  "hra": float,
  "special_allowance": float,
  "professional_tax": float,
  "pf_employee": float,
  "pf_employer": float,
  "annual_ctc": float
}
```

## Steps to Implement

1. Update your `services/offer_service.py` file with the corrected `calculate_salary` function
2. Restart your Flask backend server
3. Test by creating a new offer from HR dashboard
4. Verify the PDF generates correctly with all salary fields populated
5. The frontend will automatically fetch and display the salary details

## Verification

After updating:
- Generate a new offer letter
- Check the PDF file in the `offers/` folder to verify all salary fields are populated
- Check the database to ensure all values are stored
- Check the frontend Offers view to ensure salary details display correctly
