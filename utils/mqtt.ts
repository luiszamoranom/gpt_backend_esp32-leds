const mqtt = require('mqtt');
const schedule = require('node-schedule');
const client = mqtt.connect('mqtt://34.16.12.93:1883');
import { v4 as uuidv4 } from 'uuid';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();


// Agregar logs para la conexión y errores
client.on('connect', () => {
    console.log('Conectado al servidor MQTT');
  });
  
client.on('error', (err: any) => {
    console.error('Error de conexión MQTT:', err);
});

export const publishMessage = (pantalla:string, mensaje:string) => {
  client.publish(pantalla, mensaje);
};

export const scheduleMessage = async (usuarioId:any, dias:string, fechaInicio:any, fecha_hora_inicio:any, 
    fecha_hora_fin:any, pantalla:string, mensaje:string, animacion:number, fechaFin:any,mensaje_actual:string) => {

    const new_msg = mensaje+"&"+String(animacion)
    
    //SE PUEDE ELEGIR ENTRE TODOS LOS DIAS, LUNES A VIERNES O SÁBADO Y DOMINGO
    let dias_fin = ''
    let dias_out = ''
    if (dias.includes('Todos los días')){
        dias_fin='*'
    }else if (dias.includes('Lunes a Viernes')){
        dias_fin='1-5'
        dias_out='0,6'
    }else if (dias.includes('Sábado y Domingo')){
        dias_fin='0,6'
        dias_out='1-5'
    }
    
    let date_start= new Date(Date.now())
    let date_end= new Date(Date.now())
    const validarFechaFin =new Date(fechaFin)
    const validarFechaInicio =new Date(fechaInicio)
    //tiene fecha de inicio y de fin
    if (!isNaN(validarFechaInicio.getTime()) && !isNaN(validarFechaFin.getTime()) ){
        date_start = fechaInicio
        var flag_hora_inicio = false
        if (fecha_hora_inicio !== '' && fechaInicio){
            date_start = fecha_hora_inicio
            flag_hora_inicio  = true
        }

        date_end = fechaFin
        if (fecha_hora_fin !== '' && fechaFin){
            date_end = fecha_hora_fin
        }
        
        let job0:any;
        const id_job0 = uuidv4()
        if (!flag_hora_inicio){
            job0 = schedule.scheduleJob(id_job0,new Date(Date.now() + 1000),function() {
                console.log(new Date(Date.now()),"envia primero:",new_msg)
                publishMessage(pantalla, new_msg);
            })
        }else{
            //primero se inicia cuando se indica
            job0 = schedule.scheduleJob(id_job0,date_start,function() {
                console.log(new Date(Date.now()),"envia primero:",new_msg)
                publishMessage(pantalla, new_msg);
            })
        }
        const save_job0 = await prisma.cron.create({
            data:{
                id:id_job0,
                descripcion:`Se inicia el mensaje programado a las ${!flag_hora_inicio? new Date(Date.now() + 1000):date_start}`
            }
        })
        const asociar_job0 = await prisma.cronUsuario.create({
            data:{
                cronId:id_job0,
                usuarioId:usuarioId
            }
        })
        
        //este sirve para setear cada dia el mensaje
        const id_job1 = uuidv4()
        let job1 = schedule.scheduleJob(id_job1,{start:date_start,rule:`0 8 * * * ${dias_fin}`},function() {
            console.log(new Date(Date.now()),"envia normal:",new_msg)
            publishMessage(pantalla, new_msg);
        })
        const save_job1 = await prisma.cron.create({
            data:{
                id:id_job1,
                descripcion:`Cron para cada dia`
            }
        })
        const asociar_job1 = await prisma.cronUsuario.create({
            data:{
                cronId:id_job1,
                usuarioId:usuarioId
            }
        })

        //por ejemplo si es de lunes a viernes programado, el sabado y domingo deben tener el mensaje por defecto
        let job_out:any;
        const id_job_out = uuidv4()
        if ( !dias_fin.includes('*') ){
            job_out = schedule.scheduleJob(id_job_out,{start:date_start,rule:`0 8 * * * ${dias_out}`},function() {
                console.log(new Date(Date.now()),"envia por defecto cuando no es el dia selec:",new_msg)
                publishMessage(pantalla, mensaje_actual);
            });
            const save_job_out = await prisma.cron.create({
                data:{
                    id:id_job_out,
                    descripcion:`Cron para dias que no está programado`
                }
            })
            const asociar_job_out = await prisma.cronUsuario.create({
                data:{
                    cronId:id_job_out,
                    usuarioId:usuarioId
                }
            })
        }

        //este sirve para indicar cuando se debe volver al mensaje por defecto
        const id_job_cancel = uuidv4()
        const job_cancel = schedule.scheduleJob(id_job_cancel,date_end,function() {
            job0.cancel()
            job1.cancel()
            if (job_out){
                job_out.cancel()
            }
            console.log("Se acabó el mensaje programado, vuelvo al mensaje por default, se borra el mensaje programado actual")
            publishMessage(pantalla, mensaje_actual);
        });
        const save_job_cancel = await prisma.cron.create({
            data:{
                id:id_job_cancel,
                descripcion:`Cron para eliminar los cron programados de un mensaje específico`
            }
        })
        const asociar_job_cancel = await prisma.cronUsuario.create({
            data:{
                cronId:id_job_cancel,
                usuarioId:usuarioId
            }
        })
    }
    //tiene fecha de inicio y no fin -> es un mensaje por defecto programado
    else if (!isNaN(validarFechaInicio.getTime()) && isNaN(validarFechaFin.getTime())){
        date_start = fechaInicio
        var flag_hora_inicio = false
        if (fecha_hora_inicio !== '' && fechaInicio){
            date_start = fecha_hora_inicio
            flag_hora_inicio  = true
        }

        let job0;
        const id_job0 = uuidv4()
        if (!flag_hora_inicio){
            job0 = schedule.scheduleJob(id_job0,new Date(Date.now()),function() {
                console.log(new Date(Date.now()),"envia primero:",new_msg)
                publishMessage(pantalla, new_msg);
            });
        }else{
            //primero se inicia cuando se indica
            job0 = schedule.scheduleJob(id_job0,date_start,function() {
                console.log(new Date(Date.now()),"envia primero:",new_msg)
                publishMessage(pantalla, new_msg);
            });
        }
        const save_job0 = prisma.cron.create({
            data:{
                id:id_job0,
                descripcion:`Se inicia el mensaje programado por defecto a las ${!flag_hora_inicio? new Date(Date.now() + 1000):date_start}`
            }
        })
        const asociar_job0 = prisma.cronUsuario.create({
            data:{
                cronId:id_job0,
                usuarioId:usuarioId
            }
        })
    }
    //no tiene fecha de inicio y menos fin -> es mensaje por defecto
    else {
        publishMessage(pantalla, new_msg)
    }
};

export const scheduleMessageConTiempo = async (usuarioId:any, dias:any, fechaInicio:any, fecha_hora_inicio:any,
    pantalla:any, mensaje:any, animacion:any,tiempo:number,mensaje_actual:string) => {

    const new_msg = mensaje+"&"+String(animacion)
    let date_start = fechaInicio
    if (fecha_hora_inicio !== '' && fechaInicio){
        date_start = fecha_hora_inicio
    }
    const inicio_msg = date_start
    const fin_msg = new Date(inicio_msg.getTime()+(1000*tiempo))

    const id_job1 = uuidv4()
    const job1 = schedule.scheduleJob(id_job1,date_start,function() {
        console.log(new Date(Date.now()),"envia:",new_msg)
        publishMessage(pantalla, new_msg);
    })
    const save_job1 = await prisma.cron.create({
        data:{
            id:id_job1,
            descripcion:`Cron para mensaje con tiempo`
        }
    })
    const asociar_job1 = await prisma.cronUsuario.create({
        data:{
            cronId:id_job1,
            usuarioId:usuarioId
        }
    })
    const id_job2 = uuidv4()
    const job2 = schedule.scheduleJob(id_job2,fin_msg,function() {
        console.log(new Date(Date.now()),"setea por default:",mensaje_actual)
        publishMessage(pantalla, mensaje_actual);
    })
    
    const save_job2 = await prisma.cron.create({
        data:{
            id:id_job2,
            descripcion:`Cron para eliminar cron de mensaje con tiempo`
        }
    })
    const asociar_job2 = await prisma.cronUsuario.create({
        data:{
            cronId:id_job2,
            usuarioId:usuarioId
        }
    })
};

export const deleteScheduledMessage = (jobId:any) => {
  schedule.cancelJob(jobId);
};

// module.exports = {
//   publishMessage,
//   scheduleMessage,
//   deleteScheduledMessage,
// };
