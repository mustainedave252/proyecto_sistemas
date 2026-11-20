/* RutaSalud - vistas. Cada función devuelve el HTML de una pantalla. */

const Vistas = (function () {
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  const fFecha = iso => new Date(iso).toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const fCorta = iso => new Date(iso).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' });
  const fHora = iso => new Date(iso).toLocaleTimeString('es-CO', { hour: 'numeric', minute: '2-digit' });

  function relativa(iso) {
    const ms = new Date(iso).getTime() - Date.now();
    const dias = Math.round(ms / 86400000);
    if (Math.abs(ms) < 3600000) return 'hace un momento';
    if (dias === 0) return ms > 0 ? 'hoy' : 'hoy';
    if (dias === 1) return 'mañana';
    if (dias === -1) return 'ayer';
    return dias > 0 ? `en ${dias} días` : `hace ${-dias} días`;
  }

  const chip = a => { const e = RS.etiqueta(a); return `<span class="chip chip--${e.clase}">${esc(e.texto)}</span>`; };
  const tipoTxt = a => a.tipo === 'cita' ? 'Cita con especialista' : 'Medicamento';

  // ---------- Ingreso ----------
  function ingreso() {
    return `
    <section class="ingreso caja" aria-labelledby="tituloIngreso">
      <span class="logo" aria-hidden="true">R</span>
      <h1 id="tituloIngreso">Consulte sus autorizaciones</h1>
      <p>Vea en qué va su cita con el especialista o la entrega de su medicamento, sin hacer filas ni llamar.</p>
      <form id="formIngreso" novalidate>
        <div class="campo">
          <label for="tipoDoc">Tipo de documento</label>
          <select id="tipoDoc" name="tipoDoc" autocomplete="off">
            <option value="CC">Cédula de ciudadanía</option>
            <option value="CE">Cédula de extranjería</option>
            <option value="PPT">Permiso por protección temporal</option>
            <option value="TI">Tarjeta de identidad</option>
          </select>
        </div>
        <div class="campo">
          <label for="numDoc">Número de documento</label>
          <span class="ayuda" id="ayudaDoc">Escríbalo sin puntos ni espacios.</span>
          <input type="text" id="numDoc" name="numDoc" inputmode="numeric" autocomplete="username" aria-describedby="ayudaDoc errDoc">
          <p class="error" id="errDoc" hidden></p>
        </div>
        <div class="campo">
          <label for="clave">Contraseña</label>
          <input type="password" id="clave" name="clave" autocomplete="current-password" aria-describedby="errClave">
          <p class="error" id="errClave" hidden></p>
          <button type="button" class="btn btn--texto" id="verClave" aria-pressed="false">Mostrar contraseña</button>
        </div>
        <button class="btn btn--primario btn--bloque" type="submit">Ingresar</button>
      </form>
      <p class="demo-datos"><strong>Datos de prueba:</strong> documento 1000000001 y contraseña demo2026. Puede copiarlos y pegarlos.</p>
    </section>`;
  }

  // ---------- Configuración inicial ----------
  function bienvenida() {
    const aj = RS.estado.ajustes;
    const op = (name, val, txt, actual) => `<label class="opcion"><input type="radio" name="${name}" value="${val}" ${actual === val ? 'checked' : ''}> ${txt}</label>`;
    return `
    <section class="ingreso caja" aria-labelledby="tituloBienv">
      <h1 id="tituloBienv">Antes de empezar</h1>
      <p>Ajuste la plataforma a su gusto. Puede cambiar esto después en <strong>Ajustes</strong>.</p>
      <form id="formBienvenida">
        <fieldset class="campo">
          <legend>Tamaño de la letra</legend>
          ${op('letra', 'normal', 'Normal', aj.letra)}
          ${op('letra', 'grande', 'Grande', aj.letra)}
          ${op('letra', 'muy-grande', 'Muy grande', aj.letra)}
        </fieldset>
        <fieldset class="campo">
          <legend>¿Cómo quiere recibir los avisos?</legend>
          ${op('canal', 'sms', 'Mensaje de texto al celular', aj.canal)}
          ${op('canal', 'correo', 'Correo electrónico', aj.canal)}
          ${op('canal', 'whatsapp', 'WhatsApp', aj.canal)}
        </fieldset>
        <label class="opcion"><input type="checkbox" name="contraste" ${aj.contraste === 'alto' ? 'checked' : ''}> Usar colores de alto contraste</label>
        <button class="btn btn--primario btn--bloque" type="submit">Guardar y continuar</button>
      </form>
    </section>`;
  }

  // ---------- Panel principal ----------
  function tarjeta(a) {
    const p = RS.persona(a.personaId);
    let extra = '';
    if (a.tipo === 'cita' && a.cita && RS.ultima(a).etapa === 'asignada') {
      extra = `<p class="tarjeta__meta"><strong>${esc(fFecha(a.cita.fecha))}, ${esc(a.cita.hora)}</strong></p>`;
    }
    if (RS.pendienteMed(a)) {
      extra = `<p class="tarjeta__meta">Entregado ${a.medicamento.entregada} de ${a.medicamento.cantidad} unidades</p>`;
    }
    return `
      <a class="tarjeta tarjeta--enlace" href="#/autorizacion/${a.id}">
        <div class="tarjeta__fila">
          <div>
            <p class="tarjeta__titulo">${esc(a.servicio)}</p>
            <p class="tarjeta__meta">${tipoTxt(a)} · ${esc(p.corto)}</p>
            ${extra}
          </div>
          ${chip(a)}
        </div>
        <p class="tarjeta__accion"><strong>Qué hacer:</strong> ${esc(RS.queHacer(a))}</p>
      </a>`;
  }

  function inicio() {
    const lista = RS.visibles();
    const activas = lista.filter(a => !RS.terminada(a));
    const vencidas = activas.filter(RS.vencida);
    const citas = activas.filter(a => a.tipo === 'cita' && RS.ultima(a).etapa === 'asignada');
    const meds = activas.filter(a => a.tipo === 'medicamento');
    const titular = RS.persona('p1');

    const alertas = vencidas.map(a => `
      <div class="alerta" role="alert">
        <h2>Un plazo se venció</h2>
        <p><strong>${esc(a.servicio)}</strong> de ${esc(RS.persona(a.personaId).corto)}. ${esc(RS.queHacer(a))}</p>
        <div class="grupo-botones">
          <a class="btn btn--primario" href="#/autorizacion/${a.id}">Ver detalle</a>
          <a class="btn btn--secundario" href="#/ayuda/reclamo">Cómo presentar un reclamo</a>
        </div>
      </div>`).join('');

    return `
      <h1>Hola, ${esc(titular.corto)}</h1>
      <p>Este es el resumen de sus trámites${RS.estado.personaActiva === 'todas' ? ' y los de las personas a su cargo' : ''}.</p>
      ${alertas}
      <div class="rejilla" role="list">
        <div class="cifra" role="listitem"><strong>${activas.length}</strong><span>Trámites activos</span></div>
        <div class="cifra" role="listitem"><strong>${citas.length}</strong><span>Citas asignadas</span></div>
        <div class="cifra" role="listitem"><strong>${meds.length}</strong><span>Medicamentos en curso</span></div>
        <div class="cifra" role="listitem"><strong>${vencidas.length}</strong><span>Plazos vencidos</span></div>
      </div>
      <h2>Autorizaciones activas</h2>
      ${activas.length ? activas.map(tarjeta).join('') : '<p class="vacio">No tiene autorizaciones activas.</p>'}
      <p><a href="#/historial">Ver autorizaciones terminadas</a></p>`;
  }

  // ---------- Detalle ----------
  function detalle(id) {
    const a = RS.autorizacion(id);
    if (!a) return noEncontrada();
    const p = RS.persona(a.personaId);
    const actual = RS.ultima(a).etapa;
    const lista = RS.etapas(a);
    const idxActual = lista.findIndex(e => e.clave === actual);

    const pasos = lista.map((e, i) => {
      const reg = a.historial.find(h => h.etapa === e.clave);
      let clase = '', marca = i + 1;
      if (i < idxActual || (i === idxActual && RS.terminada(a))) { clase = 'hecho'; marca = '✓'; }
      else if (i === idxActual) clase = 'actual';
      const cuando = reg ? `${fCorta(reg.fecha)}, ${fHora(reg.fecha)}` : 'Pendiente';
      const nota = reg && reg.nota ? `<p class="nota">${esc(reg.nota)}</p>` : '';
      const textoActual = i === idxActual && !RS.terminada(a) ? '<span class="oculto-visual"> (etapa actual)</span>' : '';
      return `<li class="${clase}"><span class="punto" aria-hidden="true">${marca}</span>
        <p class="etapa">${esc(e.nombre)}${textoActual}</p><p class="cuando">${esc(cuando)}</p>${nota}</li>`;
    }).join('');

    const negado = a.negada ? `<li class="negado"><span class="punto" aria-hidden="true">✕</span><p class="etapa">No aprobada</p><p class="cuando">${fCorta(a.negada.fecha)}</p><p class="nota">${esc(a.negada.motivo)}</p></li>` : '';

    let bloque = '';
    if (a.tipo === 'cita' && a.cita) {
      bloque = `<dl class="dato-clave">
        <div><dt>Fecha</dt><dd>${esc(fFecha(a.cita.fecha))}</dd></div>
        <div><dt>Hora</dt><dd>${esc(a.cita.hora)}</dd></div>
        <div><dt>Lugar</dt><dd>${esc(a.cita.lugar)}<br><span style="font-weight:400">${esc(a.cita.direccion)}</span></dd></div>
        <div><dt>Profesional</dt><dd>${esc(a.cita.profesional)}</dd></div>
      </dl>`;
    }
    if (a.tipo === 'medicamento') {
      const m = a.medicamento;
      const pct = Math.round(m.entregada / m.cantidad * 100);
      const lp = RS.limitePendiente(a);
      bloque = `<dl class="dato-clave">
        <div><dt>Presentación y dosis</dt><dd>${esc(m.presentacion)}. ${esc(m.dosis)}</dd></div>
        <div><dt>Dónde reclamar</dt><dd>${esc(m.punto)}<br><span style="font-weight:400">${esc(m.direccion)}. ${esc(m.horario)}</span></dd></div>
      </dl>
      <p><strong>Entregado:</strong> ${m.entregada} de ${m.cantidad} unidades</p>
      <div class="barra-progreso" role="progressbar" aria-valuemin="0" aria-valuemax="${m.cantidad}" aria-valuenow="${m.entregada}" aria-label="Unidades entregadas"><span style="width:${pct}%"></span></div>
      ${lp ? `<p class="tarjeta__meta">La EPS debe entregar lo pendiente a más tardar el ${esc(fFecha(lp.toISOString()))} a las ${esc(fHora(lp.toISOString()))}</p>` : ''}`;
    }

    const limite = RS.fechaLimite(a);
    const plazoTxt = ['ordenada', 'revision'].includes(actual) && !a.negada
      ? `<p><strong>Fecha límite de respuesta de la EPS:</strong> ${esc(fFecha(limite.toISOString()))} (${a.prioritario ? '2 días, servicio prioritario' : '5 días, servicio no prioritario'})</p>` : '';

    const vencidaTxt = RS.vencida(a) ? `<div class="alerta" role="alert"><h2>El plazo se venció</h2><p>${esc(RS.queHacer(a))}</p><a class="btn btn--primario" href="#/ayuda/reclamo">Ver cómo reclamar</a></div>` : '';

    return `
      <p><a href="#/inicio">← Volver al inicio</a></p>
      ${vencidaTxt}
      <section class="caja resumen" aria-labelledby="tituloDet">
        <div class="tarjeta__fila"><p class="tarjeta__meta">${tipoTxt(a)} · ${esc(p.nombre)}</p>${chip(a)}</div>
        <h1 id="tituloDet">${esc(a.servicio)}</h1>
        <div class="radicado"><span>Número de autorización:</span> <code id="numRadicado">${esc(a.radicado)}</code>
          <button class="btn btn--texto" type="button" data-copiar="${esc(a.radicado)}">Copiar número</button></div>
        ${plazoTxt}
        ${bloque}
        <div class="alerta alerta--info"><h3>¿Qué debo hacer ahora?</h3><p>${esc(RS.queHacer(a))}</p></div>
      </section>
      <section class="caja" aria-labelledby="tituloLinea">
        <h2 id="tituloLinea">Recorrido de la autorización</h2>
        <ol class="linea">${a.negada ? a.historial.map((h, i) => `<li class="hecho"><span class="punto" aria-hidden="true">✓</span><p class="etapa">${esc(lista.find(e => e.clave === h.etapa).nombre)}</p><p class="cuando">${fCorta(h.fecha)}, ${fHora(h.fecha)}</p></li>`).join('') + negado : pasos}</ol>
      </section>
      <div class="grupo-botones">
        <button class="btn btn--secundario" type="button" data-orden="${a.id}">Ver la orden médica</button>
        <button class="btn btn--secundario" type="button" data-asesor>Hablar con un asesor</button>
      </div>`;
  }

  function orden(a) {
    const p = RS.persona(a.personaId);
    return `<h2 id="modalTitulo">Orden médica</h2>
      <table class="tabla-simple"><tbody>
        <tr><th scope="row">Paciente</th><td>${esc(p.nombre)}, ${esc(p.documento)}</td></tr>
        <tr><th scope="row">Servicio</th><td>${esc(a.servicio)}</td></tr>
        <tr><th scope="row">Motivo</th><td>${esc(a.diagnostico)}</td></tr>
        <tr><th scope="row">Ordenado por</th><td>${esc(a.medico)}</td></tr>
        <tr><th scope="row">IPS que envió la orden</th><td>${esc(a.ipsOrigen)}</td></tr>
        <tr><th scope="row">Fecha de la orden</th><td>${fCorta(a.historial[0].fecha)}</td></tr>
        <tr><th scope="row">Prioridad</th><td>${a.prioritario ? 'Prioritario' : 'No prioritario'}</td></tr>
      </tbody></table>
      <p class="tarjeta__meta">La IPS envió esta orden directamente a la EPS. Usted no tiene que llevarla ni radicarla.</p>`;
  }

  function asesor() {
    return `<h2 id="modalTitulo">Hablar con un asesor</h2>
      <p>Línea de atención de Salud Andina EPS (ficticia): <strong>601 000 0000</strong>, lunes a sábado de 7:00 a. m. a 7:00 p. m.</p>
      <p>Tenga a mano el número de autorización. Puede copiarlo desde el detalle con un solo toque.</p>
      <p>Si prefiere atención presencial, puede acudir a cualquier oficina de su EPS.</p>`;
  }

  // ---------- Medicamentos ----------
  function medicamentos() {
    const meds = RS.visibles().filter(a => a.tipo === 'medicamento');
    const pend = meds.filter(RS.pendienteMed);
    const resto = meds.filter(a => !RS.pendienteMed(a));
    const fila = a => {
      const m = a.medicamento;
      const pct = Math.round(m.entregada / m.cantidad * 100);
      return `<a class="tarjeta tarjeta--enlace" href="#/autorizacion/${a.id}">
        <div class="tarjeta__fila"><div><p class="tarjeta__titulo">${esc(a.servicio)}</p>
        <p class="tarjeta__meta">${esc(RS.persona(a.personaId).corto)} · ${esc(m.punto)}</p></div>${chip(a)}</div>
        <div class="barra-progreso" aria-hidden="true"><span style="width:${pct}%"></span></div>
        <p class="tarjeta__meta">Entregado ${m.entregada} de ${m.cantidad} unidades</p></a>`;
    };
    return `
      <h1>Medicamentos</h1>
      ${pend.length ? `<div class="alerta alerta--info"><h2>Pendientes de entrega</h2><p>Cuando la droguería no entrega todo el medicamento, la EPS debe completar la entrega en un máximo de 48 horas, en el punto de entrega o en su domicilio.</p></div>${pend.map(fila).join('')}` : ''}
      <h2>Todos los medicamentos</h2>
      ${resto.length ? resto.map(fila).join('') : '<p class="vacio">No hay más medicamentos.</p>'}`;
  }

  // ---------- Notificaciones ----------
  function notificaciones() {
    const ns = RS.estado.notificaciones.slice().sort((x, y) => new Date(y.fecha) - new Date(x.fecha));
    return `
      <div class="tarjeta__fila"><h1>Avisos</h1>
      ${RS.noLeidas() ? '<button class="btn btn--texto" type="button" id="leerTodas">Marcar todos como leídos</button>' : ''}</div>
      <p>Los avisos también le llegan por ${({ sms: 'mensaje de texto', correo: 'correo electrónico', whatsapp: 'WhatsApp' })[RS.estado.ajustes.canal]}.</p>
      ${ns.length ? ns.map(n => `
        <article class="tarjeta aviso ${n.leida ? '' : 'aviso--nuevo'}">
          <div style="flex:1">
            <h2 class="tarjeta__titulo">${n.leida ? '' : '<span class="oculto-visual">Nuevo: </span>'}${esc(n.titulo)}</h2>
            <p>${esc(n.texto)}</p>
            <time datetime="${n.fecha}">${esc(relativa(n.fecha))}, ${fHora(n.fecha)}</time>
            <div class="grupo-botones"><a class="btn btn--secundario" href="#/autorizacion/${n.autId}" data-leer="${n.id}">Ver trámite</a></div>
          </div>
        </article>`).join('') : '<p class="vacio">No tiene avisos.</p>'}`;
  }

  // ---------- Historial ----------
  function historial(filtro) {
    const f = filtro || { texto: '', tipo: 'todos', estado: 'todos' };
    let lista = RS.visibles();
    if (f.tipo !== 'todos') lista = lista.filter(a => a.tipo === f.tipo);
    if (f.estado === 'activas') lista = lista.filter(a => !RS.terminada(a));
    if (f.estado === 'terminadas') lista = lista.filter(RS.terminada);
    if (f.texto) {
      const t = f.texto.toLowerCase();
      lista = lista.filter(a => (a.servicio + ' ' + a.radicado).toLowerCase().includes(t));
    }
    const sel = (v, actual) => v === actual ? 'selected' : '';
    return `
      <h1>Historial de autorizaciones</h1>
      <form class="filtros" id="formFiltros" role="search" onsubmit="return false">
        <div><label class="oculto-visual" for="fTexto">Buscar</label>
          <input type="search" id="fTexto" placeholder="Buscar por servicio o número" value="${esc(f.texto)}"></div>
        <div><label class="oculto-visual" for="fTipo">Tipo</label>
          <select id="fTipo"><option value="todos" ${sel('todos', f.tipo)}>Todos los tipos</option><option value="cita" ${sel('cita', f.tipo)}>Citas</option><option value="medicamento" ${sel('medicamento', f.tipo)}>Medicamentos</option></select></div>
        <div><label class="oculto-visual" for="fEstado">Estado</label>
          <select id="fEstado"><option value="todos" ${sel('todos', f.estado)}>Todos los estados</option><option value="activas" ${sel('activas', f.estado)}>Activas</option><option value="terminadas" ${sel('terminadas', f.estado)}>Terminadas</option></select></div>
      </form>
      <p aria-live="polite">${lista.length} resultado${lista.length === 1 ? '' : 's'}</p>
      <div id="listaHist">${lista.map(a => `
        <a class="tarjeta tarjeta--enlace" href="#/autorizacion/${a.id}">
          <div class="tarjeta__fila"><div><p class="tarjeta__titulo">${esc(a.servicio)}</p>
          <p class="tarjeta__meta">${tipoTxt(a)} · ${esc(RS.persona(a.personaId).corto)} · ${esc(a.radicado)} · ${fCorta(a.historial[0].fecha)}</p></div>${chip(a)}</div>
        </a>`).join('')}</div>`;
  }

  // ---------- Perfil ----------
  function perfil() {
    const t = RS.persona('p1');
    const filaP = p => `<tr><th scope="row">${esc(p.nombre)}</th><td>${esc(p.documento)}</td><td>${esc(p.relacion)}</td></tr>`;
    const cuid = RS.estado.cuidadores.map(c => `
      <li class="tarjeta"><div class="tarjeta__fila"><div>
        <p class="tarjeta__titulo">${esc(c.nombre)}</p>
        <p class="tarjeta__meta">${esc(c.parentesco)} · ${esc(c.documento)} · Puede ver la información de ${esc(RS.persona(c.sobre).corto)}</p>
        <p class="tarjeta__meta">Permisos: ${c.permisos.map(x => ({ ver: 'consultar trámites', avisos: 'recibir avisos' })[x]).join(' y ')}</p></div>
        <button class="btn btn--texto" type="button" data-quitar="${c.id}" aria-label="Quitar a ${esc(c.nombre)}">Quitar</button></div></li>`).join('');
    return `
      <h1>Perfil</h1>
      <section class="caja" aria-labelledby="tDatos">
        <h2 id="tDatos">Sus datos</h2>
        <dl class="dato-clave">
          <div><dt>Nombre</dt><dd>${esc(t.nombre)}</dd></div>
          <div><dt>Documento</dt><dd>${esc(t.documento)}</dd></div>
          <div><dt>EPS y régimen</dt><dd>${esc(t.eps)}, ${esc(t.regimen)}</dd></div>
          <div><dt>Celular y correo</dt><dd>${esc(t.telefono)} · ${esc(t.correo)}</dd></div>
        </dl>
      </section>
      <section class="caja" aria-labelledby="tCargo">
        <h2 id="tCargo">Personas cuyos trámites usted consulta</h2>
        <table class="tabla-simple"><thead><tr><th scope="col">Nombre</th><th scope="col">Documento</th><th scope="col">Relación</th></tr></thead>
        <tbody>${RS.estado.personas.map(filaP).join('')}</tbody></table>
      </section>
      <section class="caja" aria-labelledby="tCuid">
        <h2 id="tCuid">Acompañantes autorizados</h2>
        <p>Son personas de confianza que pueden ver los trámites de alguien a su cargo. Solo pueden consultar; nunca pueden cambiar datos.</p>
        <ul style="list-style:none;padding:0">${cuid || '<li class="vacio">No hay acompañantes.</li>'}</ul>
        <form id="formCuidador" novalidate>
          <h3>Agregar acompañante</h3>
          <div class="campo"><label for="cNombre">Nombre completo</label><input type="text" id="cNombre" autocomplete="name" aria-describedby="eNombre"><p class="error" id="eNombre" hidden></p></div>
          <div class="campo"><label for="cDoc">Número de documento</label><input type="text" id="cDoc" inputmode="numeric" aria-describedby="eDoc"><p class="error" id="eDoc" hidden></p></div>
          <div class="campo"><label for="cPar">Parentesco</label><select id="cPar"><option>Hijo o hija</option><option>Hermano o hermana</option><option>Esposo o esposa</option><option>Otro familiar</option><option>Cuidador no familiar</option></select></div>
          <div class="campo"><label for="cSobre">Puede ver los trámites de</label><select id="cSobre">${RS.estado.personas.map(p => `<option value="${p.id}">${esc(p.nombre)}</option>`).join('')}</select></div>
          <fieldset class="campo"><legend>Permisos</legend>
            <label class="opcion"><input type="checkbox" name="perm" value="ver" checked disabled> Consultar trámites (siempre incluido)</label>
            <label class="opcion"><input type="checkbox" name="perm" value="avisos" checked> Recibir avisos</label></fieldset>
          <label class="opcion"><input type="checkbox" id="cConsent"> La persona dio su autorización para compartir esta información</label>
          <p class="error" id="eConsent" hidden></p>
          <button class="btn btn--primario" type="submit">Agregar acompañante</button>
        </form>
      </section>`;
  }

  // ---------- Ajustes ----------
  function ajustes() {
    const aj = RS.estado.ajustes;
    const op = (name, val, txt) => `<label class="opcion"><input type="radio" name="${name}" value="${val}" ${aj[name] === val ? 'checked' : ''}> ${txt}</label>`;
    const activas = RS.estado.autorizaciones.filter(a => !RS.terminada(a));
    return `
      <h1>Ajustes</h1>
      <form id="formAjustes">
        <section class="caja"><fieldset><legend><h2 style="margin:0 0 8px">Tamaño de la letra</h2></legend>
          ${op('letra', 'normal', 'Normal')}${op('letra', 'grande', 'Grande')}${op('letra', 'muy-grande', 'Muy grande')}</fieldset></section>
        <section class="caja"><fieldset><legend><h2 style="margin:0 0 8px">Colores</h2></legend>
          ${op('contraste', 'normal', 'Colores normales')}${op('contraste', 'alto', 'Alto contraste')}</fieldset></section>
        <section class="caja"><fieldset><legend><h2 style="margin:0 0 8px">Animaciones</h2></legend>
          ${op('movimiento', 'normal', 'Mostrar animaciones')}${op('movimiento', 'reducido', 'Reducir animaciones')}</fieldset></section>
        <section class="caja"><fieldset><legend><h2 style="margin:0 0 8px">Canal de avisos</h2></legend>
          ${op('canal', 'sms', 'Mensaje de texto')}${op('canal', 'correo', 'Correo electrónico')}${op('canal', 'whatsapp', 'WhatsApp')}</fieldset></section>
      </form>
      <section class="caja" aria-labelledby="tDemo">
        <h2 id="tDemo">Modo demostración</h2>
        <p>Simula la respuesta de la EPS para ver cómo cambia una autorización y cómo llega el aviso.</p>
        <div class="campo"><label for="demoAut">Autorización</label>
          <select id="demoAut">${activas.map(a => `<option value="${a.id}">${esc(a.servicio)} (${esc(RS.persona(a.personaId).corto)})</option>`).join('')}</select></div>
        <div class="grupo-botones">
          <button class="btn btn--primario" type="button" id="btnAvanzar" ${activas.length ? '' : 'disabled'}>Simular avance del trámite</button>
          <button class="btn btn--secundario" type="button" id="btnReiniciar">Restablecer datos de prueba</button>
        </div>
      </section>`;
  }

  // ---------- Ayuda ----------
  function ayuda(seccion) {
    return `
      <h1>Ayuda</h1>
      <section class="caja" aria-labelledby="tReq">
        <h2 id="tReq">¿Qué necesito para una autorización?</h2>
        <div class="pestanas" role="tablist" aria-label="Tipo de trámite">
          <button class="btn btn--secundario" role="tab" id="tabCita" aria-controls="panelCita" aria-selected="true">Cita con especialista</button>
          <button class="btn btn--secundario" role="tab" id="tabMed" aria-controls="panelMed" aria-selected="false" tabindex="-1">Medicamento</button>
        </div>
        <div role="tabpanel" id="panelCita" aria-labelledby="tabCita">
          <ul class="pasos">
            <li>Su médico general o tratante genera la orden en la consulta.</li>
            <li>La IPS envía la orden a la EPS. <strong>Usted no tiene que radicarla ni llevar papeles.</strong></li>
            <li>La EPS tiene 2 días calendario para responder si el servicio es prioritario y 5 si no lo es.</li>
            <li>En esta plataforma verá la fecha, la hora y el lugar de la cita apenas la asignen.</li>
          </ul>
        </div>
        <div role="tabpanel" id="panelMed" aria-labelledby="tabMed" hidden>
          <ul class="pasos">
            <li>El médico formula el medicamento y la fórmula queda en el sistema.</li>
            <li>Si el medicamento necesita autorización, la gestiona la IPS o la droguería con la EPS.</li>
            <li>Lleve su documento de identidad al punto de entrega que aparece en el detalle.</li>
            <li>Si no le entregan todo, la EPS debe completar la entrega en un máximo de 48 horas.</li>
          </ul>
        </div>
      </section>
      <h2 id="reclamo">Si un plazo se vence</h2>
      <details ${seccion === 'reclamo' ? 'open' : ''}><summary>Cómo presentar un reclamo</summary><div>
        <ol class="pasos">
          <li>Copie el número de autorización desde el detalle del trámite.</li>
          <li>Presente una petición, queja o reclamo ante su EPS por su página web, la línea de atención o una oficina. Guarde el número que le den.</li>
          <li>Si la EPS no le responde o la respuesta no le soluciona, acuda a la Superintendencia Nacional de Salud en <a href="https://www.supersalud.gov.co" target="_blank" rel="noopener">supersalud.gov.co</a>.</li>
          <li>Si su salud corre riesgo, puede interponer una acción de tutela. No necesita abogado.</li>
        </ol></div></details>
      <details><summary>¿Por qué no tengo que radicar documentos?</summary><div>
        <p>Desde la Circular Conjunta Externa 019 de 2025, la autorización la tramita la IPS o la droguería directamente con la EPS. Nadie puede pedirle que haga filas para eso.</p></div></details>
      <details><summary>¿Cómo ayudo a un familiar?</summary><div>
        <p>En <a href="#/perfil">Perfil</a> puede ver las personas a su cargo y agregar acompañantes de confianza. Arriba, en el selector de persona, elija de quién quiere ver los trámites.</p></div></details>
      <details><summary>No entiendo una palabra</summary><div>
        <dl>
          <dt><strong>EPS</strong></dt><dd>La entidad donde está afiliado y que responde por su atención.</dd>
          <dt><strong>IPS</strong></dt><dd>El lugar donde lo atienden: clínica, hospital, centro médico o laboratorio.</dd>
          <dt><strong>Autorización</strong></dt><dd>La aprobación de la EPS para que le presten un servicio o le entreguen un medicamento.</dd>
        </dl></div></details>`;
  }

  function noEncontrada() {
    return `<h1>No encontramos esta página</h1><p><a href="#/inicio">Volver al inicio</a></p>`;
  }

  return { ingreso, bienvenida, inicio, detalle, orden, asesor, medicamentos, notificaciones, historial, perfil, ajustes, ayuda, noEncontrada };
})();
