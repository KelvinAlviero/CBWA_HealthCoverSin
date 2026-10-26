import test from "node:test";
import assert from "node:assert/strict";
import { calculateQuotePremium, getLhcLoading } from "../src/quote-calculation.js";

test("calculates hospital and extras separately and applies family fee", () => {
  const premium = calculateQuotePremium({
    coverType: "Family",
    applicant1Age: "15/01/1970",
    applicant2Age: "12/04/1975",
    applicant3Age: "",
    applicant4Age: "",
    applicant1History: "Yes",
    applicant2History: "Yes",
    applicant3History: "",
    applicant4History: "",
    hospitalCoverLevel: "Basic",
    extraCoverLevel: "Standard",
    paymentFrequency: "Monthly",
    annualDiscountPct: 0
  });

  assert.equal(premium.adultCount, 2);
  assert.equal(premium.hospitalTotal, 180);
  assert.equal(premium.extrasTotal, 90);
  assert.equal(premium.familyFee, 30);
  assert.equal(premium.monthlyPremium, 300);
});

test("applies loading only when history is No and age is above 30", () => {
  assert.equal(getLhcLoading(40, "No", "Gold"), 0.2);
  assert.equal(getLhcLoading(40, "Yes", "Gold"), 0);
  assert.equal(getLhcLoading(40, "Not sure", "Gold"), 0);
  assert.equal(getLhcLoading(40, "No", "None"), 0);
});

test("returns applicant-level LHC loading percentages", () => {
  const age40Date = new Date();
  age40Date.setFullYear(age40Date.getFullYear() - 40);
  const age40Input = `${String(age40Date.getDate()).padStart(2, "0")}/${String(age40Date.getMonth() + 1).padStart(2, "0")}/${age40Date.getFullYear()}`;
  const premium = calculateQuotePremium({
    coverType: "Single",
    applicant1Age: age40Input,
    applicant2Age: "",
    applicant3Age: "",
    applicant4Age: "",
    applicant1History: "No",
    applicant2History: "",
    applicant3History: "",
    applicant4History: "",
    hospitalCoverLevel: "Gold",
    extraCoverLevel: "None",
    paymentFrequency: "Monthly",
    annualDiscountPct: 0
  });

  assert.equal(premium.hospitalRows[0].loadingPct, 20);
  assert.equal(premium.hospitalRows[0].loading, 0.2);
});

test("applies the ten percent yearly discount", () => {
  const premium = calculateQuotePremium({
    coverType: "Single",
    applicant1Age: "15/01/1990",
    applicant2Age: "",
    applicant3Age: "",
    applicant4Age: "",
    applicant1History: "No",
    applicant2History: "",
    applicant3History: "",
    applicant4History: "",
    hospitalCoverLevel: "None",
    extraCoverLevel: "None",
    paymentFrequency: "Yearly",
    annualDiscountPct: 10
  });

  assert.equal(premium.monthlyPremium, 0);
  assert.equal(premium.yearlyAfterDiscount, 0);
});
