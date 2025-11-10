import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import {
  FiPlus, FiCalendar, FiClock, FiCheckCircle, FiXCircle,
  FiUser, FiMapPin, FiTrendingUp, FiAlertCircle
} from 'react-icons/fi';
import { attendanceService, attendanceServiceExtended } from '../services/extendedApi';

interface Attendance {
  id: number;
  employee_name: string;
  date: string;
  clock_in_time: string;
  clock_out_time: string;
  work_hours: string;
  status: string;
  clock_in_location?: string;
  clock_out_location?: string;
  notes?: string;
}

const AttendanceTracking: React.FC = () => {
  const [attendances, setAttendances] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [isClockedIn, setIsClockedIn] = useState(false);

  useEffect(() => {
    fetchAttendances();
    checkClockInStatus();
  }, [selectedDate]);

  const fetchAttendances = async () => {
    try {
      const response = await attendanceService.getAll({ date: selectedDate });
      setAttendances(response.data.results || response.data);
    } catch (error) {
      toast.error('Failed to load attendance records');
    } finally {
      setLoading(false);
    }
  };

  const checkClockInStatus = async () => {
    try {
      const response = await attendanceServiceExtended.getMyStatus();
      setIsClockedIn(response.data.is_clocked_in);
    } catch (error) {
      console.error('Failed to check clock-in status');
    }
  };

  const handleClockIn = async () => {
    try {
      await attendanceServiceExtended.clockIn({
        location: 'Office', // In production, get from GPS
      });
      toast.success('Clocked in successfully!');
      setIsClockedIn(true);
      fetchAttendances();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to clock in');
    }
  };

  const handleClockOut = async () => {
    try {
      await attendanceServiceExtended.clockOut({
        location: 'Office', // In production, get from GPS
      });
      toast.success('Clocked out successfully!');
      setIsClockedIn(false);
      fetchAttendances();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to clock out');
    }
  };

  const getStatusColor = (status: string) => {
    const colors: any = {
      PRESENT: 'bg-green-100 text-green-800',
      ABSENT: 'bg-red-100 text-red-800',
      LATE: 'bg-yellow-100 text-yellow-800',
      HALF_DAY: 'bg-blue-100 text-blue-800',
      ON_LEAVE: 'bg-purple-100 text-purple-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PRESENT':
        return <FiCheckCircle className="h-5 w-5 text-green-600" />;
      case 'ABSENT':
        return <FiXCircle className="h-5 w-5 text-red-600" />;
      case 'LATE':
        return <FiAlertCircle className="h-5 w-5 text-yellow-600" />;
      default:
        return <FiClock className="h-5 w-5 text-gray-600" />;
    }
  };

  const filteredAttendances = attendances.filter(att =>
    filterStatus === 'ALL' || att.status === filterStatus
  );

  const stats = {
    total: attendances.length,
    present: attendances.filter(a => a.status === 'PRESENT').length,
    absent: attendances.filter(a => a.status === 'ABSENT').length,
    late: attendances.filter(a => a.status === 'LATE').length,
    avgHours: attendances.length > 0
      ? attendances.reduce((sum, a) => sum + parseFloat(a.work_hours || '0'), 0) / attendances.length
      : 0,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Attendance Tracking</h1>
        <p className="text-gray-600">Track employee attendance and working hours</p>
      </div>

      {/* Clock In/Out Card */}
      <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-8 mb-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-2">Today's Attendance</h2>
            <p className="text-blue-100">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
            <div className="flex items-center gap-2 mt-4">
              <FiClock className="h-5 w-5" />
              <span className="text-xl font-semibold">{new Date().toLocaleTimeString()}</span>
            </div>
          </div>
          <div className="flex gap-4">
            {!isClockedIn ? (
              <button
                onClick={handleClockIn}
                className="px-8 py-4 bg-white text-blue-600 rounded-xl hover:bg-blue-50 transition-all shadow-lg hover:shadow-xl font-bold text-lg"
              >
                <div className="flex items-center gap-3">
                  <FiCheckCircle className="h-6 w-6" />
                  Clock In
                </div>
              </button>
            ) : (
              <button
                onClick={handleClockOut}
                className="px-8 py-4 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-all shadow-lg hover:shadow-xl font-bold text-lg"
              >
                <div className="flex items-center gap-3">
                  <FiXCircle className="h-6 w-6" />
                  Clock Out
                </div>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-6">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Total</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats.total}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <FiUser className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Present</p>
              <p className="text-3xl font-bold text-green-600 mt-2">{stats.present}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <FiCheckCircle className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Absent</p>
              <p className="text-3xl font-bold text-red-600 mt-2">{stats.absent}</p>
            </div>
            <div className="p-3 bg-red-100 rounded-lg">
              <FiXCircle className="h-6 w-6 text-red-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Late</p>
              <p className="text-3xl font-bold text-yellow-600 mt-2">{stats.late}</p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-lg">
              <FiAlertCircle className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Avg Hours</p>
              <p className="text-3xl font-bold text-blue-600 mt-2">{stats.avgHours.toFixed(1)}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <FiTrendingUp className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <FiCalendar className="h-5 w-5 text-gray-400" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              {['ALL', 'PRESENT', 'ABSENT', 'LATE', 'HALF_DAY', 'ON_LEAVE'].map((status) => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    filterStatus === status
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {status.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Attendance Records */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Employee
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Clock In
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Clock Out
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Hours
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Location
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredAttendances.map((attendance) => (
                <tr key={attendance.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                        {attendance.employee_name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{attendance.employee_name}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {new Date(attendance.date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-sm">
                      <FiClock className="h-4 w-4 text-gray-400" />
                      <span className="font-medium text-gray-900">
                        {attendance.clock_in_time || '-'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-sm">
                      <FiClock className="h-4 w-4 text-gray-400" />
                      <span className="font-medium text-gray-900">
                        {attendance.clock_out_time || '-'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-semibold text-blue-600">
                      {parseFloat(attendance.work_hours || '0').toFixed(2)}h
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-2 w-fit ${getStatusColor(attendance.status)}`}>
                      {getStatusIcon(attendance.status)}
                      {attendance.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1 text-sm text-gray-600">
                      <FiMapPin className="h-4 w-4 text-gray-400" />
                      <span>{attendance.clock_in_location || '-'}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredAttendances.length === 0 && (
          <div className="text-center py-12">
            <FiCalendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 text-lg mb-2">No attendance records found</p>
            <p className="text-gray-400">Select a different date or filter</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AttendanceTracking;

