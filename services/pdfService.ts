import { Invoice, CompanySettings, Client } from "../types";

export function renderInvoiceToHtml(params: {
  invoice: Invoice;
  company: CompanySettings;
  client: Client;
}): string {
  const { invoice, company, client } = params;

  // Simple formatting helper
  const formatCurrency = (amount: number) => `${amount.toFixed(2)} €`;

  const itemsRows = invoice.items.map(item => `
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid #eee;">${item.description}</td>
      <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right;">${item.quantity}</td>
      <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right;">${formatCurrency(item.price)}</td>
      ${company.isVatSubject ? `<td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right;">${item.vatRate}%</td>` : ''}
      <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right;">${formatCurrency(item.quantity * item.price)}</td>
    </tr>
  `).join('');

  return `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <title>Facture ${invoice.number}</title>
      <style>
        body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #333; line-height: 1.5; margin: 0; padding: 40px; }
        .header { display: flex; justify-content: space-between; margin-bottom: 50px; }
        .company-logo img { max-height: 80px; max-width: 200px; margin-bottom: 15px; }
        .company-info h1 { margin: 0 0 10px; font-size: 24px; color: ${company.primaryColor || '#333'}; }
        .company-info p { margin: 0; font-size: 14px; color: #666; }
        .invoice-details { text-align: right; }
        .invoice-details h2 { margin: 0 0 5px; font-size: 20px; text-transform: uppercase; letter-spacing: 2px; }
        .invoice-meta { font-size: 14px; color: #666; margin-bottom: 4px; }
        .client-section { margin-bottom: 40px; padding: 20px; background: #f9f9f9; border-radius: 8px; }
        .client-label { font-size: 12px; text-transform: uppercase; color: #999; font-weight: bold; margin-bottom: 5px; }
        .client-name { font-size: 18px; font-weight: bold; margin-bottom: 5px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 40px; }
        th { text-align: left; padding: 12px; border-bottom: 2px solid #ddd; font-size: 12px; text-transform: uppercase; color: #666; }
        .totals { margin-left: auto; width: 300px; }
        .total-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee; }
        .total-row.final { border-bottom: none; border-top: 2px solid #333; font-weight: bold; font-size: 18px; margin-top: 10px; padding-top: 15px; }
        .footer { margin-top: 60px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #999; text-align: center; }
        .notes { margin-top: 30px; font-size: 14px; color: #666; font-style: italic; }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="company-info">
          ${company.logoUrl ? `<div class="company-logo"><img src="${company.logoUrl}" alt="Logo" /></div>` : ''}
          <h1>${company.name}</h1>
          <p>${company.address.replace(/\n/g, '<br>')}</p>
          <p>${company.email} | ${company.phone}</p>
          <p>SIRET: ${company.siret}</p>
          ${company.isVatSubject ? `<p>TVA: ${company.vatNumber}</p>` : ''}
        </div>
        <div class="invoice-details">
          <h2>${invoice.type === 'QUOTE' ? 'Devis' : 'Facture'}</h2>
          <div class="invoice-meta">N°: <strong>${invoice.number}</strong></div>
          <div class="invoice-meta">Date: ${invoice.date}</div>
          ${invoice.dueDate ? `<div class="invoice-meta">Échéance: ${invoice.dueDate}</div>` : ''}
          <div class="invoice-meta">Statut: ${invoice.status}</div>
        </div>
      </div>

      <div class="client-section">
        <div class="client-label">Facturé à</div>
        <div class="client-name">${client.name}</div>
        <div>${client.address}</div>
        ${client.siret ? `<div>SIRET: ${client.siret}</div>` : ''}
        <div>${client.email}</div>
      </div>

      <table>
        <thead>
          <tr>
            <th>Description</th>
            <th style="text-align: right;">Qté</th>
            <th style="text-align: right;">Prix Unit.</th>
            ${company.isVatSubject ? `<th style="text-align: right;">TVA</th>` : ''}
            <th style="text-align: right;">Total HT</th>
          </tr>
        </thead>
        <tbody>
          ${itemsRows}
        </tbody>
      </table>

      <div class="totals">
        <div class="total-row">
          <span>Total HT</span>
          <span>${formatCurrency(invoice.subtotal)}</span>
        </div>
        ${company.isVatSubject ? `
        <div class="total-row">
          <span>TVA</span>
          <span>${formatCurrency(invoice.taxAmount)}</span>
        </div>` : ''}
        <div class="total-row final">
          <span>Total TTC</span>
          <span>${formatCurrency(invoice.total)}</span>
        </div>
      </div>

      ${invoice.notes ? `<div class="notes"><strong>Notes:</strong> ${invoice.notes}</div>` : ''}
      ${!company.isVatSubject ? `<div class="notes" style="font-size: 12px; color: #999;">TVA non applicable, art. 293 B du CGI</div>` : ''}

      <div class="footer">
        <p>${company.name} - SIRET ${company.siret}</p>
        ${company.paymentRib ? `<p>Coordonnées bancaires: ${company.paymentRib}</p>` : ''}
        ${company.paymentTerms ? `<p>${company.paymentTerms}</p>` : ''}
        <p>Généré par FastInvoice AI</p>
      </div>
    </body>
    </html>
  `;
}