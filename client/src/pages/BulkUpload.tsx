import React, { useState } from 'react';
import { UploadCloud, FileSpreadsheet, AlertTriangle } from 'lucide-react';

const BulkUpload: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-serif font-semibold text-brand-navy">Bulk Upload</h1>
        <p className="mt-1 text-sm text-gray-500">Import large sets of ESG records via CSV or XLSX.</p>
      </div>

      <div className="card p-8 text-center space-y-6">
        <div className="mx-auto w-16 h-16 bg-brand-blush rounded-full flex items-center justify-center">
          <UploadCloud className="h-8 w-8 text-brand-navy" />
        </div>
        
        <div>
          <h2 className="text-lg font-medium text-gray-900">Upload your data template</h2>
          <p className="text-sm text-gray-500 mt-1 max-w-sm mx-auto">
            Drag and drop your filled CSV or Excel template here, or click to browse files.
          </p>
        </div>

        <div className="relative">
          <input 
            type="file" 
            accept=".csv, .xlsx, .xls"
            onChange={handleFileChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
          <div className={`border-2 border-dashed rounded-lg p-8 transition-colors ${file ? 'border-primary-400 bg-brand-blush' : 'border-gray-300 hover:border-gray-400 bg-gray-50'}`}>
            {file ? (
              <div className="flex flex-col items-center">
                <FileSpreadsheet className="h-10 w-10 text-brand-coral mb-3" />
                <p className="text-sm font-medium text-gray-900">{file.name}</p>
                <p className="text-xs text-gray-500 mt-1">{(file.size / 1024).toFixed(1)} KB</p>
              </div>
            ) : (
              <p className="text-sm text-gray-600">Select a file to begin parsing</p>
            )}
          </div>
        </div>

        {file && (
          <div className="flex justify-center">
            <button className="btn-primary w-full sm:w-auto px-8">Parse & Validate</button>
          </div>
        )}
      </div>

      <div className="bg-brand-blush p-4 rounded-lg flex items-start gap-3 border border-brand-pink">
        <AlertTriangle className="h-5 w-5 text-brand-coral flex-shrink-0 mt-0.5" />
        <div>
          <h3 className="text-sm font-medium text-brand-charcoal">Important Note</h3>
          <p className="text-sm text-brand-navy mt-1">
            Bulk upload currently supports Data Entry (Draft) creation. Validated records must still go through the standard submission and review workflow to ensure data integrity and evidence verification.
          </p>
        </div>
      </div>
    </div>
  );
};

export default BulkUpload;
