# Origem das marcas

Verificado em 20/10/2026. Arquivos em `tizen/assets/brands/`, copiados sem edição dos bytes. Estas marcas e imagens pertencem aos respectivos titulares e **não recebem a licença MIT do código**. Sua disponibilidade pública não equivale a licença aberta ou endosso ao Vibe TV.

| Arquivo | Dimensões | Origem oficial / arquivo |
|---|---|---|
| youtube.png | 1705×573, transparente | [Brand YouTube](https://brand.youtube/youtube-logo), [ZIP](https://www.gstatic.com/marketing-cms/52/7d/637fef5a4788a97747e6feabc4aa/youtube-logo.zip), membro `YouTube_Logo/Digital/01 Full Color/yt_logo_fullcolor_almostblack_digital.png` |
| netflix.svg | 309×83 | [Portal Netflix](https://brand.netflix.com/en/assets/logos/), [JSON público](https://brand.netflix.com/api/en/page/logos), [SVG](https://images.ctfassets.net/y2ske730sjqp/821Wg4N9hJD8vs5FBcCGg/9eaf66123397cc61be14e40174123c40/Vector__3_.svg) |
| prime.png | 1040×317, transparente | [Prime Video](https://www.primevideo.com/), [PNG](https://m.media-amazon.com/images/G/01/digital/video/acquisition/logo/pv_logo_white._CB548637580_.png) |
| max.png | 222×160, transparente | [HBO Max](https://www.hbomax.com/), [PNG](https://www.hbomax.com/dotcom/img/hbomax/logo_nav_bar.png) |
| disney.jpg | 1920×1080 | [Disney+ Press](https://press.disneyplus.com/about/logos), [imagem](https://lumiere-a.akamaihd.net/v1/images/disney_logo_march_2024_050fef2e.png) |
| spotify.svg | viewBox 823.46×225.25 | [Spotify Design](https://developer.spotify.com/documentation/design), [ZIP](https://developer.spotify.com/images/guidelines/design/2024-spotify-full-logo.zip), membro `Full_Logo_Green_RGB.svg` |
| samsung.jpg | 1000×563 | [Samsung Newsroom, redesign de 2022](https://news.samsung.com/global/samsung-electronics-is-bringing-a-wide-range-of-new-premium-content-to-its-samsung-tv-plus-service-along-with-a-fresh-redesign-of-the-platforms-interface), [JPEG](https://img.global.news.samsung.com/global/wp-content/uploads/2022/09/Samsung_TV_Plus_main1.jpg) |

A URL Disney termina em `.png`, mas o servidor entregou JPEG; somente a extensão local foi corrigida. O logo HBO Max conserva a resolução limitada da fonte. Os SVGs não contêm referências externas.

## Integridade SHA-256

```text
9d9674fdc18083dad15563ef34773ec5337db21aa4ce75c45977a894784d728f  youtube.png
68762a70b6a5a5641a57775e0b39ae9cae84d4ce157f668142fefd9a9c523054  netflix.svg
4f843ef775b737ee32809d1281b5338709bd723bb8a8cb1bb0afb30db7c31a20  prime.png
01d548fe478659866468a1fef2924b44ffcb51846a8f3ce5e48aee10cc241483  max.png
b7bd6f79e1adaf72c5dd1cdfe3b60563b8fd5c4626c56fce6fa7a5b89c75b241  disney.jpg
6e01367cde4cb752b11fd9250becc4a579d1f40bdddaaf23522f27aaa5cf8d70  spotify.svg
d97127e1cdea79aa4b53cbde37066f3ea76bf2b504becada3c443ae1507c8ca6  samsung.jpg
```

## Por que não usar todos os `iconPath` da TV?

Na AU8000, a API pública retornou ícones quadrados de 117×117 a 423×423 para os serviços consultados, sem a arte retangular do Smart Hub. O caminho informado para Prime Video retornou `ERR_FILE_NOT_FOUND` no engine real. Por isso, os sete serviços conhecidos usam os arquivos locais acima, mantendo a proporção; aplicativos adicionais usam o ícone nativo disponível ou um símbolo neutro.

As duas artes PS5 continuam sendo os arquivos fornecidos pelo proprietário. O fundo usa recorte proporcional `cover`; logos usam `contain`, sem esticamento. Nada aqui representa histórico de episódios, capa privada ou sessão autenticada.
