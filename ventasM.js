const mongoose = require('mongoose');

const ventaSchema = new mongoose.Schema({
  Usuario: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true },
  Producto: { type: mongoose.Schema.Types.ObjectId, ref: 'Producto', required: true },
});

module.exports = mongoose.model('Venta', ventaSchema);
