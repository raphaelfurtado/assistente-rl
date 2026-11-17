// Base de conhecimento: as "fontes autorizadas" da Camada 3.
// Montada a partir das páginas públicas do RealLeader consultadas em 17/11/2026
// (realleader.com, /rlpress, /rltv, /contato, /politica-reembolso, /termos-de-uso).
// Trechos marcados como [Rascunho a validar] NÃO vêm do site e precisam de revisão da equipe.

export type KbDoc = { id: string; produto: string; keys: string; text: string };

export const KB: KbDoc[] = [
  {
    id: "kb-creditos-validade",
    produto: "rlpress",
    keys: "credito creditos validade expira expirar vence vencer prazo 45 dias saldo zerou sumiu pacote ativacao",
    text: "RLPRESS: cada pacote de créditos vale por 45 dias a partir da ativação. Créditos não usados nesse prazo expiram. O cliente mantém acesso ao arquivo das matérias já geradas, mas não gera novas sem um novo pacote.",
  },
  {
    id: "kb-creditos-consumo",
    produto: "rlpress",
    keys: "credito regenerar regeneracao gasta consome cobra editar salvar reenviar wordpress invalido",
    text: "RLPRESS: 1 crédito = 1 matéria gerada. Regenerar consome outro crédito. Editar, salvar e reenviar ao WordPress é gratuito. Se a IA devolver um resultado inválido, o crédito não é cobrado.",
  },
  {
    id: "kb-precos",
    produto: "rlpress",
    keys: "preco precos custa valor pacote pacotes 100 250 500 stripe cartao pagamento mensalidade personalizado",
    text: "RLPRESS: 100 matérias por R$ 490,00 (R$ 4,90 cada); 250 por R$ 1.078,00 (R$ 4,31 cada); 500 por R$ 1.960,00 (R$ 3,92 cada, o mais vendido); quantidade personalizada a R$ 4,90 cada. Pagamento com cartão via Stripe, créditos liberados após a confirmação. Sem mensalidade fixa.",
  },
  {
    id: "kb-rlpress-contratar",
    produto: "rlpress",
    keys: "contratar contratacao assinar comprar adquirir comecar usar cadastro cadastrar conta criar rlpress pacote creditos como",
    text: "Como contratar o RLPRESS (self-service, sem falar com vendedor): 1) criar uma conta RealLeader em realleader.com/cadastrar, ou entrar com a conta que já tem; 2) escolher um pacote de créditos (100, 250 ou 500 matérias, ou quantidade personalizada); 3) pagar com cartão. Os créditos são liberados automaticamente após a confirmação do pagamento e valem 45 dias. Não há mensalidade fixa. Equipes podem pedir uma organização na conta, com um login por pessoa.",
  },
  {
    id: "kb-equipe",
    produto: "rlpress",
    keys: "equipe time organizacao usuarios logins redacao varios",
    text: "Planos para equipes: o cliente pede uma organização na conta RealLeader e cada pessoa tem o próprio login.",
  },
  {
    id: "kb-rlpress-produto",
    produto: "rlpress",
    keys: "rlpress materia noticia gerar ia fontes seo titulo meta tags discover combinar tabela editar curadoria imprecisoes",
    text: "RLPRESS gera matérias de futebol por IA com os dados do RealLeader: texto de 500 a 800 palavras, título, meta descrição, 5 títulos alternativos, palavra-chave, categoria e tags. São 29 fontes de dados, até 12 combinadas por matéria, com tabelas editáveis antes de gerar. As matérias chegam ao WordPress como rascunho. A IA pode errar datas, números e nomes: a revisão final é do cliente.",
  },
  {
    id: "kb-wordpress",
    produto: "rlpress",
    keys: "wordpress conexao conectar senha aplicativo application password teste vermelho falha erro 401 gutenberg yoast rascunho https usuario perfil rest api plugin seguranca",
    text: "Integração RLPRESS com WordPress: usa uma Senha de Aplicativo (Application Password) criada no perfil do usuário do WordPress, com botão de teste de conexão. Envia blocos Gutenberg nativos e preenche campos do Yoast SEO. [Rascunho a validar pela equipe] Verificações comuns quando o teste falha: usar o nome de usuário do WordPress (não o e-mail), colar a senha de aplicativo sem espaços extras, confirmar que o site usa HTTPS e que nenhum plugin de segurança bloqueia a REST API.",
  },
  {
    id: "kb-rltv",
    produto: "rltv",
    keys: "rltv grafico arte tv obs vmix browser source ndi 1920 1080 alpha png webm 4k template editor canva operador celular token atualiza ao vivo segundos formatos",
    text: "RLTV: editor de artes esportivas para TV e redes sociais, parecido com o Canva. Formatos 16:9, 9:16 e 1:1. Exporta PNG 1080p e 4K, vídeo WebM, lote em .zip e versão com fundo transparente (alpha). Entra no OBS ou vMix como Browser Source, por uma URL em 1920×1080. O operador controla pelo celular ou tablet, por um link com token secreto que não exige login. Dados ao vivo atualizam a cada 15, 30 ou 60 segundos. Saída NDI nativa não é suportada.",
  },
  {
    id: "kb-rltv-contratar",
    produto: "rltv",
    keys: "contratar rltv acesso liberar time comercial programa preco plano",
    text: "Para contratar o RLTV, o cliente fala com o time RealLeader, que avalia o formato do programa e libera o acesso.",
  },
  {
    id: "kb-cancelamento",
    produto: "premium",
    keys: "cancelar cancelamento assinatura multa renovacao automatica minha conta gerenciar periodo pago",
    text: "Assinatura (Análise Premium): pode ser cancelada a qualquer momento, sem multa, em Minha conta → Minhas assinaturas → Gerenciar assinatura. O acesso continua até o fim do período já pago. A renovação é automática e não há reembolso proporcional do período em curso.",
  },
  {
    id: "kb-reembolso",
    produto: "premium",
    keys: "reembolso arrependimento 7 dias cdc estorno devolucao stripe",
    text: "Política publicada: direito de arrependimento de 7 dias corridos para compras a distância (CDC, art. 49), com reembolso pelo mesmo meio de pagamento via Stripe. O texto fala em assinatura; não está claro se vale para pacotes de créditos do RLPRESS.",
  },
  {
    id: "kb-login",
    produto: "geral",
    keys: "login conta sso mesmo acesso cadastro entrar",
    text: "Todos os produtos (RLPRESS, RLTV, Análise Premium) usam o mesmo login da conta RealLeader.",
  },
  {
    id: "kb-portal",
    produto: "portal",
    keys: "portal site campeonatos ligas copas agenda jogos simulador probabilidades classificacao realleader peso metodo adversario forca oficial diferenca",
    text: "Portal RealLeader: análise de campeonatos de pontos corridos desde 2017, com 21 campeonatos (16 ligas e 5 copas), agenda de jogos com probabilidades e simulador. A Classificação RealLeader pondera a força dos adversários enfrentados, por isso pode diferir da tabela oficial. O detalhamento está nas páginas O Método e Os Fundamentos.",
  },
  {
    id: "kb-fontes-encomenda",
    produto: "rlpress",
    keys: "fonte nova sob encomenda personalizada dados api parceria integrar",
    text: "Novas fontes de dados entram no RLPRESS continuamente, e fontes sob encomenda podem ser pedidas ao time RealLeader.",
  },
  {
    id: "kb-atendimento",
    produto: "geral",
    keys: "atendimento contato horario humano formulario resposta dia util segunda sexta",
    text: "Atendimento humano: formulário de contato do site, de segunda a sexta, das 9h às 18h (horário de Brasília), com resposta em até 1 dia útil. Temas: método e site, RL API e parcerias, imprensa, bolão e relato de bugs.",
  },
];

export const KB_BY_ID: Record<string, KbDoc> = Object.fromEntries(KB.map((d) => [d.id, d]));
