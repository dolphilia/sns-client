# SNS がストレス源になる要因の調査まとめ

作成日: 2026-04-15

> このドキュメントは、「ストレスの原因を極限まで減らした SNS クライアント」を設計するための基礎調査として、SNS 利用がストレスや精神的不健康を引き起こすメカニズムを整理したものである。UI/UX の不満ではなく、心理・行動科学的に本質的な要因に着目した。

---

## 1. 社会的比較と嫉妬（Social Comparison / Envy）

### 概要

Festinger（1954）の社会比較理論によれば、人は自分の意見や能力を他者と比較することで自己評価を行う。SNS は「キュレーションされた自己表現」の場であるため、他者の生活がつねに美化されて流れてくる。これにより**上方比較（upward comparison）**が慢性的に発生する。

### 研究知見

- SNS 上の上方比較は自己評価・自尊感情・生活満足度を低下させる。投稿を見た直後から自己評価への悪影響が生じ、累積的に続く（Tandfonline, 2023）。
- 「能力比較」は**悪性の妬み（malicious envy）**を生み、強いストレス反応・自尊感情の低下・主観的幸福感の低下と結びつく（埼玉学園大学, 論文）。
- 141 件の研究を対象としたメタ分析（2024, Oxford Academic）では、パッシブな閲覧（ただ眺める行為）が最も強く悪影響と関連していた。

### 悪化する構造

SNS のアルゴリズムは**エンゲージメントの高いコンテンツ**（映える投稿・バズった投稿）を優先配信するため、ユーザーは「平均より上に見える」コンテンツを大量に目にし続ける。比較対象が意図せず「最も輝いている人」に固定される。

---

## 2. 承認欲求と「いいね」依存（Validation Seeking）

### 概要

SNS の「いいね」「リプライ」「フォロワー数」といった指標は、脳の**報酬系（ドーパミン系）**を直接刺激する。UCLA の神経科学者の研究では、「いいね」が多くついた写真を見ると、社会的認知・報酬・視覚に関わる脳領域が活性化することが確認されている。

### 研究知見

- 「いいね」通知はギャンブルや薬物依存と同じ**可変報酬スケジュール（variable reward schedule）**で機能する。不規則に報酬が来るため、より強い依存が形成されやすい（diamond.jp, gizmodo.jp）。
- ドーパミンは慣れが生じるため、「いいね」が増えるほど同じ快感を得るために**さらに多くの承認**が必要になる。これは依存の典型的なエスカレーション構造。
- LINEリサーチ（2024）の調査では、Z 世代の約 72% が「SNS 上の評価が自分の気分に影響する」と回答。
- 賞賛獲得欲求の強い人ほど、「いいね」が得られないときの不安が大きい（成城大学研究）。
- 自尊感情を外部の数字に依存させることで、**自己価値が他者の反応によって常に揺さぶられる**状態が生まれる（ResearchGate, 2024）。

---

## 3. FOMO（Fear of Missing Out）

### 概要

FOMO とは「自分だけ取り残されているかもしれない」という不安であり、SNS 上で他者の楽しそうな活動や集まりを目にしたときに強く喚起される。

### 研究知見

- FOMO は、より多くの比較行動を促し、問題的 SNS 使用を誘発する連鎖メカニズムを持つ（PMC, 2024）。
- FOMO が高い人は、抑うつ・不安・神経症傾向が有意に高い（Psychology Today）。
- FOMO は「欠乏感の知覚」→「強迫的な確認行動」という 2 段階プロセスで機能し、SNS への病的なアタッチメントを形成する（PMC, 2021）。
- 睡眠の質低下、生活有能感の低下、感情的緊張などと広く関連する。
- SNS は「他者の生活を理想化して見せる」「24 時間途切れない情報流」という構造上、FOMO を**増幅・持続**させやすい（Frontiers in Psychology, 2025）。

---

## 4. ドゥームスクロール（Doomscrolling）

### 概要

ネガティブなニュースや不快なコンテンツを知りつつもスクロールし続けてしまう行動。人間の**ネガティビティバイアス**（脅威情報に注意が向く進化的適応）が SNS の無限スクロール設計と組み合わさることで生じる。

### 研究知見

- ドゥームスクロールは**実存的不安（existential anxiety）**を高め、人間性についての悲観的見方を強める（ScienceDirect, 2024、イランと米国の横断研究）。
- 抑うつ、不安、ストレス、孤立感、恐怖、生活の質低下と広く関連（Mayo Clinic, PMC）。
- 神経症傾向と正の相関、協調性・外向性・誠実性とは負の相関を持つ（PMC, 2022）。
- **プラットフォームの設計**（無限フィード・アルゴリズム推薦）がこの行動を強化・持続させる構造的要因となっている（University of Florida, 2022）。

---

## 5. サイバーハラスメントと炎上（Cyberbullying / Online Harassment）

### 概要

SNS 上での誹謗中傷・集団攻撃・炎上は、被害者に深刻な精神的ダメージを与える。物理的な場所や時間に縛られず、24 時間逃げ場がないという点で、リアル世界のいじめより影響が大きくなりやすい。

### 研究知見

- サイバーいじめの生涯経験率は 2016 年の 33.6% から 2025 年には 58.2% へと急増（CDC MMWR, 2023）。
- 被害者は抑うつ・不安・社会不安・疲労・筋緊張などの症状を示す（PMC, 2024）。
- サイバーいじめ被害者が自殺念慮・自殺企図に至るリスクは、そうでない人の**4 倍**（iCanNotes, 2024）。
- 日本では年間約 200 件以上の「炎上」が発生（専修大学研究、2023）。コンテンツは検索エンジンにも残存し、「デジタルタトゥー」として被害者を長期間苦しめる。
- 加害者・被害者の双方に精神的悪影響が及ぶことも報告されている。

---

## 6. 情報過多と SNS 疲れ（Information Overload / Social Media Fatigue）

### 概要

SNS は処理できる量をはるかに超えた情報量・コミュニケーション量・社会的期待を押しつけてくる。この**認知的・感情的オーバーロード**が慢性的な疲弊を生む。

### 研究知見

- 情報過多・コミュニケーション過多・社会的過多の 3 種類のオーバーロードが SNS 疲れを引き起こし、中でも**コミュニケーション過多の影響が最も大きい**（Frontiers in Psychology, 2024）。
- SNS 疲れは不安・自己効力感の低下のメディエーターとして機能する（PMC, 2024）。
- 日本のアンケート調査（Tier 調べ, 2023）では、SNS 疲れの最大原因は「**知りたくない情報まで知ってしまう**」（55.5%）。次いで「他人のキラキラ投稿を見て比較してしまう」（39.7%）、「コミュニケーション頻度が増えすぎる」（23.3%）。
- SNS 利用者の半数以上が SNS 疲れを経験しており、約 6 割がデトックスや利用中止を検討（株式会社 Tier, 2023）。
- 女性 20 代で疲れを感じる割合が特に高い（アスマーク調査）。

---

## 7. フィルターバブルとエコーチェンバー（Filter Bubble / Echo Chamber）

### 概要

アルゴリズムによるパーソナライゼーションが、ユーザーの既存の信念・嗜好に合致する情報を優先配信する結果、**偏った情報環境**が形成される。

### 研究知見

- フィルターバブルは反対意見や多様な視点を締め出し、思想的な同質化を促進する（MDPI, 2024）。
- エコーチェンバーは議論をより急進的・極端な方向へ進め、異なる集団間の断絶を深める（Darden/Virginia 大学）。
- 若者は認知・社会・政治的発達の形成期にあるため、アルゴリズム的キュレーションの影響を特に受けやすい。
- 自分と異なる意見を目にする機会の喪失は、無意識のうちに世界観の歪みを生む。誤情報への無防備さも高まる。

---

## 8. パッシブ消費と「接続しているのに孤独」（Passive Use / Connected Loneliness）

### 概要

SNS では大量のコンテンツを眺めるだけの**受動的利用（パッシブ閲覧）**が最も多い使われ方であるが、これが最も精神的健康を損なう使い方でもある。

### 研究知見

- パッシブな閲覧は、社会的接触の**外見を提供しながら実質的な充足をもたらさない**。脳は最初はソーシャルインタラクションとして処理するが、実際の繋がりがないことを認識し、孤独感を高める（SSRN, 2025）。
- 141 件のメタ分析では、パッシブ利用がアクティブ利用よりも精神的健康への悪影響が一貫して強いことが確認されている（Oxford Academic JCMC, 2024）。
- 理化学研究所（2024）の 418 人・21 日間の経験サンプリング研究（日本初の大規模日常調査）では、一対多のブロードキャスト型 SNS 閲覧は**孤独感を増大**させるが、一対一のメッセージ交換は幸福感を増大させることが明らかになった。

### パラソーシャル関係の罠

インフルエンサーとの**疑似的な一方向の親密感（parasocial relationship）**は、本物の対人関係の代替として機能しているように見えるが、孤独の根本的解消にはならず、本物の友人関係が希薄な人ほどリスクが高い（Springer, 2025）。

---

## 9. 常時接続のプレッシャー（Always-on Pressure）

### 概要

スマートフォンと SNS の組み合わせは、「いつでも返信できる状態にあること」「すぐに反応すること」を暗黙の社会的規範として形成してきた。

### 関連するストレス要因

- **既読スルー・未返信への罪悪感** — 相手の反応が見えることが、応答義務を生む。
- **通知による断片化** — 集中の途切れと注意の疲弊が慢性的に生じる。
- **オフラインへの罪悪感** — SNS から離れること自体が不安を引き起こす（FOMO との連動）。
- コミュニケーション過多が SNS 疲れの重要因子であることは情報過多研究とも一致する。

---

## 10. まとめと設計への示唆

| ストレス要因 | 心理メカニズム | 主なトリガー |
|---|---|---|
| 社会的比較・嫉妬 | 上方比較 → 自尊感情の低下 | タイムライン・おすすめ |
| 承認欲求・いいね依存 | 可変報酬 → ドーパミン依存 | いいね数・通知 |
| FOMO | 欠乏感 → 強迫的確認 | 他者の投稿・イベント情報 |
| ドゥームスクロール | ネガティビティバイアス × 無限フィード | アルゴリズム推薦・無限スクロール |
| ハラスメント・炎上 | 被害・観察ともに精神的ダメージ | リプライ・引用・検索 |
| 情報過多・SNS 疲れ | 認知・感情のオーバーロード | 大量の情報・通知・返信義務 |
| フィルターバブル | 偏向 → 歪んだ世界認識 | アルゴリズムによる選別配信 |
| パッシブ消費 | 疑似的接続 → 孤独感の増大 | タイムライン閲覧 |
| パラソーシャル関係 | 一方的な親密感 → 本物の関係を代替できない | インフルエンサー・有名人投稿 |
| 常時接続プレッシャー | 応答義務・通知疲れ | リアルタイム通知・既読表示 |

### 設計上の着眼点（初期メモ）

- **比較を誘発しない情報表示** — いいね数・フォロワー数などの数値の非表示化を検討。
- **アルゴリズムの透明化・制御** — ユーザーが何をどのくらい見るかを自分でコントロールできる仕組み。
- **ネガティブコンテンツのフィルタリング** — 閲覧する内容のトーンや感情価を調整できる機能。
- **一対一コミュニケーションの質を上げる** — 一対多の受動的閲覧より、質の高い双方向交流を促す設計。
- **意図的な断絶をサポートする** — 通知管理、フォーカスモード、使用時間の可視化など。
- **常時接続プレッシャーの低減** — 既読表示・オンライン状態表示の制御。

---

## 参考文献・情報源

### 学術論文・研究機関

- [Limiting social media use decreases depression, anxiety – PsycNET (2024)](https://psycnet.apa.org/record/2024-76138-001)
- [Social media use, stress, and coping – ScienceDirect](https://www.sciencedirect.com/science/article/pii/S2352250X22000070)
- [Effects of Social Media Use on Youth Mental Health: A Scoping Review – PMC (2025)](https://pmc.ncbi.nlm.nih.gov/articles/PMC12108867/)
- [Online Captive: Social Media Addiction, Depression and Anxiety – PMC (2024)](https://pmc.ncbi.nlm.nih.gov/articles/PMC12024447/)
- [Fear of Missing Out: origin and mental health – PMC](https://pmc.ncbi.nlm.nih.gov/articles/PMC8283615/)
- [FOMO, social comparison, and problematic social media use – PMC (2024)](https://pmc.ncbi.nlm.nih.gov/articles/PMC10943642/)
- [FOMO and psychological need satisfaction – SAGE Journals (2025)](https://journals.sagepub.com/doi/10.1177/14614448241235935)
- [Meta-Analysis: Upward Comparison Targets on Self-Evaluations – Tandfonline (2023)](https://www.tandfonline.com/doi/full/10.1080/15213269.2023.2180647)
- [Social comparison on social media and young adults' mental health – PMC (2025)](https://pmc.ncbi.nlm.nih.gov/articles/PMC12370522/)
- [Are active and passive social media use related to mental health? Meta-analysis of 141 studies – Oxford Academic JCMC (2024)](https://academic.oup.com/jcmc/article/29/1/zmad055/7595758)
- [Doomscrolling Scale and psychological distress – PMC (2022)](https://pmc.ncbi.nlm.nih.gov/articles/PMC9580444/)
- [Doomscrolling, existential anxiety, and pessimism – ScienceDirect (2024)](https://www.sciencedirect.com/science/article/pii/S245195882400071X)
- [Cyberbullying and mental health: past, present and future – PMC (2024)](https://pmc.ncbi.nlm.nih.gov/articles/PMC10823540/)
- [Cyberbullying on Social Media: Definitions, Prevalence, and Impact – Oxford Academic (2024)](https://academic.oup.com/cybersecurity/article/10/1/tyae026/7928395)
- [Frequent Social Media Use and Bullying Victimization among High School Students – CDC MMWR (2023)](https://www.cdc.gov/mmwr/volumes/73/su/su7304a3.htm)
- [Social media overload on health self-efficacy and anxiety – PMC (2024)](https://pmc.ncbi.nlm.nih.gov/articles/PMC10757012/)
- [Social media fatigue determinants – Frontiers in Psychology (2024)](https://www.frontiersin.org/journals/psychology/articles/10.3389/fpsyg.2024.1277846/full)
- [Trap of Social Media Algorithms: Filter Bubbles and Echo Chambers – MDPI (2024)](https://www.mdpi.com/2075-4698/15/11/301)
- [The Double-Edged Scroll: Active vs. Passive Social Media Use and Stress – SSRN (2025)](https://papers.ssrn.com/sol3/Delivery.cfm/5141791.pdf?abstractid=5141791&mirid=1)
- [Parasocial relationships, social media, & well-being – PubMed](https://pubmed.ncbi.nlm.nih.gov/35219157/)
- [ソーシャルメディアが精神的健康に与える影響を解明 – 理化学研究所 (2024)](https://www.riken.jp/press/2024/20241220_2/index.html)
- [大学生における SNS 利用実態と精神的健康との関連 – 埼玉学園大学](https://saigaku.repo.nii.ac.jp/record/1565/files/21_sensui-kuwabara.pdf)
- [Instagram の利用と幸福度・社会的比較・承認欲求の影響 – 成城大学](https://www.seijo.ac.jp/education/faeco/academic-journals/jtmo420000001iji-att/235-8arai.pdf)
- [若者のソーシャルメディア利用と精神的健康についての再検討 – 東京都市大学](https://www.comm.tcu.ac.jp/cisj/25/assets/25_5.pdf)
- [思春期のインターネット不適切使用と精神病症状 – 社会健康医学研究センター (2024)](https://www.igakuken.or.jp/topics/2024/0603.html)

### 一般・メディア・調査報告

- ["SNS 疲れ" 最大の原因は「知らなくていいことを知ってしまう」55.5% – Web 担当者 Forum (2023)](https://webtan.impress.co.jp/n/2023/01/18/44114)
- [SNS 利用者の半数以上が人間関係による SNS 疲れを実感 – PR Times / Tier (2023)](https://prtimes.jp/main/html/rd/p/000000003.000100792.html)
- [SNS の「いいね！」は性行為より快感 – 幻冬舎 PLUS / 中野信子](https://www.gentosha.jp/article/11181/)
- [SNS の強烈な快感に支配される現代人 – 東洋経済](https://toyokeizai.net/articles/-/917867)
- [SNS に中毒性？脳のスマホ依存 – 日本経済新聞](https://www.nikkei.com/nstyle-article/DGXZQOUC241ZB0U2A120C2000000/)
- [Doomscrolling and mental health – Mayo Clinic Press](https://mcpress.mayoclinic.org/mental-health/doom-scrolling-and-mental-health/)
- [Do parasocial relationships fill a loneliness gap? – Harvard Health (2024)](https://www.health.harvard.edu/blog/do-parasocial-relationships-fill-a-loneliness-gap-202409303074)
