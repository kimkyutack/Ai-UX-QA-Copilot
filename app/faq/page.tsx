import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import styles from "./faq.module.css";

const faqs = [
  {
    category: "시작하기",
    question: "바로 써볼 수 있나요?",
    answer:
      "네. 워크스페이스에서 모델과 URL을 선택하면 바로 첫 리포트를 만들 수 있습니다. 로그인과 결제가 없어도 현재 흐름을 직접 확인할 수 있습니다.",
  },
  {
    category: "비용",
    question: "API 비용은 어떻게 처리되나요?",
    answer:
      "현재는 BYOK 방식이라 사용 중인 모델의 비용을 직접 통제할 수 있습니다. 서비스가 별도로 키를 저장하지 않고, 현재 탭에서만 사용합니다.",
  },
  {
    category: "리포트",
    question: "리포트는 어떤 기준으로 만들어지나요?",
    answer:
      "페이지에서 읽은 헤딩, 버튼, 링크, 본문 텍스트, 스크린샷 근거를 바탕으로 명확성, 행동 유도, 정보 계층, 상태 표현 같은 축으로 정리합니다.",
  },
  {
    category: "비교",
    question: "이전 분석과 비교할 수 있나요?",
    answer:
      "가능합니다. 최근 히스토리를 다시 열어 점수 변화, 새로 생긴 이슈, 사라진 이슈를 비교할 수 있고 팀 메모와 상태도 함께 이어집니다.",
  },
  {
    category: "보안",
    question: "입력한 API key는 저장되나요?",
    answer:
      "아니요. API key는 저장하지 않고 현재 탭에서만 유지됩니다. 분석 요청을 보낼 때만 서버로 전달되고 서비스 데이터에는 남기지 않습니다.",
  },
  {
    category: "공유",
    question: "결과를 다른 사람에게 공유할 수 있나요?",
    answer:
      "네. 저장된 리포트는 공유 페이지로 열 수 있고, 인쇄 또는 PDF 저장 흐름으로도 전달할 수 있습니다.",
  },
];

export default function FaqPage() {
  return (
    <main className={styles.page}>
      <SiteHeader />
      <div className={`shell ${styles.shellWide}`}>
        <section className={styles.faqSection}>
          <div className={styles.sectionHead}>
            <span>Questions</span>
            <h2>자주 묻는 질문</h2>
          </div>

          <div className={styles.faqList}>
            {faqs.map((item, index) => (
              <details
                key={item.question}
                className={styles.faqItem}
                open={index === 0}
              >
                <summary className={styles.faqSummary}>
                  <div className={styles.summaryMeta}>
                    <span className={styles.category}>{item.category}</span>
                    <strong>{item.question}</strong>
                  </div>
                  <span className={styles.summaryIcon} aria-hidden="true">
                    +
                  </span>
                </summary>
                <div className={styles.faqBody}>
                  <p>{item.answer}</p>
                </div>
              </details>
            ))}
          </div>
        </section>

        <section className={styles.ctaBand}>
          <div>
            <span className={styles.eyebrow}>Start</span>
            <h2>답을 읽었다면, 이제 직접 리포트를 만들어볼 차례입니다.</h2>
          </div>
          <Link href="/workspace" className={styles.primaryAction}>
            워크스페이스 열기
          </Link>
        </section>
      </div>
    </main>
  );
}
