import React, { useState, useEffect } from 'react';
import { previewBulkUpload, confirmBulkUpload } from '../services/bulkUploadService';
import { UploadCloud, CheckCircle, AlertTriangle, FileText } from 'lucide-react';

const BulkUploadWorkspace: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    // Component mounted
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setPreview(null);
      setSuccess(false);
    }
  };

  const handlePreview = async () => {
    if (!file) return;
    try {
      setLoading(true);
      const formData = new FormData();
      formData.append('file', file);
      const data = await previewBulkUpload(formData);
      setPreview(data);
    } catch (error) {
      console.error('Failed to preview', error);
      alert('Error previewing file. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    try {
      setLoading(true);
      await confirmBulkUpload('temp-batch-id');
      setSuccess(true);
      setPreview(null);
      setFile(null);
    } catch (error) {
      console.error('Failed to confirm upload', error);
      alert('Upload confirmation failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-serif font-bold text-brand-navy">Bulk Upload Workspace</h1>
      </div>

      {success && (
        <div className="p-4 bg-green-50 text-green-800 rounded-md flex items-center">
          <CheckCircle className="w-5 h-5 mr-2" />
          Bulk upload completed successfully! The records have been imported.
        </div>
      )}

      <div className="bg-white shadow rounded-lg p-6">
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-10 text-center flex flex-col items-center justify-center">
          <UploadCloud className="w-12 h-12 text-gray-400 mb-4" />
          <p className="text-gray-600 mb-2">Drag and drop your Excel or CSV file here</p>
          <p className="text-sm text-gray-400 mb-4">Supported formats: .xlsx, .csv</p>
          
          <input
            type="file"
            id="file-upload"
            className="hidden"
            accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
            onChange={handleFileChange}
          />
          <label
            htmlFor="file-upload"
            className="px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 cursor-pointer"
          >
            Select File
          </label>
        </div>

        {file && !preview && (
          <div className="mt-6 flex items-center justify-between p-4 bg-gray-50 rounded-md border border-gray-200">
            <div className="flex items-center">
              <FileText className="w-5 h-5 text-gray-400 mr-2" />
              <span className="text-sm font-medium text-gray-700">{file.name}</span>
            </div>
            <button
              onClick={handlePreview}
              disabled={loading}
              className="px-4 py-2 bg-brand-navy text-white rounded-md text-sm font-medium hover:bg-[#111e2e] disabled:opacity-50"
            >
              {loading ? 'Processing...' : 'Analyze & Preview'}
            </button>
          </div>
        )}

        {preview && (
          <div className="mt-8 space-y-6">
            <h2 className="text-lg font-medium text-gray-900 border-b pb-2">Analysis Results</h2>
            
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-gray-50 p-4 rounded-md">
                <p className="text-sm text-gray-500">Total Rows</p>
                <p className="text-2xl font-serif font-bold text-brand-navy">{preview.totalRows}</p>
              </div>
              <div className="bg-green-50 p-4 rounded-md">
                <p className="text-sm text-green-600">Valid Rows</p>
                <p className="text-2xl font-serif font-bold text-green-700">{preview.validRows}</p>
              </div>
              <div className="bg-red-50 p-4 rounded-md">
                <p className="text-sm text-red-600">Errors</p>
                <p className="text-2xl font-serif font-bold text-red-700">{preview.errorRows}</p>
              </div>
            </div>

            {preview.errors && preview.errors.length > 0 && (
              <div className="bg-white border border-red-200 rounded-md overflow-hidden">
                <div className="bg-red-50 px-4 py-3 border-b border-red-200 flex items-center">
                  <AlertTriangle className="w-5 h-5 text-red-500 mr-2" />
                  <span className="text-sm font-medium text-red-800">Validation Issues</span>
                </div>
                <ul className="divide-y divide-gray-200">
                  {preview.errors.map((err: any, idx: number) => (
                    <li key={idx} className="px-4 py-3 text-sm text-gray-700 flex">
                      <span className="font-medium mr-2">Row {err.row}:</span> {err.message}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex justify-end space-x-4 pt-4 border-t">
              <button
                onClick={() => setPreview(null)}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                disabled={loading || preview.errorRows > 0}
                className="px-4 py-2 bg-brand-navy text-white rounded-md text-sm font-medium hover:bg-[#111e2e] disabled:opacity-50"
              >
                {loading ? 'Importing...' : 'Confirm Import'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BulkUploadWorkspace;
