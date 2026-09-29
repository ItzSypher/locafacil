#!/usr/bin/env python3
"""
Lê os PPTX de revisão de copy devolvidos pelo cliente e diz o que mudou.

    python scripts/ler-copy-pptx.py devolvido-1.pptx [devolvido-2.pptx ...]
    python scripts/ler-copy-pptx.py *.pptx --inventario src/content/copy/inventario.json
    python scripts/ler-copy-pptx.py x.pptx --imagens pasta/   # salva imagens coladas

Saída (stdout, JSON):
    {
      "textos": { "<id>": { "decisao": "trocar"|"tirar", "antes": "...", "depois": "..." } },
      "dobras": { "<idDaDobra>": { "nota": "..." } },
      "livre":  { "nota": "..." },
      "avisos": [ "..." ]
    }
Só entra o que mudou ("manter" não aparece). A comparação normaliza espaços.

Como cada caixa é encontrada (gerador: scripts/gerar-copy-pptx.py):
  1. pelo nome da forma: copy:<idDoTexto>, obs:<idDaDobra>, livre;
  2. se o nome sumiu (o Canva pode renomear), pelas notas da lâmina
     ("<n> | <idDoTexto> | <texto original>") + o rótulo "<n> · TIPO" que fica logo
     acima de cada caixa: a caixa é a forma de texto imediatamente abaixo do rótulo;
  3. em último caso, pela ordem das formas de texto sem nome conhecido.
"""

import argparse
import json
import re
import sys
from pathlib import Path

from pptx import Presentation
from pptx.enum.shapes import MSO_SHAPE_TYPE

RAIZ = Path(__file__).resolve().parent.parent
INVENTARIO = RAIZ / "src" / "content" / "copy" / "inventario.json"

RE_NOTA = re.compile(r"^\s*(\d+)\s*\|\s*([\w.-]+)\s*\|\s?(.*)$")
RE_NOTA_OBS = re.compile(r"^\s*obs\s*\|\s*([\w.-]+)")
RE_ROTULO = re.compile(r"^\s*(\d+)\s*·")
TITULO_OBS = "Observações desta parte"
EMU_POR_POL = 914400


# ---------------------------------------------------------------------------
# Texto
# ---------------------------------------------------------------------------
def texto_da_forma(shape):
    """Texto com quebras de linha reais (parágrafos e <a:br> viram \\n)."""
    if not shape.has_text_frame:
        return ""
    partes = []
    for par in shape.text_frame.paragraphs:
        # python-pptx devolve <a:br> como \v
        partes.append("".join(r.text for r in par.runs).replace("\v", "\n")
                      if par.runs else par.text.replace("\v", "\n"))
    return "\n".join(partes).strip("\n")


def normalizar(t):
    """Compara ignorando espaços extras e quebras de linha."""
    return " ".join((t or "").split())


def normalizar_linhas(t):
    """Compara preservando quebras de linha, ignorando espaços nas bordas."""
    linhas = [" ".join(l.split()) for l in (t or "").replace("\r", "\n").split("\n")]
    return "\n".join(l for l in linhas if l)


def limpar(t):
    """Texto final: tira espaços nas bordas de cada linha e linhas vazias nas pontas."""
    linhas = [" ".join(l.split()) for l in (t or "").replace("\r", "\n").split("\n")]
    while linhas and not linhas[0]:
        linhas.pop(0)
    while linhas and not linhas[-1]:
        linhas.pop()
    return "\n".join(linhas)


def eh_tirar(t):
    """'TIRAR' sozinho (qualquer caixa, com pontuação) ou começando com TIRAR maiúsculo."""
    so_letras = re.sub(r"[^\wÀ-ÿ]", "", normalizar(t)).upper()
    if so_letras == "TIRAR":
        return True, False
    if re.match(r"^\s*TIRAR\b", t or ""):
        return True, True  # tirar, mas com comentário junto
    return False, False


# ---------------------------------------------------------------------------
# Formas
# ---------------------------------------------------------------------------
def todas_as_formas(shapes, deslocamento=(0, 0)):
    """Achata grupos. Devolve lista de (shape, x, y, w, h) em polegadas."""
    saida = []
    for sh in shapes:
        if sh.shape_type == MSO_SHAPE_TYPE.GROUP:
            saida += todas_as_formas(sh.shapes, deslocamento)
            continue
        try:
            x = (sh.left or 0) / EMU_POR_POL
            y = (sh.top or 0) / EMU_POR_POL
            w = (sh.width or 0) / EMU_POR_POL
            h = (sh.height or 0) / EMU_POR_POL
        except (AttributeError, ValueError):
            x = y = w = h = 0
        saida.append((sh, x, y, w, h))
    return saida


def ler_notas(slide):
    if not slide.has_notes_slide:
        return ""
    tf = slide.notes_slide.notes_text_frame
    return tf.text if tf is not None else ""


def forma_abaixo(ancora, candidatas, usadas):
    """Forma de texto logo abaixo de `ancora` (sobrepõe na horizontal)."""
    _, ax, ay, aw, ah = ancora
    melhor, dist_melhor = None, None
    for c in candidatas:
        sh, x, y, w, h = c
        if id(sh) in usadas or sh is ancora[0]:
            continue
        sobrepoe = min(ax + aw, x + w) - max(ax, x)
        if sobrepoe < min(aw, w) * 0.5:
            continue
        dist = y - (ay + ah)
        if dist < -0.15 or dist > 0.6:
            continue
        if dist_melhor is None or abs(dist) < abs(dist_melhor):
            melhor, dist_melhor = c, dist
    return melhor


# ---------------------------------------------------------------------------
# Leitura
# ---------------------------------------------------------------------------
def ler_pptx(caminho, avisos, pasta_imagens=None):
    """Devolve (caixas, obs, livre):
       caixas: {idTexto: texto atual}; obs: {idDobra: [notas]}; livre: [notas]"""
    prs = Presentation(caminho)
    nome_arq = Path(caminho).name
    caixas, obs, livre = {}, {}, []
    por_posicao = 0

    for num, slide in enumerate(prs.slides, start=1):
        onde = f"{nome_arq}, lâmina {num}"
        notas = ler_notas(slide)
        mapa_n = {}      # n -> idTexto
        dobra_obs = None
        for ln in notas.splitlines():
            m = RE_NOTA.match(ln)
            if m:
                mapa_n[int(m.group(1))] = m.group(2)
                continue
            m = RE_NOTA_OBS.match(ln)
            if m:
                dobra_obs = m.group(1)
        eh_livre = notas.strip() == "livre"

        formas = todas_as_formas(slide.shapes)
        com_texto = [f for f in formas if f[0].has_text_frame]
        usadas = set()
        achados = set()
        tem_nomes = False

        # 1. pelo nome
        for f in com_texto:
            sh = f[0]
            nome = (sh.name or "").strip()
            if nome.startswith("copy:"):
                tem_nomes = True
                id_texto = nome[5:]
                if id_texto in caixas and caixas[id_texto] != texto_da_forma(sh):
                    avisos.append(f"{onde}: caixa {id_texto} aparece mais de uma vez com textos diferentes")
                caixas[id_texto] = texto_da_forma(sh)
                achados.add(id_texto)
                usadas.add(id(sh))
            elif nome.startswith("obs:"):
                tem_nomes = True
                nota = texto_da_forma(sh)
                if nota.strip():
                    obs.setdefault(nome[4:], []).append(nota)
                usadas.add(id(sh))
                dobra_obs = None if nome[4:] == dobra_obs else dobra_obs
            elif nome == "livre":
                tem_nomes = True
                nota = texto_da_forma(sh)
                if nota.strip():
                    livre.append(nota)
                usadas.add(id(sh))
                eh_livre = False
            elif nome.startswith("fixo:"):
                tem_nomes = True
                usadas.add(id(sh))

        # 2. sem nome: rótulo "<n> ·" + forma logo abaixo
        faltando = {n: i for n, i in mapa_n.items() if i not in achados}
        if faltando:
            rotulos = {}
            for f in com_texto:
                if id(f[0]) in usadas:
                    continue
                m = RE_ROTULO.match(texto_da_forma(f[0]))
                if m and int(m.group(1)) in faltando:
                    rotulos[int(m.group(1))] = f
            for f in rotulos.values():
                usadas.add(id(f[0]))
            for n, f_rot in sorted(rotulos.items()):
                alvo = forma_abaixo(f_rot, com_texto, usadas)
                if alvo:
                    id_texto = faltando.pop(n)
                    caixas[id_texto] = texto_da_forma(alvo[0])
                    usadas.add(id(alvo[0]))
                    por_posicao += 1

        # observações sem nome: forma abaixo do título "Observações desta parte"
        if dobra_obs:
            titulo = next((f for f in com_texto if id(f[0]) not in usadas
                           and texto_da_forma(f[0]).startswith(TITULO_OBS)), None)
            if titulo:
                usadas.add(id(titulo[0]))
                alvo = forma_abaixo(titulo, com_texto, usadas)
                if alvo:
                    usadas.add(id(alvo[0]))
                    nota = texto_da_forma(alvo[0])
                    if nota.strip():
                        obs.setdefault(dobra_obs, []).append(nota)

        # 3. último recurso: ordem das formas de texto restantes (lado direito, de cima p/ baixo)
        if faltando:
            restantes = [f for f in com_texto if id(f[0]) not in usadas
                         and not RE_ROTULO.match(texto_da_forma(f[0]))]
            restantes.sort(key=lambda f: (round(f[2], 1), f[1]))
            if len(restantes) >= len(faltando):
                for (n, id_texto), f in zip(sorted(faltando.items()), restantes):
                    caixas[id_texto] = texto_da_forma(f[0])
                    usadas.add(id(f[0]))
                    avisos.append(f"{onde}: caixa {n} ({id_texto}) achada só pela ordem; confira")
                faltando = {}
            for n, id_texto in sorted(faltando.items()):
                avisos.append(f"{onde}: caixa {n} ({id_texto}) não encontrada (apagada?); tratei como manter")

        # espaço livre sem nome: maior forma de texto que sobrou
        if eh_livre:
            restantes = [f for f in com_texto if id(f[0]) not in usadas]
            if restantes:
                maior = max(restantes, key=lambda f: f[3] * f[4])
                usadas.add(id(maior[0]))
                nota = texto_da_forma(maior[0])
                if nota.strip() and not nota.startswith("Escreva qualquer pedido"):
                    livre.append(nota)

        # textos soltos que o cliente criou (só dá para saber quando os nomes vieram)
        if tem_nomes:
            for f in com_texto:
                sh = f[0]
                if id(sh) in usadas:
                    continue
                t = texto_da_forma(sh).strip()
                if t:
                    avisos.append(f"{onde}: texto fora das caixas: {normalizar(t)[:200]!r}")
        # imagens coladas
        for f in formas:
            sh = f[0]
            if sh.shape_type == MSO_SHAPE_TYPE.PICTURE and not (sh.name or "").startswith("fixo:"):
                if not tem_nomes:
                    continue  # sem nomes não dá para separar as imagens nossas das coladas
                desc = f"{onde}: imagem colada ({f[3]:.1f} x {f[4]:.1f} pol)"
                if pasta_imagens:
                    pasta_imagens.mkdir(parents=True, exist_ok=True)
                    img = sh.image
                    arq = pasta_imagens / f"{Path(caminho).stem}-lamina{num}-{sh.shape_id}.{img.ext}"
                    arq.write_bytes(img.blob)
                    desc += f" salva em {arq}"
                avisos.append(desc)
    if por_posicao:
        avisos.append(f"{nome_arq}: {por_posicao} caixas sem o nome original (o editor renomeou as "
                      "formas); achadas pelo rótulo numerado logo acima de cada uma")
    return caixas, obs, livre


def main():
    ap = argparse.ArgumentParser(description="Lê PPTX de revisão de copy devolvidos.")
    ap.add_argument("pptx", nargs="+", type=Path)
    ap.add_argument("--inventario", type=Path, default=INVENTARIO)
    ap.add_argument("--imagens", type=Path, default=None,
                    help="pasta onde salvar imagens coladas pelo cliente")
    args = ap.parse_args()
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")

    inventario = json.loads(args.inventario.read_text(encoding="utf-8"))
    originais = {t["id"]: t["texto"]
                 for deck in inventario["decks"] for dobra in deck["dobras"] for t in dobra["textos"]}
    dobras_validas = {d["id"] for deck in inventario["decks"] for d in deck["dobras"]}

    avisos = []
    textos, dobras, livre_partes = {}, {}, []
    vistos = {}
    for arq in args.pptx:
        caixas, obs, livre = ler_pptx(arq, avisos, args.imagens)
        for id_texto, atual in caixas.items():
            if id_texto not in originais:
                avisos.append(f"{arq.name}: caixa {id_texto} não existe no inventário")
                continue
            if id_texto in vistos and normalizar(vistos[id_texto]) != normalizar(atual):
                avisos.append(f"{id_texto} veio em mais de um arquivo com textos diferentes; ficou o de {arq.name}")
            vistos[id_texto] = atual
            antes = originais[id_texto]
            tirar, com_comentario = eh_tirar(atual)
            if tirar:
                textos[id_texto] = {"decisao": "tirar", "antes": antes, "depois": ""}
                if com_comentario:
                    avisos.append(f"{id_texto}: marcado TIRAR com comentário: {normalizar(atual)!r}")
                continue
            if not atual.strip():
                textos[id_texto] = {"decisao": "tirar", "antes": antes, "depois": ""}
                avisos.append(f"{id_texto}: caixa ficou vazia; tratei como TIRAR, confirme")
                continue
            if normalizar(atual) == normalizar(antes):
                textos.pop(id_texto, None)
                if normalizar_linhas(atual) != normalizar_linhas(antes):
                    avisos.append(f"{id_texto}: só a quebra de linha mudou: {limpar(atual)!r}")
                continue
            depois = limpar(atual)
            textos[id_texto] = {"decisao": "trocar", "antes": antes, "depois": depois}
            # trechos dinâmicos {x} que sumiram ou apareceram
            chaves_antes = set(re.findall(r"\{[^{}]+\}", antes))
            chaves_depois = set(re.findall(r"\{[^{}]+\}", depois))
            if chaves_antes != chaves_depois:
                avisos.append(f"{id_texto}: trechos automáticos mudaram "
                              f"(antes {sorted(chaves_antes)}, depois {sorted(chaves_depois)})")
        for id_dobra, notas in obs.items():
            if id_dobra not in dobras_validas:
                avisos.append(f"{arq.name}: observação de dobra desconhecida {id_dobra}")
            nota = "\n\n".join(limpar(n) for n in notas if n.strip())
            if nota:
                anterior = dobras.get(id_dobra, {}).get("nota")
                dobras[id_dobra] = {"nota": f"{anterior}\n\n{nota}" if anterior else nota}
        for n in livre:
            livre_partes.append((arq.name, limpar(n)))

    if len({a for a, _ in livre_partes}) > 1:
        nota_livre = "\n\n".join(f"[{a}]\n{n}" for a, n in livre_partes)
    else:
        nota_livre = "\n\n".join(n for _, n in livre_partes)

    saida = {
        "textos": textos,
        "dobras": dobras,
        "livre": {"nota": nota_livre} if nota_livre else {},
        "avisos": avisos,
    }
    print(json.dumps(saida, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
