# 📊 Painel Semanal

Meu painel de hábitos, metas e tarefas da semana. Feito pra usar no celular, funciona offline e não precisa de login.

**Link:** https://blima-p.github.io/painel-semanal/

- Visão do **dia** (hoje em destaque) e da **semana**
- Treinos fixos, demandas do trabalho, horas de estudo (AWS + Inglês) e hábitos com um toque
- Barras de progresso, gráficos e sequência 🔥 de cada hábito
- Botão **Nova semana**, com histórico e comparação entre semanas
- Backup em JSON (exportar e importar)
- Modo claro e escuro

---

## 📱 Como instalar no celular

### iPhone (Safari)
1. Abra o link no **Safari**. Tem que ser o Safari, o Chrome do iPhone não instala.
2. Toque no botão **Compartilhar** (o quadrado com a setinha pra cima).
3. Role a lista e toque em **Adicionar à Tela de Início**.
4. Toque em **Adicionar**. Vai aparecer o ícone **Painel** na tela inicial.
5. Abra pelo ícone. Ele abre em tela cheia, que nem um app.

### Android (Chrome)
1. Abra o link no **Chrome**.
2. Toque em **Instalar app** quando aparecer o aviso, ou no menu **⋮** → **Instalar app** / **Adicionar à tela inicial**.
3. Confirme. O ícone **Painel** aparece na tela inicial e na lista de apps.

> Depois de abrir uma vez com internet, o painel funciona **offline**.
> Os dados ficam salvos **no próprio celular** e continuam lá depois de fechar o app.

### 💾 O histórico fica salvo?
Sim: todas as semanas ficam guardadas **até você apagar**, sem limite. O app ainda pede ao iOS armazenamento persistente. Só cuidado com três coisas:
- **Use sempre pelo ícone da tela inicial.** No iPhone, o app instalado e a aba do Safari guardam dados **separados**.
- **Apagar o ícone** do app ou **limpar os dados do Safari** (Ajustes → Safari → Limpar Histórico e Dados) apaga tudo.
- Exporte um backup de vez em quando em Editar → Backup → **Exportar JSON** (salve em Arquivos/iCloud). O app avisa quando passar 1 mês sem backup.

### Visual
Ele foi feito pra parecer app de iPhone: título grande, abas embaixo com efeito de vidro, anéis de progresso no estilo do app Fitness (🔵 Trabalho, 🔴 Saúde, 🟣 Estudos, 🟠 Hábitos), listas no estilo Lembretes e chaves de liga/desliga iguais às do iOS. Segue o modo claro/escuro do iPhone, ou você troca no botão do canto superior. No iOS 18+, marcar um item dá uma vibraçãozinha.

Ao marcar algo, a rodinha se completa e desenha o ✓, os % sobem animados e a troca de aba/dia é suave. Quando o dia fecha em 100%, cai confete 🎉. Na aba Semana, as metas ficam recolhidas em **Metas da semana**: toque para abrir. Se o iPhone estiver com "Reduzir movimento" ligado, as animações são desligadas.

---

## ✏️ Como editar (sem mexer em código)

Tudo pelo próprio app, na aba **Editar**:

| O quê | Onde |
|---|---|
| Horário do trabalho, horário de acordar, meta de água, horas de estudo, tema | Editar → **Preferências** |
| Metas da semana (adicionar, editar, remover, ↑↓ reordenar) | Editar → **Metas semanais** |
| Treino padrão de cada dia | Editar → **Atividades fixas** |
| Demandas de cada dia | Editar → **Demandas por dia** ou direto no card **Trabalho** da aba Hoje |
| Compromissos, provas e prazos | Editar → **Compromissos** |
| Ligar/desligar os hábitos extras, criar hábito novo | Editar → **Hábitos** (chave liga/desliga) |
| Treino diferente só num dia | Aba Hoje → card **Saúde** → Editar |
| Backup | Editar → **Backup (JSON)** |

### Nova semana
No domingo à noite ou na segunda, vá em **Semana → Começar nova semana**:
- a semana atual vai pro **Histórico**;
- a próxima começa com os treinos fixos e os hábitos **desmarcados**;
- dá pra escolher quais demandas/metas não concluídas **levar junto**.

---

## 🔁 Rotina de segunda: "atualizar a semana"

Toda segunda, é só pedir pro agente **"atualizar a semana"** e mandar:
1. as demandas do trabalho de cada dia;
2. mudanças nas metas;
3. treinos diferentes do padrão;
4. compromissos, provas ou prazos de estudo.

O agente mexe no objeto `CONFIG` no topo do `index.html` (datas, metas, demandas), aumenta o `configVersion`, publica e manda uma listinha do que mudou.

### Como a atualização chega no celular
- **Automático (GitHub Pages):** abra o app com internet. Se aparecer **"Nova versão disponível → Atualizar agora"**, toque. Senão, é só fechar e abrir de novo.
- O app aplica o CONFIG novo **sem apagar** o histórico, as marcações, nem o que você editou pelo painel (metas que você apagou continuam apagadas).
- **Alternativa:** importe um backup em Editar → Backup → **Importar JSON**.

> ⚠️ O repositório é público. Se não quiser que as demandas do trabalho fiquem visíveis, coloque-as direto no app (card Trabalho), não no `CONFIG`.

---

## 🛠️ Pros curiosos

- `index.html`: o app inteiro (HTML + CSS + JS), sem build e sem dependências. O `CONFIG` fica no topo.
- `sw.js`: service worker (modo offline). Quando publicar mudanças, aumente o `CACHE` (`painel-v3` → `painel-v4`).
- `manifest.json` + ícones: deixam instalar como app.
- Os dados ficam no `localStorage` com a chave `painelSemanal.v1`.
- Pra testar outra data: `?data=2026-11-01` no fim do link.

Rodar localmente:
```bash
python -m http.server 8000
# abre http://localhost:8000
```
