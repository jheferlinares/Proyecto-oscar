const mongoose = require('mongoose');

const MantenimientoSchema = new mongoose.Schema({
  tipo: {
    type: String,
    required: true,
    enum: ['Desktop', 'Laptop', 'Servidor', 'All-in-One']
  },
  modelo: {
    type: String,
    required: true
  },
  tipoMantenimiento: {
    type: String,
    required: true,
    enum: ['Preventivo', 'Correctivo', 'Predictivo']
  },
  fecha: {
    type: Date,
    required: true
  },
  hora: {
    type: String,
    required: true
  },
  tiempoMantenimiento: {
    type: Number,
    required: true // en minutos
  },
  tecnico: {
    type: String,
    required: true
  },
  razon: {
    type: String,
    required: true
  },
  proximoMantenimiento: {
    type: Date
  },
  observaciones: {
    type: String
  },
  creadoPor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  fechaCreacion: {
    type: Date,
    default: Date.now
  }
});

// Middleware para calcular próximo mantenimiento automáticamente
MantenimientoSchema.pre('save', function(next) {
  const fechaActual = new Date(this.fecha);
  
  // Lógica de mantenimiento según tipo
  switch(this.tipoMantenimiento) {
    case 'Preventivo':
      fechaActual.setMonth(fechaActual.getMonth() + 3); // cada 3 meses
      break;
    case 'Correctivo':
      fechaActual.setMonth(fechaActual.getMonth() + 1); // revisión en 1 mes
      break;
    case 'Predictivo':
      fechaActual.setMonth(fechaActual.getMonth() + 6); // cada 6 meses
      break;
  }
  
  this.proximoMantenimiento = fechaActual;
  next();
});

module.exports = mongoose.model('Mantenimiento', MantenimientoSchema);