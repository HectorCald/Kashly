import React from 'react'
import './InputNormal.css'

function InputNormal({ placeholder, value, onChange }) {
  return (
    <div className="input-normal">
        <input type="text" placeholder={placeholder} value={value} onChange={onChange} />
    </div>
  )
}

export default InputNormal