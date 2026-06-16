import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Document, TextRun, Table, TableRow, TableCell, Paragraph, HeadingLevel, AlignmentType, BorderStyle, WidthType, ShadingType, Header, Footer, PageNumber } from 'docx';
import { saveAs } from 'file-saver';

const SCHOOL_NAME = 'EduManage High School';
const SCHOOL_ADDRESS = 'Windhoek, Namibia | Tel: +264 61 000 0000 | info@edumanage.edu.na';
const ACCENT = [29, 111, 235];
const DARK = [2, 4, 8];

const getGradeSymbol = (pct) => {
  if (pct >= 80) return { symbol: 'A', label: 'Distinction', color: [0, 200, 150] };
  if (pct >= 70) return { symbol: 'B', label: 'Merit', color: [41, 121, 255] };
  if (pct >= 60) return { symbol: 'C', label: 'Satisfactory', color: [100, 180, 255] };
  if (pct >= 50) return { symbol: 'D', label: 'Pass', color: [255, 170, 0] };
  if (pct >= 40) return { symbol: 'E', label: 'At Risk', color: [255, 107, 53] };
  return { symbol: 'F', label: 'Fail', color: [255, 71, 87] };
};

// ─── EXCEL EXPORT ────────────────────────────────────────────────────────────
export const exportToExcel = (subjectName, gradeLevel, teacherName, learners, grades, caResults) => {
  const wb = XLSX.utils.book_new();

  // ── Sheet 1: Grade Report
  const headerRows = [
    [SCHOOL_NAME],
    [SCHOOL_ADDRESS],
    [''],
    ['SUBJECT GRADE REPORT'],
    [`Subject: ${subjectName}`, '', `Grade Level: ${gradeLevel}`],
    [`Teacher: ${teacherName}`, '', `Date: ${new Date().toLocaleDateString('en-ZA')}`],
    [`Academic Year: ${new Date().getFullYear()}`, '', `Total Learners: ${learners.length}`],
    [''],
  ];

  const assessmentNames = [...new Set(grades.map(g => g.assessment_name))];
  const tableHeader = ['No.', 'Student Name', 'Student No.', ...assessmentNames, 'Total', 'Average %', 'Symbol', 'Remarks'];

  const tableRows = learners.map((learner, idx) => {
    const lg = grades.filter(g => g.learner_id === learner.id);
    const assessScores = assessmentNames.map(name => {
      const g = lg.find(x => x.assessment_name === name);
      return g ? `${g.marks_obtained}/${g.total_marks}` : '-';
    });
    const avg = lg.length > 0 ? (lg.reduce((s, g) => s + parseFloat(g.percentage), 0) / lg.length) : 0;
    const { symbol, label } = getGradeSymbol(avg);
    const ca = caResults?.find(c => c.learner_id === learner.id);
    return [idx + 1, learner.full_name, learner.student_number, ...assessScores, ca?.total || '-', avg.toFixed(1) + '%', symbol, label];
  });

  const wsData = [...headerRows, tableHeader, ...tableRows];
  const ws = XLSX.utils.aoa_to_sheet(wsData);

  // Column widths
  ws['!cols'] = [{ wch: 5 }, { wch: 28 }, { wch: 15 }, ...assessmentNames.map(() => ({ wch: 14 })), { wch: 10 }, { wch: 12 }, { wch: 10 }, { wch: 16 }];

  // Merge school name across columns
  ws['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: tableHeader.length - 1 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: tableHeader.length - 1 } },
    { s: { r: 3, c: 0 }, e: { r: 3, c: tableHeader.length - 1 } },
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'Grade Report');

  // ── Sheet 2: CA Summary
  if (caResults && caResults.length > 0) {
    const caHeader = [SCHOOL_NAME, '', ''];
    const caTitle = ['CONTINUOUS ASSESSMENT SUMMARY', '', ''];
    const caSubject = [`Subject: ${subjectName}`, '', `Teacher: ${teacherName}`];
    const caDate = [`Date Generated: ${new Date().toLocaleDateString('en-ZA')}`, '', ''];
    const blank = ['', '', ''];
    const caTableHeader = ['Learner Name', 'CA Score', 'Final Mark', 'Symbol', 'Status'];

    const caRows = caResults.map(c => {
      const { symbol, label } = getGradeSymbol(parseFloat(c.final_mark || c.ca_percentage || 0));
      return [
        c.learner_name,
        c.ca_percentage ? c.ca_percentage + '%' : '-',
        c.final_mark ? c.final_mark + '%' : '-',
        symbol,
        parseFloat(c.final_mark || 0) >= 50 ? 'PASS' : 'FAIL'
      ];
    });

    const caData = [caHeader, caTitle, caSubject, caDate, blank, caTableHeader, ...caRows];
    const ws2 = XLSX.utils.aoa_to_sheet(caData);
    ws2['!cols'] = [{ wch: 28 }, { wch: 14 }, { wch: 14 }, { wch: 10 }, { wch: 10 }];
    XLSX.utils.book_append_sheet(wb, ws2, 'CA Summary');
  }

  const filename = `${subjectName.replace(/\s+/g, '_')}_Grade_Report_${new Date().getFullYear()}.xlsx`;
  XLSX.writeFile(wb, filename);
};

// ─── PDF EXPORT ───────────────────────────────────────────────────────────────
export const exportToPDF = (subjectName, gradeLevel, teacherName, learners, grades, caResults) => {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();

  const addHeader = () => {
    // Top banner
    doc.setFillColor(...ACCENT);
    doc.rect(0, 0, pageW, 22, 'F');

    // School name
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(SCHOOL_NAME, 14, 10);

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(SCHOOL_ADDRESS, 14, 16);

    // Date top right
    doc.setFontSize(9);
    doc.text(new Date().toLocaleDateString('en-ZA'), pageW - 14, 10, { align: 'right' });
    doc.text('GRADE REPORT', pageW - 14, 16, { align: 'right' });

    // Info bar
    doc.setFillColor(8, 13, 20);
    doc.rect(0, 22, pageW, 14, 'F');
    doc.setTextColor(122, 154, 191);
    doc.setFontSize(9);
    doc.text(`Subject: `, 14, 30);
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.text(subjectName, 38, 30);

    doc.setTextColor(122, 154, 191);
    doc.setFont('helvetica', 'normal');
    doc.text(`Grade Level: `, pageW / 2 - 20, 30);
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.text(gradeLevel, pageW / 2 + 14, 30);

    doc.setTextColor(122, 154, 191);
    doc.setFont('helvetica', 'normal');
    doc.text(`Teacher: `, pageW - 80, 30);
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.text(teacherName, pageW - 60, 30);
  };

  const addFooter = (pageNum, totalPages) => {
    doc.setFillColor(8, 13, 20);
    doc.rect(0, pageH - 10, pageW, 10, 'F');
    doc.setTextColor(61, 90, 122);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(`Generated by EduManage School System — ${new Date().toLocaleString('en-ZA')}`, 14, pageH - 3);
    doc.text(`Page ${pageNum} of ${totalPages}`, pageW - 14, pageH - 3, { align: 'right' });
    doc.setDrawColor(29, 111, 235);
    doc.setLineWidth(0.5);
    doc.line(0, pageH - 10, pageW, pageH - 10);
  };

  addHeader();

  const assessmentNames = [...new Set(grades.map(g => g.assessment_name))];

  const tableBody = learners.map((learner, idx) => {
    const lg = grades.filter(g => g.learner_id === learner.id);
    const assessScores = assessmentNames.map(name => {
      const g = lg.find(x => x.assessment_name === name);
      return g ? `${parseFloat(g.marks_obtained)}/${parseFloat(g.total_marks)}` : '-';
    });
    const avg = lg.length > 0 ? (lg.reduce((s, g) => s + parseFloat(g.percentage), 0) / lg.length) : 0;
    const { symbol } = getGradeSymbol(avg);
    const ca = caResults?.find(c => c.learner_id === learner.id);
    return [idx + 1, learner.full_name, learner.student_number, ...assessScores, ca?.final_mark ? ca.final_mark + '%' : avg.toFixed(1) + '%', symbol];
  });

  autoTable(doc, {
    startY: 42,
    head: [['#', 'Student Name', 'Stud. No.', ...assessmentNames, 'Final %', 'Sym.']],
    body: tableBody,
    styles: { fontSize: 8, cellPadding: 3, textColor: [232, 240, 254], fillColor: [13, 21, 32], lineColor: [26, 45, 69], lineWidth: 0.3 },
    headStyles: { fillColor: [29, 111, 235], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 9, halign: 'center' },
    alternateRowStyles: { fillColor: [8, 13, 20] },
    columnStyles: {
      0: { halign: 'center', cellWidth: 10 },
      1: { cellWidth: 40 },
      2: { cellWidth: 24 },
    },
    didParseCell: (data) => {
      if (data.section === 'body') {
        const lastCol = data.table.columns.length - 1;
        if (data.column.index === lastCol) {
          const sym = data.cell.raw;
          if (sym === 'A') data.cell.styles.textColor = [0, 200, 150];
          else if (sym === 'B') data.cell.styles.textColor = [41, 121, 255];
          else if (sym === 'F') data.cell.styles.textColor = [255, 71, 87];
          else data.cell.styles.textColor = [255, 170, 0];
          data.cell.styles.fontStyle = 'bold';
          data.cell.styles.halign = 'center';
        }
        const secondLastCol = data.table.columns.length - 2;
        if (data.column.index === secondLastCol) {
          const val = parseFloat(data.cell.raw);
          if (!isNaN(val)) {
            if (val >= 80) data.cell.styles.textColor = [0, 200, 150];
            else if (val >= 50) data.cell.styles.textColor = [255, 170, 0];
            else data.cell.styles.textColor = [255, 71, 87];
            data.cell.styles.fontStyle = 'bold';
          }
        }
      }
    },
    margin: { top: 42, left: 14, right: 14 },
  });

  // Summary stats
  const allAvgs = learners.map(l => {
    const lg = grades.filter(g => g.learner_id === l.id);
    return lg.length > 0 ? lg.reduce((s, g) => s + parseFloat(g.percentage), 0) / lg.length : 0;
  }).filter(v => v > 0);

  if (allAvgs.length > 0) {
    const classAvg = allAvgs.reduce((a, b) => a + b, 0) / allAvgs.length;
    const highest = Math.max(...allAvgs);
    const lowest = Math.min(...allAvgs);
    const passCount = allAvgs.filter(v => v >= 50).length;

    let y = doc.lastAutoTable.finalY + 10;
    if (y > pageH - 40) { doc.addPage(); y = 30; }

    doc.setFillColor(13, 21, 32);
    doc.roundedRect(14, y, pageW - 28, 24, 3, 3, 'F');
    doc.setDrawColor(26, 45, 69);
    doc.roundedRect(14, y, pageW - 28, 24, 3, 3, 'S');

    const stats = [
      { label: 'Class Average', value: classAvg.toFixed(1) + '%' },
      { label: 'Highest Score', value: highest.toFixed(1) + '%' },
      { label: 'Lowest Score', value: lowest.toFixed(1) + '%' },
      { label: 'Pass Rate', value: ((passCount / allAvgs.length) * 100).toFixed(1) + '%' },
      { label: 'Total Learners', value: learners.length },
    ];

    stats.forEach((s, i) => {
      const x = 14 + (i * (pageW - 28) / stats.length) + 10;
      doc.setTextColor(122, 154, 191);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text(s.label, x, y + 9);
      doc.setTextColor(41, 121, 255);
      doc.setFontSize(13);
      doc.setFont('helvetica', 'bold');
      doc.text(String(s.value), x, y + 20);
    });
  }

  const totalPages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    addFooter(i, totalPages);
  }

  doc.save(`${subjectName.replace(/\s+/g, '_')}_Report_${new Date().getFullYear()}.pdf`);
};

// ─── WORD EXPORT ──────────────────────────────────────────────────────────────
export const exportToWord = async (subjectName, gradeLevel, teacherName, learners, grades, caResults) => {
  const { Document, Packer, TextRun, Table, TableRow, TableCell, Paragraph, HeadingLevel, AlignmentType, BorderStyle, WidthType } = await import('docx');

  const assessmentNames = [...new Set(grades.map(g => g.assessment_name))];

  const headerBg = '1D6FEB';
  const darkBg = '0D1520';
  const lightBg = '080D14';

  const makeBorderStyle = () => ({
    top: { style: BorderStyle.SINGLE, size: 1, color: '1A2D45' },
    bottom: { style: BorderStyle.SINGLE, size: 1, color: '1A2D45' },
    left: { style: BorderStyle.SINGLE, size: 1, color: '1A2D45' },
    right: { style: BorderStyle.SINGLE, size: 1, color: '1A2D45' },
  });

  const headerCell = (text) => new TableCell({
    children: [new Paragraph({
      children: [new TextRun({ text, bold: true, color: 'FFFFFF', size: 18 })],
      alignment: AlignmentType.CENTER,
    })],
    shading: { fill: headerBg, type: 'clear' },
    borders: makeBorderStyle(),
  });

  const dataCell = (text, isEven = false, color = 'E8F0FE', bold = false) => new TableCell({
    children: [new Paragraph({
      children: [new TextRun({ text: String(text), color, size: 17, bold })],
      alignment: AlignmentType.CENTER,
    })],
    shading: { fill: isEven ? darkBg : lightBg, type: 'clear' },
    borders: makeBorderStyle(),
  });

  const tableRows = learners.map((learner, idx) => {
    const lg = grades.filter(g => g.learner_id === learner.id);
    const avg = lg.length > 0 ? lg.reduce((s, g) => s + parseFloat(g.percentage), 0) / lg.length : 0;
    const { symbol } = getGradeSymbol(avg);
    const ca = caResults?.find(c => c.learner_id === learner.id);
    const isEven = idx % 2 === 0;

    const cells = [
      dataCell(idx + 1, isEven),
      dataCell(learner.full_name, isEven, 'E8F0FE', true),
      dataCell(learner.student_number, isEven),
      ...assessmentNames.map(name => {
        const g = lg.find(x => x.assessment_name === name);
        return dataCell(g ? `${g.marks_obtained}/${g.total_marks}` : '-', isEven);
      }),
      dataCell(ca?.final_mark ? ca.final_mark + '%' : avg.toFixed(1) + '%', isEven, avg >= 50 ? '00C896' : 'FF4757', true),
      dataCell(symbol, isEven, symbol === 'A' ? '00C896' : symbol === 'F' ? 'FF4757' : 'FFAA00', true),
    ];

    return new TableRow({ children: cells });
  });

  const doc = new Document({
    sections: [{
      properties: { page: { margin: { top: 720, bottom: 720, left: 1000, right: 1000 } } },
      children: [
        new Paragraph({
          children: [new TextRun({ text: SCHOOL_NAME, bold: true, size: 36, color: '2979FF' })],
          alignment: AlignmentType.CENTER,
          spacing: { after: 100 },
        }),
        new Paragraph({
          children: [new TextRun({ text: SCHOOL_ADDRESS, size: 18, color: '7A9ABF' })],
          alignment: AlignmentType.CENTER,
          spacing: { after: 200 },
        }),
        new Paragraph({
          children: [new TextRun({ text: '─'.repeat(80), color: '1A2D45', size: 14 })],
          alignment: AlignmentType.CENTER,
          spacing: { after: 200 },
        }),
        new Paragraph({
          children: [new TextRun({ text: 'SUBJECT GRADE REPORT', bold: true, size: 32, color: 'E8F0FE' })],
          alignment: AlignmentType.CENTER,
          spacing: { after: 300 },
        }),
        new Paragraph({
          children: [
            new TextRun({ text: `Subject: `, bold: true, size: 22, color: '7A9ABF' }),
            new TextRun({ text: subjectName, bold: true, size: 22, color: '2979FF' }),
            new TextRun({ text: `     Grade Level: `, bold: true, size: 22, color: '7A9ABF' }),
            new TextRun({ text: gradeLevel, bold: true, size: 22, color: 'E8F0FE' }),
          ],
          spacing: { after: 100 },
        }),
        new Paragraph({
          children: [
            new TextRun({ text: `Teacher: `, bold: true, size: 22, color: '7A9ABF' }),
            new TextRun({ text: teacherName, bold: true, size: 22, color: 'E8F0FE' }),
            new TextRun({ text: `     Date: `, bold: true, size: 22, color: '7A9ABF' }),
            new TextRun({ text: new Date().toLocaleDateString('en-ZA'), size: 22, color: 'E8F0FE' }),
          ],
          spacing: { after: 400 },
        }),
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            new TableRow({
              children: [
                headerCell('#'),
                headerCell('Student Name'),
                headerCell('Student No.'),
                ...assessmentNames.map(n => headerCell(n)),
                headerCell('Final %'),
                headerCell('Symbol'),
              ],
              tableHeader: true,
            }),
            ...tableRows,
          ],
        }),
        new Paragraph({ children: [new TextRun({ text: '' })], spacing: { after: 400 } }),
        new Paragraph({
          children: [new TextRun({ text: 'CLASS SUMMARY', bold: true, size: 24, color: '2979FF' })],
          spacing: { after: 200 },
        }),
        ...(() => {
          const allAvgs = learners.map(l => {
            const lg = grades.filter(g => g.learner_id === l.id);
            return lg.length > 0 ? lg.reduce((s, g) => s + parseFloat(g.percentage), 0) / lg.length : 0;
          }).filter(v => v > 0);
          if (!allAvgs.length) return [];
          const classAvg = (allAvgs.reduce((a, b) => a + b, 0) / allAvgs.length).toFixed(1);
          const highest = Math.max(...allAvgs).toFixed(1);
          const passRate = ((allAvgs.filter(v => v >= 50).length / allAvgs.length) * 100).toFixed(1);
          return [
            new Paragraph({ children: [new TextRun({ text: `Class Average: ${classAvg}%`, size: 20, color: 'E8F0FE' })] }),
            new Paragraph({ children: [new TextRun({ text: `Highest Score: ${highest}%`, size: 20, color: 'E8F0FE' })] }),
            new Paragraph({ children: [new TextRun({ text: `Pass Rate: ${passRate}%`, size: 20, color: '00C896' })] }),
            new Paragraph({ children: [new TextRun({ text: `Total Learners: ${learners.length}`, size: 20, color: 'E8F0FE' })] }),
          ];
        })(),
        new Paragraph({ children: [new TextRun({ text: '' })], spacing: { after: 400 } }),
        new Paragraph({
          children: [new TextRun({ text: `Generated by EduManage School System — ${new Date().toLocaleString('en-ZA')}`, size: 16, color: '3D5A7A', italics: true })],
          alignment: AlignmentType.CENTER,
        }),
      ],
    }],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `${subjectName.replace(/\s+/g, '_')}_Report_${new Date().getFullYear()}.docx`);
};