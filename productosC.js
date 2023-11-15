const express = require('express');
const Producto = require('../models/productosM');
const sanitizeHtml = require('sanitize-html');
const cloudinary = require('cloudinary').v2;
const multer = require('multer');
const router = express.Router();

cloudinary.config({
  cloud_name: 'dtayrgscb',
  api_key: '334341624515751',
  api_secret: 'm3CncmM9O83Zat7LGwDZhE7VO64',
});

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const PrimerLetraMayus = (string) => {
  const palabras = string.trim().toLowerCase().split(' ');
  const palabrasMayusculas  = palabras.map(
    (palabra) => palabra.charAt(0).toUpperCase() + palabra.slice(1)
  );
  return palabrasMayusculas.join(' ');
};

// Agregar un nuevo producto
router.post('/crear', upload.single('imagen'), async (req, res) => {
  try {
    const { nombreProducto, talla, marca, categoria, cantidad, precio } = req.body;
    const imagenBuffer = req.file.buffer;

    const result = await cloudinary.uploader.upload_stream({ resource_type: 'image' }, async (error, result) => {
      if (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
      } else {
        const producto = new Producto({
          nombreProducto: sanitizeHtml(PrimerLetraMayus(nombreProducto)).trim(),
          talla: sanitizeHtml(PrimerLetraMayus(talla)).trim(),
          marca: sanitizeHtml(PrimerLetraMayus(marca)).trim(),
          categoria: sanitizeHtml(PrimerLetraMayus(categoria)).trim(),
          cantidad: sanitizeHtml(cantidad).trim(),
          precio: sanitizeHtml(precio).trim(),
          imagen: result.secure_url,
        });

        await producto.validate();
        const resultadoProducto = await producto.save();
     
        res.json({ message: 'Producto agregado con éxito', imageUrl: result.secure_url, producto: resultadoProducto });
      }
    }).end(imagenBuffer);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

// Actualizar un producto por su nombre
router.put('/actualizar/:nombreProducto', upload.single('imagen'), async (req, res) => {
  try {
    const nombreProducto = PrimerLetraMayus(req.params.nombreProducto.trim());
    const productoActualizado = req.body;

    // Validar si hay campos vacíos
    const camposRequeridos = ['nombreProducto', 'talla', 'marca', 'categoria', 'cantidad', 'precio'];
    for (const campo of camposRequeridos) {
      if (!productoActualizado[campo]) {
        return res.status(400).json({ error: `El campo ${campo} no puede estar vacío` });
      }
    }

    // Validar si la talla es válida
    const tallasPermitidas = ['Chica', 'Mediana', 'Grande', 'Extragrande', 'chica', 'mediana', 'grande', 'extragrande'];
    if (productoActualizado.talla && !tallasPermitidas.includes(productoActualizado.talla)) {
      return res.status(400).json({ error: 'La talla proporcionada no es válida' });
    }

    // Validar si la categoria es válida
    const categoriasPermitidas = ['Hombre', 'hombre', 'Mujer', 'mujer'];
    if (productoActualizado.talla && !categoriasPermitidas.includes(productoActualizado.categoria)) {
      return res.status(400).json({ error: 'La categoria proporcionada no es válida' });
    }

    // Sanitizar y formatear campos
    productoActualizado.nombreProducto = PrimerLetraMayus(sanitizeHtml(productoActualizado.nombreProducto));
    productoActualizado.categoria = PrimerLetraMayus(sanitizeHtml(productoActualizado.categoria));
    productoActualizado.talla = PrimerLetraMayus(sanitizeHtml(productoActualizado.talla));
    productoActualizado.marca = PrimerLetraMayus(sanitizeHtml(productoActualizado.marca));

    // Actualizar la imagen solo si se proporciona una nueva imagen
    if (req.file) {
      const imagenBuffer = req.file.buffer;

      // Esperar a que la imagen se cargue en Cloudinary
      const imagenResult = await cloudinary.uploader.upload_stream({ resource_type: 'image' }, async (error, result) => {
        if (error) {
          console.error(error);
          res.status(500).json({ error: error.message });
        } else {
          // Actualizar la propiedad de la imagen en el objeto productoActualizado
          productoActualizado.imagen = result.secure_url;

          // Actualizar el producto en la base de datos
          const updatedProduct = await Producto.findOneAndUpdate(
            { nombreProducto: nombreProducto },
            { $set: productoActualizado },
            { new: true }
          );

          if (!updatedProduct) {
            return res.status(404).json({ message: 'Producto no encontrado' });
          }

          // Devolver la respuesta con el producto actualizado
          res.json(updatedProduct);
        }
      }).end(imagenBuffer);
    } else {
      // Si no se proporciona una nueva imagen, simplemente actualizar el producto en la base de datos
      const updatedProduct = await Producto.findOneAndUpdate(
        { nombreProducto: nombreProducto },
        { $set: productoActualizado },
        { new: true }
      );

      if (!updatedProduct) {
        return res.status(404).json({ message: 'Producto no encontrado' });
      }

      // Devolver la respuesta con el producto actualizado
      res.json(updatedProduct);
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

// Obtener un producto por su nombre
router.get('/obtener/:nombreProducto', async (req, res) => {
  try {
    const nombreProductoFormateado = PrimerLetraMayus(req.params.nombreProducto.trim());

    const producto = await Producto.findOne({ nombreProducto: nombreProductoFormateado });
    if (!producto) {
      return res.status(404).json({ message: 'Producto no encontrado' });
    }
    res.json(producto);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener el producto' });
  }
});

// Obtener todos los productos
router.get('/obtenerProductos', async (req, res) => {
  try {
    const productos = await Producto.find();
    res.json(productos);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener todos los productos' });
  }
});

// Obtener todos los productos por categoría
router.get('/obtenerCategoria/:categoria', async (req, res) => {
  try {
    const categoria = PrimerLetraMayus(sanitizeHtml(req.params.categoria.trim()));

    const productos = await Producto.find({ categoria });
    const productosFormateados = productos.map(producto => {
      return {
        nombreProducto: PrimerLetraMayus(sanitizeHtml(producto.nombreProducto)).trim(),
        talla: PrimerLetraMayus(sanitizeHtml(producto.talla)).trim(),
        marca: PrimerLetraMayus(sanitizeHtml(producto.marca)).trim(),
        categoria: PrimerLetraMayus(sanitizeHtml(producto.categoria)).trim(),
        cantidad: producto.cantidad,
        precio: producto.precio,
        imagen: producto.imagen,
      };
    });

    res.json(productosFormateados);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

// Eliminar un producto por su nombre
router.delete('/borrar/:nombreProducto', async (req, res) => {
  try {
    const nombreProductoFormateado = PrimerLetraMayus(req.params.nombreProducto.trim());

    const result = await Producto.findOneAndDelete({ nombreProducto: nombreProductoFormateado});
    if (!result) {
      return res.status(404).json({ message: 'Producto no encontrado' });
    }
    res.json({ message: 'Producto eliminado con éxito' });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar el producto' });
  }
});

module.exports = router;
