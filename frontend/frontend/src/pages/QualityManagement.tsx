import React, { useState, useEffect } from 'react';

interface QualityControl {
  id: number;
  reference_number: string;
  product_name: string;
  batch_number: string;
  inspection_date: string;
  inspector_name: string;
  status: string;
  status_display: string;
  quantity_inspected: number;
  quantity_passed: number;
  quantity_failed: number;
  notes: string;
  created_at: string;
}

interface QualityParameter {
  id: number;
  product_name: string;
  parameter_name: string;
  specification: string;
  tolerance: string;
  unit: string;
  is_required: boolean;
}

interface QualityInspectionResult {
  id: number;
  quality_control: number;
  parameter_name: string;
  measured_value: string;
  is_within_spec: boolean;
  remarks: string;
}

const QualityManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState('inspections');
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('');
  const [qualityControls, setQualityControls] = useState<QualityControl[]>([]);
  const [qualityParameters, setQualityParameters] = useState<QualityParameter[]>([]);
  const [inspectionResults, setInspectionResults] = useState<QualityInspectionResult[]>([]);
  const [loading, setLoading] = useState(true);

  const tabs = [
    { key: 'inspections', label: 'Quality Inspections' },
    { key: 'parameters', label: 'Quality Parameters' },
    { key: 'results', label: 'Inspection Results' },
    { key: 'dashboard', label: 'Dashboard' },
  ];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [controlsRes, paramsRes, resultsRes] = await Promise.all([
        fetch('/api/quality-control/'),
        fetch('/api/quality-parameters/'),
        fetch('/api/quality-inspection-results/')
      ]);

      if (controlsRes.ok) {
        const controlsData = await controlsRes.json();
        setQualityControls(controlsData);
      }

      if (paramsRes.ok) {
        const paramsData = await paramsRes.json();
        setQualityParameters(paramsData);
      }

      if (resultsRes.ok) {
        const resultsData = await resultsRes.json();
        setInspectionResults(resultsData);
      }
    } catch (error) {
      console.error('Error fetching quality management data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const data = Object.fromEntries(formData.entries());

    try {
      const endpoint = modalType === 'inspection' ? '/api/quality-control/' :
                      modalType === 'parameter' ? '/api/quality-parameters/' :
                      '/api/quality-inspection-results/';

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(data)
      });

      if (response.ok) {
        setShowModal(false);
        fetchData();
      }
    } catch (error) {
      console.error('Error creating quality record:', error);
    }
  };

  const openModal = (type: string) => {
    setModalType(type);
    setShowModal(true);
  };

  const renderInspections = () => (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold">Quality Inspections</h3>
        <button 
          onClick={() => openModal('inspection')} 
          className="bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700 transition"
        >
          + New Inspection
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white rounded shadow">
          <thead>
            <tr className="bg-blue-50">
              <th className="py-2 px-4 text-left">Reference</th>
              <th className="py-2 px-4 text-left">Product</th>
              <th className="py-2 px-4 text-left">Batch</th>
              <th className="py-2 px-4 text-left">Inspector</th>
              <th className="py-2 px-4 text-left">Status</th>
              <th className="py-2 px-4 text-left">Passed/Failed</th>
              <th className="py-2 px-4 text-left">Date</th>
            </tr>
          </thead>
          <tbody>
            {qualityControls.map(inspection => (
              <tr key={inspection.id} className="border-b hover:bg-blue-50">
                <td className="py-2 px-4">{inspection.reference_number}</td>
                <td className="py-2 px-4">{inspection.product_name}</td>
                <td className="py-2 px-4">{inspection.batch_number}</td>
                <td className="py-2 px-4">{inspection.inspector_name}</td>
                <td className="py-2 px-4">
                  <span className={`px-2 py-1 rounded text-xs ${
                    inspection.status === 'PASSED' ? 'bg-green-100 text-green-800' :
                    inspection.status === 'FAILED' ? 'bg-red-100 text-red-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {inspection.status_display}
                  </span>
                </td>
                <td className="py-2 px-4">
                  {inspection.quantity_passed}/{inspection.quantity_inspected}
                </td>
                <td className="py-2 px-4">{new Date(inspection.inspection_date).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderParameters = () => (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold">Quality Parameters</h3>
        <button 
          onClick={() => openModal('parameter')} 
          className="bg-green-600 text-white px-4 py-2 rounded shadow hover:bg-green-700 transition"
        >
          + New Parameter
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white rounded shadow">
          <thead>
            <tr className="bg-green-50">
              <th className="py-2 px-4 text-left">Product</th>
              <th className="py-2 px-4 text-left">Parameter</th>
              <th className="py-2 px-4 text-left">Specification</th>
              <th className="py-2 px-4 text-left">Tolerance</th>
              <th className="py-2 px-4 text-left">Unit</th>
              <th className="py-2 px-4 text-left">Required</th>
            </tr>
          </thead>
          <tbody>
            {qualityParameters.map(param => (
              <tr key={param.id} className="border-b hover:bg-green-50">
                <td className="py-2 px-4">{param.product_name}</td>
                <td className="py-2 px-4">{param.parameter_name}</td>
                <td className="py-2 px-4">{param.specification}</td>
                <td className="py-2 px-4">{param.tolerance}</td>
                <td className="py-2 px-4">{param.unit}</td>
                <td className="py-2 px-4">
                  <span className={`px-2 py-1 rounded text-xs ${
                    param.is_required ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {param.is_required ? 'Yes' : 'No'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderResults = () => (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold">Inspection Results</h3>
        <button 
          onClick={() => openModal('result')} 
          className="bg-purple-600 text-white px-4 py-2 rounded shadow hover:bg-purple-700 transition"
        >
          + New Result
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white rounded shadow">
          <thead>
            <tr className="bg-purple-50">
              <th className="py-2 px-4 text-left">Parameter</th>
              <th className="py-2 px-4 text-left">Measured Value</th>
              <th className="py-2 px-4 text-left">Within Spec</th>
              <th className="py-2 px-4 text-left">Remarks</th>
            </tr>
          </thead>
          <tbody>
            {inspectionResults.map(result => (
              <tr key={result.id} className="border-b hover:bg-purple-50">
                <td className="py-2 px-4">{result.parameter_name}</td>
                <td className="py-2 px-4">{result.measured_value}</td>
                <td className="py-2 px-4">
                  <span className={`px-2 py-1 rounded text-xs ${
                    result.is_within_spec ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {result.is_within_spec ? 'Yes' : 'No'}
                  </span>
                </td>
                <td className="py-2 px-4">{result.remarks}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderDashboard = () => {
    const totalInspections = qualityControls.length;
    const passedInspections = qualityControls.filter(qc => qc.status === 'PASSED').length;
    const failedInspections = qualityControls.filter(qc => qc.status === 'FAILED').length;
    const pendingInspections = qualityControls.filter(qc => qc.status === 'PENDING').length;
    
    const totalParameters = qualityParameters.length;
    const requiredParameters = qualityParameters.filter(p => p.is_required).length;

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-700">Total Inspections</h3>
            <p className="text-3xl font-bold text-blue-600">{totalInspections}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-700">Passed</h3>
            <p className="text-3xl font-bold text-green-600">{passedInspections}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-700">Failed</h3>
            <p className="text-3xl font-bold text-red-600">{failedInspections}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-700">Pending</h3>
            <p className="text-3xl font-bold text-yellow-600">{pendingInspections}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-700 mb-4">Quality Parameters</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Total Parameters:</span>
                <span className="font-semibold">{totalParameters}</span>
              </div>
              <div className="flex justify-between">
                <span>Required Parameters:</span>
                <span className="font-semibold">{requiredParameters}</span>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-700 mb-4">Recent Inspections</h3>
            <div className="space-y-2">
              {qualityControls.slice(0, 5).map(inspection => (
                <div key={inspection.id} className="flex justify-between items-center">
                  <span className="text-sm">{inspection.product_name}</span>
                  <span className={`px-2 py-1 rounded text-xs ${
                    inspection.status === 'PASSED' ? 'bg-green-100 text-green-800' :
                    inspection.status === 'FAILED' ? 'bg-red-100 text-red-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {inspection.status_display}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderModal = () => {
    if (!showModal) return null;

    const getModalTitle = () => {
      switch (modalType) {
        case 'inspection': return 'New Quality Inspection';
        case 'parameter': return 'New Quality Parameter';
        case 'result': return 'New Inspection Result';
        default: return 'New Record';
      }
    };

    const getModalFields = () => {
      switch (modalType) {
        case 'inspection':
          return (
            <>
              <input name="reference_number" className="w-full border rounded px-3 py-2" placeholder="Reference Number" required />
              <input name="product" className="w-full border rounded px-3 py-2" placeholder="Product ID" required />
              <input name="batch_number" className="w-full border rounded px-3 py-2" placeholder="Batch Number" />
              <input name="inspection_date" type="date" className="w-full border rounded px-3 py-2" required />
              <input name="quantity_inspected" type="number" className="w-full border rounded px-3 py-2" placeholder="Quantity Inspected" required />
              <textarea name="notes" className="w-full border rounded px-3 py-2" placeholder="Notes" rows={3} />
            </>
          );
        case 'parameter':
          return (
            <>
              <input name="product" className="w-full border rounded px-3 py-2" placeholder="Product ID" required />
              <input name="parameter_name" className="w-full border rounded px-3 py-2" placeholder="Parameter Name" required />
              <input name="specification" className="w-full border rounded px-3 py-2" placeholder="Specification" required />
              <input name="tolerance" className="w-full border rounded px-3 py-2" placeholder="Tolerance" />
              <input name="unit" className="w-full border rounded px-3 py-2" placeholder="Unit" />
              <label className="flex items-center">
                <input name="is_required" type="checkbox" className="mr-2" />
                Required Parameter
              </label>
            </>
          );
        case 'result':
          return (
            <>
              <input name="quality_control" className="w-full border rounded px-3 py-2" placeholder="Quality Control ID" required />
              <input name="parameter" className="w-full border rounded px-3 py-2" placeholder="Parameter ID" required />
              <input name="measured_value" className="w-full border rounded px-3 py-2" placeholder="Measured Value" required />
              <label className="flex items-center">
                <input name="is_within_spec" type="checkbox" className="mr-2" />
                Within Specification
              </label>
              <textarea name="remarks" className="w-full border rounded px-3 py-2" placeholder="Remarks" rows={3} />
            </>
          );
        default:
          return null;
      }
    };

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
        <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md">
          <h4 className="text-lg font-bold mb-4">{getModalTitle()}</h4>
          <form onSubmit={handleSubmit} className="space-y-4">
            {getModalFields()}
            <div className="flex justify-end gap-2">
              <button 
                type="button" 
                className="px-4 py-2 rounded bg-gray-200" 
                onClick={() => setShowModal(false)}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="px-4 py-2 rounded bg-blue-600 text-white"
              >
                Create
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow p-8 min-h-[60vh] flex items-center justify-center">
        <div className="text-lg">Loading Quality Management...</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow p-8 min-h-[60vh]">
      <h2 className="text-2xl font-bold mb-4 text-blue-700">Quality Management</h2>
      <div className="mb-6 flex gap-4 border-b">
        {tabs.map(tab => (
          <button
            key={tab.key}
            className={`px-4 py-2 font-semibold border-b-2 transition-colors duration-150 ${
              activeTab === tab.key 
                ? 'border-blue-600 text-blue-700' 
                : 'border-transparent text-gray-500 hover:text-blue-600'
            }`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'inspections' && renderInspections()}
      {activeTab === 'parameters' && renderParameters()}
      {activeTab === 'results' && renderResults()}
      {activeTab === 'dashboard' && renderDashboard()}

      {renderModal()}
    </div>
  );
};

export default QualityManagement; 