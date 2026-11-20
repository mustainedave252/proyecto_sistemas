/* RutaSalud - estado de la aplicación y reglas de negocio simuladas.
   Todo se guarda en localStorage. No hay servidor ni datos reales. */

const RS = (function () {
  const CLAVE = 'rutasalud-v1';
  const DIA = 24 * 60 * 60 * 1000;
  const PLAZO_PRIORITARIO = 2;    // días calendario (Resolución 2335 de 2023)
  const PLAZO_NO_PRIORITARIO = 5; // días calendario (Resolución 2335 de 2023)
  const PLAZO_PENDIENTE_H = 48;   // horas para entregar medicamentos pendientes (Resolución 1604 de 2013)

  let estado = null;

  function aFecha(dia, hora) {
    const f = new Date();
    f.setHours(0, 0, 0, 0);
    f.setTime(f.getTime() + dia * DIA);
    if (hora) {
      const [h, m] = hora.split(':').map(Number);
      if (!isNaN(h)) f.setHours(h, m || 0, 0, 0);
    }
    return f.toISOString();
  }

  function sembrar() {
    const d = JSON.parse(JSON.stringify(RS_DATOS));
    d.autorizaciones.forEach(a => {
      a.historial = a.historial.map(h => ({ etapa: h.etapa, fecha: aFecha(h.dia, h.hora), nota: h.nota || '' }));
      if (a.cita) { a.cita.fecha = aFecha(a.cita.dia); delete a.cita.dia; }
      if (a.negada) { a.negada.fecha = aFecha(a.negada.dia, '10:00'); delete a.negada.dia; }
      if (a.medicamento && a.medicamento.diaEntregaParcial !== undefined) {
        a.medicamento.fechaEntregaParcial = aFecha(a.medicamento.diaEntregaParcial, '11:10');
        delete a.medicamento.diaEntregaParcial;
      }
    });
    d.notificaciones.forEach(n => { n.fecha = aFecha(n.dia, n.hora); delete n.dia; delete n.hora; });
    return {
      version: 1,
      sesion: { activa: false, configurada: false },
      personaActiva: 'todas',
      ajustes: { letra: 'normal', contraste: 'normal', movimiento: 'normal', canal: 'sms' },
      personas: d.personas,
      autorizaciones: d.autorizaciones,
      notificaciones: d.notificaciones,
      cuidadores: d.cuidadores
    };
  }

  function cargar() {
    try {
      const crudo = localStorage.getItem(CLAVE);
      estado = crudo ? JSON.parse(crudo) : sembrar();
    } catch (e) {
      estado = sembrar();
    }
    return estado;
  }

  function guardar() {
    try { localStorage.setItem(CLAVE, JSON.stringify(estado)); } catch (e) { /* almacenamiento no disponible */ }
  }

  function reiniciar() {
    const ajustes = estado ? estado.ajustes : null;
    estado = sembrar();
    if (ajustes) estado.ajustes = ajustes;
    estado.sesion = { activa: true, configurada: true };
    guardar();
  }

  // ---------- Consultas ----------
  const persona = id => estado.personas.find(p => p.id === id);
  const autorizacion = id => estado.autorizaciones.find(a => a.id === id);

  function visibles() {
    const lista = estado.personaActiva === 'todas'
      ? estado.autorizaciones
      : estado.autorizaciones.filter(a => a.personaId === estado.personaActiva);
    return lista.slice().sort((x, y) => ultimaFecha(y) - ultimaFecha(x));
  }

  const ultima = a => a.historial[a.historial.length - 1];
  const ultimaFecha = a => new Date(a.negada ? a.negada.fecha : ultima(a).fecha).getTime();

  function etapas(a) { return RS_DATOS.ETAPAS[a.tipo]; }

  function etapaActual(a) {
    return etapas(a).find(e => e.clave === ultima(a).etapa);
  }

  function terminada(a) {
    return !!a.negada || ['atendida', 'entregado'].includes(ultima(a).etapa);
  }

  function pendienteMed(a) {
    return a.tipo === 'medicamento' && a.medicamento.entregada > 0 && a.medicamento.entregada < a.medicamento.cantidad;
  }

  function fechaLimite(a) {
    const inicio = new Date(a.historial[0].fecha).getTime();
    const dias = a.prioritario ? PLAZO_PRIORITARIO : PLAZO_NO_PRIORITARIO;
    return new Date(inicio + dias * DIA);
  }

  function limitePendiente(a) {
    if (!pendienteMed(a) || !a.medicamento.fechaEntregaParcial) return null;
    return new Date(new Date(a.medicamento.fechaEntregaParcial).getTime() + PLAZO_PENDIENTE_H * 3600 * 1000);
  }

  // Vencida: la EPS no respondió dentro del plazo o no completó la entrega a tiempo.
  function vencida(a) {
    if (a.negada || terminada(a)) return false;
    const enEspera = ['ordenada', 'revision'].includes(ultima(a).etapa);
    if (enEspera && Date.now() > fechaLimite(a).getTime()) return true;
    const lp = limitePendiente(a);
    return !!(lp && Date.now() > lp.getTime());
  }

  // Estado resumido para la etiqueta de color
  function etiqueta(a) {
    if (a.negada) return { texto: 'No aprobada', clase: 'mal' };
    if (vencida(a)) return { texto: 'Plazo vencido', clase: 'mal' };
    const e = ultima(a).etapa;
    if (pendienteMed(a)) return { texto: 'Entrega incompleta', clase: 'revision' };
    if (e === 'ordenada' || e === 'revision') return { texto: 'En revisión', clase: 'revision' };
    if (e === 'aprobada') return { texto: 'Aprobada', clase: 'info' };
    if (e === 'asignada') return { texto: 'Cita asignada', clase: 'ok' };
    if (e === 'dispensacion') return { texto: 'Listo para reclamar', clase: 'ok' };
    if (e === 'atendida') return { texto: 'Atendida', clase: 'neutro' };
    if (e === 'entregado') return { texto: 'Entregado', clase: 'neutro' };
    return { texto: e, clase: 'neutro' };
  }

  function queHacer(a) {
    if (a.negada) return 'Revise el motivo. Si no está de acuerdo, puede presentar un reclamo ante su EPS y, si no le responden, ante la Superintendencia Nacional de Salud.';
    if (vencida(a)) {
      if (pendienteMed(a)) return 'La EPS superó las 48 horas para entregar lo pendiente. Puede presentar un reclamo; en Ayuda le explicamos cómo.';
      return 'La EPS superó el plazo para responder. Puede presentar un reclamo; en Ayuda le explicamos cómo.';
    }
    if (pendienteMed(a)) return 'Le avisaremos cuando las unidades pendientes estén disponibles o cuando las envíen a su domicilio.';
    return etapaActual(a).accion;
  }

  function noLeidas() { return estado.notificaciones.filter(n => !n.leida).length; }

  // ---------- Acciones ----------
  function notificar(autId, titulo, texto) {
    estado.notificaciones.unshift({ id: 'n' + Date.now(), autId, fecha: new Date().toISOString(), titulo, texto, leida: false });
  }

  // Modo demostración: avanza una autorización a la siguiente etapa, como si la EPS respondiera.
  function simularAvance(id) {
    const a = autorizacion(id);
    if (!a || terminada(a)) return null;
    const p = persona(a.personaId);
    if (pendienteMed(a)) {
      a.medicamento.entregada = a.medicamento.cantidad;
      a.historial.push({ etapa: 'entregado', fecha: new Date().toISOString(), nota: 'Se completó la entrega de las unidades pendientes.' });
      notificar(a.id, 'Entrega completa: ' + a.servicio, 'Ya se entregó todo el medicamento de ' + p.corto + '.');
      guardar();
      return a;
    }
    const lista = etapas(a);
    const i = lista.findIndex(e => e.clave === ultima(a).etapa);
    const sig = lista[i + 1];
    if (!sig) return null;
    const reg = { etapa: sig.clave, fecha: new Date().toISOString(), nota: '' };
    if (sig.clave === 'asignada' && !a.cita) {
      a.cita = { fecha: aFecha(4), hora: '8:00 a. m.', lugar: 'Clínica del Corazón Sur (ficticia)', direccion: 'Avenida Boyacá n.º 00-00, Bogotá', profesional: 'Dra. Natalia Ruiz, cardióloga' };
    }
    if (sig.clave === 'entregado') a.medicamento.entregada = a.medicamento.cantidad;
    a.historial.push(reg);
    notificar(a.id, sig.nombre + ': ' + a.servicio, 'Actualización del trámite de ' + p.corto + '. ' + sig.accion);
    guardar();
    return a;
  }

  function marcarLeida(id) {
    const n = estado.notificaciones.find(x => x.id === id);
    if (n) { n.leida = true; guardar(); }
  }
  function marcarTodas() { estado.notificaciones.forEach(n => { n.leida = true; }); guardar(); }

  function agregarCuidador(c) {
    c.id = 'c' + Date.now();
    estado.cuidadores.push(c);
    guardar();
  }
  function quitarCuidador(id) {
    estado.cuidadores = estado.cuidadores.filter(c => c.id !== id);
    guardar();
  }

  return {
    get estado() { return estado; },
    cargar, guardar, reiniciar,
    persona, autorizacion, visibles, etapas, etapaActual, ultima, terminada, pendienteMed,
    fechaLimite, limitePendiente, vencida, etiqueta, queHacer, noLeidas,
    simularAvance, marcarLeida, marcarTodas, agregarCuidador, quitarCuidador
  };
})();
