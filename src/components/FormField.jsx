import React from 'react';

export function Field({ label, required, value, onChange, type = 'text', placeholder, inputMode }) {
  return (
    <label>
      <span>{label}{required && ' *'}</span>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        inputMode={inputMode}
        required={required}
      />
    </label>
  );
}

export function SelectField({ label, required, value, onChange, options }) {
  return (
    <label>
      <span>{label}{required && ' *'}</span>
      <select value={value} onChange={e => onChange(e.target.value)} required={required}>
        <option value="">Select</option>
        {options.map(option => <option key={option} value={option}>{option}</option>)}
      </select>
    </label>
  );
}

export function Upload({ label, required, file, setFile, accept, preview = false }) {
  const previewUrl = preview && file && file.type?.startsWith('image/')
    ? URL.createObjectURL(file)
    : '';

  return (
    <label className="upload">
      <span>{label}{required && ' *'}</span>
      <input
        type="file"
        accept={accept || 'image/jpeg,image/png,image/webp,application/pdf'}
        required={required}
        onChange={e => setFile(e.target.files?.[0] || null)}
      />
      {previewUrl && <img className="upload-preview" src={previewUrl} alt="Selected preview" />}
      {file && <small>{file.name} · {(file.size / 1024 / 1024).toFixed(2)} MB</small>}
      <small>Images: max 5 MB · Aadhaar PDF: max 10 MB</small>
    </label>
  );
}
