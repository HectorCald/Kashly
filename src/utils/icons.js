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
    FaHandshake, FaClipboardList,
    // Iconos adicionales para expandir categorías
    FaBed, FaCouch, FaChair, FaTable, FaLightbulb, FaDoorOpen, FaWindowMaximize,
    FaBath, FaShower, FaToilet, FaSink, FaTrash, FaBicycle, FaMotorcycle,
    FaShip, FaSubway, FaBus, FaTaxi, FaTruck, FaHamburger, FaPizzaSlice,
    FaIceCream, FaCoffee, FaWineGlass, FaBeer, FaAppleAlt, FaCarrot, FaFish,
    FaDrumstickBite, FaCheese, FaBreadSlice, FaChalkboardTeacher, FaMicroscope,
    FaFlask, FaAtom, FaPencilAlt, FaPen, FaHighlighter, FaStickyNote, FaFolder,
    FaFileAlt, FaDice, FaChess, FaPuzzlePiece, FaFilm, FaVideo, FaHeadphones,
    FaGuitar, FaDrum, FaMicrophone, FaTheaterMasks, FaBrush, FaHeartbeat,
    FaStethoscope, FaPills, FaSyringe, FaThermometerHalf, FaRunning, FaSwimmingPool,
    FaBasketballBall, FaFutbol, FaVolleyballBall, FaCloud, FaCloudRain, FaSnowflake,
    FaUmbrella, FaCompass, FaDragon, FaGhost, FaSkull, FaCross, FaPray,
    FaMosque, FaChurch, FaHatWizard,
    // Iconos de compras
    FaShoppingBag, FaShoppingBasket, FaStore, FaTags, FaBox, FaBoxOpen,
    FaBoxes, FaShippingFast
} from 'react-icons/fa'

export const ICON_CATEGORIES = {
    'Hogar': [FaHome, FaTv, FaLaptop, FaMobile, FaCamera, FaWrench, FaCog, FaBed, FaCouch, FaChair, FaTable, FaLightbulb, FaDoorOpen, FaWindowMaximize, FaBath, FaShower, FaToilet, FaSink, FaTrash, FaRecycle, FaLeaf],
    'Transporte': [FaCar, FaPlane, FaRocket, FaBolt, FaBicycle, FaMotorcycle, FaShip, FaSubway, FaBus, FaTaxi, FaTruck, FaRunning, FaCloud, FaCloudRain, FaSnowflake, FaUmbrella, FaCompass, FaMountain, FaTree, FaSeedling],
    'Comida': [FaUtensils, FaShoppingCart, FaBirthdayCake, FaHamburger, FaPizzaSlice, FaIceCream, FaCoffee, FaWineGlass, FaBeer, FaAppleAlt, FaCarrot, FaFish, FaDrumstickBite, FaCheese, FaBreadSlice, FaGift, FaTag, FaStar, FaGem],
    'Educación': [FaGraduationCap, FaBook, FaCode, FaChalkboardTeacher, FaMicroscope, FaFlask, FaAtom, FaPencilAlt, FaPen, FaHighlighter, FaStickyNote, FaFolder, FaFileAlt, FaUniversity, FaPalette, FaBrush, FaMagic, FaHatWizard, FaCrown],
    'Entretenimiento': [FaGamepad, FaMusic, FaPalette, FaMagic, FaDice, FaChess, FaPuzzlePiece, FaFilm, FaVideo, FaHeadphones, FaGuitar, FaDrum, FaMicrophone, FaTheaterMasks, FaBrush,  FaStar, FaGem, FaCrown, FaRocket],
    'Salud': [FaHeart, FaDumbbell, FaSun, FaMoon, FaHeartbeat, FaStethoscope, FaPills, FaSyringe, FaThermometerHalf, FaRunning, FaSwimmingPool, FaBasketballBall, FaFutbol, FaVolleyballBall,  FaLeaf, FaTree, FaSeedling, FaStar],
    'Naturaleza': [FaLeaf, FaTree, FaSeedling, FaMountain, FaCloud, FaCloudRain, FaSnowflake, FaUmbrella, FaSun, FaMoon, FaStar, FaCompass,  FaDragon, FaGhost, FaSkull, FaCross, FaPray, FaMosque, FaChurch, FaGem],
    'Símbolos': [FaStar, FaGem, FaCrown, FaGlobe, FaRecycle, FaDragon, FaGhost, FaSkull, FaCross, FaPray, FaMosque, FaChurch, FaHatWizard, FaRocket, FaMagic, FaPalette, FaBrush, FaLeaf, FaTree],
    'Elementos': [FaFire, FaWater, FaWind, FaBolt, FaSnowflake, FaCloud, FaSun, FaMoon, FaStar, FaCompass, FaMountain, FaTree, FaSeedling,  FaDragon, FaGhost, FaSkull, FaCross, FaPray, FaMosque, FaChurch],
    'Finanzas': [FaDollarSign, FaCreditCard, FaPiggyBank, FaChartLine, FaChartBar, FaCoins, FaMoneyBillWave, FaUniversity, FaHandHoldingUsd, FaCalculator, FaReceipt, FaWallet, FaShieldAlt, FaLock, FaUnlock, FaKey, FaFileInvoiceDollar, FaPercent, FaBalanceScale, FaHandshake, FaClipboardList],
    'Compras': [FaShoppingBag, FaShoppingBasket, FaStore,  FaTags, FaBox, FaBoxOpen, FaBoxes, FaShippingFast, FaShoppingCart, FaGift, FaTag, FaPercent, FaReceipt,  FaCreditCard, FaMoneyBillWave, FaCoins, FaWallet, FaPiggyBank, FaHandshake]
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
    'FaClipboardList': FaClipboardList,
    // Iconos adicionales para expandir categorías
    'FaBed': FaBed,
    'FaCouch': FaCouch,
    'FaChair': FaChair,
    'FaTable': FaTable,
    'FaLightbulb': FaLightbulb,
    'FaDoorOpen': FaDoorOpen,
    'FaWindowMaximize': FaWindowMaximize,
    'FaBath': FaBath,
    'FaShower': FaShower,
    'FaToilet': FaToilet,
    'FaSink': FaSink,
    'FaTrash': FaTrash,
    'FaBicycle': FaBicycle,
    'FaMotorcycle': FaMotorcycle,
    'FaShip': FaShip,
    'FaSubway': FaSubway,
    'FaBus': FaBus,
    'FaTaxi': FaTaxi,
    'FaTruck': FaTruck,
    'FaHamburger': FaHamburger,
    'FaPizzaSlice': FaPizzaSlice,
    'FaIceCream': FaIceCream,
    'FaCoffee': FaCoffee,
    'FaWineGlass': FaWineGlass,
    'FaBeer': FaBeer,
    'FaAppleAlt': FaAppleAlt,
    'FaCarrot': FaCarrot,
    'FaFish': FaFish,
    'FaDrumstickBite': FaDrumstickBite,
    'FaCheese': FaCheese,
    'FaBreadSlice': FaBreadSlice,
    'FaChalkboardTeacher': FaChalkboardTeacher,
    'FaMicroscope': FaMicroscope,
    'FaFlask': FaFlask,
    'FaAtom': FaAtom,
    'FaPencilAlt': FaPencilAlt,
    'FaPen': FaPen,
    'FaHighlighter': FaHighlighter,
    'FaStickyNote': FaStickyNote,
    'FaFolder': FaFolder,
    'FaFileAlt': FaFileAlt,
    'FaDice': FaDice,
    'FaChess': FaChess,
    'FaPuzzlePiece': FaPuzzlePiece,
    'FaFilm': FaFilm,
    'FaVideo': FaVideo,
    'FaHeadphones': FaHeadphones,
    'FaGuitar': FaGuitar,
    'FaDrum': FaDrum,
    'FaMicrophone': FaMicrophone,
    'FaTheaterMasks': FaTheaterMasks,
    'FaBrush': FaBrush,
    'FaHeartbeat': FaHeartbeat,
    'FaStethoscope': FaStethoscope,
    'FaPills': FaPills,
    'FaSyringe': FaSyringe,
    'FaThermometerHalf': FaThermometerHalf,
    'FaRunning': FaRunning,
    'FaSwimmingPool': FaSwimmingPool,
    'FaBasketballBall': FaBasketballBall,
    'FaFutbol': FaFutbol,
    'FaVolleyballBall': FaVolleyballBall,
    'FaCloud': FaCloud,
    'FaCloudRain': FaCloudRain,
    'FaSnowflake': FaSnowflake,
    'FaUmbrella': FaUmbrella,
    'FaCompass': FaCompass,
    'FaSeedling': FaSeedling,
    'FaDragon': FaDragon,
    'FaGhost': FaGhost,
    'FaSkull': FaSkull,
    'FaCross': FaCross,
    'FaPray': FaPray,
    'FaMosque': FaMosque,
    'FaChurch': FaChurch,
    'FaHatWizard': FaHatWizard,
    // Iconos de compras
    'FaShoppingBag': FaShoppingBag,
    'FaShoppingBasket': FaShoppingBasket,
    'FaStore': FaStore,
    'FaTags': FaTags,
    'FaBox': FaBox,
    'FaBoxOpen': FaBoxOpen,
    'FaBoxes': FaBoxes,
    'FaShippingFast': FaShippingFast
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
