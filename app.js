require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const passport = require('passport');
const flash = require('express-flash');
const methodOverride = require('method-override');
const path = require('path');

const app = express();

// Configuración de la base de datos
// Opción 1: MongoDB Atlas (recomendado)
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://admin:admin123@cluster0.mongodb.net/mantenimiento_pc?retryWrites=true&w=majority';

// Opción 2: MongoDB local (descomenta si tienes MongoDB instalado localmente)
// const MONGODB_URI = 'mongodb://localhost:27017/mantenimiento_pc';

mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('✅ Conectado a MongoDB');
}).catch(err => {
  console.error('❌ Error conectando a MongoDB:', err.message);
  console.log('\n📋 Opciones para solucionar:');
  console.log('1. Usar MongoDB Atlas (gratis): https://www.mongodb.com/atlas');
  console.log('2. Instalar MongoDB localmente: https://www.mongodb.com/try/download/community');
  process.exit(1);
});

// Configuración de Passport
require('./config/passport')(passport);

// Middleware
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(methodOverride('_method'));
app.use(express.static(path.join(__dirname, 'public')));

// Configuración de sesiones
app.use(session({
  secret: 'mantenimiento_secret_key',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: MONGODB_URI
  })
}));

app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

// Variables globales
app.use((req, res, next) => {
  res.locals.user = req.user || null;
  next();
});

// Motor de plantillas
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Rutas
app.use('/', require('./routes/index'));
app.use('/auth', require('./routes/auth'));
app.use('/mantenimientos', require('./routes/mantenimientos'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});