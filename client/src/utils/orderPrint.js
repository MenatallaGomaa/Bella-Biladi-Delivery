import jsPDF from 'jspdf';

/**
 * Formats an order for printing/PDF export
 */
export function formatOrderForPrint(order) {
  const date = new Date(order.createdAt || Date.now()).toLocaleString("de-DE");
  const statusTranslations = {
    new: "Neu",
    accepted: "Akzeptiert",
    preparing: "In Bearbeitung",
    on_the_way: "Unterwegs",
    delivered: "Geliefert",
    canceled: "Storniert"
  };

  let content = `
═══════════════════════════════════════
        BELLA BILADI BESTELLUNG
═══════════════════════════════════════

Bestellnummer: ${order.ref || order._id}
Datum: ${date}
Status: ${statusTranslations[order.status] || order.status}

───────────────────────────────────────
ARTIKEL
───────────────────────────────────────
`;

  order.items.forEach((item) => {
    const price = ((item.priceCents * item.qty) / 100).toFixed(2);
    content += `${item.qty}× ${item.name}\n`;
    content += `   ${price} €\n\n`;
  });

  content += `───────────────────────────────────────\n`;
  
  if (order.totals) {
    const subtotal = ((order.totals.subtotalCents || 0) / 100).toFixed(2);
    const deliveryFee = ((order.totals.deliveryFeeCents || 0) / 100).toFixed(2);
    const grandTotal = ((order.totals.grandTotalCents || 0) / 100).toFixed(2);
    
    content += `Zwischensumme:     ${subtotal} €\n`;
    if (deliveryFee > 0) {
      content += `Liefergebühr:       ${deliveryFee} €\n`;
    }
    content += `───────────────────────────────────────\n`;
    content += `GESAMT:            ${grandTotal} €\n`;
  }

  content += `
───────────────────────────────────────
KUNDENINFORMATIONEN
───────────────────────────────────────
`;

  if (order.customer) {
    content += `Name: ${order.customer.name || "N/A"}\n`;
    content += `Adresse: ${order.customer.address || "N/A"}\n`;
    content += `Telefon: ${order.customer.phone || "N/A"}\n`;
    if (order.customer.email) {
      content += `E-Mail: ${order.customer.email}\n`;
    }
    if (order.customer.desiredTime) {
      content += `Lieferzeit: ${order.customer.desiredTime}\n`;
    }
    if (order.customer.notes) {
      content += `Hinweis: ${order.customer.notes}\n`;
    }
  }

  if (order.driverId && typeof order.driverId === 'object') {
    content += `\nFahrer: ${order.driverId.name || "N/A"}`;
    if (order.driverId.phone) {
      content += ` (${order.driverId.phone})`;
    }
  }

  content += `
───────────────────────────────────────
Zahlungsmethode: ${order.method === "cash_on_delivery" ? "Bar bei Lieferung" : order.method || "N/A"}
───────────────────────────────────────

Vielen Dank für Ihre Bestellung!

═══════════════════════════════════════
`;

  return content;
}

/**
 * Prints an order using the browser's print dialog
 */
export function printOrder(order) {
  const content = formatOrderForPrint(order);
  
  // Create a new window for printing
  const printWindow = window.open('', '_blank');
  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Bestellung ${order.ref || order._id}</title>
        <style>
          @media print {
            body { margin: 0; padding: 20px; }
          }
          body {
            font-family: 'Courier New', monospace;
            font-size: 12px;
            line-height: 1.6;
            white-space: pre-wrap;
            padding: 20px;
            max-width: 600px;
            margin: 0 auto;
          }
        </style>
      </head>
      <body>${content.replace(/\n/g, '<br>')}</body>
    </html>
  `);
  printWindow.document.close();
  
  // Wait for content to load, then print
  printWindow.onload = () => {
    setTimeout(() => {
      printWindow.print();
      // Close window after printing (optional)
      // printWindow.close();
    }, 250);
  };
}

/**
 * Exports an order as PDF
 */
export function exportOrderAsPDF(order) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  const maxWidth = pageWidth - (margin * 2);
  let yPosition = margin;
  const lineHeight = 7;

  // Helper function to add text with word wrap
  const addText = (text, fontSize = 10, isBold = false, align = 'left') => {
    doc.setFontSize(fontSize);
    if (isBold) {
      doc.setFont(undefined, 'bold');
    } else {
      doc.setFont(undefined, 'normal');
    }
    
    const lines = doc.splitTextToSize(text, maxWidth);
    lines.forEach((line) => {
      if (yPosition > doc.internal.pageSize.getHeight() - margin) {
        doc.addPage();
        yPosition = margin;
      }
      
      if (align === 'center') {
        doc.text(line, pageWidth / 2, yPosition, { align: 'center' });
      } else {
        doc.text(line, margin, yPosition);
      }
      yPosition += lineHeight;
    });
  };

  // Header
  addText('═══════════════════════════════════════', 10, false, 'center');
  addText('BELLA BILADI BESTELLUNG', 14, true, 'center');
  addText('═══════════════════════════════════════', 10, false, 'center');
  yPosition += 5;

  // Order info
  const date = new Date(order.createdAt || Date.now()).toLocaleString("de-DE");
  const statusTranslations = {
    new: "Neu",
    accepted: "Akzeptiert",
    preparing: "In Bearbeitung",
    on_the_way: "Unterwegs",
    delivered: "Geliefert",
    canceled: "Storniert"
  };

  addText(`Bestellnummer: ${order.ref || order._id}`, 11, true);
  addText(`Datum: ${date}`, 10);
  addText(`Status: ${statusTranslations[order.status] || order.status}`, 10);
  yPosition += 5;

  // Items
  addText('───────────────────────────────────────', 10);
  addText('ARTIKEL', 11, true);
  addText('───────────────────────────────────────', 10);
  yPosition += 2;

  order.items.forEach((item) => {
    const price = ((item.priceCents * item.qty) / 100).toFixed(2);
    addText(`${item.qty}× ${item.name}`, 10, true);
    addText(`   ${price} €`, 10);
    yPosition += 2;
  });

  yPosition += 3;
  addText('───────────────────────────────────────', 10);

  // Totals
  if (order.totals) {
    const subtotal = ((order.totals.subtotalCents || 0) / 100).toFixed(2);
    const deliveryFee = ((order.totals.deliveryFeeCents || 0) / 100).toFixed(2);
    const grandTotal = ((order.totals.grandTotalCents || 0) / 100).toFixed(2);
    
    addText(`Zwischensumme:     ${subtotal} €`, 10);
    if (deliveryFee > 0) {
      addText(`Liefergebühr:       ${deliveryFee} €`, 10);
    }
    addText('───────────────────────────────────────', 10);
    addText(`GESAMT:            ${grandTotal} €`, 12, true);
  }

  yPosition += 5;

  // Customer info
  addText('───────────────────────────────────────', 10);
  addText('KUNDENINFORMATIONEN', 11, true);
  addText('───────────────────────────────────────', 10);
  yPosition += 2;

  if (order.customer) {
    addText(`Name: ${order.customer.name || "N/A"}`, 10);
    addText(`Adresse: ${order.customer.address || "N/A"}`, 10);
    addText(`Telefon: ${order.customer.phone || "N/A"}`, 10);
    if (order.customer.email) {
      addText(`E-Mail: ${order.customer.email}`, 10);
    }
    if (order.customer.desiredTime) {
      addText(`Lieferzeit: ${order.customer.desiredTime}`, 10);
    }
    if (order.customer.notes) {
      addText(`Hinweis: ${order.customer.notes}`, 10);
    }
  }

  if (order.driverId && typeof order.driverId === 'object') {
    yPosition += 2;
    addText(`Fahrer: ${order.driverId.name || "N/A"}${order.driverId.phone ? ` (${order.driverId.phone})` : ''}`, 10);
  }

  yPosition += 3;
  addText('───────────────────────────────────────', 10);
  addText(`Zahlungsmethode: ${order.method === "cash_on_delivery" ? "Bar bei Lieferung" : order.method || "N/A"}`, 10);
  addText('───────────────────────────────────────', 10);
  yPosition += 5;

  addText('Vielen Dank für Ihre Bestellung!', 10, false, 'center');
  yPosition += 3;
  addText('═══════════════════════════════════════', 10, false, 'center');

  // Save the PDF
  const fileName = `Bestellung_${order.ref || order._id}_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
}

