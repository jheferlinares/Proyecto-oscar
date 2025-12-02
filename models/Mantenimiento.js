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
  modeloCodigo: {
    type: String
  },
  tipoMantenimiento: {
    type: String,
    required: true,
    enum: ['Preventivo', 'Correctivo', 'Predictivo']
  },
  fechaInicio: {
    type: Date,
    required: true
  },
  fechaTermino: {
    type: Date,
    required: true
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
  // Fase 1: Admisión
  firmaAdmision: {
    type: String // Base64 de la imagen de firma
  },
  fechaAdmision: {
    type: Date
  },
  nombreClienteAdmision: {
    type: String
  },
  // Fase 2: Entrega
  firmaEntrega: {
    type: String // Base64 de la imagen de firma
  },
  fechaEntrega: {
    type: Date
  },
  nombreClienteEntrega: {
    type: String
  },
  estadoServicio: {
    type: String,
    enum: ['pendiente', 'en_proceso', 'completado', 'entregado'],
    default: 'pendiente'
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

MantenimientoSchema.pre('save', function(next) {
  const fechaActual = new Date(this.fechaInicio);
  
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