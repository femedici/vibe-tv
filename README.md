# Vibe TV

Um hub pessoal de TV, com seus aplicativos, seu PS5 e suas cores.

Fork de [simbasjungles/free-my-tv](https://github.com/simbasjungles/free-my-tv), com o histórico e a licença MIT preservados. O projeto original é Android; esta adaptação é um **aplicativo Web Tizen separado** para estudo na Samsung AU8000, com prévia local.

**Estado: versão 1.1.5 assinada, instalada e iniciada na Samsung AU8000.** Ícones maiores, seleção elevada com sombra discreta e sem borda; resposta imediata sem animações preservada. Fundo acompanha o último app aberto com sucesso: sete degradês de marca e a arte PS5 fornecida. Consulta automática de apps permanece. Os 72 testes passaram; a percepção física desta nova apresentação e os ciclos completos de abertura/retorno ainda precisam de confirmação.

O método não oficial de Home usa um helper separado, exclusivo desta TV/firmware. O Home curto já está configurado para Vibe; backup de roteamento, aplicação, restauração e reaplicação passaram no aparelho. O proprietário confirmou YouTube → Home curto → Vibe; a comparação física sem animações foi aprovada e incorporada na 1.1.3. Evidências e reversão em [Home nativo](docs/vibe-tv/cleanframe-home.md). Nenhum resultado de navegador substitui o teste físico do Home, do HDMI-CEC ou do boot.

O proprietário já confirmou artes, navegação e abertura nativa do YouTube nas versões anteriores. O histórico de episódios permanece dentro dos apps; o Vibe registra apenas suas próprias aberturas bem-sucedidas.

![Vibe TV 1.1.5 — teste visual simulado no navegador, sem TV](outputs/brand-background-youtube.jpg)

## Rodar localmente

Node.js 22 ou superior e `zip`/`unzip` para o pacote. Sem `npm install`.

```sh
node --test tests/*.test.cjs
node tools/preview.cjs
```

Abra [a prévia local](http://127.0.0.1:4173). Use mouse ou setas, Enter e Escape/Voltar. O servidor escuta somente no próprio computador; não se conecta à TV.

A prévia permite verificar aparência, foco, temas e organização. Abertura de aplicativos e troca de HDMI retornam indisponibilidade no navegador. Ela não simula uma sessão real ou inventa histórico de reprodução.

## Interface

- Cartão retangular inteiro para reabrir o último aplicativo usado **pelo Vibe TV**. Antes disso, o primeiro favorito aparece como “Acesso rápido”.
- Artes oficiais locais para as sete marcas iniciais, sem distorção; apps adicionais usam o ícone nativo quando disponível. Sem logos imitados por texto/CSS.
- Ordem inicial: YouTube, PS5, Netflix, Prime Video, HBO Max, Samsung TV Plus, Disney+ e Spotify.
- Favoritos editáveis e persistentes; apps adicionais dependem do inventário real da TV.
- PS5 associado ao HDMI 2, com logo e fundo fornecidos pelo proprietário.
- Fundo estático do último app: YouTube vermelho→branco, Netflix vermelho→preto, Prime azul, HBO Max roxo, Samsung TV Plus laranja/violeta, Disney+ verde-azulado, Spotify verde e PS5 com a arte fornecida. Mover o foco não muda o fundo.
- Temas escuro, claro, cinza, pastel e vinho continuam nos painéis e no fundo de apps adicionais sem paleta conhecida. Ícones cerca de 7% maiores; seleção com escala/sombra discreta, sem borda ou animação.
- Controles de organização e ajustes no topo direito; ↓ do cartão vai direto aos apps, com destaque imediato no ícone. Sem nomes nos favoritos nem legenda de teclas no rodapé.
- Consulta automática ao abrir/voltar ao hub e ao adicionar apps. Favorito sem identificação aguarda a consulta e abre com um único clique; erros continuam explícitos. Não há botão de atualização manual.
- Configurações nativas permanecem acessíveis pelo controle Samsung/Smart Hub.

O histórico privado de Netflix, Prime e demais serviços não está disponível para esta aplicação. Não há retomada de episódio, progresso ou arte de conteúdo assistido inventados. A integração atual abre o app existente quando a plataforma a permite.

## Pacote Tizen

```sh
node tools/package-tizen.cjs
```

Produz `dist/VibeTV-unsigned.wgt`: arquivo de fontes não assinado, não um pacote pronto para instalar. O comando não instala SDK, não cria certificados e não conecta a nenhum dispositivo. Assinatura e teste físico são etapas separadas. O perfil Samsung local já foi criado pelo proprietário e usado na TV; chaves e pacotes assinados ficam fora do Git. Consulte [instalação](docs/vibe-tv/installation.md).

O código em `app/` e `build.sh` pertence ao projeto Android original. **Não use suas instruções ADB nesta Samsung Tizen.** Consulte [o README original](README.upstream.md) apenas para a plataforma correspondente.

## Evidência e continuidade

- [Limites de integração e validação física](docs/vibe-tv/compatibility.md)
- [Backup e recuperação: situação real](docs/vibe-tv/recovery.md)
- [Resultados de validação](docs/vibe-tv/validation.md)
- [Spec viva](specs/001-vibe-tv-tizen/spec.md) · [Tarefas](specs/001-vibe-tv-tizen/tasks.md)
- [Handoff](outputs/HANDOFF.md)

O roteamento nativo de Home e o início automático são mecanismos separados. A opção Samsung “Executar último aplicativo automaticamente” depende do último app usado e ainda requer teste de energia. O Smart Hub é preservado para acesso às configurações e reversão.

## Origem e licenças

Código original sob [MIT](LICENSE), de Free My TV. A apresentação referencia CleanFrame, com licença MIT preservada e fonte Manrope sob OFL; consulte `tizen/assets/cleanframe/`. Os novos arquivos desta adaptação seguem a mesma licença. A fonte e os assets herdados conservam suas licenças; as duas imagens PS5 fornecidas pelo usuário não são relicenciadas por este projeto. Consulte `tizen/assets/ATTRIBUTION.txt` e [origem das marcas](docs/vibe-tv/brand-assets.md). Marcas e nomes pertencem aos respectivos titulares; este projeto não é afiliado à Samsung, Sony ou aos serviços de streaming.
