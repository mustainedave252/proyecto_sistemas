/* RutaSalud - datos ficticios de demostración.
   Las fechas se expresan como desplazamientos en días respecto al momento en que
   se cargan por primera vez, para que la demostración se vea igual cualquier día.
   La estructura de cada autorización toma como guía los campos que la
   Resolución 2335 de 2023 exige en la respuesta a una solicitud de autorización
   (número, servicio, prestador asignado, fecha y hora). Ningún dato es real. */

const RS_DATOS = (function () {
  const ETAPAS = {
    cita: [
      { clave: 'ordenada',   nombre: 'Su médico generó la orden',       accion: 'No tiene que hacer nada. Su IPS envía la orden a la EPS.' },
      { clave: 'revision',   nombre: 'La EPS está revisando la orden',  accion: 'No tiene que hacer nada. No necesita radicar documentos ni llamar.' },
      { clave: 'aprobada',   nombre: 'Autorización aprobada',           accion: 'No tiene que hacer nada. La EPS le asignará la cita.' },
      { clave: 'asignada',   nombre: 'Cita asignada',                   accion: 'Asista en la fecha y hora indicadas con su documento de identidad.' },
      { clave: 'atendida',   nombre: 'Cita atendida',                   accion: 'Proceso terminado.' }
    ],
    medicamento: [
      { clave: 'ordenada',     nombre: 'Su médico formuló el medicamento', accion: 'No tiene que hacer nada. La fórmula ya está en el sistema.' },
      { clave: 'revision',     nombre: 'La EPS está revisando la fórmula', accion: 'No tiene que hacer nada mientras la EPS responde.' },
      { clave: 'aprobada',     nombre: 'Medicamento autorizado',           accion: 'Espere el aviso de que el medicamento está listo para reclamar.' },
      { clave: 'dispensacion', nombre: 'Listo para entrega',               accion: 'Acérquese al punto de entrega con su documento.' },
      { clave: 'entregado',    nombre: 'Entrega completa',                 accion: 'Proceso terminado.' }
    ]
  };

  const personas = [
    { id: 'p1', nombre: 'Marta Lucía Rojas Peña', corto: 'Marta Lucía', documento: 'CC 1.000.000.001', regimen: 'Contributivo', eps: 'Salud Andina EPS (ficticia)', relacion: 'Titular', telefono: '300 000 0001', correo: 'marta.demo@correo.co' },
    { id: 'p2', nombre: 'Carmen Peña de Rojas', corto: 'Carmen (mamá)', documento: 'CC 1.000.000.002', regimen: 'Contributivo', eps: 'Salud Andina EPS (ficticia)', relacion: 'Madre, a su cargo como cuidadora', telefono: '300 000 0002', correo: '' }
  ];

  const autorizaciones = [
    {
      id: 'a1', radicado: 'AUT-2026-104512', personaId: 'p2', tipo: 'cita', prioritario: true,
      servicio: 'Consulta de primera vez por cardiología', medico: 'Dr. Andrés Gil (medicina general)',
      ipsOrigen: 'IPS Barrio Kennedy (ficticia)', diagnostico: 'Control de hipertensión arterial',
      historial: [
        { etapa: 'ordenada', dia: -4, hora: '09:12' },
        { etapa: 'revision', dia: -3, hora: '08:40' }
      ]
    },
    {
      id: 'a2', radicado: 'AUT-2026-103877', personaId: 'p1', tipo: 'cita', prioritario: false,
      servicio: 'Consulta de control por endocrinología', medico: 'Dra. Paula Méndez (medicina interna)',
      ipsOrigen: 'IPS Chapinero Central (ficticia)', diagnostico: 'Seguimiento de tiroides',
      cita: { dia: 6, hora: '10:30 a. m.', lugar: 'Centro Médico Andino Norte (ficticio)', direccion: 'Calle 100 n.º 00-00, consultorio 402, Bogotá', profesional: 'Dr. Felipe Castaño, endocrinólogo' },
      historial: [
        { etapa: 'ordenada', dia: -7, hora: '15:05' },
        { etapa: 'revision', dia: -6, hora: '10:00' },
        { etapa: 'aprobada', dia: -5, hora: '11:21' },
        { etapa: 'asignada', dia: -5, hora: '16:48' }
      ]
    },
    {
      id: 'a3', radicado: 'AUT-2026-104190', personaId: 'p2', tipo: 'medicamento', prioritario: false,
      servicio: 'Losartán 50 mg tabletas', medico: 'Dr. Andrés Gil (medicina general)',
      ipsOrigen: 'IPS Barrio Kennedy (ficticia)', diagnostico: 'Control de hipertensión arterial',
      medicamento: { presentacion: 'Tableta de 50 mg', dosis: '1 tableta cada 12 horas', cantidad: 60, entregada: 30, punto: 'Droguería Dispensadora Kennedy (ficticia)', direccion: 'Avenida 1.º de Mayo n.º 00-00, Bogotá', horario: 'Lunes a sábado, 7:00 a. m. a 7:00 p. m.', diaEntregaParcial: -1 },
      historial: [
        { etapa: 'ordenada', dia: -5, hora: '09:30' },
        { etapa: 'revision', dia: -5, hora: '14:00' },
        { etapa: 'aprobada', dia: -4, hora: '09:05' },
        { etapa: 'dispensacion', dia: -1, hora: '11:10', nota: 'Se entregaron 30 de 60 tabletas. Quedan 30 pendientes.' }
      ]
    },
    {
      id: 'a4', radicado: 'AUT-2026-104733', personaId: 'p1', tipo: 'medicamento', prioritario: false,
      servicio: 'Levotiroxina 75 mcg tabletas', medico: 'Dra. Paula Méndez (medicina interna)',
      ipsOrigen: 'IPS Chapinero Central (ficticia)', diagnostico: 'Seguimiento de tiroides',
      medicamento: { presentacion: 'Tableta de 75 mcg', dosis: '1 tableta en ayunas', cantidad: 30, entregada: 0, punto: 'Droguería Dispensadora Chapinero (ficticia)', direccion: 'Carrera 13 n.º 00-00, Bogotá', horario: 'Lunes a viernes, 7:00 a. m. a 6:00 p. m.' },
      historial: [
        { etapa: 'ordenada', dia: -1, hora: '17:20' },
        { etapa: 'revision', dia: 0, hora: '08:15' }
      ]
    },
    {
      id: 'a5', radicado: 'AUT-2026-098120', personaId: 'p2', tipo: 'cita', prioritario: false,
      servicio: 'Consulta de control por oftalmología', medico: 'Dr. Andrés Gil (medicina general)',
      ipsOrigen: 'IPS Barrio Kennedy (ficticia)', diagnostico: 'Control de cataratas',
      cita: { dia: -20, hora: '2:00 p. m.', lugar: 'Clínica Visión Sur (ficticia)', direccion: 'Calle 38 sur n.º 00-00, Bogotá', profesional: 'Dra. Liliana Ortiz, oftalmóloga' },
      historial: [
        { etapa: 'ordenada', dia: -34, hora: '10:00' },
        { etapa: 'revision', dia: -33, hora: '09:00' },
        { etapa: 'aprobada', dia: -32, hora: '15:30' },
        { etapa: 'asignada', dia: -31, hora: '10:10' },
        { etapa: 'atendida', dia: -20, hora: '14:45' }
      ]
    },
    {
      id: 'a6', radicado: 'AUT-2026-097345', personaId: 'p1', tipo: 'medicamento', prioritario: false,
      servicio: 'Levotiroxina 75 mcg tabletas', medico: 'Dra. Paula Méndez (medicina interna)',
      ipsOrigen: 'IPS Chapinero Central (ficticia)', diagnostico: 'Seguimiento de tiroides',
      medicamento: { presentacion: 'Tableta de 75 mcg', dosis: '1 tableta en ayunas', cantidad: 30, entregada: 30, punto: 'Droguería Dispensadora Chapinero (ficticia)', direccion: 'Carrera 13 n.º 00-00, Bogotá', horario: 'Lunes a viernes, 7:00 a. m. a 6:00 p. m.' },
      historial: [
        { etapa: 'ordenada', dia: -31, hora: '16:00' },
        { etapa: 'revision', dia: -31, hora: '17:30' },
        { etapa: 'aprobada', dia: -30, hora: '08:50' },
        { etapa: 'dispensacion', dia: -29, hora: '12:00' },
        { etapa: 'entregado', dia: -29, hora: '12:05' }
      ]
    },
    {
      id: 'a7', radicado: 'AUT-2026-095002', personaId: 'p1', tipo: 'cita', prioritario: false,
      servicio: 'Consulta por dermatología', medico: 'Dra. Paula Méndez (medicina interna)',
      ipsOrigen: 'IPS Chapinero Central (ficticia)', diagnostico: 'Lesión en piel en estudio',
      negada: { dia: -40, motivo: 'La orden llegó sin la firma del médico. La IPS debe enviarla de nuevo; usted no tiene que llevarla a ninguna oficina.' },
      historial: [
        { etapa: 'ordenada', dia: -44, hora: '11:00' },
        { etapa: 'revision', dia: -43, hora: '09:20' }
      ]
    }
  ];

  const notificaciones = [
    { id: 'n1', autId: 'a3', dia: -1, hora: '11:12', titulo: 'Entrega parcial de Losartán', texto: 'A Carmen le entregaron 30 de 60 tabletas. La EPS debe entregar las 30 pendientes en un plazo máximo de 48 horas.', leida: false },
    { id: 'n2', autId: 'a1', dia: -1, hora: '09:00', titulo: 'Se venció el plazo de respuesta', texto: 'La autorización de cardiología de Carmen lleva más de 2 días en revisión. Le mostramos cómo presentar un reclamo.', leida: false },
    { id: 'n3', autId: 'a2', dia: -5, hora: '16:50', titulo: 'Cita de endocrinología asignada', texto: 'Su cita quedó programada. Revise la fecha, la hora y el lugar en el detalle.', leida: true },
    { id: 'n4', autId: 'a4', dia: 0, hora: '08:16', titulo: 'Fórmula en revisión', texto: 'La EPS recibió la fórmula de Levotiroxina. No tiene que hacer nada por ahora.', leida: false }
  ];

  const cuidadores = [
    { id: 'c1', nombre: 'Julián Rojas Peña', documento: 'CC 1.000.000.003', parentesco: 'Hermano', sobre: 'p2', permisos: ['ver', 'avisos'] }
  ];

  return { ETAPAS, personas, autorizaciones, notificaciones, cuidadores };
})();
