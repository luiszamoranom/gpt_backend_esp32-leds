const mqtt = require('mqtt');
const schedule = require('node-schedule');
const client = mqtt.connect('mqtt://34.16.12.93:1883');

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

export const scheduleMessage = (jobId:any, dias:string, fechaInicio:any, fecha_hora_inicio:any, 
    fecha_hora_fin:any, pantalla:string, mensaje:string, animacion:number, fechaFin:any,mensaje_actual:string|null) => {

    const new_msg = mensaje+"&"+String(animacion)
        
    //SE PUEDE ELEGIR ENTRE TODOS LOS DIAS, LUNES A VIERNES, SÁBADO Y DOMINGO O SELECCIONAR LOS DIAS
    let dias_fin = ''
    if (dias.includes('Todos los días')){
        //se setea todos los días a las 8 de la mañana
        dias_fin='*'
    }else if (dias.includes('Lunes a Viernes')){
        //se setea de lunes a viernes a las 8 de la mañana
        dias_fin='1-5'
    }else if (dias.includes('Sábado y Domingo')){
        //se setea sabado y domingo a las 8 de la mañana
        dias_fin='0,6'
    }else{
        let dias:string = ''
        dias += dias.includes('Lunes') ? dias += "1" : '';
        dias += dias.includes('Martes') ? dias += ",2" : '';
        dias += dias.includes('Miércoles') ? dias += ",3" : '';
        dias += dias.includes('Jueves') ? dias += ",4" : '';
        dias += dias.includes('Viernes') ? dias += ",5" : '';
        dias += dias.includes('Sábado') ? dias += ",6" : '';
        dias += dias.includes('Domingo') ? dias += ",0" : '';
        dias_fin = dias[0] == ',' ? dias.substring(1,dias.length) : dias 
    }
    
    let date_start= new Date(Date.now())
    let date_end= new Date(Date.now())

    //tiene fecha de inicio y de fin
    if (fechaInicio && fechaFin){
        date_start = fechaInicio
        if (fecha_hora_inicio !== '' && fechaInicio){
            date_start = fecha_hora_inicio
        }

        date_end = fechaFin
        if (fecha_hora_fin !== '' && fechaFin){
            date_end = fecha_hora_fin
        }

        //primero se inicia cuando se indica
        const job0 = schedule.scheduleJob(date_start,function() {
            console.log(new Date(Date.now()),"envia primero:",new_msg)
            publishMessage(pantalla, new_msg);
        })

        //este sirve para setear cada dia el mensaje
        const job1 = schedule.scheduleJob({start:date_start,end:date_end,rule:`* 8 * * * ${dias_fin}`},function() {
            console.log(new Date(Date.now()),"envia normal:",new_msg)
            publishMessage(pantalla, new_msg);
        })

        //este sirve para indicar cuando se debe volver al mensaje por defecto
        const job2 = schedule.scheduleJob(date_end,function() {
            console.log(new Date(Date.now()),"setea por default:",mensaje_actual)
            publishMessage(pantalla, new_msg);
        })
    }
    //tiene fecha de inicio y no fin -> es un mensaje por defecto programado
    else if (fechaInicio && !fechaFin){
        date_start = fechaInicio
        if (fecha_hora_inicio !== '' && fechaInicio){
            date_start = fechaInicio
        }

        console.log("tiene fecha de inicio y no fin")
        console.log("date_start:",date_start)
        //primero se inicia cuando se indica
        const job0 = schedule.scheduleJob({start:date_start},function() {
            console.log(new Date(Date.now()),"envia:",new_msg)
            publishMessage(pantalla, new_msg);
        })

        //este sirve para setear cada dia el mensaje
        const job1 = schedule.scheduleJob({start:date_start,rule:`0 8 * * ${dias_fin}`},function() {
            console.log(new Date(Date.now()),"envia:",new_msg)
            publishMessage(pantalla, new_msg);
        })
    }
    //no tiene fecha de inicio y menos fin -> es mensaje por defecto
    else {
        publishMessage(pantalla, new_msg)
    }

    //FALTARIA VER SI POR EJEMPLO SE TIENE MENSAJE PROGRAMADO LUNES Y MIERCOLES, DEBERIA MARTES,JUEVES....
    //CREARSE UN CRON PARA VOLVER A MANDAR UN MENSAJE QUE ESTÁ POR DEFECTO
};

export const scheduleMessageConTiempo = (jobId:any, dias:any, fechaInicio:any, fecha_hora_inicio:any,
    pantalla:any, mensaje:any, animacion:any,tiempo:number,mensaje_actual:string) => {

    const new_msg = mensaje+"&"+String(animacion)
    const inicio_msg = fecha_hora_inicio
    const fin_msg = new Date(inicio_msg.getTime()+(1000*tiempo))
    const job1 = schedule.scheduleJob(fecha_hora_inicio,function() {
        console.log(new Date(Date.now()),"envia:",new_msg)
        publishMessage(pantalla, new_msg);
    })
    const job2 = schedule.scheduleJob(fin_msg,function() {
        console.log(new Date(Date.now()),"setea por default:",mensaje_actual)
        publishMessage(pantalla, mensaje_actual);
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
