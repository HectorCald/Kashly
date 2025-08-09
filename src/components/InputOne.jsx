import React from 'react'
import './InputOne.css'

function InputOne({ placeholder, type, value, onChange }) {
    return (
        <div className="input-one">
            <input 
                type={type} 
                placeholder={placeholder} 
                value={value || ''}
                onChange={onChange}
            />
        </div>
    )
}

export default InputOne;