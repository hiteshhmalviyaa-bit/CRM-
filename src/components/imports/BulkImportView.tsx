import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import {
  UploadCloud,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  RefreshCw,
  Download,
  Check,
  X,
  FileText,
  Clock,
  Sparkles,
  Info,
} from 'lucide-react';
import { useCRM } from '../../context/CRMContext';
import { Lead, LeadPriority } from '../../types/crm';
import { SAMPLE_CSV_CONTENT } from '../../data/seedData';
import { formatDate, formatDateTime } from '../../utils/crmHelpers';

export const BulkImportView: React.FC = () => {
  const { executeImport, importHistory, statuses, sources, users, checkDuplicates } = useCRM();

  // Active view tab: 'workflow' | 'history'
  const [activeTab, setActiveTab] = useState<'workflow' | 'history'>('workflow');

  // 6 Workflow Steps: 1 to 6
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Uploaded file data
  const [fileName, setFileName] = useState<string>('');
  const [fileHeaders, setFileHeaders] = useState<string[]>([]);
  const [rawRows, setRawRows] = useState<Record<string, any>[]>([]);

  // Step 3: Column Mapping
  // Key = Uploaded Column Name, Value = CRM Field Name (or 'none' for Do Not Import)
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({});

  // Step 5: Duplicate Handling Strategy ('skip' | 'update' | 'new')
  const [duplicateStrategy, setDuplicateStrategy] = useState<'skip' | 'update' | 'new'>('skip');

  // Step 6: Import execution results
  const [importResult, setImportResult] = useState<{
    imported: number;
    updated: number;
    skipped: number;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Available CRM target fields for mapping (PRD Section 23)
  const CRM_FIELDS = [
    { id: 'none', label: '-- Do Not Import --' },
    { id: 'fullName', label: 'Full Name' },
    { id: 'firstName', label: 'First Name' },
    { id: 'lastName', label: 'Last Name' },
    { id: 'company', label: 'Company / Organization' },
    { id: 'jobTitle', label: 'Job Title' },
    { id: 'email', label: 'Primary Email' },
    { id: 'phone', label: 'Primary Phone' },
    { id: 'status', label: 'Lead Status' },
    { id: 'priority', label: 'Priority' },
    { id: 'source', label: 'Lead Source' },
    { id: 'estimatedValue', label: 'Deal Value ($)' },
    { id: 'city', label: 'City' },
    { id: 'state', label: 'State / Province' },
    { id: 'country', label: 'Country' },
    { id: 'website', label: 'Website' },
    { id: 'description', label: 'Notes / Description' },
  ];

  // Helper to auto-map headers smartly
  const guessMapping = (header: string): string => {
    const h = header.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (h.includes('fullname') || h === 'name' || h === 'customername' || h === 'contactname') return 'fullName';
    if (h === 'firstname' || h === 'first') return 'firstName';
    if (h === 'lastname' || h === 'last') return 'lastName';
    if (h.includes('company') || h.includes('organization') || h.includes('org') || h === 'account') return 'company';
    if (h.includes('title') || h.includes('role') || h.includes('position')) return 'jobTitle';
    if (h.includes('email') || h === 'mail') return 'email';
    if (h.includes('phone') || h.includes('mobile') || h.includes('tel') || h.includes('cell')) return 'phone';
    if (h.includes('status') || h.includes('stage')) return 'status';
    if (h.includes('priority')) return 'priority';
    if (h.includes('source') || h.includes('channel')) return 'source';
    if (h.includes('value') || h.includes('amount') || h.includes('revenue') || h.includes('deal')) return 'estimatedValue';
    if (h.includes('city')) return 'city';
    if (h.includes('state') || h.includes('province')) return 'state';
    if (h.includes('country')) return 'country';
    if (h.includes('website') || h.includes('url')) return 'website';
    if (h.includes('note') || h.includes('desc') || h.includes('comment')) return 'description';
    return 'none';
  };

  // Step 1 & 2: Process file
  const handleFileUpload = (file: File) => {
    setFileName(file.name);
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const json: Record<string, any>[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

        if (!json || json.length === 0) {
          alert('Uploaded file is empty or could not be parsed.');
          return;
        }

        const headers = Object.keys(json[0]);
        setFileHeaders(headers);
        setRawRows(json);

        // Auto map columns
        const initialMapping: Record<string, string> = {};
        headers.forEach((h) => {
          initialMapping[h] = guessMapping(h);
        });
        setColumnMapping(initialMapping);

        // Proceed to Step 2
        setCurrentStep(2);
      } catch (err) {
        console.error('File parsing error:', err);
        alert('Failed to parse file. Please upload a valid .csv or .xlsx file.');
      }
    };

    reader.readAsBinaryString(file);
  };

  // 1-Click Load Sample File
  const handleLoadSampleCSV = () => {
    const blob = new Blob([SAMPLE_CSV_CONTENT], { type: 'text/csv' });
    const file = new File([blob], 'Enterprise_Sales_Leads_Q4.csv', { type: 'text/csv' });
    handleFileUpload(file);
  };

  // Step 4: Validate mapped rows
  const validationSummary = React.useMemo(() => {
    let validCount = 0;
    let invalidCount = 0;
    let potentialDuplicatesCount = 0;

    const validatedRows = rawRows.map((row, idx) => {
      // Map row to CRM Lead object
      const leadObj: Partial<Lead> = {};
      Object.entries(columnMapping).forEach(([colHeader, crmField]) => {
        if (crmField && crmField !== 'none') {
          (leadObj as any)[crmField] = row[colHeader];
        }
      });

      const errors: string[] = [];

      // Check required per PRD: First Name/Company + Phone/Email
      const hasName = Boolean(leadObj.fullName || leadObj.firstName || leadObj.company);
      const hasContact = Boolean(leadObj.email || leadObj.phone);

      if (!hasName) errors.push('Missing Name or Company');
      if (!hasContact) errors.push('Missing Email or Phone');

      if (leadObj.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(leadObj.email.trim())) {
        errors.push('Malformed Email');
      }

      // Check duplicates against existing database
      const dupMatches = checkDuplicates(leadObj.email, leadObj.phone);
      const isDuplicate = dupMatches.length > 0;

      if (isDuplicate) {
        potentialDuplicatesCount++;
      }

      if (errors.length === 0) {
        validCount++;
      } else {
        invalidCount++;
      }

      return {
        rowIndex: idx + 1,
        leadObj,
        errors,
        isValid: errors.length === 0,
        isDuplicate,
        duplicateMatch: dupMatches[0],
      };
    });

    return {
      validCount,
      invalidCount,
      potentialDuplicatesCount,
      totalCount: rawRows.length,
      validatedRows,
    };
  }, [rawRows, columnMapping, checkDuplicates]);

  // Step 6: Execute import
  const handleExecuteImport = () => {
    const validLeadsToImport = validationSummary.validatedRows
      .filter((r) => r.isValid)
      .map((r) => r.leadObj);

    const result = executeImport(validLeadsToImport, duplicateStrategy, fileName || 'bulk_import.csv');
    setImportResult(result);
  };

  // Reset workflow
  const handleResetWorkflow = () => {
    setCurrentStep(1);
    setFileName('');
    setFileHeaders([]);
    setRawRows([]);
    setColumnMapping({});
    setImportResult(null);
  };

  // Download Sample CSV template
  const handleDownloadSample = () => {
    const blob = new Blob([SAMPLE_CSV_CONTENT], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'CRM_Lead_Import_Template.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <span>Bulk Lead Import</span>
            <span className="text-xs font-semibold px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-full border border-indigo-200">
              CSV & Excel
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Guided 6-step workflow: inspect headers, map fields, validate formatting, and handle duplicates safely
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Workflow vs History toggle */}
          <div className="flex items-center p-1 bg-slate-100 rounded-lg border border-slate-200 text-xs">
            <button
              onClick={() => setActiveTab('workflow')}
              className={`px-3 py-1.5 rounded-md font-medium transition ${
                activeTab === 'workflow'
                  ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Import Wizard
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-3 py-1.5 rounded-md font-medium transition flex items-center gap-1.5 ${
                activeTab === 'history'
                  ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>Past Imports</span>
              <span className="text-[10px] px-1.5 py-0.2 bg-slate-200 rounded-full">
                {importHistory.length}
              </span>
            </button>
          </div>

          <button
            onClick={handleDownloadSample}
            className="px-3 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg flex items-center gap-1.5 transition shadow-2xs"
            title="Download formatted CSV template"
          >
            <Download size={14} className="text-slate-500" />
            <span>Sample Template</span>
          </button>
        </div>
      </div>

      {activeTab === 'history' ? (
        /* Import History Tab (PRD Section 3.1 & 6) */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-800">Historical Import Log</h3>
            <span className="text-xs text-slate-400">Audit trail of all bulk ingestions</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">File Name</th>
                  <th className="py-3 px-4">Import Date</th>
                  <th className="py-3 px-4">Imported By</th>
                  <th className="py-3 px-4">Strategy</th>
                  <th className="py-3 px-4 text-center">Total Rows</th>
                  <th className="py-3 px-4 text-center">Imported</th>
                  <th className="py-3 px-4 text-center">Updated</th>
                  <th className="py-3 px-4 text-center">Skipped</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {importHistory.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50 transition">
                    <td className="py-3.5 px-4 font-semibold text-slate-800 flex items-center gap-2">
                      <FileSpreadsheet size={15} className="text-emerald-600 flex-shrink-0" />
                      <span className="truncate">{item.fileName}</span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">{formatDateTime(item.date)}</td>
                    <td className="py-3.5 px-4 text-slate-700 font-medium">{item.importedBy}</td>
                    <td className="py-3.5 px-4">
                      <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                        {item.strategy}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center font-bold text-slate-800">
                      {item.totalRows}
                    </td>
                    <td className="py-3.5 px-4 text-center font-bold text-emerald-700">
                      +{item.importedCount}
                    </td>
                    <td className="py-3.5 px-4 text-center text-indigo-700">
                      {item.updatedCount}
                    </td>
                    <td className="py-3.5 px-4 text-center text-slate-400">
                      {item.skippedDuplicatesCount}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* The Guided 6-Step Workflow (PRD Section 23) */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          {/* Step Progress Indicator Bar */}
          <div className="p-4 border-b border-slate-200 bg-slate-50/70 overflow-x-auto">
            <div className="flex items-center justify-between min-w-[650px] gap-2">
              {[
                { step: 1, label: 'Upload File' },
                { step: 2, label: 'Read File' },
                { step: 3, label: 'Map Fields' },
                { step: 4, label: 'Validate' },
                { step: 5, label: 'Duplicates' },
                { step: 6, label: 'Preview & Import' },
              ].map((item) => {
                const isPast = currentStep > item.step;
                const isCurrent = currentStep === item.step;

                return (
                  <div key={item.step} className="flex items-center gap-2 flex-1">
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                        isPast
                          ? 'bg-emerald-600 text-white'
                          : isCurrent
                          ? 'bg-indigo-600 text-white ring-2 ring-indigo-200'
                          : 'bg-slate-200 text-slate-500'
                      }`}
                    >
                      {isPast ? <Check size={13} /> : item.step}
                    </div>
                    <span
                      className={`text-xs whitespace-nowrap ${
                        isCurrent
                          ? 'font-bold text-slate-900'
                          : isPast
                          ? 'font-medium text-slate-700'
                          : 'text-slate-400'
                      }`}
                    >
                      {item.label}
                    </span>
                    {item.step < 6 && (
                      <div
                        className={`h-0.5 flex-1 ml-1 ${
                          isPast ? 'bg-emerald-500' : 'bg-slate-200'
                        }`}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Workflow Step Contents */}
          <div className="p-8">
            {/* STEP 1: Upload File */}
            {currentStep === 1 && (
              <div className="max-w-2xl mx-auto space-y-6 text-center py-6">
                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".csv, .xlsx, .xls"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileUpload(file);
                  }}
                />

                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-300 hover:border-indigo-500 hover:bg-slate-50/50 p-12 rounded-2xl cursor-pointer transition flex flex-col items-center justify-center space-y-4 group"
                >
                  <div className="w-16 h-16 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 group-hover:scale-110 transition duration-200">
                    <UploadCloud size={32} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      Drag & Drop CSV or Excel Spreadsheet
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">
                      Supports standard <span className="font-semibold text-slate-700">.csv</span>{' '}
                      and <span className="font-semibold text-slate-700">.xlsx</span> files (up to 5,000 rows)
                    </p>
                  </div>
                  <button
                    type="button"
                    className="px-4 py-2 bg-indigo-600 group-hover:bg-indigo-700 text-white font-semibold text-xs rounded-lg shadow-sm"
                  >
                    Select File from Computer
                  </button>
                </div>

                <div className="flex items-center justify-center gap-3 pt-2">
                  <span className="text-xs text-slate-400">Want to test immediately?</span>
                  <button
                    onClick={handleLoadSampleCSV}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition"
                  >
                    <Sparkles size={13} className="text-amber-500" />
                    <span>Load Pre-Built Sample Lead List</span>
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: Read File */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <div className="flex items-center justify-between bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <div className="flex items-center gap-3">
                    <FileSpreadsheet size={24} className="text-emerald-600" />
                    <div>
                      <h3 className="text-xs font-bold text-slate-900">{fileName}</h3>
                      <p className="text-[11px] text-slate-500">
                        Successfully parsed {rawRows.length} rows and {fileHeaders.length} columns
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleResetWorkflow}
                    className="text-xs text-slate-500 hover:text-slate-800 underline"
                  >
                    Choose different file
                  </button>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-slate-800 mb-2">Sample Preview (First 3 Rows)</h4>
                  <div className="overflow-x-auto border border-slate-200 rounded-xl">
                    <table className="w-full text-left text-xs divide-y divide-slate-200">
                      <thead className="bg-slate-50 text-slate-600 font-semibold">
                        <tr>
                          {fileHeaders.map((header) => (
                            <th key={header} className="py-2.5 px-3 whitespace-nowrap">
                              {header}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {rawRows.slice(0, 3).map((row, idx) => (
                          <tr key={idx} className="hover:bg-slate-50">
                            {fileHeaders.map((h) => (
                              <td key={h} className="py-2 px-3 whitespace-nowrap text-slate-700">
                                {String(row[h] || '—')}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-4 border-t border-slate-200">
                  <button
                    onClick={() => setCurrentStep(1)}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg flex items-center gap-1.5"
                  >
                    <ArrowLeft size={14} />
                    <span>Back</span>
                  </button>
                  <button
                    onClick={() => setCurrentStep(3)}
                    className="px-5 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg flex items-center gap-1.5 shadow-2xs"
                  >
                    <span>Proceed to Field Mapping</span>
                    <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: Map Fields */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-xs font-bold text-slate-900">
                    Step 3: Map Spreadsheet Columns to CRM Fields
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Match each header from your uploaded file to the corresponding CRM attribute.
                    Select "Do Not Import" for columns you wish to ignore.
                  </p>
                </div>

                <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100">
                  <div className="grid grid-cols-12 bg-slate-50 p-3 text-xs font-semibold text-slate-600">
                    <div className="col-span-5">Uploaded File Column</div>
                    <div className="col-span-2 text-center">Sample Value</div>
                    <div className="col-span-5">CRM Target Field</div>
                  </div>

                  {fileHeaders.map((header) => {
                    const sampleValue = rawRows[0]?.[header];
                    const selectedField = columnMapping[header] || 'none';

                    return (
                      <div
                        key={header}
                        className="grid grid-cols-12 p-3 items-center gap-3 hover:bg-slate-50/50 text-xs"
                      >
                        <div className="col-span-5 font-bold text-slate-800 truncate">
                          {header}
                        </div>
                        <div className="col-span-2 text-center text-slate-500 font-mono text-[11px] truncate">
                          {sampleValue ? String(sampleValue) : '—'}
                        </div>
                        <div className="col-span-5">
                          <select
                            value={selectedField}
                            onChange={(e) =>
                              setColumnMapping((prev) => ({
                                ...prev,
                                [header]: e.target.value,
                              }))
                            }
                            className={`w-full text-xs rounded-lg px-3 py-1.5 border transition ${
                              selectedField !== 'none'
                                ? 'bg-indigo-50/40 border-indigo-300 text-indigo-900 font-semibold'
                                : 'bg-slate-50 border-slate-200 text-slate-500'
                            }`}
                          >
                            {CRM_FIELDS.map((field) => (
                              <option key={field.id} value={field.id}>
                                {field.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="flex justify-between items-center pt-4 border-t border-slate-200">
                  <button
                    onClick={() => setCurrentStep(2)}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg flex items-center gap-1.5"
                  >
                    <ArrowLeft size={14} />
                    <span>Back</span>
                  </button>
                  <button
                    onClick={() => setCurrentStep(4)}
                    className="px-5 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg flex items-center gap-1.5 shadow-2xs"
                  >
                    <span>Proceed to Validation</span>
                    <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 4: Validate */}
            {currentStep === 4 && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-xs font-bold text-slate-900">
                    Step 4: Data Validation & Quality Audit
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Inspecting email formats, phone numbers, required fields, and duplicate records.
                  </p>
                </div>

                {/* Validation Stats Cards */}
                <div className="grid grid-cols-4 gap-4">
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-[10px] uppercase font-bold text-slate-400">Total Rows</span>
                    <div className="text-2xl font-bold text-slate-900">
                      {validationSummary.totalCount}
                    </div>
                  </div>

                  <div className="p-4 bg-emerald-50/60 rounded-xl border border-emerald-200/80">
                    <span className="text-[10px] uppercase font-bold text-emerald-700">
                      Ready & Valid
                    </span>
                    <div className="text-2xl font-bold text-emerald-800">
                      {validationSummary.validCount}
                    </div>
                  </div>

                  <div className="p-4 bg-amber-50/60 rounded-xl border border-amber-200/80">
                    <span className="text-[10px] uppercase font-bold text-amber-700">
                      Potential Duplicates
                    </span>
                    <div className="text-2xl font-bold text-amber-800">
                      {validationSummary.potentialDuplicatesCount}
                    </div>
                  </div>

                  <div className="p-4 bg-rose-50/60 rounded-xl border border-rose-200/80">
                    <span className="text-[10px] uppercase font-bold text-rose-700">
                      Invalid / Malformed
                    </span>
                    <div className="text-2xl font-bold text-rose-800">
                      {validationSummary.invalidCount}
                    </div>
                  </div>
                </div>

                {/* Issues preview list */}
                {validationSummary.invalidCount > 0 && (
                  <div className="p-4 bg-rose-50 rounded-xl border border-rose-200 space-y-2">
                    <div className="text-xs font-bold text-rose-900 flex items-center gap-1.5">
                      <AlertTriangle size={15} className="text-rose-600" />
                      <span>{validationSummary.invalidCount} rows require attention</span>
                    </div>
                    <ul className="text-xs text-rose-800 space-y-1 list-disc pl-5">
                      {validationSummary.validatedRows
                        .filter((r) => !r.isValid)
                        .slice(0, 5)
                        .map((r) => (
                          <li key={r.rowIndex}>
                            Row #{r.rowIndex}: {r.errors.join(', ')}
                          </li>
                        ))}
                    </ul>
                  </div>
                )}

                <div className="flex justify-between items-center pt-4 border-t border-slate-200">
                  <button
                    onClick={() => setCurrentStep(3)}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg flex items-center gap-1.5"
                  >
                    <ArrowLeft size={14} />
                    <span>Back</span>
                  </button>
                  <button
                    onClick={() => setCurrentStep(5)}
                    className="px-5 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg flex items-center gap-1.5 shadow-2xs"
                  >
                    <span>Configure Duplicate Handling</span>
                    <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 5: Duplicate Handling Strategy (PRD Section 23) */}
            {currentStep === 5 && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-xs font-bold text-slate-900">
                    Step 5: Select Duplicate Handling Strategy
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    How should the CRM handle records whose email or phone match existing leads?
                  </p>
                </div>

                <div className="space-y-3">
                  {[
                    {
                      id: 'skip' as const,
                      title: 'Skip duplicates (Recommended)',
                      desc: 'Safely preserve existing database records and bypass rows that share an email or phone number.',
                      badge: 'Safest Default',
                    },
                    {
                      id: 'update' as const,
                      title: 'Update existing records with incoming data',
                      desc: 'Overwrites existing fields with the newer uploaded data, keeping historical activity logs intact.',
                      badge: 'Merge & Overwrite',
                    },
                    {
                      id: 'new' as const,
                      title: 'Import all records as new leads anyway',
                      desc: 'Creates a distinct new lead record regardless of existing matches.',
                      badge: 'May Create Clones',
                    },
                  ].map((option) => (
                    <label
                      key={option.id}
                      onClick={() => setDuplicateStrategy(option.id)}
                      className={`p-4 rounded-xl border flex items-start gap-4 cursor-pointer transition ${
                        duplicateStrategy === option.id
                          ? 'border-indigo-600 bg-indigo-50/30 ring-1 ring-indigo-600'
                          : 'border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="dupStrategy"
                        checked={duplicateStrategy === option.id}
                        onChange={() => setDuplicateStrategy(option.id)}
                        className="mt-1 text-indigo-600"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-900">{option.title}</span>
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                            {option.badge}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">{option.desc}</p>
                      </div>
                    </label>
                  ))}
                </div>

                <div className="flex justify-between items-center pt-4 border-t border-slate-200">
                  <button
                    onClick={() => setCurrentStep(4)}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg flex items-center gap-1.5"
                  >
                    <ArrowLeft size={14} />
                    <span>Back</span>
                  </button>
                  <button
                    onClick={() => setCurrentStep(6)}
                    className="px-5 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg flex items-center gap-1.5 shadow-2xs"
                  >
                    <span>Final Preview & Confirm</span>
                    <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 6: Preview & Execute Import */}
            {currentStep === 6 && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-xs font-bold text-slate-900">
                    Step 6: Final Review & Confirmation
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Review your mapped records before committing changes to the CRM database.
                  </p>
                </div>

                {importResult ? (
                  <div className="p-8 text-center bg-emerald-50 rounded-2xl border border-emerald-200 space-y-4">
                    <div className="w-14 h-14 rounded-full bg-emerald-600 text-white flex items-center justify-center mx-auto shadow-md">
                      <CheckCircle2 size={32} />
                    </div>
                    <div>
                      <h4 className="text-base font-bold text-emerald-950">
                        Import Completed Successfully!
                      </h4>
                      <p className="text-xs text-emerald-800 mt-1">
                        Processed {rawRows.length} rows from {fileName}
                      </p>
                    </div>

                    <div className="flex items-center justify-center gap-6 pt-2">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-emerald-900">
                          {importResult.imported}
                        </div>
                        <div className="text-xs text-emerald-700">New Leads Added</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-indigo-900">
                          {importResult.updated}
                        </div>
                        <div className="text-xs text-indigo-700">Existing Updated</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-slate-700">
                          {importResult.skipped}
                        </div>
                        <div className="text-xs text-slate-500">Duplicates Skipped</div>
                      </div>
                    </div>

                    <div className="pt-4 flex items-center justify-center gap-3">
                      <button
                        onClick={handleResetWorkflow}
                        className="px-4 py-2 text-xs font-semibold bg-white text-emerald-800 border border-emerald-300 rounded-lg hover:bg-emerald-100/60 shadow-2xs"
                      >
                        Start Another Import
                      </button>
                      <button
                        onClick={() => setActiveTab('history')}
                        className="px-4 py-2 text-xs font-semibold bg-emerald-800 text-white rounded-lg hover:bg-emerald-900 shadow-2xs"
                      >
                        View Import History Log
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Summary stats */}
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                      <div className="flex items-center gap-4 text-xs">
                        <span>
                          <strong>{validationSummary.validCount}</strong> valid rows ready
                        </span>
                        <span>·</span>
                        <span>
                          Strategy: <strong className="capitalize">{duplicateStrategy}</strong>
                        </span>
                        <span>·</span>
                        <span>
                          File: <strong>{fileName}</strong>
                        </span>
                      </div>
                    </div>

                    {/* Table Preview */}
                    <div className="overflow-x-auto border border-slate-200 rounded-xl max-h-72">
                      <table className="w-full text-left text-xs divide-y divide-slate-200">
                        <thead className="bg-slate-50 font-semibold text-slate-600 sticky top-0">
                          <tr>
                            <th className="py-2.5 px-3">#</th>
                            <th className="py-2.5 px-3">Lead Name</th>
                            <th className="py-2.5 px-3">Company</th>
                            <th className="py-2.5 px-3">Email</th>
                            <th className="py-2.5 px-3">Phone</th>
                            <th className="py-2.5 px-3">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {validationSummary.validatedRows.slice(0, 8).map((r) => (
                            <tr key={r.rowIndex} className="hover:bg-slate-50">
                              <td className="py-2 px-3 text-slate-400 font-mono text-[11px]">
                                {r.rowIndex}
                              </td>
                              <td className="py-2 px-3 font-semibold text-slate-800">
                                {r.leadObj.fullName || r.leadObj.firstName || '—'}
                              </td>
                              <td className="py-2 px-3 text-slate-600">
                                {r.leadObj.company || '—'}
                              </td>
                              <td className="py-2 px-3 text-slate-600">
                                {r.leadObj.email || '—'}
                              </td>
                              <td className="py-2 px-3 text-slate-600">
                                {r.leadObj.phone || '—'}
                              </td>
                              <td className="py-2 px-3">
                                {r.isDuplicate ? (
                                  <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded">
                                    Duplicate
                                  </span>
                                ) : r.isValid ? (
                                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded">
                                    Valid
                                  </span>
                                ) : (
                                  <span className="text-[10px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-1.5 py-0.5 rounded">
                                    Invalid
                                  </span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div className="flex justify-between items-center pt-4 border-t border-slate-200">
                      <button
                        onClick={() => setCurrentStep(5)}
                        className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg flex items-center gap-1.5"
                      >
                        <ArrowLeft size={14} />
                        <span>Back</span>
                      </button>
                      <button
                        onClick={handleExecuteImport}
                        className="px-6 py-2.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg flex items-center gap-1.5 shadow-md active:scale-95 transition"
                      >
                        <CheckCircle2 size={16} />
                        <span>Confirm & Execute Import Now</span>
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
