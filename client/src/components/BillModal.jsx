import { X, Download, Printer } from 'lucide-react';
import { useRef } from 'react';

export default function BillModal({ isOpen, onClose, billData }) {
  const billRef = useRef(null);

  if (!isOpen || !billData) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    // Create a printable HTML
    const printWindow = window.open('', '_blank');
    const billHTML = billRef.current.innerHTML;
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Bill - ${billData.restaurant.name}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              padding: 20px;
              max-width: 800px;
              margin: 0 auto;
            }
            .bill-container {
              border: 2px solid #000;
              padding: 30px;
            }
            .header {
              text-align: center;
              border-bottom: 2px solid #000;
              padding-bottom: 20px;
              margin-bottom: 20px;
            }
            .restaurant-name {
              font-size: 28px;
              font-weight: bold;
              margin-bottom: 10px;
            }
            .bill-info {
              display: flex;
              justify-content: space-between;
              margin-bottom: 20px;
              font-size: 14px;
            }
            .items-table {
              width: 100%;
              border-collapse: collapse;
              margin: 20px 0;
            }
            .items-table th,
            .items-table td {
              padding: 10px;
              text-align: left;
              border-bottom: 1px solid #ddd;
            }
            .items-table th {
              background-color: #f5f5f5;
              font-weight: bold;
            }
            .total-section {
              margin-top: 20px;
              padding-top: 20px;
              border-top: 2px solid #000;
            }
            .total-row {
              display: flex;
              justify-content: space-between;
              padding: 5px 0;
              font-size: 16px;
            }
            .grand-total {
              font-size: 24px;
              font-weight: bold;
              margin-top: 10px;
              padding-top: 10px;
              border-top: 2px solid #000;
            }
            .footer {
              text-align: center;
              margin-top: 30px;
              padding-top: 20px;
              border-top: 1px solid #ddd;
              font-size: 14px;
            }
            .payment-status {
              display: inline-block;
              padding: 5px 15px;
              border-radius: 5px;
              font-weight: bold;
              margin-top: 10px;
            }
            .paid {
              background-color: #d4edda;
              color: #155724;
            }
            .pending {
              background-color: #fff3cd;
              color: #856404;
            }
          </style>
        </head>
        <body>
          ${billHTML}
        </body>
      </html>
    `);
    
    printWindow.document.close();
    setTimeout(() => {
      printWindow.print();
    }, 250);
  };

  const { restaurant, tableNumber, customer, items, subtotal, tax, total, date, billNumber, paymentDetails, paidOnline, pendingCash } = billData;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-800">Bill Generated</h2>
          <div className="flex gap-2">
            <button
              onClick={handleDownload}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              <Download size={20} />
              Download
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
            >
              <Printer size={20} />
              Print
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Bill Content */}
        <div ref={billRef} className="p-8">
          <div className="border-2 border-gray-800 p-8">
            {/* Header */}
            <div className="text-center border-b-2 border-gray-800 pb-6 mb-6">
              <h1 className="text-4xl font-bold text-gray-800 mb-2">{restaurant.name}</h1>
              <p className="text-gray-600">{restaurant.address || 'Restaurant Address'}</p>
              <p className="text-gray-600">{restaurant.phone || 'Contact: +91-XXXXXXXXXX'}</p>
            </div>

            {/* Bill Info */}
            <div className="flex justify-between mb-6 text-sm">
              <div>
                <p><strong>Bill No:</strong> {billNumber}</p>
                <p><strong>Date:</strong> {date}</p>
                {tableNumber && <p><strong>Table:</strong> {tableNumber}</p>}
              </div>
              <div className="text-right">
                <p><strong>Customer:</strong> {customer.name}</p>
                <p><strong>Phone:</strong> {customer.phone}</p>
              </div>
            </div>

            {/* Items Table */}
            <table className="w-full mb-6">
              <thead>
                <tr className="bg-gray-100 border-b-2 border-gray-800">
                  <th className="text-left p-3">Item</th>
                  <th className="text-center p-3">Qty</th>
                  <th className="text-right p-3">Price</th>
                  <th className="text-right p-3">Amount</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, idx) => (
                  <tr key={idx} className="border-b border-gray-300">
                    <td className="p-3">{item.name}</td>
                    <td className="text-center p-3">{item.quantity}</td>
                    <td className="text-right p-3">₹{item.price}</td>
                    <td className="text-right p-3">₹{item.total}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Total Section */}
            <div className="border-t-2 border-gray-800 pt-4">
              <div className="flex justify-between text-lg mb-2">
                <span>Subtotal:</span>
                <span>₹{subtotal}</span>
              </div>
              {tax > 0 && (
                <div className="flex justify-between text-lg mb-2">
                  <span>Tax (5%):</span>
                  <span>₹{tax}</span>
                </div>
              )}
              <div className="flex justify-between text-2xl font-bold mt-4 pt-4 border-t-2 border-gray-800">
                <span>GRAND TOTAL:</span>
                <span className="text-primary">₹{total}</span>
              </div>
            </div>

            {/* Payment Breakdown */}
            <div className="mt-6 border-t-2 border-gray-300 pt-4">
              <h3 className="text-lg font-bold text-gray-800 mb-3">Payment Details:</h3>
              {paymentDetails && paymentDetails.length > 0 ? (
                <div className="space-y-2">
                  {paymentDetails.map((payment, idx) => (
                    <div key={idx} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-semibold text-gray-800">{payment.method}</p>
                        <span className={`inline-block px-3 py-1 rounded text-xs font-semibold mt-1 ${
                          payment.status === 'paid' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {payment.status === 'paid' ? '✓ PAID' : '⏳ PENDING'}
                        </span>
                      </div>
                      <p className="text-xl font-bold text-primary">₹{payment.amount}</p>
                    </div>
                  ))}
                  
                  {/* Summary */}
                  <div className="mt-4 p-4 bg-blue-50 rounded-lg border-2 border-blue-200">
                    <div className="flex justify-between mb-2">
                      <span className="text-green-700 font-semibold">✓ Paid Online:</span>
                      <span className="text-green-700 font-bold">₹{paidOnline || 0}</span>
                    </div>
                    {pendingCash > 0 && (
                      <div className="flex justify-between">
                        <span className="text-yellow-700 font-semibold">⏳ Pending (Cash):</span>
                        <span className="text-yellow-700 font-bold">₹{pendingCash}</span>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-gray-600">No payment information available</p>
              )}
            </div>

            {/* Footer */}
            <div className="text-center mt-8 pt-6 border-t border-gray-300">
              <p className="text-gray-600 text-sm">Thank you for dining with us!</p>
              <p className="text-gray-600 text-sm">Please visit again</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
