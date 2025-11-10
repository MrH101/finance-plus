import React from 'react';
import { Link } from 'react-router-dom';

const ModuleTile = ({ module }) => {
  return (
    <Link
      to={module.path}
      className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md hover:shadow-lg transition-all"
    >
      <div className="flex items-center space-x-4">
        <div className="p-3 bg-blue-100 dark:bg-gray-700 rounded-lg">
          {module.icon}
        </div>
        <div>
          <h3 className="text-xl font-semibold dark:text-white">{module.title}</h3>
          <p className="text-gray-600 dark:text-gray-400">{module.description}</p>
        </div>
      </div>
    </Link>
  );
};

export default ModuleTile;