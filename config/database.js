const mongoose = require('mongoose');

const connectDatabases = async () => {
  try {
    const primaryDB = mongoose.connection;
    return { primaryDB };
  } catch (error) {
    console.error('❌ Error conectando a la base de datos principal:', error);
    throw error;
  }
};

const primaryDB = () => mongoose.connection;

module.exports = { connectDatabases, primaryDB };