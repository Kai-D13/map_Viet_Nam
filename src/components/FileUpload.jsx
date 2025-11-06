import { useState } from 'react';
import * as XLSX from 'xlsx';

function FileUpload({ onDataLoaded }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [fileName, setFileName] = useState(null);

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      setError('Please upload an Excel file (.xlsx or .xls)');
      return;
    }

    setUploading(true);
    setError(null);
    setFileName(file.name);

    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });

        // Get first sheet
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];

        // Convert to JSON
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        console.log('Parsed Excel data:', jsonData.length, 'rows');
        console.log('Sample row:', jsonData[0]);

        // Validate required columns (case-insensitive, trim whitespace)
        const requiredColumns = [
          'reference_code',
          'fc_code',
          'total_packages',
          'delivery_amount',
          'province_name',
          'district_name'
        ];

        const firstRow = jsonData[0] || {};

        // Get actual column names (normalized)
        const actualColumns = Object.keys(firstRow).map(col =>
          col.toString().trim().toLowerCase()
        );

        console.log('Actual columns:', actualColumns);

        // Check for missing columns
        const missingColumns = requiredColumns.filter(col =>
          !actualColumns.includes(col.toLowerCase())
        );

        if (missingColumns.length > 0) {
          throw new Error(`Missing required columns: ${missingColumns.join(', ')}\n\nFound columns: ${Object.keys(firstRow).join(', ')}`);
        }

        // Pass data to parent
        onDataLoaded(jsonData, file.name);
        setUploading(false);
      } catch (err) {
        console.error('Error parsing Excel:', err);
        setError(err.message || 'Failed to parse Excel file');
        setUploading(false);
      }
    };

    reader.onerror = () => {
      setError('Failed to read file');
      setUploading(false);
    };

    reader.readAsArrayBuffer(file);
  };

  return (
    <div style={{
      padding: '30px',
      backgroundColor: '#f9fafb',
      borderRadius: '12px',
      border: '2px dashed #d1d5db',
      textAlign: 'center',
      maxWidth: '600px',
      margin: '0 auto'
    }}>
      <div style={{ fontSize: '48px', marginBottom: '15px' }}>📊</div>
      
      <h3 style={{ margin: '0 0 10px 0', color: '#1f2937', fontSize: '20px' }}>
        Upload Logistics Data
      </h3>
      
      <p style={{ margin: '0 0 20px 0', color: '#6b7280', fontSize: '14px' }}>
        Upload Excel file (.xlsx) with logistics data to analyze
      </p>

      <input
        type="file"
        accept=".xlsx,.xls"
        onChange={handleFileUpload}
        disabled={uploading}
        style={{ display: 'none' }}
        id="file-upload"
      />

      <label
        htmlFor="file-upload"
        style={{
          display: 'inline-block',
          padding: '12px 24px',
          backgroundColor: uploading ? '#9ca3af' : '#4264fb',
          color: 'white',
          borderRadius: '8px',
          cursor: uploading ? 'not-allowed' : 'pointer',
          fontSize: '16px',
          fontWeight: 'bold',
          transition: 'all 0.3s',
          border: 'none'
        }}
      >
        {uploading ? '⏳ Processing...' : '📁 Choose Excel File'}
      </label>

      {fileName && !error && (
        <div style={{
          marginTop: '15px',
          padding: '10px',
          backgroundColor: '#d1fae5',
          borderRadius: '6px',
          color: '#065f46',
          fontSize: '14px'
        }}>
          ✅ Loaded: {fileName}
        </div>
      )}

      {error && (
        <div style={{
          marginTop: '15px',
          padding: '10px',
          backgroundColor: '#fee2e2',
          borderRadius: '6px',
          color: '#991b1b',
          fontSize: '14px'
        }}>
          ❌ {error}
        </div>
      )}

      <div style={{
        marginTop: '20px',
        padding: '15px',
        backgroundColor: '#eff6ff',
        borderRadius: '8px',
        textAlign: 'left'
      }}>
        <div style={{ fontSize: '12px', color: '#1e40af', fontWeight: 'bold', marginBottom: '8px' }}>
          📋 Required Columns:
        </div>
        <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '12px', color: '#3b82f6' }}>
          <li>reference_code</li>
          <li>fc_code (BD, BN, etc.)</li>
          <li>total_packages</li>
          <li>delivery_amount</li>
          <li>province_name</li>
          <li>district_name</li>
        </ul>
      </div>
    </div>
  );
}

export default FileUpload;

