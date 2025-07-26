import React, { useState } from "react";

// Third-party dependencies
import { Search, X } from "lucide-react";

import DelayedQuerier from './DelayedQuerier';

// === ResponsiveSearchBar =====================================================
//
// Search bar with an autocomplete function, making use of the DelayedQuerier
// component.
//
// =============================================================================

type ResponsiveSearchBarProps = {
  queryFn: (query: string) => Promise<any>;
  getResultID: (result: any) => any;
  getResultName: (result: any) => string;
  onSelect: (result: any) => void;
  waitMS: number;
  label: string;
};

const ResponsiveSearchBar: React.FC<ResponsiveSearchBarProps> = (props: ResponsiveSearchBarProps) => {
  const {
    queryFn,
    getResultName,
    getResultID,
    onSelect,
    waitMS,
    label
  } = props;
  const [query, setQuery] = useState<string>('');
  const [results, setResults] = useState<any[]>([]);
  const [_, setSelected] = useState<any | null>(null);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const querier = DelayedQuerier({ queryFn, waitMS });

  const runQuery = (query: string) => {
    querier.newQuery(query)
      .then((data: any) => setResults(data));
  };

  const handleChange = (ev: React.ChangeEvent<HTMLInputElement>) => {
    const query = ev.target.value;

    ev.preventDefault();
    setQuery(query);
    runQuery(query);
    setIsOpen(true);
  };

  const handleSelect = (result: any) => {
    setIsOpen(false);
    setQuery(getResultName(result));
    setSelected(result);
    onSelect(result);
  };

  const handleClose = () => {
    setQuery("");
    setIsOpen(false);
  };

  return (
    <div className="w-full mb-12">
      <div className="flex w-full items-center bg-white border border-gray-300 rounded-full shadow-sm px-4 py-2 focus-within:ring-2 focus-within:ring-indigo-300 transition">
        <Search className="text-gray-400 mr-2" size={20} />
        <input
          name="query"
          type="text"
          value={query}
          onChange={handleChange}
          placeholder={label}
          className="flex-1 bg-transparent outline-none text-gray-700 placeholder-gray-400"
        />
        <button onClick={handleClose}>
          <X color="gray" />
        </button>
      </div>
      {
        isOpen && (results.length > 0) && (
          <ul className="absolute z-10 w-96 bg-white rounded-xl shadow-sm mt-2">
            {results.map((result) => {
              return (
                <li key={getResultID(result)} className="w-full hover:bg-blue-200 p-1">
                  <button onClick={() => handleSelect(result)} className="w-full text-left">
                    {getResultName(result)}
                  </button>
                </li>
              );
            })}
          </ul>
        )
      }
    </div>
  );
};

export default ResponsiveSearchBar;

