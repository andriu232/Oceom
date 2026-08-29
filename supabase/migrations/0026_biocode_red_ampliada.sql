-- ============================================================
-- OCEOM by E-MOTION® — BIOCODE: ampliación de la red de conocimiento.
--
-- La semilla (0024) cubría 10 nodos: los ejemplos del documento de Valeria.
-- Al probar la búsqueda contra la base real aparecieron dos huecos:
--
--   1) "No puedo expresar lo que siento" — uno de los ejemplos insignia del
--      documento — no tenía nodo propio y caía flojo en merecimiento.
--   2) De las 7 puertas de entrada, HISTORIA y ÁRBOL no tenían ni un nodo
--      detrás: entrar por ahí dejaba a la IA sin material.
--
-- Esta migración lleva la red de 10 a 29 nodos y cierra los dos huecos.
-- Todo lo médico va con sus señales de alarma; lo simbólico va declarado
-- como tal y con su nivel de evidencia, como exige el documento.
--
-- Idempotente: `on conflict (slug) do nothing`.
-- ============================================================

insert into biocode_nodes (
  slug, name, category, body_zone, organ, body_system,
  scientific_info, scientific_sources, warning_signs,
  complementary_info, symbolic_themes,
  emotions, beliefs, patterns, behaviors, questions, exercises,
  related_slugs, oceom_resource, oceom_link, evidence_level, aliases
) values

-- ── Cuerpo y síntomas ──

('garganta-expresion', 'Garganta y expresión', 'cuerpo', 'cuello', 'garganta', 'respiratorio',
 'La sensación de nudo en la garganta sin que nada obstruya realmente el paso tiene nombre en medicina: globo faríngeo. Es frecuente, no es peligrosa en sí misma y suele relacionarse con tensión muscular de la zona, con reflujo o con estados de ansiedad sostenida. La ronquera que dura más de tres semanas, en cambio, siempre debe valorarla un profesional.',
 '{"Literatura clínica sobre globo faríngeo","Guías de otorrinolaringología sobre disfonía persistente"}',
 '{"Ronquera o afonía que dura más de tres semanas","Dificultad para tragar que va en aumento","Bulto palpable en el cuello","Dolor al tragar con pérdida de peso","Sensación de ahogo real o dificultad para respirar"}',
 'En enfoques complementarios se explora la garganta en relación con lo que no se dice: las palabras que se guardan, la opinión que se calla para no incomodar. Es una puerta de reflexión sobre la propia voz, no una explicación del síntoma.',
 '{"lo que no digo","tragarse las palabras","la propia voz","miedo a incomodar"}',
 '{"miedo a hablar","rabia contenida","tristeza no dicha","frustración"}',
 '{"Lo que yo diga no importa","Si digo lo que siento hago daño","Mejor no decir nada","No es el momento"}',
 '{"callar para evitar el conflicto","hablar solo cuando ya se desbordó","aceptar y después resentirse"}',
 '{"callar","aguantar","complacer","evitar conversaciones"}',
 '{"¿Qué es lo que no estás diciendo?","¿A quién se lo dirías si supieras que no pasa nada?","¿Qué crees que ocurriría si lo dijeras?","¿Cuándo aprendiste que era más seguro callar?","¿En qué momento del día notas más la garganta?"}',
 '{"Escribir la conversación que no has tenido, tal como saldría sin filtro","Leerla en voz alta a solas: la voz también se entrena","Decir una frase pendiente esta semana, aunque sea la más pequeña","Tararear o cantar cinco minutos al día"}',
 '{"cuello-hombros","rabia","limites","culpa"}',
 'Journaling terapéutico', '/bitacora', 'complementario',
 '{"no puedo expresar lo que siento","me cuesta decir lo que pienso","nudo en la garganta","se me cierra la garganta","me quedo callada","me trago las palabras","no me sale la voz","afonia","ronquera","carraspera","dolor de garganta","no se decirlo"}'),

('pecho-corazon', 'Corazón y pecho', 'cuerpo', 'pecho', 'corazón', 'cardiovascular',
 'El corazón responde de forma directa al estado emocional: la frecuencia cardiaca y la presión suben con el estrés y bajan con la respiración lenta. Las palpitaciones aisladas son frecuentes y en la mayoría de los casos benignas. El dolor en el pecho es otra cosa: no se explora emocionalmente, se consulta.',
 '{"Sociedades de cardiología — signos de alarma del dolor torácico","Investigación sobre variabilidad de la frecuencia cardiaca y regulación"}',
 '{"Dolor opresivo en el pecho, sobre todo si se irradia al brazo, la mandíbula o la espalda","Dolor de pecho con sudor frío, náuseas o falta de aire","Palpitaciones acompañadas de desmayo o mareo intenso","Falta de aire de aparición súbita","Hinchazón de piernas con fatiga al mínimo esfuerzo"}',
 'Desde una lectura simbólica, algunas corrientes exploran el pecho como el territorio de los vínculos y del afecto: abrirse, cerrarse, proteger. Es material de reflexión sobre cómo te vinculas, no una explicación de ningún síntoma cardiaco.',
 '{"vínculos","abrirse y cerrarse","protegerse del dolor","afecto no dicho"}',
 '{"tristeza","nostalgia","miedo a querer de nuevo","ternura contenida"}',
 '{"Si me abro, me hieren","El amor duele","Tengo que protegerme","Mejor no ilusionarse"}',
 '{"cerrarse después de una herida","dar mucho y no dejarse cuidar"}',
 '{"aislarse","evitar","controlar la distancia"}',
 '{"¿A quién no has podido decirle lo que sientes?","¿De qué te estás protegiendo?","¿Cuándo fue la última vez que te dejaste cuidar?","¿Qué necesitarías para volver a abrirte un poco?"}',
 '{"Respiración de coherencia: cinco segundos al inspirar, cinco al exhalar, cinco minutos","Carta que no vas a enviar","Un gesto de cercanía esta semana con alguien que te importa"}',
 '{"respiracion-ansiedad","tristeza-duelo","abandono"}',
 'Prácticas de respiración y regulación', '/lab/respiracion', 'complementario',
 '{"me duele el pecho","opresion en el pecho","palpitaciones","el corazon acelerado","taquicardia","siento el pecho apretado","me falta el aire y me duele el pecho","corazon roto"}'),

('respiracion-ansiedad', 'Respiración corta y falta de aire', 'sintoma', 'pecho', 'pulmones', 'respiratorio',
 'Cuando el cuerpo está en alerta la respiración se vuelve corta y alta, en el pecho en vez de en el abdomen. Eso mantiene encendida la señal de alarma. Alargar la exhalación por encima de la inspiración activa la rama del sistema nervioso que frena esa alarma: es de las herramientas con mejor respaldo y efecto inmediato. Si la falta de aire aparece en reposo o de golpe, primero se descarta lo médico.',
 '{"Investigación sobre respiración lenta y tono parasimpático","Guías clínicas de asma y disnea"}',
 '{"Falta de aire que aparece de golpe o en reposo","Falta de aire junto con dolor en el pecho","Labios o uñas azulados","Silbidos al respirar, fiebre y tos","Empeoramiento al acostarte"}',
 'En clave simbólica se explora la respiración corta en relación con el espacio propio: lo que no deja respirar, lo que aprieta, lo que se sostiene sin pausa.',
 '{"espacio propio","no me dejan respirar","pausa negada"}',
 '{"ansiedad","agobio","urgencia"}',
 '{"No tengo tiempo","Si paro, se cae todo","Tengo que estar disponible"}',
 '{"vivir en apnea de tareas","no hacer pausas"}',
 '{"anticipar","sobretrabajar","postergar el descanso"}',
 '{"¿En qué momento del día notas que respiras corto?","¿Qué te está quitando el aire en tu vida ahora mismo?","¿Cuándo fue la última pausa real que te diste?"}',
 '{"Exhalación extendida: inspirar en cuatro, exhalar en seis, durante tres minutos","Suspiro fisiológico: dos inspiraciones cortas por la nariz y una exhalación larga por la boca","Cinco minutos al aire libre sin teléfono"}',
 '{"ansiedad","pecho-corazon","cuello-hombros"}',
 'Prácticas de respiración y regulación', '/lab/respiracion', 'consolidada',
 '{"me falta el aire","no puedo respirar bien","respiro corto","siento que me ahogo","suspiro todo el tiempo","respiracion agitada","me cuesta tomar aire","hiperventilo"}'),

('fatiga', 'Cansancio que no se va', 'sintoma', null, null, null,
 'El cansancio persistente tiene causas médicas frecuentes y tratables que conviene descartar antes de cualquier lectura emocional: anemia, alteraciones de tiroides, apnea del sueño, déficit de vitamina B12 o D, medicación y depresión. Un análisis y una consulta resuelven esa pregunta rápido.',
 '{"Guías de atención primaria sobre fatiga persistente"}',
 '{"Cansancio con pérdida de peso sin explicación","Fiebre o sudoración nocturna","Falta de aire al mínimo esfuerzo","Ganglios que no bajan","Empeoramiento marcado después de un esfuerzo pequeño"}',
 'Cuando lo médico está descartado, se explora el cansancio en relación con lo que se sostiene: cuánto de lo que cargas es tuyo y cuánto lo tomaste prestado.',
 '{"sostener lo que no me toca","el cuerpo pidiendo pausa","dar sin recibir"}',
 '{"agotamiento","desánimo","impotencia"}',
 '{"Si yo no lo hago no lo hace nadie","Descansar es de flojos","Aguanto un poco más"}',
 '{"vivir en reserva","recuperarse solo cuando el cuerpo obliga"}',
 '{"sobretrabajar","postergar el descanso","complacer"}',
 '{"¿Desde cuándo estás cansada?","¿Qué pasó en tu vida por esas fechas?","¿Qué es lo primero que sueltas cuando no das más?","¿Qué te permitirías si tuvieras energía mañana?"}',
 '{"Registro de energía: anotar durante una semana qué te la quita y qué te la devuelve","Devolver una tarea que aceptaste sin querer","Dormir a la misma hora cinco días seguidos"}',
 '{"insomnio","sobreexigencia","trabajo-agotamiento"}',
 'Deep Waves — meditación para dormir', '/deep-waves', 'consolidada',
 '{"siempre estoy cansada","no tengo energia","agotamiento","me levanto cansada","fatiga cronica","sin fuerzas","todo me pesa","no doy mas","estoy agotada"}'),

('rodillas', 'Rodillas', 'cuerpo', 'piernas', 'rodilla', 'musculoesquelético',
 'El dolor de rodilla es muy frecuente y en la mayoría de los casos responde a sobrecarga o a artrosis. Lo que más evidencia tiene para mejorarlo no es el reposo, sino el movimiento gradual y fortalecer la musculatura del muslo.',
 '{"Guías clínicas sobre artrosis de rodilla","Recomendaciones de ejercicio terapéutico musculoesquelético"}',
 '{"Rodilla bloqueada que no estira ni dobla","Hinchazón con enrojecimiento y fiebre","Inestabilidad o fallo tras un golpe","No poder apoyar el peso"}',
 'Algunas corrientes complementarias exploran las rodillas en relación con avanzar y con la flexibilidad: hacia dónde vas, ante qué te cuesta ceder. Es una lectura simbólica, no una causa.',
 '{"avanzar","flexibilidad","ceder","dirección de vida"}',
 '{"miedo","terquedad","inseguridad"}',
 '{"No puedo dar ese paso","Si cedo, pierdo","Tengo que aguantar firme"}',
 '{"posponer decisiones","forzar el paso sin escuchar el cuerpo"}',
 '{"postergar","aguantar","forzar"}',
 '{"¿Hacia dónde sientes que no puedes avanzar?","¿Qué decisión llevas tiempo posponiendo?","¿Ante qué te cuesta ceder?"}',
 '{"Fortalecer cuádriceps con ejercicios simples, todos los días","Caminar en llano, aumentando poco a poco","Escritura: qué paso estoy evitando dar"}',
 '{"dolor-espalda","miedo"}',
 null, null, 'complementario',
 '{"me duelen las rodillas","dolor de rodilla","artrosis","no puedo doblar la rodilla","me truena la rodilla","rodilla inflamada","me duelen las piernas al caminar"}'),

('rinones-vejiga', 'Riñones y vejiga', 'cuerpo', 'abdomen', 'riñones', 'urinario',
 'Las infecciones urinarias y los cálculos son causas frecuentes de molestia en esta zona y tienen tratamiento; no se exploran emocionalmente, se tratan. Beber agua suficiente y no aguantar las ganas de orinar es prevención real.',
 '{"Guías clínicas de infección del tracto urinario","Recomendaciones sobre litiasis renal"}',
 '{"Fiebre con dolor en la zona lumbar","Sangre en la orina","Dolor intenso tipo cólico que no cede","No poder orinar","Ardor al orinar con vómitos o escalofríos"}',
 'En enfoques complementarios se explora esta zona en relación con el miedo y con la tensión entre retener y soltar. Es material de reflexión.',
 '{"retener y soltar","miedo de fondo","territorio propio"}',
 '{"miedo","inseguridad","alerta"}',
 '{"No puedo confiar","Tengo que guardar por si acaso","Si suelto, me quedo sin nada"}',
 '{"aguantar hasta el límite","acumular por miedo"}',
 '{"controlar","aguantar","postergar"}',
 '{"¿Qué estás reteniendo en este momento de tu vida?","¿Qué te cuesta soltar aunque ya no te sirva?","¿De qué te estás protegiendo?"}',
 '{"Beber agua a lo largo del día y no aguantar las ganas","Escritura: qué guardo por si acaso y qué me cuesta soltar"}',
 '{"miedo","ansiedad"}',
 null, null, 'complementario',
 '{"infeccion urinaria","cistitis","me arde al orinar","calculos renales","dolor en los riñones","retencion de liquidos","ganas de orinar todo el tiempo","se me escapa el pipi"}'),

('piel', 'Piel', 'cuerpo', 'piel', 'piel', 'tegumentario',
 'La relación entre piel y estrés está documentada: la dermatitis atópica, la psoriasis y la urticaria pueden empeorar en periodos de tensión, aunque el estrés no las origina por sí solo. La piel es también el órgano donde antes se ven cambios que conviene mirar a tiempo.',
 '{"Investigación en psicodermatología","Guías dermatológicas sobre dermatitis atópica y psoriasis"}',
 '{"Un lunar que cambia de forma, color o tamaño, o que sangra","Una lesión que no cierra en varias semanas","Erupción acompañada de fiebre","Ronchas con hinchazón de labios, lengua o dificultad para respirar: es urgencia"}',
 'Desde una lectura simbólica, la piel se explora como frontera y como contacto: qué dejas entrar, qué te irrita, quién te toca. Es una pregunta de reflexión sobre tus límites.',
 '{"frontera","contacto","lo que me irrita","lo que dejo entrar"}',
 '{"irritación","vergüenza","incomodidad","ansiedad"}',
 '{"Tengo que aguantar el contacto que no quiero","No puedo poner distancia","Mi incomodidad no cuenta"}',
 '{"invasión sostenida","no poner distancia a tiempo"}',
 '{"aguantar","complacer","aislarse"}',
 '{"¿Qué o quién te está irritando ahora mismo?","¿Con quién no logras poner distancia?","¿En qué momento empezaron los brotes y qué pasaba en tu vida?"}',
 '{"Registro de brotes junto con lo que ocurrió los tres días previos","Un límite concreto con la persona o situación que más te tensa"}',
 '{"limites","ansiedad"}',
 null, null, 'investigacion',
 '{"brotes en la piel","dermatitis","psoriasis","urticaria","me salen ronchas","alergia en la piel","picazon","acne","eccema","me rasco hasta sangrar"}'),

('ciclo-hormonal', 'Ciclo menstrual y zona pélvica', 'cuerpo', 'pelvis', 'útero', 'endocrino',
 'Una molestia leve durante la menstruación es común, pero el dolor que te impide hacer tu vida no es normal ni algo que haya que aguantar: puede haber una causa tratable detrás, como la endometriosis, que suele tardar años en diagnosticarse justamente porque se normaliza el dolor. Llevar un registro del ciclo y de los síntomas ayuda muchísimo en la consulta.',
 '{"Guías clínicas sobre dismenorrea y endometriosis","Recomendaciones de salud menstrual"}',
 '{"Dolor que te impide ir a trabajar o estudiar","Sangrado muy abundante o con coágulos grandes","Sangrado entre reglas o después de relaciones","Dolor pélvico presente también fuera de la regla","Dolor al orinar o al defecar durante la menstruación"}',
 'En enfoques complementarios se explora esta zona en relación con los ciclos, la creación y el linaje femenino: lo que se aprendió en casa sobre menstruar, sobre el cuerpo y sobre el descanso. Es una lectura simbólica.',
 '{"ciclos","creación","linaje femenino","lo aprendido sobre el propio cuerpo"}',
 '{"vergüenza","frustración","cansancio","irritabilidad"}',
 '{"Tengo que rendir igual todos los días","Quejarse es exagerar","El dolor de la regla es normal y hay que aguantarlo"}',
 '{"exigirse el mismo ritmo en todo el ciclo","normalizar el dolor"}',
 '{"aguantar","sobretrabajar","postergar la consulta"}',
 '{"¿Cómo te hablas los días previos a la regla?","¿Qué te enseñaron en tu casa sobre menstruar?","¿Te permites bajar el ritmo esos días?","¿Has podido contarle a un profesional cuánto duele de verdad?"}',
 '{"Registro del ciclo: dolor, ánimo y energía día por día durante dos meses","Ajustar la agenda a los días de menos energía en vez de pelearte con ellos"}',
 '{"arbol-familiar","merecimiento","fatiga"}',
 null, null, 'consolidada',
 '{"dolor menstrual","colicos","regla dolorosa","endometriosis","sindrome premenstrual","ovarios","quistes","no me baja la regla","ciclo irregular","dolor pelvico","menopausia"}'),

-- ── Emociones ──

('ansiedad', 'Ansiedad', 'emocion', null, null, null,
 'La ansiedad es una respuesta normal de alerta: prepara al cuerpo para responder. Se vuelve un problema cuando queda encendida sin amenaza real y empieza a limitar la vida. Tiene tratamientos con evidencia sólida, sobre todo la terapia cognitivo-conductual, y la exposición gradual a lo que se evita.',
 '{"Guías clínicas sobre trastornos de ansiedad","Investigación sobre terapia cognitivo-conductual"}',
 '{"Crisis con dolor en el pecho por primera vez: descarta lo médico antes","Ansiedad que te impide salir, trabajar o dormir","Uso de alcohol o pastillas para calmarla","Pensamientos de hacerte daño: busca ayuda profesional ahora"}',
 'Como lectura complementaria se explora la ansiedad en relación con el intento de anticiparlo todo para que nada sorprenda. Es una pregunta sobre el control, no una explicación.',
 '{"anticipar para no ser sorprendida","control","estar en guardia"}',
 '{"miedo","agobio","urgencia","impotencia"}',
 '{"Algo malo va a pasar","Si me relajo, me confío","Tengo que estar preparada para todo","Si lo pienso mucho, lo evito"}',
 '{"anticipación","rumiación","chequeo constante","evitación"}',
 '{"anticipar","controlar","evitar","huir"}',
 '{"¿Qué es lo peor que crees que puede pasar?","Si eso pasara, ¿qué harías?","¿Qué estarías haciendo hoy si esa parte de ti dejara de vigilar un rato?","¿Qué situación estabas viviendo cuando empezó?"}',
 '{"Exhalación extendida durante tres minutos cuando sube","Aterrizaje 5-4-3-2-1: cinco cosas que ves, cuatro que tocas, tres que oyes, dos que hueles, una que saboreas","Ventana de preocupación: diez minutos al día para preocuparse, fuera de ahí se anota y se aplaza"}',
 '{"respiracion-ansiedad","insomnio","sobreexigencia","miedo"}',
 'Prácticas de respiración y regulación', '/lab/respiracion', 'consolidada',
 '{"siento ansiedad","ataques de panico","estoy angustiada","nervios","me tiembla el cuerpo","no puedo parar de pensar","preocupacion constante","estres","me da taquicardia","siento que algo malo va a pasar"}'),

('tristeza-duelo', 'Tristeza y duelo', 'emocion', null, null, null,
 'El duelo no es una enfermedad ni tiene un plazo fijo, y no avanza en fases ordenadas: va y viene en oleadas. Lo que sí conviene distinguir es la tristeza del duelo de un estado depresivo sostenido, que se mantiene la mayor parte del día durante semanas y apaga también lo que antes daba gusto. Eso último se acompaña con ayuda profesional.',
 '{"Literatura clínica sobre duelo y duelo prolongado","Guías sobre depresión en atención primaria"}',
 '{"Tristeza la mayor parte del día durante más de dos semanas","No poder levantarte, comer o dormir","Aislamiento total","Pensamientos de no querer vivir: pide ayuda profesional de inmediato"}',
 'Desde la exploración personal se mira qué pérdidas no tuvieron espacio para ser lloradas y qué quedó sin despedir. No toda tristeza es un duelo pendiente, pero muchas se aligeran al nombrarlas.',
 '{"pérdidas no lloradas","lo que quedó sin despedir","permiso para sentir"}',
 '{"tristeza","nostalgia","vacío","añoranza"}',
 '{"Ya debería haberlo superado","Si me derrumbo no me levanto","Tengo que ser fuerte por los demás"}',
 '{"seguir funcionando sin parar","posponer el llanto"}',
 '{"aislarse","sobretrabajar","evitar"}',
 '{"¿A quién o a qué estás despidiendo?","¿Hubo espacio para llorarlo cuando pasó?","¿Qué te quedaste sin decir?","¿Quién sostiene a quien sostiene a todos?"}',
 '{"Carta de despedida a quien o a lo que se fue","Un ritual pequeño: una vela, una foto, una fecha en el calendario","Quince minutos para llorar sin intentar arreglarlo"}',
 '{"pecho-corazon","abandono","historia-infancia"}',
 'Journaling terapéutico', '/bitacora', 'consolidada',
 '{"estoy triste","no tengo ganas de nada","perdi a alguien","duelo","se murio","ruptura","me siento vacia","lloro por todo","no puedo superarlo","me dejo","separacion"}'),

('rabia', 'Rabia', 'emocion', null, null, null,
 'La rabia cumple una función: avisa de que un límite se cruzó o de que algo se percibe como injusto. Ni reprimirla ni descargarla sin dirección ayuda; lo que sí sirve es nombrarla y leer la información que trae. Cuando lleva tiempo guardada, suele salir por donde no toca.',
 '{"Investigación sobre regulación emocional","Literatura clínica sobre manejo de la ira"}',
 '{"Estallidos que terminan en agresión a personas u objetos","Miedo de las personas que te rodean","Rabia junto con consumo de alcohol o sustancias"}',
 'En clave simbólica se explora la rabia contenida en relación con lo que no se dijo a tiempo y con los límites que se dejaron pasar.',
 '{"límite cruzado","injusticia","lo que no dije a tiempo"}',
 '{"rabia","resentimiento","frustración","impotencia"}',
 '{"Enojarse es malo","Si me enojo dejan de quererme","Tengo que ser buena","No vale la pena discutir"}',
 '{"aguantar y después explotar","ironía en vez de decirlo","resentimiento silencioso"}',
 '{"aguantar","atacar","callar","autosabotearse"}',
 '{"¿Con quién estás enojada de verdad?","¿Qué límite se cruzó?","¿Qué necesitarías pedir para que esto cambie?","¿Qué aprendiste en tu casa sobre enojarse?"}',
 '{"Escritura sin filtro que después se rompe o se borra","Diez minutos de movimiento intenso para bajar la activación","Una petición concreta a la persona indicada, en frío"}',
 '{"garganta-expresion","limites","digestivo-estomago"}',
 'Journaling terapéutico', '/bitacora', 'investigacion',
 '{"tengo mucha rabia","estoy furiosa","ira","resentimiento","me da coraje","exploto por todo","rencor","no puedo perdonar","me trago la rabia","estoy brava"}'),

('miedo', 'Miedo', 'emocion', null, null, null,
 'El miedo activa al cuerpo para protegerte y es útil cuando hay una amenaza real. El problema aparece cuando la alarma queda encendida en situaciones que no lo son: el cuerpo responde igual, aunque el peligro no esté. Acercarse poco a poco a lo que se evita es lo que más evidencia tiene para bajarlo, y no hace falta hacerlo en soledad.',
 '{"Investigación sobre respuesta de amenaza y exposición gradual"}',
 '{"Miedo que te impide salir de casa o mantener tu vida","Crisis de pánico frecuentes","Miedo tras un hecho traumático, con imágenes intrusivas o pesadillas"}',
 'Como reflexión se explora de qué te protege ese miedo: casi siempre protege algo, y verlo cambia la conversación con él.',
 '{"seguridad","confianza","soltar el control"}',
 '{"miedo","inseguridad","alerta","desconfianza"}',
 '{"No puedo confiar","El mundo es peligroso","Si me relajo pasa algo malo","No voy a poder"}',
 '{"evitar lo que da miedo y que crezca","pedir garantías antes de moverse"}',
 '{"evitar","huir","controlar","postergar"}',
 '{"¿De qué te protege este miedo?","¿Qué es lo que temes exactamente que pase?","¿Qué necesitarías para sentirte un poco más segura hoy?","¿Cuál sería el paso más pequeño posible hacia eso que evitas?"}',
 '{"Escalera de acercamiento: dividir lo que temes en cinco pasos y dar solo el primero","Escritura: qué protege este miedo y qué me cuesta"}',
 '{"ansiedad","abandono","rinones-vejiga"}',
 null, null, 'investigacion',
 '{"tengo miedo","me da terror","panico","miedo al futuro","miedo a la muerte","miedo a fracasar","miedo a la soledad","inseguridad","no confio","me da pavor"}'),

-- ── Creencias ──

('limites', 'Decir que no y poner límites', 'creencia', null, null, null,
 null, '{}', '{}',
 'Poner límites no es un rasgo de carácter: es una habilidad que se entrena. Suele costar más a quien aprendió temprano que su valor dependía de estar disponible. La distinción útil es entre decir que no a una petición y rechazar a la persona: no son lo mismo, aunque por dentro se sientan igual.',
 '{"disponibilidad permanente","ser buena es no molestar","el valor medido en utilidad"}',
 '{"culpa","miedo","resentimiento","agobio"}',
 '{"Si digo que no, dejarán de quererme","Ser buena es no molestar","Mis necesidades pueden esperar","Si no lo hago yo, quedo mal"}',
 '{"complacer","sobrecarga","resentimiento silencioso","aceptar y después arrepentirse"}',
 '{"complacer","aguantar","postergarse","evitar el conflicto"}',
 '{"¿A qué le dijiste que sí esta semana queriendo decir que no?","¿Qué temes que pase si pones un límite?","¿Con quién te cuesta más y por qué justo con esa persona?","¿Qué se siente en tu cuerpo cuando aceptas algo que no quieres?"}',
 '{"Un no amable esta semana, elegido de antemano","Frase preparada: déjame pensarlo y te confirmo","Anotar cómo reacciona el cuerpo al decir un sí forzado"}',
 '{"culpa","cuidar-a-todos","garganta-expresion","rabia"}',
 'Módulo de merecimiento — E-MOTION', null, 'complementario',
 '{"no se decir que no","me cuesta poner limites","siempre digo que si","me dejo pisotear","complazco a todos","me siento invadida","no puedo negarme","abusan de mi"}'),

('valia', 'Demostrar mi valor', 'creencia', null, null, null,
 null, '{}', '{}',
 'Es la creencia de que el valor propio se gana con logros y hay que renovarlo cada vez. Funciona como motor un tiempo y después cobra: el logro alivia unos días y la exigencia vuelve más alta. La distinción del método es entre sacrificio, donde hay que sufrir para merecer, y propósito, donde se construye desde el sentido y el disfrute.',
 '{"el valor como algo que se gana","el logro que nunca alcanza","comparación permanente"}',
 '{"inseguridad","vergüenza","presión","vacío después del logro"}',
 '{"Debo demostrar mi valor","No soy suficiente","Si no logro cosas no valgo","Cualquiera lo haría mejor"}',
 '{"logro tras logro sin disfrutar ninguno","compararse","sentirse impostora"}',
 '{"sobretrabajar","controlar","autosabotearse","necesidad de aprobación"}',
 '{"¿Qué tendrías que lograr para sentirte suficiente?","La última vez que lo lograste, ¿cuánto te duró la sensación?","¿Quién te pedía demostrar cuando eras pequeña?","¿Qué serías si no lograras nada este año?"}',
 '{"Lista de lo que eres, no de lo que haces","Recibir un reconocimiento sin minimizarlo ni devolverlo","Dejar algo bien hecho sin perfeccionarlo más"}',
 '{"merecimiento","sobreexigencia","trabajo-agotamiento"}',
 'Módulo de merecimiento — E-MOTION', null, 'complementario',
 '{"no soy suficiente","siento que no valgo","tengo que demostrar","sindrome del impostor","me comparo con todos","no me siento capaz","siempre quiero mas","nada me llena"}'),

-- ── Patrones ──

('pareja', 'Patrones de pareja', 'patron', null, null, null,
 null, '{}', '{}',
 'La psicología del apego describe cómo las primeras experiencias de vínculo dejan una forma de relacionarse que tiende a repetirse: a quién eliges, qué te alarma, cómo respondes cuando alguien se aleja. Es una explicación con desarrollo clínico, y también algo que se puede modificar. Ver el patrón no es buscar culpables: es dejar de repetirlo sin darse cuenta.',
 '{"repetición del mismo final","elegir lo conocido antes que lo bueno","esperar a que cambie"}',
 '{"miedo","tristeza","frustración","esperanza sostenida"}',
 '{"Si me esfuerzo lo suficiente, cambiará","No voy a encontrar algo mejor","El amor es difícil","Tengo que aguantar para que funcione"}',
 '{"elegir personas emocionalmente indisponibles","el mismo malestar en el mismo momento de cada relación","dar mucho al principio y vaciarse"}',
 '{"dependencia","hipervigilancia","complacer","autosabotearse"}',
 '{"¿Qué se repite en tus últimas tres relaciones?","¿En qué momento aparece siempre el mismo malestar?","¿Qué papel tomas tú cada vez?","¿Qué se parece de esas personas a alguien de tu historia?"}',
 '{"Línea de tiempo de tus relaciones y qué se repite en cada una","Lista de lo que no es negociable para ti, escrita en frío","Nombrar en voz alta la señal que ignoraste la última vez"}',
 '{"abandono","limites","arbol-familiar"}',
 'Sanación de la niñez — E-MOTION', null, 'investigacion',
 '{"siempre termino con parejas que me abandonan","elijo mal","siempre me pasa lo mismo en el amor","relaciones toxicas","dependencia emocional","celos","me enamoro de quien no me da nada","no me valoran"}'),

('cuidar-a-todos', 'Cuidar a todos', 'patron', null, null, null,
 null, '{}', '{}',
 'Es el patrón de quien sostiene a los demás y queda última en su propia lista. Suele venir de aprender temprano que cuidar era la forma de tener lugar en la familia. Trae reconocimiento y también agotamiento, y casi siempre viene acompañado de culpa cuando se intenta parar.',
 '{"tener lugar cuidando","última en la propia lista","el amor entendido como sacrificio"}',
 '{"agotamiento","culpa","resentimiento silencioso","soledad"}',
 '{"Si no lo hago yo no lo hace nadie","Primero los demás","Pedir para mí es egoísta","Yo puedo con todo"}',
 '{"ser el sostén de la familia","no tener tiempo propio","enfermarse para poder parar"}',
 '{"complacer","sobretrabajar","postergarse","rechazar ayuda"}',
 '{"¿Quién te cuida a ti?","¿Desde qué edad cuidas?","¿Qué pasaría si dejaras de hacerlo una semana?","¿Qué recibes cuando cuidas, además de cansancio?"}',
 '{"Una hora propia protegida en la agenda, con el teléfono lejos","Delegar una tarea concreta esta semana y no revisarla","Pedir una ayuda pequeña y dejar que la hagan a su manera"}',
 '{"culpa","limites","merecimiento","dolor-espalda"}',
 'Módulo de merecimiento — E-MOTION', null, 'complementario',
 '{"siempre termino cuidando a todos","cuido de todos y nadie de mi","soy el paño de lagrimas","cargo con mi familia","siempre resuelvo yo","me toca todo a mi","nadie me ayuda"}'),

('trabajo-agotamiento', 'Trabajo y agotamiento', 'patron', null, null, null,
 'La Organización Mundial de la Salud reconoce el desgaste laboral como un fenómeno ocupacional, no como una enfermedad: agotamiento, distancia mental respecto al trabajo y sensación de menor eficacia. Nombrarlo así importa, porque el origen está en las condiciones y no solo en la persona.',
 '{"Organización Mundial de la Salud — CIE-11, desgaste ocupacional"}',
 '{"Agotamiento junto con ánimo bajo sostenido","Insomnio persistente y aislamiento","Pensamientos de no poder más: busca acompañamiento profesional"}',
 'La exploración complementaria mira qué se busca en ese ritmo: reconocimiento, seguridad, silenciar una duda sobre el propio valor.',
 '{"el ritmo como refugio","reconocimiento","miedo a no ser suficiente"}',
 '{"agotamiento","frustración","presión","desánimo"}',
 '{"Si paro, pierdo mi lugar","Tengo que demostrar que puedo","Descansar es perder oportunidades"}',
 '{"trabajar hasta caer","llevarse el trabajo a la cabeza fuera del horario","medir el día por lo producido"}',
 '{"sobretrabajar","postergar el descanso","controlar","complacer"}',
 '{"¿Qué obtienes cuando das más de lo que tienes?","¿Qué le dirías a otra persona que estuviera en tu lugar?","¿Qué parte de la carga es del puesto y qué parte te la pusiste tú?","¿Cuándo fue el último día en que no pensaste en trabajo?"}',
 '{"Una hora de corte diaria sin pantallas de trabajo","Escribir qué es tuyo y qué es del puesto en dos columnas","Una conversación concreta sobre carga con quien corresponda"}',
 '{"fatiga","sobreexigencia","valia"}',
 'Prácticas de regulación', '/lab/respiracion', 'consolidada',
 '{"estoy quemada","burnout","odio mi trabajo","no rindo","trabajo todo el dia","no descanso","siempre termino agotado demostrando mi valor","mi jefe","desgaste laboral"}'),

-- ── Historia ──

('historia-infancia', 'Experiencias de la infancia', 'historia', null, null, null,
 'Existe investigación amplia sobre las experiencias adversas en la infancia y su relación estadística con la salud a lo largo de la vida. Es una asociación de grupo, no un destino individual: haber vivido algo difícil no determina lo que te va a pasar, y el acompañamiento cambia el pronóstico.',
 '{"Estudio ACE — Adverse Childhood Experiences","Investigación sobre apego y desarrollo"}',
 '{"Si al recordar aparecen imágenes intrusivas, pesadillas o angustia que no baja, esto se acompaña con un profesional","Recuerdos de abuso o violencia: no se trabajan en solitario ni con una IA"}',
 'La exploración personal no busca culpables ni reescribe la historia: busca entender qué se aprendió ahí que hoy sigue operando, y qué necesitaba esa niña o ese niño que no recibió.',
 '{"lo que aprendí para sobrevivir","lo que necesitaba y no recibí","el papel que me tocó"}',
 '{"tristeza","rabia","miedo","ternura"}',
 '{"Tenía que ser fuerte","No podía molestar","Si me portaba bien, todo estaba en calma"}',
 '{"repetir el papel de la infancia en la vida adulta","cuidar como se cuidó entonces"}',
 '{"complacer","aislarse","controlar","hipervigilancia"}',
 '{"¿Qué edad tenías cuando pasó eso?","¿Qué necesitabas en ese momento y no recibiste?","¿Qué se esperaba de ti en tu casa?","¿En qué situaciones de hoy vuelves a sentirte de esa edad?"}',
 '{"Carta a esa niña o ese niño, escrita desde quien eres hoy","Mirar una foto de esa edad durante dos minutos, sin juzgar","Escritura: qué aprendí ahí que hoy ya no necesito"}',
 '{"abandono","tristeza-duelo","arbol-familiar"}',
 'Sanación de la niñez — E-MOTION', null, 'investigacion',
 '{"mi infancia","cuando era niña","mi papa","mi mama","creci sin","me marco","trauma de infancia","de pequeña","mis padres se separaron","me criaron mis abuelos"}'),

-- ── Árbol ──

('arbol-familiar', 'Patrones familiares', 'arbol', null, null, null,
 'En una familia se transmiten cosas por vías distintas y todas reales: la genética, lo aprendido por imitación, la cultura, el idioma emocional de la casa y las condiciones económicas. La transmisión de experiencias emocionales por vía epigenética en personas está en investigación y hoy no permite afirmar que una emoción concreta se herede. Lo que sí se observa con claridad son repeticiones, y esas se pueden mirar.',
 '{"Investigación en epigenética transgeneracional (en desarrollo)","Literatura sobre transmisión familiar y genogramas"}',
 '{}',
 'El trabajo con el árbol se hace con lenguaje prudente: se observa una coincidencia, podría ser interesante explorarla. Nunca se afirma que algo viene de la abuela ni que una enfermedad proviene del árbol.',
 '{"repeticiones","lealtades familiares","lo que nunca se habló","fechas y edades que vuelven"}',
 '{"curiosidad","tristeza","alivio","rabia"}',
 '{"En mi familia todos hemos sido así","Esto nos toca a todos","No se habla de eso"}',
 '{"repetición de enfermedades o de rupturas","edades que se repiten en acontecimientos","patrones económicos que vuelven en cada generación"}',
 '{"repetir","callar","evitar el tema"}',
 '{"¿Alguien de tu familia vivió algo parecido?","¿Hay repetición de enfermedades o de síntomas?","¿Hay historias de pérdidas que no se hablaron?","¿Hay edades o fechas que se repiten?","¿Hay nombres repetidos?","¿Hay patrones de pareja que se parecen?","¿Hay patrones económicos que vuelven?"}',
 '{"Dibujar tres generaciones en una hoja: nombres, fechas y acontecimientos","Una pregunta a la persona más mayor de tu familia sobre algo que nunca se contó","Marcar en el dibujo qué se repite y qué se cortó contigo"}',
 '{"dinero","pareja","historia-infancia","ciclo-hormonal"}',
 'Journaling terapéutico', '/bitacora', 'investigacion',
 '{"patron familiar","en mi familia todos","mi abuela","transgeneracional","arbol genealogico","herencia familiar","se repite en mi familia","secretos de familia","mi linaje","lealtad familiar"}')

on conflict (slug) do nothing;

-- ---------- Enlaces desde los nodos que ya existían ----------
-- La red nueva solo sirve si los nodos viejos apuntan hacia ella.
update biocode_nodes set related_slugs = '{"sobreexigencia","cuello-hombros","ansiedad"}' where slug = 'migrana';
update biocode_nodes set related_slugs = '{"merecimiento","sobreexigencia","cuidar-a-todos","rodillas"}' where slug = 'dolor-espalda';
update biocode_nodes set related_slugs = '{"culpa","rabia","ansiedad","garganta-expresion"}' where slug = 'digestivo-estomago';
update biocode_nodes set related_slugs = '{"migrana","sobreexigencia","garganta-expresion"}' where slug = 'cuello-hombros';
update biocode_nodes set related_slugs = '{"sobreexigencia","ansiedad","fatiga"}' where slug = 'insomnio';
update biocode_nodes set related_slugs = '{"merecimiento","culpa","pareja","historia-infancia","miedo"}' where slug = 'abandono';
update biocode_nodes set related_slugs = '{"merecimiento","abandono","limites","cuidar-a-todos"}' where slug = 'culpa';
update biocode_nodes set related_slugs = '{"culpa","abandono","dinero","valia","limites"}' where slug = 'merecimiento';
update biocode_nodes set related_slugs = '{"migrana","cuello-hombros","merecimiento","valia","trabajo-agotamiento","fatiga"}' where slug = 'sobreexigencia';
update biocode_nodes set related_slugs = '{"merecimiento","valia","arbol-familiar"}' where slug = 'dinero';

-- Recalcula el tsv de las filas nuevas y tocadas.
update biocode_nodes set updated_at = updated_at;
