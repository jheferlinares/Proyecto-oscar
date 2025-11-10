const mongoose = require('mongoose');

const ModeloComputadoraSchema = new mongoose.Schema({
  nombre: { type: String, required: true },
  codigo: { type: String, required: true, unique: true },
  tipo: { type: String, enum: ['Desktop', 'Laptop', 'Servidor', 'All-in-One'], default: 'Desktop' },
  imagen: { type: String }, // ruta relativa dentro de /public/uploads
  creadoPor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  fechaCreacion: { type: Date, default: Date.now }
});

module.exports = mongoose.model('ModeloComputadora', ModeloComputadoraSchema);
