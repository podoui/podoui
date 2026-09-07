import { DocSection } from "../components/DocSection.js";
import { PageHeader } from "../components/PageHeader.js";
import { Preview } from "../components/Preview.js";
import { DocsLink } from "../routing.js";

export function McpPage() {
  return (
    <>
      <PageHeader
        title="AI 도구 연결 (MCP)"
        intro="AI가 Podo의 디자인 토큰과 컴포넌트 스펙을 직접 읽고, 프로젝트에 맞는 UI를 만들도록 연결하세요."
      />
      <DocSection
        index={0}
        title="명령어 하나로 시작"
        description="Node.js 22 이상과 npm이 있는 환경에서 실행하세요. 전역 설치 없이 시작할 수 있습니다."
      >
        <Preview
          tabs={[
            { target: "mcp-start", label: "터미널", language: "bash", code: "npx -y podo-ui mcp" },
          ]}
        >
          <p>
            Podo 기본 스펙을 바로 사용할 수 있고, 프로젝트에 .podo가 있으면 로컬 설정도 읽습니다.
          </p>
        </Preview>
        <p>
          이 서버는 AI 도구와 표준 입출력(stdio)으로 통신합니다. 터미널에서 실행하면 출력 없이
          연결을 기다리는 것이 정상입니다. 종료하려면 Ctrl+C를 누르세요. 브라우저로 여는 주소나
          포트는 없습니다.
        </p>
      </DocSection>
      <DocSection
        index={1}
        title="AI 도구에 한 번 등록"
        description="사용하는 도구의 명령을 실행한 뒤 다시 시작하세요. 이후에는 AI 도구가 서버를 자동으로 실행하므로 터미널에 따로 켜 둘 필요가 없습니다."
      >
        <Preview
          tabs={[
            {
              target: "mcp-claude",
              label: "Claude Code",
              language: "bash",
              code: 'claude mcp add podo -- npx -y podo-ui mcp --root "/absolute/path/to/project"',
            },
            {
              target: "mcp-codex",
              label: "Codex",
              language: "bash",
              code: 'codex mcp add podo -- npx -y podo-ui mcp --root "/absolute/path/to/project"',
            },
            {
              target: "mcp-json",
              label: "JSON 설정",
              language: "json",
              code: JSON.stringify(
                {
                  mcpServers: {
                    podo: {
                      command: "npx",
                      args: ["-y", "podo-ui", "mcp", "--root", "/absolute/path/to/project"],
                    },
                  },
                },
                null,
                2
              ),
            },
          ]}
        >
          <p>
            /absolute/path/to/project를 실제 프로젝트의 절대 경로로 바꾸세요. 공백이 포함된 경로는
            명령에서 따옴표로 감싸세요.
          </p>
        </Preview>
        <p>
          JSON 설정은 mcpServers 형식을 지원하는 클라이언트의 MCP 설정에 기존 서버 항목과 함께
          추가하세요. Windows에서 npx를 찾지 못하면 command를 cmd로, args 앞부분을 ["/c", "npx",
          …]로 설정하세요.
        </p>
        <p>
          Claude Code는 현재 프로젝트 범위에, Codex CLI는 사용자 설정에 등록합니다. 다른 프로젝트를
          연결할 때는 서버 이름과 --root 경로를 구분하세요. 연결 후 도구 목록에
          get_system_overview가 표시되는지 확인하세요.
        </p>
        <p>
          <a href="https://developers.openai.com/codex/mcp/">Codex 공식 MCP 안내</a>
        </p>
      </DocSection>
      <DocSection index={2} title="이렇게 요청해 보세요">
        <Preview
          tabs={[
            {
              target: "mcp-prompt",
              label: "프롬프트",
              language: "text",
              code: "Podo MCP로 Button과 Field 스펙을 확인하고 React 로그인 폼을 만들어 줘.\n지원하는 속성과 디자인 토큰을 사용해 줘.",
            },
          ]}
        >
          <p>컴포넌트 이름이나 원하는 화면을 설명하면 AI가 실제 JSON 스펙을 확인할 수 있습니다.</p>
        </Preview>
        <ul>
          <li>get_system_overview: 디자인 시스템 구성 확인</li>
          <li>search_tokens / get_token: 토큰 검색과 값 확인</li>
          <li>
            search_components / get_component_spec / get_component_example: 컴포넌트 검색과 사용
            예제
          </li>
          <li>validate_podo_project / explain_migration: 로컬 설정 검증과 업데이트 상태</li>
          <li>suggest_component_spec: 파일을 쓰지 않고 새 컴포넌트 초안 제안</li>
        </ul>
        <p>
          MCP 도구는 프로젝트 파일을 수정하지 않습니다. 조회 결과는 연결한 AI 도구에 전달됩니다.
          프로젝트 토큰을 직접 관리하려면 <DocsLink to="/setup">설치와 토큰 적용</DocsLink>을 따라
          .podo를 준비하세요.
        </p>
      </DocSection>
      <DocSection index={3} title="연결이 안 될 때">
        <Preview
          tabs={[
            {
              target: "mcp-check",
              label: "실행 경로 확인",
              language: "bash",
              code: 'npx -y podo-ui mcp --root "/absolute/path/to/project" --dry-run',
            },
          ]}
        >
          <p>
            서버를 켜지 않고 읽을 프로젝트 경로를 확인합니다. 실제 연결은 AI 도구의 MCP 상태와 도구
            호출로 확인하세요.
          </p>
        </Preview>
        <p>
          처음 실행할 때는 npm에서 패키지를 내려받으므로 네트워크 연결과 시간이 필요합니다. 연결
          시간이 초과되면 위 명령을 먼저 실행한 뒤 AI 도구에서 다시 연결하세요.
        </p>
        <p>
          로컬 토큰이 보이지 않으면 --root가 .podo를 포함한 프로젝트를 가리키는지 확인하세요.
          .podo가 없으면 기본 스펙을 사용합니다. 설정 오류는 validate_podo_project로 확인하세요.
        </p>
      </DocSection>
    </>
  );
}
