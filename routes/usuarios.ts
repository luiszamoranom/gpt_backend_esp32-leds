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
const schemaEditarUsuario = Joi.object({
  email: Joi.string().required(),
  nombre_completo: Joi.string().required().min(3).max(50),
  imagen_base64: Joi.string().base64(),
  imagen_tipo: Joi.string().min(3).max(4),
});
const schemaBuscarPorId = Joi.object({
  id: Joi.number().required()
})

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

router.get('/habilitados', async (req, res) => {
  try {
    const usuarios = await prisma.usuario.findMany({
      where:{
        habilitado:true
      },
      select:{
        id:true,
        nombreCompleto:true,
        email:true,
        rol:true
      }
    });

    if (usuarios.length === 0) {
      return res
        .status(204)
        .set('x-mensaje', 'No hay usuarios habilitados')
        .end();
    }

    return res.status(200).send(usuarios);
  } catch (error) {
    console.error(error);
    res.status(500).set('x-mensaje', 'Error interno del servidor.').end();
  }
});

router.get('', async (req, res) => {
  const usuarios = await prisma.usuario.findMany({
    select:{
      id:true,
      nombreCompleto:true,
      email:true,
      habilitado:true,
      rol:true,
    }
  });
  if(usuarios.length == 0){
    return res
        .status(404)
        .set('x-mensaje', 'Sin usuarios')
        .end();
  }

  return res
      .status(200)
      .set('x-mensaje', 'Información de los usuarios')
      .send(usuarios)
});

router.patch('/editar-usuario', async (req, res) => {
  const id = req.query.id as string;
  const { error } = schemaBuscarPorId.validate({id:Number(id)});
  if (error) {
      return res.status(400).set('x-mensaje', error.details[0].message).end();
  }

  const { error:error2 } = schemaEditarUsuario.validate(req.body);
  if (error2) {
    return res.status(400).set('x-mensaje', error2.details[0].message).end();
  }

  const usuario = await prisma.usuario.findUnique({
      where: { id: Number(id) }
  });
  if (!usuario) {
      return res
          .status(404)
          .set('x-mensaje', 'Usuario no encontrado')
          .end();
  }

  const editar = await prisma.usuario.update({
    where:{
      id:Number(id)
    },
    data:{
      nombreCompleto:req.body.nombre_completo,
      email:req.body.email,
      fotoPerfil:req.body.imagen_base64,
      fotoExtension:req.body.imagen_tipo
    }
  });
  if (editar){
    return res
      .status(200)
      .set('x-mensaje', 'Usuario actualizado')
      .end();
  }
  return res
      .status(409)
      .set('x-mensaje', 'Error al actualizar')
      .end();
  
});

export default router;