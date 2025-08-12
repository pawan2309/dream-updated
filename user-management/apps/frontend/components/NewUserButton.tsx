import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import HierarchySelectionModal from './HierarchySelectionModal';
import { checkHierarchyRelationship, getHierarchyIndex } from '../lib/hierarchyUtils';

// Function to map role names to directory names
function getRoleDirectory(role: string): string {
  const roleMap: { [key: string]: string } = {
    'SUPER_AGENT': 'super',
    'SUPER_ADMIN': 'super_admin',
    'SUB_OWNER': 'sub_owner',
    'ADMIN': 'admin',
    'SUB': 'sub',
    'MASTER': 'master',
    'AGENT': 'agent',
    'USER': 'client'
  };
  
  return roleMap[role] || role.toLowerCase();
}

interface NewUserButtonProps {
  role: string;
  className?: string;
  children: React.ReactNode;
}

const NewUserButton: React.FC<NewUserButtonProps> = ({ role, className, children }) => {
  const router = useRouter();
  const [currentUserRole, setCurrentUserRole] = useState<string>('');
  const [showHierarchyModal, setShowHierarchyModal] = useState(false);
  const [hierarchyUpperRole, setHierarchyUpperRole] = useState<string>('');

  useEffect(() => {
    // Get current user's role
    const getCurrentUserRole = async () => {
      try {
        const res = await fetch('/api/auth/session');
        const data = await res.json();
        if (data.valid) {
          setCurrentUserRole(data.user.role);
        }
      } catch (error) {
        console.error('Error getting current user role:', error);
      }
    };
    getCurrentUserRole();
  }, []);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    
    if (!currentUserRole) {
      alert('Unable to determine your role. Please refresh the page.');
      return;
    }

    console.log('=== Hierarchy Check Debug ===');
    console.log('Current user role:', currentUserRole);
    console.log('Target role:', role);
    console.log('Current user role index:', getHierarchyIndex(currentUserRole));
    console.log('Target role index:', getHierarchyIndex(role));

    // Check hierarchy relationship
    const hierarchyCheck = checkHierarchyRelationship(currentUserRole, role);
    
    console.log('Hierarchy check result:', hierarchyCheck);
    console.log('Is direct subordinate:', hierarchyCheck.isDirectSubordinate);
    console.log('Upper role:', hierarchyCheck.upperRole);
    console.log('Skip level:', hierarchyCheck.skipLevel);
    console.log('=== End Debug ===');
    
    if (!hierarchyCheck.isDirectSubordinate && hierarchyCheck.upperRole) {
      // Show hierarchy selection modal
      console.log('SHOWING MODAL - Upper role:', hierarchyCheck.upperRole);
      setHierarchyUpperRole(hierarchyCheck.upperRole);
      setShowHierarchyModal(true);
    } else {
      // Direct subordinate - navigate directly
      console.log('DIRECT NAVIGATION - No modal needed');
      router.push(`/user_details/${getRoleDirectory(role)}/create`);
    }
  };

  const handleHierarchySelection = (selectedUserId: string) => {
    // Navigate to create page with selected parent
    router.push(`/user_details/${getRoleDirectory(role)}/create?parentId=${selectedUserId}`);
  };

  return (
    <>
      <button 
        className={className || "btn btn-primary mr-2"} 
        onClick={handleClick}
      >
        {children}
      </button>
      
      <HierarchySelectionModal
        isOpen={showHierarchyModal}
        upperRole={hierarchyUpperRole}
        onClose={() => setShowHierarchyModal(false)}
        onSelect={handleHierarchySelection}
      />
    </>
  );
};

export default NewUserButton; 