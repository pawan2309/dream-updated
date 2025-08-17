import React from 'react';

interface SkeletonLoaderProps {
  type: 'table' | 'form' | 'card' | 'content';
  rows?: number;
  columns?: number;
}

const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({ type, rows = 5, columns = 6 }) => {
  const renderTableSkeleton = () => (
    <div className="skeleton-table">
      {/* Table Header */}
      <div className="skeleton-table-header">
        {Array.from({ length: columns }).map((_, index) => (
          <div key={index} className="skeleton-th" />
        ))}
      </div>
      {/* Table Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="skeleton-table-row">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <div key={colIndex} className="skeleton-td" />
          ))}
        </div>
      ))}
    </div>
  );

  const renderFormSkeleton = () => (
    <div className="skeleton-form">
      <div className="skeleton-form-group">
        <div className="skeleton-label" />
        <div className="skeleton-input" />
      </div>
      <div className="skeleton-form-group">
        <div className="skeleton-label" />
        <div className="skeleton-input" />
      </div>
      <div className="skeleton-form-group">
        <div className="skeleton-label" />
        <div className="skeleton-textarea" />
      </div>
      <div className="skeleton-form-group">
        <div className="skeleton-label" />
        <div className="skeleton-select" />
      </div>
      <div className="skeleton-buttons">
        <div className="skeleton-button" />
        <div className="skeleton-button" />
      </div>
    </div>
  );

  const renderCardSkeleton = () => (
    <div className="skeleton-cards">
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="skeleton-card">
          <div className="skeleton-card-header" />
          <div className="skeleton-card-content">
            <div className="skeleton-card-title" />
            <div className="skeleton-card-text" />
            <div className="skeleton-card-text" />
          </div>
        </div>
      ))}
    </div>
  );

  const renderContentSkeleton = () => (
    <div className="skeleton-content">
      <div className="skeleton-title" />
      <div className="skeleton-text" />
      <div className="skeleton-text" />
      <div className="skeleton-text" />
      <div className="skeleton-subtitle" />
      <div className="skeleton-text" />
      <div className="skeleton-text" />
    </div>
  );

  const getSkeletonContent = () => {
    switch (type) {
      case 'table':
        return renderTableSkeleton();
      case 'form':
        return renderFormSkeleton();
      case 'card':
        return renderCardSkeleton();
      case 'content':
        return renderContentSkeleton();
      default:
        return renderContentSkeleton();
    }
  };

  return (
    <div className="skeleton-loader">
      {getSkeletonContent()}
    </div>
  );
};

export default SkeletonLoader;
