import React from 'react'
import { FaSearch } from 'react-icons/fa'
import './SearchBar.css'

const SearchBar = ({ onClick }) => {
  return (
    <div className="search-bar">
      <button className="search-bar-btn" onClick={onClick}>
        <FaSearch /> Buscar
      </button>
    </div>
  )
}

export default SearchBar
