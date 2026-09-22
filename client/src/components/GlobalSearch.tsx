import React, { useState } from 'react';
import { Search as SearchIcon, X } from 'lucide-react';

export const GlobalSearch: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');

  // This is a placeholder for actual global search functionality
  // In a real app, this would hit an elasticsearch or similar endpoint
  
  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="p-2 text-gray-400 hover:text-gray-500 rounded-full hover:bg-gray-100 transition-colors"
      >
        <SearchIcon className="h-5 w-5" />
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24">
          <div className="fixed inset-0 bg-slate-900/25 backdrop-blur-sm transition-opacity" onClick={() => setIsOpen(false)} />
          
          <div className="relative w-full max-w-2xl transform overflow-hidden rounded-xl bg-white shadow-2xl ring-1 ring-black/5 transition-all mx-4">
            <div className="flex items-center border-b border-slate-100 px-4">
              <SearchIcon className="h-5 w-5 text-slate-400" />
              <input
                type="text"
                className="h-14 w-full border-0 bg-transparent pl-4 pr-4 text-slate-900 placeholder:text-slate-400 focus:ring-0 sm:text-sm"
                placeholder="Search across reports, tasks, and data..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                autoFocus
              />
              <button 
                onClick={() => setIsOpen(false)}
                className="rounded-md p-1 hover:bg-slate-100 text-slate-400"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {query.length > 2 ? (
              <div className="max-h-[60vh] overflow-y-auto p-4 text-sm">
                <div className="text-center py-8 text-slate-500">
                  Global search implementation depends on backend search service.
                  <br/>
                  <span className="text-xs mt-2 block">Currently searching for: "{query}"</span>
                </div>
              </div>
            ) : (
              <div className="p-4 text-sm text-slate-500">
                Type at least 3 characters to search
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};
