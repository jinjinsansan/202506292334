import React, { ReactNode } from 'react';

interface EntryShadowWrapperProps {
  children: ReactNode;
}

const EntryShadowWrapper: React.FC<EntryShadowWrapperProps> = ({ children }) => {
  return (
    <div className="card-shadow-wrapper">
      {children}
    </div>
  );
};

export default EntryShadowWrapper;