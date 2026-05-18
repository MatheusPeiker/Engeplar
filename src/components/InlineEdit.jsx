import React, { useState, useRef, useEffect } from 'react';

export default function InlineEdit({ value, onSave, type = 'text', options = [], prefix = '', suffix = '', placeholder = 'Clique para editar', className = '' }) {
  const [editing, setEditing] = useState(false);
  const [tempValue, setTempValue] = useState(value);
  const [justSaved, setJustSaved] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => { setTempValue(value); }, [value]);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      if (type === 'text' || type === 'number' || type === 'currency') {
        inputRef.current.select();
      }
    }
  }, [editing, type]);

  const handleSave = () => {
    setEditing(false);
    if (tempValue !== value) {
      const numVal = parseFloat(tempValue);
      onSave(type === 'number' || type === 'currency' ? (isNaN(numVal) ? 0 : numVal) : tempValue);
      setJustSaved(true);
      setTimeout(() => setJustSaved(false), 1500);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSave();
    if (e.key === 'Escape') { setTempValue(value); setEditing(false); }
  };

  if (editing) {
    if (type === 'select') {
      return (
        <select
          ref={inputRef}
          value={tempValue}
          onChange={(e) => { setTempValue(e.target.value); }}
          onBlur={handleSave}
          className={`inline-edit-input ${className}`}
        >
          {options.map(opt => (
            <option key={opt.value ?? opt} value={opt.value ?? opt}>{opt.label ?? opt}</option>
          ))}
        </select>
      );
    }

    return (
      <input
        ref={inputRef}
        type={type === 'currency' ? 'number' : type}
        step={type === 'currency' ? '0.01' : type === 'number' ? '1' : undefined}
        value={tempValue}
        onChange={(e) => setTempValue(e.target.value)}
        onBlur={handleSave}
        onKeyDown={handleKeyDown}
        className={`inline-edit-input ${className}`}
        placeholder={placeholder}
      />
    );
  }

  const displayValue = type === 'currency'
    ? `${prefix}${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0)}${suffix}`
    : `${prefix}${value || placeholder}${suffix}`;

  return (
    <span
      className={`inline-edit-display ${justSaved ? 'just-saved' : ''} ${className}`}
      onClick={() => setEditing(true)}
      title="Clique para editar"
    >
      {displayValue}
      <svg className="inline-edit-icon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>
      </svg>
    </span>
  );
}
