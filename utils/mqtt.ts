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

export const scheduleMessage = (jobId:any, dias:any, fechaInicio:any, de:any, a:any, pantalla:any, mensaje:any, animacion:any, fechaFin:any) => {
    const jobOptions = {
        dayOfWeek: dias,
        hour: fechaInicio.getHours(),
        minute: fechaInicio.getMinutes(),
        second: fechaInicio.getSeconds(),
    };
    console.log(`Iniciando la programación del mensaje con jobId: ${jobId}`);
    console.log(`Configuración de la tarea principal: ${JSON.stringify(jobOptions)}`);

    // schedule.scheduleJob(jobId, jobOptions, () => {
    //     console.log(`Ejecutando la tarea programada con jobId: ${jobId}`);
    //     publishMessage(pantalla, mensaje);
    // });

    const job = schedule.scheduleJob('* * * * *', function(){
        console.log(`Ejecutando la tarea programada con jobId: ${jobId}`);
        publishMessage(pantalla, mensaje);
    });

    if (de && a) {
        const quitarOptions = {
            dayOfWeek: dias,
            hour: a.getHours(),
            minute: a.getMinutes(),
            second: a.getSeconds(),
        };
        console.log(`Configuración de la tarea para quitar el mensaje: ${JSON.stringify(quitarOptions)}`);
        
        schedule.scheduleJob(`${jobId}/quitar`, quitarOptions, () => {
            console.log(`Ejecutando la tarea de quitar el mensaje con jobId: ${jobId}/quitar`);
            // Logic to remove the message
        });
    }

    if (fechaFin) {
        console.log(`Configuración de la tarea para borrar el mensaje en la fecha de fin: ${fechaFin}`);
        
        schedule.scheduleJob(`${jobId}/borrar`, fechaFin, () => {
        console.log(`Ejecutando la tarea de borrar el mensaje con jobId: ${jobId}/borrar`);
        // Logic to delete the scheduled message
        schedule.cancelJob(jobId);
        });
    }
};

export const deleteScheduledMessage = (jobId:any) => {
  schedule.cancelJob(jobId);
};

// module.exports = {
//   publishMessage,
//   scheduleMessage,
//   deleteScheduledMessage,
// };
