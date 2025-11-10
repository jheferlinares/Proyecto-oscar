const mongoose = require('mongoose');

// Simplified single-database helper: use the mongoose default connection (connected in app.js)
const connectDatabases = async () => {
  try {
    // The application already connects via mongoose.connect in app.js.
    // Return the mongoose connection as the primary DB and no secondary DB.
    const primaryDB = mongoose.connection;
    const secondaryDB = null;
    return { primaryDB, secondaryDB };
  } catch (error) {
    console.error('❌ Error conectando a la base de datos principal:', error);
    throw error;
  }
};

// Write helper that targets only the primary database (mongoose.connection)
const syncWrite = async (collectionName, operation, data) => {
  try {
    const primaryCollection = mongoose.connection.collection(collectionName);
    let result;
    switch (operation) {
      case 'insertOne':
        result = await primaryCollection.insertOne(data);
        break;
      case 'updateOne':
        result = await primaryCollection.updateOne(data.filter, data.update);
        break;
      case 'deleteOne':
        result = await primaryCollection.deleteOne(data);
        break;
      default:
        throw new Error(`Operación no soportada: ${operation}`);
    }
    return result;
  } catch (error) {
    console.error('❌ Error al escribir en la base principal:', error);
    throw error;
  }
};

module.exports = { connectDatabases, syncWrite, primaryDB: () => mongoose.connection, secondaryDB: () => null };