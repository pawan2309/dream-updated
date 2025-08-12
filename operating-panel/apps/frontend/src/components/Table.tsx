import React from 'react';

interface TableColumn {
  key: string;
  label: string;
  width?: string;
  align?: 'left' | 'center' | 'right';
}

interface TableRow {
  id?: string | number;
  key?: string;
  [key: string]: React.ReactNode;
}

interface TableProps {
  columns: TableColumn[];
  data: TableRow[];
  onRowClick?: (row: TableRow) => void;
  selectable?: boolean;
  onSelectionChange?: (selectedIds: string[]) => void;
  selectedIds?: string[];
  isMobile?: boolean;
}

export const Table: React.FC<TableProps> = ({
  columns,
  data,
  onRowClick,
  selectable = false,
  onSelectionChange,
  selectedIds = [],
  isMobile = false
}) => {
  const handleRowClick = (row: TableRow) => {
    if (onRowClick) {
      onRowClick(row);
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (onSelectionChange) {
      const allIds = data.map(row => String(row.id || row.key || ''));
      onSelectionChange(checked ? allIds.filter(id => id) : []);
    }
  };

  const handleSelectRow = (id: string, checked: boolean) => {
    if (onSelectionChange) {
      const newSelection = checked 
        ? [...selectedIds, id]
        : selectedIds.filter(selectedId => selectedId !== id);
      onSelectionChange(newSelection);
    }
  };

  const getRowId = (row: TableRow): string => {
    return String(row.id || row.key || '');
  };

  return (
    <div style={{ 
      display: "flex",
      flexDirection: "column",
      flex: "1",
      overflowY: "auto"
    }}>
      <div style={{
        display: "flex-col"
      }}>
        <div style={{
          overflowX: "auto",
          padding: "0 4px",
          maxWidth: "100%"
        }}>
          <div style={{
            display: "inline-block",
            minWidth: "100%"
          }}>
            <div style={{
              padding: isMobile ? "8px" : "12px",
              width: "100%"
            }}>
              <table style={{ 
                background: "#fff",
                color: "#111827",
                width: "100%",
                borderCollapse: "collapse",
                fontFamily: "system-ui, -apple-system, sans-serif"
              }}>
                <thead style={{
                  background: "#e5e7eb",
                  borderRadius: "8px 8px 0 0",
                  width: "100%"
                }}>
                  <tr style={{ 
                    background: "#1e40af", 
                    color: "#fff", 
                    fontWeight: 600, 
                    fontSize: isMobile ? "12px" : "14px",
                    textAlign: "left",
                    textTransform: "capitalize",
                    letterSpacing: "0.05em"
                  }}>
                    {selectable && (
                      <th style={{ 
                        background: "#1e40af",
                        padding: "8px",
                        borderRight: "1px solid rgba(255,255,255,0.1)", 
                        width: "50px",
                        textAlign: "center",
                        whiteSpace: "nowrap"
                      }}>
                        <input
                          type="checkbox"
                          checked={selectedIds.length === data.length && data.length > 0}
                          onChange={(e) => handleSelectAll(e.target.checked)}
                          style={{
                            width: "16px",
                            height: "16px",
                            border: "1px solid #d1d5db",
                            borderRadius: "2px",
                            background: "#fff",
                            cursor: "pointer",
                            outline: "none"
                          }}
                        />
                      </th>
                    )}
                    {columns.map((column) => (
                      <th
                        key={column.key}
                        style={{
                          padding: "10px 8px",
                          borderRight: "1px solid rgba(255,255,255,0.1)",
                          textAlign: column.align || "left",
                          width: column.width,
                          fontSize: isMobile ? "11px" : "13px",
                          fontWeight: "600",
                          letterSpacing: "0.025em",
                          whiteSpace: "nowrap"
                        }}
                      >
                        {column.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.map((row, index) => (
                    <tr
                      key={getRowId(row) || index}
                      style={{
                        background: "#fff",
                        color: "#000",
                        fontWeight: 500,
                        cursor: onRowClick ? "pointer" : "default",
                        transition: "all 0.2s ease",
                        borderBottom: "1px solid rgba(0,0,0,0.1)",
                        fontSize: isMobile ? "12px" : "14px"
                      }}
                      onMouseEnter={(e) => {
                        if (onRowClick) {
                          e.currentTarget.style.background = "#f3f4f6";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (onRowClick) {
                          e.currentTarget.style.background = "#fff";
                        }
                      }}
                      onClick={() => handleRowClick(row)}
                    >
                      {selectable && (
                        <td style={{ 
                          textAlign: "center",
                          padding: "8px",
                          borderRight: "1px solid #f3f4f6",
                          whiteSpace: "nowrap"
                        }}>
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(getRowId(row))}
                            onChange={(e) => handleSelectRow(getRowId(row), e.target.checked)}
                            onClick={(e) => e.stopPropagation()}
                            style={{
                              width: "16px",
                              height: "16px",
                              border: "1px solid #d1d5db",
                              borderRadius: "2px",
                              background: "#fff",
                              cursor: "pointer",
                              outline: "none"
                            }}
                          />
                        </td>
                      )}
                      {columns.map((column) => (
                        <td
                          key={column.key}
                          style={{
                            textAlign: column.align || "left",
                            padding: "8px",
                            fontSize: isMobile ? "11px" : "13px",
                            borderRight: "1px solid #f3f4f6",
                            verticalAlign: "middle",
                            whiteSpace: "nowrap"
                          }}
                        >
                          {row[column.key]}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
      
      {/* Empty state */}
      {data.length === 0 && (
        <div style={{
          padding: '40px 20px',
          textAlign: 'center',
          color: '#6b7280',
          fontSize: '14px'
        }}>
          <div style={{ fontSize: '24px', marginBottom: '8px' }}>📊</div>
          <div style={{ fontWeight: '500' }}>No data available</div>
          <div style={{ fontSize: '12px', marginTop: '4px' }}>Try adjusting your filters</div>
        </div>
      )}
    </div>
  );
}; 