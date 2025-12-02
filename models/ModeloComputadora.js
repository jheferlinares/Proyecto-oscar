const mongoose = require('mongoose');

const ModeloComputadoraSchema = new mongoose.Schema({
  nombre: { type: String, required: true },
  codigo: { type: String, required: true, unique: true },
  tipo: { type: String, enum: ['Desktop', 'Laptop', 'Servidor', 'All-in-One'], default: 'Desktop' },
  procesador: { type: String },
  tipoRam: { type: String, enum: ['DDR3', 'DDR4', 'DDR5'] },
  memoriaRam: { type: String },
  discoDuro: { type: String },
  tarjetaGrafica: { type: String },
  imagen: { type: String }, 
  creadoPor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  fechaCreacion: { type: Date, default: Date.now }
});

module.exports = mongoose.model('ModeloComputadora', ModeloComputadoraSchema);
