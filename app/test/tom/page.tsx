"use client";

import {useState, useSyncExternalStore} from "react";
import styled from "styled-components";
import {parse, prerender, render, RenderContext} from "@/lib/tom";
import {useThemeStore} from "@/lib/store/theme";

const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  height: 100vh;
  box-sizing: border-box;
  background: ${(props) => props.theme.background};
  color: ${(props) => props.theme.textPrimary};
  transition: background 0.3s, color 0.3s;
`;

const Title = styled.h1`
  font-size: 2.4rem;
  margin: 0;
`;

const EditorContainer = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  flex: 1;
  min-height: 0;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const Panel = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-height: 0;
`;

const PanelTitle = styled.h2`
  font-size: 1.6rem;
  margin: 0;
  color: ${(props) => props.theme.textSecondary};
`;

const TextArea = styled.textarea`
  width: 100%;
  flex: 1;
  min-height: 300px;
  padding: 12px;
  font-family: monospace;
  font-size: 14px;
  border: 1px solid ${(props) => props.theme.surfaceBorder};
  border-radius: 4px;
  resize: none;
  box-sizing: border-box;
  background: ${(props) => props.theme.surface};
  color: ${(props) => props.theme.textPrimary};

  &:focus {
    outline: none;
    border-color: ${(props) => props.theme.primary};
  }
`;

const Preview = styled.div`
  flex: 1;
  min-height: 300px;
  padding: 12px;
  border: 1px solid ${(props) => props.theme.surfaceBorder};
  border-radius: 4px;
  background: ${(props) => props.theme.surface};
  overflow-wrap: break-word;
  overflow-y: auto;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const ThemeToggle = styled.button`
  padding: 8px 16px;
  border: 1px solid ${(props) => props.theme.surfaceBorder};
  border-radius: 4px;
  background: ${(props) => props.theme.surface};
  color: ${(props) => props.theme.textPrimary};
  cursor: pointer;
  font-size: 14px;

  &:hover {
    background: ${(props) => props.theme.surfaceHover};
  }
`;

const TagList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 12px;
  background: ${(props) => props.theme.surfaceHover};
  border-radius: 4px;
`;

const Tag = styled.code`
  padding: 4px 8px;
  background: ${(props) => props.theme.surface};
  border: 1px solid ${(props) => props.theme.surfaceBorder};
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;

  &:hover {
    background: ${(props) => props.theme.primary}22;
    border-color: ${(props) => props.theme.primary};
  }
`;

const examples: Record<string, string> = {
  "[bld]": "[bld]굵은 글씨[/bld]",
  "[itl]": "[itl]기울임[/itl]",
  "[clr]": "[clr red]빨간색[/clr]",
  "[clr shadow]": "[clr cyan blue]그림자 효과[/clr]",
  "[spo]": "[spo]스포일러 (드래그해서 보기)[/spo]",
  "[ruby]": "[ruby ふりがな]振り仮名[/ruby]",
  "[sub]": "H[sub]2[/sub]O",
  "[hr]": "위\n[hr]\n아래",
  "[aa]": "[aa]  ∧＿∧\n（｡･ω･｡)\nつ🍵と[/aa]",
  "[youtube]": "[youtube https://www.youtube.com/watch?v=dQw4w9WgXcQ]",
  "[dice]": "[dice 1 20]",
  "[calc]": "[calc (+ 10 20 30)]",
  "[calcn]": "[calcn (1+2)*3]",
  "nested": "[bld][clr blue]굵은 파란색[/clr][/bld]",
};

const defaultText = `[bld]TOM 마크업 테스트[/bld]

일반 텍스트와 [itl]기울임[/itl], [bld]굵게[/bld]를 섞어서 쓸 수 있습니다.

[clr red]빨간색[/clr] [clr green]초록색[/clr] [clr blue]파란색[/clr]

[spo]스포일러는 드래그해서 볼 수 있어요[/spo]

[ruby きょう]今日[/ruby]は[ruby いい]良い[/ruby][ruby てんき]天気[/ruby]です

주사위: [dice 1 6]
계산: [calc (+ 1 2 3)][/calc] = 6
수식: [calcn 2*3+4][/calcn] = 10

[hr]

[aa]
　　∧＿∧
　（｡･ω･｡)つ━☆・*。
　⊂　　 ノ 　　　・゜+.
　 しーＪ　　　°。+ *´¨)
[/aa]`;

const emptySubscribe = () => () => {};

function TomDemo() {
  const [text, setText] = useState(defaultText);
  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
  const { mode, toggleMode } = useThemeStore();

  const ctx: RenderContext = {
    boardId: "test",
    threadId: 1,
    setAnchorInfo: () => {},
    t: ((key: string) => key) as RenderContext["t"],
    onCopy: (copied) => {
      alert(`Copied: ${copied}`);
    },
  };

  let rendered;
  if (!mounted) {
    rendered = null;
  } else {
    try {
      const ast = parse(text);
      const prerendered = prerender(ast);
      rendered = render(prerendered, ctx);
    } catch (e) {
      rendered = <span style={{ color: "red" }}>Parse error: {String(e)}</span>;
    }
  }

  const insertExample = (example: string) => {
    setText((prev) => prev + "\n" + example);
  };

  return (
    <Container>
      <Header>
        <Title>TOM (Tunaground Object Markup) 테스트</Title>
        <ThemeToggle onClick={toggleMode}>
          {mode === "light" ? "🌙 Dark" : "☀️ Light"}
        </ThemeToggle>
      </Header>

      <TagList>
        {Object.entries(examples).map(([label, example]) => (
          <Tag key={label} onClick={() => insertExample(example)}>
            {label}
          </Tag>
        ))}
      </TagList>

      <EditorContainer>
        <Panel>
          <PanelTitle>입력</PanelTitle>
          <TextArea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="TOM 마크업을 입력하세요..."
          />
        </Panel>

        <Panel>
          <PanelTitle>미리보기</PanelTitle>
          <Preview>{rendered}</Preview>
        </Panel>
      </EditorContainer>
    </Container>
  );
}

export default function TomTestPage() {
  return <TomDemo />;
}
