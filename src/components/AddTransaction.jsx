import React from 'react'
import { FaPlus } from 'react-icons/fa'
import './AddTransaction.css'
import { Tag } from 'lucide-react'

const AddTransaction = ({ onClick, onClickCategory }) => {
  return (
    <div className="add-transaction">
      <button className="add-transaction-btn-category" onClick={onClickCategory}>
        <Tag />
      </button>
      <button className="add-transaction-btn" onClick={onClick}>
        <FaPlus />
      </button>
      
    </div>
  )
}

export default AddTransaction
