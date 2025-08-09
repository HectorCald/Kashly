import React, { useState, useRef, useEffect } from 'react'
import { FaChevronDown } from 'react-icons/fa'
import './CustomSelect.css'

const CustomSelect = ({ 
  options = [], 
  value = '', 
  onChange = () => {}, 
  placeholder = 'Seleccionar...',
  className = '',
  style = {}
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedValue, setSelectedValue] = useState(value)
  const dropdownRef = useRef(null)

  useEffect(() => {
    setSelectedValue(value)
  }, [value])

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSelect = (optionValue, optionLabel) => {
    setSelectedValue(optionValue)
    onChange(optionValue)
    setIsOpen(false)
  }

  const getDisplayValue = () => {
    if (!selectedValue) return placeholder
    const option = options.find(opt => 
      (typeof opt === 'object' ? opt.value : opt) === selectedValue
    )
    return typeof option === 'object' ? option.label : option || selectedValue
  }

  return (
    <div className={`custom-selector ${className}`} ref={dropdownRef}>
      <div 
        className={`custom-select ${isOpen ? 'open' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        style={style}
      >
        <span className="custom-select-value">{getDisplayValue()}</span>
        <FaChevronDown className={`custom-select-arrow ${isOpen ? 'rotated' : ''}`} />
      </div>
      
      {isOpen && (
        <div className="custom-select-dropdown">
          {options.map((option, index) => {
            const optionValue = typeof option === 'object' ? option.value : option
            const optionLabel = typeof option === 'object' ? option.label : option
            const isSelected = optionValue === selectedValue
            
            return (
              <div
                key={index}
                className={`custom-select-option ${isSelected ? 'selected' : ''}`}
                onClick={() => handleSelect(optionValue, optionLabel)}
              >
                {optionLabel}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default CustomSelect
