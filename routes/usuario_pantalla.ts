import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import Joi from 'joi';
import bcrypt from 'bcryptjs';
import jwt from "jsonwebtoken";

const prisma = new PrismaClient();

const router = Router();

const schemaBuscarPorId = Joi.object({
    id: Joi.number().required()
})

const schemaAsociarUsuarioPantalla = Joi.object({
    usuario_id : Joi.number().required().min(1),
    pantalla_id : Joi.number().required().min(1)
});

router.get('/asociacion-by-usuario', async (req,res) => {
    const id = req.query.id as string;
    const { error } = schemaBuscarPorId.validate({id:id});

    const usuario = await prisma.usuario.findUnique({
        where: { id: req.body.usuario_id }
    });
    if (!usuario) {
        return res
            .status(404)
            .set('x-mensaje', 'Usuario no encontrado')
            .end();
    }

    const pantallas = await prisma.usuarioPantalla.findMany({
        where:{
            usuarioId:Number(id)
        }
    })
    if (pantallas.length>0){
        return res
            .status(200)
            .send(pantallas)
            .set('x-mensaje', 'Pantallas encontradas')
            .end();
    }else{
        return res
        .status(404)
        .send(pantallas)
        .set('x-mensaje', 'No se encontraron pantallas')
        .end();
    }
});

router.post('', async (req,res) => {
    const { error } = schemaAsociarUsuarioPantalla.validate(req.body);
    if (error) {
        return res.status(400).set('x-mensaje', error.details[0].message).end();
    }

    const pantalla = await prisma.pantalla.findUnique({
        where: { id: req.body.pantalla_id }
    });
    if (!pantalla) {
        return res
            .status(404)
            .set('x-mensaje', 'Pantalla no encontrada')
            .end();
    }

    const usuario = await prisma.usuario.findUnique({
        where: { id: req.body.usuario_id }
    });
    if (!usuario) {
        return res
            .status(404)
            .set('x-mensaje', 'Usuario no encontrado')
            .end();
    }

    const asociacionExistente = await prisma.usuarioPantalla.findFirst({
        where: { 
            pantallaId:req.body.pantalla_id,
            usuarioId:req.body.usuario_id
        }
    });
    if (asociacionExistente) {
        return res
            .status(409)
            .set('x-mensaje', 'Ya existe la asociacion')
            .end();
    }

    const asociar = await prisma.usuarioPantalla.create({
        data:{
            usuarioId:req.body.usuario_id,
            pantallaId:req.body.pantalla_id
        }
    })
    if (asociar){
        return res
            .status(200)
            .set('x-mensaje', 'Pantallas asociada a usuario')
            .end();
    }
    return res.status(409).end();
});

router.delete('', async (req,res) => {
    const { error } = schemaAsociarUsuarioPantalla.validate(req.body);
    if (error) {
        return res.status(400).set('x-mensaje', error.details[0].message).end();
    }

    const pantalla = await prisma.pantalla.findUnique({
        where: { id: req.body.pantalla_id }
    });
    if (!pantalla) {
        return res
            .status(404)
            .set('x-mensaje', 'Pantalla no encontrada')
            .end();
    }

    const usuario = await prisma.usuario.findUnique({
        where: { id: req.body.usuario_id }
    });
    if (!usuario) {
        return res
            .status(404)
            .set('x-mensaje', 'Usuario no encontrado')
            .end();
    }

    const asociacionExistente = await prisma.usuarioPantalla.findFirst({
        where: { 
            pantallaId:req.body.pantalla_id,
            usuarioId:req.body.usuario_id
        }
    });
    if (asociacionExistente) {
        return res
            .status(409)
            .set('x-mensaje', 'Ya existe la asociacion')
            .end();
    }
    
    const pantalla_id:number = req.body.pantalla_id
    const usuario_id:number = req.body.usuario_id
    const desasociar = await prisma.usuarioPantalla.delete({
        where: {
            pantallaId:pantalla_id,
            usuarioId:usuario_id
        }
    })
    if (desasociar){
        return res
            .status(200)
            .set('x-mensaje', 'Pantallas asociada a usuario')
            .end();
    }
    return res.status(409).end();
});

export default router;