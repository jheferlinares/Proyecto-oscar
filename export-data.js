const mongoose = require('mongoose');
require('dotenv').config();

async function exportData() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Conectado a MongoDB');
    
    // Exportar usuarios
    const users = await mongoose.connection.db.collection('users').find({}).toArray();
    console.log(`📤 Exportando ${users.length} usuarios`);
    
    // Exportar mantenimientos
    const mantenimientos = await mongoose.connection.db.collection('mantenimientos').find({}).toArray();
    console.log(`📤 Exportando ${mantenimientos.length} mantenimientos`);
    
    // Guardar en archivos
    const fs = require('fs');
    fs.writeFileSync('users-export.json', JSON.stringify(users, null, 2));
    fs.writeFileSync('mantenimientos-export.json', JSON.stringify(mantenimientos, null, 2));
    
    console.log('✅ Datos exportados a users-export.json y mantenimientos-export.json');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

exportData();