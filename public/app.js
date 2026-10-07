import React from "https://esm.sh/react@19";
import { createRoot } from "https://esm.sh/react-dom/client";

const { useEffect, useMemo, useState } = React;
const API_BASE = "/api";
const PRICE_KEYS = { None: 0, Basic: 90, Bronze: 120, Silver: 160, Gold: 220 };
const EXTRA_KEYS = { None: 0, Basic: 25, Standard: 45, Premium: 70 };

const formatCurrency = (value) => new Intl.NumberFormat("en-AU", {
  style: "currency",
  currency: "AUD",
  maximumFractionDigits: 0
}).format(Number(value) || 0);

const formatDate = (value) => value ? new Date(value).toLocaleDateString("en-AU") : "—";

const api = async (path, options = {}) => {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options
  });
  const text = await response.text();
  const data = text ? JSON.parse(text) : null;
  if (!response.ok) throw new Error(data?.error || "The request could not be completed.");
  return data;
};

const Status = ({ loading, error, children }) => {
  if (loading) return React.createElement("p", { className: "status-message" }, "Loading…");
  if (error) return React.createElement("p", { className: "form-error" }, error);
  return children;
};

const SectionTitle = ({ eyebrow, title, description }) => React.createElement(
  "div",
  { className: "page-title" },
  React.createElement("p", { className: "eyebrow" }, eyebrow),
  React.createElement("h1", null, title),
  description && React.createElement("p", null, description)
);

const Button = (children, onClick, className = "button-primary", type = "button", disabled = false) => React.createElement(
  "button",
  { type, className, onClick, disabled },
  children
);

const QuoteForm = ({ quote, onSave, onCancel, submitLabel = "Save quote", saving = false }) => {
  const [form, setForm] = useState(initialForm(quote));
  const [errors, setErrors] = useState({});
  const [summaryError, setSummaryError] = useState("");
  const update = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  };
  const validate = () => {
    const nextErrors = {};
    if (!form.customerName.trim()) nextErrors.customerName = "Customer name is required.";
    if (!form.coverType) nextErrors.coverType = "Choose a cover type.";
    if (!form.hospitalCoverLevel) nextErrors.hospitalCoverLevel = "Choose hospital cover.";
    if (!form.extraCoverLevel) nextErrors.extraCoverLevel = "Choose extras cover.";
    if (!form.paymentFrequency) nextErrors.paymentFrequency = "Choose a payment frequency.";
    if ((form.coverType === "Couple" || form.coverType === "Family") && !form.applicant2Age) nextErrors.applicant2Age = "Applicant 2 age is required.";
    if (form.coverType === "Family") {
      if (form.applicant3Age && !isValidAge(form.applicant3Age)) nextErrors.applicant3Age = "Enter a valid age in DD/MM/YYYY format.";
      if (form.applicant4Age && !isValidAge(form.applicant4Age)) nextErrors.applicant4Age = "Enter a valid age in DD/MM/YYYY format.";
    }
    if (!isValidAge(form.applicant1Age)) nextErrors.applicant1Age = "Enter an age between 18 and 100 years.";
    if (form.coverType === "Couple" || form.coverType === "Family") {
      if (!isValidAge(form.applicant2Age)) nextErrors.applicant2Age = "Applicant 2 must be between 18 and 100 years.";
    }
    const discount = Number(form.annualDiscountPct);
    if (Number.isNaN(discount) || discount < 0 || discount > 10) nextErrors.annualDiscountPct = "Discount must be between 0% and 10%.";
    return nextErrors;
  };
  const submit = async (event) => {
    event.preventDefault();
    const nextErrors = validate();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      setSummaryError("Please correct the highlighted fields before saving.");
      return;
    }
    setSummaryError("");
    await onSave({ ...form, customerName: form.customerName.trim(), notes: form.notes.trim() });
  };
  const premium = useMemo(() => calculatePremium(form), [form]);

  return React.createElement(
    "form",
    { className: "quote-form", onSubmit: submit },
    React.createElement("div", { className: "form-grid" },
      Field("Customer name", "customerName", React.createElement("input", { value: form.customerName, onChange: (event) => update("customerName", event.target.value), placeholder: "Customer name", required: true }), errors.customerName),
      Field("Cover type", "coverType", React.createElement("select", { value: form.coverType, onChange: (event) => update("coverType", event.target.value) }, Option("", "Select cover type"), Option("Single", "Single"), Option("Couple", "Couple"), Option("Family", "Family")), errors.coverType),
      ApplicantField("Applicant 1", 1, form, update, errors, form.coverType),
      (form.coverType === "Couple" || form.coverType === "Family") && ApplicantField("Applicant 2", 2, form, update, errors, form.coverType),
      form.coverType === "Family" && ApplicantField("Applicant 3", 3, form, update, errors, form.coverType),
      form.coverType === "Family" && ApplicantField("Applicant 4", 4, form, update, errors, form.coverType),
      Field("Hospital cover history — Applicant 1", "applicant1History", React.createElement("select", { value: form.applicant1History || "", onChange: (event) => update("applicant1History", event.target.value) }, Option("", "Select history"), Option("Yes", "Yes — prior cover"), Option("No", "No — no prior cover"), Option("Not sure", "Not sure")), errors.applicant1History),
      Field("Hospital cover level", "hospitalCoverLevel", React.createElement("select", { value: form.hospitalCoverLevel, onChange: (event) => update("hospitalCoverLevel", event.target.value) }, Option("", "Select hospital level"), Option("None", "None"), Option("Basic", "Basic"), Option("Bronze", "Bronze"), Option("Silver", "Silver"), Option("Gold", "Gold")), errors.hospitalCoverLevel),
      Field("Extras cover level", "extraCoverLevel", React.createElement("select", { value: form.extraCoverLevel, onChange: (event) => update("extraCoverLevel", event.target.value) }, Option("", "Select extras level"), Option("None", "None"), Option("Basic", "Basic"), Option("Standard", "Standard"), Option("Premium", "Premium")), errors.extraCoverLevel),
      Field("Payment frequency", "paymentFrequency", React.createElement("select", { value: form.paymentFrequency, onChange: (event) => update("paymentFrequency", event.target.value) }, Option("", "Select frequency"), Option("Monthly", "Monthly"), Option("Yearly", "Yearly")), errors.paymentFrequency),
      Field("Annual discount (%)", "annualDiscountPct", React.createElement("input", { type: "number", min: "0", max: "10", step: "0.1", value: form.annualDiscountPct, onChange: (event) => update("annualDiscountPct", event.target.value) }), errors.annualDiscountPct),
      Field("Notes", "notes", React.createElement("textarea", { value: form.notes, onChange: (event) => update("notes", event.target.value), rows: 3, placeholder: "Optional notes" }))
    ),
    React.createElement(PriceBreakdown, { premium, form, errors }),
    summaryError && React.createElement("p", { className: "form-error" }, summaryError),
    React.createElement("div", { className: "form-actions" },
      Button("Cancel", onCancel, "button-secondary"),
      React.createElement("button", { type: "submit", className: "button-primary", disabled: saving }, submitLabel)
    )
  );
};

const Field = (label, fieldName, control, error) => React.createElement(
  "label",
  { className: "field" },
  React.createElement("span", null, label),
  control,
  error && React.createElement("small", { className: "field-error" }, error)
);

const ApplicantField = (label, number, form, update, errors, coverType) => {
  if (number === 2 && coverType !== "Couple" && coverType !== "Family") return null;
  if (number > 2 && coverType !== "Family") return null;
  const field = `applicant${number}Age`;
  const historyField = `applicant${number}History`;
  return React.createElement(
    "div",
    { className: "applicant-card" },
    React.createElement("strong", null, label),
    Field("Age (DD/MM/YYYY)", field, React.createElement("input", { type: "text", inputMode: "numeric", value: form[field] || "", onChange: (event) => update(field, formatDateInput(event.target.value)), placeholder: "DD/MM/YYYY" }), errors[field]),
    Field("Hospital cover history", historyField, React.createElement("select", { value: form[historyField] || "", onChange: (event) => update(historyField, event.target.value) }, Option("", "Select history"), Option("Yes", "Yes — prior cover"), Option("No", "No — no prior cover"), Option("Not sure", "Not sure")), errors[historyField])
  );
};

const PriceBreakdown = ({ premium, form }) => {
  const warnings = premium.unknownHistoryApplicants.map((applicant) => `Applicant ${applicant}: Cover history is unknown — LHC loading has not been applied. This quote may be inaccurate.`);
  return React.createElement(
    "section",
    { className: "price-card" },
    React.createElement("h2", null, "Quote breakdown"),
    React.createElement("div", { className: "price-grid" },
      PriceLine("Hospital total", premium.hospitalTotal),
      PriceLine("Extras total", premium.extrasTotal),
      PriceLine("Family fee", premium.familyFee),
      PriceLine("Monthly premium", premium.monthlyPremium),
      PriceLine("Yearly before discount", premium.yearlyBeforeDiscount),
      PriceLine("Yearly after discount", premium.yearlyAfterDiscount)
    ),
    React.createElement("p", { className: "price-note" }, "Lifetime Health Cover loading applies only to hospital cover. It does not apply to extras cover."),
    warnings.length > 0 && React.createElement("p", { className: "warning" }, warnings.join(" ")),
    React.createElement("p", { className: "price-note" }, `Adults counted: ${premium.adultCount}. Annual discount: ${form.annualDiscountPct || 0}% (${form.paymentFrequency === "Yearly" ? "applied" : "not applied"}).`)
  );
};

const PriceLine = (label, value) => React.createElement("div", { className: "price-line" }, React.createElement("span", null, label), React.createElement("strong", null, formatCurrency(value)));
const Option = (value, label) => React.createElement("option", { value }, label);
const initialForm = (quote) => quote ? {
  customerName: quote.customerName,
  coverType: quote.coverType,
  applicant1Age: quote.applicant1Age,
  applicant2Age: quote.applicant2Age,
  applicant3Age: quote.applicant3Age,
  applicant4Age: quote.applicant4Age,
  applicant1History: quote.applicant1History,
  applicant2History: quote.applicant2History,
  applicant3History: quote.applicant3History,
  applicant4History: quote.applicant4History,
  hospitalCoverLevel: quote.hospitalCoverLevel,
  extraCoverLevel: quote.extraCoverLevel,
  paymentFrequency: quote.paymentFrequency,
  annualDiscountPct: quote.annualDiscountPct,
  notes: quote.notes
} : {
  customerName: "",
  coverType: "Single",
  applicant1Age: "",
  applicant2Age: "",
  applicant3Age: "",
  applicant4Age: "",
  applicant1History: "",
  applicant2History: "",
  applicant3History: "",
  applicant4History: "",
  hospitalCoverLevel: "",
  extraCoverLevel: "",
  paymentFrequency: "",
  annualDiscountPct: 0,
  notes: ""
};

const isValidAge = (value) => {
  if (!/^\d{2}\/\d{2}\/\d{4}$/.test(value || "")) return false;
  const [day, month, year] = value.split("/").map(Number);
  const date = new Date(year, month - 1, day);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return false;
  const today = new Date();
  let age = today.getFullYear() - year;
  const monthDifference = today.getMonth() - date.getMonth();
  if (monthDifference < 0 || (monthDifference === 0 && today.getDate() < date.getDate())) age -= 1;
  return age >= 18 && age <= 100;
};

const formatDateInput = (value) => {
  const digits = value.replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
};

const calculatePremium = (form) => {
  const adultCount = form.coverType === "Single" ? 1 : form.coverType === "Couple" || form.coverType === "Family" ? 2 : 0;
  const ages = [form.applicant1Age, form.applicant2Age, form.applicant3Age, form.applicant4Age].slice(0, adultCount);
  const histories = [form.applicant1History, form.applicant2History, form.applicant3History, form.applicant4History].slice(0, adultCount);
  const hospitalRows = ages.map((age, index) => {
    const calculatedAge = getAge(age);
    const history = histories[index] || "";
    const loading = getLhcLoading(calculatedAge, history, form.hospitalCoverLevel);
    return { applicant: index + 1, history, loading, age: calculatedAge };
  });
  const hospitalTotal = hospitalRows.reduce((sum, row) => sum + (PRICE_KEYS[form.hospitalCoverLevel] || 0) * (1 + row.loading), 0);
  const extrasTotal = (EXTRA_KEYS[form.extraCoverLevel] || 0) * adultCount;
  const familyFee = form.coverType === "Family" ? 30 : 0;
  const monthlyPremium = hospitalTotal + extrasTotal + familyFee;
  const discount = Number(form.annualDiscountPct || 0) / 100;
  const yearlyBeforeDiscount = monthlyPremium * 12;
  const yearlyAfterDiscount = form.paymentFrequency === "Yearly" ? yearlyBeforeDiscount * (1 - discount) : yearlyBeforeDiscount;
  return {
    adultCount,
    hospitalTotal,
    extrasTotal,
    familyFee,
    monthlyPremium,
    yearlyBeforeDiscount,
    yearlyAfterDiscount,
    unknownHistoryApplicants: hospitalRows
      .filter((row) => row.history === "Not sure" && form.hospitalCoverLevel !== "None")
      .map((row) => row.applicant)
  };
};

const getAge = (value) => {
  if (!isValidAge(value)) return null;
  const [day, month, year] = value.split("/").map(Number);
  const date = new Date(year, month - 1, day);
  const today = new Date();
  let age = today.getFullYear() - year;
  const monthDifference = today.getMonth() - date.getMonth();
  if (monthDifference < 0 || (monthDifference === 0 && today.getDate() < date.getDate())) age -= 1;
  return age;
};

const getLhcLoading = (age, history, hospitalLevel) => {
  if (!age || hospitalLevel === "None" || history !== "No" || age <= 30) return 0;
  return Math.max(0, (age - 30) * 0.02);
};

const QuoteList = ({ quotes, loading, error, onCreate, onView, onEdit, onDelete }) => {
  const quoteList = quotes.length
    ? quotes.map((quote) => React.createElement(
      "article",
      { className: "quote-card", key: quote.id },
      React.createElement("div", null, React.createElement("h2", null, quote.customerName), React.createElement("p", null, `${quote.coverType} · ${quote.hospitalCoverLevel} hospital · ${quote.extraCoverLevel} extras`)),
      React.createElement("div", { className: "card-actions" },
        Button("View", () => onView(quote.id), "button-secondary"),
        Button("Edit", () => onEdit(quote.id), "button-secondary"),
        Button("Delete", () => onDelete(quote.id), "button-danger")
      )
    ))
    : React.createElement("div", { className: "empty-state" }, "No quotes have been saved yet.");

  return React.createElement(
    "main",
    { className: "page-shell" },
    React.createElement(SectionTitle, {title: "Quote list"}),
    React.createElement("div", { className: "list-toolbar" },
      React.createElement("p", null, `${quotes.length} quote${quotes.length === 1 ? "" : "s"}`),
      Button("Add quote", onCreate)
    ),
    Status({ loading, error, children: React.createElement("div", { className: "quote-list" }, quoteList) })
  );
};

const QuoteDetail = ({ quote, loading, error, onBack, onEdit, onDelete }) => {
  if (loading) return React.createElement("main", { className: "page-shell" }, "Loading quote…");
  if (error) return React.createElement("main", { className: "page-shell" }, React.createElement("p", { className: "form-error" }, error));
  if (!quote) return React.createElement("main", { className: "page-shell" }, React.createElement("p", null, "Quote not found."));

  const premium = useMemo(() => calculatePremium(quote), [quote]);
  const quoteDetails = React.createElement(
    "section",
    { className: "detail-card" },
    React.createElement("h2", null, "Quote details"),
    DetailRow("Cover type", quote.coverType),
    DetailRow("Hospital cover", quote.hospitalCoverLevel),
    DetailRow("Extras cover", quote.extraCoverLevel),
    DetailRow("Payment frequency", quote.paymentFrequency),
    DetailRow("Annual discount", `${quote.annualDiscountPct}%`),
    DetailRow("Notes", quote.notes || "None")
  );
  const premiumDetails = React.createElement(
    "section",
    { className: "detail-card" },
    React.createElement("h2", null, "Premium breakdown"),
    DetailRow("Adults counted", premium.adultCount),
    DetailRow("Hospital total", formatCurrency(premium.hospitalTotal)),
    DetailRow("Extras total", formatCurrency(premium.extrasTotal)),
    DetailRow("Family fee", formatCurrency(premium.familyFee)),
    DetailRow("Monthly premium", formatCurrency(premium.monthlyPremium)),
    DetailRow("Yearly before discount", formatCurrency(premium.yearlyBeforeDiscount)),
    DetailRow("Yearly after discount", formatCurrency(premium.yearlyAfterDiscount))
  );
  const warning = premium.unknownHistoryApplicants.length > 0
    ? React.createElement("p", { className: "warning" }, premium.unknownHistoryApplicants.map((applicant) => `Applicant ${applicant}: Cover history is unknown — LHC loading has not been applied. This quote may be inaccurate.`).join(" "))
    : null;

  return React.createElement(
    "main",
    { className: "page-shell" },
    React.createElement("button", { className: "back-button", onClick: onBack }, "← Back to quotes"),
    React.createElement(SectionTitle, { eyebrow: `Quote #${quote.id}`, title: quote.customerName, description: `Created ${formatDate(quote.createdAt)}` }),
    React.createElement("div", { className: "detail-grid" }, quoteDetails, premiumDetails),
    warning,
    React.createElement("div", { className: "form-actions" },
      Button("Edit quote", () => onEdit(quote.id), "button-secondary"),
      Button("Delete quote", () => onDelete(quote.id), "button-danger")
    )
  );
};

const App = () => {
  const [page, setPage] = useState("list");
  const [quotes, setQuotes] = useState([]);
  const [selectedQuote, setSelectedQuote] = useState(null);
  const [formQuote, setFormQuote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const loadQuotes = async () => {
    setLoading(true);
    setError("");
    try {
      setQuotes(await api("/quotes"));
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadQuotes(); }, []);

  const createQuote = () => {
    setFormQuote(null);
    setPage("create");
  };

  const saveQuote = async (payload) => {
    setSaving(true);
    setError("");
    try {
      if (formQuote) await api(`/quotes/${formQuote.id}`, { method: "PUT", body: JSON.stringify(payload) });
      else await api("/quotes", { method: "POST", body: JSON.stringify(payload) });
      setPage("list");
      await loadQuotes();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSaving(false);
    }
  };

  const editQuote = async (id) => {
    setLoading(true);
    setError("");
    try {
      const quote = await api(`/quotes/${id}`);
      setFormQuote(quote);
      setPage("edit");
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  };

  const viewQuote = async (id) => {
    setLoading(true);
    setError("");
    try {
      setSelectedQuote(await api(`/quotes/${id}`));
      setPage("detail");
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  };

  const deleteQuote = async (id) => {
    if (!window.confirm("Delete this quote? This cannot be undone.")) return;
    try {
      await api(`/quotes/${id}`, { method: "DELETE" });
      await loadQuotes();
      setPage("list");
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  return React.createElement(
    React.Fragment,
    null,
    React.createElement("header", { className: "topbar" }, React.createElement("div", { className: "brand" }, React.createElement("span", { className: "brand-icon" }, "HC"), React.createElement("div", null, React.createElement("strong", null, "HealthCover"), React.createElement("small", null, "Quote system")))),
    page === "list" && React.createElement(QuoteList, { quotes, loading, error, onCreate: createQuote, onView: viewQuote, onEdit: editQuote, onDelete: deleteQuote }),
    page === "create" && React.createElement("main", { className: "page-shell" }, React.createElement("button", { className: "back-button", onClick: () => setPage("list") }, "← Back to quotes"), React.createElement(SectionTitle, { eyebrow: "New quote", title: "Create a quote", description: "Enter the requested details. The premium is calculated only from valid data." }), React.createElement(QuoteForm, { onSave: saveQuote, onCancel: () => setPage("list"), saving })),
    page === "edit" && React.createElement("main", { className: "page-shell" }, React.createElement("button", { className: "back-button", onClick: () => setPage("list") }, "← Back to quotes"), React.createElement(SectionTitle, { eyebrow: "Edit quote", title: "Update quote", description: "Changes are stored and recalculated when the quote is displayed." }), React.createElement(QuoteForm, { quote: formQuote, onSave: saveQuote, onCancel: () => setPage("list"), submitLabel: "Update quote", saving })),
    page === "detail" && React.createElement(QuoteDetail, { quote: selectedQuote, loading, error, onBack: () => setPage("list"), onEdit: editQuote, onDelete: deleteQuote })
  );
};

createRoot(document.getElementById("root")).render(React.createElement(App));
