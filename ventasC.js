const express = require('express');
const Venta = require('../models/ventasM');
const Usuario = require('../models/usuariosM');
const Producto = require('../models/productosM');
const router = express.Router();

const PrimerLetraMayus = (string) => {
  const palabras = string.trim().toLowerCase().split(' ');
  const palabrasMayusculas  = palabras.map(
    (palabra) => palabra.charAt(0).toUpperCase() + palabra.slice(1)
  );
  return palabrasMayusculas.join(' ');
};

// Agregar una nueva venta
router.post('/crear', async (req, res) => {
  try {
    const { email, nombreProducto } = req.body;
    const productoSanitizado = PrimerLetraMayus(nombreProducto.trim());
    const emailSanitizado = email.trim();

    console.log('Email:', emailSanitizado);
    console.log('Nombre del producto:', productoSanitizado);
    const usuario = await Usuario.findOne({ email: emailSanitizado });
    const producto = await Producto.findOne({ nombreProducto: productoSanitizado });
    if (!usuario || !producto) {
      return res.status(404).json({ message: 'Usuario o Producto no encontrados' });
    }
    
    const venta = new Venta({
      Usuario: usuario._id,
      Producto: producto._id,
    });

    const result = await venta.save();

    // Agregar el _id de la venta al array 'compras' del usuario
    usuario.compras.push(result._id);
    producto.ventas.push(result._id);

    await usuario.save();
    await producto.save();
    
    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

// Obtener detalles de una venta por ID
router.get('/obtener/:ventaId', async (req, res) => {
  try {
    const ventaId = req.params.ventaId.trim();
    const venta = await Venta
      .findById(ventaId)
      .populate('Usuario', 'nombre apellido email')
      .populate('Producto', 'nombreProducto nombre talla marca cantidad precio imagen'); 

    if (!venta) {
      return res.status(404).json({ message: 'Venta no encontrada' });
    }

    res.json(venta);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener detalles de la venta' });
  }
});

// Obtener todas las ventas
router.get('/obtenertodas', async (req, res) => {
  try {
    const ventas = await Venta.find()
      .populate('Usuario', 'nombre apellido email')
      .populate('Producto', 'nombreProducto nombre talla marca cantidad imagen');
    res.json(ventas);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener todas las ventas' });
  }
});

// Eliminar una venta por ID
router.delete('/borrar/:ventaId', async (req, res) => {
  try {
    const ventaId = req.params.ventaId.trim();
    const result = await Venta.findByIdAndDelete(ventaId);

    if (!result) {
      return res.status(404).json({ message: 'Venta no encontrada' });
    }

    res.json({ message: 'Venta eliminada con éxito' });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar la venta' });
  }
});


module.exports = router;
