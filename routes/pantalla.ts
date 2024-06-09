import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import Joi from 'joi';
import { v4 as uuidv4 } from 'uuid';
import  {publishMessage, scheduleMessage, scheduleMessageConTiempo}  from '../utils/mqtt';
import bcrypt from 'bcryptjs';
import jwt from "jsonwebtoken";

const prisma = new PrismaClient();

const router = Router();

const schemaRegistrarPantalla = Joi.object({
    nombre: Joi.string().required().min(3).max(20)
});

const schemaActualizarMensaje = Joi.object({
    id: Joi.number().required().messages({
        'number.base': 'El id debe ser un número.',
        'number.positive': 'El id debe ser un número positivo.',
        'any.required': 'El campo id es requerido.'
    }),
    mensaje: Joi.string().required().min(3).max(50).pattern(/^[^&]*$/, 'no &').messages({
        'any.required': 'mensaje, campo que registra el mensaje es obligatorio',
        'string.empty': 'mensaje, campo que registra el mensaje, no puede estar vacio',
        'string.min': 'mensaje, campo que registra el mensaje, debe tener un largo mínimo de 3 caracteres',
        'string.max': 'mensaje, campo que registra el mensaje, debe tener un largo máximo de 50 caracteres',
        'string.pattern.base': 'mensaje, campo que registra el mensaje, no puede contener el carácter "&"',
    }),
    animacion: Joi.number().required().min(0).max(10).messages({
        'any.required': 'animacion, campo que registra el tipo de animación, es obligatorio',
        'number.min': 'animacion, campo que registra el tipo de animación, debe ser entre 0 y 10',
        'number.max': 'animacion, campo que registra el tipo de animación, debe ser entre 0 y 10',
    })
});
const schemaMensajeProgramado = Joi.object({
    id: Joi.number().required().messages({
        'number.base': 'El id debe ser un número.',
        'number.positive': 'El id debe ser un número positivo.',
        'any.required': 'El campo id es requerido.'
    }),
    mensaje: Joi.string().required().min(3).max(50).pattern(/^[^&]*$/, 'no &').messages({
        'any.required': 'mensaje, campo que registra el mensaje es obligatorio',
        'string.empty': 'mensaje, campo que registra el mensaje, no puede estar vacio',
        'string.min': 'mensaje, campo que registra el mensaje, debe tener un largo mínimo de 3 caracteres',
        'string.max': 'mensaje, campo que registra el mensaje, debe tener un largo máximo de 50 caracteres',
        'string.pattern.base': 'mensaje, campo que registra el mensaje, no puede contener el carácter "&"',
    }),
    animacion: Joi.number().required().min(0).max(10).messages({
        'any.required': 'animacion, campo que registra el tipo de animación, es obligatorio',
        'number.min': 'animacion, campo que registra el tipo de animación, debe ser entre 0 y 10',
        'number.max': 'animacion, campo que registra el tipo de animación, debe ser entre 0 y 10',
    }),
    dias: Joi.string().required().messages({
        'any.required': 'dias, campo que registra los dias del mensaje programado es obligatorio',
        'string.empty': 'dias, campo que registra los dias del mensaje programado, no puede estar vacio'
    }),
    fecha_inicio: Joi.string().allow('').pattern(/^\d{4}-\d{2}-\d{2}$/, 'date').messages({
      'string.pattern.base': 'La fecha de inicio debe estar en el formato yyyy-mm-dd.'
    }),
    hora_inicio:Joi.string().allow('').pattern(/^(?:[01]\d|2[0-3]):[0-5]\d$/, 'time').messages({
      'string.pattern.base': 'La hora de inicio debe estar en el formato HH:MM.'
    }),
    hora_fin:Joi.string().allow('').pattern(/^(?:[01]\d|2[0-3]):[0-5]\d$/, 'time').messages({
        'string.pattern.base': 'La hora de inicio debe estar en el formato HH:MM.'
    }),
    fecha_fin:Joi.string().allow('').pattern(/^\d{4}-\d{2}-\d{2}$/, 'date').messages({
        'string.pattern.base': 'La fecha de inicio debe estar en el formato yyyy-mm-dd.'
    }),
    tiempo_actividad:Joi.number().positive().min(5).max(50400).messages({
      'number.base': 'El tiempo debe ser un número.',
      'number.positive': 'El tiempo debe ser un número positivo.',
      'number.min': 'El tiempo debe superar los 5 segundos.',
      'number.max': 'El tiempo no debe superar los 50400 segundos.'
    })
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

    const animacion: string = req.body.animacion;
    const pantallaActualizada = await prisma.pantalla.update({
        where: { id: id },
        data: { 
            mensajeActual: mensaje+"&"+String(animacion),
            mensajeDefecto: mensaje+"&"+String(animacion)
        },
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
    const { dias, fecha_inicio, hora_inicio, hora_fin, animacion, fecha_fin, tiempo_actividad } = req.body;
    const jobId = uuidv4();

    //si tiene fecha inicio puede tener hora de inicio, si tiene hora inicio si o si debe tener fecha inicio
    //si tiene fecha termino puede tener hor de fin, si tiene hora fin si o si debe tener fecha fin

    if (fecha_fin && !fecha_inicio){
        //no tiene sentido tener fecha de termino y no de inicio
        return res.status(411)
        .set('x-mensaje', 'No tiene sentido tener hora de termino y no fecha termino')
        .end();
    }
    if (hora_inicio && !fecha_inicio){
        //no tiene sentido no tener fecha de inicio y si hora
        return res.status(410)
            .set('x-mensaje', 'No tiene sentido tener hora de inicio y no fecha inicio')
            .end();
    }
    if (hora_fin && !fecha_fin){
        //no tiene sentido no tener fecha de inicio y si hora
        return res.status(410)
            .set('x-mensaje', 'No tiene sentido tener hora de termino y no fecha termino')
            .end();
    }
    
    
    //fechas
    const fechaInicioDate = new Date(fecha_inicio);
    const inicio_year=fechaInicioDate.getFullYear();
    const inicio_month=fechaInicioDate.getMonth();
    const inicio_day=fechaInicioDate.getDate()+1;

    const fechaFinDate = new Date(fecha_fin);
    const fin_year=fechaFinDate.getFullYear();
    const fin_month=fechaFinDate.getMonth();
    const fin_day=fechaFinDate.getDate()+1;

    //horas
    const hora_inicio_array = hora_inicio? hora_inicio.split(":") : '';
    const inicio_hora = hora_inicio? hora_inicio_array[0] : '';
    const inicio_minuto = hora_inicio? hora_inicio_array[1] : '';
    const trans_date_hora_inicio = hora_inicio? new Date(inicio_year,inicio_month,inicio_day,inicio_hora,inicio_minuto) : '';
    
    const hora_fin_array = hora_fin? hora_fin.split(":"): '';
    const fin_hora = hora_fin? hora_fin_array[0] : ''
    const fin_minuto = hora_fin? hora_fin_array[1] : ''
    const trans_date_hora_fin = hora_fin? new Date(fin_year,fin_month,fin_day,fin_hora,fin_minuto) : '';
    
    if (tiempo_actividad){
        //esta funcion solo permite fecha y hora inicio por unos segundos/minutos/horas definidas, no tiene una fecha como tal
        scheduleMessageConTiempo(jobId,dias,trans_date_hora_inicio,trans_date_hora_inicio,pantalla.nombre,
            mensaje,animacion,Number(tiempo_actividad),pantalla.mensajeDefecto?pantalla.mensajeDefecto:'')
    }else{
        //esta funcion permite setear la fecha,hora inicio y fecha,hora fin de un mensaje
        scheduleMessage(jobId,dias,fechaInicioDate,trans_date_hora_inicio,trans_date_hora_fin,pantalla.nombre
            ,mensaje,animacion,fechaFinDate,pantalla.mensajeDefecto?pantalla.mensajeDefecto:'')
    }

    const pantallaActualizada = await prisma.pantalla.update({
        where: { id: id },
        data: { 
            mensajeActual: mensaje+"&"+String(animacion)
        },
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
        .status(200)
        .set('x-mensaje', 'Información de las pantallas')
        .send(pantallas)
});


export default router;