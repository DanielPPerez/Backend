const express = require("express");
const Usuario = require("../models/usuariosM");
const sanitizeHtml = require("sanitize-html");
const router = express.Router();

const PrimerLetraMayus = (string) => {
  const palabras = string.trim().toLowerCase().split(" ");
  const palabrasMayusculas = palabras.map(
    (palabra) => palabra.charAt(0).toUpperCase() + palabra.slice(1)
  );
  return palabrasMayusculas.join(" ");
};

// Agregar un nuevo usuario
router.post("/crear", async (req, res) => {
  try {
    const { email, password, nombre, apellido } = req.body;

    // Verificar si el usuario ya existe
    const existingUser = await Usuario.findOne({ email });

    if (existingUser) {
      // El usuario ya existe
      if (existingUser.isAdmin) {
        // Usuario existente y es admin
        return res.status(200).json({ message: "Bienvenido Admin" });
      } else {
        // Usuario existente pero no es admin
        return res.status(201).json({ message: "Bienvenido Usuario" });
      }
    }

    // El usuario no existe, proceder con la creación
    const isAdmin =
      email === "admin@example.com" && password === "adminPassword";

    const usuario = new Usuario({
      email: sanitizeHtml(email.toLowerCase()).trim(),
      password: sanitizeHtml(password).trim(),
      nombre: sanitizeHtml(PrimerLetraMayus(nombre)).trim(),
      apellido: sanitizeHtml(PrimerLetraMayus(apellido)).trim(),
      isAdmin: isAdmin,
    });

    await usuario.validate();
    const result = await usuario.save();

    // Devolver el mensaje correspondiente según el tipo de usuario creado
    if (isAdmin) {
      res.status(200).json({ message: "Bienvenido Admin" });
    } else {
      res.status(201).json({ message: "Bienvenido Usuario" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

// Obtener un usuario por su correo electrónico
router.get("/obtener/:email", async (req, res) => {
  try {
    const email = req.params.email.trim().toLowerCase();
    const usuario = await Usuario.findOne({ email });
    if (!usuario) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }
    res.json(usuario);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

// Obtener todos los usuarios
router.get("/obtenerUsuarios", async (req, res) => {
  try {
    const usuarios = await Usuario.find();
    res.json(usuarios);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener todos los usuarios" });
  }
});

// Actualizar un usuario por su correo electrónico
router.put("/actualizar/:email", async (req, res) => {
  try {
    const datosUsuario = req.body;
    const email = req.params.email.trim().toLowerCase();

    // Validar si hay campos vacíos
    const camposRequeridos = ["nombre", "apellido", "password"];
    for (const campo of camposRequeridos) {
      if (!datosUsuario[campo]) {
        return res
          .status(400)
          .json({ error: `El campo ${campo} no puede estar vacío` });
      }
    }

    // Sanitizar y formatear campos
    const sanitizedDatos = {
      nombre: PrimerLetraMayus(sanitizeHtml(datosUsuario.nombre)),
      apellido: PrimerLetraMayus(sanitizeHtml(datosUsuario.apellido)),
      password: datosUsuario.password.trim(),
    };

    // Actualizar el usuario
    const result = await Usuario.findOneAndUpdate(
      { email: email },
      sanitizedDatos,
      { new: true, runValidators: true }
    );

    if (!result) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }
    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

// Eliminar un usuario por su correo electrónico
router.delete("/borrar/:email", async (req, res) => {
  try {
    const email = req.params.email.trim().toLowerCase();
    const usuario = await Usuario.findOne({ email });
    if (!usuario) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }
    try {
    } catch (validationError) {
      return res.status(400).json({ message: validationError.message });
    }

    const result = await Usuario.findOneAndDelete({ email });
    if (!result) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }
    res.json({ message: "Usuario eliminado con éxito" });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({ message: "Correo electrónico no válido" });
    }
    console.error(error);
    res.status(500).json({ error: "Error al eliminar el usuario" });
  }
});

module.exports = router;
