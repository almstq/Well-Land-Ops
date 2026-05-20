import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const BRAND = {
  blue: [11, 87, 208],
  navy: [15, 23, 42],
  teal: [15, 118, 110],
  slate: [71, 85, 105],
  light: [241, 245, 249],
  border: [203, 213, 225],
  danger: [220, 38, 38],
  warning: [217, 119, 6],
};

const DOC_TITLES = {
  'Purchase Request': 'PURCHASE REQUEST',
  RFQ: 'REQUEST FOR QUOTATION',
  'Purchase Order': 'PURCHASE ORDER',
  GRN: 'GOODS RECEIVED NOTE',
  'Transfer Note': 'TRANSFER NOTE',
  'General Report': 'OPERATIONS REPORT',
  'Fleet Deployment Report': 'FLEET DEPLOYMENT REPORT',
};

function value(data, keys, fallback = '-') {
  for (const key of keys) {
    const next = data?.[key];
    if (next !== undefined && next !== null && String(next).trim() !== '') return next;
  }
  return fallback;
}

function money(amount, currency = 'MVR') {
  const num = Number(amount);
  if (!Number.isFinite(num)) return '-';
  return `${currency} ${num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function cleanFileName(text) {
  return String(text || 'document').replace(/[^\w.-]+/g, '_').replace(/^_+|_+$/g, '');
}

function addHeader(doc, type, data) {
  const title = DOC_TITLES[type] || `${type}`.toUpperCase();
  const ref = value(data, ['PR Ref', 'id', 'Ref'], 'DRAFT');
  const pageWidth = doc.internal.pageSize.width;

  doc.setFillColor(...BRAND.navy);
  doc.rect(0, 0, pageWidth, 34, 'F');
  doc.setFillColor(...BRAND.blue);
  doc.rect(0, 0, 7, 34, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.text('WELL LAND OPERATIONS', 14, 14);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('Antrac Holding Group | Local Operations Command Center', 14, 21);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text(title, pageWidth - 14, 14, { align: 'right' });
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Ref: ${ref}`, pageWidth - 14, 22, { align: 'right' });
  doc.text(`Generated: ${new Date().toLocaleString()}`, pageWidth - 14, 28, { align: 'right' });

  return 44;
}

function addStatusStrip(doc, data, startY) {
  const urgency = String(value(data, ['Urgency', 'priority'], 'NORMAL')).toUpperCase();
  const status = value(data, ['Status', 'status'], 'Draft');
  const site = value(data, ['Site / Location', 'location', 'destination', 'Site'], '-');
  const asset = value(data, ['Asset ID', 'assetId', 'Asset / Vessel ID'], '-');

  doc.setFillColor(...BRAND.light);
  doc.setDrawColor(...BRAND.border);
  doc.roundedRect(14, startY, 182, 18, 2, 2, 'FD');

  const cells = [
    ['Urgency', urgency],
    ['Status', status],
    ['Site', site],
    ['Asset', asset],
  ];

  cells.forEach(([label, val], index) => {
    const x = 20 + index * 44;
    doc.setFontSize(7);
    doc.setTextColor(...BRAND.slate);
    doc.setFont('helvetica', 'bold');
    doc.text(label.toUpperCase(), x, startY + 6);
    doc.setFontSize(9);
    doc.setTextColor(urgency === 'CRITICAL' && label === 'Urgency' ? BRAND.danger[0] : BRAND.navy[0], urgency === 'CRITICAL' && label === 'Urgency' ? BRAND.danger[1] : BRAND.navy[1], urgency === 'CRITICAL' && label === 'Urgency' ? BRAND.danger[2] : BRAND.navy[2]);
    doc.text(String(val).slice(0, 26), x, startY + 13);
  });

  return startY + 27;
}

function buildPrSummary(data) {
  return [
    ['Request Date', value(data, ['Request Date'])],
    ['Requested By', value(data, ['Requested By', 'reportedBy'])],
    ['Request Source', value(data, ['Request Source', 'Issue Ref'], 'Direct')],
    ['Request Channel', value(data, ['Request Channel'])],
    ['Purpose / Machine Use', value(data, ['Purpose / Machine Use', 'purpose'])],
    ['Selected Vendor', value(data, ['Selected Vendor', 'vendor'])],
    ['Payment Status', value(data, ['Payment Status'])],
    ['Collection Status', value(data, ['Collection Status'])],
    ['Delivery Status', value(data, ['Delivery Status'])],
  ].filter(([, val]) => val !== '-');
}

function buildSpecRows(data) {
  const qty = value(data, ['Quantity', 'qty'], '1');
  const unit = value(data, ['Unit', 'unit'], 'pcs');
  return [
    ['Item / Service Requested', value(data, ['Item / Service Requested', 'item'])],
    ['Part Number / OEM Code', value(data, ['Part Number', 'partNumber'])],
    ['OEM Required', value(data, ['OEM Required'], 'Not specified')],
    ['Exact Specification', value(data, ['Exact Specification', 'Specs Needed', 'Standard Specs', 'notes'])],
    ['Quantity', `${qty} ${unit}`],
    ['Estimated Unit Price', money(value(data, ['Estimated Unit Price', 'Selected Price', 'unitPrice'], NaN), value(data, ['Currency', 'currency'], 'MVR'))],
    ['Expected Lead Time', value(data, ['Lead Time'])],
    ['Notes', value(data, ['Specs Notes', 'Notes', 'notes'])],
  ].filter(([, val]) => val !== '-');
}

function addSectionTitle(doc, title, y) {
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...BRAND.navy);
  doc.text(title, 14, y);
  doc.setDrawColor(...BRAND.blue);
  doc.line(14, y + 2, 196, y + 2);
  return y + 7;
}

function addKeyValueTable(doc, title, rows, startY) {
  const y = addSectionTitle(doc, title, startY);
  autoTable(doc, {
    startY: y,
    head: [['Field', 'Details']],
    body: rows,
    theme: 'grid',
    styles: { fontSize: 8.5, cellPadding: 2.5, valign: 'top', lineColor: BRAND.border, lineWidth: 0.1 },
    headStyles: { fillColor: BRAND.navy, textColor: [255, 255, 255], fontStyle: 'bold' },
    columnStyles: { 0: { cellWidth: 46, fontStyle: 'bold', textColor: BRAND.slate }, 1: { cellWidth: 136 } },
  });
  return doc.lastAutoTable.finalY + 8;
}

function addCommercialTable(doc, type, data, startY) {
  if (!['RFQ', 'Purchase Order', 'GRN'].includes(type)) return startY;

  const qty = Number(value(data, ['Quantity', 'qty'], 1)) || 1;
  const unitPrice = Number(value(data, ['Estimated Unit Price', 'Selected Price', 'unitPrice'], 0)) || 0;
  const currency = value(data, ['Currency', 'currency'], 'MVR');
  const subtotal = qty * unitPrice;

  const rows = [[
    value(data, ['Item / Service Requested', 'item']),
    value(data, ['Part Number', 'partNumber']),
    value(data, ['Exact Specification', 'Specs Needed', 'notes']),
    `${qty} ${value(data, ['Unit', 'unit'], 'pcs')}`,
    unitPrice ? money(unitPrice, currency) : type === 'RFQ' ? 'Supplier to quote' : '-',
    unitPrice ? money(subtotal, currency) : '-',
  ]];

  const y = addSectionTitle(doc, type === 'RFQ' ? 'RFQ Line Item - Supplier To Quote' : 'Commercial Line Item', startY);
  autoTable(doc, {
    startY: y,
    head: [['Item', 'Part No.', 'Specification', 'Qty', 'Unit Price', 'Line Total']],
    body: rows,
    theme: 'grid',
    styles: { fontSize: 8, cellPadding: 2.2, valign: 'top', lineColor: BRAND.border, lineWidth: 0.1 },
    headStyles: { fillColor: BRAND.teal, textColor: [255, 255, 255] },
    columnStyles: {
      0: { cellWidth: 32 },
      1: { cellWidth: 25 },
      2: { cellWidth: 61 },
      3: { cellWidth: 18, halign: 'right' },
      4: { cellWidth: 23, halign: 'right' },
      5: { cellWidth: 23, halign: 'right' },
    },
  });

  let nextY = doc.lastAutoTable.finalY + 6;
  if (type === 'Purchase Order' && unitPrice) {
    autoTable(doc, {
      startY: nextY,
      body: [
        ['Subtotal', money(subtotal, currency)],
        ['Tax / Freight', value(data, ['Tax / Freight'], 'As invoiced')],
        ['Total Payable', money(subtotal, currency)],
      ],
      theme: 'plain',
      styles: { fontSize: 9, cellPadding: 1.8 },
      columnStyles: { 0: { cellWidth: 145, halign: 'right', fontStyle: 'bold' }, 1: { cellWidth: 37, halign: 'right', fontStyle: 'bold' } },
      margin: { left: 14, right: 14 },
    });
    nextY = doc.lastAutoTable.finalY + 8;
  }
  return nextY;
}

function addInstructions(doc, type, startY) {
  const instructions = {
    'Purchase Request': [
      'PR must be technically verified before RFQ or purchase.',
      'OEM requirement and part number must be confirmed for machine-critical components.',
      'Attach site photos, operator notes, and issue reference where applicable.',
    ],
    RFQ: [
      'Supplier must quote exact specification, brand, origin, lead time, warranty, and delivery terms.',
      'Any deviation from requested OEM / specification must be clearly highlighted.',
      'Quote validity, payment terms, and availability must be stated.',
    ],
    'Purchase Order': [
      'Supplier shall deliver only the item and specification approved in this PO.',
      'Invoice, delivery note, and warranty documents must reference this PO number.',
      'Payment is subject to verification of goods, documents, and receiving approval.',
    ],
    GRN: [
      'Receiver must verify quantity, visible condition, part number, and site destination before signing.',
      'Shortage, damage, or specification mismatch must be noted before acceptance.',
    ],
    'Transfer Note': [
      'Source custodian releases stock; destination custodian must acknowledge receipt.',
      'Any shortage or damage in transit must be reported immediately.',
    ],
  };
  const rows = (instructions[type] || []).map((item, index) => [`${index + 1}`, item]);
  if (!rows.length) return startY;
  return addKeyValueTable(doc, 'Controls And Acceptance Notes', rows, startY);
}

function addSignatureBlocks(doc, type, startY) {
  const pageHeight = doc.internal.pageSize.height;
  let y = Math.max(startY + 6, pageHeight - 58);
  if (y > pageHeight - 40) {
    doc.addPage();
    y = 40;
  }

  const blocks = type === 'RFQ'
    ? ['Prepared By', 'Checked By', 'Supplier Acknowledgement']
    : type === 'GRN'
      ? ['Received By', 'Inspected By', 'Store / Site In Charge']
      : type === 'Transfer Note'
        ? ['Released By', 'Transported By', 'Received By']
        : ['Prepared By', 'Approved By', 'Accounts / Supplier'];

  doc.setDrawColor(...BRAND.border);
  blocks.forEach((label, index) => {
    const x = 14 + index * 61;
    doc.line(x, y + 22, x + 48, y + 22);
    doc.setFontSize(8);
    doc.setTextColor(...BRAND.slate);
    doc.text(label, x, y + 28);
    doc.text('Name / Signature / Date', x, y + 33);
  });
}

function addFooter(doc) {
  const total = doc.internal.getNumberOfPages();
  for (let i = 1; i <= total; i += 1) {
    doc.setPage(i);
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    doc.setDrawColor(...BRAND.border);
    doc.line(14, pageHeight - 14, pageWidth - 14, pageHeight - 14);
    doc.setFontSize(7.5);
    doc.setTextColor(...BRAND.slate);
    doc.text('WL Ops Command Center | Controlled procurement and logistics document', 14, pageHeight - 8);
    doc.text(`Page ${i} of ${total}`, pageWidth - 14, pageHeight - 8, { align: 'right' });
  }
}

function generateProcurementPDF(type, data) {
  const doc = new jsPDF();
  let y = addHeader(doc, type, data);
  y = addStatusStrip(doc, data, y);
  y = addKeyValueTable(doc, 'Request And Traceability', buildPrSummary(data), y);
  y = addKeyValueTable(doc, 'Technical Specification Carried From PR', buildSpecRows(data), y);
  y = addCommercialTable(doc, type, data, y);

  if (type === 'GRN') {
    y = addKeyValueTable(doc, 'Receiving Verification', [
      ['Received Condition', value(data, ['Received Condition'], 'To be inspected at receiving')],
      ['Quantity Accepted', `${value(data, ['Quantity', 'qty'], '1')} ${value(data, ['Unit', 'unit'], 'pcs')}`],
      ['Linked PR / PO', `${value(data, ['PR Ref'])} / ${value(data, ['PO No.'])}`],
      ['Storage Destination', value(data, ['Site / Location', 'destination'])],
    ], y);
  }

  y = addInstructions(doc, type, y);
  addSignatureBlocks(doc, type, y);
  addFooter(doc);

  const safeRef = cleanFileName(value(data, ['PR Ref', 'id', 'Ref'], 'draft'));
  doc.save(`WL_${cleanFileName(type)}_${safeRef}.pdf`);
}

function generateReportPDF(type, meta) {
  const doc = new jsPDF();
  let y = addHeader(doc, type, {});
  y = addSectionTitle(doc, type, y);
  autoTable(doc, {
    startY: y,
    head: meta.headers || [['Metric', 'Value']],
    body: meta.rows || [],
    theme: 'grid',
    styles: { fontSize: 8.5, cellPadding: 2.5 },
    headStyles: { fillColor: BRAND.teal, textColor: [255, 255, 255] },
  });
  addFooter(doc);
  doc.save(`WL_${cleanFileName(type)}.pdf`);
}

export const generatePDF = (type, data = {}, meta = {}) => {
  if (['Purchase Request', 'RFQ', 'Purchase Order', 'GRN', 'Transfer Note'].includes(type)) {
    generateProcurementPDF(type, data);
    return;
  }
  generateReportPDF(type, meta);
};
