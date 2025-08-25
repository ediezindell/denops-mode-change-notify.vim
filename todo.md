# TODO: denops-mode-change-notify improvements

このファイルは README / doc / 実装(main.ts) を突き合わせて見つかった不一致・不足・改善点をタスク化したものです。各タスクは背景と期待値を明記しています。

## Documentation tasks (ドキュメント修正)

- [x] Replace モード記号の表記ゆれ（`r` vs `R`）を修正する
  - 背景: 実装では `modeNameMap` と autocommand で Replace を `r` として扱っていますが、Vim/Neovim のモード表現では Replace は通常 `R` です。そのため `ModeChanged *:r` が発火しない可能性が高いです。ヘルプでは説明文に `R (Replace)` とある一方、デフォルト値には `r` が含まれています。
  - 期待値: ドキュメント（README と help）を `R` に統一し、デフォルトの `enabled_modes` も `R` を含むように記載します。実装が `R` を扱える（もしくは `r`/`R` 両対応）ことを明記します。
  - 修正対象: README.md, doc/mode-change-notify.txt

- [x] README の「mode initial（頭文字）」表現を「mode name」に修正する
  - 背景: 実装はモードの“頭文字”ではなく、モード名全体（"Normal", "Insert" など）の ASCII アートを表示しています。
  - 期待値: README の説明を「モード名の ASCII アート」に修正し、実装と説明を一致させます。
  - 修正対象: README.md

- [x] border オプションの対応値を完全に列挙し、Vim の制約を明確化する
  - 背景: 実装は Neovim で `none` / `single` / `double` / `rounded` / `solid` / `shadow` を受け付けます。ヘルプの例示は一部に留まっています。Vim はポップアップウィンドウの仕様上、`none` 以外は実質「枠あり」しか区別されません。
  - 期待値: ヘルプと README に全対応値を掲載し、Vim の制約（特定スタイルが区別されない）を明瞭に記述します。
  - 修正対象: README.md, doc/mode-change-notify.txt

- [ ] 設定再読み込み方法（dispatcher `reload`）を記載する 〈保留：dispatcherから削除済みのため仕様再検討〉
  - 背景: 実装に `reload` が用意されていますが、ドキュメントに使用方法の記載がありません。
  - 期待値: 例として `:call denops#request('denops-mode-change-notify', 'reload', [])` を README/ヘルプに追記します。どのような場合（設定変更時など）に使うかも添えます。
  - 修正対象: README.md, doc/mode-change-notify.txt

- [x] Visual のバリアント（Visual-line `V` / Visual-block `<C-v>`）に関する注意書きを追加
  - 背景: デフォルト例では `v` のみが挙げられていますが、Visual-line と Visual-block は別モードとして扱われます。現状の説明では、ユーザーが `V` や `<C-v>` に対して通知が出ないと感じる可能性があります。
  - 期待値: Visual-line/Visual-block も通知したい場合は `enabled_modes` にそれぞれのモードキーを追加する必要がある旨を明記します（実装によっては追加マッピングの必要性も言及）。
  - 修正対象: README.md, doc/mode-change-notify.txt

- [ ] Terminal モードの互換性メモを追加（Vim と Neovim の違い）
  - 背景: `t` は Neovim で自然に使えますが、Vim のターミナル機能や `ModeChanged` の挙動には差異がある可能性があります。Command (`c`) の制約はヘルプにありますが、Terminal についても軽い注意があると親切です。
  - 期待値: README/ヘルプに「Vim と Neovim で挙動が異なる場合がある」旨の注記を追記します。
  - 修正対象: README.md, doc/mode-change-notify.txt

- [ ] 位置計算の挙動（分割時のズレ）に関する注意書きを追加（もしくは実装修正）
  - 背景: 実装は Neovim で `relative: "editor"` を使いながら、位置計算に `winwidth(0)` / `winheight(0)`（現在ウィンドウ基準）を使用しています。分割時にエディタ全体の中心とズレる可能性があります。
  - 期待値: 現仕様の注意点としてドキュメントに明記するか、実装修正予定の記述（後述の implementation task）を追加します。
  - 修正対象: README.md, doc/mode-change-notify.txt

- [ ] 最低サポートバージョン（ModeChanged 対応）を明記する
  - 背景: `ModeChanged` は比較的新しいイベントです。最小要件の明記があるとトラブル時の切り分けに役立ちます。
  - 期待値: Vim と Neovim それぞれの最低バージョン（`ModeChanged` をサポートするバージョン）を調査・明記します（例: Neovim 0.6+ など。正確な値は要確認）。
  - 修正対象: README.md, doc/mode-change-notify.txt

- [x] フォーカス挙動（通知はフォーカスを奪わない）を明記する
  - 背景: 実装では Vim/Neovim とも `focusable: false` に設定しており、通知ウィンドウはフォーカスを奪いません。
  - 期待値: 仕様として README/ヘルプに明記します。
  - 修正対象: README.md, doc/mode-change-notify.txt

- [x] Nerd Fonts 必須の周知を README にも明記する
  - 背景: `ascii_filled` は Nerd Fonts 前提で、ヘルプには記載がありますが README の冒頭機能説明では触れていません。
  - 期待値: README のスタイル説明に「`ascii_filled` は Nerd Fonts が必要」と明記します。
  - 修正対象: README.md

- [x] Command モード（`c`）の制約を README にも明記する
  - 背景: ヘルプには Vim で `ModeChanged` のタイミング上の制約が記載されていますが、README には注意書きがありません。
  - 期待値: README にも同様の注意を追記します。
  - 修正対象: README.md

- [ ] サンプル設定を拡充（特定モードのみ、Visual/Replace を含む例 など）
  - 背景: 現在の README の例は基本形です。ユースケース別の例があると導入と検証が簡単になります。
  - 期待値: Lua/Vimscript の両方で、(1) 特定モードのみ通知、(2) Visual-line/Visual-block を含める、(3) reload の呼び出し例、(4) 位置・枠線の組合せ例 を追記します。
  - 修正対象: README.md

- [ ] 手動テスト手順チェックリストの追加
  - 背景: 変更後の動作確認を効率化するため、モード別・Vim/Neovim 別の簡易チェックリストがあると便利です。
  - 期待値: 各モード（n/i/v/V/<C-v>/c/t/R）での表示、位置、枠線、timeout、フォーカス非奪取、Nerd Fonts の有無などを確認する手順を README か別ドキュメントに追加します。
  - 修正対象: README.md（または新規ドキュメント）

- [ ] 日本語ドキュメントの追加
  - 背景: 日本語ユーザー向けに README/ヘルプの日本語版があると利用率が上がります。
  - 期待値: README_JA.md または doc/mode-change-notify.ja.txt を追加し、主要事項（要件、設定、制限、FAQ）を翻訳して掲載します。
  - 修正対象: 新規ファイル（README_JA.md など）

## Implementation tasks (実装修正)

- [x] Replace モードの検出キーをカテゴリ `r` に統一し、`R`/`Rv` をカテゴリ化で包括
  - 背景: 現状 `modeNameMap` は `r: "Replace"`。多くの環境で Replace は `R` で表現されます。
  - 期待値: `modeNameMap` と autocommand 登録を `R`（または両対応）に調整し、ドキュメント記載と実動作を一致させます。テストで発火を確認します。
  - 修正対象: denops/denops-mode-change-notify/main.ts

- [x] Visual-line (`V`) と Visual-block（`<C-v>`）を Visual と同等に扱えるようにする（カテゴリ `v` で包括）
  - 背景: 現状のマッピングは `v` のみ。`V` と `<C-v>` を同じ "Visual" 表示にしたいニーズが高いと考えられます。
  - 期待値: `modeNameMap` に `V` と Visual-block のキー（`^V` 相当）を追加し、ASCII/テキスト表示は既存の "Visual" を再利用します。デフォルトの `enabled_modes` に含めるかは検討の上で決定します（少なくともドキュメントで案内）。
  - 修正対象: denops/denops-mode-change-notify/main.ts

- [ ] 位置計算をエディタ全体基準に揃える（Neovim/Vim）
  - 背景: 現実装は `relative: "editor"` に対し `winwidth(0)/winheight(0)` を使用しており、分割時にズレます。
  - 期待値: Neovim では UI サイズ（例: `nvim_list_uis()` の width/height もしくは `&columns`/`&lines`）を用いて計算し、Vim では `&columns`/`&lines` を参照するように変更します。これにより分割時も正確に中心・端が揃います。
  - 修正対象: denops/denops-mode-change-notify/main.ts

- [ ] Nerd Fonts 未導入時のフォールバック/警告（任意）
  - 背景: `ascii_filled` は Nerd Fonts 必須で、未導入だとレイアウトが崩れます。
  - 期待値: `style == 'ascii_filled'` 選択時に、簡易なフォント要件チェックや README 参照メッセージをログ出力する等の配慮を検討します（必須ではない）。
  - 修正対象: denops/denops-mode-change-notify/main.ts（任意）

---

実施順の提案（短時間で効果が高い順）
1. Replace の `R` 問題（ドキュメントとコードの同期）
2. reload の記載追加、README の表現修正（mode name）
3. border 値の整理と Vim の制約明記、Nerd Fonts の README 追記
4. Visual バリアントの注意書き（＋可能なら実装対応）
5. 位置計算の注意書き → 実装修正
6. 最低サポートバージョンの調査と明記
7. 手動テスト手順の追加、Command/Terminal の制約明記
8. 日本語ドキュメントの追加

以上です。各タスクの優先度や進め方を調整しながら進行できます。