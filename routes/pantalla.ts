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
const schemaBuscarPorId = Joi.object({
    id: Joi.number().required()
})
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
    dias: Joi.string().required().pattern(/^(Todos los días|Lunes a Viernes|Sábado y Domingo)$/).messages({
        'any.required': 'dias, campo que registra los dias del mensaje programado es obligatorio',
        'string.empty': 'dias, campo que registra los dias del mensaje programado, no puede estar vacio',
        'string.pattern.base': 'Los opciones de dia son: Todos los días, Lunes a Viernes o Sábado y Domingo.'
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
    })
});
const schemaMensajeConTiempo = Joi.object({
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
    fecha_inicio: Joi.string().required().allow('').pattern(/^\d{4}-\d{2}-\d{2}$/, 'date').messages({
      'string.pattern.base': 'La fecha de inicio debe estar en el formato yyyy-mm-dd.'
    }),
    hora_inicio:Joi.string().required().allow('').pattern(/^(?:[01]\d|2[0-3]):[0-5]\d$/, 'time').messages({
      'string.pattern.base': 'La hora de inicio debe estar en el formato HH:MM.'
    }),
    tiempo_actividad:Joi.number().required().positive().min(5).max(50400).messages({
      'number.base': 'El tiempo debe ser un número.',
      'number.positive': 'El tiempo debe ser un número positivo.',
      'number.min': 'El tiempo debe superar los 5 segundos.',
      'number.max': 'El tiempo no debe superar los 50400 segundos.'
    })
});

//CREAR UNA PANTALLA
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
            mensajeDefecto:"Mensaje por defecto",
            mensajeActual: "Mensaje por defecto"
        },
    });

    return res
        .status(201)
        .set('x-mensaje', 'Pantalla creada éxitosamente')
        .end();
});

//ENVIAR UN MENSAJE POR DEFECTO
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

    const id_usuario = req.query.id as string;
    const { error:error2 } = schemaBuscarPorId.validate({id:Number(id_usuario)});
    if (error2) {
        return res.status(400).set('x-mensaje', error2.details[0].message).end();
    }
    const usuario = await prisma.usuario.findUnique({
        where: { id: Number(id_usuario) }
    });
    if (!usuario) {
        return res
            .status(412)
            .set('x-mensaje', 'Usuario no encontrado')
            .end();
    }

    if (usuario.rol!=='administrador'){
        const isAsociado = await prisma.usuarioPantalla.findFirst({
            where:{
                pantallaId: pantalla.id,
                usuarioId: usuario.id
            }
        })
        if (!isAsociado){
            return res
                .status(414)
                .set('x-mensaje', 'El usuario no tiene permiso para enviar mensajes')
                .end();
        }    
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
        publishMessage(pantalla.nombre, mensaje+"&"+String(animacion))
    }

    return res
        .status(200)
        .set('x-mensaje', 'Se actualizó el mensaje de la pantalla')
        .end();
});

//ENVIAR UN MENSAJE PROGRAMADO
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
    const id_usuario = req.query.id as string;
    const { error:error2 } = schemaBuscarPorId.validate({id:Number(id_usuario)});
    if (error2) {
        return res.status(400).set('x-mensaje', error2.details[0].message).end();
    }
    const usuario = await prisma.usuario.findUnique({
        where: { id: Number(id_usuario) }
    });
    if (!usuario) {
        return res
            .status(412)
            .set('x-mensaje', 'Usuario no encontrado')
            .end();
    }

    if (usuario.rol!=='administrador'){
        const isAsociado = await prisma.usuarioPantalla.findFirst({
            where:{
                pantallaId: pantalla.id,
                usuarioId: usuario.id
            }
        })
        if (!isAsociado){
            return res
                .status(414)
                .set('x-mensaje', 'El usuario no tiene permiso para enviar mensajes')
                .end();
        }    
    }


    const existeCron = await prisma.cronUsuario.findFirst({
        where:{
            pantallaId: pantalla.id
        }
    });
    if (existeCron){
        return res
            .status(413)
            .set('x-mensaje', 'Contiene cron activos')
            .end();
    }

    const { dias, fecha_inicio, hora_inicio, hora_fin, animacion, fecha_fin} = req.body;
    //si tiene fecha inicio puede tener hora de inicio, si tiene hora inicio si o si debe tener fecha inicio
    //si tiene fecha termino puede tener hor de fin, si tiene hora fin si o si debe tener fecha fin
    if (fecha_fin && !fecha_inicio){
        //no tiene sentido tener fecha de termino y no de inicio
        return res.status(411)
        .set('x-mensaje', 'No tiene sentido tener fecha de termino y no fecha inicio')
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
        return res.status(415)
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
    
    //si tiene fecha fin se debe verificar que la fecha fin sea mayor o igual a la de inicio
    if (fecha_fin){
        if (fechaInicioDate.getTime() > fechaFinDate.getTime() ){
            return res
                .status(416)
                .set('x-mensaje', 'La fecha de termino no puede ser inferior a la de inicio')
                .end();
        }
        if (trans_date_hora_inicio!=='' &&  trans_date_hora_fin!=='' ){
            if ( fechaInicioDate.getTime() == fechaFinDate.getTime() &&  trans_date_hora_inicio.getTime() > trans_date_hora_fin.getTime()){
                return res
                .status(417)
                .set('x-mensaje', 'La hora de termino no puede ser inferior a la de inicio')
                .end();
            }
        }
    }
    
    scheduleMessage(dias,fechaInicioDate,trans_date_hora_inicio,trans_date_hora_fin,pantalla.nombre
        ,mensaje,animacion,fechaFinDate,pantalla.mensajeDefecto?pantalla.mensajeDefecto:'',pantalla.id)
   
    return res
        .status(200)
        .set('x-mensaje', 'Se actualizó el mensaje de la pantalla')
        .end();
});

//OBTENER TODAS LAS PANTALLAS
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

//OBTENER USUARIOS DE UNA PANTALLA
router.get('/usuarios-by-pantalla', async (req, res) => {
    const id = req.query.id as string;
    const { error } = schemaBuscarPorId.validate({id:Number(id)});
    if (error) {
        return res.status(400).set('x-mensaje', error.details[0].message).end();
    }

    const pantallas = await prisma.pantalla.findFirst({
        where:{
            id:Number(id)
        }
    });

    if(!pantallas){
        return res
            .status(404)
            .set('x-mensaje', 'No se encuentra la pantalla')
            .end();
    }

    const asociaciones = await prisma.usuarioPantalla.findMany({
        where:{
            pantallaId:Number(id)
        },
        include: {
            usuario: {
                select:{
                    id:true,
                    nombreCompleto:true,
                    rol:true,
                    email:true
                }
            }
        }
    })
    if(asociaciones.length==0){
        return res
            .status(405)
            .set('x-mensaje', 'No contiene usuarios la pantalla')
            .end();
    }

    return res
        .status(200)
        .set('x-mensaje', 'Información de la pantalla')
        .send(asociaciones)
        .end();
});

router.delete('/cron-activos', async (req,res) => {
    const usuario_id = req.query.id as string;
    const { error } = schemaBuscarPorId.validate({id:Number(usuario_id)});
    if (error) {
        return res.status(400).set('x-mensaje', error.details[0].message).end();
    }
    const usuario = await prisma.usuario.findUnique({
        where: { id: Number(usuario_id) }
    });
    if (!usuario) {
        return res
            .status(412)
            .set('x-mensaje', 'Usuario no encontrado')
            .end();
    }
    
    const pantalla_id = Number(req.body.pantalla_id);
    const { error:error2 } = schemaBuscarPorId.validate({id:pantalla_id});
    if (error2) {
        return res.status(401).set('x-mensaje', error2.details[0].message).end();
    }
    const pantalla = await prisma.pantalla.findUnique({
        where: { id:  pantalla_id},
    });
    if (!pantalla) {
        return res
            .status(404)
            .set('x-mensaje', 'Pantalla no encontrada')
            .end();
    }

    const isAsociado = await prisma.usuarioPantalla.findMany({
        where:{
            pantallaId: pantalla.id,
            usuarioId: usuario.id
        }
    })
    if (!isAsociado && usuario.rol !== 'administrador'){
        return res
            .status(414)
            .set('x-mensaje', 'El usuario no tiene permiso para eliminar el cron')
            .end();
    }

    const cronsAsociados = await prisma.cronUsuario.findMany({
        where: {
            pantallaId: pantalla_id
        }
    });
    const eliminarCrons = await prisma.cronUsuario.deleteMany({
        where: {
            pantallaId: pantalla_id
        }
    });
    for (let i = 0;i<cronsAsociados.length;i++){
        //ahora elimino cada cron
        const eliminaCron = await prisma.cron.delete({
            where: {
                id: cronsAsociados[i].cronId
            }
        });
    }
    if (eliminarCrons){
        const actualizar = await prisma.pantalla.update({
            data:{
                mensajeActual: pantalla.mensajeDefecto
            },
            where:{
                id: pantalla_id
            }
        })
        if (pantalla.mensajeDefecto){
            publishMessage(pantalla.nombre, pantalla.mensajeDefecto)
        }
        return res
        .status(200)
        .set('x-mensaje', 'Se eliminaron los crons correctamente')
        .end();
    }
    return res
        .status(204)
        .set('x-mensaje', 'No se encontraban cron en la pantalla')
        .end();
})

router.delete('', async (req,res) => {
    const pantalla_id = req.query.id as string;
    const { error } = schemaBuscarPorId.validate({id:Number(pantalla_id)});
    if (error) {
        return res.status(400).set('x-mensaje', error.details[0].message).end();
    }
   
    const pantalla = await prisma.pantalla.findUnique({
        where: { id:  Number(pantalla_id)},
    });
    if (!pantalla) {
        return res
            .status(404)
            .set('x-mensaje', 'Pantalla no encontrada')
            .end();
    }

    const eliminarPantalla = await prisma.pantalla.delete({
        where:  { id:  Number(pantalla_id)}
    });
    if (eliminarPantalla){
        return res
        .status(200)
        .set('x-mensaje', 'Se elimina la pantalla correctamente')
        .end();
    }
    return res
        .status(409)
        .set('x-mensaje', 'No se pudo eliminar')
        .end();
})

export default router;