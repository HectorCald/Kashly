import React from 'react'
import { 
    FaHome, FaCar, FaUtensils, FaShoppingCart, FaPlane, 
    FaGraduationCap, FaHeart, FaGamepad, FaMusic, FaBook, FaDumbbell,
    FaBriefcase, FaWrench, FaMobile, FaLaptop, FaTv, FaCamera,
    FaGift, FaBirthdayCake, FaPaw, FaLeaf, FaSun, FaMoon,
    FaStar, FaGem, FaCrown, FaRocket, FaMagic, FaPalette,
    FaCode, FaCog, FaBolt, FaFire, FaWater, FaWind,
    FaMountain, FaTree, FaSeedling, FaRecycle, FaGlobe, FaTag,
    // Iconos de finanzas
    FaDollarSign, FaCreditCard, FaPiggyBank, FaChartLine, FaChartBar,
    FaCoins, FaMoneyBillWave, FaUniversity, FaHandHoldingUsd,
    FaCalculator, FaReceipt, FaWallet, FaShieldAlt, FaLock,
    FaUnlock, FaKey, FaFileInvoiceDollar, FaPercent, FaBalanceScale,
    FaHandshake, FaClipboardList
} from 'react-icons/fa'

export const ICON_CATEGORIES = {
    'Hogar': [FaHome, FaTv, FaLaptop, FaMobile, FaCamera, FaWrench, FaCog],
    'Transporte': [FaCar, FaPlane, FaRocket, FaBolt],
    'Comida': [FaUtensils, FaShoppingCart, FaBirthdayCake],
    'Educación': [FaGraduationCap, FaBook, FaCode],
    'Entretenimiento': [FaGamepad, FaMusic, FaPalette, FaMagic],
    'Salud': [FaHeart, FaDumbbell, FaSun, FaMoon],
    'Naturaleza': [FaLeaf, FaTree, FaSeedling, FaMountain],
    'Símbolos': [FaStar, FaGem, FaCrown, FaGlobe, FaRecycle],
    'Elementos': [FaFire, FaWater, FaWind, FaBolt],
    'Finanzas': [FaDollarSign, FaCreditCard, FaPiggyBank, FaChartLine, FaChartBar, FaCoins, FaMoneyBillWave, FaUniversity, FaHandHoldingUsd, FaCalculator, FaReceipt, FaWallet, FaShieldAlt, FaLock, FaUnlock, FaKey, FaFileInvoiceDollar, FaPercent, FaBalanceScale, FaHandshake, FaClipboardList]
}

// Crear un mapeo de nombres a componentes
const ICON_MAP = {
    'FaHome': FaHome,
    'FaCar': FaCar,
    'FaUtensils': FaUtensils,
    'FaShoppingCart': FaShoppingCart,
    'FaPlane': FaPlane,
    'FaGraduationCap': FaGraduationCap,
    'FaHeart': FaHeart,
    'FaGamepad': FaGamepad,
    'FaMusic': FaMusic,
    'FaBook': FaBook,
    'FaDumbbell': FaDumbbell,
    'FaBriefcase': FaBriefcase,
    'FaWrench': FaWrench,
    'FaMobile': FaMobile,
    'FaLaptop': FaLaptop,
    'FaTv': FaTv,
    'FaCamera': FaCamera,
    'FaGift': FaGift,
    'FaBirthdayCake': FaBirthdayCake,
    'FaPaw': FaPaw,
    'FaLeaf': FaLeaf,
    'FaSun': FaSun,
    'FaMoon': FaMoon,
    'FaStar': FaStar,
    'FaGem': FaGem,
    'FaCrown': FaCrown,
    'FaRocket': FaRocket,
    'FaMagic': FaMagic,
    'FaPalette': FaPalette,
    'FaCode': FaCode,
    'FaCog': FaCog,
    'FaBolt': FaBolt,
    'FaFire': FaFire,
    'FaWater': FaWater,
    'FaWind': FaWind,
    'FaMountain': FaMountain,
    'FaTree': FaTree,
    'FaSeedling': FaSeedling,
    'FaRecycle': FaRecycle,
    'FaGlobe': FaGlobe,
    'FaTag': FaTag,
    // Iconos de finanzas
    'FaDollarSign': FaDollarSign,
    'FaCreditCard': FaCreditCard,
    'FaPiggyBank': FaPiggyBank,
    'FaChartLine': FaChartLine,
    'FaChartBar': FaChartBar,
    'FaCoins': FaCoins,
    'FaMoneyBillWave': FaMoneyBillWave,
    'FaUniversity': FaUniversity,
    'FaHandHoldingUsd': FaHandHoldingUsd,
    'FaCalculator': FaCalculator,
    'FaReceipt': FaReceipt,
    'FaWallet': FaWallet,
    'FaShieldAlt': FaShieldAlt,
    'FaLock': FaLock,
    'FaUnlock': FaUnlock,
    'FaKey': FaKey,
    'FaFileInvoiceDollar': FaFileInvoiceDollar,
    'FaPercent': FaPercent,
    'FaBalanceScale': FaBalanceScale,
    'FaHandshake': FaHandshake,
    'FaClipboardList': FaClipboardList
}

export const getIconName = (iconComponent) => {
    // Si es un elemento JSX, obtener el tipo
    if (React.isValidElement(iconComponent)) {
        const componentType = iconComponent.type;
        // Buscar el nombre del componente en el mapeo
        for (const [name, component] of Object.entries(ICON_MAP)) {
            if (component === componentType) {
                return name;
            }
        }
    }
    
    // Si es una función (componente React)
    if (typeof iconComponent === 'function') {
        for (const [name, component] of Object.entries(ICON_MAP)) {
            if (component === iconComponent) {
                return name;
            }
        }
    }
    
    return 'FaTag';
}

export const getIconComponent = (iconName) => {
    return ICON_MAP[iconName] || FaTag;
}
