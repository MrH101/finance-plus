import React, { useEffect, useState } from 'react';
import axios from 'axios';

interface Module {
  id: number;
  name: string;
  code: string;
  description: string;
}
interface Payroll {
  id: number;
  period_start: string;
  period_end: string;
  gross_salary: string;
  net_salary: string;
  allowances: any;
  status: string;
}
interface LeaveRequest {
  id: number;
  leave_type: string;
  start_date: string;
  end_date: string;
  status: string;
}
interface Bonus {
  period_start: string;
  period_end: string;
  allowances: any;
}

const EmployeePortal: React.FC = () => {
  const [modules, setModules] = useState<Module[]>([]);
  const [payrolls, setPayrolls] = useState<Payroll[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [bonuses, setBonuses] = useState<Bonus[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        const headers = { Authorization: `Token ${token}` };
        const res = await axios.get('/api/employee-self-service/', { headers });
        setModules(res.data.modules);
        setPayrolls(res.data.payrolls);
        setLeaveRequests(res.data.leave_requests);
        setBonuses(res.data.bonuses);
      } catch (err) {
        // handle error
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">My Employee Portal</h1>
      {loading ? <div>Loading...</div> : (
        <>
          <section className="mb-8">
            <h2 className="text-lg font-semibold mb-2">Available Modules</h2>
            <div className="flex flex-wrap gap-3">
              {modules.length === 0 ? <span className="text-gray-500">No modules assigned.</span> :
                modules.map(m => (
                  <div key={m.id} className="bg-blue-100 text-blue-800 px-4 py-2 rounded shadow text-sm font-medium">{m.name}</div>
                ))}
            </div>
          </section>
          <section className="mb-8">
            <h2 className="text-lg font-semibold mb-2">Payroll History</h2>
            {payrolls.length === 0 ? <span className="text-gray-500">No payroll records.</span> : (
              <table className="w-full border mt-2">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="py-2 px-4 text-left">Period</th>
                    <th className="py-2 px-4 text-left">Gross Salary</th>
                    <th className="py-2 px-4 text-left">Net Salary</th>
                    <th className="py-2 px-4 text-left">Status</th>
                      </tr>
                    </thead>
                <tbody>
                  {payrolls.map(p => (
                    <tr key={p.id} className="border-t">
                      <td className="py-2 px-4">{p.period_start} - {p.period_end}</td>
                      <td className="py-2 px-4">${p.gross_salary}</td>
                      <td className="py-2 px-4">${p.net_salary}</td>
                      <td className="py-2 px-4">{p.status}</td>
                        </tr>
                  ))}
                    </tbody>
                  </table>
            )}
          </section>
          <section className="mb-8">
            <h2 className="text-lg font-semibold mb-2">Leave Requests</h2>
            {leaveRequests.length === 0 ? <span className="text-gray-500">No leave requests.</span> : (
              <table className="w-full border mt-2">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="py-2 px-4 text-left">Type</th>
                    <th className="py-2 px-4 text-left">Start</th>
                    <th className="py-2 px-4 text-left">End</th>
                    <th className="py-2 px-4 text-left">Status</th>
                      </tr>
                    </thead>
                <tbody>
                  {leaveRequests.map(lr => (
                    <tr key={lr.id} className="border-t">
                      <td className="py-2 px-4">{lr.leave_type}</td>
                      <td className="py-2 px-4">{lr.start_date}</td>
                      <td className="py-2 px-4">{lr.end_date}</td>
                      <td className="py-2 px-4">{lr.status}</td>
                        </tr>
                  ))}
                    </tbody>
                  </table>
            )}
          </section>
          <section>
            <h2 className="text-lg font-semibold mb-2">Bonuses</h2>
            {bonuses.length === 0 ? <span className="text-gray-500">No bonuses found.</span> : (
              <table className="w-full border mt-2">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="py-2 px-4 text-left">Period</th>
                    <th className="py-2 px-4 text-left">Allowances</th>
                  </tr>
                </thead>
                <tbody>
                  {bonuses.map((b, i) => (
                    <tr key={i} className="border-t">
                      <td className="py-2 px-4">{b.period_start} - {b.period_end}</td>
                      <td className="py-2 px-4">{JSON.stringify(b.allowances)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>
        </>
      )}
    </div>
  );
};

export default EmployeePortal; 