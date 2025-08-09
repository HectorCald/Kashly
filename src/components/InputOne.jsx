import React, { forwardRef } from 'react'
import './InputOne.css'

const InputOne = forwardRef(({ placeholder, type, value, onChange }, ref) => {
    return (
        <div className="input-one">
            <input 
                ref={ref}
                type={type} 
                placeholder={placeholder} 
                value={value || ''}
                onChange={onChange}
            />
        </div>
    )
});

export default InputOne;