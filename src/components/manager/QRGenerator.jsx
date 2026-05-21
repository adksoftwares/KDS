import React, { useState, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { QrCode, Download } from 'lucide-react';

const QRGenerator = () => {
  const [tableId, setTableId]     = useState('');
  const [generatedUrl, setGenUrl] = useState('');
  const qrRef = useRef(null);

  const handleGenerate = (e) => {
    e.preventDefault();
    if (!tableId.trim()) return;
    const sanitized = tableId.trim().toLowerCase().replace(/\s+/g, '_');
    setGenUrl(`${window.location.origin}/customer/${sanitized}`);
  };

  const downloadQR = () => {
    const svg     = qrRef.current?.querySelector('svg');
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas  = document.createElement('canvas');
    const ctx     = canvas.getContext('2d');
    const img     = new Image();
    img.onload = () => {
      canvas.width  = img.width  * 2;
      canvas.height = img.height * 2;
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const link    = document.createElement('a');
      link.download = `Table_${tableId}_QR.png`;
      link.href     = canvas.toDataURL('image/png');
      link.click();
    };
    img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
  };

  return (
    <div className="qr-generator-card card">
      <div className="card-header">
        <h4>QR Code Engine</h4>
      </div>

      <div className="qr-gen-layout">
        {/* Form */}
        <form className="qr-gen-form" onSubmit={handleGenerate}>
          <p className="text-secondary" style={{ fontSize: '0.88rem', lineHeight: 1.6 }}>
            Generate a unique QR code for each table. Customers scan it to instantly access the ordering page — no app install required.
          </p>

          <div>
            <label htmlFor="table-id-input">Table Number / Identifier</label>
            <input
              id="table-id-input"
              className="input"
              type="text"
              placeholder="e.g. 1, patio_4, bar_2"
              value={tableId}
              onChange={e => setTableId(e.target.value)}
              required
            />
          </div>

          <button id="generate-qr-btn" type="submit" className="btn btn-primary">
            <QrCode size={16} /> Generate QR Code
          </button>
        </form>

        {/* Preview */}
        <div className="qr-preview">
          {generatedUrl ? (
            <>
              <div className="qr-white-card" ref={qrRef}>
                <QRCodeSVG value={generatedUrl} size={180} level="H" includeMargin />
                <div className="qr-table-label">Table {tableId.toUpperCase()}</div>
              </div>
              <p className="qr-url">{generatedUrl}</p>
              <button id="download-qr-btn" className="btn btn-ghost btn-sm mt-3" onClick={downloadQR}>
                <Download size={15} /> Download High-Res PNG
              </button>
            </>
          ) : (
            <>
              <QrCode size={52} strokeWidth={1} />
              <p style={{ fontSize: '0.85rem' }}>Your QR code will appear here</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default QRGenerator;
