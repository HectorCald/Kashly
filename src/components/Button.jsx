import React from 'react'
import './Button.css'

function Button({ children, onClick, icon, tipo }) {
  return (
    <button className={`button ${tipo}`} onClick={onClick}>{icon}{children}</button>
  )
}

export default Button