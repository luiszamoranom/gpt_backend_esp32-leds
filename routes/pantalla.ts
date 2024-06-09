import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import Joi from 'joi';
import bcrypt from 'bcryptjs';
import jwt from "jsonwebtoken";

const prisma = new PrismaClient();

const router = Router();

const schemaRegistrarPantalla = Joi.object({
    nombre: Joi.string().required().min(3).max(20)
});

const schemaActualizarMensaje = Joi.object({
    id: Joi.number().required(),
    mensaje: Joi.string().required().min(3).max(50)
});

router.post('', async (req, res) => {
    const { error } = schemaRegistrarPantalla.validate(req.body);

    if (error) {
        return res.status(400).set('x-mensaje', error.details[0].message).end();
    }

    const nombre: string = req.body.nombre;

    const pantallaExistente = await prisma.pantalla.findUnique({
        where: { nombre: nombre },
    });

    if (pantallaExistente) {
        return res
            .status(409)
            .set('x-mensaje', 'Ya existe una pantalla con ese nombre')
            .end();
    }

    const nuevaPantalla = await prisma.pantalla.create({
        data: {
            nombre: nombre,
        },
    });

    return res
        .status(201)
        .set('x-mensaje', 'Pantalla creada éxitosamente')
        .end();
});

router.patch('/enviar-mensaje', async (req, res) => {
    const { error } = schemaActualizarMensaje.validate(req.body);

    if (error) {
        return res.status(400).set('x-mensaje', error.details[0].message).end();
    }

    const id: number = req.body.id;
    const mensaje: string = req.body.mensaje;

    const pantalla = await prisma.pantalla.findUnique({
        where: { id: id },
    });

    if (!pantalla) {
        return res
            .status(404)
            .set('x-mensaje', 'Pantalla no encontrada')
            .end();
    }

    const pantallaActualizada = await prisma.pantalla.update({
        where: { id: id },
        data: { mensajeActual: mensaje },
    });

    return res
        .status(200)
        .set('x-mensaje', 'Se actualizó el mensaje de la pantalla')
        .end();
});

router.get('', async (req, res) => {
    const pantallas = await prisma.pantalla.findMany();
    if(pantallas.length == 0){
        return res
            .status(404)
            .set('x-mensaje', 'Sin pantallas')
            .end();
    }

    return res
        .status(404)
        .set('x-mensaje', 'Información de las pantallas')
        .send(pantallas)
});


export default router;