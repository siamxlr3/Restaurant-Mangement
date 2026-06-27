import React from 'react';
import { format } from 'date-fns';

const ThermalReceipt = React.forwardRef(({ bill, payments = [] }, ref) => {
    if (!bill) return null;

    return (
        <div ref={ref} className="thermal-receipt w-[80mm] p-4 bg-white text-black font-mono text-xs leading-tight">
            <style type="text/css" media="print">
                {`
                @page { size: 80mm auto; margin: 0; }
                body { margin: 0; padding: 0; }
                .thermal-receipt { width: 80mm; padding: 8mm; }
                .no-print { display: none; }
                `}
            </style>
            
            <div className="text-center space-y-1 mb-4 border-b border-dashed border-black pb-4">
                <h2 className="text-lg font-bold uppercase tracking-widest">Restaurant Name</h2>
                <p>123 Foodie Street, City</p>
                <p>Tel: +123 456 789</p>
                <p>VAT: 123456789</p>
            </div>

            <div className="space-y-1 mb-4 border-b border-dashed border-black pb-4">
                <div className="flex justify-between">
                    <span>Receipt #:</span>
                    <span>{bill.id.split('-')[0].toUpperCase()}</span>
                </div>
                <div className="flex justify-between">
                    <span>Date:</span>
                    <span>{format(new Date(), 'dd/MM/yyyy HH:mm')}</span>
                </div>
                <div className="flex justify-between">
                    <span>Table:</span>
                    <span>{bill.order?.table_name || 'Takeaway'}</span>
                </div>
                <div className="flex justify-between">
                    <span>Server:</span>
                    <span>{bill.order?.staff_name || 'Admin'}</span>
                </div>
            </div>

            <table className="w-full mb-4">
                <thead className="border-b border-dashed border-black">
                    <tr>
                        <th className="text-left py-1">Item</th>
                        <th className="text-center py-1">Qty</th>
                        <th className="text-right py-1">Total</th>
                    </tr>
                </thead>
                <tbody className="border-b border-dashed border-black">
                    {bill.order?.items?.map((item, idx) => (
                        <tr key={idx}>
                            <td className="py-1">{item.name}</td>
                            <td className="text-center py-1">{item.quantity}</td>
                            <td className="text-right py-1">৳{(item.price * item.quantity).toFixed(2)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <div className="space-y-1 mb-4 border-b border-dashed border-black pb-4">
                <div className="flex justify-between text-sm">
                    <span>Subtotal:</span>
                    <span>৳{bill.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                    <span>Tax (10%):</span>
                    <span>৳{bill.tax.toFixed(2)}</span>
                </div>
                {bill.discount_total > 0 && (
                    <div className="flex justify-between font-bold">
                        <span>Discount:</span>
                        <span>-৳{bill.discount_total.toFixed(2)}</span>
                    </div>
                )}
                <div className="flex justify-between text-base font-bold pt-1">
                    <span>GRAND TOTAL:</span>
                    <span>৳{bill.total.toFixed(2)}</span>
                </div>
            </div>

            {payments.length > 0 && (
                <div className="space-y-1 mb-4 border-b border-dashed border-black pb-4">
                    <p className="font-bold underline text-center mb-1">PAYMENT DETAILS</p>
                    {payments.map((p, idx) => (
                        <div key={idx} className="flex justify-between items-center">
                            <span className="capitalize">{p.method} Payment:</span>
                            <span>৳{parseFloat(p.amount).toFixed(2)}</span>
                        </div>
                    ))}
                </div>
            )}

            <div className="text-center space-y-1 pt-2">
                <p className="font-bold">THANK YOU!</p>
                <p>Please come again.</p>
                <p className="text-[10px]">Powered by Antigravity POS</p>
            </div>
        </div>
    );
});

export default ThermalReceipt;
