// Base de conhecimento padrão: as "fontes autorizadas" da Camada 3.
// Fontes: documentação oficial RLDOCS (rldocs.realleader.com, consultada em 18/11/2026) e páginas
// comerciais do realleader.com (consultadas em 17/11/2026). Validada no experimento M1D2.
// A equipe pode editar tudo isto pelo /admin; o que for salvo lá substitui este padrão.

export type KbDoc = { id: string; produto: string; keys: string; text: string; url?: string };

export const KB: KbDoc[] = [
  {
    id: "kb-creditos-validade",
    produto: "rlpress",
    keys: "credito creditos validade expira expirar vence vencer prazo 45 dias saldo zerou sumiu pacote ativacao selo expirado acabaram",
    text: "RLPRESS: cada pacote de créditos vale por 45 dias a partir da ativação. Créditos não usados nesse prazo expiram. O selo no topo da tela mostra as matérias restantes e, ao passar o mouse, \"Válido até…\"; fica amarelo com 10 ou menos e vermelho com \"Pacote expirado\". Sem créditos, a geração fica bloqueada, mas as matérias salvas continuam editáveis e podem ser enviadas ao WordPress.",
  },
  {
    id: "kb-creditos-consumo",
    produto: "rlpress",
    keys: "credito regenerar regerar regeneracao gasta consome cobra editar salvar enviar reenviar wordpress invalido falha descartar excluir gratis gratuito",
    text: "RLPRESS: cada matéria gerada consome 1 crédito, no clique em \"Gerar com IA\". Regerar consome 1 crédito novo (a tela pede confirmação). Não consomem crédito: editar o texto, salvar como rascunho e enviar ao WordPress. Falha da IA não cobra crédito. Descartar ou excluir uma matéria não devolve o crédito.",
  },
  {
    id: "kb-precos",
    produto: "rlpress",
    keys: "preco precos custa valor pacote pacotes 100 250 500 stripe cartao pagamento mensalidade personalizado",
    text: "RLPRESS: 100 matérias por R$ 490,00 (R$ 4,90 cada); 250 por R$ 1.078,00 (R$ 4,31 cada, 12% de desconto); 500 por R$ 1.960,00 (R$ 3,92 cada, 20% de desconto, o mais vendido); quantidade personalizada a R$ 4,90 cada. O assistente virtual não cria nem concede cupons ou descontos. Pagamento com cartão via Stripe, créditos liberados após a confirmação. Sem mensalidade fixa.",
  },
  {
    id: "kb-rlpress-contratar",
    produto: "rlpress",
    keys: "contratar contratacao assinar comprar adquirir comecar usar cadastro cadastrar conta criar rlpress pacote creditos como renovar",
    text: "Como contratar o RLPRESS (self-service, sem falar com vendedor): 1) criar uma conta RealLeader em realleader.com/cadastrar, ou entrar com a conta que já tem; 2) escolher um pacote de créditos (100, 250 ou 500 matérias, ou quantidade personalizada); 3) pagar com cartão. O pacote é contratado e renovado no RealLeader, não dentro do RLPRESS. Depois de renovar, pode ser preciso sair e entrar de novo para os créditos aparecerem.",
  },
  {
    id: "kb-rlpress-produto",
    produto: "rlpress",
    keys: "rlpress materia noticia gerar ia fontes seo titulo meta tags combinar tabela conteudo origem modelos prompt imagem",
    text: "RLPRESS gera matérias de futebol por IA com os dados do RealLeader: título, artigo, meta descrição, títulos alternativos, palavras-chave, tags e categoria. O usuário escolhe as fontes de dados em \"Gerar notícia\", pode corrigir a tabela \"Conteúdo de origem\" antes de gerar e usar um prompt próprio. O RLPRESS gera só texto: não gera imagens. A IA pode errar datas, números e nomes: a revisão final é do cliente.",
  },
  {
    id: "kb-ia-errou-dado",
    produto: "rlpress",
    keys: "errado errada erro dado placar numero nome data materia publicada corrigir correcao conteudo origem parametro rodada",
    text: "Se a matéria saiu com um dado errado (ex.: placar): 1) confira a tabela \"Conteúdo de origem\"; se o número está errado ali, o problema é a fonte, o parâmetro (rodada, campeonato, clube) ou um jogo recém-terminado ainda não atualizado: ajuste em \"Editar parâmetros desta fonte\" e \"Atualizar dados\", ou corrija a célula; 2) para um ou outro número, edite o texto na tela de edição (grátis); corrigir os dados e regerar consome 1 crédito novo; 3) se a matéria já foi enviada ao portal, corrija direto no WordPress: editar no RLPRESS não atualiza o post e reenviar cria post duplicado.",
  },
  {
    id: "kb-wordpress",
    produto: "rlpress",
    keys: "wordpress conectar conexao configurar integracao senha aplicativo application password usuario nome url https teste testar",
    text: "Conectar o WordPress ao RLPRESS: no WordPress, com um usuário Editor ou Administrador, anote o \"Nome de usuário\" exato (não é e-mail nem apelido) e, em Perfil → \"Senhas de aplicativo\", crie uma senha (aparece uma única vez, em seis blocos). No RLPRESS, menu \"WordPress\": preencha \"URL do site WordPress\" (com https://, sem /wp-admin), \"Usuário\" e \"Application Password\", clique em \"Testar conexão\" (sucesso: \"✓ Conectado como…\") e em \"Salvar\". Se \"Senhas de aplicativo\" não aparece, o site provavelmente não está em HTTPS ou um plugin de segurança esconde o recurso.",
  },
  {
    id: "kb-wordpress-erros",
    produto: "rlpress",
    keys: "wordpress erro 401 403 404 vermelho falha conexao credenciais permissao recusou plugin seguranca firewall rest api yoast",
    text: "Erros ao conectar ou enviar ao WordPress: HTTP 401 = credenciais não reconhecidas, quase sempre o campo Usuário diferente do Nome de usuário, ou a senha colada é a de login e não a Senha de aplicativo, ou foi copiada pela metade; HTTP 403 = o usuário precisa ser Editor ou Administrador; HTTP 404 = URL errada (use o domínio, ou a subpasta, sem /wp-admin); \"O WordPress recusou a requisição\" = plugin de segurança, firewall ou API REST desativada (falar com quem administra o site); \"Yoast não recebeu a palavra-chave/meta\" = o post foi criado, mas falta no portal o arquivo de integração do Yoast. Se nada resolver, abra um chamado em rldocs.realleader.com/chamados (tipo Problema) com: print da tela de erro, o usuário do WordPress usado, a URL do site, a mensagem exata e o horário da tentativa.",
  },
  {
    id: "kb-wordpress-envio",
    produto: "rlpress",
    keys: "enviar envio publicar portal rascunho revisao status imagem destacada yoast tags categoria reenviar duplicado novo post",
    text: "O RLPRESS envia ao WordPress o título, o artigo em blocos do editor, a meta descrição, as tags e a categoria padrão; a palavra-chave e a meta só vão ao Yoast SEO se o portal tiver o arquivo de integração. O status padrão é Rascunho (pode ser Pendente de revisão ou Publicar direto). O RLPRESS não envia imagem: a imagem destacada é definida no WordPress, por isso o rascunho é o recomendado. \"Enviar novamente\" cria um NOVO post.",
  },
  {
    id: "kb-equipe",
    produto: "rlpress",
    keys: "equipe time organizacao usuarios membros convite convidar permissao teto pausar redacao varios logins",
    text: "Organização (redação): o responsável pede em \"Minha conta\", card do RLPRESS, \"Usar com a minha redação\". Os créditos são da organização e divididos pela equipe. No menu \"Equipe\", o responsável convida membros por e-mail (convite vale 7 dias), define permissões (Prompts, Modelos, Matérias da equipe, WordPress), um teto de matérias por membro e pode pausar a geração de alguém. Pacote pessoal não soma aos créditos da organização.",
  },
  {
    id: "kb-rltv",
    produto: "rltv",
    keys: "rltv grafico arte tv obs vmix browser source ndi 1920 1080 alpha png webm 4k template editor canva operador celular token atualiza ao vivo segundos formatos alternativa",
    text: "RLTV: editor de artes esportivas para TV e redes sociais, parecido com o Canva. Formatos 16:9, 9:16 e 1:1. Exporta PNG 1080p e 4K, vídeo WebM, lote em .zip e versão com fundo transparente (alpha). Entra no OBS ou vMix como Browser Source, por uma URL em 1920×1080. O operador controla pelo celular ou tablet. Dados ao vivo atualizam a cada 15, 30 ou 60 segundos. Saída NDI nativa não é suportada; a alternativa ao NDI é adicionar a URL do RLTV como Browser Source no OBS ou no vMix.",
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
    keys: "reembolso arrependimento 7 dias cdc estorno devolucao stripe dinheiro volta",
    text: "Política publicada: direito de arrependimento de 7 dias corridos para compras a distância (CDC, art. 49), com reembolso pelo mesmo meio de pagamento via Stripe. O texto fala em assinatura; não está claro se vale para pacotes de créditos do RLPRESS. Pedidos de reembolso são analisados pela equipe.",
  },
  {
    id: "kb-login",
    produto: "geral",
    keys: "login conta sso mesmo acesso cadastro entrar",
    text: "Todos os produtos (RLPRESS, RLTV, Análise Premium, RLAPI e a central de chamados) usam o mesmo login da conta RealLeader.",
  },
  {
    id: "kb-portal",
    produto: "portal",
    keys: "portal site campeonatos ligas copas agenda jogos simulador probabilidades classificacao realleader peso metodo adversario forca oficial diferenca",
    text: "Portal RealLeader: análise de campeonatos de pontos corridos desde 2017, com 21 campeonatos (16 ligas e 5 copas), agenda de jogos com probabilidades e simulador. A Classificação RealLeader é diferente da tabela oficial porque considera a força de quem cada time enfrentou: o Peso RealLeader estima a força relativa de cada clube rodada a rodada (com pesos diferentes para jogos em casa e fora); em cada jogo, os pontos conquistados + o Peso RL do adversário formam a Pontuação Real (PRL) da partida, e a Classificação RealLeader é a soma dos PRL. Assim, vencer fora um adversário forte vale mais que vencer em casa um fraco. Explicação completa em O Método (https://realleader.com/o-metodo) e Os Fundamentos (https://fundamentos.realleader.com).",
  },
  {
    id: "kb-aplicativo",
    produto: "geral",
    keys: "aplicativo app iphone android celular ios loja app store play store baixar instalar atalho tela inicial mobile",
    text: "O RealLeader não tem aplicativo para iPhone ou Android: funciona apenas pelo site, no navegador do celular ou do computador. Para acessar como se fosse um app, dá para criar um atalho do site na tela inicial do celular (no iPhone, pelo Safari: Compartilhar → Adicionar à Tela de Início; no Android, pelo Chrome: menu ⋮ → Adicionar à tela inicial).",
  },
  {
    id: "kb-glossario",
    produto: "rltv",
    keys: "o que e ndi browser source significa significado conceito explicar fonte navegador obs vmix transmissao rede video",
    text: "Termos de transmissão: NDI (Network Device Interface) é um protocolo para enviar vídeo e áudio pela rede local entre computadores e equipamentos de produção, sem cabos de vídeo. Browser Source (fonte de navegador) é um tipo de fonte do OBS e do vMix que exibe uma página da web dentro da cena; é assim que as artes do RLTV entram na transmissão, colando a URL do RLTV em 1920×1080. O RLTV não tem saída NDI nativa; a forma suportada é o Browser Source.",
  },
  {
    id: "kb-rlapi",
    produto: "geral",
    keys: "api rlapi dados integrar integracao endpoint chave key plano free starter pro business enterprise parceria desenvolvedor",
    text: "RLAPI: API REST com os mesmos dados do realleader.com (classificação, probabilidades, jogos, copas etc.), 52 endpoints GET em JSON, base https://rlapi.realleader.com/v1. Acesso com a conta RealLeader no painel rlapi.realleader.com, onde se criam as chaves. Planos mensais: Free (grátis), Starter R$ 49, Pro R$ 149, Business R$ 449 e Enterprise sob consulta (volume maior, SLA, contrato e nota fiscal, solicitado ao time pela página da RLAPI). Planos assinados em realleader.com/rlapi. Documentação: rldocs.realleader.com/rlapi.",
  },
  {
    id: "kb-chamados",
    produto: "geral",
    keys: "chamado chamados suporte ajuda central abrir falar equipe urgente problema duvida atendimento 48 horas",
    text: "Suporte por chamado: na central de ajuda (rldocs.realleader.com/chamados) ou no RLPRESS, menu lateral \"Central de ajuda\" → \"Abrir chamado\", com a conta RealLeader. Tipos: Dúvida, Problema ou Sugestão; aceita até 3 prints. A equipe responde em até 48 horas corridas, inclusive fins de semana. Dá para abrir chamado mesmo com o pacote vencido.",
  },
  {
    id: "kb-atendimento",
    produto: "geral",
    keys: "atendimento contato horario humano formulario resposta dia util segunda sexta parceria imprensa",
    text: "Outros contatos: formulário de contato do site realleader.com, de segunda a sexta, das 9h às 18h (horário de Brasília), com resposta em até 1 dia útil. Temas: método e site, RL API e parcerias, imprensa, bolão e relato de bugs.",
  },
];
