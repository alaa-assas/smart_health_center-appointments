const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');

class ExportService {
    
     // Generate Excel Buffer
     
    static async toExcel(data, reportName) {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet(reportName);

        // Define Columns based on your Appointment Report requirement
        worksheet.columns = [
            { header: 'Patient Name', key: 'patientName', width: 25 },
            { header: 'Doctor Name', key: 'doctorName', width: 25 },
            { header: 'Specialty', key: 'specialty', width: 20 },
            { header: 'Date', key: 'date', width: 15 },
            { header: 'Status', key: 'status', width: 15 },
        ];

        // Add Data Rows
        worksheet.addRows(data);

        // Styling the Header
        worksheet.getRow(1).font = { bold: true };

        return await workbook.xlsx.writeBuffer();
    }


    
     // Generate PDF Stream/Buffer
     
    static async toPDF(data, reportName, res) {

        const doc = new PDFDocument({ margin: 30, size: 'A4' });

        doc.pipe(res);

        // Header
        doc.fontSize(18).text(`Smart Health Center: ${reportName}`, { align: 'center' });
        doc.moveDown(2);

        // Table column widths
        const tableTop = 100;
        const itemHeight = 20;
        const colWidths = {
            patient: 150,
            doctor: 150,
            specialty: 100,
            status: 100
        };

        // Draw table headers
        doc.fontSize(12).font('Helvetica-Bold');
        doc.text('Patient', 30, tableTop, { width: colWidths.patient });
        doc.text('Doctor', 30 + colWidths.patient, tableTop, { width: colWidths.doctor });
        doc.text('Specialty', 30 + colWidths.patient + colWidths.doctor, tableTop, { width: colWidths.specialty });
        doc.text('Status', 30 + colWidths.patient + colWidths.doctor + colWidths.specialty, tableTop, { width: colWidths.status });

        // Draw a line under header
        doc.moveTo(30, tableTop + itemHeight - 5)
            .lineTo(550, tableTop + itemHeight - 5)
            .stroke();

        // Draw table rows
        let rowTop = tableTop + itemHeight;
        doc.font('Helvetica').fontSize(10);

        data.forEach(item => {
            doc.text(item.patientName, 30, rowTop, { width: colWidths.patient });
            doc.text(item.doctorName, 30 + colWidths.patient, rowTop, { width: colWidths.doctor });
            doc.text(item.specialty, 30 + colWidths.patient + colWidths.doctor, rowTop, { width: colWidths.specialty });
            doc.text(item.status, 30 + colWidths.patient + colWidths.doctor + colWidths.specialty, rowTop, { width: colWidths.status });

            rowTop += itemHeight;
        });

        doc.end();
    }
}

module.exports = ExportService;