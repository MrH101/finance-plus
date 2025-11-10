import { useState, useMemo } from 'react';
import { FiChevronDown, FiChevronUp, FiSearch } from 'react-icons/fi';

interface Column<T> {
  header: string;
  accessor: keyof T;
  render?: (value: T[keyof T], row: T) => React.ReactNode;
  sortable?: boolean;
}

type RowId = string | number;

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  pageSize?: number;
  searchable?: boolean;
  onRowClick?: (row: T) => void;
  selectableRows?: boolean;
  onSelectionChange?: (selected: RowId[]) => void;
  enableExport?: boolean;
  exportFileName?: string;
}

export function DataTable<T extends { id: RowId }>({
  columns,
  data,
  pageSize = 10,
  searchable = true,
  onRowClick,
  selectableRows = false,
  onSelectionChange,
  enableExport = false,
  exportFileName = 'export.csv',
}: DataTableProps<T>) {
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState<{ key: keyof T; direction: 'asc' | 'desc' } | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIds, setSelectedIds] = useState<RowId[]>([]);

  const filteredData = useMemo(() => {
    let result = [...data];

    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      result = result.filter((item) =>
        Object.values(item).some((value) => String(value).toLowerCase().includes(searchLower))
      );
    }

    if (sortConfig) {
      result.sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];
        if (aValue === bValue) return 0;
        if (aValue === null) return 1;
        if (bValue === null) return -1;
        const comparison = String(aValue).localeCompare(String(bValue));
        return sortConfig.direction === 'asc' ? comparison : -comparison;
      });
    }

    return result;
  }, [data, sortConfig, searchTerm]);

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredData.slice(startIndex, startIndex + pageSize);
  }, [filteredData, currentPage, pageSize]);

  const totalPages = Math.ceil(filteredData.length / pageSize);

  const handleSort = (key: keyof T) => {
    setSortConfig((current) => ({
      key,
      direction: current?.key === key && current.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  const allVisibleSelected = selectableRows && paginatedData.every((row) => selectedIds.includes(row.id));

  const toggleSelectAllVisible = () => {
    if (!selectableRows) return;
    let next: RowId[] = [];
    if (allVisibleSelected) {
      const visibleIds = new Set(paginatedData.map((r) => r.id));
      next = selectedIds.filter((id) => !visibleIds.has(id));
    } else {
      const idsToAdd = paginatedData.map((r) => r.id).filter((id) => !selectedIds.includes(id));
      next = [...selectedIds, ...idsToAdd];
    }
    setSelectedIds(next);
    onSelectionChange?.(next);
  };

  const toggleSelectOne = (id: RowId) => {
    if (!selectableRows) return;
    const next = selectedIds.includes(id) ? selectedIds.filter((x) => x !== id) : [...selectedIds, id];
    setSelectedIds(next);
    onSelectionChange?.(next);
  };

  const handleExport = () => {
    const rows = filteredData;
    const headers = columns.map((c) => String(c.header));
    const csv = [headers.join(',')]
      .concat(
        rows.map((row) =>
          columns
            .map((c) => {
              const v = row[c.accessor];
              const s = typeof v === 'string' ? v : String(v ?? '');
              return '"' + s.replace(/"/g, '""') + '"';
            })
            .join(',')
        )
      )
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', exportFileName);
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-white shadow-md rounded-lg overflow-hidden">
      {searchable && (
        <div className="p-4 border-b flex items-center justify-between gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <FiSearch className="absolute left-3 top-3 text-gray-400" />
          </div>
          {enableExport && (
            <button onClick={handleExport} className="px-3 py-2 border rounded-md text-sm">
              Export CSV
            </button>
          )}
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {selectableRows && (
                <th className="px-6 py-3">
                  <input type="checkbox" checked={!!allVisibleSelected} onChange={toggleSelectAllVisible} />
                </th>
              )}
              {columns.map((column) => (
                <th
                  key={String(column.accessor)}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => column.sortable && handleSort(column.accessor)}
                >
                  <div className="flex items-center space-x-1">
                    <span>{column.header}</span>
                    {column.sortable && sortConfig?.key === column.accessor && (
                      <span>
                        {sortConfig.direction === 'asc' ? (
                          <FiChevronUp className="w-4 h-4" />
                        ) : (
                          <FiChevronDown className="w-4 h-4" />
                        )}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {paginatedData.map((row) => (
              <tr
                key={row.id}
                onClick={() => onRowClick?.(row)}
                className={onRowClick ? 'cursor-pointer hover:bg-gray-50' : ''}
              >
                {selectableRows && (
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(row.id)}
                      onChange={(e) => {
                        e.stopPropagation();
                        toggleSelectOne(row.id);
                      }}
                    />
                  </td>
                )}
                {columns.map((column) => (
                  <td key={String(column.accessor)} className="px-6 py-4 whitespace-nowrap">
                    {column.render ? column.render(row[column.accessor], row) : String(row[column.accessor])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="px-6 py-4 border-t flex items-center justify-between">
        <div className="text-sm text-gray-700">
          Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, filteredData.length)} of {filteredData.length} results
        </div>
        <div className="flex space-x-2">
          <button onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))} disabled={currentPage === 1} className="px-3 py-1 border rounded-md disabled:opacity-50">
            Previous
          </button>
          <button onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages} className="px-3 py-1 border rounded-md disabled:opacity-50">
            Next
          </button>
        </div>
      </div>
    </div>
  );
} 