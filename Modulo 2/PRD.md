# PRD-001: Orgenicemos — Aplicación para la gestión de eventos

## Contexto y Problema

Se requiere una solución web responsive (usable desde navegadores de escritorio y móviles) para la gestión integral de eventos que automatice el envío de invitaciones, la confirmación de asistencia (RSVP) y el seguimiento posterior. La aplicación busca optimizar la comunicación entre organizadores e invitados mediante recordatorios automáticos y herramientas de retroalimentación (encuestas y observaciones).

Personas:

- Organizador de evento: Crea un evento con fecha, hora, ubicación, descripción, e invita a un grupo de personas.
- Invitado: Persona invitada a un evento. Puede ver la ficha del evento (incluidas las observaciones) y responder la invitación (con o sin cuenta); si asiste, puede además responder las encuestas.

## Objetivos

- OBJ-01: Que un organizador pueda crear eventos e invitar personas por correo electrónico. Meta: un organizador crea un evento con sus invitados en menos de 60 minutos.
- OBJ-02: Que los invitados puedan confirmar o rechazar su asistencia sin necesidad de crear una cuenta. Meta: al menos el 60 % de los invitados responde (Aceptado o Rechazado) antes del vencimiento del plazo de respuesta (24 horas antes del evento).
- OBJ-03: Reducir la cantidad de invitados que no responden, mediante recordatorios automáticos. Meta: al menos el 80 % de los invitados responde (Aceptado o Rechazado) antes del vencimiento del plazo de respuesta (24 horas antes del evento).
- OBJ-04: Que el organizador pueda recolectar la opinión de los asistentes mediante encuestas vinculadas al evento. Meta: al menos el 10 % de los invitados Aceptados responde al menos una encuesta.

## Definiciones

- Estados del invitado: Pendiente (aún no respondió), Aceptado y Rechazado.
- Ficha del evento: título, fecha, hora, ubicación, descripción y observaciones.
- Ventana de visibilidad: período en el que un invitado puede ver la ficha del evento, desde que es invitado hasta 4 horas después de la fecha y hora del evento, inclusive. El organizador no tiene límite de visibilidad.
- Plazo de respuesta: un invitado puede responder o cambiar su respuesta mientras falten 24 horas o más para la fecha y hora del evento, inclusive el instante exacto de las 24 horas.
- Precisión de los plazos: los plazos y ventanas se evalúan con precisión de 1 minuto.
- Encuesta activa: encuesta de un evento que no está cancelado y cuya ventana de visibilidad no terminó.

## Requerimientos Funcionales

- RF-01: El sistema debe permitir que una persona se registre utilizando su correo electrónico y una contraseña.
- RF-02: El sistema debe permitir que un usuario registrado inicie sesión utilizando su correo electrónico y su contraseña.
- RF-03: Una persona autenticada (organizador) debe poder crear eventos definiendo: título, fecha, hora, ubicación (física o enlace virtual), descripción y lista de correos de invitados.
- RF-04: (Antelación de creación) El sistema solo debe permitir la creación de eventos cuya fecha de realización sea al menos 4 días calendario posterior a la fecha de creación (por ejemplo, un evento creado el día 1 puede realizarse desde el día 5 en adelante).
- RF-05: Solo el organizador del evento debe poder editar sus detalles, excepto la fecha y la hora (ver RF-06).
- RF-06: El sistema no debe permitir modificar la fecha ni la hora de un evento ya creado.
- RF-07: Solo el organizador del evento debe poder cancelarlo.
- RF-08: Al cancelar un evento, el sistema debe cancelar todas las encuestas vinculadas a ese evento.
- RF-09: Al cancelar un evento, el sistema debe enviar automáticamente un correo electrónico avisando la cancelación a los invitados en estado Aceptado o Pendiente.
- RF-10: Las encuestas de un evento cancelado deben seguir visibles para el organizador, junto con las respuestas de todos los invitados.
- RF-11: Las encuestas de un evento cancelado deben seguir visibles para cada invitado Aceptado, junto con sus propias respuestas, durante su ventana de visibilidad.
- RF-12: El sistema debe permitir a un usuario autenticado listar los eventos que creó como organizador.
- RF-13: El sistema debe permitir a un usuario autenticado listar los eventos en los que figura como invitado el correo electrónico de su cuenta.
- RF-14: La ficha de un evento, sus observaciones y sus encuestas solo deben ser visibles para el organizador y para las personas invitadas a dicho evento.
- RF-15: Al crear un evento, el sistema debe enviar automáticamente a cada invitado una invitación individual por correo electrónico con un enlace único de respuesta.
- RF-16: Al actualizar un evento, el sistema debe enviar automáticamente a los invitados en estado Aceptado o Pendiente un correo electrónico con los datos actualizados del evento y su enlace único de respuesta.
- RF-17: El invitado, con o sin cuenta, debe poder confirmar (Aceptado) o rechazar (Rechazado) la invitación únicamente dentro del plazo de respuesta; el invitado sin cuenta lo hace mediante el enlace único enviado a su correo electrónico.
- RF-18: El invitado, con o sin cuenta, debe poder cambiar su respuesta (de Aceptado a Rechazado o de Rechazado a Aceptado) únicamente dentro del plazo de respuesta.
- RF-19: El sistema debe ejecutar un proceso automático cada hora, en punto, que pase a estado Rechazado a los invitados en estado Pendiente cuyo plazo de respuesta haya vencido, en eventos no cancelados.
- RF-20: Todo invitado, con o sin cuenta, sin importar el estado de su respuesta, debe poder ver la ficha del evento al que fue invitado durante su ventana de visibilidad.
- RF-21: Solo el organizador debe poder ver la cantidad de invitados en cada estado: Aceptado, Rechazado y Pendiente.
- RF-22: Solo el organizador debe poder ver el listado de invitados agrupados por estado: Aceptado, Rechazado y Pendiente.
- RF-23: El sistema debe ejecutar un proceso automático de recordatorios una vez por día, a las 10:00 hora de Buenos Aires.
- RF-24: Cuando falten 2 días calendario para un evento no cancelado (por ejemplo, el día 3 para un evento del día 5), el sistema debe enviar un único correo automático a cada invitado en estado Pendiente recordando que confirme su asistencia.
- RF-25: Cuando falte 1 día calendario para un evento no cancelado (por ejemplo, el día 4 para un evento del día 5), el sistema debe enviar un único correo automático a cada invitado en estado Aceptado con el resumen de los datos del evento.
- RF-26: Solo el organizador debe poder publicar "Observaciones" dentro de la ficha del evento.
- RF-27: Solo el organizador debe poder crear encuestas vinculadas al evento, con sus preguntas y opciones de respuesta.
- RF-28: Solo el organizador debe poder definir, para cada pregunta de una encuesta, si admite una sola opción o varias opciones.
- RF-29: Solo los invitados en estado Aceptado deben poder responder las encuestas activas del evento.
- RF-30: Un invitado Aceptado debe poder modificar sus respuestas a una encuesta mientras esa encuesta esté activa.
- RF-31: El sistema no debe exigir a un invitado Aceptado que responda las encuestas para mantener su estado.
- RF-32: El sistema no debe exigir a un invitado Aceptado que responda las encuestas para ver la ficha del evento.
- RF-33: Solo el organizador debe poder ver las respuestas individuales de las encuestas de su evento.
- RF-34: Solo el organizador debe poder ver los resultados consolidados de cada encuesta de su evento: para cada pregunta, la cantidad de invitados que eligió cada opción.
- RF-35: Solo el organizador debe poder ver, para cada encuesta de su evento, la cantidad de invitados Aceptados que la respondieron sobre el total de invitados Aceptados.
- RF-36: El sistema no debe permitir registrar ni modificar respuestas de una encuesta que no está activa.
- RF-37: En un evento cancelado, el sistema no debe permitir que el invitado confirme, rechace ni cambie su respuesta a la invitación.
- RF-38: El sistema debe permitir a un usuario autenticado cerrar sesión.
- RF-39: Al cerrar sesión, el sistema debe invalidar la sesión del usuario en todos sus dispositivos.
- RF-40: El sistema no debe mostrar datos del evento ni permitir responder la invitación con un enlace único pasadas 4 horas desde la fecha y hora del evento.
- RF-41: El sistema no debe mostrar datos de ningún evento ni registrar respuestas cuando el token de un enlace único no existe o fue alterado.
- RF-42: El sistema debe aplicar una respuesta enviada por un enlace único únicamente al invitado al que pertenece ese enlace.
- RF-43: El sistema debe permitir que un enlace único dé acceso únicamente al evento de su invitación.

## Requerimientos No Funcionales

- RNF-01: Las contraseñas de los usuarios deben almacenarse como hash bcrypt con un factor de costo mayor o igual a 12, nunca en texto plano.
- RNF-02: La sesión del usuario autenticado debe usar un JWT con validez de 30 días, que se reemite (renovando los 30 días) en cada solicitud autenticada; pasados 30 días sin solicitudes, la sesión vence.
- RNF-03: Los enlaces de invitación individual deben utilizar tokens únicos por invitación de al menos 256 bits de entropía, generados con un generador criptográficamente seguro.
- RNF-04: Todas las fechas, horas y cálculos de plazos del sistema (anticipación de creación, plazo de respuesta, recordatorios, ventana de visibilidad y vencimiento de tokens) deben usar la zona horaria America/Argentina/Buenos_Aires.
- RNF-05: Las operaciones de la aplicación web (carga de páginas y acciones del usuario, sin contar el envío de correos) deben responder en menos de 3 segundos en el percentil 95, con 50 usuarios concurrentes.
- RNF-06: La interfaz debe mostrarse sin scroll horizontal en pantallas de 360, 768 y 1920 px de ancho, y en pantallas de 360 px los botones y enlaces deben medir al menos 44 px de alto.
- RNF-07: Los correos de invitación, actualización, cancelación y recordatorio deben entregarse al servidor SMTP en menos de 5 minutos desde la acción o ejecución que los origina, para eventos de hasta 100 invitados.

## Criterios de Aceptación

- AC-01 (RF-01): Dada una persona sin cuenta, cuando se registra con un correo electrónico y una contraseña, entonces el sistema crea una cuenta asociada a ese correo.
- AC-02 (RF-02): Dado un usuario registrado, cuando inicia sesión con su correo y su contraseña correctos, entonces el sistema lo autentica.
- AC-03 (RF-02): Dado un usuario registrado, cuando intenta iniciar sesión con una contraseña incorrecta, entonces el sistema rechaza el inicio de sesión.
- AC-04 (RF-03): Dado un organizador autenticado que crea un evento con título, fecha, hora, un enlace virtual como ubicación y descripción, cuando guarda y abre el evento, entonces ve esos cinco datos tal como los cargó.
- AC-05 (RF-04): Dado un organizador autenticado, cuando el día 1 intenta crear un evento con fecha del día 4, entonces el sistema rechaza la creación y no envía invitaciones.
- AC-06 (RF-04, RNF-04): Dado que son las 23:30 del día 1 en Buenos Aires (02:30 del día 2 en UTC), cuando un organizador crea un evento con fecha del día 5, entonces el sistema acepta la creación.
- AC-07 (RF-05): Dado un evento y un usuario que no es su organizador (incluido un invitado), cuando intenta editar sus detalles, entonces el sistema rechaza la operación y el evento no cambia.
- AC-08 (RF-06): Dado un evento ya creado, cuando el organizador intenta cambiar su fecha y guarda, entonces el sistema rechaza el cambio y la fecha no cambia.
- AC-09 (RF-06): Dado un evento ya creado, cuando el organizador intenta cambiar su hora y guarda, entonces el sistema rechaza el cambio y la hora no cambia.
- AC-10 (RF-07): Dado un evento y un usuario que no es su organizador (incluido un invitado), cuando intenta cancelarlo, entonces el sistema rechaza la operación y el evento sigue activo.
- AC-11 (RF-08, RF-36): Dado un evento con una encuesta activa, cuando el organizador cancela el evento, entonces la encuesta queda cancelada y un invitado Aceptado ya no puede responderla.
- AC-12 (RF-09): Dado un evento con 1 invitado Aceptado, 1 Pendiente y 1 Rechazado, cuando el organizador lo cancela, entonces el invitado Aceptado y el Pendiente reciben un correo avisando la cancelación, y el invitado Rechazado no lo recibe.
- AC-13 (RF-10): Dado un evento cancelado con una encuesta que respondieron 2 invitados, cuando el organizador abre la encuesta, entonces ve las respuestas de esos 2 invitados y los resultados consolidados.
- AC-14 (RF-11): Dado un evento cancelado con una encuesta que un invitado Aceptado había respondido, cuando ese invitado abre la encuesta, entonces ve su propia respuesta.
- AC-15 (RF-12, RF-13): Dado un usuario cuya cuenta tiene el correo X, que organizó 2 eventos y cuyo correo X figura como invitado en otros 3, cuando abre su listado de eventos, entonces ve los 2 eventos como organizador, los 3 como invitado y ningún otro.
- AC-16 (RF-14): Dado un usuario autenticado que no es organizador ni invitado de un evento, cuando intenta ver la ficha de ese evento, incluso por URL directa, entonces el sistema deniega el acceso y no devuelve ningún dato del evento.
- AC-17 (RF-14): Dado un usuario autenticado que no es organizador ni invitado de un evento, cuando intenta ver el listado de invitados de ese evento, incluso por URL directa, entonces el sistema deniega el acceso y no devuelve ningún dato.
- AC-18 (RF-14): Dado un usuario autenticado que no es organizador ni invitado de un evento, cuando intenta ver las observaciones de ese evento, incluso por URL directa, entonces el sistema deniega el acceso y no devuelve ningún dato.
- AC-19 (RF-14): Dado un usuario autenticado que no es organizador ni invitado de un evento, cuando intenta ver las encuestas de ese evento, incluso por URL directa, entonces el sistema deniega el acceso y no devuelve ningún dato.
- AC-20 (RF-14): Dado un visitante sin sesión iniciada y sin enlace único, cuando intenta acceder a un evento por URL directa, entonces el sistema le pide iniciar sesión y no devuelve ningún dato del evento.
- AC-21 (RF-03, RF-15): Dado un organizador autenticado que crea un evento con al menos 4 días de anticipación e incluye el correo de un invitado, cuando guarda el evento, entonces ese correo recibe un mensaje con el título, fecha, hora, ubicación y descripción del evento y un enlace único de respuesta.
- AC-22 (RF-15): Dado un organizador que crea un evento con 3 correos de invitados, cuando guarda el evento, entonces se envían 3 correos individuales, uno a cada invitado, cada uno con un enlace único distinto.
- AC-23 (RF-16): Dado un evento con 1 invitado Aceptado, 1 Pendiente y 1 Rechazado, cuando el organizador cambia la ubicación y guarda, entonces el invitado Aceptado y el Pendiente reciben un correo con la ubicación nueva y su enlace único de respuesta, y el invitado Rechazado no lo recibe.
- AC-24 (RF-17): Dado un invitado sin sesión iniciada y faltando al menos 24 horas para el evento, cuando abre su enlace único y elige "Asistiré", entonces su estado pasa a Aceptado.
- AC-25 (RF-17): Dado un invitado sin sesión iniciada y faltando al menos 24 horas para el evento, cuando abre su enlace único y elige "No asistiré", entonces su estado pasa a Rechazado.
- AC-26 (RF-17): Dado que faltan menos de 24 horas para el evento, cuando un invitado Pendiente intenta responder por su enlace único, entonces el sistema rechaza la respuesta.
- AC-27 (RF-17): Dado un invitado Pendiente y faltando exactamente 24 horas (con precisión de 1 minuto) para el evento, cuando elige "Asistiré", entonces su estado pasa a Aceptado.
- AC-28 (RF-17, RNF-04): Dado un evento a las 15:00 del día 5 en Buenos Aires (18:00 UTC) y un servidor en UTC, cuando un invitado Pendiente elige "Asistiré" a las 14:59 del día 4 en Buenos Aires, entonces su estado pasa a Aceptado.
- AC-29 (RF-18): Dado un invitado Aceptado y faltando 24 horas o más para el evento, cuando abre su enlace único y elige "No asistiré", entonces su estado pasa a Rechazado.
- AC-30 (RF-18): Dado un invitado Rechazado y faltando 24 horas o más para el evento, cuando abre su enlace único y elige "Asistiré", entonces su estado pasa a Aceptado.
- AC-31 (RF-18): Dado un invitado Aceptado y faltando menos de 24 horas para el evento, cuando intenta cambiar su respuesta a "No asistiré", entonces el sistema rechaza el cambio y su estado sigue en Aceptado.
- AC-32 (RF-18): Dado un invitado Aceptado y faltando exactamente 24 horas (con precisión de 1 minuto) para el evento, cuando elige "No asistiré", entonces su estado pasa a Rechazado.
- AC-33 (RF-19): Dado un evento no cancelado con 1 invitado Pendiente y 1 Aceptado cuyo plazo de respuesta venció, cuando se ejecuta el proceso horario siguiente al vencimiento, entonces el invitado Pendiente pasa a Rechazado y el Aceptado conserva su estado.
- AC-34 (RF-19): Dado un evento cancelado con 1 invitado Pendiente cuyo plazo de respuesta venció, cuando se ejecuta el proceso horario, entonces el invitado sigue en estado Pendiente.
- AC-35 (RF-20): Dado un invitado sin cuenta dentro de su ventana de visibilidad, cuando abre su enlace único, entonces ve el título, fecha, hora, ubicación, descripción y observaciones del evento.
- AC-36 (RF-20): Dado un invitado con cuenta y con sesión iniciada dentro de su ventana de visibilidad, cuando abre el evento desde su listado, entonces ve el título, fecha, hora, ubicación, descripción y observaciones del evento.
- AC-37 (RF-17, RF-20): Dado que pasaron 2 horas desde la fecha y hora del evento, cuando un invitado sin cuenta abre su enlace único, entonces ve la ficha del evento y el sistema no le permite responder la invitación.
- AC-38 (RF-20): Dado un invitado con cuenta y con sesión iniciada, cuando pasaron más de 4 horas desde la fecha y hora del evento y abre el evento desde su listado, entonces el sistema no le muestra la ficha del evento.
- AC-39 (RF-20): Dado un invitado con cuenta y con sesión iniciada, cuando pasaron exactamente 4 horas (con precisión de 1 minuto) desde la fecha y hora del evento y abre el evento desde su listado, entonces ve la ficha del evento.
- AC-40 (RF-20, RF-26): Dado que el organizador guardó un texto en "Observaciones", cuando un invitado en cualquier estado (Aceptado, Rechazado o Pendiente) accede a la ficha del evento, entonces ve ese texto en la sección de observaciones.
- AC-41 (RF-21): Dado un evento con 3 invitados Aceptados, 2 Rechazados y 1 Pendiente, cuando el organizador abre la sección "Invitados", entonces ve los totales 3, 2 y 1 para cada estado.
- AC-42 (RF-22): Dado un evento con 3 invitados Aceptados, 2 Rechazados y 1 Pendiente, cuando el organizador abre la sección "Invitados", entonces cada invitado aparece una sola vez, dentro del grupo de su estado.
- AC-43 (RF-22): Dado un invitado con sesión iniciada que no es el organizador del evento, cuando intenta abrir el listado de invitados, incluso por URL directa, entonces el sistema deniega el acceso y no devuelve ningún dato.
- AC-44 (RF-21): Dado un invitado con sesión iniciada que no es el organizador del evento, cuando intenta ver los totales de invitados por estado, incluso por URL directa, entonces el sistema deniega el acceso y no devuelve ningún dato.
- AC-45 (RF-23, RNF-04): Dado un servidor configurado en UTC, cuando son las 10:00 en Buenos Aires (13:00 UTC), entonces se ejecuta el proceso de recordatorios.
- AC-46 (RF-24): Dado un evento con fecha del día 5 con 1 invitado Aceptado, 1 Pendiente y 1 Rechazado, cuando se ejecuta el proceso de recordatorios a las 10:00 del día 3, entonces el invitado Pendiente recibe un correo que incluye el título, la fecha y la hora del evento y el plazo límite de respuesta (24 horas antes del evento), y los invitados Aceptado y Rechazado no reciben ese correo.
- AC-47 (RF-24): Dado un invitado Pendiente que ya recibió el recordatorio del día 3, cuando el proceso de recordatorios se ejecuta una segunda vez ese mismo día, entonces el invitado no recibe un segundo correo.
- AC-48 (RF-24): Dado un evento cancelado con fecha del día 5 y 1 invitado Pendiente, cuando se ejecuta el proceso de recordatorios a las 10:00 del día 3, entonces el invitado no recibe ningún correo.
- AC-49 (RF-25): Dado un evento con fecha del día 5 con 2 invitados Aceptados y 1 Rechazado, cuando se ejecuta el proceso de recordatorios a las 10:00 del día 4, entonces los 2 invitados Aceptados reciben un correo de recordatorio con la fecha, hora y ubicación del evento, y el invitado Rechazado no lo recibe.
- AC-50 (RF-25): Dado un invitado Aceptado que ya recibió el recordatorio del día 4, cuando el proceso de recordatorios se ejecuta una segunda vez ese mismo día, entonces el invitado no recibe un segundo correo.
- AC-51 (RF-25): Dado un evento cancelado con fecha del día 5 y 1 invitado Aceptado, cuando se ejecuta el proceso de recordatorios a las 10:00 del día 4, entonces el invitado no recibe ningún correo.
- AC-52 (RF-26): Dado un organizador autenticado con un evento, cuando publica un texto en "Observaciones" y guarda, entonces el texto aparece en la ficha del evento.
- AC-53 (RF-26): Dado un invitado con sesión iniciada que no es el organizador, cuando intenta publicar una observación en el evento, entonces el sistema rechaza la operación y el evento no cambia.
- AC-54 (RF-27): Dado un organizador autenticado con un evento, cuando crea una encuesta con una pregunta y dos opciones y guarda, entonces la encuesta aparece vinculada a ese evento con esa pregunta y esas opciones.
- AC-55 (RF-27): Dado un invitado con sesión iniciada que no es el organizador, cuando intenta crear una encuesta en el evento, entonces el sistema rechaza la operación y el evento no cambia.
- AC-56 (RF-28): Dado un organizador que crea una encuesta, cuando define una pregunta como de opción única y guarda, entonces la pregunta queda registrada como de opción única.
- AC-57 (RF-28): Dada una pregunta de opción única, cuando un invitado Aceptado intenta elegir dos opciones, entonces el sistema no permite guardar más de una.
- AC-58 (RF-28, RF-34): Dada una pregunta de opción múltiple (opciones A, B y C) que respondieron 2 invitados (uno eligió A y B, el otro eligió B), cuando el organizador abre los resultados consolidados, entonces ve A: 1, B: 2 y C: 0.
- AC-59 (RF-29, RF-30): Dado que el organizador creó una encuesta activa, cuando un invitado Aceptado la responde y guarda, entonces sus respuestas quedan registradas.
- AC-60 (RF-29): Dado un evento con una encuesta activa y un invitado en estado Pendiente o Rechazado, cuando intenta responder la encuesta, entonces el sistema no registra sus respuestas.
- AC-61 (RF-30): Dado un evento no cancelado y un invitado Aceptado que eligió la opción A en una pregunta de opción única, cuando cambia su respuesta a la opción B y guarda, entonces queda registrada la opción B y los resultados consolidados ya no cuentan su elección de A.
- AC-62 (RF-31): Dado un evento con una encuesta activa y un invitado Aceptado que no la respondió, cuando termina la ventana de visibilidad del evento, entonces ese invitado sigue figurando como Aceptado en el listado del organizador.
- AC-63 (RF-32): Dado un evento con una encuesta activa y un invitado Aceptado que no la respondió, cuando abre la ficha del evento, entonces ve la ficha del evento.
- AC-64 (RF-33): Dado que 2 invitados respondieron una encuesta, cuando el organizador abre sus resultados, entonces ve las respuestas de cada uno de esos 2 invitados.
- AC-65 (RF-33): Dado un evento con una encuesta respondida por 2 invitados Aceptados, cuando uno de ellos intenta ver las respuestas individuales de la encuesta, incluso por URL directa, entonces el sistema deniega el acceso y no devuelve las respuestas del otro invitado.
- AC-66 (RF-34): Dado un evento con una encuesta respondida por 2 invitados Aceptados, cuando uno de ellos intenta ver los resultados consolidados de la encuesta, incluso por URL directa, entonces el sistema deniega el acceso y no devuelve ningún dato de los resultados.
- AC-67 (RF-35): Dado un evento con una encuesta respondida por 2 invitados Aceptados, cuando uno de ellos intenta ver el conteo de invitados que respondieron, incluso por URL directa, entonces el sistema deniega el acceso y no devuelve ningún dato del conteo.
- AC-68 (RF-34, RF-35): Dado un evento con 4 invitados Aceptados y una encuesta con una pregunta de opción única (opciones A y B) que respondieron 3 invitados (2 eligieron A y 1 eligió B), cuando el organizador abre los resultados consolidados, entonces ve A: 2, B: 1 y "3 de 4" invitados Aceptados respondieron.
- AC-69 (RF-36): Dado un evento no cancelado con una encuesta, cuando pasaron más de 4 horas desde la fecha y hora del evento y un invitado Aceptado intenta responderla, entonces el sistema no registra sus respuestas.
- AC-70 (RF-11, RF-36): Dado un evento cancelado con una encuesta que un invitado Aceptado había respondido, cuando ese invitado abre la encuesta, entonces ve su respuesta y el sistema no le permite modificarla.
- AC-71 (RF-37): Dado un evento cancelado y un invitado Aceptado, cuando intenta cambiar su respuesta a "No asistiré", entonces el sistema rechaza el cambio y su estado sigue en Aceptado.
- AC-72 (RF-37): Dado un evento cancelado y un invitado Pendiente, cuando intenta responder la invitación por su enlace único, entonces el sistema rechaza la respuesta y su estado sigue en Pendiente.
- AC-73 (RF-38): Dado un usuario con sesión iniciada, cuando cierra sesión, entonces el sistema le pide iniciar sesión para volver a acceder a sus eventos.
- AC-74 (RF-39): Dado un usuario con sesión iniciada en dos dispositivos, cuando cierra sesión en uno de ellos, entonces el sistema le pide iniciar sesión también en el otro dispositivo.
- AC-75 (RF-40): Dado que pasaron más de 4 horas desde la fecha y hora del evento, cuando un invitado abre su enlace único, entonces el sistema no acepta el token y no muestra datos del evento.
- AC-76 (RF-41): Dado un enlace con un token inexistente, cuando alguien lo abre, entonces el sistema no muestra datos de ningún evento ni registra ninguna respuesta.
- AC-77 (RF-41): Dado un enlace único al que se le modificó un carácter del token, cuando alguien lo abre, entonces el sistema no muestra datos de ningún evento ni registra ninguna respuesta.
- AC-78 (RF-42): Dado el enlace único del invitado A, cuando se usa para responder, entonces solo cambia el estado del invitado A en ese evento.
- AC-79 (RF-43): Dado el enlace único de un invitado del evento X, cuando se usa para intentar abrir el evento Y (otro evento), incluso modificando la URL, entonces el sistema no muestra datos del evento Y.
- AC-80 (RF-43, RF-22): Dado un invitado sin cuenta que entró con su enlace único, cuando intenta abrir el listado de invitados del evento, entonces el sistema deniega el acceso y no devuelve ningún dato.
- AC-81 (RF-43, RF-33): Dado un invitado sin cuenta que entró con su enlace único, cuando intenta ver las respuestas de otros invitados a una encuesta, entonces el sistema deniega el acceso y no devuelve ningún dato de esas respuestas.
- AC-82 (RNF-01): Dado un usuario registrado, cuando se consulta su registro en la base de datos, entonces la contraseña está guardada como hash bcrypt con costo mayor o igual a 12 y no aparece en texto plano.
- AC-83 (RNF-02): Dado un usuario que inició sesión y no la cerró, cuando vuelve a usar la app a los 29 días, entonces sigue autenticado.
- AC-84 (RNF-02): Dado un usuario que inició sesión y no usó la app durante más de 30 días, cuando vuelve a usarla, entonces el sistema le pide iniciar sesión.
- AC-85 (RNF-03): Dadas dos invitaciones generadas, cuando se inspeccionan sus tokens, entonces son distintos y cada uno tiene al menos 43 caracteres en base64url (equivalente a 256 bits). Este AC verifica la longitud; el uso de un generador criptográficamente seguro se asegura por diseño.
- AC-86 (RF-40, RNF-04): Dado un evento a las 15:00 del día 5 en Buenos Aires (18:00 UTC) y un servidor en UTC, cuando un invitado sin cuenta abre su enlace único a las 18:59 del día 5 en Buenos Aires, entonces ve la ficha del evento.
- AC-87 (RNF-05): Dados 50 usuarios concurrentes usando la aplicación, cuando se miden las operaciones web (sin contar el envío de correos), entonces el percentil 95 del tiempo de respuesta es menor a 3 segundos.
- AC-88 (RNF-06): Dadas pantallas de 360, 768 y 1920 px de ancho, cuando se abren la ficha del evento y la respuesta a la invitación, entonces no hay scroll horizontal.
- AC-89 (RNF-06): Dada una pantalla de 360 px de ancho, cuando se abren la ficha del evento y la respuesta a la invitación, entonces todos los botones y enlaces miden al menos 44 px de alto.
- AC-90 (RNF-07): Dado un organizador que crea un evento con 100 invitados, cuando guarda el evento, entonces los 100 correos de invitación son entregados al servidor SMTP en menos de 5 minutos.
- AC-91 (RNF-07): Dado un evento con 100 invitados, cuando el organizador cambia la ubicación y guarda, entonces los correos de actualización son entregados al servidor SMTP en menos de 5 minutos.
- AC-92 (RNF-07): Dado un evento con 100 invitados, cuando el organizador lo cancela, entonces los correos de cancelación son entregados al servidor SMTP en menos de 5 minutos.
- AC-93 (RNF-07): Dado un evento con 100 invitados, cuando se ejecuta el proceso de recordatorios, entonces los correos de recordatorio son entregados al servidor SMTP en menos de 5 minutos.

## Fuera de Alcance

- No se implementará el módulo de envío de notificaciones Push.
- No se implementará una app móvil nativa en esta etapa; la solución es una app web responsive.
- No se implementará recuperación de contraseña ni verificación del correo al registrarse.
- No se implementará cambiar la contraseña, editar el perfil ni eliminar la cuenta.
- No se implementará la edición ni el borrado de observaciones publicadas.
- No se implementará la edición ni el borrado de encuestas ya creadas.
- No se implementarán preguntas de texto libre en las encuestas.
- No se implementará exportar los resultados de las encuestas.
- No se implementará agregar ni quitar invitados una vez creado el evento.
- No se implementará el reenvío manual de invitaciones.
- No se implementará reactivar ni eliminar un evento cancelado.
- No se implementará más de un organizador por evento.

## Riesgos y Dependencias

- Riesgo: Baja entregabilidad de emails de invitación o recordatorios (los correos pueden ir a la carpeta de Spam). Mitigación: Utilizar servidores de correo con alta tasa de entregabilidad (ej. SMTP2GO, Postmark y SendGrid) y tener bien configurados los registros SPF, DKIM y DMARC en el dominio para demostrar que el correo es legítimo.
- Riesgo: Con un JWT de 30 días (RNF-02), el logout no invalida un token robado; sigue siendo válido hasta su vencimiento. Mitigación: guardar el JWT en una cookie HttpOnly, Secure y SameSite=Lax, para que no pueda leerse desde JavaScript, e incluir en el token una versión de sesión por usuario guardada en la base de datos; cada logout (RF-39) incrementa esa versión e invalida todos los tokens emitidos antes.
- Dependencia: Uso de SQLite como motor de base de datos.
- Dependencia: Procesos programados (cron) con dos frecuencias: cada hora (RF-19) y una vez por día a las 10:00 hora de Buenos Aires (RF-23).
