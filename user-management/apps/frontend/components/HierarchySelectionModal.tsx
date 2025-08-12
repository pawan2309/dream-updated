import React, { useState, useEffect } from 'react';
import { getHierarchyModalTitle } from '../lib/hierarchyUtils';

interface User {
  id: string;
  label: string;
  value: string;
  username: string;
  name: string;
  code: string;
}

interface HierarchySelectionModalProps {
  isOpen: boolean;
  upperRole: string;
  onClose: () => void;
  onSelect: (selectedUserId: string) => void;
}

const HierarchySelectionModal: React.FC<HierarchySelectionModalProps> = ({
  isOpen,
  upperRole,
  onClose,
  onSelect
}) => {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (isOpen && upperRole) {
      fetchUsersByRole();
    }
  }, [isOpen, upperRole]);

  const fetchUsersByRole = async () => {
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch(`/api/users/by-role?role=${upperRole}`);
      const data = await response.json();
      
      if (data.success) {
        setUsers(data.users);
        if (data.users.length > 0) {
          setSelectedUserId(data.users[0].id);
        }
      } else {
        setError(data.message || 'Failed to fetch users');
      }
    } catch (error) {
      setError('Failed to fetch users');
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleContinue = () => {
    if (selectedUserId) {
      onSelect(selectedUserId);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Modal backdrop */}
      <div 
        className="modal-backdrop fade show" 
        style={{ 
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          zIndex: 1040
        }}
        onClick={onClose}
      ></div>
      
      {/* Modal */}
      <div 
        className="modal fade show" 
        style={{ 
          display: 'block',
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          zIndex: 1050,
          overflow: 'auto'
        }} 
        tabIndex={-1}
      >
        <div className="modal-dialog modal-dialog-centered" style={{ margin: '1.75rem auto' }}>
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">{getHierarchyModalTitle(upperRole)}</h5>
              <button
                type="button"
                className="close"
                onClick={onClose}
                aria-label="Close"
              >
                <span aria-hidden="true">&times;</span>
              </button>
            </div>
            
            <div className="modal-body">
              {loading ? (
                <div className="text-center">
                  <i className="fas fa-spinner fa-spin fa-2x"></i>
                  <p>Loading users...</p>
                </div>
              ) : error ? (
                <div className="alert alert-danger">
                  {error}
                </div>
              ) : users.length === 0 ? (
                <div className="alert alert-warning">
                  No {getHierarchyModalTitle(upperRole).toLowerCase()} found.
                </div>
              ) : (
                <div className="form-group">
                  <label htmlFor="userSelect">Select {getHierarchyModalTitle(upperRole).replace('Select ', '')}:</label>
                  <select
                    id="userSelect"
                    className="form-control"
                    value={selectedUserId}
                    onChange={(e) => setSelectedUserId(e.target.value)}
                  >
                    {users.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
            
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={onClose}
              >
                Close
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleContinue}
                disabled={!selectedUserId || loading}
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default HierarchySelectionModal; 