const mongoose = require('mongoose');
require('dotenv').config();

async function importData() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Conectado a MongoDB');
    
    const fs = require('fs');
    
    // Leer archivos exportados
    const users = JSON.parse(fs.readFileSync('users-export.json', 'utf8'));
    const mantenimientos = JSON.parse(fs.readFileSync('mantenimientos-export.json', 'utf8'));
    
    // Limpiar colecciones existentes
    await mongoose.connection.db.collection('users').deleteMany({});
    await mongoose.connection.db.collection('mantenimientos').deleteMany({});
    
    // Importar usuarios
    if (users.length > 0) {
      await mongoose.connection.db.collection('users').insertMany(users);
      console.log(`✅ Importados ${users.length} usuarios`);
    }
    
    // Importar mantenimientos
    if (mantenimientos.length > 0) {
      await mongoose.connection.db.collection('mantenimientos').insertMany(mantenimientos);
      console.log(`✅ Importados ${mantenimientos.length} mantenimientos`);
    }
    
    console.log('🎉 Importación completada');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

importData();