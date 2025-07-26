import React from 'react';
import { PenTool } from 'lucide-react';

const Header: React.FC = () => {
  return (
    <header className="bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex items-center space-x-3">
          <div className="bg-blue-500 p-2 rounded-xl shadow-md">
            <PenTool className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">
              StoryCraft-VA
            </h1>
            <p className="text-sm text-gray-600">
              Create compelling customer success stories that showcase real impact and drive sales
            </p>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;