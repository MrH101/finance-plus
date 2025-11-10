import React, { useEffect, useState } from 'react';
import transactionService from '../services/transactionService';

const GeneralLedger: React.FC = () => {
  const [entries, setEntries] = useState<any[]>([]);

  useEffect(() => {
    transactionService.fetchLedger().then((res: any) => {
      const raw = res?.data ?? res;
      const list = Array.isArray(raw) ? raw : (raw?.results && Array.isArray(raw.results) ? raw.results : []);
      setEntries(list);
    }).catch(() => setEntries([]));
  }, []);

  return (
    <div className="bg-white rounded-xl shadow p-8 min-h-[60vh]">
      <h2 className="text-2xl font-bold mb-4 text-gray-700">General Ledger</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white rounded shadow">
          <thead>
            <tr className="bg-gray-100">
              <th className="py-2 px-4 text-left">Date</th>
              <th className="py-2 px-4 text-left">Account</th>
              <th className="py-2 px-4 text-left">Debit</th>
              <th className="py-2 px-4 text-left">Credit</th>
              <th className="py-2 px-4 text-left">Reference</th>
              <th className="py-2 px-4 text-left">Description</th>
            </tr>
          </thead>
          <tbody>
            {(entries || []).map((e: any) => (
              <tr key={e.id} className="border-b hover:bg-gray-100">
                <td className="py-2 px-4">{e.date}</td>
                <td className="py-2 px-4">{e.account?.name}</td>
                <td className="py-2 px-4">{e.debit}</td>
                <td className="py-2 px-4">{e.credit}</td>
                <td className="py-2 px-4">{e.reference}</td>
                <td className="py-2 px-4">{e.description}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default GeneralLedger; 