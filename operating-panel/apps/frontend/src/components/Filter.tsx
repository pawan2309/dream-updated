import React from 'react';
import { FilterProps } from '../types';

interface FilterComponentProps extends FilterProps {
  onFilterChange: (filters: FilterProps) => void;
  onApply: () => void;
  onReset?: () => void;
  showDateFilters?: boolean;
  showUserFilters?: boolean;
  showCasinoFilters?: boolean;
  showListFilter?: boolean;
}

export const Filter: React.FC<FilterComponentProps> = ({
  startDate,
  endDate,
  username,
  roundId,
  casinoName,
  casinoType,
  showList,
  onFilterChange,
  onApply,
  onReset,
  showDateFilters = true,
  showUserFilters = true,
  showCasinoFilters = true,
  showListFilter = true
}) => {
  const handleInputChange = (field: keyof FilterProps, value: string | number) => {
    onFilterChange({ [field]: value });
  };

  const inputStyles = {
    padding: '12px 16px',
    borderRadius: '8px',
    border: '2px solid #e5e7eb',
    fontSize: '14px',
    width: '200px',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    transition: 'all 0.2s ease',
    outline: 'none'
  };

  const labelStyles = {
    fontWeight: '600',
    fontSize: '14px',
    color: '#374151',
    marginBottom: '6px',
    fontFamily: 'system-ui, -apple-system, sans-serif'
  };

  return (
    <div style={{ 
      display: 'flex', 
      flexWrap: 'wrap', 
      gap: '20px', 
      marginBottom: '24px',
      padding: '24px',
      background: 'rgba(255, 255, 255, 0.95)',
      borderRadius: '16px',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
      border: '1px solid #e5e7eb'
    }}>
      {showDateFilters && (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={labelStyles}>📅 Start Date</label>
            <input
              type="date"
              value={startDate || ''}
              onChange={(e) => handleInputChange('startDate', e.target.value)}
              style={inputStyles}
              onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
              onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={labelStyles}>📅 End Date</label>
            <input
              type="date"
              value={endDate || ''}
              onChange={(e) => handleInputChange('endDate', e.target.value)}
              style={inputStyles}
              onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
              onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
            />
          </div>
        </>
      )}

      {showUserFilters && (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={labelStyles}>👤 Username</label>
            <input
              value={username || ''}
              onChange={(e) => handleInputChange('username', e.target.value)}
              placeholder="Enter username"
              style={inputStyles}
              onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
              onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={labelStyles}>🆔 Round ID</label>
            <input
              value={roundId || ''}
              onChange={(e) => handleInputChange('roundId', e.target.value)}
              placeholder="Enter round ID"
              style={inputStyles}
              onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
              onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
            />
          </div>
        </>
      )}

      {showCasinoFilters && (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={labelStyles}>🎰 Casino Name</label>
            <select
              value={casinoName || ''}
              onChange={(e) => handleInputChange('casinoName', e.target.value)}
              style={inputStyles}
              onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
              onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
            >
              <option value="">Select Casino Name</option>
              <option value="teen20">20-20 Teenpatti</option>
              <option value="teen">Teenpatti onday</option>
              <option value="lucky7eu">Lucky7 B</option>
              <option value="dt20">20-20 Dragon Tiger</option>
            </select>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={labelStyles}>🏷️ Casino Type</label>
            <select
              value={casinoType || ''}
              onChange={(e) => handleInputChange('casinoType', e.target.value)}
              style={inputStyles}
              onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
              onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
            >
              <option value="">Non-Deleted Casino</option>
              <option value="deleted">Deleted Casino</option>
            </select>
          </div>
        </>
      )}

      {showListFilter && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label style={labelStyles}>📊 Show List</label>
          <select
            value={showList || 10}
            onChange={(e) => handleInputChange('showList', parseInt(e.target.value))}
            style={inputStyles}
            onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
            onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
          >
            <option value={10}>10 items</option>
            <option value={25}>25 items</option>
            <option value={50}>50 items</option>
            <option value={100}>100 items</option>
          </select>
        </div>
      )}

      <div style={{ 
        display: 'flex', 
        alignItems: 'flex-end', 
        gap: '12px',
        marginTop: '8px'
      }}>
        <button
          onClick={onApply}
          style={{ 
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            color: '#fff', 
            border: 'none', 
            borderRadius: '10px', 
            padding: '12px 24px', 
            fontWeight: 600, 
            fontSize: 16, 
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
            transition: 'all 0.2s ease',
            fontFamily: 'system-ui, -apple-system, sans-serif'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 6px 20px rgba(16, 185, 129, 0.4)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.3)';
          }}
        >
          ✅ Apply Filters
        </button>
        {onReset && (
          <button
            onClick={onReset}
            style={{ 
              background: 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)',
              color: '#fff', 
              border: 'none', 
              borderRadius: '10px', 
              padding: '12px 24px', 
              fontWeight: 600, 
              fontSize: 16, 
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(107, 114, 128, 0.3)',
              transition: 'all 0.2s ease',
              fontFamily: 'system-ui, -apple-system, sans-serif'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 20px rgba(107, 114, 128, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(107, 114, 128, 0.3)';
            }}
          >
            🔄 Reset
          </button>
        )}
      </div>
    </div>
  );
}; 