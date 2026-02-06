'use client'

import { useState, useRef, useEffect, useMemo } from 'react'
import { Search, X, Check, ChevronDown } from 'lucide-react'
import styles from './SearchSelect.module.css'

export interface SearchSelectOption {
  value: string | number
  label: string
  sublabel?: string
  icon?: React.ReactNode
}

interface SearchSelectProps {
  options: SearchSelectOption[]
  value?: string | number | null
  onChange: (value: string | number | null) => void
  placeholder?: string
  searchPlaceholder?: string
  emptyMessage?: string
  icon?: React.ReactNode
  disabled?: boolean
  className?: string
}

export function SearchSelect({
  options,
  value,
  onChange,
  placeholder = 'Seleccionar...',
  searchPlaceholder = 'Buscar...',
  emptyMessage = 'No hay resultados',
  icon,
  disabled = false,
  className = '',
}: SearchSelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [highlightedIndex, setHighlightedIndex] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  const selectedOption = useMemo(() => 
    options.find(opt => opt.value === value),
    [options, value]
  )

  const filteredOptions = useMemo(() => {
    if (!search.trim()) return options
    const searchLower = search.toLowerCase()
    return options.filter(opt => 
      opt.label.toLowerCase().includes(searchLower) ||
      opt.sublabel?.toLowerCase().includes(searchLower)
    )
  }, [options, search])

  useEffect(() => {
    setHighlightedIndex(0)
  }, [filteredOptions])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
        setSearch('')
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

  useEffect(() => {
    if (isOpen && listRef.current) {
      const highlighted = listRef.current.children[highlightedIndex] as HTMLElement
      if (highlighted) {
        highlighted.scrollIntoView({ block: 'nearest' })
      }
    }
  }, [highlightedIndex, isOpen])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
        e.preventDefault()
        setIsOpen(true)
      }
      return
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setHighlightedIndex(prev => 
          prev < filteredOptions.length - 1 ? prev + 1 : prev
        )
        break
      case 'ArrowUp':
        e.preventDefault()
        setHighlightedIndex(prev => prev > 0 ? prev - 1 : 0)
        break
      case 'Enter':
        e.preventDefault()
        if (filteredOptions[highlightedIndex]) {
          handleSelect(filteredOptions[highlightedIndex])
        }
        break
      case 'Escape':
        e.preventDefault()
        setIsOpen(false)
        setSearch('')
        break
    }
  }

  const handleSelect = (option: SearchSelectOption) => {
    onChange(option.value)
    setIsOpen(false)
    setSearch('')
  }

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    onChange(null)
    setSearch('')
  }

  return (
    <div 
      ref={containerRef} 
      className={`${styles.container} ${className} ${disabled ? styles.disabled : ''}`}
    >
      <button
        type="button"
        className={`${styles.trigger} ${isOpen ? styles.triggerOpen : ''} ${selectedOption ? styles.hasValue : ''}`}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
      >
        <div className={styles.triggerContent}>
          {icon && <span className={styles.triggerIcon}>{icon}</span>}
          {selectedOption ? (
            <div className={styles.selectedValue}>
              <span className={styles.selectedLabel}>{selectedOption.label}</span>
              {selectedOption.sublabel && (
                <span className={styles.selectedSublabel}>{selectedOption.sublabel}</span>
              )}
            </div>
          ) : (
            <span className={styles.placeholder}>{placeholder}</span>
          )}
        </div>
        <div className={styles.triggerActions}>
          {selectedOption && (
            <span
              role="button"
              className={styles.clearBtn}
              onClick={handleClear}
              tabIndex={-1}
            >
              <X size={14} />
            </span>
          )}
          <ChevronDown 
            size={16} 
            className={`${styles.chevron} ${isOpen ? styles.chevronOpen : ''}`} 
          />
        </div>
      </button>

      {isOpen && (
        <div className={styles.dropdown}>
          <div className={styles.searchWrapper}>
            <Search size={16} className={styles.searchIcon} />
            <input
              ref={inputRef}
              type="text"
              className={styles.searchInput}
              placeholder={searchPlaceholder}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={handleKeyDown}
            />
          </div>
          
          <div ref={listRef} className={styles.optionsList}>
            {filteredOptions.length === 0 ? (
              <div className={styles.emptyMessage}>{emptyMessage}</div>
            ) : (
              filteredOptions.map((option, index) => (
                <button
                  key={option.value}
                  type="button"
                  className={`${styles.option} ${index === highlightedIndex ? styles.optionHighlighted : ''} ${option.value === value ? styles.optionSelected : ''}`}
                  onClick={() => handleSelect(option)}
                  onMouseEnter={() => setHighlightedIndex(index)}
                >
                  {option.icon && <span className={styles.optionIcon}>{option.icon}</span>}
                  <div className={styles.optionContent}>
                    <span className={styles.optionLabel}>{option.label}</span>
                    {option.sublabel && (
                      <span className={styles.optionSublabel}>{option.sublabel}</span>
                    )}
                  </div>
                  {option.value === value && (
                    <Check size={16} className={styles.checkIcon} />
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
