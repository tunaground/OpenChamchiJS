"use client";

import { useState, useEffect } from "react";
import styled, { ThemeProvider } from "styled-components";
import { parse, prerender, render, RenderContext } from "@/lib/tom";

const theme = {
  calcExpColor: "#888",
  breakpoint: "768px",
  anchorALinkColor: "#0066cc",
};

const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  height: 100vh;
  box-sizing: border-box;
`;

const Title = styled.h1`
  font-size: 1.5rem;
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
  font-size: 1rem;
  margin: 0;
  color: #666;
`;

const TextArea = styled.textarea`
  width: 100%;
  flex: 1;
  min-height: 300px;
  padding: 12px;
  font-family: monospace;
  font-size: 14px;
  border: 1px solid #ccc;
  border-radius: 4px;
  resize: none;
  box-sizing: border-box;

  &:focus {
    outline: none;
    border-color: #0066cc;
  }
`;

const Preview = styled.div`
  flex: 1;
  min-height: 300px;
  padding: 12px;
  border: 1px solid #ccc;
  border-radius: 4px;
  background: #fafafa;
  overflow-wrap: break-word;
  overflow-y: auto;
`;

const TagList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 12px;
  background: #f0f0f0;
  border-radius: 4px;
`;

const Tag = styled.code`
  padding: 4px 8px;
  background: #fff;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;

  &:hover {
    background: #e8f4ff;
    border-color: #0066cc;
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

export default function TomTestPage() {
  const [text, setText] = useState(defaultText);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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
    <ThemeProvider theme={theme}>
      <Container>
        <Title>TOM (Tunaground Object Markup) 테스트</Title>

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
    </ThemeProvider>
  );
}
