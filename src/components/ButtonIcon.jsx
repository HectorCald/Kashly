import React from 'react'
import './ButtonIcon.css'

function ButtonIcon({ onClick, icon, tipo = 'gray' }) {
  return (
    <button className={`button-icon ${tipo}`} onClick={onClick}>
      {icon}
    </button>
  )
}

export default ButtonIcon