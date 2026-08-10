import contributors from "../data/contributors.json" with { type: "json" };
import logoUrl from "../assets/logo.svg";
import { DocsLink } from "../routing.js";

const FEATURES = [
  {
    number: "01",
    title: "JSON이 기준이 됩니다",
    description:
      "토큰, 컴포넌트, 아이콘과 테마를 검증된 JSON으로 정의합니다. 디자인 시스템의 원본과 생성 결과가 어긋나지 않습니다.",
  },
  {
    number: "02",
    title: "모든 제품에 같은 규칙을",
    description:
      "React와 Next.js, Hono, React Native까지 하나의 스펙에서 각 환경에 맞는 코드를 만듭니다.",
  },
  {
    number: "03",
    title: "Figma에서 코드까지 연결",
    description:
      "Figma 플러그인과 CLI로 디자인을 프로젝트의 .podo 스펙으로 가져오고, 변경 계획을 확인한 뒤 안전하게 반영합니다.",
  },
] as const;

const TARGETS = ["React", "Next.js", "Hono", "React Native", "Figma"];

export function HomePage() {
  return (
    <div className="home">
      <section className="home-hero" aria-labelledby="home-title">
        <div className="home-hero__copy">
          <p className="home-eyebrow">PODO UI · VERSION 2</p>
          <h1 id="home-title">
            디자인과 코드를
            <br />
            <span>하나의 스펙으로.</span>
          </h1>
          <p className="home-hero__description">
            Figma에서 시작한 디자인 언어를 검증된 JSON으로 관리하고,
            <br className="home-desktop-break" /> 모든 제품에서 같은 경험으로 구현하세요.
          </p>
          <div className="home-actions">
            <DocsLink className="home-button home-button--primary" to="/setup">
              시작하기
              <ArrowIcon />
            </DocsLink>
            <a
              className="home-button home-button--secondary"
              href="https://github.com/podoui/podoui"
              target="_blank"
              rel="noreferrer"
            >
              GitHub
            </a>
          </div>
          <ul className="home-targets" aria-label="지원 환경">
            {TARGETS.map((target) => (
              <li key={target}>{target}</li>
            ))}
          </ul>
        </div>

        <div className="home-hero__visual" aria-label="JSON 스펙에서 여러 플랫폼으로 생성되는 흐름">
          <div className="spec-window">
            <div className="spec-window__bar">
              <span />
              <span />
              <span />
              <strong>button.component.json</strong>
            </div>
            <pre aria-hidden="true">
              <code>
                <span className="code-purple">{"{"}</span>
                {"\n  "}
                <span className="code-blue">&quot;name&quot;</span>:{" "}
                <span className="code-green">&quot;Button&quot;</span>,{"\n  "}
                <span className="code-blue">&quot;themes&quot;</span>: [{"\n    "}
                <span className="code-green">&quot;solid-primary&quot;</span>,{"\n    "}
                <span className="code-green">&quot;outline-primary&quot;</span>
                {"\n  "}],
                {"\n  "}
                <span className="code-blue">&quot;targets&quot;</span>: [{"\n    "}
                <span className="code-green">&quot;react&quot;</span>,{" "}
                <span className="code-green">&quot;hono&quot;</span>,{" "}
                <span className="code-green">&quot;native&quot;</span>
                {"\n  ]\n"}
                <span className="code-purple">{"}"}</span>
              </code>
            </pre>
          </div>
          <div className="output-card output-card--react">
            <span className="output-card__mark">R</span>
            <span>
              <strong>React</strong>Typed component
            </span>
          </div>
          <div className="output-card output-card--native">
            <span className="output-card__mark">N</span>
            <span>
              <strong>Native</strong>Platform renderer
            </span>
          </div>
          <div className="output-card output-card--figma">
            <span className="output-card__mark">F</span>
            <span>
              <strong>Figma</strong>Design source
            </span>
          </div>
        </div>
      </section>

      <section className="home-section home-section--features" aria-labelledby="features-title">
        <div className="home-section__heading">
          <p className="home-eyebrow">WHY PODO</p>
          <h2 id="features-title">한 번 정의하고, 어디서든 같은 경험을 만듭니다.</h2>
          <p>
            v1의 가볍고 유연한 철학은 그대로 두고, v2는 디자인과 구현 사이의 연결을 더 단단하게
            만들었습니다.
          </p>
        </div>
        <div className="feature-grid">
          {FEATURES.map((feature) => (
            <article className="feature-card" key={feature.number}>
              <span className="feature-card__number">{feature.number}</span>
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="home-workflow" aria-labelledby="workflow-title">
        <div className="home-workflow__copy">
          <p className="home-eyebrow">ONE SOURCE, EVERY TARGET</p>
          <h2 id="workflow-title">디자인 시스템이 팀의 공용어가 됩니다.</h2>
          <p>
            변경을 추측하지 마세요. 스펙을 검증하고, 생성될 diff를 확인한 다음, 필요한 모든 런타임에
            같은 결정을 전달합니다.
          </p>
          <DocsLink to="/button">
            실제 컴포넌트 보기 <ArrowIcon />
          </DocsLink>
        </div>
        <ol className="workflow-steps">
          <li>
            <span>01</span>
            <div>
              <strong>Design</strong>
              <small>Figma variables &amp; components</small>
            </div>
          </li>
          <li>
            <span>02</span>
            <div>
              <strong>Validate</strong>
              <small>JSON schema &amp; dry-run diff</small>
            </div>
          </li>
          <li>
            <span>03</span>
            <div>
              <strong>Build</strong>
              <small>Web, server and native outputs</small>
            </div>
          </li>
        </ol>
      </section>

      <section className="home-cta" aria-labelledby="cta-title">
        <img src={logoUrl} alt="" />
        <div>
          <p className="home-eyebrow">OPEN SOURCE</p>
          <h2 id="cta-title">Podo UI로 다음 제품을 시작해 보세요.</h2>
          <p>
            설치부터 Figma 가져오기, 각 플랫폼별 컴포넌트 사용법까지 문서에서 확인할 수 있습니다.
          </p>
        </div>
        <DocsLink className="home-button home-button--light" to="/setup">
          문서 열기 <ArrowIcon />
        </DocsLink>
      </section>

      <section className="contributors" aria-labelledby="contributors-title">
        <div className="home-section__heading">
          <p className="home-eyebrow">CONTRIBUTORS</p>
          <h2 id="contributors-title">함께 만든 사람들</h2>
          <p>디자인과 개발의 경계를 넘나들며 Podo UI를 만들고 있습니다.</p>
        </div>
        <ul className="contributor-grid">
          {contributors.map((contributor) => (
            <li key={contributor.email}>
              <span className="contributor-card__avatar" aria-hidden="true">
                {contributor.name.slice(0, 1)}
              </span>
              <div>
                <strong>{contributor.name}</strong>
                <span>{contributor.roleKo}</span>
                <a href={`mailto:${contributor.email}`}>{contributor.email}</a>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <footer className="home-footer">
        <img src={logoUrl} alt="PODO.UI" />
        <p>Open source under the MIT License.</p>
        <p>© 2023–2026 Podo UI contributors.</p>
      </footer>
    </div>
  );
}

function ArrowIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path
        d="M3.75 9h10.5M10 4.75 14.25 9 10 13.25"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
