/* ===== IMPORTACIONES ===== */
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';


dotenv.config();

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));



/* ===== CONFIGURACIÓN DE VISTAS ===== */
app.set('view engine', 'ejs');
app.set('views', join(__dirname, 'views'));
app.use(express.static(join(__dirname, 'public')));



/* ===== RUTAS DE VISTAS ===== */
app.get('/', (req, res) => {
    res.render('inicio');
});

/* ===== RUTAS PWA ===== */
app.get('/manifest.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.sendFile(join(__dirname, 'public', 'manifest.json'));
});

app.get('/sw.js', (req, res) => {
    res.setHeader('Content-Type', 'application/javascript');
    res.sendFile(join(__dirname, 'public', 'sw.js'));
});






/* ===== INICIALIZACIÓN DEL SERVIDOR ===== */
const port = process.env.PORT;
app.listen(port, () => {
    console.log(`🚀 Servidor corriendo en el puerto ${port}`);
});

export default app;