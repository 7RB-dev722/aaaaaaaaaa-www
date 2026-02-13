import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search } from 'lucide-react';

interface SelectOption {
  label: string;
  value: string;
  icon?: string;
  isImageIcon?: boolean;
}

interface SearchableSelectProps {
  label: string;
  options: (string | SelectOption)[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

const SearchableSelect: React.FC<SearchableSelectProps> = ({
  label,
  options,
  value,
  onChange,
  placeholder,
  className,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const selectRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const filteredOptions = options.filter((option) => {
    const searchStr = typeof option === 'string' ? option : option.label;
    return searchStr.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const handleSelect = (option: string | SelectOption) => {
    const val = typeof option === 'string' ? option : option.value;
    onChange(val);
    setIsOpen(false);
    setSearchTerm('');
  };

  const selectedOption = options.find(opt => 
    typeof opt === 'string' ? opt === value : opt.value === value
  );

  return (
    <div className={`relative ${className || ''}`} ref={selectRef}>
      {label && <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 ml-1">{label}</label>}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full px-4 py-3.5 text-left bg-[#050507] border border-white/10 rounded-xl text-white focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 flex justify-between items-center transition-all shadow-inner ${isOpen ? 'border-cyan-500/50 ring-1 ring-cyan-500/50' : ''}`}
      >
        <span className={value ? 'text-white' : 'text-gray-500'}>
          {selectedOption ? (
            <div className="flex items-center gap-2">
              {typeof selectedOption !== 'string' && selectedOption.icon && (
                selectedOption.isImageIcon ? (
                  <img src={selectedOption.icon} alt="" className="w-5 h-3.5 object-cover rounded-sm shadow-sm" />
                ) : (
                  <span className="text-lg leading-none">{selectedOption.icon}</span>
                )
              )}
              <span>{typeof selectedOption === 'string' ? selectedOption : selectedOption.label}</span>
            </div>
          ) : (
            placeholder || 'Select an option'
          )}
        </span>
        <ChevronDown
          className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${
            isOpen ? 'transform rotate-180 text-cyan-400' : ''
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute z-20 mt-2 w-full bg-[#0a0a0c] border border-white/10 rounded-xl shadow-2xl max-h-60 overflow-hidden flex flex-col backdrop-blur-xl animate-fade-in-up">
          <div className="relative p-2 border-b border-white/5 bg-white/5">
            <Search className="absolute left-5 rtl:right-5 rtl:left-auto top-1/2 transform -translate-y-1/2 w-3 h-3 text-gray-400" />
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#050507] border border-white/10 rounded-lg pl-9 rtl:pr-9 rtl:pl-2 pr-2 py-2 text-sm text-white focus:outline-none focus:border-cyan-500/50 placeholder-gray-600"
              autoFocus
            />
          </div>
          <ul className="overflow-y-auto flex-1 custom-scrollbar p-1">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option) => {
                const labelStr = typeof option === 'string' ? option : option.label;
                const val = typeof option === 'string' ? option : option.value;
                const icon = typeof option === 'string' ? null : option.icon;
                const isImageIcon = typeof option === 'string' ? false : option.isImageIcon;
                
                return (
                  <li
                    key={val}
                    onClick={() => handleSelect(option)}
                    className="px-3 py-2.5 text-sm text-gray-300 hover:text-white hover:bg-white/10 rounded-lg cursor-pointer transition-colors flex items-center gap-3"
                  >
                    {icon && (
                      isImageIcon ? (
                        <img src={icon} alt="" className="w-5 h-3.5 object-cover rounded-sm shadow-sm" />
                      ) : (
                        <span className="text-lg leading-none">{icon}</span>
                      )
                    )}
                    {labelStr}
                  </li>
                );
              })
            ) : (
              <li className="px-4 py-3 text-sm text-gray-500 text-center">No options found</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
};

export default SearchableSelect;
