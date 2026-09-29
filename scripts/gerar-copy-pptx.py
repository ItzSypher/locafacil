#!/usr/bin/env python3
"""
Gera os PPTX de revisão de copy do site (um por deck do inventário).

    python scripts/gerar-copy-pptx.py            # gera os 3 e copia para ../entregas/2026-09-29
    python scripts/gerar-copy-pptx.py --sem-entrega

Entradas:
  - src/content/copy/inventario.json   decks -> dobras -> textos
  - public/doc/copy/capturas.json      imagens de cada dobra (desktop/celular)
  - src/assets/brand/*.svg             logo, rasterizado com o Chrome headless

Quem edita é o cliente (leigo), no PowerPoint ou importando no Canva. Depois
lemos o arquivo devolvido com scripts/ler-copy-pptx.py. Por isso:
  - cada caixa editável tem nome fixo: copy:<idDoTexto>, obs:<idDaDobra>, livre;
  - as notas de cada lâmina repetem "<n> | <idDoTexto> | <texto original>" para
    casar mesmo que o Canva perca os nomes das formas;
  - formas que não são para editar levam nome "fixo:...".

Dependências: python-pptx e Pillow (pip install python-pptx pillow).
"""

import argparse
import functools
import io
import json
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

from PIL import Image, ImageFont
from pptx import Presentation
from pptx.dml.color import RGBColor
from pptx.enum.shapes import MSO_CONNECTOR, MSO_SHAPE
from pptx.enum.text import MSO_ANCHOR, MSO_AUTO_SIZE, PP_ALIGN
from pptx.opc.constants import RELATIONSHIP_TYPE as RT
from pptx.oxml.ns import qn
from pptx.util import Emu, Inches, Pt

# ---------------------------------------------------------------------------
# Caminhos
# ---------------------------------------------------------------------------
RAIZ = Path(__file__).resolve().parent.parent
INVENTARIO = RAIZ / "src" / "content" / "copy" / "inventario.json"
PASTA_SAIDA = RAIZ / "public" / "doc" / "copy"
CAPTURAS = PASTA_SAIDA / "capturas.json"
LOGO_LOCKUP = RAIZ / "src" / "assets" / "brand" / "logo-lockup-pingo.svg"
LOGO_SIMBOLO = RAIZ / "src" / "assets" / "brand" / "symbol-pingo.svg"
PASTA_ENTREGA = RAIZ.parent / "entregas" / "2026-09-29"

PRAZO = "Até sexta-feira, 02/10"
SITE = "https://locafacil-nine.vercel.app"
LINK_DOC = SITE + "/doc/copy"

# ---------------------------------------------------------------------------
# Identidade visual
# ---------------------------------------------------------------------------
NAVY = "0A1628"
AZUL = "0628DA"
TEXTO = "424245"
CINZA = "939598"
VERDE = "2AE82A"  # só acento pontual, nunca cor de texto
BORDA = "D0D5DD"
BRANCO = "FFFFFF"
FUNDO = "F5F7FA"        # fundo das lâminas de conteúdo
PAINEL = "E9EDF3"       # moldura da imagem de referência
NAVY_CLARO = "B9C3D6"   # texto secundário sobre navy
FONTE = "Arial"

# Lâmina 16:9 em polegadas
LARG = 13.333
ALT = 7.5
MARGEM = 0.4

# Faixa do cabeçalho
FAIXA_H = 0.95

# Coluna da imagem (esquerda, ~45%)
IMG_X, IMG_Y, IMG_W, IMG_H = MARGEM, 1.15, 5.6, 4.65
LEGENDA_Y = IMG_Y + IMG_H + 0.05

# Coluna dos textos (direita)
COL_X = 6.35
COL_W = LARG - MARGEM - COL_X
AREA_TOPO = 1.15
AREA_FIM = 6.12
GAP_COLUNAS = 0.2        # entre as duas caixas de uma linha dividida
MEIA_W = (COL_W - GAP_COLUNAS) / 2

# Rodapé "Observações desta parte"
OBS_TITULO_Y = 6.2
OBS_Y = 6.47
OBS_H = 0.68

# Tipografia (pt) e métricas usadas na estimativa de linhas
PT_CAIXA = 13
PT_ROTULO = 10
ALTURA_LINHA = 1.2       # altura de linha / corpo da fonte (Arial simples ~1,15; folga)
INSET_X = 0.1
INSET_Y = 0.06
GAP_ROTULO = 0.04        # do rótulo até a caixa
GAP_LINHAS = 0.13        # entre um texto e o próximo
FOLGA_LARGURA = 1.04     # margem de segurança na largura medida

TIPOS = {
    "titulo": "TÍTULO",
    "subtitulo": "SUBTÍTULO",
    "paragrafo": "PARÁGRAFO",
    "botao": "BOTÃO",
    "link": "LINK",
    "rotulo": "RÓTULO",
    "legenda": "LEGENDA",
    "aviso": "AVISO",
    "mensagem-whatsapp": "MENSAGEM DE WHATSAPP",
    "opcao": "OPÇÃO",
    "campo": "EXEMPLO DENTRO DO CAMPO",
    "item": "ITEM",
    "selo": "SELO",
    "seo": "GOOGLE",
}


def cor(hexa):
    return RGBColor.from_string(hexa)


# ---------------------------------------------------------------------------
# Medida de texto (Arial real via Pillow) para estimar quebras de linha
# ---------------------------------------------------------------------------
def _carregar_fonte(nome):
    for pasta in (Path("C:/Windows/Fonts"), Path("/usr/share/fonts/truetype/msttcorefonts"),
                  Path("/Library/Fonts")):
        arq = pasta / nome
        if arq.exists():
            return ImageFont.truetype(str(arq), 100)
    return None


_FONTE_REG = _carregar_fonte("arial.ttf")
_FONTE_NEG = _carregar_fonte("arialbd.ttf") or _FONTE_REG


def largura_pt(texto, pt, negrito=False):
    """Largura do texto em pontos, na fonte Arial do tamanho pedido."""
    fonte = _FONTE_NEG if negrito else _FONTE_REG
    if fonte is None:  # sem Arial instalada: estimativa grosseira
        return len(texto) * pt * (0.58 if negrito else 0.54)
    return fonte.getlength(texto) * pt / 100 * FOLGA_LARGURA


def linhas_de(tokens, pt, largura_in):
    """Quantas linhas um parágrafo ocupa. tokens = [(palavra, negrito), ...]."""
    limite = largura_in * 72
    linhas, atual = 1, 0.0
    for palavra, negrito in tokens:
        w = largura_pt(palavra, pt, negrito)
        espaco = largura_pt(" ", pt, negrito)
        if atual == 0:
            atual = w
        elif atual + espaco + w <= limite:
            atual += espaco + w
        else:
            linhas += 1
            atual = w
        while atual > limite:  # palavra maior que a linha
            linhas += 1
            atual -= limite
    return linhas


def contar_linhas(texto, pt, largura_in, negrito=False):
    total = 0
    for par in texto.split("\n"):
        total += linhas_de([(p, negrito) for p in par.split(" ")], pt, largura_in)
    return total


def altura_linhas(n, pt):
    return n * pt * ALTURA_LINHA / 72


# ---------------------------------------------------------------------------
# Logo: rasteriza o SVG com o Chrome headless (fundo transparente)
# ---------------------------------------------------------------------------
CHROMES = [
    r"C:\Program Files\Google\Chrome\Application\chrome.exe",
    r"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe",
    r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
    "/usr/bin/google-chrome",
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
]


def rasterizar_svg(svg_path, largura_px, pasta_tmp):
    """Devolve bytes PNG do SVG, ou None se não houver Chrome."""
    chrome = next((c for c in CHROMES if Path(c).exists()), None)
    if not chrome:
        return None
    svg = svg_path.read_text(encoding="utf-8")
    # proporção pelo viewBox
    import re
    vb = re.search(r'viewBox="([\d.\s-]+)"', svg)
    _, _, vw, vh = (float(x) for x in vb.group(1).split())
    altura_px = round(largura_px * vh / vw)
    html = pasta_tmp / (svg_path.stem + ".html")
    html.write_text(
        "<!doctype html><html><head><style>html,body{margin:0;padding:0;background:transparent}"
        f"svg{{display:block;width:{largura_px}px;height:{altura_px}px}}</style></head>"
        f"<body>{svg}</body></html>",
        encoding="utf-8",
    )
    saida = pasta_tmp / (svg_path.stem + ".png")
    # Perfil próprio: não briga com outro Chrome aberto (ex.: o das capturas).
    # Sem --remote-debugging-port: com ele o Chrome não fecha depois do --screenshot.
    perfil = tempfile.mkdtemp(prefix="copy-pptx-chrome-")
    try:
        subprocess.run(
            [chrome, "--headless=new", "--disable-gpu", "--hide-scrollbars", "--no-first-run",
             "--disable-extensions", f"--user-data-dir={perfil}",
             "--default-background-color=00000000", f"--window-size={largura_px},{altura_px}",
             f"--screenshot={saida}", html.as_uri()],
            capture_output=True, timeout=90, check=False,
        )
    except subprocess.TimeoutExpired:
        pass
    finally:
        shutil.rmtree(perfil, ignore_errors=True)
    if not saida.exists():
        return None
    return saida.read_bytes()


# ---------------------------------------------------------------------------
# Imagens das capturas (reduzidas para caber no e-mail)
# ---------------------------------------------------------------------------
_cache_imagens = {}


def imagem_reduzida(caminho, lado_max=1400, qualidade=75):
    """JPEG com o lado maior <= lado_max. Devolve (bytes, largura, altura)."""
    chave = str(caminho)
    if chave not in _cache_imagens:
        im = Image.open(caminho)
        im = im.convert("RGB")
        escala = min(1.0, lado_max / max(im.size))
        if escala < 1:
            im = im.resize((round(im.width * escala), round(im.height * escala)), Image.LANCZOS)
        buf = io.BytesIO()
        im.save(buf, "JPEG", quality=qualidade, optimize=True, progressive=False)
        _cache_imagens[chave] = (buf.getvalue(), im.width, im.height)
    return _cache_imagens[chave]


def carregar_capturas():
    if not CAPTURAS.exists():
        return {}
    return json.loads(CAPTURAS.read_text(encoding="utf-8"))


def caminho_publico(rel):
    """'/doc/copy/x.jpg' -> public/doc/copy/x.jpg"""
    if not rel:
        return None
    arq = RAIZ / "public" / rel.lstrip("/")
    return arq if arq.exists() else None


# ---------------------------------------------------------------------------
# Ajudantes de desenho
# ---------------------------------------------------------------------------
def fundo(slide, hexa):
    slide.background.fill.solid()
    slide.background.fill.fore_color.rgb = cor(hexa)


def retangulo(slide, x, y, w, h, preenchimento=None, borda=None, espessura=1.0,
              forma=MSO_SHAPE.RECTANGLE, nome=None, raio=None):
    shp = slide.shapes.add_shape(forma, Inches(x), Inches(y), Inches(w), Inches(h))
    if preenchimento:
        shp.fill.solid()
        shp.fill.fore_color.rgb = cor(preenchimento)
    else:
        shp.fill.background()
    if borda:
        shp.line.color.rgb = cor(borda)
        shp.line.width = Pt(espessura)
    else:
        shp.line.fill.background()
    if raio is not None and forma == MSO_SHAPE.ROUNDED_RECTANGLE:
        shp.adjustments[0] = raio
    shp.shadow.inherit = False
    if nome:
        shp.name = nome
    # forma sem texto: evita que o PowerPoint mostre texto padrão
    return shp


def _fmt_run(run, tam, cor_hex, negrito=False, italico=False):
    f = run.font
    f.name = FONTE
    f.size = Pt(tam)
    f.bold = negrito
    f.italic = italico
    f.color.rgb = cor(cor_hex)


def _end_para(par, tam, cor_hex):
    """Propriedades do fim do parágrafo: se o cliente apagar tudo e digitar,
    o texto novo continua em Arial no mesmo tamanho."""
    end = par._p.get_or_add_endParaRPr()
    end.set("lang", "pt-BR")
    end.set("sz", str(int(tam * 100)))
    for filho in list(end):
        end.remove(filho)
    solid = end.makeelement(qn("a:solidFill"), {})
    srgb = solid.makeelement(qn("a:srgbClr"), {"val": cor_hex})
    solid.append(srgb)
    end.append(solid)
    latin = end.makeelement(qn("a:latin"), {"typeface": FONTE})
    end.append(latin)


def texto(slide, x, y, w, h, paragrafos, tam=12, cor_hex=TEXTO, negrito=False,
          alinhamento=PP_ALIGN.LEFT, ancora=MSO_ANCHOR.TOP, nome=None, margem=0.0,
          preenchimento=None, borda=None, espessura=1.0, espaco_depois=0):
    """Caixa de texto. `paragrafos` pode ser str (\\n = novo parágrafo) ou lista de
    parágrafos, cada um uma lista de runs (texto, {tam, cor, negrito, italico, link})."""
    tb = slide.shapes.add_textbox(Inches(x), Inches(y), Inches(w), Inches(h))
    tf = tb.text_frame
    tf.word_wrap = True
    tf.auto_size = MSO_AUTO_SIZE.NONE
    tf.margin_left = tf.margin_right = Inches(margem)
    tf.margin_top = tf.margin_bottom = Inches(margem if margem < 0.08 else 0.06)
    tf.vertical_anchor = ancora
    if preenchimento:
        tb.fill.solid()
        tb.fill.fore_color.rgb = cor(preenchimento)
    if borda:
        tb.line.color.rgb = cor(borda)
        tb.line.width = Pt(espessura)
    if isinstance(paragrafos, str):
        paragrafos = [[(linha, {})] for linha in paragrafos.split("\n")]
    for i, runs in enumerate(paragrafos):
        par = tf.paragraphs[0] if i == 0 else tf.add_paragraph()
        par.alignment = alinhamento
        if espaco_depois and i < len(paragrafos) - 1:
            par.space_after = Pt(espaco_depois)
        for conteudo, opc in runs:
            r = par.add_run()
            r.text = conteudo
            _fmt_run(r, opc.get("tam", tam), opc.get("cor", cor_hex),
                     opc.get("negrito", negrito), opc.get("italico", False))
            if opc.get("link"):
                r.hyperlink.address = opc["link"]
        _end_para(par, tam, cor_hex)
    if nome:
        tb.name = nome
    return tb


def caixa_editavel(slide, x, y, w, h, conteudo, nome, tam=PT_CAIXA):
    """Caixa branca com borda cinza-clara, texto atual editável."""
    tb = texto(slide, x, y, w, h, conteudo or "", tam=tam, cor_hex=NAVY, nome=nome,
               margem=INSET_X, preenchimento=BRANCO, borda=BORDA, espessura=1.25)
    tf = tb.text_frame
    tf.margin_top = tf.margin_bottom = Inches(INSET_Y)
    # Se o cliente escrever mais do que cabe, o PowerPoint reduz a fonte em vez
    # de vazar por cima da caixa de baixo.
    tf.auto_size = MSO_AUTO_SIZE.TEXT_TO_FIT_SHAPE
    return tb


def imagem(slide, dados, x, y, w, h, nome=None, borda=None):
    pic = slide.shapes.add_picture(io.BytesIO(dados), Inches(x), Inches(y), Inches(w), Inches(h))
    if borda:
        pic.line.color.rgb = cor(borda)
        pic.line.width = Pt(0.75)
    if nome:
        pic.name = nome
    return pic


def encaixar(larg_px, alt_px, x, y, w, h):
    """Encaixa (contain) sem distorcer, centralizado. Devolve x, y, w, h."""
    escala = min(w / larg_px, h / alt_px)
    nw, nh = larg_px * escala, alt_px * escala
    return x + (w - nw) / 2, y + (h - nh) / 2, nw, nh


def linha(slide, x1, y1, x2, y2, hexa, espessura):
    ln = slide.shapes.add_connector(MSO_CONNECTOR.STRAIGHT, Inches(x1), Inches(y1),
                                    Inches(x2), Inches(y2))
    ln.line.color.rgb = cor(hexa)
    ln.line.width = Pt(espessura)
    ln.name = "fixo:desenho"
    return ln


def selo_numero(slide, x, y, n, d=0.26):
    """Bolinha azul com o número do texto (usada nas representações)."""
    c = retangulo(slide, x, y, d, d, preenchimento=AZUL, forma=MSO_SHAPE.OVAL, nome="fixo:selo")
    tf = c.text_frame
    tf.margin_left = tf.margin_right = tf.margin_top = tf.margin_bottom = 0
    tf.vertical_anchor = MSO_ANCHOR.MIDDLE
    tf.word_wrap = False
    par = tf.paragraphs[0]
    par.alignment = PP_ALIGN.CENTER
    r = par.add_run()
    r.text = str(n)
    _fmt_run(r, 10, BRANCO, negrito=True)
    return c


def notas(slide, texto_notas):
    slide.notes_slide.notes_text_frame.text = texto_notas


# ---------------------------------------------------------------------------
# Presentation base
# ---------------------------------------------------------------------------
def nova_apresentacao():
    prs = Presentation()
    prs.slide_width = Inches(LARG)
    prs.slide_height = Inches(ALT)
    # Fonte do tema em Arial: qualquer caixa nova que o cliente criar sai em Arial.
    tema = prs.slide_master.part.part_related_by(RT.THEME)
    blob = tema.blob.decode("utf-8")
    import re
    blob = re.sub(r'(<a:latin typeface=")[^"]*(")', r"\1Arial\2", blob)
    tema._blob = blob.encode("utf-8")
    # Idioma padrão pt-BR (corretor ortográfico do PowerPoint)
    return prs


def lamina_vazia(prs):
    return prs.slides.add_slide(prs.slide_layouts[6])


def cabecalho(slide, titulo, sub, logo_png, tam_titulo=20):
    """Faixa navy no topo: título, linha de apoio e logo à direita."""
    retangulo(slide, 0, 0, LARG, FAIXA_H, preenchimento=NAVY, nome="fixo:faixa")
    logo_h = 0.36
    logo_w = 0
    if logo_png:
        dados, lw, lh = logo_png
        logo_w = logo_h * lw / lh
        imagem(slide, dados, LARG - MARGEM - logo_w, (FAIXA_H - logo_h) / 2, logo_w, logo_h,
               nome="fixo:logo")
    larg_titulo = LARG - 2 * MARGEM - logo_w - 0.4
    # reduz o título (até 16 pt) para caber numa linha
    while tam_titulo > 16 and largura_pt(titulo, tam_titulo, True) > larg_titulo * 72:
        tam_titulo -= 1
    y_titulo = 0.13 if sub else (FAIXA_H - 0.5) / 2
    texto(slide, MARGEM, y_titulo, larg_titulo, 0.42, titulo, tam=tam_titulo, cor_hex=BRANCO,
          negrito=True, ancora=MSO_ANCHOR.MIDDLE, nome="fixo:titulo")
    if sub:
        texto(slide, MARGEM, 0.56, larg_titulo, 0.28, sub, tam=12, cor_hex=NAVY_CLARO,
              ancora=MSO_ANCHOR.MIDDLE, nome="fixo:subtitulo")


# ---------------------------------------------------------------------------
# Lâminas fixas
# ---------------------------------------------------------------------------
def lamina_capa(prs, deck, total_decks, logos):
    s = lamina_vazia(prs)
    fundo(s, NAVY)
    lockup, simbolo = logos
    if lockup:
        dados, lw, lh = lockup
        h = 0.62
        imagem(s, dados, 0.8, 0.75, h * lw / lh, h, nome="fixo:logo")
    else:
        texto(s, 0.8, 0.75, 4, 0.6, "Locafacil", tam=32, cor_hex=BRANCO, negrito=True)
    if simbolo:
        dados, lw, lh = simbolo
        h = 4.6
        imagem(s, dados, LARG - 0.9 - h * lw / lh, 1.45, h * lw / lh, h, nome="fixo:simbolo")

    # pingo verde como marcador
    retangulo(s, 0.8, 2.47, 0.14, 0.14, preenchimento=VERDE, nome="fixo:pingo")
    texto(s, 1.04, 2.34, 6, 0.4, f"Arquivo {deck['numero']} de {total_decks}", tam=14,
          cor_hex=NAVY_CLARO, ancora=MSO_ANCHOR.MIDDLE, nome="fixo:arquivo")
    texto(s, 0.8, 2.8, 8.2, 0.85, "Revisão de textos do site", tam=44, cor_hex=BRANCO,
          negrito=True, ancora=MSO_ANCHOR.MIDDLE, nome="fixo:titulo")
    texto(s, 0.8, 3.7, 8.2, 0.6, f"{deck['numero']} · {deck['titulo']}", tam=26,
          cor_hex="D6DCE8", ancora=MSO_ANCHOR.MIDDLE, nome="fixo:deck")

    w_prazo = largura_pt(PRAZO, 16, True) / 72 + 0.6
    pill = retangulo(s, 0.8, 4.65, w_prazo, 0.52, preenchimento=AZUL,
                     forma=MSO_SHAPE.ROUNDED_RECTANGLE, raio=0.5, nome="fixo:prazo")
    tf = pill.text_frame
    tf.margin_left = tf.margin_right = Inches(0.1)
    tf.vertical_anchor = MSO_ANCHOR.MIDDLE
    tf.word_wrap = False
    par = tf.paragraphs[0]
    par.alignment = PP_ALIGN.CENTER
    r = par.add_run()
    r.text = PRAZO
    _fmt_run(r, 16, BRANCO, negrito=True)

    n_partes = len(deck["dobras"])
    texto(s, 0.8, 6.45, 9, 0.4,
          f"{n_partes} partes da página para revisar · leia a próxima lâmina antes de começar",
          tam=12, cor_hex=NAVY_CLARO, ancora=MSO_ANCHOR.MIDDLE, nome="fixo:rodape")
    notas(s, "capa")
    return s


def _icone_circulo(slide, x, y, d, conteudo=None, tam=16, preenchimento=AZUL):
    c = retangulo(slide, x, y, d, d, preenchimento=preenchimento, forma=MSO_SHAPE.OVAL,
                  nome="fixo:icone")
    if conteudo:
        tf = c.text_frame
        tf.margin_left = tf.margin_right = tf.margin_top = tf.margin_bottom = 0
        tf.vertical_anchor = MSO_ANCHOR.MIDDLE
        tf.word_wrap = False
        par = tf.paragraphs[0]
        par.alignment = PP_ALIGN.CENTER
        r = par.add_run()
        r.text = conteudo
        _fmt_run(r, tam, BRANCO, negrito=True)
    return c


def lamina_como_editar(prs, logos):
    s = lamina_vazia(prs)
    fundo(s, FUNDO)
    cabecalho(s, "Como editar", "Leva um minuto: leia antes de começar", logos[0], tam_titulo=24)

    # --- A. Miniatura de uma lâmina + explicação --------------------------
    mx, my, mw, mh = MARGEM, 1.2, 3.4, 1.95
    retangulo(s, mx, my, mw, mh, preenchimento=BRANCO, borda=BORDA, nome="fixo:mini")
    retangulo(s, mx, my, mw, 0.2, preenchimento=NAVY, nome="fixo:mini")
    ph = retangulo(s, mx + 0.1, my + 0.3, 1.4, 1.1, preenchimento=PAINEL, nome="fixo:mini")
    tf = ph.text_frame
    tf.vertical_anchor = MSO_ANCHOR.MIDDLE
    par = tf.paragraphs[0]
    par.alignment = PP_ALIGN.CENTER
    r = par.add_run()
    r.text = "imagem da página"
    _fmt_run(r, 10, TEXTO)
    cx, cw = mx + 1.62, mw - 1.72
    for i, (rot, val) in enumerate([("1 · TÍTULO", "Texto atual"), ("2 · BOTÃO", "Texto atual")]):
        yy = my + 0.28 + i * 0.56
        texto(s, cx, yy, cw, 0.18, [[(rot[0], {"cor": AZUL, "negrito": True}),
                                     (rot[1:], {"cor": CINZA, "negrito": True})]],
              tam=10, nome="fixo:mini")
        texto(s, cx, yy + 0.19, cw, 0.3, val, tam=10, cor_hex=NAVY, margem=0.05,
              preenchimento=BRANCO, borda=BORDA, ancora=MSO_ANCHOR.MIDDLE, nome="fixo:mini")
    texto(s, mx + 0.1, my + 1.47, mw - 0.2, 0.18, "Observações desta parte", tam=10,
          cor_hex=NAVY, negrito=True, nome="fixo:mini")
    retangulo(s, mx + 0.1, my + 1.67, mw - 0.2, 0.2, preenchimento=BRANCO, borda=BORDA,
              nome="fixo:mini")

    tx = mx + mw + 0.4
    tw = LARG - MARGEM - tx
    texto(s, tx, 1.2, tw, 0.4, "Cada lâmina mostra uma parte da página", tam=18,
          cor_hex=NAVY, negrito=True, nome="fixo:texto")
    texto(s, tx, 1.66, tw, 0.9,
          [[("À esquerda, a imagem de como está hoje no site (só para referência). "
             "À direita, os textos atuais em ", {}),
            ("caixas brancas numeradas", {"negrito": True, "cor": NAVY}),
            (": é nelas que você mexe.", {})]],
          tam=14, nome="fixo:texto")
    texto(s, tx, 2.42, tw, 0.6,
          [[("Trechos entre chaves, como ", {}), ("{data}", {"negrito": True, "cor": NAVY}),
            (" ou ", {}), ("{valor}", {"negrito": True, "cor": NAVY}),
            (", o site preenche sozinho: deixe as chaves como estão.", {})]],
          tam=13, nome="fixo:texto")

    # --- B. Três ações ------------------------------------------------------
    by, bh = 3.35, 1.72
    cw3 = (LARG - 2 * MARGEM - 2 * 0.2) / 3
    acoes = [
        ("TROCAR", "Clique na caixa e digite o texto novo por cima.",
         "Alugue sem caução em Nova Iguaçu", "Aa"),
        ("TIRAR", "Apague o texto da caixa e escreva TIRAR.", "TIRAR", "×"),
        ("MANTER", "Não mexa na caixa. O texto fica como está.", "Sua Liberdade Sobre Rodas.", None),
    ]
    for i, (verbo, instr, exemplo, glifo) in enumerate(acoes):
        x = MARGEM + i * (cw3 + 0.2)
        retangulo(s, x, by, cw3, bh, preenchimento=BRANCO, borda=BORDA,
                  forma=MSO_SHAPE.ROUNDED_RECTANGLE, raio=0.06, nome="fixo:cartao")
        d = 0.52
        _icone_circulo(s, x + 0.2, by + 0.2, d, glifo, tam=18 if glifo == "Aa" else 24)
        if glifo is None:  # visto desenhado com duas linhas
            linha(s, x + 0.2 + 0.14, by + 0.2 + 0.27, x + 0.2 + 0.23, by + 0.2 + 0.36, BRANCO, 3)
            linha(s, x + 0.2 + 0.23, by + 0.2 + 0.36, x + 0.2 + 0.39, by + 0.2 + 0.16, BRANCO, 3)
        texto(s, x + 0.86, by + 0.17, cw3 - 1.0, 0.32, verbo, tam=16, cor_hex=NAVY,
              negrito=True, ancora=MSO_ANCHOR.MIDDLE, nome="fixo:texto")
        texto(s, x + 0.86, by + 0.5, cw3 - 1.0, 0.5, instr, tam=12, cor_hex=TEXTO,
              nome="fixo:texto")
        texto(s, x + 0.2, by + 1.14, cw3 - 0.4, 0.4, exemplo, tam=12, cor_hex=NAVY,
              negrito=(verbo == "TIRAR"), margem=0.1, preenchimento=BRANCO, borda=BORDA,
              espessura=1.25, ancora=MSO_ANCHOR.MIDDLE, nome="fixo:exemplo")

    # --- C. Outros pedidos, cuidado e onde abrir ---------------------------
    cy, ch = 5.24, 1.94
    blocos = [
        ("Outros pedidos", [[("Use a caixa ", {}), ("Observações desta parte", {"negrito": True, "cor": NAVY}),
                             (", no pé de cada lâmina, para mudar a ordem, trocar imagem ou dar uma "
                              "ideia nova. A última lâmina é um espaço livre.", {})]]),
        ("Importante", [[("Não apague nem mova as caixas numeradas", {"negrito": True, "cor": NAVY}),
                         (": é por elas que sabemos qual texto você mudou.", {})]]),
        ("Onde abrir", [
            [("PowerPoint: ", {"negrito": True, "cor": NAVY}), ("abra e edite.", {})],
            [("Canva: ", {"negrito": True, "cor": NAVY}),
             ("Criar design → Importar arquivo → este .pptx. No fim: Compartilhar → Baixar → PPTX.", {})],
            [("Navegador: ", {"negrito": True, "cor": NAVY}),
             (LINK_DOC.replace("https://", ""), {"link": LINK_DOC, "cor": AZUL}),
             (" (salva sozinho)", {})],
        ]),
    ]
    for i, (titulo, corpo) in enumerate(blocos):
        x = MARGEM + i * (cw3 + 0.2)
        retangulo(s, x, cy, cw3, ch, preenchimento=BRANCO, borda=BORDA,
                  forma=MSO_SHAPE.ROUNDED_RECTANGLE, raio=0.06, nome="fixo:cartao")
        if i == 0:
            _icone_circulo(s, x + 0.2, cy + 0.18, 0.4, "+", tam=18, preenchimento=NAVY)
        elif i == 1:
            _icone_circulo(s, x + 0.2, cy + 0.18, 0.4, "!", tam=18, preenchimento=NAVY)
        else:
            ic = retangulo(s, x + 0.2, cy + 0.18, 0.48, 0.4, preenchimento=NAVY,
                           forma=MSO_SHAPE.ROUNDED_RECTANGLE, raio=0.15, nome="fixo:icone")
            tf = ic.text_frame
            tf.margin_left = tf.margin_right = tf.margin_top = tf.margin_bottom = 0
            tf.vertical_anchor = MSO_ANCHOR.MIDDLE
            tf.word_wrap = False
            p = tf.paragraphs[0]
            p.alignment = PP_ALIGN.CENTER
            r = p.add_run()
            r.text = "PPTX"
            _fmt_run(r, 10, BRANCO, negrito=True)
        texto(s, x + 0.8, cy + 0.18, cw3 - 1.0, 0.4, titulo, tam=15, cor_hex=NAVY, negrito=True,
              ancora=MSO_ANCHOR.MIDDLE, nome="fixo:texto")
        texto(s, x + 0.2, cy + 0.68, cw3 - 0.4, ch - 0.78, corpo, tam=12, cor_hex=TEXTO,
              espaco_depois=4, nome="fixo:texto")
    notas(s, "como-editar")
    return s


def lamina_livre(prs, logos):
    s = lamina_vazia(prs)
    fundo(s, FUNDO)
    cabecalho(s, "Espaço livre", "Última lâmina", logos[0], tam_titulo=24)
    texto(s, MARGEM, 1.15, LARG - 2 * MARGEM, 0.5,
          "Escreva qualquer pedido que não coube nas lâminas: texto novo, seção nova, "
          "referência. Pode colar imagens aqui.", tam=14, cor_hex=TEXTO,
          ancora=MSO_ANCHOR.MIDDLE, nome="fixo:texto")
    caixa = caixa_editavel(s, MARGEM, 1.8, LARG - 2 * MARGEM, 7.1 - 1.8, "", "livre", tam=14)
    caixa.text_frame.auto_size = MSO_AUTO_SIZE.NONE
    notas(s, "livre")
    return s


# ---------------------------------------------------------------------------
# Lâminas de dobra
# ---------------------------------------------------------------------------
def tokens_rotulo(n, t):
    tipo = TIPOS.get(t["tipo"], t["tipo"].upper())
    tokens = [(str(n), True), ("·", True)] + [(p, True) for p in tipo.split(" ")]
    if t.get("obs"):
        tokens += [(p, False) for p in t["obs"].split(" ")]
    return tokens


def medir(n, t, largura):
    """Altura do rótulo e da caixa de um texto numa coluna de `largura` pol."""
    l_rot = linhas_de(tokens_rotulo(n, t), PT_ROTULO, largura)
    l_txt = contar_linhas(t["texto"], PT_CAIXA, largura - 2 * INSET_X)
    h_rot = altura_linhas(l_rot, PT_ROTULO)
    h_box = 2 * INSET_Y + altura_linhas(l_txt + 1, PT_CAIXA)  # + uma linha de folga
    return {"l_rot": l_rot, "l_txt": l_txt, "h_rot": h_rot, "h_box": h_box}


def montar_linhas(textos):
    """Agrupa os textos em linhas de layout: textos curtos vizinhos dividem a linha
    em duas colunas; o resto ocupa a largura toda. Devolve lista de linhas."""
    itens = [(i + 1, t) for i, t in enumerate(textos)]

    def cabe_meia(n, t):
        if "\n" in t["texto"]:
            return False
        m = medir(n, t, MEIA_W)
        return m["l_txt"] == 1 and m["l_rot"] <= 2

    linhas = []
    i = 0
    while i < len(itens):
        n, t = itens[i]
        if i + 1 < len(itens) and cabe_meia(n, t) and cabe_meia(*itens[i + 1]):
            a, b = medir(n, t, MEIA_W), medir(*itens[i + 1], MEIA_W)
            h_rot = max(a["h_rot"], b["h_rot"])
            h_box = max(a["h_box"], b["h_box"])
            linhas.append({"itens": [itens[i], itens[i + 1]], "h_rot": h_rot, "h_box": h_box})
            i += 2
        else:
            m = medir(n, t, COL_W)
            linhas.append({"itens": [itens[i]], "h_rot": m["h_rot"], "h_box": m["h_box"]})
            i += 1
    for ln in linhas:
        ln["h"] = ln["h_rot"] + GAP_ROTULO + ln["h_box"]
    return linhas


def particionar(alturas, capacidade, gap):
    """Divide as linhas no menor número de lâminas e, com esse número, equilibra
    a altura entre elas (evita uma continuação com um texto só)."""
    n = len(alturas)

    def soma(i, j):
        return sum(alturas[i:j]) + gap * (j - i - 1)

    k, acc = 1, 0.0
    for h in alturas:
        if acc and acc + gap + h > capacidade:
            k += 1
            acc = h
        else:
            acc = h if not acc else acc + gap + h
    if k == 1:
        return [(0, n)]

    # Com k lâminas, minimiza a soma dos quadrados das alturas: as lâminas
    # ficam parecidas entre si (nenhuma continuação com um texto só).
    @functools.lru_cache(maxsize=None)
    def melhor(i, partes):
        if partes == 1:
            s = soma(i, n)
            return (s * s, (n,)) if s <= capacidade else (float("inf"), (n,))
        best = (float("inf"), ())
        for j in range(i + 1, n - partes + 2):
            s = soma(i, j)
            if s > capacidade:
                break
            custo, resto = melhor(j, partes - 1)
            if s * s + custo < best[0]:
                best = (s * s + custo, (j,) + resto)
        return best

    _, cortes = melhor(0, k)
    faixas, ini = [], 0
    for c in cortes:
        faixas.append((ini, c))
        ini = c
    return faixas


def desenhar_referencia(s, dobra, capturas_dobra, logos, itens_lamina, todos):
    """Coluna da esquerda: captura da página ou representação desenhada.
    capturas_dobra = {"desktop": (bytes, larg, alt) | None, "celular": ...}"""
    retangulo(s, IMG_X, IMG_Y, IMG_W, IMG_H, preenchimento=PAINEL, nome="fixo:painel")
    desk, cel = capturas_dobra.get("desktop"), capturas_dobra.get("celular")
    pad = 0.15
    ax, ay, aw, ah = IMG_X + pad, IMG_Y + pad, IMG_W - 2 * pad, IMG_H - 2 * pad
    if all(t["tipo"] == "seo" for t in dobra["textos"]):
        desenhar_google(s, dobra, logos)
        legenda = "Representação (não é captura): como o site aparece no Google e ao compartilhar."
    elif dobra.get("seletor") is None and any(t["tipo"] == "mensagem-whatsapp" for t in dobra["textos"]):
        desenhar_whatsapp(s, dobra, itens_lamina, todos, logos)
        legenda = "Representação (não é captura): a frase já chega escrita no WhatsApp da loja."
    elif capturas_dobra.get("extras") and (desk or cel):
        # vários estados da mesma parte: grade com legenda curta em cada imagem
        itens = [("como abre", desk or cel)] + [
            (ESTADOS.get(e, e), img) for e, img in capturas_dobra["extras"]]
        desenhar_grade(s, itens, ax, ay, aw, ah)
        onde = "no computador" if desk else "no celular"
        legenda = f"Como está hoje {onde}, em {len(itens)} situações. Só para referência."
    elif desk and cel and desk[1] / desk[2] >= 3:
        # faixa muito larga e baixa (ex.: menu): computador em cima, celular embaixo
        dados, lw, lh = desk
        h_desk = aw * lh / lw
        imagem(s, dados, ax, ay, aw, h_desk, nome="fixo:captura", borda=BORDA)
        dados, lw, lh = cel
        y2 = ay + h_desk + 0.2
        x, y, w, h = encaixar(lw, lh, ax, y2, aw, ay + ah - y2)
        imagem(s, dados, x, y, w, h, nome="fixo:captura", borda=BORDA)
        legenda = ("Como está hoje: em cima no computador, embaixo no celular. "
                   "Só para referência.")
    elif desk or cel:
        dados, lw, lh = desk or cel
        x, y, w, h = encaixar(lw, lh, ax, ay, aw, ah)
        imagem(s, dados, x, y, w, h, nome="fixo:captura", borda=BORDA)
        onde = "no computador" if desk else "no celular"
        legenda = f"Como está hoje {onde}. Só para referência: os textos editáveis estão à direita."
    else:
        texto(s, IMG_X, IMG_Y, IMG_W, IMG_H, "Imagem desta parte ainda não disponível",
              tam=12, cor_hex=TEXTO, alinhamento=PP_ALIGN.CENTER, ancora=MSO_ANCHOR.MIDDLE,
              nome="fixo:sem-imagem")
        legenda = "Os textos editáveis estão à direita."
    texto(s, IMG_X, LEGENDA_Y, IMG_W, 0.2, legenda, tam=10, cor_hex=TEXTO, nome="fixo:legenda")


ESTADOS = {
    "balao": "balão que aparece sozinho",
    "expirado": "cotação expirada",
    "vazio": "nenhum veículo no período",
    "filtros": "filtros sem resultado",
}


def desenhar_grade(s, itens, ax, ay, aw, ah):
    """Várias capturas lado a lado, cada uma com um rótulo pequeno embaixo."""
    gap, rot_h = 0.15, 0.22
    n = len(itens)
    melhor = None
    for cols in range(1, n + 1):
        linhas = -(-n // cols)
        cw = (aw - gap * (cols - 1)) / cols
        ch = (ah - gap * (linhas - 1)) / linhas - rot_h
        if ch <= 0.3:
            continue
        # menor escala entre as imagens: queremos a maior possível
        escala = min(min(cw / img[1], ch / img[2]) for _, img in itens)
        if melhor is None or escala > melhor[0]:
            melhor = (escala, cols, linhas, cw, ch)
    _, cols, linhas, cw, ch = melhor
    for i, (rotulo, (dados, lw, lh)) in enumerate(itens):
        c, l = i % cols, i // cols
        cx = ax + c * (cw + gap)
        cy = ay + l * (ch + rot_h + gap)
        x, y, w, h = encaixar(lw, lh, cx, cy, cw, ch)
        imagem(s, dados, x, y, w, h, nome="fixo:captura", borda=BORDA)
        texto(s, cx, cy + ch + 0.02, cw, rot_h - 0.02, rotulo, tam=10, cor_hex=TEXTO,
              negrito=True, alinhamento=PP_ALIGN.CENTER, nome="fixo:legenda-captura")


def desenhar_google(s, dobra, logos):
    """Resultado de busca e cartão de compartilhamento, desenhados com formas."""
    por_id = {t["id"].rsplit("-seo-", 1)[-1]: (i + 1, t) for i, t in enumerate(dobra["textos"])}
    x0, w0 = IMG_X + 0.25, IMG_W - 0.5
    y = IMG_Y + 0.15
    texto(s, x0, y, w0, 0.2, "NO GOOGLE", tam=10, cor_hex=TEXTO, negrito=True, nome="fixo:desenho")
    y += 0.24
    # barra de busca
    retangulo(s, x0, y, w0, 0.34, preenchimento=BRANCO, borda=BORDA,
              forma=MSO_SHAPE.ROUNDED_RECTANGLE, raio=0.5, nome="fixo:desenho")
    texto(s, x0 + 0.2, y, w0 - 0.7, 0.34, "aluguel de carro nova iguaçu", tam=11, cor_hex=TEXTO,
          ancora=MSO_ANCHOR.MIDDLE, nome="fixo:desenho")
    retangulo(s, x0 + w0 - 0.36, y + 0.08, 0.14, 0.14, borda=CINZA, espessura=1.5,
              forma=MSO_SHAPE.OVAL, nome="fixo:desenho")
    linha(s, x0 + w0 - 0.24, y + 0.2, x0 + w0 - 0.17, y + 0.27, CINZA, 1.5)
    y += 0.44
    # resultado
    card_y = y
    tx = x0 + 0.42
    tw = w0 - 0.55
    n1, t1 = por_id.get("title", (1, dobra["textos"][0]))
    n2, t2 = por_id.get("description", (2, dobra["textos"][1]))
    l1 = contar_linhas(t1["texto"], 13, tw - 0.1)
    l2 = contar_linhas(t2["texto"], 11, tw - 0.1)
    h1 = altura_linhas(l1, 13) + 0.08
    h2 = altura_linhas(l2, 11) + 0.08
    card_h = 0.1 + 0.4 + h1 + h2 + 0.08
    retangulo(s, x0, card_y, w0, card_h, preenchimento=BRANCO, borda=BORDA, nome="fixo:desenho")
    fy = card_y + 0.1
    retangulo(s, tx - 0.02, fy + 0.03, 0.3, 0.3, preenchimento=NAVY, forma=MSO_SHAPE.OVAL,
              nome="fixo:desenho")
    if logos[1]:
        dados, lw, lh = logos[1]
        ih = 0.19
        imagem(s, dados, tx - 0.02 + (0.3 - ih * lw / lh) / 2, fy + 0.03 + 0.055, ih * lw / lh, ih,
               nome="fixo:desenho")
    texto(s, tx + 0.38, fy, tw - 0.4, 0.2, "Locafacil", tam=11, cor_hex="202124", nome="fixo:desenho")
    texto(s, tx + 0.38, fy + 0.18, tw - 0.4, 0.2, SITE, tam=10, cor_hex="4D5156", nome="fixo:desenho")
    fy += 0.4
    selo_numero(s, x0 + 0.08, fy + 0.02, n1)
    texto(s, tx, fy, tw, h1, t1["texto"], tam=13, cor_hex="1A0DAB", margem=0.04, nome="fixo:desenho")
    fy += h1
    selo_numero(s, x0 + 0.08, fy + 0.02, n2)
    texto(s, tx, fy, tw, h2, t2["texto"], tam=11, cor_hex="4D5156", margem=0.04, nome="fixo:desenho")
    y = card_y + card_h + 0.16

    # cartão de compartilhamento
    texto(s, x0, y, w0, 0.2, "AO COMPARTILHAR O LINK (WHATSAPP, FACEBOOK)", tam=10, cor_hex=TEXTO,
          negrito=True, nome="fixo:desenho")
    y += 0.24
    n3, t3 = por_id.get("og-title", (3, dobra["textos"][2]))
    n4, t4 = por_id.get("og-description", (4, dobra["textos"][3]))
    quad = 0.95
    tx2 = x0 + quad + 0.45
    tw2 = w0 - quad - 0.55
    l3 = contar_linhas(t3["texto"], 12, tw2 - 0.1, negrito=True)
    l4 = contar_linhas(t4["texto"], 11, tw2 - 0.1)
    h3 = altura_linhas(l3, 12) + 0.1
    h4 = altura_linhas(l4, 11) + 0.1
    card2_h = max(quad, 0.1 + 0.22 + h3 + h4 + 0.08)
    retangulo(s, x0, y, w0, card2_h, preenchimento=BRANCO, borda=BORDA, nome="fixo:desenho")
    retangulo(s, x0, y, quad, card2_h, preenchimento=NAVY, nome="fixo:desenho")
    if logos[0]:
        dados, lw, lh = logos[0]
        iw = quad - 0.2
        imagem(s, dados, x0 + 0.1, y + (card2_h - iw * lh / lw) / 2, iw, iw * lh / lw,
               nome="fixo:desenho")
    fy = y + 0.1
    texto(s, tx2, fy, tw2, 0.2, SITE.replace("https://", ""), tam=10, cor_hex="4D5156",
          margem=0.05, nome="fixo:desenho")
    fy += 0.22
    selo_numero(s, x0 + quad + 0.1, fy + 0.02, n3)
    texto(s, tx2, fy, tw2, h3, t3["texto"], tam=12, cor_hex="111B21", negrito=True, margem=0.05,
          nome="fixo:desenho")
    fy += h3
    selo_numero(s, x0 + quad + 0.1, fy + 0.02, n4)
    texto(s, tx2, fy, tw2, h4, t4["texto"], tam=11, cor_hex="4D5156", margem=0.05,
          nome="fixo:desenho")


def desenhar_whatsapp(s, dobra, itens_lamina, todos, logos):
    """Janela de conversa com as mensagens desta lâmina em balões."""
    x0, w0 = IMG_X + 0.25, IMG_W - 0.5
    y0, h0 = IMG_Y + 0.2, IMG_H - 0.4
    retangulo(s, x0, y0, w0, h0, preenchimento="EFEAE2", borda=BORDA, nome="fixo:desenho")
    retangulo(s, x0, y0, w0, 0.55, preenchimento="008069", nome="fixo:desenho")
    retangulo(s, x0 + 0.15, y0 + 0.1, 0.35, 0.35, preenchimento=NAVY, forma=MSO_SHAPE.OVAL,
              nome="fixo:desenho")
    if logos[1]:
        dados, lw, lh = logos[1]
        ih = 0.22
        imagem(s, dados, x0 + 0.15 + (0.35 - ih * lw / lh) / 2, y0 + 0.1 + (0.35 - ih) / 2,
               ih * lw / lh, ih, nome="fixo:desenho")
    texto(s, x0 + 0.6, y0 + 0.06, w0 - 0.8, 0.24, "Locafacil", tam=12, cor_hex=BRANCO,
          negrito=True, nome="fixo:desenho")
    texto(s, x0 + 0.6, y0 + 0.29, w0 - 0.8, 0.2, "WhatsApp da loja", tam=10, cor_hex="D9F2EC",
          nome="fixo:desenho")
    msgs = [(n, t) for n, t in itens_lamina if t["tipo"] == "mensagem-whatsapp"]
    if not msgs:
        msgs = [(n, t) for n, t in todos if t["tipo"] == "mensagem-whatsapp"][:3]
    bw_max = w0 - 0.9
    y = y0 + 0.75
    limite = y0 + h0 - 0.15
    for n, t in msgs:
        corpo = t["texto"]
        linhas_msg = contar_linhas(corpo, 12, bw_max - 0.24)
        if linhas_msg == 1:
            bw = min(bw_max, largura_pt(corpo, 12) / 72 + 0.3 + 0.5)
        else:
            bw = bw_max
        bh = altura_linhas(linhas_msg, 12) + 0.12 + 0.2
        if y + bh > limite:
            break
        bx = x0 + w0 - 0.2 - bw
        retangulo(s, bx, y, bw, bh, preenchimento="D9FDD3", forma=MSO_SHAPE.ROUNDED_RECTANGLE,
                  raio=0.12, nome="fixo:desenho")
        texto(s, bx + 0.02, y + 0.03, bw - 0.04, bh - 0.22, corpo, tam=12, cor_hex="111B21",
              margem=0.1, nome="fixo:desenho")
        texto(s, bx + bw - 0.9, y + bh - 0.24, 0.8, 0.2, "10:32", tam=10, cor_hex="667781",
              alinhamento=PP_ALIGN.RIGHT, nome="fixo:desenho")
        selo_numero(s, bx - 0.36, y + 0.06, n)
        y += bh + 0.18


def lamina_dobra(prs, deck, idx_dobra, dobra, capturas, logos, avisos):
    """Uma ou mais lâminas (continuação) para a dobra."""
    textos_dobra = dobra["textos"]
    todos = [(i + 1, t) for i, t in enumerate(textos_dobra)]
    linhas = montar_linhas(textos_dobra)
    faixas = particionar([ln["h"] for ln in linhas], AREA_FIM - AREA_TOPO, GAP_LINHAS)

    # capturas desta dobra (desktop e celular, já reduzidas)
    capturas_dobra = {}
    info = capturas.get(dobra["id"]) or {}
    for chave in ("desktop", "celular"):
        arq = caminho_publico(info.get(chave))
        capturas_dobra[chave] = imagem_reduzida(arq) if arq else None
    # "extras" (outros estados da mesma dobra) ficam de fora de propósito: a lâmina
    # mostra só a imagem principal. Para ligar a grade, preencha a lista abaixo com
    # (estado, imagem_reduzida(arq)) de cada extra.
    capturas_dobra["extras"] = []
    if dobra.get("seletor") is not None and not any(capturas_dobra.values()):
        avisos.append(f"sem captura para {dobra['id']}")

    total_partes = len(deck["dobras"])
    lams = []
    for k, (ini, fim) in enumerate(faixas):
        s = lamina_vazia(prs)
        fundo(s, FUNDO)
        cont = " (continuação)" if k > 0 else ""
        titulo = f"Parte {idx_dobra} de {total_partes} · {dobra['titulo']}{cont}"
        itens_lamina = [it for ln in linhas[ini:fim] for it in ln["itens"]]
        sub = f"Página: {dobra['rota']}"
        if len(faixas) > 1:
            sub += (f"   ·   textos {itens_lamina[0][0]} a {itens_lamina[-1][0]} de {len(todos)}"
                    f"   ·   lâmina {k + 1} de {len(faixas)} desta parte")
        cabecalho(s, titulo, sub, logos[0])
        desenhar_referencia(s, dobra, capturas_dobra, logos, itens_lamina, todos)

        # textos
        y = AREA_TOPO
        for ln in linhas[ini:fim]:
            larg = COL_W if len(ln["itens"]) == 1 else MEIA_W
            for j, (n, t) in enumerate(ln["itens"]):
                x = COL_X + j * (MEIA_W + GAP_COLUNAS)
                tipo = TIPOS.get(t["tipo"], t["tipo"].upper())
                runs = [(str(n), {"cor": AZUL, "negrito": True}),
                        (f" · {tipo}", {"cor": CINZA, "negrito": True})]
                if t.get("obs"):
                    runs.append((f"   {t['obs']}", {"cor": TEXTO}))
                texto(s, x, y, larg, ln["h_rot"], [runs], tam=PT_ROTULO, nome=f"fixo:rotulo:{n}")
                caixa_editavel(s, x, y + ln["h_rot"] + GAP_ROTULO, larg, ln["h_box"], t["texto"],
                               f"copy:{t['id']}")
            y += ln["h"] + GAP_LINHAS
        if y - GAP_LINHAS > AREA_FIM + 0.001:
            avisos.append(f"{dobra['id']}: lâmina {k + 1} passou da área ({y:.2f} pol)")

        # rodapé: observações
        texto(s, MARGEM, OBS_TITULO_Y, LARG - 2 * MARGEM, 0.26,
              [[("Observações desta parte", {"negrito": True, "cor": NAVY, "tam": 12}),
                ("   opcional: mudar a ordem, trocar imagem, ideia nova…", {"cor": TEXTO})]],
              tam=10, ancora=MSO_ANCHOR.BOTTOM, nome="fixo:obs-titulo")
        obs = caixa_editavel(s, MARGEM, OBS_Y, LARG - 2 * MARGEM, OBS_H, "", f"obs:{dobra['id']}",
                             tam=12)
        obs.text_frame.auto_size = MSO_AUTO_SIZE.TEXT_TO_FIT_SHAPE

        # notas: uma linha por texto (casa mesmo sem os nomes das formas)
        linhas_notas = [f"{n} | {t['id']} | {t['texto'].replace(chr(10), '⏎')}"
                        for n, t in itens_lamina]
        linhas_notas.append(f"obs | {dobra['id']} | Observações desta parte")
        notas(s, "\n".join(linhas_notas))
        lams.append(s)
    return lams


# ---------------------------------------------------------------------------
# Principal
# ---------------------------------------------------------------------------
def gerar(saida_dir, copiar_entrega=True):
    inventario = json.loads(INVENTARIO.read_text(encoding="utf-8"))
    capturas = carregar_capturas()
    avisos = []
    if not capturas:
        avisos.append("capturas.json não encontrado: lâminas sem imagem")

    with tempfile.TemporaryDirectory(prefix="copy-pptx-") as tmp:
        tmp = Path(tmp)
        logos = []
        for svg, larg in ((LOGO_LOCKUP, 1200), (LOGO_SIMBOLO, 600)):
            png = rasterizar_svg(svg, larg, tmp)
            if png:
                im = Image.open(io.BytesIO(png))
                logos.append((png, im.width, im.height))
            else:
                logos.append(None)
                avisos.append(f"não rasterizei {svg.name} (Chrome não encontrado)")

    resultado = []
    decks = inventario["decks"]
    for deck in decks:
        prs = nova_apresentacao()
        lamina_capa(prs, deck, len(decks), logos)
        lamina_como_editar(prs, logos)
        for i, dobra in enumerate(deck["dobras"], start=1):
            lamina_dobra(prs, deck, i, dobra, capturas, logos, avisos)
        lamina_livre(prs, logos)
        destino = saida_dir / deck["pptx"]
        prs.save(destino)
        resultado.append((destino, len(prs.slides)))
        if copiar_entrega:
            PASTA_ENTREGA.mkdir(parents=True, exist_ok=True)
            shutil.copy2(destino, PASTA_ENTREGA / deck["pptx"])

    for destino, n in resultado:
        print(f"{destino.relative_to(RAIZ) if destino.is_relative_to(RAIZ) else destino}: "
              f"{n} lâminas, {destino.stat().st_size / 1024 / 1024:.2f} MB")
    for a in avisos:
        print("aviso:", a)
    return resultado


def main():
    ap = argparse.ArgumentParser(description="Gera os PPTX de revisão de copy.")
    ap.add_argument("--saida", type=Path, default=PASTA_SAIDA, help="pasta dos .pptx")
    ap.add_argument("--sem-entrega", action="store_true",
                    help=f"não copia para {PASTA_ENTREGA}")
    args = ap.parse_args()
    args.saida.mkdir(parents=True, exist_ok=True)
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")
    gerar(args.saida, copiar_entrega=not args.sem_entrega)


if __name__ == "__main__":
    main()
