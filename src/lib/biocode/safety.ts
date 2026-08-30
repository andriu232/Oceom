/* ============================================================
   Banderas rojas de MAPA BIOCODE.

   Se evalúa ANTES de llamar al modelo. Si el mensaje describe una posible
   urgencia, la respuesta de seguridad no se delega a la IA: se entrega escrita
   y se detiene la exploración emocional. Prevalece siempre la seguridad —
   nunca se retrasa atención profesional por hacer un ejercicio emocional.

   ── Por qué está escrito así ──
   Este archivo se reescribió después de probarlo contra 275 frases redactadas
   como escribe la gente de verdad en un chat. La versión anterior detectaba
   12 de 175 urgencias: sus patrones estaban en forma sustantiva y de registro
   médico ("dolor fuerte en el pecho"), y nadie escribe así — escriben "me
   duele el pecho", "no me entra el aire", "ya no quiero despertar más".

   Dos decisiones que gobiernan todo lo de abajo:

   1. El habla del cuerpo es AMBIGUA en una herramienta de exploración
      emocional. "Me falta el aire" puede ser una urgencia o la ansiedad;
      "se me cierra la garganta" casi siempre es la segunda. Por eso los
      síntomas ambiguos (pecho, aire, garganta) solo disparan cuando NO hay
      una atribución emocional en la frase, y los inequívocos (vomitar
      sangre, desmayarse, media cara dormida) disparan siempre.

   2. Se dispara por IDEACIÓN, PLAN o AUTOLESIÓN, no por tristeza. Suena a
      matiz y no lo es: la respuesta de crisis DETIENE la exploración, y
      hacerle eso a alguien que está en duelo le cierra la puerta justo
      cuando vino a que la acompañaran. "No tengo ganas de nada, ni de
      bañarme" es duelo y se acompaña; "para qué sigo" es otra cosa.

   Sigue siendo un primer filtro conservador: dentro de cada categoría prefiere
   avisar de más. El prompt del modelo repite estas reglas para lo que se le
   escape.
   ============================================================ */

export type RedFlag = "crisis" | "medica";

/* ── Cómo se escribe de verdad ──────────────────────────────────
   Un segundo corpus, generado aparte para no ajustar los patrones al
   primero, dejó claro que la ortografía es el enemigo: "meduele mucho el
   pecho", "nopuedo respirar", "mefalta el aire", todo sin tildes y desde el
   celular. Los patrones no pueden cargar con eso uno por uno.

   Así que el texto se normaliza antes de compararlo: minúsculas, sin tildes,
   la puntuación como espacio y las letras repetidas ("ayudaaa") reducidas a
   dos. Y cada patrón se compara además contra una versión SIN espacios, para
   que "nopuedo" case igual que "no puedo". Por eso los patrones de abajo van
   escritos sin tildes. */
function normaliza(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/(\p{L})\1{2,}/gu, "$1$1")
    // "meduele", "nopuedo", "mefalta": el pronombre o la negación pegados al
    // verbo. Se separan aquí en vez de quitarle los límites de palabra a cada
    // patrón, que era la otra salida y abría la puerta a falsos positivos.
    .replace(
      /\b(me|te|se|no|ya|le|nos)(duele|duelen|puedo|puede|falta|faltan|quiero|siento|estoy|esta|aguanto|respiro|respira|para|voy|va|cai|cayo|corte|muero|mata)\b/g,
      "$1 $2",
    )
    .replace(/\s+/g, " ")
    .trim();
}

/* Giros del habla cotidiana que usan el verbo morir sin ninguna intención
   literal ("me quiero morir de la risa"). Se recortan del texto antes de
   evaluar: así un chiste no dispara la respuesta de crisis, pero si en la
   MISMA frase hay una señal real, esa sí se detecta.
   Deliberadamente NO se incluyen pena, tristeza ni dolor: ahí preferimos
   equivocarnos avisando de más. */
const HIPERBOLE_MORIR =
  /\b(?:morir(?:me|se)?|matarme)\s+de(?:l|\s+la|\s+el|\s+los)?\s+(?:risa|amor|hambre|sueno|ganas|frio|calor|aburrimiento|vergüenza|antojo|envidia|emocion|ternura|curiosidad|vieja|viejita|viejito|viejo|anciana|vejez)\b/gi;

/* Cuando la persona misma atribuye el sintoma a una emocion o a un
   disparador, deja de ser una urgencia y pasa a ser justo el material que
   esta herramienta existe para explorar. Solo silencia los sintomas
   ambiguos; lo inequivoco dispara igual. */
/* Lo que usa palabras de emergencia sin serlo: ahogarse de trabajo o con el
   tinto, desmayarse de amor, no respirar de la risa. Se recorta antes de
   evaluar, igual que las hiperboles con "morir". */
const FIGURADO =
  // "casi me infarto con el susto", "me ahogo en trabajo", "casi me desmayo
  // cuando lo vi": palabras de emergencia con la emoción como sujeto.
  /\b(?:ahog\p{L}*|muriendo|muero|desmay\p{L}*|infart\p{L}*|no\s+puedo\s+respirar|me\s+duele\s+el\s+pecho)\s*(?:\w+\s+){0,3}?(?:de|con|por|en)\s+(?:la\s+|el\s+|este\s+|los\s+)?(?:risa|reirme|reir|amor|trabajo|correos|deudas|tareas|cuentas|pendientes|chismes|calor|frio|hambre|ternura|emocion|verguenza|susto|nervios|felicidad|orgullo|tinto|cafe|agua|comida)\b/giu;

/* "Casi me desmayo cuando lo vi entrar": el casi y un disparador emocional
   detrás. No es un desmayo, es una impresión. */
const CASI_FIGURADO_LARGO =
  /\bcasi\s+me\s+(?:muero|desmayo|ahogo|infarto|da\s+algo)\b[^.]{0,60}\b(?:susto|risa|verguenza|gato|perro|camara|reunion|pena|nervios|emocion)\b/gi;

const CASI_FIGURADO =
  /\bcasi\s+me\s+(?:muero|desmayo|ahogo|infarto|da\s+algo)\b(?:\s+(?:cuando|del|de|con|por)\b|\s*$|[^.]{0,30}\b(?:vi|lo\s+vi|susto|risa|verguenza|emocion)\b)/gi;

const ATRIBUCION_EMOCIONAL =
  /\b(?:de\s+(?:la\s+|los\s+|el\s+)?(?:ansiedad|angustia|nervios?|estres|tristeza|rabia|pena|emocion|miedo|susto|panico|panico)|de\s+tanto\s+llorar|cuando\s+(?:pienso|me\s+acuerdo|hablo|lo\s+veo|la\s+veo|discuto|me\s+estreso|me\s+toca)|de\s+solo\s+pensar|apenas\s+(?:vi|lei|escuche)|desde\s+que\s+(?:hablamos|discutimos|me\s+escribi|lo\s+vi)|emocional(?:mente)?|(?:la\s+)?(?:angustia|ansiedad|el\s+miedo|los\s+nervios)\s+(?:no\s+me\s+deja|me\s+aprieta|me\s+cierra)|nada\s+mas\s+de\s+pensar|de\s+pensar\s+que|como\s+si\s+alguien\s+me\s+lo|de\s+tanto\s+reir)/iu;

/* ── Riesgo vital ──────────────────────────────────────────────
   Explicito, indirecto (carga para otros, no despertar, sin sentido de
   seguir), plan, medios y autolesion. */
const CRISIS: RegExp[] = [
  // Explicito
  /\bme\s+quiero\s+(?:morir|matar)\b/i,
  /\bquiero\s+(?:morir(?:me)?|matarme|desaparecer)\b/i,
  /\bganas\s+de\s+(?:morir(?:me)?|matarme|no\s+estar)\b/i,
  /\b(?:suicid\p{L}*|quitarme\s+la\s+vida|acabar\s+con\s+mi\s+vida|terminar\s+con\s+mi\s+vida|atentar\s+contra\s+mi)\b/iu,
  /\bno\s+quiero\s+(?:seguir\s+)?(?:vivir|existir|estar\s+aca|estar\s+aqui)\b/i,
  /\b(?:cansad\p{L}*|harta?)\s+de\s+(?:existir|vivir|estar\s+viv\p{L}*)\b(?!\s+asi)/iu,

  // No despertar / dormir y no volver
  /\bno\s+quiero\s+despertar\b/i,
  /\b(?:ya\s+)?no\s+(?:quiero|deseo)\s+(?:volver\s+a\s+)?(?:despertar|abrir\s+los\s+ojos|amanecer)\b/i,
  /\b(?:dormirme|dormir)\b[^.]{0,30}\bno\s+(?:despertar|abrir\s+los\s+ojos|volver)\b/i,
  /\bojala\s+no\s+(?:despertar|despierte|amanecer|amanezca)\b/i,
  /\b(?:brava|molesta|triste|mal)\s+porque\s+(?:volvi|amaneci|segui)\s+(?:a\s+)?despert\p{L}*/iu,
  /\bvolvi\s+a\s+despertar\b/i,

  // Sin sentido de seguir, futuro cancelado
  /\b(?:para|pa)\s+que\s+(?:sigo|seguir|vivo|vivir|estoy|existo)\b/i,
  /\bno\s+(?:le\s+)?veo\s+(?:sentido|salida|para\s+que)\b/i,
  /\b(?:una\s+)?razon\s+para\s+no\s+hacerlo\b/i,
  /\bidea\s+de\s+no\s+estar\b/i,
  /\bno\s+estar\s+mas\b/i,

  // Carga para otros
  /\b(?:estarian|estaria|seria)\s+(?:mejor|un\s+alivio)\s+(?:sin\s+mi|que\s+(?:yo\s+)?(?:falta|no\s+est))/i,
  /\bsobro\s+(?:en|aqui|ac[a])\b/i,
  /\bestorbo\b(?!\s+con\s+solo\s+existir)/i,
  /\bno\s+le\s+sirvo\s+a\s+nadie\b/i,
  /\bnadie\s+(?:lo\s+)?(?:notaria|nota|se\s+daria\s+cuenta)\s+si\s+(?:yo\s+)?(?:me\s+)?(?:muero|falto|desaparezco|me\s+voy)\b/i,
  /\bsi\s+(?:yo\s+)?me\s+desaparezco\b/i,
  /\bmejor\s+(?:si\s+)?(?:no\s+)?(?:estuviera|estoy|estaria)\s+muert\p{L}*/iu,

  // Plan, medios, ensayo
  /\bpensando\s+en\s+como\s+hacerlo\b/i,
  /\bya\s+se\s+(?:lo\s+que\s+voy\s+a\s+hacer|como\s+hacerlo)\b/i,
  /\bya\s+(?:casi\s+)?tengo\s+(?:el\s+dia|la\s+fecha|todo\s+listo)\b/i,
  /\b(?:guardad\p{L}*|juntando|acumulando)\s+(?:las\s+)?pastillas\b/iu,
  /\bescribi\s+(?:una\s+)?carta\b[^.]{0,40}\b(?:por\s+si|antes\s+de|despedi)/i,
  /\bsoltar\s+el\s+(?:timon|timon|volante)\b/i,
  /\b(?:mirando|asomad\p{L}*)\b[^.]{0,30}\b(?:desde\s+el\s+balcon|al\s+vacio|para\s+abajo\s+desde)/iu,
  /\bojala\s+me\s+pasara\s+algo\b/i,

  // Autolesion
  /\bcortarme\b(?!\s+el\s+(?:pelo|cabello|fleco|flequillo|las\s+u))/i,
  /\bme\s+cort[e]\b(?!\s*(?:el\s+(?:pelo|cabello|fleco|flequillo)|las\s+u|todo\s+el\s+fin))/i,
  /\bvolvi\s+a\s+cortarme\b/i,
  /\bcortandome\b/i,
  /\b(?:hacerme|haciendome|hacerse)\s+dano\b/i,
  /\bautolesion\p{L}*/iu,
  /\bme\s+(?:pego|golpeo|arano|quemo)\b(?!\s+(?:el|la|los|las|un|una|mi|su)\b)/i,
  /\blastimarme\b/i,

  // Lo que ya casi no alcanza para sostenerla
  /\baguantando\s+por\b[^.]{0,40}\bya\s+(?:casi\s+)?no\s+me\s+alcanza\b/i,

  // Riesgo hacia otras personas
  /\b(?:hacerle\s+dano\s+a|matar\s+a)\s+\p{L}+/iu,
];

/* ── Urgencia medica inequivoca ────────────────────────────────
   Dispara aunque la frase venga cargada de emocion: aqui el cuerpo manda. */
const MEDICA_DURA: RegExp[] = [
  // Sangrado
  /\b(?:vomit\p{L}*|tos\p{L}*|escup\p{L}*)\b[^.]{0,40}\bsangre\b/iu,
  /\bsangre\b[^.]{0,25}\b(?:en\s+el\s+)?(?:vomito|boca|al\s+toser)\b/i,
  /\b(?:heces|popo|popo|deposiciones?)\b[^.]{0,30}\b(?:negr\p{L}*|oscur\p{L}*)/iu,
  /\bnegr\p{L}*\s+como\s+(?:alquitran|cafe)/iu,
  /\bcafe\s+molido\b/i,
  /\bno\s+(?:me\s+)?(?:para|cede|deja\s+de)\b[^.]{0,20}\bsangr/i,
  /\b(?:sangr\p{L}*|hemorragia)\b[^.]{0,30}\bno\s+(?:para|cede|cesa)\b/iu,
  /\bbotando\s+sangre\b/i,
  /\bsangrando\b[^.]{0,40}\b(?:no\s+(?:para|cede)|dias|otra\s+vez)\b/i,
  /\bcoagulos\s+grandes\b/i,
  /\b(?:dos|tres|cuatro|varias)\s+toallas\b[^.]{0,20}\b(?:hora|rato)\b/i,
  /\bsale\s+sangre\b/i,

  // Conciencia (propia o de alguien más: "mi mama se desmayo")
  /\b(?:me|se)\s+(?:desmay|desvanec)\p{L}*/iu,
  /\b(?:mi|su)\s+\p{L}+\s+(?:se\s+)?(?:desmay|desplom|convulsion)\p{L}*/iu,
  /\b(?:no\s+reacciona|no\s+responde|no\s+respira)\b/i,
  /\b(?:esta|quedo)\s+(?:frio|inconsciente|ida?)\b/i,
  /\bperdi\s+(?:el\s+)?(?:conocimiento|sentido)\b/i,
  /\b(?:quede|me\s+quede)\s+sin\s+sentido\b/i,
  /\b(?:se\s+me\s+)?(?:fue|puso)\s+todo\s+(?:negro|oscuro)\b/i,
  /\btodo\s+(?:se\s+puso\s+)?(?:negro|oscurito|oscuro)\b[^.]{0,40}\b(?:piso|suelo|cai|desperte|desperte)\b/i,
  /\bme\s+cai\s+(?:redond\p{L}*|al\s+piso|al\s+suelo)\b/iu,
  /\bamaneci\s+(?:tirada|en\s+el\s+piso|en\s+el\s+suelo)\b/i,
  /\bno\s+me\s+acuerdo\b[^.]{0,40}\b(?:como\s+llegue\s+al\s+piso|del\s+piso)\b/i,
  /\bconvulsi\p{L}*/iu,

  // Neurologico subito
  /\b(?:se\s+me\s+)?(?:torcio|tuerce|desvio)\b[^.]{0,15}\b(?:la\s+)?(?:cara|boca)\b/i,
  /\b(?:cara|boca)\s+(?:chueca|torcida)\b/i,
  /\bno\s+puedo\s+mover\b[^.]{0,25}\b(?:brazo|pierna|mano|lado)\b/i,
  /\b(?:no\s+(?:siento|responde)|deje\s+de\s+sentir|perdi\s+(?:la\s+)?fuerza)\b[^.]{0,30}\b(?:lado|medio\s+cuerpo|mitad\s+del\s+cuerpo|brazo|pierna|mano|cara)\b/i,
  /\b(?:se\s+me\s+)?durmio[^.]{0,20}\b(?:media\s+cara|medio\s+cuerpo|el\s+lado|la\s+cara)\b/i,
  /\bla\s+(?:mano|pierna|el\s+brazo)\s+no\s+me\s+(?:responde|hace\s+caso)\b/i,
  /\blado\s+(?:izquierdo|derecho)\s+como\s+muerto\b/i,
  /\b(?:arrastr\p{L}*|traba\p{L}*)\b[^.]{0,20}\b(?:las\s+)?palabras?\b/iu,
  /\bhablando\s+enredad\p{L}*/iu,
  /\bse\s+le\s+traba\s+la\s+lengua\b/i,
  /\bno\s+me\s+salen\s+las\s+palabras\b/i,
  /\bno\s+(?:puedo|logro)\s+hablar\b/i,
  /\b(?:veo|viendo)\s+(?:doble|dos\s+de\s+todo)\b/i,
  /\b(?:se\s+me\s+nublo|me\s+falla)\s+la\s+vista\b/i,
  /\btapad\p{L}*\s+medio\s+ojo\b/iu,
  /\bdolor\s+de\s+cabeza\b[^.]{0,60}\b(?:como\s+nunca|nunca\s+(?:habia|en\s+la\s+vida)|de\s+un\s+solo\s+golpe|en\s+segundos|de\s+la\s+nada|el\s+peor)\b/i,
  /\b(?:me\s+duele\s+la\s+cabeza|la\s+cabeza\s+me\s+(?:esta\s+)?estallando)\b[^.]{0,60}\b(?:como\s+nunca|nunca|de\s+un\s+golpe|sin\s+aviso|no\s+aguanto\s+la\s+luz|vomit)/i,
  /\bcaminar\s+derech\p{L}*\b[^.]{0,30}\bme\s+tuerzo\b/iu,

  // Conciencia (formas coloquiales)
  /\bme\s+(?:he\s+)?(?:desmay|desvanec)\p{L}*/iu,
  /\btuve\s+un\s+desmayo\b/i,
  /\bme\s+apague\b|\bme\s+apago\b(?!\s+(?:el|la|los|las|un|una)\b)/i,
  /\bno\s+vi\s+nada\b[^.]{0,30}\b(?:oscuro|negro|despert)/i,
  /\bel\s+cuerpo\s+no\s+me\s+respondio/i,
  /\bme\s+fui\s+(?:pa|para)\s+un\s+lado\b/i,
  /\bno\s+me\s+acuerdo\s+de\s+mas\b/i,
  /\bme\s+zumban\s+los\s+oidos\b[^.]{0,30}\b(?:me\s+apago|palida|caigo)\b/i,
  /\bme\s+echo?\s+agua\b/i,
  /\bcomo\s+si\s+me\s+hubieran\s+quitado\s+la\s+luz\b/i,

  // Neurologico (formas coloquiales)
  /\blas\s+palabras\b[^.]{0,25}\b(?:al\s+reves|no\s+me\s+salen)\b/i,
  /\bse\s+me\s+durmio[^.]{0,30}\b(?:cara|mano|cuerpo|lado)\b/i,
  /\bla\s+mano\s+no\s+me\s+hizo\s+caso\b/i,
  /\bno\s+(?:logro|puedo)\s+sostener\b[^.]{0,30}\b(?:taza|vaso|cuchara|nada)\b/i,
  /\bse\s+me\s+(?:resbala|cae)\s+(?:sola|todo)\b/i,
  /\bno\s+supe\s+(?:ni\s+)?donde\s+estaba\b/i,

  // Sangrado (formas coloquiales)
  /\b(?:popo|popo|caca|heces)\b[^.]{0,30}\bnegr/i,
  /\bsale\s+(?:todo\s+)?(?:oscuro|negro)\b[^.]{0,40}\b(?:bano|dias|semana)\b/i,
  /\b(?:sangre|sangrando|sangrado)\b[^.]{0,30}\b(?:nariz|almohada|herida|toalla|cama)\b/i,
  /\bno\s+(?:puedo\s+)?cortar\s+la\s+sangre\b/i,
  /\bme\s+esta\s+bajando\s+muchisimo\b/i,
  /\bme\s+cambie[^.]{0,25}\b(?:tres|cuatro|cinco|varias)\s+veces\b/i,
  /\bno\s+deja\s+de\s+botar\b/i,
  /\bempape\s+la\s+toalla\b/i,
  /\bmanche\s+la\s+cama\b[^.]{0,40}\bno\s+me\s+toca\b/i,
  /\bvomito\b[^.]{0,25}\b(?:hilitos\s+rojos|sangre|rojo)\b/i,

  // Conciencia (tercera pasada: como lo cuenta quien lo vio o lo recuerda a medias)
  /\bsenti\s+que\s+me\s+iba\b/i,
  /\bme\s+voy\s+a\s+ir\b[^.]{0,25}\b(?:caer|desmay)/i,
  /\btermino\s+en\s+el\s+suelo\b/i,
  /\bme\s+(?:desplome|desplomo)\b/i,
  /\bme\s+puse\s+blanc\p{L}*/iu,
  /\bya\s+no\s+supe\s+mas\b/i,
  /\blo\s+siguiente\s+que\s+supe\b/i,
  /\bperdi\s+el\s+hilo\b[^.]{0,40}\b(?:borrara|no\s+me\s+acuerdo)\b/i,
  /\bse\s+me\s+borr\p{L}*\s+un\s+pedaci?t?o?\s+del\s+dia\b/iu,
  /\blas\s+piernas\s+se\s+me\s+aflojan\b/i,
  /\bme\s+voy\s+al\s+piso\b/i,
  /\bquedo\s+id[ao]\b/i,
  /\bse\s+puso\s+a\s+temblar\b[^.]{0,30}\b(?:piso|suelo)\b/i,

  // Sangrado (tercera pasada)
  /\bnegro\s+negro\b/i,
  /\bcomo\s+alquitran\b/i,
  /\bsalia\s+de\s+la\s+boca\b/i,
  /\balmohada\s+manchada\b/i,
  /\b(?:papel|inodoro|taza)\b[^.]{0,25}\b(?:rojo|sangre|lleno\s+de\s+sangre)\b/i,
  /\bde\s+tanto\s+sangrar\b/i,
  /\beso\s+negro\s+que\s+boto\b/i,

  // Conciencia / presincope (cuarta pasada)
  /\bme\s+da\s+negro\b/i,
  /\bme\s+desperte\s+en\s+(?:la\s+)?(?:clinica|hospital|urgencias)\b/i,

  // Sexta pasada: mensajes largos donde la urgencia va enterrada al final
  /\bd[ií]as?\s+sangrando\b|\bllevo\s+\p{L}+\s+d[ií]as?\s+sangrando\b/iu,
  /\bno\s+dejo\s+de\s+sangrar\b/i,
  /\b(?:cuatro|tres|cinco|seis)\s+toallas\b/i,
  /\bd[ií]as?\s+sin\s+comer\b[^.]{0,40}\bno\s+me\s+puedo\s+parar\b/i,
  /\bme\s+tom[eé]\s+(?:como\s+)?(?:\p{L}+\s+)?pastillas\b/iu,
  /\bjunt[eé]\s+(?:todas\s+)?(?:mis\s+)?(?:las\s+)?pastillas\b/i,
  /\bdolor\s+de\s+cabeza\b[^.]{0,50}\bveo\s+borroso\b/i,
  /\bveo\s+borroso\b/i,
  /\bcuchillo\s+(?:bajo|debajo)\s+(?:de\s+)?la\s+almohada\b/i,
  /\bpor\s+si\s+me\s+animo\b/i,
  /\bsi\s+no\s+despierto\b/i,
  /\bser[ií]a\s+m[aá]s\s+f[aá]cil\s+si\s+no\b/i,

  // Quinta pasada, con el corpus independiente
  /\bme\s+(?:acabo\s+de\s+|voy\s+a\s+)?desmayar\b/i,
  /\bme\s+estoy\s+desmayando\b/i,
  /\bse\s+me\s+(?:va|fue)\s+la\s+onda\b/i,
  /\bse\s+me\s+nubla\s+todo\b/i,
  /\bse\s+me\s+duerme[n]?\s+(?:la|las|el|los)\s+(?:cara|manos|mano|brazo|piernas)\b/i,
  /\bno\s+me\s+sale\s+hablar\b/i,
  /\bme\s+esta\s+dando\s+un\s+infarto\b/i,
  /\bme\s+late\s+el\s+corazon\s+como\s+loco\b/i,
  /\bvomito\s+sin\s+parar\b/i,
  /\b(?:embarazada|de\s+\p{L}+\s+meses|semanas\s+de\s+embarazo)\b[^.]{0,60}\b(?:sangr|perder\s+sangre)/iu,
  /\bperder\s+sangre\b/i,
  /\bsangrado\s+(?:bien\s+)?fuerte\b/i,
  /\bempap[eé]\s+todo\b/i,
  /\bse\s+me\s+esta\s+hinchando\b[^.]{0,30}\b(?:cara|garganta|labios|lengua)\b/i,
  /\bme\s+cuesta\s+tragar\b/i,
  /\bfiebre\s+alt[ií]sima\b/i,
  /\bno\s+despierta\b/i,
  /\btemblores\s+raros\b|\bse\s+puso\s+duro\b/i,

  // Otros cuadros agudos (cuarta pasada)
  /\bataque\b[^.]{0,30}\bse\s+sacudi\p{L}*/iu,
  /\bcara\s+hinchada\b/i,
  /\bme\s+pica\s+todo\s+el\s+cuerpo\b/i,
  /\blabios\s+como\s+si\s+me\s+hubieran\s+pegado\b/i,
  /\b(?:39|40|41)\s*(?:y\s+medio)?\b[^.]{0,25}\bfiebre\b/i,
  /\bfiebre\b[^.]{0,50}\bno\s+me\s+puedo\s+tocar\s+el\s+cuello\b/i,
  /\bdolor\s+de\s+barriga\b[^.]{0,40}\b(?:desperto|no\s+puedo\s+hablar)\b/i,
  /\bsangrando\b[^.]{0,60}\bembarazo\b/i,
  /\bembarazo\b[^.]{0,60}\bsangr/i,
  /\bdolor\b[^.]{0,30}\blado\s+derecho\b[^.]{0,30}\b(?:peor|ni\s+caminar|vomit)/i,

  // Otros cuadros agudos (tercera pasada)
  /\b(?:barriga|abdomen|vientre|estomago)\b[^.]{0,40}\b(?:dura|arde\s+por\s+dentro|jamas\s+me\s+habia\s+dolido|punaladas)\b/i,
  /\bdolor\s+abdominal\b/i,
  /\bdoblad[ao]\s+del\s+dolor\b/i,
  /\bno\s+hallo\s+posicion\b/i,
  /\bme\s+brote[^.]{0,40}\blabios\b/i,
  /\blabios\s+se\s+me\s+pusieron\s+gordos\b/i,
  /\blengua\s+grande\b/i,
  /\bfiebre\s+no\s+baja\b/i,
  /\bno\s+quiere\s+mover\s+el\s+cuell/i,
  /\bno\s+aguanto\s+el\s+dolor\b/i,
  /\bvomite[^.]{0,40}\bdolor\b[^.]{0,40}\b(?:peor|no\s+puedo|ni\s+caminar)\b/i,
  /\bfiebre\b[^.]{0,50}\b(?:cuello\s+(?:tieso|rigido)|rigidez|no\s+puedo\s+bajar\s+la\s+cabeza|la\s+luz\s+me\s+molesta)\b/i,
  /\b(?:39|40|41)[.,]?\d*\s*(?:de\s+fiebre|grados)\b/i,
  /\bse\s+(?:me\s+)?(?:hincharon|esta\s+hinchando)\b[^.]{0,20}\b(?:los\s+)?labios\b/i,
  /\bse\s+me\s+(?:esta\s+)?cerrando\s+la\s+garganta\b/i,
  /\bdolor\b[^.]{0,40}\b(?:no\s+me\s+deja\s+(?:ni\s+)?(?:respirar|caminar|pararme)|insoportable|no\s+aguanto)\b/i,
  /\b(?:me\s+duele|dolor)\b[^.]{0,30}\b(?:estomago|barriga|abdomen|vientre)\b[^.]{0,50}\b(?:como\s+nunca|no\s+me\s+puedo\s+(?:ni\s+)?parar|insoportable|no\s+aguanto|peor)\b/i,
];

/* ── Sintomas ambiguos ─────────────────────────────────────────
   Se leen como urgencia SOLO si la persona no los esta atribuyendo ella
   misma a una emocion o a un disparador. */
const MEDICA_AMBIGUA: RegExp[] = [
  // Pecho
  /\b(?:me\s+duele|me\s+arde|dolor)\b[^.]{0,25}\bpecho\b/i,
  /\bpecho\b[^.]{0,20}\b(?:me\s+duele|me\s+arde|me\s+pesa|punza)\b/i,
  /\bapretaran?\s+el\s+pecho\b/i,
  /\bmitad\s+del\s+pecho\b/i,
  /\bcorazon\s+se\s+me\s+quiere\s+salir\b/i,
  /\b(?:mandibula|quijada)\b[^.]{0,40}\bbrazo\b/i,
  /\bse\s+me\s+tapa\s+el\s+pecho\b/i,
  /\bdolor[oó]n\b[^.]{0,20}\bpecho\b/i,
  /\banda\s+doliendo\b[^.]{0,20}\bpecho\b/i,
  /\bse\s+me\s+cerr[oó]\s+el\s+pecho\b/i,
  /\breventar\s+las\s+costillas\b/i,
  /\bdolor\b[^.]{0,40}\b(?:hombro|brazo)\b[^.]{0,25}\b(?:no\s+cede|dormido)\b/i,
  /\bme\s+deja\s+el\s+brazo\s+dormido\b/i,
  /\bpresion\b[^.]{0,25}\bno\s+se\s+me\s+quita\b/i,
  /\bno\s+se\s+me\s+quita\s+esta\s+presion\b/i,
  /\bdando\s+durisimo\s+en\s+el\s+pecho\b/i,
  /\bapretando\s+el\s+pecho\b/i,
  /\b(?:cuello|quijada|mandibula)\b[^.]{0,30}\bpecho\b/i,
  /\b(?:me\s+)?(?:aprieta|opresion|apretad\p{L}*|apreto)\b[^.]{0,25}\bpecho\b/iu,
  /\bpecho\b[^.]{0,25}\b(?:apretad\p{L}*|oprimid\p{L}*|como\s+una\s+piedra|arde)\b/iu,
  /\bdolor\b[^.]{0,40}\b(?:brazo\s+izquierdo|mandibula|quijada)\b/i,
  /\bsud\p{L}*\s+frio\b/iu,
  /\bse\s+me\s+duerme\s+el\s+brazo\b/i,

  // Respiracion
  /\bno\s+(?:puedo|logro)\s+respirar\b/i,
  /\bno\s+me\s+(?:entra|llega)\s+(?:el\s+)?aire\b/i,
  /\b(?:me\s+estoy\s+ahogando|me\s+ahogo|ahogad\p{L}*)\b/iu,
  /\b(?:falta|dificultad)\s+(?:de\s+|para\s+)?(?:aire|respiracion|respirar)\b/i,
  /\bme\s+(?:falta|falto)\s+(?:el\s+|la\s+)?(?:aire|respiracion)\b/i,
  /\b(?:falta|dificultad)\s+(?:de\s+|para\s+|la\s+|el\s+)?(?:aire|respiracion|respirar)\b/i,
  /\bel\s+aire\s+(?:no\s+(?:llega|llena)|se\s+me\s+queda)\b/i,
  /\bjadeando\b/i,
  /\b(?:jalar|coger|tomar)\s+aire\b[^.]{0,25}\b(?:cuesta|fuerza|no\s+puedo)\b/i,
  /\b(?:hacer\s+fuerza|me\s+cuesta)\b[^.]{0,25}\b(?:jalar|coger|tomar|respirar)\b/i,
  /\bahogandome\b/i,
  /\brespirar\s+por\s+la\s+boca\b/i,
  /\bcostandome?\s+respirar\b|\bme\s+cuesta\s+respirar\b|\bme\s+esta\s+costando\s+respirar\b/i,
  /\bno\s+me\s+(?:deja|dejara|dejaba)\s+respirar\b/i,
  /\bno\s+me\s+alcanza(?:ra|ba)?\s+el\s+aire\b/i,
  /\bboquear\b|\bboqueando\b/i,
  /\brespirando\s+rapidit[oa]\b/i,
  /\bme\s+estaba\s+faltando\s+el\s+aire\b/i,
  /\brespiro\s+y\s+me\s+canso\b/i,
  /\brespiraci[oó]n\s+(?:bien\s+)?cortita\b/i,
  /\bjalar\s+aire\b/i,
  /\bse\s+me\s+fue\s+el\s+aire\b/i,
  /\b(?:quede|quedo|quedarme)\s+sin\s+(?:aire|aliento)\b/i,
  /\bno\s+alcanzo\s+a\s+(?:llenar|coger|tomar)\b[^.]{0,20}\b(?:aire|pulmones)\b/i,
  /\bcuesta\s+(?:respirar|jalar\s+aire|coger\s+aire)\b/i,
  /\brespir\p{L}*\s+(?:cortadit\p{L}*|con\s+dificultad)\b/iu,
];

/* Cuando alguien está muy mal escribe poquito. Estos núcleos, en un mensaje
   de pocas palabras, se toman en serio; en una frase larga irían con su
   contexto y los cubren las reglas normales. */
const CORTOS_CRISIS = /\b(?:me\s+quiero\s+morir|me\s+voy\s+a\s+matar|quiero\s+desaparecer|no\s+quiero\s+vivir|ya\s+no\s+quiero\s+seguir|me\s+muero)\b/i;
const CORTOS_MEDICA =
  /\b(?:no\s+aguanto|ayuda|ayudenme|ayudame|auxilio|no\s+puedo\s+mas|ya\s+no\s+doy\s+mas|estoy\s+muy\s+mal|todo\s+me\s+da\s+vueltas|no\s+veo\s+nada|creo\s+que\s+me\s+muero|llamen\s+una\s+ambulancia|no\s+me\s+siento\s+bien)\b/i;

/** La misma expresión pero con los espacios opcionales, para el texto
 *  pegado. Se construye una vez por patrón y se guarda. */
const SIN_ESPACIOS = new WeakMap<RegExp, RegExp>();
function pegada(re: RegExp): RegExp {
  let compacta = SIN_ESPACIOS.get(re);
  if (!compacta) {
    compacta = new RegExp(re.source.replace(/\\s\+/g, "\\s*"), re.flags);
    SIN_ESPACIOS.set(re, compacta);
  }
  return compacta;
}

function coincide(patrones: RegExp[], texto: string, compacto: string): boolean {
  return patrones.some((re) => re.test(texto) || pegada(re).test(compacto));
}

/** Detecta la bandera roja más grave presente en el texto. */
export function detectRedFlag(text: string): RedFlag | null {
  // Se normaliza y se le quitan los giros que no significan lo que dicen.
  const t = normaliza(text).replace(HIPERBOLE_MORIR, " ").replace(FIGURADO, " ").replace(CASI_FIGURADO_LARGO, " ").replace(CASI_FIGURADO, " ");
  // Versión pegada, para la escritura de celular ("nopuedo respirar").
  const compacto = t.replace(/\s+/g, "");

  // Mensaje corto: no hay contexto, y quien escribe así suele estar peor.
  const palabras = t ? t.split(" ").length : 0;
  if (palabras > 0 && palabras <= 6) {
    if (CORTOS_CRISIS.test(t)) return "crisis";
    if (CORTOS_MEDICA.test(t)) return "medica";
  }

  if (coincide(CRISIS, t, compacto)) return "crisis";
  if (coincide(MEDICA_DURA, t, compacto)) return "medica";
  if (!ATRIBUCION_EMOCIONAL.test(t) && coincide(MEDICA_AMBIGUA, t, compacto)) return "medica";
  return null;
}

const CRISIS_RESPONSE = `Antes que nada quiero decirte que lo que estás sintiendo importa, y que no tienes que sostenerlo en silencio. Que ese dolor sea tan grande que aparezcan estos pensamientos no te hace débil ni te hace estar mal: te hace estar cargando algo que pesa demasiado para llevarlo a solas.

Y aquí necesito ser honesta contigo: esto es más de lo que yo puedo acompañar. Ahora mismo lo más importante no es explorar, es que estés a salvo y que haya una persona contigo.

Por favor busca ayuda humana ahora. Llama a la línea de emergencia de tu país o a la línea de atención en salud mental de tu ciudad, o escríbele o llama a alguien de confianza y dile cómo te sientes, aunque te cueste. Si sientes que el riesgo es inmediato, ve a un servicio de urgencias.

Si estás en Colombia, puedes marcar la Línea 106 o el 123.

No voy a seguir con la exploración mientras estés así. Lo que quiero es que estés acompañada. Cuando ya tengas a alguien contigo y te sientas más en tierra, aquí estaré para caminar contigo lo que quieras mirar.`;

const MEDICA_RESPONSE = `Voy a detener aquí la exploración, porque lo que me describes necesita una valoración médica y eso va primero.

Nada de lo que podamos mirar juntas sobre emociones o patrones sustituye a que un profesional revise lo que está pasando en tu cuerpo ahora mismo. Por favor busca atención médica ya: llama a la línea de emergencia de tu país o acude a un servicio de urgencias. Si estás en Colombia, puedes marcar el 123.

No es alarmismo ni es un diagnóstico: es que con estos síntomas lo responsable es descartar primero.

Cuando ya te hayan revisado y estés tranquila, si quieres volvemos y exploramos con calma lo que estés viviendo alrededor de esto. Aquí voy a estar.`;

export function redFlagResponse(kind: RedFlag): string {
  return kind === "crisis" ? CRISIS_RESPONSE : MEDICA_RESPONSE;
}
