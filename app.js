require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const passport = require('passport');
const flash = require('express-flash');
const methodOverride = require('method-override');
const path = require('path');
const multer = require('multer');

const app = express();

// Configuración de bases de datos duales
const { connectDatabases } = require('./config/database');

// Conectar a Mongoose primero
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('✅ Mongoose conectado a base principal');
  // Luego conectar las bases duales
  return connectDatabases();
}).then(() => {
  console.log('✅ Bases de datos duales conectadas');
}).catch(err => {
  console.error('❌ Error conectando bases de datos:', err.message);
  process.exit(1);
});

// Configuración de Passport
require('./config/passport')(passport);

// Middleware
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(methodOverride('_method'));
app.use(express.static(path.join(__dirname, 'public')));

// configurar multer para subir imágenes de modelos
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, 'public', 'uploads'));
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const name = file.fieldname + '-' + Date.now() + ext;
    cb(null, name);
  }
});
const upload = multer({ storage });

// Configuración de sesiones
app.use(session({
  secret: process.env.SESSION_SECRET || 'mantenimiento_secret_key',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGODB_URI
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
// rutas para modelos de computadora (subida de imagenes)
app.use('/modelos', require('./routes/modelos')(upload));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});