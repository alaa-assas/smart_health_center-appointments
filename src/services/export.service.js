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

        // Pipe the PDF directly to the response stream
        doc.pipe(res);

        // Add Header
        doc.fontSize(20).text(`Smart Health Center: ${reportName}`, { align: 'center' });
        doc.moveDown();

        // Add Table Headers
        doc.fontSize(12).text('Patient | Doctor | Specialty | Status', { underline: true });
        doc.moveDown();

        // Add Rows
        data.forEach(item => {
            doc.fontSize(10).text(
                `${item.patientName} | ${item.doctorName} | ${item.specialty} | ${item.status}`
            );
            doc.moveDown(0.5);
        });

        doc.end();
    }
}

module.exports = ExportService;