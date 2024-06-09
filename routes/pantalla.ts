import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import Joi from 'joi';
import { v4 as uuidv4 } from 'uuid';
import  {publishMessage, scheduleMessage}  from '../utils/mqtt';
import bcrypt from 'bcryptjs';
import jwt from "jsonwebtoken";

const prisma = new PrismaClient();

const router = Router();

const schemaRegistrarPantalla = Joi.object({
    nombre: Joi.string().required().min(3).max(20)
});

const schemaActualizarMensaje = Joi.object({
    id: Joi.number().required(),
    mensaje: Joi.string().required().min(3).max(50),
    animacion: Joi.string().required()
});
const schemaMensajeProgramado = Joi.object({
    id: Joi.number().required(),
    mensaje: Joi.string().required().min(3).max(50),
    animacion: Joi.string().required(),
    fecha_inicio: Joi.string(),
    dias: Joi.string().required(),
    hora_inicio:Joi.string(),
    hora_fin:Joi.string(),
    fecha_fin:Joi.string(),
    tiempo_actividad:Joi.string()
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
    
    if (pantallaActualizada){
        await publishMessage(pantalla.nombre, mensaje)
    }

    return res
        .status(200)
        .set('x-mensaje', 'Se actualizó el mensaje de la pantalla')
        .end();
});

router.patch('/enviar-mensaje-programado', async (req, res) => {
    const { error } = schemaMensajeProgramado.validate(req.body);

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
    const { dias, fecha_inicio, hora_inicio, hora_fin, animacion, fechaFin } = req.body;
    const jobId = uuidv4();
    //fechas
    const fechaInicioDate = new Date(fecha_inicio);
    const inicio_year=fechaInicioDate.getFullYear();
    const inicio_month=fechaInicioDate.getMonth()+1;
    const inicio_day=fechaInicioDate.getDate()+1;
    const fechaFinDate = fechaFin ? new Date(fechaFin) : null;
    //horas
    const hora_inicio_array = hora_inicio.split(":");
    const inicio_hora = hora_inicio_array[0]
    const inicio_minuto = hora_inicio_array[1]
    const trans_date_hora_inicio = new Date(inicio_year,inicio_month,inicio_day,inicio_hora,inicio_minuto);
    // console.log("hora:",trans_date_hora_inicio.getHours())
    // console.log("minuto:",trans_date_hora_inicio.getMinutes())

    // console.log("fecha_inicio_date:",fechaInicioDate)
    // console.log("hora_inicio:",trans_date_hora_inicio)

    scheduleMessage(jobId,dias,trans_date_hora_inicio,trans_date_hora_inicio,hora_fin,pantalla.nombre,mensaje,animacion,fechaFinDate)
    

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