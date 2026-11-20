/* RutaSalud - enrutador por hash y manejo de eventos. */

(function () {
  const $ = s => document.querySelector(s);
  const main = $('#contenido');
  const USUARIO_DEMO = { doc: '1000000001', clave: 'demo2026' };
  let filtroHist = { texto: '', tipo: 'todos', estado: 'todos' };

  RS.cargar();
  aplicarAjustes();

  function aplicarAjustes() {
    const aj = RS.estado.ajustes;
    const html = document.documentElement;
    html.dataset.letra = aj.letra;
    html.dataset.contraste = aj.contraste;
    html.dataset.movimiento = aj.movimiento;
  }

  function aviso(texto) {
    const t = $('#toast');
    t.textContent = texto;
    t.classList.add('visible');
    clearTimeout(aviso.temp);
    aviso.temp = setTimeout(() => t.classList.remove('visible'), 3500);
  }

  function abrirModal(html) {
    $('#modalCuerpo').innerHTML = html;
    const d = $('#modal');
    if (typeof d.showModal === 'function') d.showModal(); else d.setAttribute('open', '');
  }

  function marco(visible) {
    $('#barra').hidden = !visible;
    $('#menu').hidden = !visible;
    document.body.classList.toggle('sin-menu', !visible);
    if (visible) {
      const n = RS.noLeidas();
      const c = $('#contadorAvisos');
      c.hidden = n === 0;
      c.textContent = n;
      c.setAttribute('aria-label', n + ' sin leer');
      const ps = RS.estado.personas;
      $('#selectorPersona').innerHTML = `<label for="selPersona">Ver trámites de</label>
        <select id="selPersona">
          <option value="todas">Todas las personas</option>
          ${ps.map(p => `<option value="${p.id}" ${RS.estado.personaActiva === p.id ? 'selected' : ''}>${p.corto}</option>`).join('')}
        </select>`;
      if (RS.estado.personaActiva === 'todas') $('#selPersona').value = 'todas';
    }
  }

  const TITULOS = {
    ingreso: 'Ingreso', bienvenida: 'Configuración inicial', inicio: 'Inicio', autorizacion: 'Detalle de la autorización',
    medicamentos: 'Medicamentos', notificaciones: 'Avisos', historial: 'Historial', perfil: 'Perfil', ajustes: 'Ajustes', ayuda: 'Ayuda'
  };

  function enrutar(ev) {
    const partes = (location.hash.replace(/^#\/?/, '') || 'inicio').split('/');
    let ruta = partes[0];
    const param = partes[1];
    const s = RS.estado.sesion;

    if (!s.activa && ruta !== 'ingreso') { location.hash = '#/ingreso'; return; }
    if (s.activa && !s.configurada && ruta !== 'bienvenida') { location.hash = '#/bienvenida'; return; }
    if (s.activa && ruta === 'ingreso') { location.hash = '#/inicio'; return; }

    let html;
    switch (ruta) {
      case 'ingreso': html = Vistas.ingreso(); break;
      case 'bienvenida': html = Vistas.bienvenida(); break;
      case 'inicio': html = Vistas.inicio(); break;
      case 'autorizacion': html = Vistas.detalle(param); break;
      case 'medicamentos': html = Vistas.medicamentos(); break;
      case 'notificaciones': html = Vistas.notificaciones(); break;
      case 'historial': html = Vistas.historial(filtroHist); break;
      case 'perfil': html = Vistas.perfil(); break;
      case 'ajustes': html = Vistas.ajustes(); break;
      case 'ayuda': html = Vistas.ayuda(param); break;
      default: html = Vistas.noEncontrada(); ruta = '';
    }

    marco(s.activa && s.configurada);
    main.innerHTML = html;
    document.title = (TITULOS[ruta] || 'Página no encontrada') + ' · RutaSalud';
    document.querySelectorAll('.menu a').forEach(a => {
      const activo = a.dataset.ruta === ruta || (ruta === 'autorizacion' && a.dataset.ruta === 'inicio');
      if (activo) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
    });

    // Lleva el foco al título para que el lector de pantalla anuncie el cambio de pantalla
    const h1 = main.querySelector('h1');
    if (h1 && ev && ev.type === 'hashchange') { h1.setAttribute('tabindex', '-1'); h1.focus({ preventScroll: true }); }
    window.scrollTo(0, 0);
    if (ruta === 'ayuda' && param) { const el = document.getElementById(param); if (el) el.scrollIntoView(); }
  }

  // ---------- Validaciones ----------
  function error(id, msg, campo) {
    const e = document.getElementById(id);
    e.textContent = msg || '';
    e.hidden = !msg;
    if (campo) campo.setAttribute('aria-invalid', msg ? 'true' : 'false');
    return !msg;
  }

  function ingresar(ev) {
    ev.preventDefault();
    const doc = $('#numDoc'), clave = $('#clave');
    const v = doc.value.replace(/[.\s]/g, '');
    let ok = true;
    if (!v) ok = error('errDoc', 'Escriba su número de documento.', doc) && ok;
    else if (!/^\d{5,12}$/.test(v)) ok = error('errDoc', 'El número solo debe tener dígitos, entre 5 y 12.', doc) && ok;
    else error('errDoc', '', doc);
    if (!clave.value) ok = error('errClave', 'Escriba su contraseña.', clave) && ok;
    else error('errClave', '', clave);
    if (!ok) { main.querySelector('[aria-invalid="true"]').focus(); return; }
    if (v !== USUARIO_DEMO.doc || clave.value !== USUARIO_DEMO.clave) {
      error('errClave', 'El documento o la contraseña no coinciden. Revise los datos de prueba que aparecen abajo.', clave);
      clave.focus();
      return;
    }
    RS.estado.sesion.activa = true;
    RS.guardar();
    location.hash = RS.estado.sesion.configurada ? '#/inicio' : '#/bienvenida';
  }

  function guardarBienvenida(ev) {
    ev.preventDefault();
    const f = ev.target;
    RS.estado.ajustes.letra = f.letra.value;
    RS.estado.ajustes.canal = f.canal.value;
    RS.estado.ajustes.contraste = f.contraste.checked ? 'alto' : 'normal';
    RS.estado.sesion.configurada = true;
    RS.guardar();
    aplicarAjustes();
    location.hash = '#/inicio';
    aviso('Preferencias guardadas');
  }

  function agregarCuidador(ev) {
    ev.preventDefault();
    const nom = $('#cNombre'), doc = $('#cDoc'), cons = $('#cConsent');
    let ok = true;
    ok = error('eNombre', nom.value.trim().length < 5 ? 'Escriba el nombre completo.' : '', nom) && ok;
    ok = error('eDoc', /^\d{5,12}$/.test(doc.value.replace(/[.\s]/g, '')) ? '' : 'El documento solo debe tener dígitos, entre 5 y 12.', doc) && ok;
    ok = error('eConsent', cons.checked ? '' : 'Debe confirmar que la persona autorizó compartir su información.', cons) && ok;
    if (!ok) { main.querySelector('[aria-invalid="true"]').focus(); return; }
    const permisos = ['ver'];
    if (main.querySelector('input[name="perm"][value="avisos"]').checked) permisos.push('avisos');
    const n = doc.value.replace(/\D/g, '');
    RS.agregarCuidador({
      nombre: nom.value.trim(), documento: 'CC ' + Number(n).toLocaleString('es-CO'),
      parentesco: $('#cPar').value, sobre: $('#cSobre').value, permisos
    });
    enrutar();
    aviso('Acompañante agregado');
  }

  // ---------- Delegación de eventos ----------
  document.addEventListener('submit', ev => {
    if (ev.target.id === 'formIngreso') ingresar(ev);
    if (ev.target.id === 'formBienvenida') guardarBienvenida(ev);
    if (ev.target.id === 'formCuidador') agregarCuidador(ev);
  });

  document.addEventListener('change', ev => {
    const t = ev.target;
    if (t.id === 'selPersona') {
      RS.estado.personaActiva = t.value;
      RS.guardar();
      enrutar();
      aviso(t.value === 'todas' ? 'Mostrando todas las personas' : 'Mostrando los trámites de ' + RS.persona(t.value).corto);
    }
    if (t.form && t.form.id === 'formAjustes') {
      RS.estado.ajustes[t.name] = t.value;
      RS.guardar();
      aplicarAjustes();
      aviso('Ajuste guardado');
    }
    if (t.id === 'fTipo' || t.id === 'fEstado') {
      filtroHist.tipo = $('#fTipo').value;
      filtroHist.estado = $('#fEstado').value;
      refrescarHistorial();
    }
  });

  document.addEventListener('input', ev => {
    if (ev.target.id === 'fTexto') { filtroHist.texto = ev.target.value; refrescarHistorial(); }
  });

  function refrescarHistorial() {
    // Vuelve a pintar solo la lista para no perder el foco del campo de búsqueda
    const temp = document.createElement('div');
    temp.innerHTML = Vistas.historial(filtroHist);
    main.querySelector('#listaHist').replaceWith(temp.querySelector('#listaHist'));
    main.querySelector('[aria-live]').textContent = temp.querySelector('[aria-live]').textContent;
  }

  document.addEventListener('click', ev => {
    const t = ev.target.closest('button, a');
    if (!t) return;

    if (t.id === 'verClave') {
      const c = $('#clave');
      const ver = c.type === 'password';
      c.type = ver ? 'text' : 'password';
      t.textContent = ver ? 'Ocultar contraseña' : 'Mostrar contraseña';
      t.setAttribute('aria-pressed', String(ver));
    }
    if (t.id === 'btnSalir') {
      RS.estado.sesion.activa = false;
      RS.guardar();
      location.hash = '#/ingreso';
    }
    if (t.dataset.copiar) {
      const txt = t.dataset.copiar;
      const listo = () => aviso('Número ' + txt + ' copiado');
      if (navigator.clipboard) navigator.clipboard.writeText(txt).then(listo, listo); else listo();
    }
    if (t.dataset.orden) abrirModal(Vistas.orden(RS.autorizacion(t.dataset.orden)));
    if (t.hasAttribute('data-asesor')) abrirModal(Vistas.asesor());
    if (t.dataset.leer) RS.marcarLeida(t.dataset.leer);
    if (t.id === 'leerTodas') { RS.marcarTodas(); enrutar(); aviso('Todos los avisos quedaron como leídos'); }
    if (t.dataset.quitar) { RS.quitarCuidador(t.dataset.quitar); enrutar(); aviso('Acompañante retirado'); }
    if (t.id === 'btnAvanzar') {
      const a = RS.simularAvance($('#demoAut').value);
      if (a) { enrutar(); aviso('Nuevo aviso: ' + RS.etiqueta(a).texto + ' · ' + a.servicio); }
    }
    if (t.id === 'btnReiniciar') { RS.reiniciar(); aplicarAjustes(); enrutar(); aviso('Datos de prueba restablecidos'); }

    // Pestañas de la ayuda
    if (t.getAttribute('role') === 'tab') activarPestana(t);
  });

  function activarPestana(tab) {
    const lista = tab.parentElement.querySelectorAll('[role="tab"]');
    lista.forEach(x => {
      const sel = x === tab;
      x.setAttribute('aria-selected', String(sel));
      x.tabIndex = sel ? 0 : -1;
      document.getElementById(x.getAttribute('aria-controls')).hidden = !sel;
    });
    tab.focus();
  }

  // Flechas izquierda y derecha entre pestañas
  document.addEventListener('keydown', ev => {
    const t = ev.target;
    if (t.getAttribute && t.getAttribute('role') === 'tab' && (ev.key === 'ArrowRight' || ev.key === 'ArrowLeft')) {
      const tabs = [...t.parentElement.querySelectorAll('[role="tab"]')];
      const i = tabs.indexOf(t);
      activarPestana(tabs[(i + (ev.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length]);
      ev.preventDefault();
    }
  });

  window.addEventListener('hashchange', enrutar);
  enrutar();
})();
