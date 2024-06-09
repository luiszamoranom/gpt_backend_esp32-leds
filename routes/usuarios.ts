import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import Joi from 'joi';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const router = Router();

const schemaRegistrarUsuario = Joi.object({
  email: Joi.string().required(),
  nombre_completo: Joi.string().required().min(3).max(50),
  contrasena: Joi.string().required().min(5).max(20),
  imagen_base64: Joi.string().base64(),
  imagen_tipo: Joi.string().min(3).max(4),
});

router.post('/registrar', async (req, res) => {
  const { error } = schemaRegistrarUsuario.validate(req.body);

  if (error) {
    return res.status(400).set('x-mensaje', error.details[0].message).end();
  }

  const nombreUsuario = req.body.nombre_usuario;
  const email = req.body.email;

  try {
    const existeUsuario = await prisma.usuario.findFirst({
      where: {
        OR: [{ email }],
      },
    });

    if (existeUsuario) {
      return res
        .status(409)
        .set('x-mensaje', 'Ya existe un usuario con ese nickname o email')
        .end();
    }

    const nombreCompleto = req.body.nombre_completo;
    const contrasena = req.body.contrasena;
    const fotoPerfil = req.body.imagen_base64;
    const fotoExtension = req.body.imagen_tipo;

    const contrasenaHasheada = await bcrypt.hash(contrasena, 10);

    await prisma.usuario.create({
      data: {
        nombreCompleto,
        email,
        contrasena: contrasenaHasheada,
        fotoPerfil,
        fotoExtension,
      },
    });

    return res
      .status(201)
      .set('x-mensaje', 'Usuario creado éxitosamente')
      .end();
  } catch (error) {
    console.error(error);
    res.status(500).set('x-mensaje', 'Error interno del servidor.').end();
  }
});

router.get('/', async (req, res) => {
  try {
    const usuarios = await prisma.usuario.findMany();

    if (usuarios.length === 0) {
      return res
        .status(204)
        .set('x-mensaje', 'No hay usuarios registrados')
        .end();
    }

    return res.status(200).send(usuarios);
  } catch (error) {
    console.error(error);
    res.status(500).set('x-mensaje', 'Error interno del servidor.').end();
  }
});

router.get('', async (req, res) => {
  const usuarios = await prisma.pantalla.findMany();
  if(usuarios.length == 0){
    return res
        .status(404)
        .set('x-mensaje', 'Sin usuarios')
        .end();
  }

  return res
      .status(404)
      .set('x-mensaje', 'Información de los usuarios')
      .send(usuarios)
});

export default router;